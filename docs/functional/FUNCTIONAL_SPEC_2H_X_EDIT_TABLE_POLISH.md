# Functional spec — Sprint 2H-X Edit-scherm tabel polish

## 1. Context

De Importhitlijst Edit-tabel bevat veel informatie per stagingregel. Twee verbeteringen zijn gewenst:

- Discogs-links moeten direct klikbaar zijn.
- De artist-key is voor gebruikers overbodig en moet uit de zichtbare tabel verdwijnen.

## 2. User stories

### US-2HX-001 — Discogs-link openen

Als gebruiker wil ik een aanwezige Discogs-link direct vanuit de tabel kunnen openen, zodat ik snel de Discogs-pagina kan controleren zonder te kopiëren/plakken.

### US-2HX-002 — Minder technische ruis in tabel

Als gebruiker wil ik geen artist-key in de schermtabel zien, omdat deze technische sleutel geen functionele waarde heeft in de normale workflow.

## 3. Functionele regels

### FR-2HX-001 — Link tonen als Discogs-URL aanwezig is

Wanneer een regel een Discogs-URL bevat, toont de tabel een klikbare link.

### FR-2HX-002 — Release-url heeft voorkeur

Als zowel master- als release-url aanwezig zijn, krijgt `discogs_release_url` voorkeur omdat die specifieker is.

### FR-2HX-003 — Master-url als fallback

Als geen release-url aanwezig is maar wel `discogs_master_url`, gebruikt de tabel de master-url.

### FR-2HX-004 — Geen link zonder veilige URL

Als geen veilige URL beschikbaar is, toont de tabel geen link.

### FR-2HX-005 — Externe link opent apart

De Discogs-link opent in een nieuw tabblad of venster.

### FR-2HX-006 — Artist-key niet zichtbaar

De artist-key wordt niet getoond als zichtbare tabelkolom.

### FR-2HX-007 — Artist-key blijft intern beschikbaar

De artist-key blijft beschikbaar voor bestaande technische processen.

## 4. UI-gedrag

Aanbevolen label:

```text
Discogs
```

Alternatief compact label:

```text
↗ Discogs
```

De UI mag later eventueel onderscheid tonen tussen:

```text
Discogs release
Discogs master
```

Voor deze sprint is één compact label voldoende, zolang de juiste URL wordt gebruikt.

## 5. Fout- en randgevallen

| Situatie | Verwacht gedrag |
|---|---|
| Geen Discogs-url | Geen link tonen |
| Alleen master-url | Link naar master-url tonen |
| Alleen release-url | Link naar release-url tonen |
| Beide aanwezig | Release-url gebruiken |
| Ongeldige of lege URL | Geen link of veilige fallback tonen |
| Artist-key aanwezig in data | Niet tonen als kolom |

## 6. Acceptatiecriteria

- De tabel toont geen artist-key meer.
- Discogs-link is klikbaar wanneer aanwezig.
- Link opent extern met veilige attributen.
- Geen regressie op bestaande acties.
