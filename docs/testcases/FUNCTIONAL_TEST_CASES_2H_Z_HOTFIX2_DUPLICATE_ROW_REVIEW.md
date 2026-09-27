# Functionele testcases — 2H-Z Hotfix 2 / BL-IMP-136

| ID | Scenario | Verwacht resultaat |
|---|---|---|
| HF2-01 | Run bevat dezelfde artiest+titel twee keer op dezelfde positie | Eén duplicategroep; beide regels zichtbaar; één extra rij voorgeselecteerd. |
| HF2-02 | Zelfde artiest+titel op verschillende posities | Wordt als hoge-zekerheid duplicategroep gedetecteerd. |
| HF2-03 | Verschil alleen in case/whitespace/NBSP/apostrof | Wordt als duplicate gedetecteerd. |
| HF2-04 | Titel verschilt inhoudelijk door `(Live)` | Geen duplicategroep met de studioversie. |
| HF2-05 | Artiest of titel ontbreekt | Niet automatisch als duplicate groeperen. |
| HF2-06 | Klik `Zoek dubbele rijen` | Reviewmodal toont groepen, posities, artiest, titel en huidige actie. |
| HF2-07 | Alle rijen in één groep selecteren | Actie wordt geweigerd; minimaal één rij moet blijven. |
| HF2-08 | Selecteer één extra rij en kies Skip | Alleen die stagingregel krijgt `fd_action=Skip`. |
| HF2-09 | Selecteer één extra rij en kies fysieke delete, annuleer confirm | Geen datawijziging. |
| HF2-10 | Bevestig fysieke delete | Alleen geselecteerde stagingregel verdwijnt; bron-CSV/file_details ongewijzigd. |
| HF2-11 | Fysieke delete succesvol | Auditrecord met `DUPLICATE_CONFIRMED` bestaat. |
| HF2-12 | Fout tijdens audit/delete | Volledige transactie rollback; staging blijft intact. |
| HF2-13 | Na physical delete | `import_runs.ir_row_count` is gelijk aan actuele staging count. |
| HF2-14 | Reeds geëxporteerde run | Duplicate mutatieactie wordt door pre-export guard geblokkeerd. |
| HF2-15 | `./startapp.sh test` | Volledige `npm run test:all`, niet alleen drie E2E-tests. |
| HF2-16 | `./startapp.sh all` | Eén validate-keten en daarna dev; geen dubbele install/build/test-cyclus. |

## Geautomatiseerde dekking
- `tests/services_stagingDuplicateRowService.test.js`
- `tests/react/StagingDuplicateReview.test.jsx`
- `tests/static_2h_z_hotfix2_duplicate_row_review.test.js`
- bestaande volledige Vitest-suite via `npm run test:unit`
- bestaande Playwright-suite via `npm run test:e2e`
