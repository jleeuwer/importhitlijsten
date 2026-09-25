# Sprint 2H-F — Manual repair candidate polish

## Doel

Verbeter de handmatige herstel-flow nadat zoeken in `file_details` is gesplitst in artiest- en titelvelden.
De gebruiker moet sneller zien welke kandidaat de beste match is en welke versie gekozen wordt.

## Functioneel

- Kandidaten uit `file_details` krijgen een matchtype: `Exact`, `Sterke match` of `Gedeeltelijk`.
- Exacte artiest+titel matches worden bovenaan getoond.
- De resultatenlijst toont extra versiecontext: songtype, jaar, duur en bestandsnaam.
- Actieve `file_details` filtering blijft consequent: `Delete`, `Duplicates` en `Skip` worden uitgesloten.

## Technisch

Toegevoegd:

- `services/fileDetailsCandidateService.js`
- `tests/services_fileDetailsCandidateService.test.js`

Aangepast:

- `services/editManualCorrectionService.js`
- `src/ui/pages/EditPage.jsx`
- `package.json`

## Testen

```bash
mkdir -p logs
npm run test:sprint2h-f 2>&1 | tee "logs/test-sprint2h-f-$(date +%Y%m%d-%H%M%S).log"
```
