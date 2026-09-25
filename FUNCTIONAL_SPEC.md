# Functional Spec — Importhitlijst

## Actuele sprint

```text
2H-S — Pattern discovery keep/remove classification
```

## Functionele wijziging 2H-S

De Pattern Suggesties-flow maakt onderscheid tussen:

- **Verwijderbare patronen**: opschoonmetadata die in `string_del_patterns` hoort.
- **Titelonderdelen**: tekst die onderdeel is van de officiële songtitel en in `string_keep_patterns` hoort.

Wanneer een kandidaat voorkomt in `string_keep_patterns`, mag deze niet meer als verwijderbaar patroon worden voorgesteld.

## UI

In de Pattern Suggesties modal kan de gebruiker geselecteerde varianten verwerken met:

```text
Toevoegen als verwijderbaar
Toevoegen als titelonderdeel
```

De modal toont classificatiebadges en het aantal suggesties dat is onderdrukt omdat het al als titelonderdeel bekend is.

## Geen automatische titelmutatie

Pattern Suggesties past geen stagingregels aan. Alleen de beheerbare patternlijsten worden bijgewerkt.
