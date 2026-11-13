# Reprise de la refonte du gameplay

À lire en premier, avec `GAMEPLAY_STATE.md`, `GAMEPLAY_ROADMAP.md` et `GAMEPLAY_DECISIONS.md`. Mandat : direction autonome du chantier jusqu'à la livraison finale ; ne demander aucune validation à Kevin ; seule la livraison finale fait l'objet d'un rapport.

## Avant toute chose

1. `git fetch --all` ; partir de la branche la plus avancée entre `claude/keen-heisenberg-nk0cv3` et `claude/permanence-mac-app-graphics-wege0b` (fusionner l'autre dedans s'il le faut ; les deux publient le jeu sur le Mac, numéro = nombre de commits).
2. `cd dev && npm install` si `node_modules` manque. Navigateur : `CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (vérifier `ls /opt/pw-browsers`). Après une modification de `index.html`, `node tools/shot.js` régénère `tools/preview` avant toute capture par `tools/shotui.js`.
3. Batterie : `for t in t1 t2 t3 t4 t15 t20 tsim ttravail tdossier tson tgenjeu tparole ttribunal tplaidoirie tappel tcanaux tlibre tcite tclauses tpeines trepetition tgen; do node tests/$t.js; done` (chaque test affiche `errors: none` ou `échecs: 0`).

## Où on en est

Phase A : A1 à A4 faits (parole en garde à vue, tribunal qui raisonne, procès-verbal tiré de l'audition, entretiens libres, plaidoirie par catalogue). A4 bis (débats intégraux), A5 (débrief « ce qu'il fallait demander »), B1 (canaux) faits. B2 avancé (ordre mélangé, fonds commun, clauses voisines : 51 %). Lot 4 (peine choisie, `peines.js`) et C1 en partie (aide juridictionnelle) faits. Prochain : A4 ter (incidents en gestes), B1 bis (écrans e-Barreau), C2 (économie du cabinet), puis lot 1 ter.

## Contrôle d'ensemble

`node tests/tboucle.js 7` puis `3`, `5`, `9` : la boucle principale en mode libre, de bout en bout (5 et 9 vont jusqu'à la comparution immédiate).

## Prochaine action

Voir la colonne « État » de `GAMEPLAY_ROADMAP.md` : le premier livrable qui n'est pas « Fait ».

## Réseau

Cette session utilise l'environnement « eltimal — sources juridiques » (créé le 13 novembre 2026 : www.justice.gouv.fr et codes.droit.org ouverts). Sur l'environnement par défaut, ces sites sont refusés (403) : passer sur celui-ci avant toute recherche de sources.

## Reprise automatique

Une tâche planifiée ponctuelle (« Refonte du gameplay de La Permanence — reprise », 13 novembre 2026 à 3 h 38 UTC, échouée faute de crédits ; remplacée par « reprise 2 », 14 h 17 UTC) lance une session neuve avec la consigne du mandat. Elle n'a pas de connecteur GitHub : elle attache le dépôt par add_repo si besoin et pousse par git. Chaque session programme la suivante tant que la refonte n'est pas achevée.
