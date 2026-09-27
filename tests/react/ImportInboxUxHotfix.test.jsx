/** @vitest-environment jsdom */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ImportPage from "../../src/ui/pages/ImportPage.jsx";

function fileRow(index, overrides = {}) {
  const number = String(index).padStart(3, "0");
  return {
    fileName: `lijst-${number}.csv`,
    filePath: `/tmp/import/lijst-${number}.csv`,
    fileSize: 100 + index,
    fileModifiedAt: "2026-09-25T10:00:00.000Z",
    status: "NEW",
    matchType: "NEW",
    registry: null,
    errorMessage: null,
    ...overrides
  };
}

function state(files, overrides = {}) {
  return {
    metadataOptions: { omroepen: [], perioden: [] },
    directoryPath: "/tmp/import",
    showImported: false,
    directoryScan: {
      directoryPath: "/tmp/import",
      totalCsvFiles: files.length,
      visibleFiles: files.length,
      files
    },
    ...overrides
  };
}

describe("2H-Z Hotfix 1 import inbox UX", () => {
  beforeEach(() => {
    window.localStorage.clear();
    if (!HTMLElement.prototype.scrollIntoView) {
      HTMLElement.prototype.scrollIntoView = vi.fn();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("paginates scanned files with 25 rows by default", () => {
    const files = Array.from({ length: 30 }, (_, index) => fileRow(index + 1));
    render(<ImportPage initialState={state(files)} />);

    expect(screen.getByText("lijst-001.csv")).toBeInTheDocument();
    expect(screen.queryByText("lijst-026.csv")).not.toBeInTheDocument();
    expect(screen.getByText(/Pagina 1 van 2/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Volgende" }));

    expect(screen.getByText("lijst-026.csv")).toBeInTheDocument();
    expect(screen.getByText(/Pagina 2 van 2/i)).toBeInTheDocument();
  });

  it("toggles already imported files immediately without rescanning", () => {
    const files = [
      fileRow(1),
      fileRow(2, {
        status: "IMPORTED",
        matchType: "EXACT_FILE",
        registry: { ifr_file_name: "lijst-002.csv", ifr_imported_at: "2026-09-20T10:00:00.000Z" }
      })
    ];
    render(<ImportPage initialState={state(files)} />);

    expect(screen.queryByText("lijst-002.csv")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /toon ook geïmporteerd/i }));
    const importedStatus = screen.getByText(/Geïmporteerd — hetzelfde bestand/i);
    const importedRow = importedStatus.closest("tr");
    expect(importedRow).toBeTruthy();
    expect(within(importedRow).getAllByRole("cell")[0]).toHaveTextContent("lijst-002.csv");
  });

  it("focuses Hitlijst name after a scanned file is selected", async () => {
    const files = [fileRow(1)];
    render(<ImportPage initialState={state(files, { selectedFile: "lijst-001.csv" })} />);

    const hitlijstName = screen.getByLabelText(/Hitlijst name/i);
    await waitFor(() => expect(hitlijstName).toHaveFocus());
  });

  it("shows recent scan directories from local storage without typing a directory first", async () => {
    window.localStorage.setItem(
      "importhitlijst.recentImportDirectories",
      JSON.stringify(["/tmp/eerdere-scan", "/Volumes/Music/CSV"])
    );

    render(<ImportPage initialState={{ metadataOptions: { omroepen: [], perioden: [] } }} />);

    const recent = await screen.findByRole("link", { name: "/tmp/eerdere-scan" });
    expect(recent).toHaveAttribute("href", "/import?directory=%2Ftmp%2Feerdere-scan");
  });
});
