// 1.1.0 « L'accueil » : le menu principal retravaillé.
// Le décor ne suit plus la souris ; la vue par la fenêtre est une nuit composée (jamais le plein jour), avec ses lumières ;
// le menu a une entrée dominante et range le reste ; hors du menu, l'en-tête se resserre (écran de création).
// La mise en page réelle (titre entier, création qui tient en 1440 × 900) se mesure dans tnavigateur.js.
const { boot, sleep, findBtn, click } = require("./harness");
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log("ÉCHEC", m); } };
(async () => {
  const { w, CR, doc, errors } = boot();
  await sleep(300);
  const A = CR.accueil, A2 = CR.accueil2;
  ok(A && A.ville && A.phaseOf, "l'accueil est chargé");
  // l'heure réelle règle la lumière, pas le sujet : jamais de plein jour
  const phases = new Set(); for (let h = 0; h < 24; h++) phases.add(A.phaseOf(new Date(2026, 10, 16, h, 30)));
  ok(!phases.has("jour") && phases.has("nuit") && phases.has("soir"), "nuit ou heure bleue à toute heure : " + [...phases]);
  // la vue : un ciel sombre en haut, des fenêtres allumées en bas, la tour et le tribunal repérés, un téléviseur
  for (const ph of ["nuit", "soir"]) {
    const EW = 138, EH = 94, V = A.ville(EW, EH, ph, true), c = V.E.c, lum = (x, y) => { const i = (y * EW + x) * 3; return 0.3 * c[i] + 0.59 * c[i + 1] + 0.11 * c[i + 2]; };
    let haut = 0, chaudes = 0; for (let x = 0; x < EW; x++) haut += lum(x, 2) / EW;
    for (let y = V.HZ; y < EH; y++) for (let x = 0; x < EW; x++) { const i = (y * EW + x) * 3; if (c[i] > 200 && c[i + 1] > 140 && c[i + 2] < 170) chaudes++; }
    ok(haut < (ph === "nuit" ? 22 : 45), ph + " : le haut du ciel est sombre (" + haut.toFixed(1) + ")");
    ok(chaudes > 60, ph + " : des fenêtres allumées en face (" + chaudes + " points)");
    ok(V.tk > 0 && V.th > EH * 0.3 && V.tx > EW * 0.6 && V.bx < EW * 0.45 && V.tv && V.fumee, ph + " : tour au loin à droite, tribunal au tiers gauche, téléviseur, fumée");
  }
  { const a = A.ville(138, 94, "nuit", true).E.c, b = A.ville(138, 94, "soir", true).E.c; let d = 0; for (let i = 0; i < a.length; i += 31) d += Math.abs(a[i] - b[i]); ok(d > 2000, "la nuit et l'heure bleue n'ont pas la même lumière"); }
  // le décor ne suit plus la souris : la vitre est la même, souris à gauche ou à droite
  if (A2 && A2.Scene2) {
    const vitre = (mx) => { const rnd = w.Math.random; let k = 1; w.Math.random = () => { k = (k * 16807) % 2147483647; return k / 2147483647; };
      const S = A2.Scene2(384, 240, 140), g = S.G; S.frame(3, { x: mx, y: 200 }, true); const out = []; for (let y = g.wy0; y < g.wy1; y++) for (let x = g.wx0; x < g.wx1; x++) { const j = (y * 384 + x) * 4; out.push(S.mat.c[j], S.mat.c[j + 1], S.mat.c[j + 2]); } w.Math.random = rnd; return out; };
    const a = vitre(150), b = vitre(370); let diff = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
    ok(a.length > 20000 && diff === 0, "la vue ne bouge pas avec la souris (" + diff + " valeurs différentes)");
  } else ok(false, "la scène de l'accueil (CR.accueil2.Scene2) est introuvable");
  // le menu : une seule entrée dominante, le reste rangé en liens
  const prim = doc.querySelectorAll(".ts-menu .ts-primary"), liens = doc.querySelectorAll(".ts-menu .ts-sec .ts-lien");
  ok(prim.length === 1 && /Nouvelle partie/.test(prim[0].textContent), "sans partie en cours, « Nouvelle partie » est l'entrée dominante");
  ok(liens.length >= 5 && [...liens].every((b) => !b.classList.contains("ts-primary")), "les autres entrées sont des liens secondaires (" + liens.length + ")");
  ok(/Permanence/.test(doc.querySelector(".ts-title").textContent) && !doc.querySelector(".ts-panel").classList.contains("ts-etroit"), "au menu, le titre est en grand");
  // hors du menu, l'en-tête se resserre ; la création prend la largeur
  await click(w, findBtn(doc, /^Nouvelle partie$/));
  const pan = doc.querySelector(".ts-panel");
  ok(pan.classList.contains("ts-etroit") && pan.classList.contains("ts-large") && !!doc.querySelector("#nc-nom") && !!doc.querySelector(".ts-title"), "création : en-tête resserré, titre toujours là");
  await click(w, findBtn(doc, /^Retour$/));
  ok(!doc.querySelector(".ts-panel").classList.contains("ts-etroit"), "retour au menu : le titre en grand");
  ok(errors.length === 0, "aucune erreur : " + errors.slice(0, 2).join(" | "));
  console.log("taccueil — échecs: " + fails);
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
