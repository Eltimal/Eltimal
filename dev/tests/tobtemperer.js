// Refonte, lot 1 ter : le refus d'obtempérer. node tests/tobtemperer.js   « échecs: 0 » attendu.
// Constatation au dossier ; conducteur vu ou non, insignes : dits et notés ensemble ; barrage toujours en uniforme ;
// déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" | "); };
  let n = 0, nonVu = 0, ins = 0;
  for (let i = 0; i < 20000 && n < 30; i++) {
    const genre = ["ci", "gav", "copj"][i % 3];
    let t; try { t = G.tirer("tob" + i, genre, { day: 12 + (i % 9), inf: "refus_obtemperer" }); } catch (e) { continue; }
    if (!t || t.inf !== "refus_obtemperer" || !SIM.supporte(t) || !t.flagrance) continue;
    const tCopie = JSON.stringify(t);
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    const tag = `${genre} ${t.f.sc} ${t.sig.slice(0, 30)}`;
    if (!PZ.docs.pv_sommation) { ok(false, `${tag} : pas de constatation`); continue; }
    n++;
    const P = txt(PZ, "pv_sommation", t);
    ok(!/undefined|NaN|\$\{/.test(P), `${tag} : texte incomplet`);
    const nv = /n'a pu être vu|ne peut être décrit/.test(P); if (nv) nonVu++;
    ok(nv === !!PZ.facts.G_conducteur_non_vu, `${tag} : conducteur vu dit et noté différemment`);
    const civ = /en tenue civile(?!, porteurs du brassard)/.test(P); if (civ) ins++;
    ok(civ === !!PZ.facts.G_insignes, `${tag} : insignes dits et notés différemment`);
    ok(t.f.sc !== "barrage" || /tenue d'uniforme/.test(P), `${tag} : barrage sans uniforme`);
    ok(txt(((t2) => G.pieces(t2, G.recit(t2)))(JSON.parse(tCopie)), "pv_sommation", t) === P, `${tag} : pièce non déterministe`);
  }
  ok(n >= 15, "trop peu de refus d'obtempérer tirés", n);
  ok(nonVu > 0 && nonVu < n, "conducteur non vu : jamais, ou toujours", `${nonVu}/${n}`);
  console.log(`refus d'obtempérer : ${n} · conducteurs non vus ${nonVu} · sans insignes mentionnés ${ins}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
