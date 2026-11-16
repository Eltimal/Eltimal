# La Permanence — feuille de route vers la 2.0

16 novembre 2026. Point de départ : la 1.0.0 « Le serment » (`jeu-174`). Sources : `AUDIT_1.0.md` (audit des mécaniques
et relecture des textes). Cette feuille de route remplace l'ordre de travail de `GAMEPLAY_ROADMAP.md` pour la suite ;
les lots déjà commencés là-bas (familles d'infractions, dossier criminel) sont repris ici dans les étapes 1.5 et 1.8.
Le 16 novembre, à la demande de Kevin, la refonte du carnet a pris la place de la 1.2.0 : tout le reste est décalé d'un cran.

## Ce que sera la 2.0

Un jeu qu'un nouveau joueur comprend dès la première nuit, où tout ce qui se dit et s'écrit dans une affaire repose sur
une seule vérité, et où chaque jauge affichée change quelque chose. La numérotation suit `PUBLICATION.md` : une étape de
contenu = une version mineure nommée ; la 2.0 est la refonte d'ampleur.

## Règles communes à toutes les étapes

- Une étape n'est finie que si son critère est mesuré par un test de la batterie.
- Aucun essai de plus de dix minutes sans retour.
- Chaque étape passe par le canal d'essai avant `main`.
- Pas de moteur de gameplay par type d'affaire : une simulation par famille de faits, un moteur de parole par situation.

## Les étapes

| Version | Nom | Contenu | Fini quand |
|---|---|---|---|
| 1.0.1 | (correctif) | Corrections de texte et filet de sécurité | le script de relecture ne compte plus rien sur les défauts ponctuels |
| 1.1.0 | L'accueil | Le menu principal retravaillé | **publiée le 16 novembre** ; reste la validation de Kevin sur son Mac |
| 1.2.0 | Le carnet | Le carnet refait autour du contexte de chaque note | **publiée le 16 novembre** ; reste le regard de Kevin |
| 1.3.0 | Le premier appel | La première semaine conduite | un joueur passif joue une garde à vue avant le troisième jour |
| 1.4.0 | La garde à vue | Contexte de procédure, parole par situation | moins de 10 % de questions sans effet, aucun « déjà dit » |
| 1.5.0 | Le dossier juste | Une simulation par famille de faits | zéro contradiction entre pièces sur 1 000 affaires |
| 1.6.0 | Le palais vous connaît | Réputations qui comptent, fin de carrière | chaque jauge a un effet mesuré ; une carrière a une fin |
| 1.7.0 | Les comptes | Économie recalée, emplois de l'argent | les deux mesures de trésorerie concordent avec la cible choisie |
| 1.8.0 | L'audience relue | Relecture de ce qui n'a pas été lu, répétition | audiences, jugements et dossiers criminels passés au script |
| 2.0.0 | (à nommer) | Un seul parcours, distribution achevée | checklist de sortie entièrement cochée |

### 1.0.1 — corrections et filet de sécurité — **fait le 16 novembre 2026**

Fait, et mesuré par `trelecture` (0 défaut ponctuel sur 420 affaires) :

- Accords : médecin et témoin au bon genre, « du plaignant », compagne de l'auteur de violences conjugales.
- Heures parlées d'une seule façon (« quatre heures moins le quart de l'après-midi »).
- Dépôt : les faits sont « hier ». Client retenu : plus de téléphone qui sonne ni de « on se rappelle ».
- Appel téléphonique : plus de gestes visibles.
- Question sur le contrôle d'identité seulement s'il y a eu un contrôle ; grade réel de l'officier.
- Témoin sans déclaration : il dit qu'il a peu vu. Rétractation : plus avant l'audition.
- Ordonnance pénale : une seule question sur les craintes. « Je perds ma place » réservé aux salariés.
- Âge accordé à la date de naissance ; prénom différent du nom ; plainte pour escroquerie sans « pendant une semaine ».
- Courrier de l'Ordre : l'inscription se fait sur la carte, à la Maison du barreau.
- Bandeau « Mini-jeux » retiré.
- Batterie : `trelecture` et les 15 tests oubliés y sont (107 tests, verts).

Écarté : l'enquête sociale « au dépôt » n'était pas une incohérence (elle n'est remise qu'en comparution immédiate).
Reporté en 1.1.0 : l'écran de création, qui déborde de 1440 × 900 et fait défiler le titre hors de l'écran.

### 1.1.0 « L'accueil » — le menu principal retravaillé — **publiée le 16 novembre 2026**

Kevin a demandé de faire l'étape et de publier sans passer par le choix sur captures : la direction retenue est celle que
cette feuille de route donnait pour la plus naturelle (la nuit, la pluie sur la vitre, les fenêtres allumées en face).
Fait, mesuré par `taccueil` (batterie) et par `tnavigateur` (titre dans sa colonne, création sans défilement en
1440 × 900) :

- Le décor ne suit plus la souris (`plan-accueil.js`, `accueil.js`).
- La vue (`ville()` dans `accueil.js`) : trois profondeurs — l'immeuble d'en face (brisis de zinc, lucarnes, mur mitoyen,
  une silhouette, un téléviseur), la ville (tribunal des Batignolles au tiers gauche, Sacré-Cœur, tour Eiffel au loin),
  le ciel bas ; la lueur monte de l'horizon derrière le tribunal. Toujours la nuit : crépuscule de 7 h à 21 h, nuit
  pleine ensuite ; toujours la pluie (la neige en hiver).
- La pièce : fenêtre à deux vantaux, lampe seule source chaude, téléphone sous la lampe, dossier ouvert ; les flèches
  des jeux cachés remplacées par un éclat discret (nom au survol).
- Le menu : titre réglé sur la largeur de sa colonne, une entrée dominante, les autres en liens ; hors du menu,
  en-tête resserré ; création élargie, les deux carrières côte à côte ; décor non étiré en écran étroit.

Reste : le regard de Kevin sur son Mac (c'est une affaire de goût) ; s'il veut une autre direction, la reprendre ici.

Demande d'origine :

Un retravail, pas une refonte : le cabinet, Timon, les entrées du menu et les jeux cachés dans le décor restent. Demande
de Kevin (16 novembre) : la fenêtre qui bouge avec la souris déplaît ; la vue est paresseuse, pas assez ambitieuse ni
artistique.

- **Le décor ne suit plus la souris.** Les objets continuent de réagir quand on les survole ou qu'on les clique.
- **Une vraie vue par la fenêtre**, composée comme une image et non comme un fond : Paris en profondeur (premiers toits,
  ville, ciel), une lumière qui a une direction, un moment choisi. Le titre dit « nuit de permanence » : la nuit, la
  pluie sur la vitre, les fenêtres allumées en face sont la piste la plus naturelle ; l'heure réelle peut rester un
  réglage de la lumière, pas du sujet.
- **Une pièce qui raconte** : la lampe seule source chaude, le téléphone qu'on attend, la robe à la patère, le dossier
  ouvert — moins d'objets posés à plat, plus de mise en scène.
- **Le menu dans l'image** : titre entier à toutes les tailles (il est coupé sur l'écran de création en 1440 × 900),
  hiérarchie nette entre « Nouvelle partie » ou « Continuer » et le reste.
- **Bandeau « Mini-jeux » retiré** (fait le 16 novembre, 1.0.1).

Méthode, parce que c'est une affaire de goût : deux ou trois directions montrées en captures avant de construire ;
Kevin en choisit une ; elle est ensuite menée à terme et vérifiée à 1440 × 900, en petit écran et sur son Mac.

### 1.2.0 « Le carnet » — la refonte du carnet (le « mémo ») — **publiée le 16 novembre 2026**

Demande de Kevin (16 novembre) : le carnet n'est pas assez intuitif ni clair, il manque de contexte ; on ne peut pas y
retrouver vite ce qui compte, parce qu'il faut interpréter chaque phrase ou se souvenir du moment où elle a été dite.
Limite posée : le jeu ne choisit pas les phrases utiles à la place du joueur, sinon le carnet perd son sens.

Fait, mesuré par `tcarnet` (batterie), `tparole` et `tconsult` (prise de note en situation) :

- **Chaque note porte son contexte** (`note.cx`, posé par `CR.addNote`) : qui parle, la situation (entretien
  confidentiel, audition, questions après l'audition, téléphone, parloir, cabinet, audience, confrontation, pièce avec
  cote et feuillet), le jour et l'heure, et la question qui a amené la phrase (la vôtre ou celle de l'officier).
- **Le carnet se range** par situation (par défaut), par personne, par catégorie, ou dans l'ordre de prise ; **il se
  cherche** par mot (phrase, question, nom, titre, sans les accents).
- **Le joueur titre ses notes** (« ce que vous en retenez ») en plus de les classer, dater et relier.
- **À l'audience**, les cartes de notes de la main disent d'où elles viennent et portent le titre du joueur.
- **Rien n'est trié pour le joueur** : le contexte est mécanique et identique pour toutes les notes ; `tcarnet` vérifie
  qu'une note qui porte un fait et une note sans portée ont exactement le même habillage.

Restes possibles, à la demande : rouvrir depuis une note l'échange entier ou la pièce au bon feuillet ; les notes prises
d'office par le jeu en mode assisté (réponses à fait des appels en liste, questions d'audience, confrontation) sont
conservées telles quelles — à revoir si Kevin veut que plus rien ne se note sans lui.

### 1.3.0 « Le premier appel » — la première semaine

- Inscription d'office à la permanence de la première nuit : la promesse de l'écran titre est tenue.
- Bouton « S'inscrire aux permanences » dans le courrier de l'Ordre.
- Me Varenne appelle si rien n'est fait au troisième jour.
- Bandeau des messages sans réponse au bureau ; « Avancer » s'arrête sur tout contact en attente et le dit.
- « Assisté » coché par défaut à la première carrière, « Libre » ensuite.
- Test : un automate qui ne fait que cliquer « Avancer » et « Répondre » joue une garde à vue avant le jour 3.

### 1.4.0 « La garde à vue » — parole et procédure

- **Contexte de procédure** lu par tous les textes : arrêté sur le fait, convoqué, plaignant ; date des faits relative
  au jour où l'on parle.
- **Un moteur de parole par situation**, sur le modèle de la consultation : garde à vue, dépôt, téléphone, parloir,
  victime, famille. Chaque situation a ses questions, ses gestes permis, sa façon de dater.
- Garde à vue : questions écrites en entier, une réponse par question, suites ouvertes par la discussion.
- Mensonge du client tenu dans la durée d'un entretien (pas de démenti trois réponses plus loin sans confrontation).
- Mesure de départ : 49 % d'angles sans effet, 12 % de « déjà dit ».

### 1.5.0 « Le dossier juste » — une vérité par famille de faits

Dans l'ordre, chaque famille avec sa simulation, ses pièces tirées de la même vérité et son test de cohérence :

1. Fraudes à distance (faux conseiller, fausse annonce, faux artisan) : lieu, mode de paiement, téléphonie, délai de plainte.
2. Faits qui durent (abus de biens sociaux, faux, harcèlement, usurpation en ligne) : une période, pas une heure ; pas
   d'arrestation ; plus de « à quelle heure précisément ? ».
3. Domicile et couple : qui habite où, qui a appelé, qui a vu.
4. Route, puis stupéfiants (produit, mode de consommation, rôle tenu).
5. Fusion du second moteur des violences dans `sim.js`.

Avec elles : un **modèle de témoin** (qui il est, où il était, ce qu'il a vu) et une **fiche de famille** stable par
personne (avec qui elle vit, qui peut attester).

### 1.6.0 « Le palais vous connaît » — réputations et fin de carrière

- Parquet : pèse sur l'orientation (alternative, comparution sur reconnaissance proposée) et bouge selon vos actes.
- Siège : pèse sur les renvois, l'écoute des incidents, la marge de la peine.
- Si l'un des deux ne peut pas être branché proprement, la jauge est retirée.
- Fin de carrière : bilan chiffré, épilogue des clients marquants, un objectif après « Ténor du barreau ».

### 1.7.0 « Les comptes » — économie

- Choisir la cible (voir « Décisions à prendre »), puis régler l'arrivée des clients, le prix juste, les impayés.
- Emplois de l'argent qui changent le jeu : local, documentation, formation, déplacements.
- Sauvegarde allégée des contacts jamais suivis.
- Test : `tecono` et `tviabilite` donnent la même réponse à la même question.

### 1.8.0 « L'audience relue » — ce qui n'a pas été lu

- Relecture, par le même procédé, des audiences, jugements, dossiers criminels et d'instruction, après-jugement.
- Répétition : ramener les deux mesures à cinq points sous leur seuil (24,3 % pour 25 ; 17,9 % pour 20).
- Suites de contenu déjà notées : récit de la victime par épisodes, annotation dans le lecteur de pièces, second témoin
  et expertises détaillées du dossier criminel.

### 2.0.0 — un seul parcours, distribution achevée

- Le mode liste disparaît comme parcours séparé : l'aide se règle par compétence, les tests jouent le vrai jeu.
- Singe sans rendu, qui joue des semaines de carrière en deux minutes, dans la batterie.
- App Mac signée et notarisée, mise à jour signée, nouvelle icône livrée à tous.
- Parcours complet au clavier ; fluidité mesurée sur le Mac le plus modeste.
- Relecture juridique datée ; licence du code choisie.
- Ancien écran d'accueil retiré s'il ne sert plus de repli.
- Reports levés ou abandonnés par écrit : jurisprudence sous les articles, requête en exclusion du bulletin n° 2 après
  jugement, assignation devant le juge civil.

## Décisions à prendre (Kevin)

| Décision | Bloque | Proposition |
|---|---|---|
| Cible de l'économie : « le jeune avocat vit juste » ou « l'avocat actif s'enrichit » | 1.7.0 | Vit juste la première année, à l'aise ensuite : la pression au début, des choix après. |
| Secrets Apple et clé de signature des mises à jour | 2.0.0 (app stable) | À poser dès que possible : rien d'autre n'en dépend. |
| Bandeau « Mini-jeux » de l'écran titre | — | **Tranché le 16 novembre : retiré.** Les jeux restent cachés dans le décor. |
| Direction artistique du menu principal | 1.1.0 | Choisir parmi deux ou trois directions montrées en captures. |
| Relecture juridique : par qui, quand | 2.0.0 | À lancer pendant la 1.5, quand les pièces seront stables. |
| Accès aux données de la Cour de cassation (jurisprudence) | 2.0.0 | Sans accord, le report est abandonné par écrit. |

## Ce qui ne changera pas

Toutes les affaires viennent du générateur (D-84) ; l'aide reste le choix du joueur (D-57) ; la taille d'un fichier
n'est jamais une raison de retirer du jeu (D-89).
