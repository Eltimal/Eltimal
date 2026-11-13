// Refonte, lot 1 ter, pièces techniques : le rapport du laboratoire accordé à la pesée. node tests/tlabo.js   « échecs: 0 » attendu.
// Même poids brut dans la pesée du service et dans le rapport ; poids net inférieur au brut, égal à la quantité retenue ;
// nature du produit conforme au tirage ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" "); };
  const g = (x) => (x ? +x.replace(",", ".") : null);
  let n = 0;
  for (let i = 0; i < 12000 && n < 40; i++) {
    const genre = ["ci", "gav", "copj"][i % 3];
    const inf = ["stups_trafic", "stups_detention", "stups_usage"][Math.floor(i / 3) % 3];
    let t; try { t = G.tirer("tlb" + i, genre, { day: 12 + (i % 9), inf }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t) || !t.f || !t.f.quantite) continue;
    const tCopie = JSON.stringify(t);
    const PZ = G.pieces(t, G.recit(t));
    if (!PZ.docs.rapport_labo || !PZ.docs.pv_pesee) continue;
    const L = txt(PZ, "rapport_labo", t);
    if (!/Pesée nette, hors emballages/.test(L)) continue; // ancien rapport (hors moteur)
    n++;
    const tag = `${genre} ${t.inf} ${t.sig.slice(0, 30)}`;
    const P = txt(PZ, "pv_pesee", t);
    ok(!/undefined|NaN|\$\{/.test(L), `${tag} : texte incomplet`);
    const bP = g((/poids brut ([\d,]+) g/.exec(P) || [])[1]), bL = g((/Poids brut déclaré par le service à la pesée : ([\d,]+) g/.exec(L) || [])[1]), nL = g((/Pesée nette, hors emballages : ([\d,]+) g/.exec(L) || [])[1]);
    ok(bP != null && bP === bL, `${tag} : poids brut différent entre la pesée et le laboratoire`, `${bP} / ${bL}`);
    ok(nL != null && nL < bL && Math.abs(nL - t.f.quantite) < 0.01, `${tag} : poids net incohérent`, `${nL} / ${bL} / ${t.f.quantite}`);
    ok(t.f.produit !== "cannabis" || /cannabis/.test(L), `${tag} : nature du produit différente du tirage`);
    ok(txt(((t2) => G.pieces(t2, G.recit(t2)))(JSON.parse(tCopie)), "rapport_labo", t) === L, `${tag} : rapport non déterministe`);
  }
  ok(n >= 15, "trop peu de rapports du laboratoire composés par le moteur", n);
  console.log(`rapports du laboratoire : ${n}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
