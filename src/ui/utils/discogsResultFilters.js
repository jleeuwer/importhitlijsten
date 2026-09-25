// src/ui/utils/discogsResultFilters.js

const ALL = "ALL";

function cleanText(value) {
  return String(value ?? "").trim();
}

function uniqueSorted(values, sorter = undefined) {
  return Array.from(new Set(values.map(cleanText).filter(Boolean))).sort(sorter);
}

export function normalizeDiscogsType(result = {}) {
  const raw = cleanText(result.type || result.discogs_type).toLowerCase();
  if (raw === "master") return "Master";
  if (raw === "release") return "Release";
  return "Overig";
}

export function extractDiscogsFormats(result = {}) {
  const values = [];
  const candidates = [result.format, result.formats, result.formatDescriptions, result.format_descriptions];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      values.push(...candidate.map(cleanText).filter(Boolean));
    } else if (typeof candidate === "string") {
      values.push(...candidate.split(/[,;/|]+/).map(cleanText).filter(Boolean));
    }
  }

  return uniqueSorted(values, (a, b) => a.localeCompare(b, "nl", { numeric: true, sensitivity: "base" }));
}

export function getDiscogsResultYear(result = {}) {
  const year = result.year ?? result.discogs_year;
  if (year == null || year === "") return "";
  const text = cleanText(year);
  return /^\d{4}$/.test(text) ? text : "";
}

export function getDiscogsResultCountry(result = {}) {
  return cleanText(result.country || result.land || result.discogs_country);
}

export function getDiscogsResultUrl(result = {}) {
  return cleanText(result.discogsUrl || result.discogs_url || result.url || (result.uri ? `https://www.discogs.com${result.uri}` : ""));
}

export function buildDiscogsFilterOptions(results = []) {
  const typeValues = uniqueSorted(results.map(normalizeDiscogsType), (a, b) => {
    const order = { Master: 1, Release: 2, Overig: 3 };
    return (order[a] || 99) - (order[b] || 99) || a.localeCompare(b, "nl");
  });

  const formatValues = uniqueSorted(
    results.flatMap((result) => extractDiscogsFormats(result)),
    (a, b) => a.localeCompare(b, "nl", { numeric: true, sensitivity: "base" })
  );

  const yearValues = uniqueSorted(results.map(getDiscogsResultYear), (a, b) => Number(b) - Number(a));
  const countryValues = uniqueSorted(results.map(getDiscogsResultCountry), (a, b) => a.localeCompare(b, "nl", { sensitivity: "base" }));

  return {
    types: [ALL, ...typeValues],
    formats: [ALL, ...formatValues],
    years: [ALL, ...yearValues],
    countries: [ALL, ...countryValues]
  };
}

export function applyDiscogsFilters(results = [], filters = {}) {
  const type = cleanText(filters.type || ALL);
  const format = cleanText(filters.format || ALL);
  const year = cleanText(filters.year || ALL);
  const country = cleanText(filters.country || ALL);

  return results.filter((result) => {
    if (type !== ALL && normalizeDiscogsType(result) !== type) return false;
    if (format !== ALL && !extractDiscogsFormats(result).includes(format)) return false;
    if (year !== ALL && getDiscogsResultYear(result) !== year) return false;
    if (country !== ALL && getDiscogsResultCountry(result) !== country) return false;
    return true;
  });
}

export function createEmptyDiscogsFilters() {
  return { type: ALL, format: ALL, year: ALL, country: ALL };
}

export const DISCOGS_ALL_FILTER_VALUE = ALL;
