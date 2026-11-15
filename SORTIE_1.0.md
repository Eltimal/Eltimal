# La Permanence — plan d'exécution de la sortie 1.0

Issu de l'audit du 14 novembre 2026. Ce fichier est la référence de la transition bêta → 1.0 : plan, journal des
modifications, état de la checklist. Règle : une anomalie n'est « faite » que si un test automatique la reproduit et passe.
Le jeu n'est déclaré prêt que lorsque toute la checklist est cochée ; un critère non vérifiable est marqué comme tel.

## Plan par phases

| Phase | Contenu | Anomalies de l'audit |
|---|---|---|
| 0 | Garde-fou de publication : la batterie tourne avant toute publication | B4 (début) |
| 1 | Bloquants | B1 scène atomique · B2 stockage · B3 validation et garde-fou d'erreur · B4 canaux, clé, signature |
| 2 | Majeurs | M1 à M12 |
| 3 | Mécaniques annoncées et réelles | M6, M11, code mort, permanences, code d'exemple, « dossier des sauvegardes » |
| 4 | Robustesse des sauvegardes et des carrières longues | carrière de cinq ans, fichiers corrompus, garde à vue interrompue |
| 5 | Économie, équilibrage, simulation | automate « joueur moyen », M9, M10, M12, viabilité |
| 6 | Finitions d'une version officielle | prise en main, crédits et licences, `lang`, focus, textes, inachevés (finir ou retirer, décision motivée) |
| 7 | Distribution macOS et procédure de publication | signature, notarisation, icône, canaux, procédure écrite |

## Dépendances et risques de régression (relevés avant de modifier)

- `main.js` (coquille) : toutes les scènes passent par `setScene` ; la batterie pose `CR.store.s` directement et n'utilise pas
  le menu : les changements de sauvegarde doivent rester inertes sous jsdom (pas d'IndexedDB : repli sur `localStorage`).
- `engine.js` (`spend`, `endDay`, `skipAhead`, `deserialize`) : appelés par presque tous les tests ; `tecono`, `tboucle`,
  `tgen` mesurent des durées et des recharges de sauvegarde.
- `systems.js` (honoraires, discipline) : `tbill`, `tcarriere`, `tequipe`.
- `electron/maj.js` : `electron/test-maj.js`, `dev/tests/tmaj.js` ; toute app déjà installée (enveloppe 1) lit les
  publications `jeu-N`.
- Le tirage des affaires dépend de l'ordre des appels au hasard de la partie (`s.rng`) : ne pas ajouter de tirage sur ce
  générateur dans un chemin existant (utiliser `CR.seeded`).

## Journal des modifications

(voir plus bas, complété à chaque correction)

### Phase 0 et 1 — bloquants (14 novembre 2026)

| Anomalie | Modification | Fichiers | Test qui la reproduit |
|---|---|---|---|
| B1 | Instantané de la partie à l'entrée de toute scène plein écran ; tant que la scène dure, c'est lui qui s'enregistre (automatique, emplacements, export, retour au titre). Une scène interrompue se rejoue depuis son début ; une audience n'est plus jamais « tenue » sans jugement. | `js/main.js` (`setScene`, `Saves.contenu`) | `tnavigateur` (audience quittée par le menu, relance, 120 jours), `tsauvegardes` |
| B2 | Parties rangées dans IndexedDB, une fiche par emplacement ; reprise automatique de l'ancien rangement ; file d'écriture ; tout échec dit au joueur ; export de fichier sans service hôte (app Mac comprise) ; copie d'urgence synchrone à la fermeture. | `js/main.js` (`Saves`) | `tnavigateur` (9 Mo écrits et relus, place prise, échec signalé, export, migration), `tsauvegardes` |
| B3 | `CR.validerPartie` : forme et valeurs contrôlées, version plus récente refusée, champs secondaires remis à neuf ; garde-fou d'erreur React (écran d'erreur, export, retour au titre, plus d'écriture par-dessus les sauvegardes). | `js/engine.js`, `js/main.js` (`GardeFou`, `Racine`) | `tsauvegardes` (19 fichiers refusés), `tnavigateur` (10 fichiers importés, erreur de rendu provoquée) |
| B4 | Batterie complète, test navigateur et test du module de mise à jour obligatoires avant toute publication ; canal stable (`jeu-N`, branche `main`) séparé du canal d'essai (`essai-N`, branches de travail) ; plus aucune clé d'accès dans l'app ; signature Ed25519 du manifeste (`electron/cles-maj.js`). | `.github/workflows/*`, `electron/maj.js`, `electron/main.js`, `electron/paquet-jeu.js`, `package.json` | `electron/test-maj.js` (canaux, signatures) |
| (découvert) | Les définitions d'affaires générées sont toujours reconstruites au chargement : les identifiants se répètent d'une partie à l'autre et un dossier chargé pouvait prendre les faits d'une autre partie ouverte dans la même séance. | `js/generator.js` (`restoreGenerated`) | `tsauvegardes` |
| M1 | Enregistrement 0,8 s après chaque action, et tout de suite quand la fenêtre se cache ou se ferme ; l'app Mac attend la fin de l'écriture avant de fermer. | `js/main.js`, `electron/main.js` | `tnavigateur` |
| M2 | Installer une autre partie (nouvelle, importée, autre emplacement) recopie d'abord la carrière en cours dans « Partie précédente ». | `js/main.js` (`installerPartie`) | `tnavigateur` |
| M3 | La fin de carrière s'enregistre ; le titre propose « Revoir la fin de carrière ». | `js/main.js` | `tnavigateur`, `tsauvegardes` |
| M4 | L'interface est remontée à neuf à chaque partie posée (`CR.poserPartie`). | `js/main.js` | `tnavigateur` |
| M5 | Bouton de pause au-dessus du décor des scènes plein écran, Échap ouvre le menu partout, l'audience est suspendue menu ouvert. | `js/main.js`, `js/ui-court.js`, `index.html` | `tnavigateur` |

Restes de la phase 1, hors de portée de cette session : générer la paire de clés de signature et poser le secret
`MAJ_SIGNATURE` (à faire par le propriétaire du dépôt : `node electron/cles-maj.js`) ; créer la branche `main` ; signature
et notarisation Apple (phase 7).

### Phase 2 — majeurs M6 à M12 (14 novembre 2026)

| Anomalie | Modification | Fichiers | Test |
|---|---|---|---|
| M6 | Interdiction temporaire : `CR.suspendu` lu partout — aucun client n'arrive, permanences rayées et inscriptions refusées, contacts transmis, bandeau au bureau, courrier de fin, collaboration rompue. | `js/systems.js`, `js/engine.js`, `js/generator.js`, `js/ui-desk.js` | `tmajeurs` |
| M7 | `subj` → `subject` (5 courriels) ; `CR.mail` signale tout message sans objet (erreur visible par la batterie) et rattrape l'ancienne clé. | `js/carriere.js`, `js/cassation.js`, `js/engine.js` | `tmajeurs`, `tcarriere`, `tcassation` |
| M8 | « Avancer » demande confirmation s'il reste une audience, une permanence ou une échéance de l'agenda ce jour-là (`CR.resteAujourdhui`). | `js/engine.js`, `js/main.js` | `tmajeurs` |
| M9 | Rétrocession au prorata des jours ouvrés travaillés (les jours d'arrêt sont retenus) ; avertissement puis rupture du contrat après des mois d'arrêt ; rupture immédiate en cas d'interdiction. Décision : la rétrocession reste la contrepartie du travail du cabinet, abstrait en énergie (matinées) — ce n'est pas un revenu sans activité ; ce qui manquait, c'était qu'elle cesse quand ce travail n'est pas fait. | `js/carriere.js` | `tmajeurs` |
| M10 | L'honoraire de résultat entre dans le prix perçu par le client (40 % de son montant, `CR.FEE_ESPERE`, la même part que l'honoraire attendu par le cabinet) et dans le rapport au prix juste. | `js/systems.js` | `tmajeurs` |
| M11 | La CARPA sert : le premier versement à la victime est un vrai mouvement de fonds (dépôt, cinq jours ouvrés de bonne fin, versement contre reçu ; trop tard = fonds restitués, pas de reçu). L'autre chemin existe (compte du cabinet, reçu immédiat) : maniement hors CARPA, erreur au débrief, contrôle une fois sur deux, réclamation au bâtonnier. `carpaToOperating`, jamais appelée, est retirée : aucun parcours ne prélève d'honoraires sur des fonds de clients. | `js/flow-penal.js`, `js/gen-tribunal.js`, `js/engine.js` | `tmajeurs` |
| M12 | Passé 23 h 30, le travail demandé se paie en énergie (tarif de nuit) et en sommeil perdu (`s.veille`, déduit de la récupération). | `js/engine.js` | `tmajeurs` |
| (découvert) | L'audience commençait derrière l'animation de trajet, qui recouvrait aussi le bouton de pause : elle attend maintenant la fin du trajet. | `js/ui-court.js`, `js/ui-moments.js` | `tnavigateur` |

### Phases 3 à 5 — cohérence, carrières longues, économie (14 novembre 2026)

| Sujet | Modification | Fichiers | Test |
|---|---|---|---|
| Permanences sans règle | Huit inscriptions par mois au plus, une seule permanence de jour par date, désinscription jusqu'à l'avant-veille (les appels planifiés sont retirés) ; le tableau montre le décompte. `CR.signDuty` reste l'acte brut (les parties automatiques des tests s'en servent). | `js/systems.js`, `js/ui-desk.js` | `tmajeurs` |
| Collaboration plus rentable que l'installation | Les matinées du cabinet prennent vraiment la matinée : la journée du collaborateur commence à 13 heures ; six matinées par mois lui sont laissées pour ses audiences et ses permanences, au-delà le jour est retenu. | `js/carriere.js`, `js/main.js` | `tviabilite`, `tcarriere` |
| Code d'exemple refusé | L'exemple affiché est un vrai code (`GEN2.codeExemple`). | `js/gen-moteur.js`, `js/main.js` | `tmajeurs` |
| Code mort | Retirés : `CR.updateDevenir` (épilogue évolutif jamais branché, rien ne l'annonçait au joueur), `CR.staffOf`, `CR.caseDay`, `CR.carpaToOperating`. Gardés : `CR.pinTexts` (parties automatiques), `CR.hire` / `CR.letGo` (alias d'équipe). | `js/systems.js`, `js/engine.js` | batterie |
| « Ouvrir le dossier des sauvegardes » | Entrée de menu retirée de l'app : le dossier ne contient aucun fichier lisible ; l'export de fichier du menu du jeu la remplace. | `electron/main.js` | — |
| Automate « joueur moyen » | `dev/tools/carriere-auto.js` : carrière simulée sur le vrai moteur (hypothèses écrites en tête du fichier). | `dev/tools/carriere-auto.js` | `tviabilite` |

Mesures du 14 novembre (20 graines, 12 mois) : joueur moyen 20/20 solvables, trésorerie médiane 74 901 €, 8,2 missions de
permanence et 4 clients payants par mois ; collaborateur 74 318 € ; cabinet passif : faillite au jour 119. Carrière de cinq
ans : 997 dossiers, 6,6 Mo, sérialisation 46 ms, rechargement 2 s, trésorerie 539 944 €.

**Point ouvert (équilibrage, non bloquant pour la robustesse, à trancher par la direction du jeu)** : l'économie est très
généreuse pour un joueur actif ; l'argent n'a pas d'emploi au-delà de l'équipe et de l'association. Le modèle suppose 75 %
des contacts convertis à 90 % du prix juste et dix heures de travail par dossier : ces hypothèses sont à confronter à des
parties réellement jouées avant tout réglage. Leviers : fréquence des clients selon la réputation (`CR.dailyLeads`), prix
juste (`CR.fairForfait`), impayés, charges de la deuxième année.

**Point ouvert (taille)** : les contacts jamais suivis (540 sur 997 en cinq ans) pèsent 2,8 Mo. Les retirer demande de
garder leurs signatures (affaires sans doublon) et de vérifier toutes les lectures de `s.cases` : reporté, la taille n'est
plus un blocage depuis IndexedDB.

### Phases 6 et 7 — finitions et distribution (14 novembre 2026)

| Sujet | Modification | Fichiers | Test |
|---|---|---|---|
| Prise en main | Le niveau d'aide (libre ou assisté) se choisit à la création de la carrière et se change dans le menu : la décision D-57 (« l'aide est un choix du joueur ») n'avait aucun réglage à l'écran. Le tutoriel reste retiré (D-84) ; les conseils de Me Varenne et les courriers d'ouverture font la prise en main. | `js/main.js`, `index.html` | `tnavigateur` |
| Crédits et licences | Écran « Crédits et licences » (titre, menu) ; `LICENCES.md`, `fonts/OFL.txt`, `lib/LICENCES.txt` livrés avec le jeu. | `js/main.js`, fichiers de licences | `tnavigateur` |
| Accessibilité | `lang="fr"` ; fenêtres : le focus y entre, Tab y reste, il revient d'où il venait. | `index.html`, `js/ui-base.js` | `tnavigateur` |
| Texte | Un revolver a un barillet de six coups (plus de « chargeur garni de onze cartouches »). | `js/cat-base.js`, `js/cat-biens.js` | `tmajeurs` |
| Version | Libellé « 1.0 bêta » tant que la checklist n'est pas cochée (`CR.JEU.etat`), `package.json` en `1.0.0-beta.1`. Remplacé le 15 novembre 2026 par la numérotation MAJEUR.MINEUR.CORRECTIF de `js/version.js` (0.9.0 « La parole », build, canal, notes de mise à jour) : la 1.0 sera la sortie officielle (voir `PUBLICATION.md`). | `js/version.js`, `package.json` | `tson` |
| Distribution macOS | Icône (`build/icon.png`, `dev/tools/icone.js`), `hardened runtime` et droits, zip arm64 et x64, signature « Developer ID » et notarisation pilotées par des secrets, vérifications `codesign` / `spctl` / `stapler`, app construite lancée par `test:app`, app stable non signée refusée. | `package.json`, `build/*`, `.github/workflows/construire-app.yml` | non exécutable ici (macOS) |
| Procédure | `PUBLICATION.md`, `README.md`. | — | — |

Fonctionnalités inachevées relevées par l'audit — décision : **aucune n'est annoncée au joueur** (vérifié : pas de mention
« bientôt », pas d'entrée de menu inerte) ; elles sont reportées après la 1.0 plutôt que retirées ou bâclées :
jurisprudence sous les articles (bloquée par l'accès aux données ouvertes de la Cour de cassation, D-83), requête en
exclusion du bulletin n° 2 après jugement (D-86), assignation devant le juge civil (module à cadrer), PLEX, fusion des deux
moteurs de violences, autres décors de vidéosurveillance.

## Checklist de sortie 1.0 — état au 14 novembre 2026

| Critère | État | Preuve ou motif |
|---|---|---|
| Aucune anomalie B ou M ouverte | **Fait** pour le code ; B4 dépend de deux actions du propriétaire (clé de signature, branche `main`) | journal ci-dessus |
| Batterie verte en intégration continue ; aucune publication sans elle | **Fait** | workflow « Publier le jeu » : une exécution rouge a bloqué la publication, les suivantes sont vertes |
| Sauvegarder et recharger à tout instant de toute scène : aucun dossier bloqué | **Fait** pour l'audience (test de bout en bout) ; mécanisme commun à toutes les scènes plein écran, non rejoué scène par scène | `tnavigateur`, `tsauvegardes` |
| Fermer l'app à tout moment : au plus une action perdue | **Fait** dans le navigateur ; fermeture de la fenêtre de l'app Mac **non vérifiée** (code écrit, pas d'Electron ici) | `tnavigateur` |
| Carrière de cinq ans : place, durée d'enregistrement, échec signalé | **Fait** sur modèle (6,6 Mo, 46 ms) ; 9 Mo écrits et relus dans IndexedDB ; échec signalé | `tviabilite`, `tnavigateur` |
| Vingt fichiers corrompus : zéro écran blanc | **Fait** (19 en jsdom, 10 importés dans Chromium) | `tsauvegardes`, `tnavigateur` |
| Automate « joueur moyen » solvable à 12 mois dans 70 % des graines ; aucun revenu sans activité | **Fait** sur modèle (20/20) ; l'équilibrage fin reste ouvert (économie très généreuse) | `tviabilite` |
| 100 000 clics aléatoires dont des parties menées au jugement : zéro erreur | **Non fait** : 20 000 clics à l'audit, peu profonds ; à refaire sur le code corrigé | — |
| 60 images par seconde sur le Mac cible le plus modeste | **Non vérifiable ici** (rendu logiciel) | à mesurer sur matériel |
| App signée, notarisée, icône, aucune clé embarquée, mise à jour signée | Icône et retrait de la clé **faits** ; signature, notarisation et clé de signature **en attente des secrets** | `PUBLICATION.md` |
| Crédits et licences ; attestation de relecture juridique | Crédits **faits** ; licence du code à choisir ; relecture juridique **non faite** | `LICENCES.md` |
| Pause depuis toute scène ; `lang` ; parcours complet au clavier | Pause et `lang` **faits** ; focus des fenêtres **fait** ; parcours complet au clavier **non vérifié** (décors cliquables du bureau) | `tnavigateur` |
| Chaque fonctionnalité annoncée est atteignable ou retirée | **Fait** pour ce que l'audit avait relevé (interdiction, CARPA, code d'exemple, dossier des sauvegardes) | `tmajeurs` |

**Conclusion à cette date : La Permanence n'est pas prête pour la 1.0.** Restent : les secrets de signature et la branche
`main`, la mesure sur matériel réel, l'essai d'endurance au clic, la relecture juridique, le réglage de l'économie, la
vérification de l'app Mac construite.
