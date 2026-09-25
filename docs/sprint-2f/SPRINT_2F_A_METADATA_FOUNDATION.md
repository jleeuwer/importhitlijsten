# Sprint 2F-A — Metadatafundament hitlijsten

## Doel
Vastleggen van omroep/zender en muziekperiode/categorie op zowel `staging_hitlijsten` als `hitlijsten`, inclusief initiële seeddata voor de nieuwe hulptabellen.

## Backlog-items
- `BL-IMP-056` — Omroepenbeheer en omroepkoppeling inclusief seeddata
- `BL-IMP-057` — Muziekperiode/decenniumcategorie inclusief seeddata

## Functionele scope

### Omroep / zender
Een hitlijst krijgt een verwijzing naar één omroep/zender. Eén omroep kan meerdere hitlijsten uitzenden.

Nieuwe tabel:
- `public.omroepen`

Belangrijkste velden:
- `omroep_key`
- `omroep_code`
- `omroep_naam`
- `omroep_land`
- `omroep_actief`
- `sort_order`

Seeddata bevat onder andere:
- Onbekend / nog te bepalen
- NPO Radio 2
- Radio Veronica
- Radio 10
- Radio 538
- Qmusic Nederland
- VRT Radio 2
- Studio Brussel
- BBC Radio 1
- BBC Radio 2

### Muziekperiode / categorie
Een hitlijst krijgt één periodecategorie. Decennia zijn gewone periodecategorieën; all-time greatest is geen nepdecennium maar een aparte categorie.

Nieuwe tabel:
- `public.hitlijst_perioden`

Belangrijkste velden:
- `periode_key`
- `periode_code`
- `periode_naam`
- `periode_type`
- `start_jaar`
- `eind_jaar`
- `actief`
- `sort_order`

Seeddata bevat onder andere:
- ONBEKEND
- 50S t/m 20S
- ALLTIME
- JAARLIJST
- THEMA
- GENRE
- OVERIG

## Databasewijzigingen

SQL-script:

```text
scripts/sql/20260425_sprint2f_metadata_foundation.sql
```

Toegevoegd aan `staging_hitlijsten`:
- `omroep_key`
- `periode_key`

Toegevoegd aan `hitlijsten`:
- `omroep_key`
- `periode_key`

Beide tabellen krijgen foreign keys naar respectievelijk:
- `omroepen(omroep_key)`
- `hitlijst_perioden(periode_key)`

Bestaande rijen worden gevuld met de seedwaarde `ONBEKEND`.

## Applicatiewijzigingen

### Import
De importpagina toont dropdowns voor:
- Omroep / zender
- Periode / categorie

De gekozen waarden worden opgeslagen op alle stagingrijen van de nieuwe import-run.

### Edit/API
Nieuwe endpoints:

```text
GET  /api/metadata-options
POST /api/edit/run/:runId/metadata
```

Het POST-endpoint kan de metadata van een bestaande run batchmatig bijwerken op alle stagingrijen.

### Export
De export naar `hitlijsten` neemt de metadata 1-op-1 mee:

```text
staging_hitlijsten.omroep_key  → hitlijsten.omroep_key
staging_hitlijsten.periode_key → hitlijsten.periode_key
```

## Tests
Nieuwe tests:

```text
tests/models/metadata.test.js
tests/models/stagingMetadataInsert.test.js
```

Nieuwe npm-script:

```bash
npm run test:sprint2f-a
```

## Acceptatiecriteria
- De hulptabellen bestaan en bevatten initiële seeddata.
- `staging_hitlijsten` en `hitlijsten` hebben beide `omroep_key` en `periode_key`.
- De importflow kan omroep en periode vastleggen.
- Een bestaande run kan via API metadata krijgen.
- Export neemt metadata over naar `hitlijsten`.
- Bestaande rijen worden niet onbruikbaar door lege metadata.
