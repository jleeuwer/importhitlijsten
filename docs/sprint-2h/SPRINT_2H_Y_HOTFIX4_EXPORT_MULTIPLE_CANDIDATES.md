# Sprint 2H-Y Hotfix 4 — Multiple file_details-kandidaten toestaan bij export

## Aanleiding

Tijdens export naar `hitlijsten` blokkeerde 2H-Y op `MULTIPLE_FILE_DETAILS_COMBINED_MATCHES`. In de testlijst `Now That's What I Call An Era Such A Good Feeling 1988 >> 1995 - The Long Versions` leverde dit 35 blocking regels op. Dat is functioneel te streng.

## Correcte domeinlogica

Export naar `hitlijsten` hoeft alleen vast te stellen dat de combinatie `artiest + titel` minimaal één keer voorkomt in `file_details`, ongeacht versie/song_type. Importhitlijst is juist bedoeld om mogelijke versies te verzamelen en te verrijken met versie-informatie en Discogs-links.

De definitieve keuze voor song_type/variant hoort pas bij het samenstellen van de hitlijst. Daar wordt gekozen op basis van de prioriteitsvolgorde in song_type en eventueel aanvullende metadata.

## Scope

- `MULTIPLE_FILE_DETAILS_COMBINED_MATCHES` is geen export-blocker meer.
- Multiple candidates blijven zichtbaar als warning/metadata.
- `NO_FILE_DETAILS_COMBINED_MATCH` blijft blocking.
- Exportvalidatie telt gecombineerde matches op artiest + titel zonder filtering op `hl_desired_song_type_key`.
- Export blijft een technische `fd_key` vullen omdat historische schema/migratie `hitlijsten.fd_key NOT NULL` afdwingt.
- Die technische `fd_key` is bij meerdere kandidaten geen definitieve samenstelkeuze.
- Samenstelling blijft verantwoordelijk voor definitieve `hl_samenstel_fd_key`.

## Buiten scope

- Geen nieuwe review-UI voor kandidaatkeuze.
- Geen wijziging in song_type-prioriteitsmechanisme.
- Geen automatische promotie van Discogs naar `file_details.fd_discogs`.
- Geen cleanup van bestaande dubbele `file_details` varianten.
