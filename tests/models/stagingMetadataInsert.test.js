import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();

vi.mock("../../config/db.js", () => ({
  pool: {
    query: queryMock
  }
}));

const { insertStagingRow } = await import("../../models/staging_hitlijsten.js");

beforeEach(() => {
  queryMock.mockReset();
});

describe("insertStagingRow metadata fields", () => {
  it("persists omroep_key and periode_key on staging rows", async () => {
    queryMock.mockResolvedValue({ rowCount: 1 });

    await insertStagingRow({
      hl_hitlijst: "Top 80s",
      hl_uitzendjaar: 2026,
      hl_titel_song: "Africa",
      hl_artiest: "Toto",
      hl_positie: 1,
      hl_jaar: 1982,
      hl_artist_key: 123,
      omroep_key: 2,
      periode_key: 7,
      hl_import_run_id: "run-1"
    });

    expect(queryMock.mock.calls[0][0]).toContain("omroep_key");
    expect(queryMock.mock.calls[0][0]).toContain("periode_key");
    expect(queryMock.mock.calls[0][1]).toEqual(expect.arrayContaining([2, 7, "run-1"]));
  });
});
