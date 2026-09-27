/** @vitest-environment jsdom */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import App from "../../src/ui/App.jsx";
import ImportPage from "../../src/ui/pages/ImportPage.jsx";
import { NAV_ITEMS } from "../../src/ui/nav/navConfig.js";

describe("Sprint 2G-F import/edit flow cleanup", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => {
        if (String(url).includes("/api/db-health")) {
          return { json: async () => ({ ok: true, latencyMs: 1 }) };
        }
        if (String(url).includes("/api/metadata-options")) {
          return { ok: true, status: 200, text: async () => JSON.stringify({ omroepen: [], perioden: [] }) };
        }
        return { ok: true, status: 200, json: async () => ({}), text: async () => "{}" };
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("removes the standalone Edit entry from the left navigation and nav config", async () => {
    expect(NAV_ITEMS.map((item) => item.key)).not.toContain("edit");

    render(<App initialState={{ page: "stagingResults", runs: [], dbHealth: { ok: true } }} />);

    const sidebar = screen.getByLabelText(/sidebar navigation/i);
    expect(sidebar).toHaveTextContent("Runs");
    expect(sidebar).toHaveTextContent("Import");
    expect(sidebar).toHaveTextContent("String patterns");
    expect(sidebar).not.toHaveTextContent(/^Edit$/i);
    expect(sidebar.querySelector('a[href="/edit"]')).not.toBeInTheDocument();
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith("/api/db-health"));
    await waitFor(() => expect(screen.getByText(/DB OK/i)).toBeInTheDocument());
  });

  it("removes obsolete aside instruction that sends users to bare Edit", async () => {
    render(<App initialState={{ page: "stagingResults", runs: [], dbHealth: { ok: true } }} />);

    expect(screen.queryByText(/Use Edit to run tools on a runId/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Kies een import-run/i)).toBeInTheDocument();
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith("/api/db-health"));
    await waitFor(() => expect(screen.getByText(/DB OK/i)).toBeInTheDocument());
  });

  it("hides generic Edit mode button before import success", () => {
    render(<ImportPage initialState={{ metadataOptions: { omroepen: [], perioden: [] } }} />);

    expect(screen.queryByRole("link", { name: /go to edit mode/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /bewerk deze import-run/i })).not.toBeInTheDocument();
  });

  it("shows contextual edit link after successful import with the new runId", () => {
    const runId = "11111111-1111-4111-8111-111111111111";
    render(
      <ImportPage
        initialState={{
          runId,
          summary: { errors: 0, message: "Import complete", totalRows: 1, inserted: 1 },
          rows: [],
          metadataOptions: { omroepen: [], perioden: [] }
        }}
      />
    );

    const editLink = screen.getByRole("link", { name: /bewerk deze import-run/i });
    expect(editLink).toHaveAttribute("href", `/edit?runId=${encodeURIComponent(runId)}`);
    expect(screen.queryByRole("link", { name: /go to edit mode/i })).not.toBeInTheDocument();
  });
});
