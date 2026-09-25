# Sprint 2H-N — Button workflow en prerequisites zichtbaar maken — codebouw voorbereiding

## Status

Deze voorbereiding is bedoeld als implementatiekaart voor de codebouw van Sprint 2H-N. De sprint volgt op 2H-M Fix 1, waarin pre-export mutaties na export worden geblokkeerd.

## Hoofddoel

Maak de workflow boven de Edit-tabel begrijpelijk en voorspelbaar. De gebruiker moet kunnen zien welke stap logisch volgt, welke prerequisites ontbreken, en waarom een knop wel of niet klikbaar is.

## Scope

- BL-IMP-112 — Button workflow zichtbaar maken / prerequisites afdwingen.
- Gebruik de exportstatus-aware blokkering uit 2H-M Fix 1 als basis.
- Voeg geen nieuwe inhoudelijke importfunctie toe.
- Verander geen database-schema.

## Workflowgroepen

De toolbar boven de Edit-tabel wordt functioneel gegroepeerd in onderstaande stappen.

### Stap 0 — Bekijken / verversen

Read-only of veilig opnieuw laden.

| Actie | Muterend | Na export toegestaan | Prerequisite |
|---|---:|---:|---|
| Refresh rows | Nee | Ja | runId beschikbaar |
| Export Find-cmd script | Nee, download | Ja | runId + minimaal één find-cmd |
| Export blocked Discogs-links | Nee, download | Ja | runId + minimaal één blocked Discogs-link |

### Stap 1 — Normaliseren

Staging-only voorbereiding vóór export.

| Actie | Muterend | Na export toegestaan | Prerequisite |
|---|---:|---:|---|
| Decode HTML entities | Ja | Nee | runId + niet geëxporteerd |
| PatternDelete | Ja | Nee | runId + niet geëxporteerd |
| Preview tekstnormalisatie | Preview/read | Nee | runId + zichtbare rijen + niet geëxporteerd |
| Normaliseer tekst | Ja | Nee | runId + zichtbare rijen + niet geëxporteerd |
| Preview encoding repair | Preview/read | Nee | runId + zichtbare rijen + niet geëxporteerd |
| Repair encoding | Ja | Nee | runId + zichtbare rijen + niet geëxporteerd |

### Stap 2 — Correcte artiest/titel bepalen

Stappen die nodig zijn voordat verrijking, matching en Discogs zoeken betrouwbaar zijn.

| Actie | Muterend | Na export toegestaan | Prerequisite |
|---|---:|---:|---|
| ArtistSpelling | Ja | Nee | runId + niet geëxporteerd |
| SongSpelling | Ja | Nee | runId + ArtistSpelling uitgevoerd + niet geëxporteerd |
| Forceer titel/artiest swap | Ja | Nee | runId + zichtbare rijen + niet geëxporteerd |
| Herstel titel/artiest swap batch | Ja | Nee | runId + niet geëxporteerd |
| AltSpelling/Save/manual repair op rijniveau | Ja | Nee | runId + niet geëxporteerd + rijcontext |

### Stap 3 — Verrijken en controleren

Stappen die correcte artiest + correcte titel gebruiken.

| Actie | Muterend | Na export toegestaan | Prerequisite |
|---|---:|---:|---|
| Preview jaarverrijking | Preview/read | Nee | runId + zichtbare rijen + SongSpelling/correcte titel beschikbaar + niet geëxporteerd |
| Jaarverrijking toepassen | Ja | Nee | geldige preview + niet geëxporteerd |
| Zoek in Discogs | Koppelen is muterend | Details read-only | correcte artiest/titel beschikbaar; koppelen alleen vóór export |
| Details bekijken in Discogs | Nee | Ja, mits read-only | Discogs-resultaat beschikbaar |
| Koppel Discogs-entry | Ja | Nee | niet geëxporteerd |

### Stap 4 — Exporteren

| Actie | Muterend | Na export toegestaan | Prerequisite |
|---|---:|---:|---|
| Export → hitlijsten | Ja | Nee, idempotent blokkeren | runId + niet geëxporteerd + geen export blockers |

### Stap 5 — Na export corrigeren

| Actie | Muterend | Na export toegestaan | Prerequisite |
|---|---:|---:|---|
| Correctie na export | Ja, staging + hitlijsten | Ja | run geëxporteerd + file_details-kandidaat + preview/bevestiging |

## Centrale frontend-policy

Maak een helperbestand:

```text
src/ui/utils/editWorkflowPolicy.js
```

Voorgestelde exports:

```js
export const WORKFLOW_STEPS = [
  { key: 'view', label: 'Bekijken' },
  { key: 'normalize', label: 'Normaliseren' },
  { key: 'correct', label: 'Correcte artiest/titel' },
  { key: 'enrich', label: 'Verrijken/controleren' },
  { key: 'export', label: 'Exporteren' },
  { key: 'postExport', label: 'Na export corrigeren' }
];

export function buildEditWorkflowContext(input) { ... }
export function getEditActionPolicy(actionKey, context) { ... }
export function getWorkflowStepStatus(stepKey, context) { ... }
```

### Context-input

De policy mag geen React-state rechtstreeks kennen, maar krijgt een genormaliseerde context:

```js
{
  runId,
  busy,
  alreadyExported,
  exportStatusLoading,
  exportBlocked,
  artistSpellingDone,
  hasVisibleRows,
  findCmdCount,
  blockedDiscogsExportCount,
  duplicateImportCount,
  hasCorrectArtistTitle,
  hasYearEnrichmentPreview,
  hasDiscogsResults,
  rowMode // optioneel voor rij-level actions
}
```

### Policy-output

```js
{
  disabled: boolean,
  reason: string,
  step: 'normalize' | 'correct' | 'enrich' | 'export' | 'postExport' | 'view',
  variantHint: 'readonly' | 'preExport' | 'postExport' | 'blocked'
}
```

## Eerste action-key lijst

Gebruik vaste action keys, zodat tests niet afhankelijk zijn van buttontekst.

```text
refreshRows
exportFindCmd
exportBlockedDiscogsLinks
decodeHtmlEntities
runArtistSpelling
runPatternDelete
runSongSpelling
previewYearEnrichment
applyYearEnrichment
repairSwapBatch
forceSwapVisibleRows
previewNormalizeVisibleRows
normalizeVisibleRows
previewEncodingRepairVisibleRows
repairEncodingVisibleRows
markDuplicateRowsAsSkip
exportHitlijsten
rowSave
rowAltSpelling
rowManualRepair
rowDiscogsSearch
rowDiscogsLink
postExportCorrection
```

## UI-aanpassing

### Toolbarstructuur

Vervang de vlakke lijst buttons door visuele groepen:

```text
Stap 1 — Normaliseren
Stap 2 — Correcte artiest/titel
Stap 3 — Verrijken/controleren
Stap 4 — Exporteren
Stap 5 — Na export corrigeren
```

Elke groep krijgt:

- korte titel;
- optionele statusbadge: Klaar / Nog nodig / Geblokkeerd na export;
- buttons binnen die groep;
- disabled buttons met tooltip/reason.

### Statusbanner

Behoud de 2H-M exportstatusbanner. Voeg vóór export een workflowhint toe:

```text
Aanbevolen volgorde: normaliseren → ArtistSpelling → SongSpelling → jaarverrijking/Discogs → Export → hitlijsten.
```

Bij geëxporteerde run:

```text
Deze run is al geëxporteerd. Pre-export acties zijn uitgeschakeld. Gebruik Correctie na export voor wijzigingen die naar hitlijsten moeten.
```

## Backendguard

2H-N hoeft geen nieuwe backendguard te introduceren als 2H-M Fix 1 akkoord is. Wel moeten tests bevestigen dat muterende pre-export endpoints na export geblokkeerd blijven.

## Tooltip-/reason-teksten

Standaardteksten:

| Situatie | Tekst |
|---|---|
| Geen run geselecteerd | Selecteer eerst een run. |
| App is bezig | Wacht tot de huidige actie klaar is. |
| Run is geëxporteerd | Niet beschikbaar na export. Gebruik Correctie na export. |
| Geen zichtbare rijen | Geen zichtbare rijen om te verwerken. |
| ArtistSpelling ontbreekt | Voer eerst ArtistSpelling uit. |
| SongSpelling/correcte titel ontbreekt | Voer eerst SongSpelling uit zodat correcte artiest en titel beschikbaar zijn. |
| Exportstatus laadt | Exportstatus wordt geladen. |
| Export geblokkeerd | Export is geblokkeerd: los eerst de meldingen op. |
| Geen find-cmd | Geen gevulde Find-cmd waarden voor deze run. |
| Geen blocked Discogs-links | Geen blocked rijen met Discogs-link gevonden. |

## Codebouw-fasering

### Fase 1 — policy helper + unit tests

- Voeg `src/ui/utils/editWorkflowPolicy.js` toe.
- Voeg unit tests toe voor de policy.
- Dek minimaal af: geen run, busy, geëxporteerd, geen visible rows, ArtistSpelling ontbreekt, export blocked.

### Fase 2 — toolbargroepen toepassen

- Refactor alleen renderstructuur van de toolbar.
- Laat bestaande handlerfuncties intact.
- Gebruik `getEditActionPolicy` per button.
- Verplaats zo min mogelijk logica in deze fase.

### Fase 3 — rij-level actions koppelen

- Save/Edit/AltSpelling/Discogs-koppelen/manual repair krijgen dezelfde policy-aanpak.
- Details bekijken in Discogs blijft read-only beschikbaar.
- Discogs koppelen blijft disabled na export.

### Fase 4 — regressie en documentatie

- Tests uitbreiden.
- Readme/testplan/release notes bijwerken.

## Testmatrix voor codebouw

### Unit tests policy

1. Zonder run zijn alle run-acties disabled, read-only downloads ook.
2. Bij busy zijn muterende acties disabled met busy-reason.
3. Bij geëxporteerde run zijn pre-export mutaties disabled.
4. Bij geëxporteerde run blijft `postExportCorrection` enabled.
5. `exportFindCmd` blijft na export enabled als read-only download.
6. `runSongSpelling` is disabled zolang ArtistSpelling ontbreekt.
7. `previewYearEnrichment` is disabled zonder zichtbare rijen.
8. `exportHitlijsten` is disabled bij export blockers.

### Component tests EditPage

1. Workflowgroepen worden getoond.
2. Buttons staan onder de juiste groep.
3. Disabled buttons tonen reden via `title`.
4. Bij geëxporteerde run zijn pre-export buttons disabled.
5. Correctie na export blijft beschikbaar.
6. Read-only exports blijven beschikbaar waar toepasselijk.

### Regressietests

1. 2H-M Fix 1 exportstatusdetectie blijft werken.
2. 2H-L Discogs editable search blijft werken.
3. 2H-J jaarverrijking blijft staging-only.
4. 2H-I post-export correctie blijft route voor na-export wijzigingen.

## Buiten scope voor 2H-N codebouw

- Nieuwe pattern discovery functionaliteit.
- Nieuwe databasevelden.
- Nieuwe exportlogica.
- NPM package voor gedeelde Discogs-code.
- Inhoudelijke wijziging aan post-export correctie.

## Acceptatiecriteria codebouw

1. De toolbar is zichtbaar gegroepeerd in workflowstappen.
2. Elke muterende knop heeft een centrale policy voor disabled/enabled.
3. Disabled knoppen tonen een duidelijke reden.
4. De flow maakt zichtbaar welke stap logisch volgt.
5. Pre-export acties blijven na export disabled.
6. Read-only acties blijven beschikbaar waar logisch.
7. Correctie na export blijft beschikbaar na export.
8. Tests dekken policy, componentgedrag en regressies.
