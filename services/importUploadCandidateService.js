import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { logger } from "../config/logger.js";
import { importHitlijstCsv } from "../controllers/importController.js";
import { findRegistryMatches } from "../models/import_file_registry.js";
import {
  createImportUploadCandidate,
  deleteImportUploadCandidate,
  getImportUploadCandidate,
  listExpiredImportUploadCandidates,
  listImportUploadCandidates,
  listReadyImportUploadCandidates,
  listTemporaryImportUploadCandidates,
  markImportUploadCandidateError,
  markImportUploadCandidateImported,
  updateImportUploadCandidateDuplicate,
  updateImportUploadCandidateMetadata,
  updateImportUploadCandidateOverride
} from "../models/import_upload_candidates.js";
import { readCsvRows } from "../utils/csvReader.js";
import { sha256File } from "../utils/fileHash.js";
import { calculateListFingerprint } from "../utils/listFingerprint.js";

function positiveIntEnv(name, fallback) {
  const value = Number.parseInt(String(process.env[name] ?? ""), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const IMPORT_UPLOAD_MAX_FILE_MB = positiveIntEnv("IMPORT_UPLOAD_MAX_FILE_MB", 25);
export const IMPORT_UPLOAD_MAX_BATCH_FILES = positiveIntEnv("IMPORT_UPLOAD_MAX_BATCH_FILES", 50);
export const IMPORT_UPLOAD_RETENTION_DAYS = positiveIntEnv("IMPORT_UPLOAD_RETENTION_DAYS", 7);
export const IMPORT_UPLOAD_CLEANUP_INTERVAL_MINUTES = positiveIntEnv("IMPORT_UPLOAD_CLEANUP_INTERVAL_MINUTES", 60);
export const IMPORT_UPLOAD_ROOT = path.resolve(process.env.IMPORT_UPLOAD_TEMP_DIR || "uploads/import-candidates");

export const candidateMetadataSchema = z.object({
  hl_hitlijst: z.string().trim().min(1).max(255),
  hl_uitzendjaar: z.coerce.number().int().min(1900).max(2100),
  omroep_key: z.coerce.number().int().positive(),
  periode_key: z.coerce.number().int().positive()
});

const candidateMetadataPatchSchema = z.object({
  hl_hitlijst: z.string().max(255).optional(),
  hl_uitzendjaar: z.union([z.string(), z.number(), z.null()]).optional(),
  omroep_key: z.union([z.string(), z.number(), z.null()]).optional(),
  periode_key: z.union([z.string(), z.number(), z.null()]).optional()
}).strict();

function normalizeDraftValue(value) {
  if (value === null || value === undefined) return "";
  return value;
}

export function normalizeCandidateMetadata(input = {}) {
  const parsed = candidateMetadataPatchSchema.safeParse(input ?? {});
  if (!parsed.success) {
    const error = new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
    error.code = "INVALID_CANDIDATE_METADATA";
    error.status = 400;
    throw error;
  }
  return {
    hl_hitlijst: String(normalizeDraftValue(parsed.data.hl_hitlijst)).trim(),
    hl_uitzendjaar: normalizeDraftValue(parsed.data.hl_uitzendjaar),
    omroep_key: normalizeDraftValue(parsed.data.omroep_key),
    periode_key: normalizeDraftValue(parsed.data.periode_key)
  };
}

export function validateCandidateMetadata(metadata = {}) {
  return candidateMetadataSchema.safeParse(metadata);
}

export function deriveCandidateStatus({ currentStatus, metadata, parseError, imported = false }) {
  if (imported || currentStatus === "IMPORTED") return "IMPORTED";
  if (parseError || currentStatus === "PARSE_ERROR") return "PARSE_ERROR";
  return validateCandidateMetadata(metadata).success ? "READY" : "METADATA_INCOMPLETE";
}

export function resolveDuplicateType(matches) {
  if (matches?.fileMatch) return "EXACT_FILE";
  if (matches?.listMatch) return "SAME_LIST_CONTENT";
  return null;
}

export function resolveCandidateStoragePath(storageFileName) {
  if (!storageFileName || path.basename(storageFileName) !== storageFileName) {
    const error = new Error("Ongeldige tijdelijke bestandsnaam.");
    error.code = "INVALID_CANDIDATE_STORAGE_PATH";
    error.status = 400;
    throw error;
  }
  const resolved = path.resolve(IMPORT_UPLOAD_ROOT, storageFileName);
  if (path.dirname(resolved) !== IMPORT_UPLOAD_ROOT) {
    const error = new Error("Tijdelijk bestand valt buiten de toegestane uploadmap.");
    error.code = "INVALID_CANDIDATE_STORAGE_PATH";
    error.status = 400;
    throw error;
  }
  return resolved;
}

function candidateDto(row) {
  if (!row) return null;
  return {
    uploadId: row.iuc_upload_id,
    source: row.iuc_source,
    originalFileName: row.iuc_original_file_name,
    fileSize: Number(row.iuc_file_size ?? 0),
    fileSha256: row.iuc_file_sha256 ?? null,
    listFingerprint: row.iuc_list_fingerprint ?? null,
    rowCount: row.iuc_row_count == null ? null : Number(row.iuc_row_count),
    status: row.iuc_status,
    duplicateType: row.iuc_duplicate_type ?? null,
    duplicateRegistryKey: row.iuc_duplicate_registry_key == null ? null : Number(row.iuc_duplicate_registry_key),
    duplicateOverride: !!row.iuc_duplicate_override,
    metadata: row.iuc_metadata ?? {},
    parseError: row.iuc_parse_error ?? null,
    importError: row.iuc_import_error ?? null,
    importRunId: row.iuc_import_run_id ?? null,
    createdAt: row.iuc_created_at ?? null,
    updatedAt: row.iuc_updated_at ?? null,
    expiresAt: row.iuc_expires_at ?? null,
    importedAt: row.iuc_imported_at ?? null,
    duplicateRegistry: row.duplicate_registry_file_name
      ? {
          fileName: row.duplicate_registry_file_name,
          importedAt: row.duplicate_registry_imported_at ?? row.duplicate_registry_manually_marked_at ?? null
        }
      : null
  };
}

async function deleteTempFile(storageFileName) {
  if (!storageFileName) return false;
  const filePath = resolveCandidateStoragePath(storageFileName);
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function expiresAtFromNow() {
  return new Date(Date.now() + IMPORT_UPLOAD_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

export async function ensureImportUploadRoot() {
  await fs.mkdir(IMPORT_UPLOAD_ROOT, { recursive: true });
  return IMPORT_UPLOAD_ROOT;
}

export async function listImportCandidates() {
  return (await listImportUploadCandidates()).map(candidateDto);
}

export async function createImportCandidatesFromFiles(files, { source = "DRAG_DROP" } = {}) {
  const batch = Array.isArray(files) ? files : [];
  if (batch.length === 0) {
    const error = new Error("Selecteer minimaal één CSV-bestand.");
    error.code = "NO_IMPORT_FILES";
    error.status = 400;
    throw error;
  }
  if (batch.length > IMPORT_UPLOAD_MAX_BATCH_FILES) {
    const error = new Error(`Maximaal ${IMPORT_UPLOAD_MAX_BATCH_FILES} CSV-bestanden per batch.`);
    error.code = "IMPORT_BATCH_TOO_LARGE";
    error.status = 400;
    throw error;
  }

  await ensureImportUploadRoot();
  const created = [];
  for (const file of batch) {
    const originalFileName = String(file.originalname ?? "").trim();
    if (!originalFileName.toLowerCase().endsWith(".csv")) {
      await fs.unlink(file.path).catch(() => {});
      const error = new Error(`Alleen CSV-bestanden zijn toegestaan: ${originalFileName || "onbekend bestand"}.`);
      error.code = "INVALID_FILE_TYPE";
      error.status = 400;
      throw error;
    }
    if (Number(file.size) > IMPORT_UPLOAD_MAX_FILE_MB * 1024 * 1024) {
      await fs.unlink(file.path).catch(() => {});
      const error = new Error(`Bestand ${originalFileName} is groter dan ${IMPORT_UPLOAD_MAX_FILE_MB} MB.`);
      error.code = "IMPORT_FILE_TOO_LARGE";
      error.status = 400;
      throw error;
    }

    const uploadId = crypto.randomUUID();
    const storageFileName = path.basename(file.filename || path.basename(file.path));
    let fileSha256 = null;
    let listFingerprint = null;
    let rowCount = null;
    let duplicateType = null;
    let duplicateRegistryKey = null;
    let status = "METADATA_INCOMPLETE";
    let parseError = null;

    try {
      fileSha256 = await sha256File(file.path);
      const parsedCsv = await readCsvRows(file.path);
      const fingerprint = calculateListFingerprint(parsedCsv.rows);
      listFingerprint = fingerprint.listFingerprint;
      rowCount = parsedCsv.rows.length;
      const matches = await findRegistryMatches({ fileSha256, listFingerprint });
      duplicateType = resolveDuplicateType(matches);
      duplicateRegistryKey = matches.fileMatch?.ifr_key ?? matches.listMatch?.ifr_key ?? null;
    } catch (error) {
      status = "PARSE_ERROR";
      parseError = error?.message || "CSV kan niet worden verwerkt.";
    }

    try {
      const row = await createImportUploadCandidate({
        uploadId,
        source: ["DRAG_DROP", "FILE_PICKER"].includes(source) ? source : "FILE_PICKER",
        originalFileName,
        storageFileName,
        fileSize: Number(file.size) || 0,
        fileSha256,
        listFingerprint,
        rowCount,
        status,
        duplicateType,
        duplicateRegistryKey,
        metadata: {},
        parseError,
        expiresAt: expiresAtFromNow()
      });
      created.push(candidateDto(row));
      logger.info("Import upload candidate created", {
        feature: "dragDropCsvImport",
        operation: "createCandidate",
        uploadId,
        originalFileName,
        fileSize: Number(file.size) || 0,
        status,
        duplicateType
      });
    } catch (error) {
      await deleteTempFile(storageFileName).catch(() => {});
      throw error;
    }
  }
  return created;
}

export async function saveImportCandidateMetadata(uploadId, patch) {
  const existing = await getImportUploadCandidate(uploadId);
  if (!existing) {
    const error = new Error("Importkandidaat niet gevonden.");
    error.code = "IMPORT_CANDIDATE_NOT_FOUND";
    error.status = 404;
    throw error;
  }
  if (existing.iuc_status === "IMPORTED") {
    const error = new Error("Geïmporteerde kandidaat kan niet meer worden gewijzigd.");
    error.code = "IMPORT_CANDIDATE_ALREADY_IMPORTED";
    error.status = 409;
    throw error;
  }
  const normalizedPatch = normalizeCandidateMetadata({ ...(existing.iuc_metadata ?? {}), ...(patch ?? {}) });
  const status = deriveCandidateStatus({
    currentStatus: existing.iuc_status,
    metadata: normalizedPatch,
    parseError: existing.iuc_parse_error
  });
  const updated = await updateImportUploadCandidateMetadata(uploadId, { metadata: normalizedPatch, status });
  return candidateDto({ ...updated, duplicate_registry_file_name: existing.duplicate_registry_file_name, duplicate_registry_imported_at: existing.duplicate_registry_imported_at, duplicate_registry_manually_marked_at: existing.duplicate_registry_manually_marked_at });
}

export async function setImportCandidateDuplicateOverride(uploadId, duplicateOverride) {
  const existing = await getImportUploadCandidate(uploadId);
  if (!existing) {
    const error = new Error("Importkandidaat niet gevonden.");
    error.code = "IMPORT_CANDIDATE_NOT_FOUND";
    error.status = 404;
    throw error;
  }
  const updated = await updateImportUploadCandidateOverride(uploadId, !!duplicateOverride);
  return candidateDto({ ...updated, duplicate_registry_file_name: existing.duplicate_registry_file_name, duplicate_registry_imported_at: existing.duplicate_registry_imported_at, duplicate_registry_manually_marked_at: existing.duplicate_registry_manually_marked_at });
}

function assertImportableCandidate(candidate) {
  if (!candidate) {
    const error = new Error("Importkandidaat niet gevonden.");
    error.code = "IMPORT_CANDIDATE_NOT_FOUND";
    error.status = 404;
    throw error;
  }
  if (candidate.iuc_status === "IMPORTED") {
    const error = new Error("Deze kandidaat is al geïmporteerd.");
    error.code = "IMPORT_CANDIDATE_ALREADY_IMPORTED";
    error.status = 409;
    throw error;
  }
  if (candidate.iuc_status === "PARSE_ERROR" || candidate.iuc_parse_error) {
    const error = new Error(candidate.iuc_parse_error || "CSV kan niet worden verwerkt.");
    error.code = "IMPORT_CANDIDATE_PARSE_ERROR";
    error.status = 400;
    throw error;
  }
  const metadataResult = validateCandidateMetadata(candidate.iuc_metadata ?? {});
  if (!metadataResult.success) {
    const error = new Error("Metadata is nog niet compleet of geldig.");
    error.code = "IMPORT_CANDIDATE_METADATA_INCOMPLETE";
    error.status = 400;
    throw error;
  }
  if (!candidate.iuc_storage_file_name) {
    const error = new Error("Tijdelijk CSV-bestand is niet meer beschikbaar.");
    error.code = "IMPORT_CANDIDATE_FILE_MISSING";
    error.status = 410;
    throw error;
  }
  return metadataResult.data;
}

export async function importCandidate(uploadId) {
  const candidate = await getImportUploadCandidate(uploadId);
  let metadata;
  try {
    metadata = assertImportableCandidate(candidate);
  } catch (error) {
    if (error.code === "IMPORT_CANDIDATE_METADATA_INCOMPLETE") {
      await updateImportUploadCandidateMetadata(uploadId, { metadata: candidate?.iuc_metadata ?? {}, status: "METADATA_INCOMPLETE" }).catch(() => {});
    }
    throw error;
  }

  if (candidate.iuc_duplicate_type && !candidate.iuc_duplicate_override) {
    return { outcome: "BLOCKED_DUPLICATE", candidate: candidateDto(candidate) };
  }

  const filePath = resolveCandidateStoragePath(candidate.iuc_storage_file_name);
  try {
    const result = await importHitlijstCsv({
      ...metadata,
      filePath,
      originalFilename: candidate.iuc_original_file_name,
      duplicateOverride: !!candidate.iuc_duplicate_override,
      sourceDirectory: "drag-drop-upload"
    });

    if (result.alreadyImported) {
      const registry = result.existingRegistry ?? null;
      const duplicateType = result.duplicateMatchType || candidate.iuc_duplicate_type || "SAME_LIST_CONTENT";
      const updated = await updateImportUploadCandidateDuplicate(uploadId, {
        duplicateType,
        duplicateRegistryKey: registry?.ifr_key ?? candidate.iuc_duplicate_registry_key ?? null
      });
      return { outcome: "BLOCKED_DUPLICATE", candidate: candidateDto(updated), result };
    }

    await deleteTempFile(candidate.iuc_storage_file_name);
    const updated = await markImportUploadCandidateImported(uploadId, result.summary?.runId ?? null);
    logger.info("Import upload candidate imported", {
      feature: "dragDropCsvImport",
      operation: "importCandidate",
      uploadId,
      importRunId: result.summary?.runId ?? null
    });
    return { outcome: "IMPORTED", candidate: candidateDto(updated), result };
  } catch (error) {
    const updated = await markImportUploadCandidateError(uploadId, error?.message || "Importfout").catch(() => candidate);
    logger.error("Import upload candidate failed", {
      feature: "dragDropCsvImport",
      operation: "importCandidate",
      uploadId,
      message: error?.message
    });
    return { outcome: "IMPORT_ERROR", candidate: candidateDto(updated), error: error?.message || "Importfout" };
  }
}

export async function importAllReadyCandidates() {
  const ready = await listReadyImportUploadCandidates();
  const items = [];
  const summary = { imported: 0, blockedDuplicate: 0, importError: 0, total: ready.length };
  for (const row of ready) {
    const result = await importCandidate(row.iuc_upload_id);
    items.push({
      uploadId: row.iuc_upload_id,
      originalFileName: row.iuc_original_file_name,
      outcome: result.outcome,
      importRunId: result.candidate?.importRunId ?? result.result?.summary?.runId ?? null,
      error: result.error ?? null
    });
    if (result.outcome === "IMPORTED") summary.imported += 1;
    else if (result.outcome === "BLOCKED_DUPLICATE") summary.blockedDuplicate += 1;
    else summary.importError += 1;
  }
  return { summary, items };
}

export async function removeImportCandidate(uploadId) {
  const candidate = await getImportUploadCandidate(uploadId);
  if (!candidate) return { removed: false };
  if (candidate.iuc_status === "IMPORTED") {
    const error = new Error("Een geïmporteerde kandidaat wordt alleen door retentie-cleanup verwijderd.");
    error.code = "IMPORT_CANDIDATE_DELETE_NOT_ALLOWED";
    error.status = 409;
    throw error;
  }
  await deleteTempFile(candidate.iuc_storage_file_name).catch((error) => {
    logger.warn("Temporary candidate file cleanup failed", { uploadId, message: error.message });
  });
  await deleteImportUploadCandidate(uploadId);
  return { removed: true };
}

export async function removeAllTemporaryImportCandidates({ confirmed = false } = {}) {
  if (!confirmed) {
    const error = new Error("Bevestiging is vereist voor het verwijderen van alle tijdelijke bestanden.");
    error.code = "IMPORT_CANDIDATE_DELETE_CONFIRM_REQUIRED";
    error.status = 400;
    throw error;
  }
  const candidates = await listTemporaryImportUploadCandidates();
  let removed = 0;
  const errors = [];
  for (const candidate of candidates) {
    try {
      await deleteTempFile(candidate.iuc_storage_file_name);
      await deleteImportUploadCandidate(candidate.iuc_upload_id);
      removed += 1;
    } catch (error) {
      errors.push({ uploadId: candidate.iuc_upload_id, message: error.message });
    }
  }
  return { removed, errors };
}

export async function cleanupExpiredImportCandidates() {
  let candidates;
  try {
    candidates = await listExpiredImportUploadCandidates();
  } catch (error) {
    if (error?.code === "42P01") {
      logger.warn("Import candidate cleanup skipped; migration 2H-AA not applied yet", {
        feature: "dragDropCsvImport",
        operation: "cleanupExpired"
      });
      return { removed: 0, errors: [], schemaMissing: true };
    }
    throw error;
  }

  let removed = 0;
  const errors = [];
  for (const candidate of candidates) {
    try {
      await deleteTempFile(candidate.iuc_storage_file_name);
      await deleteImportUploadCandidate(candidate.iuc_upload_id);
      removed += 1;
    } catch (error) {
      errors.push({ uploadId: candidate.iuc_upload_id, message: error.message });
    }
  }
  logger.info("Import candidate cleanup completed", {
    feature: "dragDropCsvImport",
    operation: "cleanupExpired",
    removed,
    errors: errors.length
  });
  return { removed, errors, schemaMissing: false };
}

export function scheduleImportCandidateCleanup() {
  const delayMs = IMPORT_UPLOAD_CLEANUP_INTERVAL_MINUTES * 60 * 1000;
  const timer = setInterval(() => {
    cleanupExpiredImportCandidates().catch((error) => {
      logger.error("Scheduled import candidate cleanup failed", {
        feature: "dragDropCsvImport",
        operation: "scheduledCleanup",
        message: error?.message
      });
    });
  }, delayMs);
  timer.unref?.();
  return timer;
}
