// Refonte, lot 7 : les pièces ajoutées au dossier criminel. node tests/tcrimdossier.js   « échecs: 0 » attendu.
// Transport et inventaire : mêmes scellés, même ordre ; autopsie : la fourchette contient l'heure des faits ; voisinage :
// écart d'heures noté si et seulement s'il dépasse 25 minutes ; jamais de voisinage ni de description pour une victime
// mineure ; textes complets ; cotes uniques ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const rend = (PZ, k, t) => PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {}, docs: [] }, def: {}, c: t.A, api: {} });
  const txt = (r) => [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" | ");
  const H = (x) => { const m = /(\d+)[\s  ]h[\s  ](\d+)/.exec(x); return m ? +m[1] * 60 + +m[2] : null; };
  let n = 0, auto = 0, vois = 0, ecarts = 0, mineurs = 0;
  for (let i = 0; i < 400 && n < 60; i++) {
    let t; try { t = G.tirer("tcd" + i, "info", { day: 30 }); } catch (e) { continue; } if (!t) continue;
    const tc = JSON.stringify(t);
    const N = G.recit(t), PZ = G.piecesCrim(t, N);
    n++;
    const tag = `${t.inf} ${t.sig.slice(0, 30)}`;
    const cs = Object.values(PZ.cotes); ok(new Set(cs).size === cs.length, `${tag} : cotes en double`);
    for (const k of ["pv_transport", "inventaire_scelles", "pv_voisinage", "pv_autopsie", "commission_rogatoire", "pv_retour_cr", "pv_reaudition"]) if (PZ.docs[k]) { const x = txt(rend(PZ, k, t)); ok(!/undefined|NaN|\$\{|\[object/.test(x), `${tag}/${k} : texte incomplet`, (x.match(/.{40}(undefined|NaN).{20}/) || [""])[0]); }
    if (PZ.docs.inventaire_scelles) {
      const T1 = txt(rend(PZ, "pv_transport", t)), T2 = txt(rend(PZ, "inventaire_scelles", t));
      const s1 = [...T1.matchAll(/Scellé n° (\w+) : ([^|]+)/g)].map((m) => m[1] + ":" + m[2].trim()), s2 = [...T2.matchAll(/Scellé n° (\w+) — ([^:|]+)/g)].map((m) => m[1] + ":" + m[2].trim());
      ok(s1.length && JSON.stringify(s1) === JSON.stringify(s2), `${tag} : scellés différents entre transport et inventaire`, JSON.stringify([s1, s2]));
    }
    if (PZ.docs.pv_autopsie) {
      auto++;
      const A = txt(rend(PZ, "pv_autopsie", t));
      const m = /entre ([\d\s  h]+?) et ([\d\s  h]+?)\./.exec(A);
      const a = m && H(m[1]), b = m && H(m[2]), h0 = ((t.d.h % 1440) + 1440) % 1440;
      const dans = a != null && b != null && (a <= b ? h0 >= a && h0 <= b : h0 >= a || h0 <= b);
      ok(dans, `${tag} : la fourchette du décès ne contient pas l'heure des faits`, `${m && m[0]} / ${h0}`);
    }
    if (N.procedural) { mineurs++; ok(!PZ.docs.pv_voisinage && !PZ.docs.pv_reaudition, `${tag} : voisinage ou seconde audition pour une victime mineure`); }
    { const P = txt(rend(PZ, "expertise_psy", t)); const et = t.f.psy || "intact";
      ok(/RÉPONSES AUX QUESTIONS/.test(P) && (et === "aboli" ? /aboli son discernement/.test(P) : et === "altere" ? /altéré son discernement/.test(P) : /ni aboli ni altéré|ayant aboli ou altéré/.test(P)), `${tag} : expertise psychiatrique incohérente avec l'état tiré (${et})`, P.slice(-300));
      ok(JSON.stringify(rend(PZ, "expertise_psy", t).paras).includes('"f":"X_psy"'), `${tag} : marqueur de l'expertise perdu`); }
    if (PZ.docs.pv_reaudition) { const R = txt(rend(PZ, "pv_reaudition", t)); ok(/Je me suis trompée? la première fois/.test(R) === !!PZ.facts.G_temoin_varie, `${tag} : correction du témoin dite et notée différemment`); }
    if (PZ.docs.pv_voisinage) {
      vois++;
      const V = txt(rend(PZ, "pv_voisinage", t));
      const hs0 = [...V.matchAll(/« vers ([^»]+) »/g)].map((m) => H(m[1])).filter((x) => x != null);
      const hs = hs0.map((x) => (x - hs0[0] > 720 ? x - 1440 : hs0[0] - x > 720 ? x + 1440 : x)); // passage de minuit
      const ec = hs.length > 1 ? Math.max(...hs) - Math.min(...hs) : 0;
      if (ec > 25) ecarts++;
      ok((ec > 25) === !!PZ.facts.G_heures_voisins, `${tag} : écart d'heures dit et noté différemment`, ec);
    }
    ok(txt(rend(G.piecesCrim(JSON.parse(tc), G.recit(JSON.parse(tc))), "pv_transport", t)) === txt(rend(PZ, "pv_transport", t)), `${tag} : pièce non déterministe`);
  }
  ok(n >= 40 && auto > 0 && vois > 0, "trop peu de dossiers, d'autopsies ou de voisinages", `${n}/${auto}/${vois}`);
  console.log(`dossiers criminels : ${n} · autopsies ${auto} · voisinages ${vois} (écarts notés ${ecarts}) · victimes mineures ${mineurs}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
