-- Sprint hotfix: performance indexes for export status validation and export joins.
-- Safe to run multiple times.

CREATE INDEX IF NOT EXISTS idx_staging_hitlijsten_run_pos
  ON public.staging_hitlijsten (hl_import_run_id, hl_positie);

CREATE INDEX IF NOT EXISTS idx_staging_hitlijsten_run_artist
  ON public.staging_hitlijsten (hl_import_run_id, hl_artist_key);

CREATE INDEX IF NOT EXISTS idx_file_details_artist_key
  ON public.file_details (fd_artist_key);

CREATE INDEX IF NOT EXISTS idx_file_details_norm_title
  ON public.file_details (
    lower(
      regexp_replace(
        replace(btrim(coalesce(fd_tag_title::text, '')), chr(160), ' '),
        '\s+',
        ' ',
        'g'
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_file_details_norm_title_artist
  ON public.file_details (
    lower(
      regexp_replace(
        replace(btrim(coalesce(fd_tag_title::text, '')), chr(160), ' '),
        '\s+',
        ' ',
        'g'
      )
    ),
    fd_artist_key
  );
