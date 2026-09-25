# Importhitlijst — Sprint 2F/2G functioneel ontwerp metadata en Discogs

## Doel
Deze notitie beschrijft de functionele uitbreiding voor hitlijstmetadata en Discogs-verrijking. De uitbreiding geldt steeds voor beide tabellen:

- `staging_hitlijsten`
- `hitlijsten`

De stagingfase blijft leidend voor controle, correctie en selectie. Bij export worden de gekozen metadata 1-op-1 meegenomen naar `hitlijsten`.

---

## 1. Omroep / zender

### Functionele behoefte
Bij een hitlijst moet vastgelegd kunnen worden welke omroep, zender of uitzender de lijst heeft uitgezonden. Eén omroep/zender kan meerdere hitlijsten uitzenden.

### Voorgestelde hulptabel
`omroepen`

Voorgestelde velden:

| Veld | Type/rol | Toelichting |
|---|---|---|
| `omroep_key` | PK | technische sleutel |
| `omroep_naam` | uniek / verplicht | naam zoals getoond in de UI |
| `omroep_land` | optioneel | NL, BE, UK, US enz. |
| `omroep_type` | optioneel | RADIO, TV, STREAMING, ORGANISATIE, OVERIG |
| `omroep_actief` | boolean | bepaalt of de waarde beschikbaar is in dropdowns |
| `omroep_opmerking` | optioneel | toelichting/historische context |
| `created_at` | audit | aanmaakdatum |
| `updated_at` | audit | wijzigingsdatum |

### Nieuwe velden op staging en definitief

- `staging_hitlijsten.omroep_key`
- `hitlijsten.omroep_key`

Beide verwijzen naar `omroepen.omroep_key`.

### Initiële seeddata
Deze waarden worden meegeleverd bij de eerste migratie, zodat de dropdown meteen bruikbaar is.

| omroep_naam | omroep_land | omroep_type | Opmerking |
|---|---|---|---|
| Onbekend / nog te bepalen |  | OVERIG | tijdelijke waarde voor oude of incomplete data |
| NPO Radio 2 | NL | RADIO | o.a. Top 2000 |
| NPO 3FM | NL | RADIO | jongeren-/popzender |
| Radio Veronica | NL | RADIO | historische en moderne hitlijsten |
| Radio 10 | NL | RADIO | hitlijsten/evergreens |
| Radio 538 | NL | RADIO | commerciële hitlijsten |
| Qmusic Nederland | NL | RADIO | commerciële hitlijsten |
| Sky Radio | NL | RADIO | thematische lijsten |
| KRO-NCRV | NL | ORGANISATIE | omroeporganisatie |
| AVROTROS | NL | ORGANISATIE | omroeporganisatie |
| VRT Radio 2 | BE | RADIO | Vlaamse lijsten |
| Studio Brussel | BE | RADIO | alternatieve/poplijsten |
| Radio 1 België | BE | RADIO | Belgische radio |
| BBC Radio 1 | UK | RADIO | UK hitlijsten |
| BBC Radio 2 | UK | RADIO | UK hitlijsten/evergreens |

### Functionele regels
- Voor nieuwe importruns is omroep/zender bij voorkeur verplicht op runniveau.
- Voor bestaande data mag tijdelijk `Onbekend / nog te bepalen` gebruikt worden.
- Bij export wordt `omroep_key` uit staging overgenomen naar `hitlijsten`.
- De UI-labelnaam wordt bij voorkeur **Omroep / zender**, zodat zowel publieke omroepen als radiostations logisch passen.

---

## 2. Muziekperiode / decenniumcategorie

### Functionele behoefte
Een hitlijst kan betrekking hebben op één muziekdecennium of op een bredere periodecategorie zoals all-time, jaarlijst of themalijst. Functioneel krijgt één hitlijstregel precies één periodecategorie.

### Voorgestelde hulptabel
`hitlijst_perioden`

Voorgestelde velden:

| Veld | Type/rol | Toelichting |
|---|---|---|
| `periode_key` | PK | technische sleutel |
| `periode_code` | uniek / verplicht | korte code zoals `70S` of `ALLTIME` |
| `periode_naam` | verplicht | label in de UI |
| `periode_type` | verplicht | DECADE, ALLTIME, YEAR, THEME, GENRE, OTHER |
| `start_jaar` | optioneel | beginjaar bij decennium |
| `eind_jaar` | optioneel | eindjaar bij decennium |
| `sort_order` | verplicht | volgorde in dropdowns |
| `actief` | boolean | beschikbaar in UI |
| `created_at` | audit | aanmaakdatum |
| `updated_at` | audit | wijzigingsdatum |

### Nieuwe velden op staging en definitief

- `staging_hitlijsten.periode_key`
- `hitlijsten.periode_key`

Beide verwijzen naar `hitlijst_perioden.periode_key`.

### Initiële seeddata

| periode_code | periode_naam | periode_type | start_jaar | eind_jaar | sort_order |
|---|---|---|---:|---:|---:|
| ONBEKEND | Onbekend / nog te bepalen | OTHER |  |  | 0 |
| 50S | Jaren 50 | DECADE | 1950 | 1959 | 50 |
| 60S | Jaren 60 | DECADE | 1960 | 1969 | 60 |
| 70S | Jaren 70 | DECADE | 1970 | 1979 | 70 |
| 80S | Jaren 80 | DECADE | 1980 | 1989 | 80 |
| 90S | Jaren 90 | DECADE | 1990 | 1999 | 90 |
| 00S | Jaren 00 | DECADE | 2000 | 2009 | 100 |
| 10S | Jaren 10 | DECADE | 2010 | 2019 | 110 |
| 20S | Jaren 20 | DECADE | 2020 | 2029 | 120 |
| ALLTIME | All-time greatest | ALLTIME |  |  | 900 |
| JAARLIJST | Jaarlijst | YEAR |  |  | 910 |
| THEMA | Themalijst | THEME |  |  | 920 |
| GENRE | Genrelijst | GENRE |  |  | 930 |
| OVERIG | Overig | OTHER |  |  | 999 |

### Functionele regels
- Er wordt geen nepdecennium gebruikt voor all-time-lijsten.
- `ALLTIME` is een expliciete categorie.
- Bij export wordt `periode_key` uit staging overgenomen naar `hitlijsten`.
- Voor bestaande data kan tijdelijk `ONBEKEND` gebruikt worden.

---

## 3. Discogs master/release-verrijking

### Functionele behoefte
Vanuit een stagingrij moet gezocht kunnen worden in Discogs om een passende master release of concrete release te koppelen. Omdat Discogs meerdere resultaten kan opleveren, kiest de gebruiker handmatig het juiste resultaat.

### Opslagprincipe
Sla zowel Discogs keys als URL's op.

Reden:
- de key maakt API-hergebruik, caching en latere verrijking mogelijk;
- de URL maakt de data direct bruikbaar en controleerbaar voor gebruikers;
- als Discogs API-gedrag wijzigt, blijft de opgeslagen URL nog steeds waardevol;
- als een gebruiker handmatig een URL heeft maar geen key, kan de link toch al worden bewaard.

### Nieuwe Discogs-velden op staging en definitief

Minimaal aanbevolen:

| Veld | Toelichting |
|---|---|
| `discogs_master_id` | Discogs master-id, indien gekozen/beschikbaar |
| `discogs_master_url` | URL naar Discogs masterpagina |
| `discogs_master_title` | titel zoals Discogs die toont |
| `discogs_master_artist` | hoofdartiest zoals Discogs die toont |
| `discogs_master_year` | jaar van de master, indien beschikbaar |
| `discogs_release_id` | optionele concrete release-id |
| `discogs_release_url` | optionele URL naar concrete release |
| `discogs_release_title` | optionele release-titel |
| `discogs_release_format` | bijvoorbeeld Album, Single, Maxi-Single, EP |
| `discogs_release_country` | land van de gekozen release |
| `discogs_release_year` | releasejaar |
| `discogs_selected_at` | wanneer de gebruiker de koppeling koos |
| `discogs_selected_by` | optioneel, later bruikbaar bij gebruikers/audit |

### Relatie met bestaand veld
Het bestaande veld `hl_discogs_link` kan voorlopig blijven bestaan als legacy/handmatige link. Nieuwe functionaliteit gebruikt bij voorkeur de gestructureerde velden hierboven.

Voorstel:
- `hl_discogs_link` blijft zichtbaar als bestaande handmatige link.
- Bij keuze van een Discogs master/release wordt deze link niet blind overschreven zonder bevestiging.
- Op termijn kan `hl_discogs_link` functioneel worden vervangen door `discogs_master_url` / `discogs_release_url`.

### Zoek- en selectieflow
1. Gebruiker klikt bij een stagingrij op **Zoek in Discogs**.
2. De zoekquery wordt standaard opgebouwd uit correcte artiest + correcte titel.
3. Resultaten worden getoond in een modal.
4. Gebruiker kan filteren op type/formaat, bijvoorbeeld Master, Release, Album, Single, Maxi-Single, EP, Extended.
5. Gebruiker kiest de juiste master of release.
6. De app slaat zowel key als URL op in staging.
7. Bij export worden de Discogs-velden 1-op-1 meegenomen naar `hitlijsten`.

### Functionele regels
- Discogs-verrijking is optioneel en blokkeert export niet.
- Er wordt nooit automatisch een resultaat gekozen zonder bevestiging.
- Als alleen een URL bekend is, mag die worden opgeslagen zonder key.
- Als een key bekend is, moet de URL ook worden opgeslagen of herleidbaar zijn.
- De app moet latere correctie/vervanging van de gekozen Discogs-koppeling toestaan.

---

## 4. Exportmapping

Bij export worden de nieuwe velden overgenomen:

| Van staging | Naar hitlijsten |
|---|---|
| `omroep_key` | `omroep_key` |
| `periode_key` | `periode_key` |
| `discogs_master_id` | `discogs_master_id` |
| `discogs_master_url` | `discogs_master_url` |
| `discogs_master_title` | `discogs_master_title` |
| `discogs_master_artist` | `discogs_master_artist` |
| `discogs_master_year` | `discogs_master_year` |
| `discogs_release_id` | `discogs_release_id` |
| `discogs_release_url` | `discogs_release_url` |
| `discogs_release_title` | `discogs_release_title` |
| `discogs_release_format` | `discogs_release_format` |
| `discogs_release_country` | `discogs_release_country` |
| `discogs_release_year` | `discogs_release_year` |

---

## 5. Backlogkoppeling

- BL-IMP-056 — Omroepenbeheer en omroepkoppeling inclusief seeddata
- BL-IMP-057 — Muziekperiode/decenniumcategorie inclusief seeddata
- BL-IMP-058 — Discogs master/release zoek- en selectieflow
- BL-IMP-059 — Discogs API technisch onderzoek, caching en rate limiting
- BL-IMP-060 — Copy correcte artiest/titel naar klembord
- BL-IMP-061 — Database-uitbreiding Discogs keys en URL's op staging en hitlijsten

## Migration execution requirement

Sprint 2F-A database changes must be delivered with a docker-proof migration script. The migration script must support the established local development convention where PostgreSQL runs in Docker as `my-postgresdb`, exposed on host port `5433` and internally reachable on container port `5432`.

Required behavior:

- auto-detect running Docker container `my-postgresdb`, unless `DB_CONTAINER_NAME` overrides it;
- copy the SQL migration into the container;
- normalize `localhost:5433`, `127.0.0.1:5433` or `host.docker.internal:5433` to `127.0.0.1:5432` when running `psql` inside the container;
- redact passwords in logged database URLs;
- support explicit `MIGRATION_MODE=docker`, `MIGRATION_MODE=host` and default `MIGRATION_MODE=auto`.
