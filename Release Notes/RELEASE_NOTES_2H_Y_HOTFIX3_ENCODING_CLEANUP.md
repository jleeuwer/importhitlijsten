# Release Notes — Sprint 2H-Y Hotfix 3

## Samenvatting

Deze hotfix corrigeert een foutieve encoding-warning na handmatig herstellen van een hitlijstregel.

## Gewijzigd

- `utils/textFixes.js`
  - `detectEncodingDamage()` aangescherpt.
  - Algemene normalisatieverschillen worden niet meer als encoding-schade gezien.
  - Regex-detectie voor globale mojibakepatronen is deterministischer gemaakt door `lastIndex` te resetten.
- `tests/services_editEncodingRepairService.test.js`
  - Regressietest toegevoegd voor schone manual repair tekst.
- `tests/services_editManualCorrectionService.test.js`
  - Regressietest toegevoegd voor `file_details` gedreven manual repair met schone diagnostiek.
- `tests/static_2h_y_hotfix3_encoding_cleanup.test.js`
  - Statische guard toegevoegd.
- `scripts/sql/20260908_sprint2h_y_hotfix3_no_database_migration.sql`
  - No-op migratiemarker.
- `scripts/run_2h_y_hotfix3_migration.sh`
  - Docker/PostgreSQL runner voor de no-op marker.

## Database

Geen schemawijziging nodig.

## Testen

```bash
npm run test:sprint2h-y-hotfix3
npm run test:sprint2h-y
npm run validate
```
