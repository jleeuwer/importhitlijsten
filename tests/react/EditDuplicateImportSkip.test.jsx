/** @vitest-environment jsdom */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { EditAside } from "../../src/ui/pages/EditPage.jsx";

function makeCtrl(overrides = {}) {
  return {
    runId: "run-1",
    rows: [],
    metadataOptions: { omroepen: [], perioden: [] },
    exportStatus: null,
    exportStatusLoading: false,
    exportStatusError: null,
    blockedDiscogsExportSummary: { exportableCount: 0 },
    blockedDiscogsExportLoading: false,
    blockedDiscogsExportError: null,
    duplicateImportSummary: { duplicateCount: 0, existingFileDetailsDuplicateCount: 0, inRunDuplicateCount: 0, skippedCount: 0 },
    duplicateImportLoading: false,
    duplicateImportError: null,
    markDuplicateRowsAsSkip: vi.fn(),
    busy: false,
    setBusy: vi.fn(),
    setErr: vi.fn(),
    setMsg: vi.fn(),
    refreshRows: vi.fn(),
    artistSpellingDone: true,
    decodeHtmlEntitiesForRun: vi.fn(),
    runArtistSpelling: vi.fn(),
    runPatternDelete: vi.fn(),
    runSongSpelling: vi.fn(),
    exportHitlijsten: vi.fn(),
    saveRunMetadata: vi.fn(),
    repairSuspectedTitleArtistSwaps: vi.fn(),
    forceSwapVisibleRows: vi.fn(),
    previewNormalizeVisibleRows: vi.fn(),
    normalizeVisibleRows: vi.fn(),
    previewEncodingRepairVisibleRows: vi.fn(),
    repairEncodingVisibleRows: vi.fn(),
    previewEnrichYearsVisibleRows: vi.fn(),
    enrichYearsVisibleRows: vi.fn(),
    visibleRowPositions: [],
    ...overrides
  };
}

describe("Edit duplicate import skip action", () => {
  it("disables the bulk Skip button when there are no duplicate filenames", () => {
    render(<EditAside ctrl={makeCtrl()} />);

    expect(screen.getByRole("button", { name: /zet duplicates op skip \(0\)/i })).toBeDisabled();
  });

  it("shows duplicate counts and calls the bulk Skip action after confirmation", async () => {
    const markDuplicateRowsAsSkip = vi.fn().mockResolvedValue({ updatedRows: 3 });
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);

    render(<EditAside ctrl={makeCtrl({
      duplicateImportSummary: {
        duplicateCount: 3,
        existingFileDetailsDuplicateCount: 2,
        inRunDuplicateCount: 1,
        skippedCount: 0
      },
      markDuplicateRowsAsSkip
    })} />);

    expect(screen.getByText(/duplicates: 2 bestaand in file_details, 1 dubbel binnen deze run/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /zet duplicates op skip \(3\)/i }));

    await waitFor(() => expect(markDuplicateRowsAsSkip).toHaveBeenCalledTimes(1));
  });
});
