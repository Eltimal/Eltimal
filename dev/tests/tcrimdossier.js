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
  let n = 0, auto = 0, vois = 0, ecarts = 0, mineurs = 0, cvs = 0, appels = 0;
  for (let i = 0; i < 400 && n < 60; i++) {
    let t; try { t = G.tirer("tcd" + i, "info", { day: 30 }); } catch (e) { continue; } if (!t) continue;
    const tc = JSON.stringify(t);
    const N = G.recit(t), PZ = G.piecesCrim(t, N);
    n++;
    const tag = `${t.inf} ${t.sig.slice(0, 30)}`;
    const cs = Object.values(PZ.cotes); ok(new Set(cs).size === cs.length, `${tag} : cotes en double`);
    // sous-dossiers : personnalité (B), détention (C), fond (D) ; numérotation continue dans chacun ; titres à jour
    for (const [k, c] of Object.entries(PZ.cotes)) {
      const L = ["expertise_psy", "personnalite", "interro_cv"].includes(k) ? "B" : ["ordo_dp", "dml", "ordo_prolong"].includes(k) ? "C" : "D";
      ok(c[0] === L, `${tag} : ${k} cotée ${c} (sous-dossier ${L} attendu)`);
      ok(!PZ.titres[k] || PZ.titres[k].endsWith(`(${c})`), `${tag} : titre de ${k} sans sa cote`, PZ.titres[k]);
    }
    for (const L of ["B", "C", "D"]) { const ns = cs.filter((c) => c[0] === L).map((c) => +c.slice(1)).sort((a, b) => a - b); ok(ns.every((x, i) => x === i + 1), `${tag} : numérotation de la cote ${L} discontinue`, ns.join(",")); }
    // les secours : l'appel suit les faits de quelques minutes ; la personne qui a appelé est entendue après ; l'heure corrigée
    // du témoin est notée comme démentie par le journal des appels
    if (PZ.docs.requisition_appels) {
      appels++;
      const A1 = txt(rend(PZ, "requisition_appels", t)), A2 = txt(rend(PZ, "pv_appelant", t));
      ok(!/undefined|NaN|\$\{|\[object/.test(A1 + A2), `${tag} : pièces des secours incomplètes`, (A1 + A2).slice(0, 300));
      ok(A1 === txt(rend(PZ, "requisition_appels", t)) && A2 === txt(rend(PZ, "pv_appelant", t)), `${tag} : pièces des secours non déterministes`);
      const hA = H((/Appel reçu le [^|]* à ([^|(]+)/.exec(A1) || [])[1] || ""), h0 = ((t.d.h % 1440) + 1440) % 1440;
      ok(hA != null && ((hA - h0 + 1440) % 1440) >= 3 && ((hA - h0 + 1440) % 1440) <= 14, `${tag} : l'appel aux secours ne suit pas les faits`, `${hA} / ${h0}`);
      const W = CR.CRIMD.temoin(t, N);
      ok(!!PZ.facts.G_appel_heure === !!(W && W.corrige), `${tag} : heure corrigée du témoin et journal des appels`);
    }
    if (PZ.docs.interro_cv) { cvs++; const x = txt(rend(PZ, "interro_cv", t)); ok(!/undefined|NaN|\$\{|\[object/.test(x) && /curriculum|art\. 81/.test(x) && (x.match(/Question :/g) || []).length >= 6, `${tag} : interrogatoire de curriculum vitae incomplet`, x.slice(0, 300)); }
    for (const k of ["pv_transport", "inventaire_scelles", "pv_voisinage", "pv_autopsie", "commission_rogatoire", "pv_retour_cr", "pv_reaudition"]) if (PZ.docs[k]) { const x = txt(rend(PZ, k, t)); ok(!/undefined|NaN|\$\{|\[object/.test(x), `${tag}/${k} : texte incomplet`, (x.match(/.{40}(undefined|NaN).{20}/) || [""])[0]); }
    // l'enquête de personnalité en rapport (art. 81, al. 6) ; la synthèse développée, ses pièces citées par leur cote
    if (PZ.docs.personnalite) { const x = txt(rend(PZ, "personnalite", t)); ok(/art\. 81, al\. 6|socio-éducatifs/.test(x) && /PARCOURS SCOLAIRE ET PROFESSIONNEL/.test(x) && /PERSPECTIVES/.test(x) && !(/médecin|avocat|ingénieur/.test(t.A.metier || "") && /abandonnées|arrêtée à seize ans|CAP obtenu/.test(x)) && !/undefined|NaN/.test(x), `${tag} : enquête de personnalité incomplète ou incohérente avec le métier`, x.slice(0, 400)); }
    if (PZ.docs.pv_synthese) { const x = txt(rend(PZ, "pv_synthese", t)); ok(/CHRONOLOGIE/.test(x) && /INVESTIGATIONS CONDUITES/.test(x) && /\(D\d+\)/.test(x) && !/undefined|NaN/.test(x), `${tag} : synthèse sans chronologie ni investigations`, x.slice(0, 400)); }
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
    for (const [k, c] of [["rapport_adn", "adn"], ["balistique", "balistique"], ["toxico", "toxico"]]) if (PZ.docs[k]) {
      const R = txt(rend(PZ, k, t)), I = PZ.docs.inventaire_scelles ? txt(rend(PZ, "inventaire_scelles", t)) : "";
      const nR = (/Scellé n° (\w+) reçu/.exec(R) || [])[1];
      ok(/MÉTHODE/.test(R) && /RÉSERVES/.test(R), `${tag}/${k} : rapport sans méthode ni réserves`);
      if (nR) ok(new RegExp("Scellé n° " + nR + " — ").test(I), `${tag}/${k} : le scellé du rapport n'est pas à l'inventaire`, nR);
    }
    if (PZ.docs.pv_proche && PZ.facts.G_dernier_signe && PZ.docs.pv_autopsie) {
      const P = txt(rend(PZ, "pv_proche", t)), A2 = txt(rend(PZ, "pv_autopsie", t));
      const hD = H((/à (\d+[\s\u00a0\u202f]h[\s\u00a0\u202f]\d+)\./.exec(P) || [])[1] || ""), h0 = ((t.d.h % 1440) + 1440) % 1440;
      ok(hD != null && ((h0 - hD + 1440) % 1440) >= 20 && ((h0 - hD + 1440) % 1440) <= 150, `${tag} : le dernier signe de vie n'est pas antérieur aux faits`, `${hD} / ${h0}`);
    }
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
  // la copie du dossier ne contient pas une pièce qui n'est pas encore faite ; le greffe la transmet le jour venu
  {
    const g = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 8 }); g.settings.saisie = "liste"; CR.store.s = g;
    let c = null, jcv = null;
    for (let i = 0; i < 60 && !c; i++) { let x; try { x = CR.GEN.open(g, "info", {}); } catch (e) { continue; } const def = CR.caseDef(x); const P0 = CR.GEN.paramsOf(g, x.id); const PZ = P0 && P0.t ? G.piecesCrim(P0.t, G.recit(P0.t)) : null; if (PZ && PZ.jours && PZ.jours.interro_cv > g.day + 3 && (def.docs || {}).interro_cv) { c = x; jcv = PZ.jours.interro_cv; } }
    ok(c, "pas d'information dont l'interrogatoire de curriculum vitae est à venir");
    if (c) {
      c.status = "active";
      CR.runHook(g, c, "_copieDelivree", {});
      ok(!CR.hasDoc(c, "interro_cv"), "la copie contient un interrogatoire qui n'a pas encore eu lieu", `jour ${g.day}, interrogatoire le ${jcv}`);
      for (let k = 0; k < 80 && g.day <= jcv + 3; k++) CR.endDay(g);
      ok(CR.hasDoc(c, "interro_cv"), "l'interrogatoire de curriculum vitae n'est pas transmis le jour venu", `jour ${g.day}`);
    }
    CR.store.s = s;
  }
  ok(cvs >= n * 0.5, "trop peu d'interrogatoires de curriculum vitae", `${cvs}/${n}`);
  console.log(`dossiers criminels : ${n} · appels aux secours ${appels} · curriculum vitae ${cvs} · autopsies ${auto} · voisinages ${vois} (écarts notés ${ecarts}) · victimes mineures ${mineurs}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
