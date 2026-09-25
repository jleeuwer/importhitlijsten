# BL-IMP-130-Fix-1 — Encoding warning blijft zichtbaar na handmatig herstellen

## Status

Gebouwd in Sprint 2H-Y Hotfix 3.

## Probleem

Na `Edit → Handmatig herstellen → handmatig song/artiest zoeken` kon de UI een warning tonen:

```text
RECOVERABLE_ENCODING_DAMAGE
```

terwijl de actuele/resolved waarden schoon waren.

## Voorbeeld

```text
Coldcut Featuring Yazz And The Plastic Population
Doctorin' The House
```

Deze tekst bevat geen zichtbare mojibake en mag niet als encoding-schade worden aangemerkt.

## Oorzaak

De encoding-detectie interpreteerde iedere wijziging door algemene tekstnormalisatie als mogelijke encoding repair. Daardoor konden trimmen, NBSP-normalisatie of HTML entity decoding leiden tot een foutieve `RECOVERABLE_ENCODING_DAMAGE` waarschuwing.

## Oplossing

`detectEncodingDamage()` is aangescherpt:

- echte mojibake blijft warning/recoverable;
- replacement character blijft damage/blocking;
- algemene normalisatieverschillen zijn geen encoding-warning meer.

## Acceptatiecriteria

- Schone handmatige keuze toont geen `RECOVERABLE_ENCODING_DAMAGE`.
- `BelgiÃ«` blijft herstelbaar naar `België`.
- `Belgi�` blijft als replacement-char damage zichtbaar.
- De manual repair flow retourneert na schone keuze `status: ok` en `reasonCode: null`.
