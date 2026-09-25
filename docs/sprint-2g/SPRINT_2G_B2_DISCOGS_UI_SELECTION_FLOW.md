# Sprint 2G-B2 — Discogs UI-selectieflow

## Doel

Deze sprint voegt de eerste gebruikersflow toe waarmee een gebruiker vanuit het Edit-scherm een Discogs master/release kan zoeken, filteren, selecteren en opslaan op de stagingrij.

## Scope

### BL-IMP-065 — Correctie migratiescript Sprint 2G-B1

De 2G-B1 migratiewrapper verwees nog naar de 2F-A metadata foundation migration. Dit is gecorrigeerd:

- scriptnaam/logprefix: `apply_sprint2g_discogs_backend_foundation`
- SQL-bestand: `scripts/sql/20260425_sprint2g_discogs_backend_foundation.sql`
- remote SQL-bestand in Docker: `/tmp/20260425_sprint2g_discogs_backend_foundation.sql`
- logregel: `Applying Sprint 2G-B1 Discogs backend foundation migration`

### BL-IMP-066 — Discogs UI-selectieflow in Edit

Toegevoegd aan iedere Edit-rij:

- knop **Zoek Discogs** onder het veld `Discogs Link`
- zoekbasis op basis van `Correcte Artiest Spelling` + `Correcte Songtitel`, met fallback naar staging artiest/titel
- modal **Discogs zoeken**
- filters:
  - type: `master` / `release`
  - format: album / single / EP / maxi / extended
  - jaar
  - land
- resultatentabel:
  - titel
  - artiest
  - jaar
  - type
  - format
  - land
  - Discogs URL
  - selecteerknop
- selectie-opslag via bestaand endpoint:

```text
POST /api/edit/staging/:runId/:hlPositie/discogs
```

Na selectie:

- `hl_discogs_link` wordt lokaal bijgewerkt met de master/release URL
- modal sluit
- rij wordt opnieuw ververst via bestaande refreshflow
- melding: `Discogs selectie opgeslagen voor positie ...`

## Technische implementatie

Aangepast:

```text
src/ui/pages/EditPage.jsx
scripts/apply_sprint2g_discogs_backend_foundation.sh
package.json
```

Toegevoegd:

```text
tests/react/EditDiscogsSelectionFlow.test.jsx
docs/sprint-2g/SPRINT_2G_B2_DISCOGS_UI_SELECTION_FLOW.md
```

Nieuwe helper:

```js
buildDiscogsSelectionPayload(result)
```

Deze vertaalt Discogs search results naar het bestaande 2G-B1 selectiepayload-formaat.

## Testen

Nieuw npm-script:

```bash
mkdir -p logs
npm run test:sprint2g-b2 2>&1 | tee "logs/test-sprint2g-b2-$(date +%Y%m%d-%H%M%S).log"
```

Regressie:

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
} 2>&1 | tee "logs/test-regression-2g-b2-$(date +%Y%m%d-%H%M%S).log"
```

## Validatie-opmerking

In deze opleveromgeving kon de nieuwe Vitest-test niet volledig uitgevoerd worden zonder eerst dependencies te installeren. De eerste testpoging gaf:

```text
sh: 1: vitest: not found
```

De ZIP bevat geen `node_modules`, conform projectafspraak. Draai lokaal eerst `npm install` indien nodig.
