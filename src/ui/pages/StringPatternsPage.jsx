import React, { useEffect, useState } from "react";
import { Alert, Button, Form, Spinner, Table } from "react-bootstrap";

function normalizeInput(s) {
  return String(s ?? "").trim().replace(/\s+/g, " ");
}

async function readErrorText(resp) {
  // Try to parse JSON error, fallback to text
  const ct = resp.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const j = await resp.json().catch(() => ({}));
    if (j?.error) return j.error;
    return JSON.stringify(j);
  }
  return await resp.text();
}

export default function StringPatternsPage() {
  const [rows, setRows] = useState([]);
  const [newValue, setNewValue] = useState("");
  const [editingKey, setEditingKey] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  async function load() {
    const r = await fetch("/api/string-patterns");
    if (!r.ok) throw new Error(await readErrorText(r));
    const data = await r.json();
    setRows(data.rows || []);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message || String(e)));
  }, []);

  async function onCreate() {
    const v = normalizeInput(newValue);
    if (!v) return;

    const r = await fetch("/api/string-patterns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ st_string_delete: v })
    });

    if (!r.ok) {
      if (r.status === 409) throw new Error("Pattern already exists.");
      throw new Error(await readErrorText(r));
    }

    setNewValue("");
    await load();
    setMsg("Pattern added.");
  }

  async function onSaveEdit(st_key) {
    const v = normalizeInput(editingValue);
    if (!v) return;

    const r = await fetch(`/api/string-patterns/${st_key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ st_string_delete: v })
    });

    if (!r.ok) {
      if (r.status === 409) throw new Error("Pattern already exists.");
      throw new Error(await readErrorText(r));
    }

    setEditingKey(null);
    setEditingValue("");
    await load();
    setMsg("Pattern updated.");
  }

  async function onDelete(st_key, st_string_delete) {
    const ok = window.confirm(`Delete this pattern?\n\n${st_string_delete}`);
    if (!ok) return;

    const r = await fetch(`/api/string-patterns/${st_key}`, { method: "DELETE" });
    if (!r.ok) throw new Error(await readErrorText(r));

    await load();
    setMsg("Pattern deleted.");
  }

  return (
    <div>
      <h4>String delete patterns</h4>
      <div className="small text-muted mb-3">Manage strings that should be removed during cleanup.</div>

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

      <Form
        className="mb-3"
        onSubmit={(e) => {
          e.preventDefault();
          (async () => {
            try {
              setBusy(true);
              setErr(null);
              setMsg(null);
              await onCreate();
            } catch (e2) {
              setErr(e2.message || String(e2));
            } finally {
              setBusy(false);
            }
          })();
        }}
      >
        <div className="row g-2 align-items-end">
          <div className="col-md-10">
            <Form.Label>st_string_delete</Form.Label>
            <Form.Control
              value={newValue}
              disabled={busy}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="e.g. (Live), (Remastered), feat."
            />
          </div>
          <div className="col-md-2 d-grid">
            <Button type="submit" disabled={busy || !normalizeInput(newValue)}>
              {busy ? <Spinner size="sm" /> : "Add"}
            </Button>
          </div>
        </div>
      </Form>

      <div className="table-responsive">
        <Table bordered hover size="sm" className="align-middle">
          <thead>
            <tr>
              <th style={{ width: 100 }}>st_key</th>
              <th>st_string_delete</th>
              <th style={{ width: 240 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isEditing = editingKey === r.st_key;

              return (
                <tr key={r.st_key}>
                  <td>{r.st_key}</td>
                  <td>
                    {isEditing ? (
                      <Form.Control
                        size="sm"
                        value={editingValue}
                        disabled={busy}
                        onChange={(e) => setEditingValue(e.target.value)}
                      />
                    ) : (
                      r.st_string_delete
                    )}
                  </td>
                  <td className="d-flex gap-2">
                    {!isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          disabled={busy}
                          onClick={() => {
                            setEditingKey(r.st_key);
                            setEditingValue(r.st_string_delete || "");
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          disabled={busy}
                          onClick={async () => {
                            try {
                              setBusy(true);
                              setErr(null);
                              setMsg(null);
                              await onDelete(r.st_key, r.st_string_delete);
                            } catch (e2) {
                              setErr(e2.message || String(e2));
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="success"
                          disabled={busy || !normalizeInput(editingValue)}
                          onClick={async () => {
                            try {
                              setBusy(true);
                              setErr(null);
                              setMsg(null);
                              await onSaveEdit(r.st_key);
                            } catch (e2) {
                              setErr(e2.message || String(e2));
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          disabled={busy}
                          onClick={() => {
                            setEditingKey(null);
                            setEditingValue("");
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="text-muted">
                  No patterns yet.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
