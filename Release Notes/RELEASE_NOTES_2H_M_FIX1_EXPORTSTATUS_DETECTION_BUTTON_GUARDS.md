# Release Notes — Sprint 2H-M Fix 1

## Sprint

Sprint 2H-M Fix 1 — Exportstatus-detectie en button guards corrigeren

## Fixes

- Herstelt dat geëxporteerde runs in de Edit UI niet als geëxporteerd werden herkend doordat exportstatusvelden niet naar lokale state werden overgenomen.
- `alreadyExported`, `existingRowsForTarget`, `hl_hitlijst` en `hl_uitzendjaar` worden nu bewaard in de frontendstatus.
- Pre-export workflowbuttons worden nu daadwerkelijk disabled bij geëxporteerde runs.
- Rij-level staging-only acties worden ook disabled.
- Backend guards zijn toegevoegd aan directe staging-mutatie endpoints.
- Correctie na export blijft beschikbaar als veilige flow.

## Tests

Nieuw/aangepast:

- `tests/react/EditExportStatusNormalize.test.jsx`
- `tests/static_exportWorkflowGuards.test.js`
- `tests/react/EditExportStatusAwareWorkflowButtons.test.jsx`
- `tests/services_exportWorkflowGuardService.test.js`

Nieuw script:

```bash
npm run test:sprint2h-m-fix1
```
