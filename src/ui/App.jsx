import React, { useEffect, useState } from "react";
import { Badge } from "react-bootstrap";

import StagingResults from "./pages/StagingResults.jsx";
import ImportPage from "./pages/ImportPage.jsx";
import EditPage, { EditAside, useEditController } from "./pages/EditPage.jsx";
import StringPatternsPage from "./pages/StringPatternsPage.jsx";

import AppNavbar from "./layout/AppNavbar.jsx";
import { normalizePage } from "./nav/navConfig.js";

function DbStatusBadge({ initial }) {
  const [state, setState] = useState(initial ?? { ok: null });

  useEffect(() => {
    async function refresh() {
      try {
        const r = await fetch("/api/db-health");
        const data = await r.json();
        setState(data);
      } catch (e) {
        setState({ ok: false, error: "fetch failed" });
      }
    }
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, []);

  const ok = state?.ok;

  return (
    <span className="ms-2">
      {ok === true && (
        <Badge bg="success">
          DB OK{typeof state.latencyMs === "number" ? ` (${state.latencyMs}ms)` : ""}
        </Badge>
      )}
      {ok === false && <Badge bg="danger">DB DOWN</Badge>}
      {ok == null && <Badge bg="secondary">DB …</Badge>}
    </span>
  );
}

export default function App({ initialState }) {
  const page = initialState?.page;
  const activeKey = normalizePage(page);

  const editCtrl = useEditController();

  useEffect(() => {
    const onSearch = (e) => {
      // pages can listen if needed
    };
    window.addEventListener("globalSearch", onSearch);
    return () => window.removeEventListener("globalSearch", onSearch);
  }, []);

  return (
    <div className="hg">
      <header className="hg__header">
        <AppNavbar page={page} />
      </header>

      <div className="hg__body">
        <nav className="hg__nav" aria-label="Sidebar navigation">
          <div className="hg__navTitle">
            <strong>Nav</strong>
          </div>
          <ul className="hg__navList">
            <li><a className={activeKey === "stagingResults" ? "active" : ""} href="/">Runs</a></li>
            <li><a className={activeKey === "import" ? "active" : ""} href="/import">Import</a></li>
            <li><a className={activeKey === "stringPatterns" ? "active" : ""} href="/string-patterns">String patterns</a></li>
          </ul>
        </nav>

        <main className="hg__main">
          {activeKey === "stringPatterns" ? (
            <StringPatternsPage />
          ) : activeKey === "import" ? (
            <ImportPage initialState={initialState} />
          ) : activeKey === "edit" ? (
            <EditPage ctrl={editCtrl} />
          ) : (
            <StagingResults initialState={initialState} />
          )}
        </main>

        <aside className="hg__aside">
          {activeKey === "edit" ? (
            <EditAside ctrl={editCtrl} />
          ) : activeKey === "stringPatterns" ? (
            <div>
              <div className="small text-muted">
                <strong>Tip</strong>
              </div>
              <div className="small text-muted">
                Add patterns like <code>(Live)</code>, <code>(Remastered)</code>, <code>feat.</code>
              </div>
            </div>
          ) : activeKey === "import" ? (
            <div>
              <div><strong>Import</strong></div>
              <div className="small text-muted">
                Importeer een CSV-bestand. Na een succesvolle import kun je direct de aangemaakte run bewerken.
              </div>
            </div>
          ) : (
            <div>
              <div><strong>Runs</strong></div>
              <div className="small text-muted">
                Kies een import-run en open daarna de bewerkflow vanuit het Runs-overzicht.
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ✅ moved from navbar to footer */}
      <footer className="hg__footer small text-muted d-flex align-items-center justify-content-center gap-2">
        <span>Hitlijst Import</span>
        <DbStatusBadge initial={initialState?.dbHealth} />
      </footer>
    </div>
  );
}