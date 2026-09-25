import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildDiscogsSearchParams,
  clearDiscogsCache,
  getDiscogsDetails,
  normalizeDiscogsDetailPayload,
  normalizeDiscogsSearchResult,
  searchDiscogs
} from "../services/discogsClient.js";

beforeEach(() => {
  clearDiscogsCache();
  vi.restoreAllMocks();
});

describe("Discogs client", () => {
  it("builds an unfiltered search query from artist and title by default", () => {
    expect(buildDiscogsSearchParams({ artist: "Nirvana", title: "Smells Like Teen Spirit" })).toEqual({
      q: "Nirvana Smells Like Teen Spirit",
      page: "1",
      per_page: "25"
    });
  });

  it("only sends Discogs type when the caller explicitly filters by type", () => {
    expect(buildDiscogsSearchParams({ artist: "Nirvana", title: "Smells Like Teen Spirit", type: "release" })).toEqual({
      q: "Nirvana Smells Like Teen Spirit",
      type: "release",
      page: "1",
      per_page: "25"
    });
  });

  it("normalizes Discogs search result fields", () => {
    const result = normalizeDiscogsSearchResult({
      id: 123,
      type: "master",
      title: "Nirvana - Smells Like Teen Spirit",
      uri: "/master/123-Nirvana-Smells-Like-Teen-Spirit",
      year: "1991",
      format: ["Single"],
      country: "Europe"
    });

    expect(result).toEqual(expect.objectContaining({
      id: 123,
      type: "master",
      masterId: 123,
      releaseId: null,
      title: "Nirvana - Smells Like Teen Spirit",
      discogsUrl: "https://www.discogs.com/master/123-Nirvana-Smells-Like-Teen-Spirit",
      year: 1991,
      format: ["Single"],
      country: "Europe"
    }));
  });


  it("normalizes Discogs release details without exposing label data", () => {
    const detail = normalizeDiscogsDetailPayload("release", {
      id: 456,
      title: "Smells Like Teen Spirit",
      artists: [{ name: "Nirvana" }],
      year: 1991,
      country: "Netherlands",
      uri: "https://www.discogs.com/release/456",
      labels: [{ name: "Very Long Label Should Not Be Exposed", catno: "DGCS 5" }],
      formats: [{ name: "Vinyl", descriptions: ["7\"", "Single"] }],
      tracklist: [
        { position: "A", title: "Smells Like Teen Spirit", duration: "5:01" },
        { position: "B", title: "Drain You", duration: "3:43" }
      ]
    });

    expect(detail).toEqual(expect.objectContaining({
      id: 456,
      type: "release",
      artist: "Nirvana",
      formats: ["Vinyl", "7\"", "Single"],
      catalogNumbers: ["DGCS 5"],
      tracklist: [
        { position: "A", title: "Smells Like Teen Spirit", duration: "5:01" },
        { position: "B", title: "Drain You", duration: "3:43" }
      ]
    }));
    expect(detail).not.toHaveProperty("labels");
  });

  it("fetches Discogs release details via injectable fetch and caches them", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      json: async () => ({
        id: 456,
        title: "Smells Like Teen Spirit",
        artists: [{ name: "Nirvana" }],
        year: 1991,
        country: "Europe",
        formats: [{ name: "CD", descriptions: ["Single"] }],
        uri: "https://www.discogs.com/release/456",
        tracklist: [{ position: "1", title: "Smells Like Teen Spirit", duration: "5:01" }]
      })
    });

    const first = await getDiscogsDetails({ type: "release", id: 456, fetchImpl });
    const second = await getDiscogsDetails({ type: "release", id: 456, fetchImpl });

    expect(first.cacheHit).toBe(false);
    expect(second.cacheHit).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(first.detail.tracklist[0]).toEqual({ position: "1", title: "Smells Like Teen Spirit", duration: "5:01" });
  });

  it("searches Discogs via injectable fetch and caches identical queries", async () => {
    const headers = new Map([
      ["x-discogs-ratelimit", "60"],
      ["x-discogs-ratelimit-remaining", "59"],
      ["x-discogs-ratelimit-used", "1"]
    ]);
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: (key) => headers.get(key) || null },
      json: async () => ({
        pagination: { page: 1, pages: 1, per_page: 25, items: 1 },
        results: [{ id: 123, type: "master", title: "Nirvana - Smells Like Teen Spirit", uri: "/master/123" }]
      })
    });

    const first = await searchDiscogs({ artist: "Nirvana", title: "Smells Like Teen Spirit", fetchImpl });
    const second = await searchDiscogs({ artist: "Nirvana", title: "Smells Like Teen Spirit", fetchImpl });

    expect(first.cacheHit).toBe(false);
    expect(second.cacheHit).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(first.results[0]).toEqual(expect.objectContaining({ masterId: 123 }));
  });
});
