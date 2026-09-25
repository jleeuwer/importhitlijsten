# Sprint 2H-G — Runs en Edit UX polish

## Doel

Deze sprint verbetert de dagelijkse verwerkingsflow in Importhitlijst. De nadruk ligt op compactere acties in het Runs-overzicht, duidelijker context in het Edit-scherm en paginering onder de liedjestabel.

## Backlog-items

### BL-IMP-095 — Runs-overzicht acties vervangen door iconen met tooltips

De tekstacties in het Runs-overzicht zijn vervangen door compacte Bootstrap-icon buttons:

- View staging: `<i class="bi bi-view-list"></i>`
- Open Edit: `<i class="bi bi-pencil"></i>`
- Metadata: `<i class="bi bi-list"></i>`
- Verwijder: `<i class="bi bi-trash2"></i>`

Elke actie heeft een `title` voor hover/tooltip en een duidelijk `aria-label` voor toegankelijkheid. De delete-actie blijft herkenbaar als danger button.

### BL-IMP-098 — Edit-scherm toont titel van de lijst/run

Het Edit-scherm toont nu de actieve lijst/run bovenaan, bijvoorbeeld:

```text
Bewerken: Top 2000 — 2026
```

Wanneer beschikbaar toont de contextregel ook omroep, periode en runId.

### BL-IMP-099 — Paginering onder liedjestabel in Edit-scherm

Onder de liedjestabel is paginering toegevoegd:

- regels per pagina: 25, 50, 100, 250
- huidige pagina en totaal aantal pagina’s
- Eerste / Vorige / Volgende / Laatste
- bij filterwijzigingen gaat de tabel terug naar pagina 1

## Technische wijziging

De eerdere tijdelijke `visibleRowLimit` / “Load more”-logica is vervangen door expliciete paginering op de gefilterde rijenset. De gefilterde rijposities blijven beschikbaar voor batchacties, zodat bestaande verwerking op de gefilterde set intact blijft.

## Validatie

Nieuw script:

```bash
mkdir -p logs
npm run test:sprint2h-g 2>&1 | tee "logs/test-sprint2h-g-$(date +%Y%m%d-%H%M%S).log"
```

Regressie:

```bash
mkdir -p logs
{
  echo "=== test:sprint2h-g ==="
  npm run test:sprint2h-g

  echo "=== test:sprint2h ==="
  npm run test:sprint2h

  echo "=== test:sprint2g ==="
  npm run test:sprint2g
} 2>&1 | tee "logs/test-regression-2h-g-$(date +%Y%m%d-%H%M%S).log"
```
