# Sprint 2H-Y — Matching, Discogs lifecycle & status hardening

## Doel

Deze sprint maakt het ontwerp klaar voor een veiligere import/exportketen. De nadruk ligt op het voorkomen van verkeerde koppelingen, het expliciet maken van Discogs-link lifecycle en het betrouwbaar afhandelen van warnings/statussen.

## In scope

1. Ambigue `file_details`-kandidaten blokkeren.
2. Discogs-link lifecycle van staging naar `hitlijsten` en eventueel later naar `file_details` expliciet maken.
3. Variant-aware matching/deduplicate ontwerp uitwerken.
4. Encoding/status repair hardening uitwerken.
5. Functionele testcases opleveren als basis voor geautomatiseerde tests.

## Uitgangspunten

- Geen automatische data-cleanup.
- Geen stilzwijgende overwrite van lokale waarden.
- Geen automatische promotie van hitlijstmetadata naar `file_details`.
- Blocking errors en non-blocking warnings krijgen verschillende statusbetekenis.
- Elke repair/promotion/keuze moet auditeerbaar zijn.

## Definition of Ready voor codebouw

De codebouw kan starten zodra:

- de actuele project-ZIP beschikbaar is;
- de relevante tabellen/kolommen in de lokale database bevestigd zijn;
- bestaande statuswaarden en validation-resultaten geïnventariseerd zijn;
- duidelijk is welke UI-component de candidate review moet tonen;
- de teststrategie voor backend, frontend en migraties bevestigd is.
