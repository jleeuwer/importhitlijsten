# Technical Spec — BL-IMP-123

## Componenten

- `scripts/sql/bl_imp_123_file_details_duplicate_diagnostics.sql`
- `scripts/run_bl_imp_123_diagnostics.sh`
- `scripts/apply_bl_imp_123_package_scripts.js`
- `tests/static_bl_imp_123_diagnostics.test.js`

## Veiligheid

Het SQL-script is read-only. Het maakt alleen tijdelijke views in `pg_temp` en voert selecties uit.

Niet toegestaan in het SQL-script:

- `INSERT`
- `UPDATE`
- `DELETE`
- `TRUNCATE`
- permanente `CREATE TABLE`
- `ALTER`
- `DROP TABLE` / `DROP SCHEMA`

## Docker

De runner gebruikt standaard:

- `POSTGRES_CONTAINER=my-postgresdb`
- `POSTGRES_USER=postgres`
- `POSTGRES_DB=musicdb`

Deze waarden zijn overridable via environment variables.
