# 2H-V Code Integration Guide

Deze codebouw levert herbruikbare services en database scripts. Omdat bestaande applicatiebestanden per lokale baseline kunnen verschillen, zijn de wijzigingen als veilige overlay geleverd. Hieronder staan de concrete integratiepunten.

## 1. Exportservice

Na succesvolle export moet de service de status afleiden:

```js
import { deriveExportStatusAfterSuccessfulExport } from '../services/warningStatusHardeningService.js';

const derived = deriveExportStatusAfterSuccessfulExport(currentIssues);
```

Daarna bijwerken op `import_runs`:

```sql
UPDATE public.import_runs
SET
  ir_status = CASE
    WHEN $2 = 'EXPORTED_WITH_WARNINGS' THEN 'GEEXPORTEERD_MET_WAARSCHUWINGEN'
    WHEN $2 = 'EXPORTED' THEN 'GEEXPORTEERD'
    ELSE ir_status
  END,
  ir_export_status = $2,
  ir_exported_at = COALESCE(ir_exported_at, now()),
  ir_warning_count = $3,
  ir_blocking_issue_count = $4,
  ir_status_updated_at = now()
WHERE ir_run_id = $1;
```

## 2. Text normalization

In `services/editTextNormalizationService.js`, vóór aanroep van `saveManualStagingCorrection`:

```js
import { shouldAttemptEncodingRepair } from './warningStatusHardeningService.js';

const repairDecision = shouldAttemptEncodingRepair(preview);
if (!repairDecision.shouldSave) {
  return repairDecision;
}
```

Hiermee wordt voorkomen dat `repairable rows = 0` alsnog een manual overwrite probeert.

## 3. Manual correction

Na `saveManualStagingCorrection`:

```js
import { saveManualCorrectionAndRefreshEncodingWarning } from './encodingWarningLifecycleService.js';
```

Gebruik de helper met bestaande repositoryfuncties voor:

- `loadCurrentRow`;
- `saveManualStagingCorrection`;
- `replaceEncodingWarningForPosition`.

## 4. Route error mapping

In route handlers rond manual correction/text normalization:

```js
import { mapServiceErrorToHttp } from '../services/warningStatusHardeningService.js';

try {
  // existing handler
} catch (error) {
  const mapped = mapServiceErrorToHttp(error);
  return res.status(mapped.statusCode).json(mapped.body);
}
```

## 5. Repair

Gebruik eerst preview en pas daarna apply:

```bash
npm run repair:2h-v-export-status
npm run repair:2h-v-export-status:apply
```

## 6. NPM scripts

Voeg scripts toe met:

```bash
node scripts/apply_2h_v_package_scripts.js
```
