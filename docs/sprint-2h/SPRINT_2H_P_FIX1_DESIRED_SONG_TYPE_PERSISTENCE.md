# Sprint 2H-P Fix 1 — Gewenste versie behouden na Discogs-flow

## Aanleiding

Bij de eerste functionele test van Sprint 2H-P bleek dat de gekozen gewenste versie/song type in eerdere regels soms werd gereset nadat de gebruiker vanuit een andere regel de Discogs-flow gebruikte en terugkeerde naar de lijst.

## Oorzaak

De dropdownwaarde `hl_desired_song_type_key` werd lokaal in de rij bijgewerkt, maar pas via de algemene `Save`-knop opgeslagen. Discogs-koppelingen en sommige herstelacties verversen daarna de stagingregels vanuit de backend. Niet-opgeslagen versiekeuzes konden daardoor verdwijnen.

## Oplossing

De gewenste versie wordt nu direct per rij opgeslagen zodra de gebruiker de dropdown wijzigt.

- De frontend roept `saveDesiredSongTypeForRow(hl_positie, value)` aan bij wijziging van de dropdown.
- De rij wordt optimistisch bijgewerkt in de lokale `rows` state.
- De algemene `Save`-knop blijft bestaan voor andere rijvelden zoals Discogs-link.
- Discogs zoeken, details bekijken en koppelen wijzigen de gewenste versie niet.
- Als Discogs na koppelen de rijen refreshes, komt de gewenste versie terug uit de backend.

## Functionele regels

- De dropdown toont nog steeds omschrijvingen uit `song_types`.
- De opgeslagen waarde blijft `staging_hitlijsten.hl_desired_song_type_key`.
- De foreign key naar `song_types` blijft leidend.
- Null/leeg blijft toegestaan.
- Na export blijft wijzigen disabled via de bestaande exportstatus-guards.
- `file_details`, `hitlijsten` en Discogs-functionaliteit worden niet aangepast.

## Acceptatiecriteria

1. Een wijziging in de versie-dropdown wordt direct opgeslagen.
2. De gekozen waarde blijft zichtbaar terwijl het opslaan loopt.
3. De gekozen waarde blijft behouden na Discogs zoeken.
4. De gekozen waarde blijft behouden na Discogs details bekijken.
5. De gekozen waarde blijft behouden na Discogs koppelen en row refresh.
6. Meerdere rijen kunnen elk hun eigen versie behouden.
7. Na export blijft wijzigen disabled.
8. Tests en build slagen.

## Testcommando

```bash
npm run test:sprint2h-p-fix1
npm run build
```
