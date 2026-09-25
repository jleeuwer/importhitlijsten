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

const { getStagingRowDiagnostics } = await import("../services/editDiagnosticsService.js");

function makeClient(results) {
  const query = vi.fn();
  results.forEach((result) => {
    if (result instanceof Error) {
      query.mockRejectedValueOnce(result);
    } else {
      query.mockResolvedValueOnce(result);
    }
  });
  return { query };
}

beforeEach(() => {
  infoMock.mockReset();
  warnMock.mockReset();
  errorMock.mockReset();
});

describe("getStagingRowDiagnostics", () => {
  it("returns a blocking diagnostics result when file_details combined match is missing", async () => {
    const client = makeClient([
      {
        rowCount: 1,
        rows: [{
          hl_import_run_id: "run-44",
          hl_positie: 8,
          hl_artiest: "Artist",
          hl_titel_song: "Song",
          fd_tag_title: "Song",
          as_correcte_artiest_spelling: "Artist",
          hl_artist_key: 77,
          as_artist_key: 77,
          canonical_artist_name: "Artist",
          artiesten_spelling_exists: true,
          artist_exists: true,
          title_match_count: 1,
          artist_key_match_count: 1,
          combined_match_count: 0
        }]
      }
    ]);

    const result = await getStagingRowDiagnostics(client, "run-44", 8);

    expect(result.status).toBe("blocked");
    expect(result.reasonCode).toBe("NO_FILE_DETAILS_COMBINED_MATCH");
    expect(result.canRepairArtistRelation).toBe(false);
    expect(infoMock).toHaveBeenCalledWith(
      "Edit diagnostics resolved",
      expect.objectContaining({
        runId: "run-44",
        hlPositie: 8,
        status: "blocked",
        reasonCode: "NO_FILE_DETAILS_COMBINED_MATCH"
      })
    );
  });

  it("throws 404 when the staging row does not exist", async () => {
    const client = makeClient([{ rowCount: 0, rows: [] }]);

    await expect(getStagingRowDiagnostics(client, "run-404", 99)).rejects.toMatchObject({
      status: 404,
      message: "Staging row not found."
    });

    expect(errorMock).toHaveBeenCalledWith(
      "Edit diagnostics failed",
      expect.objectContaining({ runId: "run-404", hlPositie: 99, statusCode: 404 })
    );
  });

  it("logs and rethrows unexpected database errors", async () => {
    const dbError = new Error("database temporarily unavailable");
    const client = makeClient([dbError]);

    await expect(getStagingRowDiagnostics(client, "run-db", 3)).rejects.toThrow(
      /database temporarily unavailable/i
    );

    expect(errorMock).toHaveBeenCalledWith(
      "Edit diagnostics failed",
      expect.objectContaining({
        runId: "run-db",
        hlPositie: 3,
        statusCode: 500,
        error: "database temporarily unavailable"
      })
    );
  });

  it("detects a likely title/artist swap when artist lookup works on hl_titel_song and title matches exist on hl_artiest", async () => {
    const client = makeClient([
      {
        rowCount: 1,
        rows: [{
          hl_import_run_id: "run-swap",
          hl_positie: 14,
          hl_artiest: "Smells Like Teen Spirit",
          hl_titel_song: "Nirvana",
          fd_tag_title: "Nirvana",
          as_correcte_artiest_spelling: null,
          hl_artist_key: 7382,
          as_artist_key: null,
          canonical_artist_name: null,
          artiesten_spelling_exists: false,
          artist_exists: false,
          swapped_as_artist_key: 7382,
          swapped_canonical_artist_name: "Nirvana",
          swapped_artiesten_spelling_exists: true,
          swapped_artist_exists: true,
          swapped_title_match_count: 1,
          title_match_count: 0,
          artist_key_match_count: 0,
          combined_match_count: 0
        }]
      }
    ]);

    const result = await getStagingRowDiagnostics(client, "run-swap", 14);

    expect(result.status).toBe("blocked");
    expect(result.reasonCode).toBe("SUSPECTED_TITLE_ARTIST_SWAP");
    expect(result.canRepairTitleArtistSwap).toBe(true);
    expect(result.swapHints.swappedCanonicalArtistName).toBe("Nirvana");
  });

  it("prioritizes suspected swap above missing fd_tag_title when the swapped signals are strong", async () => {
    const client = makeClient([
      {
        rowCount: 1,
        rows: [{
          hl_import_run_id: "run-swap-empty-title",
          hl_positie: 21,
          hl_artiest: "Smells Like Teen Spirit",
          hl_titel_song: "Nirvana",
          fd_tag_title: null,
          as_correcte_artiest_spelling: null,
          hl_artist_key: null,
          as_artist_key: null,
          canonical_artist_name: null,
          artiesten_spelling_exists: false,
          artist_exists: false,
          swapped_as_artist_key: 7382,
          swapped_canonical_artist_name: "Nirvana",
          swapped_artiesten_spelling_exists: true,
          swapped_artist_exists: true,
          swapped_title_match_count: 1,
          title_match_count: 0,
          artist_key_match_count: 0,
          combined_match_count: 0
        }]
      }
    ]);

    const result = await getStagingRowDiagnostics(client, "run-swap-empty-title", 21);

    expect(result.reasonCode).toBe("SUSPECTED_TITLE_ARTIST_SWAP");
    expect(result.canRepairTitleArtistSwap).toBe(true);
    expect(result.swapHints.suspectedTitleArtistSwap).toBe(true);
  });
});
