# Sprint 2H-W — Install/build/test en startapp hardening

## Doel

De ontwikkel- en acceptatieflow van Importhitlijst robuuster en consistenter maken voordat verdere codebouwsprints worden geïntegreerd.

## Scope

- BL-IMP-088 — Install/build/test validatie professionaliseren.
- BL-IMP-132 — `startapp.sh` gelijk trekken met robuuste Artist-opzet.

## Achtergrond

De Importhitlijst-startflow was oorspronkelijk lineair: alle stappen werden direct achter elkaar uitgevoerd. De Artist-app heeft een robuustere startapp-opzet waarbij de gebruiker expliciet kiest welke taak of taken uitgevoerd worden. Deze opzet moet voor Importhitlijst worden overgenomen, met behoud van de Importhitlijst-specifieke npm-scripts.

Daarnaast is tijdens build-/installtests gebleken dat dependency- en lockfile-problemen beter diagnoseerbaar moeten zijn. De start- en validatieflow moet daarom expliciete logs en duidelijke fouten opleveren.

## Functionele scope

1. Commandogestuurde `startapp.sh`.
2. Per taak timestamped logs.
3. Usage/help zonder automatische run.
4. Optionele logopschoning.
5. Optioneel doorgaan na fouten.
6. Consistente taakvolgorde.
7. Preflight-validatie voor npm/package/scripts.
8. Documentatie en testcases.

## Buiten scope

- Inhoudelijke 2H-V warning/status bugfixes.
- Nieuwe database-migraties.
- Automatisch cleanen van `node_modules`.
- Aanpassen van Vite-config, tenzij de codebouwsprint expliciet een preflight/diagnostic script toevoegt.

## Resultaat van de latere codebouw

De codebouw moet minimaal opleveren:

- `startapp.sh`
- eventuele `scripts/check_startapp_environment.js` of vergelijkbaar
- tests voor startapp-documentatie of shell-scriptgedrag
- bijgewerkte docs en release notes

## Codebouw-aanvulling 2026-08-30

Deze sprint is na de designfase uitgewerkt naar concrete code.

Opgeleverd:

- `startapp.sh` onder de standaardnaam, niet langer als `startapp_importhitlijst_robust.sh`.
- `scripts/preflight_2h_w.js` voor read-only controle op package-scripts, `startapp.sh` en Node-versie.
- `scripts/apply_2h_w_package_scripts.js` voor veilige toevoeging van npm scripts.
- `tests/static_2h_w_build_startapp_hardening.test.js` als automatische statische regressietest.

Geen database-migratie nodig.
