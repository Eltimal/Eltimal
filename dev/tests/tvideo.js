// Vidéosurveillance (js/video.js) : déterminisme, mêmes faits avec d'autres tenues, sac suivi de la victime à l'auteur,
// acteurs dans le champ au moment du geste, images sautées, ce que l'image permet, incrustation, temps de rendu.
// node tests/tvideo.js ; « échecs: 0 » attendu.
const path = require("path");
require(path.join(__dirname, "../../js/video.js"));
const V = globalThis.CR.video;
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log("ÉCHEC", m); } };
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// 1. déterminisme : même graine, même image, quel que soit l'ordre de rendu
{
  const A = V.extrait({ graine: "7", mode: "ir" }), B = V.extrait({ graine: "7", mode: "ir" });
  const t = A.scn.tG + 0.3;
  B.render(t + 5); B.render(2);
  ok(same(A.render(t), B.render(t)), "même graine : images différentes");
  ok(same(A.frames, B.frames) && JSON.stringify(A.sauts) === JSON.stringify(B.sauts), "même graine : cadence ou sauts différents");
}

// 2. mêmes faits, autres tenues : chorégraphie identique, tenues différentes
for (const g of ["1", "2", "3", "4", "5"]) {
  const a = V.extrait({ graine: g, grainetenues: "a", mode: "soir" }), b = V.extrait({ graine: g, grainetenues: "b", mode: "soir" });
  ok(a.scn.tG === b.scn.tG && a.scn.fuite === b.scn.fuite, `graine ${g} : faits changés avec les tenues`);
  for (const t of [3, a.scn.tG, a.scn.tG + 2, 18]) {
    const ea = a.etats(t), eb = b.etats(t);
    for (const id of Object.keys(ea)) if (ea[id] && eb[id] && id[0] !== "_") ok(Math.hypot(ea[id].pos[0] - eb[id].pos[0], ea[id].pos[1] - eb[id].pos[1]) < 1e-9, `graine ${g} : ${id} déplacé à ${t}`);
  }
  const ta = a.scn.acteurs.map((x) => V.decrire(x.tenue)).join("|"), tb = b.scn.acteurs.map((x) => V.decrire(x.tenue)).join("|");
  ok(ta !== tb, `graine ${g} : tenues identiques`);
}

// 3. le sac : à l'épaule de la victime, puis dans la main de l'auteur
for (const g of ["1", "2", "3", "8", "9"]) {
  const S = V.extrait({ graine: g });
  const avant = S.etats(S.scn.sac.tPrise - 1.5), apres = S.etats(S.scn.sac.tLache + 0.4);
  ok(avant._sac && dist(avant._sac.pos, avant.V.j.hipR) < 0.4, `graine ${g} : sac loin de la victime avant le geste`);
  ok(apres._sac && apres.A && dist(apres._sac.pos, apres.A.j.haR) < 0.2, `graine ${g} : sac pas dans la main de l'auteur après le geste`);
  ok(dist(avant.V.j.pelvis, avant.A.j.pelvis) > 1, `graine ${g} : auteur déjà sur la victime avant l'approche`);
  const geste = S.etats(S.scn.tG + 0.3);
  ok(dist(geste.V.j.pelvis, geste.A.j.pelvis) < 1.2, `graine ${g} : auteur trop loin au moment du geste`);
  // dans le champ au moment du geste
  for (const id of ["V", "A"]) { const p = S.ecran(geste[id].j.head); ok(p && p[0] > 10 && p[0] < V.W - 10 && p[1] > 10 && p[1] < V.H - 10, `graine ${g} : ${id} hors du champ au moment du geste`); }
  // l'auteur finit hors du champ ou dans l'escalier
  const fin = S.etats(S.duree - 0.5);
  ok(!fin.A, `graine ${g} : l'auteur ne quitte pas la scène`);
  ok(fin.V && fin.V.pose.py > 0.8, `graine ${g} : la victime ne s'est pas relevée`);
}

// 4. les acteurs sont dessinés (l'image diffère du décor seul autour de la victime)
{
  const S = V.extrait({ graine: "1", mode: "soir" });
  const t = S.scn.tG - 2, img = S.render(t), e = S.etats(t), p = S.ecran(e.V.j.chest);
  let diff = 0;
  const vide = V.extrait({ graine: "1", mode: "soir" }); vide.scn.acteurs.forEach((a) => { a.t0 = 1e9; });
  const fond = vide.render(t);
  for (let y = Math.round(p[1]) - 3; y <= Math.round(p[1]) + 3; y++) for (let x = Math.round(p[0]) - 2; x <= Math.round(p[0]) + 2; x++) { const i = (y * V.W + x) * 4; diff += Math.abs(img[i] - fond[i]) + Math.abs(img[i + 1] - fond[i + 1]); }
  ok(diff > 35 * 20, "victime invisible à l'image");
}

// 5. images sautées et horodatage
for (const g of ["1", "2", "3"]) {
  const S = V.extrait({ graine: g });
  ok(S.frames.every((t) => !S.sauts.some(([a, b]) => t >= a && t < b)), `graine ${g} : image enregistrée pendant un saut`);
  ok(S.frames.every((t, i) => i === 0 || t > S.frames[i - 1]), `graine ${g} : images dans le désordre`);
  ok(S.sauts.every(([a, b]) => Math.abs((a + b) / 2 - S.scn.tG) > 2.5), `graine ${g} : saut sur le geste sans qu'on l'ait demandé`);
  ok([8, 10, 12].includes(S.fps), `graine ${g} : cadence ${S.fps}`);
  ok(/^\d\d-\d\d-\d{4} \d\d:\d\d:\d\d$/.test(S.horodatage(5)), `graine ${g} : horodatage ${S.horodatage(5)}`);
  ok(S.indexA(S.scn.tG) >= 0 && S.frames[S.indexA(S.scn.tG)] <= S.scn.tG, `graine ${g} : indexA`);
}
{
  const S = V.extrait({ graine: "1", sauts: 1, sautsSurLeGeste: true });
  ok(S.sauts.length === 1, "sauts demandés non respectés");
}

// 6. ce que l'image permet : couleurs en infrarouge, visage
{
  const ir = V.extrait({ graine: "1", mode: "ir" }).lisible(), co = V.extrait({ graine: "1", mode: "soir" }).lisible();
  ok(/teinte/.test(ir.A.image) && !/teinte/.test(co.A.image), "infrarouge : couleurs nommées");
  ok(ir.A.visage === "traits du visage non discernables", "visage de l'auteur discernable à cette distance");
  ok(ir.A.reel === co.A.reel, "la tenue réelle dépend du mode de la caméra");
  ok(/capuche relevée/.test(V.extrait({ graine: "3" }).lisible().A.image) === (V.extrait({ graine: "3" }).scn.acteurs[1].tenue.tete === "capuche"), "capuche relevée mal rapportée");
}

// 7. tenues : accords et descriptions lisibles
{
  const seen = new Set();
  for (let g = 0; g < 300; g++) { const t = V.tenue("t" + g); const d = V.decrire(t); seen.add(t.haut); ok(!/undefined|NaN/.test(d), "description : " + d); if (t.haut === "doudoune") ok(!/doudoune (noir|blanc|gris|vert)(,|$)/.test(d), "accord : " + d); }
  ok(seen.size === Object.keys(V.VESTIAIRE.HAUTS).length, "vestiaire : hauts jamais tirés");
}

// 8. temps de rendu
{
  const S = V.extrait({ graine: "1" }), t0 = Date.now(), n = 20;
  for (let i = 0; i < n; i++) S.image(i * 7);
  const ms = (Date.now() - t0) / n;
  console.log(`rendu : ${ms.toFixed(1)} ms par image (Node)`);
  ok(ms < 150, "rendu trop lent");
}

console.log("échecs:", fails);
process.exitCode = fails ? 1 : 0;
