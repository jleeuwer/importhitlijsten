# Sprint 2H-M — Exportstatus-aware workflow buttons

## Status

Geïmplementeerd als code-sprint op basis van 2H-L Fix 1.

## Aanleiding

Na export naar `hitlijsten` konden pre-export knoppen in het Edit-scherm nog staging-only wijzigingen uitvoeren. Voorbeeld: `Forceer titel/artiest swap (zichtbare rijen)` wijzigde `staging_hitlijsten`, maar propageerde niet naar `hitlijsten`. Dat is functioneel onveilig omdat de gebruiker denkt dat de geëxporteerde lijst gecorrigeerd is, terwijl alleen de importbron/staging is aangepast.

## Functionele regel

Als een run al geëxporteerd is naar `hitlijsten`, worden pre-export workflowacties boven `Export → hitlijsten` uitgeschakeld. De gebruiker krijgt een duidelijke melding dat wijzigingen na export via `Correctie na export` moeten worden uitgevoerd.

Read-only acties blijven beschikbaar, zoals `Refresh rows` en `Export Find-cmd script`.

## Uitgeschakelde pre-export acties na export

- Decode HTML entities
- ArtistSpelling
- PatternDelete
- SongSpelling
- Preview jaarverrijking
- Herstel titel/artiest swap (batch)
- Forceer titel/artiest swap (zichtbare rijen)
- Preview tekstnormalisatie
- Normaliseer tekst (zichtbare rijen)
- Preview encoding repair
- Repair encoding (zichtbare rijen)
- Zet duplicates op Skip

## Beschikbare acties na export

- Refresh rows
- Export Find-cmd script
- Export blocked Discogs-links indien relevant
- Discogs inspectie/read-only acties
- Correctie na export per regel

## Frontend implementatie

`src/ui/pages/EditPage.jsx` bepaalt of een run geëxporteerd is via de bestaande exportstatus:

- `exportStatus.alreadyExported === true`
- of `exportStatus.existingRowsForTarget > 0`

Wanneer dat zo is:

- verschijnt een waarschuwing met `role="alert"`;
- pre-export buttons krijgen `disabled`;
- tooltips verwijzen naar `Correctie na export`.

## Backend guardrails

Naast de UI-disable is een backend guard toegevoegd in `services/exportWorkflowGuardService.js`.

De guard blokkeert muterende pre-export endpoints met HTTP 409 en code:

```text
PRE_EXPORT_ACTION_BLOCKED_AFTER_EXPORT
```

Geblokkeerde muterende endpoints zijn onder meer:

- duplicate skip
- run decode HTML
- ArtistSpelling
- SongSpelling
- PatternDelete apply
- batch title/artist swap
- force title/artist swap
- normalize text apply
- year enrichment apply
- repair encoding apply

## Correctie na export

`Correctie na export` blijft het expliciete veilige pad voor correcties die ook naar `hitlijsten` moeten doorwerken. Die flow blijft beschikbaar in de rijcontext.

## Tests

Nieuwe tests:

- `tests/services_exportWorkflowGuardService.test.js`
- `tests/react/EditExportStatusAwareWorkflowButtons.test.jsx`

Sprintcommando:

```bash
npm run test:sprint2h-m
```

Dit test:

- detectie van geëxporteerde runs;
- backend block met HTTP 409/errorcode;
- disabled pre-export buttons na export;
- beschikbare read-only acties na export;
- beschikbaarheid van pre-export acties vóór export.
