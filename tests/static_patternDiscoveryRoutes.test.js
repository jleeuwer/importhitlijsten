import { describe, expect, test } from "vitest";
import fs from "node:fs";

describe("pattern discovery routes", () => {
  test("2H-S endpoints gebruiken remove- en keep-pattern flows", () => {
    const routes = fs.readFileSync("routes/indexroutes.js", "utf8");
    expect(routes).toContain('/api/edit/runs/:runId/pattern-suggestions');
    expect(routes).toContain('/api/edit/runs/:runId/pattern-suggestions/preview');
    expect(routes).toContain('/api/edit/runs/:runId/pattern-suggestions/add');
    expect(routes).toContain('/api/edit/runs/:runId/pattern-suggestions/add-keep');
    expect(routes).toContain('addPatternsToStringDelPatterns');
    expect(routes).toContain('addPatternsToStringKeepPatterns');
  });
});
