# Sprint 2H-L Fix 1 — Find-cmd export en Discogs bekeken-markering

## Aanleiding

Na Sprint 2H-L zijn twee testbevindingen gemeld:

1. Het gegenereerde **Export Find-cmd script** bevatte `set -euo pipefail`, waardoor het script te vroeg kon stoppen. Voor deze export moet het script juist alle `find`-commando's tot het einde blijven uitvoeren.
2. In **Zoek in Discogs** werden soms meerdere of alle resultaten als **Bekeken** gemarkeerd na het openen van Details voor één resultaat.

## Functionele oplossing

### Export Find-cmd script

Het gegenereerde script:

- bevat geen `set -euo pipefail` meer;
- quote het doelpad in `export TARGET="..."` via veilige shell-stringgeneratie;
- blijft alle gegenereerde `find`-commando's opnemen en uitvoeren.

### Discogs bekeken-markering

De bekeken-markering wordt gekoppeld aan een stabiele unieke sleutel per Discogs-resultaat:

```text
<type>:<id>
```

Voorbeelden:

```text
master:12345
release:67890
```

Belangrijk is dat een release met een `masterId` nog steeds als release wordt behandeld. Daardoor kan het openen van Details voor een release niet meer tegelijk de bijbehorende master of andere resultaten als **Bekeken** markeren.

## Technische wijzigingen

- `routes/indexroutes.js`
  - verwijdert de strict-mode shellregel uit de gegenereerde scriptheader;
  - gebruikt `JSON.stringify(target)` om `export TARGET="..."` veilig te genereren.
- `src/ui/pages/EditPage.jsx`
  - `getDiscogsResultDetailType`, `getDiscogsResultDetailId` en `getDiscogsResultViewKey` zijn aangescherpt en exporteerbaar gemaakt voor regressietests;
  - expliciete Discogs result `type` heeft voorrang boven fallbackvelden zoals `masterId`.
- `tests/static_findCmdExportScript.test.js`
  - controleert dat het find-cmd exportscript geen `set -euo pipefail` bevat en dat `TARGET` gequote wordt.
- `tests/react/EditDiscogsViewedKey.test.jsx`
  - controleert dat release en master verschillende bekeken-keys krijgen.

## Acceptatiecriteria

- Het gegenereerde Find-cmd script bevat geen `set -euo pipefail`.
- Het gegenereerde Find-cmd script bevat een gequote `export TARGET="..."`.
- Een bekeken Discogs-release markeert niet automatisch de master of andere resultaten als bekeken.
- De bestaande Discogs zoek/detail/koppel-flow blijft werken.
