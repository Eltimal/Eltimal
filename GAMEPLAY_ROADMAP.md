# La Permanence — feuille de route de la refonte du gameplay

Ordre de travail décidé par la direction du chantier (mandat du 13 novembre 2026 : autonomie jusqu'à la livraison). La conception de référence reste `dev/ref/refonte-gameplay.md` ; ce fichier dit dans quel ordre on la livre et à quoi on reconnaît qu'un lot est fini.

Principe d'ordonnancement : on termine d'abord la boucle la plus jouée (permanence de garde à vue → comparution immédiate → jugement), de bout en bout, avant d'élargir. Une boucle à moitié refaite est pire qu'une boucle ancienne cohérente.

## Phase A — la boucle de la permanence, de bout en bout

| # | Livrable | Critère de fin | État |
|---|---|---|---|
| A1 | Lot 3 : parole en garde à vue | `tparole` vert, garde à vue jouée dans l'interface | Fait (13 nov.) |
| A2 | Lot 4a : délibéré élément par élément, jugement écrit complet, décision notifiée par le greffe | `ttribunal` vert ; verdicts expliqués ; écarts à l'ancien calcul mesurés et justifiés | Fait (13 nov.) |
| A3 | Lot 3 suite : le procès-verbal d'audition du dossier écrit depuis la transcription jouée ; entretiens hors garde à vue au compositeur | La pièce `pv_audition` reprend mot pour mot les réponses jouées ; `tappel` vert | Fait (13 nov.) |
| A4 | Lot 4b : plaidoirie par le catalogue universel, plan de défense à la barre | `tplaidoirie` vert | Fait (13 nov.) |
| A4 bis | Lot 4b suite : débats intégraux (interrogatoire du président, réquisitoire entier) | Interrogatoire tiré de l'audition, réquisitoire cotant les pièces par élément (`debats.js`, `tplaidoirie`) | Fait (13 nov.) pour la comparution immédiate générée |
| A4 ter | Incidents d'audience et cartes en gestes toujours disponibles ; même débats pour les audiences sur convocation | Plus de boîte de choix qui annonce le moment | À faire |
| A5 | Lot 6 partiel : fin des signaux « bon / mauvais » pendant les scènes refaites ; débrief en corrigé d'examen | Aucun signal dans les scènes A1 à A4 (`tplaidoirie` le vérifie sur le texte affiché) | Fait pour l'audience et le délibéré (13 nov.) ; reste le débrief général de l'affaire |

## Phase B — le métier écrit

| # | Livrable | Critère de fin |
|---|---|---|
| B1 | Lot 5 : canaux de transmission | Chaque acte part par un canal ; mauvais canal = irrecevabilité motivée — **fait (13 nov.)**, `tcanaux` |
| B1 bis | Lot 5 suite : écrans e-Barreau (annuaire des CEP, accusé de réception, pièces jointes, PLEX), adresse hors liste = irrecevable | Envoi depuis le poste de travail du cabinet |
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
