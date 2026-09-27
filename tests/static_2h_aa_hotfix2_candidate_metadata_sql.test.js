import { describe, expect, it } from "vitest";
import fs from "node:fs";

describe("2H-AA Hotfix 2 metadata PATCH SQL regression", () => {
  it("uses one explicit varchar type for parameter $3 in both SQL contexts", () => {
    const source = fs.readFileSync("models/import_upload_candidates.js", "utf8");
    expect(source).toContain("iuc_status = $3::varchar(32)");
    expect(source).toContain("CASE WHEN $3::varchar(32) = 'READY'::varchar(32)");
    expect(source).not.toContain("iuc_status = $3,\n            iuc_import_error = CASE WHEN $3 = 'READY'");
  });
});
