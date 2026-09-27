# Backlogstatus 2026-09-27 — na 2H-Z Hotfix 3

## Actuele releasecandidate

**Import Hitlijsten v1.1.0 — 2H-Z Hotfix 3** is opgeleverd voor acceptatietest.

In acceptatie:
- BL-IMP-119 Exacte duplicate list detection;
- BL-IMP-134 CSV-importbestand lifecycle;
- BL-IMP-136 Post-import duplicate row review/fysieke staging-delete;
- HF3 test-suite hardening.

Open vervolg:
- BL-IMP-135 Drag-and-drop CSV-import;
- BL-IMP-120 similarity/fuzzy duplicate list detection;
- overige actieve items staan in `BACKLOG.md`.

## Testbevinding 27-09-2026

De volledige `test:all` run telde 196 Vitest-testcases in de aangeleverde log, waarvan 189 slaagden en 7 faalden; daarnaast werden 13 legacy `node:test` bestanden als `No test suite found` gemarkeerd. HF3 richt zich op deze testinfrastructuur en verouderde assertions zonder de 2H-Z businesslogica terug te draaien.

## PostgreSQL

Standaard database: `musicdb`.  
Standaard container: `my-postgresdb`.
