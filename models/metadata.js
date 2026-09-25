// models/metadata.js
import { pool } from "../config/db.js";

function toNullableInt(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n)) throw new Error("Expected integer metadata key or null");
  return n;
}

export async function listOmroepen({ activeOnly = true } = {}) {
  const where = activeOnly ? "WHERE omroep_actief = true" : "";
  const res = await pool.query(
    `
    SELECT omroep_key, omroep_code, omroep_naam, omroep_land, omroep_actief, omroep_opmerking, sort_order
    FROM public.omroepen
    ${where}
    ORDER BY sort_order ASC, omroep_naam ASC
    `
  );
  return res.rows;
}

export async function listHitlijstPerioden({ activeOnly = true } = {}) {
  const where = activeOnly ? "WHERE actief = true" : "";
  const res = await pool.query(
    `
    SELECT periode_key, periode_code, periode_naam, periode_type, start_jaar, eind_jaar, actief, sort_order
    FROM public.hitlijst_perioden
    ${where}
    ORDER BY sort_order ASC, periode_naam ASC
    `
  );
  return res.rows;
}

export async function getMetadataOptions() {
  const [omroepen, perioden] = await Promise.all([
    listOmroepen({ activeOnly: true }),
    listHitlijstPerioden({ activeOnly: true })
  ]);
  return { omroepen, perioden };
}

export async function updateRunMetadata(client, runId, { omroep_key, periode_key }) {
  const omroepKey = toNullableInt(omroep_key);
  const periodeKey = toNullableInt(periode_key);

  if (omroepKey === null && periodeKey === null) {
    return { updatedRows: 0, omroep_key: null, periode_key: null };
  }

  const sets = [];
  const values = [];
  let idx = 1;

  if (omroepKey !== null) {
    sets.push(`omroep_key = $${idx++}`);
    values.push(omroepKey);
  }
  if (periodeKey !== null) {
    sets.push(`periode_key = $${idx++}`);
    values.push(periodeKey);
  }

  values.push(runId);
  const res = await client.query(
    `
    UPDATE public.staging_hitlijsten
    SET ${sets.join(", ")}
    WHERE hl_import_run_id = $${idx}
    `,
    values
  );

  return {
    updatedRows: res.rowCount ?? 0,
    omroep_key: omroepKey,
    periode_key: periodeKey
  };
}

async function assertMetadataKeyExists(client, tableName, keyColumn, keyValue, label) {
  if (keyValue === null) return;
  const res = await client.query(
    `SELECT 1 FROM public.${tableName} WHERE ${keyColumn} = $1 LIMIT 1`,
    [keyValue]
  );
  if (res.rowCount === 0) {
    const err = new Error(`Unknown ${label}: ${keyValue}`);
    err.status = 400;
    throw err;
  }
}

export async function updateRunMetadataAndSyncExported(client, runId, { omroep_key, periode_key, syncExportedHitlijsten = true }) {
  const omroepKey = toNullableInt(omroep_key);
  const periodeKey = toNullableInt(periode_key);

  if (omroepKey === null || periodeKey === null) {
    const err = new Error("omroep_key and periode_key are required");
    err.status = 400;
    throw err;
  }

  await assertMetadataKeyExists(client, "omroepen", "omroep_key", omroepKey, "omroep_key");
  await assertMetadataKeyExists(client, "hitlijst_perioden", "periode_key", periodeKey, "periode_key");

  const runRes = await client.query(
    `
    SELECT ir_run_id, ir_hitlijst, ir_uitzendjaar
    FROM public.import_runs
    WHERE ir_run_id = $1
    LIMIT 1
    `,
    [runId]
  );

  if (runRes.rowCount === 0) {
    const err = new Error(`Unknown import run: ${runId}`);
    err.status = 404;
    throw err;
  }

  const run = runRes.rows[0];

  const stagingRes = await client.query(
    `
    UPDATE public.staging_hitlijsten
    SET omroep_key = $2,
        periode_key = $3
    WHERE hl_import_run_id = $1
    `,
    [runId, omroepKey, periodeKey]
  );

  const existingRes = await client.query(
    `
    SELECT COUNT(*)::int AS exported_row_count
    FROM public.hitlijsten
    WHERE hl_hitlijst = $1
      AND hl_uitzendjaar = $2
    `,
    [run.ir_hitlijst, run.ir_uitzendjaar]
  );
  const exportedRowCount = Number(existingRes.rows[0]?.exported_row_count ?? 0);
  const wasExported = exportedRowCount > 0;

  let hitlijstenUpdated = 0;
  if (syncExportedHitlijsten && wasExported) {
    const hitRes = await client.query(
      `
      UPDATE public.hitlijsten
      SET omroep_key = $3,
          periode_key = $4
      WHERE hl_hitlijst = $1
        AND hl_uitzendjaar = $2
      `,
      [run.ir_hitlijst, run.ir_uitzendjaar, omroepKey, periodeKey]
    );
    hitlijstenUpdated = hitRes.rowCount ?? 0;
  }

  return {
    ok: true,
    runId,
    hl_hitlijst: run.ir_hitlijst,
    hl_uitzendjaar: run.ir_uitzendjaar,
    stagingUpdated: stagingRes.rowCount ?? 0,
    hitlijstenUpdated,
    exportedRowCount,
    wasExported,
    omroep_key: omroepKey,
    periode_key: periodeKey
  };
}
