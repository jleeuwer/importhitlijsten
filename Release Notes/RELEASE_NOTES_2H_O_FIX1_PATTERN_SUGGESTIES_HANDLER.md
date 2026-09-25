# Release Notes — Sprint 2H-O Fix 1 — Pattern suggesties click-handler

## Fix

- Herstelt de knop **Pattern suggesties** in het Edit-scherm.
- De knop riep een niet-bestaande/in de component niet-zichtbare variabele `openPatternSuggestions` aan.
- De knop gebruikt nu de controllerhandler `ctrl.openPatternSuggestions()`.

## Tests

Toegevoegd/aangepast:

- `tests/react/EditExportStatusAwareWorkflowButtons.test.jsx`
- `npm run test:sprint2h-o-fix1`

## Resultaat

Klikken op **Pattern suggesties** opent de bestaande pattern-suggesties flow zonder runtime error.
