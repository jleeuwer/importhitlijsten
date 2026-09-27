import { pool } from "../config/db.js";

export async function createImportUploadCandidate(entry, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO public.import_upload_candidates (
       iuc_upload_id,
       iuc_source,
       iuc_original_file_name,
       iuc_storage_file_name,
       iuc_file_size,
       iuc_file_sha256,
       iuc_list_fingerprint,
       iuc_row_count,
       iuc_status,
       iuc_duplicate_type,
       iuc_duplicate_registry_key,
       iuc_duplicate_override,
       iuc_metadata,
       iuc_parse_error,
       iuc_import_error,
       iuc_expires_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false,$12::jsonb,$13,NULL,$14)
     RETURNING *`,
    [
      entry.uploadId,
      entry.source,
      entry.originalFileName,
      entry.storageFileName ?? null,
      entry.fileSize,
      entry.fileSha256 ?? null,
      entry.listFingerprint ?? null,
      entry.rowCount ?? null,
      entry.status,
      entry.duplicateType ?? null,
      entry.duplicateRegistryKey ?? null,
      JSON.stringify(entry.metadata ?? {}),
      entry.parseError ?? null,
      entry.expiresAt
    ]
  );
  return rows[0];
}

export async function listImportUploadCandidates(client = pool) {
  const { rows } = await client.query(
    `SELECT c.*,
            r.ifr_file_name AS duplicate_registry_file_name,
            r.ifr_imported_at AS duplicate_registry_imported_at,
            r.ifr_manually_marked_at AS duplicate_registry_manually_marked_at
       FROM public.import_upload_candidates c
       LEFT JOIN public.import_file_registry r
         ON r.ifr_key = c.iuc_duplicate_registry_key
      WHERE c.iuc_expires_at >= now()
      ORDER BY c.iuc_created_at DESC, c.iuc_key DESC`
  );
  return rows;
}

export async function getImportUploadCandidate(uploadId, client = pool) {
  const { rows } = await client.query(
    `SELECT c.*,
            r.ifr_file_name AS duplicate_registry_file_name,
            r.ifr_imported_at AS duplicate_registry_imported_at,
            r.ifr_manually_marked_at AS duplicate_registry_manually_marked_at
       FROM public.import_upload_candidates c
       LEFT JOIN public.import_file_registry r
         ON r.ifr_key = c.iuc_duplicate_registry_key
      WHERE c.iuc_upload_id = $1`,
    [uploadId]
  );
  return rows[0] ?? null;
}

export async function updateImportUploadCandidateMetadata(uploadId, { metadata, status }, client = pool) {
  const { rows } = await client.query(
    `UPDATE public.import_upload_candidates
        SET iuc_metadata = $2::jsonb,
            iuc_status = $3::varchar(32),
            iuc_import_error = CASE WHEN $3::varchar(32) = 'READY'::varchar(32) THEN NULL ELSE iuc_import_error END,
            iuc_updated_at = now()
      WHERE iuc_upload_id = $1
        AND iuc_status <> 'IMPORTED'
      RETURNING *`,
    [uploadId, JSON.stringify(metadata ?? {}), status]
  );
  return rows[0] ?? null;
}

export async function updateImportUploadCandidateOverride(uploadId, duplicateOverride, client = pool) {
  const { rows } = await client.query(
    `UPDATE public.import_upload_candidates
        SET iuc_duplicate_override = $2,
            iuc_updated_at = now()
      WHERE iuc_upload_id = $1
        AND iuc_status <> 'IMPORTED'
      RETURNING *`,
    [uploadId, !!duplicateOverride]
  );
  return rows[0] ?? null;
}

export async function updateImportUploadCandidateDuplicate(uploadId, { duplicateType, duplicateRegistryKey }, client = pool) {
  const { rows } = await client.query(
    `UPDATE public.import_upload_candidates
        SET iuc_duplicate_type = $2,
            iuc_duplicate_registry_key = $3,
            iuc_updated_at = now()
      WHERE iuc_upload_id = $1
      RETURNING *`,
    [uploadId, duplicateType ?? null, duplicateRegistryKey ?? null]
  );
  return rows[0] ?? null;
}

export async function markImportUploadCandidateError(uploadId, message, client = pool) {
  const { rows } = await client.query(
    `UPDATE public.import_upload_candidates
        SET iuc_status = 'IMPORT_ERROR',
            iuc_import_error = $2,
            iuc_updated_at = now()
      WHERE iuc_upload_id = $1
        AND iuc_status <> 'IMPORTED'
      RETURNING *`,
    [uploadId, String(message ?? "Importfout")]
  );
  return rows[0] ?? null;
}

export async function markImportUploadCandidateImported(uploadId, importRunId, client = pool) {
  const { rows } = await client.query(
    `UPDATE public.import_upload_candidates
        SET iuc_status = 'IMPORTED',
            iuc_storage_file_name = NULL,
            iuc_import_error = NULL,
            iuc_import_run_id = $2,
            iuc_imported_at = now(),
            iuc_updated_at = now()
      WHERE iuc_upload_id = $1
      RETURNING *`,
    [uploadId, importRunId]
  );
  return rows[0] ?? null;
}

export async function listReadyImportUploadCandidates(client = pool) {
  const { rows } = await client.query(
    `SELECT *
       FROM public.import_upload_candidates
      WHERE iuc_status = 'READY'
        AND iuc_expires_at >= now()
      ORDER BY iuc_created_at ASC, iuc_key ASC`
  );
  return rows;
}

export async function listExpiredImportUploadCandidates(client = pool) {
  const { rows } = await client.query(
    `SELECT *
       FROM public.import_upload_candidates
      WHERE iuc_expires_at < now()
      ORDER BY iuc_key ASC`
  );
  return rows;
}

export async function listTemporaryImportUploadCandidates(client = pool) {
  const { rows } = await client.query(
    `SELECT *
       FROM public.import_upload_candidates
      WHERE iuc_status <> 'IMPORTED'
      ORDER BY iuc_key ASC`
  );
  return rows;
}

export async function deleteImportUploadCandidate(uploadId, client = pool) {
  const { rows } = await client.query(
    `DELETE FROM public.import_upload_candidates
      WHERE iuc_upload_id = $1
      RETURNING *`,
    [uploadId]
  );
  return rows[0] ?? null;
}
