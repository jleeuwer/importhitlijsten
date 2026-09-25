import { describe, expect, it } from "vitest";
import {
  applyDiscogsFilters,
  buildDiscogsFilterOptions,
  createEmptyDiscogsFilters,
  extractDiscogsFormats,
  normalizeDiscogsType
} from "../../src/ui/utils/discogsResultFilters.js";

describe("Discogs result filters", () => {
  const results = [
    { id: 1, type: "master", title: "Nirvana - Smells Like Teen Spirit", year: 1991, country: "Europe", format: ["Single", "CD"] },
    { id: 2, type: "release", title: "Nirvana - Smells Like Teen Spirit", year: 1992, country: "Netherlands", format: ["Vinyl", "7\"", "Single"] },
    { id: 3, type: "release", title: "Nirvana - Smells Like Teen Spirit", year: 1991, country: "UK", formats: "Vinyl, 12\", Maxi-Single" },
    { id: 4, type: null, title: "Nirvana - Smells Like Teen Spirit", year: null, country: "", format: [] }
  ];

  it("normaliseert master, release en overige Discogs types", () => {
    expect(normalizeDiscogsType({ type: "master" })).toBe("Master");
    expect(normalizeDiscogsType({ type: "release" })).toBe("Release");
    expect(normalizeDiscogsType({ type: "artist" })).toBe("Overig");
  });

  it("extraheert en dedupliceert formats uit arrays en strings", () => {
    expect(extractDiscogsFormats({ format: ["Vinyl", "Single"], formats: "Vinyl, 12\"" })).toEqual(["12\"", "Single", "Vinyl"]);
  });

  it("bouwt dynamische filteropties uit ontvangen resultaten", () => {
    const options = buildDiscogsFilterOptions(results);
    expect(options.types).toEqual(["ALL", "Master", "Release", "Overig"]);
    expect(options.formats).toEqual(["ALL", "7\"", "12\"", "CD", "Maxi-Single", "Single", "Vinyl"]);
    expect(options.years).toEqual(["ALL", "1992", "1991"]);
    expect(options.countries).toEqual(["ALL", "Europe", "Netherlands", "UK"]);
  });

  it("past Type, Format, Jaar en Land client-side gecombineerd toe", () => {
    const filtered = applyDiscogsFilters(results, { type: "Release", format: "Vinyl", year: "1991", country: "UK" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(3);
  });

  it("geeft alle resultaten terug bij lege filters", () => {
    expect(applyDiscogsFilters(results, createEmptyDiscogsFilters())).toHaveLength(results.length);
  });
});
