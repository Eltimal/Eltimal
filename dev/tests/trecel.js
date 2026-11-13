// Refonte, lot 1 ter : le recel — prix payé, valeur, registre. node tests/trecel.js   « échecs: 0 » attendu.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const tout = (PZ, t) => Object.keys(PZ.docs).map((k) => { try { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" "); } catch (e) { return ""; } }).join("\n");
  let n = 0, normaux = 0;
  for (let i = 0; i < 20000 && n < 25; i++) {
    const genre = ["ci", "gav", "copj"][i % 3];
    let t; try { t = G.tirer("trc" + i, genre, { day: 12 + (i % 9), inf: "recel" }); } catch (e) { continue; }
    if (!t || t.inf !== "recel" || !SIM.supporte(t) || !t.flagrance) continue;
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    const T = tout(PZ, t), tag = `${genre} ${t.f.sc} ${t.sig.slice(0, 30)}`;
    const m = /déclare avoir acheté (?:les appareils|l'objet) (\d+) euros/.exec(T);
    if (!m) continue;
    n++;
    ok(+m[1] === t.f.prix, `${tag} : prix payé différent du tirage`, `${m[1]} / ${t.f.prix}`);
    const nm = !!PZ.facts.G_prix_normal; if (nm) normaux++;
    ok(nm !== !!PZ.facts.G_prix_derisoire, `${tag} : prix ni normal ni dérisoire`);
    ok(t.f.sc !== "boutique" || /registre des achats d'occasion/.test(T), `${tag} : registre non évoqué pour la boutique`);
    ok(!/registre des achats d'occasion de la boutique mentionne/.test(T) === !PZ.facts.G_registre, `${tag} : registre dit et noté différemment`);
  }
  ok(n >= 10, "trop peu de recels tirés", n);
  console.log(`recels : ${n} · prix normaux ${normaux}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
