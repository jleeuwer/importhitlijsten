# Release Notes — 2H-I Fix 1 Correctieknop bij Save-only rijen

## Fix

De post-export correctieactie is nu ook beschikbaar voor rijen die geen **Edit**-knop tonen en alleen **Save** hadden.

## Gedrag

- **Edit** blijft zichtbaar voor rijen met blocking/diagnostics-signalen.
- **Correctie** is apart beschikbaar in de actiekolom.
- Klik op **Correctie** opent direct de sectie **Correctie na export**.

## Tests

Toegevoegd aan `tests/react/EditPostExportCorrection.test.jsx`.
