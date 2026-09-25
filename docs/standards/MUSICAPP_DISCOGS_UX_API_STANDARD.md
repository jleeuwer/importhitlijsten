# MusicApp Discogs UX/API Standard

Status: eerste standaard, geïntroduceerd in Importhitlijst Sprint 2H-L.

## Doel

Deze standaard beschrijft hoe MusicApp-apps Discogs zoeken, inspecteren, koppelen en eventueel later metadata toepassen. De standaard is gebaseerd op de positieve gebruikerservaring met Coretables / File Details en is in 2H-L toegepast op Importhitlijst.

## Standaard gebruikersflow

1. Toon de context van de huidige rij of entiteit.
2. Toon editable zoekvelden voor **Artiest** en **Titel**.
3. Vul deze velden standaard met de correcte artiest en correcte titel uit de appcontext.
4. Laat de gebruiker de zoekvelden aanpassen vóór het zoeken.
5. Zoek pas na expliciete actie **Zoek in Discogs**.
6. Toon resultaten compact en scanbaar.
7. Laat de gebruiker details inspecteren zonder data te wijzigen.
8. Laat de gebruiker expliciet koppelen.
9. Metadata toepassen op `file_details` mag alleen via een aparte review/acceptatieflow.

## Zoekvelden

Elke gebruikersgerichte Discogs zoekflow start met:

- `Artiest`
- `Titel`

Defaultwaarden komen uit de appcontext. Voor Importhitlijst zijn dat de correcte artiest en correcte titel van de stagingregel. Wijzigingen in de zoekvelden veranderen uitsluitend de Discogs-query en nooit automatisch staging-, artist-, song_spelling- of file_details-data.

## Resultatentabel

Standaardkolommen:

```text
Type | Artiest | Titel | Jaar | Land | Format | Discogs | Details | Koppel
```

Regels:

- `Koppel` staat rechts als laatste actie.
- `Details` staat direct vóór `Koppel`.
- Master/release worden met badges onderscheiden.
- De externe Discogs-link opent in een nieuw tabblad.
- `Label(s)` worden niet getoond in gebruikersgerichte resultatentabellen, omdat labeldata vaak groot en onoverzichtelijk is.

## Detailinspectie

Detailinspectie is read-only. Tonen indien beschikbaar:

- Type
- Artiest
- Titel
- Jaar
- Land
- Format(s)
- Catalogusnummer, alleen compact
- Discogs URL
- Tracklist met positie, titel en duur

Niet tonen:

- Label(s)
- Ruwe Discogs JSON
- Metadata-apply-acties zonder reviewflow

## Acties en terminologie

Aanbevolen termen:

- `Zoek in Discogs`
- `Details`
- `Open Discogs`
- `Koppel`
- `Koppel deze entry`
- `Terug naar resultaten`

Betekenis:

- **Details** = alleen lezen/inspecteren.
- **Koppel** = Discogs-entry opslaan bij de huidige appcontext.
- **Toepassen/Vul formulier** = alleen gebruiken in onderhouds- of reviewflows waar expliciet metadata wordt overgenomen.

## Veilig metadata-beleid

Discogs inspectie en koppeling mogen in import-/reviewflows plaatsvinden. Automatisch schrijven naar `file_details` is niet toegestaan zonder expliciete review/acceptatie door de gebruiker.

Voor Importhitlijst geldt specifiek:

- Discogs zoeken wijzigt niets.
- Details bekijken wijzigt niets.
- Koppelen wijzigt alleen de Discogs-koppeling op de stagingregel.
- `file_details`, `fd_key` en `hl_samenstel_fd_key` blijven ongewijzigd.

## API/normalisatie

Aanbevolen backendpatroon:

```text
GET /api/discogs/search?artist=<artist>&title=<title>&perPage=25
GET /api/discogs/details/:type/:id
```

Responsevormen moeten app-onafhankelijk genormaliseerd zijn, met duidelijke velden voor:

- type
- id/masterId/releaseId
- artist
- title
- year
- country
- formats
- discogsUrl
- catalogNumbers
- tracklist

Discogs errors moeten worden vertaald naar gebruikersgerichte meldingen zoals timeout, rate-limit, configuratiefout of geen resultaten.

## Loading, empty en error states

Voorbeelden:

- `Discogs-resultaten laden...`
- `Geen Discogs-resultaten gevonden voor deze zoekopdracht.`
- `Discogs-details laden...`
- `Discogs-details konden niet worden opgehaald.`
- `Discogs is tijdelijk niet beschikbaar of reageert te traag.`
- `Controleer de Discogs-configuratie.`

## Toepassing per app

- **Importhitlijst**: zoeken vanuit stagingregel, details inspecteren, Discogs-entry koppelen aan staging.
- **Coretables / File Details**: Discogs gebruiken voor gecontroleerde metadata-review van specifieke file_details-versies.
- **Importeren Songs**: Discogs gebruiken bij importvoorstellen en versie/release-inspectie, zonder blind overschrijven.
- **Artiesten-app**: Discogs gebruiken voor artiestkoppeling/profielinformatie met expliciete keuze door gebruiker.

## Geen NPM-package in deze fase

Deze sprint introduceert eerst een documentatiestandaard. Een gedeeld intern NPM-package, bijvoorbeeld `@musicapp/discogs`, kan later worden overwogen als de flow en normalisatielogica in meerdere apps stabiel en gelijk genoeg zijn.
