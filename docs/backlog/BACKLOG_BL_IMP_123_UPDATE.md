# Backlog update — BL-IMP-123

## Nieuw / uitgevoerd

### BL-IMP-123 — Onderzoek dubbele file_details songs per hitlijst/versie

Status: opgeleverd als diagnose-/hardening-sprint.

Doel: vaststellen of dubbele songs in `file_details` historisch zijn of actief ontstaan in Importhitlijst → Hitlijsten export.

Oplevering:

- `scripts/sql/bl_imp_123_file_details_duplicate_diagnostics.sql`
- `scripts/run_bl_imp_123_diagnostics.sh`
- `docs/sprint-2h/SPRINT_2H_BL_IMP_123_FILE_DETAILS_DUPLICATE_DIAGNOSTICS.md`
- `Release Notes/RELEASE_NOTES_BL_IMP_123.md`
- `tests/static_bl_imp_123_diagnostics.test.js`

## Vervolgitems

### BL-IMP-124 — Preventie dubbele file_details bij import/promote/export

Nog open. Pas uitwerken na BL-IMP-123-loganalyse.

### BL-IMP-125 — Cleanup/review bestaande duplicate file_details records

Nog open. Pas uitwerken nadat duidelijk is welke duplicates veilig zijn te mergen/verwijderen.
