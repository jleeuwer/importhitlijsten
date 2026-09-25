/** @vitest-environment jsdom */
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { EditMain } from "../../src/ui/pages/EditPage.jsx";

function makeCtrl(overrides = {}) {
  return {
    hitlijst: "",
    setHitlijst: () => {},
    uitzendjaar: "",
    setUitzendjaar: () => {},
    runs: [],
    runId: "run-1",
    rows: [
      {
        hl_import_run_id: "run-1",
        hl_positie: 1,
        hl_artiest: "Nirvanna",
        hl_titel_song: "Smels Like Teen Spirit",
        hl_jaar: 1991,
        fd_tag_title: "",
        as_correcte_artiest_spelling: "Nirvana",
        fd_action: "Keep",
        hl_discogs_link: "",
        hl_find_cmd: "",
        hl_artist_key: 101
      }
    ],
    msg: null,
    err: null,
    busy: false,
    setMsg: vi.fn(),
    setErr: vi.fn(),
    setBusy: vi.fn(),
    loadRuns: async () => {},
    selectRun: async () => {},
    refreshRows: vi.fn(async () => {}),
    saveRow: async () => {},
    fdStatusByPos: { "1": { matchCount: 0, effective_title: "", source: "missing" } },
    refreshFileDetailsStatus: vi.fn(async () => {}),
    exportStatus: null,
    exportStatusLoading: false,
    exportStatusError: null,
    setVisibleRowPositions: () => {},
    duplicateImportSummary: { duplicateCount: 0, duplicateRows: [] },
    blockedDiscogsExportSummary: { exportableCount: 0 },
    decodeHtmlEntitiesForRun: async () => {},
    runArtistSpelling: async () => {},
    runPatternDelete: async () => {},
    runSongSpelling: async () => {},
    exportHitlijsten: async () => {},
    saveRunMetadata: async () => {},
    repairSuspectedTitleArtistSwaps: async () => {},
    forceSwapVisibleRows: async () => {},
    previewNormalizeVisibleRows: async () => {},
    normalizeVisibleRows: async () => {},
    previewEncodingRepairVisibleRows: async () => {},
    repairEncodingVisibleRows: async () => {},
    previewEnrichYearsVisibleRows: async () => {},
    enrichYearsVisibleRows: async () => {},
    markDuplicateRowsAsSkip: async () => {},
    ...overrides
  };
}

describe("Edit AltSpelling feedback", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows clear feedback that title correction and song_spelling were stored", async () => {
    const ctrl = makeCtrl();
    const fetchMock = vi.fn(async (url, options = {}) => {
      const method = options?.method || "GET";
      const urlText = String(url);

      if (urlText.startsWith("/api/file-details-by-artist")) {
        return {
          ok: true,
          json: async () => ({ rows: [{ fd_tag_title: "Smells Like Teen Spirit" }] })
        };
      }

      if (urlText === "/api/altspelling-apply" && method === "POST") {
        return {
          ok: true,
          json: async () => ({ ok: true, staging: { hl_positie: 1, fd_tag_title: "Smells Like Teen Spirit" } })
        };
      }

      return { ok: true, json: async () => ({ ok: true }) };
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<EditMain ctrl={ctrl} />);

    fireEvent.click(screen.getByRole("button", { name: /AltSpelling/i }));

    const dialog = await screen.findByRole("dialog", { name: /Select fd_tag_title/i });
    fireEvent.click(within(dialog).getByRole("button", { name: /Select/i }));

    await waitFor(() => {
      expect(ctrl.setMsg).toHaveBeenCalledWith("Titelcorrectie opgeslagen; song_spelling is bijgewerkt.");
    });
    expect(ctrl.refreshRows).toHaveBeenCalled();
    expect(ctrl.refreshFileDetailsStatus).toHaveBeenCalled();
  });
});
