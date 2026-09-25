# Functional Test Cases — 2H-V Warning/status hardening

## TC-2HV-001 — Export met alleen non-blocking warning

**Gegeven** een run met één encoding warning en geen blocking issues.  
**Wanneer** de gebruiker export uitvoert.  
**Dan** slaagt de export.  
**En** de run krijgt status `Geëxporteerd met waarschuwingen`.  
**En** de run staat niet meer actief op `Aandacht nodig`.

## TC-2HV-002 — Export met blocking issue

**Gegeven** een run met `NO_MATCH` of `MULTIPLE_CANDIDATES`.  
**Wanneer** de gebruiker export probeert uit te voeren.  
**Dan** wordt export geblokkeerd.  
**En** de run blijft `Aandacht nodig`.

## TC-2HV-003 — Export zonder warnings

**Gegeven** een run zonder blocking issues en zonder warnings.  
**Wanneer** export succesvol is.  
**Dan** krijgt de run status `Geëxporteerd`.

## TC-2HV-004 — Encoding preview damaged maar niet repairable

**Gegeven** encoding preview `requested: 1, scanned: 1, damaged rows: 1, repairable rows: 0`.  
**Wanneer** tekstnormalisatie wordt uitgevoerd.  
**Dan** wordt geen manual save/overwrite uitgevoerd.  
**En** de gebruiker krijgt een nette melding dat geen veilige repair is gevonden.

## TC-2HV-005 — Manual correction lost encoding warning op

**Gegeven** een regel met `BeyoncÃ©`.  
**Wanneer** de gebruiker corrigeert naar `Beyoncé`.  
**Dan** wordt de encoding warning opnieuw berekend.  
**En** de warning verdwijnt.

## TC-2HV-006 — Manual correction lost encoding warning niet op

**Gegeven** een regel met encoding-warning.  
**Wanneer** de gebruiker corrigeert naar een tekst die nog steeds `Ã` of `�` bevat.  
**Dan** blijft de warning bestaan met actuele reden.

## TC-2HV-007 — Manual free overwrite zonder bevestiging

**Gegeven** een vrije correctie zonder gekozen `file_details` candidate.  
**Wanneer** geen expliciete bevestiging is gegeven.  
**Dan** retourneert de backend HTTP 409 met functionele melding.

## TC-2HV-008 — Repair preview bestaande exportstatus

**Gegeven** een geëxporteerde run met alleen warnings maar status `Aandacht nodig`.  
**Wanneer** repair preview wordt uitgevoerd.  
**Dan** verschijnt de run als repair-kandidaat met doelstatus `Geëxporteerd met waarschuwingen`.

## TC-2HV-009 — Repair apply bestaande exportstatus

**Gegeven** dezelfde kandidaat uit TC-2HV-008.  
**Wanneer** repair apply wordt uitgevoerd.  
**Dan** wordt alleen de status bijgewerkt.  
**En** een auditregel wordt geschreven.  
**En** hitlijstregels, stagingregels en `file_details` blijven inhoudelijk ongewijzigd.

## TC-2HV-010 — Repair slaat blocking issues over

**Gegeven** een geëxporteerde run die nog blocking issues heeft.  
**Wanneer** repair preview/apply wordt uitgevoerd.  
**Dan** wordt de run overgeslagen.
