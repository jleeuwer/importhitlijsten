import { detectEncodingDamage } from "../utils/textFixes.js";
import { logger } from "../config/logger.js";

const LOG_CONTEXT = {
  module: "importhitlijst",
  feature: "editPhase"
};

const NORMALIZE_TITLE_SQL = (expr) =>
  `lower(regexp_replace(replace(btrim(coalesce(${expr}::text, '')), chr(160), ' '), '\\s+', ' ', 'g'))`;
const ACTIVE_FILE_DETAILS_SQL = "lower(btrim(coalesce(fd.fd_action::text, 'Keep'))) NOT IN ('delete', 'duplicates', 'skip')";

function trimText(value) {
  return String(value ?? "").trim();
}

export function determineRowDiagnostics(row) {
  const fdTagTitle = trimText(row.fd_tag_title);
  const spellingExists = Boolean(row.artiesten_spelling_exists);
  const artistExists = Boolean(row.artist_exists);
  const hasArtistKey = row.hl_artist_key != null;
  const titleMatchCount = Number(row.title_match_count ?? 0);
  const artistKeyMatchCount = Number(row.artist_key_match_count ?? 0);
  const combinedMatchCount = Number(row.combined_match_count ?? 0);
  const swappedTitleMatchCount = Number(row.swapped_title_match_count ?? 0);
  const swappedArtiestenSpellingExists = Boolean(row.swapped_artiesten_spelling_exists);
  const swappedArtistExists = Boolean(row.swapped_artist_exists);

  const suspectedTitleArtistSwap =
    (!spellingExists && (swappedArtiestenSpellingExists || swappedArtistExists)) ||
    (titleMatchCount === 0 && swappedTitleMatchCount > 0);

  const encodingSignals = [row.hl_artiest, row.hl_titel_song, row.fd_tag_title]
    .map((value) => detectEncodingDamage(value))
    .filter((signal) => signal.hasDamage);
  const hasReplacementCharDamage = encodingSignals.some((signal) => signal.reasonCode === "REPLACEMENT_CHAR_DAMAGE");
  const hasRecoverableEncodingDamage = encodingSignals.some((signal) => signal.reasonCode === "RECOVERABLE_ENCODING_DAMAGE");

  let reasonCode = null;
  let status = "ok";

  if (hasReplacementCharDamage) {
    reasonCode = "REPLACEMENT_CHAR_DAMAGE";
    status = "blocked";
  } else if (hasRecoverableEncodingDamage) {
    reasonCode = "RECOVERABLE_ENCODING_DAMAGE";
    status = "warning";
  } else if (suspectedTitleArtistSwap) {
    reasonCode = "SUSPECTED_TITLE_ARTIST_SWAP";
    status = "blocked";
  } else if (!fdTagTitle) {
    reasonCode = "MISSING_FD_TAG_TITLE";
    status = "blocked";
  } else if (!spellingExists) {
    reasonCode = "MISSING_ARTIESTEN_SPELLING_ENTRY";
    status = "blocked";
  } else if (!artistExists) {
    reasonCode = "MISSING_ARTIST_ENTRY";
    status = "blocked";
  } else if (!hasArtistKey) {
    reasonCode = "MISSING_HL_ARTIST_KEY";
    status = "blocked";
  } else if (titleMatchCount === 0) {
    reasonCode = "NO_FILE_DETAILS_TITLE_MATCH";
    status = "blocked";
  } else if (artistKeyMatchCount === 0) {
    reasonCode = "NO_FILE_DETAILS_ARTIST_KEY_MATCH";
    status = "blocked";
  } else if (combinedMatchCount === 0) {
    reasonCode = "NO_FILE_DETAILS_COMBINED_MATCH";
    status = "blocked";
  } else if (combinedMatchCount > 1) {
    reasonCode = "MULTIPLE_FILE_DETAILS_COMBINED_MATCHES";
    status = "warning";
  }

  return {
    status,
    reasonCode,
    canRepairArtistRelation: [
      "MISSING_ARTIESTEN_SPELLING_ENTRY",
      "MISSING_ARTIST_ENTRY",
      "MISSING_HL_ARTIST_KEY"
    ].includes(reasonCode),
    canRepairTitleArtistSwap: reasonCode === "SUSPECTED_TITLE_ARTIST_SWAP",
    row: {
      runId: row.hl_import_run_id,
      hlPositie: row.hl_positie,
      hlArtiest: row.hl_artiest,
      hlTitelSong: row.hl_titel_song,
      fdTagTitle: row.fd_tag_title,
      hlArtistKey: row.hl_artist_key,
      asCorrecteArtiestSpelling: row.as_correcte_artiest_spelling
    },
    artistRelation: {
      artiestenSpellingExists: spellingExists,
      artistExists,
      asArtistKey: row.as_artist_key ?? null,
      canonicalArtistName: row.canonical_artist_name ?? null
    },
    swapHints: {
      suspectedTitleArtistSwap,
      swappedArtiestenSpellingExists,
      swappedArtistExists,
      swappedAsArtistKey: row.swapped_as_artist_key ?? null,
      swappedCanonicalArtistName: row.swapped_canonical_artist_name ?? null,
      swappedTitleMatchCount
    },
    encodingHints: {
      hasEncodingDamage: encodingSignals.length > 0,
      hasReplacementCharDamage,
      hasRecoverableEncodingDamage,
      signals: encodingSignals
    },
    fileDetailsCheck: {
      titleMatchCount,
      artistKeyMatchCount,
      combinedMatchCount
    }
  };
}

export async function getStagingRowDiagnostics(client, runId, hlPositie) {
  logger.info("Edit diagnostics requested", {
    ...LOG_CONTEXT,
    operation: "getStagingRowDiagnostics",
    runId,
    hlPositie
  });

  try {
    const res = await client.query(
      `
        SELECT
          s.hl_import_run_id,
          s.hl_positie,
          s.hl_artiest,
          s.hl_titel_song,
          s.fd_tag_title,
          s.as_correcte_artiest_spelling,
          s.hl_artist_key,
          s.fd_action,
          asp.as_artist_key,
          (asp.as_alternatieve_spelling IS NOT NULL) AS artiesten_spelling_exists,
          a.ar_artist_key,
          a.ar_artist_name AS canonical_artist_name,
          (a.ar_artist_key IS NOT NULL) AS artist_exists,
          asp_swap.as_artist_key AS swapped_as_artist_key,
          (asp_swap.as_alternatieve_spelling IS NOT NULL) AS swapped_artiesten_spelling_exists,
          a_swap.ar_artist_key AS swapped_artist_key,
          a_swap.ar_artist_name AS swapped_canonical_artist_name,
          (a_swap.ar_artist_key IS NOT NULL) AS swapped_artist_exists,
          COALESCE(t.title_match_count, 0)::int AS title_match_count,
          COALESCE(k.artist_key_match_count, 0)::int AS artist_key_match_count,
          COALESCE(c.combined_match_count, 0)::int AS combined_match_count,
          COALESCE(tswap.swapped_title_match_count, 0)::int AS swapped_title_match_count
        FROM public.staging_hitlijsten s
        LEFT JOIN public.artiesten_spelling asp
          ON asp.as_alternatieve_spelling = s.hl_artiest
        LEFT JOIN public.artist a
          ON a.ar_artist_key = asp.as_artist_key
        LEFT JOIN public.artiesten_spelling asp_swap
          ON asp_swap.as_alternatieve_spelling = s.hl_titel_song
        LEFT JOIN public.artist a_swap
          ON a_swap.ar_artist_key = asp_swap.as_artist_key
        LEFT JOIN LATERAL (
          SELECT COUNT(*) AS title_match_count
          FROM public.file_details fd
          WHERE ${NORMALIZE_TITLE_SQL("fd.fd_tag_title")} = ${NORMALIZE_TITLE_SQL("s.fd_tag_title")}
            AND ${ACTIVE_FILE_DETAILS_SQL}
        ) t ON true
        LEFT JOIN LATERAL (
          SELECT COUNT(*) AS artist_key_match_count
          FROM public.file_details fd
          WHERE fd.fd_artist_key = s.hl_artist_key
            AND ${ACTIVE_FILE_DETAILS_SQL}
        ) k ON true
        LEFT JOIN LATERAL (
          SELECT COUNT(*) AS swapped_title_match_count
          FROM public.file_details fd
          WHERE ${NORMALIZE_TITLE_SQL("fd.fd_tag_title")} = ${NORMALIZE_TITLE_SQL("s.hl_artiest")}
            AND ${ACTIVE_FILE_DETAILS_SQL}
        ) tswap ON true
        LEFT JOIN LATERAL (
          SELECT COUNT(*) AS combined_match_count
          FROM public.file_details fd
          WHERE ${NORMALIZE_TITLE_SQL("fd.fd_tag_title")} = ${NORMALIZE_TITLE_SQL("s.fd_tag_title")}
            AND fd.fd_artist_key = s.hl_artist_key
            AND ${ACTIVE_FILE_DETAILS_SQL}
        ) c ON true
        WHERE s.hl_import_run_id = $1
          AND s.hl_positie = $2
        LIMIT 1
      `,
      [runId, hlPositie]
    );

    if (res.rowCount === 0) {
      const err = new Error("Staging row not found.");
      err.status = 404;
      throw err;
    }

    const diagnostics = determineRowDiagnostics(res.rows[0]);

    logger.info("Edit diagnostics resolved", {
      ...LOG_CONTEXT,
      operation: "getStagingRowDiagnostics",
      runId: diagnostics.row.runId,
      hlPositie: diagnostics.row.hlPositie,
      reasonCode: diagnostics.reasonCode,
      status: diagnostics.status
    });

    return diagnostics;
  } catch (error) {
    logger.error("Edit diagnostics failed", {
      ...LOG_CONTEXT,
      operation: "getStagingRowDiagnostics",
      runId,
      hlPositie,
      statusCode: error?.status ?? 500,
      error: error?.message || String(error)
    });
    throw error;
  }
}
