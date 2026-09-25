# Release Notes — Sprint 2H-G Fix 1

## Wijziging

De kolomheaders in **View staging** zijn gebruiksvriendelijk gemaakt. Technische databasevelden zoals `hl_positie`, `hl_artiest` en `fd_tag_title` worden niet meer als headertekst getoond.

## Impact

Alleen de UI-labels zijn aangepast. De data, API en onderliggende databasevelden zijn niet gewijzigd.

## Test

```bash
mkdir -p logs
npm run test:sprint2h-g-fix1 2>&1 | tee "logs/test-sprint2h-g-fix1-$(date +%Y%m%d-%H%M%S).log"
```
