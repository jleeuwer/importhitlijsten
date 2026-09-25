# Backlog update — Sprint 2H-Y

## Actuele sprint

**Sprint 2H-Y — Matching, Discogs lifecycle & status hardening**

## Items in scope

| ID | Titel | Type |
|---|---|---|
| BL-IMP-124 | Ambigue `file_details`-kandidaten blokkeren | Matching/export hardening |
| BL-IMP-133 | Discogs-link lifecycle expliciet maken | Dataflow/provenance |
| BL-IMP-127 | Variant-aware matching/deduplicate ontwerp | Matching/data quality |
| BL-IMP-128 | Encoding repair mag geen manual free overwrite triggeren zonder expliciete bevestiging | Data quality/error handling |
| BL-IMP-129 | Exportstatus correct bij succesvolle export met niet-blokkerende warnings | Status quality |
| BL-IMP-130 | Encoding warning herberekenen/verwijderen na handmatige correctie | Warning quality |
| BL-IMP-131 | Repair bestaande geëxporteerde runs met foutieve aandacht-nodig status | Repair/data quality |

## Samenhang

- BL-IMP-124 voorkomt verkeerde export bij meerdere kandidaten.
- BL-IMP-127 levert de onderliggende variant-aware denkrichting voor betere matching.
- BL-IMP-133 borgt dat Discogs-links niet verdwijnen of verkeerd naar `file_details` worden gepromoveerd.
- BL-IMP-128 t/m 131 hardenen de warning/status/repairstromen.

## Niet in scope

- BL-IMP-119 en BL-IMP-134 worden bewust niet meegenomen in deze sprint. Die vormen samen een latere CSV import registry & duplicate list detection sprint.
- BL-IMP-125 cleanup wordt pas verantwoord na BL-IMP-127 en betere diagnostics.
