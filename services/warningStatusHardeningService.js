/**
 * Sprint 2H-V — Warning/status hardening helpers.
 *
 * This module is intentionally dependency-free so it can be reused by services,
 * route handlers and tests. It does not perform database writes; persistence is
 * handled by exportStatusRepairService.js and the existing export/manual repair
 * services.
 */

export const ISSUE_SEVERITY = Object.freeze({
  BLOCKING: 'blocking',
  WARNING: 'warning',
  INFO: 'info'
});

export const RUN_EXPORT_STATUS = Object.freeze({
  NOT_EXPORTED: 'NOT_EXPORTED',
  EXPORTED: 'EXPORTED',
  EXPORTED_WITH_WARNINGS: 'EXPORTED_WITH_WARNINGS',
  EXPORT_BLOCKED: 'EXPORT_BLOCKED'
});

export const RUN_VIEW_STATUS = Object.freeze({
  ATTENTION_REQUIRED: 'AANDACHT_NODIG',
  READY: 'KLAAR_VOOR_EXPORT',
  READY_WITH_WARNINGS: 'KLAAR_VOOR_EXPORT_MET_WAARSCHUWINGEN',
  EXPORTED: 'GEEXPORTEERD',
  EXPORTED_WITH_WARNINGS: 'GEEXPORTEERD_MET_WAARSCHUWINGEN'
});

const BLOCKING_STATUSES = new Set([
  'NO_MATCH',
  'MULTIPLE_CANDIDATES',
  'BLOCKED',
  'ERROR',
  'INVALID',
  'REVIEW_REQUIRED',
  'AMBIGUOUS_VERSION_MATCH'
]);

const NON_BLOCKING_WARNING_CODES = new Set([
  'ENCODING_WARNING',
  'ENCODING_SUSPECT',
  'NON_BLOCKING_WARNING',
  'DISCogs_WARNING',
  'DISCOGS_WARNING',
  'NORMALIZATION_WARNING'
]);

export function normalizeIssue(issue = {}) {
  const severity = String(issue.severity || '').toLowerCase();
  const code = String(issue.code || issue.status || '').trim().toUpperCase();
  const blocking = issue.blocking === true || severity === ISSUE_SEVERITY.BLOCKING || BLOCKING_STATUSES.has(code);
  const warning = !blocking && (severity === ISSUE_SEVERITY.WARNING || issue.warning === true || NON_BLOCKING_WARNING_CODES.has(code));

  return {
    ...issue,
    code,
    severity: blocking ? ISSUE_SEVERITY.BLOCKING : warning ? ISSUE_SEVERITY.WARNING : ISSUE_SEVERITY.INFO,
    blocking,
    warning
  };
}

export function classifyIssues(issues = []) {
  const normalizedIssues = Array.isArray(issues) ? issues.map(normalizeIssue) : [];
  const blockingIssues = normalizedIssues.filter((issue) => issue.blocking);
  const nonBlockingWarnings = normalizedIssues.filter((issue) => issue.warning && !issue.blocking);
  const infoItems = normalizedIssues.filter((issue) => !issue.warning && !issue.blocking);

  return {
    issues: normalizedIssues,
    blockingIssues,
    nonBlockingWarnings,
    infoItems,
    hasBlockingIssues: blockingIssues.length > 0,
    hasNonBlockingWarnings: nonBlockingWarnings.length > 0,
    blockingCount: blockingIssues.length,
    warningCount: nonBlockingWarnings.length
  };
}

export function deriveExportStatusAfterSuccessfulExport(issues = []) {
  const classification = classifyIssues(issues);
  if (classification.hasBlockingIssues) {
    return {
      exportStatus: RUN_EXPORT_STATUS.EXPORT_BLOCKED,
      viewStatus: RUN_VIEW_STATUS.ATTENTION_REQUIRED,
      canExport: false,
      ...classification
    };
  }

  if (classification.hasNonBlockingWarnings) {
    return {
      exportStatus: RUN_EXPORT_STATUS.EXPORTED_WITH_WARNINGS,
      viewStatus: RUN_VIEW_STATUS.EXPORTED_WITH_WARNINGS,
      canExport: true,
      ...classification
    };
  }

  return {
    exportStatus: RUN_EXPORT_STATUS.EXPORTED,
    viewStatus: RUN_VIEW_STATUS.EXPORTED,
    canExport: true,
    ...classification
  };
}

export function deriveRunViewStatus({ exported = false, issues = [] } = {}) {
  const classification = classifyIssues(issues);

  if (classification.hasBlockingIssues) {
    return {
      viewStatus: RUN_VIEW_STATUS.ATTENTION_REQUIRED,
      canExport: false,
      exported,
      ...classification
    };
  }

  if (exported && classification.hasNonBlockingWarnings) {
    return {
      viewStatus: RUN_VIEW_STATUS.EXPORTED_WITH_WARNINGS,
      canExport: false,
      exported,
      ...classification
    };
  }

  if (exported) {
    return {
      viewStatus: RUN_VIEW_STATUS.EXPORTED,
      canExport: false,
      exported,
      ...classification
    };
  }

  if (classification.hasNonBlockingWarnings) {
    return {
      viewStatus: RUN_VIEW_STATUS.READY_WITH_WARNINGS,
      canExport: true,
      exported,
      ...classification
    };
  }

  return {
    viewStatus: RUN_VIEW_STATUS.READY,
    canExport: true,
    exported,
    ...classification
  };
}

export function shouldAttemptEncodingRepair(preview = {}) {
  const damagedRows = Number(preview.damagedRows ?? preview.damaged_rows ?? 0);
  const repairableRows = Number(preview.repairableRows ?? preview.repairable_rows ?? 0);

  if (damagedRows > 0 && repairableRows === 0) {
    return {
      shouldSave: false,
      status: 'NO_RECOVERABLE_ENCODING_REPAIR',
      message: 'No recoverable encoding repairs detected for the current selection.'
    };
  }

  return {
    shouldSave: repairableRows > 0,
    status: repairableRows > 0 ? 'REPAIRABLE_ENCODING_REPAIR' : 'NO_ENCODING_REPAIR_NEEDED',
    message: repairableRows > 0 ? 'Encoding repair is safe to apply.' : 'No encoding repair is needed.'
  };
}

export function mapServiceErrorToHttp(error) {
  const message = String(error?.message || 'Unknown error');
  if (error?.code === 'EXPLICIT_OVERWRITE_REQUIRED' || message.includes('Manual free overwrite requires explicit confirmation')) {
    return {
      statusCode: 409,
      body: {
        error: 'EXPLICIT_OVERWRITE_REQUIRED',
        message: 'Selecteer een file_details-kandidaat of bevestig expliciet dat je de tekst wilt overschrijven.'
      }
    };
  }

  return {
    statusCode: 500,
    body: {
      error: 'INTERNAL_ERROR',
      message: 'De actie kon niet worden uitgevoerd. Controleer de logs voor details.'
    }
  };
}
