# Release Notes — Sprint 2H-P Fix 1

## Titel

Gewenste versie behouden na Discogs-flow

## Fixes

- De gewenste versie/song type wordt nu direct opgeslagen zodra de dropdown wijzigt.
- Voorkomt dat niet-opgeslagen versiekeuzes verdwijnen na Discogs zoeken/details/koppelen of row refresh.
- Lokale rijstate wordt optimistisch bijgewerkt na succesvolle opslag.
- Regressietests toegevoegd voor directe opslag en Discogs-refresh scenario.

## Niet gewijzigd

- Discogs zoek/detail/koppel-functionaliteit blijft functioneel ongewijzigd.
- `file_details` blijft ongewijzigd.
- `hitlijsten` blijft ongewijzigd.
- De foreign key naar `song_types` blijft leidend.
