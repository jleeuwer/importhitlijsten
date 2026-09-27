# Functioneel ontwerp — 2H-Z / v1.1.0

## Import-inbox
De gebruiker voert een directory in en kiest **Scannen / vernieuwen**. De applicatie leest uitsluitend CSV-bestanden direct in die directory.

### Standaardweergave
Alleen nieuwe bestanden zijn zichtbaar. Bekende imports en handmatige historische markeringen zijn verborgen.

### Uitgebreide weergave
Met **Toon ook geïmporteerd** worden zichtbaar:
- Geïmporteerd — hetzelfde bestand;
- Geïmporteerd — dezelfde lijstinhoud;
- Handmatig gemarkeerd als al geïmporteerd.

### Handmatig markeren
**Markeer als al geïmporteerd** analyseert het CSV-bestand, berekent file-hash én list-fingerprint en schrijft daarna `MANUALLY_MARKED_IMPORTED`. Er wordt geen import_run gemaakt.

### Markering herstellen
Alleen een handmatige markering kan via **Markering verwijderen** worden verwijderd. Een echte `IMPORTED` registratie wordt niet verwijderd via deze actie.

## Duplicate-detectie
### Exact bestand
Gelijke `ifr_file_sha256` betekent exact dezelfde bytes.

### Dezelfde lijstinhoud
Verschillende file-hash maar gelijke `ifr_list_fingerprint` betekent functioneel dezelfde gerangschikte hitlijst.

### Override
Bij herimport van bekende inhoud toont de applicatie een waarschuwing. De gebruiker kan expliciet **Toch opnieuw importeren** kiezen. De nieuwe registry-entry krijgt `ifr_duplicate_override=true` en verwijst naar de eerdere registry-entry.

## Fingerprintnormalisatie
Per CSV-regel wordt de originele positie gecombineerd met conservatief genormaliseerde artiest en titel. Genormaliseerd worden Unicode-vorm, NBSP, whitespace, case en typografische quotes/apostrofs. Betekenisvolle inhoud zoals `(Live)`, remixtekst, `feat.`/`featuring`, `&`/`and` en diacritics wordt niet agressief verwijderd of gelijkgetrokken.

## Fouten
`READ_ERROR` en `PARSE_ERROR` blokkeren alleen het betreffende bestand. Andere bestanden in de directory blijven bruikbaar. Na externe correctie kan de gebruiker opnieuw scannen.

## Hotfix 1 — Import-inbox UX

Na functionele test zijn de volgende regels toegevoegd:

- scanresultaten hebben paginering met standaard 25 regels en opties 25/50/100;
- eerdere succesvol gebruikte scandirectories zijn rechtstreeks opnieuw te openen via **Recente scans**;
- recent directories bevatten alleen het pad; bij openen wordt altijd opnieuw gescand zodat de bestandssituatie actueel blijft;
- na **Selecteer** wordt het importformulier in beeld gebracht en krijgt **Hitlijst name** focus;
- **Toon ook geïmporteerd** werkt direct op de reeds geladen volledige scanresultaten en vereist geen nieuwe scan.
