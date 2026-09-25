import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sqlPath = path.join(root, "scripts/sql/bl_imp_123_file_details_duplicate_diagnostics.sql");
const runnerPath = path.join(root, "scripts/run_bl_imp_123_diagnostics.sh");
const docsPath = path.join(root, "docs/sprint-2h/SPRINT_2H_BL_IMP_123_FILE_DETAILS_DUPLICATE_DIAGNOSTICS.md");
const releaseNotesPath = path.join(root, "Release Notes/RELEASE_NOTES_BL_IMP_123.md");
const packageApplyPath = path.join(root, "scripts/apply_bl_imp_123_package_scripts.js");
const packageFragmentPath = path.join(root, "package.bl-imp-123.scripts.json");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

test("BL-IMP-123 diagnostics assets are present", () => {
  for (const file of [sqlPath, runnerPath, docsPath, releaseNotesPath, packageApplyPath, packageFragmentPath]) {
    assert.ok(fs.existsSync(file), `Expected file to exist: ${file}`);
  }
});

test("BL-IMP-123 SQL is read-only and contains no destructive DML/DDL", () => {
  const rawSql = read(sqlPath).toLowerCase();
  const sqlWithoutStrings = rawSql
    .replace(/--.*$/gm, "")
    .replace(/'([^']|'')*'/g, "''");
  const forbidden = [
    /\binsert\b/,
    /\bupdate\b/,
    /\btruncate\b/,
    /\balter\b/,
    /\bdrop\s+table\b/,
    /\bdrop\s+schema\b/,
    /\bcreate\s+table\b/
  ];
  for (const pattern of forbidden) {
    assert.equal(pattern.test(sqlWithoutStrings), false, `Forbidden SQL pattern found: ${pattern}`);
  }
  assert.match(rawSql, /create\s+temp\s+view/);
  assert.match(rawSql, /drop\s+view\s+if\s+exists\s+pg_temp/);
});

test("BL-IMP-123 SQL reports both hitlijsten reference meanings", () => {
  const sql = read(sqlPath);
  assert.match(sql, /hitlijsten\.fd_key|h_original\.fd_key/);
  assert.match(sql, /hl_samenstel_fd_key/);
  assert.match(sql, /USED_AS_IMPORT_EXPORT_LINK_ONLY/);
  assert.match(sql, /USED_IN_SAMENSTEL/);
});

test("BL-IMP-123 SQL contains before-after export baseline", () => {
  const sql = read(sqlPath);
  assert.match(sql, /baseline count for before\/after export check/i);
  assert.match(sql, /file_details_count/);
  assert.match(sql, /max_fd_key/);
  assert.match(sql, /max_entry_added_ts/);
});

test("BL-IMP-123 runner uses Docker PostgreSQL defaults and logs with timestamps", () => {
  const runner = read(runnerPath);
  assert.match(runner, /POSTGRES_CONTAINER="\$\{POSTGRES_CONTAINER:-my-postgresdb\}"/);
  assert.match(runner, /docker exec -i/);
  assert.match(runner, /tee "\$LOG_FILE"/);
  assert.match(runner, /date \+%Y%m%d-%H%M%S/);
});

test("BL-IMP-123 docs state export may not create file_details records", () => {
  const docs = read(docsPath) + "\n" + read(releaseNotesPath);
  assert.match(docs, /export[\s\S]*geen nieuwe `file_details` records aanmaken/i);
  assert.match(docs, /Geen automatische cleanup/i);
});


test("BL-IMP-123 package updater safely adds npm scripts", () => {
  const updater = read(packageApplyPath);
  const fragment = JSON.parse(read(packageFragmentPath));
  assert.match(updater, /Refusing to overwrite existing script/);
  assert.equal(fragment.scripts["diagnostics:bl-imp-123"], "bash scripts/run_bl_imp_123_diagnostics.sh");
  assert.equal(fragment.scripts["test:bl-imp-123"], "node --test tests/static_bl_imp_123_diagnostics.test.js");
});
