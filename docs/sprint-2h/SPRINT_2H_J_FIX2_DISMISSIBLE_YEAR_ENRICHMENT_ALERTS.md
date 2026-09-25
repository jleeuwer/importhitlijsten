# Sprint 2H-J Fix 2 — Sluitbare preview- en alertpanelen

## Doel

Na het uitvoeren van **Preview jaarverrijking** moet het preview-/resultaatpaneel gesloten kunnen worden. De gebruiker kan de melding wegklikken zodra de inhoud gelezen is, en een nieuwe klik op **Preview jaarverrijking** toont de actuele preview opnieuw.

## Functionele wijziging

- Het jaarverrijkingpaneel blijft een feedbackpaneel met `role="alert"` zolang het zichtbaar is.
- Als het paneel zichtbaar is, toont het rechtsboven een knop **Sluiten**.
- Als het paneel gesloten is, is ook de sluitknop niet zichtbaar.
- De previewdata hoeft bij sluiten niet functioneel toegepast te worden; sluiten verbergt alleen de melding.
- Een nieuwe klik op **Preview jaarverrijking** haalt opnieuw previewdata op en toont het paneel weer.
- Na **Jaarverrijking toepassen** wordt het resultaat opnieuw zichtbaar in hetzelfde sluitbare paneel.

## Afbakening

Deze fix verandert niets aan de jaartalverrijkingsregels uit 2H-J Fix 1:

- alleen `staging_hitlijsten.hl_jaar` wordt bijgewerkt;
- `hitlijsten` blijft ongewijzigd;
- `file_details`, `fd_key` en `hl_samenstel_fd_key` blijven ongewijzigd;
- de bestaande knop **Preview jaarverrijking** blijft de ingang voor de flow.

## Technische wijziging

In `src/ui/pages/EditPage.jsx` is state toegevoegd om de zichtbaarheid van het jaarverrijkingpaneel te sturen:

- `yearEnrichmentPreviewVisible`;
- `closeYearEnrichmentPreview`.

De preview- en apply-acties zetten het paneel zichtbaar. De knop **Sluiten** verbergt het paneel via `closeYearEnrichmentPreview`.

## Tests

De React-test `tests/react/EditYearEnrichment.test.jsx` is uitgebreid met controles voor:

- zichtbaar alertpaneel inclusief sluitknop;
- sluiten van het alertpaneel;
- sluiten verbergt ook de sluitknop;
- opnieuw tonen van het paneel na eerder verbergen.

Uitgevoerd:

```bash
mkdir -p logs
npm run test:sprint2h-j 2>&1 | tee "logs/test-sprint2h-j-fix2-$(date +%Y%m%d-%H%M%S).log"
```

Resultaat:

```text
3 testbestanden geslaagd
10 tests geslaagd
```

Build:

```bash
mkdir -p logs
npm run build 2>&1 | tee "logs/build-sprint2h-j-fix2-$(date +%Y%m%d-%H%M%S).log"
```

Resultaat: geslaagd. Vite meldt alleen de bestaande chunk-size waarschuwing.
