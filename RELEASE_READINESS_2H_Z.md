# Release readiness — 2H-Z v1.1.0 Hotfix 3

## Bekende releasegegevens

- APP_ID: `importhitlijst`
- APP_NAME: `Import Hitlijsten`
- BASE_VERSION: `1.0.0`
- VERSION: `1.1.0`
- SEMVER_CHANGE: `minor`
- RELEASE_TYPE: `feature`
- WORK_ITEM: `2H-Z-HF3`
- PACKAGE_MODE: `full`
- MIN_SUPPORTED_VERSION: `1.0.0`
- MIGRATIONS_PRESENT: `true` (bestaande 2H-Z + HF2 migraties; geen nieuwe HF3 migratie)

Hotfix 3 blijft onderdeel van de nog niet geaccepteerde feature-release 1.1.0; daarom blijft RELEASE_TYPE `feature` en wordt geen 1.1.1 gemaakt.

## Nog niet resolveerbaar zonder Git/.release discovery

De Import Hitlijsten-codebasis heeft nog geen door release-tools ontdekte Git/.release baseline. Daarom worden deze waarden bewust niet verzonnen:

- BASE_BRANCH
- BASE_COMMIT
- CURRENT_BRANCH
- WORKTREE_STATUS

Een definitief door release-tools valideerbaar releasepackage kan pas worden afgerond nadat Git en `.release` zijn ingericht.

## Technische checks

- package.json versie: 1.1.0
- package-lock.json versie: 1.1.0
- package-lock root package versie: 1.1.0
- dependency bootstrap: `npm ci`
- package mode: full
- `startapp.sh test` → `test:all`
- alle niet-E2E tests onder Vitest
- Playwright blijft de E2E-runner
- actuele PostgreSQL default: `musicdb`
- package zonder node_modules/dist/logs/.git/.release/live .env

## release.manifest

De niet-resolveerbare discoveryvelden blijven expliciet `UNRESOLVED_NO_GIT` en `RELEASE_STATUS=BLOCKED_PENDING_GIT_DISCOVERY`. Dit is bewust geen verzonnen branch/commit en moet vóór een echte release-tools install vervangen worden door discovery-uitkomsten.
