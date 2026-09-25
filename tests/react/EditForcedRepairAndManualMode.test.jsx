/** @vitest-environment jsdom */
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import EditPage, { EditAside } from "../../src/ui/pages/EditPage.jsx";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("Edit forced repair and manual mode", () => {
  it("calls forced visible-row swap for filtered rows", async () => {
    const setMsg = vi.fn();
    const setErr = vi.fn();
    const setBusy = vi.fn();
    const forceSwapVisibleRows = vi.fn().mockResolvedValue({ ok: true, requested: 2, scanned: 2, repaired: 2, skipped: 0, failed: 0 });

    const ctrl = {
      runId: "run-5",
      rows: [],
      exportStatus: null,
      busy: false,
      visibleRowPositions: [3, 4],
      setBusy,
      setErr,
      setMsg,
      refreshRows: vi.fn(),
      artistSpellingDone: true,
      decodeHtmlEntitiesForRun: async () => {},
      runArtistSpelling: async () => {},
      runPatternDelete: async () => {},
      runSongSpelling: async () => {},
      exportHitlijsten: async () => {},
      repairSuspectedTitleArtistSwaps: async () => {},
      forceSwapVisibleRows
    };

    render(<EditAside ctrl={ctrl} />);

    fireEvent.click(screen.getByRole("button", { name: /Forceer titel\/artiest swap \(zichtbare rijen\)/i }));

    await waitFor(() => {
      expect(forceSwapVisibleRows).toHaveBeenCalledWith([3, 4]);
    });
  });

  it("keeps derived fields read-only and allows manual correction of staging source fields", async () => {
    const fetchMock = vi.fn((url, options = {}) => {
      if (String(url).includes("/api/edit/staging/run-6/10/diagnostics")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: "blocked",
            reasonCode: "SUSPECTED_TITLE_ARTIST_SWAP",
            canRepairArtistRelation: false,
            canRepairTitleArtistSwap: true,
            row: {
              runId: "run-6",
              hlPositie: 10,
              hlArtiest: "Song Value",
              hlTitelSong: "Artist Value",
              fdTagTitle: "Artist Value",
              hlArtistKey: null
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
              swappedAsArtistKey: 15,
              swappedCanonicalArtistName: "Artist Value",
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

      if (String(url).includes("/api/edit/staging/run-6/10/manual-correction") && options.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok: true,
            diagnostics: {
              status: "ok",
              reasonCode: null,
              canRepairArtistRelation: false,
              canRepairTitleArtistSwap: false,
              row: {
                runId: "run-6",
                hlPositie: 10,
                hlArtiest: "Artist Value",
                hlTitelSong: "Song Value",
                fdTagTitle: "Song Value",
                hlArtistKey: 15
              },
              artistRelation: {
                artiestenSpellingExists: true,
                artistExists: true,
                canonicalArtistName: "Artist Value",
                asArtistKey: 15
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
      runId: "run-6",
      rows: [{
        hl_import_run_id: "run-6",
        hl_positie: 10,
        hl_artiest: "Song Value",
        hl_titel_song: "Artist Value",
        hl_jaar: 1991,
        fd_tag_title: "Artist Value",
        as_correcte_artiest_spelling: "",
        hl_discogs_link: "",
        hl_find_cmd: "",
        hl_artist_key: null
      }],
      msg: null,
      err: null,
      busy: false,
      fdStatusByPos: { "10": { matchCount: 0, effective_title: "Artist Value", source: "fallback" } },
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
      exportHitlijsten: async () => {},
      setVisibleRowPositions: () => {}
    };

    render(<EditPage ctrl={ctrl} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    await screen.findByText(/Reason: SUSPECTED_TITLE_ARTIST_SWAP/i);

    const readOnlyDerivedInputs = screen.getAllByDisplayValue("Artist Value");
    expect(readOnlyDerivedInputs.some((element) => element.hasAttribute("readonly") || element.disabled)).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /Handmatig herstellen/i }));

    const artistField = screen.getByLabelText(/Artiest uit staging/i);
    const songField = screen.getByLabelText(/Titel uit staging/i);

    expect(artistField).toBeEnabled();
    expect(songField).toBeEnabled();

    fireEvent.change(artistField, { target: { value: "Artist Value" } });
    fireEvent.change(songField, { target: { value: "Song Value" } });

    fireEvent.click(screen.getByLabelText(/bewust een vrije overwrite/i));
    fireEvent.click(screen.getByRole("button", { name: /Vrije overwrite opslaan/i }));

    await waitFor(() => {
      expect(screen.getByText(/Reason: OK/i)).toBeInTheDocument();
    });
  });
});

describe("Edit manual repair separated file_details search", () => {
  it("searches manual repair candidates with separate artist and title fields", async () => {
    const fetchMock = vi.fn((url) => {
      const urlText = String(url);
      if (urlText.includes("/api/edit/staging/run-7/11/diagnostics")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: "blocked",
            reasonCode: "NO_FILE_DETAILS_MATCH",
            canRepairArtistRelation: false,
            canRepairTitleArtistSwap: false,
            row: {
              runId: "run-7",
              hlPositie: 11,
              hlArtiest: "Wrong Artist",
              hlTitelSong: "Wrong Title",
              fdTagTitle: "Wrong Title",
              hlArtistKey: null
            },
            artistRelation: {
              artiestenSpellingExists: false,
              artistExists: false,
              canonicalArtistName: null,
              asArtistKey: null
            },
            swapHints: { suspectedTitleArtistSwap: false, swappedTitleMatchCount: 0 },
            fileDetailsCheck: { titleMatchCount: 0, artistKeyMatchCount: 0, combinedMatchCount: 0 }
          })
        });
      }

      if (urlText.includes("/api/edit/manual-repair-candidates")) {
        const parsed = new URL(urlText, "http://localhost");
        expect(parsed.searchParams.get("artist")).toBe("Nirvana");
        expect(parsed.searchParams.get("title")).toBe("Smells Like Teen Spirit");
        expect(parsed.searchParams.get("query")).toBeNull();
        return Promise.resolve({
          ok: true,
          json: async () => ({
            candidates: [{
              fd_key: 44,
              canonical_artist_name: "Nirvana",
              fd_correct_artist: "Nirvana",
              fd_tag_title: "Smells Like Teen Spirit",
              fd_year_song_publish: 1991,
              st_song_type: "Single",
              fd_file_name: "Nirvana - Smells Like Teen Spirit.mp3"
            }]
          })
        });
      }

      throw new Error(`Unexpected fetch: ${urlText}`);
    });

    global.fetch = fetchMock;

    const ctrl = {
      hitlijst: "",
      setHitlijst: () => {},
      uitzendjaar: "",
      setUitzendjaar: () => {},
      runs: [],
      runId: "run-7",
      rows: [{
        hl_import_run_id: "run-7",
        hl_positie: 11,
        hl_artiest: "Wrong Artist",
        hl_titel_song: "Wrong Title",
        hl_jaar: 1991,
        fd_tag_title: "Wrong Title",
        as_correcte_artiest_spelling: "",
        hl_discogs_link: "",
        hl_find_cmd: "",
        hl_artist_key: null
      }],
      msg: null,
      err: null,
      busy: false,
      fdStatusByPos: { "11": { matchCount: 0, effective_title: "Wrong Title", source: "fallback" } },
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
      exportHitlijsten: async () => {},
      setVisibleRowPositions: () => {}
    };

    render(<EditPage ctrl={ctrl} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await screen.findByText(/Reason: NO_FILE_DETAILS_MATCH/i);

    fireEvent.click(screen.getByRole("button", { name: /Handmatig herstellen/i }));

    const artistSearch = screen.getByLabelText(/Artiest zoeken/i);
    const titleSearch = screen.getByLabelText(/Titel zoeken/i);

    expect(screen.queryByLabelText(/^Zoek in file_details$/i)).not.toBeInTheDocument();

    fireEvent.change(artistSearch, { target: { value: "Nirvana" } });
    fireEvent.change(titleSearch, { target: { value: "Smells Like Teen Spirit" } });
    fireEvent.click(screen.getByRole("button", { name: /^Zoek$/i }));

    await screen.findByText("Smells Like Teen Spirit");
    expect(screen.getByText("Nirvana")).toBeInTheDocument();
  });
});
