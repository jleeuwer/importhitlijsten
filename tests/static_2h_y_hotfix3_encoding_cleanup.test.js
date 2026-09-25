import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('2H-Y hotfix3 keeps encoding-damage detection stricter than general normalization', () => {
  const source = read('utils/textFixes.js');
  assert.match(source, /benign changes must\s+\/\/?\s*not create RECOVERABLE_ENCODING_DAMAGE|benign changes must not create RECOVERABLE_ENCODING_DAMAGE/s);
  assert.match(source, /if \(hasMojibake\) \{/);
  assert.doesNotMatch(source, /if \(hasMojibake \|\| changed\)/);
});

test('2H-Y hotfix3 adds regression coverage for clean manual repair text', () => {
  const encodingTest = read('tests/services_editEncodingRepairService.test.js');
  const manualTest = read('tests/services_editManualCorrectionService.test.js');
  assert.match(encodingTest, /Coldcut Featuring Yazz And The Plastic Population/);
  assert.match(encodingTest, /Doctorin' The House/);
  assert.match(manualTest, /returns clean diagnostics after file_details driven manual repair/);
  assert.match(manualTest, /encodingHints\.hasEncodingDamage/);
});
