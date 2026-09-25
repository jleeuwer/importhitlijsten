# Sprint 2H-I Fix 1 — Correctieknop ook beschikbaar bij Save-only rijen

## Aanleiding

Tijdens functionele test bleek dat de post-export correctieactie alleen bereikbaar was via de bestaande Edit/diagnostics actie. Rijen die functioneel al voldoende compleet zijn tonen in de actiekolom soms alleen **Save** en daardoor kon de gebruiker daar geen artiest/titel-correctie na export starten.

## Functionele correctie

De actie **Correctie** is nu losgekoppeld van de blocking/diagnostics-status van een rij.

- Rijen met een blocking-signaal tonen nog steeds **Edit**.
- Alle relevante rijen tonen daarnaast **Correctie**.
- De knop **Correctie** opent dezelfde edit/diagnostics modal en zet direct de sectie **Correctie na export** open.
- Daarmee kan de gebruiker ook correcte artiest/titel aanpassen voor rijen die alleen **Save** als standaardactie hadden.

## Technische wijziging

In `src/ui/pages/EditPage.jsx` is `openEditModal` uitgebreid met een optionele parameter:

```js
openEditModal({ postExportMode: true })
```

Daarnaast is een aparte handler toegevoegd:

```js
openPostExportCorrectionModal()
```

Deze opent de modal en activeert direct de post-export correctieflow.

## Tests

`tests/react/EditPostExportCorrection.test.jsx` bevat nu een regressietest die controleert dat een rij zonder **Edit**-knop, maar met **Save**, toch een **Correctie**-knop toont en de post-export correctievelden opent.

## Validatie

```bash
mkdir -p logs
npm run test:sprint2h-i 2>&1 | tee "logs/test-sprint2h-i-fix1-$(date +%Y%m%d-%H%M%S).log"
```
