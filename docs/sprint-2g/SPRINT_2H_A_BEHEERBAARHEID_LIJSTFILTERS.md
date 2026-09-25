# Sprint 2H-A — Beheerbaarheid en lijstfilters

## Doel

Na afronding van de 2G-lijn is de belangrijkste behoefte om import-runs makkelijker te kunnen verwerken. Vooral bij grotere lijsten moet de gebruiker snel kunnen focussen op rijen die aandacht nodig hebben, duplicates, skip-rijen of rijen met een Discogs-link.

## Scope

### BL-IMP-080 — Edit-lijst filteren tijdens verwerking

Toegevoegd in het Edit-scherm:

- filter `Verwerkingsstatus`:
  - alle rijen;
  - aandacht nodig;
  - duplicates;
  - skip;
  - met Discogs-link;
- filter `Actie`:
  - alle acties;
  - Keep;
  - Skip;
  - Delete;
- vrije `Lijstfilter` op:
  - positie;
  - artiest;
  - correcte artiest;
  - titel;
  - correcte titel;
  - jaar;
  - jaar.

De bestaande probleemfilters blijven beschikbaar.

## Functioneel gedrag

De statusregel boven de tabel toont nu naast blockers/warnings/ok ook:

```text
duplicates: <count> · skip: <count>
```

Snelfilterknoppen verschijnen voor duplicate- en skip-rijen zodra die categorieën aanwezig zijn.

`Reset filters` wist alle probleem- en verwerkingsfilters.

Batchtools die werken op zichtbare/gefilterde rijen blijven gebruikmaken van `visibleRowPositions`.

## Technische wijziging

Aangepast:

```text
src/ui/pages/EditPage.jsx
```

Uitgebreide test:

```text
tests/react/EditProblemFilters.test.jsx
```

Nieuw npm-script:

```text
npm run test:sprint2h-a
```

`validate-all.sh` draait nu ook `test:sprint2h-a`.

## Validatie

Uitgevoerd in ontwikkelomgeving:

```text
npm run test:sprint2h-a
```

Resultaat:

```text
2 test files passed
7 tests passed
```

Ook uitgevoerd:

```text
npm run build:all
```

Resultaat:

```text
✓ built
```

## Oplevering

```text
importhitlijst_sprint2h_a_beheerbaarheid_lijstfilters_20260426.zip
```
