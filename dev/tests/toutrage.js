// Refonte, lot 1 ter : l'outrage au niveau de l'arrachage. node tests/toutrage.js   « échecs: 0 » attendu.
// Déclaration du second fonctionnaire au dossier ; ses mots égaux à ceux des constatations, sauf écart noté ; propos à la
// cantonade dits dans les deux pièces et notés ; vidéo du passant dite et notée ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" "); };
  let n = 0, ecarts = 0, cant = 0;
  for (let i = 0; i < 12000 && n < 30; i++) {
    const genre = ["ci", "gav", "copj"][i % 3];
    let t; try { t = G.tirer("tou" + i, genre, { day: 12 + (i % 9), inf: "outrage" }); } catch (e) { continue; }
    if (!t || t.inf !== "outrage" || !SIM.supporte(t) || !t.flagrance) continue;
    const tCopie = JSON.stringify(t);
    const PZ = G.pieces(t, G.recit(t));
    const tag = `${genre} ${t.sig.slice(0, 40)}`;
    if (!PZ.docs.pv_collegue) { ok(!PZ.docs.pv_interpellation || !/« .+ »/.test(txt(PZ, "pv_interpellation", t)), `${tag} : pas de déclaration du second fonctionnaire`); continue; }
    n++;
    const C = txt(PZ, "pv_collegue", t), I = txt(PZ, "pv_interpellation", t);
    ok(!/undefined|NaN|\$\{/.test(C), `${tag} : texte incomplet`);
    const m1 = (/« (.+?) »/.exec(I) || [])[1], m2 = (/a dit : “(.+?)”/.exec(C) || [])[1];
    ok(m1 && m2, `${tag} : propos introuvables`, `${m1} / ${m2}`);
    if (m1 !== m2) { ecarts++; ok(PZ.facts.G_mots_ecart, `${tag} : écart sur les mots non noté`); } else ok(!PZ.facts.G_mots_ecart, `${tag} : écart noté sans écart`);
    const c1 = /sans se tourner vers nous/.test(I), c2 = /s'adressait à nous ou à tout le monde/.test(C); if (c2) cant++;
    ok(c1 === c2 && c2 === !!PZ.facts.G_cantonade, `${tag} : propos à la cantonade dits ou notés différemment`, `${c1}/${c2}/${!!PZ.facts.G_cantonade}`);
    ok(/a filmé la scène/.test(C) === !!PZ.facts.G_video_passant, `${tag} : vidéo du passant dite et notée différemment`);
    ok(txt(((t2) => G.pieces(t2, G.recit(t2)))(JSON.parse(tCopie)), "pv_collegue", t) === C, `${tag} : pièce non déterministe`);
  }
  ok(n >= 15, "trop peu d'outrages tirés", n);
  ok(ecarts > 0 && ecarts < n && cant > 0 && cant < n, "écart ou cantonade : jamais, ou toujours", `${ecarts}/${cant}/${n}`);
  console.log(`outrages : ${n} · écarts sur les mots ${ecarts} · à la cantonade ${cant}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
