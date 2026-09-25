# Sprint 2H-I — Correcties na export

## Doel

Deze sprint voegt een veilige correctieflow toe voor artiest-/titelcorrecties nadat een import-run al naar `hitlijsten` is geëxporteerd en mogelijk al is samengesteld.

## Functionele keuzes

- Alleen de correcte artiest en/of correcte titel worden gewijzigd.
- De oorspronkelijke lijstwaarden `hl_artiest` en `hl_titel_song` blijven historisch intact.
- De nieuwe correcte artiest moet bestaan in `artist`.
- De nieuwe correcte titel/song moet bestaan in `file_details` in combinatie met de gekozen `artist_key`.
- Correcties worden daarom gekozen via een bestaande actieve `file_details`-regel.
- De broncorrectie start in `staging_hitlijsten` en wordt daarna gepropageerd naar de corresponderende `hitlijsten`-regel.
- `hl_samenstel_fd_key` wordt nooit stilzwijgend gewijzigd.

## Matchstrategie naar hitlijsten

Voor propagatie wordt de corresponderende `hitlijsten`-regel gezocht via:

```text
hl_hitlijst + hl_uitzendjaar + hl_positie + omroep_key + periode_key
```

Voor `omroep_key` en `periode_key` wordt SQL `IS NOT DISTINCT FROM` gebruikt, zodat `NULL` veilig matcht op `NULL`.

Als er meerdere matches zijn, blokkeert de preview/apply-flow. Als de run geëxporteerd lijkt, maar geen corresponderende regel wordt gevonden, blokkeert apply eveneens.

## UI-flow

In de Edit-modal is een sectie **Correctie na export** toegevoegd:

1. Zoek correcte artiest en titel in bestaande `file_details`.
2. Kies een kandidaat via **Preview**.
3. Controleer impact:
   - oude correcte artiest/titel;
   - nieuwe correcte artiest/titel;
   - aantal gematchte `hitlijsten`-regels;
   - waarschuwing bij samengestelde regel.
4. Bevestig correctie.

Bij samengestelde regels moet de gebruiker expliciet bevestigen dat `hl_samenstel_fd_key` ongewijzigd blijft.

## Backend

Nieuwe endpoints:

```text
POST /api/edit/staging/:runId/:hlPositie/post-export-correction/preview
POST /api/edit/staging/:runId/:hlPositie/post-export-correction/apply
```

Nieuwe service:

```text
services/postExportCorrectionService.js
```

## Migratie

Nieuwe migratie:

```text
scripts/sql/20260426_sprint2h_i_post_export_corrections.sql
scripts/apply_sprint2h_i_post_export_corrections.sh
```

De migratie maakt:

- audit-tabel `importhitlijst_corrections_audit`;
- index `idx_hitlijsten_post_export_correction_match`;
- index `idx_staging_hitlijsten_post_export_correction_match`.

## Audit

Elke apply schrijft naar `importhitlijst_corrections_audit` met oude waarden, nieuwe waarden, run/positie/context, aantal aangepaste hitlijsten-records, samengestelde status en reden/opmerking.

## Tests

Nieuw testscript:

```bash
npm run test:sprint2h-i
```

Dekking:

- preview met veilige vijfkoloms-match;
- blokkade bij meerdere hitlijstenmatches;
- apply met staging-update, hitlijsten-update en audit;
- UI-flow voor zoeken, preview en toepassen.
