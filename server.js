import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "node:crypto";

import { router } from "./routes/indexroutes.js"; // (op mac case-insensitive; op linux: zorg dat import klopt)
import { logger } from "./config/logger.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { pool } from "./config/db.js";
import { cleanupExpiredImportCandidates, scheduleImportCandidateCleanup } from "./services/importUploadCandidateService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3003;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/**
 * 1) Generate a per-request nonce for inline scripts (SSR bootstrap)
 */
app.use((req, res, next) => {
  res.locals.cspNonce = randomBytes(16).toString("base64");
  next();
});

/**
 * 2) Helmet without CSP (we set CSP ourselves so we can inject the nonce)
 */
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

/**
 * 3) Custom CSP (DEV uses VITE_DEV_ORIGIN dynamically)
 */
app.use((req, res, next) => {
  const nonce = res.locals.cspNonce || randomBytes(16).toString("base64");
  res.locals.cspNonce = nonce;

  const isDev = process.env.NODE_ENV === "development";

  const viteOrigin =
    process.env.VITE_DEV_ORIGIN ||
    `http://localhost:${process.env.VITE_PORT || 5173}`;

  const viteWsOrigin = viteOrigin.replace(/^http/, "ws");

  const scriptSrc = new Set(["'self'", `'nonce-${nonce}'`]);
  const connectSrc = new Set(["'self'"]);

  if (isDev) {
    // allow Vite dev modules + React refresh tooling
    scriptSrc.add(viteOrigin);
    scriptSrc.add("'unsafe-eval'"); // often needed for React refresh/dev

    connectSrc.add(viteOrigin);
    connectSrc.add(viteWsOrigin);
  }

  const csp = [
    `default-src 'self'`,
    `script-src ${Array.from(scriptSrc).join(" ")}`,
    `script-src-elem ${Array.from(scriptSrc).join(" ")}`,
    `script-src-attr 'none'`,

    // Bootstrap CDN CSS + inline styles used by Bootstrap
    `style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net`,
    `img-src 'self' data:`,
    `font-src 'self' https://cdn.jsdelivr.net data:`,

    `connect-src ${Array.from(connectSrc).join(" ")}`,

    `object-src 'none'`,
    `base-uri 'self'`,
    `frame-ancestors 'none'`
  ].join("; ");

  res.setHeader("Content-Security-Policy", csp);
  next();
});

/**
 * 4) CORS + parsers + logging
 */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  morgan("combined", {
    stream: { write: (msg) => logger.info(msg.trim()) }
  })
);

/**
 * 5) Static assets
 */
app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "dist/assets")));

/**
 * 6) Routes + error handling
 */
app.use(router);

app.use(notFound);
app.use(errorHandler);

/**
 * 7) Startup DB check (non-fatal)
 */
try {
  await pool.query("SELECT 1");
  logger.info("DB reachable ✅");
  await cleanupExpiredImportCandidates();
  scheduleImportCandidateCleanup();
} catch (e) {
  logger.error("DB unreachable or startup cleanup failed ❌", { message: e.message });
}

app.listen(port, () => {
  logger.info(`Server listening on http://localhost:${port}`);
});