# Functionele testcases — 2H-Y Hotfix 3 Encoding cleanup

## TC-HF3-001 — Schone handmatige repair veroorzaakt geen encoding-warning

**Gegeven** een stagingregel met een waarschuwing of eerdere encoding-diagnose.  
**Wanneer** de gebruiker via `Handmatig herstellen` een geldige `file_details` kandidaat kiest met schone tekst.  
**Dan** toont de rij geen `RECOVERABLE_ENCODING_DAMAGE` meer.

Voorbeeldwaarden:

```text
Coldcut Featuring Yazz And The Plastic Population
Doctorin' The House
```

## TC-HF3-002 — NBSP/whitespace is geen encoding-schade

**Gegeven** een waarde met gewone whitespace- of NBSP-afwijkingen.  
**Wanneer** de diagnostiek wordt uitgevoerd.  
**Dan** mag dit niet leiden tot `RECOVERABLE_ENCODING_DAMAGE`.

## TC-HF3-003 — Echte mojibake blijft repairable

**Gegeven** een waarde zoals `BelgiÃ«`.  
**Wanneer** encoding-detectie wordt uitgevoerd.  
**Dan** wordt `RECOVERABLE_ENCODING_DAMAGE` gemeld met repairwaarde `België`.

## TC-HF3-004 — Replacement character blijft damage

**Gegeven** een waarde zoals `Belgi�`.  
**Wanneer** encoding-detectie wordt uitgevoerd.  
**Dan** wordt `REPLACEMENT_CHAR_DAMAGE` gemeld.

## TC-HF3-005 — Manual repair diagnostiek wordt opnieuw schoon bepaald

**Gegeven** een handmatige `file_details` selectie.  
**Wanneer** de keuze wordt opgeslagen.  
**Dan** retourneert de diagnostiek bij schone resolved waarden `status: ok`, `reasonCode: null` en geen encoding hints.
