# Release Notes — Sprint 2H-G Runs en Edit UX polish

## Nieuw

- Runs-overzicht gebruikt icon buttons met hover/tooltip en accessibility-labels.
- Edit-scherm toont de actieve lijst/run bovenaan.
- Edit-liedjestabel heeft paginering met page sizes 25, 50, 100 en 250.

## Gewijzigd

- De oude “Load more”-melding in Edit is vervangen door echte paginering.
- Filters resetten de Edit-paginering automatisch naar pagina 1.

## Testen

```bash
mkdir -p logs
npm run test:sprint2h-g 2>&1 | tee "logs/test-sprint2h-g-$(date +%Y%m%d-%H%M%S).log"
```
