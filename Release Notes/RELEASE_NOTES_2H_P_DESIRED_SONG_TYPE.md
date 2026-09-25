# Release Notes — Sprint 2H-P — Gewenste songversie per hitlijstregel

## Nieuw

- Nieuwe stagingkolom `hl_desired_song_type_key`.
- Directe foreign key naar `public.song_types(st_song_type_key)`.
- Nieuw endpoint `GET /api/song-types`.
- Edit-scherm toont kolom `Versie` met dropdown uit `song_types`.
- Dropdown toont logische omschrijving (`st_song_type_desc`), niet de key.
- Save-flow slaat de gekozen key op bij de stagingregel.

## Niet gewijzigd

- Discogs zoeken/details/koppelen is niet aangepast.
- `file_details` wordt niet aangepast.
- `hitlijsten` wordt niet aangepast.

## Tests

- `npm run test:sprint2h-p`
- `npm run build`
