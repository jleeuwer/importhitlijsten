import { describe, expect, it } from "vitest";
import { getEditWorkflowActionState, getEditWorkflowPolicy } from "../src/ui/utils/editWorkflowPolicy.js";

describe("editWorkflowPolicy", () => {
  it("keeps read-only actions available after export when their own prerequisites are met", () => {
    const context = {
      runId: "run-1",
      alreadyExported: true,
      findCmdCount: 1,
      blockedDiscogsExportCount: 1
    };

    expect(getEditWorkflowActionState("refreshRows", context)).toMatchObject({ disabled: false, step: "view" });
    expect(getEditWorkflowActionState("exportFindCmd", context)).toMatchObject({ disabled: false, step: "view" });
  });

  it("disables pre-export mutations after export", () => {
    const context = {
      runId: "run-1",
      alreadyExported: true,
      artistSpellingDone: true,
      visibleRowCount: 3,
      duplicateImportCount: 2
    };

    expect(getEditWorkflowActionState("forceSwapVisible", context)).toMatchObject({
      disabled: true,
      variantHint: "after-export"
    });
    expect(getEditWorkflowActionState("previewYearEnrichment", context).reason).toMatch(/Correctie na export/i);
  });

  it("enforces prerequisites before export", () => {
    const context = {
      runId: "run-1",
      alreadyExported: false,
      artistSpellingDone: false,
      visibleRowCount: 0,
      duplicateImportCount: 0
    };

    expect(getEditWorkflowActionState("songSpelling", context)).toMatchObject({ disabled: true });
    expect(getEditWorkflowActionState("songSpelling", context).reason).toMatch(/ArtistSpelling/i);
    expect(getEditWorkflowActionState("forceSwapVisible", context).reason).toMatch(/Geen zichtbare rijen/i);
    expect(getEditWorkflowActionState("markDuplicatesSkip", context).reason).toMatch(/Geen duplicate/i);
  });

  it("exposes workflow steps and action states", () => {
    const policy = getEditWorkflowPolicy({ runId: "run-1", artistSpellingDone: true, visibleRowCount: 1 });
    expect(policy.steps.map((step) => step.title)).toContain("Normaliseren");
    expect(policy.steps.map((step) => step.title)).toContain("Exporteren");
    expect(policy.actions.artistSpelling.step).toBe("correct");
    expect(policy.actions.previewYearEnrichment.step).toBe("enrich");
  });
});
