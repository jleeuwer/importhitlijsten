import { describe, expect, it, vi } from "vitest";
import { updateImportUploadCandidateMetadata } from "../models/import_upload_candidates.js";

describe("2H-AA Hotfix 2 candidate metadata SQL typing", () => {
  it("casts the shared status parameter consistently when updating status and clearing import errors", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ iuc_upload_id: "candidate-1" }] });
    const client = { query };

    await updateImportUploadCandidateMetadata(
      "candidate-1",
      { metadata: { hl_hitlijst: "Top 2000", hl_uitzendjaar: 2026, omroep_key: 1, periode_key: 5 }, status: "READY" },
      client
    );

    expect(query).toHaveBeenCalledTimes(1);
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("iuc_status = $3::varchar(32)");
    expect(sql).toContain("$3::varchar(32) = 'READY'::varchar(32)");
    expect(params[2]).toBe("READY");
  });
});
