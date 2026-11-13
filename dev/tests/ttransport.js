// Refonte, lot 1 ter : le vol dans le métro au niveau de l'arrachage. node tests/ttransport.js   « échecs: 0 » attendu.
// Surveillance de la brigade des réseaux au dossier ; la poche dite par le policier et par la victime : fait du dossier
// si et seulement si elles diffèrent ; filature partie d'une station qui précède les faits sur la ligne ; rame bondée
// dite et notée ensemble ; complice et bourrade racontés quand la qualification les retient ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" "); };
  const L4 = ["Porte de Clignancourt", "Simplon", "Marcadet-Poissonniers", "Château-Rouge", "Barbès-Rochechouart", "Gare du Nord"];
  let n = 0, ecarts = 0, bondees = 0;
  for (let i = 0; i < 8000 && n < 30; i++) {
    const genre = ["ci", "gav", "copj"][i % 3];
    let t; try { t = G.tirer("ttr" + i, genre, { day: 12 + (i % 9), inf: "vol" }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t) || !t.f || t.f.sc !== "transport" || !t.flagrance) continue;
    const PZ = G.pieces(t, G.recit(t));
    const tag = `${genre} ${t.sig.slice(0, 40)}`;
    ok(PZ.docs.pv_surveillance, `${tag} : pas de procès-verbal de surveillance`);
    if (!PZ.docs.pv_surveillance) continue;
    n++;
    const S = txt(PZ, "pv_surveillance", t), V = PZ.docs.pv_victime ? txt(PZ, "pv_victime", t) : "";
    ok(!/undefined|NaN|\$\{/.test(S + V), `${tag} : texte incomplet`);
    const pS = (/la poche (droite|gauche) de son manteau/.exec(S) || [])[1], pV = (/la poche (droite|gauche) de mon manteau/.exec(V) || [])[1];
    ok(pS, `${tag} : la poche visée n'est pas dite`);
    if (pS && pV && pS !== pV) { ecarts++; ok(PZ.facts.G_poche_contra, `${tag} : l'écart sur la poche n'est pas un fait du dossier`); }
    else ok(!PZ.facts.G_poche_contra, `${tag} : écart signalé sans écart`);
    const fil = (/sur le quai de la station (.+?), remarquons/.exec(S) || [])[1], de = (/entre les stations (.+?) et /.exec(S) || [])[1];
    ok(fil && de && L4.indexOf(fil) >= 0 && L4.indexOf(fil) <= L4.indexOf(de), `${tag} : la filature part d'une station qui suit les faits`, fil + " → " + de);
    const bond = /rame bondée/.test(S); if (bond) bondees++;
    ok(bond === !!PZ.facts.G_rame_bondee, `${tag} : rame bondée dite et notée différemment`);
    const agg = t.f.agg || [];
    ok(!agg.includes("reunion") || /second individu/.test(S), `${tag} : le complice du vol en réunion n'apparaît pas`);
    ok(!agg.includes("violence0") || /bourrade/.test(S), `${tag} : la violence retenue n'est pas racontée`);
    ok(txt(G.pieces(JSON.parse(JSON.stringify(t)), G.recit(JSON.parse(JSON.stringify(t)))), "pv_surveillance", t) === S, `${tag} : pièce non déterministe`);
  }
  ok(n >= 15, "trop peu de vols dans le métro tirés", n);
  ok(ecarts > 0 && ecarts < n, "l'écart sur la poche n'apparaît jamais, ou toujours", `${ecarts}/${n}`);
  console.log(`vols dans le métro : ${n} · rames bondées ${bondees} · écarts sur la poche ${ecarts}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
