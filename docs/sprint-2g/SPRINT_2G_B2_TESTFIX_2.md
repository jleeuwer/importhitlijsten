# Sprint 2G-B2 Testfix 2 — Discogs modal accessibility en testscoping

## Aanleiding

De regressierun liet nog twee failures zien in `tests/react/EditDiscogsSelectionFlow.test.jsx`:

1. De test zocht met `screen.findByRole("table")`, maar op de Edit-pagina staan zowel de hoofd Edit-tabel als de Discogs-resultatentabel.
2. De test zocht de modal met `getByRole("dialog", { name: /Discogs zoeken/i })`, maar de Discogs-modal had nog geen expliciete toegankelijke naam via `aria-labelledby`.

## Oplossing

- De Discogs-modal heeft nu een expliciete `aria-labelledby` gekoppeld aan de modal title.
- De test zoekt eerst de Discogs-dialog en scoped daarna de resultatentabel met `within(dialog)`.
- De sluitcontrole gebruikt nu `queryByRole("dialog", { name: /Discogs zoeken/i })` in plaats van generieke tekstmatching.

## Verwachte validatie

```bash
mkdir -p logs
npm run test:sprint2g-b2 2>&1 | tee "logs/test-sprint2g-b2-testfix2-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs
{
  echo "=== test:sprint2g-b2 ==="
  npm run test:sprint2g-b2

  echo "=== test:sprint2g-b1 ==="
  npm run test:sprint2g-b1

  echo "=== test:sprint2g ==="
  npm run test:sprint2g

  echo "=== test:sprint2f ==="
  npm run test:sprint2f

  echo "=== test:sprint2d ==="
  npm run test:sprint2d
} 2>&1 | tee "logs/test-regression-2g-b2-testfix2-$(date +%Y%m%d-%H%M%S).log"
```
