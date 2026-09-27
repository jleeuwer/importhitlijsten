/** @vitest-environment jsdom */
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import StagingDuplicateReview from "../../src/ui/components/StagingDuplicateReview.jsx";

const review = {
  ok: true,
  runId: "11111111-1111-4111-8111-111111111111",
  groupCount: 1,
  matchedRowCount: 2,
  duplicateRowCount: 1,
  suggestedDeleteKeys: [102],
  groups: [{
    groupId: "abc123",
    displayArtist: "Artist A",
    displayTitle: "Song X",
    rowCount: 2,
    recommendedKeepKey: 101,
    suggestedDeleteKeys: [102],
    rows: [
      { sh_key: 101, hl_positie: 1, hl_artiest: "Artist A", hl_titel_song: "Song X", fd_action: "Keep" },
      { sh_key: 102, hl_positie: 77, hl_artiest: "Artist A", hl_titel_song: "Song X", fd_action: "Keep" }
    ]
  }]
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BL-IMP-136 duplicate review UI", () => {
  it("scans, preselects duplicate extras and physically deletes only after confirmation", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, options = {}) => {
      const value = String(url);
      if (value.endsWith("/staging-duplicates") && (!options.method || options.method === "GET")) {
        return new Response(JSON.stringify(review), { status: 200 });
      }
      if (value.endsWith("/staging-duplicates/delete")) {
        return new Response(JSON.stringify({ ok: true, deletedRows: 1, auditedRows: 1 }), { status: 200 });
      }
      throw new Error(`Unexpected fetch: ${value}`);
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const refreshRows = vi.fn().mockResolvedValue(undefined);
    const setMsg = vi.fn();

    render(
      <StagingDuplicateReview
        runId="11111111-1111-4111-8111-111111111111"
        refreshRows={refreshRows}
        setMsg={setMsg}
        setErr={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /zoek dubbele rijen/i }));
    expect(await screen.findByText(/dubbele rijen controleren/i)).toBeInTheDocument();
    expect(screen.getByText(/2 rijen in deze duplicategroep/i)).toBeInTheDocument();

    const row102 = screen.getByRole("checkbox", { name: /stagingregel 102/i });
    expect(row102).toBeChecked();
    const duplicateRow = row102.closest("tr");
    expect(duplicateRow).toBeTruthy();
    expect(within(duplicateRow).getByText("Artist A")).toBeInTheDocument();
    expect(within(duplicateRow).getByText("Song X")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /fysiek verwijderen/i }));

    await waitFor(() => expect(window.confirm).toHaveBeenCalled());
    await waitFor(() => expect(refreshRows).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/staging-duplicates\/delete$/),
      expect.objectContaining({ method: "POST" })
    );
    expect(setMsg).toHaveBeenCalledWith(expect.stringMatching(/Fysiek verwijderd: 1/i));
  });
});
