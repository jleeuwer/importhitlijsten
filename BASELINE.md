# Baseline

## Buildbaseline voor 2H-AA

```text
Geaccepteerde baseline: Sprint 2H-Z / v1.1.0 inclusief Hotfix 4
Doelrelease: Sprint 2H-AA / v1.2.0
```

De v1.1.0-baseline bevat onder meer:

- BL-IMP-119 Exacte duplicate list detection;
- BL-IMP-134 CSV-importbestand lifecycle/registry;
- Hotfix 1 import-inbox UX;
- BL-IMP-136 duplicate row review en fysieke staging-delete;
- Hotfix 3 test-suite hardening;
- Hotfix 4 resterende pagineringtestcorrecties.

## 2H-AA

BL-IMP-135 voegt drag-and-drop en multi-file file-picker importkandidaten toe zonder de bestaande directory-scan of 2H-Z duplicate-regels te vervangen.

## Release discovery

`BASE_BRANCH=main` is door de gebruiker bevestigd. De aangeleverde baseline is een releasepackage zonder `.git`, waardoor een exact `BASE_COMMIT` in deze bouwomgeving niet betrouwbaar kan worden vastgesteld. Dit wordt expliciet in `release.manifest`/`RELEASE_READINESS_2H_AA.md` vermeld en niet verzonnen.

## Database

Standaard PostgreSQL database: `musicdb`; Docker-container: `my-postgresdb`.
