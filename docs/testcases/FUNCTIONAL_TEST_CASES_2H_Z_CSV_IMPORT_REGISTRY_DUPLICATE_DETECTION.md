# Functionele testcases — 2H-Z / v1.1.0

| ID | Scenario | Verwacht |
|---|---|---|
| 2HZ-001 | Directory met 3 nieuwe CSV's scannen | 3 nieuwe bestanden zichtbaar |
| 2HZ-002 | Subdirectory bevat CSV | Bestand in subdirectory niet zichtbaar |
| 2HZ-003 | `.hidden.csv` en `~$temp.csv` aanwezig | Beide niet zichtbaar |
| 2HZ-004 | Geïmporteerd bestand opnieuw scannen | Standaard verborgen |
| 2HZ-005 | Toggle Toon ook geïmporteerd | Geïmporteerd bestand zichtbaar |
| 2HZ-006 | Exact dezelfde bytes | Status hetzelfde bestand |
| 2HZ-007 | Andere bestandsnaam/bytes, zelfde lijstinhoud | Status dezelfde lijstinhoud |
| 2HZ-008 | Handmatig markeren | Registry status MANUALLY_MARKED_IMPORTED; standaard verborgen |
| 2HZ-009 | Handmatige markering verwijderen | Bestand wordt weer NEW indien geen andere registry-match |
| 2HZ-010 | Normale succesvolle import | Registry status IMPORTED gekoppeld aan import_run |
| 2HZ-011 | Import faalt/rollback | Geen IMPORTED registry-entry |
| 2HZ-012 | Exacte contentduplicate importeren | Eerst waarschuwing; geen import zonder bevestiging |
| 2HZ-013 | Toch opnieuw importeren | Nieuwe run + registry-entry met duplicate_override=true |
| 2HZ-014 | Rangorde van twee songs omwisselen | Andere list fingerprint |
| 2HZ-015 | Case/NBSP/typografische apostrof verschilt | Zelfde list fingerprint |
| 2HZ-016 | Titel `One` versus `One (Live)` | Verschillende list fingerprint |
| 2HZ-017 | Onleesbaar bestand | READ_ERROR alleen voor dat bestand |
| 2HZ-018 | CSV zonder bruikbare artiest/titelregels | PARSE_ERROR alleen voor dat bestand |
| 2HZ-019 | Bronpad wijst naar subdirectory/traversal | Import geweigerd |
| 2HZ-020 | Verse dependency-install in worktree | `npm ci`; package-lock blijft gelijk |
| 2HZ-HF1-001 | Scan van 30+ bestanden | Eerste pagina toont standaard maximaal 25 regels; volgende pagina is bereikbaar |
| 2HZ-HF1-002 | Page size wijzigen naar 50/100 | Zichtbare paginagrootte verandert en pagina reset naar 1 |
| 2HZ-HF1-003 | Eerder succesvol gescande directory | Directory verschijnt onder Recente scans en kan zonder opnieuw typen geopend worden |
| 2HZ-HF1-004 | Recente directory openen | Directory wordt opnieuw gescand; geen verouderde snapshot wordt gebruikt |
| 2HZ-HF1-005 | Klik Selecteer bij CSV | Importformulier komt in beeld en focus staat op Hitlijst name |
| 2HZ-HF1-006 | Scan met verborgen geïmporteerde bestanden, daarna toggle aan | Geïmporteerde bestanden verschijnen direct zonder Scannen/vernieuwen |
| 2HZ-HF1-007 | Toggle weer uit | Geïmporteerde en handmatig gemarkeerde bestanden verdwijnen direct |
