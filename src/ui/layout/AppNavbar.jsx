import React, { useEffect, useMemo, useRef, useState } from "react";
import { NAV_ITEMS, normalizePage } from "../nav/navConfig.js";

const THEMES = [
  { key: "theme-slate", label: "Slate (Dark)" },
  { key: "theme-light", label: "Light (High contrast)" },
  { key: "theme-teal", label: "Teal (Dark)" },
];
const THEME_STORAGE_KEY = "hg_theme";

function applyThemeClass(themeKey) {
  // Apply to <body>
  const body = document.body;
  THEMES.forEach((t) => body.classList.remove(t.key));
  body.classList.add(themeKey);

  // Apply to app root (div.hg) as well (covers projects where tokens are scoped to .hg)
  const hg = document.querySelector(".hg");
  if (hg) {
    THEMES.forEach((t) => hg.classList.remove(t.key));
    hg.classList.add(themeKey);
  }
}

export default function AppNavbar({ page }) {
  const activeKey = useMemo(() => normalizePage(page), [page]);

  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("theme-slate");

  useEffect(() => setMounted(true), []);

  // Read stored theme only after mount (client-only)
  useEffect(() => {
    if (!mounted) return;
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      saved = null;
    }
    const initial = THEMES.some((t) => t.key === saved) ? saved : "theme-slate";
    setTheme(initial);
  }, [mounted]);

  // Apply theme to DOM (body + .hg)
  useEffect(() => {
    if (!mounted) return;

    applyThemeClass(theme);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [mounted, theme]);

  // clock refs
  const hourRef = useRef(null);
  const minRef = useRef(null);
  const secRef = useRef(null);
  const digitalRef = useRef(null);

  useEffect(() => {
    if (!mounted) return;

    let raf = 0;
    const pad2 = (n) => String(n).padStart(2, "0");

    const tick = () => {
      const hourEl = hourRef.current;
      const minEl = minRef.current;
      const secEl = secRef.current;

      if (hourEl && minEl && secEl) {
        const now = new Date();
        const ms = now.getMilliseconds();
        const sec = now.getSeconds() + ms / 1000;
        const min = now.getMinutes() + sec / 60;
        const hr = (now.getHours() % 12) + min / 60;

        hourEl.style.transform = `translate(-50%, -100%) rotate(${hr * 30}deg)`;
        minEl.style.transform = `translate(-50%, -100%) rotate(${min * 6}deg)`;
        secEl.style.transform = `translate(-50%, -100%) rotate(${sec * 6}deg)`;

        const digitalEl = digitalRef.current;
        if (digitalEl) {
          digitalEl.textContent = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mounted]);

  // search
  const [query, setQuery] = useState("");
  function onSubmitSearch(e) {
    e.preventDefault();
    const q = query.trim();
    window.dispatchEvent(new CustomEvent("globalSearch", { detail: { query: q } }));
  }

  const homeActive = activeKey === "stagingResults";
  const pages = NAV_ITEMS;
  const dropdownActive = ["stagingResults", "import", "edit", "stringPatterns"].includes(activeKey);

  return (
    <nav className="navbar navbar-expand-lg navbar-icon-top shadow-sm">
      <div className="container-fluid">
        <a className="navbar-brand fw-semibold" href="/">
          Menu
        </a>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNavbar">
          {/* LEFT */}
          <ul className="navbar-nav me-lg-3 mb-2 mb-lg-0">
            <li className="nav-item">
              <a className={`nav-link ${homeActive ? "active" : ""}`} href="/">
                <i className="bi bi-house" aria-hidden="true"></i>
                <span className="nav-text">Home</span>
              </a>
            </li>

            <li className="nav-item">
              <a className="nav-link" href="#" onClick={(e) => e.preventDefault()}>
                <span className="icon-badge">
                  <i className="bi bi-envelope" aria-hidden="true"></i>
                  <span className="badge rounded-pill bg-primary">11</span>
                </span>
                <span className="nav-text">Messages</span>
              </a>
            </li>

            <li className="nav-item dropdown">
              <a
                className={`nav-link dropdown-toggle ${dropdownActive ? "active" : ""}`}
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                onClick={(e) => e.preventDefault()}
              >
                <span className="icon-badge">
                  <i className="bi bi-grid" aria-hidden="true"></i>
                  <span className="badge rounded-pill bg-info text-dark">{pages.length}</span>
                </span>
                <span className="nav-text">Dropdown</span>
              </a>

              <ul className="dropdown-menu">
                {pages.map((it) => {
                  const isActive = it.key === activeKey;
                  return (
                    <li key={it.key}>
                      <a className={`dropdown-item ${isActive ? "active" : ""}`} href={it.href}>
                        {it.label}
                      </a>
                    </li>
                  );
                })}
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li className="px-3 py-1 text-muted small">
                  CLI: <code>npm run import</code>
                </li>
              </ul>
            </li>
          </ul>

          {/* CENTER CLOCK */}
          <div className="d-none d-sm-flex justify-content-center flex-grow-1 my-3 my-lg-0">
            {mounted ? (
              <div className="clock-wrap" aria-label="Klok">
                <div className="clock" aria-hidden="true">
                  <div className="hand hour" ref={hourRef}></div>
                  <div className="hand minute" ref={minRef}></div>
                  <div className="hand second" ref={secRef}></div>
                  <div className="clock-center"></div>
                </div>
                <div className="clock-digital" ref={digitalRef} aria-label="Digitale tijd"></div>
              </div>
            ) : (
              <div className="clock-wrap" aria-hidden="true">
                <div className="clock">
                  <div className="clock-center"></div>
                </div>
                <div className="clock-digital">&nbsp;</div>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <ul className="navbar-nav ms-lg-3 mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link" href="#" onClick={(e) => e.preventDefault()}>
                <span className="icon-badge">
                  <i className="bi bi-bell" aria-hidden="true"></i>
                  <span className="badge rounded-pill bg-warning text-dark">9</span>
                </span>
                <span className="nav-text">Alerts</span>
              </a>
            </li>

            <li className="nav-item">
              <a className="nav-link" href="#" onClick={(e) => e.preventDefault()}>
                <span className="icon-badge">
                  <i className="bi bi-globe2" aria-hidden="true"></i>
                  <span className="badge rounded-pill bg-secondary">8</span>
                </span>
                <span className="nav-text">News</span>
              </a>
            </li>

            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                onClick={(e) => e.preventDefault()}
              >
                <i className="bi bi-palette" aria-hidden="true"></i>
                <span className="nav-text">Theme</span>
              </a>

              <ul className="dropdown-menu dropdown-menu-end" aria-label="Theme selector">
                {THEMES.map((t) => (
                  <li key={t.key}>
                    <button
                      className={`dropdown-item ${theme === t.key ? "active" : ""}`}
                      type="button"
                      aria-pressed={theme === t.key ? "true" : "false"}
                      onClick={() => setTheme(t.key)}
                    >
                      {t.label}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          </ul>

          <form className="d-flex ms-lg-3" role="search" onSubmit={onSubmitSearch}>
            <input
              className="form-control me-2 hg-search-input"
              type="search"
              placeholder="Search"
              aria-label="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn hg-search-btn" type="submit">
              Search
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}