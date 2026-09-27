# Technical Spec — actuele baseline 2H-Z Hotfix 3

> De oorspronkelijke 2H-S technische specificatie blijft hieronder behouden als historische baseline.

## Database

Nieuwe tabel:

```sql
CREATE TABLE IF NOT EXISTS public.string_keep_patterns (
  skp_key serial PRIMARY KEY,
  skp_pattern text NOT NULL,
  skp_pattern_normalized text NOT NULL,
  skp_description text,
  skp_created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT string_keep_patterns_pattern_normalized_uk UNIQUE (skp_pattern_normalized)
);
```

Migratie:

```bash
npm run db:migrate:sprint2h-s
```

## Backend

Aangepast:

```text
services/patternDiscoveryService.js
routes/indexroutes.js
```

Belangrijke helpers:

```text
normalizePatternValue
PATTERN_CLASSIFICATIONS
addPatternsToStringKeepPatterns
addPatternsToStringDelPatterns
groupPatternCandidates
```

Nieuwe route:

```text
POST /api/edit/runs/:runId/pattern-suggestions/add-keep
```

## Frontend

Aangepast:

```text
src/ui/pages/EditPage.jsx
```

Toegevoegd:

- classificatiekolom in Pattern Suggesties;
- knop `Toevoegen als verwijderbaar`;
- knop `Toevoegen als titelonderdeel`;
- teller `Onderdrukt als titelonderdeel`.

## Tests

```bash
npm run test:sprint2h-s
```

Testbestanden:

```text
tests/services_patternDiscoveryService.test.js
tests/static_patternKeepRemoveClassificationDocs.test.js
tests/static_patternKeepRemoveClassificationCode.test.js
tests/static_patternDiscoveryRoutes.test.js
tests/react/EditPatternKeepRemoveClassification.test.jsx
```

---

## 2H-Z Hotfix 2 — technische aanvulling
BL-IMP-136 is geïmplementeerd in `services/stagingDuplicateRowService.js` en `src/ui/components/StagingDuplicateReview.jsx`. De migratie voegt `staging_hitlijsten.sh_key` en `staging_hitlijsten_delete_audit` toe. API-endpoints onder `/api/edit/run/:runId/staging-duplicates` leveren scan, Skip en fysieke delete. Physical delete wordt binnen één database-transactie geaudit, uitgevoerd en gevolgd door synchronisatie van `import_runs.ir_row_count`.


---

## 2H-Z Hotfix 3 — technische aanvulling

- Legacy `node:test` suites zijn geconverteerd naar Vitest met `@vitest-environment node` voor niet-DOM tests.
- Package scripts en package-updaters gebruiken geen `node --test` meer.
- `StagingResults.jsx` gebruikt echte `<a href>` elementen voor navigatieacties.
- `EditPage.jsx` biedt stabiele aria-labels voor rijensamenvatting en paginastatus.
- `discogsClient.js` gebruikt `parsePositiveNumberConfig` om NaN/0/ongeldige timeout- en cachewaarden af te vangen.
- HF3 heeft geen nieuwe database-migratie.
