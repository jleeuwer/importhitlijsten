-- Sprint 2G-D / BL-IMP-075 duplicate import prevention.
-- Adds staging fields needed to detect duplicate physical filenames and to skip duplicate rows.

ALTER TABLE public.staging_hitlijsten
  ADD COLUMN IF NOT EXISTS fd_file_name text,
  ADD COLUMN IF NOT EXISTS fd_action text;

CREATE INDEX IF NOT EXISTS idx_staging_hitlijsten_run_fd_file_name
  ON public.staging_hitlijsten (hl_import_run_id, lower(regexp_replace(replace(btrim(coalesce(fd_file_name::text, '')), chr(92), '/'), '\s+', ' ', 'g')))
  WHERE btrim(coalesce(fd_file_name::text, '')) <> '';

CREATE INDEX IF NOT EXISTS idx_staging_hitlijsten_run_fd_action
  ON public.staging_hitlijsten (hl_import_run_id, lower(btrim(coalesce(fd_action::text, ''))));

CREATE INDEX IF NOT EXISTS idx_file_details_normalized_fd_file_name_active
  ON public.file_details (lower(regexp_replace(replace(btrim(coalesce(fd_file_name::text, '')), chr(92), '/'), '\s+', ' ', 'g')))
  WHERE btrim(coalesce(fd_file_name::text, '')) <> ''
    AND lower(btrim(coalesce(fd_action::text, 'Keep'))) <> 'delete';
