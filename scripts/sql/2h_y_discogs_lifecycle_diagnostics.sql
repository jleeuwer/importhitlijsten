-- Sprint 2H-Y diagnostic: compare staging Discogs links and exported hitlijst metadata.
-- Usage example:
-- docker exec -i my-postgresdb psql -U postgres -d musicdb -v run_id='<uuid>' < scripts/sql/2h_y_discogs_lifecycle_diagnostics.sql

SELECT
  s.hl_positie,
  s.hl_artiest,
  s.hl_titel_song,
  s.hl_discogs_link AS staging_raw_discogs_link,
  s.discogs_master_url AS staging_master_url,
  s.discogs_release_url AS staging_release_url,
  h.discogs_master_url AS hitlijst_master_url,
  h.discogs_release_url AS hitlijst_release_url,
  CASE
    WHEN h.hl_hitlijst IS NULL THEN 'NOT_EXPORTED'
    WHEN COALESCE(NULLIF(btrim(s.discogs_master_url::text), ''), NULLIF(btrim(s.discogs_release_url::text), ''), NULLIF(btrim(s.hl_discogs_link::text), '')) IS NULL THEN 'NO_STAGING_DISCOGS_LINK'
    WHEN COALESCE(NULLIF(btrim(h.discogs_master_url::text), ''), NULLIF(btrim(h.discogs_release_url::text), '')) IS NOT NULL THEN 'EXPORTED_AS_HITLIJST_METADATA'
    ELSE 'MISSING_AFTER_EXPORT'
  END AS lifecycle_status
FROM public.staging_hitlijsten s
LEFT JOIN public.hitlijsten h
  ON h.hl_hitlijst = s.hl_hitlijst
 AND h.hl_uitzendjaar = s.hl_uitzendjaar
 AND h.hl_positie = s.hl_positie
WHERE s.hl_import_run_id = :'run_id'::uuid
ORDER BY s.hl_positie;
