# Test execution — 2H-AA v1.2.0

**Bouwdatum:** 2026-09-27  
**Status:** statische/syntaxvalidatie geslaagd; volledige npm/Vitest/Playwright-run moet op de doel-Mac worden uitgevoerd.

## Uitgevoerd in de bouwomgeving

Geslaagd:

- `node --check` op alle `.js` bestanden buiten `node_modules`;
- TypeScript parsercheck (`tsc --allowJs --jsx react-jsx --noEmit --noResolve`) op de gewijzigde JSX en React-test;
- `bash -n` op alle shellscripts;
- JSON-parse van `package.json` en `package-lock.json`;
- versiecontrole: package, lock en lock-root allemaal `1.2.0`;
- controle aanwezigheid `test:sprint2h-aa` en `db:migrate:sprint2h-aa`;
- 12 gerichte statische implementatiecontroles op migratie, Docker-defaults, model/service, multi-upload, API's, dropzone, kandidaatmetadata, cleanup en functionele testdocumentatie;
- validatie van de verplichte release.manifest-velden voor 2H-AA.

## Niet volledig uitvoerbaar in deze bouwomgeving

`npm ci --ignore-scripts` kon dependencies niet volledig ophalen doordat de sandbox geen betrouwbare DNS/toegang tot `registry.npmjs.org` had (`EAI_AGAIN`). Daardoor waren Vite/Vitest/Playwright hier niet beschikbaar en worden build of automatische tests niet ten onrechte als groen gerapporteerd.

## Uit te voeren op de doel-Mac

```bash
npm ci
npm run build:all
npm run test:sprint2h-aa
./startapp.sh test
```

Vooraf de database-migratie:

```bash
POSTGRES_CONTAINER=my-postgresdb \
POSTGRES_DB=musicdb \
POSTGRES_USER=postgres \
npm run db:migrate:sprint2h-aa
```

## Doel-Mac testrun 2026-09-27 20:48 — aanleiding Hotfix 1

- Test files: 82 passed, 4 failed (86 totaal).
- Tests: 276 passed, 5 failed (281 totaal).
- Geclassificeerde failures: 1 legacy versieassertion, 2 lokale test-timeouts, 1 accessibility label/input-koppeling, 1 onjuist gescopeerde focusassertion.
- Productiefunctionaliteit van 2H-AA service-tests en statische integratietests was groen.
- Hotfix 1 corrigeert bovenstaande test/accessibilitybevindingen; volledige her-test op doel-Mac vereist.
