# Functional test cases — Sprint 2H-X Edit-scherm tabel polish

Deze testcases dienen als basis voor geautomatiseerde tests bij de codebouw.

## TC-2HX-001 — Regel zonder Discogs-link toont geen link

**Given** een tabelregel zonder `discogs_release_url`, zonder `discogs_master_url` en zonder veilige raw Discogs-link  
**When** de Edit-tabel wordt getoond  
**Then** wordt er geen klikbare Discogs-link getoond voor die regel.

## TC-2HX-002 — Regel met release-url toont klikbare link

**Given** een tabelregel met `discogs_release_url`  
**When** de Edit-tabel wordt getoond  
**Then** toont de regel een klikbare Discogs-link  
**And** de link verwijst naar `discogs_release_url`.

## TC-2HX-003 — Regel met master-url toont klikbare link

**Given** een tabelregel zonder `discogs_release_url` maar met `discogs_master_url`  
**When** de Edit-tabel wordt getoond  
**Then** toont de regel een klikbare Discogs-link  
**And** de link verwijst naar `discogs_master_url`.

## TC-2HX-004 — Release-url heeft voorkeur boven master-url

**Given** een tabelregel met zowel `discogs_release_url` als `discogs_master_url`  
**When** de Edit-tabel wordt getoond  
**Then** gebruikt de klikbare link de release-url.

## TC-2HX-005 — Link opent veilig extern

**Given** een tabelregel met een Discogs-link  
**When** de link wordt gerenderd  
**Then** bevat de link `target="_blank"`  
**And** bevat de link `rel="noopener noreferrer"`.

## TC-2HX-006 — Ongeldige raw link wordt niet getoond

**Given** een tabelregel met `hl_discogs_link = "javascript:alert(1)"`  
**When** de Edit-tabel wordt getoond  
**Then** wordt deze waarde niet als klikbare link getoond.

## TC-2HX-007 — Veilige raw Discogs-link kan als fallback worden gebruikt

**Given** een tabelregel zonder gestructureerde URL maar met `hl_discogs_link = "https://www.discogs.com/master/123"`  
**When** de Edit-tabel wordt getoond  
**Then** wordt een klikbare Discogs-link getoond.

## TC-2HX-008 — Artist-key is niet zichtbaar

**Given** de API-data bevat een artist-key  
**When** de Edit-tabel wordt getoond  
**Then** is er geen zichtbare kolom met artist-key.

## TC-2HX-009 — Artist-key blijft intern beschikbaar

**Given** een regelactie gebruikt intern de artist-key  
**When** de gebruiker een bestaande actie uitvoert, zoals matchen of corrigeren  
**Then** blijft de actie functioneren.

## TC-2HX-010 — Geen regressie op export

**Given** een hitlijst met regels, inclusief Discogs-links  
**When** de gebruiker de bestaande exportflow uitvoert  
**Then** wordt de export niet beïnvloed door de tabelweergavewijziging.
