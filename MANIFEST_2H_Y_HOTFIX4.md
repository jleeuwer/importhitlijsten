# Manifest — Sprint 2H-Y Hotfix 4

## Thema

Multiple `file_details` kandidaten toestaan bij export naar `hitlijsten`.

## Code

- `models/hitlijsten.js`
- `models/import_runs.js`
- `tests/models/exportHitlijsten.test.js`
- `tests/static_2h_y_matching_discogs_status_hardening.test.js`
- `tests/static_2h_y_hotfix4_export_multiple_candidates.test.js`
- `package.json`
- `package.2h-y-hotfix4.scripts.json`

## Database scripts

- `scripts/sql/20260917_sprint2h_y_hotfix4_no_database_migration.sql`
- `scripts/run_2h_y_hotfix4_migration.sh`

## Documentatie

- `docs/sprint-2h/SPRINT_2H_Y_HOTFIX4_EXPORT_MULTIPLE_CANDIDATES.md`
- `docs/backlog/BL-IMP-124-HOTFIX4.md`
- `docs/functional/FUNCTIONAL_SPEC_2H_Y_HOTFIX4_EXPORT_MULTIPLE_CANDIDATES.md`
- `docs/technical/TECHNICAL_SPEC_2H_Y_HOTFIX4_EXPORT_MULTIPLE_CANDIDATES.md`
- `docs/testcases/FUNCTIONAL_TEST_CASES_2H_Y_HOTFIX4_EXPORT_MULTIPLE_CANDIDATES.md`
- `Release Notes/RELEASE_NOTES_2H_Y_HOTFIX4_EXPORT_MULTIPLE_CANDIDATES.md`

## Test

```bash
npm run test:sprint2h-y-hotfix4
```
