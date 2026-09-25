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

const { determineRowDiagnostics } = await import("../services/editDiagnosticsService.js");
const { repairArtistRelationForStagingRow } = await import("../services/editArtistRelationService.js");

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

describe("determineRowDiagnostics", () => {
  it("marks missing artist spelling as blocking and repairable", () => {
    const result = determineRowDiagnostics({
            hl_import_run_id: "run-1",
      hl_positie: 10,
      hl_artiest: "Example Artist",
      hl_titel_song: "Song",
      fd_tag_title: "Song",
      hl_artist_key: null,
      artiesten_spelling_exists: false,
      artist_exists: false,
      title_match_count: 1,
      artist_key_match_count: 0,
      combined_match_count: 0
    });

    expect(result.status).toBe("blocked");
    expect(result.reasonCode).toBe("MISSING_ARTIESTEN_SPELLING_ENTRY");
    expect(result.canRepairArtistRelation).toBe(true);
  });

  it("treats multiple file_details matches as warning", () => {
    const result = determineRowDiagnostics({
            hl_import_run_id: "run-1",
      hl_positie: 20,
      hl_artiest: "Artist",
      hl_titel_song: "Song",
      fd_tag_title: "Song",
      hl_artist_key: 55,
      artiesten_spelling_exists: true,
      artist_exists: true,
      title_match_count: 1,
      artist_key_match_count: 2,
      combined_match_count: 4
    });

    expect(result.status).toBe("warning");
    expect(result.reasonCode).toBe("MULTIPLE_FILE_DETAILS_COMBINED_MATCHES");
    expect(result.canRepairArtistRelation).toBe(false);
  });
});

describe("repairArtistRelationForStagingRow", () => {
  it("keeps export blocked when artist relation is repaired but no combined file_details match exists", async () => {
    const client = makeClient([
      { rowCount: 1, rows: [{ hl_import_run_id: "run-33", hl_positie: 4, hl_artiest: "Artist X", hl_artist_key: null }] },
      { rowCount: 1, rows: [{ ar_artist_key: 901, ar_artist_name: "Artist X" }] },
      { rowCount: 1, rows: [{ as_alternatieve_spelling: "Artist X", as_artist_key: 901, inserted: false }] },
      { rowCount: 1, rows: [] },
      {
        rowCount: 1,
        rows: [{
          hl_import_run_id: "run-33",
          hl_positie: 4,
          hl_artiest: "Artist X",
          hl_titel_song: "Rare Song",
          fd_tag_title: "Rare Song",
          as_correcte_artiest_spelling: "Artist X",
          hl_artist_key: 901,
          artiesten_spelling_exists: true,
          artist_exists: true,
          as_artist_key: 901,
          canonical_artist_name: "Artist X",
          title_match_count: 1,
          artist_key_match_count: 1,
          combined_match_count: 0
        }]
      }
    ]);

    const result = await repairArtistRelationForStagingRow(client, "run-33", 4);

    expect(result.ok).toBe(true);
    expect(result.action).toBe("repaired_artist_relation");
    expect(result.newHlArtistKey).toBe(901);
    expect(result.diagnostics.status).toBe("blocked");
    expect(result.diagnostics.reasonCode).toBe("NO_FILE_DETAILS_COMBINED_MATCH");
    expect(infoMock).toHaveBeenCalledWith(
      "Edit-phase artist relation repair completed",
      expect.objectContaining({
        runId: "run-33",
        hlPositie: 4,
        status: "blocked",
        reasonCode: "NO_FILE_DETAILS_COMBINED_MATCH"
      })
    );
  });

  it("logs and rethrows unexpected database errors during repair", async () => {
    const dbError = new Error("insert failed");
    const client = makeClient([
      { rowCount: 1, rows: [{ hl_import_run_id: "run-err", hl_positie: 11, hl_artiest: "Artist Err", hl_artist_key: null }] },
      { rowCount: 0, rows: [] },
      dbError
    ]);

    await expect(repairArtistRelationForStagingRow(client, "run-err", 11)).rejects.toThrow(/insert failed/i);

    expect(errorMock).toHaveBeenCalledWith(
      "Edit-phase artist relation repair failed",
      expect.objectContaining({
        runId: "run-err",
        hlPositie: 11,
        statusCode: 500,
        error: "insert failed"
      })
    );
  });

  it("creates artist relation and refreshes diagnostics", async () => {
    const client = makeClient([
      { rowCount: 1, rows: [{ hl_import_run_id: "run-22", hl_positie: 7, hl_artiest: "New Artist", hl_artist_key: null }] },
      { rowCount: 0, rows: [] },
      { rowCount: 1, rows: [{ ar_artist_key: 345, ar_artist_name: "New Artist", inserted: true }] },
      { rowCount: 1, rows: [{ as_alternatieve_spelling: "New Artist", as_artist_key: 345, inserted: true }] },
      { rowCount: 1, rows: [] },
      {
        rowCount: 1,
        rows: [{
          hl_import_run_id: "run-22",
          hl_positie: 7,
          hl_artiest: "New Artist",
          hl_titel_song: "New Song",
          fd_tag_title: "New Song",
          as_correcte_artiest_spelling: "New Artist",
          hl_artist_key: 345,
          artiesten_spelling_exists: true,
          artist_exists: true,
          as_artist_key: 345,
          canonical_artist_name: "New Artist",
          title_match_count: 1,
          artist_key_match_count: 1,
          combined_match_count: 1
        }]
      }
    ]);

    const result = await repairArtistRelationForStagingRow(client, "run-22", 7);

    expect(result.ok).toBe(true);
    expect(result.action).toBe("created_artist_and_spelling");
    expect(result.newHlArtistKey).toBe(345);
    expect(result.diagnostics.status).toBe("ok");
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE public.staging_hitlijsten"),
      ["run-22", 7, 345, "New Artist"]
    );
    expect(infoMock).toHaveBeenCalledWith(
      "Edit-phase artist relation repair completed",
      expect.objectContaining({ runId: "run-22", hlPositie: 7, newHlArtistKey: 345 })
    );
  });

  it("blocks repair when hl_artiest is empty", async () => {
    const client = makeClient([
      { rowCount: 1, rows: [{ hl_import_run_id: "run-22", hl_positie: 9, hl_artiest: " ", hl_artist_key: null }] }
    ]);

    await expect(repairArtistRelationForStagingRow(client, "run-22", 9)).rejects.toThrow(/hl_artiest is empty/i);
    expect(warnMock).toHaveBeenCalledWith(
      "Edit-phase artist relation repair blocked",
      expect.objectContaining({ reasonCode: "UNRESOLVED_HL_ARTIEST", runId: "run-22" })
    );
  });
});
