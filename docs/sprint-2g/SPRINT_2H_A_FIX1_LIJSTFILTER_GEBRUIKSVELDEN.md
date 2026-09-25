# Sprint 2H-A Fix 1 — Lijstfilter beperken tot gebruikersvelden

## Aanleiding

Na oplevering van 2H-A is vastgesteld dat het vrije lijstfilter te technisch was. Velden zoals fysieke filename, Discogs-link, find-cmd en artist-key zijn niet nodig voor de normale verwerking van de lijst.

## Wijziging

Het vrije lijstfilter zoekt nu alleen nog in functionele gebruikersvelden:

- positie;
- artiest;
- correcte artiest;
- titel;
- correcte titel;
- jaar.

De placeholder is aangepast naar:

```text
positie, artiest, titel, jaar…
```

## Testimpact

De React-test voor lijstfilters is aangepast zodat technische velden niet meer matchen in het vrije lijstfilter.
