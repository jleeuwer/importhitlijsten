# Sprint 2H-O Fix 1 — Pattern suggesties click-handler

## Aanleiding

Na oplevering van Sprint 2H-O was de knop **Pattern suggesties** zichtbaar in het Edit-scherm, maar klikken op de knop gaf in de browser een runtime error:

```text
Can't find variable: openPatternSuggestions
```

## Oorzaak

De knop riep in `EditAside` een losse variabele/functie `openPatternSuggestions()` aan. In de actuele componentstructuur wordt de handler door de controller (`ctrl`) geleverd en moet de knop dus `ctrl.openPatternSuggestions()` aanroepen.

## Oplossing

- De knop **Pattern suggesties** roept nu `ctrl.openPatternSuggestions()` aan.
- De bestaande controllerfunctie blijft verantwoordelijk voor:
  - suggestions ophalen via `/api/edit/runs/:runId/pattern-suggestions`;
  - loading state tonen;
  - modal openen;
  - melding/status bijwerken.
- Er is een regressietest toegevoegd die klikt op **Pattern suggesties** en controleert dat de controllerhandler wordt aangeroepen zonder runtime-fout.

## Functionele acceptatiecriteria

- Klikken op **Pattern suggesties** geeft geen JavaScript runtime error.
- De handler voor pattern suggestions wordt aangeroepen.
- De bestaande pattern discovery service en routes blijven ongewijzigd werken.
- Sprinttest en build slagen.

## Testcommando

```bash
npm run test:sprint2h-o-fix1
npm run build
```
