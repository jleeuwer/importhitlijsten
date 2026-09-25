# Technische specificatie — 2H-Y Hotfix 4

## Aangepaste bestanden

- `models/hitlijsten.js`
- `models/import_runs.js`
- `tests/models/exportHitlijsten.test.js`
- `tests/static_2h_y_matching_discogs_status_hardening.test.js`
- `tests/static_2h_y_hotfix4_export_multiple_candidates.test.js`
- `scripts/sql/20260917_sprint2h_y_hotfix4_no_database_migration.sql`
- `scripts/run_2h_y_hotfix4_migration.sh`
- `package.json`

## Exportvalidatie

`isBlockingReasonCode()` bevat niet langer `MULTIPLE_FILE_DETAILS_COMBINED_MATCHES`.

`isWarningReasonCode()` bevat wel `MULTIPLE_FILE_DETAILS_COMBINED_MATCHES`.

De combined match query filtert niet meer op:

```sql
s.hl_desired_song_type_key IS NULL OR fd.fd_song_type_key = s.hl_desired_song_type_key
```

Voor exportvalidatie geldt uitsluitend:

```sql
normalized(fd.fd_tag_title) = normalized(s.fd_tag_title)
AND fd.fd_artist_key = s.hl_artist_key
```

## Technische fd_key bij export

Omdat `hitlijsten.fd_key` historisch NOT NULL is, blijft export een deterministische `fd_key` vullen. Bij meerdere kandidaten is deze waarde technisch en niet definitief. De query sorteert gewenste song_type bovenaan als die beschikbaar is, maar blokkeert niet wanneer die niet matcht.

De samenstelling bepaalt later de definitieve `hl_samenstel_fd_key`.

## Import-run summary

`models/import_runs.js` behandelt `combined_match_count > 1` niet meer als blocked. `is_ok` vereist `combined_match_count > 0`.
