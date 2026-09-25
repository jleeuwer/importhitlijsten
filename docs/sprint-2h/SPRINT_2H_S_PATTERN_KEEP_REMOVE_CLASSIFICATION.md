# Sprint 2H-S — Pattern discovery keep/remove classification

## Backlog-item

```text
BL-IMP-118 — Pattern discovery: keep/remove classification voor haakjespatronen
```

## Status

```text
Codebouw opgeleverd; klaar voor acceptatietest
```

Sprint 2H-S lost de false positives in Pattern discovery op waarbij haakjesinhoud die onderdeel is van de officiële titel als verwijderbaar patroon werd voorgesteld.

## Aanleiding

Sprint 2H-O / 2H-O Fix 1 heeft de Pattern discovery helper functioneel bruikbaar gemaakt en is akkoord gesloten. Tijdens gebruik bleek dat de helper ook tekst tussen haakjes herkent als mogelijk verwijderbaar patroon wanneer die tekst in werkelijkheid onderdeel is van de officiële titel.

Voorbeelden die niet als verwijderbaar voorgesteld mogen worden:

```text
Sweet Dreams (Are Made of This)
(Everything I Do) I Do It for You
(I Just) Died in Your Arms
```

Voorbeelden die wel als verwijderbaar/versioneel patroon voorgesteld mogen worden:

```text
Song Name (2011 Remaster)
Song Name (Live)
Song Name (Radio Edit)
Song Name (12" Mix)
```

## Functioneel opgeleverd

### 1. Twee beheerbare patternlijsten

De bestaande lijst blijft de lijst met verwijderbare opschoonpatronen:

```text
public.string_del_patterns
```

Nieuw toegevoegd is de lijst met niet-verwijderbare titelonderdelen:

```text
public.string_keep_patterns
```

Functionele betekenis:

- `string_del_patterns` = tekst die bij pattern delete als opschoonpattern verwijderd mag worden;
- `string_keep_patterns` = tekst die onderdeel is van de titel en niet als verwijderbaar pattern voorgesteld mag worden.

### 2. Pattern discovery checkt keep vóór remove

De discovery-flow gebruikt nu deze volgorde:

```text
1. Vind kandidaat tussen haakjes/brackets/accolades of dash suffix.
2. Normaliseer de kandidaatwaarde.
3. Check tegen string_keep_patterns.
4. Staat de waarde in keep? Dan wordt hij onderdrukt als verwijderbare suggestie.
5. Staat de waarde niet in keep? Dan wordt hij geclassificeerd en getoond als kandidaat.
6. Staat de waarde al in string_del_patterns? Dan wordt hij als bestaande verwijderbare variant gemarkeerd.
```

### 3. UI-acties in Pattern Suggesties

De Pattern Suggesties modal ondersteunt nu twee acties voor geselecteerde varianten:

```text
Toevoegen als verwijderbaar
Toevoegen als titelonderdeel
```

Gedrag:

- **Toevoegen als verwijderbaar** schrijft naar `string_del_patterns`.
- **Toevoegen als titelonderdeel** schrijft naar `string_keep_patterns`.
- Na toevoegen als titelonderdeel wordt hetzelfde pattern bij volgende suggesties niet meer als verwijderbaar voorgesteld.
- Titels en stagingregels worden niet automatisch aangepast door Pattern Suggesties.

### 4. Classificatie

Kandidaten krijgen een classificatie en badge:

```text
SAFE_REMOVE_PATTERN
NEEDS_REVIEW
LIKELY_TITLE_CONTENT
KNOWN_KEEP_PATTERN
KNOWN_REMOVE_PATTERN
```

Richtlijn:

- `SAFE_REMOVE_PATTERN`: bekende versie-/mix-/edit-termen of remaster met jaar.
- `NEEDS_REVIEW`: niet duidelijk veilig, maar mogelijk opschoonbaar.
- `LIKELY_TITLE_CONTENT`: gewone titelzin of subtitel zonder versie-indicator.
- `KNOWN_KEEP_PATTERN`: staat in `string_keep_patterns`; wordt onderdrukt als verwijderbare suggestie.
- `KNOWN_REMOVE_PATTERN`: staat al in `string_del_patterns`.

## Technisch opgeleverd

### Migratie

Nieuw bestand:

```text
scripts/sql/20260704_sprint2h_s_string_keep_patterns.sql
```

Maakt tabel:

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

Nieuw migratiescript:

```bash
npm run db:migrate:sprint2h-s
```

### Backend

Aangepast:

```text
services/patternDiscoveryService.js
routes/indexroutes.js
```

Belangrijke exports/helpers:

```text
normalizePatternValue(value)
PATTERN_CLASSIFICATIONS
addPatternsToStringKeepPatterns(patterns)
addPatternsToStringDelPatterns(patterns)
groupPatternCandidates(candidates, existingPatterns, keepPatterns)
```

Nieuwe endpoint:

```text
POST /api/edit/runs/:runId/pattern-suggestions/add-keep
```

Bestaande endpoints blijven:

```text
GET  /api/edit/runs/:runId/pattern-suggestions
POST /api/edit/runs/:runId/pattern-suggestions/preview
POST /api/edit/runs/:runId/pattern-suggestions/add
```

### Normalisatie

`normalizePatternValue(value)` gebruikt voor keep/remove matching:

- trim begin/einde;
- collapse meerdere whitespace naar één spatie;
- verwijder buitenste haakjes/brackets/accolades als die de hele waarde omsluiten;
- lowercase via `nl-NL` locale.

Voorbeelden:

| Input | Normalized |
|---|---|
| `(Are Made of This)` | `are made of this` |
| `Are Made of This` | `are made of this` |
| `  (2011   Remaster) ` | `2011 remaster` |
| `(12" Mix)` | `12" mix` |

## Functionele testcases en geautomatiseerde dekking

| TC | Scenario | Geautomatiseerde dekking |
|---|---|---|
| 2H-S-01 | Keep-pattern onderdrukt verwijdervoorstel | `tests/services_patternDiscoveryService.test.js` |
| 2H-S-02 | Genormaliseerde keep-match | `tests/services_patternDiscoveryService.test.js` |
| 2H-S-03 | Verwijderbaar pattern toevoegen | static route/service tests |
| 2H-S-04 | Titelonderdeel toevoegen | static route/service/UI tests |
| 2H-S-05 | Keep heeft voorrang op remove-suggestie | `tests/services_patternDiscoveryService.test.js` |
| 2H-S-06 | Safe version pattern | `tests/services_patternDiscoveryService.test.js` |
| 2H-S-07 | Onzekere gewone zin | `tests/services_patternDiscoveryService.test.js` |
| 2H-S-08 | Reeds bekende remove-pattern | `tests/services_patternDiscoveryService.test.js` |
| 2H-S-09 | Duplicate keep insert | DB unique constraint + static migration test |
| 2H-S-10 | Preview blijft zichtbaar | bestaande preview + UI static test |
| 2H-S-11 | Geen automatische staging-mutatie | service flow blijft read/add-only |
| 2H-S-12 | Schema guard | `tests/static_patternKeepRemoveClassificationCode.test.js` |

Nieuw/uitgebreid testscript:

```bash
npm run test:sprint2h-s
```

## Acceptatiecriteria

1. Een pattern dat in `string_keep_patterns` staat, wordt niet meer als verwijderbaar voorgesteld.
2. De gebruiker kan vanuit Pattern Suggesties een kandidaat toevoegen aan `string_del_patterns`.
3. De gebruiker kan vanuit Pattern Suggesties een kandidaat toevoegen aan `string_keep_patterns`.
4. Toevoegen aan `string_keep_patterns` gebruikt genormaliseerde matching.
5. `(Are Made of This)` en `Are Made of This` worden als hetzelfde keep-pattern behandeld.
6. Bekende keep-patterns worden onderdrukt als verwijderbare actie.
7. Veilige versionele/remaster/mix-patronen krijgen `SAFE_REMOVE_PATTERN`.
8. Onzekere haakjesinhoud wordt niet automatisch als veilig verwijderbaar behandeld.
9. Pattern discovery zelf past geen stagingdata aan.
10. BL-IMP-116 wildcard/generieke patterns blijft buiten scope.

## Niet-doelen

- Geen wildcard/regex-patterns; dat blijft BL-IMP-116.
- Geen automatische promotie naar `file_details` of `song_spelling`.
- Geen automatische titelmutaties vanuit Pattern Suggesties.
