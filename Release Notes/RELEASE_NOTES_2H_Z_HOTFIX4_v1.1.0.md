# Release Notes — 2H-Z Hotfix 4 v1.1.0

## Doel
Afronden van de test-suite hardening uit Hotfix 3 door de twee resterende Edit-pagineringtest failures te corrigeren.

## Opgelost
- Multi-match-safe assertions voor `Artist 1`, `Artist 51` en `Artist 60`.
- Geen wijziging aan productielogica; de failures waren testselector-problemen.
- Nieuwe regressietest en sprintscript `test:sprint2h-z-hotfix4`.

## Database
Geen nieuwe migratie. Bestaande voorbeelden gebruiken `POSTGRES_DB=musicdb`.

## Validatie
Voer lokaal uit:
```bash
npm run test:sprint2h-z-hotfix4
./startapp.sh test
```
