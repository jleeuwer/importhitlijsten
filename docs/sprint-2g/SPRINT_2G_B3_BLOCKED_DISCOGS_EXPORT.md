# Sprint 2G-B3 — Blocked Discogs export

## Doel

Sprint 2G-B3 voegt BL-IMP-067 toe: exporteer alle regels uit de actieve import-run met een exportblokkerende status én een gevulde Discogs URL naar een tekstbestand.

## Functionele regel

Een regel komt in de export als:

- de rij onderdeel is van de actieve import-run;
- de rij exportblokkerend is volgens de bestaande file_details-validatie;
- er een Discogs URL gevuld is.

## Exportformaat

Elke regel in het `.txt` bestand heeft exact dit formaat:

```text
<correcte artiest> - <correcte titel> <Discogs URL>
```

Voorbeeld:

```text
Nirvana - Smells Like Teen Spirit https://www.discogs.com/master/123
Queen - Innuendo https://www.discogs.com/master/456
```

## Veldvoorkeuren

Correcte artiest:

1. `as_correcte_artiest_spelling`
2. `correcte_artiest`
3. `hl_artiest`

Correcte titel:

1. `fd_tag_title`
2. `correcte_titel`
3. `hl_titel_song`

Discogs URL:

1. `discogs_master_url`
2. `discogs_release_url`
3. `hl_discogs_link`

## Backend

Nieuwe service:

```text
services/blockedDiscogsExportService.js
```

Nieuwe endpoints:

```text
GET /api/edit/run/:runId/blocked-discogs-export-summary
GET /api/edit/run/:runId/export-blocked-discogs-links.txt
```

De summary endpoint levert:

```json
{
  "ok": true,
  "runId": "...",
  "exportableCount": 7
}
```

De download endpoint levert `text/plain; charset=utf-8` met een `Content-Disposition` download header.

Bestandsnaam:

```text
blocked-discogs-links-<hitlijst>-<uitzendjaar>-<timestamp>.txt
```

## UI

In de Edit-aside is toegevoegd:

```text
Export blocked Discogs-links (<count>)
```

Gedrag:

- disabled bij 0 exporteerbare regels;
- disabled tijdens laden of andere busy-state;
- enabled bij minimaal 1 exporteerbare regel;
- klik start download van het tekstbestand.

## Tests

Toegevoegd:

```text
tests/services_blockedDiscogsExportService.test.js
tests/react/EditBlockedDiscogsExport.test.jsx
```

Nieuw npm-script:

```bash
npm run test:sprint2g-b3
```

Aanbevolen lokaal met logs:

```bash
mkdir -p logs
npm run test:sprint2g-b3 2>&1 | tee "logs/test-sprint2g-b3-$(date +%Y%m%d-%H%M%S).log"
```
