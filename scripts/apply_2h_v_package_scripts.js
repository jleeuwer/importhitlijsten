#!/usr/bin/env node
import fs from 'node:fs';

const packageJsonPath = 'package.json';
const scriptsToAdd = {
  'db:migrate:sprint2h-v': 'bash scripts/run_2h_v_migration.sh',
  'repair:2h-v-export-status': 'bash scripts/run_2h_v_export_status_repair.sh --preview',
  'repair:2h-v-export-status:apply': 'bash scripts/run_2h_v_export_status_repair.sh --apply',
  'test:sprint2h-v': 'node --test tests/services_2h_v_warningStatusHardening.test.js tests/services_2h_v_encodingWarningLifecycle.test.js tests/services_2h_v_exportStatusRepair.test.js tests/static_2h_v_warning_status_hardening.test.js'
};

if (!fs.existsSync(packageJsonPath)) {
  console.error('package.json not found. Run this script from the project root.');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
pkg.scripts = pkg.scripts || {};

const conflicts = Object.keys(scriptsToAdd).filter((name) => pkg.scripts[name] && pkg.scripts[name] !== scriptsToAdd[name]);
if (conflicts.length > 0) {
  console.error('Refusing to overwrite existing package scripts:');
  for (const name of conflicts) console.error(`- ${name}: ${pkg.scripts[name]}`);
  process.exit(2);
}

for (const [name, command] of Object.entries(scriptsToAdd)) {
  pkg.scripts[name] = command;
}

fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
console.log('Added/verified Sprint 2H-V package scripts:');
for (const name of Object.keys(scriptsToAdd)) console.log(`- ${name}`);
