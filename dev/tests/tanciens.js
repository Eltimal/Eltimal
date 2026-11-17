// 1.3.0 — ce qui existait avant ne change pas.
// 1. Les visages : un look d'avant la 1.3.0 (sans champ « b ») rend le même portrait au pixel près (toutes expressions).
// 2. Les affaires : un code de la version 4 du générateur (anciens noms) se rejoue à l'identique — tirage et pièces.
// Référence : tests/visages-or.json et tests/affaires-or.json, écrites avant la 1.3.0 (node tests/tanciens.js ecrire :
// à ne refaire que si une différence est voulue et relue).
const fs = require("fs"), path = require("path");
const { boot, sleep } = require("./harness");
const outil = require("./visages-outil");
const FV = path.join(__dirname, "visages-or.json"), FA = path.join(__dirname, "affaires-or.json");
(async () => {
  let echecs = 0; const vus = new Map();
  const ok = (c, k, d) => { if (c) return; echecs++; const n = (vus.get(k) || 0) + 1; vus.set(k, n); if (n <= 4) console.log("  ✗ " + k + (d !== undefined ? " — " + String(typeof d === "string" ? d : JSON.stringify(d)).slice(0, 300) : "")); };
  const { w, CR, errors } = boot(); await sleep(150);
  const ecrire = process.argv[2] === "ecrire";
  // ---------- visages
  const V = outil.brancher(w), vis = {};
  for (const [nom, look] of outil.looksAnciens(CR)) for (const e of outil.EXPRS) vis[nom + "|" + e] = V.rendre(CR, look, e);
  { const [, L] = outil.looksAnciens(CR)[3]; vis["clin"] = V.empreinte((() => { CR.px.portrait(Object.assign({}, L, { _t: 1 }), "neutral", true); return V.pixels(CR, L, "neutral"); })()); }
  // ---------- affaires de la version 4
  const G = CR.GEN2, aff = {};
  const h = (x) => CR.hash(typeof x === "string" ? x : JSON.stringify(x)).toString(36);
  const s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 7 }); s.pending = [];
  let i = 0;
  for (const genre of Object.keys(G.GENRES)) for (let k = 0; k < (genre === "info" ? 24 : 16); k++) {
    i++;
    let day = 100 + ((k * 3) % 40); while (!CR.isBusinessDay(day)) day++;
    const c = { v: 4, lie: false, genre, day, slot: genre === "gav" ? 60 + (k * 5) % 40 : 66, n: (k * 37 + i * 11) % 1024 };
    const cle = `${genre}:${c.day}:${c.slot}:${c.n}`;
    try {
      const p = G.paramsCode(s, c); CR.GEN.build(p); const cs = CR.openCase(s, p.id), def = CR.caseDef(cs);
      const docs = {};
      for (const d of Object.keys(def.docs || {})) { try { docs[d] = def.docs[d](cs, s); } catch (e) { docs[d] = "erreur"; } }
      const noms = ["A", "V", "T", "T2", "P", "R", "C2"].map((x) => p.t[x] && p.t[x].prenom ? p.t[x].prenom + " " + p.t[x].nom : "").join("/");
      aff[cle] = [h(p.t), h(docs), noms];
    } catch (e) { aff[cle] = ["erreur", String(e.message).slice(0, 60), ""]; }
  }
  if (ecrire) { fs.writeFileSync(FV, JSON.stringify(vis)); fs.writeFileSync(FA, JSON.stringify(aff, null, 0)); console.log("écrit :", Object.keys(vis).length, "portraits,", Object.keys(aff).length, "affaires ; erreurs de tirage :", Object.values(aff).filter((a) => a[0] === "erreur").length); process.exit(0); }
  const orV = JSON.parse(fs.readFileSync(FV, "utf8")), orA = JSON.parse(fs.readFileSync(FA, "utf8"));
  ok(Object.keys(orV).length > 900, "référence des visages trop courte", Object.keys(orV).length);
  for (const k of Object.keys(orV)) ok(vis[k] === orV[k], "un visage d'avant la 1.3.0 a changé", k);
  ok(Object.keys(orA).length >= 100, "référence des affaires trop courte", Object.keys(orA).length);
  for (const k of Object.keys(orA)) { const a = aff[k] || []; ok(a[2] === orA[k][2], "les noms d'une affaire de la version 4 ont changé", [k, a[2], orA[k][2]]); ok(a[0] === orA[k][0], "le tirage d'une affaire de la version 4 a changé", k); ok(a[1] === orA[k][1], "les pièces d'une affaire de la version 4 ont changé", k); }
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ").slice(0, 600)); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
