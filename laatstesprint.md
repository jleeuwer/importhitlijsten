# Laatste sprint

## Sprint 2H-Y Hotfix 4 — Export multiple file_details candidates

Status: code opgeleverd / klaar voor lokale test.

Belangrijkste correctie: export naar `hitlijsten` blokkeert niet langer wanneer artiest+titel meerdere `file_details`-varianten heeft. Meerdere kandidaten blijven waarschuwing/metadata; de definitieve song_type/variantkeuze hoort bij samenstellen.

Test:

```bash
npm run test:sprint2h-y-hotfix4
npm run validate
```

Migratie-marker:

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-y-hotfix4
```
