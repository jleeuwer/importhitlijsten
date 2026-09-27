import { describe, expect, it } from "vitest";
import {
  buildStagingDuplicateReview,
  normalizeDuplicateText,
  validateDuplicateSelection
} from "../services/stagingDuplicateRowService.js";

describe("BL-IMP-136 staging duplicate row review", () => {
  it("normalizes technical text differences without using position as identity", () => {
    expect(normalizeDuplicateText("  Doctorin’\u00a0 The   House ")).toBe("doctorin' the house");

    const review = buildStagingDuplicateReview([
      { sh_key: 10, hl_positie: 4, hl_artiest: "Coldcut", hl_titel_song: "Doctorin’ The House", fd_action: "Keep" },
      { sh_key: 11, hl_positie: 89, hl_artiest: " coldcut ", hl_titel_song: "Doctorin'  The House", fd_action: "Keep" },
      { sh_key: 12, hl_positie: 90, hl_artiest: "Coldcut", hl_titel_song: "Doctorin' The House (Live)", fd_action: "Keep" }
    ]);

    expect(review.groupCount).toBe(1);
    expect(review.matchedRowCount).toBe(2);
    expect(review.duplicateRowCount).toBe(1);
    expect(review.groups[0].rows.map((row) => row.hl_positie)).toEqual([4, 89]);
    expect(review.groups[0].recommendedKeepKey).toBe(10);
    expect(review.groups[0].suggestedDeleteKeys).toEqual([11]);
  });

  it("does not group rows with missing artist or title", () => {
    const review = buildStagingDuplicateReview([
      { sh_key: 1, hl_positie: 1, hl_artiest: "", hl_titel_song: "Unknown" },
      { sh_key: 2, hl_positie: 2, hl_artiest: "", hl_titel_song: "Unknown" },
      { sh_key: 3, hl_positie: 3, hl_artiest: "Artist", hl_titel_song: null },
      { sh_key: 4, hl_positie: 4, hl_artiest: "Artist", hl_titel_song: null }
    ]);
    expect(review.groupCount).toBe(0);
  });

  it("requires at least one row to remain in every duplicate group", () => {
    const review = buildStagingDuplicateReview([
      { sh_key: 1, hl_positie: 1, hl_artiest: "A", hl_titel_song: "Song" },
      { sh_key: 2, hl_positie: 2, hl_artiest: "A", hl_titel_song: "Song" }
    ]);

    expect(() => validateDuplicateSelection(review, [2])).not.toThrow();
    expect(() => validateDuplicateSelection(review, [1, 2])).toThrow(/minimaal één rij moet behouden blijven/i);
    expect(() => validateDuplicateSelection(review, [999])).toThrow(/behoort niet tot een actuele duplicategroep/i);
  });
});
