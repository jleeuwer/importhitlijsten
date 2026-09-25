import { beforeEach, describe, expect, it, vi } from "vitest";

const infoMock = vi.fn();
const errorMock = vi.fn();

vi.mock("../config/logger.js", () => ({
  logger: {
    info: infoMock,
    error: errorMock
  }
}));

const { applyPostExportCorrection, previewPostExportCorrection } = await import("../services/postExportCorrectionService.js");

function makeClient(results) {
  const query = vi.fn();
  results.forEach((result) => {
    if (result instanceof Error) query.mockRejectedValueOnce(result);
    else query.mockResolvedValueOnce(result);
  });
  return { query };
}

function stagingRow(overrides = {}) {
  return {
    hl_import_run_id: "11111111-1111-1111-1111-111111111111",
    hl_hitlijst: "Top 2000",
    hl_uitzendjaar: 2026,
    hl_positie: 12,
    hl_artiest: "Wrong Artist",
    hl_titel_song: "Wrong Title",
    fd_tag_title: "Wrong Title",
    as_correcte_artiest_spelling: "Wrong Artist",
    hl_artist_key: 10,
    omroep_key: 2,
    periode_key: 3,
    ...overrides
  };
}

function candidateRow(overrides = {}) {
  return {
    fd_key: 44,
    fd_correct_artist: "Nirvana",
    canonical_artist_name: "Nirvana",
    fd_tag_title: "Smells Like Teen Spirit",
    fd_artist_key: 7382,
    fd_file_name: "Nirvana - Smells Like Teen Spirit.mp3",
    fd_year_song_publish: 1991,
    fd_year_song_version: 1991,
    st_song_type: "Single",
    ...overrides
  };
}

beforeEach(() => {
  infoMock.mockReset();
  errorMock.mockReset();
});

describe("post-export correction preview", () => {
  it("previews a staging-to-hitlijsten correction with safe five-column match", async () => {
    const client = makeClient([
      { rowCount: 1, rows: [stagingRow()] },
      { rowCount: 1, rows: [candidateRow()] },
      { rowCount: 1, rows: [{ hl_hitlijst: "Top 2000", hl_uitzendjaar: 2026, hl_positie: 12, ar_artist_key: 10, fd_tag_title: "Wrong Title", fd_key: 99, hl_samenstel_fd_key: null }] },
      { rowCount: 1, rows: [{ cnt: 1 }] }
    ]);

    const result = await previewPostExportCorrection(client, {
      runId: "11111111-1111-1111-1111-111111111111",
      hlPositie: 12,
      fdKey: 44,
      reason: "Correctie na export"
    });

    expect(result.canApply).toBe(true);
    expect(result.newValues).toMatchObject({ artist_key: 7382, correct_artist: "Nirvana", correct_title: "Smells Like Teen Spirit", fd_key: 44 });
    expect(result.hitlijsten.matchedCount).toBe(1);
    expect(client.query.mock.calls[2][0]).toContain("h.omroep_key IS NOT DISTINCT FROM");
    expect(client.query.mock.calls[2][0]).toContain("h.periode_key IS NOT DISTINCT FROM");
  });

  it("blocks preview when multiple hitlijsten matches are found", async () => {
    const client = makeClient([
      { rowCount: 1, rows: [stagingRow()] },
      { rowCount: 1, rows: [candidateRow()] },
      { rowCount: 2, rows: [
        { hl_hitlijst: "Top 2000", hl_uitzendjaar: 2026, hl_positie: 12, ar_artist_key: 10, fd_tag_title: "Wrong Title", fd_key: 99, hl_samenstel_fd_key: null },
        { hl_hitlijst: "Top 2000", hl_uitzendjaar: 2026, hl_positie: 12, ar_artist_key: 10, fd_tag_title: "Wrong Title", fd_key: 100, hl_samenstel_fd_key: null }
      ] },
      { rowCount: 1, rows: [{ cnt: 2 }] }
    ]);

    const result = await previewPostExportCorrection(client, {
      runId: "11111111-1111-1111-1111-111111111111",
      hlPositie: 12,
      fdKey: 44
    });

    expect(result.canApply).toBe(false);
    expect(result.warnings.join(" ")).toMatch(/Meerdere corresponderende hitlijstenregels/i);
  });
});

describe("post-export correction apply", () => {
  it("updates staging, hitlijsten and audit while leaving composition untouched", async () => {
    const client = makeClient([
      { rowCount: 1, rows: [stagingRow()] },
      { rowCount: 1, rows: [candidateRow()] },
      { rowCount: 1, rows: [{ hl_hitlijst: "Top 2000", hl_uitzendjaar: 2026, hl_positie: 12, ar_artist_key: 10, fd_tag_title: "Wrong Title", fd_key: 99, hl_samenstel_fd_key: 18723 }] },
      { rowCount: 1, rows: [{ cnt: 1 }] },
      { rowCount: 1, rows: [] },
      { rowCount: 1, rows: [] },
      { rowCount: 1, rows: [{ correction_id: 42 }] },
      { rowCount: 1, rows: [{
        hl_import_run_id: "11111111-1111-1111-1111-111111111111",
        hl_positie: 12,
        hl_artiest: "Wrong Artist",
        hl_titel_song: "Wrong Title",
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
      }] }
    ]);

    const result = await applyPostExportCorrection(client, {
      runId: "11111111-1111-1111-1111-111111111111",
      hlPositie: 12,
      fdKey: 44,
      reason: "Tikfout gecorrigeerd",
      confirmComposedTextOnly: true
    });

    expect(result.ok).toBe(true);
    expect(result.hitlijstenUpdated).toBe(1);
    expect(result.hitlijstenUpdatedCount).toBe(1);
    expect(result.stagingUpdated).toBe(true);
    expect(result.auditId).toBe(42);
    expect(result.changedFields.title).toEqual({ old: "Wrong Title", new: "Smells Like Teen Spirit" });
    expect(result.composedUnchanged).toBe(true);
    expect(client.query.mock.calls[5][0]).toContain("UPDATE public.hitlijsten");
    expect(client.query.mock.calls[5][0]).not.toContain("hl_samenstel_fd_key =");
    expect(client.query.mock.calls[6][0]).toContain("INSERT INTO public.importhitlijst_corrections_audit");
  });
});
