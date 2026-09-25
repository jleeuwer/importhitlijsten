# Sprint 2G-B2 Testfix 1 — Discogs UI selector robustness

## Aanleiding

Tijdens lokale validatie kwamen twee testbevindingen naar voren in `tests/react/EditDiscogsSelectionFlow.test.jsx`:

1. `screen.getByText("Nirvana")` vond zowel de artiest in de Edit-rij als de artiest in de Discogs-resultatentabel.
2. `screen.getByLabelText(/Type/i)` was te breed en matchte meerdere labels/velden in de totale Edit-pagina.

Dit zijn regressie-achtige testbevindingen door te brede selectors. De functionele Discogs-flow is niet inhoudelijk aangepast.

## Oplossing

De test is aangescherpt:

- Resultaatvalidatie gebeurt nu binnen de Discogs-resultatentabel via `within(resultTable)`.
- De `Nirvana`-assertie gebeurt binnen de gevonden resultaatrij.
- Filtervelden worden gezocht binnen de Discogs-modal/dialog.
- Labelselectors zijn aangescherpt naar exacte labels: `^Type$`, `^Format$`, `^Jaar$`, `^Land$`.

## Gewijzigd bestand

- `tests/react/EditDiscogsSelectionFlow.test.jsx`

## Validatiecommando

```bash
mkdir -p logs
npm run test:sprint2g-b2 2>&1 | tee "logs/test-sprint2g-b2-testfix1-$(date +%Y%m%d-%H%M%S).log"
```

## Regressiecommando

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
} 2>&1 | tee "logs/test-regression-2g-b2-testfix1-$(date +%Y%m%d-%H%M%S).log"
```
