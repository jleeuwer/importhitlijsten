# Functionele testcases — Sprint 2H-Y

Deze testcases vormen de basis voor latere geautomatiseerde tests.

## BL-IMP-124 — Ambigue kandidaten blokkeren

| TC | Scenario | Verwacht resultaat |
|---|---|---|
| 124-01 | Eén stagingregel levert precies één veilige `file_details`-kandidaat op | Regel wordt auto-matched en exporteerbaar |
| 124-02 | Eén stagingregel levert meerdere kandidaten op | Regel krijgt status ambiguous/review nodig |
| 124-03 | Export wordt gestart terwijl ambiguous regels bestaan | Export wordt geblokkeerd met duidelijke melding |
| 124-04 | Gebruiker kiest expliciet één kandidaat | Regel wordt manual matched en exporteerbaar |
| 124-05 | Gebruikerskeuze wordt opgeslagen | Audit/provenance bevat gekozen kandidaat, tijdstip en actiebron |

## BL-IMP-133 — Discogs-link lifecycle

| TC | Scenario | Verwacht resultaat |
|---|---|---|
| 133-01 | Stagingregel heeft `discogs_release_url` | Export schrijft link naar `hitlijsten.discogs_release_url` |
| 133-02 | Stagingregel heeft alleen `discogs_master_url` | Export schrijft link naar `hitlijsten.discogs_master_url` |
| 133-03 | Stagingregel heeft veilige raw `hl_discogs_link` naar release | Link wordt gemapt naar release-url of expliciet als raw fallback verwerkt volgens ontwerp |
| 133-04 | Stagingregel heeft onveilige raw link | Link wordt niet stilzwijgend geëxporteerd; waarschuwing/blocking gedrag volgens configuratie |
| 133-05 | Export met Discogs-link wordt uitgevoerd | `file_details.fd_discogs` wordt niet automatisch bijgewerkt |
| 133-06 | Diagnostic wordt uitgevoerd | Rapport toont staginglinks en corresponderende hitlijstenlinks |

## BL-IMP-127 — Variant-aware matching/deduplicate

| TC | Scenario | Verwacht resultaat |
|---|---|---|
| 127-01 | Zelfde artiest/titel maar verschillende mixnamen | Diagnose markeert als mogelijke varianten, niet automatisch als duplicate cleanup |
| 127-02 | Zelfde artiest/titel/songtype met verschillende Discogs releases | Diagnose toont variant/releaseverschil |
| 127-03 | Meerdere plausibele varianten voor één hitlijstregel | BL-IMP-124 ambiguity-flow wordt geactiveerd |
| 127-04 | Exact identieke records zonder variantverschil | Diagnose mag true duplicate kandidaat tonen, maar niet automatisch verwijderen |

## BL-IMP-128 — Encoding repair overwrite guard

| TC | Scenario | Verwacht resultaat |
|---|---|---|
| 128-01 | Encoding preview heeft damaged rows maar 0 repairable rows | Geen save/overwrite; gebruiker krijgt normale melding |
| 128-02 | Normalisatie probeert manual free overwrite zonder bevestiging | Actie wordt geblokkeerd zonder technische stacktrace in UI |
| 128-03 | Gebruiker bevestigt expliciet overwrite | Overwrite mag doorgaan volgens bestaande guardregels |

## BL-IMP-129 — Exportstatus met warnings

| TC | Scenario | Verwacht resultaat |
|---|---|---|
| 129-01 | Export zonder warnings slaagt | Status wordt exported/voltooid |
| 129-02 | Export met niet-blokkerende warnings slaagt | Status wordt exported with warnings/functioneel voltooid |
| 129-03 | Export met blocking error | Export wordt geblokkeerd en status blijft actie vereist |
| 129-04 | UI toont run met non-blocking warnings | Run staat niet als actieve blokkade/aandacht nodig |

## BL-IMP-130 — Warning refresh na correctie

| TC | Scenario | Verwacht resultaat |
|---|---|---|
| 130-01 | Gebruiker corrigeert tekst met encoding warning | Warning wordt opnieuw berekend |
| 130-02 | Correctie lost warning op | Warning verdwijnt uit actieve lijst |
| 130-03 | Correctie lost warning niet op | Warning blijft zichtbaar |

## BL-IMP-131 — Repair bestaande statussen

| TC | Scenario | Verwacht resultaat |
|---|---|---|
| 131-01 | Preview repair wordt uitgevoerd | Alleen kandidaat-runs worden getoond, zonder wijzigingen |
| 131-02 | Apply repair op geëxporteerde run met non-blocking warnings | Status wordt hersteld naar exported with warnings/functioneel voltooid |
| 131-03 | Apply repair op run met blocking errors | Run wordt niet onterecht hersteld |
| 131-04 | Repair wordt twee keer uitgevoerd | Tweede uitvoering is idempotent en wijzigt niets extra |
| 131-05 | Repair wordt uitgevoerd | Audit/provenance wordt vastgelegd |

## Geautomatiseerde testscripts codebouw

| Script | Doel |
|---|---|
| `tests/services_2h_y_matchingDiscogsStatusHardening.test.js` | Pure business-rule tests voor ambiguous matching, Discogs lifecycle, variant signature en statusclassificatie |
| `tests/static_2h_y_matching_discogs_status_hardening.test.js` | Statische integratiechecks op exportguard, gewenste songtype-filter, Discogs fallback en API-errorgedrag |

Uitvoering:

```bash
npm run test:sprint2h-y
```

## Aanvullende technische acceptatiechecks

| TC | Scenario | Verwacht resultaat |
|---|---|---|
| 124-AUTO-01 | `combinedMatchCount > 1` | Reason code `MULTIPLE_FILE_DETAILS_COMBINED_MATCHES`, blocking |
| 124-AUTO-02 | `combinedMatchCount = 1` | Geen blocking reason |
| 127-AUTO-01 | `hl_desired_song_type_key` gevuld | Exportmatching bevat songtype-vernauwing |
| 133-AUTO-01 | Alleen veilige raw master-link in `hl_discogs_link` | Export kan master-url als gestructureerde metadata meenemen |
| 133-AUTO-02 | Alleen veilige raw release-link in `hl_discogs_link` | Export kan release-url als gestructureerde metadata meenemen |
| 128-AUTO-01 | Encoding/text batchrepair | Interne expliciete overwrite-confirmatie aanwezig |
| 128-AUTO-02 | API-conflict | JSON-foutmelding, geen stacktrace als responsebody |
