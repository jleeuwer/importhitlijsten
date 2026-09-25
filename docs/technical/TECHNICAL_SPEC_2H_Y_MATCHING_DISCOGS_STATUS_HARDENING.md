# Technische specificatie — Sprint 2H-Y

## 1. Candidate matching contract

Introduceer of formaliseer een matchresultaatstructuur:

```ts
interface MatchCandidateResult {
  stagingId: string | number;
  status: 'NO_MATCH' | 'AUTO_MATCHED' | 'AMBIGUOUS' | 'MANUAL_MATCHED';
  selectedFileDetailsKey?: number;
  candidates: Array<{
    fdKey: number;
    artist: string;
    title: string;
    songTypeKey?: number;
    versionYear?: number;
    publicationYear?: number;
    discogsUrl?: string;
    score?: number;
    reasons: string[];
  }>;
  blocking: boolean;
}
```

Technische regel:

- `candidates.length === 1` en confidence voldoende → `AUTO_MATCHED`.
- `candidates.length > 1` → `AMBIGUOUS`, blocking.
- Gebruikerskeuze → `MANUAL_MATCHED` met audit.

## 2. Export guard

Export moet vooraf controleren:

- blocking validation errors;
- ambiguous candidate status;
- ontbrekende expliciete keuze bij meerdere kandidaten;
- onveilige Discogs raw links indien mapping verplicht is.

Export mag niet doorgaan wanneer blocking issues bestaan.

## 3. Discogs mapping

Voorkeursvolgorde voor links:

1. `discogs_release_url`
2. `discogs_master_url`
3. veilige parsebare `hl_discogs_link`

Raw links mogen alleen geaccepteerd worden als:

- protocol `https` is;
- host overeenkomt met `discogs.com` of `www.discogs.com`;
- path herkenbaar is als master of release.

## 4. Geen automatische promotie naar `file_details`

Een export naar `hitlijsten` mag niet impliciet `file_details.fd_discogs` bijwerken.

Voor latere promotie is een aparte service gewenst:

```text
DiscogsPromoteReviewService
```

met preview, diff, expliciete bevestiging en audit.

## 5. Encoding/status services

Aanbevolen services of modules:

```text
encodingRepairService
statusClassificationService
exportStatusRepairService
candidateAmbiguityService
discogsLifecycleDiagnosticService
```

Belangrijke technische scheiding:

- validation/warning berekenen;
- status classificeren;
- export blokkeren;
- repair preview/apply uitvoeren.

## 6. Database richting codebouw

Mogelijke tabellen/velden in latere codebouw:

```sql
-- Voorbeeldrichting, nog geen definitieve migratie
candidate_review_status
candidate_review_audit
discogs_lifecycle_audit
export_status_repair_audit
```

Voor codebouw moet eerst de actuele database worden geïnspecteerd. Migraties moeten Docker/PostgreSQL-vriendelijk zijn en uitgaan van container `my-postgresdb` in documentatie/scripts.

## 7. Codebouw 2026-09-07

Deze sprint is nu doorvertaald naar concrete code.

### Exportvalidatie

`models/hitlijsten.js` bepaalt de exporteerbaarheid per stagingregel opnieuw met een variant-aware combined candidate count:

```text
fd_tag_title + hl_artist_key + optioneel hl_desired_song_type_key
```

Als `hl_desired_song_type_key` gevuld is, telt alleen `file_details.fd_song_type_key = hl_desired_song_type_key` mee. Als daarna nog steeds meerdere kandidaten bestaan, is de regel blocking met reason code:

```text
MULTIPLE_FILE_DETAILS_COMBINED_MATCHES
```

De export mag dan niet doorgaan. Hiermee is het oude gedrag, waarbij `JOIN LATERAL ... LIMIT 1` stilzwijgend de eerste kandidaat koos, beveiligd door een voorafgaande blocking check.

### Discogs lifecycle

De export schrijft Discogs-informatie uitsluitend naar `hitlijsten` metadata:

```text
hitlijsten.discogs_master_url
hitlijsten.discogs_release_url
```

Safe raw fallback vanuit `staging_hitlijsten.hl_discogs_link` wordt alleen gebruikt voor herkenbare HTTPS Discogs master/release URL's. Er is geen automatische update naar `file_details.fd_discogs`.

### Encoding/status hardening

Automatische batch-acties voor encoding repair en tekstnormalisatie geven intern `manualOverwriteConfirmed: true` mee. Dit is toegestaan omdat de gebruiker de batchactie expliciet start. De manual free overwrite guard blijft bestaan voor vrije handmatige correcties.

API-fouten onder `/api/*` worden als JSON teruggegeven en lekken geen development stacktrace meer naar de client.

### Database

Er is geen destructieve schemawijziging. De 2H-Y migratie voegt database-comments en een release-marker toe:

```text
scripts/sql/20260907_sprint2h_y_matching_discogs_status_hardening.sql
```

Diagnostische queries zijn toegevoegd voor ambiguity en Discogs lifecycle.
