# Backlog update — Sprint 2H-X

## Toegevoegd aan sprint

| ID | Titel | Status |
|---|---|---|
| BL-IMP-121 | Discogs-link in schermtabel clickable maken | Design ready |
| BL-IMP-122 | Artist-key verwijderen uit zichtbare schermtabel | Design ready |

## Relatie met bestaande backlog

### BL-IMP-133

BL-IMP-121 raakt aan de zichtbaarheid van Discogs-links, maar lost niet de volledige lifecycle op. BL-IMP-133 blijft open voor het expliciet maken en testen van de datastroom:

```text
staging_hitlijsten → hitlijsten → eventueel later file_details via review/promote
```

2H-X schrijft Discogs-links niet automatisch naar `file_details.fd_discogs`.

### BL-IMP-115

BL-IMP-122 past binnen bredere Edit-scherm UX-verbetering, maar is klein genoeg om apart uit te voeren.

## Voorgestelde sprintnaam

Sprint 2H-X — Edit-scherm tabel polish

## Sluitingsvoorwaarden

BL-IMP-121 en BL-IMP-122 kunnen worden gesloten na codebouw, test en akkoord op:

- zichtbare Discogs-link werkt correct;
- artist-key is niet meer zichtbaar;
- bestaande regelacties blijven functioneren.
