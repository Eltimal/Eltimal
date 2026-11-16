# La Permanence 1.0.0 — audit du jeu et de ses mécaniques

16 novembre 2026, sur le commit publié (`jeu-174`). Ce fichier dit ce qui est à améliorer, à retirer, à ajouter, et sur
quelle preuve. Il ne remplace pas `SORTIE_1.0.md` (fiabilité, distribution) : il porte sur le jeu tel qu'on le joue.

## Méthode et limites

- **Mesuré ce jour** : `tgen` (1 000 délits et 1 000 crimes générés), `tecono`, `tviabilite`, `trepetition`, batterie
  complète (90 tests), les 15 tests qu'aucune batterie ne lance, singe (2 510 clics), temps de chargement.
- **Joué dans Chromium** : écran titre, création de carrière, bureau, courriers d'ouverture, puis 63 jours d'un joueur
  qui ne fait que cliquer « Avancer ».
- **Lu dans le code** : réputations, fin de partie, prospects, « Avancer », carrière, équipe.
- **Non examiné** : je n'ai pas joué moi-même une garde à vue ni une audience de bout en bout dans cette session ; ce
  que j'en dis vient des tests, des captures existantes et de `GAMEPLAY_STATE.md`. Rien n'a été vu sur un Mac.

## Verdict

Le fond est solide et rare : variété des affaires, pièces, droit, décisions écrites, sauvegardes. La faiblesse est
ailleurs : **le jeu ne conduit pas le joueur jusqu'à sa première affaire**, l'économie n'a pas de cible tranchée, et
plusieurs mécaniques affichées n'ont pas d'effet. Les trois premiers points ci-dessous comptent plus que tout le reste.

## À améliorer

### 1. La première heure (priorité absolue)

| Constat | Preuve |
|---|---|
| Un joueur qui clique « Avancer » passe 63 jours sans jouer une seule scène : neuf contacts laissent un message, sept se ferment seuls, le compte tombe à 0 € avec 1 526 € de découvert. | partie jouée, graine par défaut |
| Un contact non rappelé disparaît après trois jours, avec une ligne au journal pour seul signal. « Avancer » a sauté du jour 4 au jour 21 par-dessus deux contacts en attente. | `engine.js` (`_leadExpire`, `skipAhead`) |
| La confirmation d'« Avancer » couvre audiences, permanences et agenda, pas les messages à rappeler. | `CR.resteAujourdhui` |
| Le courrier de l'Ordre envoie s'inscrire « à la Maison du barreau » ; l'inscription se fait en réalité dans Cabinet → L'Ordre. | courrier d'ouverture, `ui-desk.js:614` |
| L'écran titre promet « le téléphone sonnera cette nuit » ; sans inscription, il ne sonne pas. Le bureau dit « Le téléphone va sonner ». | partie jouée |
| Le niveau « Libre » est coché par défaut et présenté comme « le jeu tel qu'il est pensé » ; « Assisté » est dit « pour une première carrière » mais il faut le choisir. | écran de création |
| Plus aucun tutoriel (D-84) : quatre courriers à lire tiennent lieu de prise en main. | boîte de réception du jour 1 |

Proposition : une première semaine conduite par le vrai générateur, sans affaire écrite. Inscription d'office à la
permanence de la première nuit (la promesse du titre est tenue), un bouton « S'inscrire aux permanences » dans le
courrier de l'Ordre, Me Varenne qui appelle si rien n'est fait au troisième jour, « Assisté » coché par défaut à la
première carrière, et « Avancer » qui s'arrête sur tout contact sans réponse.

### 2. L'économie n'a pas de cible

| Constat | Preuve |
|---|---|
| Deux mesures du jeu se contredisent : 11 gardes à vue par mois laissent 7 232 € en fin d'année ; l'automate « joueur moyen » finit à 74 682 € (médiane, 20 graines), et à 543 291 € en cinq ans. | `tecono`, `tviabilite` |
| L'argent n'a presque pas d'emploi : charges du mois, équipe, apport d'association (8 000 €). | `engine.js`, `carriere.js`, `equipe.js` |
| Le cabinet passif fait faillite au jour 119 : la seule pression financière est celle du débutant perdu (point 1). | `tecono` |

À trancher : « le jeune avocat vit juste » (ce que dit `GAMEPLAY_STATE.md`) ou « l'avocat actif s'enrichit ». Puis
régler `CR.dailyLeads`, `CR.fairForfait`, les impayés, et donner à l'argent des emplois qui changent le jeu.

### 3. Des mécaniques affichées sans effet

| Constat | Preuve |
|---|---|
| Réputation « Parquet » : jamais modifiée (aucun appel), jamais lue. L'écran promet qu'elle « ouvre la porte aux alternatives ». | `CR.rep` : 13 appels clients, 14 confrères, 4 siège, 0 parquet |
| Réputation « Siège » : modifiée quatre fois, jamais lue par le délibéré ni par la peine. L'écran promet « votre crédit devant les juges ». | idem ; aucun `reps.siege` hors affichage |
| Les deux ne comptent que dans la moyenne qui fait monter en grade. | `carriere.js` (`CAR.mesure`) |
| Fin de partie : radiation, faillite ou démission. Le dernier grade (« Ténor », 40 dossiers) n'ouvre sur rien ; l'épilogue a été retiré comme code mort. | `systems.js:776`, `SORTIE_1.0.md` |

Proposition : brancher le parquet sur l'orientation (alternative, CRPC proposée) et le siège sur la peine et les
renvois, ou retirer les deux jauges.

### 4. La garde à vue, scène la plus jouée, est en retard sur la consultation

Mesure du 16 novembre notée dans `NEXT_SESSION.md` : 49 % des angles de question sont sans effet et 12 % des réponses
sont « je vous l'ai déjà dit ». C'est le défaut que le moteur de consultation a corrigé au cabinet (0.10.0). Lui donner
le même traitement est le gain de qualité le plus visible après le point 1.

### 5. Répétition : les marges sont minces

Phrases identiques entre deux gardes à vue d'infractions différentes : 24,3 % pour un seuil de 25 %. Arguments communs
entre deux plaidoiries : 17,9 % pour un seuil de 20 %. Trois affaires de même difficulté d'affilée : 14,2 %. Le prochain
ajout de texte fixe fera passer un seuil : écrire des variantes avant, pas après.

### 6. Tests et outillage

| Constat | Preuve |
|---|---|
| 15 tests existent hors de toute batterie (`tequipe`, `ttravail`, `tsimv`, `tvideo`, `tdialogues`, `t17` à `t19`…). Tous verts aujourd'hui, mais rien ne le garantit demain. | lancés ce jour |
| Les parties automatiques jouent en mode liste ; le mode libre, celui par défaut, n'est joué de bout en bout que sur quatre graines. | `dev/tests/util.js`, `tboucle` |
| Le singe fait 3,5 clics par seconde et n'a pas quitté le premier jour : il ne prouve presque rien sur la carrière. | 3 graines, 4 minutes |
| `tnavigateur` échoue quand la machine est chargée (export sans fichier), puis passe seul. | constaté ce jour |

Proposition : les 15 tests dans la batterie rapide ; un singe sous jsdom (sans rendu) qui joue des semaines entières
en deux minutes ; `tboucle` en mode libre sur plus de graines.

### 7. Détails d'écran relevés

- Création de carrière en 1440 × 900 : le titre est coupé en haut, le bouton « Retour » touche le bas de l'écran.
- Écran titre : un point-virgule seul en début de ligne (« … novembre 2026 / ; textes résumés »).
- Sauvegarde de cinq ans : 6,7 Mo dont 2,8 Mo de contacts jamais suivis ; rechargement 2 à 2,9 s.

## À retirer (ou fondre)

| Quoi | Poids | Pourquoi | Réserve |
|---|---|---|---|
| `sim-violences.js`, `docs-violences.js` | 136 Ko | Second moteur pour le même rôle que `sim.js` ; déjà noté « à fondre ». | Sert encore les comparutions immédiates de violences : fondre, pas supprimer. |
| `accueil.js` à côté de `plan-accueil.js` | 48 Ko | Deux écrans d'accueil chargés, le second dit remplacer le premier. | Je n'ai pas vérifié si l'ancien sert de repli sans carte graphique. |
| Jauges « Siège » et « Parquet » | — | Sans effet (point 3), si on ne les branche pas. | — |
| Mode liste comme parcours séparé | — | Deux parcours à maintenir ; l'assisté par compétence (C3) peut le remplacer. | Les tests automatiques en dépendent : à faire après le point 6. |
| Bandeau « Mini-jeux » de l'écran titre | — | Quatre boutons au premier plan d'un jeu sérieux, avant même « Nouvelle partie » pour l'œil. Les jeux cachés dans le décor suffisent. | Affaire de goût : à toi de trancher. |

## À ajouter

| Quoi | Pourquoi |
|---|---|
| La première semaine conduite (point 1) | Sans elle, une partie des joueurs ne verra jamais une garde à vue. |
| Un rappel des messages sans réponse (bandeau du bureau, arrêt d'« Avancer ») | Le contact perdu est aujourd'hui invisible. |
| Des emplois pour l'argent | Local, documentation, formation, déplacements en province : sinon la trésorerie n'est qu'un score. |
| Une fin de carrière | Bilan chiffré, épilogue des clients marquants, objectif après « Ténor ». |
| Le moteur de consultation en garde à vue (point 4) | Même défaut, même remède. |
| Les suites déjà listées : récit de la plainte par épisodes pour la victime, antécédents (peine, exécution), annotation dans le lecteur de pièces, visages branchés sur les réponses, autres décors de vidéosurveillance | Notées « reste » dans `GAMEPLAY_STATE.md` et `NEXT_SESSION.md`. |
| Les reports de la 1.0 : jurisprudence sous les articles, requête en exclusion du bulletin n° 2 après jugement, assignation devant le juge civil | Bloqués par des sources ou à cadrer ; aucun n'est annoncé au joueur. |
| Un parcours complet au clavier et une mesure de fluidité sur ton Mac | Non vérifiés à la sortie. |

## Ce qui tient

- **Variété** : 50 infractions sur 52 tirées en 1 000 affaires, sept familles, six modes d'entrée, 11 252 pièces
  rendues ; 0 % de séries « même infraction, même scène » avec le directeur de partie.
- **Justice crédible** : peines calées sur les condamnations de 2022 ; 99 % de condamnations sans plaidoirie, 63 à
  69 % quand tous les moyens d'acquittement sont plaidés ; décisions écrites au format réel.
- **Fiabilité** : 105 tests verts ce jour, aucune erreur de page dans mes parties, chargement en 1,4 s, sauvegardes
  éprouvées (fichiers abîmés, cinq ans de carrière, scène interrompue).
- **L'habillage** : bureau, cabinet de consultation, lecteur de pièces annotables — lisibles et tenus.

## Ordre proposé

1. Première semaine conduite, rappel des messages, « Assisté » par défaut (point 1).
2. Garde à vue sur le moteur de consultation (point 4).
3. Réputations siège et parquet : brancher ou retirer ; fin de carrière (point 3).
4. Cible de l'économie, puis réglage et emplois de l'argent (point 2).
5. Batterie élargie et singe sans rendu (point 6), puis fusion des moteurs en double.
