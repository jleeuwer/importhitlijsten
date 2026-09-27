# Release Notes — 2H-Z Hotfix 2 / v1.1.0

## Nieuw
- BL-IMP-136: post-import duplicate row review op genormaliseerde artiest + titel.
- Reviewmodal met positie als context en expliciete selectie van te verwijderen/uit te sluiten regels.
- Veilige fysieke delete uit `staging_hitlijsten` met audittrail.
- Nieuwe stabiele `sh_key` voor individuele stagingregels.

## Correctie testflow
- `./startapp.sh test` start nu `npm run test:all` en dus niet alleen de drie Playwright-tests.
- `./startapp.sh all` gebruikt één validate-keten en start daarna dev.

## Database
Voer uit:

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-z-hotfix2
```

## Versie
De versie blijft 1.1.0, gelijk aan de documentatiesprint en de nog niet geaccepteerde 2H-Z feature-releasecandidate.
