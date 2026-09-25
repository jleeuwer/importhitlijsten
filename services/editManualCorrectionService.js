import { logger } from "../config/logger.js";
import { normalizeImportedText } from "../utils/textFixes.js";
import { getStagingRowDiagnostics } from "./editDiagnosticsService.js";
import { ACTIVE_FILE_DETAILS_SQL, mapFileDetailsCandidate, sortFileDetailsCandidates } from "./fileDetailsCandidateService.js";

const LOG_CONTEXT = {
  module: "importhitlijst",
  feature: "editPhase"
};

function trimToNull(value) {
  return normalizeImportedText(value);
}

function parseYearOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    const err = new Error("hl_jaar must be an integer or empty.");
    err.status = 400;
    throw err;
  }
  return parsed;
}

function requireExplicitOverwrite(patch = {}) {
  if (patch.overwriteConfirmed === true || patch.manualOverwriteConfirmed === true) return;
  const err = new Error("Manual free overwrite requires explicit confirmation. Select a file_details candidate or confirm overwrite.");
  err.status = 409;
  err.code = "EXPLICIT_OVERWRITE_REQUIRED";
  throw err;
}

function mapCandidate(row = {}, search = {}) {
  return mapFileDetailsCandidate(row, search);
}

export async function searchManualRepairFileDetailsCandidates(client, { query = "", artist = "", title = "", limit = 25 } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 25, 50));
  const q = String(query || "").trim();
  const artistTerm = String(artist || "").trim();
  const titleTerm = String(title || "").trim();

  logger.info("Manual repair file_details candidate search requested", {
    ...LOG_CONTEXT,
    operation: "searchManualRepairFileDetailsCandidates",
    hasQuery: Boolean(q),
    hasArtist: Boolean(artistTerm),
    hasTitle: Boolean(titleTerm),
    limit: safeLimit
  });

  if (!q && !artistTerm && !titleTerm) {
    return { candidates: [] };
  }

  const res = await client.query(
    `
      SELECT
        fd.fd_key,
        fd.fd_correct_artist,
        fd.fd_tag_title,
        fd.fd_artist_key,
        a.ar_artist_name AS canonical_artist_name,
        fd.fd_file_name,
        fd.fd_hitlijst,
        fd.fd_duration::text AS fd_duration,
        fd.fd_year_song_publish,
        fd.fd_year_song_version,
        st.st_song_type,
        st.st_song_type_desc
      FROM public.file_details fd
      LEFT JOIN public.artist a
        ON a.ar_artist_key = fd.fd_artist_key
      LEFT JOIN public.song_types st
        ON st.st_song_type_key = fd.fd_song_type_key
      WHERE ${ACTIVE_FILE_DETAILS_SQL}
        AND (
          $1::text = ''
          OR fd.fd_correct_artist::text ILIKE '%' || $1 || '%'
          OR fd.fd_tag_title::text ILIKE '%' || $1 || '%'
          OR fd.fd_file_name::text ILIKE '%' || $1 || '%'
        )
        AND ($2::text = '' OR fd.fd_correct_artist::text ILIKE '%' || $2 || '%')
        AND ($3::text = '' OR fd.fd_tag_title::text ILIKE '%' || $3 || '%')
      ORDER BY
        CASE
          WHEN $2::text <> '' AND $3::text <> '' AND fd.fd_correct_artist::text ILIKE $2 AND fd.fd_tag_title::text ILIKE $3 THEN 0
          WHEN $2::text <> '' AND fd.fd_correct_artist::text ILIKE $2 THEN 1
          WHEN $3::text <> '' AND fd.fd_tag_title::text ILIKE $3 THEN 2
          ELSE 3
        END,
        fd.fd_correct_artist NULLS LAST,
        fd.fd_tag_title NULLS LAST,
        fd.fd_year_song_version NULLS LAST,
        fd.fd_file_name NULLS LAST
      LIMIT $4
    `,
    [q, artistTerm, titleTerm, safeLimit]
  );

  return { candidates: sortFileDetailsCandidates(res.rows.map((row) => mapCandidate(row, { query: q, artist: artistTerm, title: titleTerm }))) };
}

export async function applyManualRepairFromFileDetails(client, runId, hlPositie, fdKey) {
  const normalizedFdKey = Number(fdKey);
  if (!Number.isInteger(normalizedFdKey)) {
    const err = new Error("fd_key is required for file_details driven manual repair.");
    err.status = 400;
    throw err;
  }

  logger.info("Manual repair from file_details requested", {
    ...LOG_CONTEXT,
    operation: "applyManualRepairFromFileDetails",
    runId,
    hlPositie,
    fdKey: normalizedFdKey
  });

  const candidateRes = await client.query(
    `
      SELECT
        fd.fd_key,
        fd.fd_correct_artist,
        fd.fd_tag_title,
        fd.fd_artist_key,
        a.ar_artist_name AS canonical_artist_name,
        fd.fd_year_song_publish,
        fd.fd_year_song_version
      FROM public.file_details fd
      LEFT JOIN public.artist a
        ON a.ar_artist_key = fd.fd_artist_key
      WHERE fd.fd_key = $1
        AND ${ACTIVE_FILE_DETAILS_SQL}
      LIMIT 1
    `,
    [normalizedFdKey]
  );

  if (candidateRes.rowCount === 0) {
    const err = new Error("Active file_details candidate not found.");
    err.status = 404;
    throw err;
  }

  const candidate = candidateRes.rows[0];
  const artistName = candidate.canonical_artist_name || candidate.fd_correct_artist;
  const title = candidate.fd_tag_title;
  const year = candidate.fd_year_song_publish ?? candidate.fd_year_song_version ?? null;

  const updateRes = await client.query(
    `
      UPDATE public.staging_hitlijsten
      SET hl_artiest = NULLIF(btrim($3), '')::citext,
          hl_titel_song = NULLIF(btrim($4), '')::citext,
          fd_tag_title = NULLIF(btrim($4), '')::citext,
          hl_artist_key = $5,
          as_correcte_artiest_spelling = NULLIF(btrim($3), '')::citext,
          hl_jaar = COALESCE(hl_jaar, $6),
          hl_find_cmd = NULL
      WHERE hl_import_run_id = $1
        AND hl_positie = $2
    `,
    [runId, hlPositie, artistName, title, candidate.fd_artist_key, year]
  );

  if (updateRes.rowCount === 0) {
    const err = new Error("Staging row not found.");
    err.status = 404;
    throw err;
  }

  const diagnostics = await getStagingRowDiagnostics(client, runId, hlPositie);

  return {
    ok: true,
    runId,
    hlPositie,
    fdKey: normalizedFdKey,
    candidate: mapCandidate(candidate),
    diagnostics
  };
}

export async function saveManualStagingCorrection(client, runId, hlPositie, patch = {}) {
  logger.info("Manual staging correction requested", {
    ...LOG_CONTEXT,
    operation: "saveManualStagingCorrection",
    runId,
    hlPositie,
    overwriteConfirmed: patch.overwriteConfirmed === true || patch.manualOverwriteConfirmed === true
  });

  try {
    if (patch.fd_key || patch.fdKey || patch.fileDetailsFdKey) {
      return await applyManualRepairFromFileDetails(client, runId, hlPositie, patch.fd_key || patch.fdKey || patch.fileDetailsFdKey);
    }

    requireExplicitOverwrite(patch);

    const artist = trimToNull(patch.hl_artiest);
    const title = trimToNull(patch.hl_titel_song);
    const discogsLink = trimToNull(patch.hl_discogs_link);
    const year = parseYearOrNull(patch.hl_jaar);

    await client.query(
      `
        UPDATE public.staging_hitlijsten s
        SET hl_artiest = NULLIF(btrim($3), '')::citext,
            hl_titel_song = NULLIF(btrim($4), '')::citext,
            hl_jaar = $5,
            hl_discogs_link = NULLIF(btrim($6), ''),
            fd_tag_title = NULLIF(btrim($4), '')::citext,
            as_correcte_artiest_spelling = a.ar_artist_name,
            hl_artist_key = a.ar_artist_key,
            hl_find_cmd = NULL
        FROM public.artiesten_spelling asp
        LEFT JOIN public.artist a
          ON a.ar_artist_key = asp.as_artist_key
        WHERE s.hl_import_run_id = $1
          AND s.hl_positie = $2
          AND asp.as_alternatieve_spelling = NULLIF(btrim($3), '')::citext
      `,
      [runId, hlPositie, artist, title, year, discogsLink]
    );

    await client.query(
      `
        UPDATE public.staging_hitlijsten
        SET hl_artiest = NULLIF(btrim($3), '')::citext,
            hl_titel_song = NULLIF(btrim($4), '')::citext,
            hl_jaar = $5,
            hl_discogs_link = NULLIF(btrim($6), ''),
            fd_tag_title = NULLIF(btrim($4), '')::citext,
            as_correcte_artiest_spelling = NULL,
            hl_artist_key = NULL,
            hl_find_cmd = NULL
        WHERE hl_import_run_id = $1
          AND hl_positie = $2
          AND NOT EXISTS (
            SELECT 1
            FROM public.artiesten_spelling asp
            WHERE asp.as_alternatieve_spelling = NULLIF(btrim($3), '')::citext
          )
      `,
      [runId, hlPositie, artist, title, year, discogsLink]
    );

    const rowCheck = await client.query(
      `
        SELECT hl_import_run_id, hl_positie
        FROM public.staging_hitlijsten
        WHERE hl_import_run_id = $1
          AND hl_positie = $2
        LIMIT 1
      `,
      [runId, hlPositie]
    );

    if (rowCheck.rowCount === 0) {
      const err = new Error("Staging row not found.");
      err.status = 404;
      throw err;
    }

    const diagnostics = await getStagingRowDiagnostics(client, runId, hlPositie);

    logger.info("Manual staging correction completed", {
      ...LOG_CONTEXT,
      operation: "saveManualStagingCorrection",
      runId,
      hlPositie,
      reasonCode: diagnostics.reasonCode,
      status: diagnostics.status
    });

    return {
      ok: true,
      runId,
      hlPositie,
      overwrite: true,
      diagnostics
    };
  } catch (error) {
    logger.error("Manual staging correction failed", {
      ...LOG_CONTEXT,
      operation: "saveManualStagingCorrection",
      runId,
      hlPositie,
      statusCode: error?.status ?? 500,
      error: error?.message || String(error)
    });
    throw error;
  }
}
