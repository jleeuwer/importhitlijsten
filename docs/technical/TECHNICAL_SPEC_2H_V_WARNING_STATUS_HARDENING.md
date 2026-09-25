# Technical Spec — 2H-V Warning/status hardening

## 1. Service helpers

### `warningStatusHardeningService.js`

Bevat:

- issue-classificatie naar blocking/warning/info;
- statusafleiding voor export en viewmodel;
- guard voor encoding preview `repairable rows = 0`;
- mapping van manual overwrite errors naar HTTP 409.

### `encodingWarningLifecycleService.js`

Bevat:

- detectie van veelvoorkomende mojibake/encoding patronen;
- detectie op actuele rowvelden;
- recalculation resultaat na manual correction;
- orchestration helper om bestaande `saveManualStagingCorrection` te combineren met warning refresh.

### `exportStatusRepairService.js`

Bevat:

- classificatie van repair-kandidaten;
- preview/apply mode validatie;
- samenvatting van repairbare en overgeslagen runs.

## 2. Database migratie

De migratie is additief:

- extra exportstatusvelden op `import_runs`;
- nieuwe tabel `import_run_warning_state`;
- nieuwe tabel `import_run_status_repair_audit`.

Er worden geen bestaande records verwijderd.

## 3. Exportstatus update

Na succesvolle export gebruikt de exportservice:

```js
const status = deriveExportStatusAfterSuccessfulExport(issues);
```

Daarna worden minimaal `ir_export_status`, `ir_exported_at`, `ir_warning_count`, `ir_blocking_issue_count` en `ir_status` bijgewerkt volgens het afgeleide resultaat.

## 4. Text normalization guard

In `normalizeTextForPositions` moet vóór `saveManualStagingCorrection` worden gecontroleerd:

```js
const repairDecision = shouldAttemptEncodingRepair(preview);
if (!repairDecision.shouldSave) return repairDecision;
```

## 5. Manual correction warning refresh

Na succesvolle handmatige correctie moet de actuele row opnieuw worden geladen en de warning state worden vervangen of opgelost.

## 6. Repair scripts

Preview:

```bash
bash scripts/run_2h_v_export_status_repair.sh --preview
```

Apply:

```bash
bash scripts/run_2h_v_export_status_repair.sh --apply
```

Apply draait binnen een transactie en schrijft auditregels.

## 7. Integratie

Zie `docs/integration/2H_V_CODE_INTEGRATION_GUIDE.md` voor concrete integratiepunten in bestaande services/routes.
