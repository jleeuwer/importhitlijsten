-- Sprint 2H-Y — Matching, Discogs lifecycle & status hardening
-- Safe to run multiple times. No destructive data changes.
-- Target: PostgreSQL in Docker container.
--
-- 2H-Y primarily changes application logic:
-- - ambiguous file_details candidates are export-blocking;
-- - matching can be narrowed by hl_desired_song_type_key;
-- - safe raw hl_discogs_link values are exported as structured hitlijst metadata fallback;
-- - encoding/status repair hardening reuses 2H-V status/warning tables.
--
-- This migration therefore only adds comments and a no-op release marker.

BEGIN;

COMMENT ON COLUMN public.staging_hitlijsten.hl_desired_song_type_key IS
  '2H-Y: used to narrow file_details matching when multiple variants exist for the same artist/title.';

COMMENT ON COLUMN public.staging_hitlijsten.hl_discogs_link IS
  '2H-Y: legacy/raw Discogs link. Safe HTTPS Discogs master/release links may be exported as structured hitlijst Discogs URL fallback; never auto-promoted to file_details.fd_discogs.';

COMMENT ON COLUMN public.hitlijsten.discogs_master_url IS
  '2H-Y: structured Discogs master URL stored as hitlijst metadata. It is not an automatic update to file_details.fd_discogs.';

COMMENT ON COLUMN public.hitlijsten.discogs_release_url IS
  '2H-Y: structured Discogs release URL stored as hitlijst metadata. It is not an automatic update to file_details.fd_discogs.';

CREATE TABLE IF NOT EXISTS public.importhitlijst_release_markers (
  marker_key text PRIMARY KEY,
  marker_value text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  applied_by text NOT NULL DEFAULT current_user
);

INSERT INTO public.importhitlijst_release_markers (marker_key, marker_value)
VALUES ('sprint_2h_y_matching_discogs_status_hardening', 'applied')
ON CONFLICT (marker_key)
DO UPDATE SET marker_value = EXCLUDED.marker_value, applied_at = now(), applied_by = current_user;

COMMIT;
