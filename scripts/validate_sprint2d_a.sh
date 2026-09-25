#!/usr/bin/env bash
set -euo pipefail

echo "[Sprint 2D-A-V] Running automated validation tests..."
npm run test:validation:2d-a

echo "[Sprint 2D-A-V] Validation tests completed."
