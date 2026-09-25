import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClient = {
  query: vi.fn(),
  release: vi.fn()
};

vi.mock("../config/db.js", () => ({
  pool: {
    connect: vi.fn(async () => mockClient)
  }
}));

const { applyAltSpellingForRow } = await import("../models/altspelling.js");

describe("AltSpelling song_spelling hardening", () => {
  beforeEach(() => {
    mockClient.query.mockReset();
    mockClient.release.mockReset();
  });

  it("creates or updates song_spelling using original staging title and artist", async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ hl_titel_song: "Smels Like Teen Spirit", hl_artiest: "Nirvanna" }]
      })
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          song_spelling_key: 42,
          hl_titel_song: "Smels Like Teen Spirit",
          hl_artiest: "Nirvanna",
          fd_tag_title: "Smells Like Teen Spirit"
        }]
      })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({}); // COMMIT

    const result = await applyAltSpellingForRow({
      runId: "00000000-0000-4000-8000-000000000001",
      hl_positie: 7,
      fd_tag_title: "Smells Like Teen Spirit"
    });

    const upsertSql = mockClient.query.mock.calls[2][0];
    const upsertParams = mockClient.query.mock.calls[2][1];

    expect(upsertSql).toContain("INSERT INTO public.song_spelling");
    expect(upsertSql).toContain("ON CONFLICT (hl_titel_song, hl_artiest)");
    expect(upsertParams).toEqual([
      "Smels Like Teen Spirit",
      "Nirvanna",
      "Smells Like Teen Spirit"
    ]);
    expect(result.songSpellingRow).toMatchObject({
      hl_titel_song: "Smels Like Teen Spirit",
      hl_artiest: "Nirvanna",
      fd_tag_title: "Smells Like Teen Spirit"
    });
  });

  it("updates staging fd_tag_title and clears hl_find_cmd after selecting a known file_details title", async () => {
    mockClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ hl_titel_song: "Wrong", hl_artiest: "Artist" }] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ song_spelling_key: 1, hl_titel_song: "Wrong", hl_artiest: "Artist", fd_tag_title: "Correct" }] })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({});

    await applyAltSpellingForRow({
      runId: "00000000-0000-4000-8000-000000000001",
      hl_positie: 3,
      fd_tag_title: "Correct"
    });

    const updateSql = mockClient.query.mock.calls[3][0];
    const updateParams = mockClient.query.mock.calls[3][1];

    expect(updateSql).toContain("UPDATE public.staging_hitlijsten");
    expect(updateSql).toContain("fd_tag_title = $1");
    expect(updateSql).toContain("hl_find_cmd = NULL");
    expect(updateParams).toEqual(["Correct", "00000000-0000-4000-8000-000000000001", 3]);
  });

  it("rolls back and rejects when the staging row is missing", async () => {
    mockClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({}); // ROLLBACK

    await expect(applyAltSpellingForRow({
      runId: "00000000-0000-4000-8000-000000000001",
      hl_positie: 999,
      fd_tag_title: "Correct"
    })).rejects.toThrow(/Staging row not found/);

    expect(mockClient.query.mock.calls.at(-1)[0]).toBe("ROLLBACK");
  });
});
