import { beforeEach, describe, expect, it, vi } from "vitest";
import { decodeCsvBuffer } from "../utils/csvReader.js";
import {
  containsReplacementChar,
  detectEncodingDamage,
  repairRecoverableEncoding
} from "../utils/textFixes.js";

const infoMock = vi.fn();
const errorMock = vi.fn();

vi.mock("../config/logger.js", () => ({
  logger: {
    info: infoMock,
    error: errorMock
  }
}));

const {
  previewEncodingRepairForPositions,
  repairEncodingForPositions
} = await import("../services/editEncodingRepairService.js");

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

describe("encoding helpers", () => {
  it("detects recoverable mojibake and replacement-char damage separately", () => {
    expect(repairRecoverableEncoding("BelgiÃ«")).toBe("België");
    expect(detectEncodingDamage("BelgiÃ«")).toMatchObject({
      hasDamage: true,
      isRecoverable: true,
      reasonCode: "RECOVERABLE_ENCODING_DAMAGE",
      repairedValue: "België"
    });
    expect(containsReplacementChar("Belgi�")).toBe(true);
    expect(detectEncodingDamage("Belgi�")).toMatchObject({
      hasDamage: true,
      isRecoverable: false,
      reasonCode: "REPLACEMENT_CHAR_DAMAGE"
    });
  });



  it("does not flag clean manual repair text as encoding damage because of benign normalization", () => {
    expect(detectEncodingDamage("Coldcut Featuring Yazz And The Plastic Population")).toMatchObject({
      hasDamage: false,
      reasonCode: null
    });
    expect(detectEncodingDamage("Doctorin' The House")).toMatchObject({
      hasDamage: false,
      reasonCode: null
    });
    expect(detectEncodingDamage(" Doctorin'\u00A0The   House ")).toMatchObject({
      hasDamage: false,
      reasonCode: null
    });
    expect(detectEncodingDamage("Doctorin&amp;#39; The House")).toMatchObject({
      hasDamage: false,
      reasonCode: null
    });
  });

  it("prefers latin1 fallback when utf8 decoding has more damage", () => {
    const buffer = Buffer.from("artiest;song;jaar\nBelgi\xeb;Test;1989\n", "latin1");
    const decoded = decodeCsvBuffer(buffer);
    expect(decoded.encodingUsed).toBe("latin1-fallback");
    expect(decoded.text).toContain("België");
  });
});

describe("previewEncodingRepairForPositions", () => {
  it("returns only recoverable rows in the preview", async () => {
    const client = makeClient([
      {
        rowCount: 2,
        rows: [
          { hl_import_run_id: "run-12", hl_positie: 4, hl_artiest: "BelgiÃ«", hl_titel_song: "CafÃ©", hl_jaar: 1990, hl_discogs_link: null },
          { hl_import_run_id: "run-12", hl_positie: 5, hl_artiest: "Belgi�", hl_titel_song: "Song", hl_jaar: 1991, hl_discogs_link: null }
        ]
      }
    ]);

    const result = await previewEncodingRepairForPositions(client, "run-12", [4, 5, 9]);

    expect(result.requested).toBe(3);
    expect(result.scanned).toBe(2);
    expect(result.damagedRows).toBe(2);
    expect(result.repairableRows).toBe(1);
    expect(result.missingRows).toEqual([9]);
    expect(result.preview[0]).toMatchObject({ hlPositie: 4 });
    expect(result.preview[0].changes).toEqual([
      { field: "hl_artiest", before: "BelgiÃ«", after: "België" },
      { field: "hl_titel_song", before: "CafÃ©", after: "Café" }
    ]);
  });
});

describe("repairEncodingForPositions", () => {
  it("repairs only recoverable encoding damage and skips replacement-char rows", async () => {
    const client = makeClient([
      {
        rowCount: 2,
        rows: [
          { hl_import_run_id: "run-12", hl_positie: 4, hl_artiest: "BelgiÃ«", hl_titel_song: "CafÃ©", hl_jaar: 1990, hl_discogs_link: null },
          { hl_import_run_id: "run-12", hl_positie: 5, hl_artiest: "Belgi�", hl_titel_song: "Song", hl_jaar: 1991, hl_discogs_link: null }
        ]
      },
      { rowCount: 0, rows: [] },
      { rowCount: 1, rows: [] },
      { rowCount: 1, rows: [{ hl_import_run_id: "run-12", hl_positie: 4 }] },
      {
        rowCount: 1,
        rows: [{
          hl_import_run_id: "run-12",
          hl_positie: 4,
          hl_artiest: "België",
          hl_titel_song: "Café",
          fd_tag_title: "Café",
          as_correcte_artiest_spelling: "België",
          hl_artist_key: 88,
          as_artist_key: 88,
          canonical_artist_name: "België",
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

    const result = await repairEncodingForPositions(client, "run-12", [4, 5]);

    expect(result.damagedRows).toBe(2);
    expect(result.repaired).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.updatedRows[0]).toMatchObject({ hlPositie: 4, status: "ok" });
  });
});
