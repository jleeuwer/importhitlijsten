# Sprint 2G-E Hotfix 2 — Docker migratie zonder verplichte DATABASE_URL

## Aanleiding

Bij het draaien van de 2G-D migratie ontstond de fout:

```text
[apply_sprint2g_d_duplicate_import_prevention] [ERROR] DATABASE_URL is required, for example: postgresql://user:pass@localhost:5433/musicdb
```

Dit was niet consistent met de afgesproken Docker-werkwijze voor Importhitlijst, waarbij migraties met `MIGRATION_MODE=docker` ook zonder expliciete `DATABASE_URL` moeten kunnen draaien tegen de standaard container `my-postgresdb` en database `musicdb`.

## Oplossing

`scripts/apply_sprint2g_d_duplicate_import_prevention.sh` is aangepast:

- `DATABASE_URL` is alleen nog verplicht in `host` mode.
- In `docker` mode gebruikt het script, als `DATABASE_URL` ontbreekt, een Docker-lokale psql-verbinding:

```bash
psql -U "$DB_USER" -d "$DB_NAME"
```

- Defaults:
  - `DB_CONTAINER_NAME=my-postgresdb`
  - `DB_USER=postgres`
  - `DB_NAME=musicdb`

## Aanbevolen commando

```bash
mkdir -p logs
DB_CONTAINER_NAME=my-postgresdb MIGRATION_MODE=docker npm run db:migrate:sprint2g-d 2>&1 | tee "logs/db-migrate-sprint2g-d-$(date +%Y%m%d-%H%M%S).log"
```

## Alternatief met expliciete DATABASE_URL

```bash
mkdir -p logs
DATABASE_URL="postgresql://postgres:<password>@localhost:5433/musicdb" DB_CONTAINER_NAME=my-postgresdb MIGRATION_MODE=docker npm run db:migrate:sprint2g-d 2>&1 | tee "logs/db-migrate-sprint2g-d-$(date +%Y%m%d-%H%M%S).log"
```

## Validatie

- `bash -n scripts/apply_sprint2g_d_duplicate_import_prevention.sh`
- handmatige controle dat `docker` mode geen harde `DATABASE_URL`-eis meer heeft.
