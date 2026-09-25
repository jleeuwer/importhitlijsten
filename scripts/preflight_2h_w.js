#!/usr/bin/env node
/*
 * Sprint 2H-W preflight: build/startapp hardening.
 * Read-only validation. Does not run install/build/test; it only verifies that
 * required commands and files are present before the user starts the pipeline.
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const requiredScripts = {
  'install:all': 'Install dependencies for the app',
  'build:all': 'Build the app',
  validate: 'Run project validation',
  'test:e2e': 'Run e2e tests',
  'dev:5174': 'Start development server on port 5174',
};

function fail(message) {
  console.error(`FOUT: ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`OK: ${message}`);
}

function readPackageJson() {
  const packagePath = path.join(root, 'package.json');
  if (!fs.existsSync(packagePath)) {
    fail(`package.json niet gevonden in ${root}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  } catch (error) {
    fail(`package.json is geen geldige JSON: ${error.message}`);
    return null;
  }
}

function parseMajor(version) {
  const match = String(version || '').match(/^v?(\d+)\./);
  return match ? Number(match[1]) : NaN;
}

const pkg = readPackageJson();
if (!pkg) process.exit(process.exitCode || 1);

const scripts = pkg.scripts || {};
for (const [scriptName, description] of Object.entries(requiredScripts)) {
  if (typeof scripts[scriptName] === 'string' && scripts[scriptName].trim()) {
    ok(`npm script '${scriptName}' aanwezig — ${description}`);
  } else {
    fail(`npm script '${scriptName}' ontbreekt of is leeg.`);
  }
}

const startappPath = path.join(root, 'startapp.sh');
if (fs.existsSync(startappPath)) {
  ok('startapp.sh aanwezig in projectroot');
  const content = fs.readFileSync(startappPath, 'utf8');
  const expectedSnippets = [
    'install|build|validate|test|dev',
    'Geef minimaal één commando op',
    "ORDERED_ACTIONS=\"install build validate test dev\"",
    "npm_script='build:all'",
    "npm_script='dev:5174'",
  ];
  for (const snippet of expectedSnippets) {
    if (content.includes(snippet)) {
      ok(`startapp.sh bevat verwacht gedrag: ${snippet}`);
    } else {
      fail(`startapp.sh mist verwacht gedrag: ${snippet}`);
    }
  }
} else {
  fail('startapp.sh ontbreekt in projectroot.');
}

const nodeMajor = parseMajor(process.version);
if (Number.isFinite(nodeMajor) && nodeMajor >= 20) {
  ok(`Node-versie is modern genoeg voor deze app: ${process.version}`);
} else {
  fail(`Node-versie lijkt te oud of onbekend: ${process.version}. Gebruik Node 20+.`);
}

const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
for (const dep of ['vite', '@vitejs/plugin-react']) {
  if (deps[dep]) {
    ok(`dependency '${dep}' staat in package.json (${deps[dep]})`);
  } else {
    console.warn(`WAARSCHUWING: dependency '${dep}' staat niet in package.json. Als de app Vite gebruikt, moet deze aanwezig zijn.`);
  }
}

if (process.exitCode) {
  console.error('\n2H-W preflight is mislukt. Herstel bovenstaande punten voordat je install/build/test draait.');
  process.exit(process.exitCode);
}

console.log('\n2H-W preflight succesvol afgerond.');
