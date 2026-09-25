/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { normalizeExportStatusPayload } from "../../src/ui/pages/EditPage.jsx";

describe("normalizeExportStatusPayload", () => {
  it("preserves exported status fields from the export status endpoint", () => {
    const status = normalizeExportStatusPayload({
      alreadyExported: true,
      existingRowsForTarget: 80,
      duplicateExportBlocked: true,
      hl_hitlijst: "Top 100",
      hl_uitzendjaar: 1985,
      missingLinks: 0,
      missingFdTagTitle: 0,
      missingHlArtistKey: 0,
      multipleLinks: 2,
      issuesPreview: [{ hl_positie: 1 }]
    });

    expect(status.alreadyExported).toBe(true);
    expect(status.existingRowsForTarget).toBe(80);
    expect(status.duplicateExportBlocked).toBe(true);
    expect(status.hl_hitlijst).toBe("Top 100");
    expect(status.hl_uitzendjaar).toBe(1985);
    expect(status.multipleLinks).toBe(2);
    expect(status.issuesPreview).toHaveLength(1);
  });

  it("treats existing exported rows as exported even when the boolean is missing", () => {
    const status = normalizeExportStatusPayload({ existingRowsForTarget: 3 });

    expect(status.alreadyExported).toBe(true);
    expect(status.duplicateExportBlocked).toBe(true);
  });
});
