// Refonte, lot 1 ter : le vol à la tire au niveau de l'arrachage. node tests/ttire.js   « échecs: 0 » attendu.
// Réquisition au dossier ; personne n'a vu la main (fait du dossier) ; objet au sol dit partout de la même façon et noté ;
// nombre de personnes vu par la victime et par les policiers ; heures dans l'ordre (abord, faits, découverte, réquisition,
// interpellation) ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" "); };
  const H = /(\d+)[\s  ]h[\s  ](\d+)/g;
  let n = 0, sol = 0;
  for (let i = 0; i < 8000 && n < 30; i++) {
    const genre = ["ci", "gav", "copj"][i % 3];
    let t; try { t = G.tirer("tti" + i, genre, { day: 12 + (i % 9), inf: "vol" }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t) || !t.f || t.f.sc !== "tire" || !t.flagrance) continue;
    const tCopie = JSON.stringify(t);
    const PZ = G.pieces(t, G.recit(t));
    const tag = `${genre} ${t.sig.slice(0, 40)}`;
    ok(PZ.docs.pv_requisition, `${tag} : pas de procès-verbal de réquisition`);
    if (!PZ.docs.pv_requisition) continue;
    n++;
    const R = txt(PZ, "pv_requisition", t), I = PZ.docs.pv_interpellation ? txt(PZ, "pv_interpellation", t) : "";
    ok(!/undefined|NaN|\$\{/.test(R), `${tag} : texte incomplet`);
    ok(PZ.facts.G_tire_pas_vu && /n'a pas vu qui l'a pris/.test(R), `${tag} : « personne n'a vu la main » n'est pas au dossier`);
    const auSol = /au sol, à un mètre/.test(R); if (auSol) sol++;
    ok(auSol === !!PZ.facts.G_objet_sol, `${tag} : objet au sol dit et noté différemment`);
    ok(!auSol || !/interpellée? en possession de/.test(I), `${tag} : l'interpellation dit « en possession » quand l'objet était au sol`, I.slice(0, 400));
    const corps = R.split("rapportons les opérations suivantes")[1] || R;
    const hs0 = [...corps.matchAll(H)].map((m) => +m[1] * 60 + +m[2]).slice(0, 4); // réquisition, abord, découverte, interpellation
    const hs = hs0.map((h) => (h - hs0[0] > 720 ? h - 1440 : hs0[0] - h > 720 ? h + 1440 : h));
    ok(hs.length === 4 && hs[1] < hs[2] && hs[2] <= hs[0] + 1 && hs[0] <= hs[3], `${tag} : heures dans le désordre`, JSON.stringify(hs));
    ok(txt(((t2) => G.pieces(t2, G.recit(t2)))(JSON.parse(tCopie)), "pv_requisition", t) === R, `${tag} : pièce non déterministe`);
  }
  ok(n >= 15, "trop peu de vols à la tire tirés", n);
  ok(sol > 0 && sol < n, "l'objet au sol n'apparaît jamais, ou toujours", `${sol}/${n}`);
  console.log(`vols à la tire : ${n} · objet au sol ${sol}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
