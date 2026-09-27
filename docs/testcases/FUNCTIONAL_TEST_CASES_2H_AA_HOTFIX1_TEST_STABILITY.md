# Functionele testcases — 2H-AA Hotfix 1

**Versie:** 1.2.0

| ID | Scenario | Verwacht resultaat | Automatische dekking |
|---|---|---|---|
| AA-HF1-001 | Directory-scanveld inspecteren | Label `Directory met CSV-bestanden` is programmatisch gekoppeld aan het invoerveld | `static_2h_aa_hotfix1_test_stability` + `ImportDragDropInbox` |
| AA-HF1-002 | Eén CSV via bestandsdialoog toevoegen | Kandidaat wordt geselecteerd en het `Hitlijst name` veld in kandidaatmetadata krijgt focus | `ImportDragDropInbox` |
| AA-HF1-003 | CSV-bestandsnaam staat in inbox én detailpaneel | Test en UI accepteren de twee bewuste representaties zonder ambiguous-query failure | `ImportDragDropInbox` |
| AA-HF1-004 | Edit-paginering 60 rijen | Pagina 1/2, volgende pagina en 25-regels-per-pagina blijven functioneel | `EditPaginationAndTitle` |
| AA-HF1-005 | Edit-paginering 250 rijen | Alleen actieve pagina wordt weergegeven en Volgende toont regels 51-100 | `EditLargeRunRendering` |
| AA-HF1-006 | Nieuwe applicatieversie na historische sprint | Legacy regression tests blokkeren toekomstige SemVer niet met hardcoded 1.1.0 | `static_2h_z_hotfix2_duplicate_row_review` |
