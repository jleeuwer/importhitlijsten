# Sprint 2H-L — Discogs UX harmonisatie

## Scope

BL-IMP-108 — Discogs UX stroomlijnen met andere apps.

Deze sprint harmoniseert de Importhitlijst Discogs-flow met het voorkeursmodel uit Coretables / File Details. De sprint maakt nog geen gedeeld NPM-package en schrijft geen metadata naar `file_details`.

## Functionele wijzigingen

- Discogs zoeken start met editable zoekvelden **Artiest** en **Titel**.
- De velden worden standaard gevuld met correcte artiest en correcte titel.
- De gebruiker kan artiest/titel aanpassen vóór **Zoek in Discogs**.
- Aanpassen van zoekvelden wijzigt geen stagingdata.
- De modal opent niet langer automatisch met een Discogs-zoekopdracht; de gebruiker start de zoekactie expliciet.
- Resultaten, details en koppelen blijven gebaseerd op de 2H-K-flow.
- Label(s) blijven uit de tabel en detailweergave.
- De cross-app standaard is vastgelegd in `docs/standards/MUSICAPP_DISCOGS_UX_API_STANDARD.md`.

## UX-regels

1. Contextheader toont de oorspronkelijke/correcte importregelcontext.
2. Zoekvelden zijn apart zichtbaar en wijzigbaar.
3. Filters worden pas actief na resultaten.
4. Details bekijken blijft read-only.
5. Koppelen blijft expliciet.
6. File Details metadata wordt niet bijgewerkt vanuit Importhitlijst.

## Technische wijzigingen

- `EditPage.jsx` gebruikt lokale state voor `discogsSearchArtistInput` en `discogsSearchTitleInput`.
- `openDiscogsModal()` initialiseert de velden en wist oude resultaten, maar zoekt niet automatisch.
- `searchDiscogsForRow()` gebruikt de editable zoekvelden.
- `package.json` bevat `test:sprint2h-l` en neemt deze op in `test:sprint2h`.

## Acceptatiecriteria

- De modal toont editable velden Artiest en Titel.
- De velden zijn default gevuld met correcte artiest/titel.
- Aangepaste waarden worden gebruikt in de Discogs API-query.
- De stagingregel wordt niet aangepast door zoekveldwijzigingen.
- Details en koppelen blijven werken.
- Label(s) worden niet getoond.
- De standaarddocumentatie is aanwezig.
