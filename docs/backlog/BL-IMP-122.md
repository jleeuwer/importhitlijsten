# BL-IMP-122 — Artist-key verwijderen uit zichtbare schermtabel

## Status

Open — opgenomen in Sprint 2H-X als UI-polish item.

## Aanleiding

De artist-key is technisch relevant, maar voor normale gebruikers in de schermtabel niet functioneel. De zichtbare kolom maakt de tabel drukker zonder directe gebruikerswaarde.

## Probleem

De gebruiker ziet een technische sleutel in de tabel die niet nodig is voor de workflow. Dit leidt tot visuele ruis.

## Gewenst gedrag

De artist-key wordt niet meer als zichtbare kolom in de schermtabel getoond.

Belangrijk:

- De key blijft intern beschikbaar.
- De API mag de key blijven teruggeven.
- Matching, correcties, export en debugdiagnostics mogen niet breken.
- Alleen de standaard zichtbare tabelweergave verandert.

## Acceptatiecriteria

- De artist-key staat niet meer als zichtbare kolom in de schermtabel.
- Acties op de regel blijven werken.
- Matchinglogica blijft werken.
- Correctie- en exportflows blijven werken.
- Tests controleren dat de kolom niet zichtbaar is, maar dat interne data nog gebruikt kan worden.
