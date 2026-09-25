#!/usr/bin/env bash
set -euo pipefail

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-my-postgresdb}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-musicdb}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="${SCRIPT_DIR}/sql/20260907_sprint2h_y_matching_discogs_status_hardening.sql"

echo "== Sprint 2H-Y migration =="
echo "Container: ${POSTGRES_CONTAINER}"
echo "Database : ${POSTGRES_DB}"
echo "User     : ${POSTGRES_USER}"

docker exec -i "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -v ON_ERROR_STOP=1 < "${SQL_FILE}"

echo "== Sprint 2H-Y migration completed =="
