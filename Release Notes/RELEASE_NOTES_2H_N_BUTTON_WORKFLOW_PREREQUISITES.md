# Release Notes — Sprint 2H-N Button workflow en prerequisites

## Samenvatting

Deze sprint maakt de Edit-toolbar duidelijker door de knoppen in workflowstappen te groeperen en de beschikbaarheid centraal te bepalen.

## Nieuw

- Workflowoverzicht boven de Edit-toolbar.
- Toolbar-secties:
  - Bekijken
  - Normaliseren
  - Correcte artiest/titel
  - Verrijken/controleren
  - Exporteren
- Centrale frontend helper `src/ui/utils/editWorkflowPolicy.js`.
- Disabled redenen/tooltips op basis van prerequisites.
- Nieuw testscript `npm run test:sprint2h-n`.

## Gewijzigd

- Toolbar-knoppen gebruiken nu dezelfde policy-logica voor runstatus, exportstatus, busy-status en prerequisites.
- SongSpelling is expliciet afhankelijk van ArtistSpelling.
- Zichtbare-rij acties zijn expliciet afhankelijk van zichtbare rijen.
- Duplicate-skip is expliciet afhankelijk van gevonden duplicates.

## Niet gewijzigd

- 2H-M exportstatus guards blijven actief.
- Correctie na export blijft het veilige pad na export.
- Backend export guards uit 2H-M Fix 1 blijven ongewijzigd.
