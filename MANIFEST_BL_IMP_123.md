# Manifest — BL-IMP-123 full overlay

Deze ZIP bevat een veilige copy-over oplevering voor BL-IMP-123.

## Bestanden

```text
README.md
laatstesprint.md
FUNCTIONAL_SPEC_BL_IMP_123.md
TECHNICAL_SPEC_BL_IMP_123.md
TEST_PLAN_BL_IMP_123.md
TESTING_NOTES_BL_IMP_123.md
package.bl-imp-123.scripts.json
scripts/apply_bl_imp_123_package_scripts.js
scripts/run_bl_imp_123_diagnostics.sh
scripts/sql/bl_imp_123_file_details_duplicate_diagnostics.sql
tests/static_bl_imp_123_diagnostics.test.js
docs/backlog/BL-IMP-123.md
docs/backlog/BACKLOG_BL_IMP_123_UPDATE.md
docs/sprint-2h/SPRINT_2H_BL_IMP_123_FILE_DETAILS_DUPLICATE_DIAGNOSTICS.md
Release Notes/RELEASE_NOTES_BL_IMP_123.md
```

## Niet opgenomen

- `node_modules`
- `dist`
- `logs`
- `__MACOSX`
- `.DS_Store`

## Package scripts

Deze oplevering levert bewust geen volledige `package.json` mee, om bestaande scripts en metadata niet te overschrijven. Gebruik:

```bash
node scripts/apply_bl_imp_123_package_scripts.js
```
