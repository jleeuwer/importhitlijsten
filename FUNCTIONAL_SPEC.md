# Functional Spec — Importhitlijst

## Actuele sprint

```text
2H-AA — BL-IMP-135 Drag-and-drop CSV Import Inbox (v1.2.0, code opgeleverd)
```

De 2H-S-sectie hieronder blijft als historische functionele baseline voor Pattern discovery behouden.

## Functionele wijziging 2H-S

**Onderwerp:** Pattern discovery keep/remove classification.

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

---

## 2H-Z Hotfix 2 — BL-IMP-136 Duplicate Row Review
Na import kan de gebruiker binnen de geselecteerde import-run expliciet zoeken naar dubbele stagingregels. De duplicate-identiteit is genormaliseerde artiest + titel; positie is alleen context. Detectie verwijdert niets automatisch. De gebruiker controleert de duplicategroepen, kiest welke rij(en) weg mogen en kan deze op `Skip` zetten of na expliciete bevestiging fysiek verwijderen. Per groep moet minimaal één rij behouden blijven. Fysieke delete raakt alleen staging, nooit `file_details` of de bron-CSV, en wordt geaudit.


---

## 2H-Z Hotfix 3 — Test Suite Hardening

De gebruikersflow van 2H-Z verandert inhoudelijk niet. De volledige geautomatiseerde testketen wordt betrouwbaar gemaakt door één unit/static/React-runner (Vitest) te gebruiken. Runs-navigatieacties worden semantisch als links aangeboden, en ongeldige Discogs timeout/cache instellingen vallen terug op veilige defaults. Actuele PostgreSQL voorbeelden gebruiken `musicdb`.


---

## 2H-AA — BL-IMP-135 Drag-and-drop CSV Import Inbox

De bestaande directory-scan blijft bestaan en krijgt een aanvullende dropzone/bestandskiezer voor maximaal 50 CSV-bestanden per batch en 25 MB per bestand. Iedere kandidaat heeft eigen conceptmetadata, blijft 7 dagen refresh-bestendig, gebruikt de bestaande SHA-256/list-fingerprint duplicatecontrole en kan individueel of via `Importeer alle gereedstaande lijsten` worden geïmporteerd. Bulkimport is per kandidaat transactioneel en foutgeïsoleerd. Zie `docs/sprint-2h/SPRINT_2H_AA_DRAG_DROP_CSV_IMPORT.md`.


## 2H-AA Hotfix 2 — metadata opslaan
Bij het invullen/wijzigen van metadata van een tijdelijke CSV-kandidaat (hitlijstnaam, jaar, omroep, periode) moet opslaan zonder serverfout verlopen. De functionele flow wijzigt niet; dit is een technische reparatie van de persistentiestap.
