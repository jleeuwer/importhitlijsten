import fs from "fs/promises";
import path from "path";
import { sha256File } from "../utils/fileHash.js";
import { readCsvRows } from "../utils/csvReader.js";
import { calculateListFingerprint } from "../utils/listFingerprint.js";
import {
  findRegistryMatches,
  registerManualImportedFile,
  removeManualImportedMark,
  getRegistryByKey
} from "../models/import_file_registry.js";

function isCsvName(name) {
  const lower = String(name ?? "").toLowerCase();
  return lower.endsWith(".csv") && !lower.startsWith(".") && !lower.startsWith("~$");
}

export function assertCsvPathInsideDirectory(directoryPath, filePath) {
  const dir = path.resolve(directoryPath);
  const file = path.resolve(filePath);
  if (path.dirname(file) !== dir) {
    const error = new Error("Selected CSV must be located directly inside the selected directory.");
    error.code = "INVALID_IMPORT_PATH";
    throw error;
  }
  if (!isCsvName(path.basename(file))) {
    const error = new Error("Selected import file must be a visible CSV file.");
    error.code = "INVALID_IMPORT_FILE";
    throw error;
  }
  return file;
}

export async function inspectCsvFile(filePath) {
  const stat = await fs.stat(filePath);
  if (!stat.isFile()) {
    const error = new Error("Path is not a regular file.");
    error.code = "READ_ERROR";
    throw error;
  }

  const [fileSha256, parsedCsv] = await Promise.all([
    sha256File(filePath),
    readCsvRows(filePath)
  ]);
  const fp = calculateListFingerprint(parsedCsv.rows);
  const matches = await findRegistryMatches({ fileSha256, listFingerprint: fp.listFingerprint });

  return {
    filePath,
    fileName: path.basename(filePath),
    directoryPath: path.dirname(filePath),
    fileSize: stat.size,
    fileModifiedAt: stat.mtime,
    fileSha256,
    listFingerprint: fp.listFingerprint,
    canonicalRowCount: fp.canonicalRowCount,
    invalidRows: fp.invalidRows,
    encodingUsed: parsedCsv.encodingUsed,
    delimiter: parsedCsv.delimiter,
    ...matches
  };
}

function classifyInspection(inspection) {
  if (inspection.fileMatch) {
    return {
      status: inspection.fileMatch.ifr_status,
      matchType: "EXACT_FILE",
      registry: inspection.fileMatch
    };
  }
  if (inspection.listMatch) {
    return {
      status: inspection.listMatch.ifr_status,
      matchType: "SAME_LIST_CONTENT",
      registry: inspection.listMatch
    };
  }
  return { status: "NEW", matchType: "NEW", registry: null };
}

export async function scanImportDirectory(directoryPath, { showImported = false } = {}) {
  const resolved = path.resolve(String(directoryPath ?? "").trim());
  const stat = await fs.stat(resolved);
  if (!stat.isDirectory()) {
    const error = new Error("Selected path is not a directory.");
    error.code = "READ_ERROR";
    throw error;
  }

  const entries = await fs.readdir(resolved, { withFileTypes: true });
  const csvEntries = entries
    .filter((entry) => entry.isFile() && isCsvName(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name, "nl", { sensitivity: "base" }));

  const files = [];
  for (const entry of csvEntries) {
    const filePath = path.join(resolved, entry.name);
    try {
      const inspection = await inspectCsvFile(filePath);
      const classification = classifyInspection(inspection);
      const row = {
        ...inspection,
        ...classification,
        errorCode: null,
        errorMessage: null
      };
      files.push(row);
    } catch (error) {
      files.push({
        filePath,
        fileName: entry.name,
        directoryPath: resolved,
        status: error.code === "READ_ERROR" ? "READ_ERROR" : "PARSE_ERROR",
        matchType: "IMPORT_PROBLEM",
        registry: null,
        errorCode: error.code || "PARSE_ERROR",
        errorMessage: error.message
      });
    }
  }

  return {
    directoryPath: resolved,
    showImported,
    totalCsvFiles: csvEntries.length,
    visibleFiles: showImported
      ? files.length
      : files.filter((file) => !["IMPORTED", "MANUALLY_MARKED_IMPORTED"].includes(file.status)).length,
    files
  };
}

export async function markFileAsAlreadyImported({ directoryPath, fileName }) {
  const filePath = assertCsvPathInsideDirectory(directoryPath, path.join(directoryPath, fileName));
  const inspection = await inspectCsvFile(filePath);
  const duplicateOf = inspection.fileMatch ?? inspection.listMatch ?? null;
  return registerManualImportedFile({
    fileName: inspection.fileName,
    directoryPath: inspection.directoryPath,
    fileSize: inspection.fileSize,
    fileModifiedAt: inspection.fileModifiedAt,
    fileSha256: inspection.fileSha256,
    listFingerprint: inspection.listFingerprint,
    duplicateOfRegistryKey: duplicateOf?.ifr_key ?? null
  });
}

export async function unmarkFileAsAlreadyImported(registryKey) {
  const existing = await getRegistryByKey(registryKey);
  if (!existing) {
    const error = new Error("Registry record not found.");
    error.code = "REGISTRY_NOT_FOUND";
    throw error;
  }
  if (existing.ifr_status !== "MANUALLY_MARKED_IMPORTED") {
    const error = new Error("Only manual imported marks can be removed.");
    error.code = "REGISTRY_MARK_NOT_REVERSIBLE";
    throw error;
  }
  return removeManualImportedMark(registryKey);
}
