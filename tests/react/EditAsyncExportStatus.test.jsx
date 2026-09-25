/** @vitest-environment jsdom */
import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { EditAside, EditMain } from "../../src/ui/pages/EditPage.jsx";

describe("Edit export status loading hotfix", () => {
  it("shows a background loading message in the aside and keeps export disabled while loading", () => {
    const ctrl = {
      runId: "run-1",
      rows: [],
      exportStatus: null,
      exportStatusLoading: true,
      exportStatusError: null,
      busy: false,
      setBusy: () => {},
      setErr: () => {},
      setMsg: () => {},
      refreshRows: async () => {},
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
      previewEncodingRepairVisibleRows: async () => {},
      repairEncodingVisibleRows: async () => {},
      visibleRowPositions: []
    };

    render(<EditAside ctrl={ctrl} />);

    expect(screen.getByText(/export status is loading in the background/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export → hitlijsten/i })).toBeDisabled();
  });

  it("renders the main edit screen while export status is still loading", () => {
    const ctrl = {
      hitlijst: "",
      setHitlijst: () => {},
      uitzendjaar: "",
      setUitzendjaar: () => {},
      runs: [],
      runId: "run-1",
      rows: [
        {
          hl_positie: 1,
          hl_artiest: "Nirvana",
          hl_titel_song: "Smells Like Teen Spirit",
          hl_jaar: 1991,
          fd_tag_title: "Smells Like Teen Spirit",
          as_correcte_artiest_spelling: "Nirvana",
          hl_discogs_link: "",
          hl_find_cmd: "",
          hl_artist_key: 123
        }
      ],
      msg: null,
      err: null,
      busy: false,
      setMsg: () => {},
      setErr: () => {},
      setBusy: () => {},
      loadRuns: async () => {},
      selectRun: async () => {},
      refreshRows: async () => {},
      saveRow: async () => {},
      fdStatusByPos: {
        "1": {
          matchCount: 1,
          effective_title: "Smells Like Teen Spirit",
          source: "fd_tag_title"
        }
      },
      refreshFileDetailsStatus: async () => {},
      exportStatus: null,
      exportStatusLoading: true,
      exportStatusError: null,
      patternPreview: [],
      normalizationPreview: null,
      encodingRepairPreview: null,
      setVisibleRowPositions: () => {}
    };

    render(<EditMain ctrl={ctrl} />);

    expect(screen.getByText(/edit mode/i)).toBeInTheDocument();
    expect(screen.getAllByText(/nirvana/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/smells like teen spirit/i).length).toBeGreaterThan(0);
  });
});
