# Sprint 2H-D — Runs-overzicht met verwerkingsstatus, filters en veilige run-delete

## Doel

Het Runs-overzicht is uitgebreid tot een werkvoorraadscherm. De gebruiker ziet per import-run direct of de run klaar is, aandacht nodig heeft, al geëxporteerd is, of duplicates/blocked/skip-regels bevat.

## Functionele wijzigingen

### Runs-overzicht

Per run worden nu getoond:

- statusbadge;
- totaal aantal regels;
- OK;
- Blocked;
- Duplicate;
- Skip;
- Discogs-links;
- Exported.

De status wordt functioneel bepaald als:

- `Geëxporteerd`: exported count > 0;
- `Geen data`: geen regels;
- `Aandacht nodig`: blocked count > 0 of duplicate count > 0;
- `Klaar voor export`: geen blocked/duplicates en niet geëxporteerd.

`Skip` is informatief en telt niet automatisch als foutstatus.

### Filters

Toegevoegd:

- exportstatus: alle, niet geëxporteerd, geëxporteerd;
- verwerking: alle, aandacht nodig, klaar voor export, met blocked rows, met duplicates, met skip rows, met Discogs-links;
- snelfilters voor de belangrijkste werkvoorraadcategorieën.

### Run verwijderen

Niet-geëxporteerde runs kunnen vanuit het Runs-overzicht worden verwijderd. De gebruiker krijgt eerst een confirmatie met hitlijst, jaar, aantal regels en runId.

Geëxporteerde runs kunnen in deze sprint niet worden verwijderd. De backend blokkeert dit met HTTP 409, zodat definitieve `hitlijsten`-records niet per ongeluk los komen te staan van de historie.

## Technische wijzigingen

- `models/import_runs.js` levert nu verwerkingssummary per run.
- `DELETE /api/import-runs/:runId` is toegevoegd.
- `deleteImportRun` gebruikt transactionele safe-delete logica.
- `src/ui/pages/StagingResults.jsx` is uitgebreid met statuscounts, filters en delete-confirmatie.

## Tests

```bash
mkdir -p logs
npm run test:sprint2h-d 2>&1 | tee "logs/test-sprint2h-d-$(date +%Y%m%d-%H%M%S).log"
```

Aanvullend uitgevoerd tijdens oplevering:

- `npm run test:sprint2h-d` — passed;
- `npm run test:sprint2h` — passed;
- `npm run test:sprint2g` — passed;
- `npm run build:all` — passed.
