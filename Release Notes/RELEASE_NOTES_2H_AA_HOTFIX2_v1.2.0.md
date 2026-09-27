# Release Notes — 2H-AA Hotfix 2 — v1.2.0

## Bevinding
Bij het opslaan van metadata via de nieuwe drag-and-drop/file-picker importflow kon PostgreSQL HTTP 500 retourneren met `inconsistent types deduced for parameter $3`.

## Oorzaak
Dezelfde prepared-statementparameter `$3` werd gebruikt voor zowel een `varchar(32)` statuskolom als een losse vergelijking met het tekstliteral `READY`. PostgreSQL kon daardoor verschillende types voor dezelfde parameter afleiden.

## Correctie
Beide SQL-contexten gebruiken nu expliciet `varchar(32)`. De functionele flow en databasestructuur wijzigen niet.

## Testen
- nieuw: `tests/models_importUploadCandidateMetadataSql.test.js`;
- nieuw: `tests/static_2h_aa_hotfix2_candidate_metadata_sql.test.js`;
- script: `npm run test:sprint2h-aa-hotfix2`;
- daarna volledige suite via `./startapp.sh test`.

## Database
Geen nieuwe migratie. Indien de oorspronkelijke 2H-AA migratie nog niet is toegepast: `POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-aa`.
