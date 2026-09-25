# Release notes — Sprint 2H-Y codebouw

## Type

Volledige codebouwoplevering.

## Samenvatting

Sprint 2H-Y hardent de export- en datakwaliteitsflow rond `file_details` matching, Discogs-links en encoding/status-repair.

## Opgeleverd

- Ambigue `file_details`-matches blokkeren export/samenstelling.
- Variant-aware matching gebruikt `hl_desired_song_type_key` als extra filter wanneer beschikbaar.
- Export kiest niet meer stilzwijgend de eerste kandidaat wanneer er meerdere `file_details`-matches zijn.
- Discogs-links worden expliciet als hitlijstmetadata behandeld.
- Safe raw `hl_discogs_link` fallback wordt alleen voor HTTPS Discogs master/release links gebruikt.
- Geen automatische promotie naar `file_details.fd_discogs`.
- Encoding/text batchrepair geeft intern expliciete overwrite-confirmatie mee.
- API-errors onder `/api/*` geven JSON terug in plaats van stacktrace-tekst.
- Docker/PostgreSQL-vriendelijke marker/comment migration en diagnostische scripts toegevoegd.
- Functionele testcases en automatische testscripts bijgewerkt.

## Database

Geen destructieve schemawijziging. Uitvoeren:

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-y
```

## Tests

```bash
npm run test:sprint2h-y
```
