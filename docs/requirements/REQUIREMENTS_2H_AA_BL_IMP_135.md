# Requirements — Sprint 2H-AA / BL-IMP-135

**Onderwerp:** Drag-and-drop CSV-importselectie  
**Applicatie:** Import Hitlijsten (`importhitlijst`)  
**Documentatie-/codeversie:** **1.2.0**  
**Baseline:** geaccepteerde 2H-Z/HF4 v1.1.0  
**Status:** requirements interactief vastgesteld; gereed voor codeontwikkeling

## 1. Doel

De bestaande CSV-import-inbox wordt uitgebreid met drag-and-drop en een klikbare bestandskiezer. De bestaande directory-scan blijft volledig beschikbaar. De uitbreiding moet vooral het klaarzetten en verwerken van meerdere hitlijsten eenvoudiger maken zonder de bestaande registry-, fingerprint-, duplicate- en importlogica te omzeilen.

## 2. Vastgestelde requirements

### 2.1 Selectie en batch

- De gebruiker kan één of meerdere CSV-bestanden vanuit Finder op een dropzone slepen.
- De dropzone is ook klikbaar en opent de macOS-bestandsdialoog.
- Eén selectie/drop mag maximaal **50 CSV-bestanden** bevatten.
- Alleen `.csv` wordt geaccepteerd.
- Maximale bestandsgrootte is **25 MB per CSV**.
- De bestaande directory-scan blijft als tweede werkwijze bestaan.

### 2.2 Gedrag na selectie

- Een gedropt/gekozen bestand is eerst een **tijdelijke importkandidaat**; er ontstaat nog geen `IMPORTED` registry-record.
- Bij één geldig bestand wordt het bestand automatisch geselecteerd en krijgt **Hitlijst name** focus.
- Bij meerdere bestanden worden alle kandidaten in de import-inbox geplaatst; de gebruiker kiest vervolgens per bestand **Selecteer**.
- De kandidaat blijft na browser-refresh beschikbaar.

### 2.3 Metadata per lijst

Iedere CSV heeft een eigen, onafhankelijk metadata-concept. Minimaal:

- Hitlijst name (`hl_hitlijst`);
- Uitzendjaar (`hl_uitzendjaar`);
- Omroep (`omroep_key`);
- Periode (`periode_key`);
- overige bestaande importmetadata indien het bestaande formulier later wordt uitgebreid.

Metadata mag **niet automatisch gedeeld** worden tussen bestanden. De gebruiker kan tussen kandidaten wisselen en later terugkeren zonder reeds ingevulde conceptmetadata te verliezen.

### 2.4 Kandidaatstatus

De inbox toont per kandidaat een duidelijke gebruikersstatus. De functionele hoofdstatussen zijn:

- Nieuw;
- Metadata onvolledig;
- Klaar voor import;
- Importfout;
- Geïmporteerd.

Duplicate-informatie wordt aanvullend getoond en hoeft technisch geen aparte lifecycle-status te zijn.

### 2.5 Duplicate-controle

Voor iedere kandidaat worden dezelfde controles gebruikt als in 2H-Z:

1. `file_sha256` voor exact hetzelfde fysieke bestand;
2. `list_fingerprint` voor dezelfde semantische lijstinhoud.

UI-meldingen:

- **Reeds geïmporteerd — hetzelfde bestand**;
- **Reeds geïmporteerd — dezelfde lijstinhoud**.

Normale import is dan geblokkeerd. De bestaande expliciete duplicate-override blijft beschikbaar. Geen enkele duplicate wordt stilzwijgend opnieuw geïmporteerd.

### 2.6 Importeren

Er zijn twee importacties:

- **Importeer deze lijst**;
- **Importeer alle gereedstaande lijsten**.

Voor bulkimport gelden de volgende regels:

- alleen kandidaten met geldige, complete eigen metadata worden meegenomen;
- iedere lijst krijgt een eigen import-run;
- iedere lijst wordt in een eigen database-transactie verwerkt;
- een fout in lijst B mag een succesvolle import van lijst A of C niet terugdraaien;
- de verwerking levert een samenvatting op, bijvoorbeeld `8 geïmporteerd, 1 duplicate geblokkeerd, 1 importfout`;
- de gebruiker kan vanuit de samenvatting naar de betreffende fout/duplicate-kandidaat navigeren.

### 2.7 Tijdelijke opslag en cleanup

- Tijdelijke uploadbestanden en conceptmetadata blijven maximaal **7 dagen** bewaard.
- Na succesvolle import wordt het tijdelijke fysieke uploadbestand verwijderd.
- Registry, fingerprints, import-run en auditinformatie blijven behouden.
- Een kandidaat kan als `Geïmporteerd` nog zichtbaar blijven zonder fysiek uploadbestand totdat de kandidaatregistratie door cleanup wordt verwijderd.
- De gebruiker kan één tijdelijke kandidaat verwijderen.
- Er is tevens een actie **Verwijder alle tijdelijke bestanden** voor nog niet geïmporteerde kandidaten, met expliciete bevestiging.
- Verwijderen van een kandidaat wijzigt nooit het bronbestand op de Mac en nooit een bestaande import registry-record.
- Verlopen kandidaten worden minimaal bij serverstart opgeschoond; periodieke runtime-cleanup is toegestaan.
- Geen aparte cronjob of aparte Docker-container nodig.

### 2.8 Foutgedrag

- Ongeldig bestandstype: direct afwijzen met duidelijke melding.
- Bestand groter dan 25 MB: direct afwijzen.
- Meer dan 50 bestanden in één batch: batch afwijzen of de gebruiker duidelijk vragen de selectie te verkleinen; niet stilzwijgend afkappen.
- Parse-/leesfout: kandidaat blijft zichtbaar met foutstatus; er ontstaat geen `IMPORTED` registry-record.
- Importfout: alleen die kandidaat krijgt `Importfout`; overige bulk-kandidaten gaan door.
- Externe browser-refresh mag geen conceptmetadata of tijdelijke kandidaten verliezen zolang zij niet verlopen zijn.

## 3. Buiten scope

- wijzigen van de bron-CSV op de Mac;
- automatisch afleiden en zonder controle toepassen van hitlijstnaam/jaar/omroep/periode;
- automatisch importeren direct na drop;
- directory-recursie uitbreiden;
- drag-and-drop van directories;
- andere bestandstypen dan CSV;
- verwijderen van bestaande `file_details`, `hitlijsten` of registryrecords via deze feature;
- parallelle bulkimport als functionele eis; een sequentiële backendverwerking is toegestaan.

## 4. Acceptatie-uitgangspunt

De feature is functioneel gereed wanneer een gebruiker meerdere CSV's kan klaarzetten, per lijst afzonderlijk metadata kan invullen, de sessie kan hervatten na refresh, duplicates vóór import ziet, één of alle gereedstaande lijsten veilig kan importeren en tijdelijke kandidaten gecontroleerd kan opruimen.
