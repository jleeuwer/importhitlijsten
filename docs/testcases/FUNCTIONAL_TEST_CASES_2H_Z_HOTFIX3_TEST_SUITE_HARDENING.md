# Functionele testcases — 2H-Z Hotfix 3

| TC | Scenario | Verwacht resultaat | Automatische dekking |
|---|---|---|---|
| HF3-01 | `./startapp.sh test` | Start `npm run test:all` | `static_2h_z_hotfix3_test_hardening.test.js` |
| HF3-02 | Legacy testbestanden | Geen `node:test` meer onder `tests/` | static HF3 test |
| HF3-03 | Sprint npm scripts | Geen `node --test` meer in actuele package scripts | static HF3 test |
| HF3-04 | Runtime `node_modules`/`logs` aanwezig | 2H-W release-hygienetest faalt hierdoor niet | `static_2h_w_build_startapp_hardening.test.js` |
| HF3-05 | Edit met 250 regels | Pagina 1 toont 1-50; Volgende toont 51-100 | `EditLargeRunRendering.test.jsx` |
| HF3-06 | Edit met 60 regels | Paginastatus is eenduidig testbaar en page-size wijziging werkt | `EditPaginationAndTitle.test.jsx` |
| HF3-07 | Toggle geïmporteerde CSV | Verborgen file verschijnt direct zonder rescan, ook als bestandsnaam elders in dezelfde rij staat | `ImportInboxUxHotfix.test.jsx` |
| HF3-08 | Duplicate review | Geselecteerde duplicate wordt row-scoped gecontroleerd en fysieke delete vereist confirm | `StagingDuplicateReview.test.jsx` |
| HF3-09 | Runs navigatieacties | View/Edit zijn semantisch hyperlinks met titel en aria-label | `StagingResultsIconActions.test.jsx` |
| HF3-10 | Ongeldige Discogs timeout/cache env | Veilige default, geen NaN timeout | `services_discogsClient.test.js` |
| HF3-11 | App DB-status async update | Test wacht React state-update af zonder losse `act(...)` warning | `ImportFlowCleanup.test.jsx` |
| HF3-12 | PostgreSQL documentatie | Actuele migratievoorbeelden gebruiken `POSTGRES_DB=musicdb` | static HF3 test |

## Handmatige acceptatie

```bash
npm ci
npm run build:all
npm run test:sprint2h-z-hotfix3
./startapp.sh test
```

Bij databaseacceptatie blijft gelden:

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-z
POSTGRES_CONTAINER=my-postgresdb POSTGRES_DB=musicdb POSTGRES_USER=postgres npm run db:migrate:sprint2h-z-hotfix2
```

Voor Hotfix 3 zelf is geen aanvullende migratie nodig.
