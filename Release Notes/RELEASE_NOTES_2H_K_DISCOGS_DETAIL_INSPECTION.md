# Release Notes — Sprint 2H-K Discogs detailinspectie

## Nieuw

- Nieuwe Discogs detailinspectie vanuit de zoekmodal.
- Nieuwe backend route: `GET /api/discogs/details/:type/:id`.
- Details tonen type, artiest, titel, jaar, land, formats, catalogusnummer, Discogs-link en tracklist.
- Vanuit details kan direct **Koppel deze entry** worden gebruikt.
- Bekeken Discogs-resultaten krijgen een **Bekeken** badge.

## Bewust niet getoond

- Label(s) zijn verwijderd uit de gebruikersgerichte Discogs inspectie, zowel in de tabel als in details, omdat labeldata vaak te groot en onoverzichtelijk is.

## Niet gewijzigd

- Details bekijken slaat niets op.
- `file_details` wordt niet bijgewerkt.
- Jaarverrijking blijft staging-only.

## Validatie

- `npm run test:sprint2h-k` — geslaagd.
- `npm run build` — geslaagd.
