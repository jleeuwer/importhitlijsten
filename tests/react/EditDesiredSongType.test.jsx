/** @vitest-environment jsdom */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { EditMain } from "../../src/ui/pages/EditPage.jsx";

function makeCtrl(overrides = {}) {
  return {
    hitlijst: "",
    setHitlijst: () => {},
    uitzendjaar: "",
    setUitzendjaar: () => {},
    runs: [],
    metadataOptions: { omroepen: [], perioden: [] },
    songTypes: [
      { st_song_type_key: 10, st_song_type: "S", st_song_type_desc: "Single versie", display_name: "Single versie" },
      { st_song_type_key: 20, st_song_type: "L", st_song_type_desc: "Live versie", display_name: "Live versie" }
    ],
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
        hl_artist_key: 123,
        fd_action: "Keep",
        hl_desired_song_type_key: 10,
        desired_song_type_desc: "Single versie",
        desired_song_type_display: "Single versie"
      }
    ],
    msg: null,
    err: null,
    busy: false,
    fdStatusByPos: { "1": { matchCount: 1, effective_title: "Correct Title", source: "song_spelling" } },
    artistSpellingDone: true,
    patternPreview: [],
    patternSuggestions: null,
    patternSuggestionsPreview: null,
    patternSuggestionsResult: null,
    patternSuggestionsLoading: false,
    patternSuggestionsModalVisible: false,
    setPatternSuggestionsModalVisible: vi.fn(),
    openPatternSuggestions: vi.fn(),
    previewPatternSuggestions: vi.fn(),
    addPatternSuggestions: vi.fn(),
    normalizationPreview: null,
    encodingRepairPreview: null,
    yearEnrichmentPreview: null,
    yearEnrichmentPreviewVisible: false,
    closeYearEnrichmentPreview: vi.fn(),
    exportStatus: { alreadyExported: false, existingRowsForTarget: 0 },
    exportStatusLoading: false,
    exportStatusError: null,
    visibleRowPositions: [1],
    setVisibleRowPositions: () => {},
    setMsg: vi.fn(),
    setErr: vi.fn(),
    setBusy: vi.fn(),
    loadRuns: async () => {},
    selectRun: async () => {},
    refreshRows: vi.fn(async () => {}),
    saveRow: vi.fn(async () => {}),
    saveDesiredSongTypeForRow: vi.fn(async () => {}),
    decodeHtmlEntitiesForRun: async () => {},
    runArtistSpelling: async () => {},
    runPatternDelete: async () => {},
    runSongSpelling: async () => {},
    refreshFileDetailsStatus: async () => {},
    loadBlockedDiscogsExportSummary: async () => {},
    loadDuplicateImportSummary: async () => {},
    markDuplicateRowsAsSkip: async () => {},
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
    blockedDiscogsExportSummary: { exportableCount: 0 },
    blockedDiscogsExportLoading: false,
    blockedDiscogsExportError: null,
    duplicateImportSummary: { duplicateCount: 0, existingFileDetailsDuplicateCount: 0, inRunDuplicateCount: 0, skippedCount: 0 },
    duplicateImportLoading: false,
    duplicateImportError: null,
    ...overrides
  };
}

describe("Edit gewenste versie/song type", () => {
  it("toont song_types omschrijvingen in de dropdown en slaat de key direct op", async () => {
    const ctrl = makeCtrl();
    render(<EditMain ctrl={ctrl} />);

    const select = screen.getByLabelText(/Gewenste versie voor positie 1/i);
    expect(select).toHaveValue("10");
    expect(screen.getByRole("option", { name: "Single versie" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Live versie" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "10" })).not.toBeInTheDocument();

    fireEvent.change(select, { target: { value: "20" } });

    await waitFor(() => {
      expect(ctrl.saveDesiredSongTypeForRow).toHaveBeenCalledWith(1, 20);
    });
    expect(ctrl.saveRow).not.toHaveBeenCalled();
  });


  it("houdt de gekozen versie lokaal zichtbaar terwijl direct opslaan loopt", async () => {
    let resolveSave;
    const ctrl = makeCtrl({
      saveDesiredSongTypeForRow: vi.fn(() => new Promise((resolve) => { resolveSave = resolve; }))
    });
    render(<EditMain ctrl={ctrl} />);

    const select = screen.getByLabelText(/Gewenste versie voor positie 1/i);
    fireEvent.change(select, { target: { value: "20" } });

    expect(select).toHaveValue("20");
    expect(screen.getByText(/Versie opslaan/i)).toBeInTheDocument();
    resolveSave();

    await waitFor(() => {
      expect(screen.queryByText(/Versie opslaan/i)).not.toBeInTheDocument();
    });
  });

  it("blokkeert wijzigen van gewenste versie na export", () => {
    const ctrl = makeCtrl({ exportStatus: { alreadyExported: true, existingRowsForTarget: 5 } });
    render(<EditMain ctrl={ctrl} />);

    expect(screen.getByLabelText(/Gewenste versie voor positie 1/i)).toBeDisabled();
  });
});
