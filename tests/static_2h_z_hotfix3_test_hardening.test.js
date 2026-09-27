/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

function collectTestFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectTestFiles(full));
    else if (/\.(test|spec)\.(js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe("2H-Z Hotfix 3 test-suite hardening", () => {
  it("uses Vitest for every non-E2E test file and package sprint script", () => {
    const testFiles = collectTestFiles(path.join(root, "tests"))
      .filter((file) => !file.includes(`${path.sep}e2e${path.sep}`));

    for (const file of testFiles) {
      const source = fs.readFileSync(file, "utf8");
      expect(source).not.toMatch(/from\s+["']node:test["']/);
      expect(source).not.toMatch(/require\(["']node:test["']\)/);
    }

    const pkg = JSON.parse(read("package.json"));
    expect(pkg.scripts["test:unit"]).toMatch(/vitest run/);
    expect(pkg.scripts["test:all"]).toBe("npm run test:unit && npm run test:e2e");
    expect(Object.values(pkg.scripts).join("\n")).not.toContain("node --test");
    expect(pkg.scripts["test:sprint2h-z-hotfix3"]).toMatch(/static_2h_z_hotfix3_test_hardening/);
  });

  it("keeps startapp test mapped to the full test suite", () => {
    const startapp = read("startapp.sh");
    expect(startapp).toMatch(/test\)\s+npm_script='test:all'/);
    expect(startapp).toMatch(/all[\s\S]*add_action validate[\s\S]*add_action dev/);
  });

  it("keeps current PostgreSQL documentation and defaults on musicdb", () => {
    const files = [
      "README.md",
      "laatstesprint.md",
      "docs/sprint-2h/SPRINT_2H_Z_HOTFIX2_DUPLICATE_ROW_REVIEW.md",
      "docs/testcases/FUNCTIONAL_TEST_CASES_2H_Z_HOTFIX3_TEST_SUITE_HARDENING.md",
      "Release Notes/RELEASE_NOTES_2H_Z_HOTFIX3_v1.1.0.md"
    ];
    const combined = files.map(read).join("\n");
    expect(combined).toContain("musicdb");
    expect(combined).not.toContain("POSTGRES_DB=muziek");
    expect(read("scripts/apply_sprint2h_z_csv_import_registry.sh")).toContain('POSTGRES_DB="${POSTGRES_DB:-musicdb}"');
    expect(read("scripts/apply_sprint2h_z_hotfix2_duplicate_rows.sh")).toContain('POSTGRES_DB="${POSTGRES_DB:-musicdb}"');
  });

  it("renders Runs navigation actions as semantic links", () => {
    const source = read("src/ui/pages/StagingResults.jsx");
    expect(source).toMatch(/<a[\s\S]*href=\{`\/staging\?runId=/);
    expect(source).toMatch(/<a[\s\S]*href=\{`\/edit\?runId=/);
    expect(source).not.toMatch(/<Button\s+as="a"[\s\S]*\/staging\?runId=/);
  });

  it("guards Discogs numeric timeout and cache settings", () => {
    const source = read("services/discogsClient.js");
    expect(source).toContain("parsePositiveNumberConfig");
    expect(source).toMatch(/Number\.isFinite\(parsed\) && parsed > 0/);
    expect(source).toMatch(/DISCOGS_REQUEST_TIMEOUT_MS/);
    expect(source).toMatch(/DISCOGS_CACHE_TTL_SECONDS/);
  });

  it("documents Hotfix 3 without introducing a new database migration", () => {
    expect(read("README.md")).toContain("Hotfix 3 heeft **geen nieuwe database-migratie**");
    expect(read("docs/technical/TECHNICAL_SPEC_2H_Z_HOTFIX3_TEST_SUITE_HARDENING.md")).toContain("geen nieuwe database-migratie");
    expect(read("MANIFEST_2H_Z_HOTFIX3.md")).toContain("Nieuwe database-migratie: **nee**");
  });
});
