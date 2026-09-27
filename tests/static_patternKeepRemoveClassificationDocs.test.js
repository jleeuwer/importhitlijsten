import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Sprint 2H-S pattern keep/remove classification documentation', () => {
  it('records BL-IMP-111 as closed and BL-IMP-118 as the new active pattern hardening item', () => {
    const backlog = read('BACKLOG.md');
    const status = read('docs/backlog/BACKLOG_STATUS_20260704.md');

    expect(backlog).toContain('BL-IMP-111');
    expect(backlog).toContain('Pattern discovery helper voor String Patterns');
    expect(backlog).toContain('Sprint 2H-O Fix 1');
    expect(backlog).toContain('BL-IMP-118');
    expect(backlog).toContain('Pattern discovery: keep/remove classification voor haakjespatronen');
    expect(status).toContain('BL-IMP-111 — Pattern discovery helper voor String Patterns**: gesloten / akkoord');
    expect(status).toContain('BL-IMP-118');
  });

  it('documents the keep/remove design, new table direction, and UI actions', () => {
    const sprint = read('docs/sprint-2h/SPRINT_2H_S_PATTERN_KEEP_REMOVE_CLASSIFICATION.md');
    const functional = read('FUNCTIONAL_SPEC.md');
    const technical = read('TECHNICAL_SPEC.md');

    expect(sprint).toContain('string_del_patterns');
    expect(sprint).toContain('string_keep_patterns');
    expect(sprint).toContain('Verwijderbaar');
    expect(sprint).toContain('Titelonderdeel');
    expect(sprint).toContain('SAFE_REMOVE_PATTERN');
    expect(sprint).toContain('KNOWN_KEEP_PATTERN');

    expect(functional).toContain('string_keep_patterns');
    expect(functional).toContain('Pattern discovery keep/remove classification');

    expect(technical).toContain('CREATE TABLE IF NOT EXISTS public.string_keep_patterns');
    expect(technical).toContain('skp_pattern_normalized');
    expect(technical).toContain('normalizePatternValue');
  });

  it('keeps functional testcases ready for future automated test development and exposes the sprint script', () => {
    const testPlan = read('TEST_PLAN.md');
    const sprint = read('docs/sprint-2h/SPRINT_2H_S_PATTERN_KEEP_REMOVE_CLASSIFICATION.md');
    const pkg = JSON.parse(read('package.json'));

    expect(testPlan).toContain('2H-S-01');
    expect(testPlan).toContain('2H-S-12');
    expect(testPlan).toContain('Keep-pattern onderdrukt verwijdervoorstel');
    expect(testPlan).toContain('Titelonderdeel toevoegen');
    expect(testPlan).toContain('Schema guard');

    expect(sprint).toContain('Sprint 2H-S — Pattern discovery keep/remove classification');
    expect(sprint).toContain('BL-IMP-118 — Pattern discovery: keep/remove classification voor haakjespatronen');
    expect(pkg.scripts['test:sprint2h-s']).toContain('tests/services_patternDiscoveryService.test.js');
    expect(pkg.scripts['test:sprint2h-s']).toContain('tests/static_patternKeepRemoveClassificationCode.test.js');
    expect(pkg.scripts['test:sprint2h-s']).toContain('tests/react/EditPatternKeepRemoveClassification.test.jsx');
    expect(pkg.scripts['test:sprint2h']).toContain('npm run test:sprint2h-s');
  });
});
