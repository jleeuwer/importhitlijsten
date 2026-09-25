# Target behavior — Importhitlijst startapp.sh

## Definitieve bestandsnaam

```text
startapp.sh
```

Niet:

```text
startapp_importhitlijst_robust.sh
```

De eerdere robuuste variant was inhoudelijk bruikbaar als basis, maar de bestandsnaam moet in toekomstige opleveringen aansluiten op de gebruikersomgeving.

## Voorbeeldgebruik

```bash
chmod +x startapp.sh
./startapp.sh build
./startapp.sh validate test
./startapp.sh --commands build,validate,test
./startapp.sh --keep-days 14 install build validate test
./startapp.sh all
```

## Belangrijkste verschillen met de oorspronkelijke Importhitlijst-versie

Oorspronkelijk werden alle stappen direct uitgevoerd zodra het script werd gestart. Dat is niet meer gewenst.

De nieuwe opzet:

- voert niets uit zonder expliciete actie;
- ondersteunt selectie van stappen;
- schrijft per stap een log;
- gebruikt Artist-achtige parsing en taakvolgorde;
- behoudt Importhitlijst-specifieke npm-scripts.

## Belangrijkste verschillen met Artist

Importhitlijst heeft een extra actie:

```text
validate → npm run validate
```

Daarnaast gebruikt Importhitlijst:

```text
build:all in plaats van build
test:e2e in plaats van test:all
dev:5174 in plaats van dev
```
