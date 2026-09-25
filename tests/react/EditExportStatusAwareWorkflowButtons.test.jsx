/** @vitest-environment jsdom */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { EditAside } from "../../src/ui/pages/EditPage.jsx";

function makeCtrl(overrides = {}) {
  return {
    runId: "run-1",
    rows: [{ hl_positie: 1, hl_find_cmd: "find . -name '*.mp3'" }],
    metadataOptions: { omroepen: [], perioden: [] },
    exportStatus: { alreadyExported: false, existingRowsForTarget: 0 },
    exportStatusLoading: false,
    exportStatusError: null,
    blockedDiscogsExportSummary: { exportableCount: 0 },
    blockedDiscogsExportLoading: false,
    blockedDiscogsExportError: null,
    duplicateImportSummary: { duplicateCount: 1, existingFileDetailsDuplicateCount: 1, inRunDuplicateCount: 0 },
    duplicateImportLoading: false,
    duplicateImportError: null,
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
    markDuplicateRowsAsSkip: vi.fn(),
    previewEnrichYearsVisibleRows: vi.fn(),
    enrichYearsVisibleRows: vi.fn(),
    openPatternSuggestions: vi.fn().mockResolvedValue(undefined),
    visibleRowPositions: [1],
    ...overrides
  };
}

describe("EditAside exportstatus-aware workflow buttons", () => {
  it("disables staging-only pre-export actions after export and shows guidance", () => {
    render(<EditAside ctrl={makeCtrl({
      exportStatus: {
        alreadyExported: true,
        existingRowsForTarget: 10,
        hl_hitlijst: "Top 100",
        hl_uitzendjaar: 1985
      }
    })} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/al geëxporteerd naar hitlijsten/i);
    expect(screen.getByRole("button", { name: /artistspelling/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /songspelling/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /preview jaarverrijking/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /forceer titel\/artiest swap/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /normaliseer tekst/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /zet duplicates op skip/i })).toBeDisabled();

    expect(screen.getByRole("button", { name: /refresh rows/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /export find-cmd script/i })).not.toBeDisabled();
  });

  it("keeps pre-export actions available before export when prerequisites are present", () => {
    render(<EditAside ctrl={makeCtrl()} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /artistspelling/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /songspelling/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /forceer titel\/artiest swap/i })).not.toBeDisabled();
  });

  it("wires Pattern suggesties to the controller handler without a missing variable error", async () => {
    const ctrl = makeCtrl();
    render(<EditAside ctrl={ctrl} />);

    fireEvent.click(screen.getByRole("button", { name: /pattern suggesties/i }));

    await waitFor(() => {
      expect(ctrl.openPatternSuggestions).toHaveBeenCalledTimes(1);
    });
    expect(ctrl.setErr).not.toHaveBeenCalledWith(expect.stringMatching(/openPatternSuggestions|Can\'t find variable/i));
  });

});
