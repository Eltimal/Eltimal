// Refonte, lot 1 ter : le vol de deux-roues au niveau de l'arrachage. node tests/t2roues.js   « échecs: 0 » attendu.
// Constatations au dossier ; outil à la main ou au sol, engin déplacé ou non, visage vu ou non : dits d'une seule façon
// dans toutes les pièces et notés ; alerte avant l'arrivée ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" "); };
  const H = /(\d+)[\s  ]h[\s  ](\d+)/g;
  let n = 0, sol = 0, place = 0;
  for (let i = 0; i < 8000 && n < 30; i++) {
    const genre = ["ci", "gav", "copj"][i % 3];
    let t; try { t = G.tirer("t2r" + i, genre, { day: 12 + (i % 9), inf: "vol" }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t) || !t.f || t.f.sc !== "vehicule" || !t.flagrance) continue;
    const tCopie = JSON.stringify(t);
    const PZ = G.pieces(t, G.recit(t));
    const tag = `${genre} ${t.sig.slice(0, 40)}`;
    ok(PZ.docs.pv_constatations, `${tag} : pas de constatations`);
    if (!PZ.docs.pv_constatations) continue;
    n++;
    const C = txt(PZ, "pv_constatations", t), I = PZ.docs.pv_interpellation ? txt(PZ, "pv_interpellation", t) : "";
    ok(!/undefined|NaN|\$\{/.test(C), `${tag} : texte incomplet`);
    const auSol = /tournevis plat est au sol/.test(C); if (auSol) sol++;
    ok(auSol === !!PZ.facts.G_outil_sol, `${tag} : outil au sol dit et noté différemment`);
    ok(!auSol || !/tournevis à la main/.test(I), `${tag} : l'interpellation met l'outil dans sa main`, I.slice(0, 300));
    const enPlace = /est à sa place de stationnement/.test(C); if (enPlace) place++;
    ok(enPlace === !!PZ.facts.G_non_deplace && !enPlace === !!PZ.facts.G_deplace, `${tag} : déplacement dit et noté différemment`);
    ok(!/riverain/.test(C) || (/pas avoir vu le visage/.test(C) && PZ.facts.G_riverain_visage), `${tag} : le riverain identifie quelqu'un`);
    const corps = C.split("rapportons les opérations suivantes")[1] || C;
    const hs = [...corps.matchAll(H)].map((m) => +m[1] * 60 + +m[2]);
    const d = hs.length >= 2 ? (hs[1] - hs[0] + 1440) % 1440 : -1;
    ok(d > 0 && d < 60, `${tag} : alerte et arrivée dans le désordre`, JSON.stringify(hs));
    ok(txt(((t2) => G.pieces(t2, G.recit(t2)))(JSON.parse(tCopie)), "pv_constatations", t) === C, `${tag} : pièce non déterministe`);
  }
  ok(n >= 15, "trop peu de vols de deux-roues tirés", n);
  ok(sol > 0 && sol < n && place > 0 && place < n, "outil au sol ou engin resté en place : jamais, ou toujours", `${sol}/${place}/${n}`);
  console.log(`vols de deux-roues : ${n} · outil au sol ${sol} · engin resté en place ${place}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
