# Functionele specificatie — 2H-Y Hotfix 4

## Doel

Maak export naar `hitlijsten` bruikbaar voor lijsten met veel mixen/versies, zonder terug te vallen op onveilige willekeurige variantkeuze.

## Functionele regels

1. De export valideert of `artiest + titel` voorkomt in `file_details`.
2. De export blokkeert wanneer er geen enkele match is.
3. De export blokkeert niet wanneer er meerdere matches zijn.
4. Meerdere matches worden getoond als waarschuwing/informatie.
5. Versie/song_type-informatie en Discogs-links blijven belangrijk als metadata binnen Importhitlijst.
6. De definitieve concrete versie wordt bepaald bij samenstelling, niet bij export.

## Verwachte melding

Bij meerdere kandidaten:

```text
Export allowed with warning: meerdere file_details-kandidaten gevonden. Versie/song_type wordt bepaald bij samenstellen.
```

Niet meer:

```text
Export blocked: ... MULTIPLE_FILE_DETAILS_COMBINED_MATCHES
```
