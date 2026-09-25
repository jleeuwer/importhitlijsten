/**
 * Sprint 2H-V — Encoding warning lifecycle helpers.
 *
 * This module contains deterministic text checks and a small orchestration helper
 * for manual-correction flows. It purposely does not import the existing manual
 * correction service to keep the integration explicit and testable.
 */

const MOJIBAKE_PATTERNS = [
  /Ã./u,
  /Â./u,
  /â€[\u0080-\u00bf]?/u,
  /�/u,
  /\uFFFD/u
];

export function detectEncodingWarningForText(text) {
  const value = String(text ?? '');
  const matchedPattern = MOJIBAKE_PATTERNS.find((pattern) => pattern.test(value));

  if (!matchedPattern) {
    return {
      hasWarning: false,
      warning: null
    };
  }

  return {
    hasWarning: true,
    warning: {
      code: 'ENCODING_WARNING',
      severity: 'warning',
      blocking: false,
      message: 'Mogelijke encoding-schade gevonden in de actuele tekst.',
      sample: value.slice(0, 200)
    }
  };
}

export function detectEncodingWarningForRow(row = {}) {
  const artistResult = detectEncodingWarningForText(row.hl_artiest ?? row.artist ?? row.currentArtist);
  const titleResult = detectEncodingWarningForText(row.hl_titel_song ?? row.title ?? row.currentTitle);
  const fdTitleResult = detectEncodingWarningForText(row.fd_tag_title ?? row.fileTitle);
  const warnings = [];

  if (artistResult.hasWarning) warnings.push({ ...artistResult.warning, field: 'artist' });
  if (titleResult.hasWarning) warnings.push({ ...titleResult.warning, field: 'title' });
  if (fdTitleResult.hasWarning) warnings.push({ ...fdTitleResult.warning, field: 'fd_tag_title' });

  return {
    hasWarning: warnings.length > 0,
    warnings,
    warning: warnings[0] ?? null
  };
}

export function buildEncodingWarningRefreshResult({ before = {}, after = {} } = {}) {
  const beforeDetection = detectEncodingWarningForRow(before);
  const afterDetection = detectEncodingWarningForRow(after);

  if (beforeDetection.hasWarning && !afterDetection.hasWarning) {
    return {
      action: 'CLEAR_ENCODING_WARNING',
      encodingWarningResolved: true,
      currentEncodingWarning: null,
      message: 'Correctie opgeslagen. Encoding warning opgelost.'
    };
  }

  if (afterDetection.hasWarning) {
    return {
      action: beforeDetection.hasWarning ? 'REPLACE_ENCODING_WARNING' : 'ADD_ENCODING_WARNING',
      encodingWarningResolved: false,
      currentEncodingWarning: afterDetection.warning,
      message: 'Correctie opgeslagen, maar de tekst bevat nog steeds een mogelijke encoding-warning.'
    };
  }

  return {
    action: 'NO_ENCODING_WARNING',
    encodingWarningResolved: false,
    currentEncodingWarning: null,
    message: 'Correctie opgeslagen.'
  };
}

export async function saveManualCorrectionAndRefreshEncodingWarning({
  saveManualStagingCorrection,
  loadCurrentRow,
  replaceEncodingWarningForPosition,
  input
}) {
  if (typeof saveManualStagingCorrection !== 'function') {
    throw new TypeError('saveManualStagingCorrection function is required');
  }
  if (typeof loadCurrentRow !== 'function') {
    throw new TypeError('loadCurrentRow function is required');
  }
  if (typeof replaceEncodingWarningForPosition !== 'function') {
    throw new TypeError('replaceEncodingWarningForPosition function is required');
  }

  const before = await loadCurrentRow(input);
  const saveResult = await saveManualStagingCorrection(input);
  const after = await loadCurrentRow(input);
  const refresh = buildEncodingWarningRefreshResult({ before, after });

  await replaceEncodingWarningForPosition({
    runId: input.runId,
    position: input.position,
    warning: refresh.currentEncodingWarning
  });

  return {
    ...saveResult,
    ...refresh
  };
}
