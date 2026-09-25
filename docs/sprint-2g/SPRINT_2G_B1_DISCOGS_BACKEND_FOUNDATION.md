# Sprint 2G-B1 — Discogs database + backendfundament

## Doel

Deze sprint legt het technische fundament voor Discogs-verrijking zonder de volledige UI-selectieflow al te bouwen.

De sprint realiseert:

- gestructureerde Discogs-velden op `staging_hitlijsten` en `hitlijsten`;
- docker-proof migratie;
- server-side Discogs search client;
- tijdelijke in-memory cache;
- endpoint voor Discogs zoeken;
- endpoint om een gekozen Discogs master/release op een stagingrij op te slaan;
- exportmapping van staging naar `hitlijsten`.

## Niet in scope

- resultatenmodal in de Edit-pagina;
- filter-UX in de browser;
- automatische selectie van de beste Discogs-match;
- verplichte Discogs-koppeling voor export.

## Databasevelden

Toegevoegd aan zowel `staging_hitlijsten` als `hitlijsten`:

- `discogs_master_id`
- `discogs_master_url`
- `discogs_master_title`
- `discogs_master_artist`
- `discogs_master_year`
- `discogs_release_id`
- `discogs_release_url`
- `discogs_release_title`
- `discogs_release_format`
- `discogs_release_country`
- `discogs_release_year`
- `discogs_selected_at`

Het bestaande `hl_discogs_link` blijft behouden als legacy/handmatige link. Bij selectie wordt deze gevuld met de master-URL, of anders met de release-URL.

## API-endpoints

### Discogs zoeken

```http
GET /api/discogs/search?artist=Nirvana&title=Smells%20Like%20Teen%20Spirit&type=master
```

Ondersteunde queryparameters:

- `artist`
- `title`
- `type`: `master` of `release`
- `format`
- `year`
- `country`
- `page`
- `perPage`

### Discogs-selectie opslaan

```http
POST /api/edit/staging/:runId/:hlPositie/discogs
```

Voorbeeld payload:

```json
{
  "discogs_master_id": 123,
  "discogs_master_url": "https://www.discogs.com/master/123",
  "discogs_master_title": "Smells Like Teen Spirit",
  "discogs_master_artist": "Nirvana",
  "discogs_master_year": 1991,
  "discogs_release_id": 456,
  "discogs_release_url": "https://www.discogs.com/release/456",
  "discogs_release_format": "Single",
  "discogs_release_country": "Europe",
  "discogs_release_year": 1991
}
```

## Exportmapping

Bij export worden de Discogs-velden meegenomen:

```text
staging_hitlijsten.discogs_* -> hitlijsten.discogs_*
```

Discogs blijft optioneel. Een ontbrekende Discogs-koppeling blokkeert export niet.

## Configuratie

Voorgestelde `.env` waarden:

```env
DISCOGS_USER_TOKEN=...
DISCOGS_USER_AGENT=Importhitlijst/2G-B1 local-dev
DISCOGS_BASE_URL=https://api.discogs.com
DISCOGS_CACHE_TTL_SECONDS=21600
DISCOGS_REQUEST_TIMEOUT_MS=10000
```

## Migratie

Docker-proof migratie:

```bash
DB_CONTAINER_NAME=my-postgresdb MIGRATION_MODE=docker npm run db:migrate:sprint2g-b1 2>&1 | tee "db-migrate-sprint2g-b1-$(date +%Y%m%d-%H%M%S).log"
```

## Tests

Sprinttest:

```bash
npm run test:sprint2g-b1 2>&1 | tee "test-sprint2g-b1-$(date +%Y%m%d-%H%M%S).log"
```

Regressieadvies:

```bash
{
  echo "=== test:sprint2g-b1 ==="
  npm run test:sprint2g-b1

  echo "=== test:sprint2g ==="
  npm run test:sprint2g

  echo "=== test:sprint2f ==="
  npm run test:sprint2f

  echo "=== test:sprint2d ==="
  npm run test:sprint2d

  echo "=== test:validation:2d-a ==="
  npm run test:validation:2d-a
} 2>&1 | tee "test-regression-2g-b1-$(date +%Y%m%d-%H%M%S).log"
```
