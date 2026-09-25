import { logger } from "../config/logger.js";
import { getStagingRowDiagnostics } from "./editDiagnosticsService.js";

const LOG_CONTEXT = {
  module: "importhitlijst",
  feature: "editPhase"
};

function trimText(value) {
  const text = String(value ?? "").trim();
  return text === "" ? null : text;
}

export async function repairArtistRelationForStagingRow(client, runId, hlPositie) {
  try {
    const rowRes = await client.query(
      `
        SELECT hl_import_run_id, hl_positie, hl_artiest, hl_artist_key
        FROM public.staging_hitlijsten
        WHERE hl_import_run_id = $1
          AND hl_positie = $2
        LIMIT 1
      `,
      [runId, hlPositie]
    );

    if (rowRes.rowCount === 0) {
      const err = new Error("Staging row not found.");
      err.status = 404;
      throw err;
    }

    const row = rowRes.rows[0];
    const artistInput = trimText(row.hl_artiest);

    logger.info("Edit-phase artist relation repair started", {
      ...LOG_CONTEXT,
      operation: "repairArtistRelation",
      runId: row.hl_import_run_id,
      hlPositie: row.hl_positie,
      hlArtiest: artistInput,
      oldHlArtistKey: row.hl_artist_key ?? null
    });

    if (!artistInput) {
      logger.warn("Edit-phase artist relation repair blocked", {
        ...LOG_CONTEXT,
        operation: "repairArtistRelation",
        runId: row.hl_import_run_id,
        hlPositie: row.hl_positie,
        reasonCode: "UNRESOLVED_HL_ARTIEST"
      });
      const err = new Error("Cannot repair artist relation because hl_artiest is empty.");
      err.status = 409;
      err.reasonCode = "UNRESOLVED_HL_ARTIEST";
      throw err;
    }

    let action = "reused_existing_relation";

    let artistRes = await client.query(
      `
        SELECT ar_artist_key, ar_artist_name
        FROM public.artist
        WHERE ar_artist_name = $1::citext
        ORDER BY ar_artist_key ASC
        LIMIT 1
      `,
      [artistInput]
    );

    if (artistRes.rowCount === 0) {
      artistRes = await client.query(
        `
          INSERT INTO public.artist (ar_artist_name)
          VALUES ($1)
          ON CONFLICT ON CONSTRAINT artist_ar_artist_name_key
          DO UPDATE SET
            ar_updated_at = now(),
            ar_is_deleted = false,
            ar_deleted_at = NULL
          RETURNING ar_artist_key, ar_artist_name, (xmax = 0) AS inserted
        `,
        [artistInput]
      );
      action = artistRes.rows[0]?.inserted ? "created_artist" : action;
    }

    const artistKey = artistRes.rows[0].ar_artist_key;
    const canonicalArtistName = artistRes.rows[0].ar_artist_name;

    const spellingRes = await client.query(
      `
        INSERT INTO public.artiesten_spelling (as_alternatieve_spelling, as_artist_key)
        VALUES ($1, $2)
        ON CONFLICT ON CONSTRAINT artiesten_spelling_alt_unique
        DO UPDATE SET as_artist_key = EXCLUDED.as_artist_key
        RETURNING as_alternatieve_spelling, as_artist_key, (xmax = 0) AS inserted
      `,
      [artistInput, artistKey]
    );

    if (action === "reused_existing_relation") {
      action = spellingRes.rows[0]?.inserted ? "created_artist_spelling" : "repaired_artist_relation";
    } else if (action === "created_artist") {
      action = "created_artist_and_spelling";
    }

    await client.query(
      `
        UPDATE public.staging_hitlijsten
        SET
          hl_artist_key = $3,
          as_correcte_artiest_spelling = $4
        WHERE hl_import_run_id = $1
          AND hl_positie = $2
      `,
      [row.hl_import_run_id, row.hl_positie, artistKey, canonicalArtistName]
    );

    const diagnostics = await getStagingRowDiagnostics(client, row.hl_import_run_id, row.hl_positie);

    logger.info("Edit-phase artist relation repair completed", {
      ...LOG_CONTEXT,
      operation: "repairArtistRelation",
      runId: row.hl_import_run_id,
      hlPositie: row.hl_positie,
      hlArtiest: artistInput,
      oldHlArtistKey: row.hl_artist_key ?? null,
      newHlArtistKey: artistKey,
      action,
      status: diagnostics.status,
      reasonCode: diagnostics.reasonCode
    });

    return {
      ok: true,
      runId: row.hl_import_run_id,
      hlPositie: row.hl_positie,
      action,
      oldHlArtistKey: row.hl_artist_key ?? null,
      newHlArtistKey: artistKey,
      diagnostics
    };
  } catch (error) {
    logger.error("Edit-phase artist relation repair failed", {
      ...LOG_CONTEXT,
      operation: "repairArtistRelation",
      runId,
      hlPositie,
      reasonCode: error?.reasonCode ?? null,
      statusCode: error?.status ?? 500,
      error: error?.message || String(error)
    });
    throw error;
  }
}
