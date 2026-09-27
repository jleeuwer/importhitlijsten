# Manifest — 2H-Z Hotfix 4

- App: Import Hitlijsten (`importhitlijst`)
- Sprint: 2H-Z Hotfix 4 — Pagination Test Selector Hardening
- Versie: 1.1.0
- Release type: feature (zelfde nog niet geaccepteerde v1.1.0 baseline)
- Database-migratie: geen nieuwe migratie
- Gerichte test: `npm run test:sprint2h-z-hotfix4`
- Volledige test: `./startapp.sh test`
- PostgreSQL database: `musicdb`

## Wijzigingen

De twee resterende Hotfix 3 failures zijn gecorrigeerd door tests multi-match-safe te maken voor artiesttekst die bewust in meerdere kolommen wordt weergegeven. Productiecode/pagineringslogica is hierbij niet gewijzigd.
