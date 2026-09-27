# Release readiness — 2H-AA v1.2.0

## Resolved releaseblok

```text
FORMAT_VERSION=1
APP_ID=importhitlijst
APP_NAME=Import Hitlijsten
BASE_VERSION=1.1.0
VERSION=1.2.0
SEMVER_CHANGE=minor
RELEASE_TYPE=feature
WORK_ITEM=2H-AA
BASE_BRANCH=main
PACKAGE_MODE=full
MIN_SUPPORTED_VERSION=1.1.0
CREATED_DATE=2026-09-27
```

`BASE_BRANCH=main` is gebaseerd op de expliciete bevestiging van de gebruiker in de codesprint-opdracht. De aangeleverde baseline bevat geen `.git`-metadata; een exacte `BASE_COMMIT` kan in deze bouwomgeving daarom niet betrouwbaar worden vastgesteld en wordt niet verzonnen.

## Package-hygiene

- full codebase;
- geen `node_modules`;
- geen `dist`;
- geen logs/test-output;
- geen `.git` of `.release` payload;
- geen live `.env`/secrets;
- database-migratie als broncode aanwezig;
- package.json en package-lock.json op 1.2.0;
- release.manifest en release.sha256 aanwezig.

## Database

```bash
POSTGRES_CONTAINER=my-postgresdb \
POSTGRES_DB=musicdb \
POSTGRES_USER=postgres \
npm run db:migrate:sprint2h-aa
```

## Acceptatie

Na installatie/migratie minimaal:

```bash
npm run build:all
npm run test:sprint2h-aa
./startapp.sh test
```


## Hotfix 1 — 2026-09-27
De volledige doel-Mac run rapporteerde 276 passed / 5 failed. HF1 corrigeert de vijf failures. Gerichte her-test: `npm run test:sprint2h-aa-hotfix1`; daarna `npm run test:all`. In de bouwsandbox kon `npm ci` niet worden voltooid binnen de beschikbare netwerktijd, dus Vitest/Playwright worden niet als lokaal groen geclaimd. BASE_COMMIT blijft onopgelost zonder Git-context.
