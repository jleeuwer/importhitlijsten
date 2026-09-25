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
