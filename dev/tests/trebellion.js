// Refonte, lot 1 ter : la rébellion au niveau de l'arrachage. node tests/trebellion.js   « échecs: 0 » attendu.
// Déclaration du second fonctionnaire au dossier ; résistance passive et ordre des gestes dits et notés ensemble ;
// passants dits et notés ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" "); };
  let n = 0, passifs = 0, ordres = 0;
  for (let i = 0; i < 12000 && n < 30; i++) {
    const genre = ["ci", "gav", "copj"][i % 3];
    let t; try { t = G.tirer("trb" + i, genre, { day: 12 + (i % 9), inf: "rebellion" }); } catch (e) { continue; }
    if (!t || t.inf !== "rebellion" || !SIM.supporte(t) || !t.flagrance) continue;
    const tCopie = JSON.stringify(t);
    const PZ = G.pieces(t, G.recit(t));
    const tag = `${genre} ${t.sig.slice(0, 40)}`;
    ok(PZ.docs.pv_collegue, `${tag} : pas de déclaration du second fonctionnaire`);
    if (!PZ.docs.pv_collegue) continue;
    n++;
    const C = txt(PZ, "pv_collegue", t);
    ok(!/undefined|NaN|\$\{/.test(C), `${tag} : texte incomplet`);
    const p = /poids mort/.test(C), o = /clé de bras/.test(C); if (p) passifs++; if (o) ordres++;
    ok(p === !!PZ.facts.G_passif && o === !!PZ.facts.G_ordre, `${tag} : passivité ou ordre des gestes dits et notés différemment`);
    ok(!(p && /coups dans tous les sens/.test(C)), `${tag} : la même pièce dit poids mort et coups`);
    ok(/filmait/.test(C) === !!PZ.facts.G_video_passant, `${tag} : passants dits et notés différemment`);
    ok(txt(((t2) => G.pieces(t2, G.recit(t2)))(JSON.parse(tCopie)), "pv_collegue", t) === C, `${tag} : pièce non déterministe`);
  }
  ok(n >= 15, "trop peu de rébellions tirées", n);
  ok(passifs > 0 && passifs < n && ordres > 0 && ordres < n, "passivité ou ordre des gestes : jamais, ou toujours", `${passifs}/${ordres}/${n}`);
  console.log(`rébellions : ${n} · résistance passive ${passifs} · clé de bras d'abord ${ordres}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
