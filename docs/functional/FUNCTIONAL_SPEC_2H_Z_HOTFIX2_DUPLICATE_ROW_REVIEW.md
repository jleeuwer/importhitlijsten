# Functioneel ontwerp — 2H-Z Hotfix 2 / BL-IMP-136

## Doel
De gebruiker kan na import dubbele stagingregels vinden, controleren, uitsluiten of fysiek verwijderen zonder automatische dataverwijdering.

## Duplicate-definitie
Binnen één `import_run` is een rij een duplicate wanneer minimaal één andere rij dezelfde genormaliseerde combinatie `artiest + titel` heeft. Positie beïnvloedt deze conclusie niet.

## User stories
- Als gebruiker wil ik dubbele rijen expliciet kunnen zoeken zodat een vervuilde import zichtbaar wordt.
- Als gebruiker wil ik per duplicategroep zien welke regels betrokken zijn en op welke posities zij staan.
- Als gebruiker wil ik zelf bepalen welke regel blijft bestaan.
- Als gebruiker wil ik geselecteerde rijen op `Skip` kunnen zetten zonder ze fysiek te verwijderen.
- Als gebruiker wil ik geselecteerde rijen na bevestiging fysiek uit staging kunnen verwijderen.
- Als beheerder wil ik fysieke deletes kunnen herleiden via een audittrail.

## Acceptatiecriteria
1. Detectie wordt alleen uitgevoerd voor de huidige import-run.
2. Gelijke artiest+titel op verschillende posities is een duplicate.
3. Geen automatische delete tijdens detectie.
4. Review toont alle regels in de duplicategroep.
5. Minimaal één rij per groep moet behouden blijven.
6. Skip verandert alleen `fd_action` naar `Skip`.
7. Fysieke delete vereist expliciete bevestiging.
8. Fysieke delete is transactioneel en schrijft vóór delete een auditrecord.
9. `file_details` en de bron-CSV worden niet gewijzigd.
10. `import_runs.ir_row_count` wordt na fysieke delete opnieuw gesynchroniseerd met het actuele aantal stagingregels.
11. Na actie wordt het Edit-overzicht vernieuwd.
12. De functie is geblokkeerd nadat de run al is geëxporteerd, conform bestaande pre-export guards.
