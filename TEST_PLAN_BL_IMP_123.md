# TEST_PLAN — BL-IMP-123

## Automatische test

```bash
npm run test:bl-imp-123
```

Valideert statisch dat:

- diagnostics SQL aanwezig is;
- Docker-runner aanwezig en executable is;
- SQL read-only blijft;
- referenties naar `hitlijsten.fd_key` en `hl_samenstel_fd_key` aanwezig zijn;
- baseline voor/na-export controle aanwezig is;
- documentatie aanwezig is.

## Functionele test

1. Run diagnostics vóór export.
2. Voer Importhitlijst-export uit op een lijst die volledig gematcht is.
3. Run diagnostics opnieuw.
4. Vergelijk baselinewaarden.
5. Als `file_details_count` stijgt door export alleen, is de exportflow verdacht.

## Acceptatie

BL-IMP-123 is geaccepteerd als:

- het script succesvol draait op de Docker PostgreSQL-container;
- er een logbestand ontstaat;
- het logbestand voldoende informatie bevat om historisch versus actueel te onderscheiden;
- er geen datamutaties plaatsvinden.
