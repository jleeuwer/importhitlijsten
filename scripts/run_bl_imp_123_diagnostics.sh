#!/usr/bin/env bash
set -euo pipefail

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-my-postgresdb}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-musicdb}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SQL_FILE="$PROJECT_ROOT/scripts/sql/bl_imp_123_file_details_duplicate_diagnostics.sql"
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/bl-imp-123-diagnostics-$(date +%Y%m%d-%H%M%S).log"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "SQL file not found: $SQL_FILE" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker command not found" >&2
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -Fxq "$POSTGRES_CONTAINER"; then
  echo "PostgreSQL container not running: $POSTGRES_CONTAINER" >&2
  echo "Set POSTGRES_CONTAINER=<name> if your container has another name." >&2
  exit 1
fi

echo "Running BL-IMP-123 diagnostics against container=$POSTGRES_CONTAINER db=$POSTGRES_DB user=$POSTGRES_USER"
echo "Log: $LOG_FILE"

docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$SQL_FILE" 2>&1 | tee "$LOG_FILE"
