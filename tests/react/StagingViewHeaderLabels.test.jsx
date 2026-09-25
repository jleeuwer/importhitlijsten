/** @vitest-environment jsdom */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import StagingResults from "../../src/ui/pages/StagingResults.jsx";

const rows = [
  {
    hl_positie: 1,
    hl_artiest: "Nirvana",
    hl_titel_song: "Teen Spirit",
    hl_jaar: 1991,
    fd_tag_title: "Smells Like Teen Spirit",
    as_correcte_artiest_spelling: "Nirvana",
    hl_discogs_link: "https://discogs.example/master/1",
    hl_find_cmd: "find Nirvana",
    hl_artist_key: 123,
    omroep_key: 2,
    periode_key: 9
  }
];

describe("Staging view header labels", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ rows }) })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows user-friendly Dutch table headers instead of raw database names", () => {
    render(<StagingResults initialState={{ runId: "run-1", rows }} />);

    [
      "Positie",
      "Artiest uit lijst",
      "Titel uit lijst",
      "Jaar",
      "Correcte titel",
      "Correcte spelling artiest",
      "Discogs link",
      "Vind commando",
      "Sleutel artiest",
      "Omroep sleutel",
      "Periode sleutel"
    ].forEach((label) => {
      expect(screen.getByRole("columnheader", { name: label })).toBeInTheDocument();
    });

    expect(screen.queryByRole("columnheader", { name: "hl_positie" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "hl_titel_song" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "as_correcte_artiest_spelling" })).not.toBeInTheDocument();
  });
});
