import { beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeImportedText } from "../utils/textFixes.js";

const infoMock = vi.fn();
const errorMock = vi.fn();

vi.mock("../config/logger.js", () => ({
  logger: {
    info: infoMock,
    error: errorMock
  }
}));

const { previewNormalizeTextForPositions, normalizeTextForPositions } = await import("../services/editTextNormalizationService.js");

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

describe("normalizeImportedText", () => {
  it("normalizes whitespace, nbsp and mojibake safely", () => {
    expect(normalizeImportedText("  CafÃ©\u00A0\u00A0del\tMar  ")).toBe("Café del Mar");
    expect(normalizeImportedText("Johnâ€™s Song")).toBe("John's Song");
    expect(normalizeImportedText("Normal value")).toBe("Normal value");
  });
});

describe("previewNormalizeTextForPositions", () => {
  it("returns preview rows only where normalization changes the source text", async () => {
    const client = makeClient([
      { rowCount: 2, rows: [
        { hl_import_run_id: "run-8", hl_positie: 2, hl_artiest: "  CafÃ©\u00A0Tacvba ", hl_titel_song: " Eres\t", hl_jaar: 1994, hl_discogs_link: null },
        { hl_import_run_id: "run-8", hl_positie: 3, hl_artiest: "Nirvana", hl_titel_song: "Lithium", hl_jaar: 1992, hl_discogs_link: "https://discogs.example/1" }
      ] }
    ]);

    const result = await previewNormalizeTextForPositions(client, "run-8", [2, 3, 99]);

    expect(result.requested).toBe(3);
    expect(result.scanned).toBe(2);
    expect(result.changedRows).toBe(1);
    expect(result.changedFields).toBe(2);
    expect(result.missingRows).toEqual([99]);
    expect(result.preview[0]).toMatchObject({ hlPositie: 2 });
    expect(result.preview[0].changes).toEqual([
      { field: "hl_artiest", before: "  CafÃ©\u00A0Tacvba ", after: "Café Tacvba" },
      { field: "hl_titel_song", before: " Eres\t", after: "Eres" }
    ]);
  });
});

describe("normalizeTextForPositions", () => {
  it("normalizes changed rows and reuses manual correction recompute flow", async () => {
    const client = makeClient([
      { rowCount: 2, rows: [
        { hl_import_run_id: "run-8", hl_positie: 2, hl_artiest: "  CafÃ©\u00A0Tacvba ", hl_titel_song: " Eres\t", hl_jaar: 1994, hl_discogs_link: null },
        { hl_import_run_id: "run-8", hl_positie: 3, hl_artiest: "Nirvana", hl_titel_song: "Lithium", hl_jaar: 1992, hl_discogs_link: "https://discogs.example/1" }
      ] },
      { rowCount: 0, rows: [] },
      { rowCount: 1, rows: [] },
      { rowCount: 1, rows: [{ hl_import_run_id: "run-8", hl_positie: 2 }] },
      { rowCount: 1, rows: [{
        hl_import_run_id: "run-8",
        hl_positie: 2,
        hl_artiest: "Café Tacvba",
        hl_titel_song: "Eres",
        fd_tag_title: "Eres",
        as_correcte_artiest_spelling: "Café Tacvba",
        hl_artist_key: 41,
        as_artist_key: 41,
        canonical_artist_name: "Café Tacvba",
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

    const result = await normalizeTextForPositions(client, "run-8", [2, 3]);

    expect(result.changedRows).toBe(1);
    expect(result.unchangedRows).toBe(1);
    expect(result.changedFields).toBe(2);
    expect(result.updatedRows[0]).toMatchObject({ hlPositie: 2, status: "ok" });
  });
});
