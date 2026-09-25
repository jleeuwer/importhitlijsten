# Release notes — Sprint 2H-L Fix 1

## Find-cmd export

- `set -euo pipefail` is verwijderd uit het gegenereerde Export Find-cmd script.
- `export TARGET=...` wordt nu als gequote waarde gegenereerd, bijvoorbeeld `export TARGET="/pad/naar/map"`.

## Discogs bekeken-markering

- De **Bekeken**-markering gebruikt nu een stabiele sleutel op basis van `type:id`.
- Releases met een `masterId` blijven release-resultaten en markeren niet meer meerdere/alle rijen als bekeken.

## Tests

Nieuw script:

```bash
npm run test:sprint2h-l-fix1
```

Uitgevoerde regressies:

```bash
npm run test:sprint2h-l-fix1
npm run test:sprint2h-l
npm run build
```
