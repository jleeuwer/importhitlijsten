# Release Notes — Sprint 2H-I Post-export correcties

## Nieuw

- Correctieflow na export voor correcte artiest/titel.
- Selectiegedreven vanuit bestaande actieve `file_details`-records.
- Preview vóór toepassen met impact op `staging_hitlijsten` en `hitlijsten`.
- Veiligheid bij samengestelde regels: `hl_samenstel_fd_key` blijft ongewijzigd.
- Audit-tabel voor post-export correcties.
- Performance-index op de matchvelden in `hitlijsten`.

## Nieuwe commando's

```bash
mkdir -p logs
DB_CONTAINER_NAME=my-postgresdb MIGRATION_MODE=docker npm run db:migrate:sprint2h-i 2>&1 | tee "logs/db-migrate-sprint2h-i-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs
npm run test:sprint2h-i 2>&1 | tee "logs/test-sprint2h-i-$(date +%Y%m%d-%H%M%S).log"
```
