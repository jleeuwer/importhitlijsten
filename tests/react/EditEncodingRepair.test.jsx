/** @vitest-environment jsdom */
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import EditPage, { EditAside } from "../../src/ui/pages/EditPage.jsx";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("Edit encoding repair", () => {
  it("calls preview and repair for visible rows from the aside", async () => {
    const previewEncodingRepairVisibleRows = vi.fn().mockResolvedValue({ ok: true, requested: 2, scanned: 2, damagedRows: 2, repairableRows: 1, preview: [] });
    const repairEncodingVisibleRows = vi.fn().mockResolvedValue({ ok: true, requested: 2, scanned: 2, damagedRows: 2, repaired: 1, skipped: 1 });

    const ctrl = {
      runId: "run-12",
      rows: [],
      exportStatus: null,
      busy: false,
      visibleRowPositions: [4, 5],
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
      previewNormalizeVisibleRows: async () => {},
      normalizeVisibleRows: async () => {},
      previewEncodingRepairVisibleRows,
      repairEncodingVisibleRows
    };

    render(<EditAside ctrl={ctrl} />);

    fireEvent.click(screen.getByRole("button", { name: /Preview encoding repair/i }));
    await waitFor(() => {
      expect(previewEncodingRepairVisibleRows).toHaveBeenCalledWith([4, 5]);
    });

    fireEvent.click(screen.getByRole("button", { name: /Repair encoding \(zichtbare rijen\)/i }));
    await waitFor(() => {
      expect(repairEncodingVisibleRows).toHaveBeenCalledWith([4, 5]);
    });
  });

  it("renders encoding repair preview details in the edit page", () => {
    const ctrl = {
      hitlijst: "",
      setHitlijst: () => {},
      uitzendjaar: "",
      setUitzendjaar: () => {},
      runs: [],
      runId: "run-13",
      rows: [],
      msg: null,
      err: null,
      busy: false,
      fdStatusByPos: {},
      artistSpellingDone: false,
      patternPreview: [],
      normalizationPreview: null,
      encodingRepairPreview: {
        requested: 2,
        scanned: 2,
        damagedRows: 2,
        repairableRows: 1,
        preview: [
          {
            hlPositie: 4,
            changes: [{ field: "hl_artiest", before: "BelgiÃ«", after: "België" }],
            reasons: ["RECOVERABLE_ENCODING_DAMAGE"]
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
      previewEncodingRepairVisibleRows: async () => {},
      repairEncodingVisibleRows: async () => {},
      setVisibleRowPositions: () => {}
    };

    render(<EditPage ctrl={ctrl} />);

    expect(screen.getByText(/Encoding repair preview/i)).toBeInTheDocument();
    expect(screen.getByText(/hl_artiest: BelgiÃ« -> België/i)).toBeInTheDocument();
    expect(screen.getByText(/reasons: RECOVERABLE_ENCODING_DAMAGE/i)).toBeInTheDocument();
  });
});
