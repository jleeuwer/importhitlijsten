#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p logs

echo "[install-all] Installing root/backend/frontend dependencies"
echo "[install-all] root=$ROOT_DIR"

npm install

echo "[install-all] Done"
