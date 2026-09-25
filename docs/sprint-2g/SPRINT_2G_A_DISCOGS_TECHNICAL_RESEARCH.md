# Importhitlijst — Sprint 2G-A Discogs technisch onderzoek

## Status
- Sprint: 2G-A
- Backlog: BL-IMP-059
- Status: Done / ontwerp gereed
- Datum: 2026-04-25
- Type: onderzoeks- en ontwerpsprint, nog geen runtime-implementatie

## Doel
Vastleggen hoe Importhitlijst Discogs veilig, snel en onderhoudbaar gaat integreren voordat we de implementatie bouwen in Sprint 2G-B.

## Externe uitgangspunten
- Discogs API v2 is een REST API met JSON voor objecten zoals Artists, Releases en Masters.
- Rate limits moeten server-side worden bewaakt. De Discogs-documentatie noemt 60 requests/minuut voor authenticated requests en 25 requests/minuut voor unauthenticated requests.
- Discogs API Terms of Use bevatten beperkingen rond caching/opslag en eisen rond attribution als Discogs-data zichtbaar wordt gebruikt.

## Architectuurbesluit
De React UI roept Discogs niet rechtstreeks aan. We gebruiken een server-side proxy:

```text
React Edit Page -> Importhitlijst backend -> Discogs client/service -> Discogs API
```

Voordelen:
- `DISCOGS_USER_TOKEN` blijft server-side in `.env`.
- Rate limiting en retries kunnen centraal worden geregeld.
- Resultaten kunnen genormaliseerd worden voordat de UI ze ziet.
- Tests kunnen Discogs volledig mocken.

## Endpoint-keuze

### Zoeken
Eerste zoekstrategie:

```text
GET /database/search?q=<artist> <title>&type=master&per_page=10&page=1
```

Fallback of aanvullende zoekstrategie:

```text
GET /database/search?q=<artist> <title>&type=release&per_page=10&page=1
```

### Details
Bij selectie of preview:

```text
GET /masters/{master_id}
GET /releases/{release_id}
```

## Zoekquery
De standaardquery komt uit de stagingrij:

```text
<correcte artiest> <correcte titel>
```

Bronnen:
- artiest: `as_correcte_artiest_spelling`, fallback `hl_artiest`
- titel: `fd_tag_title`, fallback `hl_titel_song`

## Filters in de resultatenmodal
Voor Sprint 2G-B adviseren we:

| Filter | Waarden/gebruik |
|---|---|
| Result type | Master, Release, beide |
| Format | Album, Single, Maxi-Single, EP, 12", 7", CD |
| Jaar | exact of rondom `hl_jaar` |
| Land | NL, BE, UK, US, DE, etc. |
| Tekstfilter | binnen titel/artiest/resultaten |

Niet elk filter hoeft door Discogs server-side ondersteund te zijn. De backend mag breder ophalen en de UI mag client-side filteren op genormaliseerde velden.

## Genormaliseerde responsevorm
De backend geeft Discogs-resultaten in een eigen applicatievorm terug:

```json
{
  "resultId": "master:12345",
  "discogsType": "master",
  "discogsId": 12345,
  "title": "Smells Like Teen Spirit",
  "artist": "Nirvana",
  "displayTitle": "Nirvana - Smells Like Teen Spirit",
  "year": 1991,
  "country": null,
  "formats": ["Single"],
  "label": null,
  "thumb": "https://...",
  "resourceUrl": "https://api.discogs.com/masters/12345",
  "discogsUrl": "https://www.discogs.com/master/12345",
  "confidence": 0.82,
  "confidenceReasons": ["artist match", "title match", "year near hl_jaar"]
}
```

Confidence mag helpen sorteren, maar de app kiest nooit automatisch zonder gebruikerbevestiging.

## Opslagbesluit
- Master is de primaire Discogs-koppeling.
- Release is optioneel, voor een concrete single/EP/albumuitgave.
- Zowel ids als URL's worden opgeslagen.
- `hl_discogs_link` blijft voorlopig bestaan als legacy/handmatige link.
- Discogs-verrijking blijft optioneel en blokkeert export niet.

## Voorgestelde velden voor Sprint 2G-B
Toevoegen aan `staging_hitlijsten` en `hitlijsten`:

```text
discogs_master_id BIGINT NULL
discogs_master_url TEXT NULL
discogs_master_title TEXT NULL
discogs_master_artist TEXT NULL
discogs_master_year INT NULL

discogs_release_id BIGINT NULL
discogs_release_url TEXT NULL
discogs_release_title TEXT NULL
discogs_release_format TEXT NULL
discogs_release_country TEXT NULL
discogs_release_year INT NULL

discogs_selected_at TIMESTAMP NULL
discogs_selected_by TEXT NULL
```

## Exportmapping
Bij export:

```text
staging_hitlijsten.discogs_* -> hitlijsten.discogs_*
```

Ontbrekende Discogs-data is geen blocker.

## Cachingstrategie
We onderscheiden:

| Data | Opslag | Doel |
|---|---|---|
| Zoekresultaten | tijdelijke cache | minder API-calls en snellere UI |
| Gekozen koppeling | structureel in staging/hitlijsten | functionele metadata |

Startadvies voor 2G-B:
- in-memory LRU-cache;
- TTL maximaal 6 uur;
- cache key op genormaliseerde query + filters;
- response bevat `cacheHit` voor debug.

Eventuele latere DB-cache:

```text
discogs_search_cache(cache_key, query_text, filters_json, response_json, created_at, expires_at)
```

## Rate limiting en foutafhandeling
Server-side client moet omgaan met:
- HTTP 429;
- timeout;
- ontbrekende tokenconfiguratie;
- niet-succesvolle Discogs-responses;
- beperkte retry met backoff, geen browser-retry-loop.

Voorgestelde `.env`:

```env
DISCOGS_USER_TOKEN=...
DISCOGS_USER_AGENT=Importhitlijst/2G-B +local
DISCOGS_BASE_URL=https://api.discogs.com
DISCOGS_CACHE_TTL_SECONDS=21600
DISCOGS_REQUEST_TIMEOUT_MS=10000
DISCOGS_RATE_LIMIT_SAFETY_MARGIN=5
```

## Voorgestelde Importhitlijst endpoints voor 2G-B

```text
POST /api/edit/run/:runId/rows/:positie/discogs/search
POST /api/edit/run/:runId/rows/:positie/discogs/select
```

Optioneel later:

```text
GET /api/discogs/masters/:masterId
GET /api/discogs/releases/:releaseId
```

## UX-flow voor 2G-B
1. Gebruiker opent Edit via Runs.
2. Gebruiker kan met de bestaande copyactie `<artiest> - <titel>` kopiëren.
3. Naast Discogs-link komt `Zoek Discogs`.
4. Resultatenmodal opent met standaardquery.
5. Gebruiker filtert en kiest één resultaat.
6. Gekozen key + URL worden in staging opgeslagen.
7. Export neemt Discogs-velden mee naar `hitlijsten`.

## Teststrategie voor 2G-B
Backend:
- Discogs client met gemockte fetch;
- search normaliseert master- en release-resultaten;
- 429/rate-limit wordt vertaald naar applicatiefout;
- ontbrekende token geeft configureerbare fout;
- select endpoint update precies één rij op `hl_import_run_id + hl_positie`;
- exportmapping neemt Discogs-velden mee.

React:
- `Zoek Discogs` opent modal;
- resultaten en filters werken;
- selectie schrijft gekozen resultaat naar rij;
- fouten blijven zichtbaar;
- handmatige `hl_discogs_link` blijft bruikbaar.

## Besluit voor Sprint 2G-B
Sprint 2G-B wordt bij voorkeur opgesplitst:

### 2G-B1 — Database + backendfundament
- docker-proof DDL voor Discogs-velden;
- server-side Discogs client;
- search endpoint met mocks/tests;
- select endpoint;
- exportmapping.

### 2G-B2 — UI-selectieflow
- knop in Edit-rij;
- resultatenmodal;
- filters;
- selectie en opslag;
- feedback/toast.
