-- Sprint 2H-V — Preview repair for exported runs still marked as attention required.
-- Read-only preview.

\set ON_ERROR_STOP on

WITH issue_counts AS (
  SELECT
    ir_run_id,
    COUNT(*) FILTER (WHERE warning_active AND warning_blocking) AS blocking_issue_count,
    COUNT(*) FILTER (WHERE warning_active AND NOT warning_blocking AND warning_severity = 'warning') AS warning_count
  FROM public.import_run_warning_state
  GROUP BY ir_run_id
), candidates AS (
  SELECT
    ir.ir_run_id,
    ir.ir_hitlijst,
    ir.ir_uitzendjaar,
    ir.ir_status AS current_ir_status,
    ir.ir_export_status AS current_ir_export_status,
    COALESCE(ic.warning_count, ir.ir_warning_count, 0) AS warning_count,
    COALESCE(ic.blocking_issue_count, ir.ir_blocking_issue_count, 0) AS blocking_issue_count,
    CASE
      WHEN COALESCE(ic.blocking_issue_count, ir.ir_blocking_issue_count, 0) > 0 THEN 'SKIP_BLOCKING_ISSUES'
      WHEN UPPER(ir.ir_status) NOT IN ('AANDACHT_NODIG', 'ATTENTION_REQUIRED', 'NEEDS_ATTENTION') THEN 'SKIP_STATUS_NOT_ATTENTION_REQUIRED'
      WHEN ir.ir_export_status NOT IN ('EXPORTED', 'EXPORTED_WITH_WARNINGS') THEN 'SKIP_NOT_EXPORTED'
      WHEN COALESCE(ic.warning_count, ir.ir_warning_count, 0) > 0 THEN 'REPAIR_TO_EXPORTED_WITH_WARNINGS'
      ELSE 'REPAIR_TO_EXPORTED'
    END AS repair_decision,
    CASE
      WHEN COALESCE(ic.warning_count, ir.ir_warning_count, 0) > 0 THEN 'GEEXPORTEERD_MET_WAARSCHUWINGEN'
      ELSE 'GEEXPORTEERD'
    END AS proposed_ir_status,
    CASE
      WHEN COALESCE(ic.warning_count, ir.ir_warning_count, 0) > 0 THEN 'EXPORTED_WITH_WARNINGS'
      ELSE 'EXPORTED'
    END AS proposed_ir_export_status
  FROM public.import_runs ir
  LEFT JOIN issue_counts ic ON ic.ir_run_id = ir.ir_run_id
)
SELECT *
FROM candidates
WHERE repair_decision LIKE 'REPAIR_%'
ORDER BY ir_hitlijst, ir_uitzendjaar, ir_run_id;
