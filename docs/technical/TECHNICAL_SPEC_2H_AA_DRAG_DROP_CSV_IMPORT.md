# Technisch ontwerp — Sprint 2H-AA / BL-IMP-135

**Titel:** Drag-and-drop CSV Import Inbox  
**Versie:** **1.2.0**  
**Baseline:** v1.1.0 (2H-Z/HF4)  
**Status:** geïmplementeerd in codesprint v1.2.0

## 1. Architectuur

De huidige `/import`-flow blijft bestaan. De nieuwe upload-inbox wordt als aanvullende laag vóór `importHitlijstCsv()` geplaatst.

```text
Browser (drop/file picker)
        │ multipart/form-data
        ▼
Multer upload middleware
        │
        ▼
importUploadCandidateService
        ├─ type/size/batch validation
        ├─ SHA-256
        ├─ CSV parse + list fingerprint
        ├─ registry duplicate lookup
        ├─ candidate persistence
        └─ temporary file lifecycle
        │
        ▼
ImportPage inbox + per-candidate metadata
        │
        ├─ import één
        └─ import gereedstaande batch
                 │
                 ▼
          bestaande importHitlijstCsv()
                 │
                 ├─ import_run
                 ├─ staging_hitlijsten
                 └─ import_file_registry
```

Belangrijk uitgangspunt: parsing, listfingerprint en registryregels worden niet opnieuw uitgevonden. De nieuwe service gebruikt dezelfde utilities/modelqueries als de bestaande importcontroller.

## 2. Bestaande onderdelen die worden hergebruikt

- `middleware/upload.js` / Multer;
- `utils/fileHash.js`;
- `utils/csvReader.js`;
- `utils/listFingerprint.js`;
- `models/import_file_registry.js`;
- `controllers/importController.js::importHitlijstCsv()`;
- metadata-options voor omroep/periode;
- bestaande duplicate override-semantiek.

Multer is reeds dependency van de applicatie; er is voor de basisupload dus geen nieuwe upload-library nodig.

## 3. Nieuwe service

Geïmplementeerd:

```text
services/importUploadCandidateService.js
```

Verantwoordelijkheden:

- kandidaat aanmaken uit upload;
- veilig tempbestands-id genereren;
- max 25 MB en max 50 bestanden afdwingen;
- CSV analyseren;
- SHA/fingerprint bepalen;
- registrymatch koppelen;
- conceptmetadata valideren en bewaren;
- kandidaatstatus bepalen;
- één kandidaat importeren;
- batchimport sequentieel/foutgeïsoleerd uitvoeren;
- kandidaatbestand verwijderen;
- verlopen kandidaten opruimen.

## 4. Databaseontwerp

Voor refresh-/restartbestendigheid wordt een nieuwe tabel voorgesteld.

```sql
create table import_upload_candidates (
  iuc_key bigserial primary key,
  iuc_upload_id uuid not null unique,
  iuc_source varchar(32) not null,
  iuc_original_file_name text not null,
  iuc_storage_file_name text,
  iuc_file_size bigint not null,
  iuc_file_sha256 char(64),
  iuc_list_fingerprint char(64),
  iuc_row_count integer,
  iuc_status varchar(32) not null,
  iuc_duplicate_type varchar(32),
  iuc_duplicate_registry_key bigint references import_file_registry(ifr_key) on delete set null,
  iuc_duplicate_override boolean not null default false,
  iuc_metadata jsonb not null default '{}'::jsonb,
  iuc_parse_error text,
  iuc_import_error text,
  iuc_import_run_id uuid,
  iuc_created_at timestamptz not null default now(),
  iuc_updated_at timestamptz not null default now(),
  iuc_expires_at timestamptz not null,
  iuc_imported_at timestamptz
);
```

Voorgestelde indexen:

```sql
create index ... on import_upload_candidates(iuc_status);
create index ... on import_upload_candidates(iuc_expires_at);
create index ... on import_upload_candidates(iuc_file_sha256);
create index ... on import_upload_candidates(iuc_list_fingerprint);
```

De definitieve code-migratie wordt bij implementatie idempotent gemaakt en gericht op PostgreSQL in Docker-container `my-postgresdb`, database `musicdb`.

## 5. Status en duplicate-classificatie

Lifecycle-status en duplicate-classificatie worden bewust gescheiden.

Technische lifecycle bijvoorbeeld:

```text
NEW
METADATA_INCOMPLETE
READY
PARSE_ERROR
IMPORT_ERROR
IMPORTED
```

Duplicate-classificatie:

```text
null
EXACT_FILE
SAME_LIST_CONTENT
```

Hierdoor kan een bestand bijvoorbeeld tegelijk `READY` en `SAME_LIST_CONTENT` zijn, maar alleen importeerbaar worden als `iuc_duplicate_override=true`.

## 6. Metadata-opslag

Conceptmetadata wordt als JSONB opgeslagen. Voor v1.2.0 minimaal:

```json
{
  "hl_hitlijst": "Top 2000",
  "hl_uitzendjaar": 2026,
  "omroep_key": 1,
  "periode_key": 5
}
```

Voordeel: toekomstige bestaande formuliervelden kunnen kandidaatgebonden worden toegevoegd zonder voor ieder extra invoerveld een aparte kandidaatkolom te moeten migreren. Server-side validatie blijft leidend.

## 7. Tijdelijke bestanden

Voorgestelde opslag:

```text
uploads/import-candidates/<server-generated-id>.csv
```

Regels:

- nooit `originalFilename` als fysiek opslagpad gebruiken;
- pad altijd server-side construeren binnen één vaste root;
- database bevat alleen de veilige storage-bestandsnaam, niet een door de browser aangeleverd absoluut pad;
- `uploads/` blijft runtime-output en staat in `.gitignore`;
- na succesvolle import wordt het bestand verwijderd en `iuc_storage_file_name` op `null` gezet;
- cleanup controleert altijd dat het opgeloste pad binnen de uploadroot blijft.

## 8. Configuratie

Voorgestelde veilige defaults:

```text
IMPORT_UPLOAD_MAX_FILE_MB=25
IMPORT_UPLOAD_MAX_BATCH_FILES=50
IMPORT_UPLOAD_RETENTION_DAYS=7
IMPORT_UPLOAD_CLEANUP_INTERVAL_MINUTES=60
```

`IMPORT_UPLOAD_TEMP_DIR` kan optioneel configureerbaar zijn; standaard kan de bestaande `uploads/import-candidates` directory worden gebruikt.

## 9. API

Voorgestelde endpoints:

```text
GET    /api/import-candidates
POST   /api/import-candidates                 # multipart, max 50 files
PATCH  /api/import-candidates/:uploadId/metadata
PATCH  /api/import-candidates/:uploadId/duplicate-override
POST   /api/import-candidates/:uploadId/import
POST   /api/import-candidates/import-ready
DELETE /api/import-candidates/:uploadId
DELETE /api/import-candidates                 # cleanup all temporary, confirmation from UI
```

De bestaande `/import` GET blijft pagina-entrypoint en directory-scan ondersteunen.

## 10. Uploadmiddleware

De huidige `uploadCsv.single("csvFile")` is voor directe één-bestandsimport ingericht. Voor 2H-AA komt een aparte multi-upload middleware/config, bijvoorbeeld:

```text
uploadImportCandidates.array("csvFiles", 50)
```

Met:

- `fileSize = 25 * 1024 * 1024`;
- alleen `.csv`;
- unieke server-generated filename;
- foutmapping naar gebruikersvriendelijke per-batch/per-file responses.

## 11. Bulkimport

De backend verwerkt gereedstaande kandidaten initieel **sequentieel**. Dat is geen functionele beperking, maar verlaagt complexiteit en databasebelasting.

Pseudo-flow:

```text
for candidate in READY candidates:
    validate current state
    if duplicate and !override: result=BLOCKED_DUPLICATE; continue
    try:
        result = importHitlijstCsv(...candidate metadata...)
        mark candidate IMPORTED
        delete temp file
    catch:
        mark candidate IMPORT_ERROR
        continue
return aggregate summary
```

Iedere `importHitlijstCsv()` houdt de bestaande eigen database-transactie. Er komt geen transactie om de volledige batch heen.

## 12. Cleanup

`cleanupExpiredImportCandidates()`:

1. selecteert kandidaten met `iuc_expires_at < now()`;
2. verwijdert eventueel tempbestand binnen veilige uploadroot;
3. verwijdert/vervalt kandidaatregistratie;
4. logt aantallen en fouten;
5. mag individuele cleanupfouten isoleren zodat één corrupt record overige cleanup niet stopt.

Aanroep:

- bij serverstart;
- optioneel iedere 60 minuten met unref'd timer zodat shutdown niet wordt geblokkeerd.

Geen cron/container nodig.

## 13. Security en robuustheid

- bestandstype niet alleen op MIME vertrouwen; extensie plus echte CSV-parse;
- path traversal uitsluiten;
- original filename alleen voor display/audit;
- server-side grootte/batchlimiet;
- metadata server-side valideren;
- import endpoints accepteren alleen bestaande kandidaat-id's;
- kandidaatstatus opnieuw controleren bij import (geen vertrouwen op alleen UI-state);
- cleanup/delete mag nooit paden buiten temp-root verwijderen;
- geen wijziging van de originele clientfile mogelijk via browserupload.

## 14. Logging

Minimaal loggen:

- upload batch-id / candidate upload-id;
- bestandnaam, grootte, status;
- SHA/fingerprint alleen waar passend;
- duplicate type;
- metadata validation outcome zonder gevoelige inhoud;
- import run-id bij succes;
- cleanup aantallen;
- foutcode en operation.

## 15. Migratie

Bij codeontwikkeling is de volgende migratie toegevoegd:

```text
scripts/sql/20260927_sprint2h_aa_import_upload_candidates.sql
```

Docker-uitvoering wordt opgenomen als npm-script met standaardvoorbeeld:

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-aa
```

## 16. Geautomatiseerde teststrategie

Nieuwe dekking minimaal:

- service unit tests kandidaatstatus/metadata/duplicate/cleanup;
- route tests voor multipartlimieten en API-state transitions;
- React tests voor dropzone, multi-select, per-bestand metadata en refresh-state;
- bulkimport isolatie;
- security/static tests voor temp-path en release-exclusions;
- regressie directory-scan en bestaande 2H-Z duplicate-flow;
- Playwright E2E voor één en meerdere uploads indien stabiel uitvoerbaar in browser-fixtures.
