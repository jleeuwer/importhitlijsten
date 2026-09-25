/** @vitest-environment jsdom */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import StagingResults from "../../src/ui/pages/StagingResults.jsx";

describe("StagingResults", () => {
  it("renders warning if no context", () => {
    render(<StagingResults initialState={{}} />);
    expect(screen.getByText(/Open/i)).toBeInTheDocument();
  });
});
