# Functionele testcases — 2H-W Build/startapp hardening

Deze testcases dienen als basis voor geautomatiseerde tests in de latere codebouw.

## TC-2H-W-001 — Geen argumenten

**Given** `startapp.sh` staat in de projectroot.  
**When** de gebruiker uitvoert:

```bash
./startapp.sh
```

**Then** er wordt geen npm-taak uitgevoerd.  
**And** usage/help wordt getoond.  
**And** exitcode is 2.

## TC-2H-W-002 — Alleen build

**When** de gebruiker uitvoert:

```bash
./startapp.sh build
```

**Then** alleen `npm run build:all` wordt uitgevoerd.  
**And** er ontstaat een log met prefix `npm-build-all-`.  
**And** `install`, `validate`, `test` en `dev` worden niet uitgevoerd.

## TC-2H-W-003 — Validate en test

**When** de gebruiker uitvoert:

```bash
./startapp.sh validate test
```

**Then** `npm run validate` wordt uitgevoerd.  
**And** daarna `npm run test:e2e`.  
**And** er wordt geen build/install/dev uitgevoerd.

## TC-2H-W-004 — Kommagescheiden command list

**When** de gebruiker uitvoert:

```bash
./startapp.sh --commands build,validate,test
```

**Then** build, validate en test worden uitgevoerd in vaste volgorde.

## TC-2H-W-005 — All

**When** de gebruiker uitvoert:

```bash
./startapp.sh all
```

**Then** de volgorde is:

1. install
2. build
3. validate
4. test
5. dev

## TC-2H-W-006 — Dev altijd laatste

**When** de gebruiker uitvoert:

```bash
./startapp.sh dev build
```

**Then** build wordt eerst uitgevoerd.  
**And** dev wordt als laatste uitgevoerd.

## TC-2H-W-007 — Onbekend commando

**When** de gebruiker uitvoert:

```bash
./startapp.sh banana
```

**Then** het script toont een foutmelding voor onbekend commando.  
**And** exitcode is 2.  
**And** er wordt geen npm-taak uitgevoerd.

## TC-2H-W-008 — Keep days ongeldig

**When** de gebruiker uitvoert:

```bash
./startapp.sh --keep-days abc build
```

**Then** het script toont een validatiefout.  
**And** exitcode is 2.

## TC-2H-W-009 — Fout stopt standaard

**Given** `npm run build:all` faalt.  
**When** de gebruiker uitvoert:

```bash
./startapp.sh build validate
```

**Then** build faalt.  
**And** validate wordt niet uitgevoerd.  
**And** exitcode is de build-foutcode.

## TC-2H-W-010 — Continue on error

**Given** `npm run build:all` faalt.  
**When** de gebruiker uitvoert:

```bash
./startapp.sh --continue-on-error build validate
```

**Then** build faalt.  
**And** validate wordt toch uitgevoerd.  
**And** eindstatus blijft fout.

## TC-2H-W-011 — Logs per taak

**When** meerdere taken worden uitgevoerd.  
**Then** elke taak heeft een eigen logbestand in `logs/`.  
**And** elk logbestand bevat een timestamp.

## TC-2H-W-012 — Bash 3.2 compatibiliteit

**Given** macOS standaard Bash 3.2.  
**When** het script wordt uitgevoerd met meerdere commando's.  
**Then** er treden geen errors op door lege arrays of unsupported Bash features.

## Automatische testdekking codebouw

Toegevoegd:

```text
tests/static_2h_w_build_startapp_hardening.test.js
```

Deze test controleert:

1. `startapp.sh` bestaat onder de standaardnaam.
2. `startapp.sh` is Bash syntax-valid.
3. Zonder argumenten worden geen npm-taken uitgevoerd.
4. De commandogestuurde Artist-opzet is aanwezig.
5. De Importhitlijst-specifieke mapping is aanwezig.
6. Preflight en package-updater zijn aanwezig.
7. Documentatie en release notes zijn aanwezig.
8. Verboden folders/bestanden ontbreken.
