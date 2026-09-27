# Release Notes — 2H-AA Hotfix 1

**Versie:** 1.2.0  
**Release:** correctie binnen nog niet geaccepteerde 2H-AA feature release

## Opgelost
- vijf failures uit de volledige macOS `test:all` run;
- legacy hardcoded 1.1.0 regression assertion;
- directory label/input accessibility;
- kandidaat-focus testscoping;
- twee zware pagineringstests gestabiliseerd met lokale 10s timeout.

## Database
Geen nieuwe database-migratie. Gebruik indien nog niet uitgevoerd de bestaande `db:migrate:sprint2h-aa` migratie tegen `my-postgresdb` / `musicdb`.
