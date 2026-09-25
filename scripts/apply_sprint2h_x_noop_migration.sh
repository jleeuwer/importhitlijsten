#!/usr/bin/env bash
set -euo pipefail

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-my-postgresdb}"
POSTGRES_DB="${POSTGRES_DB:-muziek}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
SQL_FILE="scripts/sql/20260830_sprint2h_x_no_database_migration.sql"

cat <<INFO
Sprint 2H-X heeft geen echte database-migratie nodig.
No-op SQL marker wordt uitgevoerd tegen Docker PostgreSQL container: ${POSTGRES_CONTAINER}
Database: ${POSTGRES_DB}
User: ${POSTGRES_USER}
INFO

if ! docker ps --format '{{.Names}}' | grep -Fxq "${POSTGRES_CONTAINER}"; then
  echo "PostgreSQL container '${POSTGRES_CONTAINER}' draait niet of is niet gevonden." >&2
  echo "Start de container of zet POSTGRES_CONTAINER naar de juiste naam." >&2
  exit 1
fi

docker exec -i "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" < "${SQL_FILE}"
