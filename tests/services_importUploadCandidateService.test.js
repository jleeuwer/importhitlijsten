/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  importHitlijstCsv: vi.fn(),
  findRegistryMatches: vi.fn(),
  createImportUploadCandidate: vi.fn(),
  deleteImportUploadCandidate: vi.fn(),
  getImportUploadCandidate: vi.fn(),
  listExpiredImportUploadCandidates: vi.fn(),
  listImportUploadCandidates: vi.fn(),
  listReadyImportUploadCandidates: vi.fn(),
  listTemporaryImportUploadCandidates: vi.fn(),
  markImportUploadCandidateError: vi.fn(),
  markImportUploadCandidateImported: vi.fn(),
  updateImportUploadCandidateDuplicate: vi.fn(),
  updateImportUploadCandidateMetadata: vi.fn(),
  updateImportUploadCandidateOverride: vi.fn()
}));

vi.mock("../controllers/importController.js", () => ({ importHitlijstCsv: mocks.importHitlijstCsv }));
vi.mock("../models/import_file_registry.js", () => ({ findRegistryMatches: mocks.findRegistryMatches }));
vi.mock("../models/import_upload_candidates.js", () => ({
  createImportUploadCandidate: mocks.createImportUploadCandidate,
  deleteImportUploadCandidate: mocks.deleteImportUploadCandidate,
  getImportUploadCandidate: mocks.getImportUploadCandidate,
  listExpiredImportUploadCandidates: mocks.listExpiredImportUploadCandidates,
  listImportUploadCandidates: mocks.listImportUploadCandidates,
  listReadyImportUploadCandidates: mocks.listReadyImportUploadCandidates,
  listTemporaryImportUploadCandidates: mocks.listTemporaryImportUploadCandidates,
  markImportUploadCandidateError: mocks.markImportUploadCandidateError,
  markImportUploadCandidateImported: mocks.markImportUploadCandidateImported,
  updateImportUploadCandidateDuplicate: mocks.updateImportUploadCandidateDuplicate,
  updateImportUploadCandidateMetadata: mocks.updateImportUploadCandidateMetadata,
  updateImportUploadCandidateOverride: mocks.updateImportUploadCandidateOverride
}));

import {
  deriveCandidateStatus,
  importAllReadyCandidates,
  normalizeCandidateMetadata,
  resolveCandidateStoragePath,
  resolveDuplicateType,
  validateCandidateMetadata
} from "../services/importUploadCandidateService.js";

function dbCandidate(id, overrides = {}) {
  return {
    iuc_upload_id: id,
    iuc_source: "DRAG_DROP",
    iuc_original_file_name: `${id}.csv`,
    iuc_storage_file_name: `${id}.csv`,
    iuc_file_size: 100,
    iuc_status: "READY",
    iuc_duplicate_type: null,
    iuc_duplicate_override: false,
    iuc_metadata: { hl_hitlijst: `Lijst ${id}`, hl_uitzendjaar: 2026, omroep_key: 1, periode_key: 2 },
    ...overrides
  };
}

describe("2H-AA import upload candidate service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps metadata candidate-specific and only marks complete metadata READY", () => {
    const incomplete = normalizeCandidateMetadata({ hl_hitlijst: "Top 2000", hl_uitzendjaar: "", omroep_key: "", periode_key: "" });
    expect(validateCandidateMetadata(incomplete).success).toBe(false);
    expect(deriveCandidateStatus({ currentStatus: "NEW", metadata: incomplete })).toBe("METADATA_INCOMPLETE");

    const complete = normalizeCandidateMetadata({ hl_hitlijst: "Top 2000", hl_uitzendjaar: 2026, omroep_key: 1, periode_key: 5 });
    expect(validateCandidateMetadata(complete).success).toBe(true);
    expect(deriveCandidateStatus({ currentStatus: "METADATA_INCOMPLETE", metadata: complete })).toBe("READY");
  });

  it("distinguishes exact physical files from same semantic list content", () => {
    expect(resolveDuplicateType({ fileMatch: { ifr_key: 1 }, listMatch: { ifr_key: 2 } })).toBe("EXACT_FILE");
    expect(resolveDuplicateType({ fileMatch: null, listMatch: { ifr_key: 2 } })).toBe("SAME_LIST_CONTENT");
    expect(resolveDuplicateType({ fileMatch: null, listMatch: null })).toBeNull();
  });

  it("rejects traversal-like storage names before temp cleanup/import", () => {
    expect(() => resolveCandidateStoragePath("../outside.csv")).toThrow(/Ongeldige tijdelijke bestandsnaam/i);
    expect(() => resolveCandidateStoragePath("subdir/file.csv")).toThrow(/Ongeldige tijdelijke bestandsnaam/i);
    expect(resolveCandidateStoragePath("safe-id.csv")).toMatch(/uploads[\\/]import-candidates[\\/]safe-id\.csv$/);
  });

  it("bulk import isolates success, import error and duplicate block per candidate", async () => {
    const a = dbCandidate("a");
    const b = dbCandidate("b");
    const c = dbCandidate("c", { iuc_duplicate_type: "SAME_LIST_CONTENT" });
    mocks.listReadyImportUploadCandidates.mockResolvedValue([a, b, c]);
    mocks.getImportUploadCandidate.mockImplementation(async (id) => ({ a, b, c }[id]));
    mocks.importHitlijstCsv.mockImplementation(async ({ originalFilename }) => {
      if (originalFilename === "b.csv") throw new Error("forced failure");
      return { alreadyImported: false, summary: { runId: `run-${originalFilename[0]}` }, rows: [] };
    });
    mocks.markImportUploadCandidateImported.mockImplementation(async (id, runId) => ({ ...({ a, b, c }[id]), iuc_status: "IMPORTED", iuc_storage_file_name: null, iuc_import_run_id: runId }));
    mocks.markImportUploadCandidateError.mockImplementation(async (id, message) => ({ ...({ a, b, c }[id]), iuc_status: "IMPORT_ERROR", iuc_import_error: message }));

    const result = await importAllReadyCandidates();

    expect(result.summary).toEqual({ imported: 1, blockedDuplicate: 1, importError: 1, total: 3 });
    expect(result.items.map((item) => item.outcome)).toEqual(["IMPORTED", "IMPORT_ERROR", "BLOCKED_DUPLICATE"]);
    expect(mocks.importHitlijstCsv).toHaveBeenCalledTimes(2);
  });
});
