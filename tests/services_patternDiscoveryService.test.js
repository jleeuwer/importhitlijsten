import { describe, expect, test } from "vitest";
import {
  PATTERN_CLASSIFICATIONS,
  discoverPatternsForTitle,
  groupPatternCandidates,
  normalizePatternForCompare,
  normalizePatternValue,
  previewPatternEffect,
  summarizeImportPatternCandidates
} from "../services/patternDiscoveryService.js";

describe("patternDiscoveryService", () => {
  test("detecteert suffixpatterns tussen haakjes en previewt verwijdering zonder automatische mutatie", () => {
    const [candidate] = discoverPatternsForTitle("Queen - We Are The Champions (Live)");
    expect(candidate.rawPattern).toBe("(Live)");
    expect(candidate.after).toBe("Queen - We Are The Champions");
    expect(candidate.classification).toBe(PATTERN_CLASSIFICATIONS.SAFE_REMOVE_PATTERN);
  });

  test("groepeert remaster/remastered met variabel jaartal case-insensitive", () => {
    const candidates = [
      ...discoverPatternsForTitle("Song A (2011 Remaster)"),
      ...discoverPatternsForTitle("Song B (Remastered 2011)"),
      ...discoverPatternsForTitle("Song C (2020 remastered)")
    ];
    const groups = groupPatternCandidates(candidates, []);
    expect(groups).toHaveLength(1);
    expect(groups[0].family).toBe("remaster_with_year");
    expect(groups[0].canonicalLabel).toBe("Remaster met jaartal");
    expect(groups[0].classification).toBe(PATTERN_CLASSIFICATIONS.SAFE_REMOVE_PATTERN);
    expect(groups[0].count).toBe(3);
    expect(groups[0].variants.map((v) => v.pattern)).toEqual(
      expect.arrayContaining(["(2011 Remaster)", "(Remastered 2011)", "(2020 remastered)"])
    );
  });

  test("markeert bestaande string_del_patterns op basis van genormaliseerde vergelijking", () => {
    const candidates = discoverPatternsForTitle("Song A (LIVE)");
    const groups = groupPatternCandidates(candidates, [{ st_string_delete: "live" }]);
    expect(groups[0].exists).toBe(true);
    expect(groups[0].newVariants).toHaveLength(0);
  });

  test("onderdrukt bekende titelonderdelen uit string_keep_patterns als verwijdervoorstel", () => {
    const candidates = discoverPatternsForTitle("Eurythmics - Sweet Dreams (Are Made of This)");
    const groups = groupPatternCandidates(candidates, [], [{ skp_pattern: "Are Made of This" }]);
    expect(groups).toHaveLength(0);
    expect(groups.suppressedKeep).toHaveLength(1);
    expect(groups.suppressedKeep[0].classification).toBe(PATTERN_CLASSIFICATIONS.KNOWN_KEEP_PATTERN);
  });

  test("classificeert meerwoordige haakjesinhoud zonder versie-indicator als waarschijnlijk titelonderdeel", () => {
    const [candidate] = discoverPatternsForTitle("Sweet Dreams (Are Made of This)");
    expect(candidate.classification).toBe(PATTERN_CLASSIFICATIONS.LIKELY_TITLE_CONTENT);
  });

  test("previewPatternEffect past alleen geselecteerde concrete patterns toe", () => {
    const changes = previewPatternEffect(["(Live)"], [
      { hl_positie: 1, title: "Song A (Live)" },
      { hl_positie: 2, title: "Song B (Radio Edit)" }
    ]);
    expect(changes).toEqual([
      { hl_positie: 1, before: "Song A (Live)", after: "Song A", patternsApplied: ["(Live)"] }
    ]);
  });

  test("importsamenvatting telt kandidaatgroepen en onderdrukte keep-patterns", () => {
    const summary = summarizeImportPatternCandidates([
      "Song A (Live)",
      "Song B (Live)",
      "Song C (2011 Remaster)",
      "Sweet Dreams (Are Made of This)"
    ], [{ skp_pattern: "(Are Made of This)" }]);
    expect(summary.candidateGroups).toBe(2);
    expect(summary.candidateOccurrences).toBe(3);
    expect(summary.suppressedKeepPatterns).toBe(1);
  });

  test("normalizePatternValue is hoofdletteronafhankelijk en negeert buitenste haakjes", () => {
    expect(normalizePatternValue("  (Remastered 2011) ")).toBe("remastered 2011");
    expect(normalizePatternForCompare("Are Made of This")).toBe("are made of this");
    expect(normalizePatternForCompare("(Are Made of This)")).toBe("are made of this");
  });
});
