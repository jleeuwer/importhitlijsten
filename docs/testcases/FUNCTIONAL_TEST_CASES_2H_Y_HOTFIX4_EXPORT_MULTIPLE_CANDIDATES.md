# Functionele testcases — 2H-Y Hotfix 4

| ID | Situatie | Verwacht resultaat |
|---|---|---|
| HF4-001 | Artiest+titel komt 0 keer voor in `file_details` | Export blokkeert met `NO_FILE_DETAILS_COMBINED_MATCH` |
| HF4-002 | Artiest+titel komt 1 keer voor in `file_details` | Export toegestaan |
| HF4-003 | Artiest+titel komt meerdere keren voor in `file_details` | Export toegestaan met warning `MULTIPLE_FILE_DETAILS_COMBINED_MATCHES` |
| HF4-004 | Lijst met veel long versions/mixen | Export blokkeert niet puur door meerdere varianten |
| HF4-005 | `hl_desired_song_type_key` is leeg | Export valideert alsnog op artiest+titel |
| HF4-006 | `hl_desired_song_type_key` is gevuld | Export mag gewenste song_type prefereren voor technische `fd_key`, maar niet blokkeren als er andere artiest+titel matches zijn |
| HF4-007 | Discogs master/release link aanwezig | Link blijft als hitlijstmetadata bewaard |
| HF4-008 | Samenstellen hitlijst | Definitieve song_type/variantkeuze gebeurt pas hier via prioriteit |
