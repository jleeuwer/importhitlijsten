import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const hitlijsten = readFileSync('models/hitlijsten.js', 'utf8');
const importRuns = readFileSync('models/import_runs.js', 'utf8');
const encodingRepair = readFileSync('services/editEncodingRepairService.js', 'utf8');
const textNormalization = readFileSync('services/editTextNormalizationService.js', 'utf8');
const errorHandler = readFileSync('middleware/errorHandler.js', 'utf8');

test('2H-Y hotfix4 treats ambiguous file_details matches as warnings for export', () => {
  assert.match(hitlijsten, /\"MULTIPLE_FILE_DETAILS_COMBINED_MATCHES\"/);
  assert.match(hitlijsten, /function isWarningReasonCode\(reasonCode\)/);
  const blockingSource = hitlijsten.match(/function isBlockingReasonCode\(reasonCode\) \{[\s\S]*?\n\}/)?.[0] || '';
  assert.doesNotMatch(blockingSource, /MULTIPLE_FILE_DETAILS_COMBINED_MATCHES/);
});

test('2H-Y hotfix4 validates export regardless of desired song type and keeps desired type for ordering only', () => {
  assert.doesNotMatch(hitlijsten, /s\.hl_desired_song_type_key IS NULL OR fd\.fd_song_type_key = s\.hl_desired_song_type_key/);
  assert.match(hitlijsten, /fd\.fd_song_type_key = s\.hl_desired_song_type_key/);
  assert.doesNotMatch(importRuns, /COALESCE\(c\.combined_match_count, 0\) > 1/);
  assert.match(importRuns, /COALESCE\(c\.combined_match_count, 0\) > 0/);
});

test('2H-Y export persists safe raw Discogs links as structured hitlijst metadata fallback', () => {
  assert.match(hitlijsten, /discogsMasterUrlExportSql/);
  assert.match(hitlijsten, /discogsReleaseUrlExportSql/);
  assert.match(hitlijsten, /hl_discogs_link/);
  assert.match(hitlijsten, /discogs_selected_at/);
});

test('2H-Y automated encoding/text repair confirms its explicit overwrite intent internally', () => {
  assert.match(encodingRepair, /manualOverwriteConfirmed: true/);
  assert.match(textNormalization, /manualOverwriteConfirmed: true/);
});

test('2H-Y API errors no longer leak stack traces for explicit overwrite conflicts', () => {
  assert.match(errorHandler, /req\.originalUrl\?\.startsWith\("\/api\/"\)/);
  assert.match(errorHandler, /EXPLICIT_OVERWRITE_REQUIRED/);
  assert.match(errorHandler, /json\(\{/);
});
