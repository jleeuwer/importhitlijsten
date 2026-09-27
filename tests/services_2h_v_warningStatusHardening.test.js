/** @vitest-environment node */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  RUN_VIEW_STATUS,
  RUN_EXPORT_STATUS,
  classifyIssues,
  deriveExportStatusAfterSuccessfulExport,
  deriveRunViewStatus,
  shouldAttemptEncodingRepair,
  mapServiceErrorToHttp
} from '../services/warningStatusHardeningService.js';

test('2H-V classifies blocking issues separately from non-blocking warnings', () => {
  const result = classifyIssues([
    { code: 'ENCODING_WARNING', severity: 'warning' },
    { status: 'NO_MATCH' },
    { code: 'FYI' }
  ]);

  assert.equal(result.blockingCount, 1);
  assert.equal(result.warningCount, 1);
  assert.equal(result.hasBlockingIssues, true);
  assert.equal(result.hasNonBlockingWarnings, true);
});

test('2H-V derives exported-with-warnings after successful export with only warnings', () => {
  const result = deriveExportStatusAfterSuccessfulExport([
    { code: 'ENCODING_WARNING', severity: 'warning' }
  ]);

  assert.equal(result.exportStatus, RUN_EXPORT_STATUS.EXPORTED_WITH_WARNINGS);
  assert.equal(result.viewStatus, RUN_VIEW_STATUS.EXPORTED_WITH_WARNINGS);
  assert.equal(result.canExport, true);
});

test('2H-V keeps blocking issue as attention required and non-exportable', () => {
  const result = deriveRunViewStatus({ exported: false, issues: [{ status: 'MULTIPLE_CANDIDATES' }] });

  assert.equal(result.viewStatus, RUN_VIEW_STATUS.ATTENTION_REQUIRED);
  assert.equal(result.canExport, false);
});

test('2H-V does not save when encoding preview has damaged rows but zero repairable rows', () => {
  const result = shouldAttemptEncodingRepair({ damagedRows: 1, repairableRows: 0 });

  assert.equal(result.shouldSave, false);
  assert.equal(result.status, 'NO_RECOVERABLE_ENCODING_REPAIR');
});

test('2H-V maps manual free overwrite stacktrace to functional 409 response', () => {
  const result = mapServiceErrorToHttp(new Error('Manual free overwrite requires explicit confirmation. Select a file_details candidate or confirm overwrite.'));

  assert.equal(result.statusCode, 409);
  assert.equal(result.body.error, 'EXPLICIT_OVERWRITE_REQUIRED');
  assert.match(result.body.message, /Selecteer/);
});
