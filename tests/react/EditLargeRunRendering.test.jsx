/** @vitest-environment jsdom */
import React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { EditMain } from "../../src/ui/pages/EditPage.jsx";

function makeRow(index) {
  return {
    hl_positie: index,
    hl_artiest: `Artist ${index}`,
    hl_titel_song: `Song ${index}`,
    hl_jaar: 2000,
    fd_tag_title: `Song ${index}`,
    as_correcte_artiest_spelling: `Artist ${index}`,
    hl_discogs_link: "",
    hl_find_cmd: "",
    hl_artist_key: index,
    hl_import_run_id: "run-1"
  };
}

describe("Edit large run rendering hotfix", () => {
  it("renders only the active page of matching rows and navigates with pagination controls", () => {
    const rows = Array.from({ length: 250 }, (_, idx) => makeRow(idx + 1));
    const fdStatusByPos = Object.fromEntries(rows.map((row) => [String(row.hl_positie), { matchCount: 1, effective_title: row.fd_tag_title, source: "fd_tag_title" }]));

    const ctrl = {
      hitlijst: "",
      setHitlijst: () => {},
      uitzendjaar: "",
      setUitzendjaar: () => {},
      runs: [],
      runId: "run-1",
      rows,
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
      fdStatusByPos,
      refreshFileDetailsStatus: async () => {},
      exportStatus: { missingFdTagTitle: 0, missingHlArtistKey: 0, missingLinks: 0, multipleLinks: 0, issuesPreview: [] },
      exportStatusLoading: false,
      exportStatusError: null,
      patternPreview: [],
      normalizationPreview: null,
      encodingRepairPreview: null,
      setVisibleRowPositions: () => {}
    };

    render(<EditMain ctrl={ctrl} />);

    expect(screen.getByLabelText(/rijensamenvatting liedjestabel/i)).toHaveTextContent(/Rows: 250.*pagina 1 van 5.*getoond 1-50/i);
    expect(screen.getByLabelText(/paginastatus liedjestabel/i)).toHaveTextContent(/Pagina 1 van 5.*regels 1-50 van 250/i);
    expect(screen.getByRole("button", { name: /volgende/i })).toBeInTheDocument();
    expect(screen.getAllByText("Artist 1", { exact: true }).length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Artist 150", { exact: true })).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: /volgende/i }));
    expect(screen.getByLabelText(/paginastatus liedjestabel/i)).toHaveTextContent(/Pagina 2 van 5.*regels 51-100 van 250/i);
    expect(screen.getAllByText("Artist 51", { exact: true }).length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Artist 1", { exact: true })).toHaveLength(0);
  });
});
