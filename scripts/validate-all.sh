#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p logs
LOG_FILE="logs/validate-all-$(date +%Y%m%d-%H%M%S).log"

run_step() {
  local name="$1"
  shift
  echo ""
  echo "=== ${name} ==="
  "$@"
}

{
  echo "[validate-all] root=$ROOT_DIR"
  echo "[validate-all] node=$(node --version 2>/dev/null || echo unavailable)"
  echo "[validate-all] npm=$(npm --version 2>/dev/null || echo unavailable)"
  echo "[validate-all] started_at=$(date '+%Y-%m-%d %H:%M:%S')"

  # Eén reproduceerbare validatieketen. test:all bevat alle Vitest-tests
  # (unit/service/react/static/sprint) plus Playwright E2E.
  run_step "install:all" npm run install:all
  run_step "build:all" npm run build:all
  run_step "test:all" npm run test:all

  echo ""
  echo "[validate-all] finished_at=$(date '+%Y-%m-%d %H:%M:%S')"
  echo "[validate-all] ok"
} 2>&1 | tee "$LOG_FILE"
