/** @vitest-environment jsdom */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ImportPage from "../../src/ui/pages/ImportPage.jsx";

function candidate(id, name, metadata = {}) {
  return {
    uploadId: id,
    source: "DRAG_DROP",
    originalFileName: name,
    fileSize: 120,
    rowCount: 2,
    status: Object.values(metadata).filter(Boolean).length === 4 ? "READY" : "METADATA_INCOMPLETE",
    duplicateType: null,
    duplicateOverride: false,
    metadata,
    parseError: null,
    importError: null,
    importRunId: null
  };
}

const metadataOptions = {
  omroepen: [{ omroep_key: 1, omroep_naam: "NPO Radio 2" }],
  perioden: [{ periode_key: 5, periode_naam: "Jaarlijst" }]
};

describe("2H-AA drag-and-drop CSV import inbox", () => {
  beforeEach(() => {
    if (!HTMLElement.prototype.scrollIntoView) HTMLElement.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.stubGlobal("fetch", vi.fn(async (url, options = {}) => {
      if (String(url).includes("/metadata")) {
        const body = JSON.parse(options.body || "{}");
        const id = String(url).split("/").at(-2);
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, candidate: candidate(id, `${id}.csv`, body.metadata) })
        };
      }
      return { ok: true, status: 200, json: async () => ({ ok: true, candidates: [] }) };
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows dropzone while keeping the existing directory scan workflow", () => {
    render(<ImportPage initialState={{ metadataOptions, importCandidates: [] }} />);
    expect(screen.getByRole("button", { name: /csv-bestanden slepen of kiezen/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/directory met csv-bestanden/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /scannen \/ vernieuwen/i })).toBeInTheDocument();
  });

  it("keeps metadata separate when switching between candidates", async () => {
    const a = candidate("a", "a.csv");
    const b = candidate("b", "b.csv");
    render(<ImportPage initialState={{ metadataOptions, importCandidates: [a, b] }} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Selecteer" })[0]);
    const hitlijst = await screen.findByLabelText(/Hitlijst name/i);
    fireEvent.change(hitlijst, { target: { value: "Lijst A" } });

    fireEvent.click(screen.getAllByRole("button", { name: "Selecteer" })[1]);
    const hitlijstB = screen.getByLabelText(/Hitlijst name/i);
    expect(hitlijstB).toHaveValue("");
    fireEvent.change(hitlijstB, { target: { value: "Lijst B" } });

    fireEvent.click(screen.getAllByRole("button", { name: "Selecteer" })[0]);
    expect(screen.getByLabelText(/Hitlijst name/i)).toHaveValue("Lijst A");
  });

  it("auto-selects a single file-picker upload and focuses Hitlijst name", async () => {
    const created = candidate("one", "top2000.csv");
    globalThis.fetch.mockImplementationOnce(async () => ({
      ok: true,
      status: 201,
      json: async () => ({ ok: true, created: [created], candidates: [created] })
    }));

    render(<ImportPage initialState={{ metadataOptions, importCandidates: [] }} />);
    const input = screen.getByLabelText(/CSV-bestanden kiezen/i);
    fireEvent.change(input, { target: { files: [new File(["artiest,titel\nA,B"], "top2000.csv", { type: "text/csv" })] } });

    const candidatePanel = await screen.findByLabelText(/metadata tijdelijke importkandidaat/i);
    const field = within(candidatePanel).getByLabelText(/Hitlijst name/i);
    await waitFor(() => expect(field).toHaveFocus());
    expect(screen.getAllByText("top2000.csv").length).toBeGreaterThan(0);
  });

  it("requires explicit duplicate override before individual import is enabled", async () => {
    const duplicate = {
      ...candidate("dup", "dup.csv", { hl_hitlijst: "Top 2000", hl_uitzendjaar: 2026, omroep_key: 1, periode_key: 5 }),
      duplicateType: "EXACT_FILE"
    };
    render(<ImportPage initialState={{ metadataOptions, importCandidates: [duplicate] }} />);
    fireEvent.click(screen.getByRole("button", { name: "Selecteer" }));

    expect(screen.getByRole("button", { name: /Importeer deze lijst/i })).toBeDisabled();
    expect(screen.getAllByText(/Reeds geïmporteerd — hetzelfde bestand/i).length).toBeGreaterThan(0);
  });
});
