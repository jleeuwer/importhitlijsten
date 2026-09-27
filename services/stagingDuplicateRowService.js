import crypto from "node:crypto";
import { logger } from "../config/logger.js";

const LOG_CONTEXT = {
  module: "importhitlijst",
  feature: "stagingDuplicateRowReview"
};

export const DUPLICATE_SKIP_ACTION = "Skip";
export const PHYSICAL_DELETE_REASON = "DUPLICATE_CONFIRMED";

export function normalizeDuplicateText(value) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/\u00a0/g, " ")
    .replace(/[‘’‛`´]/g, "'")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}

function safeKey(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function safePosition(value) {
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

function groupIdFor(artist, title) {
  return crypto.createHash("sha256").update(`${artist}\u0000${title}`, "utf8").digest("hex").slice(0, 20);
}

function sortRows(a, b) {
  const posA = safePosition(a.hl_positie);
  const posB = safePosition(b.hl_positie);
  if (posA == null && posB != null) return 1;
  if (posA != null && posB == null) return -1;
  if (posA != null && posB != null && posA !== posB) return posA - posB;
  return (safeKey(a.sh_key) ?? Number.MAX_SAFE_INTEGER) - (safeKey(b.sh_key) ?? Number.MAX_SAFE_INTEGER);
}

export function buildStagingDuplicateReview(rows = []) {
  const grouped = new Map();

  for (const row of Array.isArray(rows) ? rows : []) {
    const stagingKey = safeKey(row.sh_key);
    if (!stagingKey) continue;

    const normalizedArtist = normalizeDuplicateText(row.hl_artiest);
    const normalizedTitle = normalizeDuplicateText(row.hl_titel_song);

    // Empty artist/title values are not safe enough for automatic duplicate grouping.
    if (!normalizedArtist || !normalizedTitle) continue;

    const key = `${normalizedArtist}\u0000${normalizedTitle}`;
    const list = grouped.get(key) || [];
    list.push({
      sh_key: stagingKey,
      hl_positie: safePosition(row.hl_positie),
      hl_artiest: row.hl_artiest ?? null,
      hl_titel_song: row.hl_titel_song ?? null,
      fd_action: row.fd_action ?? null,
      normalizedArtist,
      normalizedTitle
    });
    grouped.set(key, list);
  }

  const groups = [];
  for (const list of grouped.values()) {
    if (list.length < 2) continue;
    list.sort(sortRows);

    const activeRows = list.filter((row) => String(row.fd_action ?? "").trim().toLowerCase() !== "skip");
    const recommendedKeep = activeRows[0] || list[0];
    const suggestedDeleteKeys = list
      .filter((row) => row.sh_key !== recommendedKeep.sh_key)
      .map((row) => row.sh_key);

    groups.push({
      groupId: groupIdFor(list[0].normalizedArtist, list[0].normalizedTitle),
      normalizedArtist: list[0].normalizedArtist,
      normalizedTitle: list[0].normalizedTitle,
      displayArtist: list[0].hl_artiest,
      displayTitle: list[0].hl_titel_song,
      rowCount: list.length,
      recommendedKeepKey: recommendedKeep.sh_key,
      suggestedDeleteKeys,
      rows: list.map(({ normalizedArtist: _a, normalizedTitle: _t, ...row }) => row)
    });
  }

  groups.sort((a, b) => {
    const posA = a.rows[0]?.hl_positie ?? Number.MAX_SAFE_INTEGER;
    const posB = b.rows[0]?.hl_positie ?? Number.MAX_SAFE_INTEGER;
    if (posA !== posB) return posA - posB;
    return String(a.displayArtist ?? "").localeCompare(String(b.displayArtist ?? ""));
  });

  return {
    groupCount: groups.length,
    matchedRowCount: groups.reduce((sum, group) => sum + group.rowCount, 0),
    duplicateRowCount: groups.reduce((sum, group) => sum + Math.max(0, group.rowCount - 1), 0),
    suggestedDeleteKeys: groups.flatMap((group) => group.suggestedDeleteKeys),
    groups
  };
}

async function loadRunRows(client, runId) {
  const result = await client.query(
    `
      SELECT sh_key, hl_positie, hl_artiest, hl_titel_song, fd_action
      FROM public.staging_hitlijsten
      WHERE hl_import_run_id = $1
      ORDER BY hl_positie ASC NULLS LAST, sh_key ASC
    `,
    [runId]
  );
  return result.rows;
}

export async function getStagingDuplicateReview(client, runId) {
  const review = buildStagingDuplicateReview(await loadRunRows(client, runId));
  logger.info("Staging duplicate review resolved", {
    ...LOG_CONTEXT,
    operation: "getStagingDuplicateReview",
    runId,
    groupCount: review.groupCount,
    matchedRowCount: review.matchedRowCount,
    duplicateRowCount: review.duplicateRowCount
  });
  return review;
}

function normalizeSelectedKeys(keys) {
  return Array.from(new Set((Array.isArray(keys) ? keys : []).map(safeKey).filter(Boolean)));
}

export function validateDuplicateSelection(review, selectedKeys = []) {
  const selected = new Set(normalizeSelectedKeys(selectedKeys));
  if (selected.size === 0) {
    throw new Error("Selecteer minimaal één duplicate rij.");
  }

  const duplicateKeys = new Set(review.groups.flatMap((group) => group.rows.map((row) => row.sh_key)));
  for (const key of selected) {
    if (!duplicateKeys.has(key)) {
      throw new Error(`Stagingregel ${key} behoort niet tot een actuele duplicategroep.`);
    }
  }

  for (const group of review.groups) {
    const groupKeys = group.rows.map((row) => row.sh_key);
    const selectedInGroup = groupKeys.filter((key) => selected.has(key));
    if (selectedInGroup.length === groupKeys.length) {
      throw new Error(`Duplicategroep ${group.displayArtist ?? ""} — ${group.displayTitle ?? ""}: minimaal één rij moet behouden blijven.`);
    }
  }

  return [...selected];
}

export async function markSelectedStagingDuplicatesAsSkip(client, runId, stagingKeys = []) {
  const review = await getStagingDuplicateReview(client, runId);
  const keys = validateDuplicateSelection(review, stagingKeys);

  const result = await client.query(
    `
      UPDATE public.staging_hitlijsten
      SET fd_action = $3
      WHERE hl_import_run_id = $1
        AND sh_key = ANY($2::bigint[])
        AND lower(btrim(coalesce(fd_action::text, ''))) <> 'skip'
    `,
    [runId, keys, DUPLICATE_SKIP_ACTION]
  );

  logger.info("Selected staging duplicate rows marked as Skip", {
    ...LOG_CONTEXT,
    operation: "markSelectedStagingDuplicatesAsSkip",
    runId,
    selectedRows: keys.length,
    updatedRows: result.rowCount ?? 0
  });

  return {
    ok: true,
    runId,
    action: DUPLICATE_SKIP_ACTION,
    selectedRows: keys.length,
    updatedRows: Number(result.rowCount ?? 0)
  };
}

export async function physicallyDeleteSelectedStagingDuplicates(client, runId, stagingKeys = []) {
  const review = await getStagingDuplicateReview(client, runId);
  const keys = validateDuplicateSelection(review, stagingKeys);

  const auditResult = await client.query(
    `
      INSERT INTO public.staging_hitlijsten_delete_audit (
        sda_import_run_id,
        sda_staging_key,
        sda_hl_positie,
        sda_hl_artiest,
        sda_hl_titel_song,
        sda_fd_action,
        sda_delete_reason
      )
      SELECT
        s.hl_import_run_id,
        s.sh_key,
        s.hl_positie,
        s.hl_artiest::text,
        s.hl_titel_song::text,
        s.fd_action::text,
        $3
      FROM public.staging_hitlijsten s
      WHERE s.hl_import_run_id = $1
        AND s.sh_key = ANY($2::bigint[])
      ORDER BY s.sh_key
      RETURNING sda_key
    `,
    [runId, keys, PHYSICAL_DELETE_REASON]
  );

  const deleteResult = await client.query(
    `
      DELETE FROM public.staging_hitlijsten
      WHERE hl_import_run_id = $1
        AND sh_key = ANY($2::bigint[])
    `,
    [runId, keys]
  );

  await client.query(
    `
      UPDATE public.import_runs ir
      SET ir_row_count = (
        SELECT COUNT(*)::int
        FROM public.staging_hitlijsten s
        WHERE s.hl_import_run_id = ir.ir_run_id
      )
      WHERE ir.ir_run_id = $1
    `,
    [runId]
  );

  logger.info("Selected staging duplicate rows physically deleted", {
    ...LOG_CONTEXT,
    operation: "physicallyDeleteSelectedStagingDuplicates",
    runId,
    selectedRows: keys.length,
    auditedRows: auditResult.rowCount ?? 0,
    deletedRows: deleteResult.rowCount ?? 0
  });

  return {
    ok: true,
    runId,
    action: "PHYSICAL_DELETE",
    selectedRows: keys.length,
    auditedRows: Number(auditResult.rowCount ?? 0),
    deletedRows: Number(deleteResult.rowCount ?? 0),
    reason: PHYSICAL_DELETE_REASON
  };
}
