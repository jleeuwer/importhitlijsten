import crypto from "crypto";
import { decodeHtmlEntities, repairRecoverableEncoding } from "./textFixes.js";
import { normalizeHitlijstRow } from "./csvReader.js";

function canonicalText(value) {
  return repairRecoverableEncoding(decodeHtmlEntities(String(value ?? "")))
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .replace(/[‘’‛`´]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("nl-NL");
}

export function buildCanonicalList(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("CSV contains no data rows; list fingerprint cannot be calculated.");
  }

  const canonicalRows = [];
  const errors = [];

  for (let index = 0; index < rows.length; index += 1) {
    const normalized = normalizeHitlijstRow(rows[index]);
    const artist = canonicalText(normalized.artiest);
    const title = canonicalText(normalized.song);
    const position = index + 1;

    if (!artist || !title) {
      errors.push({ position, reason: !artist ? "MISSING_ARTIST" : "MISSING_TITLE" });
      continue;
    }

    canonicalRows.push(`${position}|${artist}|${title}`);
  }

  if (canonicalRows.length === 0) {
    const error = new Error("CSV contains no usable artist/title rows; list fingerprint cannot be calculated.");
    error.code = "PARSE_ERROR";
    error.details = errors;
    throw error;
  }

  return { canonicalRows, invalidRows: errors };
}

export function fingerprintCanonicalRows(canonicalRows) {
  return crypto.createHash("sha256").update(canonicalRows.join("\n"), "utf8").digest("hex");
}

export function calculateListFingerprint(rows) {
  const { canonicalRows, invalidRows } = buildCanonicalList(rows);
  return {
    listFingerprint: fingerprintCanonicalRows(canonicalRows),
    canonicalRowCount: canonicalRows.length,
    invalidRows
  };
}

export function normalizeFingerprintText(value) {
  return canonicalText(value);
}
