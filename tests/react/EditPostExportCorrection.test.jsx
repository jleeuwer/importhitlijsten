/** @vitest-environment jsdom */
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import EditPage from "../../src/ui/pages/EditPage.jsx";

beforeEach(() => {
  vi.restoreAllMocks();
});

function baseCtrl(overrides = {}) {
  return {
    hitlijst: "",
    setHitlijst: () => {},
    uitzendjaar: "",
    setUitzendjaar: () => {},
    runs: [{ ir_run_id: "run-8", ir_hitlijst: "Top 2000", ir_uitzendjaar: 2026 }],
    runId: "run-8",
    rows: [{
      hl_import_run_id: "run-8",
      hl_positie: 12,
      hl_artiest: "Wrong Artist",
      hl_titel_song: "Wrong Title",
      hl_jaar: 1991,
      fd_tag_title: "Wrong Title",
      as_correcte_artiest_spelling: "Wrong Artist",
      hl_discogs_link: "",
      hl_find_cmd: "",
      hl_artist_key: null
    }],
    msg: null,
    err: null,
    busy: false,
    fdStatusByPos: { "12": { matchCount: 0, effective_title: "Wrong Title", source: "fallback" } },
    artistSpellingDone: false,
    patternPreview: [],
    normalizationPreview: null,
    encodingRepairPreview: null,
    yearEnrichmentPreview: null,
    exportStatus: null,
    blockedDiscogsExportSummary: { exportableCount: 0 },
    duplicateImportSummary: { duplicateCount: 0 },
    metadataOptions: { omroepen: [], perioden: [] },
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
    setVisibleRowPositions: () => {},
    ...overrides
  };
}

describe("Edit post-export correction", () => {
  it("previews and applies a file_details-driven post-export correction", async () => {
    const afterRepair = vi.fn();
    const fetchMock = vi.fn((url, options = {}) => {
      const urlText = String(url);

      if (urlText.includes("/api/edit/staging/run-8/12/diagnostics")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: "blocked",
            reasonCode: "NO_FILE_DETAILS_MATCH",
            canRepairArtistRelation: false,
            canRepairTitleArtistSwap: false,
            row: { runId: "run-8", hlPositie: 12, hlArtiest: "Wrong Artist", hlTitelSong: "Wrong Title", fdTagTitle: "Wrong Title", hlArtistKey: null },
            artistRelation: { artiestenSpellingExists: false, artistExists: false, canonicalArtistName: null, asArtistKey: null },
            swapHints: { suspectedTitleArtistSwap: false, swappedTitleMatchCount: 0 },
            fileDetailsCheck: { titleMatchCount: 0, artistKeyMatchCount: 0, combinedMatchCount: 0 }
          })
        });
      }

      if (urlText.includes("/api/edit/manual-repair-candidates")) {
        const parsed = new URL(urlText, "http://localhost");
        expect(parsed.searchParams.get("artist")).toBe("Nirvana");
        expect(parsed.searchParams.get("title")).toBe("Smells Like Teen Spirit");
        return Promise.resolve({
          ok: true,
          json: async () => ({
            candidates: [{
              fd_key: 44,
              canonical_artist_name: "Nirvana",
              fd_correct_artist: "Nirvana",
              fd_artist_key: 7382,
              fd_tag_title: "Smells Like Teen Spirit",
              fd_year_song_publish: 1991,
              st_song_type: "Single",
              fd_file_name: "Nirvana - Smells Like Teen Spirit.mp3",
              match_type: "Exact"
            }]
          })
        });
      }

      if (urlText.includes("/post-export-correction/preview") && options.method === "POST") {
        const body = JSON.parse(options.body);
        expect(body.fd_key).toBe(44);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok: true,
            canApply: true,
            oldValues: { correct_artist: "Wrong Artist", correct_title: "Wrong Title", artist_key: null },
            newValues: { correct_artist: "Nirvana", correct_title: "Smells Like Teen Spirit", artist_key: 7382, fd_key: 44 },
            hitlijsten: { matchedCount: 1, exportedCount: 1, matches: [{ isComposed: false }] },
            composedImpact: { isComposed: false, willChangeComposition: false },
            warnings: []
          })
        });
      }

      if (urlText.includes("/post-export-correction/apply") && options.method === "POST") {
        const body = JSON.parse(options.body);
        expect(body.fd_key).toBe(44);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok: true,
            applied: true,
            stagingUpdated: true,
            hitlijstenUpdatedCount: 1,
            auditId: 42,
            composedImpact: { isComposed: false, hlSamenstelFdKeyChanged: false },
            changedFields: {
              artist: { old: "Wrong Artist", new: "Nirvana" },
              title: { old: "Wrong Title", new: "Smells Like Teen Spirit" }
            },
            warnings: [],
            diagnostics: {
              status: "ok",
              reasonCode: null,
              canRepairArtistRelation: false,
              canRepairTitleArtistSwap: false,
              row: { runId: "run-8", hlPositie: 12, hlArtiest: "Wrong Artist", hlTitelSong: "Wrong Title", fdTagTitle: "Smells Like Teen Spirit", hlArtistKey: 7382 },
              artistRelation: { artiestenSpellingExists: true, artistExists: true, canonicalArtistName: "Nirvana", asArtistKey: 7382 },
              swapHints: { suspectedTitleArtistSwap: false, swappedTitleMatchCount: 0 },
              fileDetailsCheck: { titleMatchCount: 1, artistKeyMatchCount: 1, combinedMatchCount: 1 }
            },
            preview: {
              newValues: { correct_artist: "Nirvana", correct_title: "Smells Like Teen Spirit", artist_key: 7382 }
            }
          })
        });
      }

      throw new Error(`Unexpected fetch: ${urlText}`);
    });

    global.fetch = fetchMock;

    render(<EditPage ctrl={baseCtrl({ onAfterRepair: afterRepair })} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await screen.findByText(/Reason: NO_FILE_DETAILS_MATCH/i);

    fireEvent.click(screen.getByRole("button", { name: /^Correctie na export$/i }));
    fireEvent.change(screen.getByLabelText(/Correcte artiest zoeken/i), { target: { value: "Nirvana" } });
    fireEvent.change(screen.getByLabelText(/Correcte titel zoeken/i), { target: { value: "Smells Like Teen Spirit" } });
    fireEvent.click(screen.getByRole("button", { name: /^Zoek$/i }));

    await screen.findByText("Smells Like Teen Spirit");
    fireEvent.click(screen.getByRole("button", { name: /^Preview$/i }));

    await screen.findByText(/Impact preview/i);
    expect(screen.getByText(/Nieuwe correcte artiest\/titel: Nirvana — Smells Like Teen Spirit/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Bevestig correctie/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/post-export-correction/apply"), expect.objectContaining({ method: "POST" }));
    });
    expect(await screen.findByText(/Correctie succesvol toegepast/i)).toBeInTheDocument();
    expect(screen.getByText(/staging_hitlijsten bijgewerkt: ja/i)).toBeInTheDocument();
    expect(screen.getByText(/hitlijsten bijgewerkt: 1 record/i)).toBeInTheDocument();
    expect(screen.getByText(/Audit vastgelegd: 42/i)).toBeInTheDocument();
    expect(screen.getByText(/Correcte artiest: Wrong Artist → Nirvana/i)).toBeInTheDocument();
    expect(screen.getByText(/Correcte titel: Wrong Title → Smells Like Teen Spirit/i)).toBeInTheDocument();
  });
  it("shows post-export correction for rows that only have Save as standard action", async () => {
    const fetchMock = vi.fn((url) => {
      const urlText = String(url);
      if (urlText.includes("/api/edit/staging/run-8/12/diagnostics")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: "ok",
            reasonCode: null,
            canRepairArtistRelation: false,
            canRepairTitleArtistSwap: false,
            row: { runId: "run-8", hlPositie: 12, hlArtiest: "Nirvana", hlTitelSong: "Lithium", fdTagTitle: "Lithium", hlArtistKey: 7382 },
            artistRelation: { artiestenSpellingExists: true, artistExists: true, canonicalArtistName: "Nirvana", asArtistKey: 7382 },
            swapHints: { suspectedTitleArtistSwap: false, swappedTitleMatchCount: 0 },
            fileDetailsCheck: { titleMatchCount: 1, artistKeyMatchCount: 1, combinedMatchCount: 1 }
          })
        });
      }
      throw new Error(`Unexpected fetch: ${urlText}`);
    });

    global.fetch = fetchMock;

    render(<EditPage ctrl={baseCtrl({
      rows: [{
        hl_import_run_id: "run-8",
        hl_positie: 12,
        hl_artiest: "Nirvana",
        hl_titel_song: "Lithium",
        hl_jaar: 1992,
        fd_tag_title: "Lithium",
        as_correcte_artiest_spelling: "Nirvana",
        hl_discogs_link: "",
        hl_find_cmd: "",
        hl_artist_key: 7382
      }],
      fdStatusByPos: { "12": { matchCount: 1, effective_title: "Lithium", source: "fd_tag_title" } }
    })} />);

    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Correctie" }));

    await screen.findAllByText(/Correctie na export/i);
    expect(screen.getByLabelText(/Correcte artiest zoeken/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correcte titel zoeken/i)).toBeInTheDocument();
  });

});
