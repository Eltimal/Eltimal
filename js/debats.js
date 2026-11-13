// La Permanence — refonte du gameplay, lot 4b : les débats intégraux (CR.DEB)
// L'interrogatoire du président reprend les questions de l'enquête, adressées au prévenu à la barre ; ses réponses
// suivent sa position et sa préparation (un client vu au dépôt est cohérent ; un client qu'on n'a pas vu se contredit).
// Le réquisitoire est construit sur le dossier : les faits, chaque élément démontré par les pièces cotées (le même
// raisonnement que le tribunal, vu par l'accusation), la réponse aux exceptions soulevées, la personnalité, puis la peine.
// Mode libre seulement (le mode assisté et les parties automatiques gardent les débats courts).
(function () {
  "use strict";
  const CR = window.CR;
  const D = (CR.DEB = {});
  const civ = (P) => (P && P.g === "f" ? "Madame" : "Monsieur");
  const cache = {};
  D.ctx = function (api) {
    const { s, cs } = api;
    const p = CR.GEN && CR.GEN.paramsOf ? CR.GEN.paramsOf(s, cs.id) : null;
    if (!p || !p.t || !CR.GEN2 || !CR.GEN2.B) return null;
    if (cache[cs.id] && cache[cs.id].p === p) return cache[cs.id].x;
    let x = null; try { x = CR.GEN2.B.ctx(p); } catch (e) { x = null; }
    cache[cs.id] = { p, x };
    return x;
  };
  D.actif = (api) => !!(CR.libre && CR.libre(api.s) && D.ctx(api));

  // ------------------------------------------------------------------ L'interrogatoire du président
  D.interrogatoire = function (api, x) {
    const { s, cs } = api;
    const t = x.t, A = x.A, N = x.N || {};
    const prepare = !!cs.flags.depotVu || !!cs.flags.prepClient || !!(cs.vars.asked && cs.vars.asked.length);
    const M = CR.PAROLE.client(s, cs, { parole: { t, N }, entretien: { topics: [] } });
    const Q = CR.PAROLE.audition(M).filter((q) => ["faits", "details", "preuves"].includes(q.sujet));
    const nom = `${civ(A)} ${A.nom}`;
    const V = (k, arr) => arr[CR.hash(cs.id + ":dv:" + k) % arr.length];
    const steps = [{ who: "president", t: `Je résume. ${N.resume || ""}`.trim() }, { who: "president", t: V("i0", [`${nom}, le tribunal va vous interroger sur les faits. Vous pouvez répondre, ou vous taire.`, `${nom}, venons-en aux faits. Vous restez libre de répondre ou de garder le silence.`, `Bien. ${nom}, je vais vous poser quelques questions sur ce qui vous est reproché.`, `${nom}, approchez. Le tribunal veut entendre votre version.`]) }];
    const r = CR.seeded(cs.id + ":interro");
    const ment = M.ment && !M.avoue ? M.ment : null;
    let contradiction = false;
    for (const q of Q.slice(0, 8)) {
      const tq = q.q.replace(/^Vous êtes entendu(e)? sur des faits commis [^.]*\. /, "").replace(/^Reconnaissez-vous/, `${nom}, reconnaissez-vous`);
      steps.push({ who: "president", t: tq });
      let rep = q.rep;
      // le client qu'on n'a pas préparé se contredit une fois ; le président le relève, et la défense en paie le prix
      if (!prepare && !contradiction && q.sujet === "faits" && r() < 0.6) { contradiction = true; steps.push({ who: "client", t: "Je sais pas… C'est pas comme ils disent. Enfin, si, un peu.", fx: { cred: -2 } }); steps.push({ who: "president", t: "Ce n'est pas ce que vous avez déclaré en garde à vue." }); continue; }
      steps.push({ who: "client", t: rep || q.partiel || (t.stance === "nie" ? "Je n'ai rien fait." : "Je ne sais pas quoi vous dire.") });
    }
    if (ment) {
      const k = CR.GEN2.VIE && CR.GEN2.VIE.DOC ? CR.GEN2.VIE.DOC[ment.preuve] : null;
      const d0 = k && cs.docs.find((z) => z.key === k);
      let cote = null; try { cote = d0 ? CR.renderDoc(s, cs, d0).cote : null; } catch (e) { cote = null; }
      steps.push({ who: "president", t: `${cote ? `La pièce cotée ${cote}` : "Le dossier"} dit pourtant le contraire de ce que vous venez d'affirmer. Vous maintenez ?` }, { who: "client", t: "Oui. Je maintiens.", fx: { cred: -1 } });
    }
    steps.push({ who: "president", t: V("sit", [`${nom}, votre situation : où vivez-vous, de quoi vivez-vous ?`, `Parlons de vous, ${nom}. Votre logement, votre travail ?`, `${nom}, quelle est votre situation aujourd'hui ?`]) }, { who: "client", t: A.emploi ? `Je travaille. Je suis ${A.metier}.${A.heberg ? " J'habite chez " + (CR.GEN2.PR.proche(A).ma || "ma famille") + "." : ""}` : `Je ne travaille pas en ce moment.${A.heberg ? " J'habite chez " + (CR.GEN2.PR.proche(A).ma || "ma famille") + "." : " Je n'ai pas d'adresse fixe."}` });
    return steps;
  };

  // ------------------------------------------------------------------ Le réquisitoire
  const LIBA = { acte: "Les faits matériels", auteur: "L'imputation", intention: "L'intention" };
  D.requisitoire = function (api, lignes) {
    const { s, cs } = api;
    const x = D.ctx(api);
    if (!x || !CR.TRIB) return lignes;
    const t = x.t, A = x.A;
    let spec = null; try { spec = CR.GEN2.B.spec(x); } catch (e) { return lignes; }
    const R = CR.TRIB.raisonner(api, spec, { played: [], juge: { severite: 0.5 } }).raisonnement;
    const LIB = CR.TRIB.LIB || {};
    const cite = (k) => { const c = CR.TRIB.cote(s, cs, k); return (LIB[k] || k) + (c ? ` (${c})` : ""); };
    const out = [lignes[0]];
    const V = (k, arr) => arr[CR.hash(cs.id + ":rv:" + k) % arr.length];
    const pos = t.stance === "reconnait" ? "reconnus pour l'essentiel" : t.stance === "minimise" ? "que le prévenu minimise" : "que le prévenu conteste";
    out.push({ who: "parquet", t: `${V("ouv", [`Monsieur le président, le tribunal est saisi de faits ${pos}.`, `Des faits ${pos}, monsieur le président.`, `Le dossier qui vous est soumis porte sur des faits ${pos}.`])} ${x.N && x.N.resume ? x.N.resume : ""}`.trim() });
    const deja = new Set();
    for (const e of R.elements) {
      if (!e.preuves.length) continue;
      const neuves = e.preuves.filter((k) => !deja.has(k));
      const pl = (n) => (n > 1 ? "nt" : "");
      if (e.id === "acte") out.push({ who: "parquet", t: V("acte", [`${LIBA.acte} sont établis par ${neuves.map(cite).join(", ")}.`, `Ce qui s'est passé ne fait pas débat : ${neuves.map(cite).join(", ")}.`, `Les faits sont là : ${neuves.map(cite).join(", ")}.`]) });
      else if (e.id === "auteur") out.push({ who: "parquet", t: neuves.length ? `${LIBA.auteur} ne fait pas de doute : ${neuves.map(cite).join(", ")} désigne${pl(neuves.length)} ${civ(A).toLowerCase()} ${A.nom}${deja.size ? ", comme les pièces que je viens de citer" : ""}.` : `Les mêmes pièces désignent ${civ(A).toLowerCase()} ${A.nom}, et personne d'autre.` });
      else out.push({ who: "parquet", t: `${LIBA.intention} se déduit des circonstances mêmes de l'action${neuves.length ? ` et de ${neuves.map(cite).join(", ")}` : ""}.` });
      for (const k of e.preuves) deja.add(k);
    }
    // réponse aux exceptions soulevées in limine
    const moy = (cs.proc && cs.proc.moyens) || [];
    if (moy.length) out.push({ who: "parquet", t: `Sur ${moy.length > 1 ? "les exceptions soulevées" : "l'exception soulevée"}, le ministère public s'oppose : ${moy.some((m) => m.grief) ? "le grief n'est pas démontré, et l'article 802 du code de procédure pénale exige qu'il le soit" : "la défense n'établit aucun grief"}. Je demande au tribunal de ${moy.length > 1 ? "les" : "la"} rejeter.` });
    // la personnalité
    out.push({ who: "parquet", t: `${V("perso", ["La personnalité :", "Quant à la personnalité du prévenu :", "Sur sa personnalité :"])} ${A.casier ? (t.rec ? "un casier qui porte déjà une condamnation pour des faits de même nature" : "un casier qui n'est pas vierge") : "un casier vierge, je le reconnais"} ; ${A.emploi ? "un emploi" : "pas d'emploi"}${A.heberg ? ", un hébergement" : ", aucune adresse vérifiée"}.` });
    // la demande et ce qui la suit ; les anciennes phrases d'introduction du parquet sont remplacées par l'exposé ci-dessus
    const i = lignes.findIndex((l) => l.who === "parquet" && /^Je requiers/.test(l.t));
    return out.concat(i >= 0 ? lignes.slice(i) : lignes.slice(1));
  };
  // branchement : les réquisitions des affaires générées s'allongent en mode libre
  if (CR.AUD && CR.AUD.requisitions && !CR.AUD.requisitions.deb) {
    const r0 = CR.AUD.requisitions;
    CR.AUD.requisitions = function (base, opts) {
      const st = r0(base, opts);
      const f0 = st.requisitions;
      st.requisitions = (api, ...a) => { const l = f0(api, ...a); return D.actif(api) ? D.requisitoire(api, l) : l; };
      return st;
    };
    CR.AUD.requisitions.deb = true;
  }
})();
