# Sprint 2F-B — Clipboard copy “artiest - titel”

## Doel

Vanuit de Edit-pagina snel de correcte artiest/titel-combinatie kunnen kopiëren voor extern zoek- of correctiewerk.

## Backlog

- `BL-IMP-060` — Copy correcte artiest/titel naar klembord

## Functioneel gedrag

In de kolom **Correcte Artiest Spelling (auto)** is de read-only presentatie vervangen door een klikbare kopieercontrole.

Gedrag:

- hover toont welke tekst wordt gekopieerd;
- klik kopieert `<artiest> - <titel>` naar het klembord;
- na succesvol kopiëren verschijnt feedback in de rij;
- na succesvol kopiëren krijgt het veld **Discogs Link** in dezelfde rij automatisch focus;
- bij ontbreken van afgeleide waarden wordt teruggevallen op staging-bronvelden;
- alleen hover wijzigt het klembord niet.

## Copy-regel

De tekst wordt opgebouwd met deze prioriteit:

1. artiest: `as_correcte_artiest_spelling`, fallback `hl_artiest`
2. titel: `fd_tag_title`, fallback `hl_titel_song`

Voorbeeld:

```text
Correct Artist - Correct Title
```

## Technische wijziging

Aangepast:

- `src/ui/pages/EditPage.jsx`

Toegevoegd:

- helper `buildArtistTitleClipboardText(row, local)`
- browser clipboard call via `navigator.clipboard.writeText(...)`
- row-level statusfeedback na kopiëren
- focus naar het rijgebonden `Discogs Link`-veld na succesvolle copy

## Tests

Toegevoegd:

```bash
npm run test:sprint2f-b
```

Dekt:

- correcte opbouw van clipboardtekst vanuit afgeleide velden;
- fallback naar stagingvelden;
- klikactie op de correcte artiest-kolom schrijft naar `navigator.clipboard`;
- feedbackmelding na kopiëren;
- focus op het Discogs-linkveld na succesvolle copy.

## Acceptatiecriteria

- [x] gebruiker ziet bij hover welke tekst gekopieerd wordt;
- [x] klik kopieert `<artiest> - <titel>`;
- [x] gebruiker krijgt feedback na kopiëren;
- [x] focus springt na succesvolle copy naar het veld **Discogs Link** in dezelfde rij;
- [x] browserfouten worden netjes getoond;
- [x] clipboard wordt niet onbedoeld gewijzigd door alleen hover.
