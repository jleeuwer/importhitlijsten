BEGIN;

CREATE TABLE IF NOT EXISTS public.import_upload_candidates (
  iuc_key bigserial PRIMARY KEY,
  iuc_upload_id uuid NOT NULL UNIQUE,
  iuc_source varchar(32) NOT NULL,
  iuc_original_file_name text NOT NULL,
  iuc_storage_file_name text,
  iuc_file_size bigint NOT NULL,
  iuc_file_sha256 char(64),
  iuc_list_fingerprint char(64),
  iuc_row_count integer,
  iuc_status varchar(32) NOT NULL,
  iuc_duplicate_type varchar(32),
  iuc_duplicate_registry_key bigint NULL REFERENCES public.import_file_registry(ifr_key) ON DELETE SET NULL,
  iuc_duplicate_override boolean NOT NULL DEFAULT false,
  iuc_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  iuc_parse_error text,
  iuc_import_error text,
  iuc_import_run_id uuid NULL REFERENCES public.import_runs(ir_run_id) ON DELETE SET NULL,
  iuc_created_at timestamptz NOT NULL DEFAULT now(),
  iuc_updated_at timestamptz NOT NULL DEFAULT now(),
  iuc_expires_at timestamptz NOT NULL,
  iuc_imported_at timestamptz,
  CONSTRAINT import_upload_candidates_source_chk
    CHECK (iuc_source IN ('DRAG_DROP', 'FILE_PICKER')),
  CONSTRAINT import_upload_candidates_status_chk
    CHECK (iuc_status IN ('NEW', 'METADATA_INCOMPLETE', 'READY', 'PARSE_ERROR', 'IMPORT_ERROR', 'IMPORTED')),
  CONSTRAINT import_upload_candidates_duplicate_type_chk
    CHECK (iuc_duplicate_type IS NULL OR iuc_duplicate_type IN ('EXACT_FILE', 'SAME_LIST_CONTENT')),
  CONSTRAINT import_upload_candidates_file_hash_chk
    CHECK (iuc_file_sha256 IS NULL OR iuc_file_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT import_upload_candidates_list_fp_chk
    CHECK (iuc_list_fingerprint IS NULL OR iuc_list_fingerprint ~ '^[0-9a-f]{64}$'),
  CONSTRAINT import_upload_candidates_size_chk
    CHECK (iuc_file_size >= 0),
  CONSTRAINT import_upload_candidates_imported_chk CHECK (
    iuc_status <> 'IMPORTED'
    OR (iuc_imported_at IS NOT NULL AND iuc_import_run_id IS NOT NULL AND iuc_storage_file_name IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_import_upload_candidates_status
  ON public.import_upload_candidates (iuc_status);

CREATE INDEX IF NOT EXISTS idx_import_upload_candidates_expires_at
  ON public.import_upload_candidates (iuc_expires_at);

CREATE INDEX IF NOT EXISTS idx_import_upload_candidates_file_sha256
  ON public.import_upload_candidates (iuc_file_sha256)
  WHERE iuc_file_sha256 IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_import_upload_candidates_list_fingerprint
  ON public.import_upload_candidates (iuc_list_fingerprint)
  WHERE iuc_list_fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_import_upload_candidates_created_at
  ON public.import_upload_candidates (iuc_created_at DESC);

COMMENT ON TABLE public.import_upload_candidates IS
  '2H-AA persistente tijdelijke drag-and-drop/file-picker kandidaten voor CSV-import.';
COMMENT ON COLUMN public.import_upload_candidates.iuc_metadata IS
  'Kandidaatgebonden conceptmetadata, o.a. hl_hitlijst, hl_uitzendjaar, omroep_key en periode_key.';
COMMENT ON COLUMN public.import_upload_candidates.iuc_storage_file_name IS
  'Alleen server-generated bestandsnaam binnen uploads/import-candidates; nooit clientpad.';
COMMENT ON COLUMN public.import_upload_candidates.iuc_expires_at IS
  'Retentiegrens; standaard 7 dagen na upload en daarna cleanup door de applicatie.';

COMMIT;
