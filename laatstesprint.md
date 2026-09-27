# Laatste sprint

## 2H-AA — BL-IMP-135 Drag-and-drop CSV Import Inbox

**Versie documentatie:** 1.2.0  
**Versie codesprint:** 1.2.0  
**Baseline:** geaccepteerde Import Hitlijsten v1.1.0 (2H-Z/HF4)  
**Status:** code opgeleverd; Hotfix 1 verwerkt naar aanleiding van volledige `test:all` run; opnieuw gereed voor acceptatietest.

### Functionele kern

- één of meerdere CSV's slepen of via een klikbare bestandsdialoog kiezen;
- directory-scan blijft behouden;
- max. 50 bestanden per batch, 25 MB per bestand;
- per CSV eigen hitlijstnaam, jaar, omroep, periode en overige metadata;
- kandidaten en conceptmetadata blijven na refresh beschikbaar;
- dezelfde duplicatecontrole als 2H-Z;
- individueel importeren of alle gereedstaande kandidaten verwerken;
- bulkfouten zijn geïsoleerd per kandidaat;
- tijdelijke bestanden maximaal 7 dagen bewaren en veilig opruimen.

### Technische implementatie

- persistent kandidaatmodel `import_upload_candidates`;
- multi-file Multer upload;
- veilige storage-id in `uploads/import-candidates`;
- JSONB conceptmetadata;
- hergebruik `sha256File`, CSV parser, `calculateListFingerprint`, registry lookup en `importHitlijstCsv`;
- cleanup bij serverstart en optioneel periodiek;
- PostgreSQL databasevoorbeelden gebruiken `musicdb` en container `my-postgresdb`.

### Documenten

- `docs/requirements/REQUIREMENTS_2H_AA_BL_IMP_135.md`
- `docs/sprint-2h/SPRINT_2H_AA_DRAG_DROP_CSV_IMPORT.md`
- `docs/technical/TECHNICAL_SPEC_2H_AA_DRAG_DROP_CSV_IMPORT.md`
- `docs/testcases/FUNCTIONAL_TEST_CASES_2H_AA_DRAG_DROP_CSV_IMPORT.md`

### Database

De codesprint bevat `scripts/sql/20260927_sprint2h_aa_import_upload_candidates.sql` en `scripts/apply_sprint2h_aa_import_upload_candidates.sh`. Uitvoering: `POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-aa`. Documentatie en code gebruiken beide **v1.2.0**.


### Hotfix 1 — test stability

Na de eerste volledige v1.2.0 testrun zijn vijf testfouten gecorrigeerd: legacy versieassertion, twee lokale timeouts, directory-label accessibility en kandidaat-focus testscoping. Applicatieversie en documentatiesprint blijven **1.2.0**. Geen nieuwe database-migratie.


### Hotfix 2 — candidate metadata PATCH SQL typing

Tijdens functioneel testen van de nieuwe drag-and-drop/file-picker flow gaf het opslaan van kandidaatmetadata via `PATCH /api/import-candidates/:uploadId/metadata` PostgreSQL-fout `inconsistent types deduced for parameter $3`. De statusparameter wordt nu in beide SQL-contexten expliciet als `varchar(32)` gecast. Hierdoor kunnen hitlijstnaam, jaar, omroep en periode weer afzonderlijk per kandidaat worden opgeslagen. Geen database-migratie nodig; versie blijft **1.2.0**.
