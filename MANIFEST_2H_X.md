# Manifest — Sprint 2H-X Edit-scherm tabel polish codebouw

## Type oplevering

Volledige codebase copy-over ZIP, gebaseerd op de aangeleverde actuele `project.zip` en samengevoegd met de 2H-X documentatiesprint.

## Backlog-items

- BL-IMP-121 — Discogs-link in schermtabel clickable maken.
- BL-IMP-122 — Artist-key verwijderen uit zichtbare schermtabel.

## Gewijzigde/toegevoegde code

```text
src/ui/pages/EditPage.jsx
```

## Toegevoegde tests

```text
tests/react/EditTablePolish.test.jsx
tests/static_2h_x_edit_table_polish.test.js
```

## Package scripts

```text
package.json
package.2h-x.scripts.json
```

Nieuwe scripts:

```text
test:sprint2h-x
db:migrate:sprint2h-x
```

## Database/no-op migratie

```text
scripts/sql/20260830_sprint2h_x_no_database_migration.sql
scripts/apply_sprint2h_x_noop_migration.sh
```

Er is geen echte databasewijziging nodig; de no-op migratie is toegevoegd voor Docker/PostgreSQL releasebeheer.

## Documentatie

```text
docs/backlog/BL-IMP-121.md
docs/backlog/BL-IMP-122.md
docs/backlog/BACKLOG_2H_X_UPDATE.md
docs/sprint-2h/SPRINT_2H_X_EDIT_TABLE_POLISH.md
docs/functional/FUNCTIONAL_SPEC_2H_X_EDIT_TABLE_POLISH.md
docs/technical/TECHNICAL_SPEC_2H_X_EDIT_TABLE_POLISH.md
docs/testcases/FUNCTIONAL_TEST_CASES_2H_X_EDIT_TABLE_POLISH.md
docs/integration/2H_X_CODE_INTEGRATION_NOTES.md
Release Notes/RELEASE_NOTES_2H_X_EDIT_TABLE_POLISH.md
README.md
laatstesprint.md
MANIFEST_2H_X.md
```

## Niet in scope

- Automatische promotie naar `file_details.fd_discogs`.
- Exportmapping aanpassen.
- Matchinglogica wijzigen.
- Echte database-mutatie.
