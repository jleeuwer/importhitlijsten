#!/usr/bin/env bash
set -euo pipefail

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-my-postgresdb}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-musicdb}"
RUN_ID="${RUN_ID:-${1:-}}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -z "${RUN_ID}" ]; then
  echo "Usage: RUN_ID=<uuid> $0" >&2
  echo "   or: $0 <uuid>" >&2
  exit 2
fi

echo "== Sprint 2H-Y ambiguous file_details diagnostics =="
docker exec -i "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -v ON_ERROR_STOP=1 -v run_id="${RUN_ID}" < "${SCRIPT_DIR}/sql/2h_y_ambiguous_file_details_diagnostics.sql"

echo "== Sprint 2H-Y Discogs lifecycle diagnostics =="
docker exec -i "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -v ON_ERROR_STOP=1 -v run_id="${RUN_ID}" < "${SCRIPT_DIR}/sql/2h_y_discogs_lifecycle_diagnostics.sql"
