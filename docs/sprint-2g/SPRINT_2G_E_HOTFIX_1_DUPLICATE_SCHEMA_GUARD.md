# Sprint 2G-E Hotfix 1 — Duplicate import schema guard

## Aanleiding

Na implementatie van Sprint 2G-E trad een regressie op in het Edit-scherm:

```text
error: column s.fd_file_name does not exist
```

De oorzaak is dat de duplicate import summary endpoint de Sprint 2G-D kolommen op `staging_hitlijsten` direct gebruikt:

- `fd_file_name`
- `fd_action`

Wanneer de 2G-D migratie nog niet op de database is toegepast, crasht de summary call.

## Oplossing

`services/duplicateImportService.js` bevat nu een schema guard:

- PostgreSQL error `42703` voor ontbrekende `fd_file_name` of `fd_action` wordt afgevangen.
- De duplicate summary retourneert dan veilig `0` duplicates in plaats van een 500-error.
- Er wordt een duidelijke warning gelogd met remediation: draai `npm run db:migrate:sprint2g-d`.

Dit voorkomt dat het Edit-scherm breekt wanneer de database-migratie nog ontbreekt.

## Belangrijk

De guard voorkomt alleen de crash. Voor echte duplicate-detectie blijft de 2G-D migratie vereist:

```bash
mkdir -p logs
DB_CONTAINER_NAME=my-postgresdb MIGRATION_MODE=docker npm run db:migrate:sprint2g-d 2>&1 | tee "logs/db-migrate-sprint2g-d-$(date +%Y%m%d-%H%M%S).log"
```

## Tests

Toegevoegd aan `tests/services_duplicateImportService.test.js`:

- ontbrekende `staging_hitlijsten.fd_file_name` veroorzaakt geen crash;
- summary geeft veilig `0` duplicates terug.

## Validatie

In deze omgeving zijn syntaxchecks uitgevoerd op:

- `services/duplicateImportService.js`
- `tests/services_duplicateImportService.test.js`
- `routes/indexroutes.js`

De volledige Vitest-run moet lokaal worden uitgevoerd omdat `node_modules` niet in de ZIP zit.
