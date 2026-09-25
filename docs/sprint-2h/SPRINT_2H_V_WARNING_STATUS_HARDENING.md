# Sprint 2H-V — Warning/status hardening na export en manual correction

## 1. Aanleiding

Tijdens test/acceptatie zijn twee problemen vastgesteld:

1. Een hitlijst met waarschuwingen kan terecht geëxporteerd worden, maar blijft daarna in de staging op **aandacht nodig** staan.
2. Een encoding warning blijft bestaan na handmatige correctie. Eerder trad daarbij een technische stacktrace op vanuit `saveManualStagingCorrection` omdat tekstnormalisatie een manual free overwrite probeerde zonder expliciete bevestiging.

Daarnaast is besloten dat bestaande runs die al geëxporteerd zijn maar nog onterecht op aandacht nodig staan, veilig gerepareerd moeten kunnen worden.

## 2. Doel

- Niet-blokkerende warnings mogen export niet blokkeren.
- Een succesvolle export met alleen warnings krijgt de status **Geëxporteerd met waarschuwingen**.
- Encoding warnings worden na handmatige correctie opnieuw beoordeeld op de actuele tekst.
- Bij `repairable rows = 0` wordt geen save/overwrite uitgevoerd.
- Bestaande foutieve exportstatussen kunnen via preview/apply worden gerepareerd.

## 3. Codebouw scope

| Item | Omschrijving |
|---|---|
| BL-IMP-128 | Guard tekstnormalisatie/encoding repair tegen ongewenste free overwrite |
| BL-IMP-129 | Status na export met non-blocking warnings corrigeren |
| BL-IMP-130 | Encoding warning lifecycle na manual correction corrigeren |
| BL-IMP-131 | Repair bestaande geëxporteerde runs met foutieve aandacht-nodig status |

## 4. Opgeleverde componenten

- `services/warningStatusHardeningService.js`
- `services/encodingWarningLifecycleService.js`
- `services/exportStatusRepairService.js`
- `scripts/sql/20260829_sprint2h_v_warning_status_hardening.sql`
- `scripts/sql/2h_v_preview_export_status_repair.sql`
- `scripts/sql/2h_v_apply_export_status_repair.sql`
- `scripts/run_2h_v_migration.sh`
- `scripts/run_2h_v_export_status_repair.sh`
- tests onder `tests/`

## 5. Buiten scope

- Variant-aware matching uit BL-IMP-127.
- Cleanup van `file_details` duplicate groups.
- Exacte duplicate list detection.
- UI-polish BL-IMP-121/122.
