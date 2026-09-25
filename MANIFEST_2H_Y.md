# Manifest — Sprint 2H-Y codebouw

## Inclusie

Volledige codebase op basis van 2H-X, inclusief 2H-Y code, documentatie, testcases en scripts.

## Belangrijkste gewijzigde/toegevoegde bestanden

- `models/hitlijsten.js`
- `models/import_runs.js`
- `middleware/errorHandler.js`
- `services/editEncodingRepairService.js`
- `services/editTextNormalizationService.js`
- `services/editManualCorrectionService.js`
- `services/matchingDiscogsStatusHardeningService.js`
- `tests/services_2h_y_matchingDiscogsStatusHardening.test.js`
- `tests/static_2h_y_matching_discogs_status_hardening.test.js`
- `scripts/sql/20260907_sprint2h_y_matching_discogs_status_hardening.sql`
- `scripts/sql/2h_y_ambiguous_file_details_diagnostics.sql`
- `scripts/sql/2h_y_discogs_lifecycle_diagnostics.sql`
- `scripts/run_2h_y_migration.sh`
- `scripts/run_2h_y_diagnostics.sh`
- `package.2h-y.scripts.json`
- `README.md`
- `laatstesprint.md`
- `docs/backlog/BL-IMP-124.md`
- `docs/backlog/BL-IMP-127.md`
- `docs/backlog/BL-IMP-128.md`
- `docs/backlog/BL-IMP-129.md`
- `docs/backlog/BL-IMP-130.md`
- `docs/backlog/BL-IMP-131.md`
- `docs/backlog/BL-IMP-133.md`
- `docs/functional/FUNCTIONAL_SPEC_2H_Y_MATCHING_DISCOGS_STATUS_HARDENING.md`
- `docs/technical/TECHNICAL_SPEC_2H_Y_MATCHING_DISCOGS_STATUS_HARDENING.md`
- `docs/testcases/FUNCTIONAL_TEST_CASES_2H_Y_MATCHING_DISCOGS_STATUS_HARDENING.md`
- `Release Notes/RELEASE_NOTES_2H_Y_MATCHING_DISCOGS_STATUS_HARDENING.md`

## Uitsluitingen uit ZIP

- `node_modules/`
- `dist/`
- `logs/`
- `test-results/`
- `.DS_Store`
- `__MACOSX/`
- losse `*.log` bestanden

## Hotfix na validate-log 2026-09-07 13:19

- `tests/models/exportHitlijsten.test.js` bijgewerkt op de 2H-Y-regel dat `MULTIPLE_FILE_DETAILS_COMBINED_MATCHES` blocking is.
- Oude 2G-D testverwachtingen beschouwden meerdere combined matches nog als waarschuwing; dat is sinds BL-IMP-124 bewust gewijzigd.
- SQL-structuurverwachting aangepast: validatie-SQL mag `LEFT JOIN LATERAL` gebruiken zolang `candidate_fd_keys` en `hl_desired_song_type_key` beschikbaar zijn.

## Hotfix 2 - 2026-09-07

Validate-fix na gebruikerslog `validate-20260907-141550.log`:

- `tests/models/exportHitlijsten.test.js` verwacht nu ook het 2H-Y veld `ambiguousLinks` in de status-summary.
- Geen applicatiecode gewijzigd.
- Oorzaak: testverwachting liep één veld achter op het nieuwe BL-IMP-124 gedrag waarbij meerdere gecombineerde `file_details`-kandidaten blocking zijn.
