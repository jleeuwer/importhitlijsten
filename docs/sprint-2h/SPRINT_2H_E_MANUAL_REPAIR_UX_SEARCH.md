# Sprint 2H-E — Manual repair UX: gescheiden artiest- en titelzoekvelden

## Doel

De handmatige herstel-flow in het Edit-scherm is gebruiksvriendelijker gemaakt door zoeken in `file_details` te scheiden in twee logische velden:

- `Artiest zoeken`
- `Titel zoeken`

Hiermee kan de gebruiker gerichter zoeken dan met één gecombineerd zoekveld.

## Functionele wijziging

Voor Sprint 2H-E werkte handmatig herstel met één zoekveld voor `file_details`. Dat veld combineerde artiest, titel en andere tekst. In de praktijk is dat minder intuïtief wanneer de gebruiker specifiek op artiest of titel wil verfijnen.

Vanaf 2H-E:

- het gecombineerde veld is vervangen door aparte velden voor artiest en titel;
- minimaal één van beide velden moet gevuld zijn voordat gezocht kan worden;
- beide velden ondersteunen gedeeltelijke matching;
- de UI stuurt `artist` en `title` queryparameters naar de backend;
- de bestaande backend blijft backward compatible met de oude `query` parameter, maar de UI gebruikt die niet meer.

## Backend

Bestaand endpoint blijft:

```text
GET /api/edit/manual-repair-candidates
```

De UI gebruikt nu:

```text
GET /api/edit/manual-repair-candidates?artist=<artiest>&title=<titel>&limit=25
```

De service `searchManualRepairFileDetailsCandidates` ondersteunde artist/title al; deze sprint legt dit vast met extra tests.

## UI

In de handmatige herstel-sectie:

- label `Zoek in file_details` is vervangen;
- veld `Artiest zoeken` is toegevoegd;
- veld `Titel zoeken` is toegevoegd;
- helpertekst geeft aan dat minimaal één zoekveld verplicht is.

## Tests

Toegevoegd/aangepast:

- `tests/services_manualRepairFileDetails.test.js`
- `tests/react/EditForcedRepairAndManualMode.test.jsx`

Gedekt:

- zoeken met aparte artist/title serviceparameters;
- UI verstuurt `artist` en `title` en geen gecombineerde `query`;
- oude gecombineerde zoeklabel is niet meer zichtbaar in de manual repair UI.

## Testcommando

```bash
mkdir -p logs
npm run test:sprint2h-e 2>&1 | tee "logs/test-sprint2h-e-$(date +%Y%m%d-%H%M%S).log"
```

Regressie:

```bash
mkdir -p logs
{
  echo "=== test:sprint2h-e ==="
  npm run test:sprint2h-e

  echo "=== test:sprint2h ==="
  npm run test:sprint2h

  echo "=== test:sprint2g ==="
  npm run test:sprint2g
} 2>&1 | tee "logs/test-regression-2h-e-$(date +%Y%m%d-%H%M%S).log"
```
