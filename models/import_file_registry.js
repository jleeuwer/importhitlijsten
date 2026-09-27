import { pool } from "../config/db.js";

export async function findRegistryByFileHash(fileSha256, client = pool) {
  if (!fileSha256) return null;
  const { rows } = await client.query(
    `SELECT * FROM public.import_file_registry
     WHERE ifr_file_sha256 = $1
     ORDER BY ifr_created_at DESC
     LIMIT 1`,
    [fileSha256]
  );
  return rows[0] ?? null;
}

export async function findRegistryByListFingerprint(listFingerprint, client = pool) {
  if (!listFingerprint) return null;
  const { rows } = await client.query(
    `SELECT * FROM public.import_file_registry
     WHERE ifr_list_fingerprint = $1
     ORDER BY ifr_created_at DESC
     LIMIT 1`,
    [listFingerprint]
  );
  return rows[0] ?? null;
}

export async function findRegistryMatches({ fileSha256, listFingerprint }, client = pool) {
  const [fileMatch, listMatch] = await Promise.all([
    findRegistryByFileHash(fileSha256, client),
    findRegistryByListFingerprint(listFingerprint, client)
  ]);
  return { fileMatch, listMatch };
}

export async function registerImportedFileTx(client, entry) {
  const { rows } = await client.query(
    `INSERT INTO public.import_file_registry (
       ifr_file_name,
       ifr_last_seen_directory,
       ifr_file_size,
       ifr_file_modified_at,
       ifr_file_sha256,
       ifr_list_fingerprint,
       ifr_status,
       ifr_import_run_id,
       ifr_duplicate_override,
       ifr_duplicate_of_registry_key,
       ifr_imported_at,
       ifr_created_at,
       ifr_updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,'IMPORTED',$7,$8,$9,now(),now(),now())
     RETURNING *`,
    [
      entry.fileName,
      entry.directoryPath ?? null,
      entry.fileSize ?? null,
      entry.fileModifiedAt ?? null,
      entry.fileSha256,
      entry.listFingerprint,
      entry.importRunId,
      !!entry.duplicateOverride,
      entry.duplicateOfRegistryKey ?? null
    ]
  );
  return rows[0];
}

export async function registerManualImportedFile(entry, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO public.import_file_registry (
       ifr_file_name,
       ifr_last_seen_directory,
       ifr_file_size,
       ifr_file_modified_at,
       ifr_file_sha256,
       ifr_list_fingerprint,
       ifr_status,
       ifr_import_run_id,
       ifr_duplicate_override,
       ifr_duplicate_of_registry_key,
       ifr_manually_marked_at,
       ifr_created_at,
       ifr_updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,'MANUALLY_MARKED_IMPORTED',NULL,false,$7,now(),now(),now())
     RETURNING *`,
    [
      entry.fileName,
      entry.directoryPath ?? null,
      entry.fileSize ?? null,
      entry.fileModifiedAt ?? null,
      entry.fileSha256,
      entry.listFingerprint,
      entry.duplicateOfRegistryKey ?? null
    ]
  );
  return rows[0];
}

export async function removeManualImportedMark(registryKey, client = pool) {
  const { rows } = await client.query(
    `DELETE FROM public.import_file_registry
     WHERE ifr_key = $1
       AND ifr_status = 'MANUALLY_MARKED_IMPORTED'
     RETURNING *`,
    [registryKey]
  );
  return rows[0] ?? null;
}

export async function getRegistryByKey(registryKey, client = pool) {
  const { rows } = await client.query(
    `SELECT * FROM public.import_file_registry WHERE ifr_key = $1`,
    [registryKey]
  );
  return rows[0] ?? null;
}
