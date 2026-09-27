# Sprint 2H-AA Hotfix 1 — Test stability & accessibility

**Applicatieversie:** 1.2.0  
**Work item:** 2H-AA-HF1  
**Parent:** BL-IMP-135 / 2H-AA  
**Type:** releasecorrectie vóór acceptatie; geen nieuwe SemVer-versie.

## Aanleiding
De volledige `test:all` run op de doel-Mac rapporteerde 5 failures bij 276 geslaagde tests. De failures betroffen één verouderde versieassertion, twee 5s timeouts in zware pagineringstests, één ontbrekende label/input-associatie en één onjuist gescopeerde focusassertion.

## Correcties
- historische 2H-Z-test vergelijkt voortaan package-lock-versies met de actuele `package.json`-versie in plaats van hardcoded 1.1.0;
- directory-invoer heeft `id=import-directory` en gekoppelde `htmlFor`;
- single-upload focustest controleert expliciet het metadataformulier van de tijdelijke kandidaat;
- bestandsnaamassertion accepteert dat dezelfde naam bewust in tabel en detailpaneel staat;
- twee zware Edit-pagineringregressies krijgen uitsluitend lokaal een timeout van 10 seconden;
- geen productiegedrag van paginering of drag-and-drop wordt teruggedraaid.

## Database
Geen nieuwe migratie. De 2H-AA migratie blijft ongewijzigd van toepassing.
