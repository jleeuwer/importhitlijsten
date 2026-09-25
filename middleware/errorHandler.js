import { logger } from "../config/logger.js";

const IGNORE_404_PATHS = new Set([
  "/.well-known/appspecific/com.chrome.devtools.json"
]);

export function notFound(req, res) {
  // Ignore known harmless browser probes
  if (IGNORE_404_PATHS.has(req.path)) {
    return res.status(204).end(); // No Content
  }

  logger.warn("404 Not Found", {
    method: req.method,
    path: req.originalUrl
  });

  res.status(404).send("Not Found");
}

export function errorHandler(err, req, res, next) {
  const statusFromErr = Number.isInteger(err?.status) ? err.status : null;
  const status =
    statusFromErr ?? (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  logger.error("Request failed", {
    status,
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method
  });

  if (req.originalUrl?.startsWith("/api/")) {
    const publicError = err?.code || err?.reasonCode || (status === 409 ? "CONFLICT" : status >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR");
    const publicMessage = err?.code === "EXPLICIT_OVERWRITE_REQUIRED"
      ? "Selecteer een file_details-kandidaat of bevestig expliciet dat je de tekst wilt overschrijven."
      : err?.message || "De actie kon niet worden uitgevoerd.";

    return res.status(status).json({
      ok: false,
      error: publicError,
      message: publicMessage,
      reasonCode: err?.reasonCode ?? null,
      summary: err?.summary ?? undefined
    });
  }

  const body =
    process.env.NODE_ENV === "production"
      ? err?.message || "Server error"
      : err.stack;

  res.status(status).send(body);
}
