-- Sprint 2H-Y Hotfix 3 — Encoding warning cleanup na handmatig herstellen
-- Geen schemawijziging nodig.
-- Dit bestand is bewust aanwezig als release-/migratiemarkering voor Docker/PostgreSQL deployments.

BEGIN;

COMMENT ON SCHEMA public IS 'Importhitlijst schema; 2H-Y Hotfix 3 requires no database schema migration.';

COMMIT;
