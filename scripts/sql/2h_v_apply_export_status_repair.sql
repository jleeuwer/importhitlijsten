-- Sprint 2H-V — Apply repair for exported runs still marked as attention required.
-- Uses the same candidate rules as the preview. Safe and idempotent.

\set ON_ERROR_STOP on

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH repair_batch AS (
  SELECT gen_random_uuid() AS batch_id
), issue_counts AS (
  SELECT
    ir_run_id,
    COUNT(*) FILTER (WHERE warning_active AND warning_blocking) AS blocking_issue_count,
    COUNT(*) FILTER (WHERE warning_active AND NOT warning_blocking AND warning_severity = 'warning') AS warning_count
  FROM public.import_run_warning_state
  GROUP BY ir_run_id
), candidates AS (
  SELECT
    ir.ir_run_id,
    ir.ir_status AS old_ir_status,
    ir.ir_export_status AS old_ir_export_status,
    COALESCE(ic.warning_count, ir.ir_warning_count, 0) AS warning_count,
    COALESCE(ic.blocking_issue_count, ir.ir_blocking_issue_count, 0) AS blocking_issue_count,
    CASE
      WHEN COALESCE(ic.warning_count, ir.ir_warning_count, 0) > 0 THEN 'GEEXPORTEERD_MET_WAARSCHUWINGEN'
      ELSE 'GEEXPORTEERD'
    END AS new_ir_status,
    CASE
      WHEN COALESCE(ic.warning_count, ir.ir_warning_count, 0) > 0 THEN 'EXPORTED_WITH_WARNINGS'
      ELSE 'EXPORTED'
    END AS new_ir_export_status
  FROM public.import_runs ir
  LEFT JOIN issue_counts ic ON ic.ir_run_id = ir.ir_run_id
  WHERE ir.ir_export_status IN ('EXPORTED', 'EXPORTED_WITH_WARNINGS')
    AND UPPER(ir.ir_status) IN ('AANDACHT_NODIG', 'ATTENTION_REQUIRED', 'NEEDS_ATTENTION')
    AND COALESCE(ic.blocking_issue_count, ir.ir_blocking_issue_count, 0) = 0
), updated AS (
  UPDATE public.import_runs ir
  SET
    ir_status = c.new_ir_status,
    ir_export_status = c.new_ir_export_status,
    ir_warning_count = c.warning_count,
    ir_blocking_issue_count = c.blocking_issue_count,
    ir_status_updated_at = now()
  FROM candidates c
  WHERE ir.ir_run_id = c.ir_run_id
  RETURNING
    ir.ir_run_id,
    c.old_ir_status,
    ir.ir_status AS new_ir_status,
    c.old_ir_export_status,
    ir.ir_export_status AS new_ir_export_status,
    c.warning_count,
    c.blocking_issue_count
), audit AS (
  INSERT INTO public.import_run_status_repair_audit (
    repair_batch_id,
    ir_run_id,
    old_ir_status,
    new_ir_status,
    old_ir_export_status,
    new_ir_export_status,
    warning_count,
    blocking_issue_count,
    repair_reason
  )
  SELECT
    rb.batch_id,
    u.ir_run_id,
    u.old_ir_status,
    u.new_ir_status,
    u.old_ir_export_status,
    u.new_ir_export_status,
    u.warning_count,
    u.blocking_issue_count,
    '2H-V repair exported attention-needed status'
  FROM updated u
  CROSS JOIN repair_batch rb
  RETURNING *
)
SELECT COUNT(*) AS repaired_runs
FROM audit;

COMMIT;
