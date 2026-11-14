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

