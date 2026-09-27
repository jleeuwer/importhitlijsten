import { describe, expect, it } from "vitest";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

describe("2H-Z Hotfix 2 static integration", () => {
  it("adds stable staging row identity and physical-delete audit migration", () => {
    const sql = read("scripts/sql/20260925_sprint2h_z_hotfix2_duplicate_row_review.sql");
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS sh_key bigint/i);
    expect(sql).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS ux_staging_hitlijsten_sh_key/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.staging_hitlijsten_delete_audit/i);
    expect(sql).toMatch(/DUPLICATE_CONFIRMED/i);
  });

  it("exposes duplicate scan, skip and physical delete endpoints", () => {
    const routes = read("routes/indexroutes.js");
    expect(routes).toMatch(/\/staging-duplicates"/);
    expect(routes).toMatch(/\/staging-duplicates\/skip"/);
    expect(routes).toMatch(/\/staging-duplicates\/delete"/);
    expect(routes).toMatch(/confirmPhysicalDelete/);
  });

  it("maps startapp test to the complete test suite", () => {
    const startapp = read("startapp.sh");
    expect(startapp).toMatch(/test\)\s+npm_script='test:all'/);
    expect(startapp).toMatch(/test\s+Voer: npm run test:all/);
    expect(startapp).toMatch(/all\)\s+[\s\S]*add_action validate[\s\S]*add_action dev/);
  });

  it("keeps application version on the documentation sprint version 1.1.0", () => {
    const pkg = JSON.parse(read("package.json"));
    const lock = JSON.parse(read("package-lock.json"));
    expect(pkg.version).toBe("1.1.0");
    expect(lock.version).toBe("1.1.0");
    expect(lock.packages?.[""]?.version).toBe("1.1.0");
  });
});
