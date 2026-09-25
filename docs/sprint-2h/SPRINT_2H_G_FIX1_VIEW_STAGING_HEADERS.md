# Sprint 2H-G Fix 1 — View staging header labels

## Doel

In het scherm **View staging** waren de tabelheaders nog technische databasekolomnamen. Deze fix vervangt die labels door gebruiksvriendelijke Nederlandse kolomheaders, zonder de onderliggende data of export/matchinglogica te wijzigen.

## Backlog

### BL-IMP-100 — View staging kolomheaders gebruiksvriendelijk maken

Mapping:

| Technisch veld | Nieuw label |
| --- | --- |
| `hl_positie` | Positie |
| `hl_artiest` | Artiest uit lijst |
| `hl_titel_song` | Titel uit lijst |
| `hl_jaar` | Jaar |
| `fd_tag_title` | Correcte titel |
| `as_correcte_artiest_spelling` | Correcte spelling artiest |
| `hl_discogs_link` | Discogs link |
| `hl_find_cmd` | Vind commando |
| `hl_artist_key` | Sleutel artiest |
| `omroep_key` | Omroep sleutel |
| `periode_key` | Periode sleutel |

## Technische wijziging

Aangepast:

- `src/ui/pages/StagingResults.jsx`
- `tests/react/StagingViewHeaderLabels.test.jsx`
- `package.json`

## Test

```bash
mkdir -p logs
npm run test:sprint2h-g-fix1 2>&1 | tee "logs/test-sprint2h-g-fix1-$(date +%Y%m%d-%H%M%S).log"
```
