# Release notes — Sprint 2H-J Fix 2

## Titel

Sluitbare preview- en alertpanelen voor jaarverrijking.

## Wijzigingen

- Het paneel na **Preview jaarverrijking** is nu sluitbaar.
- De knop **Sluiten** is alleen zichtbaar als het jaarverrijkingpaneel zichtbaar is.
- Na sluiten verdwijnt het paneel inclusief sluitknop.
- Opnieuw klikken op **Preview jaarverrijking** toont het paneel opnieuw met actuele previewdata.
- Resultaatfeedback na **Jaarverrijking toepassen** gebruikt hetzelfde sluitbare paneel.

## Ongewijzigd

- Jaarverrijking blijft staging-only.
- `hitlijsten` wordt niet bijgewerkt in deze flow.
- `file_details`, `fd_key` en `hl_samenstel_fd_key` blijven ongewijzigd.
- De bestaande knop **Preview jaarverrijking** blijft de ingang.

## Validatie

```bash
npm run test:sprint2h-j
npm run build
```

Beide commando's zijn succesvol uitgevoerd.
