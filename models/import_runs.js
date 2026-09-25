import { pool } from "../config/db.js";

/**
 * Find an existing import run for the same file content (hash)
 * within the same import context (hitlijst + uitzendjaar).
 *
 * Requires DB constraint:
 * UNIQUE (ir_file_hash, ir_hitlijst, ir_uitzendjaar)
 */
export async function findRunByHash({ fileHash, hl_hitlijst, hl_uitzendjaar }) {
  const r = await pool.query(
    `
    SELECT *
    FROM public.import_runs
    WHERE ir_file_hash = $1
      AND ir_hitlijst = $2
      AND ir_uitzendjaar = $3
    LIMIT 1
    `,
    [fileHash, hl_hitlijst, hl_uitzendjaar]
  );
  return r.rows[0] ?? null;
}

/**
 * Create a new import run record.
 */
export async function createImportRunTx(client, {
  runId,
  hl_hitlijst,
  hl_uitzendjaar,
  originalFilename,
  fileHash,
  rowCount,
  status = "COMPLETED"
}) {
  await client.query(
    `
    INSERT INTO public.import_runs
      (ir_run_id, ir_hitlijst, ir_uitzendjaar, ir_original_filename, ir_file_hash, ir_row_count, ir_status)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      runId,
      hl_hitlijst,
      hl_uitzendjaar,
      originalFilename ?? null,
      fileHash,
      rowCount ?? 0,
      status
    ]
  );
}

export async function deleteRunTx(client, runId) {
  await client.query(`DELETE FROM public.staging_hitlijsten WHERE hl_import_run_id = $1`, [runId]);
  await client.query(`DELETE FROM public.import_runs WHERE ir_run_id = $1`, [runId]);
}

const NORMALIZE_TITLE_SQL = (expr) =>
  `lower(regexp_replace(replace(btrim(coalesce(${expr}::text, '')), chr(160), ' '), '\\s+', ' ', 'g'))`;
const NORMALIZE_FILENAME_SQL = (expr) =>
  `lower(regexp_replace(replace(btrim(coalesce(${expr}::text, '')), chr(92), '/'), '\\s+', ' ', 'g'))`;
const ACTIVE_FILE_DETAILS_SQL = "lower(btrim(coalesce(fd.fd_action::text, 'Keep'))) NOT IN ('delete', 'duplicates', 'skip')";
const ACTIVE_FILE_DETAILS_FOR_FILENAME_SQL = "lower(btrim(coalesce(fd.fd_action::text, 'Keep'))) <> 'delete'";

function mapRunProcessingStatus(row) {
  const exported = Number(row.exported_row_count ?? 0);
  const total = Number(row.total_count ?? row.ir_row_count ?? 0);
  const blocked = Number(row.blocked_count ?? 0);
  const duplicate = Number(row.duplicate_count ?? 0);

  if (exported > 0) return "exported";
  if (total === 0) return "empty";
  if (blocked > 0 || duplicate > 0) return "needs_attention";
  return "ready_for_export";
}

function mapRunProcessingLabel(status) {
  if (status === "exported") return "Geëxporteerd";
  if (status === "empty") return "Geen data";
  if (status === "needs_attention") return "Aandacht nodig";
  if (status === "ready_for_export") return "Klaar voor export";
  return status || "Onbekend";
}

export function enrichRunsWithProcessingStatus(rows = []) {
  return rows.map((row) => {
    const run_processing_status = row.run_processing_status || mapRunProcessingStatus(row);
    return {
      ...row,
      total_count: Number(row.total_count ?? row.ir_row_count ?? 0),
      ok_count: Number(row.ok_count ?? 0),
      blocked_count: Number(row.blocked_count ?? 0),
      duplicate_count: Number(row.duplicate_count ?? 0),
      skip_count: Number(row.skip_count ?? 0),
      discogs_link_count: Number(row.discogs_link_count ?? 0),
      blocked_discogs_count: Number(row.blocked_discogs_count ?? 0),
      exported_row_count: Number(row.exported_row_count ?? 0),
      needs_attention: run_processing_status === "needs_attention",
      run_processing_status,
      run_processing_label: row.run_processing_label || mapRunProcessingLabel(run_processing_status)
    };
  });
}

/**
 * List recent runs with processing summary counts for the Runs worklist.
 */
export async function listRuns({ hl_hitlijst = null, hl_uitzendjaar = null, limit = 50 }) {
  const r = await pool.query(
    `
    WITH staging_base AS (
      SELECT
        s.*,
        lower(btrim(coalesce(s.fd_action::text, ''))) AS normalized_fd_action,
        ${NORMALIZE_TITLE_SQL("s.fd_tag_title")} AS normalized_fd_tag_title,
        ${NORMALIZE_FILENAME_SQL("s.fd_file_name")} AS normalized_file_name
      FROM public.staging_hitlijsten s
    ),
    staging_meta AS (
      SELECT
        s.hl_import_run_id,
        MIN(s.omroep_key)::int AS omroep_key,
        MIN(s.periode_key)::int AS periode_key
      FROM staging_base s
      GROUP BY s.hl_import_run_id
    ),
    export_counts AS (
      SELECT
        h.hl_hitlijst,
        h.hl_uitzendjaar,
        COUNT(*)::int AS exported_row_count
      FROM public.hitlijsten h
      GROUP BY h.hl_hitlijst, h.hl_uitzendjaar
    ),
    file_details_by_filename AS (
      SELECT
        ${NORMALIZE_FILENAME_SQL("fd.fd_file_name")} AS normalized_file_name,
        COUNT(*)::int AS existing_file_details_count
      FROM public.file_details fd
      WHERE btrim(coalesce(fd.fd_file_name::text, '')) <> ''
        AND ${ACTIVE_FILE_DETAILS_FOR_FILENAME_SQL}
      GROUP BY 1
    ),
    staged_with_filename AS (
      SELECT
        s.hl_import_run_id,
        s.hl_positie,
        s.normalized_fd_action,
        s.normalized_file_name,
        COUNT(*) OVER (PARTITION BY s.hl_import_run_id, s.normalized_file_name)::int AS in_run_filename_count,
        ROW_NUMBER() OVER (PARTITION BY s.hl_import_run_id, s.normalized_file_name ORDER BY s.hl_positie ASC NULLS LAST)::int AS in_run_filename_rank
      FROM staging_base s
      WHERE btrim(coalesce(s.fd_file_name::text, '')) <> ''
    ),
    duplicate_summary AS (
      SELECT
        swf.hl_import_run_id,
        COUNT(*) FILTER (
          WHERE swf.normalized_fd_action <> 'skip'
            AND (
              COALESCE(efd.existing_file_details_count, 0) > 0
              OR (swf.in_run_filename_count > 1 AND swf.in_run_filename_rank > 1)
            )
        )::int AS duplicate_count
      FROM staged_with_filename swf
      LEFT JOIN file_details_by_filename efd
        ON efd.normalized_file_name = swf.normalized_file_name
      GROUP BY swf.hl_import_run_id
    ),
    row_diagnostics AS (
      SELECT
        s.hl_import_run_id,
        s.hl_positie,
        s.normalized_fd_action,
        (
          s.normalized_fd_action <> 'skip'
          AND (
            btrim(coalesce(s.fd_tag_title::text, '')) = ''
            OR asp.as_alternatieve_spelling IS NULL
            OR a.ar_artist_key IS NULL
            OR s.hl_artist_key IS NULL
            OR COALESCE(t.title_match_count, 0) = 0
            OR COALESCE(k.artist_key_match_count, 0) = 0
            OR COALESCE(c.combined_match_count, 0) = 0
          )
        ) AS is_blocked,
        (
          s.normalized_fd_action <> 'skip'
          AND btrim(coalesce(s.fd_tag_title::text, '')) <> ''
          AND asp.as_alternatieve_spelling IS NOT NULL
          AND a.ar_artist_key IS NOT NULL
          AND s.hl_artist_key IS NOT NULL
          AND COALESCE(t.title_match_count, 0) > 0
          AND COALESCE(k.artist_key_match_count, 0) > 0
          AND COALESCE(c.combined_match_count, 0) > 0
        ) AS is_ok,
        (
          s.normalized_fd_action <> 'skip'
          AND (
            COALESCE(NULLIF(btrim(s.discogs_master_url::text), ''), NULLIF(btrim(s.discogs_release_url::text), ''), NULLIF(btrim(s.hl_discogs_link::text), '')) IS NOT NULL
          )
          AND (
            btrim(coalesce(s.fd_tag_title::text, '')) = ''
            OR asp.as_alternatieve_spelling IS NULL
            OR a.ar_artist_key IS NULL
            OR s.hl_artist_key IS NULL
            OR COALESCE(t.title_match_count, 0) = 0
            OR COALESCE(k.artist_key_match_count, 0) = 0
            OR COALESCE(c.combined_match_count, 0) = 0
          )
        ) AS is_blocked_with_discogs,
        (
          COALESCE(NULLIF(btrim(s.discogs_master_url::text), ''), NULLIF(btrim(s.discogs_release_url::text), ''), NULLIF(btrim(s.hl_discogs_link::text), '')) IS NOT NULL
        ) AS has_discogs_link
      FROM staging_base s
      LEFT JOIN public.artiesten_spelling asp
        ON asp.as_alternatieve_spelling = s.hl_artiest
      LEFT JOIN public.artist a
        ON a.ar_artist_key = asp.as_artist_key
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS title_match_count
        FROM public.file_details fd
        WHERE ${NORMALIZE_TITLE_SQL("fd.fd_tag_title")} = s.normalized_fd_tag_title
          AND ${ACTIVE_FILE_DETAILS_SQL}
      ) t ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS artist_key_match_count
        FROM public.file_details fd
        WHERE fd.fd_artist_key = s.hl_artist_key
          AND ${ACTIVE_FILE_DETAILS_SQL}
      ) k ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS combined_match_count
        FROM public.file_details fd
        WHERE ${NORMALIZE_TITLE_SQL("fd.fd_tag_title")} = s.normalized_fd_tag_title
          AND fd.fd_artist_key = s.hl_artist_key
          AND ${ACTIVE_FILE_DETAILS_SQL}
      ) c ON true
    ),
    processing_summary AS (
      SELECT
        rd.hl_import_run_id,
        COUNT(*)::int AS total_count,
        COUNT(*) FILTER (WHERE rd.is_ok)::int AS ok_count,
        COUNT(*) FILTER (WHERE rd.is_blocked)::int AS blocked_count,
        COUNT(*) FILTER (WHERE rd.normalized_fd_action = 'skip')::int AS skip_count,
        COUNT(*) FILTER (WHERE rd.has_discogs_link)::int AS discogs_link_count,
        COUNT(*) FILTER (WHERE rd.is_blocked_with_discogs)::int AS blocked_discogs_count
      FROM row_diagnostics rd
      GROUP BY rd.hl_import_run_id
    )
    SELECT
      r.*,
      sm.omroep_key,
      o.omroep_naam,
      o.omroep_code,
      sm.periode_key,
      p.periode_code,
      p.periode_naam,
      COALESCE(ps.total_count, r.ir_row_count, 0)::int AS total_count,
      COALESCE(ps.ok_count, 0)::int AS ok_count,
      COALESCE(ps.blocked_count, 0)::int AS blocked_count,
      COALESCE(ds.duplicate_count, 0)::int AS duplicate_count,
      COALESCE(ps.skip_count, 0)::int AS skip_count,
      COALESCE(ps.discogs_link_count, 0)::int AS discogs_link_count,
      COALESCE(ps.blocked_discogs_count, 0)::int AS blocked_discogs_count,
      COALESCE(ec.exported_row_count, 0)::int AS exported_row_count
    FROM public.import_runs r
    LEFT JOIN staging_meta sm ON sm.hl_import_run_id = r.ir_run_id
    LEFT JOIN public.omroepen o ON o.omroep_key = sm.omroep_key
    LEFT JOIN public.hitlijst_perioden p ON p.periode_key = sm.periode_key
    LEFT JOIN processing_summary ps ON ps.hl_import_run_id = r.ir_run_id
    LEFT JOIN duplicate_summary ds ON ds.hl_import_run_id = r.ir_run_id
    LEFT JOIN export_counts ec
      ON ec.hl_hitlijst = r.ir_hitlijst
     AND ec.hl_uitzendjaar = r.ir_uitzendjaar
    WHERE ($1::citext IS NULL OR r.ir_hitlijst = $1::citext)
      AND ($2::int    IS NULL OR r.ir_uitzendjaar = $2)
    ORDER BY r.ir_created_at DESC
    LIMIT $3
    `,
    [hl_hitlijst, hl_uitzendjaar, limit]
  );
  return enrichRunsWithProcessingStatus(r.rows);
}

/**
 * Fetch a single run by runId.
 */
export async function getRunById(runId) {
  const r = await pool.query(
    `
    SELECT *
    FROM public.import_runs
    WHERE ir_run_id = $1
    LIMIT 1
    `,
    [runId]
  );
  return r.rows[0] ?? null;
}

async function getExportedRowCountForRunTx(client, runId) {
  const r = await client.query(
    `
    SELECT
      ir.ir_run_id,
      ir.ir_hitlijst,
      ir.ir_uitzendjaar,
      COALESCE(ec.exported_row_count, 0)::int AS exported_row_count
    FROM public.import_runs ir
    LEFT JOIN (
      SELECT hl_hitlijst, hl_uitzendjaar, COUNT(*)::int AS exported_row_count
      FROM public.hitlijsten
      GROUP BY hl_hitlijst, hl_uitzendjaar
    ) ec
      ON ec.hl_hitlijst = ir.ir_hitlijst
     AND ec.hl_uitzendjaar = ir.ir_uitzendjaar
    WHERE ir.ir_run_id = $1
    LIMIT 1
    `,
    [runId]
  );
  return r.rows[0] ?? null;
}

export async function deleteRunSafelyTx(client, runId) {
  const run = await getExportedRowCountForRunTx(client, runId);
  if (!run) {
    const err = new Error("Import run not found.");
    err.status = 404;
    throw err;
  }

  const exportedRowCount = Number(run.exported_row_count ?? 0);
  if (exportedRowCount > 0) {
    const err = new Error("Deze run is al geëxporteerd en kan niet veilig worden verwijderd.");
    err.status = 409;
    err.code = "RUN_ALREADY_EXPORTED";
    err.exportedRowCount = exportedRowCount;
    throw err;
  }

  const stagingResult = await client.query(
    `DELETE FROM public.staging_hitlijsten WHERE hl_import_run_id = $1`,
    [runId]
  );
  const runResult = await client.query(
    `DELETE FROM public.import_runs WHERE ir_run_id = $1`,
    [runId]
  );

  return {
    ok: true,
    deleted: true,
    runId,
    hitlijst: run.ir_hitlijst,
    uitzendjaar: run.ir_uitzendjaar,
    stagingRowsDeleted: Number(stagingResult.rowCount ?? 0),
    runsDeleted: Number(runResult.rowCount ?? 0)
  };
}
