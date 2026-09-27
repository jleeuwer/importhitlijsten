BEGIN;

CREATE TABLE IF NOT EXISTS public.import_file_registry (
  ifr_key bigserial PRIMARY KEY,
  ifr_file_name text NOT NULL,
  ifr_last_seen_directory text,
  ifr_file_size bigint,
  ifr_file_modified_at timestamptz,
  ifr_file_sha256 char(64) NOT NULL,
  ifr_list_fingerprint char(64) NOT NULL,
  ifr_status text NOT NULL,
  ifr_import_run_id uuid NULL REFERENCES public.import_runs(ir_run_id) ON DELETE SET NULL,
  ifr_duplicate_override boolean NOT NULL DEFAULT false,
  ifr_duplicate_of_registry_key bigint NULL REFERENCES public.import_file_registry(ifr_key) ON DELETE SET NULL,
  ifr_imported_at timestamptz,
  ifr_manually_marked_at timestamptz,
  ifr_created_at timestamptz NOT NULL DEFAULT now(),
  ifr_updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT import_file_registry_status_chk
    CHECK (ifr_status IN ('IMPORTED', 'MANUALLY_MARKED_IMPORTED')),
  CONSTRAINT import_file_registry_hash_chk
    CHECK (ifr_file_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT import_file_registry_fingerprint_chk
    CHECK (ifr_list_fingerprint ~ '^[0-9a-f]{64}$'),
  CONSTRAINT import_file_registry_status_dates_chk CHECK (
    (ifr_status = 'IMPORTED' AND ifr_imported_at IS NOT NULL)
    OR
    (ifr_status = 'MANUALLY_MARKED_IMPORTED' AND ifr_manually_marked_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_import_file_registry_file_sha256
  ON public.import_file_registry (ifr_file_sha256);

CREATE INDEX IF NOT EXISTS idx_import_file_registry_list_fingerprint
  ON public.import_file_registry (ifr_list_fingerprint);

CREATE INDEX IF NOT EXISTS idx_import_file_registry_run_id
  ON public.import_file_registry (ifr_import_run_id)
  WHERE ifr_import_run_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_import_file_registry_status_created
  ON public.import_file_registry (ifr_status, ifr_created_at DESC);

COMMENT ON TABLE public.import_file_registry IS
  '2H-Z registry van succesvol geïmporteerde of handmatig als geïmporteerd gemarkeerde CSV-bestanden.';
COMMENT ON COLUMN public.import_file_registry.ifr_file_sha256 IS
  'SHA-256 van fysieke CSV bytes; detecteert exact hetzelfde bestand.';
COMMENT ON COLUMN public.import_file_registry.ifr_list_fingerprint IS
  'SHA-256 van canonieke positie|artiest|titel regels; detecteert dezelfde lijstinhoud onder andere bestandsnaam.';
COMMENT ON COLUMN public.import_file_registry.ifr_last_seen_directory IS
  'Informatief laatst bekend directorypad; geen onderdeel van bestandsidentiteit.';
COMMENT ON COLUMN public.import_file_registry.ifr_duplicate_override IS
  'True wanneer gebruiker bewust een exacte contentduplicate opnieuw importeerde.';

COMMIT;
