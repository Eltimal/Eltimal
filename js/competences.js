// La Permanence — refonte du gameplay, C3 : la grille de compétences (CR.COMP)
// Quatorze compétences du métier (conception, « Pédagogie »). Chaque affaire close en travaille certaines ; le joueur y
// monte en réussissant sans aide, pas avec le temps de jeu : trois niveaux, assisté, libre, examen. Une réussite en mode
// assisté (transcription, listes) ne fait pas monter ; un échec en examen fait redescendre en libre.
// Réussir une compétence dans une affaire : l'avoir travaillée sans erreur qui la concerne (erreurs datées du jeu,
// articles ratés, faits que le client savait et qui n'ont pas été demandés, irrégularités laissées de côté).
(function () {
  "use strict";
  const CR = window.CR;
  const K = (CR.COMP = {});
  K.LISTE = [
    ["entretien", "Entretien"], ["lecture", "Lecture de procédure"], ["nullites", "Nullités"], ["gav", "Garde à vue"],
    ["detention", "Détention"], ["instruction", "Instruction"], ["audience", "Audience"], ["peine", "Peine"],
    ["recours", "Voies de recours"], ["ap", "Application des peines"], ["victimes", "Victimes"],
    ["ecrits", "Écrits et transmission"], ["deonto", "Déontologie"], ["gestion", "Gestion du cabinet"],
  ];
  K.NIVEAUX = ["assisté", "libre", "examen"];
  K.MONTER = [2, 3]; // réussites sans aide pour passer d'assisté à libre, puis de libre à examen
  // erreurs du jeu → compétence
  const ERR = [
    [/^canal_|^citation_courte|^projet_|^consignation|^constitution_doyen|^cass_greffe/, "ecrits"],
    [/^appel_|^op_tardive|^appel_ordo/, "recours"], [/^dml_/, "detention"], [/^gav_absent|^audition_seul/, "gav"],
    [/^ci_absent|^proces_absent|^absent|^incompetence/, "audience"], [/^vie_|^promesse|^presse|^deleg_/, "deonto"],
    [/^prescrit/, "lecture"], [/^ipc_absent/, "instruction"],
  ];
  const t = (s, cs) => { const p = CR.GEN && CR.GEN.paramsOf ? CR.GEN.paramsOf(s, cs.id) : null; return (p && p.t) || {}; };
  const drafted = (cs, k) => !!(cs.drafted && cs.drafted[k] && cs.drafted[k].length);
  // les compétences qu'une affaire a travaillées
  K.travaillees = function (s, cs) {
    const x = t(s, cs), v = cs.vars || {}, c = new Set();
    if (v.corrige || v.auditionGav || v.questionsAvocat || (cs.facts && cs.facts.length)) c.add("entretien");
    if ((cs.notes && cs.notes.length) || (cs.docs && cs.docs.length)) c.add("lecture");
    if ((cs.issues && cs.issues.length) || (cs.proc && cs.proc.moyens && cs.proc.moyens.length)) c.add("nullites");
    if (x.mesure === "gav" || v.auditionGav) c.add("gav");
    if (drafted(cs, "dml") || (cs.proc && cs.proc.detention) || x.genre === "ci") c.add("detention");
    if (cs.proc && (cs.proc.instruction || cs.proc.ji)) c.add("instruction");
    if (v.jugementDay != null || (cs.hearings || []).some((h) => h.attended)) c.add("audience");
    if (v.decision && v.decision.coupable) c.add("peine");
    if (drafted(cs, "appel") || (cs.erreurs || []).some((e) => /^appel|^op_/.test(e.id))) c.add("recours");
    if (cs.camp === "pc" || drafted(cs, "constitution_pc") || drafted(cs, "plainte_simple") || drafted(cs, "pcpc")) c.add("victimes");
    if (cs.drafted && Object.keys(cs.drafted).length) c.add("ecrits");
    if ((cs.erreurs || []).some((e) => /^vie_|^promesse|^presse/.test(e.id))) c.add("deonto");
    if (cs.fee || cs.facture) c.add("gestion");
    return c;
  };
  // ce qui a manqué, compétence par compétence (pour le classeur et le test)
  K.manques = function (s, cs) {
    const m = {};
    const add = (k, why) => (m[k] = m[k] || []).push(why);
    for (const e of cs.erreurs || []) { const r = ERR.find(([re]) => re.test(e.id)); if (r) add(r[1], e.texte); else if (/^cite_/.test(e.id)) add(/Audience|Exception/.test(e.ctx || e.texte || "") ? "audience" : "ecrits", e.texte); }
    for (const c of cs.citeLog || []) if (c.g && c.g !== "ok") add(/Audience|nullité/i.test(c.ctx || "") ? "audience" : "ecrits", `Article mal cité (${c.ctx || "acte"}).`);
    const corr = (cs.vars && cs.vars.corrige) || {};
    const rates = Object.values(corr).reduce((a, l) => a + l.length, 0);
    if (rates >= 2) add("entretien", `${rates} éléments que le client savait n'ont pas été demandés.`);
    const items = (cs.debrief && cs.debrief.items) || [];
    const clues = items.filter((i) => i.kind === "clue"), manques = clues.filter((i) => !i.ok);
    if (clues.length && manques.length > clues.length / 2) add("lecture", "Plus de la moitié des faits clés du dossier n'ont pas été notés.");
    if (cs.issues && cs.issues.length && cs.proc && cs.vars.jugementDay != null) {
      const souleves = new Set((cs.proc.moyens || []).map((x) => x.flag));
      const oublis = cs.issues.filter((i) => i.flag && CR.IRREG && CR.IRREG[i.flag] && !souleves.has(i.flag));
      if (oublis.length) add("nullites", "Une irrégularité de la procédure n'a pas été soulevée.");
    }
    if (cs.vars && cs.vars.decision && cs.vars.decision.motifsPeine && (cs.vars.decision.motifsPeine.manques || []).length) add("peine", cs.vars.decision.motifsPeine.manques[0]);
    return m;
  };
  K.etat = (s) => (s.comp = s.comp || {});
  K.niveau = (s, k) => { const e = K.etat(s)[k]; return e ? e.niveau : 0; };
  // à la clôture : compter les réussites sans aide, monter ou redescendre
  K.clore = function (s, cs) {
    if (!cs || cs.compte || ["lost-lead", "transferred"].includes(cs.outcome && cs.outcome.type)) return;
    cs.compte = true;
    const aide = !(CR.libre && CR.libre(s));
    const tr = K.travaillees(s, cs), mq = K.manques(s, cs), E = K.etat(s);
    const bilan = [];
    for (const k of tr) {
      const e = (E[k] = E[k] || { niveau: 0, reussites: 0, echecs: 0, affaires: 0 });
      e.affaires++;
      const ok = !(mq[k] && mq[k].length);
      if (!ok) { e.echecs++; if (e.niveau === 2) { e.niveau = 1; e.reussites = 0; } }
      else if (!aide) { e.reussites++; if (e.niveau < 2 && e.reussites >= K.MONTER[e.niveau]) { e.niveau++; e.reussites = 0; } }
      bilan.push({ k, ok, aide, niveau: e.niveau, why: ok ? null : mq[k][0] });
    }
    cs.compBilan = bilan;
  };
  if (CR.closeCase && !CR.closeCase.comp) {
    const ancien = CR.closeCase;
    CR.closeCase = function (s, cs, outcome) { const r = ancien.apply(this, arguments); try { K.clore(s, cs); } catch (e) { console.error(e); } return r; };
    CR.closeCase.comp = true;
  }
})();
