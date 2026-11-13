// Refonte, lot 1 ter : le point de deal et le guetteur au niveau de l'arrachage. node tests/tdeal.js   « échecs: 0 » attendu.
// Surveillance au dossier ; remises comptées pareil partout et datées dans l'ordre, avant l'interpellation ; cache et
// guetteur sans rien sur lui dits partout de la même façon et notés ; vue gênée dite et notée ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" "); };
  const H = /(\d+)[\s  ]h[\s  ](\d+)/g;
  const NB = { une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5 };
  let n = 0, caches = 0, guets = 0;
  for (let i = 0; i < 12000 && n < 30; i++) {
    const genre = ["ci", "gav", "copj"][i % 3];
    let t; try { t = G.tirer("tdl" + i, genre, { day: 12 + (i % 9), inf: "stups_trafic" }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t) || !t.f || !["point_deal", "guetteur"].includes(t.f.sc) || !t.flagrance) continue;
    const tCopie = JSON.stringify(t);
    const PZ = G.pieces(t, G.recit(t));
    const tag = `${genre} ${t.f.sc} ${t.sig.slice(0, 30)}`;
    ok(PZ.docs.pv_surveillance, `${tag} : pas de surveillance`);
    if (!PZ.docs.pv_surveillance) continue;
    n++;
    const S = txt(PZ, "pv_surveillance", t), I = PZ.docs.pv_interpellation ? txt(PZ, "pv_interpellation", t) : "";
    ok(!/undefined|NaN|\$\{/.test(S), `${tag} : texte incomplet`);
    const guet = t.f.sc === "guetteur"; if (guet) guets++;
    const remises = (S.match(/échange rapide/g) || []).length;
    const dit = (/remettre à (\S+) personnes successives/.exec(I) || [])[1];
    if (!guet) ok(remises >= 2 && (!dit || NB[dit] === remises), `${tag} : remises comptées différemment`, `${remises} / ${dit}`);
    const corps = S.split("rapportons les opérations suivantes")[1] || S;
    const hs0 = [...corps.matchAll(H)].map((m) => +m[1] * 60 + +m[2]);
    const hs = hs0.map((h) => (h - hs0[0] < -600 ? h + 1440 : h));
    ok(hs.every((h, k) => k === 0 || h >= hs[k - 1]), `${tag} : heures de la surveillance dans le désordre`, JSON.stringify(hs0));
    const cache = /les produits sont découverts (dans|sous) /.test(S) && !guet; if (cache) caches++;
    ok(cache === !!PZ.facts.G_cache, `${tag} : cache dite et notée différemment`);
    ok(!cache || !/^.*Interpellation ; découverte de /.test(I), `${tag} : l'interpellation met les produits sur lui`);
    ok(!guet || (PZ.facts.G_guet_rien && /rien de prohibé/.test(S) && !/Interpellation ; découverte de /.test(I)), `${tag} : le guetteur a la drogue sur lui`, I.slice(0, 300));
    ok(/L'observation se fait/.test(S) === !!PZ.facts.G_vue_genee, `${tag} : vue gênée dite et notée différemment`);
    ok(txt(((t2) => G.pieces(t2, G.recit(t2)))(JSON.parse(tCopie)), "pv_surveillance", t) === S, `${tag} : pièce non déterministe`);
  }
  ok(n >= 15, "trop peu de points de deal tirés", n);
  ok(caches > 0 && guets > 0, "ni cache ni guetteur tirés", `${caches}/${guets}`);
  console.log(`points de deal : ${n} · caches ${caches} · guetteurs ${guets}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
