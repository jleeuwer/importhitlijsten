# Functioneel ontwerp — Sprint 2H-AA / BL-IMP-135

**Titel:** Drag-and-drop CSV Import Inbox  
**Versie:** **1.2.0**  
**Baseline:** Import Hitlijsten v1.1.0 (2H-Z/HF4, geaccepteerd)  
**Releasekarakter:** backwards-compatible feature / minor  
**Status:** concrete code opgeleverd; acceptatietest open

## 1. Aanleiding

De bestaande import-inbox kan CSV-bestanden vinden via een opgegeven directory. Voor incidentele of meerdere imports is het praktischer om bestanden rechtstreeks vanuit Finder naar de applicatie te slepen of via een bestandsdialoog te kiezen. De nieuwe flow mag de bestaande veilige importregistratie uit 2H-Z niet omzeilen.

## 2. Doel

De gebruiker kan één of meerdere CSV-bestanden direct klaarzetten voor import, zonder eerst een directorypad in te vullen. Iedere lijst houdt zijn eigen metadata en lifecycle. De bestaande directory-scan blijft beschikbaar.

## 3. Voorgestelde UI

```text
CSV import-inbox

┌────────────────────────────────────────────────────────────┐
│ Sleep CSV-bestanden hierheen                               │
│ of klik om CSV-bestanden te kiezen                         │
│ Max. 50 bestanden per keer · max. 25 MB per CSV           │
└────────────────────────────────────────────────────────────┘

Directory: [ /Volumes/...                         ] [ Scannen ]

Tijdelijke / gevonden bestanden
┌────────────────────┬─────────────────────┬──────────────┬────────────┐
│ Bestand            │ Status              │ Duplicate    │ Actie      │
├────────────────────┼─────────────────────┼──────────────┼────────────┤
│ top2000-2026.csv   │ Metadata onvolledig │ —            │ Selecteer  │
│ top2000-2025.csv   │ Klaar voor import   │ —            │ Selecteer  │
│ top2000-copy.csv   │ Klaar voor import   │ Zelfde lijst │ Selecteer  │
└────────────────────┴─────────────────────┴──────────────┴────────────┘

[ Importeer alle gereedstaande lijsten ]
[ Verwijder alle tijdelijke bestanden ]
```

## 4. Gebruikersflow

### 4.1 Eén bestand

1. Gebruiker sleept één CSV naar de dropzone of kiest deze via de dialoog.
2. Applicatie valideert type en omvang.
3. Bestand wordt tijdelijk opgeslagen en geanalyseerd.
4. SHA-256, lijstfingerprint en duplicate-status worden bepaald.
5. Kandidaat wordt automatisch geselecteerd.
6. Focus gaat naar `Hitlijst name`.
7. Gebruiker vult/verifieert metadata.
8. Status wordt `Klaar voor import` zodra alle verplichte metadata geldig is.
9. Gebruiker kiest `Importeer deze lijst`.
10. Na succesvolle import wordt het tijdelijke fysieke bestand verwijderd en verschijnt het resultaat.

### 4.2 Meerdere bestanden

1. Gebruiker sleept/kies maximaal 50 CSV's.
2. Alle geldige bestanden verschijnen als afzonderlijke kandidaten.
3. Gebruiker kiest per kandidaat `Selecteer` en vult eigen metadata in.
4. Metadata blijft bewaard als de gebruiker naar een andere kandidaat wisselt.
5. Gereedstaande kandidaten kunnen individueel of via `Importeer alle gereedstaande lijsten` worden verwerkt.

## 5. Metadata

Per kandidaat worden minimaal dezelfde bestaande velden gebruikt:

| Veld | Verplicht | Opmerking |
|---|---|---|
| Hitlijst name | ja | maximaal conform bestaand model |
| Uitzendjaar | ja | bestaande jaarrange blijft gelden |
| Omroep | ja | bestaande metadata-opties |
| Periode | ja | bestaande metadata-opties |

De metadata is kandidaatgebonden. Er is geen automatische bulk-copy tussen kandidaten in deze sprint.

## 6. Statusmodel voor de gebruiker

| Status | Betekenis |
|---|---|
| Nieuw | upload is ontvangen en bruikbaar |
| Metadata onvolledig | bestand is bruikbaar maar verplichte metadata ontbreekt |
| Klaar voor import | bestand en metadata zijn geldig |
| Importfout | import van deze kandidaat is mislukt |
| Geïmporteerd | import is geslaagd; tijdelijk bestand is verwijderd |

Daarnaast wordt duplicate-informatie afzonderlijk getoond:

- exact hetzelfde bestand;
- dezelfde lijstinhoud;
- geen duplicate.

## 7. Duplicate-gedrag

De bestaande 2H-Z-regels blijven leidend. Een duplicate wordt niet automatisch geïmporteerd. De gebruiker krijgt dezelfde expliciete override-mogelijkheid als in de bestaande flow. Bij bulkimport wordt een duplicate zonder override overgeslagen/geblokkeerd en expliciet in de samenvatting gemeld.

## 8. Bulkimport

`Importeer alle gereedstaande lijsten` verwerkt alleen kandidaten die aan alle voorwaarden voldoen. Iedere kandidaat krijgt zijn eigen import-run en transactie. Eén fout stopt de overige kandidaten niet.

Na afloop toont de UI minimaal:

```text
Bulkimport afgerond
8 geïmporteerd
1 duplicate geblokkeerd
1 importfout
```

Iedere niet-succesvolle regel in de samenvatting is selecteerbaar zodat de gebruiker direct naar de kandidaat kan teruggaan.

## 9. Refresh en hervatten

Een browser-refresh of opnieuw openen van `/import` mag niet-geïmporteerde kandidaten en hun conceptmetadata niet verliezen, zolang de bewaartermijn niet is verstreken. Daardoor kan een gebruiker een batch in meerdere stappen voorbereiden.

## 10. Opruimen

- individuele kandidaat: `Verwijder`;
- bulk: `Verwijder alle tijdelijke bestanden`, met bevestiging;
- automatisch na 7 dagen;
- minimaal bij serverstart, optioneel periodiek tijdens runtime.

Opruimen raakt alleen tijdelijke kandidaatdata. Bronbestanden, geïmporteerde data en registryrecords blijven onaangetast.

## 11. Validatie en foutmeldingen

Foutmeldingen moeten concreet en per bestand zijn. Voorbeelden:

- `Alleen CSV-bestanden worden ondersteund.`
- `Bestand is groter dan 25 MB.`
- `Maximaal 50 bestanden per selectie.`
- `CSV kon niet worden gelezen: <korte reden>.`
- `Deze lijst is al geïmporteerd — hetzelfde bestand.`
- `Deze lijst is al geïmporteerd — dezelfde lijstinhoud.`

## 12. Acceptatiecriteria

- Drag-and-drop en klikselectie werken beide.
- Directory-scan blijft werken.
- Eén en meerdere bestanden worden ondersteund.
- Metadata is per bestand onafhankelijk.
- Kandidaten en conceptmetadata overleven refresh.
- Duplicates gebruiken de bestaande 2H-Z-semantiek.
- Bulkimport is foutgeïsoleerd.
- Tempbestanden worden veilig opgeschoond.
- De feature verandert nooit het bronbestand op de Mac.
