# Code-integratie — Sprint 2H-X Edit-scherm tabel polish

## Type oplevering

Deze oplevering is een volledige codebase copy-over ZIP, gebaseerd op `project.zip` en aangevuld met de 2H-X documentatiesprint.

## Backlog-items

- BL-IMP-121 — Discogs-link in schermtabel clickable maken.
- BL-IMP-122 — Artist-key verwijderen uit zichtbare schermtabel.

## Codewijzigingen

### Frontend

Bestand:

```text
src/ui/pages/EditPage.jsx
```

Toegevoegd:

```text
isSafeDiscogsExternalUrl(value)
resolveDiscogsTableLink(row, local)
```

Gedrag:

1. De tabel kiest eerst `discogs_release_url`.
2. Als die ontbreekt kiest de tabel `discogs_master_url`.
3. Als die ontbreekt wordt een veilige raw `hl_discogs_link` gebruikt.
4. Alleen HTTPS-links naar `discogs.com` of subdomeinen van `discogs.com` worden klikbaar gemaakt.
5. De link gebruikt altijd:

```html
 target="_blank" rel="noopener noreferrer"
```

### Artist-key kolom

De zichtbare hoofdtabel toont geen kolom `Artiest key (auto)` meer.

Belangrijk: `hl_artist_key` blijft intern aanwezig in de row-data en blijft bruikbaar voor matching, exportstatus, diagnostics en correctieflows.

## Testwijzigingen

Toegevoegd:

```text
tests/react/EditTablePolish.test.jsx
tests/static_2h_x_edit_table_polish.test.js
```

Package scripts:

```bash
npm run test:sprint2h-x
```

## Database

Er is geen echte databasewijziging nodig. Voor releasebeheer is wel een no-op marker toegevoegd:

```text
scripts/sql/20260830_sprint2h_x_no_database_migration.sql
scripts/apply_sprint2h_x_noop_migration.sh
```

Docker/PostgreSQL uitvoering:

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-x
```

Pas `POSTGRES_DB` en `POSTGRES_USER` aan als de lokale installatie andere waarden gebruikt.
