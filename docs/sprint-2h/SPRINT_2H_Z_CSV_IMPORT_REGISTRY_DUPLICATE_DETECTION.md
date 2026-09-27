# Sprint 2H-Z — CSV Import Registry & Exact Duplicate Detection

**Applicatie:** Import Hitlijsten  
**Versie documentatie én code:** 1.1.0  
**Backlog:** BL-IMP-134 + BL-IMP-119

## Doel
De importpagina wordt een import-inbox voor CSV-bestanden. De gebruiker kiest een lokale directory, ziet standaard alleen nog niet geïmporteerde CSV-bestanden en kan eerder geïmporteerde bestanden optioneel zichtbaar maken. Exact hetzelfde fysieke bestand en inhoudelijk dezelfde hitlijst worden afzonderlijk herkend.

## Vastgestelde functionele regels
- Directoryscan is niet recursief.
- Alleen zichtbare `.csv`/`.CSV` bestanden worden meegenomen; verborgen en `~$` tijdelijke bestanden niet.
- `NEW` is runtime-status en wordt niet permanent opgeslagen.
- Registry-statussen zijn `IMPORTED` en `MANUALLY_MARKED_IMPORTED`.
- Beide registry-statussen zijn standaard verborgen.
- Toggle **Toon ook geïmporteerd** maakt ze zichtbaar met onderscheidende labels.
- Handmatige markering is omkeerbaar.
- Een bestand wordt pas `IMPORTED` nadat staging + import_run + registry binnen dezelfde succesvolle transactie zijn afgerond.
- Fysieke identiteit: SHA-256 van de CSV-bytes.
- Lijstidentiteit: SHA-256 over canonieke regels `positie|artiest|titel`.
- Exacte lijstduplicate geeft waarschuwing en vereist expliciete override; geen harde blokkade.
- `READ_ERROR` en `PARSE_ERROR` zijn runtime-statussen en worden niet in de registry opgeslagen.

## Buiten scope
- Recursieve directoryscan.
- Fuzzy/similarity matching (BL-IMP-120).
- Status `IGNORED`.
- Automatische cleanup/verwijdering van bronbestanden.
