# Test execution — 2H-Z Hotfix 2 / v1.1.0

## Uitgevoerd in bouwomgeving
Geslaagd:
- `node --check` op gewijzigde JS service/routes/tests;
- Bash syntaxcheck op `startapp.sh`, `validate-all.sh` en HF2-migratiewrapper;
- TypeScript parser/transpile syntaxcontrole op alle JSX en specifiek `EditPage.jsx` + `StagingDuplicateReview.jsx`;
- pure duplicate-normalisatie/grouping/selection smoke test via Node: geslaagd;
- package.json/package-lock.json JSON- en versiecontrole: beide 1.1.0, inclusief lock root package.

## Niet volledig uitvoerbaar in bouwomgeving
`npm ci` is geprobeerd maar de sandbox kon `registry.npmjs.org` niet resolven (`EAI_AGAIN`). Daardoor konden de echte Vite production build, Vitest-suite en Playwright-suite hier niet worden uitgevoerd.

Dit is een infrastructuurbeperking van de bouwomgeving en geen geslaagde testclaim. Lokaal moeten minimaal worden uitgevoerd:

```bash
npm ci
npm run build:all
npm run test:sprint2h-z-hotfix2
npm run test:all
```

Of via:

```bash
./startapp.sh validate
```
