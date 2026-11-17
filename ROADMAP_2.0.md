# La Permanence — feuille de route vers la 2.0

16 novembre 2026. Point de départ : la 1.0.0 « Le serment » (`jeu-174`). Sources : `AUDIT_1.0.md` (audit des mécaniques
et relecture des textes). Cette feuille de route remplace l'ordre de travail de `GAMEPLAY_ROADMAP.md` pour la suite ;
les lots déjà commencés là-bas (familles d'infractions, dossier criminel, actes par clauses, après-jugement) sont repris
ici dans les étapes 1.8, 1.9, 1.10 et 1.14.
Le 16 novembre, à la demande de Kevin : la refonte du carnet a pris la place de la 1.2.0 (tout le reste décalé d'un
cran), puis la feuille de route a été détaillée en étapes plus nombreuses et plus courtes jusqu'à la 2.0 ; enfin la
personnalisation de l'avocat et la banque de visages sont devenues le prochain chantier (1.3.0), le reste décalé d'un cran.

## Ce que sera la 2.0

Un jeu qu'un nouveau joueur comprend dès la première nuit, où tout ce qui se dit et s'écrit dans une affaire repose sur
une seule vérité, et où chaque jauge affichée change quelque chose. La numérotation suit `PUBLICATION.md` : une étape de
contenu = une version mineure nommée ; la 2.0 est la refonte d'ampleur.

## Règles communes à toutes les étapes

- Une étape n'est finie que si son critère est mesuré par un test de la batterie.
- Aucun essai de plus de dix minutes sans retour.
- Une seule publication (`jeu-N`, voir `PUBLICATION.md`) : chaque poussée testée part chez tous les joueurs. Une étape
  se publie donc entière, jamais à moitié ; ce qui n'est pas fini reste derrière son ancien comportement.
- Une étape tient en une à trois séances. Si elle déborde, elle se coupe en deux versions plutôt que de s'étirer.
- Avant d'ajouter du texte fixe, écrire ses variantes : les mesures de répétition sont près de leur seuil.
- Pas de moteur de gameplay par type d'affaire : une simulation par famille de faits, un moteur de parole par situation.

## Les étapes

| Version | Nom | Contenu | Fini quand |
|---|---|---|---|
| 1.0.1 | (correctif) | Corrections de texte et filet de sécurité | le script de relecture ne compte plus rien sur les défauts ponctuels |
| 1.1.0 | L'accueil | Le menu principal retravaillé | **publiée le 16 novembre** ; reste la validation de Kevin sur son Mac |
| 1.2.0 | Le carnet | Le carnet refait autour du contexte de chaque note | **publiée le 16 novembre** ; reste le regard de Kevin |
| 1.2.1 | (correctif) | Publication fiable, retours sur le menu et le carnet | trois publications de suite vertes du premier coup |
| 1.3.0 | Les visages et les noms | L'avocat du joueur se compose pièce par pièce ; une banque de visages bien plus grande ; bien plus de noms de famille, des prénoms et des noms qui vont ensemble | **faite le 17 novembre** (`tvisages`, `tnoms`, `tanciens`) ; reste le regard de Kevin sur l'atelier |
| 1.4.0 | Le premier appel | La première semaine conduite | **faite le 17 novembre** (`tpremier`) : l'automate « Avancer / Répondre » joue sa garde à vue la première nuit |
| 1.5.0 | La preuve filmée | Une vidéo jouée dans presque toutes les affaires, de plusieurs sources (rue, caméra-piéton, téléphone, intérieurs, banque et guichet, domicile) ; publiée en plusieurs livraisons (1.5.0, 1.5.1…) | presque toutes les affaires ont un extrait joué, cohérent avec son procès-verbal ; les seules exceptions sont les affaires sans caméra crédible |
| 1.6.0 | La garde à vue | La parole en garde à vue sur un moteur propre, inspiré de la consultation (D-100) | moins de 10 % de questions sans effet, aucun « déjà dit » |
| 1.7.0 | Les autres voix | Dépôt, parloir, téléphone, victime, famille, témoin | aucune phrase d'une situation dite dans une autre, sur 420 affaires |
| 1.8.0 | Le dossier juste | Une vérité par famille : fraudes à distance, faits qui durent | zéro contradiction entre pièces sur 1 000 affaires de ces familles |
| 1.9.0 | Chez soi, sur la route | Une vérité par famille : domicile et couple, route, stupéfiants | idem ; le second moteur des violences est fondu |
| 1.10.0 | Le dossier en main | Lecteur de pièces, carnet et actes : un seul geste de travail | une note rouvre sa source ; aucun blanc d'acte devinable |
| 1.11.0 | Le palais vous connaît | Réputations du siège et du parquet qui comptent | chaque jauge affichée a un effet mesuré, ou n'est plus affichée |
| 1.12.0 | La robe et les années | Fin de carrière, objectifs après « Ténor » | une carrière jouée par l'automate se termine par un bilan |
| 1.13.0 | Les comptes | Économie recalée, emplois de l'argent | les deux mesures de trésorerie concordent avec la cible choisie |
| 1.14.0 | Les assises | Le dossier criminel au volume réel | un dossier criminel a ses sous-dossiers complets et se tient d'une pièce à l'autre |
| 1.15.0 | Les suites | Après le jugement, bibliothèque : reports levés ou abandonnés | plus aucun report ouvert dans les documents du projet |
| 1.16.0 | L'audience relue | Relecture de ce qui n'a pas été lu, répétition | audiences, jugements et dossiers criminels passés au script ; cinq points sous les seuils |
| 1.17.0 | Au clavier | Parcours complet au clavier, fluidité, écrans étroits | une carrière d'une semaine jouée sans souris par un test |
| 1.18.0 | Un seul parcours | Le mode liste disparaît, les tests jouent le vrai jeu | plus aucun test ne dépend du mode liste |
| 2.0.0 | (à nommer) | Distribution achevée, relectures, ménage | checklist de sortie entièrement cochée |

Ordre et dépendances : 1.6 avant 1.7 (le moteur de parole se règle d'abord sur la scène la plus jouée) ; 1.8 et 1.9
avant 1.14 (la simulation criminelle reprend le modèle de témoin et la fiche de famille) ; 1.11 avant 1.12 (le bilan de
carrière lit les réputations) ; 1.12 avant 1.13 (les emplois de l'argent donnent des objectifs de fin) ; 1.18 après tout
ce qui ajoute du contenu (on ne retire le mode liste qu'une fois le parcours libre complet). Les étapes 1.10, 1.15 et
1.17 ne dépendent de rien et peuvent passer devant si Kevin le demande.

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

### 1.2.1 — publication fiable et retours — correctif

- **Tests fragiles sous charge** : `tincidents` (build 180 et 182 en échec sur la machine de publication) et
  `tnavigateur` (export sans fichier) attendent un affichage lettre à lettre ; leur donner un affichage immédiat en test
  (réglage du harnais), au lieu d'allonger les attentes.
- Les 15 tests jusque-là hors batterie y sont (fait en 1.0.1) : vérifier qu'aucun autre ne traîne dans `dev/tests`.
- Retours de Kevin sur la 1.1.0 (menu, vue de nuit, éclats des jeux cachés) et la 1.2.0 (carnet) : corrections ici.
- Carnet : un seul nom dans tout le jeu (aujourd'hui « Carnet », « Bloc-notes du dossier », « Vos notes »).
- Fini quand : trois publications de suite passent du premier coup sur GitHub.

### 1.3.0 « Les visages et les noms » — l'avocat sur mesure, des personnes qu'on distingue — **faite le 17 novembre 2026**

Bilan, mesuré par la batterie :

- `tvisages` : chacune des 300 options et plus des 28 menus change le portrait ; coupe, couleur, peau, barbe, lunettes
  (présence et couleur) et tenue de ville se voient aussi sur la petite silhouette des décors et sur l'avocat vu de dos
  (local de garde à vue, parloir) ; sur 10 000 inconnus, 1 873 visages distincts avant, 9 873 après (× 5,3) ; moins de
  1 % de paires identiques dans une affaire ; les dix expressions sur 120 visages de la banque 2 ; l'atelier joué de la
  création à la retouche depuis le menu, sans toucher à la partie.
- `tnoms` : 6 020 identités possibles avant, 84 911 dans un même ensemble après (× 14), 557 350 avec les assemblages
  mixtes ; 1,8 % de doublons sur 3 000 personnes ; 1 000 affaires sans prénom hors de sa génération ni de son sexe,
  sans homonyme, sans nom de personnage récurrent ni du joueur ; liens de famille cohérents ; 16,8 % d'assemblages
  mixtes ; plus aucune liste de noms de personnes hors de `js/noms.js` (contrôle sur les sources). Environ une femme
  adulte sur quatre porte un nom d'usage : les procès-verbaux d'audition et de notification donnent alors « Nom d'usage »
  et « Nom de naissance », le casier le nom de naissance suivi de « épouse » et du nom d'usage.
- `tanciens` : 1 481 portraits d'avant (toutes expressions) rendus au pixel près, 120 affaires de la version 4 du
  générateur rejouées à l'identique (tirage, noms et pièces).

Défauts anciens révélés par le nouveau tirage, corrigés : arrêt de la chambre de l'instruction sans dispositif (appel de
la partie civile contre une mise en accusation : la chambre confirme) ; heure des faits relue avant la chronologie (une
partie rechargée ne redonnait pas les mêmes dialogues) ; garde à vue de préliminaire le matin des faits commis le soir
(version 5) ; poids brut égal au poids net pour un demi-gramme (version 5) ; agent de sécurité, médecin et urgentiste
accordés au prénom ; nom composé coupé au dernier mot dans l'audition du second fonctionnaire. Tests ajustés à des
issues voulues du jeu : client qui part au premier rendez-vous, victime indemnisée en recouvrement, demande de renvoi
évitée par l'automate, assentiment seulement oral (irrégularité), candidat qui décline.

Comment : `js/noms.js` (source unique, anciennes listes gardées sous `CR.NOMS.ANCIENS` pour la version 4) ;
générateur en version 5 (`GEN2.VERSION`) : ses personnes portent `ens`, `pens` et `look: { b: 2 }` ; `js/portraits.js`
(banque 2 : `PX.BANQUE`, `PX.lookFrom2`, `PX.lookDePieces`) ; `js/ui-atelier.js` (l'atelier) ; `CR.youLook(s, "ville")`.
Planches : `node tools/shotvisages.js 3 banque2,menus` (une planche par menu). Écarts assumés : vue en petit ou de
dos, la forme des yeux, du nez ou de la monture ne se voit pas (quelques pixels) ; seuls les nouveaux venus prennent la
banque 2 (décision de la feuille de route) ; un visage d'avant n'entre dans l'atelier que si le joueur le rouvre.

Demande de Kevin (16 novembre) : personnaliser l'avocat et son visage, avec une banque de visages beaucoup plus grande,
utilisée en jeu, et des menus : cheveux, yeux, nez, accessoires, etc.

Point de départ : le moteur de portraits (`portraits.js`) compose déjà un visage à partir de pièces (forme du visage,
yeux, sourcils, nez, bouche, coupe, barbe, lunettes, trait marquant, tenue), mais le joueur ne choisit rien : à la
création, « Un autre visage » tire tout au sort. Les pièces sont peu nombreuses (sept formes d'yeux, six nez, quatre
montures) et tirées d'un seul bloc, si bien que deux inconnus se ressemblent souvent.

- **L'atelier du visage**, à la création de la carrière : un portrait en grand, et un menu par pièce — peau, forme du
  visage, corpulence, âge ; cheveux (coupe et couleur) ; sourcils ; yeux (forme et couleur) ; nez ; bouche ; barbe et
  moustache ; lunettes (monture et couleur) ; accessoires (boucles d'oreilles, collier, foulard, piercing) ; traits
  (grain de beauté, taches de rousseur, cicatrice, mèche, cernes, rides). « Au hasard » reste, pièce par pièce ou pour tout.
- **Rien n'est réservé à un sexe ou à une origine** dans l'atelier : toutes les pièces sont offertes à tous.
- **Une banque bien plus grande** : au moins le double de pièces dans chaque menu (coupes, yeux, nez, bouches, barbes,
  montures, accessoires), dessinées dans le même moteur, sans image externe. Les coupes couvrent tous les types de
  cheveux.
- **La même banque pour tout le jeu** : clients, victimes, témoins, magistrats, confrères, équipe du cabinet sont tirés
  dans les mêmes pièces ; les personnages récurrents gardent leur fiche écrite à la main.
- **Le visage choisi se voit en jeu** : portrait du bureau, de la carte, de la fin de carrière, et silhouette de
  l'avocat dans les scènes (audience, garde à vue, cabinet), cheveux, barbe et lunettes compris.
- **Retoucher plus tard** : l'atelier se rouvre depuis le bureau (on change de coupe, on vieillit), sans toucher à la partie.
- **Sauvegardes** : les carrières en cours gardent exactement leur visage ; les visages déjà tirés des personnes
  rencontrées ne changent pas en cours de partie.
- Les dix expressions (parole, sourire, inquiétude, colère, larmes…) tiennent sur toutes les pièces nouvelles.

Fini quand : un test compose un visage pièce par pièce et retrouve chaque choix dans le portrait rendu et dans la
silhouette de scène ; sur 1 000 personnes tirées, au moins quatre fois plus de visages distincts qu'aujourd'hui, et
moins de 1 % de paires identiques dans une même affaire ; planches de contrôle (`shotvisages.js`) relues pour chaque
menu ; une sauvegarde d'avant la 1.3.0 rend le même portrait au pixel près.

#### Les noms (demande de Kevin, 16 novembre : plus de noms de famille, plus de cohérence entre noms et prénoms)

Point de départ, mesuré le 16 novembre : 70 noms de famille, 50 prénoms d'hommes et 36 de femmes (`gen-monde.js`),
tirés chacun de son côté, sans lien avec l'âge ni avec la famille ; sur 3 000 personnes tirées, 2 269 identités
distinctes, et des assemblages qui sonnent faux (un « Jean-Marc » de dix-neuf ans, un « Dylan » retraité). Les listes
sont en plusieurs exemplaires : `generator.js`, `equipe.js`, les magistrats de `gen-moteur.js`, les voisins écrits en
dur de `crim-dossier.js`.

- **Bien plus de noms de famille** : plusieurs centaines, à l'image de l'Île-de-France d'aujourd'hui (noms courants et
  noms rares, noms composés, à particule, à trait d'union), avec leur fréquence : « Martin » revient, pas « Kowalski ».
- **Bien plus de prénoms, rangés par génération** : le prénom se tire d'après l'année de naissance (Josiane et Gérard
  ont soixante-dix ans, Léa et Rayan en ont vingt), prénoms composés compris.
- **Le prénom et le nom se tirent ensemble**, dans des ensembles qui vont ensemble, avec une part d'assemblages mixtes
  comme dans la vie : la règle devient l'exception, elle ne disparaît pas. Rien de cela ne règle la peau du visage au
  nom de façon mécanique : la banque de visages reste libre, pour ne pas fabriquer de stéréotype.
- **La famille tient** : parents, enfants, frères et sœurs portent le même nom ; les époux parfois ; les prénoms d'une
  même fratrie viennent de la même génération et du même ensemble ; le nom d'usage et le nom de naissance se distinguent
  dans les pièces qui le demandent (procès-verbal d'identité, casier).
- **Une seule source de noms pour tout le jeu** : clients, victimes, témoins, voisins, équipe du cabinet, confrères,
  magistrats, policiers, médecins et experts. Les listes en double sont retirées.
- **Pas d'homonymes gênants** : jamais deux personnes du même nom complet dans une affaire, jamais le nom d'un
  personnage récurrent ni celui du joueur donné à un inconnu, sauf lien de famille voulu ; pas de prénom égal au nom.
- **Le genre suit** : civilité, accords et métier s'accordent au prénom tiré (prénoms épicènes rangés à part).
- Les carrières en cours gardent tous les noms déjà donnés.

Fini quand, sur 3 000 personnes tirées : au moins dix fois plus d'identités possibles qu'aujourd'hui et moins de 2 %
de doublons ; aucun prénom à plus d'une génération de l'âge de la personne ; 100 % des liens de famille cohérents sur
1 000 affaires (`tgen`) ; plus aucune liste de noms hors de la source commune ; `trelecture` compte zéro accord faux
sur la civilité.

### 1.4.0 « Le premier appel » — la première semaine — **faite le 17 novembre 2026**

Bilan (`tpremier`, batterie) : un automate qui ne clique que « Avancer » et « Répondre » joue sa garde à vue dès la
première nuit (jour 1, entre 1 h et 5 h, en deux clics). Tout ce qui est ci-dessous est fait, dans `js/premiere.js`
(inscription d'office et appel sûr de la première nuit, Me Varenne au troisième jour, contacts en attente, courriers qui
arrivent quand ils servent), `js/systems.js` (courriers d'ouverture), `js/ui-desk.js` (bandeau, bouton du courrier) et
`js/main.js` (écran de création, « Avancer », réponse à Me Varenne). L'inscription d'office passe par la prestation de
serment (`CR.premiereSemaine`) : `CR.newGame` seul ne la fait pas, pour que les tests gardent leurs parties. Le
contact en attente est le dossier « lead » ; « Avancer » n'avance plus que d'un jour tant qu'il y en a un. Tests ajustés :
`tlibre`, `tappel`, `tconsult` cochent « Libre » (ils testent ce mode) ; `tequipe` garde le moral bas jusqu'à la démission.

- Inscription d'office à la permanence de la première nuit : la promesse de l'écran titre est tenue.
- Bouton « S'inscrire aux permanences » dans le courrier de l'Ordre.
- Me Varenne appelle si rien n'est fait au troisième jour.
- Bandeau des messages sans réponse au bureau ; « Avancer » s'arrête sur tout contact en attente et le dit.
- Un contact qui va se fermer prévient la veille ; une ligne au journal ne suffit pas.
- « Assisté » coché par défaut à la première carrière, « Libre » ensuite.
- Les quatre courriers d'ouverture ramenés à ce qu'il faut pour la première nuit ; le reste arrive quand il sert.
- Test : un automate qui ne fait que cliquer « Avancer » et « Répondre » joue une garde à vue avant le jour 3.

### 1.5.0 « La preuve filmée » — la vidéo dans presque toutes les affaires (D-101, demande de Kevin du 17 novembre)

Point de départ, mesuré le 17 novembre sur 1 750 affaires tirées : 21 % ont une preuve vidéo, et un seul moteur la joue
vraiment (`video.js` : le métro et le magasin) ; les autres ne sont qu'un procès-verbal d'exploitation. Par famille :
biens 40 %, crimes sur les biens 63 %, personnes 14 %, route 17 %, stupéfiants 1 %, numérique et affaires 0 %.

Ce que Kevin a fixé (17 novembre) :
- **Presque toutes les affaires** ont une preuve vidéo ; une affaire n'en a pas seulement quand aucune caméra n'est
  crédible (une escroquerie par courriel, un faux bilan).
- **Toutes jouées** : chaque vidéo est un extrait animé que le joueur regarde, met en pause et compare au procès-verbal
  d'exploitation. Plusieurs moteurs vidéo si nécessaire (une source = un moteur ou un décor à part).
- **Les sources** : vidéoprotection de rue (caméras municipales et de la préfecture) ; caméra-piéton des policiers
  (interpellations, contrôles, outrages, rébellions, refus d'obtempérer, dépistages) ; téléphone d'un témoin (filmé à la
  main, vertical, tremblé, partiel) ; caméras intérieures (bar, commerce, hall d'immeuble, parking, bus et RER, en plus
  du métro et du magasin) ; caméras de banque et de guichet (distributeur, agence, bureau de poste, mairie) ; caméra
  domestique ou sonnette connectée ; vidéo filmée par la victime elle-même.
- **À double tranchant, avec ses failles** : la vidéo peut accabler ou disculper (angle mort, visage illisible,
  horodatage décalé, scène coupée) et porter des irrégularités propres à soulever (images effacées faute de réquisition
  dans le délai de conservation, caméra-piéton déclenchée tard, exploitation sans réquisition). Les règles exactes
  (durées de conservation, cadre des caméras-piétons et de la vidéoprotection) sont à lire dans les textes avant d'écrire.
- **Le son, en sous-titres** pour la caméra-piéton, le téléphone et la vidéo de la victime : les paroles (insultes,
  menaces, aveux, échanges avec les policiers) s'affichent pendant l'extrait et sont retranscrites au procès-verbal, avec
  leurs passages inaudibles. Les caméras de surveillance restent muettes.
- **Plusieurs livraisons**, publiées au fur et à mesure (exception voulue à la règle « une version mineure par étape » :
  les livraisons gardent le numéro 1.5) :
  - 1.5.0 : la vidéoprotection de rue et la caméra-piéton ;
  - 1.5.1 : le téléphone (témoin et victime) ;
  - 1.5.2 : les caméras intérieures (bar, hall, parking, bus et RER) ;
  - 1.5.3 : les caméras de banque et de guichet, la caméra domestique et la sonnette.

Fini quand : sur 1 000 affaires tirées, presque toutes ont un extrait joué (seuil chiffré à fixer à la fin de la 1.5.0,
une fois mesuré ce qu'aucune caméra ne peut montrer) ; chaque extrait montre ce que la simulation sait, ni plus ni
moins, et son procès-verbal le dit ; chaque faille se trouve en regardant ou en lisant, et produit son effet à
l'audience ; les affaires déjà tirées et les codes d'avant ne changent pas.

### 1.6.0 « La garde à vue » — la parole de la scène la plus jouée

- **Contexte de procédure** lu par tous les textes : arrêté sur le fait, convoqué, plaignant ; date des faits relative
  au jour où l'on parle.
- Garde à vue sur un moteur propre, inspiré de la consultation mais distinct (D-100, demande de Kevin du 17 novembre) :
  questions écrites en entier, une réponse par question, suites ouvertes par la discussion, découverte des questions par
  l'échange ; ses thèmes et ses règles sont ceux de la garde à vue (trente minutes, pas de dossier, l'audition qui suit,
  parler ou se taire), et `js/consultation.js` n'est ni appelé ni modifié pour elle.
- Mensonge du client tenu dans la durée d'un entretien (pas de démenti trois réponses plus loin sans confrontation) :
  36 entretiens concernés à la relecture.
- Le client convoqué ne raconte plus une arrestation (10 auditions libres concernées).
- Mesure de départ : 49 % d'angles sans effet, 12 % de « déjà dit ». Outil : `consultations.js` étendu à la garde à vue.

### 1.7.0 « Les autres voix » — une parole par situation

- Le même moteur pour le dépôt, le parloir, le téléphone, la victime, la famille, le témoin : chaque situation a ses
  questions, ses gestes permis (rien de visible au téléphone), sa façon de dater, son impatience propre.
- Victime : le récit de la plainte par épisodes. Antécédents : la peine prononcée, son exécution.
- Visages branchés sur les réponses (gêne, colère, fatigue) là où l'on se voit.
- Test : `trelecture` étendu ; aucune phrase marquée d'une situation n'est dite dans une autre, sur 420 affaires.

### 1.8.0 « Le dossier juste » — une vérité par famille de faits, première moitié

Chaque famille avec sa simulation, ses pièces tirées de la même vérité et son test de cohérence :

1. Fraudes à distance (faux conseiller, fausse annonce, faux artisan) : lieu, mode de paiement, téléphonie, délai de plainte.
2. Faits qui durent (abus de biens sociaux, faux, harcèlement, usurpation en ligne) : une période, pas une heure ; pas
   d'arrestation ; plus de « à quelle heure précisément ? ».

Avec elles : le **modèle de témoin** (qui il est, où il était, ce qu'il a vu), repris ensuite par toutes les familles.

### 1.9.0 « Chez soi, sur la route » — une vérité par famille de faits, seconde moitié

3. Domicile et couple : qui habite où, qui a appelé, qui a vu ; la **fiche de famille** stable par personne (avec qui
   elle vit, qui peut attester).
4. Route (alcoolémie et toxicologie simulées, plus seulement composées), puis stupéfiants (produit, mode de
   consommation, rôle tenu ; livraison, usage).
5. Vol chez l'employeur, vol au préjudice d'une personne vulnérable (restes du lot 1 ter).
6. Fusion du second moteur des violences (`sim-violences.js`, `docs-violences.js`) dans `sim.js`.

Fini quand : zéro contradiction entre pièces sur 1 000 affaires ; plus aucune pièce ancienne au catalogue (1 % aujourd'hui).

### 1.10.0 « Le dossier en main » — lire, noter, écrire d'un seul geste

- Depuis une note du carnet, rouvrir l'échange entier ou la pièce au bon feuillet (reste de la 1.2.0).
- Annotation dans le lecteur de pièces ; carnet et dossier de travail présentés comme un seul outil.
- Notes prises d'office en mode assisté : les garder, les signaler comme telles, ou les retirer (décision de Kevin).
- Actes par clauses menés à terme (B2 : blancs à valeur propre) ; PLEX pour les pièces jointes ; aide réglée par compétence.
- Fini quand : `tplcheck` refait ne trouve aucune option devinable par l'ordre ou la longueur ; un test rouvre la
  source de chaque note.

### 1.11.0 « Le palais vous connaît » — réputations

- Parquet : pèse sur l'orientation (alternative, comparution sur reconnaissance proposée) et bouge selon vos actes.
- Siège : pèse sur les renvois, l'écoute des incidents, la marge de la peine.
- Si l'un des deux ne peut pas être branché proprement, la jauge est retirée.
- La mémoire des magistrats et des confrères (`memoire.js`) se voit à l'audience suivante, pas seulement au répertoire.
- Test : une même affaire jugée avec une réputation haute et basse donne des issues mesurablement différentes.

### 1.12.0 « La robe et les années » — une carrière a une fin

- Fin de carrière : bilan chiffré, épilogue des clients marquants.
- Des objectifs après « Ténor du barreau » : bâtonnat, association, enseignement, grand procès — à choisir, pas tous.
- La promotion (les confrères de serment) vieillit avec vous et sert de point de comparaison.
- Test : l'automate « joueur moyen » termine une carrière par un écran de bilan, sans radiation ni faillite.

### 1.13.0 « Les comptes » — économie

- Choisir la cible (voir « Décisions à prendre »), puis régler l'arrivée des clients, le prix juste, les impayés.
- Emplois de l'argent qui changent le jeu : local, documentation, formation, déplacements en province.
- Sauvegarde allégée des contacts jamais suivis (2,8 Mo sur 6,7 Mo à cinq ans).
- Test : `tecono` et `tviabilite` donnent la même réponse à la même question.

### 1.14.0 « Les assises » — le dossier criminel au volume réel

- Une simulation de l'affaire criminelle sur le modèle de `sim.js` : chronologie de l'enquête, transport sur les
  lieux, constatations, voisinage, commission rogatoire.
- Second témoin (`pv_temoin2`), expertises détaillées (balistique, génétique, toxicologique, psychiatrique), enquête
  de personnalité et synthèse développées.
- Phrases d'enjeu du catalogue revues pour tous les contextes.
- Fini quand : `tcrimdossier` mesure le volume visé et la cohérence d'une pièce à l'autre ; `tcatalogue` couvre les crimes.

### 1.15.0 « Les suites » — reports levés ou abandonnés

- Requête en exclusion du bulletin n° 2 après jugement (D-86) : faite si la source est trouvée, sinon abandonnée par écrit.
- Assignation devant le juge civil : cadrée comme un module, ou abandonnée par écrit.
- Jurisprudence sous les articles (D-83) : selon l'accord de Kevin sur les données de la Cour de cassation.
- Codes publiés dans un paquet de mise à jour à part, comme les sons (D-89).
- Autres décors de vidéosurveillance, s'ils servent une famille de faits déjà simulée.

### 1.16.0 « L'audience relue » — ce qui n'a pas été lu

- Relecture, par le même procédé, des audiences, jugements, dossiers criminels et d'instruction, après-jugement.
- Répétition : ramener les deux mesures à cinq points sous leur seuil (24,3 % pour 25 ; 17,9 % pour 20) ; trois
  affaires de même difficulté d'affilée (14,2 %) sous 10 %.
- Les incohérences « lues, non comptées » de l'audit deviennent des compteurs de `trelecture`.

### 1.17.0 « Au clavier » — confort et fluidité

- Parcours complet au clavier, décors cliquables du bureau compris ; focus toujours visible.
- Fluidité mesurée sur le Mac le plus modeste (bureau, audience, menu) ; réglage des effets si elle ne tient pas.
- Écrans étroits et petites fenêtres : chaque scène vérifiée en 1024 × 640.
- Taille du texte : aucun écran ne déborde au réglage le plus grand.

### 1.18.0 « Un seul parcours » — le vrai jeu partout

- Le mode liste disparaît comme parcours séparé : l'aide se règle par compétence.
- Les parties automatiques jouent le mode libre ; `tboucle` sur plus de graines.
- Singe sans rendu, qui joue des semaines de carrière en deux minutes, dans la batterie.
- Les écrans de l'ancien parcours (`ui-gav.js` en liste, appels en liste) sont retirés une fois sans appelant.

### 2.0.0 — distribution achevée

- App Mac signée et notarisée, mise à jour signée, nouvelle icône livrée à tous ; fermeture de la fenêtre vérifiée.
- Relecture juridique datée ; licence du code choisie.
- Ancien écran d'accueil (`accueil.js`, `title.js`) retiré s'il ne sert plus de repli sans carte graphique.
- Documents du projet remis à jour : un seul fichier d'état, les feuilles de route closes archivées.
- Nom de la 2.0 choisi par Kevin.

## Décisions à prendre (Kevin)

| Décision | Bloque | Proposition |
|---|---|---|
| Cible de l'économie : « le jeune avocat vit juste » ou « l'avocat actif s'enrichit » | 1.13.0 | Vit juste la première année, à l'aise ensuite : la pression au début, des choix après. |
| Secrets Apple et clé de signature des mises à jour | 2.0.0 (app stable) | À poser dès que possible : rien d'autre n'en dépend. |
| Bandeau « Mini-jeux » de l'écran titre | — | **Tranché le 16 novembre : retiré.** Les jeux restent cachés dans le décor. |
| Direction artistique du menu principal | 1.1.0 | **Faite le 16 novembre sans choix sur captures** (nuit de pluie) ; retours attendus en 1.2.1. |
| Relecture juridique : par qui, quand | 2.0.0 | À lancer après la 1.9, quand les pièces seront stables. |
| Accès aux données de la Cour de cassation (jurisprudence) | 1.15.0 | Sans accord, le report est abandonné par écrit. |
| Notes prises d'office par le jeu en mode assisté | 1.10.0 | Les garder mais les marquer « notée pour vous », pour que le carnet reste le vôtre. |
| Objectifs après « Ténor du barreau » | 1.12.0 | Deux au choix du joueur : le bâtonnat et le grand procès. |
| Assignation devant le juge civil : module ou abandon | 1.15.0 | Abandon : c'est un autre métier que celui du jeu. |
| Tenue de l'avocat : la robe seulement, ou aussi la tenue de ville au cabinet | 1.3.0 | La robe à l'audience, une tenue de ville choisie au cabinet et en garde à vue. |
| Les visages des personnes déjà rencontrées changent-ils avec la nouvelle banque ? | 1.3.0 | Non : seuls les nouveaux venus en profitent, pour ne dérouter personne. |
| Part d'assemblages mixtes prénom/nom | 1.3.0 | Environ un sur six : assez pour être vrai, pas assez pour sonner faux. |
| Nom de la 2.0 | 2.0.0 | À choisir quand le contenu sera arrêté. |

## Ce qui ne changera pas

Toutes les affaires viennent du générateur (D-84) ; l'aide reste le choix du joueur (D-57) ; la taille d'un fichier
n'est jamais une raison de retirer du jeu (D-89).
