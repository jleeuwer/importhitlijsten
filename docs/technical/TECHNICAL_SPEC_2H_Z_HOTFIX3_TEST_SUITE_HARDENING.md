# Technisch ontwerp — 2H-Z Hotfix 3 Test Suite Hardening

## Test-runner

Alle testbestanden onder `tests/` worden door Vitest beheerd, behalve Playwright onder `tests/e2e/`.

Legacy bestanden met:

```js
import test from 'node:test';
```

of CommonJS `require('node:test')` zijn geconverteerd naar:

```js
import { test } from 'vitest';
```

Niet-DOM suites krijgen `/** @vitest-environment node */` zodat zij niet onnodig in jsdom draaien.

## npm scripts

Historische `node --test` commando's in `package.json`, package-fragmenten en package-updaters zijn vervangen door `vitest run --config vite.config.js ...`.

Nieuwe gerichte suite:

```bash
npm run test:sprint2h-z-hotfix3
```

## Testhardening

- Edit-paginering heeft stabiele aria-labels `Rijensamenvatting liedjestabel` en `Paginastatus liedjestabel`.
- Tests scopen duplicate zichtbare teksten naar de relevante tabelrij.
- Historische documentatietests controleren hun eigen sprintdocument in plaats van het mutable `laatstesprint.md`.
- De 2H-W packagingtest controleert release-metadata/.gitignore in plaats van de live ontwikkelmap, waar `node_modules` en `logs` tijdens een test juist aanwezig mogen zijn.

## Accessibility

`react-bootstrap` `Button as="a"` gaf in de geteste DOM `role="button"`. Navigatieacties in `StagingResults.jsx` zijn daarom echte `<a href>`-elementen met Bootstrap button classes.

## Discogs configuratie

`services/discogsClient.js` gebruikt `parsePositiveNumberConfig(value, fallback)`. Alleen finite positieve getallen worden geaccepteerd; anders wordt de veilige default gebruikt.

## Database

Hotfix 3 bevat **geen nieuwe database-migratie**. De al bestaande 2H-Z- en HF2-migraties blijven onderdeel van de volledige package. Hun standaard database is `musicdb`.
