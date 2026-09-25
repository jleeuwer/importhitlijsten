# Release Notes — Sprint 2H-L Discogs UX harmonisatie

## Samenvatting

Sprint 2H-L harmoniseert de Discogs UX van Importhitlijst met het voorkeursmodel uit Coretables / File Details.

## Nieuw

- Editable Discogs zoekvelden voor Artiest en Titel.
- Default prefill vanuit correcte artiest en correcte titel.
- Expliciete actie **Zoek in Discogs**; de modal zoekt niet meer automatisch bij openen.
- Cross-app standaarddocument: `docs/standards/MUSICAPP_DISCOGS_UX_API_STANDARD.md`.
- Nieuw tests script: `npm run test:sprint2h-l`.

## Ongewijzigd / veilig

- Details bekijken blijft read-only.
- Koppelen blijft expliciet.
- Er wordt niets naar `file_details` geschreven.
- Label(s) blijven uit tabel en details.

## Validatie

```bash
mkdir -p logs
npm run test:sprint2h-l 2>&1 | tee "logs/test-sprint2h-l-$(date +%Y%m%d-%H%M%S).log"
npm run build 2>&1 | tee "logs/build-sprint2h-l-$(date +%Y%m%d-%H%M%S).log"
```
