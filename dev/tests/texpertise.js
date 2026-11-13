// Refonte, lot 1 ter, pièces techniques : l'expertise composée par le moteur. node tests/texpertise.js   « échecs: 0 » attendu.
// Accidentologie : la fourchette de vitesse découle des traces et de l'adhérence écrites (v = √(2·μ·g·d)) ; marqueur de
// preuve conservé ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const rend = (PZ, k, t) => PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} });
  const txt = (r) => [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" | ");
  let n = 0, route = 0;
  for (let i = 0; i < 30000 && n < 30; i++) {
    const genre = ["ci", "gav", "copj", "op", "pc"][i % 5];
    let t; try { t = G.tirer("tex" + i, genre, { day: 12 + (i % 9), inf: i % 2 ? "blessures_routieres" : undefined }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t)) continue;
    const tCopie = JSON.stringify(t);
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    if (!PZ.docs.expertise) continue;
    const r = rend(PZ, "expertise", t), X = txt(r);
    if (!/Mission confiée par .* le \d/.test(X) || !/cote D/.test(JSON.stringify(r.entete || []))) continue;
    n++;
    const tag = `${genre} ${t.inf} ${t.sig.slice(0, 30)}`;
    ok(!/undefined|NaN|\$\{/.test(X), `${tag} : texte incomplet`);
    ok(/"f":"G_(expertise|circ_doute)"/.test(JSON.stringify(r.paras)), `${tag} : marqueur de preuve perdu`);
    const m = /sur (\d+) mètres, chaussée (sèche|mouillée) \(coefficient d'adhérence retenu : (0,\d)\)\. Vitesse du véhicule au début du freinage estimée entre (\d+) et (\d+) km\/h/.exec(X);
    if (m) { route++; const v = Math.sqrt(2 * +m[3].replace(",", ".") * 9.81 * +m[1]) * 3.6; ok(Math.abs((+m[4] + +m[5]) / 2 - v) < 1 && (m[2] === "sèche") === (m[3] === "0,7"), `${tag} : vitesse incohérente avec les traces`, m[0]); }
    ok(txt(rend(((t2) => G.pieces(t2, G.recit(t2)))(JSON.parse(tCopie)), "expertise", t)) === X, `${tag} : pièce non déterministe`);
  }
  ok(n >= 10 && route >= 5, "trop peu d'expertises composées par le moteur", `${n}/${route}`);
  console.log(`expertises : ${n} · accidentologie ${route}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
