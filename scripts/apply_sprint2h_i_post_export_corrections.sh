#!/usr/bin/env bash
set -euo pipefail

SCRIPT_NAME="apply_sprint2h_i_post_export_corrections"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SQL_FILE="$ROOT_DIR/scripts/sql/20260426_sprint2h_i_post_export_corrections.sql"
DB_CONTAINER_NAME="${DB_CONTAINER_NAME:-${POSTGRES_CONTAINER:-my-postgresdb}}"
MIGRATION_MODE="${MIGRATION_MODE:-auto}" # auto | docker | host
DB_USER="${DB_USER:-${POSTGRES_USER:-postgres}}"
DB_NAME="${DB_NAME:-${POSTGRES_DB:-musicdb}}"
REMOTE_SQL_FILE="/tmp/20260426_sprint2h_i_post_export_corrections.sql"

log() { local level="$1"; shift; printf '[%s] [%s] %s\n' "$SCRIPT_NAME" "$level" "$*"; }
redact_url() { printf '%s' "${1:-}" | sed -E 's#(postgres(ql)?://[^:/@]+:)[^@]+@#\1***@#g'; }
normalize_url_for_container() {
  local url="$1"
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
require_file() { [[ -f "$SQL_FILE" ]] || { log ERROR "SQL file not found: $SQL_FILE"; exit 1; }; }
require_database_url_for_host() {
  [[ -n "${DATABASE_URL:-}" ]] || { log ERROR "DATABASE_URL is required for host mode, for example: postgresql://user:pass@localhost:5433/musicdb"; exit 1; }
}
run_with_docker() {
  log INFO "mode=docker container=$DB_CONTAINER_NAME"
  log INFO "copying_sql_to_container source=$SQL_FILE target=$REMOTE_SQL_FILE"
  docker cp "$SQL_FILE" "$DB_CONTAINER_NAME:$REMOTE_SQL_FILE"
  if [[ -n "${DATABASE_URL:-}" ]]; then
    local normalized_url; normalized_url="$(normalize_url_for_container "$DATABASE_URL")"
    log INFO "database_url=$(redact_url "$normalized_url")"
    docker exec -i "$DB_CONTAINER_NAME" psql "$normalized_url" -v ON_ERROR_STOP=1 -f "$REMOTE_SQL_FILE"
  else
    log INFO "DATABASE_URL not set; using Docker-local psql connection db=$DB_NAME user=$DB_USER"
    docker exec -i "$DB_CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$REMOTE_SQL_FILE"
  fi
  log INFO "migration_completed mode=docker"
}
run_with_host_psql() {
  require_database_url_for_host
  command -v psql >/dev/null 2>&1 || { log ERROR "psql is not installed on the host, and Docker mode is unavailable."; exit 1; }
  log INFO "mode=host"
  log INFO "database_url=$(redact_url "$DATABASE_URL")"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"
  log INFO "migration_completed mode=host"
}
main() {
  require_file
  log INFO "Applying Sprint 2H-I post-export corrections migration"
  log INFO "sql_file=$SQL_FILE"
  log INFO "requested_mode=$MIGRATION_MODE"
  case "$MIGRATION_MODE" in
    docker) container_is_running || { log ERROR "Docker mode requested, but container '$DB_CONTAINER_NAME' is not running."; exit 1; }; run_with_docker ;;
    host) run_with_host_psql ;;
    auto) if container_is_running; then run_with_docker; else log WARN "container '$DB_CONTAINER_NAME' not running or Docker unavailable; falling back to host psql"; run_with_host_psql; fi ;;
    *) log ERROR "Invalid MIGRATION_MODE='$MIGRATION_MODE'. Use auto, docker, or host."; exit 1 ;;
  esac
}
main "$@"
