// routes/indexroutes.js
import express from "express";
import { z } from "zod";

import { renderApp } from "../src/server/ssr.js";
import { uploadCsv, uploadImportCandidateBatch } from "../middleware/upload.js";
import { healthCheck, pool } from "../config/db.js";

import { listRuns } from "../models/import_runs.js";
import { findByRunId, updateRowByRunAndPos } from "../models/staging_hitlijsten.js";
import { importHitlijstCsv, deleteImportRun } from "../controllers/importController.js";

import { decodeHtmlEntitiesForRun } from "../models/staging_hitlijsten.js";
import { applyArtistSpellingForRun } from "../controllers/artistSpellingController.js";
import { applySongSpellingForRun } from "../controllers/songSpellingController.js";
import { applyPatternDeleteForRun } from "../controllers/patternDeleteController.js";
import { altSpellingApply } from "../controllers/altSpellingController.js";

import {
  findFileDetailsByTagTitle,
  findFileDetailsByCorrectArtist,
  enrichFindCmdAndGetStatusForRun
} from "../models/file_details.js";

import {
  listPatterns,
  createPattern,
  updatePattern,
  deletePattern
} from "../models/string_del_patterns.js";

import { selectAltSpellingForRow } from "../controllers/altSpellingController.js";
import { exportHitlijstenForRun } from "../controllers/exportHitlijstenController.js";
import { getExportHitlijstenStatus } from "../models/hitlijsten.js";
import { getMetadataOptions, updateRunMetadata, updateRunMetadataAndSyncExported } from "../models/metadata.js";
import { listSongTypes, songTypeExists } from "../models/song_types.js";
import { getStagingRowDiagnostics } from "../services/editDiagnosticsService.js";
import { repairArtistRelationForStagingRow } from "../services/editArtistRelationService.js";
import { repairAllSuspectedTitleArtistSwapsForRun, repairSwappedTitleArtistForStagingRow, forceSwapTitleArtistForPositions } from "../services/editSwapRepairService.js";
import { applyManualRepairFromFileDetails, saveManualStagingCorrection, searchManualRepairFileDetailsCandidates } from "../services/editManualCorrectionService.js";
import { applyPostExportCorrection, previewPostExportCorrection } from "../services/postExportCorrectionService.js";
import { normalizeTextForPositions, previewNormalizeTextForPositions } from "../services/editTextNormalizationService.js";
import { previewEncodingRepairForPositions, repairEncodingForPositions } from "../services/editEncodingRepairService.js";
import { applyYearEnrichmentForRun, previewYearEnrichmentForRun } from "../services/editYearEnrichmentService.js";
import { getDiscogsDetails, searchDiscogs } from "../services/discogsClient.js";
import { saveDiscogsSelectionForStagingRow } from "../services/discogsSelectionService.js";
import { exportBlockedDiscogsLinksForRun, getBlockedDiscogsExportSummary } from "../services/blockedDiscogsExportService.js";
import { getDuplicateImportSummary, markDuplicateImportRowsAsSkip } from "../services/duplicateImportService.js";
import { getStagingDuplicateReview, markSelectedStagingDuplicatesAsSkip, physicallyDeleteSelectedStagingDuplicates } from "../services/stagingDuplicateRowService.js";
import { assertPreExportActionAllowed } from "../services/exportWorkflowGuardService.js";
import { addPatternsToStringDelPatterns, addPatternsToStringKeepPatterns, getPatternSuggestionsForRun, previewPatternSuggestionsForRun } from "../services/patternDiscoveryService.js";
import { logger } from "../config/logger.js";
import { scanImportDirectory, markFileAsAlreadyImported, unmarkFileAsAlreadyImported, assertCsvPathInsideDirectory } from "../services/importFileRegistryService.js";
import {
  createImportCandidatesFromFiles,
  importAllReadyCandidates,
  importCandidate,
  listImportCandidates,
  removeAllTemporaryImportCandidates,
  removeImportCandidate,
  saveImportCandidateMetadata,
  setImportCandidateDuplicateOverride
} from "../services/importUploadCandidateService.js";

export const router = express.Router();

const altSelectSchema = z.object({
  runId: z.string().uuid(),
  hl_positie: z.coerce.number().int().min(1),
  selected_fd_tag_title: z.string().trim().min(1).max(255)
});

/* --------------------------
   Helpers
-------------------------- */

function getViteDevOrigin() {
  return (
    process.env.VITE_DEV_ORIGIN ||
    `http://localhost:${process.env.VITE_PORT || 5173}`
  );
}

function renderPage(req, res, { title, state }) {
  const appHtml = renderApp(req.originalUrl, state);
  const isDev = process.env.NODE_ENV === "development";

  return res.render("layout", {
    title,
    appHtml,
    state,
    viteDevScript: isDev,
    viteDevOrigin: getViteDevOrigin(),
    cspNonce: res.locals.cspNonce
  });
}

function normalizePatternInput(s) {
  return String(s ?? "").trim().replace(/\s+/g, " ");
}

function routeDebugStart(route, extra = {}) {
  const startedAt = Date.now();
  logger.info("Edit debug route started", {
    module: "importhitlijst",
    feature: "editDebug",
    operation: route,
    ...extra
  });
  return startedAt;
}

function routeDebugEnd(route, startedAt, extra = {}) {
  logger.info("Edit debug route finished", {
    module: "importhitlijst",
    feature: "editDebug",
    operation: route,
    durationMs: Date.now() - startedAt,
    ...extra
  });
}

function routeDebugError(route, startedAt, error, extra = {}) {
  logger.error("Edit debug route failed", {
    module: "importhitlijst",
    feature: "editDebug",
    operation: route,
    durationMs: Date.now() - startedAt,
    error: error?.message || String(error),
    ...extra
  });
}

/* --------------------------
   Validation schemas
-------------------------- */

const stagingDuplicateSelectionSchema = z.object({
  stagingKeys: z.array(z.coerce.number().int().positive()).min(1).max(5000)
});

const stagingDuplicatePhysicalDeleteSchema = stagingDuplicateSelectionSchema.extend({
  confirmPhysicalDelete: z.literal(true)
});

const importBodySchema = z.object({
  hl_hitlijst: z.string().trim().min(1).max(255),
  hl_uitzendjaar: z.coerce.number().int().min(1900).max(2100),
  omroep_key: z.coerce.number().int().positive().optional(),
  periode_key: z.coerce.number().int().positive().optional()
});

const patternSchema = z.object({
  st_string_delete: z.string().trim().min(1).max(5000)
});

const discogsSearchQuerySchema = z.object({
  artist: z.string().trim().max(255).optional(),
  title: z.string().trim().max(255).optional(),
  type: z.enum(["master", "release"]).optional(),
  format: z.string().trim().max(80).optional(),
  year: z.coerce.number().int().min(1850).max(2200).optional(),
  country: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).max(100).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(25)
}).refine((value) => Boolean(value.artist || value.title), {
  message: "artist or title is required"
});

const discogsDetailsParamsSchema = z.object({
  type: z.enum(["master", "release"]),
  id: z.coerce.number().int().positive()
});

const discogsSelectionSchema = z.object({
  discogs_master_id: z.coerce.number().int().positive().optional().nullable(),
  discogs_master_url: z.string().trim().url().optional().nullable(),
  discogs_master_title: z.string().trim().max(500).optional().nullable(),
  discogs_master_artist: z.string().trim().max(500).optional().nullable(),
  discogs_master_year: z.coerce.number().int().min(1850).max(2200).optional().nullable(),
  discogs_release_id: z.coerce.number().int().positive().optional().nullable(),
  discogs_release_url: z.string().trim().url().optional().nullable(),
  discogs_release_title: z.string().trim().max(500).optional().nullable(),
  discogs_release_format: z.string().trim().max(255).optional().nullable(),
  discogs_release_country: z.string().trim().max(120).optional().nullable(),
  discogs_release_year: z.coerce.number().int().min(1850).max(2200).optional().nullable()
}).refine((value) => Boolean(value.discogs_master_id || value.discogs_release_id), {
  message: "discogs_master_id or discogs_release_id is required"
});


router.post("/api/client-error-log", async (req, res) => {
  logger.error("Client runtime error reported", {
    module: "importhitlijst",
    feature: "clientDebug",
    operation: "clientErrorLog",
    ...req.body
  });
  return res.json({ ok: true });
});

/* --------------------------
   Health
-------------------------- */

router.get("/api/health", (req, res) => res.json({ ok: true }));

router.get("/api/db-health", async (req, res) => {
  const result = await healthCheck();
  if (result.ok) return res.json(result);
  return res.status(503).json(result);
});

router.get("/api/metadata-options", async (req, res, next) => {
  try {
    res.json(await getMetadataOptions());
  } catch (e) {
    next(e);
  }
});

router.get("/api/song-types", async (req, res, next) => {
  try {
    res.json({ songTypes: await listSongTypes() });
  } catch (e) {
    next(e);
  }
});

router.get("/api/discogs/search", async (req, res, next) => {
  try {
    const parsed = discogsSearchQuerySchema.safeParse(req.query || {});
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
    }
    const result = await searchDiscogs(parsed.data);
    return res.json(result);
  } catch (e) {
    next(e);
  }
});


router.get("/api/discogs/details/:type/:id", async (req, res, next) => {
  try {
    const parsed = discogsDetailsParamsSchema.safeParse(req.params || {});
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
    }
    const result = await getDiscogsDetails(parsed.data);
    return res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post("/api/edit/staging/:runId/:hlPositie/discogs", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    const hlPositie = Number(req.params.hlPositie);
    if (!runId || !Number.isInteger(hlPositie)) {
      return res.status(400).json({ error: "runId and hlPositie are required" });
    }
    await assertPreExportActionAllowed(runId);

    const parsed = discogsSelectionSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
    }

    await client.query("BEGIN");
    const result = await saveDiscogsSelectionForStagingRow(client, runId, hlPositie, parsed.data);
    await client.query("COMMIT");
    return res.json(result);
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch { }
    next(e);
  } finally {
    client.release();
  }
});


router.get("/api/edit/run/:runId/duplicate-import-summary", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    if (!runId) return res.status(400).json({ error: "runId is required" });

    const summary = await getDuplicateImportSummary(client, runId);
    res.json({ ok: true, ...summary });
  } catch (e) {
    next(e);
  } finally {
    client.release();
  }
});

router.post("/api/edit/run/:runId/duplicates/skip", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    if (!runId) return res.status(400).json({ error: "runId is required" });
    await assertPreExportActionAllowed(runId);

    await client.query("BEGIN");
    const result = await markDuplicateImportRowsAsSkip(client, runId);
    await client.query("COMMIT");
    res.json(result);
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch { /* ignore rollback failure */ }
    next(e);
  } finally {
    client.release();
  }
});

router.get("/api/edit/run/:runId/staging-duplicates", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    if (!runId) return res.status(400).json({ error: "runId is required" });
    const review = await getStagingDuplicateReview(client, runId);
    return res.json({ ok: true, runId, ...review });
  } catch (e) {
    next(e);
  } finally {
    client.release();
  }
});

router.post("/api/edit/run/:runId/staging-duplicates/skip", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    if (!runId) return res.status(400).json({ error: "runId is required" });
    await assertPreExportActionAllowed(runId);
    const parsed = stagingDuplicateSelectionSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
    }
    await client.query("BEGIN");
    const result = await markSelectedStagingDuplicatesAsSkip(client, runId, parsed.data.stagingKeys);
    await client.query("COMMIT");
    return res.json(result);
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch { /* ignore rollback failure */ }
    next(e);
  } finally {
    client.release();
  }
});

router.post("/api/edit/run/:runId/staging-duplicates/delete", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    if (!runId) return res.status(400).json({ error: "runId is required" });
    await assertPreExportActionAllowed(runId);
    const parsed = stagingDuplicatePhysicalDeleteSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
    }
    await client.query("BEGIN");
    const result = await physicallyDeleteSelectedStagingDuplicates(client, runId, parsed.data.stagingKeys);
    await client.query("COMMIT");
    return res.json(result);
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch { /* ignore rollback failure */ }
    next(e);
  } finally {
    client.release();
  }
});

router.get("/api/edit/run/:runId/blocked-discogs-export-summary", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    if (!runId) return res.status(400).json({ error: "runId is required" });

    const result = await getBlockedDiscogsExportSummary({ client, runId });
    return res.json(result);
  } catch (e) {
    next(e);
  } finally {
    client.release();
  }
});

router.get("/api/edit/run/:runId/export-blocked-discogs-links.txt", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    if (!runId) return res.status(400).send("runId is required");

    const result = await exportBlockedDiscogsLinksForRun({ client, runId });
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    return res.send(result.content);
  } catch (e) {
    next(e);
  } finally {
    client.release();
  }
});

router.post("/api/edit/run/:runId/metadata", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    if (!runId) return res.status(400).json({ error: "runId is required" });

    const parsed = z.object({
      omroep_key: z.coerce.number().int().positive().optional(),
      periode_key: z.coerce.number().int().positive().optional()
    }).safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
    }

    await client.query("BEGIN");
    const result = await updateRunMetadata(client, runId, parsed.data);
    await client.query("COMMIT");
    res.json({ ok: true, ...result });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch { }
    next(e);
  } finally {
    client.release();
  }
});


router.post("/api/import-runs/:runId/metadata", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    if (!runId) return res.status(400).json({ error: "runId is required" });

    const parsed = z.object({
      omroep_key: z.coerce.number().int().positive(),
      periode_key: z.coerce.number().int().positive(),
      syncExportedHitlijsten: z.boolean().optional().default(true)
    }).safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
    }

    await client.query("BEGIN");
    const result = await updateRunMetadataAndSyncExported(client, runId, parsed.data);
    await client.query("COMMIT");
    res.json(result);
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch { }
    next(e);
  } finally {
    client.release();
  }
});

router.delete("/api/import-runs/:runId", async (req, res, next) => {
  try {
    const runId = String(req.params.runId || "").trim();
    if (!runId) return res.status(400).json({ error: "runId is required" });

    const result = await deleteImportRun(runId);
    return res.json(result);
  } catch (e) {
    if (e?.status) {
      return res.status(e.status).json({
        error: e.message || "Run verwijderen mislukt.",
        code: e.code || null,
        exportedRowCount: e.exportedRowCount ?? null
      });
    }
    next(e);
  }
});

/* --------------------------
   2H-AA Import candidate APIs
-------------------------- */

router.get("/api/import-candidates", async (req, res, next) => {
  try {
    res.json({ ok: true, candidates: await listImportCandidates() });
  } catch (error) {
    next(error);
  }
});

router.post("/api/import-candidates", uploadImportCandidateBatch, async (req, res, next) => {
  try {
    const source = String(req.body?.source || "FILE_PICKER").toUpperCase();
    const created = await createImportCandidatesFromFiles(req.files || [], { source });
    res.status(201).json({ ok: true, created, candidates: await listImportCandidates() });
  } catch (error) {
    next(error);
  }
});

router.patch("/api/import-candidates/:uploadId/metadata", async (req, res, next) => {
  try {
    const candidate = await saveImportCandidateMetadata(String(req.params.uploadId || ""), req.body?.metadata ?? req.body ?? {});
    res.json({ ok: true, candidate });
  } catch (error) {
    next(error);
  }
});

router.patch("/api/import-candidates/:uploadId/duplicate-override", async (req, res, next) => {
  try {
    const candidate = await setImportCandidateDuplicateOverride(
      String(req.params.uploadId || ""),
      req.body?.duplicateOverride === true
    );
    res.json({ ok: true, candidate });
  } catch (error) {
    next(error);
  }
});

router.post("/api/import-candidates/:uploadId/import", async (req, res, next) => {
  try {
    const result = await importCandidate(String(req.params.uploadId || ""));
    res.json({ ok: true, ...result, candidates: await listImportCandidates() });
  } catch (error) {
    next(error);
  }
});

router.post("/api/import-candidates/import-ready", async (req, res, next) => {
  try {
    const result = await importAllReadyCandidates();
    res.json({ ok: true, ...result, candidates: await listImportCandidates() });
  } catch (error) {
    next(error);
  }
});

router.delete("/api/import-candidates/:uploadId", async (req, res, next) => {
  try {
    const result = await removeImportCandidate(String(req.params.uploadId || ""));
    res.json({ ok: true, ...result, candidates: await listImportCandidates() });
  } catch (error) {
    next(error);
  }
});

router.delete("/api/import-candidates", async (req, res, next) => {
  try {
    const result = await removeAllTemporaryImportCandidates({ confirmed: req.body?.confirmed === true });
    res.json({ ok: true, ...result, candidates: await listImportCandidates() });
  } catch (error) {
    next(error);
  }
});

/* --------------------------
   SSR Pages
-------------------------- */

// ✅ Home = Runs (SSR)
router.get("/", async (req, res, next) => {
  try {
    const dbHealth = await healthCheck();
    const runs = await listRuns({ limit: 50 });
    const metadataOptions = await getMetadataOptions();
    const state = { page: "stagingResults", runs, dbHealth, metadataOptions };
    return renderPage(req, res, { title: "Import Runs", state });
  } catch (e) {
    next(e);
  }
});

router.get("/import", async (req, res, next) => {
  try {
    const dbHealth = await healthCheck();
    const metadataOptions = await getMetadataOptions();
    let importCandidates = [];
    let importCandidateFeatureError = null;
    try {
      importCandidates = await listImportCandidates();
    } catch (candidateError) {
      if (candidateError?.code === "42P01") {
        importCandidateFeatureError = "Database-migratie 2H-AA is nog niet uitgevoerd.";
      } else {
        throw candidateError;
      }
    }
    const directoryPath = String(req.query.directory || "").trim();
    const showImported = String(req.query.showImported || "") === "1";
    const selectedFile = String(req.query.selectedFile || "").trim();
    let directoryScan = null;
    let directoryError = null;

    if (directoryPath) {
      try {
        directoryScan = await scanImportDirectory(directoryPath, { showImported });
      } catch (error) {
        directoryError = { code: error.code || "READ_ERROR", message: error.message };
      }
    }

    const state = {
      page: "import",
      summary: null,
      rows: [],
      defaults: {},
      dbHealth,
      metadataOptions,
      directoryPath,
      showImported,
      selectedFile,
      directoryScan,
      directoryError,
      importCandidates,
      importCandidateFeatureError
    };
    return renderPage(req, res, { title: "Import Hitlijst CSV", state });
  } catch (error) {
    next(error);
  }
});

router.get("/edit", async (req, res) => {
  const dbHealth = await healthCheck();
  const state = { page: "edit", dbHealth };
  return renderPage(req, res, { title: "Edit staging", state });
});

router.get("/staging", async (req, res, next) => {
  try {
    const runId = String(req.query.runId || "");
    if (!runId) {
      res.status(400);
      throw new Error("Missing runId. Use /edit to select a run, or pass ?runId=...");
    }

    const rows = await findByRunId(runId);
    const dbHealth = await healthCheck();
    const state = { page: "staging", runId, rows, dbHealth };

    return renderPage(req, res, { title: "Staging Hitlijsten", state });
  } catch (e) {
    next(e);
  }
});

router.get("/string-patterns", async (req, res) => {
  const dbHealth = await healthCheck();
  const state = { page: "stringPatterns", dbHealth };
  return renderPage(req, res, { title: "String delete patterns", state });
});

/* --------------------------
   Import POST
-------------------------- */

router.post("/import", uploadCsv.single("csvFile"), async (req, res, next) => {
  try {
    const sourceDirectory = String(req.body.sourceDirectory || "").trim();
    const sourceFilePathRaw = String(req.body.sourceFilePath || "").trim();
    let filePath = req.file?.path || null;
    let originalFilename = req.file?.originalname || null;

    if (!filePath && sourceDirectory && sourceFilePathRaw) {
      filePath = assertCsvPathInsideDirectory(sourceDirectory, sourceFilePathRaw);
      originalFilename = filePath.split(/[\\/]/).pop();
    }
    if (!filePath) throw new Error("Selecteer een CSV-bestand uit de directory of upload een CSV-bestand.");

    const parsed = importBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
    }

    const { hl_hitlijst, hl_uitzendjaar, omroep_key, periode_key } = parsed.data;
    const dbHealth = await healthCheck();

    const result = await importHitlijstCsv({
      hl_hitlijst,
      hl_uitzendjaar,
      filePath,
      originalFilename,
      omroep_key: omroep_key ?? null,
      periode_key: periode_key ?? null,
      duplicateOverride: String(req.body.duplicateOverride || "") === "1",
      sourceDirectory: sourceDirectory || null
    });

    const runId = result.alreadyImported
      ? result.existingRun?.ir_run_id
      : result.summary?.runId;

    const state = {
      page: "import",
      summary: result.summary,
      rows: result.rows,
      runId: runId || null,
      alreadyImported: result.alreadyImported,
      existingRun: result.existingRun ?? null,
      defaults: { hl_hitlijst, hl_uitzendjaar, omroep_key, periode_key },
      metadataOptions: await getMetadataOptions(),
      dbHealth,
      directoryPath: sourceDirectory,
      showImported: String(req.body.showImported || "") === "1",
      selectedFile: originalFilename,
      selectedFilePath: sourceDirectory ? filePath : null,
      duplicateRequiresOverride: !!result.duplicateRequiresOverride,
      duplicateMatchType: result.duplicateMatchType || null,
      existingRegistry: result.existingRegistry || null
    };

    return renderPage(req, res, { title: "Import Hitlijst CSV", state });
  } catch (e) {
    next(e);
  }
});

router.post("/import/mark-imported", express.urlencoded({ extended: false }), async (req, res, next) => {
  try {
    const directoryPath = String(req.body.directoryPath || "").trim();
    const fileName = String(req.body.fileName || "").trim();
    if (!directoryPath || !fileName) return res.status(400).send("directoryPath and fileName are required");
    await markFileAsAlreadyImported({ directoryPath, fileName });
    const query = new URLSearchParams({ directory: directoryPath, showImported: String(req.body.showImported || "") === "1" ? "1" : "0" });
    res.redirect(`/import?${query.toString()}`);
  } catch (error) {
    next(error);
  }
});

router.post("/import/unmark-imported", express.urlencoded({ extended: false }), async (req, res, next) => {
  try {
    const registryKey = Number(req.body.registryKey);
    const directoryPath = String(req.body.directoryPath || "").trim();
    if (!Number.isInteger(registryKey)) return res.status(400).send("registryKey is required");
    await unmarkFileAsAlreadyImported(registryKey);
    const query = new URLSearchParams({ directory: directoryPath, showImported: "1" });
    res.redirect(`/import?${query.toString()}`);
  } catch (error) {
    next(error);
  }
});

router.post("/import/delete-run", async (req, res, next) => {
  try {
    const runId = String(req.body.runId || "");
    if (!runId) return res.status(400).send("runId is required");

    await deleteImportRun(runId);
    res.redirect("/import");
  } catch (e) {
    next(e);
  }
});

/* --------------------------
   Staging APIs (rest unchanged)
-------------------------- */

router.get("/api/staging", async (req, res, next) => {
  try {
    const runId = String(req.query.runId || "");
    if (!runId) return res.status(400).json({ error: "runId is required" });

    const rows = await findByRunId(runId);
    res.json({ rows });
  } catch (e) {
    next(e);
  }
});

// (… jouw overige endpoints blijven hetzelfde …)


// // routes/indexRoutes.js
// import express from "express";
// import { z } from "zod";

// import { renderApp } from "../src/server/ssr.js";
// import { uploadCsv, uploadImportCandidateBatch } from "../middleware/upload.js";
// import { healthCheck, pool } from "../config/db.js";

// import { listRuns } from "../models/import_runs.js";
// import { findByRunId, updateRowByRunAndPos } from "../models/staging_hitlijsten.js";
// import { importHitlijstCsv, deleteImportRun } from "../controllers/importController.js";

// import { decodeHtmlEntitiesForRun } from "../models/staging_hitlijsten.js";
// import { applyArtistSpellingForRun } from "../controllers/artistSpellingController.js";
// import { applySongSpellingForRun } from "../controllers/songSpellingController.js";
// import { applyPatternDeleteForRun } from "../controllers/patternDeleteController.js";
// import { altSpellingApply } from "../controllers/altSpellingController.js";

// import {
//   findFileDetailsByTagTitle,
//   findFileDetailsByCorrectArtist,
//   enrichFindCmdAndGetStatusForRun
// } from "../models/file_details.js";

// import {
//   listPatterns,
//   createPattern,
//   updatePattern,
//   deletePattern
// } from "../models/string_del_patterns.js";

// import { selectAltSpellingForRow } from "../controllers/altSpellingController.js";
// import { exportHitlijstenForRun } from "../controllers/exportHitlijstenController.js";
// import { getExportHitlijstenStatus } from "../models/hitlijsten.js";
// export const router = express.Router();

// const altSelectSchema = z.object({
//   runId: z.string().uuid(),
//   hl_positie: z.coerce.number().int().min(1),
//   selected_fd_tag_title: z.string().trim().min(1).max(255)
// });

// const viteDevOrigin =
//   process.env.VITE_DEV_ORIGIN || `http://localhost:${process.env.VITE_PORT || 5173}`;

// /* --------------------------
//    Helpers
// -------------------------- */

// function renderPage(req, res, { title, state }) {
//   const appHtml = renderApp(req.originalUrl, state);
//   return res.render("layout", {
//     title,
//     appHtml,
//     state,
//     cspNonce: res.locals.cspNonce,
//     viteDevScript: process.env.NODE_ENV === "development",
//     viteDevOrigin, // ✅ nieuw
//   });
// }

// function normalizePatternInput(s) {
//   return String(s ?? "").trim().replace(/\s+/g, " ");
// }

// /* --------------------------
//    Validation schemas
// -------------------------- */

// const importBodySchema = z.object({
//   hl_hitlijst: z.string().trim().min(1).max(255),
//   hl_uitzendjaar: z.coerce.number().int().min(1900).max(2100)
// });

// const patternSchema = z.object({
//   st_string_delete: z.string().trim().min(1).max(5000)
// });

// /* --------------------------
//    Health
// -------------------------- */

// router.get("/api/health", (req, res) => res.json({ ok: true }));

// router.get("/api/db-health", async (req, res) => {
//   const result = await healthCheck();
//   if (result.ok) return res.json(result);
//   return res.status(503).json(result);
// });

// /* --------------------------
//    SSR Pages
// -------------------------- */

// router.get("/import", async (req, res) => {
//   const dbHealth = await healthCheck();
//   const state = { page: "import", summary: null, rows: [], defaults: {}, dbHealth };
//   return renderPage(req, res, { title: "Import Hitlijst CSV", state });
// });

// router.get("/edit", async (req, res) => {
//   const dbHealth = await healthCheck();
//   const state = { page: "edit", dbHealth };
//   return renderPage(req, res, { title: "Edit staging", state });
// });

// router.get("/staging", async (req, res, next) => {
//   try {
//     const runId = String(req.query.runId || "");
//     if (!runId) {
//       res.status(400);
//       throw new Error("Missing runId. Use /edit to select a run, or pass ?runId=...");
//     }

//     const rows = await findByRunId(runId);
//     const dbHealth = await healthCheck();
//     const state = { page: "staging", runId, rows, dbHealth };

//     return renderPage(req, res, { title: "Staging Hitlijsten", state });
//   } catch (e) {
//     next(e);
//   }
// });

router.get("/string-patterns", async (req, res) => {
  const dbHealth = await healthCheck();
  const state = { page: "stringPatterns", dbHealth };
  return renderPage(req, res, { title: "String delete patterns", state });
});

/* --------------------------
   Import POST
-------------------------- */

router.post("/import", uploadCsv.single("csvFile"), async (req, res, next) => {
  try {
    if (!req.file?.path) throw new Error("No CSV file uploaded.");

    console.log("UPLOAD:", {
      path: req.file.path,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    const parsed = importBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
    }

    const { hl_hitlijst, hl_uitzendjaar } = parsed.data;
    const dbHealth = await healthCheck();

    const result = await importHitlijstCsv({
      hl_hitlijst,
      hl_uitzendjaar,
      filePath: req.file.path,
      originalFilename: req.file.originalname
    });

    const runId = result.alreadyImported
      ? result.existingRun?.ir_run_id
      : result.summary?.runId;

    const state = {
      page: "import",
      summary: result.summary,
      rows: result.rows,
      runId: runId || null,
      alreadyImported: result.alreadyImported,
      existingRun: result.existingRun ?? null,
      defaults: { hl_hitlijst, hl_uitzendjaar },
      dbHealth
    };

    return renderPage(req, res, { title: "Import Hitlijst CSV", state });
  } catch (e) {
    next(e);
  }
});

router.post("/import/delete-run", async (req, res, next) => {
  try {
    const runId = String(req.body.runId || "");
    if (!runId) return res.status(400).send("runId is required");

    await deleteImportRun(runId);
    res.redirect("/import");
  } catch (e) {
    next(e);
  }
});

/* --------------------------
   Staging APIs
-------------------------- */

router.get("/api/staging", async (req, res, next) => {
  try {
    const runId = String(req.query.runId || "");
    if (!runId) return res.status(400).json({ error: "runId is required" });

    const rows = await findByRunId(runId);
    res.json({ rows });
  } catch (e) {
    next(e);
  }
});

router.get("/api/staging-by-run", async (req, res, next) => {
  const startedAt = routeDebugStart("stagingByRun", { runId: String(req.query.runId || "") });
  try {
    const runId = String(req.query.runId || "");
    if (!runId) return res.status(400).json({ error: "runId is required" });

    const rows = await findByRunId(runId);
    routeDebugEnd("stagingByRun", startedAt, { runId, rowCount: Array.isArray(rows) ? rows.length : 0 });
    res.json({ rows });
  } catch (e) {
    routeDebugError("stagingByRun", startedAt, e, { runId: String(req.query.runId || "") });
    next(e);
  }
});

router.post("/api/staging-update", async (req, res, next) => {
  try {
    const runId = String(req.body.runId || "");
    const hl_positie = Number(req.body.hl_positie);
    const patch = req.body.patch;

    if (!runId || !Number.isInteger(hl_positie)) {
      return res.status(400).json({ error: "runId and hl_positie required" });
    }
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      return res.status(400).json({ error: "patch must be an object" });
    }
    if (Object.prototype.hasOwnProperty.call(patch, "hl_desired_song_type_key")) {
      const ok = await songTypeExists(patch.hl_desired_song_type_key);
      if (!ok) {
        return res.status(400).json({ error: "Unknown song type key for hl_desired_song_type_key" });
      }
    }
    await assertPreExportActionAllowed(runId);

    await updateRowByRunAndPos({ runId, hl_positie, patch });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get("/api/edit/staging/:runId/:hlPositie/diagnostics", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    const hlPositie = Number(req.params.hlPositie);
    if (!runId || !Number.isInteger(hlPositie)) {
      return res.status(400).json({ error: "runId and hlPositie are required" });
    }

    const diagnostics = await getStagingRowDiagnostics(client, runId, hlPositie);
    res.json(diagnostics);
  } catch (e) {
    next(e);
  } finally {
    client.release();
  }
});

router.post("/api/edit/staging/:runId/:hlPositie/repair-artist-relation", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    const hlPositie = Number(req.params.hlPositie);
    if (!runId || !Number.isInteger(hlPositie)) {
      return res.status(400).json({ error: "runId and hlPositie are required" });
    }

    await assertPreExportActionAllowed(runId);

    await client.query("BEGIN");
    const result = await repairArtistRelationForStagingRow(client, runId, hlPositie);
    await client.query("COMMIT");
    res.json(result);
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback error
    }
    next(e);
  } finally {
    client.release();
  }
});


router.post("/api/edit/run/:runId/repair-title-artist-swaps", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    if (!runId) {
      return res.status(400).json({ error: "runId is required" });
    }
    await assertPreExportActionAllowed(runId);

    await client.query("BEGIN");
    const result = await repairAllSuspectedTitleArtistSwapsForRun(client, runId);
    await client.query("COMMIT");
    res.json(result);
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback error
    }
    next(e);
  } finally {
    client.release();
  }
});

router.post("/api/edit/run/:runId/force-title-artist-swaps", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    const hlPosities = Array.isArray(req.body?.hlPosities) ? req.body.hlPosities : [];
    if (!runId) {
      return res.status(400).json({ error: "runId is required" });
    }
    await assertPreExportActionAllowed(runId);

    await client.query("BEGIN");
    const result = await forceSwapTitleArtistForPositions(client, runId, hlPosities);
    await client.query("COMMIT");
    res.json(result);
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback error
    }
    next(e);
  } finally {
    client.release();
  }
});

router.post("/api/edit/run/:runId/preview-normalize-text", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    const hlPosities = Array.isArray(req.body?.hlPosities) ? req.body.hlPosities : [];
    if (!runId) {
      return res.status(400).json({ error: "runId is required" });
    }

    await client.query("BEGIN");
    const result = await previewNormalizeTextForPositions(client, runId, hlPosities);
    await client.query("ROLLBACK");
    res.json(result);
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback error
    }
    next(e);
  } finally {
    client.release();
  }
});

router.post("/api/edit/run/:runId/normalize-text", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    const hlPosities = Array.isArray(req.body?.hlPosities) ? req.body.hlPosities : [];
    if (!runId) {
      return res.status(400).json({ error: "runId is required" });
    }
    await assertPreExportActionAllowed(runId);

    await client.query("BEGIN");
    const result = await normalizeTextForPositions(client, runId, hlPosities);
    await client.query("COMMIT");
    res.json(result);
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback error
    }
    next(e);
  } finally {
    client.release();
  }
});



router.post("/api/edit/run/:runId/preview-enrich-years", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    const hlPosities = Array.isArray(req.body?.hlPosities) ? req.body.hlPosities : [];
    if (!runId) {
      return res.status(400).json({ error: "runId is required" });
    }

    await client.query("BEGIN");
    const result = await previewYearEnrichmentForRun(client, runId, hlPosities);
    await client.query("ROLLBACK");
    res.json(result);
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch { }
    next(e);
  } finally {
    client.release();
  }
});

router.post("/api/edit/run/:runId/enrich-years", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    const hlPosities = Array.isArray(req.body?.hlPosities) ? req.body.hlPosities : [];
    if (!runId) {
      return res.status(400).json({ error: "runId is required" });
    }
    await assertPreExportActionAllowed(runId);

    await client.query("BEGIN");
    const result = await applyYearEnrichmentForRun(client, runId, hlPosities);
    await client.query("COMMIT");
    res.json(result);
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch { }
    next(e);
  } finally {
    client.release();
  }
});

router.post("/api/edit/run/:runId/preview-repair-encoding", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    const hlPosities = Array.isArray(req.body?.hlPosities) ? req.body.hlPosities : [];
    if (!runId) {
      return res.status(400).json({ error: "runId is required" });
    }

    await client.query("BEGIN");
    const result = await previewEncodingRepairForPositions(client, runId, hlPosities);
    await client.query("ROLLBACK");
    res.json(result);
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    next(e);
  } finally {
    client.release();
  }
});

router.post("/api/edit/run/:runId/repair-encoding", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    const hlPosities = Array.isArray(req.body?.hlPosities) ? req.body.hlPosities : [];
    if (!runId) {
      return res.status(400).json({ error: "runId is required" });
    }
    await assertPreExportActionAllowed(runId);

    await client.query("BEGIN");
    const result = await repairEncodingForPositions(client, runId, hlPosities);
    await client.query("COMMIT");
    res.json(result);
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    next(e);
  } finally {
    client.release();
  }
});


router.get("/api/edit/manual-repair-candidates", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const result = await searchManualRepairFileDetailsCandidates(client, {
      query: req.query?.query || req.query?.q || "",
      artist: req.query?.artist || "",
      title: req.query?.title || "",
      limit: req.query?.limit || 25
    });
    res.json(result);
  } catch (e) {
    next(e);
  } finally {
    client.release();
  }
});


router.post("/api/edit/staging/:runId/:hlPositie/post-export-correction/preview", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    const hlPositie = Number(req.params.hlPositie);
    const fdKey = Number(req.body?.fd_key ?? req.body?.fdKey);
    if (!runId || !Number.isInteger(hlPositie) || !Number.isInteger(fdKey)) {
      return res.status(400).json({ error: "runId, hlPositie and fd_key are required" });
    }

    await client.query("BEGIN");
    const result = await previewPostExportCorrection(client, {
      runId,
      hlPositie,
      fdKey,
      reason: req.body?.reason || null
    });
    await client.query("ROLLBACK");
    res.json(result);
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch { /* ignore rollback failure */ }
    if (e?.status) {
      return res.status(e.status).json({ error: e.message, code: e.code || null, preview: e.preview || null });
    }
    next(e);
  } finally {
    client.release();
  }
});

router.post("/api/edit/staging/:runId/:hlPositie/post-export-correction/apply", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    const hlPositie = Number(req.params.hlPositie);
    const fdKey = Number(req.body?.fd_key ?? req.body?.fdKey);
    if (!runId || !Number.isInteger(hlPositie) || !Number.isInteger(fdKey)) {
      return res.status(400).json({ error: "runId, hlPositie and fd_key are required" });
    }

    await client.query("BEGIN");
    const result = await applyPostExportCorrection(client, {
      runId,
      hlPositie,
      fdKey,
      reason: req.body?.reason || null,
      confirmComposedTextOnly: req.body?.confirmComposedTextOnly === true
    });
    await client.query("COMMIT");
    res.json(result);
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch { /* ignore rollback failure */ }
    if (e?.status) {
      return res.status(e.status).json({ error: e.message, code: e.code || null, preview: e.preview || null });
    }
    next(e);
  } finally {
    client.release();
  }
});

router.post("/api/edit/staging/:runId/:hlPositie/manual-file-details-repair", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    const hlPositie = Number(req.params.hlPositie);
    const fdKey = Number(req.body?.fd_key ?? req.body?.fdKey);
    if (!runId || !Number.isInteger(hlPositie) || !Number.isInteger(fdKey)) {
      return res.status(400).json({ error: "runId, hlPositie and fd_key are required" });
    }

    await assertPreExportActionAllowed(runId);

    await client.query("BEGIN");
    const result = await applyManualRepairFromFileDetails(client, runId, hlPositie, fdKey);
    await client.query("COMMIT");
    res.json(result);
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback error
    }
    next(e);
  } finally {
    client.release();
  }
});

router.post("/api/edit/staging/:runId/:hlPositie/manual-correction", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    const hlPositie = Number(req.params.hlPositie);
    if (!runId || !Number.isInteger(hlPositie)) {
      return res.status(400).json({ error: "runId and hlPositie are required" });
    }

    await assertPreExportActionAllowed(runId);

    await client.query("BEGIN");
    const result = await saveManualStagingCorrection(client, runId, hlPositie, req.body || {});
    await client.query("COMMIT");
    res.json(result);
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback error
    }
    next(e);
  } finally {
    client.release();
  }
});

router.post("/api/edit/staging/:runId/:hlPositie/repair-title-artist-swap", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const runId = String(req.params.runId || "").trim();
    const hlPositie = Number(req.params.hlPositie);
    if (!runId || !Number.isInteger(hlPositie)) {
      return res.status(400).json({ error: "runId and hlPositie are required" });
    }

    await assertPreExportActionAllowed(runId);

    await client.query("BEGIN");
    const result = await repairSwappedTitleArtistForStagingRow(client, runId, hlPositie);
    await client.query("COMMIT");
    res.json(result);
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback error
    }
    next(e);
  } finally {
    client.release();
  }
});

/* --------------------------
   Run-wide tools
-------------------------- */

router.post("/api/run-decode-html", async (req, res, next) => {
  try {
    const runId = String(req.body.runId || "");
    if (!runId) return res.status(400).json({ error: "runId is required" });
    await assertPreExportActionAllowed(runId);

    const result = await decodeHtmlEntitiesForRun(runId);
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

router.post("/api/run-artistspelling", async (req, res, next) => {
  try {
    const runId = String(req.body.runId || "");
    if (!runId) return res.status(400).json({ error: "runId is required" });
    await assertPreExportActionAllowed(runId);

    const stats = await applyArtistSpellingForRun(runId);
    res.json({ ok: true, stats });
  } catch (e) {
    next(e);
  }
});

router.post("/api/run-songspelling", async (req, res, next) => {
  try {
    const runId = String(req.body.runId || "");
    if (!runId) return res.status(400).json({ error: "runId is required" });
    await assertPreExportActionAllowed(runId);

    const stats = await applySongSpellingForRun(runId);
    res.json({ ok: true, stats });
  } catch (e) {
    next(e);
  }
});

router.post("/api/run-pattern-delete", async (req, res, next) => {
  try {
    const runId = String(req.body.runId || "");
    if (!runId) return res.status(400).json({ error: "runId is required" });
    if (req.body?.dryRun !== true) {
      await assertPreExportActionAllowed(runId);
    }

    const dryRun = req.body?.dryRun === true;
    const previewLimit = Number.isInteger(req.body?.previewLimit) ? req.body.previewLimit : 20;

    const result = await applyPatternDeleteForRun(runId, { dryRun, previewLimit });
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

/* --------------------------
   NEW: Export staging -> hitlijsten
-------------------------- */

router.post("/api/run-export-hitlijsten", exportHitlijstenForRun);

// Precheck: can we export staging -> hitlijsten without producing NULL fd_key?
router.get("/api/run-export-hitlijsten-status", async (req, res, next) => {
  const startedAt = routeDebugStart("exportHitlijstenStatus", { runId: String(req.query.runId || "") });
  try {
    const runId = String(req.query.runId || "");
    if (!runId) return res.status(400).json({ error: "runId is required" });

    const status = await getExportHitlijstenStatus(runId);
    routeDebugEnd("exportHitlijstenStatus", startedAt, {
      runId,
      missingLinks: Number(status?.missingLinks ?? 0),
      missingFdTagTitle: Number(status?.missingFdTagTitle ?? 0),
      missingHlArtistKey: Number(status?.missingHlArtistKey ?? 0),
      multipleLinks: Number(status?.multipleLinks ?? 0),
      issuesPreviewCount: Array.isArray(status?.issuesPreview) ? status.issuesPreview.length : 0
    });
    res.json({ ok: true, ...status });
  } catch (e) {
    routeDebugError("exportHitlijstenStatus", startedAt, e, { runId: String(req.query.runId || "") });
    next(e);
  }
});

// Download: export all filled hl_find_cmd values for a run into a Unix script
router.get("/api/run-findcmd-script", async (req, res, next) => {
  try {
    const runId = String(req.query.runId || "");
    const target = String(req.query.target || "").trim();

    if (!runId) return res.status(400).send("runId is required");
    if (!target) return res.status(400).send("target is required");

    const client = await pool.connect();

    try {
      const q = await client.query(
        `
        SELECT hl_find_cmd
        FROM public.staging_hitlijsten
        WHERE hl_import_run_id = $1
          AND hl_find_cmd IS NOT NULL
          AND BTRIM(hl_find_cmd) <> ''
        ORDER BY hl_positie
        `,
        [runId]
      );

      const lines = [
        "#!/usr/bin/env bash",
        `export TARGET=${JSON.stringify(target)}`,
        ""
      ];

      for (const row of q.rows) {
        lines.push(String(row.hl_find_cmd));
      }

      const script = lines.join("\n") + "\n";
      const filename = `find_cmds_run_${runId}.sh`;

      res.setHeader("Content-Type", "text/x-shellscript; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(script);
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

/* --------------------------
   Edit support
-------------------------- */

router.get("/api/import-runs", async (req, res, next) => {
  try {
    const hl_hitlijst = req.query.hl_hitlijst ? String(req.query.hl_hitlijst) : null;
    const hl_uitzendjaar = req.query.hl_uitzendjaar ? Number(req.query.hl_uitzendjaar) : null;
    const runs = await listRuns({ hl_hitlijst, hl_uitzendjaar });
    res.json({ runs });
  } catch (e) {
    next(e);
  }
});


/* --------------------------
   Pattern discovery suggestions
-------------------------- */

const patternSuggestionBodySchema = z.object({
  patterns: z.array(z.string().trim().min(1).max(5000)).min(1).max(100)
});

router.get("/api/edit/runs/:runId/pattern-suggestions", async (req, res, next) => {
  try {
    const runId = String(req.params.runId || "");
    if (!runId) return res.status(400).json({ error: "runId is required" });
    const result = await getPatternSuggestionsForRun(runId);
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

router.post("/api/edit/runs/:runId/pattern-suggestions/preview", async (req, res, next) => {
  try {
    const runId = String(req.params.runId || "");
    if (!runId) return res.status(400).json({ error: "runId is required" });
    const parsed = patternSuggestionBodySchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
    }
    const result = await previewPatternSuggestionsForRun(runId, parsed.data.patterns);
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

router.post("/api/edit/runs/:runId/pattern-suggestions/add", async (req, res, next) => {
  try {
    const runId = String(req.params.runId || "");
    if (!runId) return res.status(400).json({ error: "runId is required" });
    const parsed = patternSuggestionBodySchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
    }
    const result = await addPatternsToStringDelPatterns(parsed.data.patterns);
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

router.post("/api/edit/runs/:runId/pattern-suggestions/add-keep", async (req, res, next) => {
  try {
    const runId = String(req.params.runId || "");
    if (!runId) return res.status(400).json({ error: "runId is required" });
    const parsed = patternSuggestionBodySchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
    }
    const result = await addPatternsToStringKeepPatterns(parsed.data.patterns);
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

/* --------------------------
   String delete patterns CRUD
-------------------------- */

router.get("/api/string-patterns", async (req, res, next) => {
  try {
    const rows = await listPatterns();
    res.json({ rows });
  } catch (e) {
    next(e);
  }
});

router.post("/api/string-patterns", async (req, res, next) => {
  try {
    const input = { st_string_delete: normalizePatternInput(req.body?.st_string_delete) };
    const parsed = patternSchema.safeParse(input);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
    }

    try {
      const row = await createPattern(parsed.data.st_string_delete);
      return res.json({ ok: true, row });
    } catch (e) {
      if (e?.code === "23505") return res.status(409).json({ error: "Pattern already exists." });
      throw e;
    }
  } catch (e) {
    next(e);
  }
});

router.put("/api/string-patterns/:st_key", async (req, res, next) => {
  try {
    const st_key = Number(req.params.st_key);
    if (!Number.isInteger(st_key)) return res.status(400).json({ error: "Invalid st_key" });

    const input = { st_string_delete: normalizePatternInput(req.body?.st_string_delete) };
    const parsed = patternSchema.safeParse(input);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
    }

    try {
      const row = await updatePattern(st_key, parsed.data.st_string_delete);
      if (!row) return res.status(404).json({ error: "Not found" });
      return res.json({ ok: true, row });
    } catch (e) {
      if (e?.code === "23505") return res.status(409).json({ error: "Pattern already exists." });
      throw e;
    }
  } catch (e) {
    next(e);
  }
});

router.delete("/api/string-patterns/:st_key", async (req, res, next) => {
  try {
    const st_key = Number(req.params.st_key);
    if (!Number.isInteger(st_key)) return res.status(400).json({ error: "Invalid st_key" });

    const deleted = await deletePattern(st_key);
    if (!deleted) return res.status(404).json({ error: "Not found" });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/* --------------------------
   File details routes
-------------------------- */

router.get("/api/run-filedetails-status", async (req, res, next) => {
  const startedAt = routeDebugStart("runFileDetailsStatus", { runId: String(req.query.runId || "") });
  try {
    const runId = String(req.query.runId || "");
    if (!runId) return res.status(400).json({ error: "runId is required" });

    const statuses = await enrichFindCmdAndGetStatusForRun(runId);
    routeDebugEnd("runFileDetailsStatus", startedAt, {
      runId,
      statusCount: Array.isArray(statuses) ? statuses.length : 0
    });
    res.json({ ok: true, statuses });
  } catch (e) {
    routeDebugError("runFileDetailsStatus", startedAt, e, { runId: String(req.query.runId || "") });
    next(e);
  }
});

router.get("/api/file-details", async (req, res, next) => {
  try {
    const tagTitle = String(req.query.fd_tag_title || "");
    if (!tagTitle.trim()) return res.status(400).json({ error: "fd_tag_title is required" });

    const rows = await findFileDetailsByTagTitle(tagTitle.trim());
    res.json({ ok: true, rows });
  } catch (e) {
    next(e);
  }
});

router.get("/api/file-details-by-artist", async (req, res, next) => {
  try {
    const artist = String(req.query.fd_correct_artist || "").trim();
    if (!artist) return res.status(400).json({ error: "fd_correct_artist is required" });

    const rows = await findFileDetailsByCorrectArtist(artist);
    res.json({ ok: true, rows });
  } catch (e) {
    next(e);
  }
});

router.post("/api/altspelling/select", async (req, res, next) => {
  try {
    const parsed = altSelectSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
    }

    const { runId, hl_positie, selected_fd_tag_title } = parsed.data;
    const result = await selectAltSpellingForRow({
      runId,
      hl_positie,
      selectedFdTagTitle: selected_fd_tag_title
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post("/api/altspelling-apply", altSpellingApply);

/* --------------------------
   Root
-------------------------- */

router.get("/", async (req, res, next) => {
  try {
    const dbHealth = await healthCheck();
    const runs = await listRuns({ limit: 50 });

    const state = {
      page: "stagingResults",
      runs,
      dbHealth
    };

    return renderPage(req, res, { title: "Import Runs", state });
  } catch (e) {
    next(e);
  }
});
