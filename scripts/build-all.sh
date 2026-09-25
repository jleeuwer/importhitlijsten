#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p logs
LOG_FILE="logs/build-all-$(date +%Y%m%d-%H%M%S).log"

{
  echo "[build-all] root=$ROOT_DIR"
  echo "[build-all] node=$(node --version 2>/dev/null || echo unavailable)"
  echo "[build-all] npm=$(npm --version 2>/dev/null || echo unavailable)"
  echo "[build-all] running production build"
  npm exec vite build
  echo "[build-all] done"
} 2>&1 | tee "$LOG_FILE"
