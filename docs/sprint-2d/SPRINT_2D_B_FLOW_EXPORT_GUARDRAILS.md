# Sprint 2D-B — Flow en exportguardrails

## Doel
Sprint 2D-B maakt de import/exportflow veiliger en eenvoudiger voordat verdere verrijkingen zoals Discogs worden gebouwd.

## Functionele wijzigingen

### 1. Export naar hitlijsten maar één keer
De applicatie bepaalt voor een import-run het exportdoel via `hl_hitlijst` + `hl_uitzendjaar` uit `staging_hitlijsten`.

Als in `hitlijsten` al records bestaan voor dezelfde combinatie, wordt export geblokkeerd.

Dit geldt zowel voor:
- de exportstatus/precheck in de Edit-pagina;
- de daadwerkelijke backend-export via `/api/run-export-hitlijsten`.

De foutmelding bevat:
- hitlijst;
- uitzendjaar;
- aantal bestaande definitieve records.

### 2. Home filteren op hitlijst en uitzendjaar
Home toont aparte filters voor:
- hitlijst;
- uitzendjaar;
- quick filter voor overige velden.

Zo kan de gebruiker sneller de juiste import-run vinden.

### 3. Edit in run-context
De normale flow is:

```text
Home -> kies run -> Edit?runId=<runId>
```

Als Edit met een `runId` wordt geopend, ligt de focus op controleren en corrigeren van die run. De oude runselectie blijft alleen als fallback beschikbaar wanneer Edit direct zonder `runId` wordt geopend.

## Technische wijzigingen

### Backend
Aangepast:
- `models/hitlijsten.js`

Nieuwe interne checks:
- exportdoel bepalen per run;
- bestaande definitieve records tellen voor `hl_hitlijst` + `hl_uitzendjaar`;
- duplicate export blokkeren met reason `HITLIJST_YEAR_ALREADY_EXPORTED`.

### Frontend
Aangepast:
- `src/ui/pages/StagingResults.jsx`
- `src/ui/pages/EditPage.jsx`

### Tests
Aangepast/toegevoegd:
- `tests/models/exportHitlijsten.test.js`
- `tests/react/StagingResultsFilters.test.jsx`

Nieuw npm-script:

```bash
npm run test:sprint2d-b
```

## Validatie

Aanbevolen lokale validatie:

```bash
npm run test:sprint2d-b
npm run test:sprint2f
npm run test:validation:2d-a
```

Functioneel:
1. Open Home.
2. Filter op hitlijst en uitzendjaar.
3. Open een run via Edit.
4. Controleer dat Edit in run-context opent.
5. Exporteer een nog niet-geëxporteerde combinatie.
6. Probeer dezelfde combinatie opnieuw te exporteren.
7. Controleer dat de tweede export geblokkeerd wordt.
