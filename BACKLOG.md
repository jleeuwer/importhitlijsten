# Importhitlijst Backlog — actuele geconsolideerde stand

Laatste documentatie-update: **Sprint 2H-AA — BL-IMP-135 Drag-and-drop CSV Import Inbox**.  
Geaccepteerde codebaseline vóór deze sprint: **2H-Z / v1.1.0 Hotfix 4**.  
Actuele releasecandidate: **2H-AA / v1.2.0**.

## Leeswijzer

Dit bestand is de actieve backlog. Historische backlogtekst vóór de cleanup van BL-IMP-090 staat in:

```text
/docs/backlog/BACKLOG_HISTORY_BEFORE_2H_R.md
```

De actuele status-samenvatting staat in:

```text
/docs/backlog/BACKLOG_STATUS_20260927.md
```

## Actieve/open backlog

| ID | Titel | Status | Prioriteit | Advies |
|---|---|---|---|---|
| BL-IMP-084 | Candidate matching centraliseren | Open | P1 | Technische hardening; grotere impact |
| BL-IMP-086 | Discogs UI polish en foutafhandeling | Open | P2 | Loading/empty/error/rate-limit states verbeteren |
| BL-IMP-087 | E2E-testdekking verder uitbreiden | Open | P2 | Na stabilisatie test-all verder uitbreiden |
| BL-IMP-091 | Manual repair zoeken met gescheiden artiest- en titelvelden | Open | P2 | UX-vervolg op manual repair |
| BL-IMP-092 | Omroepen-consumptie in Importhitlijst | Deels open | P3 | Onderhoud in Coretables; consumptie hier |
| BL-IMP-103 | Discogs enrichment review/promote-flow naar file_details ontwerpen | Open | P2 | Functioneel ontwerp nodig |
| BL-IMP-105 | Discogs master/release ids structureel auditen | Open | P3 | Controle/audit-item |
| BL-IMP-115 | Edit-scherm UX verbeteren en workflowhulp compacter maken | Open | P2 | UX-polish |
| BL-IMP-116 | String Patterns uitbreiden met generieke/wildcard patternregels | Open | P1 | Vervolg op geaccepteerde BL-IMP-118 |
| BL-IMP-120 | Mogelijke duplicate lijsten detecteren met similarity score | Open / later | P2 | Pas na exacte duplicate-detectie |
| BL-IMP-125 | Bestaande file_details duplicate-groepen review/cleanup | Open / later | P2 | Geen automatische cleanup |
| BL-IMP-126 | Toekomstige `fd_entry_added_ts` controleren/corrigeren | Open | P2 | Data-quality repair |
| BL-IMP-135 | Drag-and-drop CSV-bestand voor import | Open | P2 | Los backlog-item na 2H-Z |

## 2H-Z / v1.1.0 — in acceptatietest

### BL-IMP-119 — Exacte duplicate list detection

Status: **codebouw v1.1.0 opgeleverd; acceptatietest loopt**.

- fysieke bestandsidentiteit via SHA-256;
- semantische list fingerprint op positie + conservatief genormaliseerde artiest + titel;
- exact duplicate = waarschuwing + expliciete override.

### BL-IMP-134 — CSV-importbestand lifecycle

Status: **codebouw v1.1.0 opgeleverd; Hotfix 1 verwerkt UX-bevindingen**.

- scanresultaten met paginering;
- recente scandirectories;
- focus naar `Hitlijst name` na selectie;
- client-side toggle geïmporteerde bestanden.

### BL-IMP-136 — Post-import dubbele rijen detecteren, reviewen en opschonen

Status: **gesloten / geaccepteerd in 2H-Z v1.1.0**.

- duplicate-identiteit = genormaliseerde artiest + titel binnen dezelfde import-run;
- positie is context en geen onderdeel van duplicate-identiteit;
- niets automatisch verwijderen;
- minimaal één rij per groep behouden;
- geselecteerde rijen kunnen op `Skip` worden gezet;
- geselecteerde rijen kunnen na expliciete bevestiging fysiek uit staging worden verwijderd;
- fysieke delete wordt geaudit met reden `DUPLICATE_CONFIRMED`;
- `file_details` en bron-CSV worden niet gewijzigd.

### 2H-Z Hotfix 3 — Test Suite Hardening

Status: **codebouw opgeleverd; acceptatietest loopt**.

- legacy `node:test` geconverteerd naar Vitest;
- verouderde/brittle assertions geactualiseerd;
- Runs-navigatielinks accessibility gecorrigeerd;
- Discogs timeout/cache NaN-fallback gehard;
- actuele PostgreSQL documentatie/defaults gebruiken `musicdb`.

## BL-IMP-135 — Drag-and-drop CSV-importselectie

Status: **actuele sprint 2H-AA — concrete code opgeleverd; acceptatietest open; code- en documentatieversie 1.2.0**.

Vastgestelde scope:

- drag-and-drop én klikbare multi-file picker;
- bestaande directory-scan blijft behouden;
- maximaal 50 CSV's per batch, 25 MB per CSV;
- één bestand: automatisch selecteren + focus `Hitlijst name`; meerdere: eerst inbox vullen;
- iedere CSV krijgt eigen naam, jaar, omroep, periode en overige metadata;
- conceptmetadata en kandidaten overleven refresh en blijven maximaal 7 dagen beschikbaar;
- dezelfde SHA-256 en semantic list-fingerprint duplicatecontrole als 2H-Z;
- expliciete override voor reeds geïmporteerd bestand/lijstinhoud;
- individueel importeren of `Importeer alle gereedstaande lijsten`;
- bulkimport per kandidaat transactioneel en foutgeïsoleerd;
- resultaatssamenvatting met doorklik naar blocked/error kandidaten;
- individuele cleanup en `Verwijder alle tijdelijke bestanden`;
- automatische cleanup bij serverstart en optioneel periodiek, zonder aparte cron/container.

Zie de 2H-AA requirements, functioneel ontwerp, technisch ontwerp en functionele testcases.

## Gesloten / gevalideerd

| ID | Titel | Afgerond in |
|---|---|---|
| BL-IMP-085 | Discogs detailinspectie / release-details bekijken | Sprint 2H-K |
| BL-IMP-088 | Install/build/test validatie professionaliseren | Geaccepteerd |
| BL-IMP-090 | Documentatie consolidatie en backlog cleanup | Sprint 2H-R |
| BL-IMP-096 | Discogs zoekmodal UX verbeteren | Sprint 2H-H |
| BL-IMP-097 | Onderzoek Discogs ID koppelen aan song/file_details-flow | Sprint 2H-H |
| BL-IMP-108 | Discogs UX stroomlijnen met andere apps | Sprint 2H-L |
| BL-IMP-109 | Export Find-cmd script robuuster maken | Sprint 2H-L Fix 1 |
| BL-IMP-110 | Discogs bekeken-markering uniek per resultaat corrigeren | Sprint 2H-L Fix 1 |
| BL-IMP-111 | Pattern discovery helper voor String Patterns | Sprint 2H-O Fix 1 |
| BL-IMP-112 | Button workflow zichtbaar maken / prerequisites afdwingen | Sprint 2H-N |
| BL-IMP-113 | Gewenste songversie per hitlijstregel vastleggen | Sprint 2H-P Fix 1 |
| BL-IMP-114 | Pre-export acties blokkeren na export naar hitlijsten | Sprint 2H-M Fix 1 |
| BL-IMP-117 | Export blocked Discogs links groeperen per gewenste versie | Sprint 2H-Q |
| BL-IMP-118 | Pattern discovery: keep/remove classification voor haakjespatronen | Sprint 2H-S |
| BL-IMP-121 | Clickable Discogs link in tabel | Sprint 2H-X |
| BL-IMP-122 | Artist-key uit zichtbare UI-tabel | Sprint 2H-X |
| BL-IMP-124 | Export/matching rond file_details candidates | Sprint 2H-Y / Hotfix 4 |
| BL-IMP-127 | Variant-aware matching/deduplicate ontwerp | Sprint 2H-Y |
| BL-IMP-128 | Encoding repair zonder vrije overwrite | Sprint 2H-Y |
| BL-IMP-129 | Exportstatus met non-blocking warnings | Sprint 2H-Y |
| BL-IMP-130 | Encoding warning cleanup na manual correction | Sprint 2H-Y Hotfix 3 |
| BL-IMP-131 | Repair bestaande foutieve attention-statussen | Sprint 2H-Y |
| BL-IMP-132 | Robuuste `startapp.sh` Artist-style | Geaccepteerd |
| BL-IMP-133 | Discogs-link lifecycle | Sprint 2H-Y |
| BL-IMP-136 | Post-import duplicate row review/cleanup | Sprint 2H-Z v1.1.0 |
| BL-IMP-134 | CSV import file lifecycle / registry | Sprint 2H-Z v1.1.0 |
| BL-IMP-119 | Exact duplicate list detection | Sprint 2H-Z v1.1.0 |

## Historisch / geparkeerd

Oudere items die door latere sprints zijn ingehaald of samengevoegd blijven in `docs/backlog/BACKLOG_HISTORY_BEFORE_2H_R.md` en worden alleen heropend bij een concrete nieuwe bevinding.

## Statusafspraak

- `Gesloten / gevalideerd` = getest/geaccepteerd of functioneel vervangen door een latere geaccepteerde oplossing.
- `Open` = actief backlog-item voor een toekomstige sprint.
- `Codebouw opgeleverd; acceptatietest loopt` = code en testbasis zijn geleverd maar de actuele releasecandidate is nog niet door de gebruiker geaccepteerd.
- `Historisch / geparkeerd` = niet actief plannen zonder nieuwe bevinding.


## 2H-AA Hotfix 2 testbevinding
- BL-IMP-135: kandidaatmetadata PATCH gaf PostgreSQL `inconsistent types deduced for parameter $3`.
- Correctie: expliciete consistente `varchar(32)` cast in modelquery.
- Status: code opgeleverd voor hertest; onderdeel van 2H-AA v1.2.0, nog niet afzonderlijk afgesloten.
