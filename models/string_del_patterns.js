import { pool } from "../config/db.js";

export async function listPatterns() {
  const r = await pool.query(
    `SELECT st_key, st_string_delete
     FROM public.string_del_patterns
     ORDER BY st_string_delete ASC`
  );
  return r.rows;
}

export async function createPattern(st_string_delete) {
  const r = await pool.query(
    `INSERT INTO public.string_del_patterns (st_string_delete)
     VALUES ($1)
     RETURNING st_key, st_string_delete`,
    [st_string_delete]
  );
  return r.rows[0];
}

export async function updatePattern(st_key, st_string_delete) {
  const r = await pool.query(
    `UPDATE public.string_del_patterns
     SET st_string_delete = $2
     WHERE st_key = $1
     RETURNING st_key, st_string_delete`,
    [st_key, st_string_delete]
  );
  return r.rows[0] ?? null;
}

export async function deletePattern(st_key) {
  const r = await pool.query(
    `DELETE FROM public.string_del_patterns
     WHERE st_key = $1`,
    [st_key]
  );
  return r.rowCount; // 1 if deleted
}
