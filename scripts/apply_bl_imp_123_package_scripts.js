#!/usr/bin/env node
/**
 * BL-IMP-123 safe package.json updater.
 * Adds diagnostics/test scripts without overwriting existing package settings.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packagePath = path.join(root, 'package.json');

if (!fs.existsSync(packagePath)) {
  console.error(`[BL-IMP-123] package.json not found in ${root}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.scripts = pkg.scripts && typeof pkg.scripts === 'object' ? pkg.scripts : {};

const additions = {
  'diagnostics:bl-imp-123': 'bash scripts/run_bl_imp_123_diagnostics.sh',
  'test:bl-imp-123': 'vitest run --config vite.config.js tests/static_bl_imp_123_diagnostics.test.js'
};

const changed = [];
const unchanged = [];
for (const [name, command] of Object.entries(additions)) {
  if (pkg.scripts[name] === command) {
    unchanged.push(name);
  } else if (pkg.scripts[name] && pkg.scripts[name] !== command) {
    console.error(`[BL-IMP-123] Refusing to overwrite existing script ${name}: ${pkg.scripts[name]}`);
    process.exit(2);
  } else {
    pkg.scripts[name] = command;
    changed.push(name);
  }
}

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`[BL-IMP-123] package.json updated. Added: ${changed.join(', ') || 'none'}. Already present: ${unchanged.join(', ') || 'none'}.`);
