# Sprint 2H-H — Discogs zoekmodal UX en enrichment-onderzoek

## Doel

Deze sprint verbetert de Discogs zoekmodal in de Importhitlijst Edit-flow en legt vast hoe Discogs master/release-data later veilig richting `file_details` kan worden gebruikt.

Belangrijk uitgangspunt: deze sprint schrijft geen nieuwe metadata naar `file_details`. De bestaande koppeling van een gekozen Discogs-resultaat aan de stagingregel blijft bestaan.

## Functionele wijzigingen

### Modalcontext

De Discogs modal toont nu bovenaan:

- positie van de stagingregel;
- gekozen zoekartiest;
- gekozen zoektitel;
- run/lijstcontext waar beschikbaar.

Hierdoor is altijd zichtbaar voor welke importregel de gebruiker zoekt.

### Geen standaard Master-filter

De modal zoekt standaard breed. De zoekopdracht naar `/api/discogs/search` stuurt niet langer automatisch `type=master` mee. Daardoor kan Discogs zowel masters als releases teruggeven.

De gebruiker ziet bij openen en na zoeken standaard:

- Type = Alle types;
- Format = Alle formats;
- Jaar = Alle jaren;
- Land = Alle landen.

### Dynamische filters

Na ontvangst van Discogs-resultaten bouwt de frontend de filteropties client-side op uit de ontvangen resultset.

Filters:

- Type;
- Format;
- Jaar;
- Land.

De filters werken lokaal en veroorzaken geen nieuwe API-call. De knop **Reset** zet alle filters terug naar `Alle`.

### Resultatenweergave

De resultatenweergave is compacter gemaakt:

- Actie;
- Type;
- Artiest;
- Titel;
- Jaar;
- Land;
- Format;
- Discogs.

De eerdere labelkolom is bewust niet opgenomen in de hoofdweergave. Label/catalogusnummer past beter in een latere detailinspectie-sprint.

### Master/release onderscheid

Discogs-resultaten tonen een badge:

- Master;
- Release;
- Overig.

Dit onderscheid is belangrijk voor latere enrichment, omdat master-data en release/version-data andere betekenis hebben.

## Enrichment-onderzoek

### Master-data

Master-data hoort functioneel bij het algemene liedje/werk. Voorbeelden:

- master-id;
- master-url;
- hoofdtitel;
- hoofdartiest;
- eerste releasejaar;
- genres/styles.

Mogelijke latere bestemming: song-level metadata en oorspronkelijke uitgavecontext. Dit mag alleen via review.

### Release/version-data

Release-data hoort bij een specifieke uitgave of versie. Voorbeelden:

- release-id;
- release-url;
- releasejaar;
- land;
- format;
- label;
- catalogusnummer;
- tracklist;
- trackduur;
- cover image.

Mogelijke latere bestemming: versiegerichte `file_details`-velden, zoals `fd_year_song_version`, `fd_duration` en `fd_discogs`. Ook dit mag alleen via review.

### Relatie met file_details

`file_details` bevat vaak versie-specifieke records. Daarom mag een Discogs master niet automatisch versievelden vullen. Een release kan beter passen bij versievelden, maar ook dan blijft menselijke beoordeling nodig.

### Toekomstige veilige promote-flow

Voor een latere sprint is de veilige richting:

1. Importhitlijst koppelt een Discogs master/release aan de stagingregel.
2. Een aparte reviewfunctie toont huidige `file_details`-data naast voorgestelde Discogs-data.
3. De gebruiker kiest expliciet welke velden worden overgenomen.
4. De wijziging wordt auditbaar opgeslagen.
5. Automatische update zonder review blijft uitgesloten.

## Technisch ontwerp

### Frontend

Nieuwe helper:

```text
src/ui/utils/discogsResultFilters.js
```

Belangrijkste functies:

- `normalizeDiscogsType(result)`;
- `extractDiscogsFormats(result)`;
- `buildDiscogsFilterOptions(results)`;
- `applyDiscogsFilters(results, filters)`;
- `createEmptyDiscogsFilters()`.

De modal gebruikt `useMemo` voor filteropties en zichtbare resultaten.

### Backend

De backend blijft grotendeels gelijk. De enige functionele wijziging is dat `type` optioneel blijft en niet meer standaard `master` wordt.

Aangepast:

- `routes/indexroutes.js`: `discogsSearchQuerySchema.type` heeft geen default meer;
- `services/discogsClient.js`: `buildDiscogsSearchParams` voegt `type` alleen toe wanneer de caller expliciet een type doorgeeft.

### Database

Geen database-migratie in deze sprint.

## Tests

Nieuwe/gewijzigde tests:

- `tests/react/EditDiscogsFilters.test.jsx`;
- `tests/react/EditDiscogsSelectionFlow.test.jsx`;
- `tests/services_discogsClient.test.js`.

Testscript:

```bash
mkdir -p logs
npm run test:sprint2h-h 2>&1 | tee "logs/test-sprint2h-h-$(date +%Y%m%d-%H%M%S).log"
```

Build:

```bash
mkdir -p logs
npm run build 2>&1 | tee "logs/build-sprint2h-h-$(date +%Y%m%d-%H%M%S).log"
```

## Acceptatiecriteria

- Discogs modalheader toont positie, artiest en titel.
- Discogs search stuurt standaard geen `type=master` meer mee.
- Type/Format/Jaar/Land filters worden dynamisch opgebouwd uit resultaten.
- Filters werken client-side.
- Reset zet filters terug naar Alle.
- Master en Release zijn visueel herkenbaar.
- Label staat niet meer als hoofdkolom in de resultatenweergave.
- Bestaande koppelfunctie blijft werken.
- Geen automatische update naar `file_details`.
