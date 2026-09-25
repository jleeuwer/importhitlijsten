# BL-IMP-132 — startapp.sh gelijk trekken met robuuste Artist-opzet

## Status

Open — deels gerealiseerd als losse robuuste variant, maar nog niet formeel geïntegreerd als standaard `startapp.sh` in een volledige codeoplevering.

## Aanleiding

De oorspronkelijke Importhitlijst-startscriptvariant voerde alle stappen direct achter elkaar uit:

- `npm run install:all`
- `npm run build:all`
- `npm run validate`
- `npm run test:e2e`
- `npm run dev:5174`

De Artist-app gebruikt een robuuster model waarbij de gebruiker expliciet aangeeft welke stappen uitgevoerd moeten worden. Dit model moet ook voor Importhitlijst gelden.

Er is al een robuuste Importhitlijst-variant opgesteld, maar deze werd eerder opgeleverd als `startapp_importhitlijst_robust.sh`. Voor de gebruiker is afgesproken dat toekomstige opleveringen het bestand standaard `startapp.sh` noemen.

## Doel

Een `startapp.sh` voor Importhitlijst die qua opzet gelijk is aan de Artist-startapp:

- commandogestuurd;
- macOS Bash 3.2-compatible;
- per taak een eigen log;
- `dev` altijd als laatste;
- expliciete keuze voor `install`, `build`, `validate`, `test`, `dev` of `all`;
- geen automatische run zonder argumenten.

## Importhitlijst-specifieke command mapping

| Startapp-commando | NPM-script |
|---|---|
| `install` | `npm run install:all` |
| `build` | `npm run build:all` |
| `validate` | `npm run validate` |
| `test` | `npm run test:e2e` |
| `dev` | `npm run dev:5174` |
| `all` | install → build → validate → test → dev |

## Niet in scope

- Automatisch verwijderen van `node_modules`.
- Automatisch verwijderen van `package-lock.json`.
- Automatisch uitvoeren van database-migraties.
- Stilzwijgend aanpassen van `package.json`.

## Acceptatiecriteria

1. Bestand heet `startapp.sh`.
2. Bestand staat in de projectroot.
3. `chmod +x startapp.sh` maakt het uitvoerbaar.
4. Zonder argumenten toont het script usage en exitcode 2.
5. `./startapp.sh build` draait alleen build.
6. `./startapp.sh validate test` draait validate en test in vaste volgorde.
7. `./startapp.sh --commands build,validate,test` werkt.
8. `./startapp.sh all` draait alle stappen in vaste volgorde.
9. `dev` start altijd als laatste, ook als de gebruiker het eerder in de commandlijst opgeeft.
10. Logs worden naar `logs/` geschreven met timestamp.
