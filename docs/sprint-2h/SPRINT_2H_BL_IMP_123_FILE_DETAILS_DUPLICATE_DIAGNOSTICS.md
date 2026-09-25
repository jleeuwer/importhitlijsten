# Sprint 2H — BL-IMP-123 File Details duplicate diagnostics

## Aanleiding

Bij controle van de Importhitlijst-flow is geconstateerd dat `file_details` veel songs bevat die dubbel lijken voor te komen per hitlijst en versie. Onduidelijk is of dit historisch is of ontstaat bij de flow Importhitlijst → export hitlijsten.

## Scope

Binnen scope:

- Read-only diagnose van functionele duplicaten in `file_details`.
- Analyse van koppelingen vanuit `hitlijsten.fd_key` en `hitlijsten.hl_samenstel_fd_key`.
- Voor/na-export meetpunt om te bewijzen of export nieuwe `file_details` records aanmaakt.
- Documentatie en testbasis.

Buiten scope:

- Automatische merge/cleanup.
- Nieuwe unieke constraints op `file_details`.
- UI voor duplicate review.
- Fuzzy duplicate detection.

## Functionele guardrail

De Importhitlijst-export mag geen nieuwe `file_details` records aanmaken. Ontbrekende of ambigue gewenste versies moeten blokkeren of naar review gaan.

## Definitie functionele duplicate

Een groep wordt als duplicate gezien wanneer actieve `file_details` records dezelfde functionele signatuur delen:

```text
fd_artist_key + normalized(fd_correct_artist) + normalized(fd_tag_title) + fd_song_type_key + normalized(fd_hitlijst)
```

`fd_action = delete` wordt buiten de hoofdmeting gehouden.

## Acceptatiecriteria

- Diagnostics draaien read-only tegen Docker PostgreSQL.
- Output bevat samenvattende aantallen.
- Output toont top duplicate groups.
- Output toont detailregels inclusief `fd_key`, versie, hitlijst, Discogs-link en timestamps.
- Output toont referenties vanuit `hitlijsten.fd_key` en `hitlijsten.hl_samenstel_fd_key`.
- Output bevat baselinewaarden voor voor/na-export controle.
- Geen destructieve SQL aanwezig.

## Vervolgadvies

Na analyse van de logs:

1. Historisch probleem: plan BL-IMP-125 duplicate cleanup/review.
2. Actieve bug: plan BL-IMP-124 preventie in import/promote/export-flow.
3. Los daarvan blijft BL-IMP-119 nodig voor exacte duplicate hitlijstimport op basis van lijstinhoud.

## Geen automatische cleanup

Deze sprint bevat alleen diagnose. Er worden geen bestaande `file_details` records gemerged, aangepast of verwijderd.
