// Refonte, lot 1 ter : la violation de domicile chez l'ex — le bail. node tests/tviolation.js   « échecs: 0 » attendu.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const tout = (PZ, t) => Object.keys(PZ.docs).map((k) => { try { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" "); } catch (e) { return ""; } }).join("\n");
  let n = 0, co = 0;
  for (let i = 0; i < 20000 && n < 20; i++) {
    const genre = ["ci", "gav", "copj"][i % 3];
    let t; try { t = G.tirer("tvd" + i, genre, { day: 12 + (i % 9), inf: "violation_domicile" }); } catch (e) { continue; }
    if (!t || t.inf !== "violation_domicile" || !SIM.supporte(t) || t.f.sc !== "ex") continue;
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    const T = tout(PZ, t), tag = `${genre} ${t.sig.slice(0, 30)}`;
    if (!/Vérification faite auprès du bailleur/.test(T)) continue;
    n++;
    const c = /toujours établi aux deux noms/.test(T); if (c) co++;
    ok(c === !!PZ.facts.G_cotitulaire, `${tag} : bail dit et noté différemment`);
    ok(!(c && /au seul nom de la plaignante/.test(T)), `${tag} : deux versions du bail`);
  }
  ok(n >= 8 && co > 0, "trop peu de violations chez l'ex, ou jamais de cotitulaire", `${n}/${co}`);
  console.log(`violations de domicile chez l'ex : ${n} · baux aux deux noms ${co}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
