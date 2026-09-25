import { describe, expect, it, vi } from "vitest";

import {
  normalizeDiscogsSelection,
  saveDiscogsSelectionForStagingRow
} from "../services/discogsSelectionService.js";

describe("Discogs selection service", () => {
  it("normalizes a master/release selection", () => {
    expect(normalizeDiscogsSelection({
      discogs_master_id: "123",
      discogs_master_url: "https://www.discogs.com/master/123",
      discogs_release_id: "456",
      discogs_release_year: "1991"
    })).toEqual(expect.objectContaining({
      discogs_master_id: 123,
      discogs_master_url: "https://www.discogs.com/master/123",
      discogs_release_id: 456,
      discogs_release_year: 1991
    }));
  });

  it("requires at least a master or release id", () => {
    expect(() => normalizeDiscogsSelection({})).toThrow(/discogs_master_id or discogs_release_id is required/);
  });

  it("updates the staging row and keeps hl_discogs_link in sync", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({
        rowCount: 1,
        rows: [{
          hl_import_run_id: "run-1",
          hl_positie: 7,
          discogs_master_id: 123,
          discogs_master_url: "https://www.discogs.com/master/123",
          discogs_release_id: null,
          discogs_release_url: null,
          hl_discogs_link: "https://www.discogs.com/master/123"
        }]
      })
    };

    const result = await saveDiscogsSelectionForStagingRow(client, "run-1", 7, {
      discogs_master_id: 123,
      discogs_master_url: "https://www.discogs.com/master/123",
      discogs_master_title: "Smells Like Teen Spirit",
      discogs_master_artist: "Nirvana",
      discogs_master_year: 1991
    });

    expect(result.ok).toBe(true);
    expect(client.query.mock.calls[0][0]).toContain("UPDATE public.staging_hitlijsten");
    expect(client.query.mock.calls[0][0]).toContain("hl_discogs_link = COALESCE($4, $9, hl_discogs_link)");
  });
});
