#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="apply_sprint2g_d_duplicate_import_prevention"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SQL_FILE="$ROOT_DIR/scripts/sql/20260426_sprint2g_d_duplicate_import_prevention.sql"

# Project convention: PostgreSQL runs in Docker as container my-postgresdb,
# with host port 5433 mapped to container port 5432. When psql runs inside the
# container, localhost:5433 must be normalized to 127.0.0.1:5432.
DB_CONTAINER_NAME="${DB_CONTAINER_NAME:-${POSTGRES_CONTAINER:-my-postgresdb}}"
MIGRATION_MODE="${MIGRATION_MODE:-auto}" # auto | docker | host
DB_USER="${DB_USER:-${POSTGRES_USER:-postgres}}"
DB_NAME="${DB_NAME:-${POSTGRES_DB:-musicdb}}"
REMOTE_SQL_FILE="/tmp/20260426_sprint2g_d_duplicate_import_prevention.sql"

log() {
  local level="$1"; shift
  printf '[%s] [%s] %s\n' "$SCRIPT_NAME" "$level" "$*"
}

redact_url() {
  local url="${1:-}"
  # Redact password in common postgres URLs: postgresql://user:pass@host:port/db
  printf '%s' "$url" | sed -E 's#(postgres(ql)?://[^:/@]+:)[^@]+@#\1***@#g'
}

normalize_url_for_container() {
  local url="$1"
  # Inside the postgres container the server is reachable on 127.0.0.1:5432,
  # not on the host-mapped 5433 port.
  url="${url//localhost:5433/127.0.0.1:5432}"
  url="${url//127.0.0.1:5433/127.0.0.1:5432}"
  url="${url//host.docker.internal:5433/127.0.0.1:5432}"
  url="${url//postgres:5433/127.0.0.1:5432}"
  printf '%s' "$url"
}

container_is_running() {
  command -v docker >/dev/null 2>&1 || return 1
  docker inspect -f '{{.State.Running}}' "$DB_CONTAINER_NAME" 2>/dev/null | grep -q '^true$'
}

require_file() {
  if [[ ! -f "$SQL_FILE" ]]; then
    log ERROR "SQL file not found: $SQL_FILE"
    exit 1
  fi
}

require_database_url_for_host() {
  if [[ -z "${DATABASE_URL:-}" ]]; then
    log ERROR "DATABASE_URL is required for host mode, for example: postgresql://user:pass@localhost:5433/musicdb"
    log ERROR "For Docker mode you can omit DATABASE_URL and use: DB_CONTAINER_NAME=my-postgresdb MIGRATION_MODE=docker npm run db:migrate:sprint2g-d"
    exit 1
  fi
}

run_with_docker() {
  log INFO "mode=docker container=$DB_CONTAINER_NAME"
  log INFO "copying_sql_to_container source=$SQL_FILE target=$REMOTE_SQL_FILE"

  docker cp "$SQL_FILE" "$DB_CONTAINER_NAME:$REMOTE_SQL_FILE"

  if [[ -n "${DATABASE_URL:-}" ]]; then
    local normalized_url
    normalized_url="$(normalize_url_for_container "$DATABASE_URL")"
    log INFO "database_url=$(redact_url "$normalized_url")"
    docker exec -i "$DB_CONTAINER_NAME" \
      psql "$normalized_url" -v ON_ERROR_STOP=1 -f "$REMOTE_SQL_FILE"
  else
    log INFO "DATABASE_URL not set; using Docker-local psql connection db=$DB_NAME user=$DB_USER"
    docker exec -i "$DB_CONTAINER_NAME" \
      psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$REMOTE_SQL_FILE"
  fi

  log INFO "migration_completed mode=docker"
}

run_with_host_psql() {
  require_database_url_for_host

  if ! command -v psql >/dev/null 2>&1; then
    log ERROR "psql is not installed on the host, and Docker mode is unavailable. Start container '$DB_CONTAINER_NAME' or install psql."
    exit 1
  fi

  log INFO "mode=host"
  log INFO "database_url=$(redact_url "$DATABASE_URL")"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"
  log INFO "migration_completed mode=host"
}

main() {
  require_file

  log INFO "Applying Sprint 2G-D duplicate import prevention migration"
  log INFO "sql_file=$SQL_FILE"
  log INFO "requested_mode=$MIGRATION_MODE"

  case "$MIGRATION_MODE" in
    docker)
      if ! container_is_running; then
        log ERROR "Docker mode requested, but container '$DB_CONTAINER_NAME' is not running."
        exit 1
      fi
      run_with_docker
      ;;
    host)
      run_with_host_psql
      ;;
    auto)
      if container_is_running; then
        run_with_docker
      else
        log WARN "container '$DB_CONTAINER_NAME' not running or Docker unavailable; falling back to host psql"
        run_with_host_psql
      fi
      ;;
    *)
      log ERROR "Invalid MIGRATION_MODE='$MIGRATION_MODE'. Use auto, docker, or host."
      exit 1
      ;;
  esac
}

main "$@"
