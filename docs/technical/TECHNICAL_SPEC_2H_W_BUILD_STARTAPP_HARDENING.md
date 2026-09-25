# Technical spec — 2H-W Build/startapp hardening

## Target file

```text
startapp.sh
```

Het bestand moet in de projectroot staan en uitvoerbaar zijn.

## Bash compatibility

De implementatie moet compatibel zijn met de standaard Bash 3.2 op macOS.

Daarom:

- geen associatieve arrays;
- voorzichtig met lege array-expansie onder `set -u`;
- `PIPESTATUS[0]` gebruiken na pipelines;
- POSIX-achtige constructies waar praktisch.

## Scriptstructuur

De structuur volgt de Artist-opzet:

1. `usage()`
2. `error()`
3. helpers voor integer-validatie en action-list parsing
4. `cleanup_logs()`
5. `run_npm_task()`
6. argument parsing
7. preflight checks
8. vaste taakvolgorde
9. exit met totale status

## Action model

Ondersteunde acties:

- `install`
- `build`
- `validate`
- `test`
- `dev`
- `all`

`all` expandeert naar alle acties.

Dubbele acties worden maar één keer uitgevoerd.

## Vaste volgorde

```text
install build validate test dev
```

De opgegeven volgorde door de gebruiker bepaalt dus niet de uitvoervolgorde. Dit voorkomt dat `dev` midden in een reeks terechtkomt.

## NPM mapping

| Action | NPM script | Log prefix |
|---|---|---|
| install | install:all | npm-install-all |
| build | build:all | npm-build-all |
| validate | validate | validate |
| test | test:e2e | test-e2e |
| dev | dev:5174 | dev-5174 |

## Preflight checks

Minimaal:

```bash
command -v npm >/dev/null 2>&1
[ -f "$SCRIPT_DIR/package.json" ]
```

Aanbevolen aanvullend voor codebouw:

- check of `package.json` gevraagde scripts bevat;
- toon `node -v` en `npm -v` in log;
- geef duidelijke fout als `npm run <script>` ontbreekt.

## Clean install

Niet standaard onderdeel van `startapp.sh`.

Een clean install kan later als expliciet commando worden ontworpen, maar niet impliciet omdat eerdere tests `Resource busy` problemen op `node_modules` lieten zien. Voorzichtigheid is nodig, mogelijk met aparte diagnose-instructies (`lsof`, `ps`, `pkill`) in documentatie.

## Database/Docker

Deze sprint introduceert geen database-migratie.

Startapp mag geen PostgreSQL-container muteren. Database-migraties blijven expliciet via aparte npm-scripts en Docker-gerichte scripts, bijvoorbeeld:

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_USER=postgres POSTGRES_DB=musicdb npm run db:migrate:<sprint>
```

## Automatische teststrategie

Voor shell-scriptgedrag zijn drie niveaus mogelijk:

1. Static test: bestand bestaat, usage bevat alle acties, mapping is correct.
2. Dry-run test: later toevoegen via `--dry-run` als gewenst.
3. Integration smoke: script uitvoeren tegen stub `npm` in tijdelijke PATH.

Voor de eerstvolgende codebouw is minimaal niveau 1 vereist. Niveau 3 is wenselijk.

## Codebouwspecificatie

### startapp.sh

Het bestand `startapp.sh` is Bash 3.2-compatible en gebruikt:

- `set -u`
- `set -o pipefail`
- `SCRIPT_DIR` om vanuit de scriptdirectory te draaien
- `LOG_DIR="$SCRIPT_DIR/logs"`
- commandoparser voor `install`, `build`, `validate`, `test`, `dev`, `all`
- `--commands` voor kommagescheiden commandolijsten
- `--keep-days` voor logopschoning
- `--continue-on-error` voor batchvalidatie

De vaste volgorde is:

```text
install build validate test dev
```

`dev` wordt altijd als laatste verwerkt.

### Package script updater

`apply_2h_w_package_scripts.js` voegt alleen toe:

```json
{
  "preflight:2h-w": "node scripts/preflight_2h_w.js",
  "test:sprint2h-w": "node --test tests/static_2h_w_build_startapp_hardening.test.js"
}
```

Bestaande scripts worden niet overschreven.

### Preflight

`preflight_2h_w.js` controleert read-only:

- aanwezigheid package.json
- vereiste npm scripts
- aanwezigheid en inhoud van `startapp.sh`
- Node 20+
- waarschuwing als Vite dependencies ontbreken

### Database

Geen database-objecten of migraties nodig.
