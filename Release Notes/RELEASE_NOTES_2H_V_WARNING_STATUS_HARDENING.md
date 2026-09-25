# Release Notes — Sprint 2H-V Warning/status hardening codebouw

## Type

Codebouwsprint met additieve database migratie, services, repair scripts, tests en documentatie.

## Nieuw

- Warning/status helper service.
- Encoding warning lifecycle helper service.
- Export status repair service.
- Additieve migratie op `import_runs` plus nieuwe warning-state en repair-audit tabellen.
- Docker runners voor migratie en repair.
- Automatische tests voor statusafleiding, encoding lifecycle, repairclassificatie en statische packaging checks.

## Gedrag

- Export met alleen non-blocking warnings resulteert in `GEEXPORTEERD_MET_WAARSCHUWINGEN`.
- Encoding repair met `repairable rows = 0` probeert geen save/overwrite.
- Manual free overwrite fouten worden functioneel gemapt naar HTTP 409.
- Bestaande foutieve exportstatussen kunnen via preview/apply worden gerepareerd.

## Migratie

```bash
POSTGRES_CONTAINER=my-postgresdb POSTGRES_USER=postgres POSTGRES_DB=musicdb npm run db:migrate:sprint2h-v
```

## Repair

```bash
npm run repair:2h-v-export-status
npm run repair:2h-v-export-status:apply
```

## Tests

```bash
npm run test:sprint2h-v
```
