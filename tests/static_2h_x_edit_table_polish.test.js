/** @vitest-environment node */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";

const editPage = readFileSync("src/ui/pages/EditPage.jsx", "utf8");
const functionalSpec = readFileSync("docs/functional/FUNCTIONAL_SPEC_2H_X_EDIT_TABLE_POLISH.md", "utf8");
const technicalSpec = readFileSync("docs/technical/TECHNICAL_SPEC_2H_X_EDIT_TABLE_POLISH.md", "utf8");
const testCases = readFileSync("docs/testcases/FUNCTIONAL_TEST_CASES_2H_X_EDIT_TABLE_POLISH.md", "utf8");

test("2H-X code bevat veilige Discogs tabel-link helper", () => {
  assert.match(editPage, /export function isSafeDiscogsExternalUrl/);
  assert.match(editPage, /export function resolveDiscogsTableLink/);
  assert.match(editPage, /target="_blank"/);
  assert.match(editPage, /rel="noopener noreferrer"/);
});

test("2H-X code kiest release-link vóór master-link vóór raw fallback", () => {
  const helperStart = editPage.indexOf("export function resolveDiscogsTableLink");
  const helperEnd = editPage.indexOf("function RowEditor", helperStart);
  const helperSource = editPage.slice(helperStart, helperEnd);
  const releaseIndex = helperSource.indexOf("row?.discogs_release_url");
  const masterIndex = helperSource.indexOf("row?.discogs_master_url");
  const rawIndex = helperSource.indexOf("local?.hl_discogs_link || row?.hl_discogs_link");
  assert.ok(releaseIndex > -1, "release url candidate ontbreekt");
  assert.ok(masterIndex > -1, "master url candidate ontbreekt");
  assert.ok(rawIndex > -1, "raw fallback candidate ontbreekt");
  assert.ok(releaseIndex < masterIndex, "release-url moet vóór master-url staan");
  assert.ok(masterIndex < rawIndex, "master-url moet vóór raw fallback staan");
});

test("2H-X code toont artist-key niet meer als hoofdtabelkolom", () => {
  assert.doesNotMatch(editPage, /<th[^>]*>\s*Artiest key/);
  assert.match(editPage, /hl_artist_key/); // intern nog aanwezig voor matching, API en modal-logica
});

test("2H-X documentatie is aanwezig en benoemt geen database-migratie", () => {
  const docs = `${functionalSpec}\n${technicalSpec}\n${testCases}`;
  assert.match(docs, /Discogs-link/);
  assert.match(docs, /Artist-key|artist-key/);
  assert.match(docs, /Geen database-migratie nodig|geen database-migratie/i);
});
