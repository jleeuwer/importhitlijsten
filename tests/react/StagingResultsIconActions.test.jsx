/** @vitest-environment jsdom */
import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import StagingResults from "../../src/ui/pages/StagingResults.jsx";

const runs = [
  {
    ir_run_id: "run-icons",
    ir_hitlijst: "Top Icons",
    ir_uitzendjaar: 2026,
    ir_status: "COMPLETED",
    ir_row_count: 10,
    total_count: 10,
    ok_count: 10,
    blocked_count: 0,
    duplicate_count: 0,
    skip_count: 0,
    discogs_link_count: 0,
    blocked_discogs_count: 0,
    exported_row_count: 0,
    run_processing_status: "ready_for_export",
    run_processing_label: "Klaar voor export",
    ir_created_at: "2026-04-25T10:00:00Z"
  }
];

describe("StagingResults icon actions", () => {
  it("uses compact icon buttons with accessible labels and tooltips", () => {
    render(<StagingResults initialState={{ runs }} />);

    const view = screen.getByRole("link", { name: /view staging voor top icons 2026/i });
    const edit = screen.getByRole("link", { name: /open edit voor top icons 2026/i });
    const metadata = screen.getByRole("button", { name: /metadata wijzigen voor top icons 2026/i });
    const remove = screen.getByRole("button", { name: /verwijder run top icons 2026/i });

    expect(view).toHaveAttribute("title", "View staging");
    expect(edit).toHaveAttribute("title", "Open Edit");
    expect(metadata).toHaveAttribute("title", "Metadata");
    expect(remove).toHaveAttribute("title", "Verwijder run");

    expect(view.querySelector(".bi-view-list")).toBeTruthy();
    expect(edit.querySelector(".bi-pencil")).toBeTruthy();
    expect(metadata.querySelector(".bi-list")).toBeTruthy();
    expect(remove.querySelector(".bi-trash2")).toBeTruthy();
  });
});
