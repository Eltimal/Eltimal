// Refonte : l'ordonnance de règlement et l'arrêt de la chambre de l'instruction au format réel. node tests/tchins.js
// « échecs: 0 » attendu. Ordonnance (art. 176, 177, 179, 181, 184, 185, 186, 186-3, 706-120, 706-121 : le juge
// d'instruction n'ordonne ni hospitalisation ni mesure de sûreté) ; arrêt (191, 194, 197, 198, 199, 200, 206, 567-2, 568, 574).
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 500) : "")); } };
  const { CR, errors } = boot();
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 29 }); CR.store.s = s; s.settings.saisie = "liste";
  const tx = (D) => [].concat(...D.paras).map((x) => (typeof x === "string" ? x : x.t)).join("\n");
  const vus = { nonlieu: 0, irresp: 0, oma: 0, ortc: 0, dp: 0, reglement: 0, nullite: 0 };
  const ex = {};
  for (let i = 0; i < 1500 && (vus.oma < 10 || vus.dp < 6 || vus.reglement < 8 || vus.nullite < 4 || vus.ortc < 3 || vus.irresp < 2); i++) {
    let cs; try { cs = CR.GEN.open(s, "info", {}); } catch (e) { continue; }
    const t = CR.GEN.paramsOf(s, cs.id).t, def = CR.caseDef(cs), api = CR.api(s, cs);
    if (!def.docs || !def.docs.ordo_reglement || !CR.hookExists(cs, "_reglement")) continue;
    cs.status = "active"; cs.vars.statut = "mex"; cs.vars.avis175Day = s.day - 40;
    if (i % 3 === 0) cs.vars.obs175 = { v: "nonlieu", points: (t.enjeux || []).map((z) => z.id), day: s.day - 50 };
    try { CR.runHook(s, cs, "_reglement", {}); } catch (e) { ok(false, `${cs.id} : ${e.message}`); continue; }
    const R0 = cs.vars.reglement; if (!R0) continue;
    vus[R0.type]++;
    const T = tx(def.docs.ordo_reglement({ s, cs, def, api })), id = `${cs.id} (${R0.type})`;
    ok(/^Nous, .+, juge d'instruction/.test(T) && /, né(e)? /.test(T) && /mis(e)? en examen le/.test(T), `${id} : identité de l'article 184 absente`, T.slice(0, 400));
    ok(/Vu l'avis de fin d'information du .+ \(art\. 175\)/.test(T) && /réquisitoire définitif/.test(T), `${id} : visas de l'article 175`);
    ok(/Éléments à charge : /.test(T) && /Éléments à décharge : /.test(T) && /\(art\. 184\)/.test(T), `${id} : charge et décharge (art. 184)`);
    ok(/dans les dix jours de sa notification ; le procureur de la République dans le même délai \(art\. 185\)/.test(T), `${id} : appel`);
    if (R0.type === "nonlieu") ok(/n'y avoir lieu à suivre/.test(T) && /art\. 177/.test(T), `${id} : non-lieu`);
    if (R0.type === "oma") ok(/Ordonnons la mise en accusation .+ \(art\. 181\)/.test(T) && /du code pénal/.test(T) && /art\. 186\)/.test(T), `${id} : mise en accusation`);
    if (R0.type === "ortc") ok(/Ordonnons le renvoi .+ \(art\. 179\)/.test(T) && /186-3/.test(T), `${id} : renvoi`);
    if (R0.type === "irresp") ok(/charges suffisantes établissant/.test(T) && /706-120/.test(T) && !/soins psychiatriques|interdisons/.test(T), `${id} : irresponsabilité (le juge d'instruction n'ordonne ni soins ni interdiction)`, T.slice(-700));
    ok(!/\bde [aeiouyéèêàâîôûœ]/i.test(T.replace(/de l'|de la |de le|de ses /g, "")), `${id} : élision oubliée`, (T.match(/.{30}\bde [aeiouyéèêàâîôû].{20}/i) || [])[0]);
    if (!ex[R0.type]) ex[R0.type] = T;
    // appel du règlement
    if (vus.reglement < 10 && ["oma", "nonlieu", "ortc", "irresp"].includes(R0.type)) {
      cs.vars.appelForme = { type: R0.type, day: s.day, motif: true };
      try { CR.runHook(s, cs, "chinsDecider", { played: new Set() }); } catch (e) { ok(false, `${cs.id} chambre : ${e.message}`); continue; }
      vus.reglement++;
      const A = tx(def.docs.arret_chins({ s, cs, def, api }));
      ok(/deux conseillers \(art\. 191\)/.test(A) && /chambre du conseil \(art\. 199\)/.test(A) && /art\. 194/.test(A) && /art\. 197/.test(A) && /art\. 200/.test(A) && /art\. 568/.test(A), `${cs.id} : arrêt sur le règlement incomplet`, A.slice(0, 600));
      ok(/reçoit l'appel ; (confirme|infirme)/.test(A), `${cs.id} : dispositif de l'arrêt`, A.slice(-500));
      if (!ex.arretReglement) ex.arretReglement = A;
    }
    // appel de la détention
    if (vus.dp < 8 && CR.hookExists(cs, "jldDecider")) {
      cs.vars.reglement = null; cs.vars.jldDecision = "dp"; cs.vars.jldDay = s.day - 5;
      cs.vars.appelForme = { type: "dp", day: s.day - 4, motif: true };
      try { CR.runHook(s, cs, "chinsDecider", { played: new Set() }); } catch (e) { ok(false, `${cs.id} détention : ${e.message}`); continue; }
      vus.dp++;
      const A = tx(def.docs.arret_chins({ s, cs, def, api }));
      ok((t.mineur ? /chambre du conseil/ : /audience publique, la personne mise en examen étant majeure \(art\. 199, al\. 2\)/).test(A) && /art\. 567-2/.test(A) && /art\. 144/.test(A), `${cs.id} : arrêt sur la détention`, A.slice(0, 700));
      if (!ex.arretDp) ex.arretDp = A;
    }
    // requête en nullité
    if (vus.nullite < 5 && def.anomalies && Object.keys(def.anomalies).length) {
      const flag = Object.keys(def.anomalies)[0];
      cs.proc.moyens = [{ flag, recevable: true, grief: true }, { flag: "inexistant", recevable: false, motif: "le moyen n'a pas été soulevé dans le délai de six mois de l'article 173-1" }];
      try { CR.runHook(s, cs, "_arretNullites", {}); } catch (e) { ok(false, `${cs.id} nullités : ${e.message}`); continue; }
      vus.nullite++;
      const A = tx(def.docs.arret_chins({ s, cs, def, api }));
      ok(/requête motivée .+ \(art\. 173\)/.test(A) && /Sur le moyen tiré de/.test(A) && /reçoit la requête ; /.test(A), `${cs.id} : arrêt sur les nullités`, A.slice(0, 900));
      if (cs.proc.moyens[0].decision === "annule") ok(/art\. 206/.test(A) && /art\. 171 et 802/.test(A), `${cs.id} : annulation sans ses effets`);
      if (!ex.arretNullite) ex.arretNullite = A;
    }
  }
  ok(vus.oma >= 5 && vus.reglement >= 6 && vus.dp >= 5 && vus.nullite >= 3, "trop peu de décisions", JSON.stringify(vus));
  if (process.env.VOIR) for (const [k, v] of Object.entries(ex)) console.log(`\n===== ${k}\n${v}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("décisions :", JSON.stringify(vus));
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
