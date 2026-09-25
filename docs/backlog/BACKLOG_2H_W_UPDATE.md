# Backlog update — 2H-W Build/startapp hardening

## Nieuwe sprintvoorstel

**Sprint 2H-W — Install/build/test en startapp hardening**

## Items in scope

| ID | Titel | Status |
|---|---|---|
| BL-IMP-088 | Install/build/test validatie professionaliseren | Open, uitwerken naar code |
| BL-IMP-132 | `startapp.sh` gelijk trekken met robuuste Artist-opzet | Open, deels voorbereid |

## Relatie tot eerdere bevindingen

- Vite/build-resolving gaf lokale fouten ondanks aanwezige dependency.
- Clean reinstall kon geblokkeerd worden door actieve processen op `node_modules`.
- De eerste startapp-aanpassing was niet commandogestuurd genoeg.
- De robuuste variant is later wel gemaakt, maar onder de naam `startapp_importhitlijst_robust.sh`.
- Afspraak: toekomstige oplevering gebruikt standaard de naam `startapp.sh`.

## Prioriteit

Hoog vóór verdere codebouw, omdat betrouwbare build/test/start tooling nodig is om nieuwe sprints veilig te accepteren.
