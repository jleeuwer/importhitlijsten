# Technical spec — Sprint 2H-X Edit-scherm tabel polish

## 1. Doel

UI-aanpassing in de Edit-tabel zonder databasewijziging en zonder API-breaking changes.

## 2. Verwachte codegebieden

Waarschijnlijke bestanden bij codebouw:

```text
src/ui/pages/EditPage.jsx
src/ui/components/*Table*.jsx
src/ui/components/*Discogs*.jsx
src/ui/hooks/useEditController*.js
```

De exacte locatie hangt af van de actuele componentstructuur.

## 3. Discogs-link resolver

Introduceer bij voorkeur een kleine pure helper, bijvoorbeeld:

```js
export function resolveDiscogsUrl(row) {
  return (
    sanitizeDiscogsUrl(row.discogs_release_url) ||
    sanitizeDiscogsUrl(row.discogs_master_url) ||
    sanitizeDiscogsUrl(row.hl_discogs_link) ||
    null
  );
}
```

### Veiligheid

De helper mag alleen veilige URL's doorlaten.

Aanbevolen minimum:

```text
https://www.discogs.com/...
https://discogs.com/...
```

Niet toestaan:

```text
javascript:...
data:...
lege string
niet-URL tekst
```

## 4. Link-rendering

Gebruik:

```jsx
<a href={discogsUrl} target="_blank" rel="noopener noreferrer">
  Discogs
</a>
```

Bij voorkeur met een `aria-label`, bijvoorbeeld:

```jsx
aria-label="Open Discogs-link in nieuw venster"
```

## 5. Artist-key kolom verwijderen

Aanpak:

- Verwijder `artist_key`, `ar_artist_key`, `fd_artist_key` of vergelijkbare technische key uit de zichtbare kolomdefinitie.
- Verwijder niet noodzakelijk uit de API-response.
- Laat interne row-data intact.

## 6. Teststrategie

### Unit/pure helper tests

- release-url heeft voorkeur boven master-url;
- master-url werkt als fallback;
- invalid URL wordt genegeerd;
- raw `hl_discogs_link` wordt alleen gebruikt als veilig.

### React/component tests

- link zichtbaar bij URL;
- geen link zonder URL;
- `target` en `rel` correct;
- artist-key kolom niet zichtbaar.

### Static tests

- geen `target="_blank"` zonder `rel="noopener noreferrer"` in relevante componenten;
- documentatie aanwezig.

## 7. Database

Geen database-migratie nodig.

De sprint gebruikt bestaande velden die al in staging/hitlijsten beschikbaar zijn.

## 8. Relatie met BL-IMP-133

2H-X toont de link alleen in de UI. Lifecycle, exportmapping en promotie naar `file_details` blijven bij BL-IMP-133.
