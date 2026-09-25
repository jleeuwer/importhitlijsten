export const EDIT_WORKFLOW_STEPS = [
  {
    id: "view",
    title: "Bekijken",
    description: "Run laden, filters gebruiken en read-only exports bekijken."
  },
  {
    id: "normalize",
    title: "Normaliseren",
    description: "Importtekst opschonen voordat correcties en matching worden uitgevoerd."
  },
  {
    id: "correct",
    title: "Correcte artiest/titel",
    description: "Artiest- en songspelling bepalen zodat vervolgstappen betrouwbare input hebben."
  },
  {
    id: "enrich",
    title: "Verrijken/controleren",
    description: "Jaartallen, duplicates en Discogs-controles uitvoeren op basis van correcte metadata."
  },
  {
    id: "export",
    title: "Exporteren",
    description: "Alleen exporteren wanneer blocking issues opgelost zijn."
  },
  {
    id: "postExport",
    title: "Na export corrigeren",
    description: "Na export alleen veilige post-export correcties gebruiken die naar hitlijsten propageren."
  }
];

export const PRE_EXPORT_DISABLED_REASON = "Niet beschikbaar na export. Gebruik Correctie na export.";
export const NO_RUN_REASON = "Selecteer eerst een run.";
export const BUSY_REASON = "Er is al een bewerking bezig.";
export const NEED_ARTIST_SPELLING_REASON = "Run eerst ArtistSpelling.";
export const NEED_VISIBLE_ROWS_REASON = "Geen zichtbare rijen beschikbaar.";
export const NEED_DUPLICATES_REASON = "Geen duplicate bestandsnamen gevonden.";
export const NEED_FIND_CMD_REASON = "Geen gevulde Find-cmd waarden voor deze run.";
export const NEED_BLOCKED_DISCOGS_REASON = "Geen blocked rijen met Discogs URL gevonden.";

const ACTION_DEFINITIONS = {
  refreshRows: { step: "view", kind: "read" },
  exportFindCmd: { step: "view", kind: "read", requiresFindCmd: true },
  exportBlockedDiscogs: { step: "view", kind: "read", requiresBlockedDiscogs: true },
  decodeHtml: { step: "normalize", kind: "preExportMutation" },
  patternDelete: { step: "normalize", kind: "preExportMutation" },
  patternSuggestions: { step: "normalize", kind: "read" },
  previewTextNormalization: { step: "normalize", kind: "preExportMutation", requiresVisibleRows: true },
  applyTextNormalization: { step: "normalize", kind: "preExportMutation", requiresVisibleRows: true },
  previewEncodingRepair: { step: "normalize", kind: "preExportMutation", requiresVisibleRows: true },
  applyEncodingRepair: { step: "normalize", kind: "preExportMutation", requiresVisibleRows: true },
  artistSpelling: { step: "correct", kind: "preExportMutation" },
  songSpelling: { step: "correct", kind: "preExportMutation", requiresArtistSpelling: true },
  repairSwapBatch: { step: "correct", kind: "preExportMutation" },
  forceSwapVisible: { step: "correct", kind: "preExportMutation", requiresVisibleRows: true },
  previewYearEnrichment: { step: "enrich", kind: "preExportMutation", requiresVisibleRows: true, requiresArtistSpelling: true },
  markDuplicatesSkip: { step: "enrich", kind: "preExportMutation", requiresDuplicates: true },
  exportHitlijsten: { step: "export", kind: "export" },
  postExportCorrection: { step: "postExport", kind: "postExport" }
};

function normalizeCount(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function getEditWorkflowActionState(actionKey, context = {}) {
  const def = ACTION_DEFINITIONS[actionKey] || { step: "view", kind: "read" };
  const runSelected = Boolean(context.runId);
  const busy = Boolean(context.busy);
  const alreadyExported = Boolean(context.alreadyExported);
  const exportStatusLoading = Boolean(context.exportStatusLoading);
  const exportBlocked = Boolean(context.exportBlocked);
  const artistSpellingDone = Boolean(context.artistSpellingDone);
  const visibleRowCount = normalizeCount(context.visibleRowCount);
  const duplicateImportCount = normalizeCount(context.duplicateImportCount);
  const findCmdCount = normalizeCount(context.findCmdCount);
  const blockedDiscogsExportCount = normalizeCount(context.blockedDiscogsExportCount);

  if (!runSelected) return { disabled: true, reason: NO_RUN_REASON, step: def.step, variantHint: "missing-run" };
  if (busy) return { disabled: true, reason: BUSY_REASON, step: def.step, variantHint: "busy" };

  if (def.kind === "preExportMutation" && alreadyExported) {
    return { disabled: true, reason: PRE_EXPORT_DISABLED_REASON, step: def.step, variantHint: "after-export" };
  }

  if (def.requiresArtistSpelling && !artistSpellingDone) {
    return { disabled: true, reason: NEED_ARTIST_SPELLING_REASON, step: def.step, variantHint: "missing-prerequisite" };
  }

  if (def.requiresVisibleRows && visibleRowCount === 0) {
    return { disabled: true, reason: NEED_VISIBLE_ROWS_REASON, step: def.step, variantHint: "missing-prerequisite" };
  }

  if (def.requiresDuplicates && duplicateImportCount === 0) {
    return { disabled: true, reason: NEED_DUPLICATES_REASON, step: def.step, variantHint: "missing-prerequisite" };
  }

  if (def.requiresFindCmd && findCmdCount === 0) {
    return { disabled: true, reason: NEED_FIND_CMD_REASON, step: def.step, variantHint: "missing-prerequisite" };
  }

  if (def.requiresBlockedDiscogs && blockedDiscogsExportCount === 0) {
    return { disabled: true, reason: NEED_BLOCKED_DISCOGS_REASON, step: def.step, variantHint: "missing-prerequisite" };
  }

  if (def.kind === "export") {
    if (exportStatusLoading) {
      return { disabled: true, reason: "Exportstatus wordt geladen.", step: def.step, variantHint: "loading" };
    }
    if (exportBlocked) {
      return {
        disabled: true,
        reason: context.exportBlockedReason ? `Export blocked: ${context.exportBlockedReason}` : "Export blocked.",
        step: def.step,
        variantHint: alreadyExported ? "after-export" : "blocked"
      };
    }
  }

  return { disabled: false, reason: "", step: def.step, variantHint: "available" };
}

export function getEditWorkflowPolicy(context = {}) {
  const actions = Object.keys(ACTION_DEFINITIONS).reduce((acc, actionKey) => {
    acc[actionKey] = getEditWorkflowActionState(actionKey, context);
    return acc;
  }, {});
  return { steps: EDIT_WORKFLOW_STEPS, actions };
}
