-- Sprint 2H-X — Edit-scherm tabel polish
-- Geen database-migratie nodig.
--
-- Reden:
-- - BL-IMP-121 maakt bestaande Discogs-kolommen zichtbaar/klikbaar in de frontend.
-- - BL-IMP-122 verwijdert hl_artist_key alleen uit de zichtbare tabelkolom.
-- - Er worden geen tabellen, kolommen, indexes, constraints of datawaarden gewijzigd.
--
-- Dit bestand is bewust aanwezig als no-op marker voor Docker/PostgreSQL releasebeheer.
SELECT 'Sprint 2H-X: no database migration required' AS sprint_2h_x_migration_status;
