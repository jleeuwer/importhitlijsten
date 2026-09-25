# Release notes — Sprint 2G-E

## Titel

Sprint 2G-E — Stabilisatie, validatie en documentatie

## Basis

Deze release bouwt voort op:

```text
baseline_sprint2g_d_duplicate_import_prevention_validated_2026-04-26
```

## Wijzigingen

- `npm run build:all` toegevoegd.
- `npm run validate` en `npm run validate:all` toegevoegd.
- `scripts/build-all.sh` toegevoegd.
- `scripts/validate-all.sh` toegevoegd.
- E2E-smoketests uitgebreid.
- Playwright-serveroutput wordt naar `logs/e2e-server-<timestamp>.log` geschreven.
- Documentatie, testplan, backlog en baseline bijgewerkt.

## Geen functionele wijziging

De duplicate-import businesslogica uit Sprint 2G-D is niet gewijzigd.
