# Release Notes — Sprint 2H-X Edit-scherm tabel polish

## Status

Codebouw opgeleverd ter acceptatie.

## Backlog-items

- BL-IMP-121 — Discogs-link in schermtabel clickable maken.
- BL-IMP-122 — Artist-key verwijderen uit zichtbare schermtabel.

## Wijzigingen

- De Edit-tabel toont nu een klikbare Discogs-link wanneer een veilige Discogs-url beschikbaar is.
- Voorkeur bij tonen van de link:
  1. `discogs_release_url`
  2. `discogs_master_url`
  3. veilige raw `hl_discogs_link`
- Alleen HTTPS Discogs-links worden als klikbare externe link gerenderd.
- Externe link gebruikt `target="_blank"` en `rel="noopener noreferrer"`.
- De zichtbare kolom `Artiest key (auto)` is verwijderd uit de hoofdtabel.
- `hl_artist_key` blijft intern beschikbaar voor matching, exportstatus, diagnostics en correctieflows.

## Tests

Toegevoegd:

```text
tests/static_2h_x_edit_table_polish.test.js
tests/react/EditTablePolish.test.jsx
```

De statische regressiecheck is inmiddels opgenomen in de uniforme Vitest-suite:

```bash
npm run test:sprint2h-x
```

Resultaat:

```text
4 tests passed
0 failed
```

De React/Vitest-test is toegevoegd voor de projectomgeving en kan lokaal met geïnstalleerde dependencies worden uitgevoerd via:

```bash
npm run test:sprint2h-x
```

## Database

Geen echte database-migratie nodig. Er is wel een no-op Docker/PostgreSQL marker toegevoegd:

```text
scripts/sql/20260830_sprint2h_x_no_database_migration.sql
scripts/apply_sprint2h_x_noop_migration.sh
```

Uitvoeren:

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-x
```

## Niet gewijzigd

- Geen automatische promotie naar `file_details.fd_discogs`.
- Geen exportmapping-aanpassing.
- Geen wijziging in matchinglogica.
