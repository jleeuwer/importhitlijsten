# Sprint 2H-K — Discogs detailinspectie vanuit zoekmodal

## Doel

BL-IMP-085 is uitgewerkt zodat de gebruiker vanuit de Discogs zoekmodal eerst een master/release kan inspecteren voordat hij de entry koppelt aan de stagingregel.

Details bekijken is alleen inspectie. Er wordt niets opgeslagen zolang de gebruiker niet expliciet **Koppel** of **Koppel deze entry** kiest.

## Functionele wijzigingen

- Per Discogs-resultaat is een knop **Details** toegevoegd.
- De backend haalt details op via `/api/discogs/details/:type/:id`.
- De detailweergave toont type, artiest, titel, jaar, land, formats, compact catalogusnummer, Discogs-link en tracklist.
- De tracklist toont positie, titel en duur wanneer Discogs die informatie levert.
- Vanuit de detailweergave kan de gebruiker terug naar resultaten.
- Een bekeken resultaat krijgt de badge **Bekeken**.
- Vanuit details kan de gebruiker **Koppel deze entry** uitvoeren met dezelfde opslaglogica als de bestaande Koppel-knop.
- De bestaande Koppel-knop blijft rechts in de resultatentabel staan.

## Bewuste uitsluiting Label(s)

Label(s) worden niet getoond in de resultatentabel en ook niet in de detailweergave. Discogs label-data kan groot, herhalend en onoverzichtelijk zijn. De inspectie richt zich daarom op velden die direct helpen bij het beoordelen van de juiste release of master: type, artiest, titel, jaar, land, formats, catalogusnummer, Discogs URL en vooral tracklist/duur.

## Niet in scope

- Geen automatische update van `file_details`.
- Geen overname van `fd_duration`, `fd_year_song_publish` of `fd_year_song_version`.
- Geen cover image opslag.
- Geen databasewijzigingen.
- Geen automatische songtype-bepaling.

## Acceptatiecriteria

1. De gebruiker kan vanuit een Discogs-resultaat details bekijken.
2. Release/master details worden via backend opgehaald.
3. Details bekijken wijzigt geen stagingdata.
4. Tracklist wordt getoond wanneer beschikbaar.
5. Label(s) worden nergens in de Discogs resultaat- of detailweergave getoond.
6. De gebruiker kan terug naar de resultaten.
7. Het bekeken resultaat wordt gemarkeerd met **Bekeken**.
8. De gebruiker kan vanuit details **Koppel deze entry** uitvoeren.
9. Bestaande filters en koppelflow blijven werken.
10. Jaarverrijking uit 2H-J blijft staging-only.

## Validatie

```bash
mkdir -p logs
npm run test:sprint2h-k 2>&1 | tee "logs/test-sprint2h-k-$(date +%Y%m%d-%H%M%S).log"
npm run build 2>&1 | tee "logs/build-sprint2h-k-$(date +%Y%m%d-%H%M%S).log"
```
