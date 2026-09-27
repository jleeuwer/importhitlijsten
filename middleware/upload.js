import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "node:crypto";

const uploadDir = path.resolve("uploads");
const importCandidateDir = path.resolve(process.env.IMPORT_UPLOAD_TEMP_DIR || "uploads/import-candidates");
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(importCandidateDir, { recursive: true });

function positiveIntEnv(name, fallback) {
  const value = Number.parseInt(String(process.env[name] ?? ""), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const IMPORT_UPLOAD_MAX_FILE_MB = positiveIntEnv("IMPORT_UPLOAD_MAX_FILE_MB", 25);
export const IMPORT_UPLOAD_MAX_BATCH_FILES = positiveIntEnv("IMPORT_UPLOAD_MAX_BATCH_FILES", 50);

function safeName(name) {
  return path.basename(name).replace(/[^\w.\-]+/g, "_");
}

function csvOnlyFilter(req, file, cb) {
  if (!String(file.originalname || "").toLowerCase().endsWith(".csv")) {
    const error = new Error("Alleen CSV-bestanden zijn toegestaan (.csv).");
    error.code = "INVALID_FILE_TYPE";
    error.status = 400;
    return cb(error);
  }
  cb(null, true);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${safeName(file.originalname)}`)
});

export const uploadCsv = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === "text/csv" || String(file.originalname || "").toLowerCase().endsWith(".csv");
    if (!ok) return cb(new Error("Only CSV files are allowed (.csv)."));
    cb(null, true);
  },
  limits: { fileSize: IMPORT_UPLOAD_MAX_FILE_MB * 1024 * 1024 }
});

const candidateStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, importCandidateDir),
  filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}.csv`)
});

const candidateUploader = multer({
  storage: candidateStorage,
  fileFilter: csvOnlyFilter,
  limits: {
    fileSize: IMPORT_UPLOAD_MAX_FILE_MB * 1024 * 1024,
    files: IMPORT_UPLOAD_MAX_BATCH_FILES
  }
});

async function removePartialCandidateUploads(files) {
  const batch = Array.isArray(files) ? files : [];
  await Promise.all(batch.map((file) => fs.promises.unlink(file.path).catch(() => {})));
}

export function uploadImportCandidateBatch(req, res, next) {
  candidateUploader.array("csvFiles", IMPORT_UPLOAD_MAX_BATCH_FILES)(req, res, async (error) => {
    if (!error) return next();
    await removePartialCandidateUploads(req.files);
    error.status = 400;
    if (error.code === "LIMIT_FILE_SIZE") {
      error.code = "IMPORT_FILE_TOO_LARGE";
      error.message = `Een CSV-bestand is groter dan ${IMPORT_UPLOAD_MAX_FILE_MB} MB.`;
    } else if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
      error.code = "IMPORT_BATCH_TOO_LARGE";
      error.message = `Maximaal ${IMPORT_UPLOAD_MAX_BATCH_FILES} CSV-bestanden per batch.`;
    }
    return next(error);
  });
}
