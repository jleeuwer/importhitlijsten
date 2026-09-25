/** @vitest-environment jsdom */
import React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { EditMain } from "../../src/ui/pages/EditPage.jsx";

const baseCtrl = {
  hitlijst: "",
  setHitlijst: () => {},
  uitzendjaar: "",
  setUitzendjaar: () => {},
  runs: [],
  runId: "run-1",
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
  refreshFileDetailsStatus: async () => {},
  exportStatus: { missingFdTagTitle: 0, missingHlArtistKey: 1, missingLinks: 0, multipleLinks: 0, issuesPreview: [] },
  exportStatusLoading: false,
  exportStatusError: null,
  patternPreview: [],
  normalizationPreview: null,
  encodingRepairPreview: null,
  setVisibleRowPositions: () => {}
};

describe("Edit UX diagnostics", () => {
  it("shows human-readable reason badges in the row", () => {
    const ctrl = {
      ...baseCtrl,
      rows: [{ hl_positie: 1, hl_artiest: "The Scene", hl_titel_song: "Blauw", hl_jaar: 1990, fd_tag_title: "Blauw", as_correcte_artiest_spelling: "", hl_discogs_link: "", hl_find_cmd: "", hl_artist_key: null, hl_import_run_id: "run-1" }],
      fdStatusByPos: { "1": { matchCount: 0, effective_title: "Blauw", source: "fd_tag_title" } }
    };
    render(<EditMain ctrl={ctrl} />);
    expect(screen.getByText(/artist key ontbreekt/i)).toBeInTheDocument();
    expect(screen.getByText(/geen combined match/i)).toBeInTheDocument();
  });

  it("marks derived table headers as auto", () => {
    const ctrl = {
      ...baseCtrl,
      rows: [],
      fdStatusByPos: {}
    };
    render(<EditMain ctrl={ctrl} />);
    expect(screen.getByText(/Correcte Songtitel/i)).toBeInTheDocument();
    expect(screen.getByText(/Correcte Artiest Spelling/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\(auto\)/i).length).toBeGreaterThan(0);
  });
});
