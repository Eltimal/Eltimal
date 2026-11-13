// Refonte, lot 1 ter : le cambriolage — ce qui est retrouvé, rapproché de la plainte. node tests/tcambriolage.js   « échecs: 0 » attendu.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" | "); };
  let n = 0, part = 0;
  for (let i = 0; i < 20000 && n < 20; i++) {
    const genre = ["ci", "gav", "copj", "op", "pc"][i % 5];
    let t; try { t = G.tirer("tcb" + i, genre, { day: 12 + (i % 9), inf: "cambriolage" }); } catch (e) { continue; }
    if (!t || t.inf !== "cambriolage" || !SIM.supporte(t)) continue;
    const tCopie = JSON.stringify(t);
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    if (!PZ.docs.pv_saisie) continue;
    const P = txt(PZ, "pv_saisie", t);
    n++;
    const tag = `${genre} ${t.sig.slice(0, 40)}`;
    ok(!/undefined|NaN|\$\{/.test(P), `${tag} : texte incomplet`);
    const rp = /Rapprochement avec la plainte/.test(P); if (rp) part++;
    ok(rp === !!PZ.facts.G_partiel, `${tag} : récupération partielle dite et notée différemment`, P.slice(-300));
    ok(txt(((t2) => G.pieces(t2, G.recit(t2)))(JSON.parse(tCopie)), "pv_saisie", t) === P, `${tag} : pièce non déterministe`);
  }
  ok(n >= 8, "trop peu de cambriolages avec perquisition", n);
  ok(part > 0, "aucune récupération partielle", `${part}/${n}`);
  console.log(`cambriolages : ${n} · récupérations partielles ${part}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
