# Functionele specificatie — Sprint 2H-Y

## 1. Ambigue kandidaten

Wanneer een hitlijstregel gekoppeld moet worden aan `file_details`, kan het systeem nul, één of meerdere kandidaten vinden.

Gewenst gedrag:

| Situatie | Gedrag |
|---|---|
| 0 kandidaten | Regel blijft niet-gematcht/review nodig |
| 1 veilige kandidaat | Regel mag automatisch matchen |
| Meerdere kandidaten | Regel wordt ambiguous/review nodig |
| Gebruiker kiest kandidaat | Keuze wordt vastgelegd en regel wordt exporteerbaar |

Export of samenstelling mag niet doorgaan wanneer blocking ambiguity bestaat.

## 2. Discogs-link lifecycle

Discogs-links op hitlijstregels zijn primair metadata van de hitlijstregel.

Gewenste flow:

```text
staging_hitlijsten.discogs_release_url
staging_hitlijsten.discogs_master_url
staging_hitlijsten.hl_discogs_link
        ↓ export
hitlijsten.discogs_release_url
hitlijsten.discogs_master_url
```

Niet automatisch:

```text
hitlijst Discogs-link → file_details.fd_discogs
```

Promotie naar `file_details` vereist later een aparte review/promote-flow.

## 3. Variant-aware matching

Het systeem moet onderscheid maken tussen:

- hetzelfde nummer;
- dezelfde gewenste versie/songtype;
- dezelfde concrete uitvoering/mix;
- dezelfde Discogs master/release;
- dezelfde hitlijstcontext.

Een duplicate-diagnose mag niet automatisch concluderen dat records verwijderd kunnen worden. Eerst moet duidelijk zijn of varianten functioneel verschillend zijn.

## 4. Encoding/status hardening

### Encoding repair

Als geen herstelbare wijzigingen bestaan, wordt niets opgeslagen en krijgt de gebruiker een normale melding.

### Exportstatus met warnings

Een succesvol geëxporteerde hitlijst met niet-blokkerende waarschuwingen wordt als voltooid beschouwd, maar de waarschuwingen blijven zichtbaar.

### Warning refresh

Na handmatige correctie worden warnings opnieuw berekend.

### Repair bestaande runs

Bestaande foutieve statussen kunnen via preview/apply worden gerepareerd zonder inhoudelijke gegevens te wijzigen.
