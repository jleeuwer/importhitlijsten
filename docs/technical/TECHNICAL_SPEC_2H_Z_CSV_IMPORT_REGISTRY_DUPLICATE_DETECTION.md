# Technisch ontwerp — 2H-Z / v1.1.0

## Componenten
- `models/import_file_registry.js` — registry persistence.
- `services/importFileRegistryService.js` — directoryscan, inspectie, classificatie en handmatige markering.
- `utils/listFingerprint.js` — canonicalisatie en SHA-256 content fingerprint.
- `controllers/importController.js` — duplicatecontrole en transactionele registry-write na succesvolle import.
- `src/ui/pages/ImportPage.jsx` — import-inbox en overrideflow.

## Database
Nieuwe tabel `public.import_file_registry` met file metadata, file SHA-256, list fingerprint, status, import_run relatie, duplicate override/audit en timestamps.

Het directorypad is informatief en geen identiteit. Hashes zijn bewust niet unique, omdat expliciete herimports als afzonderlijke auditrecords mogen bestaan.

## Transactionele garantie
Voor een normale import worden stagingregels, `import_runs` en `import_file_registry` in dezelfde database-transactie geschreven. Een rollback laat geen `IMPORTED` registry-entry achter.

## Directorybeveiliging
Een geselecteerd bronbestand moet direct binnen de opgegeven directory staan. Path traversal en subdirectoryselectie worden geweigerd. Alleen zichtbare CSV-bestanden zijn geldig.

## API/HTTP
- `GET /import?directory=...&showImported=1` — scan en render inbox.
- `POST /import` — bestaande uploadflow plus import vanaf geselecteerd directorybestand; ondersteunt expliciete duplicate override.
- `POST /import/mark-imported` — historische import markeren.
- `POST /import/unmark-imported` — uitsluitend handmatige markering verwijderen.

## Release/runtime
`npm ci` vervangt `npm install` in `install:all`, zodat een release-worktree `package-lock.json` niet herschrijft.

## Hotfix 1 — technische UX-aanpassingen

### Volledige scan-dataset
`scanImportDirectory()` retourneert alle gescande CSV-regels, inclusief `IMPORTED` en `MANUALLY_MARKED_IMPORTED`. `showImported` bepaalt alleen de initiële zichtbaarheid/count; de React-client filtert daarna lokaal.

Dit voorkomt een nieuwe I/O-, hash-, parse- en registry-scan bij iedere toggle.

### Paginering
`ImportPage.jsx` onderhoudt client-side `page` en `pageSize`. De gefilterde dataset wordt met `slice()` gepagineerd. Bij toggle, directorywijziging of page-size wijziging wordt teruggegaan naar pagina 1.

### Recente directories
De laatste maximaal acht succesvolle directories worden client-side bewaard onder localStorage-key:

```text
importhitlijst.recentImportDirectories
```

De directory is gemakshistorie, geen identiteit en geen database-auditrecord. Een recente directorylink start altijd een nieuwe GET `/import?directory=...` en daarmee een actuele scan.

### Focus
Na een GET met `selectedFile` gebruikt de React-client refs om het importformulier te scrollen en `hl_hitlijst` focus te geven.
