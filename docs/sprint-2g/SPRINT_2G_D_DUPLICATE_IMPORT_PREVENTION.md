# Sprint 2G-D — Duplicate import prevention op fysieke filename

## Doel

Voorkomen dat fysieke audiobestanden dubbel worden geïmporteerd. De duplicate-detectie gebruikt nadrukkelijk **niet** artiest + titel, omdat meerdere versies van dezelfde song toegestaan moeten blijven. De primaire sleutel voor duplicate-detectie is de genormaliseerde fysieke bestandsnaam zoals die in `fd_file_name` wordt opgeslagen.

## Functionele regels

Een importregel wordt als duplicate beschouwd wanneer:

1. `staging_hitlijsten.fd_file_name` gevuld is en dezelfde genormaliseerde bestandsnaam al voorkomt in `file_details.fd_file_name`; of
2. dezelfde genormaliseerde bestandsnaam meerdere keren voorkomt binnen dezelfde import-run. Bij duplicates binnen dezelfde run blijft de eerste rij ongemoeid en worden volgende rijen als duplicate gezien.

Normalisatie:

- trim
- case-insensitive
- backslash naar slash
- whitespace compact maken

## Bulkactie

In het Edit-scherm is toegevoegd:

```text
Zet duplicates op Skip (<count>)
```

Na bevestiging worden alle duplicate stagingregels in de actieve run gezet op:

```text
fd_action = 'Skip'
```

`Skip` betekent: niet exporteren/importeren. Dit is logischer dan `Delete`, omdat de song in deze fase nog niet definitief in de database is geïmporteerd.

## Export- en matchinggedrag

- Stagingregels met `fd_action = 'Skip'` tellen niet mee voor export naar `hitlijsten`.
- Stagingregels met `fd_action = 'Skip'` tellen niet mee voor exportstatus, jaarverrijking en SongSpelling/file_details fallback.
- `file_details` records met `fd_action` `Delete`, `Duplicates` of `Skip` worden niet meer gebruikt als actieve matches voor title/artist matching.

## Databasewijziging

Nieuwe migratie:

```bash
DB_CONTAINER_NAME=my-postgresdb MIGRATION_MODE=docker npm run db:migrate:sprint2g-d 2>&1 | tee "logs/db-migrate-sprint2g-d-$(date +%Y%m%d-%H%M%S).log"
```

Toegevoegd aan `staging_hitlijsten`:

```sql
fd_file_name text
fd_action text
```

Daarnaast zijn indexen toegevoegd voor duplicate-detectie en actie-filtering.

## CSV-import

De import blijft werken met de bestaande headers:

```text
artiest,song,jaar
```

Voor duplicate-detectie kan optioneel een bestandsnaamkolom worden toegevoegd met één van deze headers:

```text
fd_file_name, filename, file_name, bestand, bestandsnaam, file, path, filepath, file_path
```

## API

Nieuwe endpoints:

```text
GET  /api/edit/run/:runId/duplicate-import-summary
POST /api/edit/run/:runId/duplicates/skip
```

## Tests

Nieuw:

```text
tests/services_duplicateImportService.test.js
tests/react/EditDuplicateImportSkip.test.jsx
```

Testcommando:

```bash
mkdir -p logs
npm run test:sprint2g-d 2>&1 | tee "logs/test-sprint2g-d-$(date +%Y%m%d-%H%M%S).log"
```

Regressie:

```bash
mkdir -p logs
{
  echo "=== test:sprint2g-d ==="
  npm run test:sprint2g-d

  echo "=== test:sprint2g ==="
  npm run test:sprint2g

  echo "=== test:sprint2f ==="
  npm run test:sprint2f

  echo "=== test:sprint2d ==="
  npm run test:sprint2d
} 2>&1 | tee "logs/test-regression-2g-d-$(date +%Y%m%d-%H%M%S).log"
```

## Acceptatiecriteria

- Duplicate-detectie gebruikt fysieke filename, niet artiest + titel.
- Meerdere versies van dezelfde artiest + titel blijven toegestaan wanneer de bestandsnaam verschilt.
- Duplicates tegenover `file_details` worden herkend.
- Duplicates binnen dezelfde import-run worden herkend.
- Bulkactie zet duplicate stagingregels op `fd_action = 'Skip'`.
- Export naar `hitlijsten` negeert `Skip`-regels.
- Actieve file_details matching negeert `Delete`, `Duplicates` en `Skip`.
