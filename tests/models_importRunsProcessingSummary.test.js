import { describe, expect, it, vi } from "vitest";

vi.mock("../config/db.js", () => ({
  pool: { query: vi.fn() }
}));

describe("import runs processing status", () => {
  it("marks exported, attention and ready runs from summary counts", async () => {
    const { enrichRunsWithProcessingStatus } = await import("../models/import_runs.js");
    const rows = enrichRunsWithProcessingStatus([
      { ir_run_id: "exported", total_count: 10, exported_row_count: 10 },
      { ir_run_id: "attention", total_count: 10, blocked_count: 1, duplicate_count: 0, exported_row_count: 0 },
      { ir_run_id: "duplicate", total_count: 10, blocked_count: 0, duplicate_count: 2, exported_row_count: 0 },
      { ir_run_id: "ready", total_count: 10, blocked_count: 0, duplicate_count: 0, skip_count: 3, exported_row_count: 0 }
    ]);

    expect(rows.find((r) => r.ir_run_id === "exported").run_processing_status).toBe("exported");
    expect(rows.find((r) => r.ir_run_id === "attention").run_processing_status).toBe("needs_attention");
    expect(rows.find((r) => r.ir_run_id === "duplicate").run_processing_status).toBe("needs_attention");
    expect(rows.find((r) => r.ir_run_id === "ready").run_processing_status).toBe("ready_for_export");
    expect(rows.find((r) => r.ir_run_id === "ready").skip_count).toBe(3);
  });
});
