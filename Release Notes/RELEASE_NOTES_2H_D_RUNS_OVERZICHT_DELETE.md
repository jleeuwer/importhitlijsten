# Release Notes — Sprint 2H-D

## Toegevoegd

- Runs-overzicht toont statuscounts per run: totaal, OK, Blocked, Duplicate, Skip, Discogs en Exported.
- Nieuwe statusbadges: `Aandacht nodig`, `Klaar voor export`, `Geëxporteerd`, `Geen data`.
- Nieuwe filters op exportstatus en verwerking.
- Snelfilters voor aandacht nodig, klaar voor export, niet geëxporteerd, duplicates en blocked.
- Veilige delete-functie voor niet-geëxporteerde runs.

## Beveiliging

- Geëxporteerde runs kunnen niet worden verwijderd in deze versie.
- Delete is transactioneel en verwijdert stagingregels plus `import_runs` record.

## Tests

- `test:sprint2h-d`
- `test:sprint2h`
- `test:sprint2g`
- `build:all`
