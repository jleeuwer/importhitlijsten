import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditAside, EditMain } from "../../src/ui/pages/EditPage.jsx";

function makeCtrl(overrides = {}) {
  return {
    hitlijst: "",
    setHitlijst: vi.fn(),
    uitzendjaar: "",
    setUitzendjaar: vi.fn(),
    runs: [],
    runId: "run-1",
    msg: null,
    err: null,
    loadRuns: vi.fn(),
    selectRun: vi.fn(),
    saveRow: vi.fn(),
    fdStatusByPos: {},
    refreshFileDetailsStatus: vi.fn(),
    rows: [
      { hl_positie: 1, hl_jaar: 0, hl_find_cmd: "" },
      { hl_positie: 2, hl_jaar: 1984, hl_find_cmd: "" }
    ],
    metadataOptions: { omroepen: [], perioden: [] },
    exportStatus: null,
    exportStatusLoading: false,
    exportStatusError: null,
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
    previewEnrichYearsVisibleRows: vi.fn().mockResolvedValue({ updateable: 1 }),
    enrichYearsVisibleRows: vi.fn().mockResolvedValue({ updated: 1 }),
    visibleRowPositions: [1, 2],
    ...overrides
  };
}

describe("Edit year enrichment controls", () => {
  it("uses the existing Preview jaarverrijking action after SongSpelling and does not show the old new button", async () => {
    const ctrl = makeCtrl();
    render(<EditAside ctrl={ctrl} />);

    expect(screen.queryByRole("button", { name: /vul jaar uit file_details/i })).not.toBeInTheDocument();

    const buttons = screen.getAllByRole("button").map((button) => button.textContent?.trim());
    expect(buttons.indexOf("Preview jaarverrijking")).toBeGreaterThan(buttons.indexOf("SongSpelling"));

    fireEvent.click(screen.getByRole("button", { name: /preview jaarverrijking/i }));
    await waitFor(() => expect(ctrl.previewEnrichYearsVisibleRows).toHaveBeenCalledWith([1, 2]));
    expect(ctrl.enrichYearsVisibleRows).not.toHaveBeenCalled();
  });


  it("shows a close button only while the year enrichment alert is visible", () => {
    const ctrl = makeCtrl({
      yearEnrichmentPreview: {
        requested: 2,
        scanned: 2,
        updateable: 1,
        updated: 0,
        preview: [{ hlPositie: 1, status: "UPDATEABLE", candidateYear: 1984, sourceFdKey: 101, matchCount: 1 }]
      },
      yearEnrichmentPreviewVisible: true,
      closeYearEnrichmentPreview: vi.fn()
    });

    const { rerender } = render(<EditMain ctrl={ctrl} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/preview jaarverrijking\/resultaat/i);
    const closeButton = screen.getByRole("button", { name: /melding sluiten|sluiten/i });
    fireEvent.click(closeButton);
    expect(ctrl.closeYearEnrichmentPreview).toHaveBeenCalledTimes(1);

    rerender(<EditMain ctrl={{ ...ctrl, yearEnrichmentPreviewVisible: false }} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /melding sluiten|sluiten/i })).not.toBeInTheDocument();
  });

  it("can show the year enrichment alert again after it was hidden", () => {
    const preview = {
      requested: 1,
      scanned: 1,
      updateable: 1,
      updated: 0,
      preview: [{ hlPositie: 1, status: "UPDATEABLE", candidateYear: 1984, sourceFdKey: 101, matchCount: 1 }]
    };

    const { rerender } = render(<EditMain ctrl={makeCtrl({ yearEnrichmentPreview: preview, yearEnrichmentPreviewVisible: false })} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    rerender(<EditMain ctrl={makeCtrl({ yearEnrichmentPreview: preview, yearEnrichmentPreviewVisible: true, closeYearEnrichmentPreview: vi.fn() })} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/preview jaarverrijking\/resultaat/i);
    expect(screen.getByRole("button", { name: /melding sluiten|sluiten/i })).toBeInTheDocument();
  });

});
