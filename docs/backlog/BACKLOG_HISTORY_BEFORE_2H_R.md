# Backlog historisch archief vóór Sprint 2H-R

> Dit bestand bewaart de oude volledige backlogtekst vóór de cleanup van BL-IMP-090.
> De actuele actieve backlog staat in `BACKLOG.md` en `docs/backlog/BACKLOG_STATUS_20260704.md`.

---

# Importhitlijst Backlog

## Statusoverzicht

| ID | Titel | Sprint | Status | Prioriteit |
|---|---|---|---|---|
| BL-IMP-001 | Exportfunctie foutanalyse en hotfix | Sprint 1 | Done | P1 |
| BL-IMP-002 | Exportvalidatie vóór uitvoering | Sprint 1 | Done | P1 |
| BL-IMP-009 | Regressietests voor exportfunctie | Sprint 1 | Done | P1 |
| BL-IMP-011 | Editflow uitbreiden met artiestrelatieherstel | Sprint 2A | Done | P1 |
| BL-IMP-012 | Diagnose in editflow tonen | Sprint 2A | Done | P1 |
| BL-IMP-014 | Documentatie Sprint 2A editflow | Sprint 2A | Done | P2 |
| BL-IMP-015 | Regressietests voor editfase | Sprint 2A | Done | P1 |
| BL-IMP-016 | Sprint 2A documentatie hardenen | Sprint 2A-H | Done | P1 |
| BL-IMP-017 | Regressietests diagnostics uitbreiden | Sprint 2A-H | Done | P1 |
| BL-IMP-018 | Regressietests repair uitbreiden | Sprint 2A-H | Done | P1 |
| BL-IMP-019 | Editflow logging standaardiseren | Sprint 2A-H | Done | P2 |
| BL-IMP-020 | Sprint 2A cleanup | Sprint 2A-H | Done | P2 |
| BL-IMP-021 | Probleemstatus zichtbaar maken in lijst | Sprint 2B | Open | P1 |
| BL-IMP-022 | Filter “alleen probleemrijen” | Sprint 2B | Open | P1 |
| BL-IMP-023 | Filter op blocker en warning | Sprint 2B | Open | P1 |
| BL-IMP-024 | Regressietests lijstfilters | Sprint 2B | Open | P1 |
| BL-IMP-025 | Documentatie probleemfiltering | Sprint 2B | Open | P2 |
| BL-IMP-026 | Rijstatus visueel en eenduidig maken | Sprint 2D-A | Proposed | P1 |
| BL-IMP-027 | Probleemdetails per rij tonen | Sprint 2D-A | Proposed | P1 |
| BL-IMP-028 | Editformulier rechten aanscherpen | Sprint 2D-A | Proposed | P1 |
| BL-IMP-029 | Editscherm herontwerpen voor snellere diagnose | Sprint 2D-A | Proposed | P1 |
| BL-IMP-030 | Export guardrail: hitlijst/uitzendjaar maar één keer exporteren | Sprint 2D-B | Done | P1 |
| BL-IMP-031 | Editflow vereenvoudigen naar run-context | Sprint 2D-B | Done | P1 |
| BL-IMP-032 | Home filteren op hitlijst en uitzendjaar | Sprint 2D-B | Done | P1 |
| BL-IMP-033 | Batch verrijken van jaar = 0 vanuit file_details | Sprint 2D-C | Done | P1 |
| BL-IMP-034 | Regressietests UX, flow en exportguardrails | Sprint 2D-B | Done | P1 |
| BL-IMP-035 | Batch herstel artiest/titel swap voor huidige run | Sprint 2C-H | Done | P1 |
| BL-IMP-036 | Geforceerde batch swap voor zichtbare/gefilterde rijen | Sprint 2E-A | Done | P1 |
| BL-IMP-037 | Handmatige herstelmodus voor staging-bronvelden | Sprint 2E-A | Done | P1 |
| BL-IMP-038 | Herberekenen afgeleide velden na handmatige correctie | Sprint 2E-A | Done | P1 |
| BL-IMP-039 | Tekstnormalisatie en encoding-herstel bij import en edit | Sprint 2E-B | Proposed | P1 |
| BL-IMP-040 | Regressietests voor forced repair, handmatige correctie en normalisatie | Sprint 2E-B | Proposed | P1 |
| BL-IMP-054 | Async laden van exportstatus bij runselectie | Hotfix | Done | P1 |
| BL-IMP-055 | Exportstatus-query optimaliseren en indexadvies toevoegen | Hotfix | Done | P1 |
| BL-IMP-056 | Omroepenbeheer en omroepkoppeling inclusief seeddata | Sprint 2F-A | Done | P1 |
| BL-IMP-057 | Muziekperiode/decenniumcategorie inclusief seeddata | Sprint 2F-A | Done | P1 |
| BL-IMP-058 | Discogs master/release zoek- en selectieflow | Sprint 2G-B | Proposed | P2 |
| BL-IMP-059 | Discogs API technisch onderzoek, caching en rate limiting | Sprint 2G-A | Done | P2 |
| BL-IMP-060 | Copy correcte artiest/titel naar klembord | Sprint 2F-B | Done | P3 |
| BL-IMP-061 | Database-uitbreiding Discogs keys en URL's op staging en hitlijsten | Sprint 2G-B | Proposed | P2 |
| BL-IMP-062 | Sprint 2D-A-V validatie en baselinebesluit | Sprint 2D-A-V | Done | P1 |
| BL-IMP-117 | Export blocked Discogs links groeperen per gewenste versie | Sprint 2H-Q | Done | P1 |

---

## Sprint 1 — Export stabilisatie

### BL-IMP-001 — Exportfunctie foutanalyse en hotfix
- Status: Done
- Prioriteit: P1
- Resultaat:
  - exportvalidatie omgezet van `fd_tag_title + as_correcte_artiest_spelling` naar `fd_tag_title + hl_artist_key`
  - export-upsert joint nu op `file_details.fd_artist_key = staging_hitlijsten.hl_artist_key`
  - UI-precheck gebruikt dezelfde business rule als backend
- Acceptatiecriteria:
  - export gebruikt relationele artiestsleutel
  - export is niet meer afhankelijk van tekstuele artiestspelling als primaire match
  - blokkade en UI melden dezelfde kernreden

### BL-IMP-002 — Exportvalidatie vóór uitvoering
- Status: Done
- Prioriteit: P1
- Resultaat:
  - pre-export diagnose per probleemrij
  - reason codes toegevoegd
  - blokkade blijft all-or-nothing per run
- Acceptatiecriteria:
  - eerste echte blocker is zichtbaar voor gebruiker
  - export start niet bij blocker
  - diagnose is consistent met business rules

### BL-IMP-009 — Regressietests voor exportfunctie
- Status: Done
- Prioriteit: P1
- Resultaat:
  - modeltests voor status en exportblokkade
  - react-test voor aangepaste exportwaarschuwing in de UI
- Acceptatiecriteria:
  - regressie naar oude matchlogica wordt gedetecteerd
  - key-based validatie blijft aantoonbaar afgedekt

---

## Sprint 2A — Werkende editflow voor probleemrijen

### BL-IMP-011 — Editflow uitbreiden met artiestrelatieherstel
- Status: Done
- Prioriteit: P1
- Resultaat:
  - bestaande editflow uitgebreid met herstelactie voor artiestrelatie
  - repair vindt plaats binnen de editmodal
  - geen parallelle herstelknop buiten edit toegevoegd
- Acceptatiecriteria:
  - probleemrij kan via bestaande editactie worden geopend
  - herstelactie kan `hl_artist_key` en canonieke artiestinfo herstellen
  - flow blijft binnen bestaand UX-patroon

### BL-IMP-012 — Diagnose in editflow tonen
- Status: Done
- Prioriteit: P1
- Resultaat:
  - row-level diagnostics met reason code, artieststatus en matchaantallen zichtbaar
- Acceptatiecriteria:
  - editmodal toont diagnose van geselecteerde stagingrij
  - gebruiker ziet blocker/warning-context zonder SQL-handwerk
  - diagnose ververst na herstelactie

### BL-IMP-014 — Documentatie Sprint 2A editflow
- Status: Done
- Prioriteit: P2
- Resultaat:
  - functionele, technische en testdocumentatie aangevuld voor Sprint 2A
- Acceptatiecriteria:
  - docs beschrijven edit als primair herstelpunt
  - docs benoemen de schemafix-uitgangspunten

### BL-IMP-015 — Regressietests voor editfase
- Status: Done
- Prioriteit: P1
- Resultaat:
  - service- en reacttests toegevoegd voor diagnostics en repair
- Acceptatiecriteria:
  - kernscenario’s voor diagnose en repair zijn geautomatiseerd afgedekt
  - editmodal kan testsgewijs openen, repareren en verversen

---

## Sprint 2A-H — Hardening van de werkende editflow

### BL-IMP-016 — Sprint 2A documentatie hardenen
- Status: Done
- Prioriteit: P1
- Resultaat:
  - documentatie volledig verankerd op de echte DDL en de uiteindelijke Sprint 2A-implementatie
- Scope:
  - expliciet vastleggen dat rij-identificatie loopt via `hl_import_run_id + hl_positie`
  - expliciet vastleggen dat `staging_hitlijsten.hl_key` en `artiesten_spelling.as_spelling_key` niet bestaan
  - duidelijk onderscheid maken tussen artiestrelatieherstel en exporteerbaarheid
- Acceptatiecriteria:
  - `FUNCTIONAL_SPEC.md` en `TECHNICAL_SPEC.md` beschrijven de echte sleutelvelden
  - oude kolomaannames staan niet meer als ontwerpuitgangspunt in de docs
  - docs benoemen wat repair wel en niet oplost

### BL-IMP-017 — Regressietests diagnostics uitbreiden
- Status: Done
- Prioriteit: P1
- Resultaat:
  - diagnostics service uitgebreid met extra regressietests voor not-found, databasefouten en blijvende exportblockers
- Gewenste scenario’s:
  - stagingrij niet gevonden
  - runId bestaat niet
  - positie bestaat niet binnen run
  - stagingrij zonder artiestrelatie
  - stagingrij met herstelbare artiestrelatie
  - stagingrij met geldige artiestrelatie maar zonder gecombineerde `file_details` match
- Acceptatiecriteria:
  - nieuwe negatieve en positieve tests aanwezig
  - reason codes en classificatie worden expliciet gecontroleerd

### BL-IMP-018 — Regressietests repair uitbreiden
- Status: Done
- Prioriteit: P1
- Resultaat:
  - repair service uitgebreid met extra regressietests voor databasefouten en scenario's waarin repair slaagt maar export geblokkeerd blijft
- Gewenste scenario’s:
  - succesvolle repair
  - geen mapping mogelijk
  - `artiesten_spelling` verwijst naar ontbrekende `artist`
  - databasefout tijdens repair
  - repair herstelt relatie maar exportblocker blijft bestaan door ontbrekende combined match
- Acceptatiecriteria:
  - tests controleren response én databasestatus
  - foutpad en transactieverwachting zijn afgedekt

### BL-IMP-019 — Editflow logging standaardiseren
- Status: Done
- Prioriteit: P2
- Resultaat:
  - success-, warning- en errorpaden loggen nu consequenter met run- en row-context
- Acceptatiecriteria:
  - logs bevatten `module`, `feature`, `operation`, `runId`, `hlPositie`, `reasonCode` waar relevant
  - success-, warning- en errorpaden zijn consistent gelogd

### BL-IMP-020 — Sprint 2A cleanup
- Status: Done
- Prioriteit: P2
- Resultaat:
  - kleine code cleanup uitgevoerd en distributie opnieuw opgeschoond
- Scope:
  - naming opschonen
  - comments actualiseren
  - dode verwijzingen verwijderen
  - distributie opschonen (`.DS_Store`, `__MACOSX`)
- Acceptatiecriteria:
  - geen oude sleutelmodelverwijzingen meer in actieve code/docs
  - oplever-ZIP bevat geen macOS-artefacten

---

## Sprint 2B — Probleemfilters in de lijstweergave

### BL-IMP-021 — Probleemstatus zichtbaar maken in lijst
- Status: Open
- Prioriteit: P1
- Doel:
  - per rij direct scanbaar maken of sprake is van blocker, warning of OK
- Acceptatiecriteria:
  - status zichtbaar zonder editmodal te openen
  - statusclassificatie sluit aan op bestaande business rules

### BL-IMP-022 — Filter “alleen probleemrijen”
- Status: Open
- Prioriteit: P1
- Doel:
  - gebruiker kan snel focussen op rijen die aandacht vereisen
- Acceptatiecriteria:
  - filter werkt binnen huidige run
  - probleemrijen = blockers plus warnings
  - reset naar volledige lijst blijft mogelijk

### BL-IMP-023 — Filter op blocker en warning
- Status: Open
- Prioriteit: P1
- Doel:
  - gebruiker kan probleemtype verfijnen
- Acceptatiecriteria:
  - alleen blockers, alleen warnings en gecombineerde weergave zijn mogelijk
  - multiple matches blijven warnings en blokkeren niet op zichzelf

### BL-IMP-024 — Regressietests lijstfilters
- Status: Open
- Prioriteit: P1
- Doel:
  - filterlogica en statusmapping beschermen tegen regressies
- Acceptatiecriteria:
  - tests dekken probleemfilter, blockerfilter, warningfilter en reset

### BL-IMP-025 — Documentatie probleemfiltering
- Status: Open
- Prioriteit: P2
- Doel:
  - specs en testplan aanvullen voor Sprint 2B
- Acceptatiecriteria:
  - documentatie beschrijft statusmodel, filters en niet-in-scope onderdelen

---

## Later / buiten huidige levering

### Sprint 2 — Shellstarter integratie
- Status: Open
- Prioriteit: P2
- Opmerking:
  - nog niet uitgevoerd in deze levering

### Sprint 3 — Grote lijsten
- Status: Open
- Prioriteit: P3
- Onderwerpen:
  - verdere filtering en pagination voor grote runs
  - performance optimalisatie
  - verdere testdata-standaardisatie


## BL-IMP-021 — Probleemstatus zichtbaar maken in lijst
**Status:** Done

## BL-IMP-022 — Filter “alleen probleemrijen”
**Status:** Done

## BL-IMP-023 — Filter op blocker/warning
**Status:** Done

## BL-IMP-024 — Regressietests lijstfilters
**Status:** Done

## BL-IMP-025 — Documentatie probleemfiltering
**Status:** Done


## Sprint 2C — reason-code filters en probleemsamenvatting

### BL-IMP-026 — Reason-code filter in Edit-lijst
**Status:** Done

De Edit-lijst ondersteunt nu filtering op concrete problem reason codes, waaronder:
- `MISSING_FD_TAG_TITLE`
- `MISSING_HL_ARTIST_KEY`
- `NO_FILE_DETAILS_COMBINED_MATCH`
- `MULTIPLE_FILE_DETAILS_COMBINED_MATCHES`

### BL-IMP-027 — Probleemsamenvatting boven de lijst
**Status:** Done

Boven de Edit-tabel wordt nu een compacte samenvatting getoond met klikbare aantallen per reason code, zodat gebruikers sneller naar de relevante probleemgroep kunnen springen.

### BL-IMP-028 — Regressietests Sprint 2C
**Status:** Done

Extra React-tests dekken nu filtering via summary buttons en via de reason-code dropdown.


## BL-IMP-035 — Batch herstel artiest/titel swap voor huidige run
**Status:** Done

**Doel**
Verdachte swap-rijen in één batch kunnen herstellen voor de huidige run.

**Acceptatiecriteria**
- alleen huidige run wordt verwerkt
- alleen verdachte rijen worden aangepast
- hl_artiest en hl_titel_song worden omgewisseld
- afgeleide velden worden opnieuw opgebouwd
- gebruiker krijgt duidelijke samenvatting van scanned/repaired/skipped/failed

---

## Sprint 2C-H — Hotfix batchherstel voor swap-rijen

### BL-IMP-035 — Batch herstel artiest/titel swap voor huidige run
- Status: Done
- Prioriteit: P1
- Doel:
  - verdachte swap-rijen binnen de huidige run in batch kunnen herstellen
- Resultaat:
  - batchendpoint en batchactie toegevoegd
  - alleen huidige run wordt verwerkt
  - alleen rijen met voldoende swap-signalen worden automatisch hersteld
- Acceptatiecriteria:
  - `hl_artiest` en `hl_titel_song` worden alleen voor verdachte rijen omgewisseld
  - niet-verdachte rijen blijven ongewijzigd
  - gebruiker krijgt een samenvatting met `scanned`, `repaired`, `skipped`, `failed`

## Sprint 2D — UX, flow en exportguardrails

### BL-IMP-026 — Rijstatus visueel en eenduidig maken
- Status: Proposed
- Prioriteit: P1
- Doel:
  - blocked, warning en ready overal eenduidig tonen
- Acceptatiecriteria:
  - blockers tonen nooit een groen vinkje
  - warnings hebben een eigen visuele status
  - lijststatus volgt echte exporteerbaarheid

### BL-IMP-027 — Probleemdetails per rij tonen
- Status: Proposed
- Prioriteit: P1
- Doel:
  - meerdere reasons per rij direct vanuit de tabel zichtbaar maken
- Acceptatiecriteria:
  - gebruiker ziet niet slechts één foutreden
  - dubbele matches zijn per rij inzichtelijk
  - probleemdetail is vanuit de rij bereikbaar via status-icoon of vergelijkbare instap

### BL-IMP-028 — Editformulier rechten aanscherpen
- Status: Proposed
- Prioriteit: P1
- Doel:
  - alleen relevante velden handmatig wijzigbaar laten
- Acceptatiecriteria:
  - `Correcte Songtitel` read-only
  - `Correcte Artiest Spelling` read-only
  - `Discogs Link` editable

### BL-IMP-029 — Editscherm herontwerpen voor snellere diagnose
- Status: Proposed
- Prioriteit: P1
- Doel:
  - gebruiker in één oogopslag laten zien wat fout is en wat de vervolgstap is
- Acceptatiecriteria:
  - statusbanner aanwezig
  - probleemlijst met uitleg aanwezig
  - lookup-context vanuit relevante tabellen zichtbaar
  - actiepad duidelijk en oplossingsgericht

### BL-IMP-030 — Export idempotent maken per hitlijst en uitzendjaar
- Status: Done
- Prioriteit: P1
- Doel:
  - dubbele export naar `hitlijsten` blokkeren
- Acceptatiecriteria:
  - tweede exportpoging wordt geblokkeerd
  - gebruiker krijgt duidelijke alert
  - exportregistratie is navolgbaar

### BL-IMP-031 — Editflow vereenvoudigen naar run-context
- Status: Done
- Prioriteit: P1
- Doel:
  - Edit direct vanuit Home-runcontext laten werken
- Acceptatiecriteria:
  - geen losse hitlijst/jaar/runselectie meer in Edit
  - runcontext komt vanuit Home
  - gebruiker wisselt niet per ongeluk van run binnen Edit

### BL-IMP-032 — Home filteren op hitlijst en uitzendjaar
- Status: Done
- Prioriteit: P1
- Doel:
  - runs sneller vindbaar maken
- Acceptatiecriteria:
  - live filtering tijdens typen
  - hitlijst en jaar zijn combineerbaar
  - reset blijft mogelijk

### BL-IMP-033 — Batch verrijken van jaar = 0 vanuit file_details
- Status: Done
- Prioriteit: P1
- Doel:
  - ontbrekende jaren veilig aanvullen
- Acceptatiecriteria:
  - alleen rijen met jaar = 0 worden verwerkt
  - alleen eenduidige matches worden bijgewerkt
  - ambiguous matches worden overgeslagen
  - gebruiker krijgt een resultaatoverzicht

### BL-IMP-034 — Regressietests UX, flow en exportguardrails
- Status: Done
- Prioriteit: P1
- Doel:
  - nieuwe UX-, flow- en exportregels beschermen tegen regressies
- Acceptatiecriteria:
  - statuslogica, read-only gedrag, exportguard, Home-filters en batch-jaarverrijking zijn getest

## Sprint 2E — Forced repair en handmatige correctie

### BL-IMP-036 — Geforceerde batch swap voor zichtbare/gefilterde rijen
- Status: Proposed
- Prioriteit: P1
- Doel:
  - resterende swap-rijen gecontroleerd kunnen herstellen wanneer heuristiek niet alle gevallen vangt
- Acceptatiecriteria:
  - actie werkt alleen op zichtbare/gefilterde rijen binnen huidige run
  - duidelijke bevestiging met aantallen vooraf
  - gebruiker krijgt achteraf een samenvatting met updated/skipped/failed

### BL-IMP-037 — Handmatige herstelmodus voor staging-bronvelden
- Status: Proposed
- Prioriteit: P1
- Doel:
  - gebruiker bronvelden in staging gericht laten corrigeren
- Acceptatiecriteria:
  - standaard blijven afgeleide velden read-only
  - in herstelmodus zijn `hl_artiest`, `hl_titel_song` en optioneel `hl_jaar` bewerkbaar
  - mutatie gebeurt op staging-bronvelden, niet rechtstreeks op afgeleide velden

### BL-IMP-038 — Herberekenen afgeleide velden na handmatige correctie
- Status: Proposed
- Prioriteit: P1
- Doel:
  - na broncorrectie alle afgeleide velden en diagnose opnieuw opbouwen
- Acceptatiecriteria:
  - `fd_tag_title`, `as_correcte_artiest_spelling`, `hl_artist_key` en status worden opnieuw afgeleid
  - gebruiker ziet direct ververste diagnose en exportstatus

### BL-IMP-039 — Tekstnormalisatie en encoding-herstel bij import en edit
- Status: Proposed
- Prioriteit: P1
- Doel:
  - mojibake, rare whitespace en andere tekstvervuiling verminderen
- Acceptatiecriteria:
  - import normaliseert whitespace, NBSP en veelvoorkomende encoding-artefacten
  - handmatige correctie kan rare tekst alsnog overschrijven
  - normalisatie is veilig en veroorzaakt geen stille massamutaties

### BL-IMP-040 — Regressietests voor forced repair, handmatige correctie en normalisatie
- Status: Proposed
- Prioriteit: P1
- Doel:
  - forced swap, handmatige correctie en tekstnormalisatie beschermen tegen regressies
- Acceptatiecriteria:
  - forced swap test alleen zichtbare/gefilterde rijen
  - handmatige correctie en herberekening zijn afgedekt
  - encoding-normalisatie heeft voorbeelden in de testset


## Sprint 2E-B — Tekstnormalisatie en importherstel

### Done
- BL-IMP-041 — Centrale helper voor tekstnormalisatie
- BL-IMP-042 — Preview van tekstnormalisatie voor zichtbare rijen
- BL-IMP-043 — Batch tekstnormalisatie voor zichtbare/gefilterde rijen
- BL-IMP-044 — Herberekenen na tekstnormalisatie
- BL-IMP-045 — UI-actie voor normalisatie in Edit-flow
- BL-IMP-046 — Regressietests tekstnormalisatie en herberekening


## BL-IMP-047 — Import decoding robuuster maken — Done
- UTF-8 blijft default
- latin1 fallback wordt gebruikt wanneer de decode-kwaliteit beter is

## BL-IMP-048 — Detectie van damaged text in staging — Done
- detectie toegevoegd voor replacement chars en recoverable mojibake

## BL-IMP-049 — Reason codes voor encoding damage toevoegen — Done
- `RECOVERABLE_ENCODING_DAMAGE`
- `REPLACEMENT_CHAR_DAMAGE`

## BL-IMP-050 — Preview van encoding repair voor recoverable tekst — Done
- preview endpoint en UI-knop toegevoegd voor zichtbare rijen

## BL-IMP-051 — Batchrepair voor recoverable encoding-problemen — Done
- repair endpoint en UI-knop toegevoegd voor zichtbare rijen

## BL-IMP-052 — Damaged text zichtbaar maken in editflow — Done
- editdiagnose toont encoding-schade en vervolgstap

## BL-IMP-053 — Regressietests voor import decoding en encoding repair — Done
- decode helper, detectie, preview en repair afgedekt


## Hotfix — async exportstatus en performance

### BL-IMP-054 — Async laden van exportstatus bij runselectie
- Status: Done
- Prioriteit: P1
- Resultaat:
  - Edit opent nu direct na runselectie
  - exportstatus laadt op de achtergrond met aparte loading/error-state
  - exportactie blijft disabled zolang de status nog laadt
- Acceptatiecriteria:
  - geen blank screen meer tijdens zware exportstatus-check
  - gebruiker kan rijen al bekijken en bewerken terwijl exportstatus nog laadt

### BL-IMP-055 — Exportstatus-query optimaliseren en indexadvies toevoegen
- Status: Done
- Prioriteit: P1
- Resultaat:
  - per-rij `LATERAL COUNT(*)` validatie vervangen door set-based aggregatie
  - SQL-indexscript toegevoegd in `scripts/sql/20260413_export_status_performance_indexes.sql`
- Acceptatiecriteria:
  - exportstatus-check gebruikt geen per-stagingrij herhaalde `LATERAL` counts meer
  - aanbevolen indexen voor `file_details` en `staging_hitlijsten` zijn opgeleverd

## API cache / 304 hotfix

Edit-related JSON API calls now disable HTTP caching and ETag-style 304 reuse for these routes:
- `/api/staging-by-run`
- `/api/run-filedetails-status`
- `/api/run-export-hitlijsten-status`

The client fetch layer also requests `cache: "no-store"` and parses JSON defensively, preventing blank-screen behavior when the browser would otherwise reuse stale cached responses.


## Sprint 2D-A update
- Added a row presentation model for clearer severity, icon and reason label rendering.
- Edit rows now show compact human-readable reason badges instead of only raw reason codes.
- The diagnostics modal now separates status, issue explanation, source fields and derived values more clearly.
- Derived values are explicitly labeled as automatic/read-only in the Edit UI.

---

## Sprint 2F/2G — Metadata, Discogs en clipboard UX

### BL-IMP-056 — Omroepenbeheer en omroepkoppeling inclusief seeddata
- Status: Done
- Prioriteit: P2
- Sprint: 2F-A
- Doel:
  - vastleggen welke omroep/zender een hitlijst heeft uitgezonden
  - omroepen beheren via een hulptabel in plaats van vrije tekst
- Scope:
  - nieuwe hulptabel `omroepen`
  - foreign key `omroep_key` op `staging_hitlijsten`
  - foreign key `omroep_key` op `hitlijsten`
  - dropdown/selectie in import/edit-flow
  - exportmapping van staging naar hitlijsten
  - initiële seeddata voor veelgebruikte omroepen/zenders
- Initiële seeddata:
  - `Onbekend / nog te bepalen`
  - `NPO Radio 2`
  - `NPO 3FM`
  - `Radio Veronica`
  - `Radio 10`
  - `Radio 538`
  - `Qmusic Nederland`
  - `Sky Radio`
  - `KRO-NCRV`
  - `AVROTROS`
  - `VRT Radio 2`
  - `Studio Brussel`
  - `Radio 1 België`
  - `BBC Radio 1`
  - `BBC Radio 2`
- Acceptatiecriteria:
  - gebruiker kan een omroep/zender kiezen voor een importrun of stagingrij
  - gekozen omroep wordt opgeslagen in `staging_hitlijsten`
  - export neemt `omroep_key` over naar `hitlijsten`
  - bestaande data kan tijdelijk aan `Onbekend / nog te bepalen` worden gekoppeld
  - omroepen zijn later onderhoudbaar via beheerfunctionaliteit
- Testimpact:
  - migratietest voor tabel en FK's
  - exporttest voor mapping staging → hitlijsten
  - UI-test voor dropdown en opslag
- Documentatie-impact:
  - functionele specificatie uitbreiden
  - technische specificatie/DDL-migratie toevoegen

### BL-IMP-057 — Muziekperiode/decenniumcategorie inclusief seeddata
- Status: Done
- Prioriteit: P2
- Sprint: 2F-A
- Doel:
  - vastleggen op welk muziekdecennium of welke bredere periodecategorie een hitlijst betrekking heeft
  - all-time greatest niet als nepdecennium modelleren, maar als expliciete categorie
- Scope:
  - nieuwe hulptabel `hitlijst_perioden`
  - foreign key `periode_key` op `staging_hitlijsten`
  - foreign key `periode_key` op `hitlijsten`
  - dropdown/selectie in import/edit-flow
  - exportmapping van staging naar hitlijsten
  - initiële seeddata voor decennia en brede categorieën
- Initiële seeddata:
  - `ONBEKEND` — Onbekend / nog te bepalen
  - `50S` — Jaren 50
  - `60S` — Jaren 60
  - `70S` — Jaren 70
  - `80S` — Jaren 80
  - `90S` — Jaren 90
  - `00S` — Jaren 00
  - `10S` — Jaren 10
  - `20S` — Jaren 20
  - `ALLTIME` — All-time greatest
  - `JAARLIJST` — Jaarlijst
  - `THEMA` — Themalijst
  - `GENRE` — Genrelijst
  - `OVERIG` — Overig
- Acceptatiecriteria:
  - gebruiker kan precies één periodecategorie kiezen
  - decennia staan in logische volgorde in de UI
  - all-time greatest is apart beschikbaar als `ALLTIME`
  - gekozen periode wordt opgeslagen in `staging_hitlijsten`
  - export neemt `periode_key` over naar `hitlijsten`
  - bestaande data kan tijdelijk aan `ONBEKEND` worden gekoppeld
- Testimpact:
  - migratietest voor tabel, seeddata en FK's
  - exporttest voor mapping staging → hitlijsten
  - UI-test voor dropdown en opslag
- Documentatie-impact:
  - functionele specificatie uitbreiden
  - technische specificatie/DDL-migratie toevoegen

### BL-IMP-058 — Discogs master/release zoek- en selectieflow
- Status: Proposed
- Prioriteit: P2
- Sprint: 2G-B
- Doel:
  - vanuit een stagingrij zoeken in Discogs en een juiste master of release koppelen
- Scope:
  - Discogs zoekknop per rij
  - standaardzoekquery op correcte artiest + correcte titel
  - resultatenmodal met meerdere hits
  - filters op type/formaat, bijvoorbeeld Master, Release, Album, Single, Maxi-Single, EP en Extended
  - handmatige keuze door gebruiker
  - opslag van gekozen key en URL in staging
  - exportmapping naar `hitlijsten`
- Acceptatiecriteria:
  - gebruiker kan Discogs-resultaten ophalen vanuit een stagingrij
  - meerdere resultaten worden overzichtelijk getoond
  - gebruiker kan filteren en één resultaat kiezen
  - de app slaat zowel Discogs key als URL op waar beschikbaar
  - geen automatische selectie zonder bevestiging
  - export neemt gekozen Discogs-velden mee naar `hitlijsten`
- Testimpact:
  - server/API tests met gemockte Discogs-resultaten
  - UI-test voor zoekmodal, filtering en selectie
  - exporttest voor Discogs mapping
- Documentatie-impact:
  - API-integratieontwerp toevoegen
  - functionele zoek-/selectieflow documenteren

### BL-IMP-059 — Discogs API technisch onderzoek, caching en rate limiting
- Status: Done
- Prioriteit: P2
- Sprint: 2G-A
- Doel:
  - bepalen hoe Discogs betrouwbaar, snel en veilig geïntegreerd wordt voordat de implementatie start
- Scope:
  - endpoint-keuze onderzoeken
  - auth/token en rate limits vastleggen
  - server-side proxy ontwerpen zodat tokens niet in de browser staan
  - cachingstrategie ontwerpen
  - foutafhandeling ontwerpen
  - definitieve veldmapping vastleggen
- Acceptatiecriteria:
  - technisch ontwerp is vastgelegd
  - benodigde `.env` variabelen zijn bekend
  - rate-limit gedrag is beschreven
  - cachebeleid is beschreven
  - keuze tussen master/release-opslag is onderbouwd
- Testimpact:
  - mockstrategie voor Discogs API vastleggen
  - contracttests voorbereiden
- Documentatie-impact:
  - technische specificatie uitbreiden

### BL-IMP-060 — Copy correcte artiest/titel naar klembord
- Status: Done
- Prioriteit: P3
- Sprint: 2F-B
- Doel:
  - snel de combinatie `<artiest> - <titel>` kunnen kopiëren vanuit de Edit-pagina
- Scope:
  - correcte artiestkolom krijgt tooltip bij hover
  - klikactie kopieert `<correcte artiest> - <correcte titel>` naar klembord
  - toastmelding na succesvolle copy
  - focus naar het rijgebonden `Discogs Link`-veld na succesvolle copy
  - fallback naar bronvelden als correcte/afgeleide waarden ontbreken
- Acceptatiecriteria:
  - hover toont welke tekst gekopieerd kan worden
  - klik kopieert de tekst naar het klembord
  - gebruiker krijgt feedback na kopiëren
  - focus staat na succesvolle copy op het veld `Discogs Link` in dezelfde rij
  - browserfouten worden netjes afgehandeld
  - clipboard wordt niet onbedoeld gewijzigd door alleen hover
- Testimpact:
  - React-test voor tooltip/copy flow toegevoegd: `tests/react/EditClipboardCopy.test.jsx`
  - focus-test op rijgebonden Discogs-linkveld toegevoegd
  - fallbacktest bij ontbrekende correcte waarden toegevoegd
- Documentatie-impact:
  - korte UX-notitie toevoegen

### BL-IMP-061 — Database-uitbreiding Discogs keys en URL's op staging en hitlijsten
- Status: Proposed
- Prioriteit: P2
- Sprint: 2G-B
- Doel:
  - zowel Discogs identifiers als Discogs URL's opslaan voor flexibiliteit en gebruikerscontrole
- Scope:
  - toevoegen van gestructureerde Discogs-velden op `staging_hitlijsten`
  - toevoegen van dezelfde Discogs-velden op `hitlijsten`
  - bestaande `hl_discogs_link` voorlopig als legacy/handmatige link behouden
  - exportmapping van alle Discogs-velden
- Voorgestelde velden:
  - `discogs_master_id`
  - `discogs_master_url`
  - `discogs_master_title`
  - `discogs_master_artist`
  - `discogs_master_year`
  - `discogs_release_id`
  - `discogs_release_url`
  - `discogs_release_title`
  - `discogs_release_format`
  - `discogs_release_country`
  - `discogs_release_year`
  - `discogs_selected_at`
  - `discogs_selected_by`
- Acceptatiecriteria:
  - staging en definitieve tabel hebben dezelfde Discogs-velden
  - key en URL kunnen onafhankelijk maar consistent worden opgeslagen
  - export neemt de waarden 1-op-1 mee
  - bestaande `hl_discogs_link` blijft bruikbaar en wordt niet zonder bevestiging overschreven
- Testimpact:
  - migratietest voor nieuwe kolommen
  - exporttest voor alle Discogs-velden
  - backward compatibility test voor bestaande `hl_discogs_link`
- Documentatie-impact:
  - DDL-ontwerp toevoegen
  - functionele specificatie uitbreiden


---

## Sprint 2D-A-V — Validatie UX & Diagnose

### BL-IMP-062 — Sprint 2D-A-V validatie en baselinebesluit
- Status: Done
- Prioriteit: P1
- Sprint: 2D-A-V
- Doel:
  - bevestigen dat Sprint 2D-A UX/diagnose stabiel werkt bovenop de herstelde Edit-baseline
  - bepalen of deze versie de nieuwe functionele baseline mag worden
- Scope:
  - automatische validatieset voor UX diagnostics, filters, lazy rendering, exportstatus en bestaande repairflows
  - handmatige validatiechecklist voor lokale test
  - baselinebesluit documenteren
- Acceptatiecriteria:
  - `npm run test:validation:2d-a` slaagt lokaal
  - Edit opent stabiel vanuit Home en via `?runId=...`
  - reason badges, diagnosemodal en read-only velden werken zoals bedoeld
  - swap repair, forced/manual repair, normalisatie en encoding repair hebben geen regressie
  - exportstatus aside blokkeert de Edit-rendering niet
  - bij akkoord wordt `baseline_sprint2d_a_ux_diagnostics_validated_2026-04-25` vastgelegd
- Testimpact:
  - nieuwe npm-script `test:validation:2d-a`
  - nieuw shellscript `scripts/validate_sprint2d_a.sh`
  - handmatige checklist in `docs/sprint-2d/SPRINT_2D_A_VALIDATION.md`
- Documentatie-impact:
  - `TEST_PLAN.md` uitgebreid
  - `BASELINE.md` aangevuld met kandidaat-baseline

---

## Sprint 2F-A — Metadatafundament hitlijsten

### Realisatie 2026-04-25
- `BL-IMP-056` en `BL-IMP-057` zijn gerealiseerd.
- Nieuwe SQL-migratie/seed: `scripts/sql/20260425_sprint2f_metadata_foundation.sql`.
- Nieuwe metadata API/model: `models/metadata.js`.
- Importflow ondersteunt omroep/periode-selectie.
- Exportmapping naar `hitlijsten` is uitgebreid met `omroep_key` en `periode_key`.
- Nieuwe tests en script: `npm run test:sprint2f-a`.

### Vervolg
- `BL-IMP-060` blijft kandidaat voor Sprint 2F-B.
- `BL-IMP-061` blijft kandidaat voor Sprint 2G-B na Discogs-onderzoek.

---

## Sprint 2F-B — Clipboard copy gevalideerd

### Realisatie 2026-04-25
- `BL-IMP-060` is gerealiseerd en lokaal door de gebruiker getest.
- Na kopiëren van `<artiest> - <titel>` verplaatst de focus naar het rijgebonden veld `Discogs Link`.
- Tests zijn geslaagd via `npm run test:sprint2f-b`.

## Sprint 2D-B — Flow en exportguardrails

### BL-IMP-030 — Export guardrail: hitlijst/uitzendjaar maar één keer exporteren
- Status: Done
- Prioriteit: P1
- Sprint: 2D-B
- Doel:
  - voorkomen dat dezelfde `hl_hitlijst` + `hl_uitzendjaar` combinatie meerdere keren naar `hitlijsten` wordt geëxporteerd.
- Scope:
  - exportstatus detecteert bestaande definitieve records voor het doel van de run
  - exportknop wordt geblokkeerd als er al records bestaan
  - backend blokkeert ook bij directe API-aanroep
  - foutmelding toont hitlijst, uitzendjaar en aantal bestaande records
- Acceptatiecriteria:
  - eerste export van een nieuwe combinatie is mogelijk
  - tweede export van dezelfde combinatie wordt geblokkeerd
  - blokkade werkt server-side en client-side
  - bestaande linkvalidatie blijft intact
- Testimpact:
  - `tests/models/exportHitlijsten.test.js` bevat regressietest voor dubbele exportblokkade

### BL-IMP-031 — Editflow vereenvoudigen naar run-context
- Status: Done
- Prioriteit: P1
- Sprint: 2D-B
- Doel:
  - Edit-pagina focust op corrigeren van één gekozen run.
- Scope:
  - als Edit met `?runId=` wordt geopend, worden runselectievelden niet meer prominent getoond
  - fallback-selectie blijft beschikbaar als Edit zonder runId wordt geopend
  - gebruiker krijgt melding dat runselectie primair via Home gebeurt
- Acceptatiecriteria:
  - Home → Edit opent direct in run-context
  - Edit toont geen onnodige runselectie tijdens normale flow
  - directe toegang zonder runId blijft bruikbaar

### BL-IMP-032 — Home filteren op hitlijst en uitzendjaar
- Status: Done
- Prioriteit: P1
- Sprint: 2D-B
- Doel:
  - import-runs sneller kunnen vinden op Home.
- Scope:
  - aparte filters voor hitlijst en uitzendjaar
  - bestaande quick filter blijft beschikbaar
- Acceptatiecriteria:
  - gebruiker kan runs filteren op hitlijst
  - gebruiker kan runs filteren op uitzendjaar
  - gefilterde teller wordt bijgewerkt
- Testimpact:
  - nieuwe React-test: `tests/react/StagingResultsFilters.test.jsx`

### BL-IMP-034 — Regressietests UX, flow en exportguardrails
- Status: Done
- Prioriteit: P1
- Sprint: 2D-B
- Doel:
  - Sprint 2D-B regressie-afdekking toevoegen zonder bestaande 2D-A/2F-tests te vervangen.
- Scope:
  - exportscenario's
  - Home-filters
  - bestaande exportstatus-aside
- Testscript:
  - `npm run test:sprint2d-b`


## Sprint 2D-C implementatie-notitie

### BL-IMP-033 — Batch verrijken van jaar = 0 vanuit file_details
- Status: Done
- Implementatie:
  - service `services/editYearEnrichmentService.js`;
  - endpoints `/api/edit/run/:runId/preview-enrich-years` en `/api/edit/run/:runId/enrich-years`;
  - Edit-aside actie `Preview jaarverrijking`;
  - tests `tests/services_editYearEnrichmentService.test.js` en `tests/react/EditYearEnrichment.test.jsx`.
- Functionele regel:
  - alleen verrijken bij exact één file_details-match op `fd_tag_title + hl_artist_key`;
  - ambiguous/no match/no usable year worden overgeslagen en gerapporteerd.

---

## Sprint 2F-C implementatie-notitie

### BL-IMP-063 — Runmetadata beheren en synchroniseren naar geëxporteerde hitlijsten
- Status: Done
- Prioriteit: P1
- Sprint: 2F-C
- Doel:
  - bestaande import-runs achteraf kunnen corrigeren met omroep en periode/deccennium;
  - bij reeds geëxporteerde runs dezelfde metadata synchroniseren naar `hitlijsten`.
- Scope:
  - Runs-scherm toont kolommen `Omroep`, `Periode` en `Exported`;
  - Runs-scherm filtert op omroep en periode;
  - metadata-modal per run;
  - nieuw endpoint `POST /api/import-runs/:runId/metadata`;
  - transactie werkt staging en, indien van toepassing, `hitlijsten` bij;
  - Edit-scherm zonder `runId` toont alleen instructie met link naar Runs;
  - runselector en runmetadata-beheer zijn uit Edit verwijderd.
- Testimpact:
  - `tests/models/runMetadataSync.test.js`;
  - `tests/react/StagingResultsMetadata.test.jsx`;
  - uitgebreid script `npm run test:sprint2f-c`.

---

## Sprint 2F-C-HF1 hotfix-notitie

### BL-IMP-064 — Metadata-modal sluiten na succesvol opslaan
- Status: Done
- Prioriteit: P2
- Sprint: 2F-C-HF1
- Aanleiding:
  - functionele validatie van Sprint 2F-C leverde één UX-bevinding op: na succesvol opslaan van runmetadata bleef de modal open.
- Oplossing:
  - na succesvolle response van `POST /api/import-runs/:runId/metadata` sluit de metadata-modal automatisch;
  - succesmelding blijft zichtbaar buiten de modal boven het Runs-overzicht;
  - bij fouten blijft de modal open en blijft de foutmelding zichtbaar.
- Acceptatiecriteria:
  - metadata-modal blijft open tijdens opslaan;
  - metadata-modal sluit na succesvolle opslag;
  - Runs-tabel toont bijgewerkte omroep/periode;
  - sync naar `hitlijsten` blijft werken voor reeds geëxporteerde runs;
  - regressietest controleert dat de modal sluit na succesvolle opslag.
- Testimpact:
  - `tests/react/StagingResultsMetadata.test.jsx` uitgebreid;
  - nieuw script `npm run test:sprint2f-c-hf1`.


---

## Sprint 2G-A implementatie-notitie

### BL-IMP-059 — Discogs API technisch onderzoek, caching en rate limiting
- Status: Done
- Sprint: 2G-A
- Oplevering:
  - technisch ontwerp: `docs/sprint-2g/SPRINT_2G_A_DISCOGS_TECHNICAL_RESEARCH.md`;
  - geen runtime-code of DDL-wijziging in deze sprint;
  - vormt input voor `BL-IMP-061` en `BL-IMP-058`.
- Kernbesluiten:
  - Discogs-token blijft server-side;
  - de browser praat alleen met Importhitlijst API-endpoints;
  - zoekresultaten worden tijdelijk gecached, gekozen koppelingen worden structureel opgeslagen;
  - Discogs-verrijking blijft optioneel en mag export niet blokkeren.

---

## Sprint 2G-B1 implementatie-notitie

### BL-IMP-061 — Database-uitbreiding Discogs keys en URL's op staging en hitlijsten
- Status: Done
- Sprint: 2G-B1
- Prioriteit: P1
- Oplevering:
  - docker-proof migratie `scripts/apply_sprint2g_discogs_backend_foundation.sh`;
  - SQL `scripts/sql/20260425_sprint2g_discogs_backend_foundation.sql`;
  - Discogs master/release velden op `staging_hitlijsten` en `hitlijsten`;
  - exportmapping van `staging_hitlijsten.discogs_*` naar `hitlijsten.discogs_*`.

### BL-IMP-058 — Discogs master/release zoek- en selectieflow
- Status: In Progress
- Sprint: 2G-B1 / 2G-B2
- Realisatie in 2G-B1:
  - server-side search endpoint `GET /api/discogs/search`;
  - mockbare Discogs client `services/discogsClient.js`;
  - endpoint voor opslag van gekozen koppeling `POST /api/edit/staging/:runId/:hlPositie/discogs`;
  - service `services/discogsSelectionService.js`.
- Resterend voor 2G-B2:
  - Edit UI-knop `Zoek Discogs`;
  - resultatenmodal;
  - UI-filters;
  - selectie vanuit de modal.

## BL-IMP-065 — Correctie migratiescript Sprint 2G-B1

Status: gerealiseerd in Sprint 2G-B2.

Bevinding: `db:migrate:sprint2g-b1`/wrapper logde nog `apply_sprint2f_metadata_foundation` en verwees naar `scripts/sql/20260425_sprint2f_metadata_foundation.sql`.

Oplossing: wrapper `scripts/apply_sprint2g_discogs_backend_foundation.sh` verwijst nu naar `scripts/sql/20260425_sprint2g_discogs_backend_foundation.sql` en gebruikt correcte logprefix/remote SQL-bestandsnaam.

## BL-IMP-066 — Discogs UI-selectieflow

Status: gerealiseerd in Sprint 2G-B2.

Scope:
- `Zoek Discogs` knop in Edit-rij.
- Discogs zoekmodal met filters voor type, format, jaar en land.
- Resultatentabel met titel, artiest, jaar, type, format, land en URL.
- Selectie opslaan via bestaand 2G-B1 backend endpoint.
- `Discogs Link` lokaal bijwerken en rij refreshen na succesvolle selectie.
- React-test toegevoegd voor payload mapping, zoeken, filtergebruik en selectie-opslag.


## BL-IMP-067 — Sprint 2G-B2 testfix selector robustness

Status: Done in `importhitlijst_sprint2g_b2_discogs_ui_selection_flow_testfix1_20260426.zip`.

Aanleiding:
- Discogs UI test gebruikte te brede `getByText("Nirvana")` selector.
- Discogs filtertest gebruikte te brede `getByLabelText(/Type/i)` selector.

Oplossing:
- Resultaatasserties gescoped naar de Discogs-resultatentabel en resultaatrij.
- Filterveldasserties gescoped naar de Discogs-modal/dialog.
- Labelselectors aangescherpt naar exacte labels.

## BL-IMP-067 — Sprint 2G-B2 testfix 2: Discogs modal toegankelijkheid en testscoping

Status: opgeleverd in `importhitlijst_sprint2g_b2_discogs_ui_selection_flow_testfix2_20260426.zip`.

Aanleiding: de 2G-B2 test gebruikte nog te brede table-selectie en verwachtte een named dialog terwijl de Discogs-modal geen expliciete `aria-labelledby` had.

Oplossing:
- Discogs-modal voorzien van toegankelijke naam via `aria-labelledby`.
- React-test scoped naar de Discogs-dialog met `within(dialog)`.
- Modal-sluitcontrole aangepast naar `queryByRole`.

## BL-IMP-067 — Export blocked rows met Discogs URL naar tekstbestand

Status: gerealiseerd in Sprint 2G-B3.

Als gebruiker wil ik alle regels met status `blocked` én een ingevulde Discogs-link kunnen exporteren naar een tekstbestand, zodat ik deze regels buiten de applicatie snel kan gebruiken voor correctie of opvolging.

Acceptatiecriteria:

- Alleen rijen uit de actieve import-run worden meegenomen.
- Alleen rijen met blocked/exportblokkerende status worden meegenomen.
- Alleen rijen met een ingevulde Discogs URL worden meegenomen.
- De export is een `.txt` download.
- Elke regel heeft exact dit functionele formaat: `<correcte artiest> - <correcte titel> <Discogs URL>`.
- Correcte artiest gebruikt de bestaande correcte/canonieke artiestwaarde met fallback naar `hl_artiest`.
- Correcte titel gebruikt de bestaande correcte/canonieke titelwaarde met fallback naar `hl_titel_song`.
- De Discogs URL gebruikt de volgorde: `discogs_master_url`, `discogs_release_url`, `hl_discogs_link`.
- De bestandsnaam bevat hitlijst, uitzendjaar en timestamp.
- De knop is disabled als er niets te exporteren is.
- Tests dekken service, endpoint en UI.

## BL-IMP-068 — Sprint 2G-B3 test/build stabilisatie

Status: opgeleverd in `sprint2g_b3_test_build_fix1`.

Aanleiding:
- `npm run install:all` ontbrak nog in Importhitlijst.
- `npm run build` gaf een CSS syntax warning door een losse `*/` in `src/ui/styles/navbar.css`.
- `playwright test` pakte Vitest-bestanden mee en faalde met `Cannot redefine property: Symbol($$jest-matchers-object)`.

Oplossing:
- Voeg `scripts/install-all.sh` en package script `install:all` toe.
- Corrigeer de CSS comment syntax in `src/ui/styles/navbar.css`.
- Voeg `playwright.config.js` toe en beperk Playwright tot `tests/e2e/**/*.spec.js`.
- Laat alle voorbeeldcommando's loggen naar `logs/`.


## BL-IMP-075 — Duplicate import prevention op fysieke filename

Status: gerealiseerd in Sprint 2G-D.

Als gebruiker wil ik voorkomen dat fysieke songs dubbel worden geïmporteerd. Duplicate-detectie gebeurt op de genormaliseerde fysieke bestandsnaam (`fd_file_name`) en niet op artiest + titel, omdat meerdere versies van één song toegestaan zijn. Wanneer duplicates zijn gevonden kan ik met één knop alle duplicate stagingregels op `fd_action = 'Skip'` zetten.

Acceptatiecriteria:
- Duplicate-detectie gebruikt `fd_file_name` / fysieke bestandsnaam, niet artiest + titel.
- Duplicates tegenover bestaande `file_details.fd_file_name` worden gedetecteerd.
- Duplicates binnen dezelfde import-run worden gedetecteerd.
- De eerste rij binnen dezelfde run blijft staan; volgende gelijke filenames worden duplicate.
- Bulkactie `Zet duplicates op Skip` zet alleen duplicate stagingregels op `fd_action = 'Skip'`.
- `Skip`-regels worden niet geëxporteerd naar `hitlijsten`.
- Actieve file_details matching negeert `fd_action` `Delete`, `Duplicates` en `Skip`.


## BL-IMP-071 — Install/build/test standaardisatie afronden

Status: opgeleverd in Sprint 2G-E, wacht op validatie.

Toegevoegd:
- `npm run build:all`
- `npm run validate`
- `npm run validate:all`
- `scripts/build-all.sh`
- `scripts/validate-all.sh`
- timestamped logoutput in `logs/`

## BL-IMP-073 — E2E-testdekking uitbreiden

Status: opgeleverd in Sprint 2G-E, wacht op validatie.

Toegevoegd als e2e-smoketests:
- health endpoint
- db-health endpoint met gestructureerde response
- Discogs search-validatie zonder artist/title

## BL-IMP-074 — Release-baseline en documentatie opschonen

Status: opgeleverd in Sprint 2G-E, wacht op validatie.

Bijgewerkt:
- `Readme.md`
- `TEST_PLAN.md`
- `BASELINE.md`
- Sprintdocumentatie voor 2G-E

## BL-IMP-077 — Duplicate feedback/polish

Status: behouden vanuit 2G-D; geen businesslogica gewijzigd in 2G-E.

De bestaande feedback blijft:
- teller duplicate rows
- uitsplitsing bestaand in `file_details` versus dubbel binnen run
- bulkactie `Zet duplicates op Skip`

## BL-IMP-078 — 2G-E hotfix duplicate schema guard

Status: opgeleverd in Sprint 2G-E Hotfix 1.

Na 2G-E kon het Edit-scherm crashen als de database de 2G-D migratie nog niet had, omdat `duplicateImportService` direct `staging_hitlijsten.fd_file_name` gebruikte. De service vangt ontbrekende 2G-D kolommen nu defensief af en retourneert een lege duplicate-summary met warning-log. De 2G-D migratie blijft nodig voor daadwerkelijke duplicate-detectie.

## Sprint 2G-E Hotfix 2 — Docker migratie zonder verplichte DATABASE_URL

### BL-IMP-078 — 2G-D migratiescript Docker-proof zonder verplichte DATABASE_URL

Status: gerealiseerd.

Het script `scripts/apply_sprint2g_d_duplicate_import_prevention.sh` vereiste ten onrechte altijd `DATABASE_URL`. In Docker mode is dit aangepast: als `DATABASE_URL` ontbreekt, gebruikt het script `psql -U postgres -d musicdb` binnen de PostgreSQL-container.

## BL-IMP-079 — UI-flow opschonen: Edit alleen via Runs of succesvolle import

Status: gerealiseerd in Sprint 2G-F.

Als eindgebruiker wil ik alleen naar de Edit-flow gaan wanneer er een concrete import-run bekend is, zodat de applicatieflow logisch blijft en ik niet op een lege Edit-pagina terechtkom.

Functionele regels:
- De losse menu-keuze `Edit` verdwijnt uit het linker Holy Grail-frame.
- Bestaande runs worden bewerkt via het Runs-overzicht.
- Het Import-scherm toont vóór import geen generieke knop `Go to edit mode` meer.
- Na een succesvolle import toont het Import-scherm een contextuele knop `Bewerk deze import-run`.
- Deze knop navigeert naar `/edit?runId=<nieuw-aangemaakte-run-id>`.
- De aside-tekst `Use Edit to run tools on a runId.` is verwijderd.
- Edit zonder `runId` blijft technisch veilig en toont een nette melding, maar wordt niet meer actief in de navigatie aangeboden.

Acceptatiecriteria:
- Linker navigatie bevat `Runs`, `Import` en `String patterns`, maar geen losse `Edit`-entry.
- Import-scherm zonder `runId` bevat geen link naar `/edit`.
- Import-scherm met `runId` bevat een link `Bewerk deze import-run` naar `/edit?runId=<runId>`.
- De oude aside-helpertekst komt nergens meer voor.
- React-test `tests/react/ImportFlowCleanup.test.jsx` dekt de flowwijziging.

## BL-IMP-080 — Edit-lijst filteren tijdens verwerking

Status: gerealiseerd in Sprint 2H-A.

Als gebruiker wil ik tijdens het verwerken van een import-run de Edit-lijst kunnen filteren, zodat ik gericht kan werken aan rijen die aandacht nodig hebben zonder steeds door de hele lijst te scrollen.

Functionele regels:
- De bestaande probleemfilters blijven beschikbaar: alleen probleemrijen, blocker/warning en reason code.
- Er is aanvullend een verwerkingsstatusfilter voor:
  - alle rijen;
  - aandacht nodig;
  - duplicates;
  - skip;
  - rijen met Discogs-link.
- Er is een actiefilter voor `Keep`, `Skip` en `Delete`.
- Er is een vrije lijstfilter op onder andere positie, artiest, titel en jaar.
- Snelfilterknoppen voor duplicate- en skip-rijen zijn zichtbaar wanneer deze categorieën voorkomen.
- De bestaande batchtools blijven werken op de gefilterde/zichtbare rijen via `visibleRowPositions`.
- De statusregel toont aantallen voor blockers, warnings, ok, duplicates en skip.

Acceptatiecriteria:
- De gebruiker kan de Edit-lijst filteren op tekst, verwerkingsstatus en actie.
- Filter `Duplicates` toont alleen duplicate bestandsnaamrijen.
- Filter `Skip` toont alleen rijen met `fd_action = 'Skip'`.
- Filter `Met Discogs-link` toont alleen rijen met een Discogs URL.
- `Reset filters` zet alle probleem- en verwerkingsfilters terug.
- React-test `tests/react/EditProblemFilters.test.jsx` dekt probleemfilters én verwerkingsfilters.

## BL-IMP-080-FIX1 — Lijstfilter beperken tot gebruikersvelden

Het vrije lijstfilter in Edit zoekt alleen nog op positie, artiest/correcte artiest, titel/correcte titel en jaar. Fysieke filename, Discogs-link, find-cmd en artist-key worden niet meer meegenomen omdat deze voor de eindgebruiker tijdens verwerking niet nodig zijn.

## BL-IMP-081 — Song spelling en AltSpelling hardening

Status: opgeleverd in Sprint 2H-B.

Als gebruiker wil ik dat een titelcorrectie via AltSpelling betrouwbaar wordt vastgelegd in `song_spelling`, zodat dezelfde titelcorrectie later opnieuw toegepast kan worden op vergelijkbare importregels.

Acceptatiecriteria:

- AltSpelling maakt `song_spelling` aan als er nog geen mapping bestaat.
- AltSpelling werkt `song_spelling` bij als de mapping al bestaat.
- De mapping gebruikt de oorspronkelijke importwaarden `hl_titel_song + hl_artiest`.
- De gekozen titel wordt opgeslagen als `fd_tag_title`.
- De stagingregel wordt direct bijgewerkt.
- `hl_find_cmd` wordt leeggemaakt.
- De gebruiker ziet duidelijke feedback na de titelcorrectie.
- Tests dekken model- en UI-gedrag.

## BL-IMP-082 — Handmatig herstel sturen vanuit file_details

Status: backlog / nog uit te werken na 2H-B.

Bij handmatig herstellen moeten artiest en titel bij voorkeur gekozen worden uit bestaande `file_details`-gegevens. Vrije invoer of overwrite moet een expliciete gebruikersactie zijn, omdat handmatig herstel anders inconsistenties kan introduceren.

## BL-IMP-082 — Handmatig herstel sturen vanuit file_details

Status: gerealiseerd in Sprint 2H-C.

Als gebruiker wil ik handmatig herstel uitvoeren door te kiezen uit bestaande `file_details` records, zodat artiest en titel niet opnieuw vrij/inconsistent worden ingevoerd. Vrije overwrite blijft alleen mogelijk als bewuste uitzondering.

Acceptatiecriteria:
- Handmatig herstel zoekt in actieve `file_details` records.
- Kandidaten tonen artiest, titel, jaar, songtype en bestandsnaam.
- Kiezen van een kandidaat vult staging met correcte artiest/titel uit `file_details`.
- Vrije overwrite vereist expliciete bevestiging.
- Backend weigert vrije overwrite zonder bevestiging.
- Tests dekken zoeken, toepassen en vrije overwrite-beveiliging.

## BL-IMP-089 — Runs-overzicht verder verbeteren

Status: gerealiseerd in Sprint 2H-D.

Als gebruiker wil ik het Runs-overzicht gebruiken als werkvoorraadscherm, zodat ik snel zie welke import-runs klaar zijn, aandacht vragen of al geëxporteerd zijn.

Functionele regels:
- Per run worden verwerkingsaantallen getoond: totaal, OK, Blocked, Duplicate, Skip, Discogs en Exported.
- Per run wordt een samenvattende status getoond: `Klaar voor export`, `Aandacht nodig`, `Geëxporteerd` of `Geen data`.
- `Skip` telt niet automatisch als foutstatus; het is een bewuste overslaan-status.
- `Blocked` en open `Duplicate` maken een run aandacht nodig.
- Er zijn filters voor exportstatus en verwerking.
- Er zijn snelfilters voor aandacht nodig, klaar voor export, niet geëxporteerd, duplicates en blocked.
- `Open Edit` blijft de primaire bewerkingsactie.
- `Blocked Discogs export` is beschikbaar wanneer een run blocked rows met Discogs URL bevat.

Acceptatiecriteria:
- Runs-overzicht toont per run statuscounts.
- Runs-overzicht toont een duidelijke statusbadge.
- Gebruiker kan filteren op exportstatus.
- Gebruiker kan filteren op verwerking/statuscategorie.
- Tests dekken statusafleiding, filters en UI-weergave.

## BL-IMP-091 — Manual repair file_details zoeken met gescheiden artiest- en titelvelden

Status: gerealiseerd in Sprint 2H-E.

De handmatige herstel-flow zoekt niet meer via één gecombineerd zoekveld in `file_details`, maar via gescheiden velden voor `Artiest` en `Titel`. Dit maakt zoeken gerichter en intuïtiever voor de gebruiker.

Acceptatiecriteria:
- Er is een apart zoekveld voor artiest.
- Er is een apart zoekveld voor titel.
- Beide velden ondersteunen gedeeltelijke matching.
- Minimaal één van beide velden is vereist.
- De UI stuurt `artist` en `title` queryparameters naar de backend.
- De oude `query` parameter blijft backend-compatible, maar wordt niet meer gebruikt door de UI.
- Tests dekken service en UI-zoekgedrag.

## BL-IMP-092 — Onderhoud omroepen

Status: herclassificeren naar Coretables-kandidaat.

Omroepen zijn geïntroduceerd als metadata/referentietabel voor Importhitlijst, maar het daadwerkelijke onderhoud van omroepen hoort waarschijnlijk beter thuis in Coretables als gedeelde referentietabel-CRUD.

Importhitlijst blijft consument van omroepen:
- selecteren in runmetadata;
- tonen/filteren in Runs;
- meenemen naar staging en hitlijsten.

Coretables-kandidaat:
- omroep toevoegen/wijzigen/deactiveren;
- duplicate validatie op naam/code;
- veilig omgaan met gekoppelde records;
- inactieve omroepen niet standaard aanbieden bij nieuwe keuzes.

## BL-IMP-093 — Import-run veilig kunnen verwijderen

Status: gerealiseerd in Sprint 2H-D.

Als gebruiker wil ik een import-run kunnen verwijderen wanneer een import fout is gegaan, zodat de werkvoorraad schoon blijft en ik opnieuw kan importeren.

Functionele regels:
- Verwijderen gebeurt vanuit het Runs-overzicht.
- Verwijderen vraagt altijd bevestiging.
- Alleen niet-geëxporteerde runs kunnen worden verwijderd.
- Bij verwijderen worden stagingregels en het `import_runs` record transactioneel verwijderd.
- Geëxporteerde runs worden geblokkeerd met een duidelijke foutmelding.
- Na verwijderen verdwijnt de run uit het Runs-overzicht.

Acceptatiecriteria:
- `DELETE /api/import-runs/:runId` verwijdert een niet-geëxporteerde run.
- Geëxporteerde runs geven HTTP 409 en blijven bestaan.
- UI toont confirmatie met hitlijst, jaar, aantal regels en runId.
- Tests dekken succesvolle delete, blokkade bij exported run en UI-confirmatie.

## BL-IMP-094 — Manual repair candidate polish en actieve file_details helper

Status: opgeleverd in Sprint 2H-F.

Doel: verbeter de candidate-lijst in handmatig herstel door matchtype, betere sortering en versiecontext te tonen. Leg daarnaast een centrale helper vast voor actieve `file_details` kandidaten, waarbij `Delete`, `Duplicates` en `Skip` standaard uitgesloten worden.

## Sprint 2H-G — Runs en Edit UX polish

### BL-IMP-095 — Runs-overzicht acties vervangen door iconen met tooltips
Status: opgeleverd in Sprint 2H-G.

Acties in het Runs-overzicht gebruiken nu icon buttons:
- View staging: `<i class="bi bi-view-list"></i>`
- Open Edit: `<i class="bi bi-pencil"></i>`
- Metadata: `<i class="bi bi-list"></i>`
- Verwijder: `<i class="bi bi-trash2"></i>`

### BL-IMP-098 — Edit-scherm toont titel van de lijst/run
Status: opgeleverd in Sprint 2H-G.

Het Edit-scherm toont de actieve lijst en het jaar bovenaan, inclusief runcontext waar beschikbaar.

### BL-IMP-099 — Paginering onder liedjestabel in Edit-scherm
Status: opgeleverd in Sprint 2H-G.

De liedjestabel in Edit heeft paginering met page sizes 25, 50, 100 en 250.

## BL-IMP-100 — View staging kolomheaders gebruiksvriendelijk maken

Status: opgeleverd in Sprint 2H-G Fix 1.

In **View staging** worden technische databasekolomnamen vervangen door gebruikersvriendelijke Nederlandse labels.

Mapping:
- `hl_positie` → Positie
- `hl_artiest` → Artiest uit lijst
- `hl_titel_song` → Titel uit lijst
- `hl_jaar` → Jaar
- `fd_tag_title` → Correcte titel
- `as_correcte_artiest_spelling` → Correcte spelling artiest
- `hl_discogs_link` → Discogs link
- `hl_find_cmd` → Vind commando
- `hl_artist_key` → Sleutel artiest
- `omroep_key` → Omroep sleutel
- `periode_key` → Periode sleutel

Acceptatiecriteria:
- View staging toont de gebruiksvriendelijke labels.
- De onderliggende data blijft ongewijzigd.
- Tests controleren dat de nieuwe headers zichtbaar zijn en een aantal technische headers niet meer als kolomheader verschijnt.

## BL-IMP-101 — Correctie artiest/titel na export naar hitlijsten

Status: gerealiseerd in Sprint 2H-I.

Functionele kern:
- Alleen correcte artiest en correcte titel zijn wijzigbaar.
- Oorspronkelijke lijstwaarden blijven historisch intact.
- Correcte artiest moet bestaan in `artist`.
- Correcte titel/song moet bestaan in `file_details` bij de gekozen `artist_key`.
- Correctie start in `staging_hitlijsten` en propageert naar `hitlijsten`.
- Match naar `hitlijsten` gebruikt `hl_hitlijst + hl_uitzendjaar + hl_positie + omroep_key + periode_key`.
- `hl_samenstel_fd_key` blijft ongewijzigd.
- Wijzigingen worden auditbaar vastgelegd.

## BL-IMP-101-FIX1 — Correctie na export ook bereikbaar voor Save-only rijen

Status: opgeleverd in Sprint 2H-I Fix 1.

Bevinding: de correctie na export was functioneel te afhankelijk van de bestaande Edit-knop. Rijen die alleen Save tonen, konden daardoor niet gecorrigeerd worden.

Oplossing:
- aparte knop **Correctie** in de actiekolom;
- opent de bestaande editmodal;
- activeert direct de sectie **Correctie na export**;
- beschikbaar voor rijen zonder blocking-signaal.

## BL-IMP-102 — Terugkoppeling propagatie post-export correctie

Status: gerealiseerd in Sprint 2H-I Fix 2.

Na het toepassen van een post-export correctie moet de gebruiker expliciet zien dat de wijziging is toegepast op `staging_hitlijsten` en hoeveel records in `hitlijsten` zijn bijgewerkt. Het resultaat toont ook audit-id, oude/nieuwe correcte artiest en titel, en waarschuwingen zoals een ongewijzigde samengestelde koppeling.

## Sprint 2H-H — Discogs zoekmodal UX en enrichment-onderzoek

### BL-IMP-096 — Discogs zoekmodal UX verbeteren
Status: akkoord / gesloten in Sprint 2H-H.

Functionele kern:
- modalheader toont positie, artiest, titel en run/lijstcontext waar beschikbaar;
- Discogs zoeken start zonder geforceerd Master-filter;
- Type-, Format-, Jaar- en Landfilters worden dynamisch opgebouwd uit de ontvangen resultaten;
- filters werken client-side en hebben een Reset-knop;
- Master, Release en Overig zijn visueel herkenbaar met badges;
- Label is uit de hoofdresultatentabel verwijderd om de modal compacter te maken;
- bestaande koppelfunctie naar de stagingregel blijft werken.

### BL-IMP-097 — Onderzoek Discogs ID koppelen aan song/file_details-flow
Status: akkoord / gesloten als onderzoeksitem in Sprint 2H-H. Vervolgimplementatie blijft apart onder review/promote-flow.

Besluiten:
- master-data en release/version-data hebben verschillende functionele betekenis;
- `file_details` wordt in deze sprint niet automatisch bijgewerkt;
- latere verrijking moet via een review/promote-flow lopen met expliciete veldkeuze en audit;
- releasegegevens kunnen later relevant zijn voor versievelden zoals `fd_year_song_version`, `fd_duration` en `fd_discogs`;
- mastergegevens kunnen later relevant zijn voor oorspronkelijke songcontext, maar niet zonder review.

### BL-IMP-103 — Discogs enrichment review/promote-flow naar file_details ontwerpen
Status: nieuw vervolgitem.

Ontwerp een veilige reviewfunctie die huidige `file_details`-waarden naast Discogs-voorstellen toont en alleen na expliciete keuze velden bijwerkt.

### BL-IMP-104 — Discogs release detailinspectie met tracklist en duur
Status: nieuw vervolgitem.

Breid de Discogs modal later uit met detailinspectie van master/release, inclusief tracklist, formats, label/catalogusnummer en duurinformatie.

### BL-IMP-105 — Discogs master/release ids structureel auditen
Status: nieuw vervolgitem.

Onderzoek of geselecteerde Discogs entries inclusief bronresultaat, geselecteerd-door, geselecteerd-op en historische wijzigingen in een aparte audit/history tabel moeten worden vastgelegd.

## Afgerond in Sprint 2H-J

### BL-IMP-106 — Preview jaarverrijking functioneel verbeteren

De bestaande knop **Preview jaarverrijking** is aangescherpt voor lijsten zonder jaartallen. Ontbrekende `hl_jaar`-waarden worden aangevuld vanuit geverifieerde `file_details.fd_year_song_publish` op basis van correcte artiest + correcte titel. Alleen publish years groter dan 0 tellen mee. Meerdere kandidaten zijn toegestaan en worden zichtbaar gemaakt in preview/logging. Apply werkt uitsluitend `staging_hitlijsten.hl_jaar` bij; `hitlijsten` blijft ongewijzigd omdat songinformatie daar via `fd_key` wordt afgeleid.

### BL-IMP-107 — Discogs-resultatentabel: Koppel-knop naar rechterkant

De actieknop **Koppel** staat nu rechts in de Discogs-resultatentabel.

## BL-IMP-106 Fix 1 — Preview jaarverrijking staging-only

Status: opgeleverd in Sprint 2H-J Fix 1.

Correctie op Sprint 2H-J:
- geen aparte knop `Vul jaar uit file_details`;
- bestaande knop `Preview jaarverrijking` verbeteren en na `SongSpelling` tonen;
- apply werkt alleen `staging_hitlijsten.hl_jaar` bij;
- `hitlijsten` blijft ongewijzigd, omdat die tabel geen `hl_jaar` bevat en via `fd_key` naar songinformatie verwijst.

## Afgerond — BL-IMP-108 — Sluitbare jaarverrijking preview/alert

Status: opgeleverd in Sprint 2H-J Fix 2.

Na **Preview jaarverrijking** is het preview-/resultaatpaneel sluitbaar. De sluitknop is alleen zichtbaar wanneer het `role="alert"` paneel zichtbaar is. Een nieuwe preview toont het paneel opnieuw.

## Afgerond — BL-IMP-085 — Discogs detailinspectie / release-details bekijken

Status: akkoord / gesloten in Sprint 2H-K.

De Discogs zoekmodal ondersteunt nu detailinspectie per master/release. Details bekijken toont type, artiest, titel, jaar, land, formats, compact catalogusnummer, Discogs-link en tracklist/duur. Label(s) worden bewust niet getoond omdat labeldata vaak te groot en onoverzichtelijk is. Details bekijken wijzigt geen data; koppelen blijft een expliciete actie via **Koppel** of **Koppel deze entry**.

## BL-IMP-108 — Discogs UX stroomlijnen met andere apps

Status: akkoord / gesloten in Sprint 2H-L.

- Coretables / File Details is gekozen als primaire UX/API-referentie.
- Importhitlijst toont nu editable Discogs zoekvelden voor Artiest en Titel, default gevuld met correcte artiest en correcte titel.
- De gebruiker start zoeken expliciet via **Zoek in Discogs**.
- Zoekveldwijzigingen wijzigen geen stagingdata.
- De standaard is vastgelegd in `docs/standards/MUSICAPP_DISCOGS_UX_API_STANDARD.md`.

## Afgerond — Sprint 2H-L Fix 1

### BL-IMP-109 — Export Find-cmd script robuuster maken

Status: akkoord / gesloten in Sprint 2H-L Fix 1.

Het gegenereerde find-cmd script bevat geen `set -euo pipefail` meer, zodat alle `find`-commando's tot het einde kunnen doorlopen. Het doelpad wordt veilig gequote gegenereerd als `export TARGET="..."`.

### BL-IMP-110 — Discogs bekeken-markering uniek per resultaat corrigeren

Status: akkoord / gesloten in Sprint 2H-L Fix 1.

De **Bekeken**-markering in de Discogs zoekmodal gebruikt nu een stabiele unieke sleutel `<type>:<id>`. Hierdoor markeert Details openen voor één release/master niet meer meerdere of alle resultaten.

## Nieuw / open na 2H-L testbevindingen

### BL-IMP-111 — Pattern discovery helper voor String Patterns

Ontwerp een functie die terugkerende patronen in songtitels helpt herkennen, vooral tekst tussen haakjes zoals `(Live)`, `(Radio Edit)` of `(Remastered)`. Het systeem mag niets automatisch verwijderen; de gebruiker moet gevonden patronen kunnen beoordelen, selecteren en gericht toevoegen aan de bestaande String Patterns tabel.

### BL-IMP-112 — Button workflow zichtbaar maken / prerequisites afdwingen

Maak duidelijker dat veel buttons in het Edit-scherm onderdeel zijn van een functionele workflow. Onderzoek/ontwerp of de workflow visueel gemaakt moet worden en/of buttons disabled moeten zijn totdat prerequisites aanwezig zijn, met duidelijke tooltip of melding waarom een actie nog niet beschikbaar is.

## Nieuw / open — Exportstatus-aware workflow

### BL-IMP-113 — Gewenste songversie per hitlijstregel vastleggen

Per hitlijstregel moet later kunnen worden vastgelegd welk soort versie de gebruiker zoekt of bedoelt, bijvoorbeeld `Single`, `Album`, `Extended`, `Live`, `Radio Edit`, `12" Mix` of `Remix`. De Discogs-link alleen is onvoldoende om de gewenste versie functioneel vast te leggen.

### BL-IMP-114 — Pre-export acties blokkeren na export naar hitlijsten

Status: opgepakt voor Sprint 2H-M.

Als een run/lijst al is geëxporteerd naar `hitlijsten`, moeten pre-export workflowacties die alleen `staging_hitlijsten` muteren disabled of server-side geblokkeerd worden. Deze acties voeren namelijk geen correctie door naar `hitlijsten` en kunnen na export tot schijncorrecties leiden.

Concrete aanleiding: **Forceer titel/artiest swap (zichtbare rijen)** is na export gebruikt. Deze actie wijzigt staging, maar corrigeert niet automatisch `hitlijsten`.

Functionele richting:

- detecteer betrouwbaar of een run geëxporteerd is;
- toon bij geëxporteerde runs een statusbanner;
- disable pre-export knoppen boven **Export -> Hitlijsten**;
- toon uitleg: `Niet beschikbaar na export. Gebruik Correctie na export.`;
- houd **Correctie na export** beschikbaar als veilig correctiepad;
- blokkeer staging-only mutaties na export waar mogelijk ook server-side.

Relatie met `BL-IMP-112`: dit item is een concrete exportstatus-aware invulling van workflow/prerequisite-afdwinging.

## BL-IMP-114 — Pre-export acties blokkeren na export naar hitlijsten — geïmplementeerd in 2H-M

Na export naar `hitlijsten` worden staging-only pre-export workflowacties disabled in het Edit-scherm. Backend guardrails blokkeren dezelfde muterende acties via API met `PRE_EXPORT_ACTION_BLOCKED_AFTER_EXPORT`. Correcties na export moeten via `Correctie na export` lopen.


## BL-IMP-114 — Pre-export acties blokkeren na export naar hitlijsten — Fix 1

Testbevinding: bij een geëxporteerde lijst bleven alle buttons actief. Fix 1 corrigeert exportstatus-normalisatie in de frontend en breidt backend guards uit naar directe staging-mutatie endpoints.

## BL-IMP-112 — Button workflow zichtbaar maken / prerequisites afdwingen — codebouw voorbereiding

Status: voorbereid voor codebouw in Sprint 2H-N.

Besluit:
- Introduceer een centrale frontend-policy helper: `src/ui/utils/editWorkflowPolicy.js`.
- Groepeer de Edit-toolbar in workflowstappen: Bekijken, Normaliseren, Correcte artiest/titel, Verrijken/controleren, Exporteren, Na export corrigeren.
- Definieer per action key of de knop read-only, pre-export, export of post-export is.
- Disabled knoppen tonen altijd een reden.
- 2H-M exportstatus-blokkering blijft leidend voor geëxporteerde runs.


## BL-IMP-112 — Button workflow zichtbaar maken / prerequisites afdwingen — gerealiseerd in 2H-N

Sprint 2H-N groepeert de Edit-toolbar in workflowstappen en centraliseert de button-policy in `src/ui/utils/editWorkflowPolicy.js`. Buttons worden disabled met duidelijke redenen wanneer prerequisites ontbreken, bijvoorbeeld geen run, busy-status, na export, ontbrekende ArtistSpelling, geen zichtbare rijen of geen duplicates.


## BL-IMP-111 — Pattern discovery helper voor String Patterns

Status: geïmplementeerd in Sprint 2H-O. De helper herkent kandidaatpatterns in titels, groepeert slimme varianten zoals remaster/remastered met jaartal en laat de gebruiker concrete varianten selectief toevoegen aan `public.string_del_patterns.st_string_delete`. Er worden geen titels automatisch gewijzigd.

## BL-IMP-116 — String Patterns uitbreiden met generieke/wildcard patternregels

Nieuw vervolgitem. Onderzoek echte generieke regels zoals `<YEAR>` of regexachtige patterns. Dit vraagt waarschijnlijk database-uitbreiding met pattern type en blijft buiten 2H-O.


## BL-IMP-111 / 2H-O Fix 1 — Pattern suggesties click-handler

Status: opgelost in Sprint 2H-O Fix 1. De knop **Pattern suggesties** gebruikt nu `ctrl.openPatternSuggestions()` in plaats van een niet-zichtbare losse variabele. Regressietest toegevoegd.

## BL-IMP-113 — Gewenste songversie per hitlijstregel vastleggen — Sprint 2H-P

Status: opgeleverd in Sprint 2H-P.

Per stagingregel kan een gewenste/logische songversie worden vastgelegd via een dropdown uit `public.song_types`. De gebruiker ziet de omschrijving van het songtype; technisch wordt `staging_hitlijsten.hl_desired_song_type_key` opgeslagen met foreign key naar `song_types(st_song_type_key)`. Discogs-functionaliteit blijft ongewijzigd; de gebruiker bepaalt na Discogs-inspectie zelf welke songtype-waarde hoort bij de gekoppelde entry.

## BL-IMP-113 Fix — Gewenste versie behouden na Discogs-flow

Status: opgeleverd in Sprint 2H-P Fix 1.

Bevinding: gekozen gewenste versie kon verdwijnen na Discogs-flow doordat de dropdownwaarde pas via algemene Save werd opgeslagen en row refreshes oude backenddata terugzetten.

Oplossing: wijziging in de versie-dropdown wordt direct per rij opgeslagen via `saveDesiredSongTypeForRow`, met optimistische update van de lokale rows-state.

---

## Sprint 2H-Q — Blocked Discogs export per gewenste versie

### BL-IMP-117 — Export blocked Discogs links groeperen per gewenste versie
- Status: Done
- Prioriteit: P1
- Resultaat:
  - blocked Discogs export groepeert exportregels per gewenste versie/song type;
  - groepsnaam wordt bepaald via `staging_hitlijsten.hl_desired_song_type_key` en `song_types`;
  - regels zonder gewenste versie komen onder **Geen versie gekozen**;
  - per exportitem staat `Artiest - Titel` op één regel en de Discogs-link op de volgende regel;
  - bestaande exporteerbaarheidscriteria blijven ongewijzigd.
- Acceptatiecriteria:
  - versieheader verschijnt één keer per groep;
  - fallbackgroep werkt voor lege/null versie;
  - export blijft read-only;
  - regressietests voor grouped export zijn aanwezig.
