# La Permanence — état réel du gameplay

Tenu par la direction du chantier de refonte. Chaque ligne dit ce qui est **implémenté**, **testé** (un test automatique le couvre) ou **validé** (jugé en jeu, captures comprises). « Ancien » = le système d'avant la refonte, toujours en service.
Référence de conception : `dev/ref/refonte-gameplay.md` (copie de l'onglet du document de conception) ; fiche technique : `dev/README.md`.

Dernière mise à jour : 13 novembre 2026, après les lots 4a et 4b et les entretiens libres.

## Boucle principale du joueur

Cabinet (plan plein écran, objets cliquables) → appel ou client (vivier, permanences) → dossier (pièces, dossier de travail) → garde à vue ou entretien → orientation du parquet → audience → délibéré et jugement → recours, facture, débrief → réputation, carrière.

## Systèmes

| Système | État | Couverture | Défauts connus |
|---|---|---|---|
| Simulation de l'affaire (`sim.js`, `trames-flagrance.js`) | Implémenté pour toute garde à vue (flagrance, préliminaire), audition libre et convocations ; vol par arrachage au niveau détaillé | `tsim` | Les autres délits partent encore des textes du catalogue (lot 1 ter) ; genre `al` joué et affaires sans mesure restent sur l'ancien générateur |
| Moteur de documents (`docs.js`) | Implémenté : trames de procès-verbaux, cotes, feuillets, plafond 2 000 mots, support papier ou numérique | `tsim` | Pièces techniques (éthylomètre, labo, ADN, téléphonie) gardent leur ancien texte |
| Pilote des violences (`sim-violences.js`, `docs-violences.js`) | Référence, branché pour les comparutions immédiates de violences | `tsimv` | Deux moteurs pour un même rôle : à fondre dans `sim.js` |
| Vidéosurveillance (`video.js`, `ui-video.js`) | Extrait joué par le moteur pour l'arrachage vers le métro | `tvideo` | Un seul décor, un seul fait |
| Lecteur en feuillets (`ui-dossier.js`) | Implémenté, ouvert depuis l'onglet Pièces | `tsim` (en partie) | On n'y annote pas encore |
| Dossier de travail (`travail.js`, `ui-travail.js`) | Implémenté : annotations au mot près, sens, marges, liens, chronologie, versions, plan de défense, irrégularité en quatre éléments | `ttravail` | Le plan de défense n'est pas encore lu par l'audience (lot 4b) |
| Parole en garde à vue (`parole.js`, `ui-entretien.js`) | Implémenté : client modélisé, question composée, oral qui s'efface, conseil sujet par sujet, audition intégrale, relecture tirée de la transcription, procès-verbal du dossier écrit depuis l'audition jouée (erreur non rectifiée comprise) | `tparole` | Visages non branchés sur les réponses |
| Entretiens hors garde à vue (`ui-scenes.js` → `UI.CallLibre`) | Implémenté pour les affaires générées en mode libre : compositeur, oral qui s'efface, gestes de décision explicites, jauge de patience masquée (la patience joue toujours) | `tappel` | Affaires écrites et mode assisté : ancienne liste ; « Conclure par des conseils » reste une liste |
| Audience (`ui-court.js`, `flow-audience.js`, scripts des affaires) | **Lot 4b** en mode libre : plus de signal bon/mauvais ; plaidoirie par le catalogue universel des moyens (`PL.CATALOGUE`), plan de défense du dossier de travail affiché à la barre, moyen hors sujet ou sans pièce recadré par le président. Reste ancien : étapes du script, boîtes de choix des incidents, cartes à jouer | `tplaidoirie`, `court.js`, `tplaid`, `tassises` | Débats encore courts (réquisitoire, interrogatoire) ; choix d'incidents à options |
| Délibéré | **Lot 4a** : raisonnement élément par élément pour les délits générés ; débrief en corrigé (ce qui a établi chaque élément, moyens permis non plaidés, pièces écartées) ; ancien calcul pour le reste | `ttribunal`, `tgen` | Affaires écrites et crimes sur l'ancien calcul |
| Jugement écrit | **Lot 4a** : trame complète (cartouche, parties, débats, motifs par élément, dispositif, voies de recours), notifié par le greffe | `ttribunal` | Arrêts et ordonnances sur l'ancien format |
| Peine (`P.calculerPeine`) | Ancien : réquisitions × facteur | `tgen` | À refaire (mécaniques, étalon des peines prononcées) |
| Actes et canaux (`law-fr.js`, `flow-common.js`) | Ancien : 17 actes, blancs à options, « déposer » en un clic | `tplcheck` | Lot 5 (poste de travail, e-Barreau) |
| Économie, cabinet, carrière, équipe | Ancien | `tbill`, `tcarriere`, `tequipe` | Lot 6 bis (étalons à faire) |
| Jauges et guidage | Ancien : énergie, réputations, confiance, signaux | — | Lot 6 |
| Instruction, assises | Ancien | `tgen`, `tassises` | Lot 7 |
| Bibliothèque | Codes reliés, résumés | `tlivre`, `tbiblio` | Lot 9 (texte intégral) |

## Mesures du lot 4a (calibrage contre l'ancien calcul, 4 500 affaires)

| Situation | Condamnations, ancien | Nouveau |
|---|---|---|
| Rien plaidé, sans doute au dossier | 98 % | 99 % |
| Rien plaidé, avec doute au dossier | 97 % | 99 % |
| Tous les doutes plaidés | 71 % | 63 % |
| Nullité obtenue | 84 % | 89 % |
| Doute sur l'identification plaidé | 67 % | 61 % |
| Légitime défense plaidée | 20 % | 13 % |
| Ignorance de la suspension plaidée | 100 % | 44 % (voulu : l'élément moral manque) |

Décisions : `GAMEPLAY_DECISIONS.md`, D-07 à D-14.
