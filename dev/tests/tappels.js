// Refonte, lot 1 ter : les appels malveillants. node tests/tappels.js   « échecs: 0 » attendu.
// Compte exact de l'opérateur = nombre tiré ; estimation de la victime approximative (à 25 % près, arrondie) ; appels de
// nuit majoritaires si et seulement si la victime les dit la nuit ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" | "); };
  let n = 0;
  for (let i = 0; i < 20000 && n < 20; i++) {
    const genre = ["ci", "gav", "copj", "op", "pc"][i % 5];
    let t; try { t = G.tirer("tap" + i, genre, { day: 12 + (i % 9), inf: "appels_malveillants" }); } catch (e) { continue; }
    if (!t || t.inf !== "appels_malveillants" || !SIM.supporte(t)) continue;
    const tCopie = JSON.stringify(t);
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    if (!PZ.docs.pv_telephonie) continue;
    const T = txt(PZ, "pv_telephonie", t);
    const m = /sur la période : (\d+), dont (\d+) entre 22 heures et 6 heures/.exec(T);
    if (!m) continue;
    n++;
    const tag = `${genre} ${t.sig.slice(0, 40)}`;
    ok(+m[1] === t.f.nb, `${tag} : le compte de l'opérateur n'est pas le nombre d'appels`, `${m[1]} / ${t.f.nb}`);
    ok(t.f.nuit ? +m[2] > t.f.nb / 2 : +m[2] < t.f.nb / 2, `${tag} : appels de nuit incohérents avec la plainte`, `${m[2]}/${t.f.nb} nuit=${t.f.nuit}`);
    const V = PZ.docs.pv_victime ? txt(PZ, "pv_victime", t) : "";
    const est = (/j'en ai compté environ (\d+)/.exec(V) || [])[1];
    if (est) ok(Math.abs(+est - t.f.nb) <= t.f.nb * 0.25 + 10 && +est % 10 === 0, `${tag} : estimation de la victime invraisemblable`, `${est} / ${t.f.nb}`);
    ok(txt(((t2) => G.pieces(t2, G.recit(t2)))(JSON.parse(tCopie)), "pv_telephonie", t) === T, `${tag} : pièce non déterministe`);
  }
  ok(n >= 10, "trop peu d'appels malveillants avec téléphonie", n);
  console.log(`appels malveillants : ${n}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
