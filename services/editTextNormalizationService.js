import { logger } from "../config/logger.js";
import { normalizeImportedText } from "../utils/textFixes.js";
import { saveManualStagingCorrection } from "./editManualCorrectionService.js";

const LOG_CONTEXT = {
  module: "importhitlijst",
  feature: "editPhase"
};

function uniqueIntegerPositions(hlPosities = []) {
  return Array.from(
    new Set(
      (Array.isArray(hlPosities) ? hlPosities : [])
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value))
    )
  ).sort((a, b) => a - b);
}

function diffField(field, before, after) {
  if ((before ?? null) === (after ?? null)) return null;
  return { field, before, after };
}

function buildNormalizedPatch(row) {
  const patch = {
    hl_artiest: normalizeImportedText(row.hl_artiest),
    hl_titel_song: normalizeImportedText(row.hl_titel_song),
    hl_discogs_link: row.hl_discogs_link == null ? null : normalizeImportedText(row.hl_discogs_link),
    hl_jaar: row.hl_jaar == null || row.hl_jaar === "" ? null : Number(row.hl_jaar),
    manualOverwriteConfirmed: true
  };

  const fieldDiffs = [
    diffField("hl_artiest", row.hl_artiest ?? null, patch.hl_artiest ?? null),
    diffField("hl_titel_song", row.hl_titel_song ?? null, patch.hl_titel_song ?? null),
    diffField("hl_discogs_link", row.hl_discogs_link ?? null, patch.hl_discogs_link ?? null)
  ].filter(Boolean);

  return {
    patch,
    changed: fieldDiffs.length > 0,
    fieldDiffs
  };
}

async function loadRowsForPositions(client, runId, hlPosities) {
  const positions = uniqueIntegerPositions(hlPosities);
  if (positions.length === 0) {
    const err = new Error("At least one hlPositie is required.");
    err.status = 400;
    throw err;
  }

  const rowsRes = await client.query(
    `
      SELECT
        hl_import_run_id,
        hl_positie,
        hl_artiest,
        hl_titel_song,
        hl_jaar,
        hl_discogs_link
      FROM public.staging_hitlijsten
      WHERE hl_import_run_id = $1
        AND hl_positie = ANY($2::int[])
      ORDER BY hl_positie ASC
      FOR UPDATE
    `,
    [runId, positions]
  );

  return { positions, rows: rowsRes.rows };
}

export async function previewNormalizeTextForPositions(client, runId, hlPosities = []) {
  logger.info("Text normalization preview requested", {
    ...LOG_CONTEXT,
    operation: "previewNormalizeTextForPositions",
    runId,
    requested: Array.isArray(hlPosities) ? hlPosities.length : 0
  });

  try {
    const { positions, rows } = await loadRowsForPositions(client, runId, hlPosities);
    const foundSet = new Set(rows.map((row) => Number(row.hl_positie)));

    const previewRows = [];
    let changedRows = 0;
    let changedFields = 0;

    for (const row of rows) {
      const normalized = buildNormalizedPatch(row);
      if (normalized.changed) {
        changedRows += 1;
        changedFields += normalized.fieldDiffs.length;
        previewRows.push({
          hlPositie: row.hl_positie,
          changes: normalized.fieldDiffs
        });
      }
    }

    const missingRows = positions.filter((position) => !foundSet.has(position));
    const result = {
      ok: true,
      runId,
      requested: positions.length,
      scanned: rows.length,
      changedRows,
      changedFields,
      unchangedRows: rows.length - changedRows,
      missingRows,
      preview: previewRows.slice(0, 10)
    };

    logger.info("Text normalization preview resolved", {
      ...LOG_CONTEXT,
      operation: "previewNormalizeTextForPositions",
      runId,
      requested: result.requested,
      scanned: result.scanned,
      changedRows: result.changedRows,
      changedFields: result.changedFields
    });

    return result;
  } catch (error) {
    logger.error("Text normalization preview failed", {
      ...LOG_CONTEXT,
      operation: "previewNormalizeTextForPositions",
      runId,
      statusCode: error?.status ?? 500,
      error: error?.message || String(error)
    });
    throw error;
  }
}

export async function normalizeTextForPositions(client, runId, hlPosities = []) {
  logger.info("Batch text normalization requested", {
    ...LOG_CONTEXT,
    operation: "normalizeTextForPositions",
    runId,
    requested: Array.isArray(hlPosities) ? hlPosities.length : 0
  });

  try {
    const { positions, rows } = await loadRowsForPositions(client, runId, hlPosities);
    const foundSet = new Set(rows.map((row) => Number(row.hl_positie)));
    const summary = {
      ok: true,
      runId,
      requested: positions.length,
      scanned: rows.length,
      changedRows: 0,
      unchangedRows: 0,
      changedFields: 0,
      failed: 0,
      missingRows: positions.filter((position) => !foundSet.has(position)),
      updatedRows: []
    };

    for (const row of rows) {
      const normalized = buildNormalizedPatch(row);
      if (!normalized.changed) {
        summary.unchangedRows += 1;
        continue;
      }

      const saveResult = await saveManualStagingCorrection(client, runId, row.hl_positie, normalized.patch);
      summary.changedRows += 1;
      summary.changedFields += normalized.fieldDiffs.length;
      summary.updatedRows.push({
        hlPositie: row.hl_positie,
        changes: normalized.fieldDiffs,
        status: saveResult?.diagnostics?.status ?? null,
        reasonCode: saveResult?.diagnostics?.reasonCode ?? null
      });
    }

    logger.info("Batch text normalization completed", {
      ...LOG_CONTEXT,
      operation: "normalizeTextForPositions",
      runId,
      requested: summary.requested,
      scanned: summary.scanned,
      changedRows: summary.changedRows,
      unchangedRows: summary.unchangedRows,
      changedFields: summary.changedFields,
      failed: summary.failed
    });

    return summary;
  } catch (error) {
    logger.error("Batch text normalization failed", {
      ...LOG_CONTEXT,
      operation: "normalizeTextForPositions",
      runId,
      statusCode: error?.status ?? 500,
      error: error?.message || String(error)
    });
    throw error;
  }
}
