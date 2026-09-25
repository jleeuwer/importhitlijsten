import { describe, expect, it, vi } from "vitest";

import {
  buildDuplicateImportSummary,
  getDuplicateImportSummary,
  markDuplicateImportRowsAsSkip,
  normalizeFilename
} from "../services/duplicateImportService.js";

describe("duplicate import prevention service", () => {
  it("normalizes physical filenames case-insensitively and slash-insensitively", () => {
    expect(normalizeFilename(" D:\\Music\\Queen\\Innuendo.mp3 ")).toBe("d:/music/queen/innuendo.mp3");
  });

  it("summarizes existing file_details and in-run duplicates", () => {
    const summary = buildDuplicateImportSummary([
      {
        hl_positie: 1,
        fd_file_name: "Queen - Innuendo.mp3",
        reason_code: null,
        existing_file_details_count: 0,
        in_run_filename_count: 1
      },
      {
        hl_positie: 2,
        fd_file_name: "Nirvana - Teen Spirit.mp3",
        reason_code: "DUPLICATE_EXISTING_FILE_DETAILS",
        existing_file_details_count: 1,
        in_run_filename_count: 1
      },
      {
        hl_positie: 3,
        fd_file_name: "a-ha - Train Of Thought.mp3",
        reason_code: "DUPLICATE_IN_IMPORT_RUN",
        existing_file_details_count: 0,
        in_run_filename_count: 2
      }
    ]);

    expect(summary).toMatchObject({
      duplicateCount: 2,
      existingFileDetailsDuplicateCount: 1,
      inRunDuplicateCount: 1,
      skippedCount: 0
    });
  });

  it("gets duplicate summary from the database client", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({
        rows: [
          { hl_positie: 5, fd_file_name: "song.mp3", reason_code: "DUPLICATE_EXISTING_FILE_DETAILS" }
        ]
      })
    };

    await expect(getDuplicateImportSummary(client, "run-1")).resolves.toMatchObject({
      duplicateCount: 1,
      existingFileDetailsDuplicateCount: 1
    });
    expect(client.query).toHaveBeenCalledTimes(1);
  });

  it("returns an empty summary instead of crashing when the 2G-D staging columns are missing", async () => {
    const client = {
      query: vi.fn().mockRejectedValue(Object.assign(new Error('column s.fd_file_name does not exist'), { code: '42703' }))
    };

    await expect(getDuplicateImportSummary(client, "run-1")).resolves.toMatchObject({
      duplicateCount: 0,
      existingFileDetailsDuplicateCount: 0,
      inRunDuplicateCount: 0,
      skippedCount: 0
    });
    expect(client.query).toHaveBeenCalledTimes(1);
  });

  it("marks all duplicate rows as Skip in one action", async () => {
    const client = {
      query: vi
        .fn()
        .mockResolvedValueOnce({
          rows: [
            { hl_positie: 2, fd_file_name: "existing.mp3", reason_code: "DUPLICATE_EXISTING_FILE_DETAILS" },
            { hl_positie: 3, fd_file_name: "scan.mp3", reason_code: "DUPLICATE_IN_IMPORT_RUN" },
            { hl_positie: 4, fd_file_name: "ok.mp3", reason_code: null }
          ]
        })
        .mockResolvedValueOnce({ rowCount: 2 })
    };

    const result = await markDuplicateImportRowsAsSkip(client, "run-1");

    expect(result).toMatchObject({
      ok: true,
      action: "Skip",
      updatedRows: 2,
      duplicateCount: 2,
      existingFileDetailsDuplicateCount: 1,
      inRunDuplicateCount: 1
    });
    expect(client.query.mock.calls[1][1]).toEqual(["run-1", [2, 3], "Skip"]);
  });
});
