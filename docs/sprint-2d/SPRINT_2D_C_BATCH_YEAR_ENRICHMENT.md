# Sprint 2D-C — Batch jaarverrijking vanuit file_details

## Doel

Rijen in `staging_hitlijsten` waarbij `hl_jaar` ontbreekt of `0` is, veilig batchmatig aanvullen vanuit `file_details`.

## Functionele regels

Een stagingrij wordt alleen automatisch bijgewerkt als:

1. `hl_jaar` leeg, `NULL` of `0` is;
2. `fd_tag_title` gevuld is;
3. `hl_artist_key` gevuld is;
4. de combinatie `fd_tag_title + hl_artist_key` exact één match heeft in `file_details`;
5. die match een bruikbaar jaar heeft in `fd_year_song_publish` of, als fallback, `fd_year_song_version`.

Rijen worden overgeslagen als:

- `hl_jaar` al gevuld is;
- er geen file_details-match is;
- er meerdere matches zijn;
- er geen bruikbaar jaar op de match staat.

## Backend

Nieuwe service:

```text
services/editYearEnrichmentService.js
```

Nieuwe functies:

```js
previewYearEnrichmentForRun(client, runId, hlPosities)
applyYearEnrichmentForRun(client, runId, hlPosities)
```

Nieuwe API endpoints:

```text
POST /api/edit/run/:runId/preview-enrich-years
POST /api/edit/run/:runId/enrich-years
```

Beide endpoints accepteren optioneel:

```json
{
  "hlPosities": [1, 2, 3]
}
```

Als `hlPosities` leeg is, wordt de volledige run verwerkt. Vanuit de Edit UI wordt standaard de huidige zichtbare/gefilterde selectie gestuurd.

## UI

In de Edit-aside zijn twee acties toegevoegd:

- `Preview jaarverrijking`
- `Vul jaar uit file_details`

De preview/resultaatmelding toont aantallen voor:

- requested
- scanned
- updateable
- updated
- ambiguous
- no match
- no usable year
- already filled

Daarnaast toont de Edit-pagina een compacte preview van de eerste resultaten.

## Tests

Nieuwe tests:

```text
tests/services_editYearEnrichmentService.test.js
tests/react/EditYearEnrichment.test.jsx
```

Nieuw npm-script:

```bash
npm run test:sprint2d-c
```

Gecombineerd script:

```bash
npm run test:sprint2d
```

## Acceptatiecriteria

- Alleen stagingrijen met ontbrekend/0-jaar worden kandidaat.
- Alleen exact één file_details-match wordt automatisch verrijkt.
- Meerdere matches worden als ambiguous overgeslagen.
- Geen match wordt overgeslagen.
- Geen bruikbaar jaar wordt overgeslagen.
- De gebruiker krijgt een duidelijke preview/resultaatsamenvatting.
- De actie werkt op de zichtbare/gefilterde rijen binnen de huidige run.
