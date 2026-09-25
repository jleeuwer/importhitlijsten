#!/usr/bin/env bash
set -euo pipefail

MODE="${1:---preview}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-my-postgresdb}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-musicdb}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "${MODE}" in
  --preview)
    SQL_FILE="${SCRIPT_DIR}/sql/2h_v_preview_export_status_repair.sql"
    ;;
  --apply)
    SQL_FILE="${SCRIPT_DIR}/sql/2h_v_apply_export_status_repair.sql"
    ;;
  *)
    echo "Usage: bash scripts/run_2h_v_export_status_repair.sh --preview|--apply" >&2
    exit 2
    ;;
esac

echo "== Sprint 2H-V export status repair ${MODE} =="
echo "Container: ${POSTGRES_CONTAINER}"
echo "Database : ${POSTGRES_DB}"
echo "User     : ${POSTGRES_USER}"

docker exec -i "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -v ON_ERROR_STOP=1 < "${SQL_FILE}"

echo "== Sprint 2H-V export status repair ${MODE} completed =="
