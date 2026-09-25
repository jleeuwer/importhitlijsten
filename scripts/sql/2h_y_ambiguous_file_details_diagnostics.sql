-- Sprint 2H-Y diagnostic: export-blocking ambiguous file_details candidates.
-- Usage example:
-- docker exec -i my-postgresdb psql -U postgres -d musicdb -v run_id='<uuid>' < scripts/sql/2h_y_ambiguous_file_details_diagnostics.sql

WITH staging AS (
  SELECT
    s.hl_import_run_id,
    s.hl_positie,
    s.hl_artiest,
    s.hl_titel_song,
    s.fd_tag_title,
    s.hl_artist_key,
    s.hl_desired_song_type_key,
    lower(regexp_replace(replace(btrim(coalesce(s.fd_tag_title::text, '')), chr(160), ' '), '\s+', ' ', 'g')) AS normalized_fd_tag_title
  FROM public.staging_hitlijsten s
  WHERE s.hl_import_run_id = :'run_id'::uuid
    AND lower(btrim(coalesce(s.fd_action::text, ''))) <> 'skip'
), candidates AS (
  SELECT
    s.*,
    fd.fd_key,
    fd.fd_correct_artist,
    fd.fd_file_name,
    fd.fd_song_type_key,
    fd.fd_year_song_version
  FROM staging s
  JOIN public.file_details fd
    ON lower(regexp_replace(replace(btrim(coalesce(fd.fd_tag_title::text, '')), chr(160), ' '), '\s+', ' ', 'g')) = s.normalized_fd_tag_title
   AND fd.fd_artist_key = s.hl_artist_key
   AND (s.hl_desired_song_type_key IS NULL OR fd.fd_song_type_key = s.hl_desired_song_type_key)
   AND lower(btrim(coalesce(fd.fd_action::text, 'Keep'))) NOT IN ('delete', 'duplicates', 'skip')
)
SELECT
  hl_positie,
  hl_artiest,
  hl_titel_song,
  fd_tag_title,
  hl_artist_key,
  hl_desired_song_type_key,
  COUNT(*)::int AS candidate_count,
  array_agg(fd_key ORDER BY fd_key) AS candidate_fd_keys,
  array_agg(fd_file_name ORDER BY fd_key) AS candidate_file_names
FROM candidates
GROUP BY hl_positie, hl_artiest, hl_titel_song, fd_tag_title, hl_artist_key, hl_desired_song_type_key
HAVING COUNT(*) > 1
ORDER BY hl_positie;
