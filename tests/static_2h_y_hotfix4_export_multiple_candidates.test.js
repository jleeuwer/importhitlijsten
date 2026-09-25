import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const hitlijsten = readFileSync('models/hitlijsten.js', 'utf8');
const importRuns = readFileSync('models/import_runs.js', 'utf8');
const exportTests = readFileSync('tests/models/exportHitlijsten.test.js', 'utf8');

function blockingFunctionSource() {
  const match = hitlijsten.match(/function isBlockingReasonCode\(reasonCode\) \{[\s\S]*?\n\}/);
  return match ? match[0] : '';
}

test('2H-Y hotfix4 no longer treats multiple file_details matches as export blocker', () => {
  const source = blockingFunctionSource();
  assert.ok(source.includes('NO_FILE_DETAILS_COMBINED_MATCH'));
  assert.ok(!source.includes('MULTIPLE_FILE_DETAILS_COMBINED_MATCHES'));
  assert.match(hitlijsten, /function isWarningReasonCode\(reasonCode\)/);
  assert.match(hitlijsten, /"MULTIPLE_FILE_DETAILS_COMBINED_MATCHES"/);
});

test('2H-Y hotfix4 validates export on artist plus title regardless of desired song type', () => {
  assert.match(hitlijsten, /Hotfix 4: export validates only artist \+ title existence/);
  assert.doesNotMatch(hitlijsten, /s\.hl_desired_song_type_key IS NULL OR fd\.fd_song_type_key = s\.hl_desired_song_type_key/);
  assert.match(hitlijsten, /fd\.fd_song_type_key = s\.hl_desired_song_type_key/);
});

test('2H-Y hotfix4 keeps import run blocked counters aligned with export semantics', () => {
  assert.doesNotMatch(importRuns, /COALESCE\(c\.combined_match_count, 0\) > 1/);
  assert.match(importRuns, /COALESCE\(c\.combined_match_count, 0\) > 0/);
});

test('2H-Y hotfix4 updates export tests to allow multiple candidates as warnings', () => {
  assert.match(exportTests, /allows export when the combined key matches more than once and reports it as warning/);
  assert.match(exportTests, /warningIssues: 1/);
  assert.doesNotMatch(exportTests, /First blocking issue: positie 1\.\*MULTIPLE_FILE_DETAILS_COMBINED_MATCHES/);
});
