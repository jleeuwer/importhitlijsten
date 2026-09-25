#!/usr/bin/env bash
set -euo pipefail

rm -rf node_modules dist .vite coverage __MACOSX
find . -name '.DS_Store' -delete || true

echo '[clean-install-build] cleanup complete'
npm install
npm exec vite build
