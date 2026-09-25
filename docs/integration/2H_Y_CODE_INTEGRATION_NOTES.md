# Integratienotities — Sprint 2H-Y codebouw

## Verwachte raakvlakken

Tijdens de latere codebouw moeten waarschijnlijk deze delen worden geraakt:

```text
services/*match*
services/*export*
services/*discogs*
services/*encoding*
services/*validation*
controllers/importController.js
controllers/editController.js
src/ui/pages/EditPage.jsx
src/ui/components/*
scripts/sql/*
tests/*
```

## Database / Docker

Migraties moeten uitvoerbaar zijn tegen de lokale PostgreSQL-container. Documenteer standaard met:

```bash
POSTGRES_CONTAINER=my-postgresdb
```

Voorbeeldrichting:

```bash
docker exec -i my-postgresdb psql -U postgres -d muziek < scripts/sql/<migration>.sql
```

De exacte database, user en database naam moeten aansluiten op het project `.env` of bestaande scripts.

## Teststrategie

Aanbevolen lagen:

1. Unit tests voor matching/statusclassificatie.
2. Service tests voor Discogs-link mapping.
3. API tests voor export guards en repair preview/apply.
4. UI tests voor ambiguity/warning/statusweergave.
5. Migratietest of schema smoke test.

## Volgorde codebouw

1. Schema/diagnostic inspectie.
2. Candidate ambiguity guard.
3. Discogs lifecycle diagnostic/mapping.
4. Statusclassificatie met blocking/non-blocking onderscheid.
5. Repair preview/apply.
6. UI-integratie.
7. Geautomatiseerde tests.
