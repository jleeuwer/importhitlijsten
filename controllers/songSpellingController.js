// controllers/songSpellingController.js
import { pool } from "../config/db.js";

const ACTIVE_FILE_DETAILS_SQL = "lower(btrim(coalesce(fd.fd_action::text, 'Keep'))) NOT IN ('delete', 'duplicates', 'skip')";
const EXPORTABLE_STAGING_SQL = "lower(btrim(coalesce(s.fd_action::text, ''))) <> 'skip'";

/**
 * SongSpelling for a run (per requirements):
 *
 * When user clicks SongSpelling:
 * 1) If (hl_titel_song, hl_artiest) exists in song_spelling:
 *      staging.fd_tag_title = song_spelling.fd_tag_title
 *      staging.hl_find_cmd  = NULL
 *
 * 2) Else if file_details match exists (requires ArtistSpelling to have set hl_artist_key):
 *      file_details.fd_tag_title is matched by:
 *        file_details.fd_artist_key = staging.hl_artist_key
 *        file_details.fd_tag_title  = staging.hl_titel_song
 *      staging.fd_tag_title = file_details.fd_tag_title
 *      staging.hl_find_cmd  = NULL
 *
 * 3) Else (fallback):
 *      staging.fd_tag_title = staging.hl_titel_song
 *      (hl_find_cmd generation is handled by /api/run-filedetails-status refresh)
 */
export async function applySongSpellingForRun(runId) {
  const client = await pool.connect();

  const stats = {
    runId,
    totalRows: 0,
    matchedSongSpelling: 0,
    matchedFileDetails: 0,
    defaultedToTitle: 0,
    updated: 0
  };

  try {
    await client.query("BEGIN");

    // Total rows
    {
      const c = await client.query(
        `SELECT COUNT(*)::int AS cnt
         FROM public.staging_hitlijsten
         WHERE hl_import_run_id = $1
           AND lower(btrim(coalesce(fd_action::text, ''))) <> 'skip'`,
        [runId]
      );
      stats.totalRows = c.rows[0]?.cnt ?? 0;
    }

    // Step 1: apply song_spelling matches (title+artist)
    {
      const r = await client.query(
        `
        UPDATE public.staging_hitlijsten s
        SET fd_tag_title = ss.fd_tag_title,
            hl_find_cmd  = NULL
        FROM public.song_spelling ss
        WHERE s.hl_import_run_id = $1
          AND ${EXPORTABLE_STAGING_SQL}
          AND BTRIM(COALESCE(s.hl_titel_song, '')) <> ''
          AND BTRIM(COALESCE(s.hl_artiest, '')) <> ''
          AND ss.hl_titel_song = s.hl_titel_song
          AND ss.hl_artiest = s.hl_artiest
          AND COALESCE(s.fd_tag_title::text, '') <> COALESCE(ss.fd_tag_title::text, '')
        `,
        [runId]
      );

      stats.matchedSongSpelling = r.rowCount;
      stats.updated += r.rowCount;
    }

    // Step 2: for rows WITHOUT song_spelling match, try file_details by (artist_key + title)
    {
      const r = await client.query(
        `
        UPDATE public.staging_hitlijsten s
        SET fd_tag_title = fd.fd_tag_title,
            hl_find_cmd  = NULL
        FROM public.file_details fd
        WHERE s.hl_import_run_id = $1
          AND ${EXPORTABLE_STAGING_SQL}
          AND s.hl_artist_key IS NOT NULL
          AND BTRIM(COALESCE(s.hl_titel_song, '')) <> ''
          AND fd.fd_artist_key = s.hl_artist_key
          AND fd.fd_tag_title = s.hl_titel_song
          AND ${ACTIVE_FILE_DETAILS_SQL}
          AND NOT EXISTS (
            SELECT 1
            FROM public.song_spelling ss
            WHERE ss.hl_titel_song = s.hl_titel_song
              AND ss.hl_artiest = s.hl_artiest
          )
          AND COALESCE(s.fd_tag_title::text, '') <> COALESCE(fd.fd_tag_title::text, '')
        `,
        [runId]
      );

      stats.matchedFileDetails = r.rowCount;
      stats.updated += r.rowCount;
    }

    // Step 3: fallback for remaining rows where neither song_spelling nor file_details match
    {
      const r = await client.query(
        `
        UPDATE public.staging_hitlijsten s
        SET fd_tag_title = s.hl_titel_song
        WHERE s.hl_import_run_id = $1
          AND ${EXPORTABLE_STAGING_SQL}
          AND BTRIM(COALESCE(s.hl_titel_song, '')) <> ''
          AND NOT EXISTS (
            SELECT 1
            FROM public.song_spelling ss
            WHERE ss.hl_titel_song = s.hl_titel_song
              AND ss.hl_artiest = s.hl_artiest
          )
          AND NOT EXISTS (
            SELECT 1
            FROM public.file_details fd
            WHERE s.hl_artist_key IS NOT NULL
              AND fd.fd_artist_key = s.hl_artist_key
              AND fd.fd_tag_title = s.hl_titel_song
              AND ${ACTIVE_FILE_DETAILS_SQL}
          )
          AND COALESCE(s.fd_tag_title::text, '') <> COALESCE(s.hl_titel_song::text, '')
        `,
        [runId]
      );

      stats.defaultedToTitle = r.rowCount;
      stats.updated += r.rowCount;
    }

    await client.query("COMMIT");
    return stats;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
