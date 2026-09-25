# Release Notes — Sprint 2H-B Song spelling hardening

## Samenvatting

Deze release hardent de AltSpelling-flow. Wanneer een gebruiker via AltSpelling een titel kiest, wordt expliciet getest en gedocumenteerd dat `song_spelling` wordt aangemaakt of bijgewerkt.

## Wijzigingen

- AltSpelling-controller opgeschoond.
- Backward-compatible AltSpelling-helper gebruikt nu dezelfde modelservice als de hoofdendpoint.
- UI-feedback na AltSpelling is verduidelijkt.
- Tests toegevoegd voor `song_spelling` upsert en staging-update.

## Validatie

Gebruik:

```bash
mkdir -p logs
npm run test:sprint2h-b 2>&1 | tee "logs/test-sprint2h-b-$(date +%Y%m%d-%H%M%S).log"
```
