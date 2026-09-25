/** @vitest-environment jsdom */
import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { EditAside } from "../../src/ui/pages/EditPage.jsx";

describe("EditAside export warning", () => {
  it("shows hl_artist_key-based blocking reason and first issue preview", () => {
    const ctrl = {
      runId: "run-1",
      rows: [],
      exportStatus: {
        missingFdTagTitle: 0,
        missingHlArtistKey: 1,
        missingLinks: 1,
        multipleLinks: 2,
        issuesPreview: [
          {
            hl_positie: 87,
            hl_artiest: "Example Artist",
            hl_titel_song: "Example Song",
            fd_tag_title: "Example Song",
            hl_artist_key: 1234,
            reasonCode: "NO_FILE_DETAILS_COMBINED_MATCH"
          }
        ]
      },
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
      exportHitlijsten: async () => {}
    };

    render(<EditAside ctrl={ctrl} />);

    expect(screen.getByText(/empty hl_artist_key/i)).toBeInTheDocument();
    expect(
      screen.getByText(/no match in file_details \(fd_tag_title \+ hl_artist_key\)/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/first issue: positie 87/i)).toBeInTheDocument();
    expect(
      screen.getByText(/multiple matches in file_details .* this is allowed/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/as_correcte_artiest_spelling/i)).not.toBeInTheDocument();
  });
});
