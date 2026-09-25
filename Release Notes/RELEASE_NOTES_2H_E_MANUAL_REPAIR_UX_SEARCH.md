# Release Notes — Sprint 2H-E Manual repair UX search

## Nieuw

- Handmatig herstel zoekt in `file_details` met aparte velden voor artiest en titel.
- De zoekknop is disabled zolang beide zoekvelden leeg zijn.
- De UI gebruikt `artist` en `title` queryparameters in plaats van één gecombineerd `query` veld.

## Technisch

- `test:sprint2h-e` toegevoegd.
- `test:sprint2h` uitgebreid met Sprint 2H-E.
- Extra service- en React-tests toegevoegd voor de gescheiden zoekvelden.

## Validatie

```bash
mkdir -p logs
npm run test:sprint2h-e 2>&1 | tee "logs/test-sprint2h-e-$(date +%Y%m%d-%H%M%S).log"
```
