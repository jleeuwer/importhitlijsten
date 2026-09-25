# BL-IMP-127 — Variant-aware `file_details` matching en duplicate-diagnose verfijnen

## Status

Open — opgenomen in Sprint 2H-Y design.

## Aanleiding

Eerdere diagnose op dubbele `file_details`-groepen liet zien dat veel ogenschijnlijke duplicaten eigenlijk legitieme varianten, mixes, remixes, radio edits of releasevarianten kunnen zijn. Een voorbeeld als “Age of Love — The Age of Love” kan meerdere geldige varianten hebben.

## Probleem

De bestaande duplicate- en matchdiagnose is te grof wanneer alleen artiest, titel, songtype en hitlijst worden bekeken. Daardoor kunnen geldige varianten als duplicaat worden gezien, of kan een export naar de verkeerde concrete songvariant wijzen.

## Functionele wens

Matching en duplicate-diagnose moeten onderscheid maken tussen:

1. songniveau: artiest + titel;
2. gewenste versie/songtype: bijvoorbeeld original, remix, live, radio edit;
3. concrete variant/mix/release: specifieke uitvoering of Discogs release/master;
4. hitlijstcontext: welke lijstpositie om welke gewenste versie vraagt.

## Scope

- Definieer matchniveaus en beslisregels.
- Maak zichtbaar waarom iets een duplicate lijkt of juist een geldige variant is.
- Gebruik BL-IMP-124 om ambigue kandidaten niet automatisch door te laten.
- Gebruik BL-IMP-133 om Discogs-links niet automatisch op verkeerd variantniveau te promoten.
- Bereid latere cleanup van bestaande duplicate groups voor, maar voer die niet automatisch uit.

## Buiten scope

- Directe automatische samenvoeging van `file_details` records.
- Massale cleanup van bestaande database.

## Acceptatiecriteria

1. Diagnose maakt onderscheid tussen echte duplicaten en mogelijke varianten.
2. Ambigue variantkeuze leidt tot review/blokkade, niet tot automatische export.
3. Discogs master/release-data wordt gebruikt als extra signaal, niet als blind overwrite-mechanisme.
4. Bestaande lokale waarden worden niet stilzwijgend overschreven.
5. De output is bruikbaar als basis voor BL-IMP-125 cleanup/review.
