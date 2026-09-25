# Release Notes — 2G-E Hotfix 3 startapp-script

## Aanpassing

Het bestaande `startapp.sh` script is vervangen door de door de gebruiker gevalideerde versie.

## Gedrag

Het script:

- verwijdert `node_modules` en `package-lock.json`;
- maakt `logs/` aan;
- draait `npm run install:all`;
- draait `npm run build:all`;
- draait `npm run validate`;
- draait `npm run test:e2e`;
- start daarna `npm run dev:5174`;
- schrijft alle output naar timestamped logbestanden in `logs/`.

## Validatie

Het script is opgenomen in de bundle-root en uitvoerbaar gemaakt met `chmod +x startapp.sh`.
