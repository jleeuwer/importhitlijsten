import React, { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Form, Modal, Table } from "react-bootstrap";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function fmtDate(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function labelOrDash(value) {
  const s = String(value ?? "").trim();
  return s || "—";
}

function asInt(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function runStatus(run) {
  const status = String(run.run_processing_status ?? "").trim();
  if (status) return status;
  if (asInt(run.exported_row_count) > 0) return "exported";
  if (asInt(run.total_count ?? run.ir_row_count) === 0) return "empty";
  if (asInt(run.blocked_count) > 0 || asInt(run.duplicate_count) > 0) return "needs_attention";
  return "ready_for_export";
}

function runStatusLabel(run) {
  if (run.run_processing_label) return run.run_processing_label;
  const status = runStatus(run);
  if (status === "exported") return "Geëxporteerd";
  if (status === "empty") return "Geen data";
  if (status === "needs_attention") return "Aandacht nodig";
  if (status === "ready_for_export") return "Klaar voor export";
  return status || "Onbekend";
}

function statusBadgeVariant(run) {
  const status = runStatus(run);
  if (status === "exported") return "secondary";
  if (status === "ready_for_export") return "success";
  if (status === "needs_attention") return "warning";
  return "light";
}

function matchesProcessingFilter(run, filter) {
  if (!filter) return true;
  const status = runStatus(run);
  if (filter === "needs_attention") return status === "needs_attention";
  if (filter === "ready_for_export") return status === "ready_for_export";
  if (filter === "blocked") return asInt(run.blocked_count) > 0;
  if (filter === "duplicates") return asInt(run.duplicate_count) > 0;
  if (filter === "skip") return asInt(run.skip_count) > 0;
  if (filter === "discogs") return asInt(run.discogs_link_count) > 0;
  return true;
}

function matchesExportFilter(run, filter) {
  if (!filter) return true;
  const exported = asInt(run.exported_row_count) > 0;
  if (filter === "exported") return exported;
  if (filter === "not_exported") return !exported;
  return true;
}

function summarizeRuns(runs = []) {
  return runs.reduce((acc, run) => {
    acc.total += 1;
    if (runStatus(run) === "needs_attention") acc.needsAttention += 1;
    if (runStatus(run) === "ready_for_export") acc.readyForExport += 1;
    if (asInt(run.exported_row_count) > 0) acc.exported += 1;
    if (asInt(run.duplicate_count) > 0) acc.withDuplicates += 1;
    if (asInt(run.blocked_count) > 0) acc.withBlocked += 1;
    return acc;
  }, { total: 0, needsAttention: 0, readyForExport: 0, exported: 0, withDuplicates: 0, withBlocked: 0 });
}

function SummaryPill({ label, value }) {
  return (
    <div className="border rounded px-2 py-1 bg-light small">
      <span className="text-muted">{label}: </span><strong>{value}</strong>
    </div>
  );
}

export default function StagingResults({ initialState }) {
  const [rows, setRows] = useState(initialState?.rows ?? []);
  const runId = initialState?.runId ?? initialState?.context?.runId ?? null;
  const runs = initialState?.runs ?? null;
  const metadataOptions = initialState?.metadataOptions ?? { omroepen: [], perioden: [] };

  const [q, setQ] = useState("");
  const [hitlijstFilter, setHitlijstFilter] = useState("");
  const [uitzendjaarFilter, setUitzendjaarFilter] = useState("");
  const [omroepFilter, setOmroepFilter] = useState("");
  const [periodeFilter, setPeriodeFilter] = useState("");
  const [exportFilter, setExportFilter] = useState("");
  const [processingFilter, setProcessingFilter] = useState("");
  const [localRuns, setLocalRuns] = useState(Array.isArray(runs) ? runs : []);
  const [metadataRun, setMetadataRun] = useState(null);
  const [metadataOmroepKey, setMetadataOmroepKey] = useState("");
  const [metadataPeriodeKey, setMetadataPeriodeKey] = useState("");
  const [metadataBusy, setMetadataBusy] = useState(false);
  const [metadataMsg, setMetadataMsg] = useState(null);
  const [metadataErr, setMetadataErr] = useState(null);
  const [deleteRun, setDeleteRun] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteErr, setDeleteErr] = useState(null);
  const [deleteMsg, setDeleteMsg] = useState(null);

  useEffect(() => {
    async function refresh() {
      if (!runId) return;
      const r = await fetch(`/api/staging?runId=${encodeURIComponent(runId)}`);
      const data = await r.json();
      setRows(data.rows || []);
    }
    refresh().catch(() => {});
  }, [runId]);

  useEffect(() => {
    if (Array.isArray(runs)) setLocalRuns(runs);
  }, [runs]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const hitlijstNeedle = hitlijstFilter.trim().toLowerCase();
    const yearNeedle = uitzendjaarFilter.trim();
    const selectedOmroep = omroepFilter.trim();
    const selectedPeriode = periodeFilter.trim();

    return localRuns.filter((r) => {
      const matchesHitlijst = !hitlijstNeedle || String(r.ir_hitlijst ?? "").toLowerCase().includes(hitlijstNeedle);
      const matchesYear = !yearNeedle || String(r.ir_uitzendjaar ?? "") === yearNeedle;
      const matchesOmroep = !selectedOmroep || String(r.omroep_key ?? "") === selectedOmroep;
      const matchesPeriode = !selectedPeriode || String(r.periode_key ?? "") === selectedPeriode;
      const matchesExport = matchesExportFilter(r, exportFilter);
      const matchesProcessing = matchesProcessingFilter(r, processingFilter);
      const hay = [
        r.ir_run_id,
        r.ir_hitlijst,
        r.ir_uitzendjaar,
        r.ir_status,
        r.ir_row_count,
        r.ir_created_at,
        r.omroep_naam,
        r.omroep_code,
        r.periode_naam,
        r.periode_code,
        runStatusLabel(r)
      ]
        .filter(Boolean)
        .map(String)
        .join(" | ")
        .toLowerCase();
      const matchesQuick = !needle || hay.includes(needle);
      return matchesHitlijst && matchesYear && matchesOmroep && matchesPeriode && matchesExport && matchesProcessing && matchesQuick;
    });
  }, [localRuns, q, hitlijstFilter, uitzendjaarFilter, omroepFilter, periodeFilter, exportFilter, processingFilter]);

  const summary = useMemo(() => summarizeRuns(filtered), [filtered]);

  function openMetadataModal(run) {
    setMetadataRun(run);
    setMetadataOmroepKey(run?.omroep_key ? String(run.omroep_key) : "");
    setMetadataPeriodeKey(run?.periode_key ? String(run.periode_key) : "");
    setMetadataErr(null);
    setMetadataMsg(null);
  }

  async function saveMetadata() {
    if (!metadataRun) return;
    setMetadataBusy(true);
    setMetadataErr(null);
    setMetadataMsg(null);
    try {
      const response = await fetch(`/api/import-runs/${encodeURIComponent(metadataRun.ir_run_id)}/metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          omroep_key: Number(metadataOmroepKey),
          periode_key: Number(metadataPeriodeKey),
          syncExportedHitlijsten: true
        })
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text || `HTTP ${response.status}`);
      const data = text ? JSON.parse(text) : {};

      const omroep = metadataOptions.omroepen?.find((o) => String(o.omroep_key) === String(data.omroep_key));
      const periode = metadataOptions.perioden?.find((p) => String(p.periode_key) === String(data.periode_key));

      setLocalRuns((current) =>
        current.map((r) =>
          r.ir_run_id === metadataRun.ir_run_id
            ? {
                ...r,
                omroep_key: data.omroep_key,
                omroep_naam: omroep?.omroep_naam ?? r.omroep_naam,
                omroep_code: omroep?.omroep_code ?? r.omroep_code,
                periode_key: data.periode_key,
                periode_code: periode?.periode_code ?? r.periode_code,
                periode_naam: periode?.periode_naam ?? r.periode_naam,
                exported_row_count: data.exportedRowCount ?? r.exported_row_count
              }
            : r
        )
      );
      setMetadataMsg(
        `Metadata opgeslagen. Staging bijgewerkt: ${data.stagingUpdated ?? 0} rij(en). Hitlijsten bijgewerkt: ${data.hitlijstenUpdated ?? 0} rij(en).`
      );
      setMetadataRun(null);
    } catch (e) {
      setMetadataErr(e?.message || String(e));
    } finally {
      setMetadataBusy(false);
    }
  }

  async function confirmDeleteRun() {
    if (!deleteRun) return;
    setDeleteBusy(true);
    setDeleteErr(null);
    try {
      const response = await fetch(`/api/import-runs/${encodeURIComponent(deleteRun.ir_run_id)}`, { method: "DELETE" });
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      if (!response.ok) throw new Error(data.error || text || `HTTP ${response.status}`);

      setLocalRuns((current) => current.filter((r) => r.ir_run_id !== deleteRun.ir_run_id));
      setDeleteMsg(`Run verwijderd: ${deleteRun.ir_hitlijst} ${deleteRun.ir_uitzendjaar}. Stagingregels verwijderd: ${data.stagingRowsDeleted ?? 0}.`);
      setDeleteRun(null);
    } catch (e) {
      setDeleteErr(e?.message || String(e));
    } finally {
      setDeleteBusy(false);
    }
  }

  if (!runId && Array.isArray(runs)) {
    if (localRuns.length === 0) {
      return (
        <Alert variant="info">
          No import runs found yet. Go to <a href="/import">Import</a> to create your first run.
        </Alert>
      );
    }

    return (
      <div>
        <div className="d-flex align-items-end justify-content-between flex-wrap gap-2">
          <div>
            <h4 className="mb-1">Import Runs</h4>
            <div className="small text-muted">
              Recent runs: {localRuns.length}
              {filtered.length !== localRuns.length ? ` (filtered: ${filtered.length})` : ""}
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 align-items-end">
            <Form style={{ minWidth: 180 }}>
              <Form.Label htmlFor="home-hitlijst-filter" className="small text-muted mb-1">Hitlijst</Form.Label>
              <Form.Control id="home-hitlijst-filter" size="sm" type="search" placeholder="filter hitlijst…" value={hitlijstFilter} onChange={(e) => setHitlijstFilter(e.target.value)} />
            </Form>
            <Form style={{ width: 120 }}>
              <Form.Label htmlFor="home-uitzendjaar-filter" className="small text-muted mb-1">Uitzendjaar</Form.Label>
              <Form.Control id="home-uitzendjaar-filter" size="sm" type="number" placeholder="jaar…" value={uitzendjaarFilter} onChange={(e) => setUitzendjaarFilter(e.target.value)} />
            </Form>
            <Form style={{ minWidth: 170 }}>
              <Form.Label htmlFor="home-omroep-filter" className="small text-muted mb-1">Omroep / zender</Form.Label>
              <Form.Select id="home-omroep-filter" size="sm" value={omroepFilter} onChange={(e) => setOmroepFilter(e.target.value)}>
                <option value="">Alle omroepen</option>
                {(metadataOptions.omroepen ?? []).map((o) => <option key={o.omroep_key} value={o.omroep_key}>{o.omroep_naam}</option>)}
              </Form.Select>
            </Form>
            <Form style={{ minWidth: 170 }}>
              <Form.Label htmlFor="home-periode-filter" className="small text-muted mb-1">Periode / decennium</Form.Label>
              <Form.Select id="home-periode-filter" size="sm" value={periodeFilter} onChange={(e) => setPeriodeFilter(e.target.value)}>
                <option value="">Alle perioden</option>
                {(metadataOptions.perioden ?? []).map((p) => <option key={p.periode_key} value={p.periode_key}>{p.periode_naam}</option>)}
              </Form.Select>
            </Form>
            <Form style={{ minWidth: 155 }}>
              <Form.Label htmlFor="home-export-filter" className="small text-muted mb-1">Exportstatus</Form.Label>
              <Form.Select id="home-export-filter" size="sm" value={exportFilter} onChange={(e) => setExportFilter(e.target.value)}>
                <option value="">Alle</option>
                <option value="not_exported">Niet geëxporteerd</option>
                <option value="exported">Geëxporteerd</option>
              </Form.Select>
            </Form>
            <Form style={{ minWidth: 175 }}>
              <Form.Label htmlFor="home-processing-filter" className="small text-muted mb-1">Verwerking</Form.Label>
              <Form.Select id="home-processing-filter" size="sm" value={processingFilter} onChange={(e) => setProcessingFilter(e.target.value)}>
                <option value="">Alle</option>
                <option value="needs_attention">Aandacht nodig</option>
                <option value="ready_for_export">Klaar voor export</option>
                <option value="blocked">Met blocked rows</option>
                <option value="duplicates">Met duplicates</option>
                <option value="skip">Met skip rows</option>
                <option value="discogs">Met Discogs-links</option>
              </Form.Select>
            </Form>
            <Form style={{ minWidth: 260 }}>
              <Form.Label htmlFor="home-quick-filter" className="small text-muted mb-1">Quick filter</Form.Label>
              <Form.Control id="home-quick-filter" size="sm" type="search" placeholder="runId, status, lijst…" value={q} onChange={(e) => setQ(e.target.value)} />
            </Form>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 my-3" aria-label="Runs samenvatting">
          <SummaryPill label="Runs" value={summary.total} />
          <SummaryPill label="Aandacht nodig" value={summary.needsAttention} />
          <SummaryPill label="Klaar voor export" value={summary.readyForExport} />
          <SummaryPill label="Geëxporteerd" value={summary.exported} />
          <SummaryPill label="Met duplicates" value={summary.withDuplicates} />
          <SummaryPill label="Met blocked" value={summary.withBlocked} />
        </div>

        <div className="d-flex flex-wrap gap-2 mb-2">
          <Button size="sm" variant="outline-warning" onClick={() => setProcessingFilter("needs_attention")}>Aandacht nodig</Button>
          <Button size="sm" variant="outline-success" onClick={() => setProcessingFilter("ready_for_export")}>Klaar voor export</Button>
          <Button size="sm" variant="outline-secondary" onClick={() => setExportFilter("not_exported")}>Niet geëxporteerd</Button>
          <Button size="sm" variant="outline-danger" onClick={() => setProcessingFilter("duplicates")}>Met duplicates</Button>
          <Button size="sm" variant="outline-danger" onClick={() => setProcessingFilter("blocked")}>Met blocked</Button>
          <Button size="sm" variant="outline-secondary" onClick={() => { setProcessingFilter(""); setExportFilter(""); setQ(""); setHitlijstFilter(""); setUitzendjaarFilter(""); setOmroepFilter(""); setPeriodeFilter(""); }}>Reset filters</Button>
        </div>

        {metadataMsg && <Alert variant="success" className="mt-3" onClose={() => setMetadataMsg(null)} dismissible>{metadataMsg}</Alert>}
        {metadataErr && <Alert variant="danger" className="mt-3" onClose={() => setMetadataErr(null)} dismissible>{metadataErr}</Alert>}
        {deleteMsg && <Alert variant="success" className="mt-3" onClose={() => setDeleteMsg(null)} dismissible>{deleteMsg}</Alert>}
        {deleteErr && <Alert variant="danger" className="mt-3" onClose={() => setDeleteErr(null)} dismissible>{deleteErr}</Alert>}

        <div className="table-responsive mt-2">
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Status</th>
                <th>hitlijst</th>
                <th>jaar</th>
                <th>omroep</th>
                <th>periode</th>
                <th>regels</th>
                <th>OK</th>
                <th>Blocked</th>
                <th>Duplicate</th>
                <th>Skip</th>
                <th>Discogs</th>
                <th>Exported</th>
                <th>created</th>
                <th>runId</th>
                <th>actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const exported = asInt(r.exported_row_count);
                const canDelete = exported === 0;
                return (
                  <tr key={r.ir_run_id}>
                    <td style={{ whiteSpace: "nowrap" }}><Badge bg={statusBadgeVariant(r)} text={statusBadgeVariant(r) === "light" ? "dark" : undefined}>{runStatusLabel(r)}</Badge></td>
                    <td>{r.ir_hitlijst}</td>
                    <td>{r.ir_uitzendjaar}</td>
                    <td>{labelOrDash(r.omroep_naam)}</td>
                    <td>{labelOrDash(r.periode_naam)}</td>
                    <td>{asInt(r.total_count ?? r.ir_row_count)}</td>
                    <td>{asInt(r.ok_count)}</td>
                    <td>{asInt(r.blocked_count)}</td>
                    <td>{asInt(r.duplicate_count)}</td>
                    <td>{asInt(r.skip_count)}</td>
                    <td>{asInt(r.discogs_link_count)}</td>
                    <td>{exported}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDate(r.ir_created_at)}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{r.ir_run_id}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div className="d-flex gap-1 align-items-center" aria-label={`Acties voor ${r.ir_hitlijst} ${r.ir_uitzendjaar}`}>
                        <Button
                          as="a"
                          href={`/staging?runId=${encodeURIComponent(r.ir_run_id)}`}
                          variant="outline-secondary"
                          size="sm"
                          className="py-0 px-1"
                          title="View staging"
                          aria-label={`View staging voor ${r.ir_hitlijst} ${r.ir_uitzendjaar}`}
                        >
                          <i className="bi bi-view-list" aria-hidden="true"></i>
                        </Button>
                        <Button
                          as="a"
                          href={`/edit?runId=${encodeURIComponent(r.ir_run_id)}`}
                          variant="outline-primary"
                          size="sm"
                          className="py-0 px-1"
                          title="Open Edit"
                          aria-label={`Open Edit voor ${r.ir_hitlijst} ${r.ir_uitzendjaar}`}
                        >
                          <i className="bi bi-pencil" aria-hidden="true"></i>
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="py-0 px-1"
                          onClick={() => openMetadataModal(r)}
                          title="Metadata"
                          aria-label={`Metadata wijzigen voor ${r.ir_hitlijst} ${r.ir_uitzendjaar}`}
                        >
                          <i className="bi bi-list" aria-hidden="true"></i>
                        </Button>
                        {asInt(r.blocked_discogs_count) > 0 && (
                          <Button
                            as="a"
                            href={`/api/edit/run/${encodeURIComponent(r.ir_run_id)}/export-blocked-discogs-links.txt`}
                            variant="outline-secondary"
                            size="sm"
                            className="py-0 px-1"
                            title="Blocked Discogs export"
                            aria-label={`Blocked Discogs export voor ${r.ir_hitlijst} ${r.ir_uitzendjaar}`}
                          >
                            <i className="bi bi-file-earmark-text" aria-hidden="true"></i>
                          </Button>
                        )}
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="py-0 px-1"
                          disabled={!canDelete}
                          title={canDelete ? "Verwijder run" : "Geëxporteerde runs kunnen niet worden verwijderd"}
                          aria-label={`Verwijder run ${r.ir_hitlijst} ${r.ir_uitzendjaar}`}
                          onClick={() => setDeleteRun(r)}
                        >
                          <i className="bi bi-trash2" aria-hidden="true"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>

        <Modal show={Boolean(metadataRun)} onHide={() => setMetadataRun(null)}>
          <Modal.Header closeButton>
            <Modal.Title>Runmetadata wijzigen</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {metadataRun && (
              <>
                <div className="small text-muted mb-3">
                  {metadataRun.ir_hitlijst} · {metadataRun.ir_uitzendjaar} · {metadataRun.ir_run_id}
                </div>
                {asInt(metadataRun.exported_row_count) > 0 && (
                  <Alert variant="warning">
                    Deze run is al geëxporteerd. De metadatawijziging wordt ook toegepast op de definitieve hitlijsten-records ({metadataRun.exported_row_count} rij(en)).
                  </Alert>
                )}
                <Form.Group className="mb-3">
                  <Form.Label>Omroep / zender</Form.Label>
                  <Form.Select aria-label="Omroep / zender" value={metadataOmroepKey} onChange={(e) => setMetadataOmroepKey(e.target.value)}>
                    <option value="">Kies omroep…</option>
                    {(metadataOptions.omroepen ?? []).map((o) => <option key={o.omroep_key} value={o.omroep_key}>{o.omroep_naam}</option>)}
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Periode / decennium</Form.Label>
                  <Form.Select aria-label="Periode / decennium" value={metadataPeriodeKey} onChange={(e) => setMetadataPeriodeKey(e.target.value)}>
                    <option value="">Kies periode…</option>
                    {(metadataOptions.perioden ?? []).map((p) => <option key={p.periode_key} value={p.periode_key}>{p.periode_naam}</option>)}
                  </Form.Select>
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setMetadataRun(null)} disabled={metadataBusy}>Annuleren</Button>
            <Button variant="primary" onClick={saveMetadata} disabled={metadataBusy || !metadataOmroepKey || !metadataPeriodeKey}>
              {metadataBusy ? "Opslaan…" : "Metadata opslaan"}
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={Boolean(deleteRun)} onHide={() => setDeleteRun(null)}>
          <Modal.Header closeButton>
            <Modal.Title>Import-run verwijderen</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {deleteRun && (
              <>
                <Alert variant="warning">
                  Weet je zeker dat je deze import-run wilt verwijderen? Dit verwijdert de stagingregels en het runrecord. Geëxporteerde hitlijsten worden niet verwijderd.
                </Alert>
                <dl className="row small mb-0">
                  <dt className="col-sm-4">Hitlijst</dt><dd className="col-sm-8">{deleteRun.ir_hitlijst}</dd>
                  <dt className="col-sm-4">Jaar</dt><dd className="col-sm-8">{deleteRun.ir_uitzendjaar}</dd>
                  <dt className="col-sm-4">Regels</dt><dd className="col-sm-8">{asInt(deleteRun.total_count ?? deleteRun.ir_row_count)}</dd>
                  <dt className="col-sm-4">Geëxporteerd</dt><dd className="col-sm-8">{asInt(deleteRun.exported_row_count) > 0 ? `Ja (${deleteRun.exported_row_count})` : "Nee"}</dd>
                  <dt className="col-sm-4">Run ID</dt><dd className="col-sm-8"><code>{deleteRun.ir_run_id}</code></dd>
                </dl>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setDeleteRun(null)} disabled={deleteBusy}>Annuleren</Button>
            <Button variant="danger" onClick={confirmDeleteRun} disabled={deleteBusy || asInt(deleteRun?.exported_row_count) > 0}>
              {deleteBusy ? "Verwijderen…" : "Verwijder run"}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }

  if (!runId) {
    return (
      <Alert variant="warning">
        Missing <code>runId</code>. Open <code>/staging?runId=...</code> from the <a href="/">Runs</a> page.
      </Alert>
    );
  }

  return (
    <div>
      <h4>Staging results (runId: {runId})</h4>
      <div className="small text-muted mb-2">Rows: {rows.length}</div>
      <div className="table-responsive">
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Positie</th>
              <th>Artiest uit lijst</th>
              <th>Titel uit lijst</th>
              <th>Jaar</th>
              <th>Correcte titel</th>
              <th>Correcte spelling artiest</th>
              <th>Discogs link</th>
              <th>Vind commando</th>
              <th>Sleutel artiest</th>
              <th>Omroep sleutel</th>
              <th>Periode sleutel</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={`${r.hl_positie}-${idx}`}>
                <td>{r.hl_positie}</td><td>{r.hl_artiest}</td><td>{r.hl_titel_song}</td><td>{r.hl_jaar}</td><td>{r.fd_tag_title}</td><td>{r.as_correcte_artiest_spelling}</td>
                <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.hl_discogs_link}</td>
                <td>{r.hl_find_cmd}</td><td>{r.hl_artist_key}</td><td>{r.omroep_key}</td><td>{r.periode_key}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
