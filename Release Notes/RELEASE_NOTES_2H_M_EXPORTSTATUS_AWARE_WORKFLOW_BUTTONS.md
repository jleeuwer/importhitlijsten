# Release Notes — Sprint 2H-M Exportstatus-aware workflow buttons

## Nieuw

- Pre-export workflowknoppen worden na export naar `hitlijsten` disabled.
- Edit-scherm toont een waarschuwing als de run al geëxporteerd is.
- Disabled knoppen verwijzen naar `Correctie na export`.
- Backend guard blokkeert muterende pre-export endpoints na export met code `PRE_EXPORT_ACTION_BLOCKED_AFTER_EXPORT`.

## Waarom

Staging-only acties na export kunnen schijncorrecties veroorzaken: `staging_hitlijsten` wijzigt, maar `hitlijsten` niet. Na export moeten correcties via de expliciete post-export correctieflow lopen.

## Tests

```bash
npm run test:sprint2h-m
npm run build
```
