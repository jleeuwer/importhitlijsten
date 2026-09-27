import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Badge, Button, Form, Table } from "react-bootstrap";

function statusLabel(row) {
  if (row.status === "NEW") return { text: "Nieuw", variant: "success" };
  if (row.status === "METADATA_INCOMPLETE") return { text: "Metadata onvolledig", variant: "warning" };
  if (row.status === "READY") return { text: "Klaar voor import", variant: "success" };
  if (row.status === "IMPORT_ERROR") return { text: "Importfout", variant: "danger" };
  if (row.status === "IMPORTED" && row.matchType === "EXACT_FILE") return { text: "Geïmporteerd — hetzelfde bestand", variant: "secondary" };
  if (row.status === "IMPORTED" && row.matchType === "SAME_LIST_CONTENT") return { text: "Geïmporteerd — dezelfde lijstinhoud", variant: "warning" };
  if (row.status === "IMPORTED") return { text: "Geïmporteerd", variant: "secondary" };
  if (row.status === "MANUALLY_MARKED_IMPORTED") return { text: "Handmatig gemarkeerd als al geïmporteerd", variant: "info" };
  if (row.status === "READ_ERROR") return { text: "Kan niet worden gelezen", variant: "danger" };
  if (row.status === "PARSE_ERROR") return { text: "CSV kan niet worden verwerkt", variant: "danger" };
  return { text: row.status || "Onbekend", variant: "secondary" };
}

function candidateDuplicateLabel(candidate) {
  if (candidate.duplicateType === "EXACT_FILE") return { text: "Reeds geïmporteerd — hetzelfde bestand", variant: "danger" };
  if (candidate.duplicateType === "SAME_LIST_CONTENT") return { text: "Reeds geïmporteerd — dezelfde lijstinhoud", variant: "warning" };
  return null;
}

function formatBytes(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("nl-NL");
}

function candidateMetadataComplete(metadata = {}) {
  const year = Number(metadata.hl_uitzendjaar);
  return Boolean(
    String(metadata.hl_hitlijst || "").trim() &&
    Number.isInteger(year) && year >= 1900 && year <= 2100 &&
    Number(metadata.omroep_key) > 0 &&
    Number(metadata.periode_key) > 0
  );
}

async function apiJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.message || `Request failed (${response.status})`);
    error.code = payload?.error || "REQUEST_ERROR";
    throw error;
  }
  return payload;
}

export default function ImportPage({ initialState }) {
  const summary = initialState?.summary;
  const rows = initialState?.rows ?? [];
  const defaults = initialState?.defaults ?? {};
  const alreadyImported = !!initialState?.alreadyImported;
  const existingRunId = initialState?.existingRun?.ir_run_id ?? null;
  const runId = initialState?.runId ?? null;
  const metadataOptions = initialState?.metadataOptions ?? {};
  const omroepen = metadataOptions.omroepen ?? [];
  const perioden = metadataOptions.perioden ?? [];
  const directoryPath = initialState?.directoryPath ?? "";
  const initialShowImported = !!initialState?.showImported;
  const directoryScan = initialState?.directoryScan;
  const directoryError = initialState?.directoryError;
  const selectedFile = initialState?.selectedFile ?? "";
  const selectedRow = directoryScan?.files?.find((f) => f.fileName === selectedFile) ?? null;
  const selectedFilePath = initialState?.selectedFilePath ?? selectedRow?.filePath ?? "";
  const duplicateRequiresOverride = !!initialState?.duplicateRequiresOverride;
  const [showImported, setShowImported] = useState(initialShowImported);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [recentDirectories, setRecentDirectories] = useState([]);
  const [candidates, setCandidates] = useState(initialState?.importCandidates ?? []);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [candidateBusy, setCandidateBusy] = useState(false);
  const [candidateError, setCandidateError] = useState(initialState?.importCandidateFeatureError ?? null);
  const [candidateMessage, setCandidateMessage] = useState(null);
  const [bulkSummary, setBulkSummary] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const hitlijstNameRef = useRef(null);
  const importFormRef = useRef(null);
  const candidateFileInputRef = useRef(null);
  const metadataSaveTimersRef = useRef(new Map());

  const allScannedFiles = directoryScan?.files ?? [];
  const filteredFiles = useMemo(() => {
    if (showImported) return allScannedFiles;
    return allScannedFiles.filter((file) => !["IMPORTED", "MANUALLY_MARKED_IMPORTED"].includes(file.status));
  }, [allScannedFiles, showImported]);

  const pageCount = Math.max(1, Math.ceil(filteredFiles.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pagedFiles = filteredFiles.slice(pageStart, pageStart + pageSize);
  const selectedCandidate = candidates.find((candidate) => candidate.uploadId === selectedCandidateId) ?? null;
  const temporaryCandidateCount = candidates.filter((candidate) => candidate.status !== "IMPORTED").length;
  const readyCandidateCount = candidates.filter((candidate) => candidate.status === "READY").length;

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem("importhitlijst.recentImportDirectories") || "[]");
      if (Array.isArray(stored)) setRecentDirectories(stored.filter((item) => typeof item === "string").slice(0, 8));
    } catch {
      setRecentDirectories([]);
    }
  }, []);

  useEffect(() => {
    if (!directoryScan || directoryError || !directoryPath) return;
    setRecentDirectories((current) => {
      const next = [directoryPath, ...current.filter((item) => item !== directoryPath)].slice(0, 8);
      try {
        window.localStorage.setItem("importhitlijst.recentImportDirectories", JSON.stringify(next));
      } catch {
        // localStorage is optional; the import flow must remain usable without it.
      }
      return next;
    });
  }, [directoryScan, directoryError, directoryPath]);

  useEffect(() => {
    setPage(1);
  }, [showImported, pageSize, directoryPath]);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  useEffect(() => {
    if (!selectedFile || selectedCandidate) return;
    const timer = window.setTimeout(() => {
      importFormRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      hitlijstNameRef.current?.focus?.();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedFile, selectedCandidate]);

  useEffect(() => {
    if (!selectedCandidateId) return;
    const timer = window.setTimeout(() => hitlijstNameRef.current?.focus?.(), 0);
    return () => window.clearTimeout(timer);
  }, [selectedCandidateId]);

  useEffect(() => () => {
    for (const timer of metadataSaveTimersRef.current.values()) window.clearTimeout(timer);
  }, []);

  function replaceCandidate(candidate) {
    if (!candidate?.uploadId) return;
    setCandidates((current) => current.map((item) => item.uploadId === candidate.uploadId ? candidate : item));
  }

  async function persistCandidateMetadata(uploadId, metadata) {
    if (!uploadId) return null;
    const payload = await apiJson(`/api/import-candidates/${encodeURIComponent(uploadId)}/metadata`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metadata })
    });
    replaceCandidate(payload.candidate);
    return payload.candidate;
  }

  function scheduleCandidateMetadataSave(uploadId, metadata) {
    const previous = metadataSaveTimersRef.current.get(uploadId);
    if (previous) window.clearTimeout(previous);
    const timer = window.setTimeout(() => {
      persistCandidateMetadata(uploadId, metadata)
        .then(() => setCandidateError(null))
        .catch((error) => setCandidateError(error.message));
      metadataSaveTimersRef.current.delete(uploadId);
    }, 300);
    metadataSaveTimersRef.current.set(uploadId, timer);
  }

  function updateCandidateMetadata(field, value) {
    if (!selectedCandidate) return;
    const nextMetadata = { ...(selectedCandidate.metadata ?? {}), [field]: value };
    setCandidates((current) => current.map((candidate) => candidate.uploadId === selectedCandidate.uploadId
      ? { ...candidate, metadata: nextMetadata }
      : candidate));
    scheduleCandidateMetadataSave(selectedCandidate.uploadId, nextMetadata);
  }

  async function uploadCandidateFiles(fileList, source) {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;
    if (files.length > 50) {
      setCandidateError("Maximaal 50 CSV-bestanden per batch.");
      return;
    }
    setCandidateBusy(true);
    setCandidateError(null);
    setCandidateMessage(null);
    setBulkSummary(null);
    try {
      const form = new FormData();
      form.append("source", source);
      files.forEach((file) => form.append("csvFiles", file));
      const payload = await apiJson("/api/import-candidates", { method: "POST", body: form });
      setCandidates(payload.candidates ?? []);
      if ((payload.created ?? []).length === 1) {
        setSelectedCandidateId(payload.created[0].uploadId);
      } else {
        setSelectedCandidateId(null);
      }
      setCandidateMessage(`${payload.created?.length ?? 0} bestand(en) toegevoegd aan de import-inbox.`);
    } catch (error) {
      setCandidateError(error.message);
    } finally {
      setCandidateBusy(false);
      if (candidateFileInputRef.current) candidateFileInputRef.current.value = "";
    }
  }

  async function toggleCandidateOverride(candidate, checked) {
    setCandidateBusy(true);
    setCandidateError(null);
    try {
      const payload = await apiJson(`/api/import-candidates/${encodeURIComponent(candidate.uploadId)}/duplicate-override`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duplicateOverride: checked })
      });
      replaceCandidate(payload.candidate);
    } catch (error) {
      setCandidateError(error.message);
    } finally {
      setCandidateBusy(false);
    }
  }

  async function importSelectedCandidate() {
    if (!selectedCandidate) return;
    setCandidateBusy(true);
    setCandidateError(null);
    setCandidateMessage(null);
    try {
      const saved = await persistCandidateMetadata(selectedCandidate.uploadId, selectedCandidate.metadata ?? {});
      const payload = await apiJson(`/api/import-candidates/${encodeURIComponent(selectedCandidate.uploadId)}/import`, { method: "POST" });
      setCandidates(payload.candidates ?? candidates);
      setCandidateMessage(
        payload.outcome === "IMPORTED"
          ? `${saved?.originalFileName || selectedCandidate.originalFileName} is geïmporteerd.`
          : payload.outcome === "BLOCKED_DUPLICATE"
            ? "Import geblokkeerd: bevestig duplicate override als opnieuw importeren bewust is."
            : "Import is mislukt; de kandidaat blijft beschikbaar om te herstellen en opnieuw te proberen."
      );
    } catch (error) {
      setCandidateError(error.message);
    } finally {
      setCandidateBusy(false);
    }
  }

  async function importReadyCandidates() {
    setCandidateBusy(true);
    setCandidateError(null);
    setCandidateMessage(null);
    try {
      const saveable = candidates.filter((candidate) => candidate.status !== "IMPORTED" && candidate.status !== "PARSE_ERROR");
      await Promise.all(saveable.map((candidate) => persistCandidateMetadata(candidate.uploadId, candidate.metadata ?? {})));
      const payload = await apiJson("/api/import-candidates/import-ready", { method: "POST" });
      setCandidates(payload.candidates ?? []);
      setBulkSummary({ ...payload.summary, items: payload.items ?? [] });
    } catch (error) {
      setCandidateError(error.message);
    } finally {
      setCandidateBusy(false);
    }
  }

  async function deleteCandidate(candidate) {
    if (!candidate || candidate.status === "IMPORTED") return;
    if (!window.confirm(`Verwijder tijdelijke kandidaat ${candidate.originalFileName}?`)) return;
    setCandidateBusy(true);
    try {
      const payload = await apiJson(`/api/import-candidates/${encodeURIComponent(candidate.uploadId)}`, { method: "DELETE" });
      setCandidates(payload.candidates ?? []);
      if (selectedCandidateId === candidate.uploadId) setSelectedCandidateId(null);
      setCandidateError(null);
    } catch (error) {
      setCandidateError(error.message);
    } finally {
      setCandidateBusy(false);
    }
  }

  async function deleteAllTemporaryCandidates() {
    if (!window.confirm("Verwijder alle nog niet geïmporteerde tijdelijke CSV-bestanden en conceptmetadata?")) return;
    setCandidateBusy(true);
    try {
      const payload = await apiJson("/api/import-candidates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true })
      });
      setCandidates(payload.candidates ?? []);
      if ((payload.candidates ?? []).every((candidate) => candidate.uploadId !== selectedCandidateId)) setSelectedCandidateId(null);
      setCandidateMessage(`${payload.removed ?? 0} tijdelijke kandidaat/kandidaten verwijderd.`);
      setCandidateError(null);
    } catch (error) {
      setCandidateError(error.message);
    } finally {
      setCandidateBusy(false);
    }
  }

  return (
    <div className="import-page">
      <h4 className="mb-3">Import CSV → staging_hitlijsten</h4>

      <section className="mb-4" aria-labelledby="drag-drop-heading">
        <h5 id="drag-drop-heading">CSV-bestanden direct klaarzetten</h5>
        <input
          ref={candidateFileInputRef}
          type="file"
          multiple
          accept=".csv,text/csv"
          className="visually-hidden"
          aria-label="CSV-bestanden kiezen"
          onChange={(event) => uploadCandidateFiles(event.target.files, "FILE_PICKER")}
        />
        <div
          className={`import-dropzone ${dragActive ? "import-dropzone-active" : ""}`}
          role="button"
          tabIndex={0}
          aria-label="CSV-bestanden slepen of kiezen"
          onClick={() => candidateFileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              candidateFileInputRef.current?.click();
            }
          }}
          onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
          onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
          onDragLeave={(event) => { event.preventDefault(); setDragActive(false); }}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            uploadCandidateFiles(event.dataTransfer.files, "DRAG_DROP");
          }}
        >
          <div className="fw-semibold">Sleep CSV-bestanden hierheen</div>
          <div>of klik om CSV-bestanden te kiezen</div>
          <div className="small text-muted mt-1">Max. 50 bestanden per keer · max. 25 MB per CSV</div>
        </div>

        {candidateError && <Alert variant="danger" className="mt-3 mb-0">{candidateError}</Alert>}
        {candidateMessage && <Alert variant="info" className="mt-3 mb-0">{candidateMessage}</Alert>}

        <div className="mt-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="small text-muted">
            Tijdelijke kandidaten: {temporaryCandidateCount}. Klaar voor import: {readyCandidateCount}. Kandidaten blijven maximaal 7 dagen beschikbaar.
          </div>
          <div className="d-flex gap-2">
            <Button size="sm" variant="success" disabled={candidateBusy || temporaryCandidateCount === 0} onClick={importReadyCandidates}>
              Importeer alle gereedstaande lijsten
            </Button>
            <Button size="sm" variant="outline-danger" disabled={candidateBusy || temporaryCandidateCount === 0} onClick={deleteAllTemporaryCandidates}>
              Verwijder alle tijdelijke bestanden
            </Button>
          </div>
        </div>

        <div className="table-responsive mt-2">
          <Table striped bordered hover size="sm" className="align-middle mb-0">
            <thead>
              <tr><th>Bestand</th><th>Status</th><th>Duplicate</th><th>Metadata</th><th>Actie</th></tr>
            </thead>
            <tbody>
              {candidates.length === 0 && <tr><td colSpan={5} className="text-muted">Nog geen tijdelijke CSV-bestanden klaargezet.</td></tr>}
              {candidates.map((candidate) => {
                const label = statusLabel(candidate);
                const duplicate = candidateDuplicateLabel(candidate);
                return (
                  <tr key={candidate.uploadId} className={candidate.uploadId === selectedCandidateId ? "table-primary" : ""}>
                    <td>
                      <div>{candidate.originalFileName}</div>
                      <div className="small text-muted">{formatBytes(candidate.fileSize)}{candidate.rowCount != null ? ` · ${candidate.rowCount} regels` : ""}</div>
                      {(candidate.parseError || candidate.importError) && <div className="small text-danger">{candidate.parseError || candidate.importError}</div>}
                    </td>
                    <td><Badge bg={label.variant}>{label.text}</Badge></td>
                    <td className="small">
                      {duplicate ? <Badge bg={duplicate.variant}>{duplicate.text}</Badge> : "—"}
                      {candidate.duplicateRegistry?.fileName && <div className="text-muted mt-1">Match: {candidate.duplicateRegistry.fileName}</div>}
                    </td>
                    <td className="small">
                      {candidate.metadata?.hl_hitlijst ? <div>{candidate.metadata.hl_hitlijst}</div> : <span className="text-muted">Nog niet ingevuld</span>}
                      {candidate.metadata?.hl_uitzendjaar ? <div>{candidate.metadata.hl_uitzendjaar}</div> : null}
                    </td>
                    <td className="text-nowrap">
                      <Button size="sm" className="me-1" variant={candidate.uploadId === selectedCandidateId ? "primary" : "outline-primary"} onClick={() => setSelectedCandidateId(candidate.uploadId)}>
                        Selecteer
                      </Button>
                      {candidate.status !== "IMPORTED" && (
                        <Button size="sm" variant="outline-danger" onClick={() => deleteCandidate(candidate)}>Verwijder</Button>
                      )}
                      {candidate.status === "IMPORTED" && candidate.importRunId && (
                        <a className="btn btn-outline-secondary btn-sm" href={`/staging?runId=${encodeURIComponent(candidate.importRunId)}`}>Bekijk import</a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>

        {bulkSummary && (
          <Alert variant={bulkSummary.importError > 0 ? "warning" : "success"} className="mt-3 mb-0">
            <strong>Bulkimport afgerond:</strong> {bulkSummary.imported} geïmporteerd, {bulkSummary.blockedDuplicate} duplicate geblokkeerd, {bulkSummary.importError} importfout.
            {(bulkSummary.items ?? []).filter((item) => item.outcome !== "IMPORTED").map((item) => (
              <div key={item.uploadId}>
                <Button variant="link" className="p-0" onClick={() => setSelectedCandidateId(item.uploadId)}>{item.originalFileName}</Button>: {item.outcome === "BLOCKED_DUPLICATE" ? "duplicate geblokkeerd" : item.error || "importfout"}
              </div>
            ))}
          </Alert>
        )}

        {selectedCandidate && (
          <div className="border rounded p-3 mt-3" aria-label="Metadata tijdelijke importkandidaat">
            <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
              <div><strong>{selectedCandidate.originalFileName}</strong></div>
              <div className="small text-muted">Conceptmetadata wordt automatisch opgeslagen.</div>
            </div>
            <div className="row g-3">
              <div className="col-md-5">
                <Form.Label htmlFor="candidate-hl-hitlijst">Hitlijst name (hl_hitlijst)</Form.Label>
                <Form.Control
                  id="candidate-hl-hitlijst"
                  ref={hitlijstNameRef}
                  value={selectedCandidate.metadata?.hl_hitlijst ?? ""}
                  disabled={selectedCandidate.status === "IMPORTED"}
                  maxLength={255}
                  onChange={(event) => updateCandidateMetadata("hl_hitlijst", event.target.value)}
                />
              </div>
              <div className="col-md-2">
                <Form.Label>Uitzendjaar</Form.Label>
                <Form.Control
                  aria-label="Uitzendjaar tijdelijke kandidaat"
                  type="number"
                  min={1900}
                  max={2100}
                  value={selectedCandidate.metadata?.hl_uitzendjaar ?? ""}
                  disabled={selectedCandidate.status === "IMPORTED"}
                  onChange={(event) => updateCandidateMetadata("hl_uitzendjaar", event.target.value)}
                />
              </div>
              <div className="col-md-2">
                <Form.Label>Omroep / zender</Form.Label>
                <Form.Select
                  aria-label="Omroep tijdelijke kandidaat"
                  value={selectedCandidate.metadata?.omroep_key ?? ""}
                  disabled={selectedCandidate.status === "IMPORTED"}
                  onChange={(event) => updateCandidateMetadata("omroep_key", event.target.value)}
                >
                  <option value="">Kies omroep…</option>
                  {omroepen.map((o) => <option key={o.omroep_key} value={o.omroep_key}>{o.omroep_naam}</option>)}
                </Form.Select>
              </div>
              <div className="col-md-3">
                <Form.Label>Periode / categorie</Form.Label>
                <Form.Select
                  aria-label="Periode tijdelijke kandidaat"
                  value={selectedCandidate.metadata?.periode_key ?? ""}
                  disabled={selectedCandidate.status === "IMPORTED"}
                  onChange={(event) => updateCandidateMetadata("periode_key", event.target.value)}
                >
                  <option value="">Kies periode…</option>
                  {perioden.map((p) => <option key={p.periode_key} value={p.periode_key}>{p.periode_naam}</option>)}
                </Form.Select>
              </div>
            </div>

            {candidateDuplicateLabel(selectedCandidate) && selectedCandidate.status !== "IMPORTED" && (
              <Alert variant="warning" className="mt-3 mb-2 py-2">
                <div><strong>{candidateDuplicateLabel(selectedCandidate).text}</strong></div>
                <Form.Check
                  className="mt-1"
                  type="checkbox"
                  id={`duplicate-override-${selectedCandidate.uploadId}`}
                  checked={!!selectedCandidate.duplicateOverride}
                  onChange={(event) => toggleCandidateOverride(selectedCandidate, event.target.checked)}
                  label="Ik wil deze lijst bewust opnieuw importeren"
                />
              </Alert>
            )}

            <div className="d-flex flex-wrap gap-2 mt-3">
              <Button
                variant="primary"
                disabled={candidateBusy || selectedCandidate.status === "IMPORTED" || selectedCandidate.status === "PARSE_ERROR" || !candidateMetadataComplete(selectedCandidate.metadata) || (!!selectedCandidate.duplicateType && !selectedCandidate.duplicateOverride)}
                onClick={importSelectedCandidate}
              >
                Importeer deze lijst
              </Button>
              {selectedCandidate.status === "IMPORTED" && selectedCandidate.importRunId && (
                <a className="btn btn-outline-primary" href={`/edit?runId=${encodeURIComponent(selectedCandidate.importRunId)}`}>Bewerk deze import-run</a>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="mb-4">
        <h5>CSV import-inbox via directory</h5>
        <Form method="get" action="/import" className="row g-2 align-items-end">
          <div className="col-md-8">
            <Form.Label htmlFor="import-directory">Directory met CSV-bestanden</Form.Label>
            <Form.Control
              id="import-directory"
              name="directory"
              defaultValue={directoryPath}
              placeholder="/Users/.../Hitlijsten/CSV"
              required
            />
            <div className="small text-muted">Alleen de gekozen directory wordt gescand; subdirectories worden niet meegenomen.</div>
          </div>
          <div className="col-md-2">
            <Form.Check
              type="checkbox"
              id="show-imported"
              name="showImported"
              value="1"
              checked={showImported}
              onChange={(event) => setShowImported(event.target.checked)}
              label="Toon ook geïmporteerd"
            />
          </div>
          <div className="col-md-2 d-grid">
            <Button type="submit" variant="outline-primary">Scannen / vernieuwen</Button>
          </div>
        </Form>

        {recentDirectories.length > 0 && (
          <div className="mt-2 small">
            <span className="text-muted me-2">Recente scans:</span>
            <div className="d-flex flex-wrap gap-2 mt-1">
              {recentDirectories.map((recentDirectory) => (
                <a
                  key={recentDirectory}
                  className="btn btn-outline-secondary btn-sm"
                  href={`/import?directory=${encodeURIComponent(recentDirectory)}`}
                  title={recentDirectory}
                >
                  {recentDirectory}
                </a>
              ))}
            </div>
          </div>
        )}

        {directoryError && (
          <Alert variant="danger" className="mt-3 mb-0">
            <strong>Directory kan niet worden gelezen.</strong> {directoryError.message}
          </Alert>
        )}

        {directoryScan && (
          <div className="mt-3">
            <div className="small text-muted mb-2">
              CSV-bestanden gevonden: {directoryScan.totalCsvFiles}. Zichtbaar: {filteredFiles.length}.
            </div>
            <div className="table-responsive">
              <Table striped bordered hover size="sm" className="align-middle">
                <thead>
                  <tr>
                    <th>Bestand</th>
                    <th>Status</th>
                    <th>Grootte</th>
                    <th>Laatst gewijzigd</th>
                    <th>Eerdere import / match</th>
                    <th>Actie</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.length === 0 && (
                    <tr><td colSpan={6} className="text-muted">Geen CSV-bestanden voor deze filter.</td></tr>
                  )}
                  {pagedFiles.map((file) => {
                    const label = statusLabel(file);
                    const registry = file.registry;
                    return (
                      <tr key={file.fileName}>
                        <td>
                          <div>{file.fileName}</div>
                          {file.errorMessage && <div className="small text-danger">{file.errorMessage}</div>}
                        </td>
                        <td><Badge bg={label.variant}>{label.text}</Badge></td>
                        <td>{formatBytes(file.fileSize)}</td>
                        <td>{formatDate(file.fileModifiedAt)}</td>
                        <td className="small">
                          {registry ? (
                            <>
                              <div>{registry.ifr_file_name}</div>
                              <div className="text-muted">{formatDate(registry.ifr_imported_at || registry.ifr_manually_marked_at)}</div>
                            </>
                          ) : "—"}
                        </td>
                        <td>
                          {(file.status === "NEW" || (showImported && ["IMPORTED", "MANUALLY_MARKED_IMPORTED"].includes(file.status))) && (
                            <a
                              className={`btn btn-sm me-1 ${file.status === "NEW" ? "btn-primary" : "btn-outline-primary"}`}
                              href={`/import?directory=${encodeURIComponent(directoryPath)}&selectedFile=${encodeURIComponent(file.fileName)}${showImported ? "&showImported=1" : ""}`}
                            >
                              {file.status === "NEW" ? "Selecteer" : "Opnieuw importeren"}
                            </a>
                          )}
                          {(file.status === "NEW" || file.matchType === "SAME_LIST_CONTENT" || file.matchType === "EXACT_FILE") && file.status !== "READ_ERROR" && file.status !== "PARSE_ERROR" && (
                            <form method="post" action="/import/mark-imported" className="d-inline">
                              <input type="hidden" name="directoryPath" value={directoryPath} />
                              <input type="hidden" name="fileName" value={file.fileName} />
                              <input type="hidden" name="showImported" value={showImported ? "1" : "0"} />
                              {file.status === "NEW" && <button type="submit" className="btn btn-outline-secondary btn-sm">Markeer als al geïmporteerd</button>}
                            </form>
                          )}
                          {file.status === "MANUALLY_MARKED_IMPORTED" && registry?.ifr_key && (
                            <form method="post" action="/import/unmark-imported" className="d-inline">
                              <input type="hidden" name="registryKey" value={registry.ifr_key} />
                              <input type="hidden" name="directoryPath" value={directoryPath} />
                              <button type="submit" className="btn btn-outline-danger btn-sm">Markering verwijderen</button>
                            </form>
                          )}
                          {file.status === "IMPORTED" && registry?.ifr_import_run_id && (
                            <a className="btn btn-outline-secondary btn-sm" href={`/staging?runId=${encodeURIComponent(registry.ifr_import_run_id)}`}>Bekijk import</a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
            {filteredFiles.length > 0 && (
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="small text-muted">Per pagina</span>
                  <Form.Select
                    size="sm"
                    aria-label="Aantal bestanden per pagina"
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value))}
                    style={{ width: "auto" }}
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </Form.Select>
                  <span className="small text-muted">
                    {pageStart + 1}-{Math.min(pageStart + pageSize, filteredFiles.length)} van {filteredFiles.length}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Button size="sm" variant="outline-secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Vorige</Button>
                  <span className="small">Pagina {page} van {pageCount}</span>
                  <Button size="sm" variant="outline-secondary" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Volgende</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {!selectedCandidate && (
        <>
          {alreadyImported && (
            <Alert variant="warning">
              <div><strong>Deze lijst is al eerder geïmporteerd of gemarkeerd.</strong></div>
              <div className="small">{summary?.message}</div>
              {existingRunId && <div className="small">Bestaande run: <code>{existingRunId}</code></div>}
              {duplicateRequiresOverride && <div className="mt-2">Kies hieronder <strong>Toch opnieuw importeren</strong> als dit bewust is.</div>}
            </Alert>
          )}

          <Form ref={importFormRef} action="/import" method="post" encType="multipart/form-data" className="mb-4">
            <input type="hidden" name="sourceDirectory" value={directoryPath} />
            <input type="hidden" name="sourceFilePath" value={selectedFilePath} />
            <input type="hidden" name="showImported" value={showImported ? "1" : "0"} />
            <input type="hidden" name="duplicateOverride" value={duplicateRequiresOverride ? "1" : "0"} />

            <div className="row g-3">
              <div className="col-md-6">
                <Form.Label htmlFor="hl_hitlijst">Hitlijst name (hl_hitlijst)</Form.Label>
                <Form.Control id="hl_hitlijst" ref={hitlijstNameRef} name="hl_hitlijst" defaultValue={defaults.hl_hitlijst || ""} required maxLength={255} />
              </div>
              <div className="col-md-3">
                <Form.Label>Uitzendjaar (hl_uitzendjaar)</Form.Label>
                <Form.Control name="hl_uitzendjaar" type="number" defaultValue={defaults.hl_uitzendjaar || ""} required min={1900} max={2100} />
              </div>
              <div className="col-md-3">
                <Form.Label>Omroep / zender</Form.Label>
                <Form.Select name="omroep_key" defaultValue={defaults.omroep_key || ""} required>
                  <option value="">Kies omroep…</option>
                  {omroepen.map((o) => <option key={o.omroep_key} value={o.omroep_key}>{o.omroep_naam}</option>)}
                </Form.Select>
              </div>
              <div className="col-md-3">
                <Form.Label>Periode / categorie</Form.Label>
                <Form.Select name="periode_key" defaultValue={defaults.periode_key || ""} required>
                  <option value="">Kies periode…</option>
                  {perioden.map((p) => <option key={p.periode_key} value={p.periode_key}>{p.periode_naam}</option>)}
                </Form.Select>
              </div>

              <div className="col-12">
                {(selectedRow || selectedFilePath) ? (
                  <Alert variant="info" className="mb-0 py-2">Geselecteerd uit directory: <strong>{selectedRow?.fileName || selectedFile}</strong></Alert>
                ) : (
                  <>
                    <Form.Label>CSV-bestand uploaden (fallback)</Form.Label>
                    <Form.Control name="csvFile" type="file" accept=".csv,text/csv" />
                    <div className="small text-muted">Gebruik bij voorkeur de import-inbox hierboven. Upload blijft beschikbaar voor backwards compatibility.</div>
                  </>
                )}
              </div>

              <div className="col-12 d-flex gap-2">
                <Button type="submit" disabled={!selectedFilePath && !duplicateRequiresOverride && directoryPath && directoryScan?.files?.length > 0}>
                  {duplicateRequiresOverride ? "Toch opnieuw importeren" : "Import"}
                </Button>
                {runId && (
                  <>
                    <a className="btn btn-outline-primary" href={`/edit?runId=${encodeURIComponent(runId)}`}>Bewerk deze import-run</a>
                    <a className="btn btn-outline-secondary" href={`/staging?runId=${encodeURIComponent(runId)}`}>Bekijk resultaten</a>
                  </>
                )}
              </div>
            </div>
          </Form>
        </>
      )}

      {summary && !selectedCandidate && (
        <>
          <Alert variant={summary.errors > 0 ? "warning" : alreadyImported ? "warning" : "success"}>
            <div><strong>Import summary</strong></div>
            {summary.message && <div>{summary.message}</div>}
            {"totalRows" in summary && <div>Total rows in CSV: {summary.totalRows}</div>}
            {"inserted" in summary && <div>Inserted: {summary.inserted}</div>}
            {"warnings" in summary && <div>Warnings: {summary.warnings}</div>}
            {"errors" in summary && <div>Errors: {summary.errors}</div>}
            {summary.listFingerprint && <div className="small">List fingerprint: <code>{summary.listFingerprint}</code></div>}
          </Alert>

          {rows.length > 0 && (
            <>
              <h5 className="mt-3">Imported rows</h5>
              <div className="small text-muted mb-2">Rows: {rows.length}</div>
              <div className="table-responsive import-table-wrap">
                <Table striped bordered hover size="sm" className="mb-0">
                  <thead><tr><th>Positie</th><th>Artiest</th><th>Titel</th><th>Jaar</th><th>Omroep</th><th>Periode</th></tr></thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr key={`${r.hl_positie}-${idx}`}>
                        <td>{r.hl_positie}</td><td>{r.hl_artiest}</td><td>{r.hl_titel_song}</td><td>{r.hl_jaar}</td><td>{r.omroep_key}</td><td>{r.periode_key}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
