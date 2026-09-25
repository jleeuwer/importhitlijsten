/** @vitest-environment jsdom */
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { buildArtistTitleClipboardText, EditMain } from "../../src/ui/pages/EditPage.jsx";

function makeCtrl(rowOverrides = {}) {
  return {
    hitlijst: "",
    setHitlijst: () => {},
    uitzendjaar: "",
    setUitzendjaar: () => {},
    runs: [],
    metadataOptions: { omroepen: [], perioden: [] },
    runId: "run-1",
    rows: [
      {
        hl_import_run_id: "run-1",
        hl_positie: 1,
        hl_artiest: "Raw Artist",
        hl_titel_song: "Raw Title",
        hl_jaar: 1984,
        fd_tag_title: "Correct Title",
        as_correcte_artiest_spelling: "Correct Artist",
        hl_discogs_link: "",
        hl_find_cmd: "",
        hl_artist_key: 101,
        ...rowOverrides
      }
    ],
    msg: null,
    err: null,
    busy: false,
    fdStatusByPos: { "1": { matchCount: 1, effective_title: "Correct Title", source: "song_spelling" } },
    artistSpellingDone: true,
    patternPreview: [],
    normalizationPreview: null,
    encodingRepairPreview: null,
    exportStatus: null,
    exportStatusLoading: false,
    exportStatusError: null,
    visibleRowPositions: [],
    setVisibleRowPositions: () => {},
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
    saveRunMetadata: async () => {},
    repairSuspectedTitleArtistSwaps: async () => {},
    forceSwapVisibleRows: async () => {},
    previewNormalizeVisibleRows: async () => {},
    normalizeVisibleRows: async () => {},
    previewEncodingRepairVisibleRows: async () => {},
    repairEncodingVisibleRows: async () => {}
  };
}

describe("Edit clipboard copy", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true
    });
  });

  it("builds clipboard text from corrected artist and corrected title", () => {
    expect(
      buildArtistTitleClipboardText(
        { as_correcte_artiest_spelling: "Correct Artist", fd_tag_title: "Correct Title" },
        {}
      )
    ).toBe("Correct Artist - Correct Title");
  });

  it("falls back to staging artist and title when corrected values are missing", () => {
    expect(
      buildArtistTitleClipboardText(
        { hl_artiest: "Raw Artist", hl_titel_song: "Raw Title" },
        { as_correcte_artiest_spelling: "", fd_tag_title: "" }
      )
    ).toBe("Raw Artist - Raw Title");
  });

  it("copies corrected artist and title when the user clicks the correct artist control", async () => {
    render(<EditMain ctrl={makeCtrl()} />);

    fireEvent.click(screen.getByRole("button", { name: /klik om te kopiëren: correct artist - correct title/i }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Correct Artist - Correct Title");
      expect(screen.getByRole("status")).toHaveTextContent(/Gekopieerd/i);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/discogs link voor positie 1/i)).toHaveFocus();
    });
  });
});
