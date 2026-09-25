# BL-IMP-124 Hotfix 4 — Export niet blokkeren bij meerdere file_details-kandidaten

## Status

Opgeleverd als 2H-Y Hotfix 4.

## Bevinding

De eerdere 2H-Y interpretatie blokkeerde export wanneer `fd_tag_title + hl_artist_key` meerdere `file_details` kandidaten opleverde. Dat bleek functioneel onjuist: meerdere versies zijn juist normaal en gewenst binnen Importhitlijst.

## Nieuwe regel

| Situatie | Exportgedrag |
|---|---|
| 0 kandidaten voor artiest + titel | Blocking |
| 1 kandidaat voor artiest + titel | Export toegestaan |
| Meerdere kandidaten voor artiest + titel | Export toegestaan met warning |

## Samenstelling

De definitieve versie/song_type-keuze wordt pas in de samenstelfase bepaald via song_type-prioriteit en aanvullende metadata zoals gewenste versie en Discogs-link.
