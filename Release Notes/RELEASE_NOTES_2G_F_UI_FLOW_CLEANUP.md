# Release Notes — Sprint 2G-F UI-flow cleanup

## Inhoud

Deze release ruimt de eindgebruikersflow op rond Edit-mode.

## Wijzigingen

- Losse `Edit`-menu-item verwijderd uit het linker Holy Grail-menu.
- Generieke `Go to edit mode`-knop verwijderd van het Import-scherm.
- Na succesvolle import verschijnt een contextuele knop `Bewerk deze import-run`.
- Deze knop navigeert naar `/edit?runId=<runId>`.
- Oude aside-tekst `Use Edit to run tools on a runId.` verwijderd.
- React-test toegevoegd voor de UI-flowwijziging.

## Test

```bash
mkdir -p logs
npm run test:sprint2g-f 2>&1 | tee "logs/test-sprint2g-f-$(date +%Y%m%d-%H%M%S).log"
```
