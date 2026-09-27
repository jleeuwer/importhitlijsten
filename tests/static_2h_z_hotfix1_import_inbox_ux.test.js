/** @vitest-environment node */
import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(p, "utf8");

test("2H-Z HF1 scanner returns full dataset so imported toggle does not require rescan", () => {
  const service = read("services/importFileRegistryService.js");
  assert.match(service, /files\.push\(row\)/);
  assert.doesNotMatch(service, /if \(showImported \|\| classification\.status === "NEW"\) files\.push\(row\)/);
});

test("2H-Z HF1 ImportPage has client-side pagination and page sizes", () => {
  const ui = read("src/ui/pages/ImportPage.jsx");
  assert.match(ui, /useState\(25\)/);
  assert.match(ui, /filteredFiles\.slice\(pageStart, pageStart \+ pageSize\)/);
  assert.match(ui, /<option value=\{25\}>25<\/option>/);
  assert.match(ui, /<option value=\{50\}>50<\/option>/);
  assert.match(ui, /<option value=\{100\}>100<\/option>/);
});

test("2H-Z HF1 ImportPage persists and renders recent directories", () => {
  const ui = read("src/ui/pages/ImportPage.jsx");
  assert.match(ui, /importhitlijst\.recentImportDirectories/);
  assert.match(ui, /Recente scans:/);
});

test("2H-Z HF1 selected file focuses Hitlijst name", () => {
  const ui = read("src/ui/pages/ImportPage.jsx");
  assert.match(ui, /hitlijstNameRef\.current\?\.focus\?\.\(\)/);
  assert.match(ui, /htmlFor="hl_hitlijst"/);
  assert.match(ui, /id="hl_hitlijst"/);
});

test("2H-Z HF1 imported toggle is controlled client-side", () => {
  const ui = read("src/ui/pages/ImportPage.jsx");
  assert.match(ui, /checked=\{showImported\}/);
  assert.match(ui, /setShowImported\(event\.target\.checked\)/);
  assert.match(ui, /if \(showImported\) return allScannedFiles/);
});
