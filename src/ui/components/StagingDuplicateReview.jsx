import React, { useMemo, useState } from "react";
import { Alert, Badge, Button, Form, Modal, Spinner, Table } from "react-bootstrap";

function asKey(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function validateDuplicateReviewSelection(review, selectedKeys) {
  const selected = new Set((selectedKeys || []).map(asKey).filter(Boolean));
  if (selected.size === 0) return "Selecteer minimaal één duplicate rij.";

  for (const group of review?.groups || []) {
    const keys = (group.rows || []).map((row) => asKey(row.sh_key)).filter(Boolean);
    const selectedCount = keys.filter((key) => selected.has(key)).length;
    if (keys.length > 0 && selectedCount === keys.length) {
      return `Laat minimaal één rij staan voor ${group.displayArtist || "artiest"} — ${group.displayTitle || "titel"}.`;
    }
  }
  return null;
}

export default function StagingDuplicateReview({
  runId,
  disabled = false,
  refreshRows,
  setMsg,
  setErr
}) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [review, setReview] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [localError, setLocalError] = useState(null);

  const selectedSet = useMemo(() => new Set(selectedKeys.map(Number)), [selectedKeys]);
  const selectionError = useMemo(
    () => (review ? validateDuplicateReviewSelection(review, selectedKeys) : null),
    [review, selectedKeys]
  );

  async function requestJson(url, options = {}) {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    const text = await response.text();
    if (!response.ok) throw new Error(text || `HTTP ${response.status}`);
    return text ? JSON.parse(text) : {};
  }

  async function scan({ openModal = true } = {}) {
    if (!runId) return null;
    setLoading(true);
    setLocalError(null);
    try {
      const data = await requestJson(`/api/edit/run/${encodeURIComponent(runId)}/staging-duplicates`);
      setReview(data);
      setSelectedKeys(Array.isArray(data.suggestedDeleteKeys) ? data.suggestedDeleteKeys.map(Number) : []);
      if (openModal) {
        if (Number(data.groupCount || 0) === 0) {
          setShow(false);
          setMsg?.("Geen dubbele stagingrijen gevonden op basis van artiest + titel.");
        } else {
          setShow(true);
        }
      }
      return data;
    } catch (error) {
      const message = error?.message || String(error);
      setLocalError(message);
      setErr?.(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  function toggleKey(key) {
    const n = Number(key);
    setSelectedKeys((current) =>
      current.includes(n) ? current.filter((value) => value !== n) : [...current, n]
    );
    setLocalError(null);
  }

  async function perform(action) {
    const validationMessage = validateDuplicateReviewSelection(review, selectedKeys);
    if (validationMessage) {
      setLocalError(validationMessage);
      return;
    }

    if (action === "delete") {
      const ok = window.confirm(
        `Je staat op het punt ${selectedKeys.length} geselecteerde stagingrij(en) fysiek te verwijderen. ` +
        "De bron-CSV en file_details blijven ongewijzigd. De verwijdering wordt geaudit. Doorgaan?"
      );
      if (!ok) return;
    }

    setActionBusy(true);
    setLocalError(null);
    try {
      const body = action === "delete"
        ? { stagingKeys: selectedKeys, confirmPhysicalDelete: true }
        : { stagingKeys: selectedKeys };
      const data = await requestJson(
        `/api/edit/run/${encodeURIComponent(runId)}/staging-duplicates/${action === "delete" ? "delete" : "skip"}`,
        { method: "POST", body: JSON.stringify(body) }
      );

      if (action === "delete") {
        setMsg?.(`Fysiek verwijderd: ${data.deletedRows ?? 0} duplicate rij(en). Auditregels: ${data.auditedRows ?? 0}.`);
      } else {
        setMsg?.(`Als duplicate uitgesloten: ${data.updatedRows ?? 0} rij(en) op Skip gezet.`);
      }

      await refreshRows?.();
      const next = await scan({ openModal: false });
      if (!next || Number(next.groupCount || 0) === 0) setShow(false);
    } catch (error) {
      const message = error?.message || String(error);
      setLocalError(message);
      setErr?.(message);
    } finally {
      setActionBusy(false);
    }
  }

  const groupCount = Number(review?.groupCount || 0);
  const duplicateRowCount = Number(review?.duplicateRowCount || 0);

  return (
    <>
      <Button
        variant="outline-danger"
        disabled={disabled || !runId || loading || actionBusy}
        title="Zoek binnen de huidige import naar rijen met dezelfde genormaliseerde artiest en titel."
        onClick={() => scan({ openModal: true })}
      >
        {loading ? <><Spinner size="sm" className="me-2" />Zoeken…</> : "Zoek dubbele rijen"}
      </Button>

      <Modal show={show} onHide={() => !actionBusy && setShow(false)} size="xl" centered scrollable>
        <Modal.Header closeButton={!actionBusy}>
          <Modal.Title>Dubbele rijen controleren</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <Badge bg="warning" text="dark">Groepen: {groupCount}</Badge>
            <Badge bg="danger">Extra duplicate rijen: {duplicateRowCount}</Badge>
            <Badge bg="primary">Geselecteerd: {selectedKeys.length}</Badge>
          </div>

          <Alert variant="info">
            Duplicate-identiteit is <strong>genormaliseerde artiest + titel</strong>. Positie is alleen context.
            Er wordt niets automatisch verwijderd. Per groep moet minimaal één rij behouden blijven.
          </Alert>

          {localError ? <Alert variant="danger">{localError}</Alert> : null}

          {(review?.groups || []).map((group) => (
            <div className="border rounded p-2 mb-3" key={group.groupId}>
              <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                <div>
                  <strong>{group.displayArtist || "—"}</strong> — {group.displayTitle || "—"}
                  <div className="small text-muted">{group.rowCount} rijen in deze duplicategroep</div>
                </div>
                <Badge bg="secondary">{group.groupId}</Badge>
              </div>
              <Table size="sm" striped bordered responsive className="mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>Weg?</th>
                    <th style={{ width: 90 }}>Positie</th>
                    <th>Artiest</th>
                    <th>Titel</th>
                    <th style={{ width: 120 }}>Actie</th>
                    <th style={{ width: 150 }}>Advies</th>
                  </tr>
                </thead>
                <tbody>
                  {(group.rows || []).map((row) => {
                    const key = Number(row.sh_key);
                    const recommendedKeep = Number(group.recommendedKeepKey) === key;
                    return (
                      <tr key={key}>
                        <td className="text-center">
                          <Form.Check
                            aria-label={`Duplicate stagingregel ${key} verwijderen of uitsluiten`}
                            checked={selectedSet.has(key)}
                            onChange={() => toggleKey(key)}
                            disabled={actionBusy}
                          />
                        </td>
                        <td>{row.hl_positie ?? "—"}</td>
                        <td>{row.hl_artiest ?? "—"}</td>
                        <td>{row.hl_titel_song ?? "—"}</td>
                        <td>{row.fd_action || "Keep"}</td>
                        <td>{recommendedKeep ? <Badge bg="success">Bewaren</Badge> : <Badge bg="warning" text="dark">Duplicate</Badge>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ))}

          {selectionError && !localError ? (
            <div className="small text-warning">{selectionError}</div>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)} disabled={actionBusy}>Sluiten</Button>
          <Button
            variant="outline-warning"
            disabled={actionBusy || Boolean(selectionError)}
            onClick={() => perform("skip")}
          >
            Markeer als duplicate / Skip
          </Button>
          <Button
            variant="danger"
            disabled={actionBusy || Boolean(selectionError)}
            onClick={() => perform("delete")}
          >
            {actionBusy ? "Bezig…" : "Fysiek verwijderen…"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
