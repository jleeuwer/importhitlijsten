# Importhitlijst — Sprint 2H-Y codebouw

Deze ZIP bevat de volledige Importhitlijst-codebase, gebaseerd op de geaccepteerde 2H-X codebase en uitgebreid met Sprint 2H-Y.

## Sprint

**2H-Y — Matching, Discogs lifecycle & status hardening**

## Backlog-items

- **BL-IMP-124** — Ambigue `file_details`-kandidaten blokkeren.
- **BL-IMP-133** — Discogs-link lifecycle expliciet maken.
- **BL-IMP-127** — Variant-aware matching/deduplicate ontwerp.
- **BL-IMP-128** — Encoding repair mag geen manual free overwrite triggeren zonder expliciete bevestiging.
- **BL-IMP-129** — Exportstatus correct bij succesvolle export met niet-blokkerende warnings.
- **BL-IMP-130** — Encoding warning herberekenen/verwijderen na handmatige correctie.
- **BL-IMP-131** — Repair bestaande geëxporteerde runs met foutieve aandacht-nodig status.

## Functioneel gedrag

- Export blokkeert nu als een stagingregel meerdere mogelijke `file_details`-kandidaten heeft.
- Variant-aware matching gebruikt `hl_desired_song_type_key` als extra vernauwing wanneer die gevuld is.
- De export kiest niet meer stilzwijgend de eerste kandidaat wanneer er meerdere matches zijn.
- Discogs-links blijven hitlijstmetadata en worden niet automatisch naar `file_details.fd_discogs` gepromoveerd.
- Safe raw `hl_discogs_link` waarden naar `https://discogs.com/master/...` of `https://discogs.com/release/...` worden bij export als gestructureerde `hitlijsten.discogs_master_url` of `hitlijsten.discogs_release_url` meegenomen.
- Encoding/text batch-repair bevestigt intern expliciet dat de geautomatiseerde actie bewust overschrijft, zodat de manual-overwrite guard niet onbedoeld als stacktrace in beeld komt.
- API-fouten onder `/api/*` geven JSON terug in plaats van development stacktraces.
- 2H-V status-/repair-tabellen worden hergebruikt; 2H-Y voegt geen destructieve schemawijziging toe.

## Database / Docker PostgreSQL

Er is geen destructieve database-migratie nodig. Er is wel een veilige 2H-Y marker/comment migration toegevoegd voor releasebeheer en documentatie in de database.

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-y
```

Als jouw database lokaal `muziek` heet, gebruik dan:

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=muziek POSTGRES_USER=postgres npm run db:migrate:sprint2h-y
```

## Diagnostiek

Voor een specifieke run:

```bash
RUN_ID=<uuid> POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run diagnostics:sprint2h-y
```

Of:

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres bash scripts/run_2h_y_diagnostics.sh <uuid>
```

## Testen

```bash
npm run test:sprint2h-y
```

De testset bevat pure service-tests en statische broncodechecks voor de 2H-Y regels.

## Handmatige smoke-test

1. Start de app.
2. Kies een import-run met bekende meerdere `file_details`-matches.
3. Controleer `/api/run-export-hitlijsten-status?runId=<uuid>`.
4. Verwacht `MULTIPLE_FILE_DETAILS_COMBINED_MATCHES` in `issuesPreview` en een geblokkeerde export.
5. Vul/controleer gewenste songtype/variant zodat exact één kandidaat overblijft.
6. Controleer dat export daarna doorgaat.
7. Controleer dat Discogs-linkmetadata in `hitlijsten.discogs_master_url` of `hitlijsten.discogs_release_url` terechtkomt en niet automatisch in `file_details.fd_discogs`.

## Hotfix validate 2026-09-07 13:19

De validate-log liet drie failures zien in `tests/models/exportHitlijsten.test.js`. De applicatiecode blokkeerde terecht op `MULTIPLE_FILE_DETAILS_COMBINED_MATCHES`, maar de oudere 2G-D tests verwachtten nog dat ambiguë combined matches als waarschuwing werden behandeld en export toch door mocht gaan. Deze testverwachtingen zijn bijgewerkt naar het nieuwe BL-IMP-124 gedrag.

Controle na copy-over:

```bash
npm run test:sprint2g-d
npm run test:sprint2h-y
npm run validate
```

## Hotfix 2 - 2026-09-07

Validate-fix na gebruikerslog `validate-20260907-141550.log`:

- `tests/models/exportHitlijsten.test.js` verwacht nu ook het 2H-Y veld `ambiguousLinks` in de status-summary.
- Geen applicatiecode gewijzigd.
- Oorzaak: testverwachting liep één veld achter op het nieuwe BL-IMP-124 gedrag waarbij meerdere gecombineerde `file_details`-kandidaten blocking zijn.

## Sprint 2H-Y Hotfix 3 - Encoding warning cleanup

Deze hotfix voorkomt dat schone handmatige correcties ten onrechte `RECOVERABLE_ENCODING_DAMAGE` tonen.

Aanleiding: na `Edit -> Handmatig herstellen -> handmatig song/artiest zoeken` kon een rij zoals `Coldcut Featuring Yazz And The Plastic Population - Doctorin' The House` nog steeds een encoding-warning tonen, terwijl de actuele/resolved waarden schoon waren.

Oplossing: `detectEncodingDamage()` meldt encoding-schade alleen nog bij echte mojibake- of replacement-character signalen. Algemene tekstnormalisatie zoals trimmen, NBSP vervangen en HTML entity decoding telt niet meer als encoding-schade.

Testen:

```bash
npm run test:sprint2h-y-hotfix3
npm run test:sprint2h-y
npm run validate
```

Database: geen schemawijziging nodig. Er is een no-op marker beschikbaar:

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-y-hotfix3
```

---

## Sprint 2H-Y Hotfix 4 — Multiple file_details-kandidaten toestaan bij export

Deze oplevering corrigeert de 2H-Y exportlogica. Bij export naar `hitlijsten` hoeft de applicatie alleen vast te stellen dat de combinatie artiest + titel minimaal één keer voorkomt in `file_details`. Meerdere varianten/mixen zijn geen blokkade meer; Importhitlijst is juist bedoeld om mogelijke versies en Discogs-links vast te leggen. De definitieve song_type/variantkeuze gebeurt later bij samenstellen via prioriteitsvolgorde.

### Belangrijkste wijzigingen

- `MULTIPLE_FILE_DETAILS_COMBINED_MATCHES` is non-blocking warning.
- `NO_FILE_DETAILS_COMBINED_MATCH` blijft blocking.
- Exportvalidatie filtert niet meer op `hl_desired_song_type_key`.
- `hl_desired_song_type_key` blijft metadata en voorkeur voor latere samenstelling.
- `hitlijsten.fd_key` wordt technisch deterministisch gevuld omdat het huidige schema NOT NULL/FK afdwingt; dit is bij meerdere kandidaten niet de definitieve samenstelkeuze.
- `models/import_runs.js` telt multiple candidates niet meer als blocked.

### Tests

```bash
npm run test:sprint2h-y-hotfix4
npm run test:sprint2h-y
npm run validate
```

### Database

Geen schemawijziging. Er is wel een Docker/PostgreSQL no-op/comment migratie voor releasebeheer:

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-y-hotfix4
```
