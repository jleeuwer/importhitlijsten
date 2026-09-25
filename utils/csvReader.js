import fs from "fs/promises";
import { parse } from "csv-parse/sync";

function scoreDecodedText(text) {
  const replacementCount = (text.match(/\uFFFD/g) || []).length;
  const mojibakeCount = (text.match(/Ã.|â€.|Â/g) || []).length;
  const nullishCount = (text.match(/\u0000/g) || []).length;
  return replacementCount * 10 + mojibakeCount * 3 + nullishCount * 20;
}

function decodeCsvBuffer(buffer) {
  const utf8 = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const latin1 = buffer.toString("latin1").replace(/^\uFEFF/, "");

  const utf8Score = scoreDecodedText(utf8);
  const latin1Score = scoreDecodedText(latin1);

  if (latin1Score < utf8Score) {
    return {
      text: latin1,
      encodingUsed: "latin1-fallback",
      alternatives: {
        utf8Score,
        latin1Score
      }
    };
  }

  return {
    text: utf8,
    encodingUsed: "utf8",
    alternatives: {
      utf8Score,
      latin1Score
    }
  };
}

/**
 * Read CSV into rows of objects.
 * - UTF-8 first, latin1 fallback when quality is better
 * - Handles quoted fields with commas
 * - Strips BOM
 * - Auto-detects delimiter (comma vs semicolon)
 * - Normalizes headers to lowercase + trimmed
 */
export async function readCsvRows(filePath, { requiredHeaders = [] } = {}) {
  const rawBuffer = await fs.readFile(filePath);
  const decoded = decodeCsvBuffer(rawBuffer);
  const text = decoded.text;

  const firstLine =
    text.split(/\r?\n/).find((l) => l.trim().length > 0) || "";

  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semiCount > commaCount ? ";" : ",";

  const records = parse(text, {
    bom: true,
    columns: (header) =>
      header.map((h) =>
        String(h ?? "")
          .trim()
          .replace(/^\uFEFF/, "")
          .toLowerCase()
      ),
    delimiter,
    relax_quotes: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true
  });

  const headers = records.length ? Object.keys(records[0]) : [];
  const missing = requiredHeaders
    .map((h) => h.toLowerCase())
    .filter((h) => !headers.includes(h));

  return {
    delimiter,
    headers,
    missing,
    rows: records,
    encodingUsed: decoded.encodingUsed,
    decodeScores: decoded.alternatives
  };
}

/**
 * Map possible header variants to the canonical names:
 * artiest, song, jaar
 */
export function normalizeHitlijstRow(rawRow) {
  const get = (...keys) => {
    for (const k of keys) {
      const v = rawRow?.[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
    }
    return "";
  };

  return {
    artiest: get("artiest", "artist", "artiestnaam", "artiest_name"),
    song: get("song", "titel", "title", "track", "nummer"),
    jaar: get("jaar", "year", "releaseyear", "release_year"),
    fd_file_name: get("fd_file_name", "filename", "file_name", "bestand", "bestandsnaam", "file", "path", "filepath", "file_path")
  };
}

export { decodeCsvBuffer, scoreDecodedText };
