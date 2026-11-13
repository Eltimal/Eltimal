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
| A4 ter | Incidents d'audience et cartes en gestes toujours disponibles ; même débats pour les audiences sur convocation | Plus de boîte de choix qui annonce le moment | Fait (13 nov.) : débats intégraux sur convocation ; parole et pièces en gestes toujours disponibles, sans invite (`tplaidoirie`) |
| A5 | Lot 6 partiel : fin des signaux « bon / mauvais » pendant les scènes refaites ; débrief en corrigé d'examen | Aucun signal dans les scènes A1 à A4 (`tplaidoirie` le vérifie sur le texte affiché) | Fait (13 nov.) : audience, délibéré, débrief (ce qu'il fallait demander, raisonnement du tribunal, peine et ses motifs avec ce que la défense n'a pas produit) |

## Phase B — le métier écrit

| # | Livrable | Critère de fin |
|---|---|---|
| B1 | Lot 5 : canaux de transmission | Chaque acte part par un canal ; mauvais canal = irrecevabilité motivée — **fait (13 nov.)**, `tcanaux` |
| B1 bis | Lot 5 suite : écrans e-Barreau (annuaire des CEP, accusé de réception, pièces jointes, PLEX), adresse hors liste = irrecevable | Envoi depuis le poste de travail du cabinet — **fait (13 nov.)** : poste e-Barreau complet sur l'ordinateur du cabinet (`tebarreau`), d'après les écrans de démonstration du CNB transmis par Kevin ; e-Partage (PLEX) fait : copie du dossier demandée par e-Barreau, lien qui expire (`tplex`) |
| B2 | Actes par clauses (fin des blancs à deux options) | `tplcheck` refait : aucune option devinable par l'ordre ou la longueur — **en cours** : ordre mélangé, fonds commun (`clauses.js`, `tclauses`) ; **fait (13 nov.)** : clauses voisines (`K.voisine`) et options fausses réécrites à longueur égale dans les gabarits communs : bonne option la plus longue 15 % (85 % au départ) |

## Phase C — l'économie et la progression

| # | Livrable | Critère de fin |
|---|---|---|
| C1 | Étalons : aide juridictionnelle, honoraires, cotisations, peines prononcées | Chiffres sourcés (« vérifié » / « estimation ») — **fait en partie (13 nov.)** : peines (`peines.js`), aide juridictionnelle (UV 36 €, moyennes Unca) ; charges du cabinet en estimations déclarées |
| C2 | Lot 6 bis : économie du cabinet recalée | Carrière simulée d'un an cohérente (trésorerie, dossiers, réputation) — **mesuré (13 nov.)**, `tecono` : sans activité, faillite au jour 119 ; point mort à 11 gardes à vue par mois ; 4,8 dossiers proposés par mois. Reste : la réputation sur un an, les honoraires réels |
| C3 | Grille de compétences et mode assisté | Classeur à jour, autonomie par compétence — **fait (13 nov.)** : 14 compétences, niveaux assisté / libre / examen gagnés sans aide, bilan au débrief, onglet du classeur (`competences.js`, `tcomp`). L'aide reste le choix du joueur (D-57) |

## Phase D — élargir

Lot 7 — **commencé (13 nov.)** : délibéré criminel élément par élément (`tcrimes`), peine criminelle choisie et motivée (`tpeinescrime`), mémoire devant la chambre de l'instruction (`tmemoirechins`), dossier criminel enrichi (`tcrimdossier` : 20 pièces au lieu de 14), confrontation jouée au compositeur (`tconfront`), interrogatoire au fond joué (`tinterro`), sous-dossiers D, B, C et interrogatoire de curriculum vitae (D-73) ; correction : un enjeu n'est fort que si le dossier le soutient (D-68). Lot 1 ter (toutes les familles d'infractions au niveau de l'arrachage — **commencé le 13 nov.** : vol en magasin (`tmagasin`), vol dans le métro (`ttransport`), vol à la tire (`ttire`), vol de deux-roues (`t2roues`), point de deal et guetteur (`tdeal`), détention en flagrance (`tdetention`), outrage (`toutrage`), rébellion (`trebellion`), violences conjugales au domicile (`tconjugal`), appels malveillants (`tappels`), escroquerie (relevé daté, `treleve`), cambriolage (`tcambriolage`), refus d'obtempérer (`tobtemperer`), délit de fuite (`tfuite`), recel (`trecel`), dégradations (`tdegradations`), violation de domicile (`tviolation`), abus de confiance (`tabus`), vol chez l'employeur (`tvestiaire`), harcèlement (`tharcelement`) ; pièces techniques : rapport du laboratoire (`tlabo`), images (`timages`), téléphonie (`ttelephonie`), captures (`tcaptures`), relevés bancaires (`treleve`), ADN (`tadn`), fichier des permis (`tpermis`), expertises (`texpertise`) alcoolémie et toxicologie routière (datées, contenu inchangé) ; garde-fou `tcatalogue` : 2 % des affaires gardent une pièce ancienne (autopsie, urgences du pilote, isolées) ; puis captures, alcoolémie ; suivent la livraison de stupéfiants, l'usage, le vol chez l'employeur et au préjudice d'une personne vulnérable (enquête préliminaire), puis la route ; vol chez l'employeur, puis stupéfiants), lot 7 (instruction et assises), lot 8 (après jugement, victimes), lot 9 (bibliothèque), lot 10 (affaires écrites et tutoriel).

## Risques suivis

- **Deux sessions sur les mêmes fichiers** (`ui-*.js`) : partir toujours de la branche la plus avancée, fusionner avant de commencer.
- **Équilibrage** : tout nouveau calcul de verdict ou de peine se compare à l'ancien sur 1 000 affaires avant d'entrer en jeu.
- **Régressions** : les parties automatiques jouent en mode liste ; chaque lot ajoute son test. `dev/tools/batterie.js` les fait tourner en parallèle (rapide : 43 tests en 70 s ; complète : environ 3 min, contre 20 à 25 min en série).
