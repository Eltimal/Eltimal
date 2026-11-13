# Reprise de la refonte du gameplay

À lire en premier, avec `GAMEPLAY_STATE.md`, `GAMEPLAY_ROADMAP.md` et `GAMEPLAY_DECISIONS.md`. Mandat : direction autonome du chantier jusqu'à la livraison finale ; ne demander aucune validation à Kevin ; seule la livraison finale fait l'objet d'un rapport.

## Avant toute chose

1. `git fetch --all` ; partir de la branche la plus avancée entre `claude/keen-heisenberg-nk0cv3` et `claude/permanence-mac-app-graphics-wege0b` (fusionner l'autre dedans s'il le faut ; les deux publient le jeu sur le Mac, numéro = nombre de commits).
2. `cd dev && npm install` si `node_modules` manque. Navigateur : `CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (vérifier `ls /opt/pw-browsers`). Après une modification de `index.html`, `node tools/shot.js` régénère `tools/preview` avant toute capture par `tools/shotui.js`.
3. Batterie : `for t in t1 t2 t3 t4 t15 t20 tsim ttravail tdossier tson tgenjeu tparole ttribunal tplaidoirie tappel tcanaux tlibre tcite tclauses trepetition tgen; do node tests/$t.js; done` (chaque test affiche `errors: none` ou `échecs: 0`).

## Où on en est

Phase A : A1 à A4 faits (parole en garde à vue, tribunal qui raisonne, procès-verbal tiré de l'audition, entretiens libres, plaidoirie par catalogue). A4 bis (débats intégraux), A5 (débrief « ce qu'il fallait demander »), B1 (canaux) faits. B2 commencé (ordre mélangé, fonds commun). Prochain : B2 suite (réécrire les formules des gabarits à longueur égale), A4 ter (incidents en gestes), C1 (étalons économiques : aide juridictionnelle, honoraires, cotisations, peines prononcées), puis lot 1 ter.

## Contrôle d'ensemble

`node tests/tboucle.js 7` puis `3`, `5`, `9` : la boucle principale en mode libre, de bout en bout (5 et 9 vont jusqu'à la comparution immédiate).

## Prochaine action

Voir la colonne « État » de `GAMEPLAY_ROADMAP.md` : le premier livrable qui n'est pas « Fait ».
