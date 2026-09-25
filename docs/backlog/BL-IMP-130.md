# BL-IMP-130 — Encoding warning herberekenen/verwijderen na handmatige correctie

## Status

Open — opgenomen in Sprint 2H-Y design.

## Probleem

Na handmatige correctie van tekst blijft een encoding warning zichtbaar. Daardoor is onduidelijk of de correctie wel is verwerkt en blijft de gebruiker mogelijk onterecht actie ondernemen.

## Scope

- Herbereken encoding diagnostics na handmatige correctie.
- Verwijder of downgrade warnings die niet meer van toepassing zijn.
- Zorg dat checks op de actuele tekstwaarde draaien, niet op oude/originele cachewaarde.
- Leg wijziging vast in audit/logging.

## Acceptatiecriteria

1. Na correctie wordt de encodingstatus opnieuw bepaald.
2. Een opgeloste warning verdwijnt uit de actieve aandachtlijst.
3. Een nog bestaande warning blijft zichtbaar.
4. UI refresh toont de actuele status zonder handmatige reload-trucs.
