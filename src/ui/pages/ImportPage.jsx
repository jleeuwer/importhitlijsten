import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Badge, Button, Form, Table } from "react-bootstrap";

function statusLabel(row) {
  if (row.status === "NEW") return { text: "Nieuw", variant: "success" };
  if (row.status === "IMPORTED" && row.matchType === "EXACT_FILE") return { text: "Geïmporteerd — hetzelfde bestand", variant: "secondary" };
  if (row.status === "IMPORTED" && row.matchType === "SAME_LIST_CONTENT") return { text: "Geïmporteerd — dezelfde lijstinhoud", variant: "warning" };
  if (row.status === "MANUALLY_MARKED_IMPORTED") return { text: "Handmatig gemarkeerd als al geïmporteerd", variant: "info" };
  if (row.status === "READ_ERROR") return { text: "Kan niet worden gelezen", variant: "danger" };
  if (row.status === "PARSE_ERROR") return { text: "CSV kan niet worden verwerkt", variant: "danger" };
  return { text: row.status || "Onbekend", variant: "secondary" };
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
  const hitlijstNameRef = useRef(null);
  const importFormRef = useRef(null);

  const allScannedFiles = directoryScan?.files ?? [];
  const filteredFiles = useMemo(() => {
    if (showImported) return allScannedFiles;
    return allScannedFiles.filter((file) => !["IMPORTED", "MANUALLY_MARKED_IMPORTED"].includes(file.status));
  }, [allScannedFiles, showImported]);

  const pageCount = Math.max(1, Math.ceil(filteredFiles.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pagedFiles = filteredFiles.slice(pageStart, pageStart + pageSize);

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
    if (!selectedFile) return;
    const timer = window.setTimeout(() => {
      importFormRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      hitlijstNameRef.current?.focus?.();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedFile]);

  return (
    <div className="import-page">
      <h4 className="mb-3">Import CSV → staging_hitlijsten</h4>

      <section className="mb-4">
        <h5>CSV import-inbox</h5>
        <Form method="get" action="/import" className="row g-2 align-items-end">
          <div className="col-md-8">
            <Form.Label>Directory met CSV-bestanden</Form.Label>
            <Form.Control
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
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Vorige
                  </Button>
                  <span className="small">Pagina {page} van {pageCount}</span>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    disabled={page >= pageCount}
                    onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                  >
                    Volgende
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {alreadyImported && (
        <Alert variant="warning">
          <div><strong>Deze lijst is al eerder geïmporteerd of gemarkeerd.</strong></div>
          <div className="small">{summary?.message}</div>
          {existingRunId && <div className="small">Bestaande run: <code>{existingRunId}</code></div>}
          {duplicateRequiresOverride && (
            <div className="mt-2">Kies hieronder <strong>Toch opnieuw importeren</strong> als dit bewust is.</div>
          )}
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
              <Alert variant="info" className="mb-0 py-2">
                Geselecteerd uit directory: <strong>{selectedRow?.fileName || selectedFile}</strong>
              </Alert>
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

      {summary && (
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
