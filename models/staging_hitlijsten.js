// models/staging_hitlijsten.js
import { pool } from "../config/db.js";
import { decodeHtmlEntities } from "../utils/textFixes.js";

/**
 * Normalize a string for DB storage:
 * - trim
 * - empty => null
 */
function normStr(v) {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

function normInt(v, fieldName) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n)) throw new Error(`${fieldName} must be an integer or null`);
  return n;
}

export async function decodeHtmlEntitiesForRun(runId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const r = await client.query(
      `
      SELECT hl_positie, hl_artiest, hl_titel_song
      FROM public.staging_hitlijsten
      WHERE hl_import_run_id = $1
      ORDER BY hl_positie
      `,
      [runId]
    );

    let updated = 0;

    for (const row of r.rows) {
      const newArtist = decodeHtmlEntities(row.hl_artiest ?? "");
      const newTitle = decodeHtmlEntities(row.hl_titel_song ?? "");

      if (newArtist !== (row.hl_artiest ?? "") || newTitle !== (row.hl_titel_song ?? "")) {
        await client.query(
          `
          UPDATE public.staging_hitlijsten
          SET hl_artiest = NULLIF(btrim($1), '')::citext,
              hl_titel_song = NULLIF(btrim($2), '')::citext
          WHERE hl_import_run_id = $3
            AND hl_positie = $4
          `,
          [newArtist, newTitle, runId, row.hl_positie]
        );
        updated++;
      }
    }

    await client.query("COMMIT");
    return { updatedRows: updated };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

function stagingInsertSql() {
  return `
    INSERT INTO public.staging_hitlijsten (
      hl_hitlijst,
      hl_uitzendjaar,
      hl_titel_song,
      hl_artiest,
      hl_positie,
      hl_jaar,
      fd_tag_title,
      as_correcte_artiest_spelling,
      hl_discogs_link,
      hl_find_cmd,
      fd_file_name,
      fd_action,
      hl_artist_key,
      omroep_key,
      periode_key,
      hl_import_run_id
    )
    VALUES (
      NULLIF(btrim($1), '')::citext,
      $2,
      NULLIF(btrim($3), '')::citext,
      NULLIF(btrim($4), '')::citext,
      $5,
      $6,
      NULLIF(btrim($7), '')::citext,
      NULLIF(btrim($8), ''),
      NULLIF(btrim($9), ''),
      NULLIF(btrim($10), ''),
      NULLIF(btrim($11), ''),
      NULLIF(btrim($12), ''),
      $13,
      $14,
      $15,
      $16
    )
  `;
}

function stagingInsertValues(row) {
  return [
    normStr(row.hl_hitlijst),
    row.hl_uitzendjaar ?? null,
    normStr(row.hl_titel_song),
    normStr(row.hl_artiest),
    row.hl_positie ?? null,
    row.hl_jaar ?? null,
    normStr(row.fd_tag_title),
    normStr(row.as_correcte_artiest_spelling),
    normStr(row.hl_discogs_link),
    normStr(row.hl_find_cmd),
    normStr(row.fd_file_name),
    normStr(row.fd_action),
    row.hl_artist_key ?? null,
    row.omroep_key ?? null,
    row.periode_key ?? null,
    row.hl_import_run_id ?? null
  ];
}

export async function insertStagingRow(row) {
  await pool.query(stagingInsertSql(), stagingInsertValues(row));
}

export async function insertStagingRowTx(client, row) {
  await client.query(stagingInsertSql(), stagingInsertValues(row));
}

export async function countRowsByRunIdTx(client, runId) {
  const r = await client.query(
    `SELECT COUNT(*)::int AS cnt FROM public.staging_hitlijsten WHERE hl_import_run_id = $1`,
    [runId]
  );
  return r.rows[0]?.cnt ?? 0;
}

export async function findByRunId(runId) {
  const r = await pool.query(
    `
    SELECT
      s.*,
      dst.st_song_type AS desired_song_type,
      dst.st_song_type_desc AS desired_song_type_desc,
      COALESCE(NULLIF(btrim(dst.st_song_type_desc::text), ''), NULLIF(btrim(dst.st_song_type::text), ''), dst.st_song_type_key::text) AS desired_song_type_display
    FROM public.staging_hitlijsten s
    LEFT JOIN public.song_types dst
      ON dst.st_song_type_key = s.hl_desired_song_type_key
    WHERE s.hl_import_run_id = $1
    ORDER BY s.hl_positie ASC
    `,
    [runId]
  );
  return r.rows;
}

export async function updateRowByRunAndPos({ runId, hl_positie, patch }) {
  const allowed = new Set([
    "fd_tag_title",
    "as_correcte_artiest_spelling",
    "hl_discogs_link",
    "hl_find_cmd",
    "fd_file_name",
    "fd_action",
    "hl_artist_key",
    "omroep_key",
    "periode_key",
    "discogs_master_id",
    "discogs_master_url",
    "discogs_master_title",
    "discogs_master_artist",
    "discogs_master_year",
    "discogs_release_id",
    "discogs_release_url",
    "discogs_release_title",
    "discogs_release_format",
    "discogs_release_country",
    "discogs_release_year",
    "hl_desired_song_type_key"
  ]);

  const sets = [];
  const values = [];
  let idx = 1;

  for (const [key, valueRaw] of Object.entries(patch || {})) {
    if (!allowed.has(key)) continue;

    if (["hl_artist_key", "omroep_key", "periode_key", "discogs_master_id", "discogs_master_year", "discogs_release_id", "discogs_release_year", "hl_desired_song_type_key"].includes(key)) {
      const value = normInt(valueRaw, key);
      sets.push(`${key} = $${idx++}`);
      values.push(value);
      continue;
    }

    // String-ish fields: normalize trim + empty => null
    const value = normStr(valueRaw);

    if (key === "fd_tag_title") {
      // We want citext semantics (even if column is varchar, this still works)
      sets.push(`${key} = NULLIF(btrim($${idx++}), '')::citext`);
      values.push(value);
      continue;
    }

    if (key === "as_correcte_artiest_spelling") {
      // column is varchar(150) in your DDL; keep as text but normalize
      sets.push(`${key} = NULLIF(btrim($${idx++}), '')`);
      values.push(value);
      continue;
    }

    if (key === "hl_discogs_link" || key === "hl_find_cmd" || key === "fd_file_name" || key === "fd_action") {
      sets.push(`${key} = NULLIF(btrim($${idx++}), '')`);
      values.push(value);
      continue;
    }

    // default (shouldn't happen, but safe)
    sets.push(`${key} = $${idx++}`);
    values.push(value);
  }

  if (sets.length === 0) return;

  values.push(runId, hl_positie);

  await pool.query(
    `
    UPDATE public.staging_hitlijsten
    SET ${sets.join(", ")}
    WHERE hl_import_run_id = $${idx++}
      AND hl_positie = $${idx++}
    `,
    values
  );
}
