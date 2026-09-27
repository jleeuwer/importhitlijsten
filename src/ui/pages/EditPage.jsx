// src/ui/pages/EditPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Badge, Button, Form, Modal, Spinner, Table } from "react-bootstrap";
import { detectEncodingDamage } from "../../../utils/textFixes.js";
import StagingDuplicateReview from "../components/StagingDuplicateReview.jsx";
import {
  applyDiscogsFilters,
  buildDiscogsFilterOptions,
  createEmptyDiscogsFilters,
  extractDiscogsFormats,
  getDiscogsResultCountry,
  getDiscogsResultUrl,
  getDiscogsResultYear,
  normalizeDiscogsType
} from "../utils/discogsResultFilters.js";
import {
  EDIT_WORKFLOW_STEPS,
  getEditWorkflowPolicy
} from "../utils/editWorkflowPolicy.js";

export function normalizeExportStatusPayload(data = {}) {
  return {
    missingLinks: Number(data.missingLinks ?? 0),
    missingFdTagTitle: Number(data.missingFdTagTitle ?? 0),
    missingHlArtistKey: Number(data.missingHlArtistKey ?? 0),
    multipleLinks: Number(data.multipleLinks ?? 0),
    existingRowsForTarget: Number(data.existingRowsForTarget ?? data.exportedRowCount ?? 0),
    alreadyExported: data.alreadyExported === true || Number(data.existingRowsForTarget ?? data.exportedRowCount ?? 0) > 0,
    duplicateExportBlocked: data.duplicateExportBlocked === true || data.alreadyExported === true || Number(data.existingRowsForTarget ?? data.exportedRowCount ?? 0) > 0,
    hl_hitlijst: data.hl_hitlijst ?? null,
    hl_uitzendjaar: data.hl_uitzendjaar ?? null,
    issuesPreview: Array.isArray(data.issuesPreview) ? data.issuesPreview : []
  };
}

export function useEditController() {
  const [hitlijst, setHitlijst] = useState("");
  const [uitzendjaar, setUitzendjaar] = useState("");

  const [runs, setRuns] = useState([]);
  const [metadataOptions, setMetadataOptions] = useState({ omroepen: [], perioden: [] });
  const [songTypes, setSongTypes] = useState([]);
  const [runId, setRunId] = useState("");

  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const [fdStatusByPos, setFdStatusByPos] = useState({});
  const [artistSpellingDone, setArtistSpellingDone] = useState(false);
  const [patternPreview, setPatternPreview] = useState([]);
  const [patternSuggestions, setPatternSuggestions] = useState(null);
  const [patternSuggestionsPreview, setPatternSuggestionsPreview] = useState(null);
  const [patternSuggestionsResult, setPatternSuggestionsResult] = useState(null);
  const [patternSuggestionsLoading, setPatternSuggestionsLoading] = useState(false);
  const [patternSuggestionsModalVisible, setPatternSuggestionsModalVisible] = useState(false);
  const [normalizationPreview, setNormalizationPreview] = useState(null);
  const [encodingRepairPreview, setEncodingRepairPreview] = useState(null);
  const [yearEnrichmentPreview, setYearEnrichmentPreview] = useState(null);
  const [yearEnrichmentPreviewVisible, setYearEnrichmentPreviewVisible] = useState(false);

  const [exportStatus, setExportStatus] = useState(null);
  const [exportStatusLoading, setExportStatusLoading] = useState(false);
  const [exportStatusError, setExportStatusError] = useState(null);
  const [blockedDiscogsExportSummary, setBlockedDiscogsExportSummary] = useState({ exportableCount: 0 });
  const [blockedDiscogsExportLoading, setBlockedDiscogsExportLoading] = useState(false);
  const [blockedDiscogsExportError, setBlockedDiscogsExportError] = useState(null);
  const [duplicateImportSummary, setDuplicateImportSummary] = useState({ duplicateCount: 0, existingFileDetailsDuplicateCount: 0, inRunDuplicateCount: 0, skippedCount: 0 });
  const [duplicateImportLoading, setDuplicateImportLoading] = useState(false);
  const [duplicateImportError, setDuplicateImportError] = useState(null);
  const [visibleRowPositions, setVisibleRowPositions] = useState([]);
  const latestRunIdRef = useRef("");
  const exportStatusRequestRef = useRef(0);

  function debugEdit(event, extra = {}) {
    const payload = {
      event,
      runId: latestRunIdRef.current || runId || "",
      ts: new Date().toISOString(),
      ...extra
    };
    try {
      console.info("[importhitlijst:edit-debug]", payload);
    } catch {
      // ignore console issues
    }
  }

  async function fetchJsonNoStore(url, options = {}) {
    const startedAt = performance.now();
    debugEdit("fetch:start", { url, method: options.method || "GET" });

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(options.headers || {})
      },
      ...options
    });

    debugEdit("fetch:response", {
      url,
      status: response.status,
      ok: response.ok,
      durationMs: Math.round(performance.now() - startedAt)
    });

    if (response.status === 304) {
      debugEdit("fetch:not-modified", { url });
      return { __notModified: true };
    }

    const text = await response.text();
    if (!response.ok) {
      debugEdit("fetch:error-response", {
        url,
        status: response.status,
        bodyPreview: String(text || "").slice(0, 200)
      });
      throw new Error(text || `HTTP ${response.status}`);
    }

    if (!text) {
      debugEdit("fetch:empty-json", { url });
      return {};
    }

    try {
      const parsed = JSON.parse(text);
      debugEdit("fetch:parsed", {
        url,
        keys: parsed && typeof parsed === "object" ? Object.keys(parsed).slice(0, 12) : [],
        durationMs: Math.round(performance.now() - startedAt)
      });
      return parsed;
    } catch (error) {
      debugEdit("fetch:invalid-json", {
        url,
        error: error.message,
        bodyPreview: String(text).slice(0, 200)
      });
      throw new Error(`Invalid JSON response from ${url}: ${error.message}`);
    }
  }

  async function loadMetadataOptions() {
    const data = await fetchJsonNoStore("/api/metadata-options");
    if (!data.__notModified) setMetadataOptions(data || { omroepen: [], perioden: [] });
    return data;
  }

  async function loadSongTypes() {
    const data = await fetchJsonNoStore("/api/song-types");
    if (!data.__notModified) setSongTypes(Array.isArray(data.songTypes) ? data.songTypes : []);
    return data;
  }

  useEffect(() => {
    loadMetadataOptions().catch(() => {});
    loadSongTypes().catch(() => {});
  }, []);

  async function loadRuns() {
    const qs = new URLSearchParams();
    if (hitlijst) qs.set("hl_hitlijst", hitlijst);
    if (uitzendjaar) qs.set("hl_uitzendjaar", uitzendjaar);

    const data = await fetchJsonNoStore(`/api/import-runs?${qs.toString()}`);
    if (data.__notModified) return runs;
    setRuns(data.runs || []);
  }

  async function loadRows(selectedRunId) {
    debugEdit("loadRows:start", { selectedRunId });
    const data = await fetchJsonNoStore(`/api/staging-by-run?runId=${encodeURIComponent(selectedRunId)}`);
    if (data.__notModified) {
      debugEdit("loadRows:not-modified", { selectedRunId, currentRowCount: rows.length });
      return rows;
    }
    const loaded = data.rows || [];
    setRows(loaded);
    debugEdit("loadRows:done", { selectedRunId, rowCount: loaded.length });

    // heuristic: if keys exist, assume ArtistSpelling has been run before
    setArtistSpellingDone(loaded.some((x) => x.hl_artist_key != null));

    return loaded;
  }

  async function loadFileDetailsStatus(selectedRunId) {
    debugEdit("loadFileDetailsStatus:start", { selectedRunId });
    const data = await fetchJsonNoStore(`/api/run-filedetails-status?runId=${encodeURIComponent(selectedRunId)}`);
    if (data.__notModified) {
      debugEdit("loadFileDetailsStatus:not-modified", { selectedRunId, currentStatusCount: Object.keys(fdStatusByPos).length });
      return fdStatusByPos;
    }

    const map = {};
    for (const s of data.statuses || []) {
      map[String(s.hl_positie)] = {
        matchCount: Number(s.matchCount ?? 0),
        effective_title: String(s.effective_title ?? ""),
        source: String(s.source ?? "")
      };
    }
    setFdStatusByPos(map);
    debugEdit("loadFileDetailsStatus:done", { selectedRunId, statusCount: Object.keys(map).length });
  }

  async function loadExportStatus(selectedRunId) {
    debugEdit("loadExportStatus:start", { selectedRunId });
    const requestId = ++exportStatusRequestRef.current;
    setExportStatusLoading(true);
    setExportStatusError(null);

    try {
      const data = await fetchJsonNoStore(
        `/api/run-export-hitlijsten-status?runId=${encodeURIComponent(selectedRunId)}`
      );

      if (data.__notModified) {
        debugEdit("loadExportStatus:not-modified", { selectedRunId });
        return exportStatus;
      }

      if (requestId !== exportStatusRequestRef.current || latestRunIdRef.current !== selectedRunId) {
        return null;
      }

      const nextStatus = normalizeExportStatusPayload(data);

      setExportStatus(nextStatus);
      debugEdit("loadExportStatus:done", { selectedRunId, ...nextStatus, issuesPreviewCount: nextStatus.issuesPreview.length });
      return nextStatus;
    } catch (error) {
      if (requestId === exportStatusRequestRef.current && latestRunIdRef.current === selectedRunId) {
        setExportStatusError(error?.message || String(error));
      }
      debugEdit("loadExportStatus:error", { selectedRunId, error: error?.message || String(error) });
      throw error;
    } finally {
      if (requestId === exportStatusRequestRef.current && latestRunIdRef.current === selectedRunId) {
        setExportStatusLoading(false);
      }
    }
  }

  async function loadBlockedDiscogsExportSummary(selectedRunId) {
    if (!selectedRunId) {
      setBlockedDiscogsExportSummary({ exportableCount: 0 });
      return { exportableCount: 0 };
    }

    setBlockedDiscogsExportLoading(true);
    setBlockedDiscogsExportError(null);

    try {
      const data = await fetchJsonNoStore(
        `/api/edit/run/${encodeURIComponent(selectedRunId)}/blocked-discogs-export-summary`
      );
      if (data.__notModified) return blockedDiscogsExportSummary;
      const summary = { exportableCount: Number(data.exportableCount ?? 0) };
      setBlockedDiscogsExportSummary(summary);
      return summary;
    } catch (error) {
      setBlockedDiscogsExportError(error?.message || String(error));
      throw error;
    } finally {
      setBlockedDiscogsExportLoading(false);
    }
  }


  async function loadDuplicateImportSummary(selectedRunId) {
    if (!selectedRunId) {
      const empty = { duplicateCount: 0, existingFileDetailsDuplicateCount: 0, inRunDuplicateCount: 0, skippedCount: 0, duplicateRows: [] };
      setDuplicateImportSummary(empty);
      return empty;
    }

    setDuplicateImportLoading(true);
    setDuplicateImportError(null);

    try {
      const data = await fetchJsonNoStore(
        `/api/edit/run/${encodeURIComponent(selectedRunId)}/duplicate-import-summary`
      );
      if (data.__notModified) return duplicateImportSummary;
      const summary = {
        duplicateCount: Number(data.duplicateCount ?? 0),
        existingFileDetailsDuplicateCount: Number(data.existingFileDetailsDuplicateCount ?? 0),
        inRunDuplicateCount: Number(data.inRunDuplicateCount ?? 0),
        skippedCount: Number(data.skippedCount ?? 0),
        duplicateRows: Array.isArray(data.duplicateRows) ? data.duplicateRows : []
      };
      setDuplicateImportSummary(summary);
      return summary;
    } catch (error) {
      setDuplicateImportError(error?.message || String(error));
      throw error;
    } finally {
      setDuplicateImportLoading(false);
    }
  }

  async function markDuplicateRowsAsSkip() {
    if (!runId) return null;

    const r = await fetch(`/api/edit/run/${encodeURIComponent(runId)}/duplicates/skip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    if (!r.ok) throw new Error(await r.text());

    const data = await r.json();
    setMsg(`Duplicates op Skip gezet: ${data.updatedRows ?? 0} rij(en).`);
    await refreshRows();
    return data;
  }

  async function refreshFileDetailsStatus() {
    if (!runId) return;
    await loadFileDetailsStatus(runId);
  }

  async function selectRun(newRunId) {
    debugEdit("selectRun:start", { newRunId });
    latestRunIdRef.current = newRunId || "";
    setRunId(newRunId);
    setErr(null);
    setMsg(null);

    setPatternPreview([]);
    setNormalizationPreview(null);
    setEncodingRepairPreview(null);
    setYearEnrichmentPreview(null);
    setYearEnrichmentPreviewVisible(false);
    setFdStatusByPos({});
    setArtistSpellingDone(false);
    setExportStatus(null);
    setExportStatusError(null);
    setBlockedDiscogsExportSummary({ exportableCount: 0 });
    setBlockedDiscogsExportError(null);
    setDuplicateImportSummary({ duplicateCount: 0, existingFileDetailsDuplicateCount: 0, inRunDuplicateCount: 0, skippedCount: 0, duplicateRows: [] });
    setDuplicateImportError(null);
    setBlockedDiscogsExportLoading(Boolean(newRunId));
    setExportStatusLoading(Boolean(newRunId));

    if (!newRunId) {
      setRows([]);
      return;
    }

    await Promise.all([loadRows(newRunId), loadFileDetailsStatus(newRunId), loadBlockedDiscogsExportSummary(newRunId), loadDuplicateImportSummary(newRunId)]);
    debugEdit("selectRun:primary-data-loaded", { newRunId });

    loadExportStatus(newRunId)
      .then(() => {
        if (latestRunIdRef.current === newRunId) {
          setMsg((current) => current || "Run loaded. Export status refreshed.");
        }
        debugEdit("selectRun:export-status-loaded", { newRunId });
      })
      .catch((error) => {
        if (latestRunIdRef.current === newRunId) {
          setErr((current) => current || `Run loaded, but export status is still unavailable: ${error?.message || String(error)}`);
        }
        debugEdit("selectRun:export-status-error", { newRunId, error: error?.message || String(error) });
      });

    setMsg("Run loaded. Export status is loading in the background.");
    debugEdit("selectRun:done", { newRunId });
  }

  async function refreshRows() {
    if (!runId) return;
    debugEdit("refreshRows:start", { runId });
    latestRunIdRef.current = runId;

    await Promise.all([loadRows(runId), loadFileDetailsStatus(runId), loadBlockedDiscogsExportSummary(runId), loadDuplicateImportSummary(runId)]);

    debugEdit("refreshRows:primary-data-loaded", { runId });

    loadExportStatus(runId).catch((error) => {
      if (latestRunIdRef.current === runId) {
        setErr((current) => current || `Rows refreshed, but export status is still unavailable: ${error?.message || String(error)}`);
      }
      debugEdit("refreshRows:export-status-error", { runId, error: error?.message || String(error) });
    });

    setMsg("Rows refreshed. Export status is loading in the background.");
    debugEdit("refreshRows:done", { runId });
  }

  async function saveRow(hl_positie, patch) {
    const r = await fetch("/api/staging-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId, hl_positie, patch })
    });
    if (!r.ok) throw new Error(await r.text());
  }

  async function saveDesiredSongTypeForRow(hl_positie, value) {
    const normalizedValue = value === "" || value == null ? null : Number(value);
    if (normalizedValue != null && !Number.isInteger(normalizedValue)) {
      throw new Error("Ongeldige song type sleutel voor gewenste versie.");
    }

    await saveRow(hl_positie, { hl_desired_song_type_key: normalizedValue });

    setRows((currentRows) =>
      currentRows.map((currentRow) =>
        Number(currentRow.hl_positie) === Number(hl_positie)
          ? { ...currentRow, hl_desired_song_type_key: normalizedValue }
          : currentRow
      )
    );

    return normalizedValue;
  }

  async function decodeHtmlEntitiesForRun() {
    if (!runId) return;

    const r = await fetch("/api/run-decode-html", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId })
    });
    if (!r.ok) throw new Error(await r.text());

    const data = await r.json();
    setMsg(`Decoded HTML entities in ${data.updatedRows ?? 0} row(s).`);

    await refreshRows();
  }

  async function runArtistSpelling() {
    if (!runId) return;

    const r = await fetch("/api/run-artistspelling", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId })
    });
    if (!r.ok) throw new Error(await r.text());

    const data = await r.json();
    const s = data.stats || {};
    setMsg(
      `ArtistSpelling done. Distinct artists: ${s.distinctArtists ?? 0}, found: ${s.foundInSpelling ?? 0}, ` +
        `spellings inserted: ${s.insertedSpellings ?? 0}, staging rows updated: ${s.updatedStagingRows ?? 0}.`
    );

    setArtistSpellingDone(true);
    await refreshRows();
  }

  async function runPatternDelete(opts = {}) {
    if (!runId) return;

    const dryRun = opts?.dryRun === true;

    const r = await fetch("/api/run-pattern-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId, dryRun, previewLimit: 20 })
    });
    if (!r.ok) throw new Error(await r.text());

    const data = await r.json();
    const s = data.stats || {};

    if (dryRun) {
      setPatternPreview(data.preview || []);
      setMsg(
        `PatternDelete dry-run: patterns=${s.patterns ?? 0}, rows=${s.totalRows ?? 0}, would update=${s.wouldUpdateRows ?? 0}.`
      );
      return;
    }

    setPatternPreview([]);
    setMsg(
      `PatternDelete done. Patterns=${s.patterns ?? 0}, rows checked=${s.totalRows ?? 0}, rows updated=${s.updatedRows ?? 0}.`
    );

    await refreshRows();
  }


  async function openPatternSuggestions() {
    if (!runId) return;
    setPatternSuggestionsLoading(true);
    setPatternSuggestionsPreview(null);
    setPatternSuggestionsResult(null);
    setPatternSuggestionsModalVisible(true);
    try {
      const r = await fetch(`/api/edit/runs/${encodeURIComponent(runId)}/pattern-suggestions`, {
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setPatternSuggestions(data);
      const s = data.summary || {};
      setMsg(`Pattern suggesties: ${s.candidateGroups ?? 0} groep(en), ${s.newVariants ?? 0} nieuwe concrete variant(en).`);
    } finally {
      setPatternSuggestionsLoading(false);
    }
  }

  async function previewPatternSuggestions(patterns) {
    if (!runId || !patterns?.length) return;
    const r = await fetch(`/api/edit/runs/${encodeURIComponent(runId)}/pattern-suggestions/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ patterns })
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    setPatternSuggestionsPreview(data);
    setPatternSuggestionsResult(null);
  }

  async function addPatternSuggestions(patterns) {
    if (!runId || !patterns?.length) return;
    const r = await fetch(`/api/edit/runs/${encodeURIComponent(runId)}/pattern-suggestions/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ patterns })
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    setPatternSuggestionsResult({ ...data, target: "remove" });
    setMsg(`Verwijderbare String Patterns bijgewerkt: ${data.inserted?.length ?? 0} toegevoegd, ${data.skippedExisting?.length ?? 0} bestond al, ${data.skippedKeep?.length ?? 0} overgeslagen als titelonderdeel.`);
    const refresh = await fetch(`/api/edit/runs/${encodeURIComponent(runId)}/pattern-suggestions`, {
      cache: "no-store",
      headers: { Accept: "application/json" }
    });
    if (refresh.ok) setPatternSuggestions(await refresh.json());
  }

  async function addKeepPatternSuggestions(patterns) {
    if (!runId || !patterns?.length) return;
    const r = await fetch(`/api/edit/runs/${encodeURIComponent(runId)}/pattern-suggestions/add-keep`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ patterns })
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    setPatternSuggestionsResult({ ...data, target: "keep" });
    setMsg(`Niet-verwijderbare titelpatronen bijgewerkt: ${data.inserted?.length ?? 0} toegevoegd, ${data.skippedExisting?.length ?? 0} bestond al.`);
    const refresh = await fetch(`/api/edit/runs/${encodeURIComponent(runId)}/pattern-suggestions`, {
      cache: "no-store",
      headers: { Accept: "application/json" }
    });
    if (refresh.ok) setPatternSuggestions(await refresh.json());
  }

  async function runSongSpelling() {
    if (!runId) return;

    const r = await fetch("/api/run-songspelling", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId })
    });
    if (!r.ok) throw new Error(await r.text());

    const data = await r.json();
    const s = data.stats || {};
    setMsg(
      `SongSpelling done. Rows=${s.totalRows ?? 0}, song_spelling=${s.matchedSongSpelling ?? 0}, ` +
        `file_details=${s.matchedFileDetails ?? 0}, fallback=${s.defaultedToTitle ?? 0}, updated=${s.updated ?? 0}.`
    );

    await refreshRows();
  }


  async function repairSuspectedTitleArtistSwaps() {
    if (!runId) return { repaired: 0, skipped: 0, scanned: 0 };

    const r = await fetch(`/api/edit/run/${encodeURIComponent(runId)}/repair-title-artist-swaps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();

    setMsg(
      `Swap repair batch completed. Scanned=${data.scanned ?? 0}, repaired=${data.repaired ?? 0}, skipped=${data.skipped ?? 0}, failed=${data.failed ?? 0}.`
    );

    await refreshRows();
    return data;
  }

  async function forceSwapVisibleRows(hlPosities) {
    if (!runId) return { repaired: 0, skipped: 0, scanned: 0, requested: 0 };

    const safePositions = Array.from(
      new Set((Array.isArray(hlPosities) ? hlPosities : []).map((value) => Number(value)).filter((value) => Number.isInteger(value)))
    );

    const r = await fetch(`/api/edit/run/${encodeURIComponent(runId)}/force-title-artist-swaps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hlPosities: safePositions })
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();

    setMsg(
      `Forced swap completed. Requested=${data.requested ?? safePositions.length}, scanned=${data.scanned ?? 0}, repaired=${data.repaired ?? 0}, skipped=${data.skipped ?? 0}, failed=${data.failed ?? 0}.`
    );

    await refreshRows();
    return data;
  }


  async function previewNormalizeVisibleRows(hlPosities) {
    if (!runId) return null;

    const safePositions = Array.from(
      new Set((Array.isArray(hlPosities) ? hlPosities : []).map((value) => Number(value)).filter((value) => Number.isInteger(value)))
    );

    const r = await fetch(`/api/edit/run/${encodeURIComponent(runId)}/preview-normalize-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hlPosities: safePositions })
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();

    setNormalizationPreview(data);
    setMsg(
      `Normalization preview: requested=${data.requested ?? safePositions.length}, scanned=${data.scanned ?? 0}, changed rows=${data.changedRows ?? 0}, changed fields=${data.changedFields ?? 0}.`
    );

    return data;
  }

  async function previewEncodingRepairVisibleRows(hlPosities) {
    if (!runId) return null;

    const safePositions = Array.from(
      new Set((Array.isArray(hlPosities) ? hlPosities : []).map((value) => Number(value)).filter((value) => Number.isInteger(value)))
    );

    const r = await fetch(`/api/edit/run/${encodeURIComponent(runId)}/preview-repair-encoding`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hlPosities: safePositions })
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();

    setEncodingRepairPreview(data);
    setMsg(
      `Encoding repair preview: requested=${data.requested ?? safePositions.length}, scanned=${data.scanned ?? 0}, damaged rows=${data.damagedRows ?? 0}, repairable rows=${data.repairableRows ?? 0}.`
    );

    return data;
  }

  async function repairEncodingVisibleRows(hlPosities) {
    if (!runId) return null;

    const safePositions = Array.from(
      new Set((Array.isArray(hlPosities) ? hlPosities : []).map((value) => Number(value)).filter((value) => Number.isInteger(value)))
    );

    const r = await fetch(`/api/edit/run/${encodeURIComponent(runId)}/repair-encoding`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hlPosities: safePositions })
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();

    setEncodingRepairPreview(data);
    setMsg(
      `Encoding repair completed. Requested=${data.requested ?? safePositions.length}, scanned=${data.scanned ?? 0}, damaged rows=${data.damagedRows ?? 0}, repaired=${data.repaired ?? 0}, skipped=${data.skipped ?? 0}.`
    );

    await refreshRows();
    return data;
  }

  async function normalizeVisibleRows(hlPosities) {
    if (!runId) return null;

    const safePositions = Array.from(
      new Set((Array.isArray(hlPosities) ? hlPosities : []).map((value) => Number(value)).filter((value) => Number.isInteger(value)))
    );

    const r = await fetch(`/api/edit/run/${encodeURIComponent(runId)}/normalize-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hlPosities: safePositions })
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();

    setNormalizationPreview(data);
    setMsg(
      `Text normalization completed. Requested=${data.requested ?? safePositions.length}, scanned=${data.scanned ?? 0}, changed rows=${data.changedRows ?? 0}, unchanged=${data.unchangedRows ?? 0}, changed fields=${data.changedFields ?? 0}.`
    );

    await refreshRows();
    return data;
  }

  async function saveRunMetadata({ omroep_key, periode_key }) {
    if (!runId) return null;

    const r = await fetch(`/api/edit/run/${encodeURIComponent(runId)}/metadata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ omroep_key, periode_key })
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    setMsg(`Run metadata opgeslagen voor ${data.updatedRows ?? 0} stagingrij(en).`);
    await refreshRows();
    return data;
  }

  async function previewEnrichYearsVisibleRows(hlPosities) {
    if (!runId) return null;

    const safePositions = Array.from(
      new Set((Array.isArray(hlPosities) ? hlPosities : []).map((value) => Number(value)).filter((value) => Number.isInteger(value)))
    );

    const r = await fetch(`/api/edit/run/${encodeURIComponent(runId)}/preview-enrich-years`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hlPosities: safePositions })
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();

    setYearEnrichmentPreview(data);
    setYearEnrichmentPreviewVisible(true);
    setMsg(
      `Preview jaarverrijking: requested=${data.requested ?? safePositions.length}, scanned=${data.scanned ?? 0}, aanvulbaar=${data.updateable ?? 0}, meerdere kandidaten=${data.multipleCandidates ?? 0}, meerdere jaren=${data.multipleCandidateYears ?? 0}, geen match=${data.skippedNoMatch ?? 0}.`
    );

    return data;
  }

  async function enrichYearsVisibleRows(hlPosities) {
    if (!runId) return null;

    const safePositions = Array.from(
      new Set((Array.isArray(hlPosities) ? hlPosities : []).map((value) => Number(value)).filter((value) => Number.isInteger(value)))
    );

    const r = await fetch(`/api/edit/run/${encodeURIComponent(runId)}/enrich-years`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hlPosities: safePositions })
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();

    setYearEnrichmentPreview(data);
    setYearEnrichmentPreviewVisible(true);
    setMsg(
      `Jaarverrijking toegepast. Requested=${data.requested ?? safePositions.length}, scanned=${data.scanned ?? 0}, staging bijgewerkt=${data.updated ?? 0}, al gevuld=${data.skippedAlreadyFilled ?? 0}, geen match=${data.skippedNoMatch ?? 0}. Hitlijsten blijft ongewijzigd.`
    );

    await refreshRows();
    return data;
  }

  async function exportHitlijsten({ dryRun = false } = {}) {
    if (!runId) return;

    const r = await fetch("/api/run-export-hitlijsten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId, dryRun })
    });

    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();

    if (data.dryRun) {
      setMsg(
        `Export dry-run: total=${data.total}, existing=${data.existing}, wouldInsert=${data.wouldInsert}, wouldUpdateOrSkip=${data.wouldUpdateOrSkip}.`
      );
      return;
    }

    setMsg(
      `Export completed: total=${data.total}, inserted=${data.inserted}, updated=${data.updated}, skipped=${data.skipped}.`
    );
  }

  return {
    hitlijst,
    setHitlijst,
    uitzendjaar,
    setUitzendjaar,
    runs,
    metadataOptions,
    runId,
    rows,
    songTypes,
    msg,
    err,
    busy,
    fdStatusByPos,
    artistSpellingDone,
    patternPreview,
    patternSuggestions,
    patternSuggestionsPreview,
    patternSuggestionsResult,
    patternSuggestionsLoading,
    patternSuggestionsModalVisible,
    setPatternSuggestionsModalVisible,
    openPatternSuggestions,
    previewPatternSuggestions,
    addPatternSuggestions,
    addKeepPatternSuggestions,
    normalizationPreview,
    encodingRepairPreview,
    yearEnrichmentPreview,
    yearEnrichmentPreviewVisible,
    closeYearEnrichmentPreview: () => setYearEnrichmentPreviewVisible(false),

    setMsg,
    setErr,
    setBusy,

    loadRuns,
    loadMetadataOptions,
    selectRun,
    refreshRows,
    saveRow,
    saveDesiredSongTypeForRow,

    decodeHtmlEntitiesForRun,
    runArtistSpelling,
    runPatternDelete,
    runSongSpelling,

    refreshFileDetailsStatus,
    exportStatus,
    exportStatusLoading,
    exportStatusError,
    blockedDiscogsExportSummary,
    blockedDiscogsExportLoading,
    blockedDiscogsExportError,
    duplicateImportSummary,
    duplicateImportLoading,
    duplicateImportError,
    loadBlockedDiscogsExportSummary,
    loadDuplicateImportSummary,
    markDuplicateRowsAsSkip,
    exportHitlijsten,
    saveRunMetadata,
    repairSuspectedTitleArtistSwaps,
    forceSwapVisibleRows,
    previewNormalizeVisibleRows,
    normalizeVisibleRows,
    previewEncodingRepairVisibleRows,
    repairEncodingVisibleRows,
    previewEnrichYearsVisibleRows,
    enrichYearsVisibleRows,
    visibleRowPositions,
    setVisibleRowPositions
  };
}



const REASON_CODE_UI = {
  OK: {
    label: "OK",
    description: "Geen bekende blokkades of waarschuwingen voor deze rij.",
    hint: "Geen actie nodig."
  },
  MISSING_FD_TAG_TITLE: {
    label: "Correcte songtitel ontbreekt",
    description: "De afgeleide fd_tag_title is leeg.",
    hint: "Controleer bronwaarden, song spelling of herstel handmatig."
  },
  MISSING_HL_ARTIST_KEY: {
    label: "Artist key ontbreekt",
    description: "Er is nog geen geldige artist key afgeleid voor deze rij.",
    hint: "Controleer artiestrelatie of herstel die via de editflow."
  },
  NO_FILE_DETAILS_COMBINED_MATCH: {
    label: "Geen combined match",
    description: "De combinatie van fd_tag_title en hl_artist_key komt niet voor in file_details.",
    hint: "Controleer titel, artiestrelatie en file_details match."
  },
  MULTIPLE_FILE_DETAILS_COMBINED_MATCHES: {
    label: "Meerdere matches",
    description: "Er zijn meerdere file_details matches voor dezelfde titel + artist key.",
    hint: "Export mag door, maar controleer mogelijke duplicaten in file_details."
  },
  SUSPECTED_TITLE_ARTIST_SWAP: {
    label: "Titel en artiest lijken omgewisseld",
    description: "De stagingwaarden wijzen op een verwisseling van artiest en songtitel.",
    hint: "Gebruik swap-herstel of corrigeer handmatig."
  },
  RECOVERABLE_ENCODING_DAMAGE: {
    label: "Herstelbare encoding-schade",
    description: "De tekst bevat waarschijnlijk mojibake of verkeerd gedecodeerde tekens.",
    hint: "Gebruik encoding repair of corrigeer handmatig."
  },
  REPLACEMENT_CHAR_DAMAGE: {
    label: "Beschadigde tekst",
    description: "De tekst bevat replacement characters (�).",
    hint: "Handmatige correctie is meestal nodig."
  }
};

function getReasonUi(reasonCode) {
  return REASON_CODE_UI[reasonCode] || {
    label: formatReasonCode(reasonCode),
    description: formatReasonCode(reasonCode),
    hint: "Controleer de rij en herstel waar nodig."
  };
}

function getRowPresentationModel(row, matchCount) {
  const base = getRowProblemInfo(row, matchCount);
  const severityMap = {
    blocker: {
      badgeText: "Blocked",
      badgeVariant: "danger",
      iconClass: "bi bi-sign-stop-fill",
      iconColor: "red"
    },
    warning: {
      badgeText: "Warning",
      badgeVariant: "warning",
      iconClass: "bi bi-exclamation-triangle-fill",
      iconColor: "orange"
    },
    ok: {
      badgeText: "Ready",
      badgeVariant: "success",
      iconClass: "bi bi-check-square-fill",
      iconColor: "green"
    }
  };
  const severityUi = severityMap[base.severity] || severityMap.ok;
  const primaryReason = getReasonUi(base.primaryReasonCode);

  return {
    ...base,
    ...severityUi,
    primaryReasonLabel: primaryReason.label,
    primaryReasonDescription: primaryReason.description,
    primaryReasonHint: primaryReason.hint,
    reasonBadges: base.allReasonCodes.map((reasonCode) => ({ reasonCode, ...getReasonUi(reasonCode) }))
  };
}

function getRowProblemInfo(row, matchCount) {
  const hasFdTagTitle = String(row?.fd_tag_title || "").trim().length > 0;
  const hasArtistKey = row?.hl_artist_key !== "" && row?.hl_artist_key != null;
  const numericMatchCount = typeof matchCount === "number" ? matchCount : null;
  const blockers = [];
  const warnings = [];
  const artistEncoding = detectEncodingDamage(row?.hl_artiest);
  const titleEncoding = detectEncodingDamage(row?.hl_titel_song);

  if (artistEncoding.reasonCode === "REPLACEMENT_CHAR_DAMAGE" || titleEncoding.reasonCode === "REPLACEMENT_CHAR_DAMAGE") {
    blockers.push("REPLACEMENT_CHAR_DAMAGE");
  } else if (artistEncoding.reasonCode === "RECOVERABLE_ENCODING_DAMAGE" || titleEncoding.reasonCode === "RECOVERABLE_ENCODING_DAMAGE") {
    warnings.push("RECOVERABLE_ENCODING_DAMAGE");
  }

  if (!hasFdTagTitle) blockers.push("MISSING_FD_TAG_TITLE");
  if (!hasArtistKey) blockers.push("MISSING_HL_ARTIST_KEY");
  if (numericMatchCount === 0) blockers.push("NO_FILE_DETAILS_COMBINED_MATCH");
  if (numericMatchCount != null && numericMatchCount > 1) warnings.push("MULTIPLE_FILE_DETAILS_COMBINED_MATCHES");

  const allReasonCodes = [...blockers, ...warnings];

  return {
    severity: blockers.length > 0 ? "blocker" : warnings.length > 0 ? "warning" : "ok",
    blockers,
    warnings,
    allReasonCodes,
    primaryReasonCode: allReasonCodes[0] || "OK",
    matchCount: numericMatchCount
  };
}

function rowMatchesProblemFilter(problemInfo, filterState) {
  if (filterState.onlyProblems && problemInfo.severity === "ok") return false;
  if (filterState.severity === "blocker" && problemInfo.severity !== "blocker") return false;
  if (filterState.severity === "warning" && problemInfo.severity !== "warning") return false;
  if (filterState.reasonCode !== "all" && !problemInfo.allReasonCodes.includes(filterState.reasonCode)) return false;
  return true;
}

function normalizeLower(value) {
  return String(value ?? "").trim().toLowerCase();
}

function rowMatchesProcessingFilter(row, problemInfo, duplicateReasonCode, filterState) {
  const action = normalizeLower(row?.fd_action || "Keep");
  const query = normalizeLower(filterState.query);

  if (query) {
    const haystack = [
      row?.hl_positie,
      row?.hl_artiest,
      row?.as_correcte_artiest_spelling,
      row?.hl_titel_song,
      row?.fd_tag_title,
      row?.hl_jaar
    ]
      .filter((value) => value !== undefined && value !== null)
      .map(String)
      .join(" | ")
      .toLowerCase();

    if (!haystack.includes(query)) return false;
  }

  if (filterState.action !== "all") {
    if (filterState.action === "keep" && action !== "keep" && action !== "") return false;
    if (filterState.action !== "keep" && action !== filterState.action) return false;
  }

  if (filterState.processingStatus === "duplicates" && !duplicateReasonCode) return false;
  if (filterState.processingStatus === "skip" && action !== "skip") return false;
  if (filterState.processingStatus === "discogs" && !String(row?.hl_discogs_link || row?.discogs_master_url || row?.discogs_release_url || "").trim()) return false;
  if (filterState.processingStatus === "needs-action" && problemInfo.severity === "ok" && !duplicateReasonCode) return false;

  return true;
}

function formatReasonCode(reasonCode) {
  if (!reasonCode || reasonCode === "OK") return "OK";
  return reasonCode
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function EditMain({ ctrl }) {
  const {
    hitlijst,
    setHitlijst,
    uitzendjaar,
    setUitzendjaar,
    runs,
    runId,
    rows,
    songTypes,
    msg,
    err,
    busy,
    setMsg,
    setErr,
    setBusy,
    loadRuns,
    selectRun,
    refreshRows,
    saveRow,
    saveDesiredSongTypeForRow,
    fdStatusByPos,
    refreshFileDetailsStatus,
    exportStatus,
    exportStatusLoading,
    exportStatusError
  } = ctrl;

  const [showDetails, setShowDetails] = useState(false);
  const [detailsTitle, setDetailsTitle] = useState("");
  const [detailsRows, setDetailsRows] = useState([]);
  const [detailsBusy, setDetailsBusy] = useState(false);

  const [showAlt, setShowAlt] = useState(false);
  const [altPos, setAltPos] = useState(null);
  const [altArtist, setAltArtist] = useState("");
  const [altRows, setAltRows] = useState([]);
  const [altBusy, setAltBusy] = useState(false);
  const [altErr, setAltErr] = useState(null);

  // Find-cmd export modal
  const [showFindCmd, setShowFindCmd] = useState(false);
  const [targetValue, setTargetValue] = useState("$TARGET");
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [reasonCodeFilter, setReasonCodeFilter] = useState("all");
  const [processingStatusFilter, setProcessingStatusFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [listQuery, setListQuery] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const autoLoadedRunIdRef = useRef("");

  const findCmdCount = rows.filter((r) => String(r.hl_find_cmd || "").trim() !== "").length;

  const missingFdTagTitle = Number(exportStatus?.missingFdTagTitle ?? 0);
  const missingHlArtistKey = Number(exportStatus?.missingHlArtistKey ?? 0);
  const missingLinks = Number(exportStatus?.missingLinks ?? 0);
  const multipleLinks = Number(exportStatus?.multipleLinks ?? 0);
  const existingRowsForTarget = Number(exportStatus?.existingRowsForTarget ?? 0);
  const alreadyExported = exportStatus?.alreadyExported === true || existingRowsForTarget > 0;
  const firstIssue = exportStatus?.issuesPreview?.[0] ?? null;

  const exportBlocked =
    alreadyExported ||
    missingFdTagTitle > 0 ||
    missingHlArtistKey > 0 ||
    missingLinks > 0;

  const exportBlockedReason = exportBlocked
    ? [
        alreadyExported
          ? `hitlijst ${exportStatus?.hl_hitlijst ?? "?"} / ${exportStatus?.hl_uitzendjaar ?? "?"} is already exported (${existingRowsForTarget} existing row(s))`
          : null,
        missingFdTagTitle > 0
          ? `${missingFdTagTitle} row(s) have empty fd_tag_title`
          : null,
        missingHlArtistKey > 0
          ? `${missingHlArtistKey} row(s) have empty hl_artist_key`
          : null,
        missingLinks > 0
          ? `${missingLinks} row(s) have no match in file_details (fd_tag_title + hl_artist_key)`
          : null,
        multipleLinks > 0
          ? `${multipleLinks} row(s) have multiple matches in file_details (fd_tag_title + hl_artist_key); this is allowed but may indicate duplicate file_details rows`
          : null
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const duplicateReasonByPos = useMemo(() => {
    const map = {};
    for (const duplicateRow of ctrl.duplicateImportSummary?.duplicateRows || []) {
      const pos = String(duplicateRow?.hl_positie ?? "");
      if (pos) map[pos] = duplicateRow?.reasonCode || duplicateRow?.reason_code || "DUPLICATE_FILENAME";
    }
    return map;
  }, [ctrl.duplicateImportSummary?.duplicateRows]);

  const rowsWithProblemInfo = useMemo(() => {
    return rows.map((row) => {
      const matchCount = fdStatusByPos[String(row.hl_positie)]?.matchCount;
      const problemInfo = getRowPresentationModel(row, matchCount);
      const duplicateReasonCode = duplicateReasonByPos[String(row.hl_positie)] || null;
      return {
        row,
        matchCount: typeof matchCount === "number" ? matchCount : null,
        problemInfo,
        duplicateReasonCode
      };
    });
  }, [rows, fdStatusByPos, duplicateReasonByPos]);

  const filteredRows = useMemo(() => {
    const problemFilterState = { onlyProblems, severity: severityFilter, reasonCode: reasonCodeFilter };
    const processingFilterState = {
      processingStatus: processingStatusFilter,
      action: actionFilter,
      query: listQuery
    };
    return rowsWithProblemInfo.filter(({ row, problemInfo, duplicateReasonCode }) =>
      rowMatchesProblemFilter(problemInfo, problemFilterState) &&
      rowMatchesProcessingFilter(row, problemInfo, duplicateReasonCode, processingFilterState)
    );
  }, [rowsWithProblemInfo, onlyProblems, severityFilter, reasonCodeFilter, processingStatusFilter, actionFilter, listQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [runId, onlyProblems, severityFilter, reasonCodeFilter, processingStatusFilter, actionFilter, listQuery, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * pageSize;
  const pageEndIndex = Math.min(pageStartIndex + pageSize, filteredRows.length);

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  const pagedFilteredRows = useMemo(
    () => filteredRows.slice(pageStartIndex, pageEndIndex),
    [filteredRows, pageStartIndex, pageEndIndex]
  );

  const setVisibleRowPositions = ctrl.setVisibleRowPositions;

  useEffect(() => {
    setVisibleRowPositions?.(
      filteredRows
        .map(({ row }) => Number(row.hl_positie))
        .filter((value) => Number.isInteger(value))
    );
  }, [filteredRows, setVisibleRowPositions]);

  const filteredCounts = useMemo(
    () =>
      rowsWithProblemInfo.reduce(
        (acc, { problemInfo }) => {
          if (problemInfo.severity === "blocker") acc.blockers += 1;
          else if (problemInfo.severity === "warning") acc.warnings += 1;
          else acc.ok += 1;
          for (const reasonCode of problemInfo.allReasonCodes) {
            acc.reasonCounts[reasonCode] = (acc.reasonCounts[reasonCode] || 0) + 1;
          }
          return acc;
        },
        { blockers: 0, warnings: 0, ok: 0, reasonCounts: {} }
      ),
    [rowsWithProblemInfo]
  );

  const processingCounts = useMemo(() => {
    return rowsWithProblemInfo.reduce(
      (acc, { row, problemInfo, duplicateReasonCode }) => {
        const action = normalizeLower(row?.fd_action || "Keep") || "keep";
        acc.actions[action] = (acc.actions[action] || 0) + 1;
        if (duplicateReasonCode) acc.duplicates += 1;
        if (action === "skip") acc.skip += 1;
        if (String(row?.hl_discogs_link || row?.discogs_master_url || row?.discogs_release_url || "").trim()) acc.discogs += 1;
        if (problemInfo.severity !== "ok" || duplicateReasonCode) acc.needsAction += 1;
        return acc;
      },
      { duplicates: 0, skip: 0, discogs: 0, needsAction: 0, actions: {} }
    );
  }, [rowsWithProblemInfo]);

  const availableReasonCodes = useMemo(() => {
    const entries = Object.entries(filteredCounts.reasonCounts || {}).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });
    return entries;
  }, [filteredCounts]);

  const activeRunDetails = useMemo(() => {
    const byRunId = Array.isArray(runs) ? runs.find((run) => String(run.ir_run_id) === String(runId)) : null;
    const firstRow = rows[0] || {};
    return {
      hitlijst: byRunId?.ir_hitlijst ?? firstRow.hl_hitlijst ?? "",
      uitzendjaar: byRunId?.ir_uitzendjaar ?? firstRow.hl_uitzendjaar ?? "",
      omroep: byRunId?.omroep_naam ?? firstRow.omroep_naam ?? "",
      periode: byRunId?.periode_naam ?? firstRow.periode_naam ?? ""
    };
  }, [runs, runId, rows]);

  const editTitle = activeRunDetails.hitlijst
    ? `Bewerken: ${activeRunDetails.hitlijst}${activeRunDetails.uitzendjaar ? ` — ${activeRunDetails.uitzendjaar}` : ""}`
    : "Edit mode";
  // Auto-select run from querystring exactly once per runId to avoid repeated load loops.
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const qRunId = (qs.get("runId") || "").trim();

    if (!qRunId) return;
    if (qRunId === runId) return;
    if (autoLoadedRunIdRef.current === qRunId) return;

    autoLoadedRunIdRef.current = qRunId;

    (async () => {
      try {
        setBusy(true);
        setErr(null);
        setMsg(null);
        await selectRun(qRunId);
        setMsg(`Loaded run from URL: ${qRunId}`);
      } catch (e) {
        setErr(e?.message || String(e));
        autoLoadedRunIdRef.current = "";
      } finally {
        setBusy(false);
      }
    })();
  }, [runId]);

  async function openFileDetailsModal(fd_tag_title) {
    const t = String(fd_tag_title || "").trim();
    if (!t) return;

    setDetailsBusy(true);
    setDetailsTitle(t);
    setShowDetails(true);

    try {
      const r = await fetch(`/api/file-details?fd_tag_title=${encodeURIComponent(t)}`);
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setDetailsRows(data.rows || []);
    } catch (e) {
      setDetailsRows([]);
      setErr(e.message || String(e));
    } finally {
      setDetailsBusy(false);
    }
  }

  async function openAltSpellingModal(row) {
    const hl_positie = row?.hl_positie;
    const artist = String(row?.as_correcte_artiest_spelling || row?.hl_artiest || "").trim();

    setAltPos(hl_positie);
    setAltArtist(artist);
    setAltRows([]);
    setAltErr(null);
    setShowAlt(true);

    if (!artist) {
      setAltErr("No artist available (as_correcte_artiest_spelling / hl_artiest is empty).");
      return;
    }

    setAltBusy(true);
    try {
      const r = await fetch(
        `/api/file-details-by-artist?fd_correct_artist=${encodeURIComponent(artist)}`
      );
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setAltRows(data.rows || []);
    } catch (e) {
      setAltErr(e?.message || String(e));
    } finally {
      setAltBusy(false);
    }
  }

  async function applyAltSpelling(selectedFdTagTitle) {
    if (!runId || altPos == null) return;

    const fd_tag_title = String(selectedFdTagTitle || "").trim();
    if (!fd_tag_title) return;

    setAltBusy(true);
    try {
      const r = await fetch("/api/altspelling-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId,
          hl_positie: altPos,
          fd_tag_title
        })
      });

      if (!r.ok) throw new Error(await r.text());

      setShowAlt(false);
      setMsg("Titelcorrectie opgeslagen; song_spelling is bijgewerkt.");

      await refreshRows();
      await refreshFileDetailsStatus();
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setAltBusy(false);
    }
  }

  return (
    <div>
      <h4>{editTitle}</h4>
      <div className="small text-muted mb-2">
        {runId && activeRunDetails.hitlijst ? (
          <>
            Actieve run: <code>{runId}</code>
            {activeRunDetails.omroep ? ` · Omroep: ${activeRunDetails.omroep}` : ""}
            {activeRunDetails.periode ? ` · Periode: ${activeRunDetails.periode}` : ""}
          </>
        ) : (
          "Select an import run and edit staging rows (without importing)."
        )}
      </div>

      {msg && (
        <Alert variant="info" onClose={() => setMsg(null)} dismissible>
          {msg}
        </Alert>
      )}
      {err && (
        <Alert variant="danger" onClose={() => setErr(null)} dismissible>
          {err}
        </Alert>
      )}

      <PatternSuggestionsModal ctrl={ctrl} />

      {ctrl.patternPreview?.length > 0 && (
        <Alert variant="secondary">
          <div className="small text-muted mb-2">
            <strong>PatternDelete dry-run preview</strong>
          </div>
          <div className="import-pre" style={{ maxHeight: 240 }}>
            <pre className="m-0">
              {ctrl.patternPreview
                .map((p) => `#${p.hl_positie}\nBEFORE: ${p.before}\nAFTER : ${p.after}\n`)
                .join("\n")}
            </pre>
          </div>
        </Alert>
      )}



      {ctrl.normalizationPreview && (
        <Alert variant="secondary">
          <div className="small text-muted mb-2">
            <strong>Text normalization preview</strong>
            {` — requested: ${ctrl.normalizationPreview.requested ?? 0}, scanned: ${ctrl.normalizationPreview.scanned ?? 0}, changed rows: ${ctrl.normalizationPreview.changedRows ?? 0}, changed fields: ${ctrl.normalizationPreview.changedFields ?? 0}`}
          </div>
          {Array.isArray(ctrl.normalizationPreview.preview) && ctrl.normalizationPreview.preview.length > 0 ? (
            <div className="import-pre" style={{ maxHeight: 240 }}>
              <pre className="m-0">
                                {ctrl.normalizationPreview.preview
                  .map((item) => {
                    const changeLines = (item.changes || [])
                      .map((change) => `${change.field}: ${change.before ?? ""} -> ${change.after ?? ""}`)
                      .join("\n");
                    return `#${item.hlPositie}\n${changeLines}\n`;
                  })
                  .join("\n")}
              </pre>
            </div>
          ) : (
            <div className="small text-muted">No text changes detected for the current selection.</div>
          )}
        </Alert>
      )}


      {ctrl.encodingRepairPreview && (
        <Alert variant="warning">
          <div className="small text-muted mb-2">
            <strong>Encoding repair preview</strong>
            {` — requested: ${ctrl.encodingRepairPreview.requested ?? 0}, scanned: ${ctrl.encodingRepairPreview.scanned ?? 0}, damaged rows: ${ctrl.encodingRepairPreview.damagedRows ?? 0}, repairable rows: ${ctrl.encodingRepairPreview.repairableRows ?? 0}`}
          </div>
          {Array.isArray(ctrl.encodingRepairPreview.preview) && ctrl.encodingRepairPreview.preview.length > 0 ? (
            <div className="import-pre" style={{ maxHeight: 240 }}>
              <pre className="m-0">
                {ctrl.encodingRepairPreview.preview
                  .map((item) => {
                    const changeLines = (item.changes || [])
                      .map((change) => `${change.field}: ${change.before ?? ""} -> ${change.after ?? ""}`)
                      .join("\n");
                    return `#${item.hlPositie}\n${changeLines}\nreasons: ${(item.reasons || []).join(", ")}\n`;
                  })
                  .join("\n")}
              </pre>
            </div>
          ) : (
            <div className="small text-muted">No recoverable encoding repairs detected for the current selection.</div>
          )}
        </Alert>
      )}


      {ctrl.yearEnrichmentPreview && ctrl.yearEnrichmentPreviewVisible !== false && (
        <Alert variant="info" role="alert">
          <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
            <div className="small text-muted">
              <strong>Preview jaarverrijking/resultaat</strong>
              {` — requested: ${ctrl.yearEnrichmentPreview.requested ?? 0}, scanned: ${ctrl.yearEnrichmentPreview.scanned ?? 0}, aanvulbaar: ${ctrl.yearEnrichmentPreview.updateable ?? 0}, staging bijgewerkt: ${ctrl.yearEnrichmentPreview.updated ?? 0}, meerdere kandidaten: ${ctrl.yearEnrichmentPreview.multipleCandidates ?? 0}, meerdere jaren: ${ctrl.yearEnrichmentPreview.multipleCandidateYears ?? 0}, geen match: ${ctrl.yearEnrichmentPreview.skippedNoMatch ?? 0}. Hitlijsten blijft ongewijzigd.`}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline-secondary"
              onClick={() => ctrl.closeYearEnrichmentPreview?.()}
              aria-label="Melding sluiten"
            >
              Sluiten
            </Button>
          </div>
          {Array.isArray(ctrl.yearEnrichmentPreview.preview) && ctrl.yearEnrichmentPreview.preview.length > 0 ? (
            <div className="import-pre" style={{ maxHeight: 240 }}>
              <pre className="m-0">
                {ctrl.yearEnrichmentPreview.preview
                  .map((item) => {
                    const warnings = Array.isArray(item.warnings) && item.warnings.length > 0 ? ` · waarschuwingen=${item.warnings.join(" | ")}` : "";
                    return `#${item.hlPositie}: ${item.status} · huidig=${item.currentYear ?? ""} · gevonden=${item.candidateYear ?? ""} · bron fd_key=${item.sourceFdKey ?? ""} · matches=${item.matchCount ?? 0} · ${item.reason ?? ""}${warnings}`;
                  })
                  .join("\n")}
              </pre>
            </div>
          ) : (
            <div className="small text-muted">Geen jaarverrijking-kandidaten gevonden voor de huidige selectie.</div>
          )}
          {Number(ctrl.yearEnrichmentPreview.updateable ?? 0) > 0 && Number(ctrl.yearEnrichmentPreview.updated ?? 0) === 0 && (
            <div className="mt-2">
              <Button
                size="sm"
                variant="success"
                disabled={ctrl.busy}
                onClick={async () => {
                  try {
                    ctrl.setBusy(true);
                    ctrl.setErr(null);
                    ctrl.setMsg(null);
                    await ctrl.enrichYearsVisibleRows(ctrl.visibleRowPositions || []);
                  } catch (e) {
                    ctrl.setErr(e.message || String(e));
                  } finally {
                    ctrl.setBusy(false);
                  }
                }}
              >
                Jaarverrijking toepassen
              </Button>
            </div>
          )}
        </Alert>
      )}

      {!runId && (
        <Alert variant="warning" className="mb-3">
          Selecteer eerst een import-run via het <a href="/">Runs-scherm</a>. Deze Edit-pagina kan alleen nog in de context van één run worden gebruikt.
        </Alert>
      )}

      {runId && (
        <>
          <div className="d-flex align-items-end justify-content-between flex-wrap gap-3 mb-2">
            <div className="small text-muted" aria-label="Rijensamenvatting liedjestabel">
              Rows: {rows.length}
              {filteredRows.length !== rows.length ? ` (matching filter: ${filteredRows.length})` : ""}
              {filteredRows.length > 0 ? ` · pagina ${safeCurrentPage} van ${totalPages} · getoond ${pageStartIndex + 1}-${pageEndIndex}` : ""}
              {` · blockers: ${filteredCounts.blockers} · warnings: ${filteredCounts.warnings} · ok: ${filteredCounts.ok}`}
              {` · duplicates: ${processingCounts.duplicates} · skip: ${processingCounts.skip}`}
            </div>
            <div className="d-flex align-items-end flex-wrap gap-2">
              <Form.Check
                id="only-problems-toggle"
                type="switch"
                label="Show only problem rows"
                checked={onlyProblems}
                onChange={(e) => setOnlyProblems(e.target.checked)}
              />
              <Form.Group>
                <Form.Label className="small text-muted mb-1">Problem type</Form.Label>
                <Form.Select
                  size="sm"
                  aria-label="Problem type filter"
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  style={{ minWidth: 180 }}
                >
                  <option value="all">All rows</option>
                  <option value="blocker">Only blockers</option>
                  <option value="warning">Only warnings</option>
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label className="small text-muted mb-1">Reason code</Form.Label>
                <Form.Select
                  size="sm"
                  aria-label="Reason code filter"
                  value={reasonCodeFilter}
                  onChange={(e) => setReasonCodeFilter(e.target.value)}
                  style={{ minWidth: 260 }}
                >
                  <option value="all">All reason codes</option>
                  {availableReasonCodes.map(([reasonCode, count]) => (
                    <option key={reasonCode} value={reasonCode}>
                      {`${formatReasonCode(reasonCode)} (${count})`}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label className="small text-muted mb-1">Verwerkingsstatus</Form.Label>
                <Form.Select
                  size="sm"
                  aria-label="Verwerkingsstatus filter"
                  value={processingStatusFilter}
                  onChange={(e) => setProcessingStatusFilter(e.target.value)}
                  style={{ minWidth: 220 }}
                >
                  <option value="all">Alle rijen</option>
                  <option value="needs-action">Aandacht nodig ({processingCounts.needsAction})</option>
                  <option value="duplicates">Duplicates ({processingCounts.duplicates})</option>
                  <option value="skip">Skip ({processingCounts.skip})</option>
                  <option value="discogs">Met Discogs-link ({processingCounts.discogs})</option>
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label className="small text-muted mb-1">Actie</Form.Label>
                <Form.Select
                  size="sm"
                  aria-label="Actie filter"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  style={{ minWidth: 160 }}
                >
                  <option value="all">Alle acties</option>
                  <option value="keep">Keep ({processingCounts.actions.keep || 0})</option>
                  <option value="skip">Skip ({processingCounts.actions.skip || 0})</option>
                  <option value="delete">Delete ({processingCounts.actions.delete || 0})</option>
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label htmlFor="edit-list-filter" className="small text-muted mb-1">Lijstfilter</Form.Label>
                <Form.Control
                  id="edit-list-filter"
                  size="sm"
                  type="search"
                  aria-label="Lijstfilter"
                  placeholder="positie, artiest, titel, jaar…"
                  value={listQuery}
                  onChange={(e) => setListQuery(e.target.value)}
                  style={{ minWidth: 260 }}
                />
              </Form.Group>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => {
                  setOnlyProblems(false);
                  setSeverityFilter("all");
                  setReasonCodeFilter("all");
                  setProcessingStatusFilter("all");
                  setActionFilter("all");
                  setListQuery("");
                }}
                disabled={!onlyProblems && severityFilter === "all" && reasonCodeFilter === "all" && processingStatusFilter === "all" && actionFilter === "all" && !listQuery}
              >
                Reset filters
              </Button>
            </div>
          </div>

          {(availableReasonCodes.length > 0 || processingCounts.duplicates > 0 || processingCounts.skip > 0) && (
            <div className="d-flex flex-wrap gap-2 mb-2" aria-label="Problem summary">
              {availableReasonCodes.map(([reasonCode, count]) => (
                <Button
                  key={reasonCode}
                  size="sm"
                  variant={reasonCodeFilter === reasonCode ? "primary" : "outline-secondary"}
                  onClick={() => {
                    setOnlyProblems(true);
                    setReasonCodeFilter(reasonCode);
                  }}
                >
                  {`${formatReasonCode(reasonCode)}: ${count}`}
                </Button>
              ))}
              {processingCounts.duplicates > 0 && (
                <Button
                  size="sm"
                  variant={processingStatusFilter === "duplicates" ? "primary" : "outline-warning"}
                  onClick={() => setProcessingStatusFilter("duplicates")}
                >
                  {`Duplicates: ${processingCounts.duplicates}`}
                </Button>
              )}
              {processingCounts.skip > 0 && (
                <Button
                  size="sm"
                  variant={processingStatusFilter === "skip" ? "primary" : "outline-secondary"}
                  onClick={() => setProcessingStatusFilter("skip")}
                >
                  {`Skip: ${processingCounts.skip}`}
                </Button>
              )}
            </div>
          )}

          <div className="table-responsive">
            <Table bordered hover size="sm" className="align-middle">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Status</th>
                  <th style={{ width: 40 }} title="resolved status">
                    FD
                  </th>
                  <th style={{ width: 70 }}>positie</th>
                  <th>Artiest</th>
                  <th>Songtitel</th>
                  <th style={{ width: 80 }}>jaar</th>
                  <th>Correcte Songtitel <span className="small text-muted">(auto)</span></th>
                  <th>Correcte Artiest Spelling <span className="small text-muted">(auto)</span></th>
                  <th style={{ width: 150 }}>Versie</th>
                  <th style={{ width: 90 }}>Actie</th>
                  <th>Discogs Link</th>
                  <th>Find-cmd</th>
                  <th style={{ width: 190 }}></th>
                </tr>
              </thead>

              <tbody>
                {pagedFilteredRows.map(({ row: r, matchCount, problemInfo, duplicateReasonCode }) => {
                  const s = fdStatusByPos[String(r.hl_positie)];
                  const isNotFound = matchCount === 0;
                  const hasArtist =
                    String(r.as_correcte_artiest_spelling || r.hl_artiest || "").trim().length > 0;

                  // AltSpelling appears only for fallback rows
                  const canAlt = isNotFound && hasArtist;

                  const detailsTitle = String(s?.effective_title || "").trim();

                  return (
                    <RowEditor
                      key={r.hl_positie}
                      row={r}
                      songTypes={songTypes}
                      matchCount={matchCount}
                      problemInfo={problemInfo}
                      disabled={busy}
                      preExportActionsDisabled={alreadyExported}
                      preExportDisabledTitle="Deze actie is niet beschikbaar na export. Gebruik Correctie na export."
                      reasonSummary={problemInfo.allReasonCodes}
                      duplicateReasonCode={duplicateReasonCode}
                      onOpenDetails={
                        matchCount != null && matchCount > 0 && detailsTitle
                          ? () => openFileDetailsModal(detailsTitle)
                          : null
                      }
                      onOpenAlt={canAlt ? () => openAltSpellingModal(r) : null}
                      onDesiredSongTypeChange={async (value) => {
                        await saveDesiredSongTypeForRow(r.hl_positie, value);
                      }}
                      onAfterRepair={async (message) => {
                        try {
                          setBusy(true);
                          setErr(null);
                          setMsg(message || `Artist relation repaired for positie ${r.hl_positie}`);
                          await refreshRows();
                        } catch (e) {
                          setErr(e.message || String(e));
                        } finally {
                          setBusy(false);
                        }
                      }}
                      onSave={async (patch) => {
                        try {
                          setBusy(true);
                          setErr(null);
                          await saveRow(r.hl_positie, patch);
                          setMsg(`Saved positie ${r.hl_positie}`);
                          await refreshRows();
                        } catch (e) {
                          setErr(e.message || String(e));
                        } finally {
                          setBusy(false);
                        }
                      }}
                    />
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={13} className="text-muted">
                      No rows match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {filteredRows.length > 0 && (
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-2" aria-label="Paginering liedjestabel">
              <div className="d-flex align-items-center gap-2">
                <Form.Label htmlFor="edit-page-size" className="small text-muted mb-0">Regels per pagina</Form.Label>
                <Form.Select
                  id="edit-page-size"
                  size="sm"
                  aria-label="Regels per pagina"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  style={{ width: 95 }}
                >
                  {[25, 50, 100, 250].map((size) => <option key={size} value={size}>{size}</option>)}
                </Form.Select>
              </div>
              <div className="small text-muted" aria-label="Paginastatus liedjestabel">
                Pagina {safeCurrentPage} van {totalPages} · regels {pageStartIndex + 1}-{pageEndIndex} van {filteredRows.length}
              </div>
              <div className="d-flex gap-1">
                <Button size="sm" variant="outline-secondary" onClick={() => setCurrentPage(1)} disabled={safeCurrentPage <= 1}>Eerste</Button>
                <Button size="sm" variant="outline-secondary" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage <= 1}>Vorige</Button>
                <Button size="sm" variant="outline-secondary" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safeCurrentPage >= totalPages}>Volgende</Button>
                <Button size="sm" variant="outline-secondary" onClick={() => setCurrentPage(totalPages)} disabled={safeCurrentPage >= totalPages}>Laatste</Button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>file_details matches for: {detailsTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsBusy ? (
            <Spinner />
          ) : (
            <div className="table-responsive">
              <Table bordered hover size="sm" className="align-middle">
                <thead>
                  <tr>
                    <th>Correcte Artiest</th>
                    <th>Correcte Songtitel <span className="small text-muted">(auto)</span></th>
                    <th>Fysieke file</th>
                    <th>Bron hitlijst</th>
                    <th>Lengte Song</th>
                    <th>Jaar van publiceren</th>
                    <th>Jaar van versie</th>
                    <th>Songtype</th>
                  </tr>
                </thead>
                <tbody>
                  {detailsRows.map((x, idx) => (
                    <tr key={idx}>
                      <td>{x.fd_correct_artist}</td>
                      <td>{x.fd_tag_title}</td>
                      <td>{x.fd_file_name}</td>
                      <td>{x.fd_hitlijst}</td>
                      <td>{x.fd_duration}</td>
                      <td>{x.fd_year_song_publish ?? ""}</td>
                      <td>{x.fd_year_song_version ?? ""}</td>
                      <td>{x.st_song_type ?? ""}</td>
                    </tr>
                  ))}
                  {detailsRows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-muted">
                        No matches.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetails(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showAlt} onHide={() => setShowAlt(false)} centered size="xl" aria-labelledby="alt-spelling-title">
        <Modal.Header closeButton>
          <Modal.Title id="alt-spelling-title">Select fd_tag_title (Artist: {altArtist || "(no artist)"})</Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ overflow: "auto", maxHeight: "75vh" }}>
          {altErr && <Alert variant="danger">{altErr}</Alert>}
          {altBusy ? (
            <Spinner />
          ) : (
            <div className="table-responsive">
              <Table bordered hover size="sm" className="align-middle">
                <thead>
                  <tr>
                    <th>Correcte Artiest</th>
                    <th>Correcte Songtitel <span className="small text-muted">(auto)</span></th>
                    <th>Fysieke file</th>
                    <th>Bron hitlijst</th>
                    <th>Lengte van Song</th>
                    <th>Songtype</th>
                    <th>Jaar van publiceren</th>
                    <th>Jaar van versie</th>
                    <th style={{ width: 110 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {altRows.map((x, idx) => (
                    <tr key={idx}>
                      <td>{x.fd_correct_artist}</td>
                      <td>{x.fd_tag_title}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{x.fd_file_name}</td>
                      <td>{x.fd_hitlijst}</td>
                      <td>{x.fd_duration}</td>
                      <td>{x.st_song_type ?? ""}</td>
                      <td>{x.fd_year_song_publish ?? ""}</td>
                      <td>{x.fd_year_song_version ?? ""}</td>
                      <td>
                        <Button size="sm" onClick={() => applyAltSpelling(x.fd_tag_title)}>
                          Select
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {altRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-muted">
                        No file_details rows found for this artist.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAlt(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}


function PatternSuggestionsModal({ ctrl }) {
  const [selected, setSelected] = useState([]);
  const suggestions = ctrl.patternSuggestions?.suggestions || [];
  const selectedSet = new Set(selected);

  useEffect(() => {
    if (!ctrl.patternSuggestionsModalVisible) setSelected([]);
  }, [ctrl.patternSuggestionsModalVisible]);

  function toggle(pattern) {
    setSelected((current) => current.includes(pattern)
      ? current.filter((item) => item !== pattern)
      : [...current, pattern]
    );
  }

  const allNewPatterns = suggestions.flatMap((suggestion) => (suggestion.newVariants || []).map((variant) => variant.pattern));

  return (
    <Modal show={ctrl.patternSuggestionsModalVisible} onHide={() => ctrl.setPatternSuggestionsModalVisible(false)} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>Pattern suggesties voor deze run</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {ctrl.patternSuggestionsLoading ? (
          <div className="d-flex align-items-center gap-2"><Spinner size="sm" /> Pattern suggesties laden...</div>
        ) : (
          <>
            <Alert variant="info" className="small">
              Kies per suggestie wat ermee moet gebeuren: <strong>Verwijderbaar</strong> voegt toe aan <code>public.string_del_patterns</code>; <strong>Titelonderdeel</strong> voegt toe aan <code>public.string_keep_patterns</code>. Bekende titelonderdelen worden niet meer als verwijderbaar patroon voorgesteld.
            </Alert>
            <div className="small text-muted mb-2">
              Groepen: {ctrl.patternSuggestions?.summary?.candidateGroups ?? 0} · Nieuwe concrete varianten: {ctrl.patternSuggestions?.summary?.newVariants ?? 0} · Bestaande verwijderbare varianten: {ctrl.patternSuggestions?.summary?.existingVariants ?? 0} · Onderdrukt als titelonderdeel: {ctrl.patternSuggestions?.summary?.suppressedKeepPatterns ?? 0}
            </div>
            {suggestions.length === 0 ? (
              <Alert variant="secondary" className="small">Geen kandidaatpatterns gevonden.</Alert>
            ) : (
              <Table size="sm" bordered responsive>
                <thead>
                  <tr>
                    <th>Selectie</th>
                    <th>Groep</th>
                    <th>Classificatie</th>
                    <th>Aantal</th>
                    <th>Varianten</th>
                    <th>Voorbeelden</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map((suggestion) => (
                    <tr key={suggestion.groupKey}>
                      <td>
                        {(suggestion.newVariants || []).length === 0 ? (
                          <Badge bg="secondary">Bestaat al</Badge>
                        ) : (
                          <div className="d-flex flex-column gap-1">
                            {(suggestion.newVariants || []).map((variant) => (
                              <Form.Check
                                key={variant.normalizedPattern}
                                type="checkbox"
                                label={variant.pattern}
                                checked={selectedSet.has(variant.pattern)}
                                onChange={() => toggle(variant.pattern)}
                              />
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="fw-semibold">{suggestion.canonicalLabel}</div>
                        <div className="small text-muted">{suggestion.genericHint}</div>
                      </td>
                      <td><Badge bg={suggestion.classification === "SAFE_REMOVE_PATTERN" ? "success" : suggestion.classification === "LIKELY_TITLE_CONTENT" ? "warning" : "info"}>{suggestion.classificationLabel || "Controle nodig"}</Badge></td>
                      <td>{suggestion.count}</td>
                      <td>
                        {(suggestion.variants || []).map((variant) => (
                          <div key={variant.normalizedPattern} className="small">
                            <code>{variant.pattern}</code> × {variant.count} {variant.exists ? <Badge bg="secondary">Bestaat al</Badge> : null}
                          </div>
                        ))}
                      </td>
                      <td>
                        {(suggestion.examples || []).map((example, idx) => (
                          <div key={`${suggestion.groupKey}-${idx}`} className="small mb-1">
                            #{example.hl_positie}: {example.before}<br />
                            <span className="text-muted">→ {example.after}</span>
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}

            <div className="d-flex gap-2 mb-3">
              <Button size="sm" variant="outline-secondary" disabled={allNewPatterns.length === 0} onClick={() => setSelected(allNewPatterns)}>
                Selecteer alle nieuwe varianten
              </Button>
              <Button size="sm" variant="outline-secondary" disabled={selected.length === 0} onClick={() => setSelected([])}>
                Selectie leegmaken
              </Button>
              <Button size="sm" variant="outline-primary" disabled={selected.length === 0} onClick={() => ctrl.previewPatternSuggestions(selected)}>
                Preview effect
              </Button>
              <Button size="sm" variant="primary" disabled={selected.length === 0} onClick={() => ctrl.addPatternSuggestions(selected)}>
                Toevoegen als verwijderbaar
              </Button>
              <Button size="sm" variant="outline-warning" disabled={selected.length === 0} onClick={() => ctrl.addKeepPatternSuggestions(selected)}>
                Toevoegen als titelonderdeel
              </Button>
            </div>

            {ctrl.patternSuggestionsPreview && (
              <Alert variant="secondary" role="alert">
                <div className="fw-semibold small mb-2">Preview effect — {ctrl.patternSuggestionsPreview.changes?.length ?? 0} wijziging(en)</div>
                <div className="import-pre" style={{ maxHeight: 220 }}>
                  <pre className="m-0">
                    {(ctrl.patternSuggestionsPreview.changes || []).slice(0, 30).map((item) => `#${item.hl_positie}\nVOOR: ${item.before}\nNA  : ${item.after}\n`).join("\n")}
                  </pre>
                </div>
              </Alert>
            )}

            {ctrl.patternSuggestionsResult && (
              <Alert variant="success" role="alert">
                {ctrl.patternSuggestionsResult.target === "keep" ? "Titelonderdelen" : "Verwijderbare patterns"} bijgewerkt. Toegevoegd: {ctrl.patternSuggestionsResult.inserted?.length ?? 0}. Bestond al: {ctrl.patternSuggestionsResult.skippedExisting?.length ?? 0}. {ctrl.patternSuggestionsResult.skippedKeep?.length ? `Overgeslagen als titelonderdeel: ${ctrl.patternSuggestionsResult.skippedKeep.length}.` : ""}
              </Alert>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => ctrl.setPatternSuggestionsModalVisible(false)}>Sluiten</Button>
      </Modal.Footer>
    </Modal>
  );
}

function WorkflowStepSection({ title, description, children }) {
  return (
    <section className="border rounded p-2 bg-light" aria-label={`Workflowstap ${title}`}>
      <div className="small fw-semibold text-uppercase text-muted">{title}</div>
      {description ? <div className="small text-muted mb-2">{description}</div> : null}
      <div className="d-flex flex-column gap-2">{children}</div>
    </section>
  );
}

function WorkflowOverview({ steps }) {
  return (
    <div className="small border rounded p-2" aria-label="Edit workflow overzicht">
      <div className="fw-semibold mb-1">Workflow</div>
      <ol className="mb-0 ps-3">
        {steps.map((step) => (
          <li key={step.id}>
            <span className="fw-semibold">{step.title}</span>
            <span className="text-muted"> — {step.description}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function EditAside({ ctrl }) {
  const {
    runId,
    rows,
    songTypes,
    metadataOptions,
    exportStatus,
    exportStatusLoading,
    exportStatusError,
    blockedDiscogsExportSummary,
    blockedDiscogsExportLoading,
    blockedDiscogsExportError,
    duplicateImportSummary,
    duplicateImportLoading,
    duplicateImportError,
    markDuplicateRowsAsSkip,
    busy,
    setBusy,
    setErr,
    setMsg,
    refreshRows,
    artistSpellingDone,
    decodeHtmlEntitiesForRun,
    runArtistSpelling,
    runPatternDelete,
    runSongSpelling,
    exportHitlijsten,
    saveRunMetadata,
    repairSuspectedTitleArtistSwaps,
    forceSwapVisibleRows,
    previewNormalizeVisibleRows,
    normalizeVisibleRows,
    previewEncodingRepairVisibleRows,
    repairEncodingVisibleRows,
    previewEnrichYearsVisibleRows,
    enrichYearsVisibleRows,
    visibleRowPositions
  } = ctrl;

  // Find-cmd export modal state
  const [showFindCmd, setShowFindCmd] = useState(false);
  const [targetValue, setTargetValue] = useState("$TARGET");
  const [metadataOmroepKey, setMetadataOmroepKey] = useState("");
  const [metadataPeriodeKey, setMetadataPeriodeKey] = useState("");

  const findCmdCount = Array.isArray(rows)
    ? rows.filter((r) => String(r?.hl_find_cmd || "").trim() !== "").length
    : 0;

  const blockedDiscogsExportCount = Number(blockedDiscogsExportSummary?.exportableCount ?? 0);
  const duplicateImportCount = Number(duplicateImportSummary?.duplicateCount ?? 0);
  const existingDuplicateCount = Number(duplicateImportSummary?.existingFileDetailsDuplicateCount ?? 0);
  const inRunDuplicateCount = Number(duplicateImportSummary?.inRunDuplicateCount ?? 0);

  const omroepen = metadataOptions?.omroepen ?? [];
  const perioden = metadataOptions?.perioden ?? [];
  const currentMetadataRow = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

  useEffect(() => {
    setMetadataOmroepKey(currentMetadataRow?.omroep_key ? String(currentMetadataRow.omroep_key) : "");
    setMetadataPeriodeKey(currentMetadataRow?.periode_key ? String(currentMetadataRow.periode_key) : "");
  }, [currentMetadataRow?.omroep_key, currentMetadataRow?.periode_key]);

  const missingFdTagTitle = Number(exportStatus?.missingFdTagTitle ?? 0);
  const missingHlArtistKey = Number(exportStatus?.missingHlArtistKey ?? 0);
  const missingLinks = Number(exportStatus?.missingLinks ?? 0);
  const multipleLinks = Number(exportStatus?.multipleLinks ?? 0);
  const existingRowsForTarget = Number(exportStatus?.existingRowsForTarget ?? 0);
  const alreadyExported = exportStatus?.alreadyExported === true || existingRowsForTarget > 0;
  const firstIssue = exportStatus?.issuesPreview?.[0] ?? null;

  const exportBlocked =
    alreadyExported ||
    missingFdTagTitle > 0 ||
    missingHlArtistKey > 0 ||
    missingLinks > 0;

  const exportBlockedReason = exportBlocked
    ? [
        alreadyExported
          ? `hitlijst ${exportStatus?.hl_hitlijst ?? "?"} / ${exportStatus?.hl_uitzendjaar ?? "?"} is already exported (${existingRowsForTarget} existing row(s))`
          : null,
        missingFdTagTitle > 0 ? `${missingFdTagTitle} row(s) have empty fd_tag_title` : null,
        missingHlArtistKey > 0
          ? `${missingHlArtistKey} row(s) have empty hl_artist_key`
          : null,
        missingLinks > 0
          ? `${missingLinks} row(s) have no match in file_details (fd_tag_title + hl_artist_key)`
          : null,
        multipleLinks > 0
          ? `${multipleLinks} row(s) have multiple matches in file_details (fd_tag_title + hl_artist_key); this is allowed but may indicate duplicate file_details rows`
          : null
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const visibleRowCount = Array.isArray(visibleRowPositions) ? visibleRowPositions.length : 0;
  const workflowPolicy = getEditWorkflowPolicy({
    runId,
    busy,
    alreadyExported,
    exportStatusLoading,
    exportBlocked,
    exportBlockedReason,
    artistSpellingDone,
    visibleRowCount,
    duplicateImportCount,
    findCmdCount,
    blockedDiscogsExportCount
  });
  const actionState = (key) => workflowPolicy.actions[key] || { disabled: false, reason: "", step: "view", variantHint: "available" };
  const preExportActionsDisabled = Boolean(runId) && alreadyExported;
  const preExportDisabledTitle = actionState("artistSpelling").variantHint === "after-export"
    ? actionState("artistSpelling").reason
    : "Deze actie is niet beschikbaar na export. Gebruik Correctie na export.";
  const buttonTitle = (key, fallback = "") => actionState(key).reason || fallback;
  const preExportButtonTitle = (specificTitle = "") => preExportActionsDisabled
    ? preExportDisabledTitle
    : specificTitle;

  return (
    <div className="d-flex flex-column gap-2">
      <div className="small text-muted">
        <strong>Tools</strong>
      </div>

      {preExportActionsDisabled && (
        <div className="alert alert-warning py-2 small" role="alert">
          Deze run is al geëxporteerd naar hitlijsten. Pre-export acties zijn uitgeschakeld; gebruik <strong>Correctie na export</strong> voor wijzigingen die naar hitlijsten moeten.
        </div>
      )}

      <WorkflowOverview steps={EDIT_WORKFLOW_STEPS} />

      <WorkflowStepSection title="1. Bekijken" description="Read-only acties blijven beschikbaar en wijzigen geen stagingdata.">
      <Button
        variant="outline-primary"
        disabled={actionState("refreshRows").disabled}
        title={buttonTitle("refreshRows")}
        onClick={async () => {
          try {
            setBusy(true);
            setErr(null);
            setMsg(null);
            await refreshRows();
          } catch (e) {
            setErr(e.message || String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        Refresh rows
      </Button>
      </WorkflowStepSection>

      <WorkflowStepSection title="2. Normaliseren" description="Schoon importtekst eerst op voordat correcties en matching worden uitgevoerd.">
      <Button
        variant="outline-primary"
        disabled={actionState("decodeHtml").disabled}
        title={buttonTitle("decodeHtml")}
        onClick={async () => {
          try {
            setBusy(true);
            setErr(null);
            setMsg(null);
            await decodeHtmlEntitiesForRun();
          } catch (e) {
            setErr(e.message || String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        Decode HTML entities
      </Button>

      <Button
        variant="outline-dark"
        disabled={actionState("patternDelete").disabled}
        title={buttonTitle("patternDelete")}
        onClick={async () => {
          try {
            setBusy(true);
            setErr(null);
            setMsg(null);
            await runPatternDelete({ dryRun: false });
          } catch (e) {
            setErr(e.message || String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        PatternDelete
      </Button>

      <Button
        variant="outline-info"
        disabled={actionState("patternSuggestions")?.disabled || !runId}
        title={buttonTitle("patternSuggestions", "Ontdek kandidaatpatterns uit titels en voeg geselecteerde varianten toe aan string_del_patterns")}
        onClick={async () => {
          try {
            setBusy(true);
            setErr(null);
            setMsg(null);
            await ctrl.openPatternSuggestions();
          } catch (e) {
            setErr(e.message || String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        Pattern suggesties
      </Button>

      <Button
        variant="outline-secondary"
        disabled={actionState("previewTextNormalization").disabled}
        title={buttonTitle("previewTextNormalization", "Preview van tekstnormalisatie voor alle zichtbare of gefilterde rijen")}
        onClick={async () => {
          try {
            setBusy(true);
            setErr(null);
            setMsg(null);
            await previewNormalizeVisibleRows(visibleRowPositions || []);
          } catch (e) {
            setErr(e.message || String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        Preview tekstnormalisatie
      </Button>

      <Button
        variant="outline-secondary"
        disabled={actionState("applyTextNormalization").disabled}
        title={buttonTitle("applyTextNormalization", "Normaliseert tekst voor alle zichtbare of gefilterde rijen en herberekent afgeleide velden")}
        onClick={async () => {
          try {
            setBusy(true);
            setErr(null);
            setMsg(null);
            await normalizeVisibleRows(visibleRowPositions || []);
          } catch (e) {
            setErr(e.message || String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        Normaliseer tekst (zichtbare rijen)
      </Button>

      <Button
        variant="outline-warning"
        disabled={actionState("previewEncodingRepair").disabled}
        title={buttonTitle("previewEncodingRepair", "Preview van recoverable encoding repair voor zichtbare of gefilterde rijen")}
        onClick={async () => {
          try {
            setBusy(true);
            setErr(null);
            setMsg(null);
            await previewEncodingRepairVisibleRows(visibleRowPositions || []);
          } catch (e) {
            setErr(e.message || String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        Preview encoding repair
      </Button>

      <Button
        variant="outline-warning"
        disabled={actionState("applyEncodingRepair").disabled}
        title={buttonTitle("applyEncodingRepair", "Repareert recoverable encodingproblemen voor zichtbare of gefilterde rijen")}
        onClick={async () => {
          try {
            setBusy(true);
            setErr(null);
            setMsg(null);
            await repairEncodingVisibleRows(visibleRowPositions || []);
          } catch (e) {
            setErr(e.message || String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        Repair encoding (zichtbare rijen)
      </Button>
      </WorkflowStepSection>

      <WorkflowStepSection title="3. Correcte artiest/titel" description="Bepaal correcte artiest en titel voordat verrijking, Discogs en export zinvol zijn.">
      <Button
        variant="outline-success"
        disabled={actionState("artistSpelling").disabled}
        title={buttonTitle("artistSpelling")}
        onClick={async () => {
          try {
            setBusy(true);
            setErr(null);
            setMsg(null);
            await runArtistSpelling();
          } catch (e) {
            setErr(e.message || String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        ArtistSpelling
      </Button>

      <Button
        variant="outline-warning"
        disabled={actionState("songSpelling").disabled}
        title={buttonTitle("songSpelling")}
        onClick={async () => {
          try {
            setBusy(true);
            setErr(null);
            setMsg(null);
            await runSongSpelling();
          } catch (e) {
            setErr(e.message || String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        SongSpelling
      </Button>

      <Button
        variant="outline-danger"
        disabled={actionState("repairSwapBatch").disabled}
        title={buttonTitle("repairSwapBatch", "Wisselt artiest en titel om voor alle verdachte swap-rijen in de huidige run")}
        onClick={async () => {
          try {
            setBusy(true);
            setErr(null);
            setMsg(null);
            await repairSuspectedTitleArtistSwaps();
          } catch (e) {
            setErr(e.message || String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        Herstel titel/artiest swap (batch)
      </Button>

      <Button
        variant="outline-danger"
        disabled={actionState("forceSwapVisible").disabled}
        title={buttonTitle("forceSwapVisible", "Forceert titel/artiest swap voor alle zichtbare of gefilterde rijen")}
        onClick={async () => {
          try {
            setBusy(true);
            setErr(null);
            setMsg(null);
            await forceSwapVisibleRows(visibleRowPositions || []);
          } catch (e) {
            setErr(e.message || String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        Forceer titel/artiest swap (zichtbare rijen)
      </Button>
      </WorkflowStepSection>

      <WorkflowStepSection title="4. Verrijken/controleren" description="Gebruik correcte artiest/titel voor jaarverrijking en duplicate-controles.">
      <StagingDuplicateReview
        runId={runId}
        disabled={busy || preExportActionsDisabled}
        refreshRows={refreshRows}
        setMsg={setMsg}
        setErr={setErr}
      />

      <Button
        variant="outline-info"
        disabled={actionState("previewYearEnrichment").disabled}
        title={buttonTitle("previewYearEnrichment", "Preview ontbrekende jaartallen vanuit file_details.fd_year_song_publish")}
        onClick={async () => {
          try {
            setBusy(true);
            setErr(null);
            setMsg(null);
            await previewEnrichYearsVisibleRows(visibleRowPositions);
          } catch (e) {
            setErr(e.message || String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        Preview jaarverrijking
      </Button>

      <Button
        variant="outline-danger"
        disabled={actionState("markDuplicatesSkip").disabled || duplicateImportLoading}
        title={buttonTitle("markDuplicatesSkip", "Zet duplicate importregels op Skip.")}
        onClick={async () => {
          const ok = window.confirm(`Zet ${duplicateImportCount} duplicate rij(en) op Skip? Deze songs worden dan niet geëxporteerd/geïmporteerd.`);
          if (!ok) return;
          try {
            setBusy(true);
            setErr(null);
            setMsg(null);
            await markDuplicateRowsAsSkip();
          } catch (e) {
            setErr(e.message || String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        Zet duplicates op Skip ({duplicateImportCount})
      </Button>

      {runId && duplicateImportCount > 0 && !duplicateImportLoading && (
        <div className="small text-warning mt-1">
          Duplicates: {existingDuplicateCount} bestaand in file_details, {inRunDuplicateCount} dubbel binnen deze run.
        </div>
      )}

      {runId && duplicateImportError && !duplicateImportLoading && (
        <div className="small text-warning mt-1">
          Duplicate-summary is tijdelijk niet beschikbaar: {duplicateImportError}
        </div>
      )}
      </WorkflowStepSection>

      <WorkflowStepSection title="5. Exporteren" description="Export is pas beschikbaar wanneer blocking issues opgelost zijn.">
      <Button
        variant="primary"
        disabled={actionState("exportHitlijsten").disabled}
        title={buttonTitle("exportHitlijsten")}
        onClick={async () => {
          try {
            setBusy(true);
            setErr(null);
            setMsg(null);
            // optional: do a dry-run first by calling exportHitlijsten({dryRun:true})
            await exportHitlijsten({ dryRun: false });
          } catch (e) {
            setErr(e.message || String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        Export → hitlijsten
      </Button>

      <Button
        variant="outline-secondary"
        className="ms-2"
        disabled={actionState("exportFindCmd").disabled}
        title={buttonTitle("exportFindCmd")}
        onClick={() => {
          setTargetValue("$TARGET");
          setShowFindCmd(true);
        }}
      >
        Export Find-cmd script
      </Button>

      <Button
        variant="outline-primary"
        className="ms-2"
        disabled={actionState("exportBlockedDiscogs").disabled || blockedDiscogsExportLoading}
        title={buttonTitle("exportBlockedDiscogs", "Download blocked Discogs-links als tekstbestand.")}
        onClick={() => {
          window.location.href = `/api/edit/run/${encodeURIComponent(runId)}/export-blocked-discogs-links.txt`;
        }}
      >
        Export blocked Discogs-links ({blockedDiscogsExportCount})
      </Button>
      </WorkflowStepSection>

      {runId && blockedDiscogsExportError && !blockedDiscogsExportLoading && (
        <div className="small text-warning mt-2">
          Blocked Discogs export summary is temporarily unavailable: {blockedDiscogsExportError}
        </div>
      )}

      {runId && exportStatusLoading && (
        <div className="small text-muted mt-2">
          Export status is loading in the background.
        </div>
      )}

      {runId && exportStatusError && !exportStatusLoading && (
        <div className="small text-warning mt-2">
          Export status is temporarily unavailable: {exportStatusError}
        </div>
      )}

      {runId && exportBlocked && !exportStatusLoading && (
        <div className="small text-danger mt-2">
          <div>Export blocked: {exportBlockedReason}</div>
          {firstIssue ? (
            <div className="text-muted mt-1">
              {`First issue: positie ${firstIssue.hl_positie ?? "?"}, artiest "${
                firstIssue.hl_artiest ?? ""
              }", titel "${
                firstIssue.fd_tag_title ?? firstIssue.hl_titel_song ?? ""
              }", artist_key ${firstIssue.hl_artist_key ?? "NULL"}, reason ${
                firstIssue.reasonCode
              }`}
            </div>
          ) : null}
        </div>
      )}

      {!runId && <div className="small text-muted">Select a run to enable tools.</div>}
      {runId && !artistSpellingDone && (
        <div className="small text-muted">
          Tip: run <strong>ArtistSpelling</strong> and <strong>SongSpelling</strong> before export so
          fd_tag_title is complete.
        </div>
      )}

      <Modal show={showFindCmd} onHide={() => setShowFindCmd(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Export Find-cmd script</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="small text-muted mb-2">
            This will export {findCmdCount} Find-cmd line(s) for the current run into a Unix script.
          </div>
          <Form.Group>
            <Form.Label>TARGET value</Form.Label>
            <Form.Control
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="/path/to/target"
            />
            <div className="small text-muted mt-1">
              The script will start with: <code>export TARGET=&lt;value&gt;</code>
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFindCmd(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!runId || busy || !String(targetValue || "").trim()}
            onClick={() => {
              const t = String(targetValue || "").trim();
              if (!t) return;
              setShowFindCmd(false);
              // Trigger browser download
              window.location.href = `/api/run-findcmd-script?runId=${encodeURIComponent(
                runId
              )}&target=${encodeURIComponent(t)}`;
            }}
          >
            Download .sh
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default function EditPage(props) {
  const ctrl = props?.ctrl ?? useEditController();
  return <EditMain ctrl={ctrl} />;
}

export function buildArtistTitleClipboardText(row = {}, local = {}) {
  const artist = String(
    local.as_correcte_artiest_spelling ||
      row.as_correcte_artiest_spelling ||
      local.hl_artiest ||
      row.hl_artiest ||
      ""
  ).trim();
  const title = String(
    local.fd_tag_title ||
      row.fd_tag_title ||
      local.hl_titel_song ||
      row.hl_titel_song ||
      ""
  ).trim();

  if (artist && title) return `${artist} - ${title}`;
  if (artist) return artist;
  if (title) return title;
  return "";
}


function splitDiscogsArtistTitle(title = "") {
  const value = String(title || "").trim();
  const parts = value.split(" - ");
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
  }
  return { artist: "", title: value };
}

export function buildDiscogsSelectionPayload(result = {}) {
  const normalizedType = String(result.type || "").toLowerCase();
  const split = splitDiscogsArtistTitle(result.title || "");
  const format = Array.isArray(result.format) ? result.format.filter(Boolean).join(", ") : String(result.format || "");
  const url = result.discogsUrl || (result.uri ? `https://www.discogs.com${result.uri}` : null);

  if (normalizedType === "release" || result.releaseId) {
    return {
      discogs_release_id: result.releaseId || result.id,
      discogs_release_url: url,
      discogs_release_title: split.title || result.title || null,
      discogs_release_format: format || null,
      discogs_release_country: result.country || null,
      discogs_release_year: result.year || null
    };
  }

  return {
    discogs_master_id: result.masterId || result.id,
    discogs_master_url: url,
    discogs_master_title: split.title || result.title || null,
    discogs_master_artist: split.artist || null,
    discogs_master_year: result.year || null
  };
}

export function getDiscogsResultDetailType(result = {}) {
  const type = String(result.type || "").toLowerCase();
  if (type === "master") return "master";
  if (type === "release") return "release";
  if (result.releaseId) return "release";
  if (result.masterId) return "master";
  return null;
}

export function getDiscogsResultDetailId(result = {}) {
  const type = getDiscogsResultDetailType(result);
  if (type === "master") return result.masterId || result.id || null;
  if (type === "release") return result.releaseId || result.id || null;
  return result.id || null;
}

export function getDiscogsResultViewKey(result = {}) {
  const type = getDiscogsResultDetailType(result) || String(result.type || "discogs").toLowerCase() || "discogs";
  const id = getDiscogsResultDetailId(result) || result.id || result.discogsUrl || result.resourceUrl || result.uri || result.title || "unknown";
  return `${type}:${id}`;
}

function formatDiscogsDetailList(values = []) {
  return Array.isArray(values) && values.length > 0 ? values.filter(Boolean).join(", ") : "—";
}


export function isSafeDiscogsExternalUrl(value = "") {
  const text = String(value || "").trim();
  if (!text) return false;

  try {
    const parsed = new URL(text);
    const host = parsed.hostname.toLowerCase();
    return parsed.protocol === "https:" && (host === "discogs.com" || host.endsWith(".discogs.com"));
  } catch {
    return false;
  }
}

export function resolveDiscogsTableLink(row = {}, local = {}) {
  const candidates = [
    { url: row?.discogs_release_url, label: "Discogs release" },
    { url: row?.discogs_master_url, label: "Discogs master" },
    { url: local?.hl_discogs_link || row?.hl_discogs_link, label: "Discogs" }
  ];

  for (const candidate of candidates) {
    const url = String(candidate.url || "").trim();
    if (isSafeDiscogsExternalUrl(url)) {
      return { ...candidate, url };
    }
  }

  return null;
}

function RowEditor({ row, songTypes = [], matchCount, problemInfo, reasonSummary, duplicateReasonCode, onOpenDetails, onOpenAlt, onAfterRepair, onSave, onDesiredSongTypeChange, disabled, preExportActionsDisabled = false, preExportDisabledTitle = "Deze actie is niet beschikbaar na export. Gebruik Correctie na export." }) {
  const [local, setLocal] = useState({
    fd_tag_title: row.fd_tag_title || "",
    as_correcte_artiest_spelling: row.as_correcte_artiest_spelling || "",
    hl_discogs_link: row.hl_discogs_link || "",
    hl_artist_key: row.hl_artist_key ?? "",
    fd_action: row.fd_action || "Keep",
    hl_artiest: row.hl_artiest || "",
    hl_titel_song: row.hl_titel_song || "",
    hl_jaar: row.hl_jaar ?? "",
    hl_desired_song_type_key: row.hl_desired_song_type_key ?? ""
  });
  const [showEdit, setShowEdit] = useState(false);
  const [diagBusy, setDiagBusy] = useState(false);
  const [diagErr, setDiagErr] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [repairBusy, setRepairBusy] = useState(false);
  const [swapRepairBusy, setSwapRepairBusy] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualBusy, setManualBusy] = useState(false);
  const [manualArtistSearch, setManualArtistSearch] = useState(() => row.as_correcte_artiest_spelling || row.hl_artiest || "");
  const [manualTitleSearch, setManualTitleSearch] = useState(() => row.fd_tag_title || row.hl_titel_song || "");
  const [manualCandidates, setManualCandidates] = useState([]);
  const [manualCandidateBusy, setManualCandidateBusy] = useState(false);
  const [manualOverwriteConfirmed, setManualOverwriteConfirmed] = useState(false);
  const [postExportMode, setPostExportMode] = useState(false);
  const [postExportBusy, setPostExportBusy] = useState(false);
  const [postExportArtistSearch, setPostExportArtistSearch] = useState(() => row.as_correcte_artiest_spelling || row.hl_artiest || "");
  const [postExportTitleSearch, setPostExportTitleSearch] = useState(() => row.fd_tag_title || row.hl_titel_song || "");
  const [postExportCandidates, setPostExportCandidates] = useState([]);
  const [postExportSelectedCandidate, setPostExportSelectedCandidate] = useState(null);
  const [postExportPreview, setPostExportPreview] = useState(null);
  const [postExportApplyResult, setPostExportApplyResult] = useState(null);
  const [postExportReason, setPostExportReason] = useState("");
  const [postExportConfirmComposed, setPostExportConfirmComposed] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [copyFeedbackVariant, setCopyFeedbackVariant] = useState("muted");
  const [desiredSongTypeSaving, setDesiredSongTypeSaving] = useState(false);
  const [desiredSongTypeError, setDesiredSongTypeError] = useState("");
  const [showDiscogs, setShowDiscogs] = useState(false);
  const [discogsBusy, setDiscogsBusy] = useState(false);
  const [discogsSaving, setDiscogsSaving] = useState(false);
  const [discogsErr, setDiscogsErr] = useState(null);
  const [discogsResults, setDiscogsResults] = useState([]);
  const [discogsFilters, setDiscogsFilters] = useState(createEmptyDiscogsFilters());
  const [discogsDetailBusy, setDiscogsDetailBusy] = useState(false);
  const [discogsDetailError, setDiscogsDetailError] = useState(null);
  const [discogsDetail, setDiscogsDetail] = useState(null);
  const [discogsDetailResult, setDiscogsDetailResult] = useState(null);
  const [viewedDiscogsResultKeys, setViewedDiscogsResultKeys] = useState(new Set());
  const [discogsSearchArtistInput, setDiscogsSearchArtistInput] = useState("");
  const [discogsSearchTitleInput, setDiscogsSearchTitleInput] = useState("");
  const discogsLinkInputRef = useRef(null);
  const discogsFilterOptions = useMemo(() => buildDiscogsFilterOptions(discogsResults), [discogsResults]);
  const visibleDiscogsResults = useMemo(() => applyDiscogsFilters(discogsResults, discogsFilters), [discogsResults, discogsFilters]);
  const discogsDefaultSearchArtist = String(local.as_correcte_artiest_spelling || local.hl_artiest || row.as_correcte_artiest_spelling || row.hl_artiest || "").trim();
  const discogsDefaultSearchTitle = String(local.fd_tag_title || local.hl_titel_song || row.fd_tag_title || row.hl_titel_song || "").trim();
  const discogsRunContext = [row.hl_hitlijst || row.hitlijstnaam || row.ir_hitlijst, row.hl_uitzendjaar || row.ir_uitzendjaar, row.omroep_naam || row.omroepnaam || row.omroep_key ? `omroep ${row.omroep_naam || row.omroepnaam || row.omroep_key}` : ""]
    .filter(Boolean)
    .join(" · ");

  useEffect(() => {
    setLocal({
      fd_tag_title: row.fd_tag_title || "",
      as_correcte_artiest_spelling: row.as_correcte_artiest_spelling || "",
      hl_discogs_link: row.hl_discogs_link || "",
      hl_artist_key: row.hl_artist_key ?? "",
      fd_action: row.fd_action || "Keep",
      hl_artiest: row.hl_artiest || "",
      hl_titel_song: row.hl_titel_song || "",
      hl_jaar: row.hl_jaar ?? "",
      hl_desired_song_type_key: row.hl_desired_song_type_key ?? ""
    });
    setCopyFeedback("");
    setCopyFeedbackVariant("muted");
    setDesiredSongTypeSaving(false);
    setDesiredSongTypeError("");
    setDiscogsErr(null);
    setDiscogsResults([]);
    setDiscogsFilters(createEmptyDiscogsFilters());
    setDiscogsDetail(null);
    setDiscogsDetailResult(null);
    setDiscogsDetailError(null);
    setViewedDiscogsResultKeys(new Set());
    setDiscogsSearchArtistInput(String(row.as_correcte_artiest_spelling || row.hl_artiest || "").trim());
    setDiscogsSearchTitleInput(String(row.fd_tag_title || row.hl_titel_song || "").trim());
    setManualArtistSearch(row.as_correcte_artiest_spelling || row.hl_artiest || "");
    setManualTitleSearch(row.fd_tag_title || row.hl_titel_song || "");
    setManualCandidates([]);
    setManualOverwriteConfirmed(false);
    setPostExportArtistSearch(row.as_correcte_artiest_spelling || row.hl_artiest || "");
    setPostExportTitleSearch(row.fd_tag_title || row.hl_titel_song || "");
    setPostExportCandidates([]);
    setPostExportSelectedCandidate(null);
    setPostExportPreview(null);
    setPostExportApplyResult(null);
    setPostExportReason("");
    setPostExportConfirmComposed(false);
  }, [row]);

  const clipboardText = buildArtistTitleClipboardText(row, local);
  const copyTooltip = clipboardText
    ? `Klik om te kopiëren: ${clipboardText}`
    : "Niet genoeg gegevens om artiest/titel te kopiëren";

  async function copyArtistTitleToClipboard() {
    const text = buildArtistTitleClipboardText(row, local);
    if (!text) {
      setCopyFeedbackVariant("danger");
      setCopyFeedback("Niet genoeg gegevens om te kopiëren.");
      return;
    }

    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("Clipboard API is niet beschikbaar in deze browser.");
      }
      await navigator.clipboard.writeText(text);
      setCopyFeedbackVariant("success");
      setCopyFeedback(`Gekopieerd: ${text}`);
      discogsLinkInputRef.current?.focus();
    } catch (error) {
      setCopyFeedbackVariant("danger");
      setCopyFeedback(error?.message || "Kopiëren naar klembord is mislukt.");
    }
  }

  const isFound = typeof matchCount === "number" && matchCount > 0;
  const isNotFound = typeof matchCount === "number" && matchCount === 0;
  const hasBlockingSignal =
    String(local.fd_tag_title || "").trim() === "" ||
    local.hl_artist_key === "" ||
    local.hl_artist_key == null ||
    isNotFound;

  const desiredSongTypeValue = local.hl_desired_song_type_key == null ? "" : String(local.hl_desired_song_type_key);

  async function handleDesiredSongTypeChange(rawValue) {
    const nextValue = rawValue === "" ? "" : Number(rawValue);
    const previousValue = local.hl_desired_song_type_key ?? "";

    setLocal((state) => ({
      ...state,
      hl_desired_song_type_key: nextValue
    }));
    setDesiredSongTypeError("");

    if (!onDesiredSongTypeChange) return;

    setDesiredSongTypeSaving(true);
    try {
      await onDesiredSongTypeChange(nextValue === "" ? null : nextValue);
    } catch (error) {
      setLocal((state) => ({
        ...state,
        hl_desired_song_type_key: previousValue
      }));
      setDesiredSongTypeError(error?.message || String(error));
    } finally {
      setDesiredSongTypeSaving(false);
    }
  }

  async function openEditModal(options = {}) {
    setShowEdit(true);
    setDiagBusy(true);
    setDiagErr(null);
    setManualMode(false);
    if (options.postExportMode) {
      setPostExportMode(true);
    }
    try {
      const r = await fetch(`/api/edit/staging/${encodeURIComponent(row.hl_import_run_id)}/${encodeURIComponent(row.hl_positie)}/diagnostics`);
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setDiagnostics(data);
    } catch (e) {
      setDiagErr(e.message || String(e));
      setDiagnostics(null);
    } finally {
      setDiagBusy(false);
    }
  }

  async function openPostExportCorrectionModal() {
    await openEditModal({ postExportMode: true });
  }

  async function repairArtistRelation() {
    setRepairBusy(true);
    setDiagErr(null);
    try {
      const r = await fetch(
        `/api/edit/staging/${encodeURIComponent(row.hl_import_run_id)}/${encodeURIComponent(row.hl_positie)}/repair-artist-relation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        }
      );
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setDiagnostics(data.diagnostics || null);
      setLocal((s) => ({
        ...s,
        hl_artist_key: data.newHlArtistKey ?? s.hl_artist_key,
        as_correcte_artiest_spelling:
          data?.diagnostics?.artistRelation?.canonicalArtistName ?? s.as_correcte_artiest_spelling
      }));
      await onAfterRepair?.(`Artist relation repaired for positie ${row.hl_positie}.`);
    } catch (e) {
      setDiagErr(e.message || String(e));
    } finally {
      setRepairBusy(false);
    }
  }

  async function repairTitleArtistSwap() {
    setSwapRepairBusy(true);
    setDiagErr(null);
    try {
      const r = await fetch(
        `/api/edit/staging/${encodeURIComponent(row.hl_import_run_id)}/${encodeURIComponent(row.hl_positie)}/repair-title-artist-swap`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        }
      );
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setDiagnostics(data.diagnostics || null);
      setLocal((s) => ({
        ...s,
        hl_artiest: data?.diagnostics?.row?.hlArtiest ?? s.hl_artiest,
        hl_titel_song: data?.diagnostics?.row?.hlTitelSong ?? s.hl_titel_song,
        fd_tag_title: data?.diagnostics?.row?.fdTagTitle ?? s.fd_tag_title,
        hl_artist_key: data?.diagnostics?.row?.hlArtistKey ?? "",
        as_correcte_artiest_spelling:
          data?.diagnostics?.artistRelation?.canonicalArtistName ?? ""
      }));
      await onAfterRepair?.(`Titel/artiest omgewisseld hersteld voor positie ${row.hl_positie}.`);
      setShowEdit(false);
    } catch (e) {
      setDiagErr(e.message || String(e));
    } finally {
      setSwapRepairBusy(false);
    }
  }

  async function searchManualRepairCandidates() {
    setManualCandidateBusy(true);
    setDiagErr(null);
    try {
      const artistTerm = String(manualArtistSearch || "").trim();
      const titleTerm = String(manualTitleSearch || "").trim();
      const qs = new URLSearchParams();
      if (artistTerm) qs.set("artist", artistTerm);
      if (titleTerm) qs.set("title", titleTerm);
      qs.set("limit", "25");
      const r = await fetch(`/api/edit/manual-repair-candidates?${qs.toString()}`);
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setManualCandidates(Array.isArray(data.candidates) ? data.candidates : []);
    } catch (e) {
      setManualCandidates([]);
      setDiagErr(e.message || String(e));
    } finally {
      setManualCandidateBusy(false);
    }
  }

  async function applyManualFileDetailsCandidate(candidate) {
    setManualBusy(true);
    setDiagErr(null);
    try {
      const r = await fetch(
        `/api/edit/staging/${encodeURIComponent(row.hl_import_run_id)}/${encodeURIComponent(row.hl_positie)}/manual-file-details-repair`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fd_key: candidate.fd_key })
        }
      );
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setDiagnostics(data.diagnostics || null);
      setLocal((s) => ({
        ...s,
        hl_artiest: data?.diagnostics?.row?.hlArtiest ?? candidate.canonical_artist_name ?? candidate.fd_correct_artist ?? s.hl_artiest,
        hl_titel_song: data?.diagnostics?.row?.hlTitelSong ?? candidate.fd_tag_title ?? s.hl_titel_song,
        fd_tag_title: data?.diagnostics?.row?.fdTagTitle ?? candidate.fd_tag_title ?? s.fd_tag_title,
        hl_artist_key: data?.diagnostics?.row?.hlArtistKey ?? candidate.fd_artist_key ?? "",
        as_correcte_artiest_spelling: data?.diagnostics?.artistRelation?.canonicalArtistName ?? candidate.canonical_artist_name ?? candidate.fd_correct_artist ?? ""
      }));
      await onAfterRepair?.(`Handmatig herstel vanuit file_details opgeslagen voor positie ${row.hl_positie}.`);
      setManualMode(false);
      setManualCandidates([]);
    } catch (e) {
      setDiagErr(e.message || String(e));
    } finally {
      setManualBusy(false);
    }
  }

  async function searchPostExportCandidates() {
    setPostExportBusy(true);
    setDiagErr(null);
    setPostExportPreview(null);
    setPostExportApplyResult(null);
    setPostExportSelectedCandidate(null);
    try {
      const artistTerm = String(postExportArtistSearch || "").trim();
      const titleTerm = String(postExportTitleSearch || "").trim();
      const qs = new URLSearchParams();
      if (artistTerm) qs.set("artist", artistTerm);
      if (titleTerm) qs.set("title", titleTerm);
      qs.set("limit", "25");
      const r = await fetch(`/api/edit/manual-repair-candidates?${qs.toString()}`);
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setPostExportCandidates(Array.isArray(data.candidates) ? data.candidates : []);
    } catch (e) {
      setPostExportCandidates([]);
      setDiagErr(e.message || String(e));
    } finally {
      setPostExportBusy(false);
    }
  }

  async function previewPostExportCorrection(candidate) {
    setPostExportBusy(true);
    setDiagErr(null);
    setPostExportSelectedCandidate(candidate);
    setPostExportApplyResult(null);
    try {
      const r = await fetch(
        `/api/edit/staging/${encodeURIComponent(row.hl_import_run_id)}/${encodeURIComponent(row.hl_positie)}/post-export-correction/preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fd_key: candidate.fd_key, reason: postExportReason })
        }
      );
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
      setPostExportPreview(data);
      setPostExportConfirmComposed(false);
    } catch (e) {
      setPostExportPreview(null);
      setDiagErr(e.message || String(e));
    } finally {
      setPostExportBusy(false);
    }
  }

  async function applyPostExportCorrectionFromPreview() {
    if (!postExportSelectedCandidate) return;
    setPostExportBusy(true);
    setDiagErr(null);
    try {
      const r = await fetch(
        `/api/edit/staging/${encodeURIComponent(row.hl_import_run_id)}/${encodeURIComponent(row.hl_positie)}/post-export-correction/apply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fd_key: postExportSelectedCandidate.fd_key,
            reason: postExportReason,
            confirmComposedTextOnly: postExportConfirmComposed
          })
        }
      );
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
      setDiagnostics(data.diagnostics || null);
      setLocal((state) => ({
        ...state,
        fd_tag_title: data?.preview?.newValues?.correct_title ?? postExportSelectedCandidate.fd_tag_title ?? state.fd_tag_title,
        hl_artist_key: data?.preview?.newValues?.artist_key ?? postExportSelectedCandidate.fd_artist_key ?? state.hl_artist_key,
        as_correcte_artiest_spelling: data?.preview?.newValues?.correct_artist ?? postExportSelectedCandidate.canonical_artist_name ?? postExportSelectedCandidate.fd_correct_artist ?? state.as_correcte_artiest_spelling
      }));
      setPostExportApplyResult(data);
      await onAfterRepair?.(
        `Correctie na export toegepast voor positie ${row.hl_positie}: staging bijgewerkt, hitlijsten bijgewerkt: ${data?.hitlijstenUpdatedCount ?? data?.hitlijstenUpdated ?? 0}.`
      );
    } catch (e) {
      setDiagErr(e.message || String(e));
    } finally {
      setPostExportBusy(false);
    }
  }

  async function saveManualCorrection() {
    setManualBusy(true);
    setDiagErr(null);
    try {
      const r = await fetch(
        `/api/edit/staging/${encodeURIComponent(row.hl_import_run_id)}/${encodeURIComponent(row.hl_positie)}/manual-correction`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hl_artiest: local.hl_artiest,
            hl_titel_song: local.hl_titel_song,
            hl_jaar: local.hl_jaar === "" ? null : Number(local.hl_jaar),
            hl_discogs_link: local.hl_discogs_link,
            overwriteConfirmed: manualOverwriteConfirmed
          })
        }
      );
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setDiagnostics(data.diagnostics || null);
      setLocal((s) => ({
        ...s,
        fd_tag_title: data?.diagnostics?.row?.fdTagTitle ?? s.hl_titel_song,
        hl_artist_key: data?.diagnostics?.row?.hlArtistKey ?? "",
        as_correcte_artiest_spelling: data?.diagnostics?.artistRelation?.canonicalArtistName ?? ""
      }));
      await onAfterRepair?.(`Vrije overwrite opgeslagen en herberekend voor positie ${row.hl_positie}.`);
      setManualMode(false);
      setManualOverwriteConfirmed(false);
    } catch (e) {
      setDiagErr(e.message || String(e));
    } finally {
      setManualBusy(false);
    }
  }

  async function searchDiscogsForRow() {
    const artist = String(discogsSearchArtistInput || "").trim();
    const title = String(discogsSearchTitleInput || "").trim();

    if (!artist && !title) {
      setDiscogsErr("Geen artiest of titel beschikbaar voor Discogs zoekopdracht.");
      setDiscogsResults([]);
      setDiscogsFilters(createEmptyDiscogsFilters());
      setDiscogsDetail(null);
      setDiscogsDetailResult(null);
      return;
    }

    setDiscogsBusy(true);
    setDiscogsErr(null);
    try {
      const qs = new URLSearchParams();
      if (artist) qs.set("artist", artist);
      if (title) qs.set("title", title);
      qs.set("perPage", "25");

      const r = await fetch(`/api/discogs/search?${qs.toString()}`);
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setDiscogsResults(Array.isArray(data.results) ? data.results : []);
      setDiscogsFilters(createEmptyDiscogsFilters());
      setDiscogsDetail(null);
      setDiscogsDetailResult(null);
      setDiscogsDetailError(null);
    } catch (e) {
      setDiscogsResults([]);
      setDiscogsFilters(createEmptyDiscogsFilters());
      setDiscogsDetail(null);
      setDiscogsDetailResult(null);
      setDiscogsErr(e?.message || String(e));
    } finally {
      setDiscogsBusy(false);
    }
  }

  function openDiscogsModal() {
    setDiscogsSearchArtistInput(discogsDefaultSearchArtist);
    setDiscogsSearchTitleInput(discogsDefaultSearchTitle);
    setDiscogsErr(null);
    setDiscogsResults([]);
    setDiscogsFilters(createEmptyDiscogsFilters());
    setDiscogsDetail(null);
    setDiscogsDetailResult(null);
    setDiscogsDetailError(null);
    setShowDiscogs(true);
  }


  async function openDiscogsDetails(result) {
    const detailType = getDiscogsResultDetailType(result);
    const detailId = getDiscogsResultDetailId(result);
    if (!detailType || !detailId) {
      setDiscogsDetailError("Discogs details kunnen niet worden opgehaald: type of id ontbreekt.");
      return;
    }

    setDiscogsDetailBusy(true);
    setDiscogsDetailError(null);
    setDiscogsDetail(null);
    setDiscogsDetailResult(result);
    try {
      const r = await fetch(`/api/discogs/details/${encodeURIComponent(detailType)}/${encodeURIComponent(detailId)}`);
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setDiscogsDetail(data.detail || null);
      setViewedDiscogsResultKeys((current) => {
        const next = new Set(current);
        next.add(getDiscogsResultViewKey(result));
        return next;
      });
    } catch (e) {
      setDiscogsDetailError(e?.message || String(e));
    } finally {
      setDiscogsDetailBusy(false);
    }
  }

  function closeDiscogsDetails() {
    setDiscogsDetail(null);
    setDiscogsDetailResult(null);
    setDiscogsDetailError(null);
  }

  async function selectDiscogsResult(result) {
    setDiscogsSaving(true);
    setDiscogsErr(null);
    try {
      const payload = buildDiscogsSelectionPayload(result);
      const r = await fetch(
        `/api/edit/staging/${encodeURIComponent(row.hl_import_run_id)}/${encodeURIComponent(row.hl_positie)}/discogs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      const nextLink = data?.row?.hl_discogs_link || data?.hl_discogs_link || payload.discogs_master_url || payload.discogs_release_url || local.hl_discogs_link;
      setLocal((state) => ({ ...state, hl_discogs_link: nextLink || "" }));
      setShowDiscogs(false);
      await onAfterRepair?.(`Discogs selectie opgeslagen voor positie ${row.hl_positie}.`);
    } catch (e) {
      setDiscogsErr(e?.message || String(e));
    } finally {
      setDiscogsSaving(false);
    }
  }

  const statusVariant =
    diagnostics?.status === "blocked"
      ? "danger"
      : diagnostics?.status === "warning"
      ? "warning"
      : "success";

  const stagingMutationDisabled = disabled || preExportActionsDisabled;
  const stagingMutationTitle = preExportActionsDisabled ? preExportDisabledTitle : undefined;
  const discogsTableLink = resolveDiscogsTableLink(row, local);

  return (
    <>
      <tr>
        <td>
          <div className="d-flex flex-column gap-1">
            <Badge bg={problemInfo?.badgeVariant || (problemInfo?.severity === "blocker" ? "danger" : problemInfo?.severity === "warning" ? "warning" : "success")}>
              {problemInfo?.badgeText || (problemInfo?.severity === "blocker" ? "Blocked" : problemInfo?.severity === "warning" ? "Warning" : "Ready")}
            </Badge>
            {duplicateReasonCode ? (
              <Badge bg="warning" text="dark" title={formatReasonCode(duplicateReasonCode)}>Duplicate</Badge>
            ) : null}
            {Array.isArray(problemInfo?.reasonBadges) && problemInfo.reasonBadges.length > 0 ? (
              <div className="d-flex flex-wrap gap-1 mt-1">
                {problemInfo.reasonBadges.slice(0, 2).map((reason) => (
                  <Badge key={reason.reasonCode} bg="light" text="dark" title={reason.description}>{reason.label}</Badge>
                ))}
                {problemInfo.reasonBadges.length > 2 ? (
                  <Badge bg="secondary" title={problemInfo.reasonBadges.map((item) => item.label).join(", ")}>+{problemInfo.reasonBadges.length - 2}</Badge>
                ) : null}
              </div>
            ) : Array.isArray(reasonSummary) && reasonSummary.length > 0 ? (
              <div className="small text-muted" title={reasonSummary.join(", ")}>
                {reasonSummary.map(formatReasonCode).join(", ")}
              </div>
            ) : null}
          </div>
        </td>

        <td className="text-center">
          {problemInfo?.severity ? (
            <span style={{ color: problemInfo?.iconColor || "green" }} title={problemInfo?.primaryReasonLabel || "Status"}>
              <i className={problemInfo?.iconClass || "bi bi-check-square-fill"} />
            </span>
          ) : matchCount == null ? (
            <span className="text-muted" title="Status loading…">
              <i className="bi bi-dash-square" />
            </span>
          ) : null}
        </td>

        <td>{row.hl_positie}</td>
        <td>{row.hl_artiest}</td>
        <td>{row.hl_titel_song}</td>
        <td>{row.hl_jaar}</td>

        <td>
          <Form.Control size="sm" value={local.fd_tag_title} disabled readOnly />
        </td>

        <td>
          <div className="d-flex flex-column gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline-secondary"
              className="w-100 text-start text-truncate"
              title={copyTooltip}
              aria-label={copyTooltip}
              disabled={disabled || !clipboardText}
              onClick={copyArtistTitleToClipboard}
            >
              <span>{local.as_correcte_artiest_spelling || local.hl_artiest || "—"}</span>
              <i className="bi bi-clipboard ms-2" aria-hidden="true" />
            </Button>
            {copyFeedback ? (
              <div className={`small text-${copyFeedbackVariant}`} role="status">{copyFeedback}</div>
            ) : null}
          </div>
        </td>

        <td>
          <Form.Select
            size="sm"
            value={desiredSongTypeValue}
            aria-label={`Gewenste versie voor positie ${row.hl_positie}`}
            disabled={stagingMutationDisabled || desiredSongTypeSaving}
            title={stagingMutationDisabled ? stagingMutationTitle : "Kies de gewenste versie/song type uit song_types. De keuze wordt direct opgeslagen."}
            onChange={(e) => handleDesiredSongTypeChange(e.target.value)}
          >
            <option value="">-- geen versie gekozen --</option>
            {songTypes.map((type) => (
              <option key={type.st_song_type_key} value={String(type.st_song_type_key)}>
                {type.display_name || type.st_song_type_desc || type.st_song_type || `Song type ${type.st_song_type_key}`}
              </option>
            ))}
          </Form.Select>
          {desiredSongTypeSaving ? (
            <div className="small text-muted mt-1" role="status">Versie opslaan…</div>
          ) : null}
          {desiredSongTypeError ? (
            <div className="small text-danger mt-1" role="alert">{desiredSongTypeError}</div>
          ) : null}
        </td>

        <td>
          <Badge bg={normalizeLower(local.fd_action) === "skip" ? "secondary" : normalizeLower(local.fd_action) === "delete" ? "danger" : "success"}>
            {local.fd_action || "Keep"}
          </Badge>
        </td>

        <td>
          <div className="d-flex flex-column gap-1">
            <Form.Control
              ref={discogsLinkInputRef}
              size="sm"
              value={local.hl_discogs_link}
              disabled={stagingMutationDisabled}
              aria-label={`Discogs link voor positie ${row.hl_positie}`}
              onChange={(e) => setLocal((s) => ({ ...s, hl_discogs_link: e.target.value }))}
            />
            {discogsTableLink ? (
              <a
                href={discogsTableLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="small"
                aria-label={`${discogsTableLink.label} openen voor positie ${row.hl_positie}`}
              >
                {discogsTableLink.label} openen
              </a>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline-primary"
              disabled={stagingMutationDisabled || discogsBusy}
              onClick={openDiscogsModal}
            >
              {discogsBusy ? "Zoeken…" : "Zoek Discogs"}
            </Button>
          </div>
        </td>

        <td>
          <Form.Control size="sm" value={row.hl_find_cmd || ""} disabled readOnly />
        </td>

        <td className="d-flex gap-2">
          {hasBlockingSignal && (
            <Button size="sm" variant="outline-danger" disabled={stagingMutationDisabled} title={stagingMutationTitle} onClick={openEditModal}>
              Edit
            </Button>
          )}

          <Button
            size="sm"
            variant="outline-warning"
            disabled={disabled}
            onClick={openPostExportCorrectionModal}
          >
            Correctie
          </Button>

          {onOpenAlt && (
            <Button size="sm" variant="outline-primary" disabled={stagingMutationDisabled} title={stagingMutationTitle} onClick={onOpenAlt}>
              AltSpelling
            </Button>
          )}

          <Button
            size="sm"
            variant="secondary"
            disabled={stagingMutationDisabled}
            title={stagingMutationTitle}
            onClick={() =>
              onSave({
                hl_discogs_link: local.hl_discogs_link,
                hl_desired_song_type_key: local.hl_desired_song_type_key === "" ? null : local.hl_desired_song_type_key
              })
            }
          >
            Save
          </Button>
        </td>
      </tr>

      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit row {row.hl_positie}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {preExportActionsDisabled ? (
            <Alert variant="warning" role="alert">
              Deze run is al geëxporteerd. Staging-only herstelacties zijn uitgeschakeld; gebruik <strong>Correctie na export</strong>.
            </Alert>
          ) : null}
          {diagErr ? <Alert variant="danger">{diagErr}</Alert> : null}
          {diagBusy ? (
            <Spinner />
          ) : diagnostics ? (
            <div className="d-flex flex-column gap-3">
              <div>
                <Badge bg={statusVariant}>{diagnostics.status}</Badge>
                <div className="small text-muted mt-2">Reason: {diagnostics.reasonCode || "OK"}</div>
              </div>

              <Alert variant={diagnostics.status === "blocked" ? "danger" : diagnostics.status === "warning" ? "warning" : "success"} className="mb-0">
                <div><strong>Status:</strong> {diagnostics.status === "blocked" ? "Export blocked" : diagnostics.status === "warning" ? "Export allowed with warning" : "Ready for export"}</div>
                <div className="small mt-1"><strong>Hoofdreden:</strong> {problemInfo?.primaryReasonLabel || getReasonUi(diagnostics.reasonCode || "OK").label}</div>
                <div className="small mt-1">{problemInfo?.primaryReasonDescription || getReasonUi(diagnostics.reasonCode || "OK").description}</div>
                <div className="small mt-1 text-muted">Wat moet ik doen? {problemInfo?.primaryReasonHint || getReasonUi(diagnostics.reasonCode || "OK").hint}</div>
              </Alert>

              {Array.isArray(problemInfo?.reasonBadges) && problemInfo.reasonBadges.length > 0 ? (
                <div className="border rounded p-3 bg-white">
                  <strong className="d-block mb-2">Wat is er fout?</strong>
                  <div className="d-flex flex-column gap-2">
                    {problemInfo.reasonBadges.map((reason) => (
                      <div key={reason.reasonCode} className="border rounded p-2">
                        <div className="fw-semibold">{reason.label}</div>
                        <div className="small">{reason.description}</div>
                        <div className="small text-muted">Actie: {reason.hint}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <div className="small text-muted mb-1"><strong>Bronvelden in staging</strong></div>
                <div><strong>Artiest uit staging:</strong> {diagnostics.row.hlArtiest || "-"}</div>
                <div><strong>Titel uit staging:</strong> {diagnostics.row.hlTitelSong || "-"}</div>
                <div><strong>Resolved fd_tag_title:</strong> {diagnostics.row.fdTagTitle || "-"}</div>
                <div><strong>Huidige artist key:</strong> {diagnostics.row.hlArtistKey ?? "-"}</div>
              </div>

              {diagnostics?.encodingHints?.hasEncodingDamage ? (
                <Alert variant={diagnostics.encodingHints.hasReplacementCharDamage ? "danger" : "warning"} className="mb-0">
                  <div><strong>Encoding-schade vermoed:</strong> de stagingtekst bevat beschadigde of verkeerd gedecodeerde tekens.</div>
                  <div className="small mt-1">
                    {diagnostics.encodingHints.hasReplacementCharDamage
                      ? "Replacement characters (�) gevonden. Herstel is meestal handmatig nodig."
                      : "Herstelbare mojibake gedetecteerd. Gebruik encoding repair of handmatige correctie."}
                  </div>
                </Alert>
              ) : null}

              {diagnostics?.swapHints?.suspectedTitleArtistSwap ? (
                <Alert variant="warning" className="mb-0">
                  <div><strong>Waarschijnlijk omgewisseld:</strong> artiest en songtitel lijken verwisseld te zijn.</div>
                  <div className="small mt-1">
                    Titel-match op huidige artiestwaarde: {diagnostics.swapHints.swappedTitleMatchCount}
                    {" · "}
                    artiesten_spelling op huidige titelwaarde: {diagnostics.swapHints.swappedArtiestenSpellingExists ? "bestaat" : "ontbreekt"}
                    {diagnostics.swapHints.swappedCanonicalArtistName ? ` · vermoedelijke artiest: ${diagnostics.swapHints.swappedCanonicalArtistName}` : ""}
                  </div>
                </Alert>
              ) : null}

              <div>
                <div className="small text-muted mb-1"><strong>Afgeleide waarden / automatisch bepaald</strong></div>
                <div><strong>Artiesten_spelling:</strong> {diagnostics.artistRelation.artiestenSpellingExists ? "bestaat" : "ontbreekt"}</div>
                <div><strong>Artist:</strong> {diagnostics.artistRelation.artistExists ? "bestaat" : "ontbreekt"}</div>
                <div><strong>Canonical artist:</strong> {diagnostics.artistRelation.canonicalArtistName || "-"}</div>
                <div><strong>as_artist_key:</strong> {diagnostics.artistRelation.asArtistKey ?? "-"}</div>
              </div>

              <div>
                <div><strong>file_details title matches:</strong> {diagnostics.fileDetailsCheck.titleMatchCount}</div>
                <div><strong>file_details artist-key matches:</strong> {diagnostics.fileDetailsCheck.artistKeyMatchCount}</div>
                <div><strong>file_details combined matches:</strong> {diagnostics.fileDetailsCheck.combinedMatchCount}</div>
              </div>

              <div className="border rounded p-3 bg-light">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Handmatig herstellen</strong>
                  <Button size="sm" variant={manualMode ? "secondary" : "outline-secondary"} disabled={preExportActionsDisabled} title={stagingMutationTitle} onClick={() => setManualMode((value) => !value)}>
                    {manualMode ? "Annuleer handmatige modus" : "Handmatig herstellen"}
                  </Button>
                </div>
                <div className="small text-muted mb-2">
                  Herstel bij voorkeur door een bestaande file_details-regel te kiezen. Vrije overwrite is alleen voor bewuste uitzonderingen.
                </div>
                {manualMode ? (
                  <div className="d-flex flex-column gap-3">
                    <div className="border rounded p-2 bg-white">
                      <div className="row g-2 align-items-end">
                        <Form.Group className="col-md-5" controlId={`manual-fd-artist-search-${row.hl_positie}`}>
                          <Form.Label>Artiest zoeken</Form.Label>
                          <Form.Control
                            value={manualArtistSearch}
                            disabled={manualCandidateBusy || manualBusy || preExportActionsDisabled}
                            onChange={(e) => setManualArtistSearch(e.target.value)}
                            placeholder="artiest…"
                          />
                        </Form.Group>
                        <Form.Group className="col-md-5" controlId={`manual-fd-title-search-${row.hl_positie}`}>
                          <Form.Label>Titel zoeken</Form.Label>
                          <Form.Control
                            value={manualTitleSearch}
                            disabled={manualCandidateBusy || manualBusy || preExportActionsDisabled}
                            onChange={(e) => setManualTitleSearch(e.target.value)}
                            placeholder="titel…"
                          />
                        </Form.Group>
                        <div className="col-md-2 d-grid">
                          <Button
                            variant="outline-primary"
                            disabled={manualCandidateBusy || manualBusy || preExportActionsDisabled || (!manualArtistSearch.trim() && !manualTitleSearch.trim())}
                            onClick={searchManualRepairCandidates}
                          >
                            {manualCandidateBusy ? "Zoeken…" : "Zoek"}
                          </Button>
                        </div>
                      </div>
                      <div className="small text-muted mt-1">
                        Gebruik bij voorkeur artiest en titel apart. Minimaal één zoekveld is verplicht.
                      </div>
                      {manualCandidates.length > 0 ? (
                        <div className="table-responsive mt-2">
                          <Table size="sm" bordered hover className="mb-0">
                            <thead>
                              <tr>
                                <th>Match</th>
                                <th>Artiest</th>
                                <th>Titel</th>
                                <th>Jaar</th>
                                <th>Type</th>
                                <th>Duur</th>
                                <th>Bestand</th>
                                <th style={{ width: 95 }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {manualCandidates.map((candidate) => (
                                <tr key={candidate.fd_key}>
                                  <td><Badge bg={candidate.match_type === "Exact" ? "success" : candidate.match_type === "Sterke match" ? "primary" : "secondary"}>{candidate.match_type || "Gedeeltelijk"}</Badge></td>
                                  <td>{candidate.canonical_artist_name || candidate.fd_correct_artist || "—"}</td>
                                  <td>{candidate.fd_tag_title || "—"}</td>
                                  <td>{candidate.fd_year_song_publish || candidate.fd_year_song_version || ""}</td>
                                  <td>{candidate.st_song_type || candidate.st_song_type_desc || ""}</td>
                                  <td className="small text-muted">{candidate.fd_duration || ""}</td>
                                  <td className="small text-muted text-truncate" style={{ maxWidth: 260 }}>{candidate.fd_file_name || ""}</td>
                                  <td>
                                    <Button size="sm" variant="success" disabled={manualBusy || preExportActionsDisabled} title={stagingMutationTitle} onClick={() => applyManualFileDetailsCandidate(candidate)}>
                                      Gebruik
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      ) : null}
                    </div>

                    <div className="border rounded p-2 bg-white">
                      <div className="fw-semibold mb-1">Vrije overwrite</div>
                      <div className="small text-muted mb-2">
                        Gebruik dit alleen als de juiste artiest/titel niet in file_details staat. Deze route kan inconsistentie veroorzaken.
                      </div>
                      <div className="row g-2">
                        <Form.Group className="col-md-6" controlId={`manual-artist-${row.hl_positie}`}>
                          <Form.Label>Artiest uit staging</Form.Label>
                          <Form.Control value={local.hl_artiest} disabled={manualBusy || preExportActionsDisabled} onChange={(e) => setLocal((s) => ({ ...s, hl_artiest: e.target.value }))} />
                        </Form.Group>
                        <Form.Group className="col-md-6" controlId={`manual-title-${row.hl_positie}`}>
                          <Form.Label>Titel uit staging</Form.Label>
                          <Form.Control value={local.hl_titel_song} disabled={manualBusy || preExportActionsDisabled} onChange={(e) => setLocal((s) => ({ ...s, hl_titel_song: e.target.value }))} />
                        </Form.Group>
                        <Form.Group className="col-md-4" controlId={`manual-year-${row.hl_positie}`}>
                          <Form.Label>Jaar</Form.Label>
                          <Form.Control type="number" value={local.hl_jaar} disabled={manualBusy || preExportActionsDisabled} onChange={(e) => setLocal((s) => ({ ...s, hl_jaar: e.target.value }))} />
                        </Form.Group>
                        <Form.Group className="col-md-8" controlId={`manual-discogs-${row.hl_positie}`}>
                          <Form.Label>Discogs Link</Form.Label>
                          <Form.Control value={local.hl_discogs_link} disabled={manualBusy || preExportActionsDisabled} onChange={(e) => setLocal((s) => ({ ...s, hl_discogs_link: e.target.value }))} />
                        </Form.Group>
                      </div>
                      <Form.Check
                        className="mt-2"
                        id={`manual-overwrite-confirm-${row.hl_positie}`}
                        label="Ik wil bewust een vrije overwrite gebruiken"
                        checked={manualOverwriteConfirmed}
                        disabled={manualBusy}
                        onChange={(e) => setManualOverwriteConfirmed(e.target.checked)}
                      />
                      <div className="d-flex gap-2 mt-3">
                        <Button variant="warning" disabled={manualBusy || repairBusy || swapRepairBusy || preExportActionsDisabled || !manualOverwriteConfirmed} title={stagingMutationTitle} onClick={saveManualCorrection}>
                          {manualBusy ? "Opslaan…" : "Vrije overwrite opslaan"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border rounded p-3 bg-light">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Correctie na export</strong>
                  <Button size="sm" variant={postExportMode ? "secondary" : "outline-secondary"} onClick={() => setPostExportMode((value) => !value)}>
                    {postExportMode ? "Annuleer correctie na export" : "Correctie na export"}
                  </Button>
                </div>
                <div className="small text-muted mb-2">
                  Wijzig alleen de correcte artiest en correcte titel. Kies hiervoor een bestaande file_details-regel; oorspronkelijke lijstwaarden en samenstelkoppeling blijven ongewijzigd.
                </div>
                {postExportMode ? (
                  <div className="d-flex flex-column gap-3">
                    <div className="row g-2 align-items-end">
                      <Form.Group className="col-md-5" controlId={`post-export-artist-search-${row.hl_positie}`}>
                        <Form.Label>Correcte artiest zoeken</Form.Label>
                        <Form.Control
                          value={postExportArtistSearch}
                          disabled={postExportBusy}
                          onChange={(e) => setPostExportArtistSearch(e.target.value)}
                          placeholder="artiest…"
                        />
                      </Form.Group>
                      <Form.Group className="col-md-5" controlId={`post-export-title-search-${row.hl_positie}`}>
                        <Form.Label>Correcte titel zoeken</Form.Label>
                        <Form.Control
                          value={postExportTitleSearch}
                          disabled={postExportBusy}
                          onChange={(e) => setPostExportTitleSearch(e.target.value)}
                          placeholder="titel…"
                        />
                      </Form.Group>
                      <div className="col-md-2 d-grid">
                        <Button
                          variant="outline-primary"
                          disabled={postExportBusy || (!postExportArtistSearch.trim() && !postExportTitleSearch.trim())}
                          onClick={searchPostExportCandidates}
                        >
                          {postExportBusy ? "Zoeken…" : "Zoek"}
                        </Button>
                      </div>
                    </div>
                    <Form.Group controlId={`post-export-reason-${row.hl_positie}`}>
                      <Form.Label>Reden / opmerking</Form.Label>
                      <Form.Control
                        value={postExportReason}
                        disabled={postExportBusy}
                        onChange={(e) => setPostExportReason(e.target.value)}
                        placeholder="bijvoorbeeld: tikfout na export gecorrigeerd"
                      />
                    </Form.Group>
                    {postExportCandidates.length > 0 ? (
                      <div className="table-responsive">
                        <Table size="sm" bordered hover className="mb-0">
                          <thead>
                            <tr>
                              <th>Match</th>
                              <th>Artiest</th>
                              <th>Titel</th>
                              <th>Jaar</th>
                              <th>Type</th>
                              <th>Duur</th>
                              <th>Bestand</th>
                              <th style={{ width: 120 }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {postExportCandidates.map((candidate) => (
                              <tr key={candidate.fd_key} className={postExportSelectedCandidate?.fd_key === candidate.fd_key ? "table-primary" : ""}>
                                <td><Badge bg={candidate.match_type === "Exact" ? "success" : candidate.match_type === "Sterke match" ? "primary" : "secondary"}>{candidate.match_type || "Gedeeltelijk"}</Badge></td>
                                <td>{candidate.canonical_artist_name || candidate.fd_correct_artist || "—"}</td>
                                <td>{candidate.fd_tag_title || "—"}</td>
                                <td>{candidate.fd_year_song_publish || candidate.fd_year_song_version || ""}</td>
                                <td>{candidate.st_song_type || candidate.st_song_type_desc || ""}</td>
                                <td className="small text-muted">{candidate.fd_duration || ""}</td>
                                <td className="small text-muted text-truncate" style={{ maxWidth: 260 }}>{candidate.fd_file_name || ""}</td>
                                <td>
                                  <Button size="sm" variant="outline-primary" disabled={postExportBusy} onClick={() => previewPostExportCorrection(candidate)}>
                                    Preview
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    ) : null}
                    {postExportPreview ? (
                      <Alert variant={postExportPreview.canApply ? "info" : "warning"} className="mb-0">
                        <div className="fw-semibold">Impact preview</div>
                        <div className="small mt-1">
                          Oude correcte artiest/titel: {postExportPreview.oldValues?.correct_artist || "—"} — {postExportPreview.oldValues?.correct_title || "—"}
                        </div>
                        <div className="small">
                          Nieuwe correcte artiest/titel: {postExportPreview.newValues?.correct_artist || "—"} — {postExportPreview.newValues?.correct_title || "—"}
                        </div>
                        <div className="small">
                          Hitlijsten matches: {postExportPreview.hitlijsten?.matchedCount ?? 0} · geëxporteerde regels in context: {postExportPreview.hitlijsten?.exportedCount ?? 0}
                        </div>
                        {postExportPreview.composedImpact?.isComposed ? (
                          <Form.Check
                            className="mt-2"
                            id={`post-export-confirm-composed-${row.hl_positie}`}
                            label="Ik begrijp dat deze regel al is samengesteld; hl_samenstel_fd_key blijft ongewijzigd."
                            checked={postExportConfirmComposed}
                            disabled={postExportBusy}
                            onChange={(e) => setPostExportConfirmComposed(e.target.checked)}
                          />
                        ) : null}
                        {Array.isArray(postExportPreview.warnings) && postExportPreview.warnings.length > 0 ? (
                          <ul className="small mb-0 mt-2">
                            {postExportPreview.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                          </ul>
                        ) : null}
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant="success"
                            disabled={postExportBusy || !postExportPreview.canApply || (postExportPreview.composedImpact?.isComposed && !postExportConfirmComposed)}
                            onClick={applyPostExportCorrectionFromPreview}
                          >
                            {postExportBusy ? "Toepassen…" : "Bevestig correctie"}
                          </Button>
                        </div>
                      </Alert>
                    ) : null}
                    {postExportApplyResult ? (
                      <Alert variant="success" className="mb-0" role="status">
                        <div className="fw-semibold">Correctie succesvol toegepast</div>
                        <ul className="small mb-2 mt-2">
                          <li>staging_hitlijsten bijgewerkt: {postExportApplyResult.stagingUpdated ? "ja" : "nee"}</li>
                          <li>hitlijsten bijgewerkt: {postExportApplyResult.hitlijstenUpdatedCount ?? postExportApplyResult.hitlijstenUpdated ?? 0} record(s)</li>
                          <li>Audit vastgelegd{postExportApplyResult.auditId ? `: ${postExportApplyResult.auditId}` : ""}</li>
                          {postExportApplyResult.composedImpact?.isComposed || postExportApplyResult.composedUnchanged ? (
                            <li>Samengestelde koppeling blijft ongewijzigd.</li>
                          ) : null}
                        </ul>
                        <div className="small">
                          Correcte artiest: {postExportApplyResult.changedFields?.artist?.old || "—"} → {postExportApplyResult.changedFields?.artist?.new || "—"}
                        </div>
                        <div className="small">
                          Correcte titel: {postExportApplyResult.changedFields?.title?.old || "—"} → {postExportApplyResult.changedFields?.title?.new || "—"}
                        </div>
                        {Array.isArray(postExportApplyResult.warnings) && postExportApplyResult.warnings.length > 0 ? (
                          <ul className="small mb-0 mt-2">
                            {postExportApplyResult.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                          </ul>
                        ) : null}
                        <div className="mt-3">
                          <Button size="sm" variant="outline-success" onClick={() => setShowEdit(false)}>
                            Sluiten
                          </Button>
                        </div>
                      </Alert>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {diagnostics.canRepairArtistRelation || diagnostics.canRepairTitleArtistSwap ? (
                <div className="d-flex gap-2 flex-wrap">
                  {diagnostics.canRepairArtistRelation ? (
                    <Button variant="primary" disabled={repairBusy || swapRepairBusy || manualBusy || postExportBusy || preExportActionsDisabled} title={stagingMutationTitle} onClick={repairArtistRelation}>
                      {repairBusy ? "Repairing…" : "Herstel artiestrelatie"}
                    </Button>
                  ) : null}
                  {diagnostics.canRepairTitleArtistSwap ? (
                    <Button variant="warning" disabled={repairBusy || swapRepairBusy || manualBusy || postExportBusy || preExportActionsDisabled} title={stagingMutationTitle} onClick={repairTitleArtistSwap}>
                      {swapRepairBusy ? "Herstellen…" : "Herstel artiest/titel swap"}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-muted">No diagnostics available.</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showDiscogs}
        onHide={() => setShowDiscogs(false)}
        centered
        size="xl"
        aria-labelledby={`discogs-search-title-${row.hl_positie}`}
      >
        <Modal.Header closeButton>
          <Modal.Title id={`discogs-search-title-${row.hl_positie}`}>
            <div>Discogs zoeken — positie {row.hl_positie}</div>
            <div className="fs-6 fw-normal mt-1">
              {discogsDefaultSearchArtist || "Onbekende artiest"} — {discogsDefaultSearchTitle || "Onbekende titel"}
            </div>
            {discogsRunContext ? <div className="small text-muted fw-normal mt-1">{discogsRunContext}</div> : null}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ overflow: "auto", maxHeight: "75vh" }}>
          {discogsErr ? <Alert variant="danger">{discogsErr}</Alert> : null}
          <div className="border rounded p-3 mb-3 bg-light">
            <div className="small text-muted mb-2">
              Regelcontext: <strong>{buildArtistTitleClipboardText(row, local) || "—"}</strong>. Pas de zoekvelden hieronder gerust aan; dit wijzigt geen stagingdata.
            </div>
            <div className="row g-2 align-items-end mb-3">
              <Form.Group className="col-md-5" controlId={`discogs-search-artist-${row.hl_positie}`}>
                <Form.Label>Artiest</Form.Label>
                <Form.Control
                  size="sm"
                  value={discogsSearchArtistInput}
                  disabled={discogsBusy}
                  onChange={(e) => setDiscogsSearchArtistInput(e.target.value)}
                  placeholder="Artiest voor Discogs zoekopdracht"
                />
              </Form.Group>
              <Form.Group className="col-md-5" controlId={`discogs-search-title-input-${row.hl_positie}`}>
                <Form.Label>Titel</Form.Label>
                <Form.Control
                  size="sm"
                  value={discogsSearchTitleInput}
                  disabled={discogsBusy}
                  onChange={(e) => setDiscogsSearchTitleInput(e.target.value)}
                  placeholder="Titel voor Discogs zoekopdracht"
                />
              </Form.Group>
              <div className="col-md-2 d-grid">
                <Button size="sm" disabled={discogsBusy || (!discogsSearchArtistInput.trim() && !discogsSearchTitleInput.trim())} onClick={() => searchDiscogsForRow()}>
                  {discogsBusy ? "Zoeken…" : "Zoek in Discogs"}
                </Button>
              </div>
            </div>
            <div className="row g-2 align-items-end">
              <Form.Group className="col-md-2" controlId={`discogs-type-${row.hl_positie}`}>
                <Form.Label>Type</Form.Label>
                <Form.Select
                  size="sm"
                  value={discogsFilters.type}
                  disabled={discogsBusy || discogsResults.length === 0}
                  onChange={(e) => setDiscogsFilters((state) => ({ ...state, type: e.target.value }))}
                >
                  {discogsFilterOptions.types.map((value) => (
                    <option key={value} value={value}>{value === "ALL" ? "Alle types" : value}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="col-md-3" controlId={`discogs-format-${row.hl_positie}`}>
                <Form.Label>Format</Form.Label>
                <Form.Select
                  size="sm"
                  value={discogsFilters.format}
                  disabled={discogsBusy || discogsResults.length === 0}
                  onChange={(e) => setDiscogsFilters((state) => ({ ...state, format: e.target.value }))}
                >
                  {discogsFilterOptions.formats.map((value) => (
                    <option key={value} value={value}>{value === "ALL" ? "Alle formats" : value}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="col-md-2" controlId={`discogs-year-${row.hl_positie}`}>
                <Form.Label>Jaar</Form.Label>
                <Form.Select
                  size="sm"
                  value={discogsFilters.year}
                  disabled={discogsBusy || discogsResults.length === 0}
                  onChange={(e) => setDiscogsFilters((state) => ({ ...state, year: e.target.value }))}
                >
                  {discogsFilterOptions.years.map((value) => (
                    <option key={value} value={value}>{value === "ALL" ? "Alle jaren" : value}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="col-md-3" controlId={`discogs-country-${row.hl_positie}`}>
                <Form.Label>Land</Form.Label>
                <Form.Select
                  size="sm"
                  value={discogsFilters.country}
                  disabled={discogsBusy || discogsResults.length === 0}
                  onChange={(e) => setDiscogsFilters((state) => ({ ...state, country: e.target.value }))}
                >
                  {discogsFilterOptions.countries.map((value) => (
                    <option key={value} value={value}>{value === "ALL" ? "Alle landen" : value}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <div className="col-md-2 d-grid">
                <Button size="sm" variant="outline-secondary" disabled={discogsBusy} onClick={() => setDiscogsFilters(createEmptyDiscogsFilters())}>
                  Reset filters
                </Button>
              </div>
            </div>
            <div className="small text-muted mt-2">
              {discogsResults.length > 0
                ? `${visibleDiscogsResults.length} van ${discogsResults.length} resultaat/resultaten zichtbaar. Filters worden lokaal toegepast; opnieuw zoeken haalt een nieuwe Discogs-resultset op.`
                : "Vul of controleer Artiest en Titel en klik daarna op Zoek in Discogs. De modal opent zonder standaard Master-filter."}
            </div>
          </div>

          {discogsDetailResult ? (
            <div className="border rounded p-3 bg-white" aria-label="Discogs detailweergave">
              <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                <div>
                  <div className="h5 mb-1">Discogs details — {normalizeDiscogsType(discogsDetailResult)}</div>
                  <div className="text-muted small">Details bekijken wijzigt niets; alleen koppelen slaat de Discogs-entry op.</div>
                </div>
                <Button size="sm" variant="outline-secondary" onClick={closeDiscogsDetails}>
                  Terug naar resultaten
                </Button>
              </div>

              {discogsDetailError ? (
                <Alert variant="danger">
                  Discogs details konden niet worden opgehaald. {discogsDetailError}
                </Alert>
              ) : null}

              {discogsDetailBusy ? (
                <Spinner />
              ) : discogsDetail ? (
                <>
                  <dl className="row mb-3">
                    <dt className="col-sm-3">Type</dt>
                    <dd className="col-sm-9">{discogsDetail.type === "master" ? "Master" : "Release"}</dd>
                    <dt className="col-sm-3">Artiest</dt>
                    <dd className="col-sm-9">{discogsDetail.artist || "—"}</dd>
                    <dt className="col-sm-3">Titel</dt>
                    <dd className="col-sm-9">{discogsDetail.title || "—"}</dd>
                    <dt className="col-sm-3">Jaar</dt>
                    <dd className="col-sm-9">{discogsDetail.year || "—"}</dd>
                    <dt className="col-sm-3">Land</dt>
                    <dd className="col-sm-9">{discogsDetail.country || "—"}</dd>
                    <dt className="col-sm-3">Format(s)</dt>
                    <dd className="col-sm-9">{formatDiscogsDetailList(discogsDetail.formats)}</dd>
                    <dt className="col-sm-3">Catalogusnummer</dt>
                    <dd className="col-sm-9">{formatDiscogsDetailList(discogsDetail.catalogNumbers)}</dd>
                    <dt className="col-sm-3">Discogs</dt>
                    <dd className="col-sm-9">
                      {discogsDetail.discogsUrl ? (
                        <a href={discogsDetail.discogsUrl} target="_blank" rel="noopener noreferrer">Open Discogs</a>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </dl>

                  <div className="h6">Tracklist</div>
                  {Array.isArray(discogsDetail.tracklist) && discogsDetail.tracklist.length > 0 ? (
                    <Table bordered size="sm" className="align-middle">
                      <thead>
                        <tr>
                          <th style={{ width: 120 }}>Positie</th>
                          <th>Titel</th>
                          <th style={{ width: 120 }}>Duur</th>
                        </tr>
                      </thead>
                      <tbody>
                        {discogsDetail.tracklist.map((track, index) => (
                          <tr key={`${track.position || "track"}-${index}`}>
                            <td>{track.position || "—"}</td>
                            <td>{track.title || "—"}</td>
                            <td>{track.duration || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="secondary">Geen tracklist beschikbaar voor deze Discogs-entry.</Alert>
                  )}

                  <div className="d-flex justify-content-end gap-2 mt-3">
                    <Button variant="outline-secondary" onClick={closeDiscogsDetails}>Terug naar resultaten</Button>
                    <Button disabled={discogsSaving || preExportActionsDisabled} title={stagingMutationTitle} onClick={() => selectDiscogsResult(discogsDetailResult)}>
                      Koppel deze entry
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          ) : discogsBusy ? (
            <Spinner />
          ) : (
            <div className="table-responsive">
              <Table bordered hover size="sm" className="align-middle">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Artiest</th>
                    <th>Titel</th>
                    <th>Jaar</th>
                    <th>Land</th>
                    <th>Format</th>
                    <th>Discogs</th>
                    <th style={{ width: 100 }}>Details</th>
                    <th style={{ width: 95 }}>Koppel</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDiscogsResults.map((result, idx) => {
                    const split = splitDiscogsArtistTitle(result.title);
                    const formats = extractDiscogsFormats(result);
                    const url = getDiscogsResultUrl(result);
                    const typeLabel = normalizeDiscogsType(result);
                    const viewed = viewedDiscogsResultKeys.has(getDiscogsResultViewKey(result));
                    return (
                      <tr key={`${result.type || "discogs"}-${result.id || idx}`}>
                        <td>
                          <Badge bg={typeLabel === "Master" ? "primary" : typeLabel === "Release" ? "success" : "secondary"}>{typeLabel}</Badge>
                          {viewed ? <Badge bg="info" className="ms-1">Bekeken</Badge> : null}
                        </td>
                        <td>{split.artist || "—"}</td>
                        <td>{split.title || result.title || "—"}</td>
                        <td>{getDiscogsResultYear(result) || "—"}</td>
                        <td>{getDiscogsResultCountry(result) || "—"}</td>
                        <td>{formats.length > 0 ? formats.join(", ") : "—"}</td>
                        <td>
                          {url ? (
                            <a href={url} target="_blank" rel="noopener noreferrer">Open</a>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          <Button size="sm" variant="outline-primary" disabled={discogsSaving || discogsDetailBusy} onClick={() => openDiscogsDetails(result)}>
                            Details
                          </Button>
                        </td>
                        <td className="text-end">
                          <Button size="sm" disabled={discogsSaving || preExportActionsDisabled} title={stagingMutationTitle} onClick={() => selectDiscogsResult(result)}>
                            Koppel
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {visibleDiscogsResults.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-muted">Geen Discogs-resultaten gevonden.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDiscogs(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

