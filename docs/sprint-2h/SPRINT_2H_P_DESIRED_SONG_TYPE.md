# Sprint 2H-P — Gewenste songversie per hitlijstregel

## Doel

Per stagingregel kan de gebruiker vastleggen welke logische songversie bedoeld is. De waardelijst komt uit de bestaande tabel `public.song_types`. De gebruiker ziet de logische omschrijving van het songtype; technisch wordt de sleutel opgeslagen.

## Functioneel gedrag

- Nieuwe stagingkolom: `staging_hitlijsten.hl_desired_song_type_key`.
- De kolom heeft direct een foreign key naar `song_types(st_song_type_key)`.
- De dropdown in het Edit-scherm toont `song_types.st_song_type_desc` met fallback naar `st_song_type`.
- De gebruiker ziet geen numerieke key als keuze-label.
- De opgeslagen waarde is de songtype-key.
- Leeg/null is toegestaan: geen gewenste versie gekozen.
- Na export is wijzigen disabled, omdat dit staging/importcontext is.
- Discogs zoeken, details bekijken en koppelen blijven ongewijzigd.
- `file_details` en `hitlijsten` worden niet aangepast.

## Database

Migratie:

```sql
ALTER TABLE public.staging_hitlijsten
  ADD COLUMN IF NOT EXISTS hl_desired_song_type_key bigint;

ALTER TABLE public.staging_hitlijsten
  ADD CONSTRAINT staging_hitlijsten_desired_song_type_fk
  FOREIGN KEY (hl_desired_song_type_key)
  REFERENCES public.song_types(st_song_type_key)
  ON UPDATE RESTRICT
  ON DELETE RESTRICT;
```

Het script staat in:

```text
scripts/sql/20260426_sprint2h_p_desired_song_type.sql
scripts/apply_sprint2h_p_desired_song_type.sh
```

Uitvoeren:

```bash
mkdir -p logs
npm run db:migrate:sprint2h-p 2>&1 | tee "logs/db-migrate-sprint2h-p-$(date +%Y%m%d-%H%M%S).log"
```

## API

Nieuw endpoint:

```text
GET /api/song-types
```

Response bevat `st_song_type_key`, `st_song_type`, `st_song_type_desc` en `display_name`.

De bestaande staging-update accepteert nu:

```json
{ "hl_desired_song_type_key": 123 }
```

De backend valideert dat een ingevulde key bestaat in `song_types`. De foreign key borgt dit ook databasematig.

## Acceptatiecriteria

1. De Edit-tabel toont een kolom `Versie`.
2. De dropdown wordt gevuld vanuit `song_types`.
3. De dropdown toont logische omschrijvingen, geen keys.
4. Save slaat `hl_desired_song_type_key` op.
5. Null/leeg is toegestaan.
6. Ongeldige keys worden geweigerd.
7. Na export is wijzigen disabled.
8. Discogs-functionaliteit is niet gewijzigd.
9. `file_details` en `hitlijsten` blijven ongewijzigd.
