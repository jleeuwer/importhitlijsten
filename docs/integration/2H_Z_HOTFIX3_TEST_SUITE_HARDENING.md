# Integratie — 2H-Z Hotfix 3 Test Suite Hardening

## Installeren

```bash
npm ci
```

## Database

Hotfix 3 heeft geen nieuwe migratie. Indien de 2H-Z/HF2 migraties nog ontbreken:

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-z
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-z-hotfix2
```

## Testen

```bash
npm run test:sprint2h-z-hotfix3
./startapp.sh test
```

`./startapp.sh test` voert `npm run test:all` uit: eerst Vitest, daarna Playwright.

## Verwacht

- geen `No test suite found` door legacy `node:test` bestanden;
- geen oude `Load more` assertions voor Edit-paginering;
- Runs View/Edit acties vindbaar als links;
- geen `TimeoutNaNWarning` door ongeldige Discogs numeric env-config;
- actuele docs en migratievoorbeelden gebruiken `musicdb`.
