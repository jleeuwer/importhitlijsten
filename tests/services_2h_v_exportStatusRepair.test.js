/** @vitest-environment node */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  classifyRepairCandidate,
  summarizeRepairCandidates,
  validateRepairMode
} from '../services/exportStatusRepairService.js';

test('2H-V repair candidate becomes exported-with-warnings when exported and only warning remains', () => {
  const result = classifyRepairCandidate({
    exported: true,
    ir_status: 'AANDACHT_NODIG',
    warning_count: 2,
    blocking_issue_count: 0
  });

  assert.equal(result.repairable, true);
  assert.equal(result.targetStatus, 'GEEXPORTEERD_MET_WAARSCHUWINGEN');
  assert.equal(result.targetExportStatus, 'EXPORTED_WITH_WARNINGS');
});

test('2H-V repair skips blocking issues', () => {
  const result = classifyRepairCandidate({
    exported: true,
    ir_status: 'AANDACHT_NODIG',
    warning_count: 1,
    blocking_issue_count: 1
  });

  assert.equal(result.repairable, false);
  assert.equal(result.reason, 'BLOCKING_ISSUES_PRESENT');
});

test('2H-V repair summary separates repairable and skipped candidates', () => {
  const result = summarizeRepairCandidates([
    { exported: true, ir_status: 'AANDACHT_NODIG', warning_count: 0, blocking_issue_count: 0 },
    { exported: false, ir_status: 'AANDACHT_NODIG', warning_count: 0, blocking_issue_count: 0 }
  ]);

  assert.equal(result.total, 2);
  assert.equal(result.repairableCount, 1);
  assert.equal(result.skippedCount, 1);
});

test('2H-V validates repair mode', () => {
  assert.equal(validateRepairMode('preview'), 'preview');
  assert.throws(() => validateRepairMode('dryrun'), /preview or apply/);
});
