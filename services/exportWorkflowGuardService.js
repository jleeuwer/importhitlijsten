export function isRunAlreadyExported(status = {}) {
  return status?.alreadyExported === true || Number(status?.existingRowsForTarget ?? 0) > 0;
}

export function buildPreExportActionBlockedMessage(status = {}) {
  const hitlijst = status?.hl_hitlijst ?? "?";
  const jaar = status?.hl_uitzendjaar ?? "?";
  const count = Number(status?.existingRowsForTarget ?? 0);
  return `Deze actie is niet beschikbaar na export. Gebruik Correctie na export. Hitlijst ${hitlijst} / ${jaar} is al geëxporteerd (${count} bestaande rij(en)).`;
}

async function defaultExportStatusLoader(runId) {
  const { getExportHitlijstenStatus } = await import("../models/hitlijsten.js");
  return getExportHitlijstenStatus(runId);
}

export async function assertPreExportActionAllowed(runId, { statusLoader = defaultExportStatusLoader } = {}) {
  const safeRunId = String(runId || "").trim();
  if (!safeRunId) {
    const error = new Error("runId is required");
    error.status = 400;
    throw error;
  }

  const status = await statusLoader(safeRunId);
  if (isRunAlreadyExported(status)) {
    const error = new Error(buildPreExportActionBlockedMessage(status));
    error.status = 409;
    error.code = "PRE_EXPORT_ACTION_BLOCKED_AFTER_EXPORT";
    error.exportStatus = status;
    throw error;
  }
  return status;
}
