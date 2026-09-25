-- Sprint 2H-I — Correcties na export
-- Adds audit storage and match-performance indexes for post-export artist/title corrections.

CREATE TABLE IF NOT EXISTS public.importhitlijst_corrections_audit (
  correction_id bigserial PRIMARY KEY,
  run_id uuid NOT NULL,
  hl_positie integer NOT NULL,
  hl_hitlijst citext,
  hl_uitzendjaar integer,
  omroep_key integer,
  periode_key integer,
  correction_type text NOT NULL,
  old_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  hitlijsten_records_updated integer NOT NULL DEFAULT 0,
  is_composed boolean NOT NULL DEFAULT false,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_importhitlijst_corrections_audit_run_pos
  ON public.importhitlijst_corrections_audit (run_id, hl_positie, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hitlijsten_post_export_correction_match
  ON public.hitlijsten (hl_hitlijst, hl_uitzendjaar, hl_positie, omroep_key, periode_key);

CREATE INDEX IF NOT EXISTS idx_staging_hitlijsten_post_export_correction_match
  ON public.staging_hitlijsten (hl_import_run_id, hl_positie, hl_hitlijst, hl_uitzendjaar, omroep_key, periode_key);
