#!/usr/bin/env node
/*
 * Safely adds Sprint 2H-W npm scripts without overwriting existing scripts.
 */
const fs = require('fs');
const path = require('path');

const packagePath = path.join(process.cwd(), 'package.json');
const additions = {
  'preflight:2h-w': 'node scripts/preflight_2h_w.js',
  'test:sprint2h-w': 'node --test tests/static_2h_w_build_startapp_hardening.test.js',
};

if (!fs.existsSync(packagePath)) {
  console.error(`FOUT: package.json niet gevonden in ${process.cwd()}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.scripts = pkg.scripts || {};

const refused = [];
const added = [];
for (const [name, command] of Object.entries(additions)) {
  if (Object.prototype.hasOwnProperty.call(pkg.scripts, name)) {
    if (pkg.scripts[name] === command) {
      console.log(`OK: script '${name}' bestaat al met dezelfde waarde.`);
      continue;
    }
    refused.push({ name, existing: pkg.scripts[name], wanted: command });
    continue;
  }
  pkg.scripts[name] = command;
  added.push(name);
}

if (refused.length) {
  console.error('FOUT: bestaande scripts worden niet overschreven. Controleer handmatig:');
  for (const item of refused) {
    console.error(`- ${item.name}: bestaand='${item.existing}' gewenst='${item.wanted}'`);
  }
  process.exit(1);
}

if (added.length) {
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`Toegevoegd aan package.json: ${added.join(', ')}`);
} else {
  console.log('Geen package.json-wijzigingen nodig.');
}
