import { logger } from "../config/logger.js";
import { ACTIVE_FILE_DETAILS_SQL, mapFileDetailsCandidate } from "./fileDetailsCandidateService.js";
import { getStagingRowDiagnostics } from "./editDiagnosticsService.js";

const LOG_CONTEXT = {
  module: "importhitlijst",
  feature: "postExportCorrection"
};

function normalizeReason(value) {
  const cleaned = String(value ?? "").trim();
  return cleaned || null;
}

function makeError(message, status = 400, code = null, extra = {}) {
  const err = new Error(message);
  err.status = status;
  if (code) err.code = code;
  Object.assign(err, extra);
  return err;
}

function sameText(a, b) {
  return String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();
}

function mapStagingRow(row = {}) {
  return {
    runId: row.hl_import_run_id,
    hlPositie: Number(row.hl_positie),
    hl_hitlijst: row.hl_hitlijst,
    hl_uitzendjaar: row.hl_uitzendjaar,
    hl_positie: row.hl_positie,
    omroep_key: row.omroep_key,
    periode_key: row.periode_key,
    old_artist_key: row.hl_artist_key,
    old_correct_artist: row.as_correcte_artiest_spelling,
    old_correct_title: row.fd_tag_title,
    original_artist: row.hl_artiest,
    original_title: row.hl_titel_song
  };
}

function mapHitlijstenRow(row = {}) {
  return {
    hl_hitlijst: row.hl_hitlijst,
    hl_uitzendjaar: row.hl_uitzendjaar,
    hl_positie: row.hl_positie,
    ar_artist_key: row.ar_artist_key,
    fd_tag_title: row.fd_tag_title,
    fd_key: row.fd_key,
    hl_samenstel_fd_key: row.hl_samenstel_fd_key,
    isComposed: row.hl_samenstel_fd_key !== null && row.hl_samenstel_fd_key !== undefined
  };
}

export async function getPostExportCorrectionCandidate(client, fdKey) {
  const normalizedFdKey = Number(fdKey);
  if (!Number.isInteger(normalizedFdKey)) {
    throw makeError("fd_key is required.", 400, "FD_KEY_REQUIRED");
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
      JOIN public.artist a
        ON a.ar_artist_key = fd.fd_artist_key
      LEFT JOIN public.song_types st
        ON st.st_song_type_key = fd.fd_song_type_key
      WHERE fd.fd_key = $1
        AND ${ACTIVE_FILE_DETAILS_SQL}
      LIMIT 1
    `,
    [normalizedFdKey]
  );

  if (res.rowCount === 0) {
    throw makeError("Active file_details candidate with existing artist not found.", 404, "CANDIDATE_NOT_FOUND");
  }

  const row = res.rows[0];
  if (!row.fd_artist_key || !row.canonical_artist_name || !row.fd_tag_title) {
    throw makeError("Selected file_details record is missing artist or title data.", 400, "CANDIDATE_INCOMPLETE");
  }

  return row;
}

export async function getStagingPostExportRow(client, runId, hlPositie) {
  const res = await client.query(
    `
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
        s.omroep_key,
        s.periode_key
      FROM public.staging_hitlijsten s
      WHERE s.hl_import_run_id = $1
        AND s.hl_positie = $2
      LIMIT 1
    `,
    [runId, hlPositie]
  );

  if (res.rowCount === 0) {
    throw makeError("Staging row not found.", 404, "STAGING_ROW_NOT_FOUND");
  }
  return res.rows[0];
}

export async function findMatchingHitlijstenRowsForStaging(client, stagingRow) {
  const res = await client.query(
    `
      SELECT
        h.hl_hitlijst,
        h.hl_uitzendjaar,
        h.hl_positie,
        h.ar_artist_key,
        h.fd_tag_title,
        h.fd_key,
        h.hl_samenstel_fd_key
      FROM public.hitlijsten h
      WHERE h.hl_hitlijst = $1
        AND h.hl_uitzendjaar = $2
        AND h.hl_positie = $3
        AND h.omroep_key IS NOT DISTINCT FROM $4
        AND h.periode_key IS NOT DISTINCT FROM $5
      ORDER BY h.hl_positie
    `,
    [
      stagingRow.hl_hitlijst,
      stagingRow.hl_uitzendjaar,
      stagingRow.hl_positie,
      stagingRow.omroep_key,
      stagingRow.periode_key
    ]
  );
  return res.rows || [];
}

async function getExportedCountForList(client, stagingRow) {
  const res = await client.query(
    `
      SELECT COUNT(*)::int AS cnt
      FROM public.hitlijsten h
      WHERE h.hl_hitlijst = $1
        AND h.hl_uitzendjaar = $2
        AND h.omroep_key IS NOT DISTINCT FROM $3
        AND h.periode_key IS NOT DISTINCT FROM $4
    `,
    [stagingRow.hl_hitlijst, stagingRow.hl_uitzendjaar, stagingRow.omroep_key, stagingRow.periode_key]
  );
  return Number(res.rows[0]?.cnt ?? 0);
}

function buildPreview({ stagingRow, candidateRow, hitlijstenRows, exportedCount, reason = null }) {
  const candidate = mapFileDetailsCandidate(candidateRow, {
    artist: candidateRow.canonical_artist_name || candidateRow.fd_correct_artist || "",
    title: candidateRow.fd_tag_title || ""
  });

  const oldValues = {
    artist_key: stagingRow.hl_artist_key ?? null,
    correct_artist: stagingRow.as_correcte_artiest_spelling ?? null,
    correct_title: stagingRow.fd_tag_title ?? null
  };
  const newValues = {
    artist_key: candidateRow.fd_artist_key,
    correct_artist: candidateRow.canonical_artist_name || candidateRow.fd_correct_artist,
    correct_title: candidateRow.fd_tag_title,
    fd_key: candidateRow.fd_key
  };

  const hasChanges =
    Number(oldValues.artist_key ?? 0) !== Number(newValues.artist_key ?? 0)
    || !sameText(oldValues.correct_artist, newValues.correct_artist)
    || !sameText(oldValues.correct_title, newValues.correct_title);

  const isComposed = hitlijstenRows.some((row) => row.hl_samenstel_fd_key !== null && row.hl_samenstel_fd_key !== undefined);
  const warnings = [];
  if (isComposed) {
    warnings.push("Deze regel is al samengesteld; hl_samenstel_fd_key blijft ongewijzigd.");
  }
  if (exportedCount > 0 && hitlijstenRows.length === 0) {
    warnings.push("Run lijkt geëxporteerd, maar de corresponderende hitlijstenregel is niet gevonden.");
  }
  if (!hasChanges) {
    warnings.push("Er is geen wijziging tussen huidige correcte waarden en gekozen file_details-record.");
  }
  if (hitlijstenRows.length > 1) {
    warnings.push("Meerdere corresponderende hitlijstenregels gevonden; automatische propagatie is niet veilig.");
  }

  const canApply = hasChanges && hitlijstenRows.length <= 1 && !(exportedCount > 0 && hitlijstenRows.length === 0);

  return {
    ok: true,
    canApply,
    reason: normalizeReason(reason),
    staging: mapStagingRow(stagingRow),
    candidate,
    oldValues,
    newValues,
    hitlijsten: {
      exportedCount,
      matchedCount: hitlijstenRows.length,
      matches: hitlijstenRows.map(mapHitlijstenRow)
    },
    composedImpact: {
      isComposed,
      willChangeComposition: false,
      hl_samenstel_fd_key: hitlijstenRows.find((row) => row.hl_samenstel_fd_key != null)?.hl_samenstel_fd_key ?? null
    },
    warnings
  };
}

export async function previewPostExportCorrection(client, { runId, hlPositie, fdKey, reason = null } = {}) {
  if (!runId || !Number.isInteger(Number(hlPositie))) {
    throw makeError("runId and hlPositie are required.", 400, "INVALID_POSITION");
  }

  const stagingRow = await getStagingPostExportRow(client, runId, Number(hlPositie));
  const candidateRow = await getPostExportCorrectionCandidate(client, fdKey);
  const hitlijstenRows = await findMatchingHitlijstenRowsForStaging(client, stagingRow);
  const exportedCount = await getExportedCountForList(client, stagingRow);

  return buildPreview({ stagingRow, candidateRow, hitlijstenRows, exportedCount, reason });
}

export async function applyPostExportCorrection(client, { runId, hlPositie, fdKey, reason = null, confirmComposedTextOnly = false } = {}) {
  const preview = await previewPostExportCorrection(client, { runId, hlPositie: Number(hlPositie), fdKey, reason });

  if (!preview.canApply) {
    throw makeError("Correctie kan niet veilig worden toegepast. Bekijk de impact preview.", 409, "PREVIEW_NOT_APPLICABLE", { preview });
  }

  if (preview.composedImpact.isComposed && confirmComposedTextOnly !== true) {
    throw makeError("Deze regel is al samengesteld. Bevestig dat alleen tekstvelden/keycorrectie worden aangepast en hl_samenstel_fd_key gelijk blijft.", 409, "COMPOSED_CONFIRMATION_REQUIRED", { preview });
  }

  const newValues = preview.newValues;
  const staging = preview.staging;
  const auditOld = preview.oldValues;

  logger.info("Post-export correction apply started", {
    ...LOG_CONTEXT,
    operation: "applyPostExportCorrection",
    runId,
    hlPositie,
    fdKey: newValues.fd_key,
    matchedHitlijsten: preview.hitlijsten.matchedCount,
    isComposed: preview.composedImpact.isComposed
  });

  const stagingUpdate = await client.query(
    `
      UPDATE public.staging_hitlijsten
      SET hl_artist_key = $3,
          as_correcte_artiest_spelling = NULLIF(btrim($4), '')::citext,
          fd_tag_title = NULLIF(btrim($5), '')::citext,
          hl_find_cmd = NULL
      WHERE hl_import_run_id = $1
        AND hl_positie = $2
    `,
    [runId, Number(hlPositie), newValues.artist_key, newValues.correct_artist, newValues.correct_title]
  );

  if (stagingUpdate.rowCount !== 1) {
    throw makeError("Staging row update failed.", 404, "STAGING_UPDATE_FAILED");
  }

  let hitlijstenUpdated = 0;
  if (preview.hitlijsten.matchedCount === 1) {
    const hitUpdate = await client.query(
      `
        UPDATE public.hitlijsten h
        SET ar_artist_key = $6,
            fd_tag_title = NULLIF(btrim($7), '')::citext,
            fd_key = $8
        WHERE h.hl_hitlijst = $1
          AND h.hl_uitzendjaar = $2
          AND h.hl_positie = $3
          AND h.omroep_key IS NOT DISTINCT FROM $4
          AND h.periode_key IS NOT DISTINCT FROM $5
      `,
      [
        staging.hl_hitlijst,
        staging.hl_uitzendjaar,
        staging.hl_positie,
        staging.omroep_key,
        staging.periode_key,
        newValues.artist_key,
        newValues.correct_title,
        newValues.fd_key
      ]
    );
    hitlijstenUpdated = hitUpdate.rowCount;
  }

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
      VALUES ($1, $2, $3, $4, $5, $6, 'POST_EXPORT_ARTIST_TITLE', $7::jsonb, $8::jsonb, $9, $10, $11)
      RETURNING correction_id
    `,
    [
      runId,
      staging.hl_positie,
      staging.hl_hitlijst,
      staging.hl_uitzendjaar,
      staging.omroep_key,
      staging.periode_key,
      JSON.stringify(auditOld),
      JSON.stringify(newValues),
      hitlijstenUpdated,
      preview.composedImpact.isComposed,
      normalizeReason(reason)
    ]
  );
  const auditId = auditResult.rows?.[0]?.correction_id ?? null;

  const diagnostics = await getStagingRowDiagnostics(client, runId, Number(hlPositie));

  logger.info("Post-export correction apply completed", {
    ...LOG_CONTEXT,
    operation: "applyPostExportCorrection",
    runId,
    hlPositie,
    hitlijstenUpdated,
    isComposed: preview.composedImpact.isComposed
  });

  const warnings = [...(preview.warnings || [])];
  if (preview.hitlijsten.exportedCount > 0 && hitlijstenUpdated === 0) {
    warnings.push("Er zijn geen hitlijsten-records bijgewerkt, terwijl deze lijst wel geëxporteerde records heeft.");
  }

  return {
    ok: true,
    applied: true,
    message: "Correctie na export toegepast.",
    runId,
    hlPositie: Number(hlPositie),
    fdKey: newValues.fd_key,
    stagingUpdated: stagingUpdate.rowCount === 1,
    stagingUpdatedCount: stagingUpdate.rowCount,
    hitlijstenUpdated,
    hitlijstenUpdatedCount: hitlijstenUpdated,
    auditId,
    composedUnchanged: preview.composedImpact.isComposed,
    composedImpact: {
      ...preview.composedImpact,
      hlSamenstelFdKeyChanged: false
    },
    changedFields: {
      artist: {
        old: preview.oldValues?.correct_artist ?? null,
        new: preview.newValues?.correct_artist ?? null
      },
      title: {
        old: preview.oldValues?.correct_title ?? null,
        new: preview.newValues?.correct_title ?? null
      }
    },
    warnings,
    preview,
    diagnostics
  };
}
