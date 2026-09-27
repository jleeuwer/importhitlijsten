BEGIN;

-- BL-IMP-136 needs a stable row identity because imported CSVs can contain
-- repeated positions as well as repeated artist/title combinations.
CREATE SEQUENCE IF NOT EXISTS public.staging_hitlijsten_sh_key_seq;

ALTER TABLE public.staging_hitlijsten
  ADD COLUMN IF NOT EXISTS sh_key bigint;

ALTER SEQUENCE public.staging_hitlijsten_sh_key_seq
  OWNED BY public.staging_hitlijsten.sh_key;

ALTER TABLE public.staging_hitlijsten
  ALTER COLUMN sh_key SET DEFAULT nextval('public.staging_hitlijsten_sh_key_seq'::regclass);

UPDATE public.staging_hitlijsten
SET sh_key = nextval('public.staging_hitlijsten_sh_key_seq'::regclass)
WHERE sh_key IS NULL;

SELECT setval(
  'public.staging_hitlijsten_sh_key_seq',
  GREATEST(COALESCE((SELECT MAX(sh_key) FROM public.staging_hitlijsten), 0), 1),
  true
);

ALTER TABLE public.staging_hitlijsten
  ALTER COLUMN sh_key SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_staging_hitlijsten_sh_key
  ON public.staging_hitlijsten (sh_key);

CREATE INDEX IF NOT EXISTS idx_staging_hitlijsten_run_artist_title
  ON public.staging_hitlijsten (hl_import_run_id, lower(btrim(hl_artiest::text)), lower(btrim(hl_titel_song::text)));

CREATE TABLE IF NOT EXISTS public.staging_hitlijsten_delete_audit (
  sda_key bigserial PRIMARY KEY,
  sda_import_run_id uuid NOT NULL,
  sda_staging_key bigint NOT NULL,
  sda_hl_positie integer,
  sda_hl_artiest text,
  sda_hl_titel_song text,
  sda_fd_action text,
  sda_delete_reason varchar(64) NOT NULL DEFAULT 'DUPLICATE_CONFIRMED',
  sda_deleted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staging_hitlijsten_delete_audit_reason_chk
    CHECK (sda_delete_reason IN ('DUPLICATE_CONFIRMED'))
);

CREATE INDEX IF NOT EXISTS idx_staging_hitlijsten_delete_audit_run
  ON public.staging_hitlijsten_delete_audit (sda_import_run_id, sda_deleted_at DESC);

COMMENT ON COLUMN public.staging_hitlijsten.sh_key IS
  '2H-Z HF2 stabiele surrogate key voor individuele stagingregels, nodig voor veilige duplicate review en fysieke delete.';
COMMENT ON TABLE public.staging_hitlijsten_delete_audit IS
  'Audittrail voor fysiek verwijderde stagingregels; BL-IMP-136 bewaart de kerngegevens vóór delete.';

COMMIT;
