/** @vitest-environment jsdom */
import React from "react";
import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import StagingResults from "../../src/ui/pages/StagingResults.jsx";

describe("StagingResults home filters", () => {
  it("filters import runs by hitlijst and uitzendjaar", () => {
    render(
      <StagingResults
        initialState={{
          runs: [
            {
              ir_run_id: "run-80s",
              ir_hitlijst: "Top 80s",
              ir_uitzendjaar: 2026,
              ir_status: "COMPLETED",
              ir_row_count: 80,
              ir_created_at: "2026-04-25T10:00:00Z"
            },
            {
              ir_run_id: "run-90s",
              ir_hitlijst: "Top 90s",
              ir_uitzendjaar: 2025,
              ir_status: "COMPLETED",
              ir_row_count: 90,
              ir_created_at: "2026-04-25T11:00:00Z"
            }
          ]
        }}
      />
    );

    fireEvent.change(screen.getByLabelText(/hitlijst/i), { target: { value: "80s" } });
    fireEvent.change(screen.getByLabelText(/uitzendjaar/i), { target: { value: "2026" } });

    expect(screen.getByText("run-80s")).toBeInTheDocument();
    expect(screen.queryByText("run-90s")).not.toBeInTheDocument();
    expect(screen.getByText(/filtered: 1/i)).toBeInTheDocument();
  });
});
