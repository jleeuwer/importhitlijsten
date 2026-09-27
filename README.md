# Import Hitlijsten — 2H-Z Hotfix 3 / v1.1.0

Deze volledige codebase bevat Sprint **2H-Z — CSV Import Registry & Exact Duplicate Detection**, Hotfix 1 voor de import-inbox UX, Hotfix 2 voor **post-import duplicate row review** en Hotfix 3 voor **test-suite hardening**.

De applicatieversie blijft **1.1.0**, gelijk aan de documentatiesprint. De 2H-Z releasecandidate is nog niet geaccepteerd; daarom wordt geen nieuwe SemVer geïntroduceerd.

## Installeren

```bash
npm ci
```

## Database

Voor een omgeving die 2H-Z nog niet heeft:

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-z
```

Daarna voor Hotfix 2:

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-z-hotfix2
```

Hotfix 3 heeft **geen nieuwe database-migratie**.

## Testen

```bash
./startapp.sh test
```

Dit voert uit:

```bash
npm run test:all
```

`test:all` bestaat uit:

```text
Vitest unit/service/static/React
→ daarna Playwright E2E
```

Gerichte Hotfix 3 regressietest:

```bash
npm run test:sprint2h-z-hotfix3
```

Volledige validatie:

```bash
./startapp.sh validate
```

`validate` voert reproduceerbaar `npm ci`, build en `test:all` uit. `./startapp.sh all` gebruikt deze validatie één keer en start daarna de development-server.

## Hotfix 3

De volledige testrun na HF2 bracht legacy `node:test` suites, verouderde UI assertions en enkele waarschuwingen aan het licht. HF3:

- brengt alle niet-E2E tests onder Vitest;
- actualiseert paginering-, inbox-, duplicate-review- en documentatietests;
- voorkomt dat live `node_modules`/`logs` ten onrechte als release-packagefout worden gezien;
- maakt Runs-navigatieacties semantisch echte links;
- voorkomt `TimeoutNaNWarning` door veilige Discogs config-fallback;
- wacht React async DB-statusupdates correct af;
- gebruikt `musicdb` als standaard PostgreSQL database in actuele instructies.

## Duplicate review

Open een import-run in Edit en gebruik **Zoek dubbele rijen**. Duplicates worden bepaald op genormaliseerde artiest + titel, onafhankelijk van positie. Er vindt nooit automatische delete plaats. De gebruiker kan geselecteerde extra regels op `Skip` zetten of na expliciete bevestiging fysiek uit staging verwijderen. Fysieke delete wijzigt nooit `file_details` en nooit het bronbestand.

## Release packaging

Dit pakket is een volledige applicatiesnapshot zonder `node_modules`, `dist`, logs, `.git`, `.release` of live secrets. De definitieve release-tools metadata `BASE_BRANCH` en `BASE_COMMIT` kan pas worden ingevuld nadat de Import Hitlijsten repository/Git `.release` discovery beschikbaar is; deze waarden worden niet gegokt.

## Actuele test-hotfix
De actuele 2H-Z test-hardening is **Hotfix 4 (v1.1.0)**. Gebruik `npm run test:sprint2h-z-hotfix4` voor de gerichte regressie en `./startapp.sh test` voor de volledige suite.

