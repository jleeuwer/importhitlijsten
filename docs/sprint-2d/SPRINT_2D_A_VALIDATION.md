# Sprint 2D-A-V — Validatie UX & Diagnose

## Doel
Deze validatiesprint bevestigt dat de Sprint 2D-A UX- en diagnoseverbeteringen stabiel werken bovenop de herstelde Edit-baseline.

## Uitgangspunt
Technische terugvalbaseline:

- `baseline_edit_screen_restored_2026-04-19`

Te valideren functionele versie:

- `importhitlijst_sprint2d_a_ux_diagnostics`

## Automatische validatie

Voer uit vanuit de projectroot:

```bash
npm install
npm run test:validation:2d-a
```

Of via het shellscript:

```bash
./scripts/validate_sprint2d_a.sh
```

Deze testset dekt:

- UX diagnostics en reason labels
- lazy/large-run rendering
- probleemfilters
- reason-code filters
- async exportstatus
- exportstatus aside
- row diagnostics
- batch swap repair
- forced/manual repair
- tekstnormalisatie
- encoding repair
- relevante services achter deze flows

## Handmatige validatiechecklist

### 1. Start en runselectie
- [ ] `npm run dev:5174` start zonder compile errors.
- [ ] Home/Runs opent normaal.
- [ ] Een bestaande run kan vanuit Home/Edit geopend worden.
- [ ] `?runId=<uuid>` opent de Edit-pagina zonder herhaalde reload-loop.

### 2. Edit-rendering
- [ ] Edit-scherm blijft zichtbaar en verdwijnt niet na korte flits.
- [ ] De eerste batch rijen wordt getoond.
- [ ] Bij veel rijen verschijnt `Load 50 more`.
- [ ] `Load all matching rows` werkt zonder directe crash.

### 3. Status en reason badges
- [ ] Blocked rijen tonen geen groen OK-vinkje.
- [ ] Warning rijen tonen warningstatus.
- [ ] Ready rijen tonen ready/OK-status.
- [ ] Reason badges zijn menselijk leesbaar.
- [ ] Meerdere reasons per rij zijn zichtbaar.

### 4. Filters
- [ ] `Show only problem rows` werkt.
- [ ] `Only blockers` werkt.
- [ ] `Only warnings` werkt.
- [ ] Reason-code dropdown werkt.
- [ ] Klikbare reason summary buttons werken.
- [ ] Reset filters zet alle filters terug.

### 5. Diagnosemodal
- [ ] Rij kan via Edit/details geopend worden.
- [ ] Statusbanner is zichtbaar.
- [ ] Probleemuitleg is zichtbaar.
- [ ] Advies/actiepad is zichtbaar.
- [ ] Bronvelden en afgeleide waarden zijn duidelijk gescheiden.

### 6. Read-only en editgedrag
- [ ] `Correcte Songtitel` blijft read-only/automatisch.
- [ ] `Correcte Artiest Spelling` blijft read-only/automatisch.
- [ ] Bronvelden kunnen alleen via de bedoelde manual-correction flow aangepast worden.
- [ ] `Discogs Link` blijft bewerkbaar waar deze flow dat ondersteunt.

### 7. Bestaande herstelacties
- [ ] Swap repair werkt nog.
- [ ] Forced swap voor zichtbare/gefilterde rijen werkt nog.
- [ ] Manual correction slaat bronvelden op en herberekent afgeleide waarden.
- [ ] Tekstnormalisatie preview werkt.
- [ ] Tekstnormalisatie uitvoeren werkt.
- [ ] Encoding repair preview werkt.
- [ ] Encoding repair uitvoeren werkt bij herstelbare mojibake.
- [ ] Replacement-character schade wordt als handmatig te corrigeren gemeld.

### 8. Exportstatus aside
- [ ] Edit opent zonder te wachten op exportstatus.
- [ ] Exportstatus verschijnt later in de aside.
- [ ] Exportstatusfout blokkeert de Edit-tabel niet.
- [ ] Multiple matches blijven warning en blokkeren export niet op zichzelf.

## Baselinebesluit
Wanneer automatische tests slagen en de handmatige checklist akkoord is, mag deze versie worden vastgelegd als:

```text
baseline_sprint2d_a_ux_diagnostics_validated_2026-04-25
```

## Bekende aandachtspunten na validatie
Deze validatie verandert nog niets aan het datamodel. De eerstvolgende functionele bouwsprint blijft:

- Sprint 2F-A — Metadatafundament hitlijsten

Daarna kunnen volgen:

- Sprint 2F-B — Clipboard copy `<artiest> - <titel>`
- Sprint 2D-B — Flow en exportguardrails
- Sprint 2D-C — Batch jaarverrijking
- Sprint 2G-A/2G-B — Discogs onderzoek en implementatie
