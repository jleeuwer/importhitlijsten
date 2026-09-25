import { logger } from "../config/logger.js";
import { detectEncodingDamage, repairRecoverableEncoding } from "../utils/textFixes.js";
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

function buildEncodingRepairPatch(row) {
  const artistSignal = detectEncodingDamage(row.hl_artiest);
  const titleSignal = detectEncodingDamage(row.hl_titel_song);
  const repairable = [artistSignal, titleSignal].some((signal) => signal.reasonCode === "RECOVERABLE_ENCODING_DAMAGE");

  if (!repairable) {
    return {
      repairable: false,
      reasons: [artistSignal.reasonCode, titleSignal.reasonCode].filter(Boolean)
    };
  }

  const patch = {
    hl_artiest: repairRecoverableEncoding(row.hl_artiest),
    hl_titel_song: repairRecoverableEncoding(row.hl_titel_song),
    hl_discogs_link: row.hl_discogs_link,
    hl_jaar: row.hl_jaar,
    manualOverwriteConfirmed: true
  };

  const changes = [];
  for (const field of ["hl_artiest", "hl_titel_song"]) {
    const before = row[field] ?? null;
    const after = patch[field] ?? null;
    if (before !== after) changes.push({ field, before, after });
  }

  return {
    repairable: changes.length > 0,
    patch,
    changes,
    reasons: [artistSignal.reasonCode, titleSignal.reasonCode].filter(Boolean)
  };
}

export async function previewEncodingRepairForPositions(client, runId, hlPosities = []) {
  logger.info("Encoding repair preview requested", {
    ...LOG_CONTEXT,
    operation: "previewEncodingRepairForPositions",
    runId,
    requested: Array.isArray(hlPosities) ? hlPosities.length : 0
  });

  const { positions, rows } = await loadRowsForPositions(client, runId, hlPosities);
  const foundSet = new Set(rows.map((row) => Number(row.hl_positie)));
  const preview = [];
  let repairableRows = 0;
  let damagedRows = 0;

  for (const row of rows) {
    const built = buildEncodingRepairPatch(row);
    if (built.reasons?.length) damagedRows += 1;
    if (built.repairable) {
      repairableRows += 1;
      preview.push({ hlPositie: row.hl_positie, changes: built.changes, reasons: built.reasons });
    }
  }

  return {
    ok: true,
    runId,
    requested: positions.length,
    scanned: rows.length,
    damagedRows,
    repairableRows,
    missingRows: positions.filter((position) => !foundSet.has(position)),
    preview: preview.slice(0, 10)
  };
}

export async function repairEncodingForPositions(client, runId, hlPosities = []) {
  logger.info("Encoding repair batch requested", {
    ...LOG_CONTEXT,
    operation: "repairEncodingForPositions",
    runId,
    requested: Array.isArray(hlPosities) ? hlPosities.length : 0
  });

  const { positions, rows } = await loadRowsForPositions(client, runId, hlPosities);
  const foundSet = new Set(rows.map((row) => Number(row.hl_positie)));
  const summary = {
    ok: true,
    runId,
    requested: positions.length,
    scanned: rows.length,
    damagedRows: 0,
    repaired: 0,
    skipped: 0,
    failed: 0,
    missingRows: positions.filter((position) => !foundSet.has(position)),
    updatedRows: []
  };

  for (const row of rows) {
    const built = buildEncodingRepairPatch(row);
    if (built.reasons?.length) summary.damagedRows += 1;
    if (!built.repairable) {
      summary.skipped += 1;
      continue;
    }

    try {
      const saveResult = await saveManualStagingCorrection(client, runId, row.hl_positie, built.patch);
      summary.repaired += 1;
      summary.updatedRows.push({
        hlPositie: row.hl_positie,
        changes: built.changes,
        status: saveResult?.diagnostics?.status ?? null,
        reasonCode: saveResult?.diagnostics?.reasonCode ?? null
      });
    } catch (error) {
      summary.failed += 1;
      logger.error("Encoding repair row failed", {
        ...LOG_CONTEXT,
        operation: "repairEncodingForPositions",
        runId,
        hlPositie: row.hl_positie,
        error: error?.message || String(error)
      });
    }
  }

  return summary;
}
