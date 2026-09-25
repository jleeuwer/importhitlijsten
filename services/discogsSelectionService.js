// services/discogsSelectionService.js
function nullableInt(value, fieldName) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n)) {
    const err = new Error(`${fieldName} must be an integer or null`);
    err.status = 400;
    throw err;
  }
  return n;
}

function nullableText(value) {
  const s = String(value ?? "").trim();
  return s ? s : null;
}

function nullableYear(value, fieldName) {
  const n = nullableInt(value, fieldName);
  if (n === null) return null;
  if (n < 1850 || n > 2200) {
    const err = new Error(`${fieldName} must be a plausible year`);
    err.status = 400;
    throw err;
  }
  return n;
}

export function normalizeDiscogsSelection(input = {}) {
  const masterId = nullableInt(input.discogs_master_id, "discogs_master_id");
  const releaseId = nullableInt(input.discogs_release_id, "discogs_release_id");

  if (masterId === null && releaseId === null) {
    const err = new Error("discogs_master_id or discogs_release_id is required");
    err.status = 400;
    throw err;
  }

  return {
    discogs_master_id: masterId,
    discogs_master_url: nullableText(input.discogs_master_url),
    discogs_master_title: nullableText(input.discogs_master_title),
    discogs_master_artist: nullableText(input.discogs_master_artist),
    discogs_master_year: nullableYear(input.discogs_master_year, "discogs_master_year"),
    discogs_release_id: releaseId,
    discogs_release_url: nullableText(input.discogs_release_url),
    discogs_release_title: nullableText(input.discogs_release_title),
    discogs_release_format: nullableText(input.discogs_release_format),
    discogs_release_country: nullableText(input.discogs_release_country),
    discogs_release_year: nullableYear(input.discogs_release_year, "discogs_release_year")
  };
}

export async function saveDiscogsSelectionForStagingRow(client, runId, hlPositie, input = {}) {
  const selection = normalizeDiscogsSelection(input);

  const res = await client.query(
    `
    UPDATE public.staging_hitlijsten
    SET discogs_master_id = $3,
        discogs_master_url = $4,
        discogs_master_title = $5,
        discogs_master_artist = $6,
        discogs_master_year = $7,
        discogs_release_id = $8,
        discogs_release_url = $9,
        discogs_release_title = $10,
        discogs_release_format = $11,
        discogs_release_country = $12,
        discogs_release_year = $13,
        discogs_selected_at = now(),
        hl_discogs_link = COALESCE($4, $9, hl_discogs_link)
    WHERE hl_import_run_id = $1
      AND hl_positie = $2
    RETURNING hl_import_run_id, hl_positie, discogs_master_id, discogs_master_url,
              discogs_release_id, discogs_release_url, hl_discogs_link
    `,
    [
      runId,
      hlPositie,
      selection.discogs_master_id,
      selection.discogs_master_url,
      selection.discogs_master_title,
      selection.discogs_master_artist,
      selection.discogs_master_year,
      selection.discogs_release_id,
      selection.discogs_release_url,
      selection.discogs_release_title,
      selection.discogs_release_format,
      selection.discogs_release_country,
      selection.discogs_release_year
    ]
  );

  if (res.rowCount === 0) {
    const err = new Error(`No staging row found for runId=${runId}, hl_positie=${hlPositie}`);
    err.status = 404;
    throw err;
  }

  return { ok: true, row: res.rows[0], selection };
}
