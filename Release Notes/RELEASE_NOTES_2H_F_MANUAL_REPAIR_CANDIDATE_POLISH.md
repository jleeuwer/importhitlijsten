# Release notes — Sprint 2H-F Manual repair candidate polish

## Nieuw

- Matchbadges in de handmatige herstel candidate-lijst: Exact, Sterke match, Gedeeltelijk.
- Kandidaten worden gesorteerd op beste match.
- Resultaten tonen meer versiecontext, inclusief duur.
- Nieuwe centrale helper voor actieve `file_details` candidates.

## Validatie

```bash
mkdir -p logs
npm run test:sprint2h-f 2>&1 | tee "logs/test-sprint2h-f-$(date +%Y%m%d-%H%M%S).log"
```
