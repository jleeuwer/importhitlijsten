# BL-IMP-124 — Ambigue `file_details`-kandidaten blokkeren

## Status

Open — opgenomen in Sprint 2H-Y design.

## Probleem

Bij het matchen van stagingregels naar `file_details` kan één hitlijstregel meerdere mogelijke `file_details`-kandidaten opleveren. Als het systeem desondanks automatisch exporteert of samenstelt, kan een hitlijstregel aan de verkeerde songvariant worden gekoppeld.

## Functionele wens

Wanneer een stagingregel meerdere plausibele `file_details`-kandidaten heeft, mag deze regel niet als veilig automatisch gematcht worden behandeld. De gebruiker moet expliciet kiezen welke kandidaat correct is, of de export/samenstelling moet blokkeren voor die regel.

## Scope

- Detecteer meerdere kandidaten voor dezelfde hitlijstregel.
- Zet status op review/ambiguous in plaats van auto-matched.
- Blokkeer export of samenstelling zolang ambigue regels bestaan.
- Toon duidelijke reden en kandidaten aan de gebruiker.
- Laat gebruiker expliciet één kandidaat kiezen.
- Leg keuze vast met audit/provenance.

## Buiten scope

- Automatische cleanup van bestaande dubbele `file_details` records.
- Variant-aware redesign zelf; dat valt onder BL-IMP-127.

## Acceptatiecriteria

1. Een hitlijstregel met precies één veilige kandidaat mag exporteerbaar blijven.
2. Een hitlijstregel met meerdere kandidaten krijgt status `AMBIGUOUS` of functioneel equivalent.
3. Export/samenstelling wordt geblokkeerd zolang blocking ambiguity bestaat.
4. De UI toont welke regels geblokkeerd zijn en waarom.
5. Na expliciete gebruikerskeuze wordt de gekozen kandidaat gebruikt.
6. De keuze wordt auditeerbaar vastgelegd.
