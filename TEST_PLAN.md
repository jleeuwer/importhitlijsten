# Test Plan — Sprint 2H-S Pattern keep/remove classification

| TC | Scenario | Verwacht resultaat | Automatische dekking |
|---|---|---|---|
| 2H-S-01 | Keep-pattern onderdrukt verwijdervoorstel | Bekend titelonderdeel wordt niet als verwijderbaar getoond | `tests/services_patternDiscoveryService.test.js` |
| 2H-S-02 | Genormaliseerde keep-match | `(Are Made of This)` en `Are Made of This` matchen | `tests/services_patternDiscoveryService.test.js` |
| 2H-S-03 | Verwijderbaar pattern toevoegen | Endpoint/service voor remove blijft aanwezig | `tests/static_patternDiscoveryRoutes.test.js` |
| 2H-S-04 | Titelonderdeel toevoegen | Endpoint/service voor keep is aanwezig | `tests/static_patternDiscoveryRoutes.test.js`, `tests/react/EditPatternKeepRemoveClassification.test.jsx` |
| 2H-S-05 | Keep heeft voorrang op remove | Keep-candidate wordt onderdrukt | `tests/services_patternDiscoveryService.test.js` |
| 2H-S-06 | Safe version pattern | `(Radio Edit)`, `(Live)`, remaster met jaar zijn veilig verwijderbaar | `tests/services_patternDiscoveryService.test.js` |
| 2H-S-07 | Onzekere gewone zin | Titelzin krijgt `LIKELY_TITLE_CONTENT` of reviewstatus | `tests/services_patternDiscoveryService.test.js` |
| 2H-S-08 | Reeds bekende remove-pattern | Bestaand pattern krijgt geen nieuwe variant | `tests/services_patternDiscoveryService.test.js` |
| 2H-S-09 | Duplicate keep insert | Unique constraint op normalized keep voorkomt dubbele rijen | `tests/static_patternKeepRemoveClassificationCode.test.js` |
| 2H-S-10 | Preview blijft zichtbaar | UI behoudt previewflow naast keep/remove acties | `tests/react/EditPatternKeepRemoveClassification.test.jsx` |
| 2H-S-11 | Geen staging-mutatie | Pattern Suggesties schrijft alleen naar patternlijsten | service/API ontwerp en acceptatietest |
| 2H-S-12 | Schema guard | Migratie bevat tabel/kolommen/unique constraint | `tests/static_patternKeepRemoveClassificationCode.test.js` |

## Scripts

```bash
npm run db:migrate:sprint2h-s
npm run test:sprint2h-s
npm run build
```
