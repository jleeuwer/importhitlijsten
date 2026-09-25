#!/usr/bin/env bash
set -euo pipefail

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-my-postgresdb}"
POSTGRES_DB="${POSTGRES_DB:-musicdb}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SQL_FILE="$SCRIPT_DIR/sql/20260908_sprint2h_y_hotfix3_no_database_migration.sql"

echo "[2H-Y-HF3] Applying no-op migration marker"
echo "[2H-Y-HF3] container=$POSTGRES_CONTAINER db=$POSTGRES_DB user=$POSTGRES_USER"
docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$SQL_FILE"
echo "[2H-Y-HF3] Done"
