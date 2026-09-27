# Sprint 2H-Z Hotfix 3 — Test Suite Hardening

**Versie:** 1.1.0  
**Datum:** 2026-09-27  
**Status:** codebouw voor acceptatietest  
**Aanleiding:** de eerste volledige `startapp.sh test`-run na Hotfix 2 voerde terecht de hele testset uit, maar bracht legacy test-runnerconflicten, verouderde assertions en enkele accessibility/warning-bevindingen aan het licht.

## Doel

De volledige testketen moet één consistente test-runner gebruiken en actuele functionaliteit testen in plaats van historische UI-teksten of eerdere sprintstatussen.

## Scope

1. Dertien legacy `node:test`-bestanden migreren naar Vitest.
2. Alle sprintgerichte npm-testcommando's eveneens op Vitest brengen.
3. Verouderde documentatie-assertions losmaken van `laatstesprint.md`.
4. Pagineringtests laten aansluiten op de huidige echte paginering in Edit.
5. Import-inbox- en duplicate-reviewtests row-scoped maken waar dezelfde zichtbare tekst bewust vaker voorkomt.
6. Navigatie-acties in Runs als echte links toegankelijk maken.
7. Ongeldige Discogs timeout/cache-config veilig terug laten vallen op defaults.
8. Duplicate object-key warning in testfixture verwijderen.
9. Asynchrone DB-statusupdates in React-tests correct afwachten.
10. PostgreSQL-documentatie en defaults uniformeren op `musicdb`.

## Buiten scope

- Geen nieuwe functionele import- of exportlogica.
- Geen nieuwe databasekolommen of tabellen.
- Geen wijziging aan duplicate-identiteit uit BL-IMP-136.
- BL-IMP-135 drag-and-drop blijft een apart backlog-item.

## Acceptatie

Hotfix 3 is functioneel akkoord wanneer `./startapp.sh test` de volledige Vitest-suite kan afwerken zonder `No test suite found`-fouten, de gerichte HF3-regressies groen zijn en daarna Playwright E2E kan starten.
