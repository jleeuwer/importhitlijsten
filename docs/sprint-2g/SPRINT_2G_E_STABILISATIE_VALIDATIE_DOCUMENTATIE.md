# Sprint 2G-E — Stabilisatie, validatie en documentatie

## Doel

Sprint 2G-E verstevigt de gevalideerde 2G-D baseline na de Discogs- en duplicate-import uitbreidingen. De sprint voegt geen grote nieuwe functionele flow toe, maar standaardiseert install/build/test-commando's, breidt e2e-smoketests uit en werkt de documentatie bij.

## Scope

### BL-IMP-071 — Install/build/test standaardisatie afronden

Toegevoegd/aangepast:

- `npm run build:all`
- `npm run validate`
- `npm run validate:all`
- `scripts/build-all.sh`
- `scripts/validate-all.sh`

Alle scripts maken de `logs/` directory aan en schrijven timestamped output naar die directory.

### BL-IMP-073 — E2E-testdekking uitbreiden

De e2e-smoketest is uitgebreid van alleen `/api/health` naar:

- `/api/health`
- `/api/db-health`
- validatiefout op `/api/discogs/search` zonder artist/title

De e2e-tests blijven bewust licht, zodat ze primair controleren of serverstart, API-routing en basisvalidatie werken.

### BL-IMP-074 — Release-baseline en documentatie opschonen

Bijgewerkt:

- `BACKLOG.md`
- `BASELINE.md`
- `TEST_PLAN.md`
- `Readme.md`
- dit sprintdocument

### BL-IMP-077 — Duplicate feedback/polish

De 2G-D duplicate-feedback blijft inhoudelijk behouden:

- teller voor duplicate rows
- onderscheid tussen bestaand in `file_details` en dubbel binnen dezelfde run
- bulkactie `Zet duplicates op Skip`

Deze sprint wijzigt de duplicate-businesslogica niet, zodat de gevalideerde 2G-D functionaliteit stabiel blijft.

## Nieuwe commando's

Installeren:

```bash
npm run install:all
```

Build:

```bash
npm run build:all
```

Volledige validatie:

```bash
npm run validate
```

E2E-smoketest:

```bash
npm run test:e2e
```

## Logbestanden

De scripts schrijven naar `logs/`, bijvoorbeeld:

- `logs/build-all-YYYYMMDD-HHMMSS.log`
- `logs/validate-all-YYYYMMDD-HHMMSS.log`
- `logs/e2e-server-YYYYMMDD-HHMMSS.log`

## Validatieadvies lokaal

```bash
mkdir -p logs
npm run validate 2>&1 | tee "logs/manual-validate-$(date +%Y%m%d-%H%M%S).log"
```

Of los:

```bash
npm run build:all
npm run test:sprint2g
npm run test:e2e
```

## Verwachte baseline na akkoord

```text
baseline_sprint2g_e_stabilisatie_validatie_documentatie_validated_2026-04-26
```
