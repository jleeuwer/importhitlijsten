# BL-IMP-088 — Install/build/test validatie professionaliseren

## Status

Open — functioneel en technisch uitgewerkt voor volgende codebouwsprint.

## Aanleiding

Tijdens recente opleveringen kwamen meerdere install/build/test-gerelateerde knelpunten naar voren:

1. Een Vite-build faalde met `UNRESOLVED_IMPORT` / `Could not resolve 'vite' in vite.config.js`.
2. De lokale omgeving had wel `vite` geïnstalleerd, maar de buildflow bleef gevoelig voor cache, lockfile, Node/npm en dependency-resolutie.
3. Het verwijderen van `node_modules` kon falen door `Resource busy` op bestanden van `vite`, `cross-env`, `tsx` en `concurrently`.
4. Opleveringen moeten betrouwbaarder aantonen welke stappen zijn uitgevoerd en waar logs staan.
5. Startscripts moeten consistent zijn met andere apps, vooral de Artist-app.

## Doel

De install/build/test-flow voor Importhitlijst professionaliseren zodat ontwikkelaar en tester voorspelbaar kunnen werken:

- duidelijke commando's;
- duidelijke logs;
- geen impliciet "alles uitvoeren" zonder keuze;
- preflight-checks voor noodzakelijke tooling;
- betere foutdiagnose bij dependency-/buildproblemen;
- consistente werkwijze met de andere MusicApp-applicaties.

## Functionele eisen

1. De gebruiker moet gericht kunnen kiezen welke stap uitgevoerd wordt: `install`, `build`, `validate`, `test`, `dev` of `all`.
2. Zonder commando mag het script niets uitvoeren en moet het usage/help tonen.
3. Elke stap schrijft naar een eigen timestamped logbestand.
4. `dev` wordt altijd als laatste uitgevoerd omdat dit een langlopend proces is.
5. De gebruiker moet logopschoning kunnen vragen via `--keep-days N`.
6. De gebruiker moet kunnen kiezen of na een fout wordt gestopt of doorgegaan via `--continue-on-error`.
7. De flow moet compatibel blijven met macOS Bash 3.2.
8. De flow moet geschikt zijn voor de bestaande Docker/PostgreSQL-werkwijze, maar mag PostgreSQL niet stilzwijgend wijzigen.

## Technische eisen

1. `startapp.sh` in de projectroot is de standaardnaam.
2. Het script moet `SCRIPT_DIR` gebruiken en vanuit de projectroot draaien.
3. Het script gebruikt `set -u` en `set -o pipefail`.
4. Het script moet `PIPESTATUS[0]` gebruiken om npm-exitcodes correct te vangen bij `tee`.
5. Het script mag niet standaard `node_modules` of `package-lock.json` verwijderen.
6. Een eventuele clean-install moet expliciet zijn, niet impliciet.
7. Preflight-validatie moet minstens controleren:
   - `npm` aanwezig;
   - `package.json` aanwezig;
   - gevraagde npm-scripts bestaan;
   - optioneel: Node/npm-versie tonen in log.
8. Build/test scripts moeten falen met duidelijke foutmelding als een vereist npm-script ontbreekt.

## Acceptatiecriteria

- `./startapp.sh` zonder argumenten voert niets uit en toont usage.
- `./startapp.sh build` voert alleen `npm run build:all` uit.
- `./startapp.sh --commands build,validate,test` voert alleen die drie taken uit.
- `./startapp.sh all` voert `install`, `build`, `validate`, `test`, `dev` uit in vaste volgorde.
- Bij falende taak stopt het script standaard met de juiste exitcode.
- Met `--continue-on-error` gaat het script verder en eindigt met de laatste foutstatus.
- Logs staan in `logs/` en hebben herkenbare prefixes.
- Het script is Bash 3.2-compatible.
