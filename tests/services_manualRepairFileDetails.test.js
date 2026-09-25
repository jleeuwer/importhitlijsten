import { beforeEach, describe, expect, it, vi } from "vitest";

const infoMock = vi.fn();
const errorMock = vi.fn();

vi.mock("../config/logger.js", () => ({
  logger: {
    info: infoMock,
    error: errorMock
  }
}));

const {
  applyManualRepairFromFileDetails,
  saveManualStagingCorrection,
  searchManualRepairFileDetailsCandidates
} = await import("../services/editManualCorrectionService.js");

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

describe("manual repair from file_details", () => {
  it("searches active file_details candidates", async () => {
    const client = makeClient([
      {
        rowCount: 1,
        rows: [{
          fd_key: 44,
          fd_correct_artist: "Nirvana",
          canonical_artist_name: "Nirvana",
          fd_tag_title: "Smells Like Teen Spirit",
          fd_artist_key: 7382,
          fd_file_name: "Nirvana - Smells Like Teen Spirit.mp3",
          fd_year_song_publish: 1991,
          fd_year_song_version: 1991,
          st_song_type: "Single"
        }]
      }
    ]);

    const result = await searchManualRepairFileDetailsCandidates(client, { query: "Nirvana", limit: 10 });

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]).toMatchObject({
      fd_key: 44,
      fd_correct_artist: "Nirvana",
      fd_tag_title: "Smells Like Teen Spirit"
    });
  });


  it("supports separate artist and title search terms", async () => {
    const client = makeClient([
      {
        rowCount: 1,
        rows: [{
          fd_key: 45,
          fd_correct_artist: "Nirvana",
          canonical_artist_name: "Nirvana",
          fd_tag_title: "Come As You Are",
          fd_artist_key: 7382,
          fd_file_name: "Nirvana - Come As You Are.mp3",
          fd_year_song_publish: 1992,
          fd_year_song_version: 1992,
          st_song_type: "Single"
        }]
      }
    ]);

    const result = await searchManualRepairFileDetailsCandidates(client, { artist: "Nirvana", title: "Come As You Are", limit: 10 });

    expect(client.query).toHaveBeenCalledWith(expect.any(String), ["", "Nirvana", "Come As You Are", 10]);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]).toMatchObject({
      fd_key: 45,
      fd_correct_artist: "Nirvana",
      fd_tag_title: "Come As You Are"
    });
  });

  it("applies selected file_details candidate to staging and refreshes diagnostics", async () => {
    const client = makeClient([
      {
        rowCount: 1,
        rows: [{
          fd_key: 44,
          fd_correct_artist: "Nirvana",
          canonical_artist_name: "Nirvana",
          fd_tag_title: "Smells Like Teen Spirit",
          fd_artist_key: 7382,
          fd_year_song_publish: 1991,
          fd_year_song_version: 1991
        }]
      },
      { rowCount: 1, rows: [] },
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

    const result = await applyManualRepairFromFileDetails(client, "run-9", 8, 44);

    expect(result.ok).toBe(true);
    expect(result.fdKey).toBe(44);
    expect(result.diagnostics.row.hlArtiest).toBe("Nirvana");
    expect(result.diagnostics.row.fdTagTitle).toBe("Smells Like Teen Spirit");
  });

  it("rejects free overwrite without explicit confirmation", async () => {
    const client = makeClient([]);

    await expect(saveManualStagingCorrection(client, "run-9", 8, {
      hl_artiest: "Free Artist",
      hl_titel_song: "Free Title"
    })).rejects.toThrow(/explicit confirmation/i);
  });
});
