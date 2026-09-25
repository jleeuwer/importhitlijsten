# BL-IMP-128 — Tekstnormalisatie/encoding repair mag geen manual free overwrite triggeren zonder expliciete bevestiging

## Status

Open — opgenomen in Sprint 2H-Y design.

## Bevinding

Bij encoding repair/tekstnormalisatie is een fout opgetreden:

```text
Manual free overwrite requires explicit confirmation. Select a file_details candidate or confirm overwrite.
```

De melding verscheen terwijl de encoding preview aangaf dat er wel beschadigde rijen waren, maar geen herstelbare repairs:

```text
Encoding repair preview — requested: 1, scanned: 1, damaged rows: 1, repairable rows: 0
No recoverable encoding repairs detected for the current selection.
```

## Probleem

Een normalisatie-actie mag niet via de manual free overwrite-flow lopen wanneer er geen herstelbare wijziging is, en mag al helemaal geen stacktrace of technische foutmelding aan de gebruiker tonen.

## Scope

- Geen save/overwrite uitvoeren als `repairable rows = 0`.
- Manual overwrite alleen toestaan met expliciete bevestiging.
- Functionele melding tonen in plaats van stacktrace.
- Logging behouden voor diagnostics.

## Acceptatiecriteria

1. Bij nul herstelbare repairs wordt niets opgeslagen.
2. Gebruiker krijgt een begrijpelijke melding.
3. Geen stacktrace in de UI.
4. Manual overwrite vereist expliciete bevestiging.
5. Bestaande guard blijft bestaan en wordt niet afgezwakt.
