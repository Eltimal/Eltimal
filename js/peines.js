// La Permanence — refonte du gameplay, lot 4 : la peine choisie et motivée (CR.PEINES)
// Le tribunal ne multiplie plus les réquisitions : il choisit la nature de la peine, puis son quantum, d'après la gravité
// des faits (peine encourue, circonstances, ITT), le passé du prévenu (casier, récidive), son attitude et sa situation
// (faits reconnus, éléments de personnalité produits), la voie de poursuite, les réquisitions et le magistrat ; et il motive
// chaque choix (art. 132-1 CP : individualisation ; art. 132-19 : l'emprisonnement ferme en dernier recours, motivé).
// Étalon : « Les condamnations en 2022 », ministère de la Justice, SG/SSER (publié en avril 2026) — délits : amende 32 %,
// sursis total 26 % (simple 16 %, probatoire 11 %), emprisonnement ferme 16 %, sursis partiel 7 %, peines de substitution
// 15 % (jours-amende 6 %, TIG 3 %) ; partie ferme moyenne 9,6 mois (7,6 mois pour une seule infraction) ; RSJ 2026 (12.1) :
// 52 % des peines fermes font six mois ou moins, 35 % sont prononcées en comparution immédiate. Vérifié le 13 novembre 2026.
// Estimations (non publiées par infraction ni par voie dans ces sources) : le poids de chaque facteur et le surcroît de
// fermeté en comparution immédiate. Les règles d'aménagement (art. 132-19, 132-25, 131-4-1 CP) sont celles d'avant.
// Périmètre : délits des affaires générées. Le reste garde l'ancien calcul.
(function () {
  "use strict";
  const CR = window.CR;
  const K = (CR.PEINES = {});
  K.SOURCE = "Les condamnations en 2022, ministère de la Justice (SG/SSER), avril 2026 ; RSJ 2026, 12.1 — vérifié le 13 novembre 2026";
  // seuils sur l'échelle de sévérité z (calés pour retrouver la répartition nationale sur le mélange d'affaires du jeu)
  K.SEUILS = { amende: -0.15, simple: 0.5, proba: 1.12, partiel: 1.55 };
  const genT = (s, cs) => { const p = CR.GEN && CR.GEN.paramsOf ? CR.GEN.paramsOf(s, cs.id) : null; return p && p.t ? p.t : null; };
  K.actif = (s, cs) => { const t = genT(s, cs); return !!(t && t.genre !== "info" && t.A && !(CR.CAT && CR.CAT.INF[t.inf] && CR.CAT.INF[t.inf].info)); };
  const gauss = (r) => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  // l'échelle de sévérité : chaque facteur, et sa raison (pour la motivation)
  K.severite = function (api, r, ctx) {
    const { s, cs } = api;
    const t = genT(s, cs), A = t.A, I = (CR.CAT && CR.CAT.INF[t.inf]) || {};
    const enc = r.encourue && r.encourue.prison != null ? r.encourue.prison : 12;
    const f = [];
    const add = (v, why) => { if (v) f.push({ v, why }); };
    add(Math.log2(Math.max(2, enc || 2) / 36) * 0.55, null);
    add(((I.gravite || 0.4) - 0.4) * 1.6, null);
    add((((t.f && t.f.agg) || []).length) * 0.3, (t.f && t.f.agg || []).length ? "les circonstances dans lesquelles les faits ont été commis" : null);
    if (t.f && t.f.itt > 8) add(0.4, "l'incapacité totale de travail subie par la victime");
    if (A.casier) add(A.casier >= 2 ? 0.9 : 0.5, "les antécédents judiciaires du prévenu");
    if (t.rec && !cs.vars.recEcartee) add(1.1, "l'état de récidive légale");
    if (ctx.detenu) add(0.55, null);
    const perso = Math.min(5, ctx.personnalite || 0);
    if (perso) add(-0.32 * perso, "les garanties d'insertion produites par la défense (domicile, emploi, attaches)");
    if (t.stance === "reconnait") add(-0.3, "la reconnaissance des faits");
    const q = r.requis || {};
    if (q.ferme > 0) add(0.35, null);
    add(((ctx.juge && ctx.juge.severite) || 0.5) - 0.5, null);
    const z = f.reduce((a, x) => a + x.v, 0) + gauss(CR.seeded(cs.id + ":peine:" + s.seed)) * 0.45;
    return { z, f, t, A, I, enc };
  };

  K.calculer = function (api, r, ctx) {
    const { s, cs } = api;
    const S = K.severite(api, r, ctx);
    const { z, t, A, enc } = S;
    const P = CR.PROC;
    const amendeMax = (r.encourue && r.encourue.amende) || 0;
    const rv = CR.seeded(cs.id + ":nature:" + s.seed);
    const revenu = A.revenu || (A.emploi ? 1600 : 600);
    const peine = { ferme: 0, sursis: 0, sursisType: "simple", amende: 0, complementaires: ((r.requis && r.requis.complementaires) || []).slice(), amenagement: null, mandatDepot: false, regles: [] };
    const motifs = [];
    const raisons = S.f.filter((x) => x.why);
    const aggr = raisons.filter((x) => x.v > 0).map((x) => x.why), att = raisons.filter((x) => x.v < 0).map((x) => x.why);
    const liste = (a) => (a.length <= 1 ? a.join("") : a.slice(0, -1).join(", ") + " et " + a[a.length - 1]);
    motifs.push(`Le tribunal tient compte des circonstances de l'infraction, de la personnalité de son auteur et de sa situation matérielle, familiale et sociale (art. 132-1 du code pénal)${aggr.length ? ` : ${liste(aggr)}` : ""}${att.length ? `${aggr.length ? " ; mais aussi " : " : "}${liste(att)}` : ""}.`);
    const T = K.SEUILS;
    const sursisMois = (k) => Math.max(1, Math.min(enc, Math.round(Math.max(2, enc * 0.11) * Math.pow(1.35, z - T.amende) * k)));
    if ((z < T.amende || !enc) && amendeMax > 0) {
      // l'amende, ou les jours-amende pour qui a des revenus réguliers (art. 131-5 : 360 jours au plus, 1 000 € par jour au plus)
      if (enc && A.emploi && rv() < 0.3) {
        const n = Math.max(10, Math.min(360, Math.round(30 + (z + 1.2) * 40)));
        const taux = Math.max(5, Math.min(1000, Math.round(revenu / 30 / 3 / 5) * 5));
        peine.joursAmende = { n, taux };
        motifs.push(`Des jours-amende proportionnés aux revenus du prévenu sont adaptés (art. 131-5 du code pénal).`);
      } else {
        peine.amende = Math.max(150, Math.min(amendeMax, Math.round((revenu * (0.35 + Math.max(0, z + 1) * 0.5)) / 50) * 50));
        motifs.push("Une peine d'amende, adaptée à ses ressources, suffit à sanctionner les faits.");
      }
    } else if (!enc) {
      motifs.push("Aucune peine d'emprisonnement n'est encourue.");
    } else if (z < T.simple) {
      peine.sursis = sursisMois(0.8);
      motifs.push("Un emprisonnement assorti du sursis simple constitue un avertissement suffisant.");
    } else if (z < T.proba) {
      if (rv() < 0.35) {
        peine.tig = Math.max(20, Math.min(400, Math.round((60 + (z - T.simple) * 160) / 10) * 10));
        motifs.push(`Un travail d'intérêt général, auquel le prévenu a consenti à l'audience, répond à la gravité des faits (art. 131-8 du code pénal).`);
      } else {
        peine.sursis = sursisMois(1); peine.sursisType = "probatoire";
        motifs.push("Le sursis probatoire permet d'accompagner le prévenu et de prévenir la réitération (art. 132-40 du code pénal).");
      }
    } else {
      // l'emprisonnement ferme, en dernier recours (art. 132-19) : quantum tiré de la gravité, borné par la peine encourue
      const base = 2.3 * Math.pow(1.42, z - T.proba) * Math.max(0.6, Math.min(2.2, enc / 36));
      let ferme = Math.max(2, Math.min(enc, Math.round(base)));
      if (t.rec && !cs.vars.recEcartee) ferme = Math.min(enc, Math.round(ferme * 1.25));
      if (z < T.partiel) { peine.ferme = Math.max(2, Math.round(ferme * 0.6)); peine.sursis = Math.max(1, Math.min(enc - peine.ferme, Math.round(ferme * 0.8))); peine.sursisType = rv() < 0.85 ? "probatoire" : "simple"; }
      else peine.ferme = ferme;
      motifs.push("La gravité des faits et la personnalité de leur auteur rendent indispensable une peine d'emprisonnement sans sursis, toute autre sanction étant manifestement inadéquate (art. 132-19 du code pénal).");
    }
    // le plafond de la peine encourue
    if (peine.ferme + peine.sursis > enc) { const k = enc / (peine.ferme + peine.sursis); peine.ferme = Math.floor(peine.ferme * k); peine.sursis = Math.floor(peine.sursis * k); }
    // les règles d'aménagement (reprises du calcul d'avant)
    const perso = Math.min(5, ctx.personnalite || 0);
    if (peine.ferme > 0 && peine.ferme <= 1) { peine.sursis += peine.ferme; peine.ferme = 0; peine.regles.push("Une peine ferme d'un mois ou moins est interdite (art. 132-19 CP) : elle devient du sursis."); }
    if (peine.ferme > 1 && peine.ferme <= 6) {
      if (perso >= 1 || !ctx.sansDomicile) { peine.amenagement = "DDSE"; peine.regles.push("Ferme de six mois au plus : aménagement obligatoire sauf impossibilité (art. 132-19 et 132-25 CP)."); }
      else { peine.mandatDepot = !!ctx.detenu; peine.regles.push("Ferme de six mois au plus, mais l'absence de domicile rend l'aménagement impossible."); }
    } else if (peine.ferme > 6 && peine.ferme <= 12) {
      if (perso >= 2) { peine.amenagement = "DDSE"; peine.regles.push("Ferme de six mois à un an : le tribunal choisit d'aménager, la personnalité le permet (art. 132-25 CP)."); }
      else { peine.mandatDepot = !!ctx.detenu || ((ctx.juge && ctx.juge.severite) || 0.5) > 0.7; peine.regles.push("Ferme de six mois à un an : aménagement possible mais non retenu, le dossier de personnalité est trop mince."); }
    } else if (peine.ferme > 12) {
      peine.mandatDepot = true;
      peine.regles.push("Ferme de plus d'un an : pas d'aménagement ab initio ; le tribunal peut décerner mandat de dépôt.");
    }
    peine.regles = motifs.concat(peine.regles);
    peine.choisie = true;
    // pour le débrief (A5) : ce qui a pesé, et ce que la défense aurait pu mettre en balance
    peine.facteurs = S.f.filter((x) => x.why).map((x) => ({ why: x.why, sens: x.v > 0 ? "aggr" : "att" }));
    peine.manques = [];
    if (!perso) peine.manques.push("Aucune garantie d'insertion n'a été produite (domicile, emploi, attaches) : le tribunal n'avait rien à mettre en balance. Les justificatifs se réunissent avant l'audience, auprès du client et de ses proches.");
    if (t.stance !== "reconnait" && !(t.doutes || []).length) peine.manques.push("Les faits étaient établis et contestés jusqu'au bout : la reconnaissance compte dans le choix de la peine, quand la défense au fond n'a pas de prise.");
    peine.texte = K.texte(peine);
    return peine;
  };
  // ------------------------------------------------------------------ lot 7 : la peine criminelle
  // Étalon : « Les condamnations en 2022 » (SG/SSER) — crimes : réclusion criminelle 60 %, emprisonnement ferme 22,5 % (dans
  // le rapport, sans les sursis : réclusion 64 %, emprisonnement 36 %) ; réclusion à temps de 15 ans en moyenne (homicides
  // 18, viols 13, vols criminels 14) ; perpétuité 1,6 % des réclusions ; emprisonnement ferme pour crime de 5,4 ans en
  // moyenne. Règle du jeu (art. 131-1, texte du jeu) : réclusion à temps de dix ans au moins, sinon emprisonnement. Le
  // sursis reste exclu en matière criminelle et l'emprisonnement ne descend pas sous deux ans (planchers de l'art. 132-18
  // non relus sur source). Poids des facteurs : estimations, calées sur ces proportions.
  K.SEUILS_CRIME = { reclusion: -0.2, perpetuite: 2.35 };
  K.actifCrime = (s, cs) => { const t = genT(s, cs); const I = t && CR.CAT && CR.CAT.INF[t.inf]; return !!(t && I && /^crim/.test(I.fam || "") && !t.mineur); };
  K.calculerCrime = function (api, r, ctx) {
    const { s, cs } = api;
    const t = genT(s, cs), A = t.A || {}, I = CR.CAT.INF[t.inf] || {};
    const enc = r.encourue && r.encourue.prison != null ? r.encourue.prison : 240;
    const perp = enc >= (CR.CAT.PERPETUITE || 1200);
    const encA = perp ? 360 : Math.min(enc, 360);
    const f = [];
    const add = (v, why) => { if (v) f.push({ v, why }); };
    add(((I.gravite || 0.7) - 0.75) * 2.2, null);
    add(I.deces ? 0.35 : 0, I.deces ? "la mort de la victime" : null);
    add((((t.f && t.f.agg) || []).length) * 0.25, ((t.f && t.f.agg) || []).length ? "les circonstances aggravantes retenues" : null);
    if (A.casier) add(A.casier >= 2 ? 0.6 : 0.3, "les antécédents judiciaires de l'accusé");
    if (t.rec && !cs.vars.recEcartee) add(0.7, "l'état de récidive légale");
    const altere = (t.f && t.f.psy === "altere") || (cs.vars.renfort && cs.vars.renfort.altere);
    if (altere) add(-0.9, "l'altération du discernement au moment des faits (art. 122-1, al. 2)");
    const perso = Math.min(5, ctx.personnalite || 0);
    if (perso) add(-0.22 * perso, "les éléments de personnalité produits par la défense");
    if (t.stance === "reconnait") add(-0.35, "la reconnaissance des faits");
    add(((ctx.juge && ctx.juge.severite) || 0.5) - 0.5, null);
    const z = f.reduce((a, x) => a + x.v, 0) + gauss(CR.seeded(cs.id + ":peinecrim:" + s.seed)) * 0.6;
    const T = K.SEUILS_CRIME;
    const peine = { ferme: 0, sursis: 0, sursisType: "simple", amende: 0, complementaires: ((r.requis && r.requis.complementaires) || []).slice(), amenagement: null, mandatDepot: true, regles: [], reclusion: false };
    const raisons = f.filter((x) => x.why);
    const aggr = raisons.filter((x) => x.v > 0).map((x) => x.why), att = raisons.filter((x) => x.v < 0).map((x) => x.why);
    const liste = (a) => (a.length <= 1 ? a.join("") : a.slice(0, -1).join(", ") + " et " + a[a.length - 1]);
    const motifs = [`La cour tient compte de la gravité des faits, de la personnalité de l'accusé et de sa situation (art. 132-1 du code pénal)${aggr.length ? ` : ${liste(aggr)}` : ""}${att.length ? `${aggr.length ? " ; mais aussi " : " : "}${liste(att)}` : ""}.`];
    if (perp && !altere && z > T.perpetuite) {
      peine.perpetuite = true; peine.ferme = 360; peine.reclusion = true;
      motifs.push("La gravité exceptionnelle des faits commande la réclusion criminelle à perpétuité.");
    } else if (z > T.reclusion) {
      // réclusion à temps : de dix ans au plafond, autour de la moyenne de la famille
      const moy = I.deces ? 18 : /sexuel/.test(I.fam || "") ? 13 : 14;
      const ans = Math.max(10, Math.min(encA / 12, Math.round(moy + (z - 0.7) * 3)));
      peine.ferme = ans * 12; peine.reclusion = true;
      motifs.push(`Une peine de réclusion criminelle de ${ans} ans répond à la gravité des faits (art. 131-1 du code pénal).`);
    } else {
      // emprisonnement (moins de dix ans) : deux ans au moins dans le jeu
      const mois = Math.max(24, Math.min(119, Math.round(60 * Math.pow(1.45, z - T.reclusion + 0.6))));
      peine.ferme = mois;
      motifs.push(`La cour retient une peine d'emprisonnement de ${CR.fmtMois(mois)}, inférieure à dix ans (art. 131-1 et 132-18 du code pénal).`);
    }
    if (peine.ferme > encA && !peine.perpetuite) peine.ferme = encA;
    peine.regles = motifs;
    peine.choisie = true; peine.crime = true;
    peine.facteurs = raisons.map((x) => ({ why: x.why, sens: x.v > 0 ? "aggr" : "att" }));
    peine.manques = perso ? [] : ["Aucun élément de personnalité n'a été produit (expertise, attestations, parcours) : la cour n'avait rien à mettre en balance de la gravité des faits."];
    peine.texte = peine.perpetuite ? "Réclusion criminelle à perpétuité" : peine.reclusion ? `${CR.fmtMois(peine.ferme)} de réclusion criminelle` : `${CR.fmtMois(peine.ferme)} d'emprisonnement`;
    return peine;
  };
  K.texte = function (pn) {
    const P = CR.PROC;
    const base = P.peineTexte(Object.assign({}, pn, { complementaires: [] }));
    const parts = base === "Dispense de peine" && (pn.tig || pn.joursAmende) ? [] : [base];
    if (pn.tig) parts.push(`${pn.tig} heures de travail d'intérêt général`);
    if (pn.joursAmende) parts.push(`${pn.joursAmende.n} jours-amende à ${CR.money(pn.joursAmende.taux)}`);
    for (const c of pn.complementaires || []) parts.push(c);
    return CR.cap(parts.join(", "));
  };
  if (CR.PROC && CR.PROC.calculerPeine && !CR.PROC.calculerPeine.choisie) {
    const ancien = CR.PROC.calculerPeine;
    CR.PROC.calculerPeine = function (api, r, ctx) {
      if (!K.off && !K.offCrime && K.actifCrime(api.s, api.cs) && r && r.encourue && (r.qualifNature === "crime" || (r.encourue.prison || 0) > 120)) return K.calculerCrime(api, r, ctx || {});
      return !K.off && K.actif(api.s, api.cs) ? K.calculer(api, r, ctx || {}) : ancien(api, r, ctx);
    };
    CR.PROC.calculerPeine.choisie = true;
    CR.PROC.calculerPeine.ancien = ancien;
  }
})();
