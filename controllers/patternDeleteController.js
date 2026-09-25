// controllers/patternDeleteController.js
import { pool } from "../config/db.js";

function escapeRegExp(literal) {
  return String(literal).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyPatternsToTitle(title, patterns) {
  let out = String(title ?? "");

  for (const pat of patterns) {
    // case-insensitive literal match
    const re = new RegExp(escapeRegExp(pat), "gi");
    out = out.replace(re, "");
  }

  // cleanup: collapse whitespace + trim
  out = out.replace(/\s{2,}/g, " ").trim();
  return out;
}

/**
 * PatternDelete for a run:
 * - Load patterns from public.string_del_patterns
 * - For each staging row: remove all pattern occurrences from hl_titel_song
 * - Clean up whitespace (collapse multiple spaces, trim)
 *
 * options:
 *  - dryRun: boolean (default false)
 *  - previewLimit: number (default 20)
 *
 * Transactional per run.
 * Dry run still uses a transaction for consistent reads, but no updates are made.
 */
export async function applyPatternDeleteForRun(runId, options = {}) {
  const { dryRun = false, previewLimit = 20 } = options;

  const client = await pool.connect();

  const stats = {
    runId,
    dryRun,
    patterns: 0,
    totalRows: 0,
    wouldUpdateRows: 0,
    updatedRows: 0
  };

  const preview = [];

  try {
    await client.query("BEGIN");

    const p = await client.query(
      `SELECT st_string_delete
       FROM public.string_del_patterns
       ORDER BY st_key ASC`
    );

    const patterns = (p.rows || [])
      .map((r) => String(r.st_string_delete ?? "").trim())
      .filter(Boolean);

    stats.patterns = patterns.length;

    const r = await client.query(
      `
      SELECT hl_positie, hl_titel_song
      FROM public.staging_hitlijsten
      WHERE hl_import_run_id = $1
      ORDER BY hl_positie
      `,
      [runId]
    );

    stats.totalRows = r.rows.length;

    for (const row of r.rows) {
      const oldTitle = String(row.hl_titel_song ?? "");
      const newTitle = applyPatternsToTitle(oldTitle, patterns);

      if (newTitle !== oldTitle) {
        stats.wouldUpdateRows++;

        // preview only for dry-run (or if you also want preview on real run, you can keep it)
        if (dryRun && preview.length < previewLimit) {
          preview.push({
            hl_positie: row.hl_positie,
            before: oldTitle,
            after: newTitle
          });
        }

        if (!dryRun) {
          await client.query(
            `
            UPDATE public.staging_hitlijsten
            SET hl_titel_song = $1
            WHERE hl_import_run_id = $2
              AND hl_positie = $3
            `,
            [newTitle, runId, row.hl_positie]
          );
          stats.updatedRows++;
        }
      }
    }

    await client.query("COMMIT");
    return { stats, preview };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
