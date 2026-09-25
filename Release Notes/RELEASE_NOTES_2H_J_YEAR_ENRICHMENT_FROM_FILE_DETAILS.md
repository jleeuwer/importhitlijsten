# Release Notes — Sprint 2H-J Jaarverrijking vanuit file_details

## Opgeleverd

Deze release verbetert de bestaande functie **Preview jaarverrijking** voor importlijsten zonder jaartallen.

## Wijzigingen

- Preview jaarverrijking zoekt ontbrekende `hl_jaar`-waarden nu op basis van `file_details.fd_year_song_publish`.
- Matching gebeurt via correcte artiest + correcte titel (`hl_artist_key` + `fd_tag_title`).
- Alleen `fd_year_song_publish > 0` is geldig.
- Meerdere file_details-kandidaten zijn toegestaan; er wordt één geldige kandidaat gebruikt en de situatie wordt zichtbaar gemaakt in preview/logging.
- Bij meerdere verschillende kandidaatjaren wordt een waarschuwing getoond.
- Apply werkt uitsluitend `staging_hitlijsten.hl_jaar` bij.
- `hitlijsten` wordt bewust niet bijgewerkt: deze tabel bevat geen `hl_jaar` en gebruikt `fd_key` voor songinformatie.
- Audit/logging gebruikt correction type `YEAR_ENRICHMENT_FROM_FILE_DETAILS`.
- `file_details`, `fd_key` en `hl_samenstel_fd_key` blijven ongewijzigd.
- In de Discogs-resultatentabel staat **Koppel** voortaan als rechterkolom.

## Tests

Gebruik:

```bash
mkdir -p logs
npm run test:sprint2h-j 2>&1 | tee "logs/test-sprint2h-j-$(date +%Y%m%d-%H%M%S).log"
```

Build:

```bash
mkdir -p logs
npm run build 2>&1 | tee "logs/build-sprint2h-j-$(date +%Y%m%d-%H%M%S).log"
```
