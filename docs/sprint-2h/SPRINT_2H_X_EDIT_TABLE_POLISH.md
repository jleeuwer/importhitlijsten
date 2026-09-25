# Sprint 2H-X — Edit-scherm tabel polish

## Doel

Maak de Edit-scherm tabel compacter en bruikbaarder door:

1. aanwezige Discogs-links direct klikbaar te maken;
2. de technische artist-key uit de zichtbare tabel te verwijderen.

## Backlog-items

- BL-IMP-121 — Discogs-link in schermtabel clickable maken.
- BL-IMP-122 — Artist-key verwijderen uit zichtbare schermtabel.

## Functionele scope

### Discogs-link clickable

De tabel toont een klikbare link als een regel Discogs-data bevat.

Voorkeursvolgorde:

1. `discogs_release_url`
2. `discogs_master_url`
3. veilig parsebare raw link, bijvoorbeeld `hl_discogs_link`, als die in de UI-data beschikbaar is

De link opent extern en veilig:

```html
<a href="..." target="_blank" rel="noopener noreferrer">Discogs</a>
```

### Artist-key verwijderen

De artist-key verdwijnt uit de zichtbare kolomset, maar blijft intern beschikbaar.

## Buiten scope

- Nieuwe databasekolommen.
- Migraties.
- Exportmapping voor Discogs-links.
- Automatische update van `file_details.fd_discogs`.
- Variant-aware Discogs-promotie.
- Herontwerp van de volledige Edit-pagina.

## Randvoorwaarden

- Geen API-breaking changes.
- Geen verlies van interne key-data.
- Geen automatische datamutaties.
- Linkveiligheid moet expliciet getest worden.

## Acceptatie

De sprint is akkoord als:

- Discogs-links zichtbaar en klikbaar zijn wanneer aanwezig.
- Link opent in nieuw tabblad/venster.
- `rel="noopener noreferrer"` aanwezig is.
- Artist-key niet zichtbaar is in de standaard tabel.
- Alle bestaande tabelacties blijven werken.
