# BL-IMP-121 — Discogs-link in schermtabel clickable maken

## Status

Open — opgenomen in Sprint 2H-X als UI-polish item.

## Aanleiding

In het Edit-scherm kan bij een hitlijstregel Discogs-informatie aanwezig zijn, bijvoorbeeld als master-URL of release-URL. De gebruiker wil deze link direct kunnen openen vanuit de schermtabel.

## Probleem

Als de Discogs-link wel aanwezig is maar niet klikbaar wordt weergegeven, moet de gebruiker de link handmatig kopiëren of via andere detailflows zoeken. Dat vertraagt controle en review.

## Gewenst gedrag

Als een hitlijstregel een Discogs-link heeft, toont de schermtabel een klikbare link of compact icoon.

Regels:

- Als `discogs_release_url` aanwezig is, gebruik die als primaire link.
- Als `discogs_release_url` ontbreekt maar `discogs_master_url` aanwezig is, gebruik `discogs_master_url`.
- Als alleen een raw/vrije link beschikbaar is, bijvoorbeeld `hl_discogs_link`, toon die alleen als hij veilig als URL kan worden geïnterpreteerd.
- De link opent in een nieuw venster of tabblad.
- Gebruik veilige attributen:
  - `target="_blank"`
  - `rel="noopener noreferrer"`
- Toon geen lege of dode link als er geen Discogs-URL aanwezig is.

## Advies

Houd deze wijziging beperkt tot de zichtbare tabel. De link blijft hitlijst-/regelmetadata. Schrijf de link niet automatisch naar `file_details.fd_discogs`; dat hoort bij BL-IMP-133 of een latere review/promote-flow.

## Acceptatiecriteria

- Een regel met `discogs_release_url` toont een klikbare Discogs-link.
- Een regel zonder release-url maar met `discogs_master_url` toont een klikbare Discogs-link.
- Een regel zonder Discogs-link toont geen klikbare link.
- De link opent in een nieuw venster/tabblad.
- De link gebruikt `rel="noopener noreferrer"`.
- De tabel blijft compact en leesbaar.
- Er zijn automatische tests voor de linkrendering.
