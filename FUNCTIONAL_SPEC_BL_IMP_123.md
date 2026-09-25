# Functional Spec — BL-IMP-123

## Probleem

In `file_details` lijken meerdere songs dubbel aanwezig met dezelfde gewenste versie per hitlijst. Het is onduidelijk of dit historische vervuiling is of opnieuw ontstaat bij Importhitlijst → export naar `hitlijsten`.

## Gewenste functionele regel

De export naar `hitlijsten` mag uitsluitend bestaande, gevalideerde `file_details`/song-records refereren. De export mag geen nieuwe `file_details` records aanmaken. Ontbrekende of ambigue gewenste versies moeten blokkeren of review vragen.

## Oplevering

BL-IMP-123 levert diagnostics om dit aantoonbaar te maken:

- functionele duplicategroepen in `file_details`;
- gebruik via `hitlijsten.fd_key`;
- gebruik via `hitlijsten.hl_samenstel_fd_key`;
- voor/na-export baseline op `file_details_count`, `max_fd_key` en timestamps.
