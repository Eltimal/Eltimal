# La Permanence — feuille de route de la refonte du gameplay

Ordre de travail décidé par la direction du chantier (mandat du 13 novembre 2026 : autonomie jusqu'à la livraison). La conception de référence reste `dev/ref/refonte-gameplay.md` ; ce fichier dit dans quel ordre on la livre et à quoi on reconnaît qu'un lot est fini.

Principe d'ordonnancement : on termine d'abord la boucle la plus jouée (permanence de garde à vue → comparution immédiate → jugement), de bout en bout, avant d'élargir. Une boucle à moitié refaite est pire qu'une boucle ancienne cohérente.

## Phase A — la boucle de la permanence, de bout en bout

| # | Livrable | Critère de fin | État |
|---|---|---|---|
| A1 | Lot 3 : parole en garde à vue | `tparole` vert, garde à vue jouée dans l'interface | Fait (13 nov.) |
| A2 | Lot 4a : délibéré élément par élément, jugement écrit complet, décision notifiée par le greffe | `ttribunal` vert ; verdicts expliqués ; taux de relaxe stables (± 5 points) par rapport à l'ancien calcul sur 1 000 affaires | En cours |
| A3 | Lot 3 suite : le procès-verbal d'audition du dossier écrit depuis la transcription jouée | La pièce `pv_audition` reprend mot pour mot les réponses jouées | À faire |
| A4 | Lot 4b : l'audience de comparution immédiate avec des gestes toujours disponibles (exceptions, pièces, garanties, plaidoirie construite depuis le plan de défense) | Plus de boîte de choix qui annonce le moment dans la CI générée ; ordre et longueur des options neutres | À faire |
| A5 | Lot 6 partiel : fin des signaux « bon / mauvais » pendant les scènes refaites ; débrief en corrigé d'examen | Aucun signal dans les scènes A1 à A4 | À faire |

## Phase B — le métier écrit

| # | Livrable | Critère de fin |
|---|---|---|
| B1 | Lot 5 : poste de travail, e-Barreau et canaux pour l'appel, la demande de mise en liberté, les conclusions, la constitution de partie civile | Chaque acte part par un canal ; mauvais canal = irrecevabilité motivée |
| B2 | Actes par clauses (fin des blancs à deux options) | `tplcheck` refait : aucune option devinable par l'ordre ou la longueur |

## Phase C — l'économie et la progression

| # | Livrable | Critère de fin |
|---|---|---|
| C1 | Étalons : aide juridictionnelle, honoraires, cotisations, peines prononcées | Chiffres sourcés (« vérifié » / « estimation ») |
| C2 | Lot 6 bis : économie du cabinet recalée | Carrière simulée d'un an cohérente (trésorerie, dossiers, réputation) |
| C3 | Grille de compétences et mode assisté | Classeur à jour, autonomie par compétence |

## Phase D — élargir

Lot 1 ter (toutes les familles d'infractions au niveau de l'arrachage), lot 7 (instruction et assises), lot 8 (après jugement, victimes), lot 9 (bibliothèque), lot 10 (affaires écrites et tutoriel).

## Risques suivis

- **Deux sessions sur les mêmes fichiers** (`ui-*.js`) : partir toujours de la branche la plus avancée, fusionner avant de commencer.
- **Équilibrage** : tout nouveau calcul de verdict ou de peine se compare à l'ancien sur 1 000 affaires avant d'entrer en jeu.
- **Régressions** : les parties automatiques jouent en mode liste ; chaque lot ajoute son test et fait tourner la batterie (`t1 t2 t3 t4 t15 t20 tsim ttravail tdossier tson tgenjeu` + le test du lot).
