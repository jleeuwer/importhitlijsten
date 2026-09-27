# Release Notes — Import Hitlijsten 2H-AA v1.2.0

**Work item:** 2H-AA / BL-IMP-135  
**Release type:** feature / minor  
**Baseline:** v1.1.0 (2H-Z/HF4, geaccepteerd)  
**Status:** code opgeleverd; functionele acceptatie open

## Nieuw

- Drag-and-drop van één of meerdere CSV-bestanden.
- Klikbare multi-file picker als alternatief voor slepen.
- Bestaande directory-scan blijft volledig beschikbaar.
- Maximaal 50 bestanden per batch en 25 MB per CSV.
- Persistente tijdelijke kandidaten die browser-refresh overleven.
- Eigen conceptmetadata per lijst: hitlijstnaam, jaar, omroep en periode.
- Hergebruik van 2H-Z SHA-256 en semantic list-fingerprint duplicatecontrole.
- Expliciete duplicate override; nooit stilzwijgend opnieuw importeren.
- Individuele import en `Importeer alle gereedstaande lijsten`.
- Bulkimport is per kandidaat transactioneel en foutgeïsoleerd.
- Resultaatssamenvatting voor successen, blocked duplicates en fouten.
- Individuele cleanup, delete-all met bevestiging en automatische 7-daagse cleanup.

## Database

Nieuwe tabel `public.import_upload_candidates` via:

```bash
POSTGRES_CONTAINER=my-postgresdb \
POSTGRES_DB=musicdb \
POSTGRES_USER=postgres \
npm run db:migrate:sprint2h-aa
```

Migratiebestand:

```text
scripts/sql/20260927_sprint2h_aa_import_upload_candidates.sql
```

## Testen

```bash
npm run test:sprint2h-aa
./startapp.sh test
```

De documentatiesprint en codesprint gebruiken beide versie **1.2.0**.


## Pre-acceptance Hotfix 1
Zie `RELEASE_NOTES_2H_AA_HOTFIX1_v1.2.0.md` voor teststabiliteit en accessibility-correcties binnen dezelfde v1.2.0 release.
