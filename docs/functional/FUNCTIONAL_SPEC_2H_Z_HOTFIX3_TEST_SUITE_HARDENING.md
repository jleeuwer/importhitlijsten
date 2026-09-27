# Functioneel ontwerp — 2H-Z Hotfix 3 Test Suite Hardening

## Functionele impact

De gebruikersfunctionaliteit van 2H-Z blijft gelijk. Deze hotfix maakt de kwaliteitscontrole betrouwbaar en corrigeert één accessibility-detail in het Runs-overzicht.

### Testgedrag

- `./startapp.sh test` blijft `npm run test:all` uitvoeren.
- `test:all` voert eerst alle Vitest unit/service/static/React-tests uit en daarna Playwright E2E.
- Een falende unit-suite blokkeert terecht de E2E-fase.
- Historische sprinttests controleren de historische sprintdocumenten zelf en niet langer of een oude sprint nog in `laatstesprint.md` staat.

### Runs-overzicht

De acties **View staging**, **Open Edit** en de blocked-Discogs download zijn navigatieacties en worden daarom als echte hyperlinks aangeboden. Visueel blijven ze compacte Bootstrap-knoppen.

### Configuratiefouten Discogs

Niet-numerieke of niet-positieve waarden voor Discogs timeout/cache mogen geen `TimeoutNaNWarning` veroorzaken. De applicatie gebruikt dan de bestaande veilige defaults.

### PostgreSQL naam

Alle actuele instructies gebruiken standaard database `musicdb` en container `my-postgresdb`.
