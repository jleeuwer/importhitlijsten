# Sprint 2H-C — Handmatig herstel vanuit file_details

## Doel

Handmatig herstel moet de gebruiker primair laten kiezen uit bestaande `file_details`-gegevens. Vrije tekstcorrecties blijven mogelijk, maar alleen als expliciete overwrite.

## Functionele uitgangspunten

- Artiest en titel in handmatig herstel worden bij voorkeur gedreven door bestaande `file_details` records.
- Meerdere versies van dezelfde song blijven zichtbaar, zodat de gebruiker de juiste versie kan kiezen.
- Records met `fd_action` `Delete`, `Duplicates` of `Skip` worden niet als normale herstelkandidaat aangeboden.
- Vrije overwrite is een bewuste uitzondering met aparte bevestiging.

## Nieuwe flow

1. Gebruiker opent een blocked/warning stagingregel via `Edit`.
2. Gebruiker kiest `Handmatig herstellen`.
3. Gebruiker zoekt in `file_details` op artiest, titel of bestandsnaam.
4. De applicatie toont kandidaten met artiest, titel, jaar, songtype en bestand.
5. Gebruiker kiest `Gebruik` op de juiste kandidaat.
6. De stagingregel wordt gevuld met artist/title uit `file_details`, inclusief `hl_artist_key`, `fd_tag_title` en correcte artiest.
7. Diagnostics worden opnieuw berekend.

## Vrije overwrite

Vrije overwrite blijft mogelijk, maar vereist de checkbox:

```text
Ik wil bewust een vrije overwrite gebruiken
```

Zonder deze bevestiging weigert de backend de vrije correctie.

## Endpoints

```text
GET /api/edit/manual-repair-candidates?query=<zoekterm>&limit=25
POST /api/edit/staging/:runId/:hlPositie/manual-file-details-repair
POST /api/edit/staging/:runId/:hlPositie/manual-correction
```

`manual-correction` accepteert vrije overwrite alleen met `overwriteConfirmed: true` of met een `fd_key` payload.

## Tests

```bash
mkdir -p logs
npm run test:sprint2h-c 2>&1 | tee "logs/test-sprint2h-c-$(date +%Y%m%d-%H%M%S).log"
```
