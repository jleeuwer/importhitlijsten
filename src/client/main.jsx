import React from "react";
import { hydrateRoot } from "react-dom/client";
import App from "../ui/App.jsx";

// Bootstrap JS bundle (dropdown/collapse)
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// App styles
import "../ui/styles/hg.css";
import "../ui/styles/navbar.css";

function reportClientError(kind, errorLike, extra = {}) {
  const payload = {
    kind,
    message: errorLike?.message || String(errorLike || "unknown client error"),
    stack: errorLike?.stack || null,
    href: window.location.href,
    ts: new Date().toISOString(),
    ...extra
  };

  try {
    console.error("[importhitlijst:client-error]", payload);
  } catch {}

  try {
    fetch("/api/client-error-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  } catch {}

  return payload;
}

class ClientErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    reportClientError("react-boundary", error, { componentStack: info?.componentStack || null });
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, background: "#2b0000", color: "#fff", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
          <strong>Client render error</strong>{"\n\n"}
          {this.state.error?.message || String(this.state.error)}
          {this.state.error?.stack ? `\n\n${this.state.error.stack}` : ""}
        </div>
      );
    }
    return this.props.children;
  }
}

window.addEventListener("error", (event) => {
  reportClientError("window-error", event?.error || event?.message || "window error", {
    source: event?.filename || null,
    lineno: event?.lineno || null,
    colno: event?.colno || null
  });
});

window.addEventListener("unhandledrejection", (event) => {
  reportClientError("unhandledrejection", event?.reason || "unhandled rejection");
});

console.log("[client] main.jsx loaded");

try {
  hydrateRoot(
    document.getElementById("root"),
    <ClientErrorBoundary>
      <App initialState={window.__INITIAL_STATE__} />
    </ClientErrorBoundary>
  );
} catch (error) {
  reportClientError("hydrateRoot", error);
  throw error;
}
