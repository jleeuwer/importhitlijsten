-- 2026-09-17 — Sprint 2H-Y Hotfix 4
-- Multiple file_details candidates toestaan bij export naar hitlijsten.
--
-- Er is geen schemawijziging nodig. Deze release wijzigt applicatielogica:
-- - export valideert artiest + titel bestaan in file_details, ongeacht song_type/versie;
-- - meerdere file_details-kandidaten zijn non-blocking waarschuwingen;
-- - definitieve song_type/variantkeuze blijft verantwoordelijkheid van samenstelling.

BEGIN;

COMMENT ON COLUMN public.staging_hitlijsten.hl_desired_song_type_key IS
  'Gewenste versie/song_type metadata vanuit Importhitlijst. Vanaf 2H-Y Hotfix 4 geen export-blocker; samenstelling gebruikt deze waarde later voor prioriteit/variantkeuze.';

COMMENT ON COLUMN public.hitlijsten.fd_key IS
  'Technische file_details referentie die bij export deterministisch wordt gevuld omdat fd_key NOT NULL is. Bij meerdere varianten is dit geen definitieve samenstelkeuze; samenstelling bepaalt hl_samenstel_fd_key op basis van song_type-prioriteit.';

COMMIT;
