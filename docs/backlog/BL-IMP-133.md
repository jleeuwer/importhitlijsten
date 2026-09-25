# BL-IMP-133 — Discogs-link lifecycle van staging naar `hitlijsten` en `file_details` expliciet maken

## Status

Open — opgenomen in Sprint 2H-Y design.

## Bevindingen

De huidige datastroom lijkt uit meerdere niveaus te bestaan:

```text
Discogs-link toegevoegd in Importhitlijst
        ↓
staging_hitlijsten
  - hl_discogs_link
  - discogs_master_url
  - discogs_release_url
        ↓ export
hitlijsten
  - discogs_master_url
  - discogs_release_url
        ↓
niet automatisch naar file_details.fd_discogs
```

Belangrijke observaties:

- `staging_hitlijsten` bevat een vrije/raw linkkolom `hl_discogs_link`.
- `staging_hitlijsten` bevat ook gestructureerde Discogs-velden, waaronder master/release URL’s.
- `hitlijsten` bevat gestructureerde Discogs-velden zoals `discogs_master_url` en `discogs_release_url`.
- `hitlijsten` bevat geen losse `hl_discogs_link`.
- `file_details` heeft een eigen Discogs-kolom `fd_discogs`.

## Advies

Discogs-links die op een hitlijstregel worden toegevoegd, moeten bij export aantoonbaar terechtkomen als hitlijstmetadata:

```text
hitlijsten.discogs_master_url
of
hitlijsten.discogs_release_url
```

Ze mogen niet automatisch naar `file_details.fd_discogs` worden geschreven. De juiste Discogs-link kan afhankelijk zijn van de concrete `file_details`-variant, mix, release of songtype. Automatisch promoten kan daardoor verkeerde songmetadata veroorzaken.

## Scope

- Controleer exportmapping van staging naar `hitlijsten`.
- Parse of valideer raw `hl_discogs_link`.
- Waarschuw als een raw link niet veilig of niet herkenbaar is.
- Voeg diagnostics toe om stagingregels met Discogs-links te vergelijken met geëxporteerde hitlijstregels.
- Leg functioneel vast dat hitlijst-Discogs-links hitlijstmetadata blijven.
- Leg technisch vast dat `file_details.fd_discogs` alleen via aparte review/promote-flow wordt bijgewerkt.

## Acceptatiecriteria

1. Een stagingregel met `discogs_release_url` krijgt na export dezelfde release-url in `hitlijsten.discogs_release_url`.
2. Een stagingregel met `discogs_master_url` krijgt na export dezelfde master-url in `hitlijsten.discogs_master_url`.
3. Een veilige raw `hl_discogs_link` wordt expliciet gemapt of krijgt een duidelijke waarschuwing.
4. Een onveilige of niet-herkenbare raw link wordt niet stilzwijgend weggeschreven.
5. Export schrijft niet automatisch naar `file_details.fd_discogs`.
6. Diagnostic rapportage kan tonen waar links zijn gebleven.
