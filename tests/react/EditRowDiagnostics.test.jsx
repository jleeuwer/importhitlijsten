/** @vitest-environment jsdom */
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import EditPage from "../../src/ui/pages/EditPage.jsx";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("Edit row diagnostics flow", () => {
  it("opens diagnostics modal through the edit button and repairs artist relation", async () => {
    const fetchMock = vi.fn((url, options = {}) => {
      if (String(url).includes("/api/edit/staging/run-1/12/diagnostics")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: "blocked",
            reasonCode: "MISSING_ARTIESTEN_SPELLING_ENTRY",
            canRepairArtistRelation: true,
            row: {
              hlKey: 501,
              runId: "run-1",
              hlPositie: 12,
              hlArtiest: "Example Artist",
              hlTitelSong: "Example Song",
              fdTagTitle: "Example Song",
              hlArtistKey: null
            },
            artistRelation: {
              artiestenSpellingExists: false,
              artistExists: false,
              canonicalArtistName: null,
              asArtistKey: null
            },
            fileDetailsCheck: {
              titleMatchCount: 1,
              artistKeyMatchCount: 0,
              combinedMatchCount: 0
            }
          })
        });
      }

      if (String(url).includes("/api/edit/staging/run-1/12/repair-artist-relation") && options.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok: true,
            newHlArtistKey: 345,
            diagnostics: {
              status: "ok",
              reasonCode: null,
              canRepairArtistRelation: false,
              row: {
                hlKey: 501,
                runId: "run-1",
                hlPositie: 12,
                hlArtiest: "Example Artist",
                hlTitelSong: "Example Song",
                fdTagTitle: "Example Song",
                hlArtistKey: 345
              },
              artistRelation: {
                artiestenSpellingExists: true,
                artistExists: true,
                canonicalArtistName: "Example Artist",
                asArtistKey: 345
              },
              fileDetailsCheck: {
                titleMatchCount: 1,
                artistKeyMatchCount: 1,
                combinedMatchCount: 1
              }
            }
          })
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    global.fetch = fetchMock;

    const ctrl = {
      hitlijst: "",
      setHitlijst: () => {},
      uitzendjaar: "",
      setUitzendjaar: () => {},
      runs: [],
      runId: "run-1",
      rows: [
        {
          hl_key: 501,
          hl_import_run_id: "run-1",
          hl_positie: 12,
          hl_artiest: "Example Artist",
          hl_titel_song: "Example Song",
          hl_jaar: 1984,
          fd_tag_title: "Example Song",
          as_correcte_artiest_spelling: "",
          hl_discogs_link: "",
          hl_find_cmd: "",
          hl_artist_key: null
        }
      ],
      msg: null,
      err: null,
      busy: false,
      fdStatusByPos: { "12": { matchCount: 0, effective_title: "Example Song", source: "fallback" } },
      artistSpellingDone: false,
      patternPreview: [],
      exportStatus: null,
      setMsg: () => {},
      setErr: () => {},
      setBusy: () => {},
      loadRuns: async () => {},
      selectRun: async () => {},
      refreshRows: async () => {},
      saveRow: async () => {},
      decodeHtmlEntitiesForRun: async () => {},
      runArtistSpelling: async () => {},
      runPatternDelete: async () => {},
      runSongSpelling: async () => {},
      refreshFileDetailsStatus: async () => {},
      exportHitlijsten: async () => {}
    };

    render(<EditPage ctrl={ctrl} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    await screen.findByText(/Reason: MISSING_ARTIESTEN_SPELLING_ENTRY/i);
    expect(screen.getByText(/Artiesten_spelling:/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Herstel artiestrelatie/i }));

    await waitFor(() => {
      expect(screen.getByText(/Reason: OK/i)).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/edit/staging/run-1/12/diagnostics"));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/edit/staging/run-1/12/repair-artist-relation"),
      expect.objectContaining({ method: "POST" })
    );
  });


  it("shows swap warning and repair action when title and artist look reversed", async () => {
    const fetchMock = vi.fn((url, options = {}) => {
      if (String(url).includes("/api/edit/staging/run-2/3/diagnostics")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: "blocked",
            reasonCode: "SUSPECTED_TITLE_ARTIST_SWAP",
            canRepairArtistRelation: false,
            canRepairTitleArtistSwap: true,
            row: {
              runId: "run-2",
              hlPositie: 3,
              hlArtiest: "Smells Like Teen Spirit",
              hlTitelSong: "Nirvana",
              fdTagTitle: "Nirvana",
              hlArtistKey: 7382
            },
            artistRelation: {
              artiestenSpellingExists: false,
              artistExists: false,
              canonicalArtistName: null,
              asArtistKey: null
            },
            swapHints: {
              suspectedTitleArtistSwap: true,
              swappedArtiestenSpellingExists: true,
              swappedArtistExists: true,
              swappedAsArtistKey: 7382,
              swappedCanonicalArtistName: "Nirvana",
              swappedTitleMatchCount: 1
            },
            fileDetailsCheck: {
              titleMatchCount: 0,
              artistKeyMatchCount: 0,
              combinedMatchCount: 0
            }
          })
        });
      }

      if (String(url).includes("/api/edit/staging/run-2/3/repair-title-artist-swap") && options.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok: true,
            repairedArtist: "Nirvana",
            repairedTitle: "Smells Like Teen Spirit",
            diagnostics: {
              status: "ok",
              reasonCode: null,
              canRepairArtistRelation: false,
              canRepairTitleArtistSwap: false,
              row: {
                runId: "run-2",
                hlPositie: 3,
                hlArtiest: "Nirvana",
                hlTitelSong: "Smells Like Teen Spirit",
                fdTagTitle: "Smells Like Teen Spirit",
                hlArtistKey: 7382
              },
              artistRelation: {
                artiestenSpellingExists: true,
                artistExists: true,
                canonicalArtistName: "Nirvana",
                asArtistKey: 7382
              },
              swapHints: { suspectedTitleArtistSwap: false, swappedTitleMatchCount: 0 },
              fileDetailsCheck: { titleMatchCount: 1, artistKeyMatchCount: 1, combinedMatchCount: 1 }
            }
          })
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    global.fetch = fetchMock;

    const ctrl = {
      hitlijst: "",
      setHitlijst: () => {},
      uitzendjaar: "",
      setUitzendjaar: () => {},
      runs: [],
      runId: "run-2",
      rows: [{
        hl_import_run_id: "run-2",
        hl_positie: 3,
        hl_artiest: "Smells Like Teen Spirit",
        hl_titel_song: "Nirvana",
        hl_jaar: 1991,
        fd_tag_title: "Nirvana",
        as_correcte_artiest_spelling: "",
        hl_discogs_link: "",
        hl_find_cmd: "",
        hl_artist_key: 7382
      }],
      msg: null,
      err: null,
      busy: false,
      fdStatusByPos: { "3": { matchCount: 0, effective_title: "Nirvana", source: "fallback" } },
      artistSpellingDone: false,
      patternPreview: [],
      exportStatus: null,
      setMsg: () => {},
      setErr: () => {},
      setBusy: () => {},
      loadRuns: async () => {},
      selectRun: async () => {},
      refreshRows: async () => {},
      saveRow: async () => {},
      decodeHtmlEntitiesForRun: async () => {},
      runArtistSpelling: async () => {},
      runPatternDelete: async () => {},
      runSongSpelling: async () => {},
      refreshFileDetailsStatus: async () => {},
      exportHitlijsten: async () => {}
    };

    render(<EditPage ctrl={ctrl} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await screen.findByText(/SUSPECTED_TITLE_ARTIST_SWAP/i);
    expect(screen.getByRole("button", { name: /Herstel artiest\/titel swap/i })).toBeInTheDocument();
  });

});
