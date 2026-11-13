// Refonte, lot 1 ter : le harcèlement — la période des messages. node tests/tharcelement.js   « échecs: 0 » attendu.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" | "); };
  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  let n = 0, courts = 0;
  for (let i = 0; i < 30000 && n < 20; i++) {
    const genre = ["copj", "op", "gav", "pc"][i % 4];
    let t; try { t = G.tirer("thc" + i, genre, { day: 12 + (i % 9), inf: "harcelement_moral" }); } catch (e) { continue; }
    if (!t || !/^harcelement/.test(t.inf) || !SIM.supporte(t)) continue;
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    if (!PZ.docs.captures) continue;
    const C = txt(PZ, "captures", t);
    const js = [...C.matchAll(/(\d{1,2})(?:er)? (janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre) (\d{4}), \d+/g)].map((m) => Math.round(new Date(+m[3], MOIS.indexOf(m[2]), +m[1]).getTime() / 864e5));
    if (js.length < 2) continue;
    n++;
    const court = js[js.length - 1] - js[0] <= 2; if (court) courts++;
    ok(court === !!PZ.facts.G_periode_courte, `${genre} ${t.sig.slice(0, 30)} : période dite et notée différemment`, JSON.stringify(js));
  }
  ok(n >= 8, "trop peu de harcèlements avec captures datées", n);
  console.log(`harcèlements : ${n} · périodes courtes ${courts}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
