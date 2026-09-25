/**
 * Sprint 2H-V — Export status repair service.
 *
 * The SQL layer stores a preview in a temporary table and the apply operation
 * uses exactly the same candidate calculation. These JS helpers are used by
 * tests and can be imported by future route/CLI implementations.
 */

export function classifyRepairCandidate(candidate = {}) {
  const exported = candidate.exported === true || candidate.ir_export_status === 'EXPORTED' || candidate.ir_export_status === 'EXPORTED_WITH_WARNINGS';
  const hasBlockingIssues = Number(candidate.blocking_issue_count ?? 0) > 0;
  const warningCount = Number(candidate.warning_count ?? 0);
  const currentStatus = String(candidate.ir_status ?? '').toUpperCase();
  const isAttentionStatus = ['AANDACHT_NODIG', 'ATTENTION_REQUIRED', 'NEEDS_ATTENTION'].includes(currentStatus);

  if (!exported) {
    return { repairable: false, reason: 'NOT_EXPORTED' };
  }
  if (hasBlockingIssues) {
    return { repairable: false, reason: 'BLOCKING_ISSUES_PRESENT' };
  }
  if (!isAttentionStatus) {
    return { repairable: false, reason: 'STATUS_NOT_ATTENTION_REQUIRED' };
  }

  return {
    repairable: true,
    reason: 'REPAIRABLE',
    targetStatus: warningCount > 0 ? 'GEEXPORTEERD_MET_WAARSCHUWINGEN' : 'GEEXPORTEERD',
    targetExportStatus: warningCount > 0 ? 'EXPORTED_WITH_WARNINGS' : 'EXPORTED'
  };
}

export function summarizeRepairCandidates(candidates = []) {
  const classified = candidates.map((candidate) => ({ ...candidate, ...classifyRepairCandidate(candidate) }));
  const repairable = classified.filter((candidate) => candidate.repairable);
  const skipped = classified.filter((candidate) => !candidate.repairable);

  return {
    total: classified.length,
    repairableCount: repairable.length,
    skippedCount: skipped.length,
    repairable,
    skipped
  };
}

export function validateRepairMode(mode) {
  if (!['preview', 'apply'].includes(mode)) {
    throw new Error('Repair mode must be preview or apply');
  }
  return mode;
}
