# Reprise de la refonte du gameplay

À lire en premier, avec `GAMEPLAY_STATE.md`, `GAMEPLAY_ROADMAP.md` et `GAMEPLAY_DECISIONS.md`. Mandat : direction autonome du chantier jusqu'à la livraison finale ; ne demander aucune validation à Kevin ; seule la livraison finale fait l'objet d'un rapport.

## Avant toute chose

1. `git fetch --all` ; partir de la branche la plus avancée entre `claude/keen-heisenberg-nk0cv3` et `claude/permanence-mac-app-graphics-wege0b` (fusionner l'autre dedans s'il le faut ; les deux publient le jeu sur le Mac, numéro = nombre de commits).
2. `cd dev && npm install` si `node_modules` manque. Navigateur : `CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (vérifier `ls /opt/pw-browsers`). Après une modification de `index.html`, `node tools/shot.js` régénère `tools/preview` avant toute capture par `tools/shotui.js`.
3. Batterie : `for t in t1 t2 t3 t4 t15 t20 tsim ttravail tdossier tson tgenjeu tparole ttribunal; do node tests/$t.js; done` (chaque test affiche `errors: none` ou `échecs: 0`).

## Où on en est

Phase A, livrable A2 (lot 4a, tribunal qui raisonne) : voir la section du même nom dans `GAMEPLAY_STATE.md`.

## Prochaine action

Voir la colonne « État » de `GAMEPLAY_ROADMAP.md` : le premier livrable qui n'est pas « Fait ».
