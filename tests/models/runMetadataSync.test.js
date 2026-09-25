import { describe, expect, it } from "vitest";
import { updateRunMetadataAndSyncExported } from "../../models/metadata.js";

function makeClient({ exportedRows = 0, runFound = true } = {}) {
  const calls = [];
  const client = {
    calls,
    async query(sql, params = []) {
      calls.push({ sql: String(sql), params });
      if (String(sql).includes("FROM public.omroepen")) return { rowCount: 1, rows: [{ ok: 1 }] };
      if (String(sql).includes("FROM public.hitlijst_perioden")) return { rowCount: 1, rows: [{ ok: 1 }] };
      if (String(sql).includes("FROM public.import_runs")) {
        return runFound
          ? { rowCount: 1, rows: [{ ir_run_id: "run-1", ir_hitlijst: "Top 80s", ir_uitzendjaar: 2026 }] }
          : { rowCount: 0, rows: [] };
      }
      if (String(sql).includes("UPDATE public.staging_hitlijsten")) return { rowCount: 80, rows: [] };
      if (String(sql).includes("SELECT COUNT(*)::int AS exported_row_count")) return { rowCount: 1, rows: [{ exported_row_count: exportedRows }] };
      if (String(sql).includes("UPDATE public.hitlijsten")) return { rowCount: exportedRows, rows: [] };
      return { rowCount: 0, rows: [] };
    }
  };
  return client;
}

describe("updateRunMetadataAndSyncExported", () => {
  it("updates staging and exported hitlijsten when the run was already exported", async () => {
    const client = makeClient({ exportedRows: 80 });

    const result = await updateRunMetadataAndSyncExported(client, "run-1", {
      omroep_key: 2,
      periode_key: 5,
      syncExportedHitlijsten: true
    });

    expect(result.stagingUpdated).toBe(80);
    expect(result.hitlijstenUpdated).toBe(80);
    expect(result.wasExported).toBe(true);
    expect(client.calls.some((c) => c.sql.includes("UPDATE public.hitlijsten"))).toBe(true);
  });

  it("only updates staging when the run has not been exported", async () => {
    const client = makeClient({ exportedRows: 0 });

    const result = await updateRunMetadataAndSyncExported(client, "run-1", {
      omroep_key: 2,
      periode_key: 5,
      syncExportedHitlijsten: true
    });

    expect(result.stagingUpdated).toBe(80);
    expect(result.hitlijstenUpdated).toBe(0);
    expect(result.wasExported).toBe(false);
    expect(client.calls.some((c) => c.sql.includes("UPDATE public.hitlijsten"))).toBe(false);
  });
});
