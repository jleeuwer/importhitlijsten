import { beforeEach, describe, expect, it, vi } from "vitest";

const connectMock = vi.fn();
const infoMock = vi.fn();
const warnMock = vi.fn();
const errorMock = vi.fn();

vi.mock("../../config/db.js", () => ({
  pool: {
    connect: connectMock
  }
}));

vi.mock("../../config/logger.js", () => ({
  logger: {
    info: infoMock,
    warn: warnMock,
    error: errorMock
  }
}));

const hitlijstenModule = await import("../../models/hitlijsten.js");
const { getExportHitlijstenStatus, exportRunToHitlijsten } = hitlijstenModule;

function makeClient(queryResults) {
  const query = vi.fn();
  queryResults.forEach((result) => {
    if (result instanceof Error) {
      query.mockRejectedValueOnce(result);
    } else {
      query.mockResolvedValueOnce(result);
    }
  });
  return {
    query,
    release: vi.fn()
  };
}

beforeEach(() => {
  connectMock.mockReset();
  infoMock.mockReset();
  warnMock.mockReset();
  errorMock.mockReset();
});

describe("getExportHitlijstenStatus", () => {
  it("returns key-based validation counters and preview issues", async () => {
    const client = makeClient([
      { rows: [{ hl_hitlijst: "Top 80s", hl_uitzendjaar: 2026, staging_rows: 3 }] },
      { rows: [{ existing_rows: 0 }] },
      { rows: [{ total: 3, missing_fd_tag_title: 0, missing_hl_artist_key: 1 }] },
      {
        rows: [
          {
            hl_positie: 12,
            hl_artiest: "Artist A",
            hl_titel_song: "Song A",
            fd_tag_title: "Song A",
            as_correcte_artiest_spelling: "Artist A",
            hl_artist_key: null,
            title_match_count: 1,
            artist_key_match_count: 0,
            combined_match_count: 0
          },
          {
            hl_positie: 13,
            hl_artiest: "Artist B",
            hl_titel_song: "Song B",
            fd_tag_title: "Song B",
            as_correcte_artiest_spelling: "Artist B",
            hl_artist_key: 44,
            title_match_count: 1,
            artist_key_match_count: 1,
            combined_match_count: 2
          }
        ]
      }
    ]);
    connectMock.mockResolvedValue(client);

    const result = await getExportHitlijstenStatus("run-1");

    const validationSql = client.query.mock.calls[3][0];
    expect(validationSql).toContain("WITH staging AS");
    expect(validationSql).toContain("LEFT JOIN LATERAL");
    expect(validationSql).toContain("candidate_fd_keys");
    expect(validationSql).toContain("hl_desired_song_type_key");

    expect(result).toEqual({
      runId: "run-1",
      total: 3,
      hl_hitlijst: "Top 80s",
      hl_uitzendjaar: 2026,
      existingRowsForTarget: 0,
      alreadyExported: false,
      duplicateExportBlocked: false,
      missingFdTagTitle: 0,
      missingHlArtistKey: 1,
      missingLinks: 0,
      multipleLinks: 1,
      ambiguousLinks: 1,
      warningIssues: 1,
      issuesPreview: [
        {
          hl_positie: 12,
          hl_artiest: "Artist A",
          hl_titel_song: "Song A",
          fd_tag_title: "Song A",
          as_correcte_artiest_spelling: "Artist A",
          hl_artist_key: null,
          titleMatchCount: 1,
          artistKeyMatchCount: 0,
          combinedMatchCount: 0,
          candidateFdKeys: [],
          hlDesiredSongTypeKey: null,
          reasonCode: "MISSING_HL_ARTIST_KEY"
        },
        {
          hl_positie: 13,
          hl_artiest: "Artist B",
          hl_titel_song: "Song B",
          fd_tag_title: "Song B",
          as_correcte_artiest_spelling: "Artist B",
          hl_artist_key: 44,
          titleMatchCount: 1,
          artistKeyMatchCount: 1,
          combinedMatchCount: 2,
          candidateFdKeys: [],
          hlDesiredSongTypeKey: null,
          reasonCode: "MULTIPLE_FILE_DETAILS_COMBINED_MATCHES"
        }
      ]
    });
    expect(client.release).toHaveBeenCalled();
    expect(infoMock).toHaveBeenCalledWith(
      "Export validation summary",
      expect.objectContaining({
        runId: "run-1",
        missingHlArtistKey: 1,
        multipleLinks: 1
      })
    );
    expect(warnMock).toHaveBeenCalledTimes(2);
  });
});

describe("exportRunToHitlijsten", () => {
  it("allows ambiguous candidates as warnings but blocks the first real missing match", async () => {
    const client = makeClient([
      { rows: [] },
      { rows: [{ hl_hitlijst: "Top 80s", hl_uitzendjaar: 2026, staging_rows: 2 }] },
      { rows: [{ existing_rows: 0 }] },
      { rows: [{ total: 2, missing_fd_tag_title: 0, missing_hl_artist_key: 0 }] },
      {
        rows: [
          {
            hl_positie: 1,
            hl_artiest: "Toto",
            hl_titel_song: "Africa",
            fd_tag_title: "Africa",
            as_correcte_artiest_spelling: "Toto",
            hl_artist_key: 6528,
            title_match_count: 5,
            artist_key_match_count: 7,
            combined_match_count: 2
          },
          {
            hl_positie: 87,
            hl_artiest: "Example Artist",
            hl_titel_song: "Example Song",
            fd_tag_title: "Example Song",
            as_correcte_artiest_spelling: "Example Artist",
            hl_artist_key: 1234,
            title_match_count: 1,
            artist_key_match_count: 5,
            combined_match_count: 0
          }
        ]
      },
      { rows: [] }
    ]);
    connectMock.mockResolvedValue(client);

    await expect(exportRunToHitlijsten("run-2")).rejects.toThrow(
      /First blocking issue: positie 87.*NO_FILE_DETAILS_COMBINED_MATCH/
    );

    expect(infoMock).toHaveBeenCalledWith(
      "Export validation warnings detected",
      expect.objectContaining({
        runId: "run-2",
        totalWarnings: 1,
        warningReasonCode: "MULTIPLE_FILE_DETAILS_COMBINED_MATCHES"
      })
    );
    expect(errorMock).toHaveBeenCalledWith(
      "Export blocked by validation errors",
      expect.objectContaining({
        runId: "run-2",
        totalIssues: 1,
        firstReasonCode: "NO_FILE_DETAILS_COMBINED_MATCH"
      })
    );
    expect(client.query).toHaveBeenLastCalledWith("ROLLBACK");
  });

  it("blocks export when the hitlijst and uitzendjaar already exist in hitlijsten", async () => {
    const client = makeClient([
      { rows: [] },
      { rows: [{ hl_hitlijst: "Top 80s", hl_uitzendjaar: 2026, staging_rows: 2 }] },
      { rows: [{ existing_rows: 80 }] },
      { rows: [{ total: 2, missing_fd_tag_title: 0, missing_hl_artist_key: 0 }] },
      { rows: [] },
      { rows: [] }
    ]);
    connectMock.mockResolvedValue(client);

    await expect(exportRunToHitlijsten("run-duplicate")).rejects.toThrow(
      /already exported \(80 existing row\(s\) in hitlijsten\)/
    );

    expect(warnMock).toHaveBeenCalledWith(
      "Export blocked because hitlijst/year was already exported",
      expect.objectContaining({
        runId: "run-duplicate",
        hlHitlijst: "Top 80s",
        hlUitzendjaar: 2026,
        existingRowsForTarget: 80
      })
    );
    expect(client.query).toHaveBeenLastCalledWith("ROLLBACK");
  });

  it("succeeds on key-based match even when as_correcte_artiest_spelling is empty", async () => {
    const client = makeClient([
      { rows: [] },
      { rows: [{ hl_hitlijst: "Top 80s", hl_uitzendjaar: 2026, staging_rows: 2 }] },
      { rows: [{ existing_rows: 0 }] },
      { rows: [{ total: 2, missing_fd_tag_title: 0, missing_hl_artist_key: 0 }] },
      { rows: [] },
      { rows: [{ existing: 1 }] },
      { rowCount: 2 },
      { rows: [] }
    ]);
    connectMock.mockResolvedValue(client);

    const result = await exportRunToHitlijsten("run-3");

    expect(result).toEqual({
      ok: true,
      dryRun: false,
      runId: "run-3",
      total: 2,
      hl_hitlijst: "Top 80s",
      hl_uitzendjaar: 2026,
      existingRowsForTarget: 0,
      alreadyExported: false,
      existing: 1,
      inserted: 1,
      updated: 1,
      skipped: 0,
      multipleLinks: 0,
      ambiguousLinks: 0,
      warningIssues: 0
    });

    const upsertSql = client.query.mock.calls[6][0];
    expect(upsertSql).toContain("fd.fd_artist_key = s.hl_artist_key");
    expect(upsertSql).toContain("lower(regexp_replace(replace(btrim(coalesce(fd.fd_tag_title::text");
    expect(upsertSql).not.toContain("fd.fd_correct_artist = s.as_correcte_artiest_spelling");
    expect(upsertSql).toContain("discogs_master_id");
    expect(upsertSql).toContain("s.discogs_master_url");
    expect(upsertSql).toContain("discogs_release_id");
    expect(infoMock).toHaveBeenCalledWith(
      "Export completed",
      expect.objectContaining({
        runId: "run-3",
        insertedCount: 1,
        updatedCount: 1
      })
    );
    expect(client.query).toHaveBeenLastCalledWith("COMMIT");
  });

  it("uses case-insensitive normalized title matching in the export SQL", async () => {
    const client = makeClient([
      { rows: [] },
      { rows: [{ hl_hitlijst: "Top 80s", hl_uitzendjaar: 2026, staging_rows: 2 }] },
      { rows: [{ existing_rows: 0 }] },
      { rows: [{ total: 1, missing_fd_tag_title: 0, missing_hl_artist_key: 0 }] },
      { rows: [] },
      { rows: [{ existing: 0 }] },
      { rowCount: 1 },
      { rows: [] }
    ]);
    connectMock.mockResolvedValue(client);

    await exportRunToHitlijsten("run-case");

    const upsertSql = client.query.mock.calls[6][0];
    expect(upsertSql).toContain("lower(regexp_replace(replace(btrim(coalesce(fd.fd_tag_title::text, '')), chr(160), ' '), '\\s+', ' ', 'g'))");
    expect(upsertSql).toContain("lower(regexp_replace(replace(btrim(coalesce(s.fd_tag_title::text, '')), chr(160), ' '), '\\s+', ' ', 'g'))");
  });

  it("allows export when the combined key matches more than once and reports it as warning", async () => {
    const client = makeClient([
      { rows: [] },
      { rows: [{ hl_hitlijst: "Top 80s", hl_uitzendjaar: 2026, staging_rows: 2 }] },
      { rows: [{ existing_rows: 0 }] },
      { rows: [{ total: 1, missing_fd_tag_title: 0, missing_hl_artist_key: 0 }] },
      {
        rows: [
          {
            hl_positie: 1,
            hl_artiest: "Toto",
            hl_titel_song: "Africa",
            fd_tag_title: "Africa",
            as_correcte_artiest_spelling: "Toto",
            hl_artist_key: 6528,
            title_match_count: 2,
            artist_key_match_count: 4,
            combined_match_count: 2
          }
        ]
      },
      { rows: [{ existing: 0 }] },
      { rowCount: 1 },
      { rows: [] }
    ]);
    connectMock.mockResolvedValue(client);

    const result = await exportRunToHitlijsten("run-5");

    expect(result).toEqual(expect.objectContaining({
      ok: true,
      dryRun: false,
      runId: "run-5",
      total: 1,
      multipleLinks: 1,
      ambiguousLinks: 1,
      warningIssues: 1
    }));
    expect(errorMock).not.toHaveBeenCalledWith(
      "Export blocked by validation errors",
      expect.anything()
    );
    expect(infoMock).toHaveBeenCalledWith(
      "Export validation warnings detected",
      expect.objectContaining({
        runId: "run-5",
        totalWarnings: 1,
        warningReasonCode: "MULTIPLE_FILE_DETAILS_COMBINED_MATCHES"
      })
    );
    const upsertSql = client.query.mock.calls[6][0];
    expect(upsertSql).toContain("CASE");
    expect(upsertSql).toContain("fd.fd_song_type_key = s.hl_desired_song_type_key");
    expect(upsertSql).not.toContain("s.hl_desired_song_type_key IS NULL OR fd.fd_song_type_key");
    expect(client.query).toHaveBeenLastCalledWith("COMMIT");
  });

  it("still blocks dry-run when blocking issues exist", async () => {
    const client = makeClient([
      { rows: [] },
      { rows: [{ hl_hitlijst: "Top 80s", hl_uitzendjaar: 2026, staging_rows: 2 }] },
      { rows: [{ existing_rows: 0 }] },
      { rows: [{ total: 2, missing_fd_tag_title: 0, missing_hl_artist_key: 1 }] },
      {
        rows: [
          {
            hl_positie: 22,
            hl_artiest: "Artist C",
            hl_titel_song: "Song C",
            fd_tag_title: "Song C",
            as_correcte_artiest_spelling: "",
            hl_artist_key: null,
            title_match_count: 1,
            artist_key_match_count: 0,
            combined_match_count: 0
          }
        ]
      },
      { rows: [] }
    ]);
    connectMock.mockResolvedValue(client);

    await expect(exportRunToHitlijsten("run-4", { dryRun: true })).rejects.toThrow(
      /MISSING_HL_ARTIST_KEY/
    );

    expect(errorMock).toHaveBeenCalledWith(
      "Export blocked by validation errors",
      expect.objectContaining({
        runId: "run-4",
        firstReasonCode: "MISSING_HL_ARTIST_KEY"
      })
    );
  });
});
