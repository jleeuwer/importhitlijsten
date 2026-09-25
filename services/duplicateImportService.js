import { logger } from "../config/logger.js";

const LOG_CONTEXT = {
  module: "importhitlijst",
  feature: "duplicateImportPrevention"
};

export const SKIP_ACTION = "Skip";

const normalizeFilenameSql = (expr) => `lower(regexp_replace(replace(btrim(coalesce(${expr}::text, '')), chr(92), '/'), '\\s+', ' ', 'g'))`;

function normalizeFilename(value) {
  return String(value ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function safeInt(value) {
  const n = Number(value);
  return Number.isInteger(n) ? n : 0;
}


function isMissingDuplicateImportSchemaError(error) {
  const message = String(error?.message || "").toLowerCase();
  return error?.code === "42703"
    && (message.includes("fd_file_name") || message.includes("fd_action"));
}

function logMissingDuplicateImportSchema(error, runId) {
  logger.warn("Duplicate import schema is not available; returning empty duplicate summary", {
    ...LOG_CONTEXT,
    operation: "duplicateImportSchemaGuard",
    runId,
    errorCode: error?.code,
    errorMessage: error?.message,
    remediation: "Run npm script db:migrate:sprint2g-d to add staging_hitlijsten.fd_file_name and staging_hitlijsten.fd_action"
  });
}

function mapReasonCode(reasonCode) {
  if (reasonCode === "DUPLICATE_EXISTING_FILE_DETAILS") return "Bestand bestaat al in file_details";
  if (reasonCode === "DUPLICATE_IN_IMPORT_RUN") return "Bestand komt meerdere keren in deze import-run voor";
  return reasonCode || "Duplicate";
}

export function buildDuplicateImportSummary(rows = []) {
  const exportableRows = Array.isArray(rows) ? rows : [];
  const duplicateRows = exportableRows.filter((row) => row.reason_code);

  const existingCount = duplicateRows.filter((row) => row.reason_code === "DUPLICATE_EXISTING_FILE_DETAILS").length;
  const inRunCount = duplicateRows.filter((row) => row.reason_code === "DUPLICATE_IN_IMPORT_RUN").length;
  const skippedCount = exportableRows.filter((row) => String(row.fd_action ?? "").trim().toLowerCase() === "skip").length;

  return {
    duplicateCount: duplicateRows.length,
    existingFileDetailsDuplicateCount: existingCount,
    inRunDuplicateCount: inRunCount,
    skippedCount,
    duplicateRows: duplicateRows.slice(0, 25).map((row) => ({
      hl_positie: row.hl_positie,
      hl_artiest: row.hl_artiest,
      hl_titel_song: row.hl_titel_song,
      fd_file_name: row.fd_file_name,
      fd_action: row.fd_action,
      reasonCode: row.reason_code,
      reasonLabel: mapReasonCode(row.reason_code),
      existingFileDetailsCount: safeInt(row.existing_file_details_count),
      inRunFilenameCount: safeInt(row.in_run_filename_count)
    }))
  };
}

export async function getDuplicateImportRows(client, runId) {
  let res;
  try {
    res = await client.query(
    `
      WITH staging AS (
        SELECT
          s.hl_import_run_id,
          s.hl_positie,
          s.hl_artiest,
          s.hl_titel_song,
          s.fd_file_name,
          s.fd_action,
          ${normalizeFilenameSql("s.fd_file_name")} AS normalized_file_name
        FROM public.staging_hitlijsten s
        WHERE s.hl_import_run_id = $1
      ),
      staged_with_counts AS (
        SELECT
          s.*,
          COUNT(*) OVER (PARTITION BY s.normalized_file_name)::int AS in_run_filename_count,
          ROW_NUMBER() OVER (PARTITION BY s.normalized_file_name ORDER BY s.hl_positie ASC NULLS LAST)::int AS in_run_filename_rank
        FROM staging s
        WHERE btrim(coalesce(s.fd_file_name::text, '')) <> ''
      ),
      existing_file_details AS (
        SELECT
          ${normalizeFilenameSql("fd.fd_file_name")} AS normalized_file_name,
          COUNT(*)::int AS existing_file_details_count
        FROM public.file_details fd
        WHERE btrim(coalesce(fd.fd_file_name::text, '')) <> ''
          AND lower(btrim(coalesce(fd.fd_action::text, 'Keep'))) <> 'delete'
        GROUP BY 1
      )
      SELECT
        swc.hl_positie,
        swc.hl_artiest,
        swc.hl_titel_song,
        swc.fd_file_name,
        swc.fd_action,
        swc.in_run_filename_count,
        swc.in_run_filename_rank,
        COALESCE(efd.existing_file_details_count, 0)::int AS existing_file_details_count,
        CASE
          WHEN lower(btrim(coalesce(swc.fd_action::text, ''))) = 'skip' THEN NULL
          WHEN COALESCE(efd.existing_file_details_count, 0) > 0 THEN 'DUPLICATE_EXISTING_FILE_DETAILS'
          WHEN swc.in_run_filename_count > 1 AND swc.in_run_filename_rank > 1 THEN 'DUPLICATE_IN_IMPORT_RUN'
          ELSE NULL
        END AS reason_code
      FROM staged_with_counts swc
      LEFT JOIN existing_file_details efd
        ON efd.normalized_file_name = swc.normalized_file_name
      ORDER BY swc.hl_positie ASC NULLS LAST
    `,
    [runId]
    );
  } catch (error) {
    if (isMissingDuplicateImportSchemaError(error)) {
      logMissingDuplicateImportSchema(error, runId);
      return [];
    }
    throw error;
  }

  return res.rows;
}

export async function getDuplicateImportSummary(client, runId) {
  const rows = await getDuplicateImportRows(client, runId);
  const summary = buildDuplicateImportSummary(rows);

  logger.info("Duplicate import summary resolved", {
    ...LOG_CONTEXT,
    operation: "getDuplicateImportSummary",
    runId,
    duplicateCount: summary.duplicateCount,
    existingFileDetailsDuplicateCount: summary.existingFileDetailsDuplicateCount,
    inRunDuplicateCount: summary.inRunDuplicateCount,
    skippedCount: summary.skippedCount
  });

  return summary;
}

export async function markDuplicateImportRowsAsSkip(client, runId) {
  const beforeRows = await getDuplicateImportRows(client, runId);
  const duplicateRows = beforeRows.filter((row) => row.reason_code);
  const positions = duplicateRows.map((row) => Number(row.hl_positie)).filter(Number.isInteger);

  if (positions.length === 0) {
    return {
      ok: true,
      runId,
      action: SKIP_ACTION,
      updatedRows: 0,
      duplicateCount: 0,
      existingFileDetailsDuplicateCount: 0,
      inRunDuplicateCount: 0
    };
  }

  const updateRes = await client.query(
    `
      UPDATE public.staging_hitlijsten s
      SET fd_action = $3
      WHERE s.hl_import_run_id = $1
        AND s.hl_positie = ANY($2::int[])
        AND lower(btrim(coalesce(s.fd_action::text, ''))) <> 'skip'
    `,
    [runId, positions, SKIP_ACTION]
  );

  const summary = buildDuplicateImportSummary(duplicateRows);

  logger.info("Duplicate import rows marked as Skip", {
    ...LOG_CONTEXT,
    operation: "markDuplicateImportRowsAsSkip",
    runId,
    requestedRows: positions.length,
    updatedRows: updateRes.rowCount ?? 0,
    existingFileDetailsDuplicateCount: summary.existingFileDetailsDuplicateCount,
    inRunDuplicateCount: summary.inRunDuplicateCount
  });

  return {
    ok: true,
    runId,
    action: SKIP_ACTION,
    updatedRows: Number(updateRes.rowCount ?? 0),
    duplicateCount: positions.length,
    existingFileDetailsDuplicateCount: summary.existingFileDetailsDuplicateCount,
    inRunDuplicateCount: summary.inRunDuplicateCount
  };
}

export { normalizeFilename };
