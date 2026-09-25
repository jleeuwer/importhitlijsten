# Backlogstatus 2026-07-04 — na Sprint 2H-S

## Samenvatting

Sprint **2H-S** werkt **BL-IMP-118 — Pattern discovery keep/remove classification voor haakjespatronen** functioneel en technisch uit. Deze sprint is nu doorgetrokken naar concrete code: migratie, backend, UI, testcases en automatische testscripts zijn toegevoegd.

## Belangrijke statusbesluiten

- **BL-IMP-111 — Pattern discovery helper voor String Patterns**: gesloten / akkoord.
- **BL-IMP-118 — Pattern discovery false positives bij haakjesinhoud voorkomen**: codebouw opgeleverd; klaar voor acceptatietest.
- **BL-IMP-116 — wildcard/generieke String Patterns** blijft open, maar wordt bewust pas ná BL-IMP-118 aanbevolen.

## Actieve open backlog

| ID | Titel | Status | Prioriteit | Advies |
|---|---|---|---|---|
| BL-IMP-118 | Pattern discovery: keep/remove classification voor haakjespatronen | Codebouw opgeleverd; klaar voor acceptatietest | P1 | Eerst acceptatietesten vóór wildcard/generieke patterns |
| BL-IMP-116 | String Patterns uitbreiden met generieke/wildcard patternregels | Open | P1 | Oppakken na BL-IMP-118 |
| BL-IMP-115 | Edit-scherm UX verbeteren en workflowhulp compacter maken | Open | P2 | Goede UX-sprint; scherm rustiger maken |
| BL-IMP-084 | Candidate matching centraliseren | Open | P1 | Technische hardening; grotere impact |
| BL-IMP-086 | Discogs UI polish en foutafhandeling | Open | P2 | Loading/empty/error/rate-limit states verbeteren |
| BL-IMP-087 | E2E-testdekking verder uitbreiden | Open | P2 | Regressiedekking uitbreiden voor kernflows |
| BL-IMP-088 | Install/build/test validatie professionaliseren | Open | P2 | Validate-script, migratiecheck, schema guard |
| BL-IMP-091 | Manual repair zoeken met gescheiden artiest- en titelvelden | Open | P2 | UX-vervolg op manual repair |
| BL-IMP-092 | Omroepen-consumptie in Importhitlijst | Deels open | P3 | Onderhoud zelf zit in Coretables; tonen/selecteren/filteren blijft hier |
| BL-IMP-103 | Discogs enrichment review/promote-flow naar file_details ontwerpen | Open | P2 | Functioneel ontwerp nodig |
| BL-IMP-105 | Discogs master/release ids structureel auditen | Open | P3 | Controle/audit-item |

## Gesloten hoofdpunten 2H-lijn

- 2H-H — Discogs zoekmodal UX en enrichment-onderzoek: gesloten / akkoord.
- 2H-K — Discogs detailinspectie vanuit zoekmodal: gesloten / akkoord.
- 2H-L — Discogs UX harmonisatie: gesloten / akkoord.
- 2H-O Fix 1 — Pattern discovery helper: gesloten / akkoord.
- 2H-M Fix 1 — Exportstatus-aware workflow buttons: gesloten / akkoord.
- 2H-N — Button workflow en prerequisites: gesloten / akkoord.
- 2H-P Fix 1 — Gewenste versie behouden na Discogs-flow: gesloten / akkoord.
- 2H-Q — Blocked Discogs export groeperen per gewenste versie: opgeleverd; te sluiten na acceptatietest.
- 2H-R — Documentatie/backlog cleanup: opgeleverd.

## Documentatiebronnen

- `BACKLOG.md` is de actieve backlog.
- `docs/backlog/BACKLOG_HISTORY_BEFORE_2H_R.md` bewaart de oude backlogtekst.
- `docs/sprint-2h/SPRINT_2H_S_PATTERN_KEEP_REMOVE_CLASSIFICATION.md` beschrijft de nieuwe sprint.
