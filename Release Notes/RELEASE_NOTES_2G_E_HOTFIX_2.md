# Release Notes — Sprint 2G-E Hotfix 2

## Fix

De 2G-D migratie kon in Docker mode alsnog stoppen met:

```text
DATABASE_URL is required
```

Dit is opgelost. In `MIGRATION_MODE=docker` mag `DATABASE_URL` ontbreken. Het script gebruikt dan standaard:

```text
container: my-postgresdb
user: postgres
database: musicdb
```

## Aanbevolen migratiecommando

```bash
mkdir -p logs
DB_CONTAINER_NAME=my-postgresdb MIGRATION_MODE=docker npm run db:migrate:sprint2g-d 2>&1 | tee "logs/db-migrate-sprint2g-d-$(date +%Y%m%d-%H%M%S).log"
```
