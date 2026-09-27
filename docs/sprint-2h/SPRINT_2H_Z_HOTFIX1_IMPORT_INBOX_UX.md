# Sprint 2H-Z Hotfix 1 — Import-inbox UX refinement

**Applicatieversie:** 1.1.0  
**Parent sprint:** 2H-Z — CSV Import Registry & Exact Duplicate Detection

## Aanleiding
Functionele testbevindingen na de eerste 2H-Z codebouw:

1. de scanresultatentabel had geen paginering;
2. eerder gebruikte scandirectories konden niet snel opnieuw geopend worden;
3. na **Selecteer** verschoof de focus niet naar het importformulier;
4. **Toon ook geïmporteerd** werkte pas correct na een nieuwe directoryscan.

BL-IMP-135 (drag-and-drop CSV-selectie) is als apart backlog-item geregistreerd en valt niet onder deze hotfix.

## Functioneel resultaat
- Scanresultaten worden client-side gepagineerd: standaard 25, instelbaar op 25/50/100.
- De maximaal acht recent succesvol gescande directories worden lokaal in de browser onthouden en als snelle links getoond.
- Een recente directory opnieuw openen voert een actuele scan uit; oude scanresultaten worden niet als snapshot opgeslagen.
- Na selectie van een CSV scrollt de pagina naar het importformulier en krijgt **Hitlijst name** focus.
- Een scan levert alle bekende CSV-statussen aan de frontend. De toggle filtert/unfiltert deze dataset direct zonder rescan.

## Geen databasewijziging
Deze hotfix vereist geen aanvullende databasewijziging. De oorspronkelijke 2H-Z migratie voor `import_file_registry` blijft ongewijzigd van toepassing.
