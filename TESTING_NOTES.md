# Testing Notes — Sprint 2H-S

## Uit te voeren door ontwikkelaar

```bash
mkdir -p logs
npm ci 2>&1 | tee "logs/npm-ci-$(date +%Y%m%d-%H%M%S).log"
npm run test:sprint2h-s 2>&1 | tee "logs/test-sprint2h-s-$(date +%Y%m%d-%H%M%S).log"
npm run build 2>&1 | tee "logs/build-$(date +%Y%m%d-%H%M%S).log"
```

## Database

Voor runtime-acceptatie moet de migratie zijn toegepast:

```bash
npm run db:migrate:sprint2h-s
```

## Functionele acceptatietest

1. Open een run met titels zoals `Sweet Dreams (Are Made of This)` en `Song Name (Live)`.
2. Open `Pattern suggesties`.
3. Voeg `(Are Made of This)` toe als `Titelonderdeel`.
4. Open de suggesties opnieuw.
5. Controleer dat `(Are Made of This)` niet meer als verwijderbaar voorstel verschijnt en dat de teller `Onderdrukt als titelonderdeel` oploopt.
6. Voeg `(Live)` toe als `Verwijderbaar`.
7. Controleer dat `(Live)` in `string_del_patterns` terechtkomt.
8. Controleer dat stagingtitels niet automatisch zijn aangepast.

## 2H-Z Hotfix 2
- `startapp.sh test` is gecorrigeerd van E2E-only naar `test:all`.
- Duplicate review gebruikt een stabiele staging `sh_key`; voer de HF2-migratie uit vóór functionele test.
- Physical delete test altijd met een niet-geëxporteerde import-run; bestaande export guards blokkeren mutaties na export.
- Controleer na fysieke delete zowel de staging-count als `staging_hitlijsten_delete_audit`.


## 2H-Z Hotfix 3

Aanbevolen acceptatievolgorde:

```bash
mkdir -p logs
npm ci 2>&1 | tee "logs/npm-ci-$(date +%Y%m%d-%H%M%S).log"
npm run build:all 2>&1 | tee "logs/npm-build-all-$(date +%Y%m%d-%H%M%S).log"
npm run test:sprint2h-z-hotfix3 2>&1 | tee "logs/test-2h-z-hf3-$(date +%Y%m%d-%H%M%S).log"
./startapp.sh test
```

De unitfase hoort geen `No test suite found` meer te melden. Playwright start pas nadat Vitest volledig groen is. Voor databasecommando's wordt standaard `POSTGRES_DB=musicdb` gebruikt. Hotfix 3 heeft geen nieuwe migratie.

## 2H-Z Hotfix 4
De HF3 gebruikersrun bereikte 80/82 testbestanden groen en 266/268 tests groen. De twee resterende failures waren Testing Library single-match selectors op artiesttekst die bewust in twee tabelkolommen voorkomt. HF4 wijzigt daarom alleen de testselectors en voegt een regressieguard toe.

