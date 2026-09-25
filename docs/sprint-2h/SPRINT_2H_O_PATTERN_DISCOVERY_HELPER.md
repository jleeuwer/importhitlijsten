# Sprint 2H-O — Pattern discovery helper voor String Patterns

## Doel

Deze sprint voegt een veilige helper toe die kandidaatpatterns in songtitels herkent en de gebruiker helpt om geselecteerde concrete varianten toe te voegen aan de bestaande tabel `public.string_del_patterns`.

De helper past geen titels automatisch aan. De bestaande tabel blijft leidend:

```sql
public.string_del_patterns(st_key, st_string_delete)
```

## Functionele regels

- Detectie richt zich op suffixpatterns zoals `(Live)`, `[Radio Edit]`, `{Demo}` en `- Extended Mix`.
- Tijdens import wordt een samenvatting van kandidaatpatterns berekend en getoond.
- In Edit kan de gebruiker via **Pattern suggesties** kandidaten bekijken.
- De gebruiker selecteert concrete varianten en voegt ze toe aan `string_del_patterns.st_string_delete`.
- Bestaande patterns worden case-insensitive herkend, ook al is de unieke index exact op `st_string_delete`.
- Er worden geen stagingregels gewijzigd en er wordt niets automatisch verwijderd.

## Slimme grouping

De discovery gebruikt twee niveaus:

1. concrete vondst, bijvoorbeeld `(2011 Remaster)`;
2. canonieke groep, bijvoorbeeld **Remaster met jaartal**.

Varianten zoals `(2011 Remaster)`, `(Remaster 2011)`, `(Remastered 2011)` en `(2020 remastered)` worden gegroepeerd als `remaster_with_year`. Zo ziet de gebruiker dat het functioneel dezelfde familie is, zonder direct wildcardregels in de database te introduceren.

## Bewuste beperking

De bestaande tabel heeft alleen `st_string_delete text`. Daarom slaat 2H-O geen generieke wildcard- of regexregels op. Geselecteerde concrete varianten worden toegevoegd. Een aparte vervolgsprint kan echte `<YEAR>`-/regexondersteuning ontwerpen.

## Nieuwe backendonderdelen

- `services/patternDiscoveryService.js`
- `GET /api/edit/runs/:runId/pattern-suggestions`
- `POST /api/edit/runs/:runId/pattern-suggestions/preview`
- `POST /api/edit/runs/:runId/pattern-suggestions/add`

## Nieuwe frontendflow

In de Edit-toolbar staat **Pattern suggesties** bij Normaliseren. De modal toont groepen, varianten, aantallen, voorbeelden, preview en toevoegen aan String Patterns.

## Acceptatiecriteria

- Kandidaatpatterns worden herkend in songtitels.
- Remaster/remastered + jaartalvarianten worden gegroepeerd.
- Detectie is hoofdletteronafhankelijk.
- De bestaande tabel `public.string_del_patterns` wordt gebruikt.
- De gebruiker kan selectief concrete patterns toevoegen.
- Titels/staging worden niet automatisch gewijzigd.
- Tests dekken detectie, grouping, preview en endpoints.
