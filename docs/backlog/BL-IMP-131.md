# BL-IMP-131 — Repair bestaande geëxporteerde runs met foutieve aandacht-nodig status

## Status

Open — opgenomen in Sprint 2H-Y design.

## Probleem

Er kunnen bestaande runs zijn die al succesvol geëxporteerd zijn, maar nog steeds de foutieve status “aandacht nodig” tonen door niet-blokkerende warnings of oude statuslogica.

## Functionele wens

Gebruiker moet bestaande runs veilig kunnen repareren zonder inhoudelijke data te wijzigen.

## Scope

- Preview van reparatie-effect.
- Apply-flow die alleen status/diagnostic flags bijwerkt.
- Geen wijziging aan hitlijstinhoud, posities, artiesten, titels of Discogs-links.
- Audit/provenance voor uitgevoerde repair.

## Acceptatiecriteria

1. Preview toont welke runs gewijzigd zouden worden.
2. Apply past alleen statusvelden/diagnostic flags aan.
3. Runs met blocking errors worden niet ten onrechte als geëxporteerd gemarkeerd.
4. Repair is idempotent.
5. Repair is auditeerbaar.
