# Release Notes — 2H-A Fix 1

## Wijziging

Het vrije lijstfilter in het Edit-scherm is beperkt tot gebruikersgerichte velden: positie, artiest/correcte artiest, titel/correcte titel en jaar. Technische velden zoals fysieke filename, Discogs-link, find-cmd en artist-key worden niet meer meegenomen in deze zoekfilter.

## Validatie

Draai lokaal:

```bash
mkdir -p logs
npm run test:sprint2h-a 2>&1 | tee "logs/test-sprint2h-a-fix1-$(date +%Y%m%d-%H%M%S).log"
```
