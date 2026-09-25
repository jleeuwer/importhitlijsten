-- Sprint 2H-P — Gewenste songversie per hitlijstregel vastleggen
-- Adds staging-only desired song type context with FK to existing song_types.

ALTER TABLE public.staging_hitlijsten
  ADD COLUMN IF NOT EXISTS hl_desired_song_type_key bigint;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'staging_hitlijsten_desired_song_type_fk'
  ) THEN
    ALTER TABLE public.staging_hitlijsten
      ADD CONSTRAINT staging_hitlijsten_desired_song_type_fk
      FOREIGN KEY (hl_desired_song_type_key)
      REFERENCES public.song_types(st_song_type_key)
      ON UPDATE RESTRICT
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS staging_hitlijsten_desired_song_type_idx
  ON public.staging_hitlijsten (hl_desired_song_type_key);
