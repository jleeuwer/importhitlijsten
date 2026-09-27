# Release Notes — 2H-Z Hotfix 3 / v1.1.0

## Test Suite Hardening

Hotfix 3 houdt applicatieversie **1.1.0** gelijk aan de 2H-Z documentatie- en codesprint.

### Opgelost

- 13 legacy `node:test` suites geconverteerd naar Vitest.
- Historische sprint-testcommando's geharmoniseerd op Vitest.
- 7 actuele/brittle assertions bijgewerkt op de huidige UI en documentatiestructuur.
- Runs-navigatieacties zijn weer semantische links.
- Discogs timeout/cacheconfig valt veilig terug bij `NaN`, nul of ongeldige env-waarden.
- Dubbele `openPatternSuggestions` fixture-key verwijderd.
- React async DB-status tests wachten state-updates correct af.
- PostgreSQL voorbeelden/defaults geharmoniseerd naar `musicdb`.

### Database

Geen nieuwe Hotfix 3 migratie. Bestaande 2H-Z/HF2-migraties blijven gelden.

### Testcommando's

```bash
npm run test:sprint2h-z-hotfix3
npm run test:all
```
