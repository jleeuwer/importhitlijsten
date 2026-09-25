// models/file_details.js
import { pool } from "../config/db.js";

const ACTIVE_FILE_DETAILS_SQL = "lower(btrim(coalesce(fd.fd_action::text, 'Keep'))) NOT IN ('delete', 'duplicates', 'skip')";

/**
 * Popup 2 (AltSpelling): list file_details rows by artist.
 * fd_correct_artist is citext => normal '=' is case-insensitive already.
 */
export async function findFileDetailsByCorrectArtist(fd_correct_artist) {
  const artist = String(fd_correct_artist || "").trim();
  if (!artist) return [];

  const r = await pool.query(
    `
    SELECT
      fd.fd_correct_artist,
      fd.fd_tag_title,
      fd.fd_file_name,
      fd.fd_hitlijst,
      fd.fd_duration::text AS fd_duration,
      st.st_song_type,
      st.st_song_type_desc,
      fd.fd_year_song_publish,
      fd.fd_year_song_version
    FROM public.file_details fd
    LEFT JOIN public.song_types st
      ON st.st_song_type_key = fd.fd_song_type_key
    WHERE fd.fd_correct_artist = $1::citext
      AND ${ACTIVE_FILE_DETAILS_SQL}
    ORDER BY fd.fd_tag_title, fd.fd_file_name
    LIMIT 500
    `,
    [artist]
  );

  return r.rows;
}

/**
 * Popup 1: show all file_details rows that match a given fd_tag_title.
 * fd_tag_title is citext => '=' is case-insensitive.
 */
export async function findFileDetailsByTagTitle(fd_tag_title) {
  const title = String(fd_tag_title ?? "").trim();
  if (!title) return [];

  const r = await pool.query(
    `
    SELECT
      fd.fd_correct_artist,
      fd.fd_tag_title,
      fd.fd_file_name,
      fd.fd_hitlijst,
      fd.fd_duration::text AS fd_duration,
      fd.fd_year_song_publish,
      fd.fd_year_song_version,
      st.st_song_type,
      st.st_song_type_desc
    FROM public.file_details fd
    LEFT JOIN public.song_types st
      ON st.st_song_type_key = fd.fd_song_type_key
    WHERE btrim(fd.fd_tag_title::text) = btrim($1::text)
      AND ${ACTIVE_FILE_DETAILS_SQL}
    ORDER BY fd.fd_correct_artist NULLS LAST, fd.fd_file_name NULLS LAST
    `,
    [title]
  );

  return r.rows;
}

/**
 * Strip diacritics, punctuation, and special characters
 * ONLY for creating hl_find_cmd (artist/title themselves remain unchanged in DB).
 */
function sanitizeForFindCmd(input) {
  let s = String(input ?? "");

  // Normalize (split accents), then remove combining marks
  s = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

  // Replace anything not a letter/number/space with a space
  s = s.replace(/[^\p{L}\p{N}\s]/gu, " ");

  // Collapse whitespace + trim
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

function buildFindCopyCmd({ artistForCmd, titleForCmd }) {
  const artistSan = sanitizeForFindCmd(artistForCmd);
  const titleSan = sanitizeForFindCmd(titleForCmd);

  const artist10 = artistSan.slice(0, 10);
  const pattern = `*${artist10}*${titleSan}*`;

  return `findcopy.sh "${pattern}" "$TARGET"`;
}

/**
 * For a runId:
 * Determine per-row status using REQUIRED logic:
 * 1) song_spelling match exists by (hl_titel_song, hl_artiest) => source='song_spelling'
 * 2) else file_details match exists by (hl_artist_key, hl_titel_song) => source='file_details'
 * 3) else source='fallback'
 *
 * - If source != 'fallback': clear staging.hl_find_cmd
 * - If source == 'fallback': populate staging.hl_find_cmd using
 *     artistForCmd = as_correcte_artiest_spelling ?? hl_artiest
 *     titleForCmd  = hl_titel_song
 *
 * Returns array: [{ hl_positie, matchCount, effective_title, source }]
 */
export async function enrichFindCmdAndGetStatusForRun(runId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // One row per staging row using LATERAL joins to avoid duplicates
    const q = await client.query(
      `
      SELECT
        s.hl_positie,
        s.hl_titel_song,
        COALESCE(NULLIF(s.as_correcte_artiest_spelling,''), NULLIF(s.hl_artiest,''), '') AS artist_for_cmd,
        s.hl_find_cmd,

        ss.fd_tag_title AS ss_fd_tag_title,

        fd1.fd_tag_title AS fd_fd_tag_title

      FROM public.staging_hitlijsten s

      LEFT JOIN public.song_spelling ss
        ON ss.hl_titel_song = s.hl_titel_song
       AND ss.hl_artiest    = s.hl_artiest

      LEFT JOIN LATERAL (
        SELECT fd.fd_tag_title
        FROM public.file_details fd
        WHERE s.hl_artist_key IS NOT NULL
          AND fd.fd_artist_key = s.hl_artist_key
          AND fd.fd_tag_title  = s.hl_titel_song
          AND ${ACTIVE_FILE_DETAILS_SQL}
        LIMIT 1
      ) fd1 ON true

      WHERE s.hl_import_run_id = $1
      ORDER BY s.hl_positie
      `,
      [runId]
    );

    const statuses = [];

    for (const r of q.rows) {
      const hl_positie = r.hl_positie;

      const hasSongSpelling = r.ss_fd_tag_title != null && String(r.ss_fd_tag_title).trim() !== "";
      const hasFileDetails = r.fd_fd_tag_title != null && String(r.fd_fd_tag_title).trim() !== "";

      const source = hasSongSpelling ? "song_spelling" : hasFileDetails ? "file_details" : "fallback";
      const matchCount = source === "fallback" ? 0 : 1;

      const effective_title = hasSongSpelling
        ? String(r.ss_fd_tag_title)
        : hasFileDetails
          ? String(r.fd_fd_tag_title)
          : String(r.hl_titel_song ?? "");

      statuses.push({
        hl_positie,
        matchCount,
        effective_title,
        source
      });

      // Update hl_find_cmd per rule
      if (matchCount > 0) {
        // clear if set
        if (r.hl_find_cmd != null && String(r.hl_find_cmd).trim() !== "") {
          await client.query(
            `
            UPDATE public.staging_hitlijsten
            SET hl_find_cmd = NULL
            WHERE hl_import_run_id = $1
              AND hl_positie = $2
            `,
            [runId, hl_positie]
          );
        }
      } else {
        // fallback => generate cmd (use original title)
        const titleForCmd = String(r.hl_titel_song ?? "").trim();
        const artistForCmd = String(r.artist_for_cmd ?? "").trim();

        if (titleForCmd) {
          const cmd = buildFindCopyCmd({ artistForCmd, titleForCmd });
          const oldCmd = String(r.hl_find_cmd ?? "");
          if (oldCmd !== cmd) {
            await client.query(
              `
              UPDATE public.staging_hitlijsten
              SET hl_find_cmd = $1
              WHERE hl_import_run_id = $2
                AND hl_positie = $3
              `,
              [cmd, runId, hl_positie]
            );
          }
        }
      }
    }

    await client.query("COMMIT");
    return statuses;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
