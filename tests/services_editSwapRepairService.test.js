import { beforeEach, describe, expect, it, vi } from "vitest";

const infoMock = vi.fn();
const warnMock = vi.fn();
const errorMock = vi.fn();

vi.mock("../config/logger.js", () => ({
  logger: {
    info: infoMock,
    warn: warnMock,
    error: errorMock
  }
}));

const { repairAllSuspectedTitleArtistSwapsForRun, repairSwappedTitleArtistForStagingRow, forceSwapTitleArtistForPositions } = await import("../services/editSwapRepairService.js");

function makeClient(results) {
  const query = vi.fn();
  results.forEach((result) => {
    if (result instanceof Error) query.mockRejectedValueOnce(result);
    else query.mockResolvedValueOnce(result);
  });
  return { query };
}

beforeEach(() => {
  infoMock.mockReset();
  warnMock.mockReset();
  errorMock.mockReset();
});

describe("repairSwappedTitleArtistForStagingRow", () => {
  it("swaps artist and title and returns refreshed diagnostics", async () => {
    const client = makeClient([
      { rowCount: 1, rows: [{ hl_import_run_id: "run-1", hl_positie: 5, hl_artiest: "Smells Like Teen Spirit", hl_titel_song: "Nirvana" }] },
      { rowCount: 1, rows: [] },
      {
        rowCount: 1,
        rows: [{
          hl_import_run_id: "run-1",
          hl_positie: 5,
          hl_artiest: "Nirvana",
          hl_titel_song: "Smells Like Teen Spirit",
          fd_tag_title: "Smells Like Teen Spirit",
          as_correcte_artiest_spelling: "Nirvana",
          hl_artist_key: 7382,
          as_artist_key: 7382,
          canonical_artist_name: "Nirvana",
          artiesten_spelling_exists: true,
          artist_exists: true,
          swapped_artiesten_spelling_exists: false,
          swapped_artist_exists: false,
          swapped_title_match_count: 0,
          title_match_count: 1,
          artist_key_match_count: 1,
          combined_match_count: 1
        }]
      }
    ]);

    const result = await repairSwappedTitleArtistForStagingRow(client, "run-1", 5);

    expect(result.ok).toBe(true);
    expect(result.repairedArtist).toBe("Nirvana");
    expect(result.repairedTitle).toBe("Smells Like Teen Spirit");
    expect(result.diagnostics.status).toBe("ok");
    expect(result.diagnostics.row.hlArtiest).toBe("Nirvana");
    expect(result.diagnostics.row.hlTitelSong).toBe("Smells Like Teen Spirit");
  });
});

describe("repairAllSuspectedTitleArtistSwapsForRun", () => {
  it("repairs only suspected swap rows for the current run", async () => {
    const client = makeClient([
      { rowCount: 2, rows: [
        { hl_import_run_id: "run-1", hl_positie: 3 },
        { hl_import_run_id: "run-1", hl_positie: 4 }
      ] },
      {
        rowCount: 1,
        rows: [{
          hl_import_run_id: "run-1",
          hl_positie: 3,
          hl_artiest: "Smells Like Teen Spirit",
          hl_titel_song: "Nirvana",
          fd_tag_title: "Nirvana",
          as_correcte_artiest_spelling: null,
          hl_artist_key: 7382,
          as_artist_key: null,
          canonical_artist_name: null,
          artiesten_spelling_exists: false,
          artist_exists: false,
          swapped_artiesten_spelling_exists: true,
          swapped_artist_exists: true,
          swapped_as_artist_key: 7382,
          swapped_canonical_artist_name: "Nirvana",
          swapped_title_match_count: 1,
          title_match_count: 0,
          artist_key_match_count: 0,
          combined_match_count: 0
        }]
      },
      { rowCount: 1, rows: [{ hl_import_run_id: "run-1", hl_positie: 3, hl_artiest: "Smells Like Teen Spirit", hl_titel_song: "Nirvana" }] },
      { rowCount: 1, rows: [] },
      {
        rowCount: 1,
        rows: [{
          hl_import_run_id: "run-1",
          hl_positie: 3,
          hl_artiest: "Nirvana",
          hl_titel_song: "Smells Like Teen Spirit",
          fd_tag_title: "Smells Like Teen Spirit",
          as_correcte_artiest_spelling: "Nirvana",
          hl_artist_key: 7382,
          as_artist_key: 7382,
          canonical_artist_name: "Nirvana",
          artiesten_spelling_exists: true,
          artist_exists: true,
          swapped_artiesten_spelling_exists: false,
          swapped_artist_exists: false,
          swapped_title_match_count: 0,
          title_match_count: 1,
          artist_key_match_count: 1,
          combined_match_count: 1
        }]
      },
      {
        rowCount: 1,
        rows: [{
          hl_import_run_id: "run-1",
          hl_positie: 4,
          hl_artiest: "Nirvana",
          hl_titel_song: "Smells Like Teen Spirit",
          fd_tag_title: "Smells Like Teen Spirit",
          as_correcte_artiest_spelling: "Nirvana",
          hl_artist_key: 7382,
          as_artist_key: 7382,
          canonical_artist_name: "Nirvana",
          artiesten_spelling_exists: true,
          artist_exists: true,
          swapped_artiesten_spelling_exists: false,
          swapped_artist_exists: false,
          swapped_title_match_count: 0,
          title_match_count: 1,
          artist_key_match_count: 1,
          combined_match_count: 1
        }]
      }
    ]);

    const result = await repairAllSuspectedTitleArtistSwapsForRun(client, "run-1");

    expect(result.scanned).toBe(2);
    expect(result.repaired).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.repairedRows[0]).toMatchObject({ hlPositie: 3, repairedArtist: "Nirvana", repairedTitle: "Smells Like Teen Spirit" });
    expect(result.skippedRows[0]).toMatchObject({ hlPositie: 4, reasonCode: "NOT_SUSPECTED_SWAP" });
  });

  it("repairs suspected swap rows that would otherwise look like missing fd_tag_title", async () => {
    const client = makeClient([
      { rowCount: 1, rows: [
        { hl_import_run_id: "run-2", hl_positie: 7 }
      ] },
      {
        rowCount: 1,
        rows: [{
          hl_import_run_id: "run-2",
          hl_positie: 7,
          hl_artiest: "Smells Like Teen Spirit",
          hl_titel_song: "Nirvana",
          fd_tag_title: null,
          as_correcte_artiest_spelling: null,
          hl_artist_key: null,
          as_artist_key: null,
          canonical_artist_name: null,
          artiesten_spelling_exists: false,
          artist_exists: false,
          swapped_artiesten_spelling_exists: true,
          swapped_artist_exists: true,
          swapped_as_artist_key: 7382,
          swapped_canonical_artist_name: "Nirvana",
          swapped_title_match_count: 1,
          title_match_count: 0,
          artist_key_match_count: 0,
          combined_match_count: 0
        }]
      },
      { rowCount: 1, rows: [{ hl_import_run_id: "run-2", hl_positie: 7, hl_artiest: "Smells Like Teen Spirit", hl_titel_song: "Nirvana" }] },
      { rowCount: 1, rows: [] },
      {
        rowCount: 1,
        rows: [{
          hl_import_run_id: "run-2",
          hl_positie: 7,
          hl_artiest: "Nirvana",
          hl_titel_song: "Smells Like Teen Spirit",
          fd_tag_title: "Smells Like Teen Spirit",
          as_correcte_artiest_spelling: "Nirvana",
          hl_artist_key: 7382,
          as_artist_key: 7382,
          canonical_artist_name: "Nirvana",
          artiesten_spelling_exists: true,
          artist_exists: true,
          swapped_artiesten_spelling_exists: false,
          swapped_artist_exists: false,
          swapped_title_match_count: 0,
          title_match_count: 1,
          artist_key_match_count: 1,
          combined_match_count: 1
        }]
      }
    ]);

    const result = await repairAllSuspectedTitleArtistSwapsForRun(client, "run-2");

    expect(result.repaired).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.repairedRows[0]).toMatchObject({
      hlPositie: 7,
      repairedArtist: "Nirvana",
      repairedTitle: "Smells Like Teen Spirit"
    });
  });
});


describe("forceSwapTitleArtistForPositions", () => {
  it("forces swaps for the requested visible row positions", async () => {
    const client = makeClient([
      { rowCount: 2, rows: [
        { hl_import_run_id: "run-3", hl_positie: 5 },
        { hl_import_run_id: "run-3", hl_positie: 7 }
      ] },
      { rowCount: 1, rows: [{ hl_import_run_id: "run-3", hl_positie: 5, hl_artiest: "Song A", hl_titel_song: "Artist A" }] },
      { rowCount: 1, rows: [] },
      { rowCount: 1, rows: [{
        hl_import_run_id: "run-3", hl_positie: 5,
        hl_artiest: "Artist A", hl_titel_song: "Song A", fd_tag_title: "Song A",
        as_correcte_artiest_spelling: "Artist A", hl_artist_key: 11, as_artist_key: 11,
        canonical_artist_name: "Artist A", artiesten_spelling_exists: true, artist_exists: true,
        swapped_artiesten_spelling_exists: false, swapped_artist_exists: false, swapped_title_match_count: 0,
        title_match_count: 1, artist_key_match_count: 1, combined_match_count: 1
      }] },
      { rowCount: 1, rows: [{ hl_import_run_id: "run-3", hl_positie: 7, hl_artiest: "Song B", hl_titel_song: "Artist B" }] },
      { rowCount: 1, rows: [] },
      { rowCount: 1, rows: [{
        hl_import_run_id: "run-3", hl_positie: 7,
        hl_artiest: "Artist B", hl_titel_song: "Song B", fd_tag_title: "Song B",
        as_correcte_artiest_spelling: "Artist B", hl_artist_key: 22, as_artist_key: 22,
        canonical_artist_name: "Artist B", artiesten_spelling_exists: true, artist_exists: true,
        swapped_artiesten_spelling_exists: false, swapped_artist_exists: false, swapped_title_match_count: 0,
        title_match_count: 1, artist_key_match_count: 1, combined_match_count: 1
      }] }
    ]);

    const result = await forceSwapTitleArtistForPositions(client, "run-3", [5, 7, 99]);

    expect(result.requested).toBe(3);
    expect(result.scanned).toBe(2);
    expect(result.repaired).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.skippedRows[0]).toMatchObject({ hlPositie: 99, reasonCode: "ROW_NOT_FOUND" });
  });
});
