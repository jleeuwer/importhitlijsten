# Release Notes — Sprint 2H-W Build/startapp hardening

## Type

Codebouw-oplevering.

## Backlog

- BL-IMP-088 — Install/build/test validatie professionaliseren
- BL-IMP-132 — `startapp.sh` gelijk trekken met robuuste Artist-opzet

## Wijzigingen

- Nieuw definitief `startapp.sh` onder de standaardnaam.
- Startscript is commandogestuurd en voert zonder argumenten niets uit.
- Ondersteuning voor:
  - `install`
  - `build`
  - `validate`
  - `test`
  - `dev`
  - `all`
  - `--commands`
  - `--keep-days`
  - `--continue-on-error`
- `dev` blijft laatste taak.
- Preflight-script toegevoegd.
- Package-script-updater toegevoegd.
- Automatische statische tests toegevoegd.

## Database

Geen database-migratie nodig.

## Acceptatie

Voer uit:

```bash
node scripts/apply_2h_w_package_scripts.js
npm run preflight:2h-w
npm run test:sprint2h-w
./startapp.sh --help
./startapp.sh --commands build,validate,test
```
