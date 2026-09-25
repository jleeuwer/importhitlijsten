import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectEncodingWarningForText,
  detectEncodingWarningForRow,
  buildEncodingWarningRefreshResult,
  saveManualCorrectionAndRefreshEncodingWarning
} from '../services/encodingWarningLifecycleService.js';

test('2H-V detects common mojibake patterns', () => {
  const result = detectEncodingWarningForText('BeyoncÃ©');
  assert.equal(result.hasWarning, true);
  assert.equal(result.warning.code, 'ENCODING_WARNING');
});

test('2H-V accepts clean corrected text', () => {
  const result = detectEncodingWarningForText('Beyoncé');
  assert.equal(result.hasWarning, false);
});

test('2H-V detects warnings in current row fields', () => {
  const result = detectEncodingWarningForRow({ hl_artiest: 'BeyoncÃ©', hl_titel_song: 'Halo' });
  assert.equal(result.hasWarning, true);
  assert.equal(result.warning.field, 'artist');
});

test('2H-V builds clear action when manual correction resolves encoding warning', () => {
  const result = buildEncodingWarningRefreshResult({
    before: { hl_artiest: 'BeyoncÃ©', hl_titel_song: 'Halo' },
    after: { hl_artiest: 'Beyoncé', hl_titel_song: 'Halo' }
  });
  assert.equal(result.action, 'CLEAR_ENCODING_WARNING');
  assert.equal(result.encodingWarningResolved, true);
});

test('2H-V orchestration reloads current row and replaces warning state', async () => {
  const rows = [
    { hl_artiest: 'BeyoncÃ©', hl_titel_song: 'Halo' },
    { hl_artiest: 'Beyoncé', hl_titel_song: 'Halo' }
  ];
  let loadIndex = 0;
  let replacedWarning = 'not-called';

  const result = await saveManualCorrectionAndRefreshEncodingWarning({
    input: { runId: 'run-1', position: 1 },
    loadCurrentRow: async () => rows[loadIndex++],
    saveManualStagingCorrection: async () => ({ changed: true }),
    replaceEncodingWarningForPosition: async ({ warning }) => {
      replacedWarning = warning;
    }
  });

  assert.equal(result.changed, true);
  assert.equal(result.action, 'CLEAR_ENCODING_WARNING');
  assert.equal(replacedWarning, null);
});
