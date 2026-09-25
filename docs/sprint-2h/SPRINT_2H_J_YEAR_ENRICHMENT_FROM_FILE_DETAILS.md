# Sprint 2H-J — Preview jaarverrijking vanuit file_details

## Doel

Sprint 2H-J verbetert de bestaande knop **Preview jaarverrijking** in het Edit-scherm. De functionaliteit is bedoeld voor hitlijsten die zonder jaartallen zijn ingelezen. Het systeem vult ontbrekende `hl_jaar`-waarden aan vanuit de geverifieerde brondata in `file_details.fd_year_song_publish`.

## Functionele regels

- Alleen stagingregels met ontbrekend of ongeldig `hl_jaar` worden meegenomen (`NULL`, leeg, `0` of niet-numeriek).
- Matching gebeurt op correcte artiest + correcte titel.
- Technisch wordt hiervoor de bestaande combinatie `hl_artist_key` + `fd_tag_title` gebruikt.
- Alleen `file_details`-records met `fd_year_song_publish > 0` zijn kandidaat.
- `file_details.fd_year_song_version` wordt niet gebruikt als fallback.
- Bij meerdere geldige kandidaten mag één kandidaat worden gebruikt. De preview/logging toont wel dat er meerdere kandidaten waren.
- Als meerdere kandidaten verschillende publicatiejaren hebben, blijft de rij aanvulbaar, maar de preview/logging toont een waarschuwing.
- `file_details` wordt nooit aangepast.
- `fd_key` en `hl_samenstel_fd_key` blijven ongewijzigd.
- `hitlijsten` wordt niet bijgewerkt: deze tabel bevat geen `hl_jaar` en gebruikt `fd_key` als link naar songinformatie.
- `hl_jaar` wordt niet gebruikt als matchcriterium, omdat dat juist het te verrijken veld is.

## Gebruikersflow

1. De gebruiker opent een run in het Edit-scherm.
2. De gebruiker klikt op **Preview jaarverrijking**.
3. De preview toont hoeveel regels zijn gescand, aanvulbaar zijn, geen match hebben, meerdere kandidaten hebben en/of meerdere jaren hebben.
4. De gebruiker controleert de preview en klikt op **Jaarverrijking toepassen** in het previewblok.
5. Het systeem werkt uitsluitend `staging_hitlijsten.hl_jaar` bij.
6. `hitlijsten`, `fd_key` en `hl_samenstel_fd_key` blijven ongewijzigd.
7. Audit/logging wordt vastgelegd met bron `file_details.fd_year_song_publish` en gekozen `source_fd_key`.
8. De gebruiker ziet duidelijke resultaatfeedback.

## Discogs UX-polish

De Discogs-resultatentabel is aangepast zodat de knop **Koppel** rechts als laatste kolom staat. De gebruiker leest nu eerst Type, Artiest, Titel, Jaar, Land, Format en Discogs-link, en kiest daarna de actie.

## Buiten scope

- Handmatige vrije jaartalinvoer.
- Bestaande jaartallen overschrijven.
- `file_details.fd_year_song_publish` of `fd_year_song_version` aanpassen.
- Automatische rematch of recompositie.
- `fd_key` of `hl_samenstel_fd_key` wijzigen.
- Discogs-jaartal automatisch gebruiken.

## Acceptatiecriteria

- **Preview jaarverrijking** gebruikt `file_details.fd_year_song_publish` als enige bron voor ontbrekende `hl_jaar`-waarden.
- Alleen kandidaten met `fd_year_song_publish > 0` tellen mee.
- Meerdere kandidaten blokkeren de verrijking niet.
- Preview toont waarschuwingen bij meerdere kandidaten en verschillende kandidaatjaren.
- Apply werkt uitsluitend `staging_hitlijsten.hl_jaar` bij; `hitlijsten` blijft ongewijzigd.
- Audit bevat oude/nieuwe waarde, bron fd_key en match count; hitlijsten update count blijft 0/niet van toepassing.
- Discogs **Koppel** staat rechts in de resultatentabel.
