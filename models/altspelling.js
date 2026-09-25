// models/altspelling.js
import { pool } from "../config/db.js";

/**
 * Apply an AltSpelling selection:
 * - Read staging row by (runId, hl_positie)
 * - Upsert into song_spelling (hl_titel_song, hl_artiest) -> fd_tag_title
 *   IMPORTANT: hl_artiest comes from staging.hl_artiest (trimmed)
 * - Update staging_hitlijsten.fd_tag_title
 */
export async function applyAltSpellingForRow({ runId, hl_positie, fd_tag_title }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock staging row
    const st = await client.query(
      `
      SELECT hl_titel_song, hl_artiest
      FROM public.staging_hitlijsten
      WHERE hl_import_run_id = $1
        AND hl_positie = $2
      FOR UPDATE
      `,
      [runId, hl_positie]
    );

    if (st.rowCount === 0) {
      const err = new Error("Staging row not found for runId + hl_positie");
      err.status = 404;
      throw err;
    }

    const hl_titel_song = String(st.rows[0].hl_titel_song || "").trim();
    const hl_artiest = String(st.rows[0].hl_artiest || "").trim();

    if (!hl_titel_song || !hl_artiest) {
      const err = new Error("Cannot apply AltSpelling because hl_titel_song or hl_artiest is empty.");
      err.status = 400;
      throw err;
    }

    // Upsert into song_spelling (unique on hl_titel_song + hl_artiest)
    const ss = await client.query(
      `
      INSERT INTO public.song_spelling (hl_titel_song, hl_artiest, fd_tag_title)
      VALUES ($1, $2, $3)
      ON CONFLICT (hl_titel_song, hl_artiest)
      DO UPDATE SET fd_tag_title = EXCLUDED.fd_tag_title
      RETURNING song_spelling_key, hl_titel_song, hl_artiest, fd_tag_title
      `,
      [hl_titel_song, hl_artiest, fd_tag_title]
    );

    // Update staging fd_tag_title + clear hl_find_cmd because we now have a mapping
    await client.query(
      `
      UPDATE public.staging_hitlijsten
      SET fd_tag_title = $1,
          hl_find_cmd = NULL
      WHERE hl_import_run_id = $2
        AND hl_positie = $3
      `,
      [fd_tag_title, runId, hl_positie]
    );

    await client.query("COMMIT");

    return {
      songSpellingRow: ss.rows[0],
      staging: { hl_positie, fd_tag_title }
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
