# Release Notes — BL-IMP-123 File Details duplicate diagnostics

## Type

Diagnose-/hardening-sprint. Geen runtime feature, geen database-migratie, geen datawijzigingen.

## Nieuw

- Read-only SQL-diagnostics voor functionele `file_details` duplicate groups.
- Docker-runner met standaardcontainer `my-postgresdb`.
- Rapportage over gebruik via `hitlijsten.fd_key` en `hitlijsten.hl_samenstel_fd_key`.
- Voor/na-export baseline om te bewijzen of export nieuwe `file_details` records aanmaakt.

## Veiligheid

Het SQL-script gebruikt alleen `SELECT`, `CREATE TEMP VIEW` en `DROP VIEW IF EXISTS pg_temp...`. Er worden geen records gewijzigd of verwijderd.

## Testen

```bash
npm run test:bl-imp-123
```

Als deze sprint in een bestaande codebase wordt geïntegreerd, voeg dan aan `package.json` toe:

```json
{
  "scripts": {
    "diagnostics:bl-imp-123": "bash scripts/run_bl_imp_123_diagnostics.sh",
    "test:bl-imp-123": "vitest run --config vite.config.js tests/static_bl_imp_123_diagnostics.test.js"
  }
}
```
