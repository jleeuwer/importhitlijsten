// services/discogsClient.js
import { logger } from "../config/logger.js";

const DEFAULT_BASE_URL = "https://api.discogs.com";
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_CACHE_TTL_SECONDS = 21600;
const LOG_CONTEXT = { module: "importhitlijst", feature: "discogs" };

const cache = new Map();

function getConfig() {
  return {
    baseUrl: process.env.DISCOGS_BASE_URL || DEFAULT_BASE_URL,
    userToken: process.env.DISCOGS_USER_TOKEN || "",
    userAgent: process.env.DISCOGS_USER_AGENT || "Importhitlijst/2G-B1 local-dev",
    timeoutMs: Number(process.env.DISCOGS_REQUEST_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
    cacheTtlMs: Number(process.env.DISCOGS_CACHE_TTL_SECONDS || DEFAULT_CACHE_TTL_SECONDS) * 1000
  };
}

function buildCacheKey(path, params) {
  return `${path}?${new URLSearchParams(params).toString()}`;
}

function readCache(cacheKey, now = Date.now()) {
  const hit = cache.get(cacheKey);
  if (!hit) return null;
  if (hit.expiresAt <= now) {
    cache.delete(cacheKey);
    return null;
  }
  return hit.value;
}

function writeCache(cacheKey, value, ttlMs, now = Date.now()) {
  cache.set(cacheKey, { value, expiresAt: now + ttlMs });
}

function normalizeFormats(format) {
  if (Array.isArray(format)) return format.filter(Boolean).map(String);
  if (typeof format === "string" && format.trim()) return [format.trim()];
  return [];
}

export function normalizeDiscogsSearchResult(item) {
  const id = item?.id == null ? null : Number(item.id);
  const masterId = item?.master_id == null ? (item?.type === "master" ? id : null) : Number(item.master_id);
  const releaseId = item?.type === "release" ? id : null;

  return {
    id,
    type: item?.type || null,
    title: item?.title || "",
    uri: item?.uri || null,
    resourceUrl: item?.resource_url || null,
    thumb: item?.thumb || null,
    coverImage: item?.cover_image || null,
    year: item?.year == null ? null : Number(item.year),
    country: item?.country || null,
    format: normalizeFormats(item?.format),
    label: Array.isArray(item?.label) ? item.label.filter(Boolean).map(String) : [],
    genre: Array.isArray(item?.genre) ? item.genre.filter(Boolean).map(String) : [],
    style: Array.isArray(item?.style) ? item.style.filter(Boolean).map(String) : [],
    masterId: Number.isFinite(masterId) ? masterId : null,
    releaseId: Number.isFinite(releaseId) ? releaseId : null,
    discogsUrl: item?.uri ? `https://www.discogs.com${item.uri}` : null
  };
}

export function buildDiscogsSearchParams({ artist, title, type, format, year, country, page = 1, perPage = 25 } = {}) {
  const query = [artist, title].map((v) => String(v ?? "").trim()).filter(Boolean).join(" ");
  const params = {
    q: query,
    page: String(page || 1),
    per_page: String(perPage || 25)
  };
  if (type) params.type = String(type);
  if (format) params.format = String(format);
  if (year) params.year = String(year);
  if (country) params.country = String(country);
  return params;
}

function normalizeTracklist(tracklist) {
  if (!Array.isArray(tracklist)) return [];
  return tracklist
    .map((track) => ({
      position: track?.position || "",
      title: track?.title || "",
      duration: track?.duration || ""
    }))
    .filter((track) => track.position || track.title || track.duration);
}

function normalizeCatalogNumbers(payload) {
  if (!Array.isArray(payload?.companies) && !Array.isArray(payload?.labels)) return [];
  const values = [];
  if (Array.isArray(payload.labels)) {
    payload.labels.forEach((label) => {
      const catno = String(label?.catno || "").trim();
      if (catno && catno.toLowerCase() !== "none") values.push(catno);
    });
  }
  if (Array.isArray(payload.companies)) {
    payload.companies.forEach((company) => {
      const catno = String(company?.catno || "").trim();
      if (catno && catno.toLowerCase() !== "none") values.push(catno);
    });
  }
  return Array.from(new Set(values)).slice(0, 6);
}

function normalizeArtistNames(artists) {
  if (!Array.isArray(artists)) return [];
  return artists.map((artist) => artist?.name).filter(Boolean).map(String);
}

function normalizeReleaseFormats(formats) {
  if (!Array.isArray(formats)) return [];
  const values = [];
  formats.forEach((format) => {
    if (format?.name) values.push(String(format.name));
    if (Array.isArray(format?.descriptions)) {
      format.descriptions.forEach((value) => value && values.push(String(value)));
    }
  });
  return Array.from(new Set(values));
}

export function normalizeDiscogsDetailPayload(type, payload = {}) {
  const normalizedType = String(type || payload.type || "").toLowerCase() === "master" ? "master" : "release";
  const artists = normalizeArtistNames(payload.artists);
  const formats = normalizeReleaseFormats(payload.formats);
  return {
    id: payload.id == null ? null : Number(payload.id),
    type: normalizedType,
    title: payload.title || "",
    artists,
    artist: artists.join(", "),
    year: payload.year == null ? null : Number(payload.year),
    country: payload.country || null,
    formats,
    catalogNumbers: normalizeCatalogNumbers(payload),
    discogsUrl: payload.uri || (payload.id ? `https://www.discogs.com/${normalizedType}/${payload.id}` : null),
    resourceUrl: payload.resource_url || null,
    genres: Array.isArray(payload.genres) ? payload.genres.filter(Boolean).map(String) : [],
    styles: Array.isArray(payload.styles) ? payload.styles.filter(Boolean).map(String) : [],
    mainRelease: payload.main_release == null ? null : Number(payload.main_release),
    versionsUrl: payload.versions_url || null,
    tracklist: normalizeTracklist(payload.tracklist)
  };
}

export async function getDiscogsDetails({ type, id, fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== "function") {
    const err = new Error("Discogs details require fetch support");
    err.status = 500;
    throw err;
  }

  const normalizedType = String(type || "").toLowerCase();
  const numericId = Number(id);
  if (!["master", "release"].includes(normalizedType)) {
    const err = new Error("Discogs detail type must be master or release");
    err.status = 400;
    throw err;
  }
  if (!Number.isInteger(numericId) || numericId <= 0) {
    const err = new Error("Discogs detail id is required");
    err.status = 400;
    throw err;
  }

  const config = getConfig();
  const path = normalizedType === "master" ? `/masters/${numericId}` : `/releases/${numericId}`;
  const cacheKey = buildCacheKey(path, {});
  const cached = readCache(cacheKey);
  if (cached) return { ...cached, cacheHit: true };

  const url = new URL(path, config.baseUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const headers = {
      "User-Agent": config.userAgent,
      Accept: "application/json"
    };
    if (config.userToken) {
      headers.Authorization = `Discogs token=${config.userToken}`;
    }

    const response = await fetchImpl(url.toString(), { headers, signal: controller.signal });
    const rateLimit = {
      limit: response.headers?.get?.("x-discogs-ratelimit") || null,
      remaining: response.headers?.get?.("x-discogs-ratelimit-remaining") || null,
      used: response.headers?.get?.("x-discogs-ratelimit-used") || null
    };

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const err = new Error(`Discogs details failed: HTTP ${response.status}${text ? ` ${text.slice(0, 200)}` : ""}`);
      err.status = response.status;
      err.rateLimit = rateLimit;
      throw err;
    }

    const payload = await response.json();
    const result = {
      ok: true,
      type: normalizedType,
      id: numericId,
      cacheHit: false,
      rateLimit,
      detail: normalizeDiscogsDetailPayload(normalizedType, payload)
    };
    writeCache(cacheKey, result, config.cacheTtlMs);
    return result;
  } catch (error) {
    logger.warn("Discogs details failed", {
      ...LOG_CONTEXT,
      operation: "getDiscogsDetails",
      message: error?.message || String(error),
      type: normalizedType,
      id: numericId
    });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchDiscogs({ artist, title, type, format, year, country, page = 1, perPage = 25, fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== "function") {
    const err = new Error("Discogs search requires fetch support");
    err.status = 500;
    throw err;
  }

  const config = getConfig();
  const params = buildDiscogsSearchParams({ artist, title, type, format, year, country, page, perPage });
  if (!params.q) {
    const err = new Error("artist or title is required for Discogs search");
    err.status = 400;
    throw err;
  }

  const path = "/database/search";
  const cacheKey = buildCacheKey(path, params);
  const cached = readCache(cacheKey);
  if (cached) return { ...cached, cacheHit: true };

  const url = new URL(path, config.baseUrl);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const headers = {
      "User-Agent": config.userAgent,
      Accept: "application/json"
    };
    if (config.userToken) {
      headers.Authorization = `Discogs token=${config.userToken}`;
    }

    const response = await fetchImpl(url.toString(), { headers, signal: controller.signal });
    const rateLimit = {
      limit: response.headers?.get?.("x-discogs-ratelimit") || null,
      remaining: response.headers?.get?.("x-discogs-ratelimit-remaining") || null,
      used: response.headers?.get?.("x-discogs-ratelimit-used") || null
    };

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const err = new Error(`Discogs search failed: HTTP ${response.status}${text ? ` ${text.slice(0, 200)}` : ""}`);
      err.status = response.status;
      err.rateLimit = rateLimit;
      throw err;
    }

    const payload = await response.json();
    const result = {
      ok: true,
      query: params,
      cacheHit: false,
      pagination: payload.pagination || null,
      rateLimit,
      results: Array.isArray(payload.results) ? payload.results.map(normalizeDiscogsSearchResult) : []
    };
    writeCache(cacheKey, result, config.cacheTtlMs);
    return result;
  } catch (error) {
    logger.warn("Discogs search failed", {
      ...LOG_CONTEXT,
      operation: "searchDiscogs",
      message: error?.message || String(error),
      artist,
      title,
      type
    });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function clearDiscogsCache() {
  cache.clear();
}
