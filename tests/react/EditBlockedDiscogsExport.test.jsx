/** @vitest-environment jsdom */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

describe("Edit blocked Discogs export", () => {
  it("disables the export button when there are no blocked rows with Discogs URL", () => {
    render(<EditAside ctrl={makeCtrl()} />);

    expect(screen.getByRole("button", { name: /export blocked discogs-links \(0\)/i })).toBeDisabled();
  });

  it("enables the export button and shows the count when rows are exportable", () => {
    render(<EditAside ctrl={makeCtrl({ blockedDiscogsExportSummary: { exportableCount: 7 } })} />);

    expect(screen.getByRole("button", { name: /export blocked discogs-links \(7\)/i })).toBeEnabled();
  });

  it("shows a summary warning when the backend count is temporarily unavailable", () => {
    render(<EditAside ctrl={makeCtrl({ blockedDiscogsExportError: "backend unavailable" })} />);

    expect(screen.getByText(/blocked discogs export summary is temporarily unavailable/i)).toBeInTheDocument();
  });
});
