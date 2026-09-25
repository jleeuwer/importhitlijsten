import { pool } from "../config/db.js";

export async function listSongTypes() {
  const r = await pool.query(
    `
    SELECT
      st_song_type_key,
      st_song_type,
      st_song_type_desc,
      COALESCE(NULLIF(btrim(st_song_type_desc::text), ''), NULLIF(btrim(st_song_type::text), ''), st_song_type_key::text) AS display_name
    FROM public.song_types
    ORDER BY COALESCE(NULLIF(btrim(st_song_type_desc::text), ''), NULLIF(btrim(st_song_type::text), ''), st_song_type_key::text) ASC,
             st_song_type_key ASC
    `
  );
  return r.rows;
}

export async function songTypeExists(songTypeKey) {
  if (songTypeKey === null || songTypeKey === undefined || songTypeKey === "") return true;
  const n = Number(songTypeKey);
  if (!Number.isInteger(n)) return false;
  const r = await pool.query(
    `SELECT 1 FROM public.song_types WHERE st_song_type_key = $1 LIMIT 1`,
    [n]
  );
  return r.rowCount > 0;
}
