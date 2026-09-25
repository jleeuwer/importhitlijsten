# Sprint 2H-J Fix 1 — Preview jaarverrijking staging-only

## Aanleiding

De eerste 2H-J oplevering voegde ten onrechte een aparte knop **Vul jaar uit file_details** toe. De bedoeling was om de bestaande flow achter **Preview jaarverrijking** te verbeteren. Daarnaast probeerde de apply-flow `hitlijsten.hl_jaar` bij te werken, terwijl `hitlijsten` geen `hl_jaar` bevat en dat functioneel ook niet nodig heeft.

## Functionele correctie

- Er is geen aparte knop **Vul jaar uit file_details** meer.
- De bestaande knop **Preview jaarverrijking** staat na **SongSpelling**.
- De knop **Preview jaarverrijking** maakt een preview van ontbrekende `staging_hitlijsten.hl_jaar`-waarden.
- De verrijking gebruikt `file_details.fd_year_song_publish` als geverifieerde bron.
- Matching gebeurt op correcte artiest + correcte titel, technisch via `hl_artist_key + fd_tag_title`.
- Alleen `fd_year_song_publish > 0` telt als kandidaat.
- Apply gebeurt vanuit het previewblok via **Jaarverrijking toepassen**.
- Apply werkt uitsluitend `staging_hitlijsten.hl_jaar` bij.
- `hitlijsten`, `fd_key`, `hl_samenstel_fd_key` en `file_details` blijven ongewijzigd.

## Technische correctie

- `services/editYearEnrichmentService.js` leest of schrijft geen `hitlijsten.hl_jaar` meer.
- De preview-query gebruikt geen `public.hitlijsten` meer.
- De apply-flow voert alleen een `UPDATE public.staging_hitlijsten SET hl_jaar = ...` uit.
- Audit blijft beschikbaar via `YEAR_ENRICHMENT_FROM_FILE_DETAILS`, met `hitlijsten_records_updated = 0`.

## Acceptatiecriteria

1. **Vul jaar uit file_details** is niet meer zichtbaar.
2. **Preview jaarverrijking** staat na **SongSpelling**.
3. Preview gebruikt de file_details-gebaseerde verrijkingslogica.
4. Apply werkt alleen `staging_hitlijsten.hl_jaar` bij.
5. Er wordt geen query op `hitlijsten.hl_jaar` uitgevoerd.
6. Tests dekken zowel de serviceflow als de UI-knoppen.
