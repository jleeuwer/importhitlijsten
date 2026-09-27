# Functionele testcases — Sprint 2H-AA / BL-IMP-135

**Versie:** **1.2.0**  
**Doel:** functionele acceptatiebasis en bron voor geautomatiseerde tests

| ID | Scenario | Stappen / invoer | Verwacht resultaat | Automatiseringsrichting |
|---|---|---|---|---|
| 2H-AA-001 | Eén CSV drag-and-drop | Sleep geldige CSV <25 MB | Kandidaat verschijnt, wordt geselecteerd, focus op Hitlijst name | React + E2E |
| 2H-AA-002 | Eén CSV via klik | Klik dropzone, kies CSV | Zelfde kandidaatflow als drag-and-drop | React + E2E |
| 2H-AA-003 | Meerdere CSV's | Sleep 3 geldige CSV's | 3 afzonderlijke kandidaten; geen automatische selectie van één metadataformulier vereist | React |
| 2H-AA-004 | Max batch 50 | Selecteer 50 CSV's | Batch geaccepteerd | service/route |
| 2H-AA-005 | Batch >50 | Selecteer 51 CSV's | Duidelijke fout; geen stille truncatie | route + React |
| 2H-AA-006 | Bestand >25 MB | Upload 25 MB + 1 byte | Bestand geweigerd met groottefout | route |
| 2H-AA-007 | Niet-CSV | Drop `.txt`/`.xlsx` | Bestand geweigerd, overige UI blijft bruikbaar | route + React |
| 2H-AA-008 | Directory-scan regressie | Gebruik bestaande directory + Scannen | Bestaande scanflow blijft werken | React/static/E2E |
| 2H-AA-009 | Metadata per bestand | Vul A, wissel naar B, vul andere waarden, terug naar A | A behoudt eigen waarden; B heeft eigen waarden | React |
| 2H-AA-010 | Metadata onvolledig | Laat verplicht veld leeg | Status Metadata onvolledig; importknop niet actief | React/service |
| 2H-AA-011 | Klaar voor import | Vul alle verplichte metadata geldig | Status Klaar voor import | React/service |
| 2H-AA-012 | Refresh behoud kandidaat | Upload + metadata, refresh `/import` | Kandidaat en metadata blijven beschikbaar | integration/E2E |
| 2H-AA-013 | Exact file duplicate | Upload eerder geïmporteerde file | Melding exact hetzelfde bestand; normale import geblokkeerd | service + React |
| 2H-AA-014 | Same list duplicate | Upload andere bytes maar zelfde semantische lijst | Melding dezelfde lijstinhoud; normale import geblokkeerd | service + React |
| 2H-AA-015 | Duplicate override | Zet expliciet override op duplicate | Kandidaat wordt importeerbaar als metadata geldig is | service + React |
| 2H-AA-016 | Geen automatische import | Drop geldige CSV | Geen import_run voordat gebruiker importactie kiest | service/integration |
| 2H-AA-017 | Individuele import | Importeer één READY kandidaat | Eigen import_run, registryrecord; status Geïmporteerd | integration |
| 2H-AA-018 | Tempfile weg na succes | Succesvolle individuele import | Fysieke temp-upload verwijderd; kandidaat/registryresultaat blijft traceerbaar | integration |
| 2H-AA-019 | Bulk alleen READY | Mix READY en Metadata onvolledig | Alleen READY kandidaten worden verwerkt | service/integration |
| 2H-AA-020 | Bulk eigen metadata | Twee READY kandidaten met verschillende naam/jaar | Iedere import_run krijgt metadata van juiste kandidaat | integration |
| 2H-AA-021 | Bulk foutisolatie | A goed, B forceert importfout, C goed | A en C geïmporteerd; B Importfout | service/integration |
| 2H-AA-022 | Bulk duplicate zonder override | READY duplicate zonder override tussen normale kandidaten | Duplicate geblokkeerd; overige imports gaan door | service/integration |
| 2H-AA-023 | Bulk samenvatting | Batch met success/duplicate/error | Correcte aantallen per categorie | service + React |
| 2H-AA-024 | Doorklik bulkfout | Klik foutkandidaat in samenvatting | Betreffende kandidaat wordt geselecteerd | React |
| 2H-AA-025 | Parsefout | Upload corrupte/niet-parsebare CSV | Kandidaat toont parsefout; geen IMPORTED registryrecord | service + React |
| 2H-AA-026 | Individuele tijdelijke delete | Verwijder niet-geïmporteerde kandidaat | Tempfile + candidate verwijderd; bronfile/registry onaangetast | integration + React |
| 2H-AA-027 | Delete-all cancel | Kies Verwijder alle, annuleer confirm | Geen kandidaten verwijderd | React |
| 2H-AA-028 | Delete-all confirm | Bevestig cleanup | Alleen niet-geïmporteerde tijdelijke kandidaten verwijderd | service + React |
| 2H-AA-029 | Auto cleanup >7 dagen | Maak verlopen kandidaat | Cleanup verwijdert kandidaat/tempfile | service |
| 2H-AA-030 | Auto cleanup niet verlopen | Kandidaat jonger dan 7 dagen | Kandidaat blijft bestaan | service |
| 2H-AA-031 | Serverstart cleanup | Start cleanup met verlopen fixtures | Verlopen kandidaten worden zonder cron opgeschoond | integration/static |
| 2H-AA-032 | Path traversal | Manipuleer storage/original filename | Geen toegang/delete buiten temp-root | service/security |
| 2H-AA-033 | Browser MIME afwijkend maar .csv parsebaar | CSV met generieke MIME | Beleid volgt afgesproken CSV-extensie/parse-regels; geen onveilige acceptatie van niet-CSV | route |
| 2H-AA-034 | Registry pas na succes | Upload/prepare kandidaat zonder import | Geen `IMPORTED` registryrecord | integration |
| 2H-AA-035 | Importfout en retry | Kandidaat Importfout; oorzaak herstellen waar mogelijk en opnieuw proberen | Kandidaat kan opnieuw gevalideerd/geprobeerd worden zonder nieuwe bronupload zolang tempfile bestaat | service/React |
| 2H-AA-036 | Geïmporteerde kandidaat na refresh | Succesimport, refresh | Resultaat blijft herkenbaar; fysiek tempfile niet opnieuw nodig | integration/E2E |
| 2H-AA-037 | Bestaande 2H-Z override regressie | Directory-scan duplicate + override | Bestaande directory-flow blijft ongewijzigd werken | regression |
| 2H-AA-038 | Bestandsnamen met spaties/Unicode | Upload `Top 2000 – 2026.csv` | Veilige opslagnaam; originele naam correct getoond | service + React |
| 2H-AA-039 | Gelijke originele namen | Upload uit verschillende directories twee `lijst.csv` bestanden | Unieke kandidaten/storage-ids; geen overschrijven | service |
| 2H-AA-040 | Geen metadata-deling | Bereid meerdere kandidaten voor | Wijziging in kandidaat A verandert B nooit automatisch | React/service |

## Acceptatievolgorde

1. Upload/selectie en limieten.
2. Per-bestand metadata + refresh.
3. Duplicate-regels.
4. Individuele import.
5. Bulkimport en foutisolatie.
6. Cleanup/security.
7. Regressie directory-scan en 2H-Z registry.

## Beoogd testscript bij codeontwikkeling

```bash
npm run test:sprint2h-aa
```

Volledige regressie blijft:

```bash
./startapp.sh test
```

## Geautomatiseerde dekking in codesprint v1.2.0

Gerichte sprint-suite:

```bash
npm run test:sprint2h-aa
```

Mapping:

- `tests/services_importUploadCandidateService.test.js`: metadata-status, duplicate-classificatie, path traversal en bulk-foutisolatie;
- `tests/react/ImportDragDropInbox.test.jsx`: dropzone/file-picker UI, behoud directory-scan, per-bestand metadata, single-file autoselect/focus en duplicate-override guard;
- `tests/static_2h_aa_drag_drop_import.test.js`: migratie, Docker defaults (`my-postgresdb` / `musicdb`), API/middleware/cleanup, versie-alignering en documentatie-eisen.

De overige functionele cases blijven expliciete acceptatiecases en worden waar passend ook geraakt door de volledige regressiesuite `./startapp.sh test`.
