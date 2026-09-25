import { logger } from "../config/logger.js";
import { getStagingRowDiagnostics } from "./editDiagnosticsService.js";

const LOG_CONTEXT = {
  module: "importhitlijst",
  feature: "editPhase"
};

function trimText(value) {
  return String(value ?? "").trim();
}

export async function repairSwappedTitleArtistForStagingRow(client, runId, hlPositie) {
  logger.info("Swap repair requested", {
    ...LOG_CONTEXT,
    operation: "repairSwappedTitleArtistForStagingRow",
    runId,
    hlPositie
  });

  try {
    const rowRes = await client.query(
      `
        SELECT
          hl_import_run_id,
          hl_positie,
          hl_artiest,
          hl_titel_song,
          fd_tag_title,
          as_correcte_artiest_spelling,
          hl_artist_key,
          hl_find_cmd,
          hl_discogs_link
        FROM public.staging_hitlijsten
        WHERE hl_import_run_id = $1
          AND hl_positie = $2
        LIMIT 1
        FOR UPDATE
      `,
      [runId, hlPositie]
    );

    if (rowRes.rowCount === 0) {
      const err = new Error("Staging row not found.");
      err.status = 404;
      throw err;
    }

    const row = rowRes.rows[0];
    const currentArtist = trimText(row.hl_artiest);
    const currentTitle = trimText(row.hl_titel_song);

    if (!currentArtist || !currentTitle) {
      const err = new Error("Cannot swap title/artist because hl_artiest or hl_titel_song is empty.");
      err.status = 400;
      throw err;
    }

    const repairedArtist = currentTitle;
    const repairedTitle = currentArtist;

    await client.query(
      `
        UPDATE public.staging_hitlijsten
        SET hl_artiest = $3,
            hl_titel_song = $4,
            fd_tag_title = $4,
            as_correcte_artiest_spelling = NULL,
            hl_artist_key = NULL,
            hl_find_cmd = NULL
        WHERE hl_import_run_id = $1
          AND hl_positie = $2
      `,
      [runId, hlPositie, repairedArtist, repairedTitle]
    );

    const diagnostics = await getStagingRowDiagnostics(client, runId, hlPositie);

    logger.info("Swap repair completed", {
      ...LOG_CONTEXT,
      operation: "repairSwappedTitleArtistForStagingRow",
      runId,
      hlPositie,
      repairedArtist,
      repairedTitle,
      reasonCode: diagnostics.reasonCode,
      status: diagnostics.status
    });

    return {
      ok: true,
      repairedArtist,
      repairedTitle,
      diagnostics
    };
  } catch (error) {
    logger.error("Swap repair failed", {
      ...LOG_CONTEXT,
      operation: "repairSwappedTitleArtistForStagingRow",
      runId,
      hlPositie,
      statusCode: error?.status ?? 500,
      error: error?.message || String(error)
    });
    throw error;
  }
}


export async function repairAllSuspectedTitleArtistSwapsForRun(client, runId) {
  logger.info("Batch swap repair requested", {
    ...LOG_CONTEXT,
    operation: "repairAllSuspectedTitleArtistSwapsForRun",
    runId
  });

  try {
    const rowsRes = await client.query(
      `
        SELECT hl_import_run_id, hl_positie
        FROM public.staging_hitlijsten
        WHERE hl_import_run_id = $1
        ORDER BY hl_positie ASC
        FOR UPDATE
      `,
      [runId]
    );

    const summary = {
      ok: true,
      runId,
      scanned: rowsRes.rowCount,
      repaired: 0,
      skipped: 0,
      failed: 0,
      repairedRows: [],
      skippedRows: []
    };

    for (const row of rowsRes.rows) {
      const diagnostics = await getStagingRowDiagnostics(client, runId, row.hl_positie);
      const canRepairSwap = Boolean(
        diagnostics?.canRepairTitleArtistSwap || diagnostics?.swapHints?.suspectedTitleArtistSwap
      );
      if (!canRepairSwap) {
        summary.skipped += 1;
        summary.skippedRows.push({
          hlPositie: row.hl_positie,
          reasonCode: diagnostics?.reasonCode ?? "NOT_SUSPECTED_SWAP"
        });
        continue;
      }

      const repairResult = await repairSwappedTitleArtistForStagingRow(client, runId, row.hl_positie);
      summary.repaired += 1;
      summary.repairedRows.push({
        hlPositie: row.hl_positie,
        repairedArtist: repairResult.repairedArtist,
        repairedTitle: repairResult.repairedTitle,
        status: repairResult.diagnostics?.status ?? null,
        reasonCode: repairResult.diagnostics?.reasonCode ?? null
      });
    }

    logger.info("Batch swap repair completed", {
      ...LOG_CONTEXT,
      operation: "repairAllSuspectedTitleArtistSwapsForRun",
      runId,
      scanned: summary.scanned,
      repaired: summary.repaired,
      skipped: summary.skipped,
      failed: summary.failed
    });

    return summary;
  } catch (error) {
    logger.error("Batch swap repair failed", {
      ...LOG_CONTEXT,
      operation: "repairAllSuspectedTitleArtistSwapsForRun",
      runId,
      statusCode: error?.status ?? 500,
      error: error?.message || String(error)
    });
    throw error;
  }
}


export async function forceSwapTitleArtistForPositions(client, runId, hlPosities = []) {
  logger.info("Forced visible-row swap requested", {
    ...LOG_CONTEXT,
    operation: "forceSwapTitleArtistForPositions",
    runId,
    requested: Array.isArray(hlPosities) ? hlPosities.length : 0
  });

  try {
    const requestedPosities = Array.from(
      new Set(
        (Array.isArray(hlPosities) ? hlPosities : [])
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value))
      )
    ).sort((a, b) => a - b);

    if (requestedPosities.length === 0) {
      const err = new Error("At least one hlPositie is required.");
      err.status = 400;
      throw err;
    }

    const rowsRes = await client.query(
      `
        SELECT hl_import_run_id, hl_positie
        FROM public.staging_hitlijsten
        WHERE hl_import_run_id = $1
          AND hl_positie = ANY($2::int[])
        ORDER BY hl_positie ASC
        FOR UPDATE
      `,
      [runId, requestedPosities]
    );

    const summary = {
      ok: true,
      runId,
      requested: requestedPosities.length,
      scanned: rowsRes.rowCount,
      repaired: 0,
      skipped: 0,
      failed: 0,
      repairedRows: [],
      skippedRows: []
    };

    const foundSet = new Set(rowsRes.rows.map((row) => Number(row.hl_positie)));
    for (const position of requestedPosities) {
      if (!foundSet.has(position)) {
        summary.skipped += 1;
        summary.skippedRows.push({ hlPositie: position, reasonCode: "ROW_NOT_FOUND" });
      }
    }

    for (const row of rowsRes.rows) {
      const repairResult = await repairSwappedTitleArtistForStagingRow(client, runId, row.hl_positie);
      summary.repaired += 1;
      summary.repairedRows.push({
        hlPositie: row.hl_positie,
        repairedArtist: repairResult.repairedArtist,
        repairedTitle: repairResult.repairedTitle,
        status: repairResult.diagnostics?.status ?? null,
        reasonCode: repairResult.diagnostics?.reasonCode ?? null
      });
    }

    logger.info("Forced visible-row swap completed", {
      ...LOG_CONTEXT,
      operation: "forceSwapTitleArtistForPositions",
      runId,
      requested: summary.requested,
      scanned: summary.scanned,
      repaired: summary.repaired,
      skipped: summary.skipped,
      failed: summary.failed
    });

    return summary;
  } catch (error) {
    logger.error("Forced visible-row swap failed", {
      ...LOG_CONTEXT,
      operation: "forceSwapTitleArtistForPositions",
      runId,
      statusCode: error?.status ?? 500,
      error: error?.message || String(error)
    });
    throw error;
  }
}
