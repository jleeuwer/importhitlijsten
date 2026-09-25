import { describe, expect, it, vi } from "vitest";

import {
  buildBlockedDiscogsExportContent,
  buildBlockedDiscogsExportLine,
  exportBlockedDiscogsLinksForRun,
  getBlockedDiscogsExportSummary,
  getDesiredVersionGroupLabel,
  groupBlockedDiscogsExportRows,
  selectDiscogsUrl
} from "../services/blockedDiscogsExportService.js";

function makeClient(rows) {
  return {
    query: vi.fn().mockResolvedValue({ rows })
  };
}

const blockedBase = {
  hl_import_run_id: "run-1",
  hl_hitlijst: "Top 2000",
  hl_uitzendjaar: 2024,
  hl_positie: 12,
  hl_artiest: "Raw Artist",
  hl_titel_song: "Raw Title",
  as_correcte_artiest_spelling: "Nirvana",
  fd_tag_title: "Smells Like Teen Spirit",
  hl_artist_key: 101,
  title_match_count: 1,
  artist_key_match_count: 1,
  combined_match_count: 0,
  discogs_master_url: "https://www.discogs.com/master/123",
  discogs_release_url: "https://www.discogs.com/release/456",
  hl_discogs_link: "https://www.discogs.com/legacy/789"
};

describe("blocked Discogs export service", () => {
  it("builds the required plain text line", () => {
    expect(buildBlockedDiscogsExportLine(blockedBase)).toBe(
      "Nirvana - Smells Like Teen Spirit https://www.discogs.com/master/123"
    );
  });

  it("prefers master URL over release and legacy URL", () => {
    expect(selectDiscogsUrl(blockedBase)).toBe("https://www.discogs.com/master/123");
    expect(selectDiscogsUrl({ ...blockedBase, discogs_master_url: "" })).toBe("https://www.discogs.com/release/456");
    expect(selectDiscogsUrl({ ...blockedBase, discogs_master_url: "", discogs_release_url: "" })).toBe("https://www.discogs.com/legacy/789");
  });

  it("exports only blocked rows with a Discogs URL grouped by fallback version", async () => {
    const readyWithUrl = {
      ...blockedBase,
      hl_positie: 13,
      combined_match_count: 1,
      discogs_master_url: "https://www.discogs.com/master/ready"
    };
    const blockedWithoutUrl = {
      ...blockedBase,
      hl_positie: 14,
      discogs_master_url: "",
      discogs_release_url: "",
      hl_discogs_link: ""
    };
    const client = makeClient([blockedBase, readyWithUrl, blockedWithoutUrl]);

    const result = await exportBlockedDiscogsLinksForRun({
      client,
      runId: "run-1",
      now: new Date("2026-04-26T09:30:05")
    });

    expect(result.rowCount).toBe(1);
    expect(result.filename).toBe("blocked-discogs-links-top-2000-2024-20260426-093005.txt");
    expect(result.groupCount).toBe(1);
    expect(result.content).toBe("Geen versie gekozen\n\nNirvana - Smells Like Teen Spirit\nhttps://www.discogs.com/master/123\n");
  });

  it("returns the same count as the exportable rows", async () => {
    const client = makeClient([
      blockedBase,
      { ...blockedBase, hl_positie: 20, discogs_master_url: "https://www.discogs.com/master/999" }
    ]);

    await expect(getBlockedDiscogsExportSummary({ client, runId: "run-1" })).resolves.toMatchObject({
      exportableCount: 2,
      groupCount: 1
    });
  });


  it("groups blocked Discogs export content by desired song version", () => {
    const rows = [
      { ...blockedBase, hl_positie: 2, desired_song_type_display: "Live versie", fd_tag_title: "Come As You Are", discogs_master_url: "https://www.discogs.com/master/live-2" },
      { ...blockedBase, hl_positie: 1, desired_song_type_display: "Single versie", discogs_master_url: "https://www.discogs.com/master/single-1" },
      { ...blockedBase, hl_positie: 3, desired_song_type_display: "Live versie", fd_tag_title: "Lithium", discogs_master_url: "https://www.discogs.com/master/live-3" },
      { ...blockedBase, hl_positie: 4, desired_song_type_display: null, fd_tag_title: "In Bloom", discogs_master_url: "https://www.discogs.com/master/fallback-4" }
    ];

    expect(groupBlockedDiscogsExportRows(rows).map((group) => group.label)).toEqual([
      "Live versie",
      "Single versie",
      "Geen versie gekozen"
    ]);

    expect(buildBlockedDiscogsExportContent(rows)).toBe(
      "Live versie\n\n" +
      "Nirvana - Come As You Are\nhttps://www.discogs.com/master/live-2\n\n" +
      "Nirvana - Lithium\nhttps://www.discogs.com/master/live-3\n\n" +
      "Single versie\n\n" +
      "Nirvana - Smells Like Teen Spirit\nhttps://www.discogs.com/master/single-1\n\n" +
      "Geen versie gekozen\n\n" +
      "Nirvana - In Bloom\nhttps://www.discogs.com/master/fallback-4\n"
    );
  });

  it("uses song type description fallbacks for the group label", () => {
    expect(getDesiredVersionGroupLabel({ desired_song_type_display: "  Album versie  " })).toBe("Album versie");
    expect(getDesiredVersionGroupLabel({ st_song_type_desc: "12 inch mix" })).toBe("12 inch mix");
    expect(getDesiredVersionGroupLabel({ desired_song_type: "Live" })).toBe("Live");
    expect(getDesiredVersionGroupLabel({})).toBe("Geen versie gekozen");
  });

  it("builds empty content when there are no rows", () => {
    expect(buildBlockedDiscogsExportContent([])).toBe("");
  });
});
