# Technical Spec — Sprint 2H-S

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
