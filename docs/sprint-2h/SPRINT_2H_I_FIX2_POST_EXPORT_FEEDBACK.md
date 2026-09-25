# Sprint 2H-I Fix 2 — Terugkoppeling post-export correctie

## Aanleiding

De post-export correctie werkte technisch, maar na toepassen was voor de gebruiker niet duidelijk zichtbaar of de wijziging ook echt naar `hitlijsten` was gepropageerd.

## Functionele verbetering

Na **Bevestig correctie** blijft de modal open en toont een expliciet resultaatblok:

- `staging_hitlijsten` bijgewerkt: ja/nee
- `hitlijsten` bijgewerkt: aantal records
- audit vastgelegd: correction id indien beschikbaar
- oude en nieuwe correcte artiest
- oude en nieuwe correcte titel
- waarschuwingen, bijvoorbeeld dat een samengestelde koppeling ongewijzigd is gebleven

Hiermee is het onderscheid duidelijk tussen:

- **Impact preview**: wat gaat er gebeuren?
- **Resultaat na toepassen**: wat is er daadwerkelijk gebeurd?

## Technische wijziging

`applyPostExportCorrection` retourneert nu expliciete resultaatvelden:

- `stagingUpdated`
- `stagingUpdatedCount`
- `hitlijstenUpdatedCount`
- `auditId`
- `changedFields.artist`
- `changedFields.title`
- `warnings`
- `composedImpact.hlSamenstelFdKeyChanged = false`

De audit insert gebruikt nu `RETURNING correction_id`, zodat de UI het audit-id kan tonen.

## Tests

Uitgebreid:

- `tests/services_postExportCorrectionService.test.js`
- `tests/react/EditPostExportCorrection.test.jsx`

De React-test controleert dat het resultaatblok zichtbaar wordt na apply.
