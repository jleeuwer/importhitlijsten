/** @vitest-environment node */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const requiredFiles = [
  'services/warningStatusHardeningService.js',
  'services/encodingWarningLifecycleService.js',
  'services/exportStatusRepairService.js',
  'scripts/sql/20260829_sprint2h_v_warning_status_hardening.sql',
  'scripts/sql/2h_v_preview_export_status_repair.sql',
  'scripts/sql/2h_v_apply_export_status_repair.sql',
  'scripts/run_2h_v_migration.sh',
  'scripts/run_2h_v_export_status_repair.sh',
  'docs/sprint-2h/SPRINT_2H_V_WARNING_STATUS_HARDENING.md',
  'docs/testcases/FUNCTIONAL_TEST_CASES_2H_V_WARNING_STATUS_HARDENING.md',
  'Release Notes/RELEASE_NOTES_2H_V_WARNING_STATUS_HARDENING.md'
];

test('2H-V overlay contains all required code, scripts and documentation', () => {
  for (const file of requiredFiles) {
    assert.equal(fs.existsSync(file), true, `${file} should exist`);
  }
});

test('2H-V migration is additive and non-destructive', () => {
  const sql = fs.readFileSync('scripts/sql/20260829_sprint2h_v_warning_status_hardening.sql', 'utf8');
  assert.match(sql, /ADD COLUMN IF NOT EXISTS/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS/);
  assert.doesNotMatch(sql, /DROP\s+TABLE/i);
  assert.doesNotMatch(sql, /DELETE\s+FROM/i);
  assert.doesNotMatch(sql, /TRUNCATE/i);
});

test('2H-V apply repair is transactional and audited', () => {
  const sql = fs.readFileSync('scripts/sql/2h_v_apply_export_status_repair.sql', 'utf8');
  assert.match(sql, /BEGIN;/);
  assert.match(sql, /COMMIT;/);
  assert.match(sql, /import_run_status_repair_audit/);
});

test('2H-V runners target Docker PostgreSQL defaults', () => {
  const migration = fs.readFileSync('scripts/run_2h_v_migration.sh', 'utf8');
  const repair = fs.readFileSync('scripts/run_2h_v_export_status_repair.sh', 'utf8');
  assert.match(migration, /POSTGRES_CONTAINER="\$\{POSTGRES_CONTAINER:-my-postgresdb\}"/);
  assert.match(repair, /docker exec -i/);
});
