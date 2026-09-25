# Release Notes — Sprint 2G-E Hotfix 1

## Fix

Voorkomt een regressie waarbij het Edit-scherm kon crashen op:

```text
column s.fd_file_name does not exist
```

De duplicate import summary endpoint gaat nu veilig om met databases waarop de Sprint 2G-D migratie nog niet is toegepast.

## Let op

Voor daadwerkelijke duplicate-detectie moet de 2G-D migratie nog steeds worden uitgevoerd:

```bash
mkdir -p logs
DB_CONTAINER_NAME=my-postgresdb MIGRATION_MODE=docker npm run db:migrate:sprint2g-d 2>&1 | tee "logs/db-migrate-sprint2g-d-$(date +%Y%m%d-%H%M%S).log"
```
