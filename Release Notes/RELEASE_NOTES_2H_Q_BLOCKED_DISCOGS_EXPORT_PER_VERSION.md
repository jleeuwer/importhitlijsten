# Release Notes — Sprint 2H-Q

## Titel

Blocked Discogs export groeperen per gewenste versie

## Backlog

`BL-IMP-117 — Export blocked Discogs links groeperen per gewenste versie`

## Nieuw

- De export **Export blocked Discogs-links** groepeert de output per gewenste versie/song type.
- De groepsnaam komt uit `song_types` via de gekozen `hl_desired_song_type_key`.
- Regels zonder gekozen versie worden gegroepeerd onder **Geen versie gekozen**.
- Per exportitem staat de artiest/titel-regel boven de Discogs-link.

## Voorbeeld

```text
Single versie

Nirvana - Smells Like Teen Spirit
https://www.discogs.com/master/123

Geen versie gekozen

Nirvana - In Bloom
https://www.discogs.com/master/456
```

## Techniek

- `services/blockedDiscogsExportService.js` uitgebreid met group-label en grouping helpers.
- Query uitgebreid met `LEFT JOIN public.song_types` voor de displaynaam van de gewenste versie.
- Summary-resultaat bevat nu ook `groupCount`.
- Bestaande endpoint-URL's blijven ongewijzigd.

## Tests

Sprinttest:

```bash
npm run test:sprint2h-q
```

De sprinttest bevat de service-tests voor de grouped export en bestaande React-tests voor de exportbutton en gewenste-versie-dropdown.

## Migraties

Geen nieuwe database-migratie. Deze sprint gebruikt de kolom en foreign key uit Sprint 2H-P:

```text
staging_hitlijsten.hl_desired_song_type_key -> song_types.st_song_type_key
```
