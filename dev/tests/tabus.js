// Refonte, lot 1 ter : l'abus de confiance — le remboursement partiel. node tests/tabus.js   « échecs: 0 » attendu.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" | "); };
  let n = 0, rb = 0;
  for (let i = 0; i < 20000 && n < 20; i++) {
    const genre = ["copj", "op", "pc", "gav"][i % 4];
    let t; try { t = G.tirer("tab" + i, genre, { day: 12 + (i % 9), inf: "abus_confiance" }); } catch (e) { continue; }
    if (!t || t.inf !== "abus_confiance" || !SIM.supporte(t)) continue;
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    if (!PZ.docs.releve) continue;
    const R = txt(PZ, "releve", t);
    if (!/Compte courant n°/.test(R)) continue;
    n++;
    const r = /libellé « remboursement »/.test(R); if (r) rb++;
    ok(r === !!PZ.facts.G_remboursement, `${genre} ${t.sig.slice(0, 30)} : remboursement dit et noté différemment`);
  }
  ok(n >= 8 && rb > 0 && rb < n, "trop peu d'abus de confiance, ou remboursement jamais ou toujours", `${n}/${rb}`);
  console.log(`abus de confiance : ${n} · remboursements partiels ${rb}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
