# Importhitlijst Backlog — actuele geconsolideerde stand

Laatste cleanup: **Sprint 2H-S — Pattern discovery keep/remove classification ontwerp**.  
Actuele functionele applicatiebaseline: **Sprint 2H-Q — Blocked Discogs export groeperen per gewenste versie**.  
Actuele documentatiebaseline: **Sprint 2H-S**.

## Leeswijzer

Dit bestand is de actieve backlog. De oude, lange backlog met historische dubbelingen staat als archief in:

```text
/docs/backlog/BACKLOG_HISTORY_BEFORE_2H_R.md
```

De actuele status-samenvatting staat ook in:

```text
/docs/backlog/BACKLOG_STATUS_20260704.md
```

## Open backlog-items

| ID | Titel | Status | Prioriteit | Advies |
|---|---|---|---|---|
| BL-IMP-118 | Pattern discovery: keep/remove classification voor haakjespatronen | Codebouw opgeleverd in 2H-S; klaar voor acceptatietest | P1 | Eerst acceptatietesten vóór wildcard/generieke patterns |
| BL-IMP-116 | String Patterns uitbreiden met generieke/wildcard patternregels | Open | P1 | Oppakken ná BL-IMP-118, zodat false positives eerst zijn begrensd |
| BL-IMP-115 | Edit-scherm UX verbeteren en workflowhulp compacter maken | Open | P2 | Goede UX-sprint; scherm rustiger maken |
| BL-IMP-084 | Candidate matching centraliseren | Open | P1 | Technische hardening; grotere impact |
| BL-IMP-086 | Discogs UI polish en foutafhandeling | Open | P2 | Loading/empty/error/rate-limit states verbeteren |
| BL-IMP-087 | E2E-testdekking verder uitbreiden | Open | P2 | Regressiedekking uitbreiden voor kernflows |
| BL-IMP-088 | Install/build/test validatie professionaliseren | Open | P2 | Validate-script, migratiecheck, schema guard |
| BL-IMP-091 | Manual repair zoeken met gescheiden artiest- en titelvelden | Open | P2 | UX-vervolg op manual repair |
| BL-IMP-092 | Omroepen-consumptie in Importhitlijst | Deels open | P3 | Onderhoud zelf zit in Coretables; tonen/selecteren/filteren blijft hier |
| BL-IMP-103 | Discogs enrichment review/promote-flow naar file_details ontwerpen | Open | P2 | Functioneel ontwerp nodig; vervolg op 2H-H onderzoek |
| BL-IMP-105 | Discogs master/release ids structureel auditen | Open | P3 | Controle/audit-item |

## Sprint 2H-S — toegevoegd ontwerpitem

### BL-IMP-118 — Pattern discovery: keep/remove classification voor haakjespatronen

**Aanleiding:** de Pattern discovery helper herkent nu ook tekst tussen haakjes als kandidaat-verwijderpattern wanneer die tekst in werkelijkheid onderdeel is van de officiële titel.

Voorbeelden van titelinhoud die niet verwijderbaar mag worden voorgesteld:

```text
Sweet Dreams (Are Made of This)
(Everything I Do) I Do It for You
(I Just) Died in Your Arms
```

Voorbeelden van wel verwijderbare/versionele patronen:

```text
(2011 Remaster)
(Live)
(Radio Edit)
(12" Mix)
```

**Functionele oplossingsrichting:**

- behoud bestaande `string_del_patterns` voor verwijderbare patronen;
- introduceer een beheerbare tabel voor niet-verwijderbare titelpatronen;
- Pattern discovery checkt eerst de keep/titelpatronen;
- bekende keep-patterns worden niet meer als verwijderbaar voorgesteld;
- de Pattern Suggesties UI krijgt per suggestie acties:
  - toevoegen aan verwijderbare patronen;
  - toevoegen aan niet-verwijderbare titelpatronen;
- onzekere haakjesinhoud wordt niet standaard als veilig verwijderbaar gepresenteerd;
- preview blijft leidend voordat iets aan `string_del_patterns` wordt toegevoegd.

**Voorkeursnaam nieuwe tabel:**

```text
string_keep_patterns
```

Alternatieve naam, indien functioneel duidelijker gewenst:

```text
string_title_patterns
```

**Status:** codebouw opgeleverd in `docs/sprint-2h/SPRINT_2H_S_PATTERN_KEEP_REMOVE_CLASSIFICATION.md`; klaar voor acceptatietest.

## Historisch / geparkeerd / opnieuw te openen bij concrete bevinding

Deze items stonden nog als open/proposed in oudere backlogteksten, maar zijn door latere sprints functioneel ingehaald, samengevoegd of verplaatst. Ze staan niet meer in de actieve backlog.

| ID / groep | Onderwerp | Nieuwe status | Toelichting |
|---|---|---|---|
| BL-IMP-021 t/m BL-IMP-025 | Probleemstatus/filtering uit Sprint 2B | Historisch / waarschijnlijk ingehaald | Statusbadges en filters zijn in latere 2H-lijn aanwezig; alleen opnieuw openen bij concrete testbevinding. |
| BL-IMP-026 t/m BL-IMP-029 | Rijstatus/probleemdetails/rechten/diagnose-UX | Historisch / deels ingehaald | Grotendeels opgegaan in Edit UX, workflowpolicy en BL-IMP-115. |
| BL-IMP-039 t/m BL-IMP-046 | Tekstnormalisatie/encoding-herstel uitbreidingen | Historisch / deels gerealiseerd | Concrete nieuwe bevinding nodig voordat dit actief wordt. |
| BL-IMP-058 / BL-IMP-061 | Oude Discogs master/release selectie en schema-uitbreiding | Ingehaald / opgesplitst | Vervangen door 2G/2H Discogs-flow en open vervolg BL-IMP-103/105. |
| BL-IMP-071 / BL-IMP-073 / BL-IMP-074 | Oude install/e2e/documentatie-items | Samengevoegd | Vallen nu onder BL-IMP-087, BL-IMP-088 en BL-IMP-090. |
| BL-IMP-104 / BL-IMP-107 | Discogs details / koppelknop rechts | Gesloten via 2H-K / 2H-L | Niet opnieuw actief houden. |

## Gesloten / gevalideerd

| ID | Titel | Afgerond in |
|---|---|---|
| BL-IMP-090 | Documentatie consolidatie en backlog cleanup | Sprint 2H-R |
| BL-IMP-111 | Pattern discovery helper voor String Patterns | Sprint 2H-O Fix 1 |
| BL-IMP-085 | Discogs detailinspectie / release-details bekijken | Sprint 2H-K |
| BL-IMP-096 | Discogs zoekmodal UX verbeteren | Sprint 2H-H |
| BL-IMP-097 | Onderzoek Discogs ID koppelen aan song/file_details-flow | Sprint 2H-H |
| BL-IMP-108 | Discogs UX stroomlijnen met andere apps | Sprint 2H-L |
| BL-IMP-109 | Export Find-cmd script robuuster maken | Sprint 2H-L Fix 1 |
| BL-IMP-110 | Discogs bekeken-markering uniek per resultaat corrigeren | Sprint 2H-L Fix 1 |
| BL-IMP-112 | Button workflow zichtbaar maken / prerequisites afdwingen | Sprint 2H-N |
| BL-IMP-113 | Gewenste songversie per hitlijstregel vastleggen | Sprint 2H-P Fix 1 |
| BL-IMP-114 | Pre-export acties blokkeren na export naar hitlijsten | Sprint 2H-M Fix 1 |
| BL-IMP-117 | Export blocked Discogs links groeperen per gewenste versie | Sprint 2H-Q |

> De volledige historische lijst van gesloten items staat in `docs/backlog/BACKLOG_HISTORY_BEFORE_2H_R.md`.

## Volgende aanbevolen keuzes

1. **BL-IMP-118 acceptatietesten** op een run met echte titelonderdelen tussen haakjes.
2. Daarna **BL-IMP-116** oppakken voor wildcard/generieke String Patterns.
3. Daarna kiezen tussen **BL-IMP-115** UX-polish of **BL-IMP-084** candidate matching centraliseren.

## Statusafspraak

- `Done` = opgeleverd en akkoord of functioneel vervangen door latere gevalideerde sprint.
- `Open` = actief backlog-item dat nog gekozen kan worden voor een komende sprint.
- `Codebouw opgeleverd; klaar voor acceptatietest` = functioneel/technisch ontwerp en testbasis zijn klaar, maar applicatiecode is nog niet gebouwd.
- `Historisch / geparkeerd` = niet actief plannen zonder nieuwe testbevinding of expliciete heropening.
