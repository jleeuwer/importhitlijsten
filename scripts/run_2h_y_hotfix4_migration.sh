#!/usr/bin/env bash
set -euo pipefail

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-my-postgresdb}"
POSTGRES_DB="${POSTGRES_DB:-musicdb}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
SQL_FILE="scripts/sql/20260917_sprint2h_y_hotfix4_no_database_migration.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "[2H-Y-HF4] SQL file not found: $SQL_FILE" >&2
  exit 1
fi

echo "[2H-Y-HF4] Applying no-op/comment migration via Docker"
echo "[2H-Y-HF4] container=$POSTGRES_CONTAINER db=$POSTGRES_DB user=$POSTGRES_USER"
docker exec -i "$POSTGRES_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$SQL_FILE"
echo "[2H-Y-HF4] Done"
