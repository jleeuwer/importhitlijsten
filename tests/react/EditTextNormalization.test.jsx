/** @vitest-environment jsdom */
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import EditPage, { EditAside } from "../../src/ui/pages/EditPage.jsx";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("Edit text normalization", () => {
  it("calls preview and normalize for visible rows from the aside", async () => {
    const previewNormalizeVisibleRows = vi.fn().mockResolvedValue({ ok: true, requested: 2, scanned: 2, changedRows: 1, changedFields: 2, preview: [] });
    const normalizeVisibleRows = vi.fn().mockResolvedValue({ ok: true, requested: 2, scanned: 2, changedRows: 1, unchangedRows: 1, changedFields: 2 });

    const ctrl = {
      runId: "run-10",
      rows: [],
      exportStatus: null,
      busy: false,
      visibleRowPositions: [5, 6],
      setBusy: vi.fn(),
      setErr: vi.fn(),
      setMsg: vi.fn(),
      refreshRows: vi.fn(),
      artistSpellingDone: true,
      decodeHtmlEntitiesForRun: async () => {},
      runArtistSpelling: async () => {},
      runPatternDelete: async () => {},
      runSongSpelling: async () => {},
      exportHitlijsten: async () => {},
      repairSuspectedTitleArtistSwaps: async () => {},
      forceSwapVisibleRows: async () => {},
      previewNormalizeVisibleRows,
      normalizeVisibleRows
    };

    render(<EditAside ctrl={ctrl} />);

    fireEvent.click(screen.getByRole("button", { name: /Preview tekstnormalisatie/i }));
    await waitFor(() => {
      expect(previewNormalizeVisibleRows).toHaveBeenCalledWith([5, 6]);
    });

    fireEvent.click(screen.getByRole("button", { name: /Normaliseer tekst \(zichtbare rijen\)/i }));
    await waitFor(() => {
      expect(normalizeVisibleRows).toHaveBeenCalledWith([5, 6]);
    });
  });

  it("renders normalization preview details in the edit page", () => {
    const ctrl = {
      hitlijst: "",
      setHitlijst: () => {},
      uitzendjaar: "",
      setUitzendjaar: () => {},
      runs: [],
      runId: "run-11",
      rows: [],
      msg: null,
      err: null,
      busy: false,
      fdStatusByPos: {},
      artistSpellingDone: false,
      patternPreview: [],
      normalizationPreview: {
        requested: 2,
        scanned: 2,
        changedRows: 1,
        changedFields: 2,
        preview: [
          {
            hlPositie: 7,
            changes: [
              { field: "hl_artiest", before: "CafÃ©", after: "Café" },
              { field: "hl_titel_song", before: "  Song  ", after: "Song" }
            ]
          }
        ]
      },
      exportStatus: null,
      setMsg: () => {},
      setErr: () => {},
      setBusy: () => {},
      loadRuns: async () => {},
      selectRun: async () => {},
      refreshRows: async () => {},
      saveRow: async () => {},
      decodeHtmlEntitiesForRun: async () => {},
      runArtistSpelling: async () => {},
      runPatternDelete: async () => {},
      runSongSpelling: async () => {},
      refreshFileDetailsStatus: async () => {},
      exportHitlijsten: async () => {},
      repairSuspectedTitleArtistSwaps: async () => {},
      forceSwapVisibleRows: async () => {},
      previewNormalizeVisibleRows: async () => {},
      normalizeVisibleRows: async () => {},
      setVisibleRowPositions: () => {}
    };

    render(<EditPage ctrl={ctrl} />);

    expect(screen.getByText(/Text normalization preview/i)).toBeInTheDocument();
    expect(screen.getByText(/hl_artiest: CafÃ© -> Café/i)).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes("hl_titel_song:") && content.includes("-> Song"))).toBeInTheDocument();
  });
});
