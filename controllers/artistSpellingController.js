// controllers/artistSpellingController.js
import { pool } from "../config/db.js";

export async function applyArtistSpellingForRun(runId) {
  const client = await pool.connect();

  const stats = {
    runId,
    distinctArtists: 0,
    foundInSpelling: 0,
    insertedArtists: 0,
    insertedSpellings: 0,
    updatedSpellings: 0, // conflict -> update uitgevoerd (Variant B gedrag)
    updatedStagingRows: 0,
    missingArtistKeyInSpelling: 0,
    missingArtistRowForKey: 0
  };

  try {
    await client.query("BEGIN");

    // Distinct artists in this run (trimmed)
    const distinct = await client.query(
      `
      SELECT DISTINCT BTRIM(hl_artiest) AS hl_artiest
      FROM public.staging_hitlijsten
      WHERE hl_import_run_id = $1
        AND hl_artiest IS NOT NULL
        AND BTRIM(hl_artiest) <> ''
      ORDER BY 1
      `,
      [runId]
    );

    stats.distinctArtists = distinct.rows.length;

    for (const r of distinct.rows) {
      const artistInput = String(r.hl_artiest).trim();

      // 1) Try spelling lookup (CITEXT -> case-insensitive)
      const sp = await client.query(
        `
        SELECT as_artist_key
        FROM public.artiesten_spelling
        WHERE as_alternatieve_spelling = $1
        LIMIT 1
        `,
        [artistInput]
      );

      if (sp.rows.length > 0) {
        const artistKey = sp.rows[0].as_artist_key;

        if (!artistKey) {
          stats.missingArtistKeyInSpelling++;
          continue;
        }

        const ar = await client.query(
          `
          SELECT ar_artist_name
          FROM public.artist
          WHERE ar_artist_key = $1
            AND ar_is_deleted = false
          LIMIT 1
          `,
          [artistKey]
        );

        if (ar.rows.length === 0) {
          stats.missingArtistRowForKey++;
          continue;
        }

        const correctName = ar.rows[0].ar_artist_name;

        const upd = await client.query(
          `
          UPDATE public.staging_hitlijsten
          SET
            as_correcte_artiest_spelling = $1,
            hl_artist_key = $2
          WHERE hl_import_run_id = $3
            AND hl_artiest IS NOT NULL
            AND BTRIM(hl_artiest) = $4
          `,
          [correctName, artistKey, runId, artistInput]
        );

        stats.foundInSpelling++;
        stats.updatedStagingRows += upd.rowCount;
        continue;
      }

      // 2) Not found: ensure artist exists (upsert by unique constraint)
      // Use ON CONSTRAINT to be explicit and robust.
      const insArtist = await client.query(
        `
        INSERT INTO public.artist (ar_artist_name)
        VALUES ($1)
        ON CONFLICT ON CONSTRAINT artist_ar_artist_name_key
        DO UPDATE
          SET ar_updated_at = now(),
              ar_is_deleted = false,
              ar_deleted_at = NULL
        RETURNING
          ar_artist_key,
          ar_artist_name,
          (xmax = 0) AS inserted
        `,
        [artistInput]
      );

      const artistKey = insArtist.rows[0].ar_artist_key;
      const correctName = insArtist.rows[0].ar_artist_name;

      if (insArtist.rows[0].inserted) stats.insertedArtists++;

      // 3) Ensure spelling row exists (single statement, concurrency-safe)
      // Variant B behaviour: if spelling exists, remap to this artistKey.
      const upSpelling = await client.query(
        `
        INSERT INTO public.artiesten_spelling (as_alternatieve_spelling, as_artist_key)
        VALUES ($1, $2)
        ON CONFLICT ON CONSTRAINT artiesten_spelling_alt_unique
        DO UPDATE SET as_artist_key = EXCLUDED.as_artist_key
        RETURNING (xmax = 0) AS inserted
        `,
        [artistInput, artistKey]
      );

      if (upSpelling.rows[0]?.inserted) stats.insertedSpellings++;
      else stats.updatedSpellings++;

      // 4) Update staging for this artist in the run (trim-safe)
      const upd = await client.query(
        `
        UPDATE public.staging_hitlijsten
        SET
          as_correcte_artiest_spelling = $1,
          hl_artist_key = $2
        WHERE hl_import_run_id = $3
          AND hl_artiest IS NOT NULL
          AND BTRIM(hl_artiest) = $4
        `,
        [correctName, artistKey, runId, artistInput]
      );

      stats.updatedStagingRows += upd.rowCount;
    }

    await client.query("COMMIT");
    return stats;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}