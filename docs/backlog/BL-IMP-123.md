# BL-IMP-123 — Onderzoek dubbele `file_details` songs per hitlijst/versie

## Doel

Vaststellen of dubbele songs/versies in `public.file_details` historisch zijn ontstaan of actief ontstaan in de flow:

1. CSV importeren naar Importhitlijst/staging.
2. Controleren of alle entries bestaan in `file_details`/songs, bij voorkeur in de noodzakelijke versie.
3. Pas bij volledige dekking exporteren naar `hitlijsten`.
4. Vanuit `hitlijsten` de hitlijst samenstellen met een bewust gekozen `hl_samenstel_fd_key`.

## Functionele regel

De export naar `hitlijsten` mag geen nieuwe `file_details` records aanmaken om ontbrekende songs te maskeren. Als een gewenste versie ontbreekt of ambigu is, moet export blokkeren of review vragen.

## Opgeleverd in deze sprint

- Read-only SQL-diagnosticscript.
- Dockergerichte runner met timestamped logbestand.
- Functioneel ontwerp en acceptatietestplan.
- Automatische statische tests voor aanwezigheid en veiligheidsregels.
- Backlog- en release-note update.

## Belangrijkste diagnosevragen

1. Hoeveel functionele duplicate groups bestaan er in `file_details`?
2. Welke duplicate rows zijn gekoppeld via `hitlijsten.fd_key`?
3. Welke duplicate rows zijn gekoppeld via `hitlijsten.hl_samenstel_fd_key`?
4. Zijn er recente duplicate rows toegevoegd of gewijzigd?
5. Verandert het aantal `file_details` records door alleen een export naar `hitlijsten`?

## Uitvoeren

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_USER=postgres POSTGRES_DB=musicdb \
  bash scripts/run_bl_imp_123_diagnostics.sh
```

Het script schrijft naar:

```text
logs/bl-imp-123-diagnostics-YYYYMMDD-HHMMSS.log
```

## Voor/na-export bewijs

1. Run de diagnostics vóór export.
2. Noteer onderaan de baseline: `file_details_count`, `max_fd_key`, `max_entry_added_ts` en `max_entry_modified`.
3. Voer alleen de Importhitlijst-export naar `hitlijsten` uit.
4. Run de diagnostics opnieuw.
5. Als `file_details_count` of `max_fd_key` stijgt, maakt de export waarschijnlijk nieuwe `file_details` records aan en is dat een bug.

## Interpretatie

- Veel oude duplicate groups zonder recente timestamps: waarschijnlijk historisch probleem.
- Duplicate rows met recente `fd_entry_added_ts` of `fd_entry_modified`: mogelijk actuele flow.
- Duplicate rows alleen via `hitlijsten.fd_key`: technische import/export-koppeling, niet per se samenstelling.
- Duplicate rows via `hl_samenstel_fd_key`: functionele samenstelling raakt dubbelingen en vereist cleanup/review.

## Geen automatische cleanup

Deze sprint verwijdert of merge’t niets. Cleanup hoort in een aparte vervolg-sprint nadat de diagnose is bevestigd.
