import { beforeEach, describe, expect, it, vi } from "vitest";

const infoMock = vi.fn();
const errorMock = vi.fn();

vi.mock("../config/logger.js", () => ({
  logger: {
    info: infoMock,
    error: errorMock
  }
}));

const { saveManualStagingCorrection } = await import("../services/editManualCorrectionService.js");

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
  errorMock.mockReset();
});

describe("saveManualStagingCorrection", () => {
  it("updates staging source fields and returns refreshed diagnostics", async () => {
    const client = makeClient([
      { rowCount: 1, rows: [] },
      { rowCount: 0, rows: [] },
      { rowCount: 1, rows: [{ hl_import_run_id: "run-9", hl_positie: 8 }] },
      {
        rowCount: 1,
        rows: [{
          hl_import_run_id: "run-9",
          hl_positie: 8,
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

    const result = await saveManualStagingCorrection(client, "run-9", 8, {
      hl_artiest: "Nirvana",
      hl_titel_song: "Smells Like Teen Spirit",
      hl_jaar: 1991,
      hl_discogs_link: "https://discogs.example/release/1",
      overwriteConfirmed: true
    });

    expect(result.ok).toBe(true);
    expect(result.diagnostics.row.hlArtiest).toBe("Nirvana");
    expect(result.diagnostics.row.fdTagTitle).toBe("Smells Like Teen Spirit");
    expect(result.diagnostics.artistRelation.canonicalArtistName).toBe("Nirvana");
  });

  it("returns clean diagnostics after file_details driven manual repair with clean resolved values", async () => {
    const client = makeClient([
      { rowCount: 1, rows: [{
        fd_key: 901,
        fd_correct_artist: "Coldcut Featuring Yazz And The Plastic Population",
        fd_tag_title: "Doctorin' The House",
        fd_artist_key: 1282,
        canonical_artist_name: "Coldcut Featuring Yazz And The Plastic Population",
        fd_year_song_publish: 1988,
        fd_year_song_version: null
      }] },
      { rowCount: 1, rows: [] },
      { rowCount: 1, rows: [{
        hl_import_run_id: "run-encoding",
        hl_positie: 17,
        hl_artiest: "Coldcut Featuring Yazz And The Plastic Population",
        hl_titel_song: "Doctorin' The House",
        fd_tag_title: "Doctorin' The House",
        as_correcte_artiest_spelling: "Coldcut Featuring Yazz And The Plastic Population",
        hl_artist_key: 1282,
        as_artist_key: 1282,
        canonical_artist_name: "Coldcut Featuring Yazz And The Plastic Population",
        artiesten_spelling_exists: true,
        artist_exists: true,
        swapped_artiesten_spelling_exists: false,
        swapped_artist_exists: false,
        swapped_title_match_count: 0,
        title_match_count: 1,
        artist_key_match_count: 1,
        combined_match_count: 1
      }] }
    ]);

    const result = await saveManualStagingCorrection(client, "run-encoding", 17, {
      fd_key: 901
    });

    expect(result.ok).toBe(true);
    expect(result.diagnostics.status).toBe("ok");
    expect(result.diagnostics.reasonCode).toBe(null);
    expect(result.diagnostics.encodingHints.hasEncodingDamage).toBe(false);
  });
});
