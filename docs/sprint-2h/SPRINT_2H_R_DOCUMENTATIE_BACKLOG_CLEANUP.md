# Sprint 2H-R — Documentatie/backlog cleanup

## Backlog-item

```text
BL-IMP-090 — Documentatie consolidatie en backlog cleanup
```

## Doel

De backlog en hoofddocumentatie waren historisch gegroeid en bevatten dubbele of ingehaalde items. Deze sprint maakt de actuele status weer eenduidig zonder functionele applicatielogica te wijzigen.

## Functionele scope

- Actieve backlog opschonen naar alleen nog relevante open items.
- Historische backlog bewaren als archief.
- Gesloten 2H-sprints expliciet markeren.
- Oude open/proposed items die door latere sprints zijn ingehaald herclassificeren als historisch/geparkeerd.
- Laatste sprint, baseline, testplan, technische documentatie en release notes actualiseren.

## Buiten scope

- Geen wijziging in importlogica.
- Geen wijziging in export naar `hitlijsten`.
- Geen wijziging in Discogs API-logica.
- Geen wijziging in database-schema.

## Opgeleverde bestanden

```text
BACKLOG.md
docs/backlog/BACKLOG_STATUS_20260704.md
docs/backlog/BACKLOG_HISTORY_BEFORE_2H_R.md
docs/sprint-2h/SPRINT_2H_R_DOCUMENTATIE_BACKLOG_CLEANUP.md
Release Notes/RELEASE_NOTES_2H_R_DOCUMENTATIE_BACKLOG_CLEANUP.md
```

Daarnaast zijn de hoofd-documenten bijgewerkt:

```text
Readme.md
BASELINE.md
FUNCTIONAL_SPEC.md
TECHNICAL_SPEC.md
TEST_PLAN.md
TESTING_NOTES.md
laatstesprint.md
package.json
```

## Acceptatiecriteria

- `BACKLOG.md` bevat een compacte actieve backlog.
- Historische backloginhoud is niet verloren, maar verplaatst naar `docs/backlog/BACKLOG_HISTORY_BEFORE_2H_R.md`.
- 2H-H, 2H-K en 2H-L staan gesloten.
- BL-IMP-090 staat opgeleverd via Sprint 2H-R.
- Er is een automatische documentatie/backlog-consistentietest.
- De oplever-ZIP bevat geen `node_modules`, `logs`, `__MACOSX` of `.DS_Store`.

## Testcommando

```bash
npm run test:sprint2h-r
```
