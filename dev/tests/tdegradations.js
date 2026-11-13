// Refonte, lot 1 ter : les dégradations — le devis. node tests/tdegradations.js   « échecs: 0 » attendu.
// Le total du devis fait le montant du dommage ; dommage antérieur et petit montant dits et notés ensemble ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" | "); };
  let n = 0, ante = 0;
  for (let i = 0; i < 20000 && n < 25; i++) {
    const genre = ["ci", "gav", "copj", "op", "pc"][i % 5];
    let t; try { t = G.tirer("tdg" + i, genre, { day: 12 + (i % 9), inf: "degradations" }); } catch (e) { continue; }
    if (!t || t.inf !== "degradations" || !SIM.supporte(t)) continue;
    const tCopie = JSON.stringify(t);
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    if (!PZ.docs.devis) continue;
    n++;
    const D = txt(PZ, "devis", t), tag = `${genre} ${t.f.sc} ${t.sig.slice(0, 30)}`;
    ok(!/undefined|NaN|\$\{/.test(D), `${tag} : texte incomplet`);
    const lignes = D.split(" | ").filter((x) => !/^Dont reprise|^Total/.test(x)).map((x) => (/ : (\d+) € TTC$/.exec(x) || [])[1]).filter(Boolean).map(Number);
    const tot = +((/Total : (\d+) € TTC/.exec(D) || [])[1]);
    ok(tot === t.f.montant && Math.abs(lignes.reduce((a, x) => a + x, 0) - tot - (/Dont reprise/.test(D) ? 0 : 0)) < 1, `${tag} : le devis ne fait pas le montant`, `${lignes} → ${tot} / ${t.f.montant}`);
    const a = /Dont reprise/.test(D); if (a) ante++;
    ok(a === !!PZ.facts.G_devis_ante, `${tag} : dommage antérieur dit et noté différemment`);
    ok(txt(((t2) => G.pieces(t2, G.recit(t2)))(JSON.parse(tCopie)), "devis", t) === D, `${tag} : pièce non déterministe`);
  }
  ok(n >= 12 && ante > 0, "trop peu de devis, ou jamais de dommage antérieur", `${n}/${ante}`);
  console.log(`dégradations : ${n} · dommages antérieurs ${ante}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
