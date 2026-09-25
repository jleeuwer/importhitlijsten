/** @vitest-environment jsdom */
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { buildDiscogsSelectionPayload, EditMain } from "../../src/ui/pages/EditPage.jsx";

function makeCtrl(overrides = {}) {
  return {
    hitlijst: "",
    setHitlijst: () => {},
    uitzendjaar: "",
    setUitzendjaar: () => {},
    runs: [],
    metadataOptions: { omroepen: [], perioden: [] },
    songTypes: [
      { st_song_type_key: 10, st_song_type: "S", st_song_type_desc: "Single versie", display_name: "Single versie" },
      { st_song_type_key: 20, st_song_type: "L", st_song_type_desc: "Live versie", display_name: "Live versie" }
    ],
    runId: "run-1",
    rows: [
      {
        hl_import_run_id: "run-1",
        hl_positie: 1,
        hl_artiest: "Raw Artist",
        hl_titel_song: "Raw Title",
        hl_jaar: 1991,
        fd_tag_title: "Smells Like Teen Spirit",
        as_correcte_artiest_spelling: "Nirvana",
        hl_discogs_link: "",
        hl_find_cmd: "",
        hl_artist_key: 101,
        hl_desired_song_type_key: 10,
        ...overrides
      }
    ],
    msg: null,
    err: null,
    busy: false,
    fdStatusByPos: { "1": { matchCount: 1, effective_title: "Smells Like Teen Spirit", source: "song_spelling" } },
    artistSpellingDone: true,
    patternPreview: [],
    normalizationPreview: null,
    encodingRepairPreview: null,
    yearEnrichmentPreview: null,
    exportStatus: null,
    exportStatusLoading: false,
    exportStatusError: null,
    visibleRowPositions: [],
    setVisibleRowPositions: () => {},
    setMsg: vi.fn(),
    setErr: vi.fn(),
    setBusy: vi.fn(),
    loadRuns: async () => {},
    selectRun: async () => {},
    refreshRows: vi.fn(async () => {}),
    saveRow: vi.fn(async () => {}),
    saveDesiredSongTypeForRow: vi.fn(async () => {}),
    decodeHtmlEntitiesForRun: async () => {},
    runArtistSpelling: async () => {},
    runPatternDelete: async () => {},
    runSongSpelling: async () => {},
    refreshFileDetailsStatus: async () => {},
    exportHitlijsten: async () => {},
    saveRunMetadata: async () => {},
    repairSuspectedTitleArtistSwaps: async () => {},
    forceSwapVisibleRows: async () => {},
    previewNormalizeVisibleRows: async () => {},
    normalizeVisibleRows: async () => {},
    previewEncodingRepairVisibleRows: async () => {},
    repairEncodingVisibleRows: async () => {},
    previewEnrichYearsVisibleRows: async () => {},
    enrichYearsVisibleRows: async () => {}
  };
}

describe("Edit Discogs selection flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("builds a master selection payload from a Discogs result", () => {
    expect(
      buildDiscogsSelectionPayload({
        id: 123,
        type: "master",
        title: "Nirvana - Smells Like Teen Spirit",
        year: 1991,
        discogsUrl: "https://www.discogs.com/master/123"
      })
    ).toEqual({
      discogs_master_id: 123,
      discogs_master_url: "https://www.discogs.com/master/123",
      discogs_master_title: "Smells Like Teen Spirit",
      discogs_master_artist: "Nirvana",
      discogs_master_year: 1991
    });
  });

  it("searches Discogs, shows results and stores the selected master", async () => {
    const ctrl = makeCtrl();
    const fetchMock = vi.fn(async (url, options = {}) => {
      const urlText = String(url);
      if (urlText.startsWith("/api/discogs/search")) {
        expect(urlText).toContain("artist=Nirvana");
        expect(urlText).toContain("title=Smells+Like+Teen+Spirit");
        expect(urlText).not.toContain("type=");
        return {
          ok: true,
          json: async () => ({
            results: [
              {
                id: 123,
                masterId: 123,
                type: "master",
                title: "Nirvana - Smells Like Teen Spirit",
                year: 1991,
                format: ["Single"],
                country: "Europe",
                discogsUrl: "https://www.discogs.com/master/123"
              },
              {
                id: 456,
                releaseId: 456,
                type: "release",
                title: "Nirvana - Smells Like Teen Spirit",
                year: 1992,
                format: ["Vinyl", "7\"", "Single"],
                country: "Netherlands",
                discogsUrl: "https://www.discogs.com/release/456"
              }
            ]
          })
        };
      }

      if (urlText === "/api/edit/staging/run-1/1/discogs") {
        expect(options.method).toBe("POST");
        expect(JSON.parse(options.body)).toMatchObject({
          discogs_master_id: 123,
          discogs_master_url: "https://www.discogs.com/master/123",
          discogs_master_title: "Smells Like Teen Spirit",
          discogs_master_artist: "Nirvana",
          discogs_master_year: 1991
        });
        return {
          ok: true,
          json: async () => ({ hl_discogs_link: "https://www.discogs.com/master/123" })
        };
      }

      throw new Error(`Unexpected fetch: ${urlText}`);
    });
    global.fetch = fetchMock;

    render(<EditMain ctrl={ctrl} />);

    fireEvent.click(screen.getByRole("button", { name: /zoek discogs/i }));

    const dialog = await screen.findByRole("dialog", { name: /Discogs zoeken/i });
    expect(within(dialog).getByLabelText(/^Artiest$/i)).toHaveValue("Nirvana");
    expect(within(dialog).getByLabelText(/^Titel$/i)).toHaveValue("Smells Like Teen Spirit");
    fireEvent.click(within(dialog).getByRole("button", { name: /zoek in discogs/i }));

    const resultTable = await within(dialog).findByRole("table");
    const headers = within(resultTable).getAllByRole("columnheader").map((header) => header.textContent?.trim());
    expect(headers).toEqual(["Type", "Artiest", "Titel", "Jaar", "Land", "Format", "Discogs", "Details", "Koppel"]);
    const resultRow = within(resultTable).getAllByText("Smells Like Teen Spirit")[0].closest("tr");
    expect(within(resultRow).getByText("Nirvana")).toBeInTheDocument();

    expect(within(resultRow).getByText("Master")).toBeInTheDocument();
    fireEvent.click(within(resultRow).getByRole("button", { name: /koppel/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/edit/staging/run-1/1/discogs",
        expect.objectContaining({ method: "POST" })
      );
      expect(ctrl.refreshRows).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: /Discogs zoeken/i })).not.toBeInTheDocument();
      expect(screen.getByLabelText(/discogs link voor positie 1/i)).toHaveValue("https://www.discogs.com/master/123");
    });
  });


  it("toont Discogs details met tracklist, markeert bekeken en koppelt vanuit details", async () => {
    const ctrl = makeCtrl();
    const fetchMock = vi.fn(async (url, options = {}) => {
      const urlText = String(url);
      if (urlText.startsWith("/api/discogs/search")) {
        return {
          ok: true,
          json: async () => ({
            results: [
              {
                id: 456,
                releaseId: 456,
                type: "release",
                title: "Nirvana - Smells Like Teen Spirit",
                year: 1991,
                format: ["Vinyl", "7\"", "Single"],
                country: "Europe",
                discogsUrl: "https://www.discogs.com/release/456"
              }
            ]
          })
        };
      }

      if (urlText === "/api/discogs/details/release/456") {
        return {
          ok: true,
          json: async () => ({
            detail: {
              id: 456,
              type: "release",
              title: "Smells Like Teen Spirit",
              artist: "Nirvana",
              year: 1991,
              country: "Europe",
              formats: ["Vinyl", "7\"", "Single"],
              catalogNumbers: ["DGCS 5"],
              discogsUrl: "https://www.discogs.com/release/456",
              tracklist: [
                { position: "A", title: "Smells Like Teen Spirit", duration: "5:01" },
                { position: "B", title: "Drain You", duration: "3:43" }
              ]
            }
          })
        };
      }

      if (urlText === "/api/edit/staging/run-1/1/discogs") {
        expect(options.method).toBe("POST");
        expect(JSON.parse(options.body)).toMatchObject({
          discogs_release_id: 456,
          discogs_release_url: "https://www.discogs.com/release/456",
          discogs_release_title: "Smells Like Teen Spirit",
          discogs_release_country: "Europe",
          discogs_release_year: 1991
        });
        return { ok: true, json: async () => ({ hl_discogs_link: "https://www.discogs.com/release/456" }) };
      }

      throw new Error(`Unexpected fetch: ${urlText}`);
    });
    global.fetch = fetchMock;

    render(<EditMain ctrl={ctrl} />);
    fireEvent.click(screen.getByRole("button", { name: /zoek discogs/i }));

    const dialog = await screen.findByRole("dialog", { name: /Discogs zoeken/i });
    fireEvent.click(within(dialog).getByRole("button", { name: /zoek in discogs/i }));
    const resultTable = await within(dialog).findByRole("table");
    const row = within(resultTable).getByText("Europe").closest("tr");
    fireEvent.click(within(row).getByRole("button", { name: /details/i }));

    expect(await within(dialog).findByText(/Discogs details — Release/i)).toBeInTheDocument();
    expect(within(dialog).getByText("DGCS 5")).toBeInTheDocument();
    expect(within(dialog).getByText("Drain You")).toBeInTheDocument();
    expect(within(dialog).queryByText(/Very Long Label/i)).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getAllByRole("button", { name: /terug naar resultaten/i })[0]);
    expect(within(dialog).getByText("Bekeken")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: /details/i }));
    expect(await within(dialog).findByText(/Discogs details — Release/i)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: /koppel deze entry/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/edit/staging/run-1/1/discogs",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("past Discogs filters client-side toe en reset ze zonder nieuwe API-call", async () => {
    const fetchMock = vi.fn(async (url) => ({
      ok: true,
      json: async () => ({
        results: [
          { id: 123, masterId: 123, type: "master", title: "Nirvana - Smells Like Teen Spirit", year: 1991, format: ["Single"], country: "Europe", discogsUrl: "https://www.discogs.com/master/123" },
          { id: 456, releaseId: 456, type: "release", title: "Nirvana - Smells Like Teen Spirit", year: 1992, format: ["Vinyl", "7\""], country: "Netherlands", discogsUrl: "https://www.discogs.com/release/456" }
        ]
      })
    }));
    global.fetch = fetchMock;

    render(<EditMain ctrl={makeCtrl()} />);
    fireEvent.click(screen.getByRole("button", { name: /zoek discogs/i }));

    const dialog = await screen.findByRole("dialog", { name: /Discogs zoeken/i });
    fireEvent.click(within(dialog).getByRole("button", { name: /zoek in discogs/i }));
    await waitFor(() => expect(within(dialog).getByText(/2 van 2 resultaat\/resultaten zichtbaar/i)).toBeInTheDocument());

    expect(within(dialog).getByLabelText(/^Type$/i)).toHaveValue("ALL");
    expect(within(dialog).queryByText(/^Label$/i)).not.toBeInTheDocument();
    expect(within(dialog).getAllByText("Master").length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText("Release").length).toBeGreaterThan(0);

    fireEvent.change(within(dialog).getByLabelText(/^Type$/i), { target: { value: "Release" } });
    expect(within(dialog).getByText(/1 van 2 resultaat\/resultaten zichtbaar/i)).toBeInTheDocument();
    const filteredTable = within(dialog).getByRole("table");
    expect(within(filteredTable).queryByText("Europe")).not.toBeInTheDocument();
    expect(within(filteredTable).getByText("Netherlands")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(within(dialog).getByRole("button", { name: /reset filters/i }));
    expect(within(dialog).getByText(/2 van 2 resultaat\/resultaten zichtbaar/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gebruikt aangepaste artiest en titel alleen voor de Discogs zoekopdracht", async () => {
    const ctrl = makeCtrl();
    const fetchMock = vi.fn(async (url) => {
      const urlText = String(url);
      if (urlText.startsWith("/api/discogs/search")) {
        expect(urlText).toContain("artist=Nirvana+%28US%29");
        expect(urlText).toContain("title=Teen+Spirit+Single");
        return { ok: true, json: async () => ({ results: [] }) };
      }
      throw new Error(`Unexpected fetch: ${urlText}`);
    });
    global.fetch = fetchMock;

    render(<EditMain ctrl={ctrl} />);
    expect(screen.getByLabelText(/discogs link voor positie 1/i)).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: /zoek discogs/i }));

    const dialog = await screen.findByRole("dialog", { name: /Discogs zoeken/i });
    fireEvent.change(within(dialog).getByLabelText(/^Artiest$/i), { target: { value: "Nirvana (US)" } });
    fireEvent.change(within(dialog).getByLabelText(/^Titel$/i), { target: { value: "Teen Spirit Single" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /zoek in discogs/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText(/discogs link voor positie 1/i)).toHaveValue("");
  });


  it("bewaart gewijzigde gewenste versie direct voordat Discogs refreshes kunnen optreden", async () => {
    const ctrl = makeCtrl({ hl_desired_song_type_key: 10 });
    const fetchMock = vi.fn(async (url, options = {}) => {
      const urlText = String(url);
      if (urlText.startsWith("/api/discogs/search")) {
        return {
          ok: true,
          json: async () => ({
            results: [
              {
                id: 123,
                masterId: 123,
                type: "master",
                title: "Nirvana - Smells Like Teen Spirit",
                year: 1991,
                format: ["Single"],
                country: "Europe",
                discogsUrl: "https://www.discogs.com/master/123"
              }
            ]
          })
        };
      }

      if (urlText === "/api/edit/staging/run-1/1/discogs") {
        return { ok: true, json: async () => ({ hl_discogs_link: "https://www.discogs.com/master/123" }) };
      }

      throw new Error(`Unexpected fetch: ${urlText}`);
    });
    global.fetch = fetchMock;

    render(<EditMain ctrl={ctrl} />);

    const desiredSelect = screen.getByLabelText(/Gewenste versie voor positie 1/i);
    fireEvent.change(desiredSelect, { target: { value: "20" } });

    await waitFor(() => {
      expect(ctrl.saveDesiredSongTypeForRow).toHaveBeenCalledWith(1, 20);
    });

    fireEvent.click(screen.getByRole("button", { name: /zoek discogs/i }));
    const dialog = await screen.findByRole("dialog", { name: /Discogs zoeken/i });
    fireEvent.click(within(dialog).getByRole("button", { name: /zoek in discogs/i }));
    const resultTable = await within(dialog).findByRole("table");
    const resultRow = within(resultTable).getAllByText("Smells Like Teen Spirit")[0].closest("tr");
    fireEvent.click(within(resultRow).getByRole("button", { name: /koppel/i }));

    await waitFor(() => {
      expect(ctrl.refreshRows).toHaveBeenCalled();
    });
    expect(ctrl.saveDesiredSongTypeForRow.mock.invocationCallOrder[0]).toBeLessThan(ctrl.refreshRows.mock.invocationCallOrder[0]);
  });

});
