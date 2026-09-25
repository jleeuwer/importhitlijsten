import { describe, expect, it } from "vitest";
import {
  assertPreExportActionAllowed,
  buildPreExportActionBlockedMessage,
  isRunAlreadyExported
} from "../services/exportWorkflowGuardService.js";

describe("exportWorkflowGuardService", () => {
  it("detects exported runs from alreadyExported flag or existing exported rows", () => {
    expect(isRunAlreadyExported({ alreadyExported: true, existingRowsForTarget: 0 })).toBe(true);
    expect(isRunAlreadyExported({ alreadyExported: false, existingRowsForTarget: 2 })).toBe(true);
    expect(isRunAlreadyExported({ alreadyExported: false, existingRowsForTarget: 0 })).toBe(false);
  });

  it("allows pre-export actions when the run has not been exported", async () => {
    const status = await assertPreExportActionAllowed("run-1", {
      statusLoader: async () => ({ alreadyExported: false, existingRowsForTarget: 0 })
    });

    expect(status.existingRowsForTarget).toBe(0);
  });

  it("blocks pre-export actions after export with a clear post-export correction message", async () => {
    await expect(assertPreExportActionAllowed("run-1", {
      statusLoader: async () => ({
        alreadyExported: true,
        existingRowsForTarget: 42,
        hl_hitlijst: "Top 100",
        hl_uitzendjaar: 1985
      })
    })).rejects.toMatchObject({
      status: 409,
      code: "PRE_EXPORT_ACTION_BLOCKED_AFTER_EXPORT"
    });

    expect(buildPreExportActionBlockedMessage({
      alreadyExported: true,
      existingRowsForTarget: 42,
      hl_hitlijst: "Top 100",
      hl_uitzendjaar: 1985
    })).toMatch(/Gebruik Correctie na export/);
  });
});
