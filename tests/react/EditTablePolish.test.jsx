/** @vitest-environment jsdom */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { EditMain, resolveDiscogsTableLink, isSafeDiscogsExternalUrl } from "../../src/ui/pages/EditPage.jsx";

function makeCtrl(overrides = {}) {
  const row = {
    hl_import_run_id: "run-1",
    hl_positie: 1,
    hl_artiest: "Raw Artist",
    hl_titel_song: "Raw Title",
    hl_jaar: 1991,
    fd_tag_title: "Correct Title",
    as_correcte_artiest_spelling: "Correct Artist",
    hl_discogs_link: "",
    discogs_master_url: "",
    discogs_release_url: "",
    hl_find_cmd: "find . -name '*Raw Title*'",
    hl_artist_key: 12345,
    fd_action: "Keep",
    hl_desired_song_type_key: 10,
    ...overrides.row
  };

  return {
    hitlijst: "",
    setHitlijst: () => {},
    uitzendjaar: "",
    setUitzendjaar: () => {},
    runs: [],
    metadataOptions: { omroepen: [], perioden: [] },
    songTypes: [
      { st_song_type_key: 10, st_song_type: "S", st_song_type_desc: "Single versie", display_name: "Single versie" }
    ],
    runId: "run-1",
    rows: [row],
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
    addKeepPatternSuggestions: vi.fn(),
    normalizationPreview: null,
    encodingRepairPreview: null,
    yearEnrichmentPreview: null,
    yearEnrichmentPreviewVisible: false,
    closeYearEnrichmentPreview: vi.fn(),
    exportStatus: { alreadyExported: false, existingRowsForTarget: 0 },
    exportStatusLoading: false,
    exportStatusError: null,
    visibleRowPositions: [1],
    setVisibleRowPositions: vi.fn(),
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
    openPatternSuggestions: async () => {},
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
    ...overrides.ctrl
  };
}

describe("Sprint 2H-X edit table polish", () => {
  it("kiest release-url boven master-url en raw hl_discogs_link", () => {
    expect(
      resolveDiscogsTableLink(
        {
          discogs_master_url: "https://www.discogs.com/master/123-master",
          discogs_release_url: "https://www.discogs.com/release/456-release",
          hl_discogs_link: "https://www.discogs.com/master/raw"
        },
        {}
      )
    ).toEqual({ url: "https://www.discogs.com/release/456-release", label: "Discogs release" });
  });

  it("gebruikt veilige raw hl_discogs_link als fallback", () => {
    expect(
      resolveDiscogsTableLink(
        { hl_discogs_link: "https://www.discogs.com/master/999" },
        {}
      )
    ).toEqual({ url: "https://www.discogs.com/master/999", label: "Discogs" });
  });

  it("blokkeert onveilige of niet-Discogs URL's", () => {
    expect(isSafeDiscogsExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeDiscogsExternalUrl("https://evil.example/release/1")).toBe(false);
    expect(isSafeDiscogsExternalUrl("http://www.discogs.com/release/1")).toBe(false);
    expect(isSafeDiscogsExternalUrl("https://www.discogs.com/release/1")).toBe(true);
  });

  it("toont een veilige klikbare Discogs-link in de schermtabel", () => {
    render(<EditMain ctrl={makeCtrl({ row: { discogs_release_url: "https://www.discogs.com/release/456" } })} />);

    const link = screen.getByRole("link", { name: /discogs release openen voor positie 1/i });
    expect(link).toHaveAttribute("href", "https://www.discogs.com/release/456");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("verwijdert artist-key uit de zichtbare schermtabel maar behoudt data intern", () => {
    render(<EditMain ctrl={makeCtrl()} />);

    const table = screen.getAllByRole("table")[0];
    const headers = within(table).getAllByRole("columnheader").map((header) => header.textContent?.trim());
    expect(headers).not.toContain("Artiest key (auto)");
    expect(screen.queryByDisplayValue("12345")).not.toBeInTheDocument();
  });
});
