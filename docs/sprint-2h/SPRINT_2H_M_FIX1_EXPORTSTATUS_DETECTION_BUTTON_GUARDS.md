# Sprint 2H-M Fix 1 — Exportstatus-detectie en button guards corrigeren

## Aanleiding

Bij test van Sprint 2H-M bleken alle buttons bij een geëxporteerde lijst nog actief. Dat is functioneel onjuist: pre-export/staging-only acties mogen na export niet meer gebruikt worden, omdat ze `staging_hitlijsten` aanpassen zonder de definitieve `hitlijsten` automatisch mee te corrigeren.

## Functionele correctie

Een run wordt als geëxporteerd beschouwd wanneer de exportstatus aangeeft dat er al corresponderende regels in `hitlijsten` bestaan voor de exporttarget (`hl_hitlijst` + `hl_uitzendjaar`).

Na export worden staging-only acties geblokkeerd. De gebruiker moet voor correcties die ook naar `hitlijsten` moeten via **Correctie na export** werken.

## Opgeloste fout

De frontend laadde de exportstatus wel, maar nam de velden `alreadyExported`, `existingRowsForTarget`, `hl_hitlijst` en `hl_uitzendjaar` niet over in de lokale state. Daardoor bleef `alreadyExported` in de UI effectief false/0, waardoor buttons actief bleven.

## Gewijzigd gedrag

- De exportstatuspayload wordt nu volledig genormaliseerd.
- `alreadyExported` wordt true wanneer `alreadyExported=true` of `existingRowsForTarget > 0`.
- De exportstatusbanner verschijnt bij geëxporteerde runs.
- Toolbar-knoppen voor pre-export acties worden disabled.
- Directe rij-acties die staging muteren worden disabled.
- Correctie na export blijft beschikbaar.
- Backend guards blokkeren ook directe API-calls naar staging-only mutatie-endpoints.

## Geblokkeerde staging-only acties na export

Voorbeelden:

- ArtistSpelling
- SongSpelling
- Pattern delete/apply
- Preview/toepassen jaarverrijking wanneer die muterend wordt
- Forceer titel/artiest swap
- Herstel titel/artiest swap
- Normaliseer tekst
- Encoding repair
- Duplicates naar Skip
- Rij Save
- Discogs koppelen aan staging
- Manual repair / vrije correctie
- Rij-level artist relation repair en title/artist swap repair

## Beschikbaar na export

- Read-only bekijken/filteren
- Refresh rows
- Export Find-cmd script
- Correctie na export

## Backend guard

Muterende pre-export endpoints geven na export HTTP 409 met code:

```text
PRE_EXPORT_ACTION_BLOCKED_AFTER_EXPORT
```

## Acceptatiecriteria

1. Bij een geëxporteerde run verschijnt de exportstatusbanner.
2. De echte toolbar-buttons zijn disabled.
3. Rij-level staging-only acties zijn disabled.
4. Correctie na export blijft beschikbaar.
5. De frontend behoudt `alreadyExported` en `existingRowsForTarget` uit de API-response.
6. Directe staging-only API-mutaties worden backendmatig geblokkeerd.
7. Automatische tests dekken exportstatus-normalisatie, buttonbeleid en backend guard coverage.
