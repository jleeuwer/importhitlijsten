#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SQL_FILE="$ROOT_DIR/scripts/sql/20260925_sprint2h_z_hotfix2_duplicate_row_review.sql"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-my-postgresdb}"
POSTGRES_DB="${POSTGRES_DB:-musicdb}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"

command -v docker >/dev/null 2>&1 || { echo "docker is required" >&2; exit 1; }
[[ -f "$SQL_FILE" ]] || { echo "Migration not found: $SQL_FILE" >&2; exit 1; }

echo "[2H-Z HF2] Applying duplicate row review migration"
echo "[2H-Z HF2] container=$POSTGRES_CONTAINER db=$POSTGRES_DB user=$POSTGRES_USER"
docker exec -i "$POSTGRES_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$SQL_FILE"
echo "[2H-Z HF2] Migration completed"
