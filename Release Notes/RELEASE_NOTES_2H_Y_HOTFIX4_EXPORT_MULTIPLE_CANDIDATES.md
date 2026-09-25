# Release Notes — 2H-Y Hotfix 4

## Fixed

- Export naar `hitlijsten` blokkeert niet langer op meerdere `file_details` kandidaten voor dezelfde artiest+titel.
- `MULTIPLE_FILE_DETAILS_COMBINED_MATCHES` is gedegradeerd van blocker naar waarschuwing.
- Import-run summary markeert meerdere kandidaten niet langer als blocked.

## Changed

- Exportvalidatie negeert versie/song_type bij de vraag of een artiest+titel in `file_details` bestaat.
- Gewenste song_type blijft metadata en wordt alleen gebruikt als voorkeur voor technische `fd_key` ordering.

## Database

Geen schemawijziging. Alleen comment/no-op marker voor Docker/PostgreSQL releasebeheer.
