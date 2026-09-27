# Release notes — Import Hitlijsten v1.1.0 — 2H-Z

Nieuwe CSV import-inbox met registry van reeds geïmporteerde bestanden en exacte duplicate-detectie op fysiek bestand en gerangschikte lijstinhoud.

Belangrijkste wijzigingen:
- directoryscan (non-recursive, CSV-only);
- standaard verbergen van reeds geïmporteerde bestanden;
- handmatig markeren/terugdraaien van historische imports;
- SHA-256 file-hash en list fingerprint;
- expliciete override voor bewust opnieuw importeren;
- transactionele registry-write;
- PostgreSQL/Docker migratie;
- `npm ci` voor reproduceerbare release-worktree dependency bootstrap.

Buildcorrectie binnen dezelfde v1.1.0 releasecandidate:
- JSX syntaxfout in `src/ui/pages/ImportPage.jsx` opgelost: de dynamische `className={...}`-expressie van de Selecteer/Opnieuw importeren-link wordt nu correct gesloten vóór `href`;
- statische regressietest toegevoegd zodat deze fout niet ongemerkt terugkomt.
