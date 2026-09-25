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
      { hl_import_run_id: "run-1", hl_positie: 1, hl_artiest: "Artist A", hl_titel_song: "Song A", hl_jaar: 1981, fd_tag_title: "Song A", as_correcte_artiest_spelling: "Artist A", hl_discogs_link: "", hl_find_cmd: "", hl_artist_key: 101 },
      { hl_import_run_id: "run-1", hl_positie: 2, hl_artiest: "Artist B", hl_titel_song: "Song B", hl_jaar: 1982, fd_tag_title: "Song B", as_correcte_artiest_spelling: "Artist B", hl_discogs_link: "", hl_find_cmd: "", hl_artist_key: 202 },
      { hl_import_run_id: "run-1", hl_positie: 3, hl_artiest: "Artist C", hl_titel_song: "Song C", hl_jaar: 1983, fd_tag_title: "", as_correcte_artiest_spelling: "Artist C", hl_discogs_link: "", hl_find_cmd: "", hl_artist_key: null }
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
    exportStatus: null,
    setMsg: () => {}, setErr: () => {}, setBusy: () => {},
    loadRuns: async () => {}, selectRun: async () => {}, refreshRows: async () => {}, saveRow: async () => {},
    decodeHtmlEntitiesForRun: async () => {}, runArtistSpelling: async () => {}, runPatternDelete: async () => {},
    runSongSpelling: async () => {}, refreshFileDetailsStatus: async () => {}, exportHitlijsten: async () => {}
  };
}

describe("Edit reason-code filters", () => {
  it("shows problem summary buttons and filters on a selected reason code", () => {
    render(<EditPage ctrl={makeCtrl()} />);

    expect(screen.getByRole("button", { name: /No file details combined match: 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Missing fd tag title: 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Multiple file details combined matches: 1/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /No file details combined match: 1/i }));

    expect(screen.queryByDisplayValue("Song A")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("Song B")).not.toBeInTheDocument();
    expect(screen.getAllByText("Artist C").length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/reason code filter/i)).toHaveValue("NO_FILE_DETAILS_COMBINED_MATCH");
  });

  it("supports selecting a reason code from the dropdown and resetting it", () => {
    render(<EditPage ctrl={makeCtrl()} />);

    fireEvent.change(screen.getByLabelText(/reason code filter/i), {
      target: { value: "MULTIPLE_FILE_DETAILS_COMBINED_MATCHES" }
    });

    expect(screen.queryByDisplayValue("Song A")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Song B")).toBeInTheDocument();
    expect(screen.queryAllByText("Artist C")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: /reset filters/i }));

    expect(screen.getByLabelText(/reason code filter/i)).toHaveValue("all");
    expect(screen.getByDisplayValue("Song A")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Song B")).toBeInTheDocument();
    expect(screen.getAllByText("Artist C").length).toBeGreaterThan(0);
  });
});
