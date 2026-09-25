# Sprint 2H-N — Button workflow en prerequisites zichtbaar maken

## Doel

Sprint 2H-N maakt de Edit-toolbar functioneel begrijpelijker. De knoppen zijn gegroepeerd in workflowstappen en de beschikbaarheid van acties wordt centraal bepaald via één frontend-policy helper.

Dit bouwt voort op 2H-M Fix 1: na export blijven pre-export/staging-only acties geblokkeerd, maar 2H-N maakt ook vóór export duidelijk welke stappen logisch eerst komen en welke prerequisites ontbreken.

## Scope

- BL-IMP-112 — Button workflow zichtbaar maken / prerequisites afdwingen.
- Centrale frontend helper `src/ui/utils/editWorkflowPolicy.js`.
- Workflowoverzicht boven de toolbar.
- Toolbar-secties voor bekijken, normaliseren, correcte artiest/titel, verrijken/controleren en exporteren.
- Disabled redenen/tooltips per actie.
- Regressie op post-export correctie en exportstatus-aware guards.

## Workflowgroepen

1. **Bekijken** — read-only acties zoals Refresh rows en Find-cmd export.
2. **Normaliseren** — HTML decode, PatternDelete, tekstnormalisatie en encoding repair.
3. **Correcte artiest/titel** — ArtistSpelling, SongSpelling en titel/artiest swap-acties.
4. **Verrijken/controleren** — Preview jaarverrijking en duplicates op Skip.
5. **Exporteren** — Export naar hitlijsten en read-only exporthulpen.
6. **Na export corrigeren** — blijft rij-level beschikbaar via de bestaande Correctie na export flow.

## Functionele regels

- Zonder geselecteerde run zijn workflowacties disabled.
- Als een bewerking bezig is, zijn acties tijdelijk disabled.
- Na export zijn pre-export/staging-only mutaties disabled.
- SongSpelling is pas beschikbaar na ArtistSpelling.
- Acties op zichtbare rijen zijn disabled als er geen zichtbare rijen zijn.
- Duplicate-skip is disabled als er geen duplicates zijn.
- Export blijft geblokkeerd zolang blocking issues of bestaande exportrecords aanwezig zijn.
- Read-only acties blijven beschikbaar als hun eigen prerequisites aanwezig zijn.

## Technische implementatie

Nieuwe helper:

```text
src/ui/utils/editWorkflowPolicy.js
```

Belangrijkste exports:

```text
EDIT_WORKFLOW_STEPS
getEditWorkflowActionState(actionKey, context)
getEditWorkflowPolicy(context)
```

De helper geeft per actie terug:

```text
disabled
reason
step
variantHint
```

`EditPage.jsx` gebruikt deze policy voor de toolbar-knoppen en toont de workflowgroepen met korte uitleg.

## Tests

Nieuw testscript:

```bash
npm run test:sprint2h-n
```

Gedekte onderdelen:

- workflow-policy unit tests;
- read-only acties blijven beschikbaar na export;
- pre-export mutaties zijn disabled na export;
- prerequisites zoals ArtistSpelling, zichtbare rijen en duplicates worden afgedwongen;
- bestaande 2H-M exportstatus-aware button tests blijven werken;
- post-export correctie blijft beschikbaar en functioneel.

## Buiten scope

- Volledige redesign van het Edit-scherm.
- Nieuwe backend guards buiten de reeds toegevoegde 2H-M guards.
- Pattern discovery helper.
- Nieuwe post-export correctietypen.
