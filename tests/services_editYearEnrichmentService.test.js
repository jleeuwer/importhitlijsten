import { beforeEach, describe, expect, it, vi } from "vitest";

const infoMock = vi.fn();

vi.mock("../config/logger.js", () => ({
  logger: { info: infoMock }
}));

const { previewYearEnrichmentForRun, applyYearEnrichmentForRun } = await import("../services/editYearEnrichmentService.js");

function makeClient(rows, followUpRowCounts = []) {
  const query = vi.fn();
  query.mockResolvedValueOnce({ rows });
  for (const item of followUpRowCounts) {
    if (typeof item === "object" && item.rows) {
      query.mockResolvedValueOnce(item);
    } else {
      query.mockResolvedValueOnce({ rowCount: item });
    }
  }
  return { query };
}

beforeEach(() => {
  infoMock.mockReset();
});

describe("previewYearEnrichmentForRun", () => {
  it("marks missing-year rows with one or more publish-year file_details candidates as updateable", async () => {
    const client = makeClient([
      { hl_positie: 1, hl_artiest: "Artist A", hl_titel_song: "Song A", hl_jaar: 0, fd_tag_title: "Song A", as_correcte_artiest_spelling: "Artist A", hl_artist_key: 10, match_count: 1, source_fd_key: 1001, fd_year_song_publish: 1984, distinct_candidate_years: 1 },
      { hl_positie: 2, hl_artiest: "Artist B", hl_titel_song: "Song B", hl_jaar: 1988, fd_tag_title: "Song B", as_correcte_artiest_spelling: "Artist B", hl_artist_key: 20, match_count: 1, source_fd_key: 2001, fd_year_song_publish: 1987, distinct_candidate_years: 1 },
      { hl_positie: 3, hl_artiest: "Artist C", hl_titel_song: "Song C", hl_jaar: 0, fd_tag_title: "Song C", as_correcte_artiest_spelling: "Artist C", hl_artist_key: 30, match_count: 2, source_fd_key: 3001, fd_year_song_publish: 1990, distinct_candidate_years: 1 },
      { hl_positie: 4, hl_artiest: "Artist D", hl_titel_song: "Song D", hl_jaar: 0, fd_tag_title: "Song D", as_correcte_artiest_spelling: "Artist D", hl_artist_key: 40, match_count: 0, source_fd_key: null, fd_year_song_publish: null, distinct_candidate_years: 0 }
    ]);

    const result = await previewYearEnrichmentForRun(client, "run-1", [1, 2, 3, 4]);

    expect(result.mode).toBe("YEAR_ENRICHMENT_FROM_FILE_DETAILS");
    expect(result.scanned).toBe(4);
    expect(result.eligible).toBe(3);
    expect(result.updateable).toBe(2);
    expect(result.skippedAlreadyFilled).toBe(1);
    expect(result.skippedNoMatch).toBe(1);
    expect(result.multipleCandidates).toBe(1);
    expect(result.rows.map((r) => r.status)).toEqual([
      "UPDATEABLE",
      "SKIPPED_ALREADY_FILLED",
      "UPDATEABLE",
      "SKIPPED_NO_MATCH"
    ]);
    expect(result.rows[2].warnings.join(" ")).toContain("Meerdere file_details-kandidaten");
    expect(client.query.mock.calls[0][0]).not.toContain("public.hitlijsten");
  });

  it("skips rows without correct title or artist-key because enrichment must match correct artist and title", async () => {
    const client = makeClient([
      { hl_positie: 5, hl_artiest: "Artist E", hl_titel_song: "Song E", hl_jaar: 0, fd_tag_title: null, as_correcte_artiest_spelling: null, hl_artist_key: null, match_count: 0, source_fd_key: null, fd_year_song_publish: null, distinct_candidate_years: 0 }
    ]);

    const result = await previewYearEnrichmentForRun(client, "run-1", [5]);

    expect(result.updateable).toBe(0);
    expect(result.skippedMissingCorrectData).toBe(1);
    expect(result.rows[0].status).toBe("SKIPPED_MISSING_CORRECT_DATA");
  });

  it("uses only file_details.fd_year_song_publish and does not fall back to version year", async () => {
    const client = makeClient([
      { hl_positie: 6, hl_artiest: "Artist F", hl_titel_song: "Song F", hl_jaar: 0, fd_tag_title: "Song F", as_correcte_artiest_spelling: "Artist F", hl_artist_key: 60, match_count: 0, source_fd_key: null, fd_year_song_publish: null, fd_year_song_version: 1984, distinct_candidate_years: 0 }
    ]);

    const result = await previewYearEnrichmentForRun(client, "run-1", [6]);

    expect(result.updateable).toBe(0);
    expect(result.skippedNoMatch).toBe(1);
    expect(result.rows[0].candidateYear).toBeNull();
  });
});

describe("applyYearEnrichmentForRun", () => {
  it("updates only staging_hitlijsten.hl_jaar from publish year and writes audit", async () => {
    const client = makeClient([
      { hl_positie: 1, hl_artiest: "Artist A", hl_titel_song: "Song A", hl_jaar: 0, fd_tag_title: "Song A", as_correcte_artiest_spelling: "Artist A", hl_artist_key: 10, match_count: 1, source_fd_key: 1001, fd_year_song_publish: 1984, distinct_candidate_years: 1 }
    ], [
      1,
      { rows: [{ correction_id: 77 }] }
    ]);

    const result = await applyYearEnrichmentForRun(client, "run-1", [1]);

    expect(result.updated).toBe(1);
    expect(result).not.toHaveProperty("hitlijstenUpdated");
    expect(result.auditIds).toEqual([77]);
    expect(client.query.mock.calls[1][0]).toContain("UPDATE public.staging_hitlijsten");
    expect(client.query.mock.calls[1][1]).toEqual([1984, "run-1", 1]);
    expect(client.query.mock.calls.some(([sql]) => String(sql).includes("UPDATE public.hitlijsten"))).toBe(false);
    expect(client.query.mock.calls.some(([sql]) => String(sql).includes("SET hl_jaar") && String(sql).includes("public.hitlijsten"))).toBe(false);
    expect(client.query.mock.calls[2][0]).toContain("YEAR_ENRICHMENT_FROM_FILE_DETAILS");
    expect(infoMock).toHaveBeenCalledWith("Year enrichment completed", expect.objectContaining({ runId: "run-1", updated: 1 }));
  });
});
