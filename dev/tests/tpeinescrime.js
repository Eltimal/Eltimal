// Refonte, lot 7 : la peine criminelle choisie et motivée. node tests/tpeinescrime.js   « échecs: 0 » attendu.
// Étalon « Les condamnations en 2022 » : réclusion ~64 % (avec emprisonnement ferme), réclusion moyenne 15 ans (homicides
// 18, viols 13), perpétuité ~1,6 % des réclusions, emprisonnement ferme ~5,4 ans ; jamais de réclusion sous dix ans,
// jamais d'emprisonnement sous deux ans ; motifs (art. 132-1) écrits.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 13 }); CR.store.s = s; s.settings.saisie = "liste";
  let n = 0, perp = 0, recl = 0, empr = 0, motifs = 0, sursisTot = 0, partiel = 0, surete = 0; const ans = [], dec = [], mois = [];
  for (let i = 0; i < 1500 && n < 300; i++) {
    let cs; try { cs = CR.GEN.open(s, "info", {}); } catch (e) { continue; }
    const t = CR.GEN.paramsOf(s, cs.id).t; const I = CR.CAT.INF[t.inf]; if (!/^crim/.test(I.fam) || t.mineur) continue;
    cs.vars.jurProces = t.jur; cs.vars.reglement = { qual: "q" };
    let d; try { d = CR.runHook(s, cs, "decider", { st: { played: new Set(), dernierMot: "regrets" } }); } catch (e) { ok(false, `${cs.id} : ${e.message}`); continue; }
    if (!d.coupable || !d.peine) continue;
    if (!d.qualif || !d.qualif.encourue || d.qualif.encourue.prison <= 120) continue; // requalifié en délit : peine délictuelle
    n++;
    const pn = d.peine;
    if (pn.choisie && (pn.regles || []).some((r) => /132-1/.test(r))) motifs++;
    if (pn.perpetuite) perp++;
    else if (pn.ferme >= 120) { recl++; ans.push(pn.ferme / 12); if (I.deces) dec.push(pn.ferme / 12); }
    else {
      // art. 132-18 : un an au moins, deux si la perpétuité est encourue ; art. 132-31 et 132-41 : sursis jusqu'à cinq ans
      const tot = pn.ferme + pn.sursis, perpEnc = d.qualif.encourue.prison >= (CR.CAT.PERPETUITE || 1200);
      ok(tot >= (perpEnc ? 24 : 12), `${cs.id} : emprisonnement sous le plancher de l'art. 132-18`, `${tot} mois, perpétuité encourue : ${perpEnc}`);
      ok(!pn.sursis || tot <= 60, `${cs.id} : sursis sur un emprisonnement de plus de cinq ans`, tot);
      ok(!pn.sursis || pn.sursisType === "probatoire" || !CR.GEN.paramsOf(s, cs.id).t.A.casier, `${cs.id} : sursis simple malgré une condamnation antérieure`);
      if (pn.sursis && !pn.ferme) sursisTot++; else { empr++; mois.push(pn.ferme); if (pn.sursis) partiel++; }
    }
    if (pn.reclusion) ok(!pn.sursis, `${cs.id} : réclusion avec sursis`);
    // art. 132-23 : la sûreté de plein droit seulement pour les infractions que la loi désigne
    if (/sûreté/.test(pn.texte || "")) { surete++; ok(CR.GEN2.sureteDePleinDroit(Object.assign({ nature: "crime" }, d.qualif)), `${cs.id} : période de sûreté de plein droit pour ${d.qualif.court}`, pn.texte); }
  }
  const SP = CR.GEN2.sureteDePleinDroit;
  ok(!SP({ nature: "crime", court: "art. 221-1 CP" }) && SP({ nature: "crime", court: "art. 221-3 CP" }) && !SP({ nature: "crime", court: "art. 222-23 et 222-24 CP" }) && SP({ nature: "crime", court: "art. 322-6 et 322-10 CP" }), "liste de la sûreté de plein droit (art. 132-23) mal lue");
  ok(surete > 0, "aucune période de sûreté de plein droit");
  const moy = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  const pr = (perp + recl) / Math.max(1, n);
  ok(n >= 200, "trop peu de condamnations criminelles", n);
  ok(pr > 0.55 && pr < 0.7, "part de la réclusion hors de l'étalon (60 %)", pr.toFixed(2));
  // étalon 2022 : réclusion 60 %, emprisonnement ferme 22,5 %, le reste (17,5 %) sans peine ferme
  const ps = sursisTot / Math.max(1, n);
  ok(ps > 0.1 && ps < 0.25, "part des emprisonnements entièrement assortis du sursis hors de l'étalon (17,5 %)", ps.toFixed(2));
  ok(moy(ans) > 13.5 && moy(ans) < 17.5, "réclusion moyenne hors de l'étalon (15 ans)", moy(ans).toFixed(1));
  ok(!dec.length || moy(dec) > moy(ans), "les homicides ne sont pas plus lourdement punis");
  ok(perp / Math.max(1, perp + recl) < 0.05, "trop de perpétuités", perp);
  ok(moy(mois) / 12 > 3.5 && moy(mois) / 12 < 6.5, "emprisonnement moyen hors de l'étalon (5,4 ans)", (moy(mois) / 12).toFixed(1));
  ok(motifs >= n * 0.9, "peines criminelles non motivées", `${motifs}/${n}`);
  console.log(`sursis total ${Math.round(ps * 100)} % · ferme ${Math.round((empr / Math.max(1, n)) * 100)} % (dont sursis partiel ${partiel})`);
  console.log(`peines criminelles : ${n} · réclusion ${Math.round(pr * 100)} % (perpétuité ${perp}) · ${moy(ans).toFixed(1)} ans en moyenne (homicides ${moy(dec).toFixed(1)}) · emprisonnement ${(moy(mois) / 12).toFixed(1)} ans`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
