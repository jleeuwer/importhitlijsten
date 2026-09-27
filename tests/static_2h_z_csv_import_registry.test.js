/** @vitest-environment node */
import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(p, "utf8");

test("2H-Z migration defines import_file_registry and required statuses", () => {
  const sql = read("scripts/sql/20260925_sprint2h_z_csv_import_registry.sql");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.import_file_registry/);
  assert.match(sql, /IMPORTED/);
  assert.match(sql, /MANUALLY_MARKED_IMPORTED/);
  assert.match(sql, /ifr_list_fingerprint/);
  assert.match(sql, /ifr_duplicate_override/);
});

test("2H-Z directory scanner is non-recursive and distinguishes file/content matches", () => {
  const service = read("services/importFileRegistryService.js");
  assert.match(service, /fs\.readdir\(resolved, \{ withFileTypes: true \}\)/);
  assert.match(service, /EXACT_FILE/);
  assert.match(service, /SAME_LIST_CONTENT/);
  assert.match(service, /READ_ERROR/);
  assert.match(service, /PARSE_ERROR/);
});

test("2H-Z import only records registry entry inside successful import transaction", () => {
  const controller = read("controllers/importController.js");
  const registerPos = controller.indexOf("registerImportedFileTx");
  const commitPos = controller.indexOf('client.query("COMMIT")');
  assert.ok(registerPos > 0);
  assert.ok(commitPos > registerPos);
});

test("2H-Z UI hides imported files by default and exposes toggle/manual mark", () => {
  const ui = read("src/ui/pages/ImportPage.jsx");
  assert.match(ui, /Toon ook geïmporteerd/);
  assert.match(ui, /Markeer als al geïmporteerd/);
  assert.match(ui, /Markering verwijderen/);
  assert.match(ui, /Opnieuw importeren/);
});

test("2H-Z ImportPage closes the dynamic className JSX expression before href", () => {
  const ui = read("src/ui/pages/ImportPage.jsx");
  assert.match(
    ui,
    /className=\{`btn btn-sm me-1 \$\{file\.status === "NEW" \? "btn-primary" : "btn-outline-primary"\}`\}\s+href=/s
  );
});

test("2H-Z install uses npm ci to protect tracked lockfile", () => {
  const script = read("scripts/install-all.sh");
  assert.match(script, /npm ci/);
  assert.doesNotMatch(script, /npm install/);
});
