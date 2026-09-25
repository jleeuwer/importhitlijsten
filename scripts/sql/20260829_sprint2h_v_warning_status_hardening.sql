-- Sprint 2H-V — Warning/status hardening additive migration
-- Safe to run multiple times. No destructive data changes.
-- Target: PostgreSQL in Docker container.

BEGIN;

ALTER TABLE public.import_runs
  ADD COLUMN IF NOT EXISTS ir_export_status text NOT NULL DEFAULT 'NOT_EXPORTED',
  ADD COLUMN IF NOT EXISTS ir_exported_at timestamptz,
  ADD COLUMN IF NOT EXISTS ir_warning_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ir_blocking_issue_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ir_status_updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_import_runs_ir_export_status_2h_v'
      AND conrelid = 'public.import_runs'::regclass
  ) THEN
    ALTER TABLE public.import_runs
      ADD CONSTRAINT ck_import_runs_ir_export_status_2h_v
      CHECK (ir_export_status IN ('NOT_EXPORTED', 'EXPORTED', 'EXPORTED_WITH_WARNINGS', 'EXPORT_BLOCKED'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.import_run_warning_state (
  warning_id bigserial PRIMARY KEY,
  ir_run_id uuid NOT NULL REFERENCES public.import_runs(ir_run_id) ON DELETE CASCADE,
  hl_positie integer,
  warning_code text NOT NULL,
  warning_severity text NOT NULL DEFAULT 'warning',
  warning_blocking boolean NOT NULL DEFAULT false,
  warning_message text,
  warning_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  warning_source text NOT NULL DEFAULT '2H-V',
  warning_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by text,
  CONSTRAINT ck_import_run_warning_state_severity_2h_v
    CHECK (warning_severity IN ('blocking', 'warning', 'info')),
  CONSTRAINT ck_import_run_warning_state_resolution_2h_v
    CHECK ((warning_active = true AND resolved_at IS NULL) OR (warning_active = false))
);

CREATE INDEX IF NOT EXISTS import_run_warning_state_run_active_idx
  ON public.import_run_warning_state (ir_run_id, warning_active, warning_blocking);

CREATE INDEX IF NOT EXISTS import_run_warning_state_run_position_idx
  ON public.import_run_warning_state (ir_run_id, hl_positie);

CREATE TABLE IF NOT EXISTS public.import_run_status_repair_audit (
  repair_id bigserial PRIMARY KEY,
  repair_batch_id uuid NOT NULL,
  ir_run_id uuid NOT NULL REFERENCES public.import_runs(ir_run_id) ON DELETE CASCADE,
  old_ir_status text,
  new_ir_status text NOT NULL,
  old_ir_export_status text,
  new_ir_export_status text NOT NULL,
  warning_count integer NOT NULL DEFAULT 0,
  blocking_issue_count integer NOT NULL DEFAULT 0,
  repair_reason text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  applied_by text NOT NULL DEFAULT current_user
);

CREATE INDEX IF NOT EXISTS import_run_status_repair_audit_run_idx
  ON public.import_run_status_repair_audit (ir_run_id, applied_at DESC);

COMMENT ON COLUMN public.import_runs.ir_export_status IS '2H-V: export lifecycle status independent from active attention/warning view status.';
COMMENT ON COLUMN public.import_runs.ir_exported_at IS '2H-V: timestamp of successful export when known.';
COMMENT ON COLUMN public.import_runs.ir_warning_count IS '2H-V: denormalized current non-blocking warning count for run-level status derivation.';
COMMENT ON COLUMN public.import_runs.ir_blocking_issue_count IS '2H-V: denormalized current blocking issue count for run-level status derivation.';
COMMENT ON TABLE public.import_run_warning_state IS '2H-V: active/resolved warning state per import run and optional hitlijst position.';
COMMENT ON TABLE public.import_run_status_repair_audit IS '2H-V: audit trail for repair of already exported runs stuck in attention-needed status.';

COMMIT;
