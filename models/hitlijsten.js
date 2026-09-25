// models/hitlijsten.js
import { pool } from "../config/db.js";
import { logger } from "../config/logger.js";

const LOG_CONTEXT = {
  module: "importhitlijst",
  feature: "exportHitlijsten"
};

function normalizeText(value) {
  return String(value ?? "").trim();
}

const NORMALIZE_TITLE_SQL = (expr) => `lower(regexp_replace(replace(btrim(coalesce(${expr}::text, '')), chr(160), ' '), '\\s+', ' ', 'g'))`;
const ACTIVE_FILE_DETAILS_SQL = "lower(btrim(coalesce(fd.fd_action::text, 'Keep'))) NOT IN ('delete', 'duplicates', 'skip')";
const EXPORTABLE_STAGING_SQL = "lower(btrim(coalesce(s.fd_action::text, ''))) <> 'skip'";

function determineReasonCode(row) {
  if (!normalizeText(row.fd_tag_title)) return "MISSING_FD_TAG_TITLE";
  if (row.hl_artist_key == null) return "MISSING_HL_ARTIST_KEY";
  if (Number(row.title_match_count ?? 0) === 0) return "NO_FILE_DETAILS_TITLE_MATCH";
  if (Number(row.artist_key_match_count ?? 0) === 0) return "NO_FILE_DETAILS_ARTIST_KEY_MATCH";
  if (Number(row.combined_match_count ?? 0) === 0) return "NO_FILE_DETAILS_COMBINED_MATCH";
  if (Number(row.combined_match_count ?? 0) > 1) return "MULTIPLE_FILE_DETAILS_COMBINED_MATCHES";
  return null;
}

function isBlockingReasonCode(reasonCode) {
  return [
    "MISSING_FD_TAG_TITLE",
    "MISSING_HL_ARTIST_KEY",
    "NO_FILE_DETAILS_TITLE_MATCH",
    "NO_FILE_DETAILS_ARTIST_KEY_MATCH",
    "NO_FILE_DETAILS_COMBINED_MATCH"
  ].includes(reasonCode);
}

function isWarningReasonCode(reasonCode) {
  return [
    "MULTIPLE_FILE_DETAILS_COMBINED_MATCHES"
  ].includes(reasonCode);
}

function isSafeDiscogsMasterUrlSql(expr) {
  return `(btrim(coalesce(${expr}::text, '')) ~* '^https://(www[.])?discogs[.]com/master/[0-9]+')`;
}

function isSafeDiscogsReleaseUrlSql(expr) {
  return `(btrim(coalesce(${expr}::text, '')) ~* '^https://(www[.])?discogs[.]com/release/[0-9]+')`;
}

function discogsMasterUrlExportSql() {
  return `
    COALESCE(
      NULLIF(btrim(s.discogs_master_url::text), ''),
      CASE
        WHEN ${isSafeDiscogsMasterUrlSql('s.hl_discogs_link')}
        THEN btrim(s.hl_discogs_link::text)
        ELSE NULL
      END
    )
  `;
}

function discogsReleaseUrlExportSql() {
  return `
    COALESCE(
      NULLIF(btrim(s.discogs_release_url::text), ''),
      CASE
        WHEN ${isSafeDiscogsReleaseUrlSql('s.hl_discogs_link')}
        THEN btrim(s.hl_discogs_link::text)
        ELSE NULL
      END
    )
  `;
}

function discogsSelectedAtExportSql() {
  return `
    COALESCE(
      s.discogs_selected_at,
      CASE
        WHEN ${isSafeDiscogsMasterUrlSql('s.hl_discogs_link')} OR ${isSafeDiscogsReleaseUrlSql('s.hl_discogs_link')}
        THEN now()
        ELSE NULL
      END
    )
  `;
}

async function getRunExportTarget(client, runId) {
  const res = await client.query(
    `
      SELECT
        s.hl_hitlijst,
        s.hl_uitzendjaar,
        COUNT(*)::int AS staging_rows
      FROM public.staging_hitlijsten s
      WHERE s.hl_import_run_id = $1
      GROUP BY s.hl_hitlijst, s.hl_uitzendjaar
      ORDER BY s.hl_hitlijst, s.hl_uitzendjaar
    `,
    [runId]
  );

  if (res.rows.length === 0) {
    return null;
  }

  if (res.rows.length > 1) {
    const err = new Error(
      "Export blocked: this import run contains multiple hitlijst/uitzendjaar combinations."
    );
    err.status = 409;
    err.reasonCode = "MULTIPLE_EXPORT_TARGETS_IN_RUN";
    err.targets = res.rows.map((row) => ({
      hl_hitlijst: row.hl_hitlijst,
      hl_uitzendjaar: row.hl_uitzendjaar,
      stagingRows: Number(row.staging_rows ?? 0)
    }));
    throw err;
  }

  const target = res.rows[0];
  return {
    hl_hitlijst: target.hl_hitlijst,
    hl_uitzendjaar: Number(target.hl_uitzendjaar),
    stagingRows: Number(target.staging_rows ?? 0)
  };
}

async function getExistingExportForTarget(client, target) {
  if (!target) {
    return {
      hl_hitlijst: null,
      hl_uitzendjaar: null,
      existingRowsForTarget: 0,
      alreadyExported: false
    };
  }

  const res = await client.query(
    `
      SELECT COUNT(*)::int AS existing_rows
      FROM public.hitlijsten h
      WHERE h.hl_hitlijst = $1
        AND h.hl_uitzendjaar = $2
    `,
    [target.hl_hitlijst, target.hl_uitzendjaar]
  );

  const existingRowsForTarget = Number(res.rows[0]?.existing_rows ?? 0);
  return {
    hl_hitlijst: target.hl_hitlijst,
    hl_uitzendjaar: target.hl_uitzendjaar,
    existingRowsForTarget,
    alreadyExported: existingRowsForTarget > 0
  };
}

async function getExportValidationCounts(client, runId) {
  const countsRes = await client.query(
    `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE BTRIM(COALESCE(s.fd_tag_title::text, '')) = ''
        )::int AS missing_fd_tag_title,
        COUNT(*) FILTER (
          WHERE s.hl_artist_key IS NULL
        )::int AS missing_hl_artist_key
      FROM public.staging_hitlijsten s
      WHERE s.hl_import_run_id = $1
        AND ${EXPORTABLE_STAGING_SQL}
    `,
    [runId]
  );

  return {
    total: Number(countsRes.rows[0]?.total ?? 0),
    missingFdTagTitle: Number(countsRes.rows[0]?.missing_fd_tag_title ?? 0),
    missingHlArtistKey: Number(countsRes.rows[0]?.missing_hl_artist_key ?? 0)
  };
}

async function getExportValidationIssues(client, runId) {
  const res = await client.query(
    `
      WITH staging AS (
        SELECT
          s.hl_positie,
          s.hl_artiest,
          s.hl_titel_song,
          s.fd_tag_title,
          s.as_correcte_artiest_spelling,
          s.hl_artist_key,
          s.omroep_key,
          s.periode_key,
          s.hl_desired_song_type_key,
          ${NORMALIZE_TITLE_SQL("s.fd_tag_title")} AS normalized_fd_tag_title
        FROM public.staging_hitlijsten s
        WHERE s.hl_import_run_id = $1
          AND ${EXPORTABLE_STAGING_SQL}
      )
      SELECT
        s.hl_positie,
        s.hl_artiest,
        s.hl_titel_song,
        s.fd_tag_title,
        s.as_correcte_artiest_spelling,
        s.hl_artist_key,
        s.hl_desired_song_type_key,
        COALESCE(t.title_match_count, 0)::int AS title_match_count,
        COALESCE(a.artist_key_match_count, 0)::int AS artist_key_match_count,
        COALESCE(c.combined_match_count, 0)::int AS combined_match_count,
        COALESCE(c.candidate_fd_keys, ARRAY[]::integer[]) AS candidate_fd_keys
      FROM staging s
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS title_match_count
        FROM public.file_details fd
        WHERE ${NORMALIZE_TITLE_SQL("fd.fd_tag_title")} = s.normalized_fd_tag_title
          AND ${ACTIVE_FILE_DETAILS_SQL}
      ) t ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS artist_key_match_count
        FROM public.file_details fd
        WHERE fd.fd_artist_key = s.hl_artist_key
          AND ${ACTIVE_FILE_DETAILS_SQL}
      ) a ON true
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS combined_match_count,
          array_agg(fd.fd_key ORDER BY fd.fd_key ASC) AS candidate_fd_keys
        FROM public.file_details fd
        WHERE ${NORMALIZE_TITLE_SQL("fd.fd_tag_title")} = s.normalized_fd_tag_title
          AND fd.fd_artist_key = s.hl_artist_key
          -- Hotfix 4: export validates only artist + title existence.
          -- Desired song type is metadata for composition, not an export blocker.
          AND ${ACTIVE_FILE_DETAILS_SQL}
      ) c ON true
      ORDER BY s.hl_positie ASC NULLS LAST
    `,
    [runId]
  );

  return res.rows
    .map((row) => ({
      ...row,
      reasonCode: determineReasonCode(row)
    }))
    .filter((row) => row.reasonCode != null);
}

function logValidationSummary(operation, runId, summary) {
  logger.info("Export validation summary", {
    ...LOG_CONTEXT,
    operation,
    runId,
    totalRows: summary.total,
    missingFdTagTitle: summary.missingFdTagTitle,
    missingHlArtistKey: summary.missingHlArtistKey,
    missingLinks: summary.missingLinks,
    multipleLinks: summary.multipleLinks
  });
}

function logValidationIssues(operation, runId, issues, { maxLogged = 25 } = {}) {
  issues.slice(0, maxLogged).forEach((issue) => {
    logger.warn("Export validation issue", {
      ...LOG_CONTEXT,
      operation,
      runId,
      hlPositie: issue.hl_positie,
      hlArtiest: issue.hl_artiest,
      hlTitelSong: issue.hl_titel_song,
      fdTagTitle: issue.fd_tag_title,
      asCorrecteArtiestSpelling: issue.as_correcte_artiest_spelling,
      hlArtistKey: issue.hl_artist_key,
      titleMatchCount: Number(issue.title_match_count ?? 0),
      artistKeyMatchCount: Number(issue.artist_key_match_count ?? 0),
      combinedMatchCount: Number(issue.combined_match_count ?? 0),
      reasonCode: issue.reasonCode
    });
  });

  if (issues.length > maxLogged) {
    logger.info("Export issue logging truncated", {
      ...LOG_CONTEXT,
      operation,
      runId,
      loggedIssues: maxLogged,
      totalIssues: issues.length
    });
  }
}

function buildSummary(runId, counts, issues, exportTarget = null, existingExport = null) {
  const blockingIssues = issues.filter((issue) => isBlockingReasonCode(issue.reasonCode));
  const warningIssues = issues.filter((issue) => isWarningReasonCode(issue.reasonCode));
  const ambiguousIssues = issues.filter(
    (issue) => issue.reasonCode === "MULTIPLE_FILE_DETAILS_COMBINED_MATCHES"
  );

  const issuesPreview = [...blockingIssues, ...warningIssues].slice(0, 10).map((issue) => ({
    hl_positie: issue.hl_positie,
    hl_artiest: issue.hl_artiest,
    hl_titel_song: issue.hl_titel_song,
    fd_tag_title: issue.fd_tag_title,
    as_correcte_artiest_spelling: issue.as_correcte_artiest_spelling,
    hl_artist_key: issue.hl_artist_key,
    titleMatchCount: Number(issue.title_match_count ?? 0),
    artistKeyMatchCount: Number(issue.artist_key_match_count ?? 0),
    combinedMatchCount: Number(issue.combined_match_count ?? 0),
    candidateFdKeys: Array.isArray(issue.candidate_fd_keys) ? issue.candidate_fd_keys : [],
    hlDesiredSongTypeKey: issue.hl_desired_song_type_key ?? null,
    reasonCode: issue.reasonCode
  }));

  return {
    runId,
    total: counts.total,
    hl_hitlijst: exportTarget?.hl_hitlijst ?? existingExport?.hl_hitlijst ?? null,
    hl_uitzendjaar: exportTarget?.hl_uitzendjaar ?? existingExport?.hl_uitzendjaar ?? null,
    existingRowsForTarget: Number(existingExport?.existingRowsForTarget ?? 0),
    alreadyExported: existingExport?.alreadyExported === true,
    duplicateExportBlocked: existingExport?.alreadyExported === true,
    missingFdTagTitle: counts.missingFdTagTitle,
    missingHlArtistKey: counts.missingHlArtistKey,
    missingLinks: blockingIssues.filter((issue) =>
      [
        "NO_FILE_DETAILS_TITLE_MATCH",
        "NO_FILE_DETAILS_ARTIST_KEY_MATCH",
        "NO_FILE_DETAILS_COMBINED_MATCH"
      ].includes(issue.reasonCode)
    ).length,
    multipleLinks: ambiguousIssues.length,
    ambiguousLinks: ambiguousIssues.length,
    warningIssues: warningIssues.length,
    issuesPreview
  };
}

/**
 * Precheck: validate staging -> hitlijsten on (fd_tag_title + hl_artist_key).
 */
export async function getExportHitlijstenStatus(runId) {
  const client = await pool.connect();
  try {
    logger.info("Export status check started", {
      ...LOG_CONTEXT,
      operation: "getExportHitlijstenStatus",
      runId
    });

    const exportTarget = await getRunExportTarget(client, runId);
    const existingExport = await getExistingExportForTarget(client, exportTarget);
    const counts = await getExportValidationCounts(client, runId);
    const issues = await getExportValidationIssues(client, runId);
    const summary = buildSummary(runId, counts, issues, exportTarget, existingExport);

    logValidationSummary("getExportHitlijstenStatus", runId, summary);
    logValidationIssues("getExportHitlijstenStatus", runId, issues);

    return summary;
  } finally {
    client.release();
  }
}

/**
 * Export a staging run to hitlijsten (idempotent upsert).
 *
 * Requirements implemented:
 * - Export per runId (hl_import_run_id)
 * - Validate all staging rows have non-empty fd_tag_title
 * - Validate all staging rows have non-empty hl_artist_key
 * - Validate all staging rows can be linked to file_details by:
 *     (staging.fd_tag_title + staging.hl_artist_key)
 * - Insert into hitlijsten:
 *     hl_hitlijst, hl_uitzendjaar, hl_positie,
 *     ar_artist_key (from staging.hl_artist_key),
 *     fd_tag_title (from staging.fd_tag_title)
 *     fd_key (from file_details match)
 * - Idempotent via UNIQUE(hl_hitlijst, hl_uitzendjaar, hl_positie) + ON CONFLICT upsert
 * - Single transaction
 */
export async function exportRunToHitlijsten(runId, { dryRun = false } = {}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    logger.info("Export started", {
      ...LOG_CONTEXT,
      operation: "exportRunToHitlijsten",
      runId,
      dryRun
    });

    const exportTarget = await getRunExportTarget(client, runId);
    const existingExport = await getExistingExportForTarget(client, exportTarget);
    const counts = await getExportValidationCounts(client, runId);
    const issues = await getExportValidationIssues(client, runId);
    const blockingIssues = issues.filter((issue) => isBlockingReasonCode(issue.reasonCode));
    const warningIssues = issues.filter((issue) => isWarningReasonCode(issue.reasonCode));
    const summary = buildSummary(runId, counts, issues, exportTarget, existingExport);

    if (summary.total === 0) {
      const err = new Error("No staging rows found for this runId.");
      err.status = 404;
      throw err;
    }

    logValidationSummary("exportRunToHitlijsten", runId, summary);

    if (summary.alreadyExported) {
      logger.warn("Export blocked because hitlijst/year was already exported", {
        ...LOG_CONTEXT,
        operation: "exportRunToHitlijsten",
        runId,
        hlHitlijst: summary.hl_hitlijst,
        hlUitzendjaar: summary.hl_uitzendjaar,
        existingRowsForTarget: summary.existingRowsForTarget
      });

      const err = new Error(
        `Export blocked: hitlijst "${summary.hl_hitlijst}" for uitzendjaar ${summary.hl_uitzendjaar} is already exported (${summary.existingRowsForTarget} existing row(s) in hitlijsten).`
      );
      err.status = 409;
      err.reasonCode = "HITLIJST_YEAR_ALREADY_EXPORTED";
      err.summary = summary;
      throw err;
    }

    if (warningIssues.length > 0) {
      logValidationIssues("exportRunToHitlijsten", runId, warningIssues);
      logger.info("Export validation warnings detected", {
        ...LOG_CONTEXT,
        operation: "exportRunToHitlijsten",
        runId,
        totalWarnings: warningIssues.length,
        warningReasonCode: "MULTIPLE_FILE_DETAILS_COMBINED_MATCHES"
      });
    }

    if (blockingIssues.length > 0) {
      logValidationIssues("exportRunToHitlijsten", runId, blockingIssues);

      logger.error("Export blocked by validation errors", {
        ...LOG_CONTEXT,
        operation: "exportRunToHitlijsten",
        runId,
        totalIssues: blockingIssues.length,
        firstReasonCode: blockingIssues[0]?.reasonCode ?? null
      });

      const first = blockingIssues[0];
      const messageParts = [];
      if (summary.missingLinks > 0) {
        messageParts.push(
          `${summary.missingLinks} row(s) have no match in file_details (fd_tag_title + hl_artist_key)`
        );
      }
      if (summary.missingFdTagTitle > 0) {
        messageParts.push(`${summary.missingFdTagTitle} row(s) have empty fd_tag_title`);
      }
      if (summary.missingHlArtistKey > 0) {
        messageParts.push(`${summary.missingHlArtistKey} row(s) have empty hl_artist_key`);
      }
      const err = new Error(
        `Export blocked: ${messageParts.join(", ")}. First blocking issue: positie ${
          first?.hl_positie ?? "?"
        }, artiest "${first?.hl_artiest || ""}", titel "${first?.fd_tag_title || first?.hl_titel_song || ""}", artist_key ${
          first?.hl_artist_key ?? "NULL"
        }, reason ${first?.reasonCode}.`
      );
      err.status = 409;
      err.reasonCode = first?.reasonCode ?? "EXPORT_VALIDATION_BLOCKED";
      err.summary = summary;
      throw err;
    }

    // How many target rows already exist for these keys? (for reporting)
    const existingRes = await client.query(
      `
      SELECT COUNT(*)::int AS existing
      FROM public.hitlijsten h
      JOIN public.staging_hitlijsten s
        ON h.hl_hitlijst   = s.hl_hitlijst
       AND h.hl_uitzendjaar = s.hl_uitzendjaar
       AND h.hl_positie     = s.hl_positie
      WHERE s.hl_import_run_id = $1
        AND ${EXPORTABLE_STAGING_SQL}
      `,
      [runId]
    );
    const existing = Number(existingRes.rows[0]?.existing ?? 0);

    if (dryRun) {
      await client.query("ROLLBACK");
      return {
        ok: true,
        dryRun: true,
        runId,
        total: summary.total,
        hl_hitlijst: summary.hl_hitlijst,
        hl_uitzendjaar: summary.hl_uitzendjaar,
        existingRowsForTarget: summary.existingRowsForTarget,
        alreadyExported: summary.alreadyExported,
        existing,
        wouldInsert: Math.max(0, summary.total - existing),
        wouldUpdateOrSkip: existing,
        missingFdTagTitle: summary.missingFdTagTitle,
        missingHlArtistKey: summary.missingHlArtistKey,
        missingLinks: summary.missingLinks,
        multipleLinks: summary.multipleLinks,
        ambiguousLinks: summary.ambiguousLinks,
        warningIssues: summary.warningIssues,
        issuesPreview: summary.issuesPreview
      };
    }

    const upsertRes = await client.query(
      `
      INSERT INTO public.hitlijsten (
        hl_hitlijst,
        hl_uitzendjaar,
        hl_positie,
        ar_artist_key,
        fd_tag_title,
        hl_commando,
        hl_add_info,
        fd_key,
        omroep_key,
        periode_key,
        discogs_master_id,
        discogs_master_url,
        discogs_master_title,
        discogs_master_artist,
        discogs_master_year,
        discogs_release_id,
        discogs_release_url,
        discogs_release_title,
        discogs_release_format,
        discogs_release_country,
        discogs_release_year,
        discogs_selected_at
      )
      SELECT
        s.hl_hitlijst,
        s.hl_uitzendjaar,
        s.hl_positie,
        s.hl_artist_key,
        s.fd_tag_title,
        NULL::text AS hl_commando,
        NULL::text AS hl_add_info,
        fd1.fd_key,
        s.omroep_key,
        s.periode_key,
        s.discogs_master_id,
        ${discogsMasterUrlExportSql()}::text AS discogs_master_url,
        s.discogs_master_title,
        s.discogs_master_artist,
        s.discogs_master_year,
        s.discogs_release_id,
        ${discogsReleaseUrlExportSql()}::text AS discogs_release_url,
        s.discogs_release_title,
        s.discogs_release_format,
        s.discogs_release_country,
        s.discogs_release_year,
        ${discogsSelectedAtExportSql()} AS discogs_selected_at
      FROM public.staging_hitlijsten s
      JOIN LATERAL (
        SELECT fd.fd_key
        FROM public.file_details fd
        WHERE ${NORMALIZE_TITLE_SQL("fd.fd_tag_title")} = ${NORMALIZE_TITLE_SQL("s.fd_tag_title")}
          AND fd.fd_artist_key = s.hl_artist_key
          AND ${ACTIVE_FILE_DETAILS_SQL}
        ORDER BY
          CASE
            WHEN s.hl_desired_song_type_key IS NOT NULL
             AND fd.fd_song_type_key = s.hl_desired_song_type_key THEN 0
            ELSE 1
          END,
          fd.fd_key ASC
        LIMIT 1
      ) fd1 ON true
      WHERE s.hl_import_run_id = $1
        AND ${EXPORTABLE_STAGING_SQL}
      ON CONFLICT (hl_hitlijst, hl_uitzendjaar, hl_positie)
      DO UPDATE
        SET ar_artist_key = EXCLUDED.ar_artist_key,
            fd_tag_title  = EXCLUDED.fd_tag_title,
            fd_key        = EXCLUDED.fd_key,
            omroep_key     = EXCLUDED.omroep_key,
            periode_key    = EXCLUDED.periode_key,
            discogs_master_id = EXCLUDED.discogs_master_id,
            discogs_master_url = EXCLUDED.discogs_master_url,
            discogs_master_title = EXCLUDED.discogs_master_title,
            discogs_master_artist = EXCLUDED.discogs_master_artist,
            discogs_master_year = EXCLUDED.discogs_master_year,
            discogs_release_id = EXCLUDED.discogs_release_id,
            discogs_release_url = EXCLUDED.discogs_release_url,
            discogs_release_title = EXCLUDED.discogs_release_title,
            discogs_release_format = EXCLUDED.discogs_release_format,
            discogs_release_country = EXCLUDED.discogs_release_country,
            discogs_release_year = EXCLUDED.discogs_release_year,
            discogs_selected_at = EXCLUDED.discogs_selected_at
      WHERE
        public.hitlijsten.ar_artist_key IS DISTINCT FROM EXCLUDED.ar_artist_key
        OR public.hitlijsten.fd_tag_title::text IS DISTINCT FROM EXCLUDED.fd_tag_title::text
        OR public.hitlijsten.fd_key IS DISTINCT FROM EXCLUDED.fd_key
        OR public.hitlijsten.omroep_key IS DISTINCT FROM EXCLUDED.omroep_key
        OR public.hitlijsten.periode_key IS DISTINCT FROM EXCLUDED.periode_key
        OR public.hitlijsten.discogs_master_id IS DISTINCT FROM EXCLUDED.discogs_master_id
        OR public.hitlijsten.discogs_master_url IS DISTINCT FROM EXCLUDED.discogs_master_url
        OR public.hitlijsten.discogs_master_title IS DISTINCT FROM EXCLUDED.discogs_master_title
        OR public.hitlijsten.discogs_master_artist IS DISTINCT FROM EXCLUDED.discogs_master_artist
        OR public.hitlijsten.discogs_master_year IS DISTINCT FROM EXCLUDED.discogs_master_year
        OR public.hitlijsten.discogs_release_id IS DISTINCT FROM EXCLUDED.discogs_release_id
        OR public.hitlijsten.discogs_release_url IS DISTINCT FROM EXCLUDED.discogs_release_url
        OR public.hitlijsten.discogs_release_title IS DISTINCT FROM EXCLUDED.discogs_release_title
        OR public.hitlijsten.discogs_release_format IS DISTINCT FROM EXCLUDED.discogs_release_format
        OR public.hitlijsten.discogs_release_country IS DISTINCT FROM EXCLUDED.discogs_release_country
        OR public.hitlijsten.discogs_release_year IS DISTINCT FROM EXCLUDED.discogs_release_year
        OR public.hitlijsten.discogs_selected_at IS DISTINCT FROM EXCLUDED.discogs_selected_at
      `,
      [runId]
    );

    const affected = upsertRes.rowCount ?? 0;
    const insertedEstimate = Math.max(0, summary.total - existing);
    const updatedChanged = Math.max(0, affected - insertedEstimate);
    const skippedNoChange = Math.max(0, existing - updatedChanged);

    await client.query("COMMIT");

    logger.info("Export completed", {
      ...LOG_CONTEXT,
      operation: "exportRunToHitlijsten",
      runId,
      dryRun: false,
      totalRows: summary.total,
      existing,
      insertedCount: insertedEstimate,
      updatedCount: updatedChanged,
      skippedCount: skippedNoChange
    });

    return {
      ok: true,
      dryRun: false,
      runId,
      total: summary.total,
      hl_hitlijst: summary.hl_hitlijst,
      hl_uitzendjaar: summary.hl_uitzendjaar,
      existingRowsForTarget: summary.existingRowsForTarget,
      alreadyExported: summary.alreadyExported,
      existing,
      inserted: insertedEstimate,
      updated: updatedChanged,
      skipped: skippedNoChange,
      multipleLinks: summary.multipleLinks,
      ambiguousLinks: summary.ambiguousLinks,
      warningIssues: summary.warningIssues
    };
  } catch (e) {
    await client.query("ROLLBACK");
    logger.error("Unexpected export failure", {
      ...LOG_CONTEXT,
      operation: "exportRunToHitlijsten",
      runId,
      dryRun,
      errorMessage: e.message,
      stack: e.stack
    });
    throw e;
  } finally {
    client.release();
  }
}
