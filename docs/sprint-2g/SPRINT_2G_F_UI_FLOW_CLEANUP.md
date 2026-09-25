# Sprint 2G-F — Eindgebruikersflow en UI-opruiming

## Doel

De Importhitlijst-flow is sinds de eerdere sprints gewijzigd: Edit werkt run-contextueel en hoort niet meer als losse navigatiekeuze te worden aangeboden. Deze sprint ruimt de UI op zodat eindgebruikers via een logische flow werken.

## Functionele wijziging

### Linker Holy Grail-menu

Verwijderd:

```text
Edit
```

De gebruiker opent Edit voortaan via:

```text
Runs → kies run → Edit
```

### Import-scherm

Verwijderd vóór import:

```text
Go to edit mode
```

Toegevoegd na succesvolle import, wanneer `runId` bekend is:

```text
Bewerk deze import-run
```

Deze knop navigeert naar:

```text
/edit?runId=<runId>
```

### Aside

Verwijderd:

```text
Use Edit to run tools on a runId.
```

Nieuwe helpertekst is contextueel:
- op Runs: kies een import-run en open daarna de bewerkflow;
- op Import: na succesvolle import kan de aangemaakte run direct worden bewerkt.

## Technische wijziging

Aangepast:

```text
src/ui/App.jsx
src/ui/nav/navConfig.js
src/ui/pages/ImportPage.jsx
package.json
```

Toegevoegd:

```text
tests/react/ImportFlowCleanup.test.jsx
```

Nieuw testscript:

```bash
npm run test:sprint2g-f
```

`npm run test:sprint2g` bevat nu ook de 2G-F test.

## Acceptatiecriteria

- Linker navigatie bevat geen losse Edit-entry.
- Import-scherm zonder runId toont geen generieke Edit mode knop.
- Import-scherm met runId toont `Bewerk deze import-run`.
- De nieuwe editlink gebruikt `/edit?runId=<runId>`.
- Oude aside-helpertekst is verwijderd.
- Run-contextuele Edit-flow blijft intact.

## Validatiecommando's

```bash
mkdir -p logs
npm run test:sprint2g-f 2>&1 | tee "logs/test-sprint2g-f-$(date +%Y%m%d-%H%M%S).log"
```

```bash
mkdir -p logs
npm run test:sprint2g 2>&1 | tee "logs/test-sprint2g-$(date +%Y%m%d-%H%M%S).log"
```
