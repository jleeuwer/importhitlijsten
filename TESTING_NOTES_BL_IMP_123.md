# Testing Notes — BL-IMP-123

Aanbevolen logging:

```bash
mkdir -p logs
npm run test:bl-imp-123 2>&1 | tee "logs/test-bl-imp-123-$(date +%Y%m%d-%H%M%S).log"
```

Diagnostics:

```bash
mkdir -p logs
POSTGRES_CONTAINER=my-postgresdb POSTGRES_USER=postgres POSTGRES_DB=musicdb \
  npm run diagnostics:bl-imp-123 2>&1 | tee "logs/diagnostics-bl-imp-123-$(date +%Y%m%d-%H%M%S).log"
```

Voor/na-export controle:

- noteer `file_details_count` vóór export;
- voer alleen export naar `hitlijsten` uit;
- noteer `file_details_count` opnieuw;
- groei betekent dat export mogelijk `file_details` muteert.
