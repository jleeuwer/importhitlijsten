/** @vitest-environment jsdom */
import React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import EditPage from "../../src/ui/pages/EditPage.jsx";

function makeCtrl() {
  return {
    hitlijst: "",
    setHitlijst: () => {},
    uitzendjaar: "",
    setUitzendjaar: () => {},
    runs: [],
    runId: "run-1",
    rows: [
      { hl_import_run_id: "run-1", hl_positie: 1, hl_artiest: "Artist A", hl_titel_song: "Song A", hl_jaar: 1981, fd_tag_title: "Song A", as_correcte_artiest_spelling: "Artist A", fd_action: "Keep", fd_file_name: "artist-a-song-a.mp3", hl_discogs_link: "", hl_find_cmd: "", hl_artist_key: 101 },
      { hl_import_run_id: "run-1", hl_positie: 2, hl_artiest: "Artist B", hl_titel_song: "Song B", hl_jaar: 1982, fd_tag_title: "Song B", as_correcte_artiest_spelling: "Artist B", fd_action: "Skip", fd_file_name: "artist-b-song-b.mp3", hl_discogs_link: "", hl_find_cmd: "", hl_artist_key: 202 },
      { hl_import_run_id: "run-1", hl_positie: 3, hl_artiest: "Artist C", hl_titel_song: "Song C", hl_jaar: 1983, fd_tag_title: "", as_correcte_artiest_spelling: "Artist C", fd_action: "Keep", fd_file_name: "artist-c-song-c.mp3", hl_discogs_link: "https://discogs.example/c", hl_find_cmd: "", hl_artist_key: null }
    ],
    msg: null,
    err: null,
    busy: false,
    fdStatusByPos: {
      "1": { matchCount: 1, effective_title: "Song A", source: "song_spelling" },
      "2": { matchCount: 2, effective_title: "Song B", source: "song_spelling" },
      "3": { matchCount: 0, effective_title: "Song C", source: "fallback" }
    },
    artistSpellingDone: true,
    patternPreview: [],
    duplicateImportSummary: {
      duplicateCount: 1,
      existingFileDetailsDuplicateCount: 1,
      inRunDuplicateCount: 0,
      skippedCount: 1,
      duplicateRows: [
        { hl_positie: 2, reasonCode: "DUPLICATE_EXISTING_FILE_DETAILS", reasonLabel: "Bestand bestaat al in file_details" }
      ]
    },
    exportStatus: null,
    setMsg: () => {}, setErr: () => {}, setBusy: () => {},
    loadRuns: async () => {}, selectRun: async () => {}, refreshRows: async () => {}, saveRow: async () => {},
    decodeHtmlEntitiesForRun: async () => {}, runArtistSpelling: async () => {}, runPatternDelete: async () => {},
    runSongSpelling: async () => {}, refreshFileDetailsStatus: async () => {}, exportHitlijsten: async () => {},
    setVisibleRowPositions: () => {}
  };
}

describe("Edit problem filters", () => {
  it("shows row status badges and filters problem rows", () => {
    render(<EditPage ctrl={makeCtrl()} />);

    expect(screen.getByText(/blockers: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/warnings: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/ok: 1/i)).toBeInTheDocument();
    expect(screen.getAllByText("Ready").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Warning").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Blocked").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByLabelText(/show only problem rows/i));

    expect(screen.queryByDisplayValue("Song A")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Song B")).toBeInTheDocument();
    expect(screen.getAllByText("Artist C").length).toBeGreaterThan(0);
  });

  it("filters separately on blockers and warnings and can reset", () => {
    render(<EditPage ctrl={makeCtrl()} />);

    fireEvent.change(screen.getByLabelText(/problem type filter/i), { target: { value: "warning" } });
    expect(screen.queryByDisplayValue("Song A")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Song B")).toBeInTheDocument();
    expect(screen.queryAllByText("Artist C")).toHaveLength(0);

    fireEvent.change(screen.getByLabelText(/problem type filter/i), { target: { value: "blocker" } });
    expect(screen.queryByDisplayValue("Song B")).not.toBeInTheDocument();
    expect(screen.getAllByText("Artist C").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /reset filters/i }));
    expect(screen.getByDisplayValue("Song A")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Song B")).toBeInTheDocument();
    expect(screen.getAllByText("Artist C").length).toBeGreaterThan(0);
  });
  it("filters the processing list by user-facing text, action, duplicate and Discogs status", () => {
    render(<EditPage ctrl={makeCtrl()} />);

    fireEvent.change(screen.getByLabelText(/lijstfilter/i), { target: { value: "Artist C" } });
    expect(screen.queryByDisplayValue("Song A")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("Song B")).not.toBeInTheDocument();
    expect(screen.getAllByText("Artist C").length).toBeGreaterThan(0);


    fireEvent.change(screen.getByLabelText(/lijstfilter/i), { target: { value: "artist-b-song-b" } });
    expect(screen.queryByDisplayValue("Song B")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/lijstfilter/i), { target: { value: "https://discogs.example/c" } });
    expect(screen.queryAllByText("Artist C")).toHaveLength(0);

    fireEvent.change(screen.getByLabelText(/lijstfilter/i), { target: { value: "202" } });
    expect(screen.queryByDisplayValue("Song B")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/lijstfilter/i), { target: { value: "1983" } });
    expect(screen.getAllByText("Artist C").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /reset filters/i }));

    fireEvent.change(screen.getByLabelText(/actie filter/i), { target: { value: "skip" } });
    expect(screen.queryByDisplayValue("Song A")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Song B")).toBeInTheDocument();
    expect(screen.queryAllByText("Artist C")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: /reset filters/i }));

    fireEvent.change(screen.getByLabelText(/verwerkingsstatus filter/i), { target: { value: "duplicates" } });
    expect(screen.getByDisplayValue("Song B")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Song A")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/verwerkingsstatus filter/i), { target: { value: "discogs" } });
    expect(screen.getAllByText("Artist C").length).toBeGreaterThan(0);
    expect(screen.queryByDisplayValue("Song B")).not.toBeInTheDocument();
  });

});
