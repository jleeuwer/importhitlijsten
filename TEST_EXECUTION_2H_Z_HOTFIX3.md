# Test execution — 2H-Z Hotfix 3 / v1.1.0

## Bronbevinding

De gebruikersrun `test-all-20260927-104659.log` liet zien:

- `test:all` start correct met `test:unit` en daarna `test:e2e`;
- Vitest rapporteerde 81 testbestanden: 61 passed, 20 failed;
- 196 testcases: 189 passed, 7 failed;
- 13 van de 20 failed files waren legacy `node:test` bestanden die door Vitest werden geïmporteerd en daarna `No test suite found` gaven;
- overige failures betroffen verouderde/brittle assertions en één link-semantiekprobleem.

## HF3 wijzigingen

- 13 legacy suites naar Vitest geconverteerd;
- `node --test` uit actuele package scripts/package-fragmenten/updaters verwijderd;
- 2H-W runtime/package hygiene test gecorrigeerd;
- documentatie-, paginering-, import-inbox- en duplicate-review assertions gehard;
- Runs navigation anchors accessibility gecorrigeerd;
- Discogs numeric config fallback toegevoegd;
- duplicate fixture-key en async React warning aangepakt;
- PostgreSQL default/documentatie naar `musicdb` geharmoniseerd.

## Checks uitgevoerd in bouwomgeving

### Syntax

- `node --check` op gewijzigde JS/static-testbestanden: **OK**.
- `bash -n` op relevante shellscripts: **OK**.
- package JSON-fragmenten: **JSON parse OK**.
- package.json / package-lock version: **1.1.0 / 1.1.0**.

### Legacy assertions smoke

De 13 geconverteerde legacy suites zijn tijdelijk met Node's test-runner uitgevoerd om hun assertions onafhankelijk van Vitest dependency-installatie te valideren:

```text
65 tests
65 passed
0 failed
```

### HF3 statische smoke

- 82 non-E2E testbestanden gecontroleerd op resterende `node:test` imports: **0 gevonden**.
- package scripts gecontroleerd op `node --test`: **0 gevonden**.
- startapp mapping, semantic links, Discogs fallback en `musicdb` documentatie/defaults: **OK**.

## Niet volledig uitvoerbaar in deze sandbox

`npm ci` kon hier niet volledig worden afgerond omdat de npm-registry niet volledig beschikbaar/cached was (`ENOTCACHED` voor o.a. zod bij offline herhaling). Daardoor wordt geen volledige Vitest + Playwright run als geslaagd geclaimd.

## Acceptatie op Mac

```bash
npm ci
npm run build:all
npm run test:sprint2h-z-hotfix3
./startapp.sh test
```

Verwacht: de 13 `No test suite found` failures verdwijnen en de eerder gemelde 7 assertions zijn aangepast aan de actuele functionaliteit.
