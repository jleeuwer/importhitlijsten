/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

describe("2H-AA BL-IMP-135 release implementation", () => {
  it("defines the persistent candidate schema, retention and Docker migration", () => {
    const sql = read("scripts/sql/20260927_sprint2h_aa_import_upload_candidates.sql");
    const runner = read("scripts/apply_sprint2h_aa_import_upload_candidates.sh");
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.import_upload_candidates/);
    expect(sql).toMatch(/iuc_metadata jsonb/);
    expect(sql).toMatch(/METADATA_INCOMPLETE/);
    expect(sql).toMatch(/READY/);
    expect(sql).toMatch(/IMPORTED/);
    expect(runner).toContain("POSTGRES_CONTAINER:-my-postgresdb");
    expect(runner).toContain("POSTGRES_DB:-musicdb");
  });

  it("exposes multi-file upload, candidate APIs and cleanup lifecycle", () => {
    const upload = read("middleware/upload.js");
    const routes = read("routes/indexroutes.js");
    const server = read("server.js");
    expect(upload).toContain('array("csvFiles", IMPORT_UPLOAD_MAX_BATCH_FILES)');
    expect(upload).toContain("25");
    expect(upload).toContain("50");
    expect(routes).toContain('router.post("/api/import-candidates"');
    expect(routes).toContain('router.patch("/api/import-candidates/:uploadId/metadata"');
    expect(routes).toContain('router.post("/api/import-candidates/import-ready"');
    expect(routes).toContain('router.delete("/api/import-candidates"');
    expect(server).toContain("cleanupExpiredImportCandidates");
    expect(server).toContain("scheduleImportCandidateCleanup");
  });

  it("keeps version 1.2.0 aligned with the documentation sprint and adds sprint scripts", () => {
    const pkg = JSON.parse(read("package.json"));
    const lock = JSON.parse(read("package-lock.json"));
    expect(pkg.version).toBe("1.2.0");
    expect(lock.version).toBe("1.2.0");
    expect(lock.packages[""].version).toBe("1.2.0");
    expect(pkg.scripts["test:sprint2h-aa"]).toContain("services_importUploadCandidateService.test.js");
    expect(pkg.scripts["db:migrate:sprint2h-aa"]).toContain("apply_sprint2h_aa_import_upload_candidates.sh");
  });

  it("documents all agreed limits and per-list metadata requirements", () => {
    const req = read("docs/requirements/REQUIREMENTS_2H_AA_BL_IMP_135.md");
    const tests = read("docs/testcases/FUNCTIONAL_TEST_CASES_2H_AA_DRAG_DROP_CSV_IMPORT.md");
    expect(req).toContain("50 CSV-bestanden");
    expect(req).toContain("25 MB");
    expect(req).toContain("7 dagen");
    expect(req).toContain("eigen, onafhankelijk metadata-concept");
    expect(tests).toContain("2H-AA-040");
  });
});
