# Functional spec — 2H-W Build/startapp hardening

## Persona

Als ontwikkelaar/tester van Importhitlijst wil ik gericht kunnen kiezen welke lifecycle-stappen ik uitvoer, zodat ik snel kan bouwen, valideren, testen of starten zonder onbedoeld alle stappen te draaien.

## Gewenste gebruikersflow

### Alleen build draaien

```bash
./startapp.sh build
```

Resultaat:

- alleen `npm run build:all` wordt uitgevoerd;
- logbestand wordt geschreven naar `logs/npm-build-all-<timestamp>.log`;
- bij fout stopt het script met dezelfde exitcode.

### Validate en test draaien

```bash
./startapp.sh validate test
```

Resultaat:

- `npm run validate`;
- daarna `npm run test:e2e`;
- geen install, geen build, geen dev.

### Kommagescheiden commando's

```bash
./startapp.sh --commands build,validate,test
```

Resultaat:

- build, validate en test in vaste functionele volgorde.

### Alles draaien

```bash
./startapp.sh all
```

Resultaat:

- install;
- build;
- validate;
- test;
- dev.

`dev` wordt als laatste gestart.

### Geen commando

```bash
./startapp.sh
```

Resultaat:

- geen npm-taak wordt uitgevoerd;
- usage/help wordt getoond;
- exitcode 2.

## Status en logging

Voor elke taak moet zichtbaar zijn:

- start van de taak;
- exact npm-commando;
- logbestand;
- succes/fout;
- exitcode bij fout.

## Foutgedrag

Standaard stopt het script bij de eerste fout. Met `--continue-on-error` gaat het script door met de volgende taak, maar de eindstatus blijft fout als één of meer taken faalden.

## Logopschoning

Met `--keep-days N` kunnen oude `.log`-bestanden in `logs/` worden verwijderd. Standaard `N=0`, dus niets verwijderen.
