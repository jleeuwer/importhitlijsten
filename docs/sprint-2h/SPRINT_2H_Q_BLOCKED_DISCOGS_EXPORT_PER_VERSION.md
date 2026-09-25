# Sprint 2H-Q — Blocked Discogs export groeperen per gewenste versie

## Backlog-item

`BL-IMP-117 — Export blocked Discogs links groeperen per gewenste versie`

## Aanleiding

Sprint 2H-P heeft per stagingregel een gewenste songversie/song type vastgelegd via `staging_hitlijsten.hl_desired_song_type_key`. De blocked Discogs export gebruikte deze versiecontext nog niet, waardoor de export één platte lijst bleef.

2H-Q maakt de export direct bruikbaarder voor handmatige Discogs-verwerking door de output te groeperen per gewenste versie.

## Functioneel ontwerp

### Doel

Wanneer de gebruiker in het Edit-scherm de actie **Export blocked Discogs-links** uitvoert, wordt het tekstbestand gegroepeerd per gewenste versie/song type.

### Outputformaat

Per groep wordt eerst de versie als groepsheader getoond. Daarna volgen per blocked rij de artiest/titel-regel en daaronder de Discogs-link.

```text
<Versie>

<Artiest> - <Titel>
<Discogs link>

<Artiest> - <Titel>
<Discogs link>
```

Voor regels zonder gekozen gewenste versie wordt de fallbackgroep gebruikt:

```text
Geen versie gekozen

<Artiest> - <Titel>
<Discogs link>
```

### Regels

- Alleen bestaande exporteerbare blocked Discogs-regels komen in het bestand.
- De exportcriteria blijven gelijk aan de bestaande blocked Discogs export.
- De gekozen versie komt uit de stagingregel: `staging_hitlijsten.hl_desired_song_type_key`.
- De groepsnaam komt uit `song_types`:
  1. `st_song_type_desc`
  2. fallback naar `st_song_type`
  3. fallback naar key als displaywaarde uit de query
- Als geen versie is gekozen, wordt de groep **Geen versie gekozen** gebruikt.
- De fallbackgroep komt onderaan.
- Binnen een groep blijft de lijstvolgorde via `hl_positie` leidend.
- De export wijzigt geen staging-, Discogs-, `file_details`- of `hitlijsten`-data.

## Technisch ontwerp

### Aangepaste service

Bestand:

```text
services/blockedDiscogsExportService.js
```

Nieuwe/gewijzigde functies:

- `NO_DESIRED_VERSION_GROUP_LABEL`
- `getDesiredVersionGroupLabel(row)`
- `groupBlockedDiscogsExportRows(rows)`
- `buildBlockedDiscogsExportContent(rows)`

`buildBlockedDiscogsExportLine(row)` blijft beschikbaar en retourneert de oude enkelregelige representatie voor backward compatibility in tests en eventuele hergebruikers.

### Query-aanpassing

De blocked Discogs query haalt nu ook versiecontext op:

```sql
s.hl_desired_song_type_key,
COALESCE(
  NULLIF(btrim(dst.st_song_type_desc::text), ''),
  NULLIF(btrim(dst.st_song_type::text), ''),
  dst.st_song_type_key::text
) AS desired_song_type_display
```

met join:

```sql
LEFT JOIN public.song_types dst
  ON dst.st_song_type_key = s.hl_desired_song_type_key
```

### Sortering

De SQL sorteert exportkandidaten op:

1. regels met gekozen versie eerst;
2. versie-displaynaam;
3. `hl_positie`.

De service groepeert vervolgens nogmaals veilig en zet **Geen versie gekozen** onderaan.

### API

Bestaande endpoints blijven gelijk:

```text
GET /api/edit/run/:runId/blocked-discogs-export-summary
GET /api/edit/run/:runId/export-blocked-discogs-links.txt
```

De summary bevat naast `exportableCount` nu ook `groupCount`. De bestaande UI gebruikt vooralsnog alleen `exportableCount`, zodat er geen UI-wijziging nodig is.

## Tests

Nieuw/uitgebreid:

```text
tests/services_blockedDiscogsExportService.test.js
```

Afgedekte scenario's:

- bestaande single-line helper blijft werken;
- Discogs URL-prioriteit blijft master > release > legacy;
- blocked rows zonder Discogs URL worden niet geëxporteerd;
- exportinhoud wordt gegroepeerd per gewenste versie;
- groepsheader verschijnt één keer per groep;
- `Geen versie gekozen` wordt gebruikt als fallback;
- summary retourneert `exportableCount` en `groupCount`.

Sprinttest:

```bash
npm run test:sprint2h-q
```

## Acceptatiecriteria

- Blocked Discogs export toont gegroepeerde output per gewenste versie.
- Regels zonder versie staan onder **Geen versie gekozen**.
- Per item staat `Artiest - Titel` op één regel en de Discogs-link op de volgende regel.
- Bestaande selectie/filtering van exporteerbare blocked Discogs rows blijft ongewijzigd.
- De export blijft read-only.
- Tests voor service en bestaande React-button blijven beschikbaar.

## Niet in scope

- Geen nieuwe UI voor de export preview.
- Geen automatische wijziging van gewenste versie.
- Geen Discogs-promotie naar `file_details`.
- Geen wildcard/generieke String Pattern uitbreiding.
