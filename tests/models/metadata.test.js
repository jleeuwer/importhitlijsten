import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();

vi.mock("../../config/db.js", () => ({
  pool: {
    query: queryMock
  }
}));

const { getMetadataOptions, updateRunMetadata } = await import("../../models/metadata.js");

beforeEach(() => {
  queryMock.mockReset();
});

describe("metadata options", () => {
  it("loads active omroepen and hitlijst perioden in one call", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ omroep_key: 1, omroep_code: "NPO_RADIO_2", omroep_naam: "NPO Radio 2" }] })
      .mockResolvedValueOnce({ rows: [{ periode_key: 10, periode_code: "80S", periode_naam: "Jaren 80" }] });

    const result = await getMetadataOptions();

    expect(result.omroepen[0].omroep_code).toBe("NPO_RADIO_2");
    expect(result.perioden[0].periode_code).toBe("80S");
    expect(queryMock.mock.calls[0][0]).toContain("FROM public.omroepen");
    expect(queryMock.mock.calls[1][0]).toContain("FROM public.hitlijst_perioden");
  });
});

describe("updateRunMetadata", () => {
  it("updates selected omroep and periode for all staging rows in a run", async () => {
    const client = { query: vi.fn().mockResolvedValue({ rowCount: 42 }) };

    const result = await updateRunMetadata(client, "run-123", { omroep_key: "2", periode_key: "7" });

    expect(result).toEqual({ updatedRows: 42, omroep_key: 2, periode_key: 7 });
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE public.staging_hitlijsten"),
      [2, 7, "run-123"]
    );
  });
});
