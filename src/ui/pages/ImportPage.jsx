// src/ui/pages/ImportPage.jsx
import React from "react";
import { Alert, Button, Form, Table } from "react-bootstrap";

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

  return (
    <div className="import-page">
      <h4 className="mb-3">Import CSV → staging_hitlijsten</h4>

      {alreadyImported && existingRunId && (
        <Alert variant="warning">
          <div><strong>Already imported</strong></div>
          <div className="small">
            This file was already imported for this hitlijst/year.
            <br />
            Existing runId: <code>{existingRunId}</code>
          </div>

          <form method="post" action="/import/delete-run" style={{ marginTop: 10 }}>
            <input type="hidden" name="runId" value={existingRunId} />
            <button type="submit" className="btn btn-danger btn-sm">
              Delete previous run and allow re-import
            </button>
          </form>

          <div style={{ marginTop: 10 }}>
            <a className="btn btn-outline-secondary btn-sm" href={`/staging?runId=${encodeURIComponent(existingRunId)}`}>
              View existing results
            </a>
          </div>
        </Alert>
      )}

      <Form action="/import" method="post" encType="multipart/form-data" className="mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <Form.Label>Hitlijst name (hl_hitlijst)</Form.Label>
            <Form.Control
              name="hl_hitlijst"
              defaultValue={defaults.hl_hitlijst || ""}
              required
              maxLength={255}
            />
          </div>

          <div className="col-md-3">
            <Form.Label>Uitzendjaar (hl_uitzendjaar)</Form.Label>
            <Form.Control
              name="hl_uitzendjaar"
              type="number"
              defaultValue={defaults.hl_uitzendjaar || ""}
              required
              min={1900}
              max={2100}
            />
          </div>

          <div className="col-md-3">
            <Form.Label>Omroep / zender</Form.Label>
            <Form.Select name="omroep_key" defaultValue={defaults.omroep_key || ""} required>
              <option value="">Kies omroep…</option>
              {omroepen.map((o) => (
                <option key={o.omroep_key} value={o.omroep_key}>{o.omroep_naam}</option>
              ))}
            </Form.Select>
          </div>

          <div className="col-md-3">
            <Form.Label>Periode / categorie</Form.Label>
            <Form.Select name="periode_key" defaultValue={defaults.periode_key || ""} required>
              <option value="">Kies periode…</option>
              {perioden.map((p) => (
                <option key={p.periode_key} value={p.periode_key}>{p.periode_naam}</option>
              ))}
            </Form.Select>
          </div>

          <div className="col-12">
            <Form.Label>CSV file (UTF-8, headers: artiest,song,jaar; optioneel fd_file_name/filename)</Form.Label>
            <Form.Control name="csvFile" type="file" accept=".csv,text/csv" required />
            <div className="small text-muted">
              Optioneel: voeg fd_file_name/filename toe voor duplicate-detectie op fysieke bestandsnaam. Omroep en periode worden op elke stagingrij opgeslagen.
            </div>
          </div>

          <div className="col-12 d-flex gap-2">
            <Button type="submit">Import</Button>
            {runId && (
              <>
                <a className="btn btn-outline-primary" href={`/edit?runId=${encodeURIComponent(runId)}`}>
                  Bewerk deze import-run
                </a>
                <a className="btn btn-outline-secondary" href={`/staging?runId=${encodeURIComponent(runId)}`}>
                  View last results
                </a>
              </>
            )}
          </div>
        </div>
      </Form>

      {summary && (
        <>
          <Alert variant={summary.errors > 0 ? "warning" : "success"}>
            <div><strong>Import summary</strong></div>
            {summary.message && <div>{summary.message}</div>}
            {"totalRows" in summary && <div>Total rows in CSV: {summary.totalRows}</div>}
            {"inserted" in summary && <div>Inserted: {summary.inserted}</div>}
            {"warnings" in summary && <div>Warnings (skipped rows): {summary.warnings}</div>}
            {"errors" in summary && <div>Errors: {summary.errors}</div>}
            {summary.patternDiscovery && (
              <div>Pattern suggesties: {summary.patternDiscovery.candidateGroups ?? 0} groep(en), {summary.patternDiscovery.candidateOccurrences ?? 0} vondst(en)</div>
            )}
          </Alert>

          {(summary.warningSamples?.length > 0 || summary.errorSamples?.length > 0) && (
            <div className="mb-3">
              <div className="small text-muted"><strong>Samples</strong></div>
              {summary.warningSamples?.length > 0 && (
                <pre className="small import-pre">
                  {JSON.stringify({ warningSamples: summary.warningSamples }, null, 2)}
                </pre>
              )}
              {summary.errorSamples?.length > 0 && (
                <pre className="small import-pre">
                  {JSON.stringify({ errorSamples: summary.errorSamples }, null, 2)}
                </pre>
              )}
            </div>
          )}

          <h5 className="mt-3">Imported rows</h5>
          <div className="small text-muted mb-2">Rows: {rows.length}</div>

          <div className="table-responsive import-table-wrap">
            <Table striped bordered hover size="sm" className="mb-0">
              <thead>
                <tr>
                  <th>hl_hitlijst</th>
                  <th>hl_uitzendjaar</th>
                  <th>hl_positie</th>
                  <th>hl_artiest</th>
                  <th>hl_titel_song</th>
                  <th>hl_jaar</th>
                  <th>as_correcte_artiest_spelling</th>
                  <th>hl_discogs_link</th>
                  <th>hl_find_cmd</th>
                  <th>hl_commando</th>
                  <th>hl_add_info</th>
                  <th>hl_artist_key</th>
                  <th>omroep_key</th>
                  <th>periode_key</th>
                  <th>hl_import_run_id</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={`${r.hl_positie}-${idx}`}>
                    <td>{r.hl_hitlijst}</td>
                    <td>{r.hl_uitzendjaar}</td>
                    <td>{r.hl_positie}</td>
                    <td>{r.hl_artiest}</td>
                    <td>{r.hl_titel_song}</td>
                    <td>{r.hl_jaar}</td>
                    <td>{r.as_correcte_artiest_spelling}</td>
                    <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.hl_discogs_link}
                    </td>
                    <td>{r.hl_find_cmd}</td>
                    <td>{r.hl_commando}</td>
                    <td>{r.hl_add_info}</td>
                    <td>{r.hl_artist_key}</td>
                    <td>{r.omroep_key}</td>
                    <td>{r.periode_key}</td>
                    <td>{r.hl_import_run_id}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
