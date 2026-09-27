# Laatste sprint

## 2H-Z Hotfix 4 — Pagination Test Selector Hardening

**Versie:** 1.1.0  
**Status:** code opgeleverd; klaar voor lokale acceptatietest.

### Aanleiding

De volledige `test:all` run van Hotfix 3 verbeterde van 20 falende testbestanden naar nog slechts 2 falende tests. Beide failures kwamen uit Edit-pagineringtests en hadden dezelfde oorzaak: een artiestnaam staat bewust zowel in de kolom **Artiest** als in **Correcte Artiest Spelling**. Een `getByText()`-assertie verwacht exact één match en faalde daardoor ondanks correct paginagedrag.

### Opgelost

1. `EditPaginationAndTitle.test.jsx` gebruikt multi-match-veilige presence/absence assertions.
2. `EditLargeRunRendering.test.jsx` gebruikt dezelfde robuuste selectorstrategie.
3. De UI of pagineringslogica is niet aangepast: de test is afgestemd op de bestaande, correcte rendering.
4. Een regressietest bewaakt dat deze twee tests niet terugvallen naar single-match selectors voor bewust dubbele artiesttekst.
5. Nieuwe sprintscript: `npm run test:sprint2h-z-hotfix4`.

### Database

Hotfix 4 heeft geen nieuwe database-migratie. Indien de 2H-Z/HF2 migraties nog nodig zijn:

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-z
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-z-hotfix2
```

### Testen

```bash
npm run test:sprint2h-z-hotfix4
./startapp.sh test
```

`./startapp.sh test` moet eerst de volledige Vitest-suite groen afronden; pas daarna start door de `&&`-keten Playwright.

### Bekend niet-blokkerend punt

In de aangeleverde Hotfix 3-run komen nog `TimeoutNaNWarning`-meldingen voor. Ze veroorzaken geen test failure, maar blijven een apart test-harness/third-party transition cleanup-punt.

### Buiten scope

BL-IMP-135 drag-and-drop CSV-selectie blijft open.
