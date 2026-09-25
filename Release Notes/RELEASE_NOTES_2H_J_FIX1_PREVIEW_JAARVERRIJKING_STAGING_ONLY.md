# Release Notes — 2H-J Fix 1 Preview jaarverrijking staging-only

## Opgelost

- De aparte knop **Vul jaar uit file_details** is verwijderd.
- De bestaande knop **Preview jaarverrijking** gebruikt nu de file_details-gebaseerde jaarverrijking.
- **Preview jaarverrijking** staat logisch na **SongSpelling**.
- De jaarverrijking werkt alleen `staging_hitlijsten.hl_jaar` bij.
- De fout `column "hl_jaar" of relation "hitlijsten" does not exist` is opgelost door alle updates/afhankelijkheden op `hitlijsten.hl_jaar` uit deze flow te verwijderen.

## Niet gewijzigd

- `hitlijsten` blijft ongewijzigd.
- `fd_key` en `hl_samenstel_fd_key` blijven ongewijzigd.
- `file_details` blijft brondata en wordt niet aangepast.

## Tests

- `npm run test:sprint2h-j`
- `npm run build`
