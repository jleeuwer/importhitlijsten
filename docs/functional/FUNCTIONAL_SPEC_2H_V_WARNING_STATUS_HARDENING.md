# Functional Spec — 2H-V Warning/status hardening

## FR-2HV-001 — Blocking issues blokkeren export

Een run met blocking issues mag niet exporteren. Voorbeelden: geen match, meerdere kandidaten zonder gebruikerskeuze, invalid data of expliciete review required.

## FR-2HV-002 — Non-blocking warnings blokkeren export niet

Een run met alleen warnings mag exporteren. Voorbeelden: encoding warning, Discogs warning of normalisatie-warning.

## FR-2HV-003 — Succesvolle export zonder warnings

Na succesvolle export zonder warnings wordt de run zichtbaar als **Geëxporteerd**.

## FR-2HV-004 — Succesvolle export met warnings

Na succesvolle export met alleen non-blocking warnings wordt de run zichtbaar als **Geëxporteerd met waarschuwingen**. De run mag niet langer actief op **aandacht nodig** staan.

## FR-2HV-005 — Warningdetails blijven zichtbaar

Warnings mogen na export zichtbaar blijven als informatie, maar zijn niet langer actieve blockers.

## FR-2HV-006 — Encoding warning recalculatie

Na handmatige correctie wordt de encoding warning opnieuw berekend op de actuele gecorrigeerde tekst.

## FR-2HV-007 — Encoding warning verdwijnt na schone correctie

Als de gecorrigeerde tekst geen encoding-warning meer bevat, wordt de actieve warning verwijderd/opgelost.

## FR-2HV-008 — Encoding warning blijft als probleem blijft bestaan

Als de gecorrigeerde tekst nog steeds verdacht is, blijft de warning bestaan met een actuele reden.

## FR-2HV-009 — Geen save bij repairable rows = 0

Als de encoding preview `damaged rows > 0` en `repairable rows = 0` meldt, mag geen save/overwrite plaatsvinden.

## FR-2HV-010 — Expliciete bevestiging voor free overwrite

Een free overwrite zonder gekozen `file_details` candidate is alleen toegestaan na expliciete bevestiging.

## FR-2HV-011 — Geen stacktrace in UI

Technische fouten zoals `Manual free overwrite requires explicit confirmation` worden vertaald naar een functionele melding.

## FR-2HV-012 — Repair bestaande exportstatussen

Bestaande runs die succesvol geëxporteerd zijn maar nog op aandacht nodig staan, kunnen via preview/apply worden gerepareerd als ze geen blocking issues hebben.
