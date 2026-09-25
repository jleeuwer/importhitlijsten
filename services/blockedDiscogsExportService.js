const NORMALIZE_TITLE_SQL = (expr) => `lower(regexp_replace(replace(btrim(coalesce(${expr}::text, '')), chr(160), ' '), '\\s+', ' ', 'g'))`;
const ACTIVE_FILE_DETAILS_SQL = "lower(btrim(coalesce(fd.fd_action::text, 'Keep'))) NOT IN ('delete', 'duplicates', 'skip')";
const EXPORTABLE_STAGING_SQL = "lower(btrim(coalesce(s.fd_action::text, ''))) <> 'skip'";

const BLOCKING_REASON_CODES = new Set([
  "MISSING_FD_TAG_TITLE",
  "MISSING_HL_ARTIST_KEY",
  "NO_FILE_DETAILS_TITLE_MATCH",
  "NO_FILE_DETAILS_ARTIST_KEY_MATCH",
  "NO_FILE_DETAILS_COMBINED_MATCH"
]);

function clean(value) {
  return String(value ?? "").trim();
}

function nullableClean(value) {
  const normalized = clean(value);
  return normalized || null;
}

export const NO_DESIRED_VERSION_GROUP_LABEL = "Geen versie gekozen";

export function getDesiredVersionGroupLabel(row = {}) {
  return nullableClean(row.desired_song_type_display)
    || nullableClean(row.st_song_type_desc)
    || nullableClean(row.desired_song_type_desc)
    || nullableClean(row.st_song_type)
    || nullableClean(row.desired_song_type)
    || NO_DESIRED_VERSION_GROUP_LABEL;
}

function normalizeGroupSortLabel(label) {
  return clean(label).toLocaleLowerCase("nl-NL");
}

function determineReasonCode(row = {}) {
  if (!clean(row.fd_tag_title)) return "MISSING_FD_TAG_TITLE";
  if (row.hl_artist_key == null || row.hl_artist_key === "") return "MISSING_HL_ARTIST_KEY";
  if (Number(row.title_match_count ?? 0) === 0) return "NO_FILE_DETAILS_TITLE_MATCH";
  if (Number(row.artist_key_match_count ?? 0) === 0) return "NO_FILE_DETAILS_ARTIST_KEY_MATCH";
  if (Number(row.combined_match_count ?? 0) === 0) return "NO_FILE_DETAILS_COMBINED_MATCH";
  if (Number(row.combined_match_count ?? 0) > 1) return "MULTIPLE_FILE_DETAILS_COMBINED_MATCHES";
  return null;
}

export function selectDiscogsUrl(row = {}) {
  return nullableClean(row.discogs_master_url)
    || nullableClean(row.discogs_release_url)
    || nullableClean(row.hl_discogs_link)
    || null;
}

function buildBlockedDiscogsExportEntry(row = {}) {
  const artist = clean(row.as_correcte_artiest_spelling) || clean(row.correcte_artiest) || clean(row.hl_artiest);
  const title = clean(row.fd_tag_title) || clean(row.correcte_titel) || clean(row.hl_titel_song);
  const url = selectDiscogsUrl(row);

  if (!artist || !title || !url) return null;
  return { titleLine: `${artist} - ${title}`, url };
}

export function buildBlockedDiscogsExportLine(row = {}) {
  const line = buildBlockedDiscogsExportEntry(row);
  return line ? `${line.titleLine} ${line.url}` : null;
}

export function buildBlockedDiscogsExportLineText(row = {}) {
  return buildBlockedDiscogsExportLine(row);
}

export function groupBlockedDiscogsExportRows(rows = []) {
  const groups = new Map();

  for (const row of rows) {
    const line = buildBlockedDiscogsExportEntry(row);
    if (!line) continue;

    const label = getDesiredVersionGroupLabel(row);
    if (!groups.has(label)) {
      groups.set(label, {
        label,
        isFallback: label === NO_DESIRED_VERSION_GROUP_LABEL,
        rows: []
      });
    }

    groups.get(label).rows.push({ row, line });
  }

  return Array.from(groups.values())
    .filter((group) => group.rows.length > 0)
    .sort((a, b) => {
      if (a.isFallback !== b.isFallback) return a.isFallback ? 1 : -1;
      return normalizeGroupSortLabel(a.label).localeCompare(normalizeGroupSortLabel(b.label), "nl-NL");
    });
}

export function buildBlockedDiscogsExportContent(rows = []) {
  const groups = groupBlockedDiscogsExportRows(rows);
  if (groups.length === 0) return "";

  const blocks = groups.map((group) => {
    const lines = [group.label, ""];
    for (const item of group.rows) {
      lines.push(item.line.titleLine, item.line.url, "");
    }
    return lines.join("\n").trimEnd();
  });

  return `${blocks.join("\n\n")}\n`;
}

export function sanitizeFilenamePart(value) {
  const normalized = clean(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "run";
}

export function formatTimestampForFilename(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export function buildBlockedDiscogsFilename({ hl_hitlijst, hl_uitzendjaar, now = new Date() } = {}) {
  const listPart = sanitizeFilenamePart(hl_hitlijst);
  const yearPart = clean(hl_uitzendjaar) || "unknown-year";
  return `blocked-discogs-links-${listPart}-${yearPart}-${formatTimestampForFilename(now)}.txt`;
}

function mapExportableRows(rows = []) {
  return rows
    .map((row) => ({ ...row, reasonCode: row.reasonCode ?? determineReasonCode(row) }))
    .filter((row) => BLOCKING_REASON_CODES.has(row.reasonCode))
    .filter((row) => Boolean(selectDiscogsUrl(row)))
    .filter((row) => Boolean(buildBlockedDiscogsExportLine(row)));
}

async function getBlockedDiscogsRows(client, runId) {
  const res = await client.query(
    `
      WITH staging AS (
        SELECT
          s.hl_import_run_id,
          s.hl_hitlijst,
          s.hl_uitzendjaar,
          s.hl_positie,
          s.hl_artiest,
          s.hl_titel_song,
          s.fd_tag_title,
          s.as_correcte_artiest_spelling,
          s.hl_artist_key,
          s.hl_discogs_link,
          s.discogs_master_url,
          s.discogs_release_url,
          s.hl_desired_song_type_key,
          COALESCE(NULLIF(btrim(dst.st_song_type_desc::text), ''), NULLIF(btrim(dst.st_song_type::text), ''), dst.st_song_type_key::text) AS desired_song_type_display,
          ${NORMALIZE_TITLE_SQL("s.fd_tag_title")} AS normalized_fd_tag_title
        FROM public.staging_hitlijsten s
        LEFT JOIN public.song_types dst
          ON dst.st_song_type_key = s.hl_desired_song_type_key
        WHERE s.hl_import_run_id = $1
          AND ${EXPORTABLE_STAGING_SQL}
      ),
      file_details_by_title AS (
        SELECT
          ${NORMALIZE_TITLE_SQL("fd.fd_tag_title")} AS normalized_fd_tag_title,
          COUNT(*)::int AS title_match_count
        FROM public.file_details fd
        WHERE ${ACTIVE_FILE_DETAILS_SQL}
        GROUP BY 1
      ),
      file_details_by_artist AS (
        SELECT
          fd.fd_artist_key,
          COUNT(*)::int AS artist_key_match_count
        FROM public.file_details fd
        WHERE ${ACTIVE_FILE_DETAILS_SQL}
        GROUP BY fd.fd_artist_key
      ),
      file_details_by_title_artist AS (
        SELECT
          ${NORMALIZE_TITLE_SQL("fd.fd_tag_title")} AS normalized_fd_tag_title,
          fd.fd_artist_key,
          COUNT(*)::int AS combined_match_count
        FROM public.file_details fd
        WHERE ${ACTIVE_FILE_DETAILS_SQL}
        GROUP BY 1, fd.fd_artist_key
      )
      SELECT
        s.hl_import_run_id,
        s.hl_hitlijst,
        s.hl_uitzendjaar,
        s.hl_positie,
        s.hl_artiest,
        s.hl_titel_song,
        s.fd_tag_title,
        s.as_correcte_artiest_spelling,
        s.hl_artist_key,
        s.hl_discogs_link,
        s.discogs_master_url,
        s.discogs_release_url,
        s.hl_desired_song_type_key,
        s.desired_song_type_display,
        COALESCE(t.title_match_count, 0)::int AS title_match_count,
        COALESCE(a.artist_key_match_count, 0)::int AS artist_key_match_count,
        COALESCE(c.combined_match_count, 0)::int AS combined_match_count
      FROM staging s
      LEFT JOIN file_details_by_title t
        ON t.normalized_fd_tag_title = s.normalized_fd_tag_title
      LEFT JOIN file_details_by_artist a
        ON a.fd_artist_key = s.hl_artist_key
      LEFT JOIN file_details_by_title_artist c
        ON c.normalized_fd_tag_title = s.normalized_fd_tag_title
       AND c.fd_artist_key = s.hl_artist_key
      ORDER BY
        CASE WHEN s.hl_desired_song_type_key IS NULL THEN 1 ELSE 0 END ASC,
        lower(COALESCE(s.desired_song_type_display, '')) ASC,
        s.hl_positie ASC NULLS LAST
    `,
    [runId]
  );

  return res.rows || [];
}

export async function getBlockedDiscogsExportSummary({ client, runId }) {
  if (!client?.query) throw new Error("client with query function is required");
  if (!clean(runId)) throw new Error("runId is required");

  const rows = await getBlockedDiscogsRows(client, runId);
  const exportableRows = mapExportableRows(rows);
  return {
    ok: true,
    runId,
    exportableCount: exportableRows.length,
    groupCount: groupBlockedDiscogsExportRows(exportableRows).length
  };
}

export async function exportBlockedDiscogsLinksForRun({ client, runId, now = new Date() }) {
  if (!client?.query) throw new Error("client with query function is required");
  if (!clean(runId)) throw new Error("runId is required");

  const rows = await getBlockedDiscogsRows(client, runId);
  const exportableRows = mapExportableRows(rows);
  const firstRow = rows[0] || {};
  const content = buildBlockedDiscogsExportContent(exportableRows);

  return {
    ok: true,
    runId,
    rowCount: exportableRows.length,
    groupCount: groupBlockedDiscogsExportRows(exportableRows).length,
    filename: buildBlockedDiscogsFilename({
      hl_hitlijst: firstRow.hl_hitlijst,
      hl_uitzendjaar: firstRow.hl_uitzendjaar,
      now
    }),
    content
  };
}
