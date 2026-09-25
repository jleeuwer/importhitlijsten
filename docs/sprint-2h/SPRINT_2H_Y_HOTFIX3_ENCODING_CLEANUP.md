# Sprint 2H-Y Hotfix 3 — Encoding warning cleanup na handmatig herstellen

## Aanleiding

Na 2H-Y Hotfix 2 was de validate-fout opgelost. Tijdens functioneel testen bleek echter dat de workflow:

```text
Edit → Handmatig herstellen → handmatig song/artiest zoeken
```

bij een schone handmatige keuze alsnog `RECOVERABLE_ENCODING_DAMAGE` kon tonen. Voorbeeld uit de testbevinding:

- Artiest: `Coldcut Featuring Yazz And The Plastic Population`
- Titel: `Doctorin' The House`
- Resolved `fd_tag_title`: `Doctorin' The House`

De getoonde waarden bevatten geen zichtbare mojibake. De warning was daardoor verwarrend en functioneel onjuist.

## Root cause

`detectEncodingDamage()` gebruikte het verschil tussen originele tekst en `repairRecoverableEncoding()` als signaal voor encoding-schade. `repairRecoverableEncoding()` voert echter ook algemene, veilige normalisatie uit, zoals trimmen, NBSP vervangen, HTML entities decoderen en whitespace normaliseren.

Daardoor konden normale correcties of onzichtbare whitespaceverschillen ten onrechte worden gepresenteerd als `RECOVERABLE_ENCODING_DAMAGE`.

## Oplossing

Encoding-schade wordt vanaf deze hotfix alleen nog gemeld wanneer de actuele tekst echte encoding-signalen bevat:

- replacement character `�`
- bekende mojibake patronen zoals `Ã©`, `â€™`, `Â`

Algemene normalisatieverschillen zijn geen encoding-schade meer.

## Functioneel gewenst gedrag

Na handmatig herstellen:

1. De gekozen artiest/song wordt opgeslagen.
2. Diagnostiek wordt opnieuw bepaald op actuele/resolved waarden.
3. Schone waarden zoals `Doctorin' The House` veroorzaken geen encoding-warning.
4. Echte mojibake zoals `BelgiÃ«` blijft detecteerbaar en repairable.
5. Replacement characters blijven blocking, omdat die meestal niet veilig automatisch herstelbaar zijn.

## Database

Geen schemawijziging nodig.

Er is wel een no-op migratiemarker toegevoegd voor Docker/PostgreSQL releasebeheer:

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-y-hotfix3
```

## Testen

Nieuwe/uitgebreide tests:

```bash
npm run test:sprint2h-y-hotfix3
```

Daarnaast blijft de bestaande sprintcheck beschikbaar:

```bash
npm run test:sprint2h-y
npm run validate
```
