# Changelog

## 1.2.0 — 2H-AA — feature — 2026-09-27
- BL-IMP-135 requirements interactief vastgesteld.
- Drag-and-drop en klikbare multi-file CSV-selectie naast bestaande directory-scan.
- Maximaal 50 bestanden per batch en 25 MB per CSV.
- Per bestand onafhankelijke conceptmetadata met refresh-persistentie.
- Bestaande SHA-256/list-fingerprint duplicatecontrole en expliciete override hergebruiken.
- Individuele én foutgeïsoleerde bulkimport van alle gereedstaande kandidaten.
- Tijdelijke bewaartermijn 7 dagen, individuele/bulk-cleanup en serverstart-cleanup.
- PostgreSQL `import_upload_candidates` en veilige tempopslag geïmplementeerd.
- Nieuwe kandidaat-API voor upload, metadata, duplicate override, individuele/bulkimport en cleanup.
- Idempotente Docker/PostgreSQL migratie en `db:migrate:sprint2h-aa` toegevoegd.
- Geautomatiseerde service-, React- en statische sprinttests toegevoegd.
- Documentatiesprint en toekomstige codesprint gebruiken beide versie 1.2.0.

### 2H-AA Hotfix 1 — test stability — 2026-09-27
- Corrigeert 5 failures uit de volledige `test:all` run zonder functionele rollback.
- Historische 2H-Z versieassertion niet langer hardcoded op 1.1.0.
- Directory-scanlabel expliciet gekoppeld aan het invoerveld.
- Drag-and-drop focusregressietest gescoped op kandidaatmetadata.
- Zware Edit-pagineringtests krijgen lokaal 10s timeout.
- Geen databasewijziging; applicatieversie blijft 1.2.0.

### 2H-AA Hotfix 2 — candidate metadata PATCH SQL typing — 2026-09-27
- Corrigeert PostgreSQL fout `inconsistent types deduced for parameter $3` bij `PATCH /api/import-candidates/:uploadId/metadata`.
- Oorzaak: placeholder `$3` werd in dezelfde prepared statement zowel als `varchar`-kolomtoewijzing als ongetypeerde tekstvergelijking gebruikt.
- `iuc_status` en de `READY`-vergelijking gebruiken nu expliciet `varchar(32)`.
- Regressietests toegevoegd voor model-SQL en statische queryguard.
- Geen databasewijziging; applicatie- en documentatieversie blijven 1.2.0.

## 1.1.0 — 2026-09-25
- Buildcorrectie: ontbrekende sluitende `}` in de dynamische `className` JSX-expressie van `ImportPage.jsx` hersteld; regressietest toegevoegd.
- BL-IMP-134: CSV import registry en import-inbox.
- BL-IMP-119: exacte duplicate list detection via canonical content fingerprint.
- Nieuwe PostgreSQL migratie `20260925_sprint2h_z_csv_import_registry.sql`.
- Import bootstrap gebruikt `npm ci` om lockfile drift te voorkomen.

## 1.1.0 — 2H-Z Hotfix 1
- CSV import-inbox paginering toegevoegd (25/50/100).
- Recente scandirectories lokaal onthouden en direct heropenbaar gemaakt.
- Focus na selectie van een scanbestand naar `Hitlijst name` verplaatst.
- Toggle `Toon ook geïmporteerd` filtert nu direct de geladen scanresultaten zonder rescan.
- BL-IMP-135 toegevoegd voor toekomstige drag-and-drop CSV-selectie.

## 1.1.0 — 2H-Z Hotfix 2
- BL-IMP-136 toegevoegd: post-import duplicate row review op genormaliseerde artiest + titel, onafhankelijk van positie.
- Reviewmodal met voorgestelde bewaarrij en selecteerbare duplicate-regels.
- Geselecteerde duplicate-regels kunnen op `Skip` worden gezet of na expliciete bevestiging fysiek uit staging worden verwijderd.
- Fysieke deletes worden vooraf vastgelegd in `staging_hitlijsten_delete_audit` met reden `DUPLICATE_CONFIRMED`.
- `staging_hitlijsten.sh_key` toegevoegd voor veilige individuele rijselectie, ook wanneer posities dubbel voorkomen.
- `import_runs.ir_row_count` wordt na fysieke delete opnieuw gesynchroniseerd.
- `startapp.sh test` start nu `npm run test:all` in plaats van alleen Playwright E2E.
- `validate-all.sh` vereenvoudigd naar één reproduceerbare install/build/test-all keten.

## 1.1.0 — 2H-Z Hotfix 3
- Alle 13 legacy `node:test` suites geconverteerd naar Vitest; niet-DOM suites draaien expliciet in de Node test environment.
- Historische sprint-testcommando's en package-fragmenten geharmoniseerd op Vitest.
- 2H-W release-hygienetest controleert package-metadata in plaats van runtime `node_modules`/`logs`.
- Documentatietests losgekoppeld van mutable `laatstesprint.md`-inhoud.
- Edit-pagineringtests bijgewerkt op de actuele pagina-controls en stabiele aria-labels.
- Import-inbox en duplicate-review tests row-scoped gemaakt voor bewust dubbele zichtbare teksten.
- Runs View/Edit/blocked-export acties zijn semantisch echte hyperlinks.
- Discogs timeout/cache configuratie valt veilig terug bij ongeldige of niet-positieve waarden.
- Dubbele `openPatternSuggestions` testfixture-key verwijderd en async DB-status React-tests correct afgewacht.
- PostgreSQL defaults/actuele documentatie geharmoniseerd op `musicdb`.
- Geen nieuwe database-migratie in Hotfix 3.

## 1.1.0 — 2H-Z Hotfix 4 — 2026-09-27
- Corrigeert de twee resterende Edit-paginering test failures uit HF3.
- Tests accepteren bewust meervoudig gerenderde artiesttekst zonder de UI te verzwakken.
- Voegt gerichte HF4 regressietest en npm-script toe.
- Geen nieuwe database-migratie.
