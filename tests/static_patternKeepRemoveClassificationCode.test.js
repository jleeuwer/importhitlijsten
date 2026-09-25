import { describe, expect, test } from "vitest";
import fs from "node:fs";

describe("2H-S keep/remove code", () => {
  test("bevat migratie en scripts voor string_keep_patterns", () => {
    const sql = fs.readFileSync("scripts/sql/20260704_sprint2h_s_string_keep_patterns.sql", "utf8");
    const pkg = fs.readFileSync("package.json", "utf8");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.string_keep_patterns");
    expect(sql).toContain("skp_pattern_normalized");
    expect(sql).toContain("UNIQUE (skp_pattern_normalized)");
    expect(pkg).toContain("db:migrate:sprint2h-s");
  });

  test("service blokkeert bekende keep-patterns voor remove insert", () => {
    const service = fs.readFileSync("services/patternDiscoveryService.js", "utf8");
    expect(service).toContain("addPatternsToStringKeepPatterns");
    expect(service).toContain("skippedKeep");
    expect(service).toContain("KNOWN_KEEP_PATTERN");
    expect(service).toContain("getExistingKeepPatterns");
  });
});
