/** @vitest-environment jsdom */
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { EditAside } from "../../src/ui/pages/EditPage.jsx";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("Edit batch swap repair", () => {
  it("calls batch swap repair for the current run and surfaces the summary", async () => {
    const setMsg = vi.fn();
    const setErr = vi.fn();
    const setBusy = vi.fn();
    const repairSuspectedTitleArtistSwaps = vi.fn().mockResolvedValue({
      ok: true,
      runId: "run-2",
      scanned: 3,
      repaired: 2,
      skipped: 1,
      failed: 0
    });

    const ctrl = {
      runId: "run-2",
      rows: [],
      exportStatus: null,
      busy: false,
      setBusy,
      setErr,
      setMsg,
      refreshRows: vi.fn(),
      artistSpellingDone: true,
      decodeHtmlEntitiesForRun: async () => {},
      runArtistSpelling: async () => {},
      runPatternDelete: async () => {},
      runSongSpelling: async () => {},
      exportHitlijsten: async () => {},
      repairSuspectedTitleArtistSwaps
    };

    render(<EditAside ctrl={ctrl} />);

    fireEvent.click(screen.getByRole("button", { name: /Herstel titel\/artiest swap \(batch\)/i }));

    await waitFor(() => {
      expect(repairSuspectedTitleArtistSwaps).toHaveBeenCalledTimes(1);
    });
    expect(setBusy).toHaveBeenCalledWith(true);
    expect(setBusy).toHaveBeenLastCalledWith(false);
    expect(setErr).toHaveBeenCalledWith(null);
    expect(setMsg).toHaveBeenCalledWith(null);
  });
});
