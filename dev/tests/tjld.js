// Refonte : les ordonnances du juge des libertés et de la détention au format réel. node tests/tjld.js   « échecs: 0 » attendu.
// Visas, débat contradictoire (art. 145 : public pour un majeur, de cabinet pour un mineur), objectifs de l'article 144 tirés du
// dossier (le 7° jamais en matière correctionnelle), insuffisance du contrôle judiciaire et de l'ARSE (137-3), obligations
// du contrôle judiciaire (138), durée (145-1, 145-2), notification (137-3), appel (186), référé-liberté (187-1).
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 400) : "")); } };
  const { CR, errors } = boot();
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 23 }); CR.store.s = s; s.settings.saisie = "liste";
  const vus = { dp: 0, cj: 0, arse: 0, mineur: 0, delit: 0, crime: 0, prolong: 0, sansAvocat: 0 };
  const tx = (D) => [].concat(...D.paras).map((x) => (typeof x === "string" ? x : x.t)).join("\n");
  let exemple = null;
  for (let i = 0; i < 1500 && (vus.dp < 25 || vus.cj + vus.arse < 10); i++) {
    let cs; try { cs = CR.GEN.open(s, "info", {}); } catch (e) { continue; }
    const t = CR.GEN.paramsOf(s, cs.id).t; const def = CR.caseDef(cs);
    if (!def.docs || !def.docs.ordo_dp_live || !CR.hookExists(cs, "jldDecider")) continue;
    cs.vars.statut = "mex"; cs.vars.ipcFait = s.day;
    if (i % 7 === 0) { cs.vars.jldSansAvocat = true; vus.sansAvocat++; }
    try { CR.runHook(s, cs, "jldDecider", { played: new Set(i % 2 ? ["arg:garanties", "arg:cj", "G_heberg", "G_emploi"] : []) }); } catch (e) { ok(false, `${cs.id} : ${e.message}`); continue; }
    const dec = cs.vars.jldDecision; vus[dec] = (vus[dec] || 0) + 1;
    const D = def.docs.ordo_dp_live({ s, cs, def, api: CR.api(s, cs) });
    const T = tx(D), id = `${cs.id} (${dec}${t.mineur ? ", mineur" : ""})`;
    const crime = t.q.nature === "crime"; vus[crime ? "crime" : "delit"]++; if (t.mineur) vus.mineur++;
    ok(/^Nous, .+, juge des libertés et de la détention/.test(T) && /Vu les articles 137 à 137-4/.test(T) && /mis(e)? en examen le/.test(T), `${id} : visas absents`, T.slice(0, 300));
    ok(t.mineur ? /audience de cabinet, la personne mise en examen étant mineure/.test(T) : /en audience publique/.test(T), `${id} : publicité du débat (art. 145)`);
    ok(/le ministère public en ses réquisitions, puis .+ en ses observations et .+ en sa plaidoirie/.test(T), `${id} : ordre du débat contradictoire`);
    ok(cs.vars.jldSansAvocat ? /l'avocat de permanence/.test(T) : /Me A B/.test(T), `${id} : avocat du débat`);
    ok(/copie intégrale contre émargement au dossier de la procédure \(art\. 137-3\)/.test(T) && /dix jours de sa notification \(art\. 186\)/.test(T), `${id} : notification ou appel`);
    if (dec === "dp") {
      ok(/unique moyen de parvenir aux objectifs suivants \(art\. 144\)/.test(T) && /\((1|2|3|5|6|7)°\) ;/.test(T), `${id} : objectifs de l'article 144 absents`);
      ok(crime || !/\(7°\)/.test(T), `${id} : trouble à l'ordre public en matière correctionnelle (art. 144, 7°)`);
      ok(/ne sauraient être atteints en cas de placement sous contrôle judiciaire ou d'assignation à résidence avec surveillance électronique : .+ \(art\. 137-3\)/.test(T), `${id} : insuffisance du contrôle judiciaire non motivée`);
      ok(/art\. 187-1/.test(T), `${id} : référé-liberté absent`);
      ok(new RegExp(`ne pourra excéder ${t.mineur ? "six mois" : crime ? "un an" : "quatre mois"}`).test(T), `${id} : durée de la détention`);
      ok(!/\((fresnes|sante|fleury|villepinte)\)/.test(T), `${id} : établissement désigné par son identifiant`);
      if (!exemple) exemple = T;
    } else {
      ok(/Disons n'y avoir lieu à placement en détention provisoire/.test(T) && (dec === "arse" ? /art\. 142-5/.test(T) : /\(2°\).+\(5°\).+\(9°\)/s.test(T)), `${id} : contrôle judiciaire ou ARSE sans ses obligations`, T.slice(-600));
      ok(!/187-1/.test(T), `${id} : référé-liberté hors détention`);
    }
    // la prolongation
    if (dec === "dp" && def.docs.ordo_prolong && CR.hookExists(cs, "prolongDecider") && vus.prolong < 12) {
      try { CR.runHook(s, cs, "prolongDecider", { played: new Set() }); } catch (e) { ok(false, `${cs.id} prolongation : ${e.message}`); continue; }
      const P = tx(def.docs.ordo_prolong({ s, cs, def, api: CR.api(s, cs) })); vus.prolong++;
      ok(new RegExp(crime ? "145-2" : "145-1").test(P) && /Vu l'ordonnance de placement en détention provisoire du/.test(P), `${id} : prolongation sans son article`, P.slice(0, 500));
      ok(cs.vars.prolongDecision === "dp" ? /Prolongeons la détention provisoire/.test(P) : /mise en liberté/.test(P), `${id} : dispositif de la prolongation`);
    }
  }
  ok(vus.dp >= 15 && vus.cj + vus.arse >= 5 && vus.prolong >= 5 && vus.crime && vus.delit, "trop peu d'ordonnances", JSON.stringify(vus));
  if (process.env.VOIR && exemple) console.log(exemple);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("ordonnances :", JSON.stringify(vus));
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
