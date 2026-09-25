-- BL-IMP-123 — file_details duplicate diagnostics
-- Purpose: determine whether duplicate songs/versions in file_details are historical,
--          created by scan/promote flows, or created during Importhitlijst -> Hitlijsten export.
-- Safety: read-only. This script creates TEMP views only and does not change data.

\set ON_ERROR_STOP on
\pset pager off
\timing on

\echo '== BL-IMP-123: schema sanity =='
SELECT
  to_regclass('public.file_details') AS file_details_table,
  to_regclass('public.hitlijsten') AS hitlijsten_table,
  to_regclass('public.import_runs') AS import_runs_table;

\echo '== BL-IMP-123: available file_details duplicate-relevant columns =='
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'file_details'
  AND column_name = ANY(ARRAY[
    'fd_key','fd_correct_artist','fd_tag_title','fd_file_name','fd_hitlijst','fd_song_type_key',
    'fd_action','fd_discogs','fd_year_song_publish','fd_year_song_version',
    'fd_entry_added','fd_entry_added_ts','fd_entry_modified','fd_artist_key'
  ])
ORDER BY ordinal_position;

\echo '== BL-IMP-123: available hitlijsten reference columns =='
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'hitlijsten'
  AND column_name = ANY(ARRAY[
    'hl_hitlijst','hl_uitzendjaar','hl_positie','ar_artist_key','fd_key','fd_tag_title',
    'hl_samenstel_fd_key','hl_samenstel_status','discogs_master_url','discogs_release_url'
  ])
ORDER BY ordinal_position;

DROP VIEW IF EXISTS pg_temp.bl_imp_123_fd_normalized;
CREATE TEMP VIEW bl_imp_123_fd_normalized AS
SELECT
  fd.fd_key,
  fd.fd_artist_key,
  lower(regexp_replace(replace(btrim(COALESCE(fd.fd_correct_artist::text, '')), chr(160), ' '), '\s+', ' ', 'g')) AS artist_norm,
  lower(regexp_replace(replace(btrim(COALESCE(fd.fd_tag_title::text, '')), chr(160), ' '), '\s+', ' ', 'g')) AS title_norm,
  COALESCE(fd.fd_song_type_key, -1) AS song_type_key_norm,
  lower(regexp_replace(replace(btrim(COALESCE(fd.fd_hitlijst::text, '')), chr(160), ' '), '\s+', ' ', 'g')) AS hitlijst_norm,
  fd.fd_correct_artist,
  fd.fd_tag_title,
  fd.fd_file_name,
  fd.fd_hitlijst,
  fd.fd_song_type_key,
  fd.fd_action,
  fd.fd_discogs,
  fd.fd_year_song_publish,
  fd.fd_year_song_version,
  fd.fd_entry_added,
  fd.fd_entry_added_ts,
  fd.fd_entry_modified
FROM public.file_details fd
WHERE COALESCE(lower(btrim(fd.fd_action::text)), 'keep') <> 'delete';

DROP VIEW IF EXISTS pg_temp.bl_imp_123_duplicate_groups;
CREATE TEMP VIEW bl_imp_123_duplicate_groups AS
SELECT
  fd_artist_key,
  artist_norm,
  title_norm,
  song_type_key_norm,
  hitlijst_norm,
  COUNT(*) AS duplicate_count,
  MIN(fd_key) AS canonical_candidate_fd_key,
  ARRAY_AGG(fd_key ORDER BY fd_key) AS fd_keys,
  MIN(fd_entry_added_ts) AS first_added_ts,
  MAX(fd_entry_added_ts) AS last_added_ts,
  MIN(fd_entry_modified) AS first_modified_ts,
  MAX(fd_entry_modified) AS last_modified_ts
FROM bl_imp_123_fd_normalized
GROUP BY fd_artist_key, artist_norm, title_norm, song_type_key_norm, hitlijst_norm
HAVING COUNT(*) > 1;

\echo '== BL-IMP-123: summary counts =='
SELECT
  (SELECT COUNT(*) FROM public.file_details) AS total_file_details,
  (SELECT COUNT(*) FROM bl_imp_123_fd_normalized) AS active_file_details,
  (SELECT COUNT(*) FROM bl_imp_123_duplicate_groups) AS duplicate_groups,
  COALESCE((SELECT SUM(duplicate_count - 1) FROM bl_imp_123_duplicate_groups), 0) AS surplus_duplicate_records;

\echo '== BL-IMP-123: top duplicate groups by same artist/title/songtype/hitlijst =='
SELECT
  duplicate_count,
  canonical_candidate_fd_key,
  fd_artist_key,
  artist_norm,
  title_norm,
  NULLIF(song_type_key_norm, -1) AS fd_song_type_key,
  NULLIF(hitlijst_norm, '') AS fd_hitlijst,
  fd_keys,
  first_added_ts,
  last_added_ts,
  first_modified_ts,
  last_modified_ts
FROM bl_imp_123_duplicate_groups
ORDER BY duplicate_count DESC, artist_norm, title_norm
LIMIT 100;

\echo '== BL-IMP-123: duplicate rows detail, including hitlijsten references =='
WITH referenced AS (
  SELECT
    fd.fd_key,
    COUNT(h_original.*) AS hitlijsten_original_fd_key_refs,
    COUNT(h_samenstel.*) AS hitlijsten_samenstel_fd_key_refs,
    ARRAY_REMOVE(ARRAY_AGG(DISTINCT concat_ws(' ', h_original.hl_hitlijst::text, h_original.hl_uitzendjaar::text, '#' || h_original.hl_positie::text)), NULL) AS original_contexts,
    ARRAY_REMOVE(ARRAY_AGG(DISTINCT concat_ws(' ', h_samenstel.hl_hitlijst::text, h_samenstel.hl_uitzendjaar::text, '#' || h_samenstel.hl_positie::text)), NULL) AS samenstel_contexts
  FROM bl_imp_123_fd_normalized fd
  LEFT JOIN public.hitlijsten h_original ON h_original.fd_key = fd.fd_key
  LEFT JOIN public.hitlijsten h_samenstel ON h_samenstel.hl_samenstel_fd_key = fd.fd_key
  GROUP BY fd.fd_key
)
SELECT
  g.duplicate_count,
  fd.fd_key,
  fd.fd_correct_artist,
  fd.fd_tag_title,
  fd.fd_song_type_key,
  fd.fd_hitlijst,
  fd.fd_file_name,
  fd.fd_discogs,
  fd.fd_year_song_publish,
  fd.fd_year_song_version,
  fd.fd_entry_added,
  fd.fd_entry_added_ts,
  fd.fd_entry_modified,
  r.hitlijsten_original_fd_key_refs,
  r.hitlijsten_samenstel_fd_key_refs,
  r.original_contexts,
  r.samenstel_contexts
FROM bl_imp_123_duplicate_groups g
JOIN bl_imp_123_fd_normalized fd
  ON fd.fd_artist_key IS NOT DISTINCT FROM g.fd_artist_key
 AND fd.artist_norm = g.artist_norm
 AND fd.title_norm = g.title_norm
 AND fd.song_type_key_norm = g.song_type_key_norm
 AND fd.hitlijst_norm = g.hitlijst_norm
LEFT JOIN referenced r ON r.fd_key = fd.fd_key
ORDER BY g.duplicate_count DESC, fd.artist_norm, fd.title_norm, fd.fd_key
LIMIT 500;

\echo '== BL-IMP-123: duplicate groups classified by hitlijsten usage =='
WITH usage_per_group AS (
  SELECT
    g.*,
    SUM(CASE WHEN h_original.fd_key IS NOT NULL THEN 1 ELSE 0 END) AS original_ref_rows,
    SUM(CASE WHEN h_samenstel.hl_samenstel_fd_key IS NOT NULL THEN 1 ELSE 0 END) AS samenstel_ref_rows,
    COUNT(DISTINCT h_original.hl_hitlijst::text || '|' || h_original.hl_uitzendjaar::text) AS original_context_count,
    COUNT(DISTINCT h_samenstel.hl_hitlijst::text || '|' || h_samenstel.hl_uitzendjaar::text) AS samenstel_context_count
  FROM bl_imp_123_duplicate_groups g
  JOIN bl_imp_123_fd_normalized fd
    ON fd.fd_artist_key IS NOT DISTINCT FROM g.fd_artist_key
   AND fd.artist_norm = g.artist_norm
   AND fd.title_norm = g.title_norm
   AND fd.song_type_key_norm = g.song_type_key_norm
   AND fd.hitlijst_norm = g.hitlijst_norm
  LEFT JOIN public.hitlijsten h_original ON h_original.fd_key = fd.fd_key
  LEFT JOIN public.hitlijsten h_samenstel ON h_samenstel.hl_samenstel_fd_key = fd.fd_key
  GROUP BY g.fd_artist_key, g.artist_norm, g.title_norm, g.song_type_key_norm, g.hitlijst_norm, g.duplicate_count, g.canonical_candidate_fd_key, g.fd_keys, g.first_added_ts, g.last_added_ts, g.first_modified_ts, g.last_modified_ts
)
SELECT
  CASE
    WHEN samenstel_ref_rows > 0 THEN 'USED_IN_SAMENSTEL'
    WHEN original_ref_rows > 0 THEN 'USED_AS_IMPORT_EXPORT_LINK_ONLY'
    ELSE 'NOT_REFERENCED_BY_HITLIJSTEN'
  END AS duplicate_usage_classification,
  COUNT(*) AS groups,
  SUM(duplicate_count - 1) AS surplus_records
FROM usage_per_group
GROUP BY 1
ORDER BY groups DESC;

\echo '== BL-IMP-123: recent duplicate rows added/modified in last 30 days =='
SELECT
  fd.fd_key,
  fd.fd_correct_artist,
  fd.fd_tag_title,
  fd.fd_song_type_key,
  fd.fd_hitlijst,
  fd.fd_entry_added_ts,
  fd.fd_entry_modified,
  g.duplicate_count,
  g.fd_keys
FROM bl_imp_123_duplicate_groups g
JOIN bl_imp_123_fd_normalized fd
  ON fd.fd_artist_key IS NOT DISTINCT FROM g.fd_artist_key
 AND fd.artist_norm = g.artist_norm
 AND fd.title_norm = g.title_norm
 AND fd.song_type_key_norm = g.song_type_key_norm
 AND fd.hitlijst_norm = g.hitlijst_norm
WHERE fd.fd_entry_added_ts >= now() - interval '30 days'
   OR fd.fd_entry_modified >= now() - interval '30 days'
ORDER BY COALESCE(fd.fd_entry_added_ts, fd.fd_entry_modified) DESC NULLS LAST, fd.fd_key
LIMIT 200;

\echo '== BL-IMP-123: hitlijst rows with ambiguous file_details candidates for their selected version =='
WITH h AS (
  SELECT
    hl.hl_hitlijst,
    hl.hl_uitzendjaar,
    hl.hl_positie,
    hl.ar_artist_key,
    hl.fd_tag_title,
    hl.fd_key,
    hl.hl_samenstel_fd_key,
    hl.hl_samenstel_status,
    lower(regexp_replace(replace(btrim(COALESCE(hl.fd_tag_title::text, '')), chr(160), ' '), '\s+', ' ', 'g')) AS title_norm
  FROM public.hitlijsten hl
), candidates AS (
  SELECT
    h.hl_hitlijst,
    h.hl_uitzendjaar,
    h.hl_positie,
    h.fd_key,
    h.hl_samenstel_fd_key,
    h.hl_samenstel_status,
    COUNT(fd.fd_key) AS candidate_count,
    ARRAY_AGG(fd.fd_key ORDER BY fd.fd_key) AS candidate_fd_keys
  FROM h
  JOIN bl_imp_123_fd_normalized fd
    ON fd.fd_artist_key IS NOT DISTINCT FROM h.ar_artist_key
   AND fd.title_norm = h.title_norm
  GROUP BY h.hl_hitlijst, h.hl_uitzendjaar, h.hl_positie, h.fd_key, h.hl_samenstel_fd_key, h.hl_samenstel_status
  HAVING COUNT(fd.fd_key) > 1
)
SELECT *
FROM candidates
ORDER BY candidate_count DESC, hl_hitlijst, hl_uitzendjaar, hl_positie
LIMIT 200;

\echo '== BL-IMP-123: baseline count for before/after export check =='
SELECT
  now() AS measured_at,
  COUNT(*) AS file_details_count,
  MAX(fd_key) AS max_fd_key,
  MAX(fd_entry_added_ts) AS max_entry_added_ts,
  MAX(fd_entry_modified) AS max_entry_modified
FROM public.file_details;

\echo '== BL-IMP-123: done =='
