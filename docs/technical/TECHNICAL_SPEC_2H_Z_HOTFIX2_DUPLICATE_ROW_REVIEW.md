# Technisch ontwerp — 2H-Z Hotfix 2 / BL-IMP-136

## Componenten

### Service
`services/stagingDuplicateRowService.js`

Verantwoordelijkheden:
- tekstnormalisatie;
- duplicategroepen opbouwen;
- veilige selectie valideren;
- geselecteerde regels op `Skip` zetten;
- geselecteerde regels geaudit fysiek verwijderen;
- `ir_row_count` na fysieke delete herstellen.

### API

```text
GET  /api/edit/run/:runId/staging-duplicates
POST /api/edit/run/:runId/staging-duplicates/skip
POST /api/edit/run/:runId/staging-duplicates/delete
```

Skip body:

```json
{"stagingKeys":[101,102]}
```

Physical-delete body:

```json
{"stagingKeys":[101,102],"confirmPhysicalDelete":true}
```

De server accepteert fysieke delete alleen wanneer `confirmPhysicalDelete === true`.

### UI
`src/ui/components/StagingDuplicateReview.jsx`

De component:
- start de scan;
- opent een reviewmodal;
- selecteert standaard alle extra regels behalve de voorgestelde bewaarrij;
- laat de selectie wijzigen;
- valideert dat minimaal één rij per groep blijft bestaan;
- biedt Skip en fysieke delete aan.

### Database
Migratie: `scripts/sql/20260925_sprint2h_z_hotfix2_duplicate_row_review.sql`.

Nieuwe kolom:

```text
public.staging_hitlijsten.sh_key bigint not null
```

Unieke index:

```text
ux_staging_hitlijsten_sh_key
```

Nieuwe audittabel bevat:
- audit key;
- import-run-id;
- oorspronkelijke staging key;
- positie;
- artiest;
- titel;
- fd_action;
- reden;
- delete timestamp.

Geen foreign key vanaf de auditregel naar de verwijderde stagingregel, omdat de referentie na fysieke delete per definitie niet meer bestaat.

## Transactie physical delete

```text
BEGIN
  actuele duplicategroepen opnieuw bepalen
  selectie opnieuw valideren
  audit INSERT ... SELECT
  DELETE geselecteerde stagingregels
  import_runs.ir_row_count opnieuw tellen
COMMIT
```

Bij iedere fout volgt rollback.

## Testflow
`startapp.sh test` verwijst naar `test:all`.

`validate-all.sh` voert nog slechts één volledige keten uit:

```text
install:all -> build:all -> test:all
```

Hierdoor verdwijnen de oude dubbele sprint-specifieke testruns uit validate.
