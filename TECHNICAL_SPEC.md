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


---

## 2H-AA — technische implementatie

2H-AA implementeert persistent opgeslagen tijdelijke uploadkandidaten in `import_upload_candidates`, een multi-file Multer-flow, per-kandidaat JSONB conceptmetadata, veilige tempbestandsopslag, bestaande SHA/fingerprint-registryhergebruik, individuele/bulkimport en 7-daagse cleanup. De idempotente PostgreSQL-migratie staat in `scripts/sql/20260927_sprint2h_aa_import_upload_candidates.sql`; Docker-uitvoering verloopt via `npm run db:migrate:sprint2h-aa`. Zie `docs/technical/TECHNICAL_SPEC_2H_AA_DRAG_DROP_CSV_IMPORT.md`.


## 2H-AA Hotfix 2 — PostgreSQL parameter typing
`updateImportUploadCandidateMetadata` gebruikt dezelfde bindparameter `$3` voor `iuc_status` en voor de conditie die een eerdere importfout wist zodra de kandidaat `READY` wordt. PostgreSQL leidde voor die twee contexten verschillende types af. Beide usages worden daarom expliciet gecast naar `varchar(32)`. Er is geen schemawijziging en dus geen nieuwe database-migratie.
