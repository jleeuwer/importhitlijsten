import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Sprint 2H-R documentation/backlog cleanup', () => {
  it('keeps a compact active backlog and archives historical backlog content', () => {
    const backlog = read('BACKLOG.md');
    const history = read('docs/backlog/BACKLOG_HISTORY_BEFORE_2H_R.md');

    expect(backlog).toContain('Importhitlijst Backlog — actuele geconsolideerde stand');
    expect(backlog).toContain('BL-IMP-090');
    expect(backlog).toContain('BL-IMP-111');
    expect(backlog).toContain('BL-IMP-116');
    expect(backlog).toContain('Historisch / geparkeerd');
    expect(backlog).not.toContain('## Sprint 1 — Export stabilisatie');

    expect(history).toContain('Backlog historisch archief vóór Sprint 2H-R');
    expect(history).toContain('## Sprint 1 — Export stabilisatie');
  });

  it('records the closed Discogs sprint decisions and current status documents', () => {
    const status = read('docs/backlog/BACKLOG_STATUS_20260704.md');
    const sprint = read('docs/sprint-2h/SPRINT_2H_R_DOCUMENTATIE_BACKLOG_CLEANUP.md');
    const backlog = read('BACKLOG.md');

    expect(status).toContain('2H-H — Discogs zoekmodal UX en enrichment-onderzoek: gesloten / akkoord');
    expect(status).toContain('2H-K — Discogs detailinspectie vanuit zoekmodal: gesloten / akkoord');
    expect(status).toContain('2H-L — Discogs UX harmonisatie: gesloten / akkoord');

    expect(sprint).toContain('BL-IMP-090 — Documentatie consolidatie en backlog cleanup');
    expect(sprint).toContain('Geen wijziging in importlogica');
    expect(backlog).toContain('| BL-IMP-090 | Documentatie consolidatie en backlog cleanup | Sprint 2H-R |');
  });

  it('exposes the sprint validation script in package.json', () => {
    const pkg = JSON.parse(read('package.json'));

    expect(pkg.scripts['test:sprint2h-r']).toBe('vitest run --config vite.config.js tests/static_documentationBacklogCleanup.test.js');
    expect(pkg.scripts['test:sprint2h']).toContain('npm run test:sprint2h-r');
  });
});
