import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.resolve("uploads");
fs.mkdirSync(uploadDir, { recursive: true });

function safeName(name) {
  return path.basename(name).replace(/[^\w.\-]+/g, "_");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${safeName(file.originalname)}`)
});

function fileFilter(req, file, cb) {
  const ok =
    file.mimetype === "text/csv" ||
    file.originalname.toLowerCase().endsWith(".csv");
  if (!ok) return cb(new Error("Only CSV files are allowed (.csv)."));
  cb(null, true);
}

export const uploadCsv = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});
