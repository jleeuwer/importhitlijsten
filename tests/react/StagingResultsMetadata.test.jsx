/** @vitest-environment jsdom */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import StagingResults from "../../src/ui/pages/StagingResults.jsx";

const metadataOptions = {
  omroepen: [
    { omroep_key: 1, omroep_naam: "Onbekend / nog te bepalen" },
    { omroep_key: 2, omroep_naam: "NPO Radio 2" }
  ],
  perioden: [
    { periode_key: 1, periode_naam: "Onbekend" },
    { periode_key: 5, periode_naam: "Jaren 80" }
  ]
};

const runs = [
  {
    ir_run_id: "run-80s",
    ir_hitlijst: "Top 80s",
    ir_uitzendjaar: 2026,
    ir_status: "COMPLETED",
    ir_row_count: 80,
    ir_created_at: "2026-04-25T10:00:00Z",
    omroep_key: 2,
    omroep_naam: "NPO Radio 2",
    periode_key: 5,
    periode_naam: "Jaren 80",
    exported_row_count: 80
  },
  {
    ir_run_id: "run-90s",
    ir_hitlijst: "Top 90s",
    ir_uitzendjaar: 2025,
    ir_status: "COMPLETED",
    ir_row_count: 90,
    ir_created_at: "2026-04-25T11:00:00Z",
    omroep_key: 1,
    omroep_naam: "Onbekend / nog te bepalen",
    periode_key: 1,
    periode_naam: "Onbekend",
    exported_row_count: 0
  }
];

describe("StagingResults run metadata", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({
        ok: true,
        stagingUpdated: 80,
        hitlijstenUpdated: 80,
        exportedRowCount: 80,
        wasExported: true,
        omroep_key: 2,
        periode_key: 5
      })
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows omroep and periode columns and filters on both fields", () => {
    render(<StagingResults initialState={{ runs, metadataOptions }} />);

    expect(screen.getAllByText("NPO Radio 2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Jaren 80").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText(/omroep/i), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText(/periode/i), { target: { value: "5" } });

    expect(screen.getByText("run-80s")).toBeInTheDocument();
    expect(screen.queryByText("run-90s")).not.toBeInTheDocument();
  });

  it("saves metadata from the Runs metadata modal and reports exported synchronization", async () => {
    render(<StagingResults initialState={{ runs, metadataOptions }} />);

    fireEvent.click(screen.getAllByRole("button", { name: /metadata/i })[0]);
    expect(screen.getByText(/deze run is al geëxporteerd/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /metadata opslaan/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      "/api/import-runs/run-80s/metadata",
      expect.objectContaining({ method: "POST" })
    ));
    expect(await screen.findByText(/Hitlijsten bijgewerkt: 80/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: /runmetadata wijzigen/i })).not.toBeInTheDocument();
    });
  });
});
