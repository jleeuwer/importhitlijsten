/** @vitest-environment jsdom */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import StagingResults from "../../src/ui/pages/StagingResults.jsx";

const runs = [
  {
    ir_run_id: "run-attention",
    ir_hitlijst: "Top 80s",
    ir_uitzendjaar: 2026,
    ir_status: "COMPLETED",
    ir_row_count: 100,
    total_count: 100,
    ok_count: 85,
    blocked_count: 5,
    duplicate_count: 2,
    skip_count: 8,
    discogs_link_count: 7,
    blocked_discogs_count: 1,
    exported_row_count: 0,
    run_processing_status: "needs_attention",
    run_processing_label: "Aandacht nodig",
    ir_created_at: "2026-04-25T10:00:00Z"
  },
  {
    ir_run_id: "run-ready",
    ir_hitlijst: "Top 90s",
    ir_uitzendjaar: 2025,
    ir_status: "COMPLETED",
    ir_row_count: 90,
    total_count: 90,
    ok_count: 88,
    blocked_count: 0,
    duplicate_count: 0,
    skip_count: 2,
    discogs_link_count: 0,
    blocked_discogs_count: 0,
    exported_row_count: 0,
    run_processing_status: "ready_for_export",
    run_processing_label: "Klaar voor export",
    ir_created_at: "2026-04-25T11:00:00Z"
  },
  {
    ir_run_id: "run-exported",
    ir_hitlijst: "Top 00s",
    ir_uitzendjaar: 2024,
    ir_status: "COMPLETED",
    ir_row_count: 80,
    total_count: 80,
    ok_count: 80,
    blocked_count: 0,
    duplicate_count: 0,
    skip_count: 0,
    discogs_link_count: 0,
    blocked_discogs_count: 0,
    exported_row_count: 80,
    run_processing_status: "exported",
    run_processing_label: "Geëxporteerd",
    ir_created_at: "2026-04-25T12:00:00Z"
  }
];

describe("StagingResults processing overview", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ ok: true, stagingRowsDeleted: 100 })
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows run summary counts and filters by processing state", () => {
    render(<StagingResults initialState={{ runs }} />);

    expect(screen.getAllByText("Aandacht nodig").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Klaar voor export").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Geëxporteerd").length).toBeGreaterThan(0);
    expect(screen.getByText("run-attention")).toBeInTheDocument();
    expect(screen.getByText("run-ready")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/verwerking/i), { target: { value: "needs_attention" } });

    expect(screen.getByText("run-attention")).toBeInTheDocument();
    expect(screen.queryByText("run-ready")).not.toBeInTheDocument();
    expect(screen.queryByText("run-exported")).not.toBeInTheDocument();
  });

  it("deletes a non-exported run after confirmation", async () => {
    render(<StagingResults initialState={{ runs }} />);

    const deleteButtons = screen.getAllByRole("button", { name: /verwijder run/i });
    fireEvent.click(deleteButtons[0]);

    const dialog = screen.getByText(/weet je zeker dat je deze import-run wilt verwijderen/i).closest("div[role='dialog']") || screen.getByText(/import-run verwijderen/i).closest("div");
    expect(screen.getByText(/import-run verwijderen/i)).toBeInTheDocument();
    fireEvent.click(within(dialog || document.body).getByRole("button", { name: /^verwijder run$/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      "/api/import-runs/run-attention",
      expect.objectContaining({ method: "DELETE" })
    ));
    expect(await screen.findByText(/Run verwijderd/i)).toBeInTheDocument();
    expect(screen.queryByText("run-attention")).not.toBeInTheDocument();
  });

  it("disables delete for exported runs", () => {
    render(<StagingResults initialState={{ runs }} />);

    const deleteButtons = screen.getAllByRole("button", { name: /verwijder run/i });
    expect(deleteButtons[2]).toBeDisabled();
  });
});
