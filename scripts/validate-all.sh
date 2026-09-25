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

  run_step "install:all" npm run install:all
  run_step "build:all" npm run build:all
  run_step "test:sprint2g-d" npm run test:sprint2g-d
  run_step "test:sprint2g" npm run test:sprint2g
  run_step "test:sprint2h-a" npm run test:sprint2h-a
  run_step "test:sprint2h-c" npm run test:sprint2h-c
  run_step "test:e2e" npm run test:e2e

  echo ""
  echo "[validate-all] finished_at=$(date '+%Y-%m-%d %H:%M:%S')"
  echo "[validate-all] ok"
} 2>&1 | tee "$LOG_FILE"
