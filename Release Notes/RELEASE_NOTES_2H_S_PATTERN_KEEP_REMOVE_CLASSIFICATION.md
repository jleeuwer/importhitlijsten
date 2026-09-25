# Release Notes — Sprint 2H-S Pattern keep/remove classification

## Status

Codebouw opgeleverd; klaar voor acceptatietest.

## Nieuw

- Nieuwe tabel `public.string_keep_patterns` voor niet-verwijderbare titelonderdelen.
- Nieuw migratiescript `npm run db:migrate:sprint2h-s`.
- Pattern discovery onderdrukt bekende keep-patterns als verwijderbare suggestie.
- Pattern Suggesties modal heeft twee acties:
  - `Toevoegen als verwijderbaar` → `string_del_patterns`
  - `Toevoegen als titelonderdeel` → `string_keep_patterns`
- Kandidaten krijgen classificaties zoals `SAFE_REMOVE_PATTERN`, `LIKELY_TITLE_CONTENT` en `KNOWN_KEEP_PATTERN`.
- Genormaliseerde matching behandelt `(Are Made of This)` en `Are Made of This` als dezelfde waarde.

## Aangepaste bestanden

- `services/patternDiscoveryService.js`
- `routes/indexroutes.js`
- `src/ui/pages/EditPage.jsx`
- `scripts/sql/20260704_sprint2h_s_string_keep_patterns.sql`
- `scripts/apply_sprint2h_s_string_keep_patterns.sh`
- `package.json`
- test- en documentatiebestanden.

## Tests

Nieuw/uitgebreid script:

```bash
npm run test:sprint2h-s
```

Dekpunten:

- keep-patterns onderdrukken verwijdervoorstellen;
- genormaliseerde keep-match;
- classificatie van veilige en onzekere patterns;
- route voor `add-keep`;
- UI-knoppen voor verwijderbaar/titelonderdeel;
- migratie en schema-guard.
