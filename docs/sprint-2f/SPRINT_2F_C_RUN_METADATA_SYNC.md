# Sprint 2F-C — Runmetadata beheer & synchronisatie

## Doel

Het Runs-scherm is de centrale ingang voor het beheren van import-runs. Bestaande runs kunnen achteraf worden voorzien van of gecorrigeerd met:

- omroep / zender
- periode / decenniumcategorie

Als een run al naar `hitlijsten` is geëxporteerd, wordt dezelfde metadatawijziging ook toegepast op de definitieve `hitlijsten`-records voor dezelfde `hl_hitlijst + hl_uitzendjaar`.

## Functionele wijzigingen

### Runs-scherm

Het Runs-scherm toont nu extra kolommen:

- Omroep
- Periode
- Exported row count

Het scherm heeft extra filters:

- Omroep / zender
- Periode / decennium

Elke run heeft een actie **Metadata**. Deze opent een modal waarin de gebruiker de omroep en periode kan aanpassen.

### Synchronisatie bij opslaan

Bij opslaan gebeurt alles transactioneel:

1. valideer `omroep_key` en `periode_key`;
2. update alle stagingrijen voor `hl_import_run_id`;
3. bepaal of er definitieve `hitlijsten`-records bestaan voor `ir_hitlijst + ir_uitzendjaar`;
4. als die bestaan, update ook `hitlijsten.omroep_key` en `hitlijsten.periode_key`.

Response bevat onder andere:

```json
{
  "stagingUpdated": 80,
  "hitlijstenUpdated": 80,
  "wasExported": true
}
```

### Edit-scherm

Het Edit-scherm heeft geen runselectie meer. De enige ondersteunde normale ingang is:

```text
/edit?runId=<runId>
```

Als `/edit` zonder `runId` wordt geopend, toont het scherm een melding dat eerst een run via het Runs-scherm geselecteerd moet worden.

## Technische wijzigingen

### Backend

Nieuwe/gewijzigde functies:

- `models/import_runs.js`
  - `listRuns(...)` geeft nu omroep/periode labels en export-count mee.
- `models/metadata.js`
  - `updateRunMetadataAndSyncExported(...)`
- `routes/indexroutes.js`
  - `POST /api/import-runs/:runId/metadata`

### Frontend

Gewijzigd:

- `src/ui/pages/StagingResults.jsx`
  - kolommen en filters voor omroep/periode
  - metadata-modal
  - opslaan via `/api/import-runs/:runId/metadata`
- `src/ui/pages/EditPage.jsx`
  - runselector verwijderd
  - Edit zonder runId verwijst naar Runs
  - runmetadata-blok verwijderd uit Edit-aside

## Testscript

```bash
npm run test:sprint2f-c
```

Regressieadvies:

```bash
npm run test:sprint2f
npm run test:sprint2d
npm run test:validation:2d-a
```

## Acceptatiecriteria

- Runs-scherm toont omroep en periode.
- Runs-scherm filtert op omroep en periode.
- Metadata-modal kan omroep/periode opslaan.
- Bij reeds geëxporteerde runs worden ook `hitlijsten`-records bijgewerkt.
- Edit zonder runId toont geen runselector meer maar verwijst naar Runs.
- Edit met runId blijft werken.

---

## Hotfix 2F-C-HF1 — Modal sluiten na succesvol opslaan

### Aanleiding
Tijdens functionele validatie bleek dat de metadata-modal open bleef nadat de gebruiker metadata succesvol had opgeslagen.

### Gewijzigd gedrag
Na succesvolle opslag via `POST /api/import-runs/:runId/metadata`:

- de metadata-modal sluit automatisch;
- de succesmelding blijft zichtbaar boven het Runs-overzicht;
- de Runs-tabel toont de bijgewerkte omroep/periode;
- bij fouten blijft de modal open zodat de gebruiker kan corrigeren.

### Test
De React-test `tests/react/StagingResultsMetadata.test.jsx` controleert nu ook dat de modal na succesvolle opslag niet meer zichtbaar is.
