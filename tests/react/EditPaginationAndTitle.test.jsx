/** @vitest-environment jsdom */
import React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import EditPage from "../../src/ui/pages/EditPage.jsx";

function makeCtrl(rowCount = 60) {
  const rows = Array.from({ length: rowCount }, (_, idx) => {
    const position = idx + 1;
    return {
      hl_import_run_id: "run-2hg",
      hl_positie: position,
      hl_hitlijst: "Top 2000",
      hl_uitzendjaar: 2026,
      hl_artiest: `Artist ${position}`,
      hl_titel_song: `Song ${position}`,
      hl_jaar: 1980 + position,
      fd_tag_title: `Song ${position}`,
      as_correcte_artiest_spelling: `Artist ${position}`,
      fd_action: "Keep",
      hl_discogs_link: "",
      hl_find_cmd: "",
      hl_artist_key: position
    };
  });

  return {
    hitlijst: "",
    setHitlijst: () => {},
    uitzendjaar: "",
    setUitzendjaar: () => {},
    runs: [{ ir_run_id: "run-2hg", ir_hitlijst: "Top 2000", ir_uitzendjaar: 2026, omroep_naam: "NPO Radio 2", periode_naam: "2020s" }],
    runId: "run-2hg",
    rows,
    msg: null,
    err: null,
    busy: false,
    fdStatusByPos: Object.fromEntries(rows.map((row) => [String(row.hl_positie), { matchCount: 1, effective_title: row.fd_tag_title, source: "test" }])),
    artistSpellingDone: true,
    patternPreview: [],
    duplicateImportSummary: { duplicateCount: 0, existingFileDetailsDuplicateCount: 0, inRunDuplicateCount: 0, skippedCount: 0, duplicateRows: [] },
    exportStatus: null,
    setMsg: () => {}, setErr: () => {}, setBusy: () => {},
    loadRuns: async () => {}, selectRun: async () => {}, refreshRows: async () => {}, saveRow: async () => {},
    decodeHtmlEntitiesForRun: async () => {}, runArtistSpelling: async () => {}, runPatternDelete: async () => {},
    runSongSpelling: async () => {}, refreshFileDetailsStatus: async () => {}, exportHitlijsten: async () => {},
    setVisibleRowPositions: () => {}
  };
}

describe("Edit title and pagination", () => {
  it("shows the active list title on the Edit screen", () => {
    render(<EditPage ctrl={makeCtrl(3)} />);
    expect(screen.getByRole("heading", { name: /bewerken: top 2000 — 2026/i })).toBeInTheDocument();
    expect(screen.getByText(/omroep: npo radio 2/i)).toBeInTheDocument();
    expect(screen.getByText(/periode: 2020s/i)).toBeInTheDocument();
  });

  it("paginates the song table with selectable page sizes", () => {
    render(<EditPage ctrl={makeCtrl(60)} />);

    expect(screen.getByText(/pagina 1 van 2/i)).toBeInTheDocument();
    expect(screen.getByText(/regels 1-50 van 60/i)).toBeInTheDocument();
    expect(screen.getByText("Artist 1")).toBeInTheDocument();
    expect(screen.queryByText("Artist 60")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /volgende/i }));
    expect(screen.getByText(/pagina 2 van 2/i)).toBeInTheDocument();
    expect(screen.getByText("Artist 60")).toBeInTheDocument();
    expect(screen.queryByText("Artist 1")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/regels per pagina/i), { target: { value: "25" } });
    expect(screen.getByText(/pagina 1 van 3/i)).toBeInTheDocument();
    expect(screen.getByText(/regels 1-25 van 60/i)).toBeInTheDocument();
  });
});
