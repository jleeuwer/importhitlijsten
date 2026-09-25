# BL-IMP-129 — Exportstatus correct bij succesvolle export met niet-blokkerende warnings

## Status

Open — opgenomen in Sprint 2H-Y design.

## Probleem

Een hitlijst kan succesvol worden geëxporteerd terwijl er niet-blokkerende warnings blijven bestaan. De status blijft dan ten onrechte op “aandacht nodig” staan, waardoor de gebruiker denkt dat de export nog niet correct is afgerond.

## Functionele wens

Warnings mogen zichtbaar blijven, maar mogen een succesvol geëxporteerde run niet als actieve blokkade presenteren.

## Scope

- Maak onderscheid tussen blocking errors en non-blocking warnings.
- Introduceer of gebruik status `EXPORTED_WITH_WARNINGS` of equivalent.
- UI toont export als voltooid, met waarschuwingen apart zichtbaar.
- Exportoverzicht en filters gebruiken correcte statusbetekenis.

## Acceptatiecriteria

1. Succesvolle export zonder waarschuwingen wordt `EXPORTED`.
2. Succesvolle export met niet-blokkerende waarschuwingen wordt `EXPORTED_WITH_WARNINGS` of functioneel equivalent.
3. Niet-blokkerende waarschuwingen houden de run niet op “aandacht nodig”.
4. Blocking errors blijven export blokkeren.
5. UI maakt onderscheid tussen voltooid met warnings en actie vereist.
