# Sprint 2H-B — Song spelling en correctieflow hardening

## Doel

De AltSpelling-flow expliciet hardenen en documenteren, zodat duidelijk is dat een titelcorrectie via AltSpelling ook een mapping in `song_spelling` aanmaakt of bijwerkt.

## Functionele scope

- AltSpelling blijft werken vanuit bekende titels in `file_details`.
- Bij selectie van een titel wordt `song_spelling` ge-upsert op de oorspronkelijke hitlijstwaarden:
  - `hl_titel_song`
  - `hl_artiest`
- De gekozen titel wordt vastgelegd als `fd_tag_title`.
- De actuele stagingregel krijgt direct de gekozen `fd_tag_title`.
- `hl_find_cmd` wordt leeggemaakt omdat de rij na titelcorrectie opnieuw via de reguliere matching/diagnoseflow beoordeeld wordt.
- De gebruiker krijgt duidelijkere feedback: `Titelcorrectie opgeslagen; song_spelling is bijgewerkt.`

## Belangrijk ontwerpbesluit

Voor deze sprint blijft `song_spelling` bewust gekoppeld aan de oorspronkelijke importwaarden `hl_titel_song + hl_artiest`.

Reden: de bestaande `applySongSpellingForRun`-flow zoekt ook op deze oorspronkelijke waarden. Een overstap naar `hl_artist_key` of gecorrigeerde artiestnaam is inhoudelijk logisch voor een latere datamodelsprint, maar moet dan breder worden ontworpen en gemigreerd.

## Technische wijzigingen

- `controllers/altSpellingController.js` is opgeschoond.
- De backward-compatible helper `selectAltSpellingForRow` delegeert nu naar `models/altspelling.js`, zodat er één source of truth is.
- `models/altspelling.js` blijft de transactionele upsert uitvoeren.
- React-feedback in `EditPage.jsx` is verduidelijkt.

## Tests

Toegevoegd:

- `tests/models_altspelling.test.js`
- `tests/react/EditAltSpellingFeedback.test.jsx`

Gedekte scenario's:

- AltSpelling upsert `song_spelling` op oorspronkelijke titel + artiest.
- Stagingregel wordt bijgewerkt met `fd_tag_title`.
- `hl_find_cmd` wordt leeggemaakt.
- Ontbrekende stagingregel veroorzaakt rollback.
- UI toont duidelijke feedback na titelcorrectie.

## Vervolgitem

Na deze sprint wordt handmatig herstellen apart bekeken. Richting: handmatig herstel moet primair gestuurd worden door bestaande `file_details`-waarden voor artiest en titel. Vrije overwrite moet een expliciete gebruikersactie zijn.
