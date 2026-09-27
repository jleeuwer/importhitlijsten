import crypto from "crypto";
import { pool } from "../config/db.js";
import { logger } from "../config/logger.js";
import { sha256File } from "../utils/fileHash.js";
import { readCsvRows, normalizeHitlijstRow } from "../utils/csvReader.js";
import { findRunByHash, createImportRunTx, deleteRunSafelyTx } from "../models/import_runs.js";
import { insertStagingRowTx, countRowsByRunIdTx, findByRunId } from "../models/staging_hitlijsten.js";
import { z } from "zod";
// import { fixAmpersandEntities } from "../utils/textFixes.js";
import { decodeHtmlEntities, repairRecoverableEncoding } from "../utils/textFixes.js";
import { summarizeImportPatternCandidates } from "../services/patternDiscoveryService.js";
import { calculateListFingerprint } from "../utils/listFingerprint.js";
import { findRegistryMatches, registerImportedFileTx } from "../models/import_file_registry.js";
import fs from "fs/promises";
import path from "path";

function asInt(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const csvRowSchema = z.object({
  artiest: z.string().trim().min(1),
  song: z.string().trim().min(1),
  jaar: z.string().trim().min(1).refine(v => Number.isInteger(Number(v)), "jaar must be an integer")
});

export async function importHitlijstCsv({ hl_hitlijst, hl_uitzendjaar, omroep_key = null, periode_key = null, filePath, originalFilename, duplicateOverride = false, sourceDirectory = null }) {
  const fileHash = await sha256File(filePath);

  logger.info("Import inputs", { filePath, originalFilename, hl_hitlijst, hl_uitzendjaar, omroep_key, periode_key, fileHash });

  // 1) Read, fingerprint and resolve duplicate state before starting the transaction.
  const parsedCsv = await readCsvRows(filePath);
  const fingerprint = calculateListFingerprint(parsedCsv.rows);
  const registryMatches = await findRegistryMatches({
    fileSha256: fileHash,
    listFingerprint: fingerprint.listFingerprint
  });
  const existing = await findRunByHash({
    fileHash,
    hl_hitlijst,
    hl_uitzendjaar: asInt(hl_uitzendjaar)
  });
  const duplicateRegistry = registryMatches.fileMatch ?? registryMatches.listMatch ?? null;

  if ((existing || duplicateRegistry) && !duplicateOverride) {
    return {
      alreadyImported: true,
      duplicateRequiresOverride: true,
      duplicateMatchType: registryMatches.fileMatch ? "EXACT_FILE" : "SAME_LIST_CONTENT",
      existingRun: existing ?? (duplicateRegistry?.ifr_import_run_id ? { ir_run_id: duplicateRegistry.ifr_import_run_id } : null),
      existingRegistry: duplicateRegistry,
      summary: {
        message: registryMatches.fileMatch
          ? "Exact hetzelfde CSV-bestand is al geregistreerd als geïmporteerd."
          : "Dezelfde hitlijstinhoud is al eerder geïmporteerd. Bevestig expliciet als je opnieuw wilt importeren.",
        hl_hitlijst,
        hl_uitzendjaar,
        fileHash,
        listFingerprint: fingerprint.listFingerprint,
        totalRows: parsedCsv.rows.length,
        inserted: 0,
        warnings: 1,
        errors: 0
      },
      rows: existing ? await findByRunId(existing.ir_run_id) : []
    };
  }

  logger.info("CSV detected", { delimiter: parsedCsv.delimiter, headers: parsedCsv.headers, rowCount: parsedCsv.rows.length, encodingUsed: parsedCsv.encodingUsed, decodeScores: parsedCsv.decodeScores, listFingerprint: fingerprint.listFingerprint });

  const client = await pool.connect();
  const runId = crypto.randomUUID();

  const importedTitlesForPatternDiscovery = [];

  const summary = {
    runId,
    hl_hitlijst,
    hl_uitzendjaar,
    originalFilename,
    fileHash,
    listFingerprint: fingerprint.listFingerprint,
    duplicateOverride: !!duplicateOverride,
    totalRows: parsedCsv.rows.length,
    inserted: 0,
    warnings: 0,
    errors: 0,
    warningSamples: [],
    errorSamples: []
  };

  try {
    await client.query("BEGIN");

    // 3) Insert staging rows
    for (let i = 0; i < parsedCsv.rows.length; i++) {
      const rowNum = i + 1;
      const normalized = normalizeHitlijstRow(parsedCsv.rows[i]);

      const cleaned = {
        artiest: repairRecoverableEncoding(decodeHtmlEntities(normalized.artiest)),
        song: repairRecoverableEncoding(decodeHtmlEntities(normalized.song)),
        jaar: normalized.jaar
      };

      const parsed = csvRowSchema.safeParse({
        artiest: cleaned.artiest,
        song: cleaned.song,
        jaar: String(cleaned.jaar ?? "")
      });

      // const normalized = normalizeHitlijstRow(parsedCsv.rows[i]);

      // const parsed = csvRowSchema.safeParse({
      //   artiest: normalized.artiest,
      //   song: normalized.song,
      //   jaar: String(normalized.jaar ?? "")
      // });

      if (!parsed.success) {
        summary.warnings++;
        if (summary.warningSamples.length < 10) {
          summary.warningSamples.push({ rowNum, message: parsed.error.issues.map(x => x.message).join("; ") });
        }
        continue;
      }
      importedTitlesForPatternDiscovery.push(cleaned.song);

      await insertStagingRowTx(client, {
        hl_hitlijst,
        hl_uitzendjaar: asInt(hl_uitzendjaar),
        hl_positie: rowNum,
        hl_artiest: cleaned.artiest,
        hl_titel_song: cleaned.song,
        hl_jaar: asInt(cleaned.jaar),
        fd_file_name: normalized.fd_file_name || null,
        fd_action: null,
        omroep_key: asInt(omroep_key),
        periode_key: asInt(periode_key),
        hl_import_run_id: runId
      });

      // await insertStagingRowTx(client, {
      //   hl_hitlijst,
      //   hl_uitzendjaar: asInt(hl_uitzendjaar),
      //   hl_positie: rowNum,
      //   hl_artiest: parsed.data.artiest,
      //   hl_titel_song: parsed.data.song,
      //   hl_jaar: asInt(parsed.data.jaar),
      //   hl_import_run_id: runId
      // });

      summary.inserted++;
    }

    // 4) Verify staging has the same number of inserted rows
    const cnt = await countRowsByRunIdTx(client, runId);
    if (cnt !== summary.inserted) {
      throw new Error(`Row count mismatch: staging has ${cnt}, expected ${summary.inserted}`);
    }

    // 5) Insert run header only AFTER staging verification
    await createImportRunTx(client, {
      runId,
      hl_hitlijst,
      hl_uitzendjaar: asInt(hl_uitzendjaar),
      originalFilename,
      fileHash,
      rowCount: cnt,
      status: "COMPLETED"
    });

    const patternDiscoverySummary = summarizeImportPatternCandidates(importedTitlesForPatternDiscovery);
    summary.patternDiscovery = patternDiscoverySummary;

    const stat = await fs.stat(filePath);
    await registerImportedFileTx(client, {
      fileName: originalFilename || path.basename(filePath),
      directoryPath: sourceDirectory || path.dirname(filePath),
      fileSize: stat.size,
      fileModifiedAt: stat.mtime,
      fileSha256: fileHash,
      listFingerprint: fingerprint.listFingerprint,
      importRunId: runId,
      duplicateOverride: !!duplicateOverride,
      duplicateOfRegistryKey: duplicateRegistry?.ifr_key ?? null
    });

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    logger.error("Import failed (rolled back)", { message: e.message, stack: e.stack });
    throw e;
  } finally {
    client.release();
  }

  // Fetch rows after commit
  const rows = await findByRunId(runId);
  logger.info("Import summary", summary);
  return { alreadyImported: false, summary, rows };
}

/**
 * Delete an existing run and its staging rows (transactional).
 */
export async function deleteImportRun(runId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await deleteRunSafelyTx(client, runId);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
