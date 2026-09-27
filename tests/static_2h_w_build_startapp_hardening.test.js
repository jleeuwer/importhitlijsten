/** @vitest-environment node */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import childProcess from 'node:child_process';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const startappPath = path.join(root, 'startapp.sh');
const preflightPath = path.join(root, 'scripts', 'preflight_2h_w.js');
const updaterPath = path.join(root, 'scripts', 'apply_2h_w_package_scripts.js');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('2H-W levert startapp.sh op onder de standaardnaam', () => {
  assert.equal(fs.existsSync(startappPath), true);
  assert.equal(path.basename(startappPath), 'startapp.sh');
  assert.match(read(startappPath), /^#!\/usr\/bin\/env bash/);
});

test('startapp.sh gebruikt de Artist-achtige commandogestuurde opzet', () => {
  const content = read(startappPath);
  assert.match(content, /usage\(\)/);
  assert.match(content, /parse_command_list\(\)/);
  assert.match(content, /--commands/);
  assert.match(content, /--keep-days/);
  assert.match(content, /--continue-on-error/);
  assert.match(content, /Geef minimaal één commando op/);
});

test('startapp.sh ondersteunt Importhitlijst-specifieke npm mapping', () => {
  const content = read(startappPath);
  assert.match(content, /install\)\s+npm_script='install:all'/);
  assert.match(content, /build\)\s+npm_script='build:all'/);
  assert.match(content, /validate\)\s+npm_script='validate'/);
  assert.match(content, /test\)\s+npm_script='test:all'/);
  assert.match(content, /dev\)\s+npm_script='dev:5174'/);
});

test('startapp.sh voert zonder argumenten niets uit en toont usage', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), '2hw-startapp-'));
  fs.copyFileSync(startappPath, path.join(temp, 'startapp.sh'));
  fs.writeFileSync(path.join(temp, 'package.json'), JSON.stringify({ scripts: {} }));
  const result = childProcess.spawnSync('bash', ['startapp.sh'], {
    cwd: temp,
    encoding: 'utf8',
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr + result.stdout, /Geef minimaal één commando op/);
  assert.doesNotMatch(result.stderr + result.stdout, /Start:/);
  assert.doesNotMatch(result.stderr + result.stdout, /Commando:/);
  assert.doesNotMatch(result.stderr + result.stdout, /Logbestand:/);
});

test('startapp.sh is Bash syntax-valid', () => {
  const result = childProcess.spawnSync('bash', ['-n', startappPath], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('preflight en package-updater zijn aanwezig', () => {
  assert.equal(fs.existsSync(preflightPath), true);
  assert.equal(fs.existsSync(updaterPath), true);
  assert.match(read(preflightPath), /requiredScripts/);
  assert.match(read(updaterPath), /preflight:2h-w/);
  assert.match(read(updaterPath), /test:sprint2h-w/);
});

test('documentatie en release notes zijn bijgewerkt', () => {
  const expected = [
    'docs/backlog/BL-IMP-088.md',
    'docs/backlog/BL-IMP-132.md',
    'docs/sprint-2h/SPRINT_2H_W_BUILD_STARTAPP_HARDENING.md',
    'docs/functional/FUNCTIONAL_SPEC_2H_W_BUILD_STARTAPP_HARDENING.md',
    'docs/technical/TECHNICAL_SPEC_2H_W_BUILD_STARTAPP_HARDENING.md',
    'docs/testcases/FUNCTIONAL_TEST_CASES_2H_W_BUILD_STARTAPP_HARDENING.md',
    'Release Notes/RELEASE_NOTES_2H_W_BUILD_STARTAPP_HARDENING.md',
    'README.md',
    'MANIFEST_2H_W.md',
  ];
  for (const relativePath of expected) {
    assert.equal(fs.existsSync(path.join(root, relativePath)), true, `${relativePath} ontbreekt`);
  }
});

test('release metadata sluit runtime- en buildartefacts uit', () => {
  const forbidden = ['node_modules/', 'dist/', 'logs/', '__MACOSX/', '.DS_Store'];
  const gitignore = read(path.join(root, '.gitignore'));
  const checksum = read(path.join(root, 'release.sha256'));

  const ignoredNames = new Set(
    gitignore.split(/\r?\n/).map((line) => line.trim().replace(/\/$/, '')).filter(Boolean)
  );
  for (const entry of ['node_modules', 'dist', 'logs', '.DS_Store']) {
    assert.equal(ignoredNames.has(entry), true, `.gitignore mist ${entry}`);
  }

  for (const entry of forbidden) {
    assert.equal(checksum.includes(entry), false, `release.sha256 mag ${entry} niet bevatten`);
  }
});
