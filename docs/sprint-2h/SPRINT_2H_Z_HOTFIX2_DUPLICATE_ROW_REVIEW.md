# Sprint 2H-Z Hotfix 2 — Duplicate Row Review & Test Runner Hardening

**Applicatie:** Import Hitlijsten  
**Versie:** 1.1.0  
**Werkitem:** 2H-Z-HF2  
**Backlog:** BL-IMP-136  
**Status:** code opgeleverd; klaar voor acceptatietest.

## Aanleiding
Tijdens functionele acceptatietesten bleek dat een geïmporteerde CSV veel dubbele stagingregels kan bevatten. Daarnaast bleek `./startapp.sh test` alleen de drie Playwright E2E-tests te starten, terwijl de applicatie een veel grotere Vitest-suite heeft.

## Functioneel gedrag
Na selectie van een import-run kan de gebruiker in de Edit-flow kiezen voor **Zoek dubbele rijen**.

Een duplicategroep bestaat uit twee of meer stagingregels met dezelfde:

- genormaliseerde artiest;
- genormaliseerde titel.

De positie is geen onderdeel van de duplicate-identiteit en wordt alleen als context getoond. Een song die op positie 4 én positie 89 staat, is binnen dezelfde import dus een hoge-zekerheid duplicate wanneer artiest en titel gelijk zijn na conservatieve normalisatie.

Technische tekstnormalisatie:

- Unicode NFC;
- NBSP naar gewone spatie;
- trim;
- opeenvolgende whitespace naar één spatie;
- case-insensitive;
- typografische apostrofs naar `'`.

Inhoudelijke titelvarianten zoals `(Live)` blijven verschillend.

## Review-flow
1. Klik **Zoek dubbele rijen**.
2. De applicatie toont duplicategroepen in een reviewmodal.
3. Per groep wordt één regel als voorgestelde bewaarrij aangemerkt; de overige regels zijn standaard geselecteerd.
4. De gebruiker kan de selectie wijzigen, zolang minimaal één rij per groep behouden blijft.
5. Daarna is er keuze uit:
   - **Markeer als duplicate / Skip** — regel blijft fysiek in staging maar wordt uitgesloten van verdere verwerking;
   - **Fysiek verwijderen** — geselecteerde stagingregels worden na expliciete bevestiging transactioneel verwijderd.
6. Fysieke delete wijzigt nooit `file_details` en wijzigt nooit het oorspronkelijke CSV-bestand.
7. Voor iedere fysiek verwijderde rij wordt vooraf een auditrecord opgeslagen met reden `DUPLICATE_CONFIRMED`.

## Database
Hotfix 2 voegt een stabiele surrogate key toe aan `staging_hitlijsten`:

```text
sh_key bigint not null
```

Omdat dubbele importregels ook exact dezelfde positie kunnen hebben, is `hl_import_run_id + hl_positie` onvoldoende om één individuele rij veilig te selecteren.

Nieuwe audittabel:

```text
staging_hitlijsten_delete_audit
```

De migratie staat in:

```text
scripts/sql/20260925_sprint2h_z_hotfix2_duplicate_row_review.sql
```

Uitvoeren via Docker:

```bash
POSTGRES_CONTAINER=my-postgresdb \
POSTGRES_DB=musicdb \
POSTGRES_USER=postgres \
npm run db:migrate:sprint2h-z-hotfix2
```

## Test-runner correctie
`./startapp.sh test` voert voortaan `npm run test:all` uit in plaats van alleen `npm run test:e2e`.

`npm run test:all` bestaat uit:

```text
Vitest volledige testsuite
+ Playwright E2E
```

`./startapp.sh all` start nu `validate` gevolgd door `dev`; `validate` voert één reproduceerbare keten uit:

```text
npm ci
build
volledige testsuite
```

Hierdoor worden install/build/test niet meer dubbel uitgevoerd bij `all`.

## Niet in scope
BL-IMP-135 — drag-and-drop CSV-bestandselectie — blijft een apart backlog-item.
