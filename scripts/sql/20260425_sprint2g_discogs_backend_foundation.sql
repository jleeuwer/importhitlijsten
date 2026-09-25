-- Sprint 2G-B1 — Discogs database + backend foundation
-- Adds structured Discogs master/release identifiers and URLs to staging_hitlijsten and hitlijsten.

BEGIN;

ALTER TABLE public.staging_hitlijsten
  ADD COLUMN IF NOT EXISTS discogs_master_id bigint,
  ADD COLUMN IF NOT EXISTS discogs_master_url text,
  ADD COLUMN IF NOT EXISTS discogs_master_title text,
  ADD COLUMN IF NOT EXISTS discogs_master_artist text,
  ADD COLUMN IF NOT EXISTS discogs_master_year integer,
  ADD COLUMN IF NOT EXISTS discogs_release_id bigint,
  ADD COLUMN IF NOT EXISTS discogs_release_url text,
  ADD COLUMN IF NOT EXISTS discogs_release_title text,
  ADD COLUMN IF NOT EXISTS discogs_release_format text,
  ADD COLUMN IF NOT EXISTS discogs_release_country text,
  ADD COLUMN IF NOT EXISTS discogs_release_year integer,
  ADD COLUMN IF NOT EXISTS discogs_selected_at timestamp without time zone;

ALTER TABLE public.hitlijsten
  ADD COLUMN IF NOT EXISTS discogs_master_id bigint,
  ADD COLUMN IF NOT EXISTS discogs_master_url text,
  ADD COLUMN IF NOT EXISTS discogs_master_title text,
  ADD COLUMN IF NOT EXISTS discogs_master_artist text,
  ADD COLUMN IF NOT EXISTS discogs_master_year integer,
  ADD COLUMN IF NOT EXISTS discogs_release_id bigint,
  ADD COLUMN IF NOT EXISTS discogs_release_url text,
  ADD COLUMN IF NOT EXISTS discogs_release_title text,
  ADD COLUMN IF NOT EXISTS discogs_release_format text,
  ADD COLUMN IF NOT EXISTS discogs_release_country text,
  ADD COLUMN IF NOT EXISTS discogs_release_year integer,
  ADD COLUMN IF NOT EXISTS discogs_selected_at timestamp without time zone;

CREATE INDEX IF NOT EXISTS idx_staging_hitlijsten_discogs_master_id
  ON public.staging_hitlijsten (discogs_master_id)
  WHERE discogs_master_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_staging_hitlijsten_discogs_release_id
  ON public.staging_hitlijsten (discogs_release_id)
  WHERE discogs_release_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hitlijsten_discogs_master_id
  ON public.hitlijsten (discogs_master_id)
  WHERE discogs_master_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hitlijsten_discogs_release_id
  ON public.hitlijsten (discogs_release_id)
  WHERE discogs_release_id IS NOT NULL;

COMMIT;
