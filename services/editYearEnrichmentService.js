// services/editYearEnrichmentService.js
import { logger } from "../config/logger.js";

const ACTIVE_FILE_DETAILS_SQL = "lower(btrim(coalesce(fd.fd_action::text, 'Keep'))) NOT IN ('delete', 'duplicates', 'skip')";
const EXPORTABLE_STAGING_SQL = "lower(btrim(coalesce(s.fd_action::text, ''))) <> 'skip'";

function normalizePositions(hlPosities) {
  return Array.from(
    new Set(
      (Array.isArray(hlPosities) ? hlPosities : [])
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    )
  );
}

function normalizeYear(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function isMissingYear(value) {
  if (value === null || value === undefined || value === "") return true;
  const n = Number(value);
  return !Number.isInteger(n) || n <= 0;
}

function isComposedValue(value) {
  return Number(value ?? 0) > 0;
}

function summarize(results) {
  const summary = {
    scanned: results.length,
    eligible: 0,
    updateable: 0,
    updated: 0,
    skippedAlreadyFilled: 0,
    skippedNoMatch: 0,
    skippedMissingCorrectData: 0,
    skippedAmbiguous: 0,
    skippedNoUsableYear: 0,
    multipleCandidates: 0,
    multipleCandidateYears: 0,
    composedWarnings: 0
  };

  for (const item of results) {
    if (item.eligible) summary.eligible++;
    if (item.status === "UPDATEABLE") summary.updateable++;
    if (item.status === "UPDATED") summary.updated++;
    if (item.status === "SKIPPED_ALREADY_FILLED") summary.skippedAlreadyFilled++;
    if (item.status === "SKIPPED_NO_MATCH") summary.skippedNoMatch++;
    if (item.status === "SKIPPED_MISSING_CORRECT_DATA") summary.skippedMissingCorrectData++;
    if (item.status === "SKIPPED_AMBIGUOUS") summary.skippedAmbiguous++;
    if (item.status === "SKIPPED_NO_USABLE_YEAR") summary.skippedNoUsableYear++;
    if (Number(item.matchCount ?? 0) > 1) summary.multipleCandidates++;
    if (Number(item.distinctCandidateYears ?? 0) > 1) summary.multipleCandidateYears++;
    if (item.isComposed) summary.composedWarnings++;
  }

  return summary;
}

function makeWarnings(base) {
  const warnings = [];
  if (Number(base.matchCount ?? 0) > 1) {
    warnings.push("Meerdere file_details-kandidaten gevonden; fd_year_song_publish wordt uit één geldige kandidaat gebruikt.");
  }
  if (Number(base.distinctCandidateYears ?? 0) > 1) {
    warnings.push("Meerdere verschillende publicatiejaren gevonden in file_details; controleer brondata indien nodig.");
  }
  return warnings;
}

function rowToDecision(row) {
  const matchCount = Number(row.match_count ?? 0);
  const distinctCandidateYears = Number(row.distinct_candidate_years ?? 0);
  const currentYear = row.hl_jaar == null ? null : Number(row.hl_jaar);
  const publishYear = normalizeYear(row.fd_year_song_publish);
  const missingYear = isMissingYear(row.hl_jaar);
  const hasCorrectTitle = String(row.fd_tag_title ?? "").trim() !== "";
  const hasArtistKey = row.hl_artist_key !== null && row.hl_artist_key !== undefined && row.hl_artist_key !== "";
  const isComposed = false;

  const base = {
    hlPositie: Number(row.hl_positie),
    hl_positie: Number(row.hl_positie),
    hl_artiest: row.hl_artiest ?? null,
    hl_titel_song: row.hl_titel_song ?? null,
    fd_tag_title: row.fd_tag_title ?? null,
    as_correcte_artiest_spelling: row.as_correcte_artiest_spelling ?? null,
    hl_artist_key: row.hl_artist_key ?? null,
    currentYear,
    candidateYear: publishYear,
    fd_year_song_publish: publishYear,
    fd_year_song_version: null,
    sourceFdKey: row.source_fd_key == null ? null : Number(row.source_fd_key),
    matchCount,
    distinctCandidateYears,
    isComposed,
    eligible: missingYear,
    warnings: [],
    reason: null,
    status: null
  };

  if (!missingYear) {
    return { ...base, status: "SKIPPED_ALREADY_FILLED", reason: "hl_jaar is al gevuld" };
  }

  if (!hasCorrectTitle || !hasArtistKey) {
    return {
      ...base,
      status: "SKIPPED_MISSING_CORRECT_DATA",
      reason: "Correcte titel of artist-key ontbreekt; match op correcte artiest + correcte titel is niet mogelijk"
    };
  }

  if (matchCount === 0) {
    return { ...base, status: "SKIPPED_NO_MATCH", reason: "Geen file_details match met fd_year_song_publish > 0 voor correcte titel + correcte artiest" };
  }

  if (!publishYear) {
    return { ...base, status: "SKIPPED_NO_USABLE_YEAR", reason: "File_details match heeft geen bruikbaar fd_year_song_publish" };
  }

  const updateable = {
    ...base,
    status: "UPDATEABLE",
    reason: `Kan hl_jaar aanvullen met ${publishYear} uit file_details.fd_year_song_publish`
  };
  return { ...updateable, warnings: makeWarnings(updateable) };
}

export async function previewYearEnrichmentForRun(client, runId, hlPosities = []) {
  const safePositions = normalizePositions(hlPosities);
  const params = [runId];
  let positionFilterSql = "";

  if (safePositions.length > 0) {
    params.push(safePositions);
    positionFilterSql = `AND s.hl_positie = ANY($${params.length}::int[])`;
  }

  const result = await client.query(
    `
    WITH staging AS (
      SELECT
        s.hl_import_run_id,
        s.hl_hitlijst,
        s.hl_uitzendjaar,
        s.hl_positie,
        s.hl_artiest,
        s.hl_titel_song,
        s.hl_jaar,
        s.fd_tag_title,
        s.as_correcte_artiest_spelling,
        s.hl_artist_key,
        s.omroep_key,
        s.periode_key,
        s.fd_action
      FROM public.staging_hitlijsten s
      WHERE s.hl_import_run_id = $1
        AND ${EXPORTABLE_STAGING_SQL}
        ${positionFilterSql}
    )
    SELECT
      s.*,
      COALESCE(fd_stats.match_count, 0)::int AS match_count,
      fd_stats.source_fd_key,
      fd_stats.fd_year_song_publish,
      COALESCE(fd_stats.distinct_candidate_years, 0)::int AS distinct_candidate_years
    FROM staging s
    LEFT JOIN LATERAL (
      SELECT
        COUNT(fd.fd_key)::int AS match_count,
        MIN(fd.fd_key)::int AS source_fd_key,
        MIN(fd.fd_year_song_publish)::int AS fd_year_song_publish,
        COUNT(DISTINCT fd.fd_year_song_publish)::int AS distinct_candidate_years
      FROM public.file_details fd
      WHERE s.fd_tag_title IS NOT NULL
        AND s.hl_artist_key IS NOT NULL
        AND fd.fd_tag_title = s.fd_tag_title
        AND fd.fd_artist_key = s.hl_artist_key
        AND fd.fd_year_song_publish > 0
        AND ${ACTIVE_FILE_DETAILS_SQL}
    ) fd_stats ON true
    ORDER BY s.hl_positie
    `,
    params
  );

  const rows = result.rows.map(rowToDecision);
  const summary = summarize(rows);

  return {
    runId,
    requested: safePositions.length,
    mode: "YEAR_ENRICHMENT_FROM_FILE_DETAILS",
    ...summary,
    preview: rows.slice(0, 50),
    rows
  };
}

async function writeYearEnrichmentAudit(client, { row, runId, reason = null }) {
  const auditResult = await client.query(
    `
      INSERT INTO public.importhitlijst_corrections_audit (
        run_id,
        hl_positie,
        hl_hitlijst,
        hl_uitzendjaar,
        omroep_key,
        periode_key,
        correction_type,
        old_values,
        new_values,
        hitlijsten_records_updated,
        is_composed,
        reason
      )
      SELECT
        s.hl_import_run_id,
        s.hl_positie,
        s.hl_hitlijst,
        s.hl_uitzendjaar,
        s.omroep_key,
        s.periode_key,
        'YEAR_ENRICHMENT_FROM_FILE_DETAILS',
        $3::jsonb,
        $4::jsonb,
        0,
        $5,
        $6
      FROM public.staging_hitlijsten s
      WHERE s.hl_import_run_id = $1
        AND s.hl_positie = $2
      RETURNING correction_id
    `,
    [
      runId,
      row.hlPositie,
      JSON.stringify({ hl_jaar: row.currentYear }),
      JSON.stringify({
        hl_jaar: row.candidateYear,
        source: "file_details.fd_year_song_publish",
        source_fd_key: row.sourceFdKey,
        match_count: row.matchCount,
        distinct_candidate_years: row.distinctCandidateYears
      }),
      row.isComposed,
      reason
    ]
  );
  return auditResult.rows?.[0]?.correction_id ?? null;
}

export async function applyYearEnrichmentForRun(client, runId, hlPosities = []) {
  const preview = await previewYearEnrichmentForRun(client, runId, hlPosities);
  const updateable = preview.rows.filter((row) => row.status === "UPDATEABLE" && Number.isInteger(row.candidateYear));

  let updated = 0;
  const auditIds = [];

  for (const item of updateable) {
    const stagingResult = await client.query(
      `
      UPDATE public.staging_hitlijsten
      SET hl_jaar = $1
      WHERE hl_import_run_id = $2
        AND hl_positie = $3
        AND (hl_jaar IS NULL OR hl_jaar = 0)
      `,
      [item.candidateYear, runId, item.hlPositie]
    );

    const stagingUpdated = Number(stagingResult.rowCount ?? 0);
    updated += stagingUpdated;

    if (stagingUpdated === 1) {
      const auditId = await writeYearEnrichmentAudit(client, {
        row: item,
        runId,
        reason: "Preview jaarverrijking toegepast: staging_hitlijsten.hl_jaar aangevuld vanuit file_details.fd_year_song_publish; hitlijsten blijft ongewijzigd"
      });
      if (auditId !== null) auditIds.push(auditId);
    }

    item.status = stagingUpdated === 1 ? "UPDATED" : item.status;
    item.reason = stagingUpdated === 1
      ? `staging_hitlijsten.hl_jaar aangevuld met ${item.candidateYear} uit file_details.fd_year_song_publish`
      : item.reason;
  }

  const rows = [
    ...preview.rows.filter((row) => row.status !== "UPDATEABLE"),
    ...updateable
  ].sort((a, b) => a.hlPositie - b.hlPositie);

  const summary = summarize(rows);
  summary.updated = updated;

  logger.info("Year enrichment completed", {
    module: "importhitlijst",
    feature: "yearEnrichment",
    operation: "applyPreviewJaarverrijking",
    runId,
    requested: preview.requested,
    scanned: summary.scanned,
    updated,
    skippedNoMatch: summary.skippedNoMatch,
    multipleCandidates: summary.multipleCandidates,
    multipleCandidateYears: summary.multipleCandidateYears,
    auditIds
  });

  return {
    runId,
    requested: preview.requested,
    mode: "YEAR_ENRICHMENT_FROM_FILE_DETAILS",
    ...summary,
    auditIds,
    preview: rows.slice(0, 50),
    rows
  };
}
