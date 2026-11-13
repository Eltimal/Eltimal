// La Permanence — refonte du gameplay, lot 8 : après le jugement, l'aménagement de la peine (CR.AP)
// Le condamné libre à un an ou moins d'emprisonnement ferme, sans mandat de dépôt, reçoit à l'audience une convocation
// devant le juge de l'application des peines dans les vingt jours (art. 474 CPP). Le dossier reste ouvert : l'avocat réunit
// les justificatifs (travail, domicile, hébergement, soins, formation), plaide la mesure au débat contradictoire (art. 712-6),
// le juge décide (art. 723-15 à 723-15-2) : aménagement si la personnalité et la situation le permettent — obligatoire à six
// mois ou moins, sauf impossibilité ; rapport du SPIP sous deux mois s'il manque des éléments ; sinon date d'incarcération.
// Règles relues sur codes.droit.org le 13 novembre 2026 (D-79). Un appel interrompt la procédure (art. 474 : « sauf exercice
// des voies de recours »).
(function () {
  "use strict";
  const CR = window.CR;
  const PEN = CR.PEN, H = CR.FLOW_HOOKS;
  if (!PEN || !H || !CR.closeCase || CR.AP) return;
  const K = (CR.AP = {});
  const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));

  // les textes relus, en extrait (s'ils manquent au recueil)
  const X = (cite, texte) => ({ cite, texte, etat: "texte", extrait: true });
  const TX = {
    CPP_474: X("Art. 474 du code de procédure pénale", "[…] en cas de condamnation d'une personne non incarcérée à une peine d'emprisonnement inférieure ou égale à un an […], il est remis au condamné qui est présent à l'issue de l'audience un avis de convocation à comparaître, dans un délai qui ne saurait excéder vingt jours, devant le juge de l'application des peines en vue de déterminer les modalités d'exécution de la peine. […]"),
    "CPP_723-15": X("Art. 723-15 du code de procédure pénale", "[…] les personnes non incarcérées […] condamnées à une peine inférieure ou égale à un an d'emprisonnement […] bénéficient, dans la mesure du possible et si leur personnalité et leur situation le permettent, […] d'une semi-liberté, d'un placement à l'extérieur, d'une détention à domicile sous surveillance électronique, d'un fractionnement ou d'une suspension de peines, d'une libération conditionnelle ou de la conversion prévue à l'article 747-1. Lorsque la peine ferme prononcée ou restant à subir est inférieure ou égale à six mois, elle doit faire l'objet d'une détention à domicile sous surveillance électronique, d'une semi-liberté ou d'un placement à l'extérieur, sauf si la personnalité ou la situation du condamné rendent ces mesures impossibles […]"),
    "CPP_723-15-1": X("Art. 723-15-1 du code de procédure pénale", "Si, à l'issue de la convocation, une mesure d'aménagement ou la conversion de la peine lui paraît possible et si l'intéressé en est d'accord, le juge de l'application des peines ordonne cette mesure ou cette conversion […]. Si le juge ne dispose pas des éléments d'information suffisants […], il peut charger le service pénitentiaire d'insertion et de probation d'examiner les modalités d'exécution de la décision qu'il envisage de prendre […] dans un délai de deux mois à compter de cette saisine. […]"),
    "CPP_723-15-2": X("Art. 723-15-2 du code de procédure pénale", "Si le condamné ne souhaite pas bénéficier d'un aménagement ou d'une conversion de sa peine ou si, au vu du rapport motivé du service pénitentiaire d'insertion et de probation, un tel aménagement ou une telle conversion ne lui paraît pas possible, le juge de l'application des peines peut fixer la date d'incarcération. […]"),
    "CPP_747-1": X("Art. 747-1 du code de procédure pénale", "En cas de condamnation définitive pour un délit à une peine d'emprisonnement ferme inférieure ou égale à six mois […], le juge de l'application des peines peut […] ordonner […] la conversion de cette peine en peine de détention à domicile sous surveillance électronique, en peine de travail d'intérêt général, en peine de jours-amende, en un emprisonnement assorti d'un sursis probatoire comportant nécessairement l'obligation d'accomplir un travail d'intérêt général ou en un emprisonnement assorti d'un sursis probatoire renforcé […]"),
  };
  if (CR.TEXTES) for (const [k, v] of Object.entries(TX)) if (!CR.TEXTES[k]) CR.TEXTES[k] = v;

  // les justificatifs : ce que la fiche de la personne permet de produire
  K.JUSTIFS = {
    AP_travail: { label: "Attestation de l'employeur et bulletins de salaire", mesures: ["semi", "ddse"] },
    AP_domicile: { label: "Justificatif de domicile (bail, quittance)", mesures: ["ddse"] },
    AP_heberg: { label: "Attestation d'hébergement d'un proche, avec son accord", mesures: ["ddse"] },
    AP_soins: { label: "Attestation de suivi en addictologie", mesures: ["ddse", "semi", "placement"] },
    AP_formation: { label: "Inscription à une formation", mesures: ["semi"] },
  };
  const genT = (s, cs) => { const p = CR.GEN && CR.GEN.paramsOf ? CR.GEN.paramsOf(s, cs.id) : null; return (p && p.t) || null; };
  const e = (A) => (A && A.g === "f" ? "e" : "");
  K.mois = (m) => (CR.fmtMois ? CR.fmtMois(m) : m + " mois");

  // ---------------------------------------------------------------- la condamnation qui ouvre la procédure
  K.eligible = function (s, cs, outcome) {
    if (!cs || cs.camp === "pc" || !outcome || !["condamnation", "requalification_favorable"].includes(outcome.type)) return false;
    const pd = cs.vars.peineDetail, t = genT(s, cs);
    if (!t || !t.A || !pd || cs.vars.ap) return false;
    if (cs.proc && cs.proc.appel) return false;
    if (cs.proc && cs.proc.detention && cs.proc.detention.statut === "dp") return false;
    return pd.ferme > 0 && pd.ferme <= 12 && !pd.mandatDepot && !pd.amenagement && !pd.crime;
  };
  K.ouvrir = function (s, cs, outcome) {
    const api = CR.api(s, cs), t = genT(s, cs), A = t.A;
    const r = CR.seeded(cs.id + ":ap");
    let jour = s.day + int(r, 8, 18);
    while (CR.isOuvrable && !CR.isOuvrable(jour)) jour++;
    const ferme = cs.vars.peineDetail.ferme;
    cs.vars.ap = { ferme, outcome, jugement: cs.vars.jugementDay != null ? cs.vars.jugementDay : s.day, convocation: jour, etat: "convoque", renvois: 0 };
    api.hearing({ day: jour, min: 9 * 60 + 30 + int(r, 0, 8) * 15, title: "Juge de l'application des peines — aménagement de la peine", where: "Service de l'application des peines, tribunal judiciaire", script: "jap", done: "apresJap", onMiss: "_japSansVous", duree: 40 });
    api.mail({ from: "Greffe de l'application des peines", subject: "Convocation devant le juge de l'application des peines", kind: "greffe", important: true, body: [[`${A.prenom} ${A.nom}, condamné${e(A)} à ${K.mois(ferme)} d'emprisonnement, est convoqué${e(A)} le ${CR.fmtDate(jour, "dow")} devant le juge de l'application des peines, en vue de déterminer les modalités d'exécution de la peine (art. 474 du code de procédure pénale). Faute de présentation sans motif légitime, la peine sera mise à exécution en établissement pénitentiaire.`]] });
    CR.PROC && CR.PROC.event && CR.PROC.event(api, `Convocation devant le juge de l'application des peines le ${CR.fmtDate(jour)} (art. 474).`);
  };
  const ancienClose = CR.closeCase;
  CR.closeCase = function (s, cs, outcome) {
    try { if (!K.off && cs && cs.status !== "closed" && K.eligible(s, cs, outcome)) { K.ouvrir(s, cs, outcome); return; } } catch (err) { console.error(err); }
    return ancienClose.apply(this, arguments);
  };
  // la procédure s'achève : le dossier se clôt avec l'issue du jugement, complétée de l'exécution
  K.clore = function (s, cs, detail) {
    const ap = cs.vars.ap; if (!ap || ap.etat === "fini") return;
    ap.etat = "fini"; ap.issue = detail;
    const o = Object.assign({}, ap.outcome, { detail: [ap.outcome.detail, detail].filter(Boolean).join(" — ") });
    ancienClose.call(this, s, cs, o);
  };

  // ---------------------------------------------------------------- les tâches : réunir les justificatifs
  const ancienTasks = PEN.tasks;
  PEN.tasks = function (api, T) {
    const r = ancienTasks.apply(this, arguments);
    const { s, cs } = api, ap = cs.vars.ap;
    if (!ap || ap.etat === "fini") return r;
    const t = genT(s, cs); if (!t) return r;
    if (!ap.justifsDemandes) T({ id: "ap_justifs", label: `Réunir les justificatifs de ${t.A.prenom} pour le juge de l'application des peines`, sub: "Travail, domicile ou hébergement, soins, formation : ce qui permet une mesure, pièces à l'appui.", kind: "meet", time: 30, urgent: true, run: () => { CR.spend(s, 30, "meet"); K.demanderJustifs(api); return null; } });
    return r;
  };
  K.demanderJustifs = function (api) {
    const { s, cs } = api, t = genT(s, cs), A = t.A, ap = cs.vars.ap;
    ap.justifsDemandes = s.day; ap.justifsFaits = (ap.justifsFaits || 0) + 1;
    const r = CR.seeded(cs.id + ":ap:justifs");
    const recus = [];
    if (A.emploi) recus.push("AP_travail");
    if (A.heberg) recus.push("AP_domicile"); else if (A.proche && r() < 0.6) recus.push("AP_heberg");
    if (/stups|alcool/.test(t.inf || "") && r() < 0.55) recus.push("AP_soins");
    if (!A.emploi && r() < 0.4) recus.push("AP_formation");
    ap.justifs = recus;
    const j = s.day + int(r, 1, 3);
    api.at(Math.min(j, ap.convocation - 1 > s.day ? ap.convocation - 1 : j), "_apJustifs", {}, 11 * 60);
  };
  H._apJustifs = (api) => {
    const { s, cs } = api, t = genT(s, cs), A = t.A, ap = cs.vars.ap;
    if (!ap || ap.etat === "fini") return;
    const L = ap.justifs || [];
    for (const f of L) CR.addNote(s, cs, { text: K.JUSTIFS[f].label + ` (${A.prenom} ${A.nom}).`, fact: f, src: "client" });
    api.mail({ from: `${A.prenom} ${A.nom}`, subject: "Les papiers pour le juge", kind: "email", body: [[L.length ? `Maître, voici ce que j'ai pu réunir : ${L.map((f) => K.JUSTIFS[f].label.toLowerCase()).join(" ; ")}.` : "Maître, je n'ai rien de tout ça. Pas de travail en ce moment, et je dors à droite à gauche."]] });
  };

  // ---------------------------------------------------------------- le débat contradictoire (art. 712-6)
  K.peut = function (cs, mesure) {
    const has = (f) => CR.hasFact(cs, f);
    if (mesure === "ddse") return has("AP_domicile") || has("AP_heberg");
    if (mesure === "semi") return has("AP_travail") || has("AP_formation");
    if (mesure === "placement") return has("AP_soins");
    if (mesure === "conversion") return (cs.vars.ap && cs.vars.ap.ferme <= 6) && !cs.vars.ap.crime;
    return false;
  };
  K.LABEL = { ddse: "la détention à domicile sous surveillance électronique", semi: "la semi-liberté", placement: "le placement à l'extérieur", conversion: "la conversion en travail d'intérêt général" };
  CR.AUDIENCES = CR.AUDIENCES || {};
  CR.AUDIENCES.jap = function (api) {
    const { s, cs } = api, t = genT(s, cs), A = t.A, ap = cs.vars.ap || { ferme: 3 };
    const court = ap.ferme <= 6;
    const casier = A.casier || 0;
    return {
      title: "Juge de l'application des peines", sub: "Débat contradictoire · chambre du conseil", decor: { scene: "cabinet_ji" },
      steps: [
        { who: "sys", t: `(Le cabinet du juge de l'application des peines. ${A.prenom} ${A.nom} est assis${e(A)} à côté de vous ; la conseillère du service pénitentiaire d'insertion et de probation a son dossier ouvert.)` },
        { who: "president", name: "JAP", t: `Vous avez été condamné${e(A)} le ${CR.fmtDate(ap.jugement)} à ${K.mois(ap.ferme)} d'emprisonnement. ${court ? "La loi veut que cette peine soit aménagée, sauf si votre personnalité ou votre situation le rendent impossible." : "La peine peut être aménagée si votre personnalité et votre situation le permettent."} Madame la conseillère ?` },
        { who: "temoin", name: "CPIP", t: (a) => (K.peut(a.cs, "ddse") || K.peut(a.cs, "semi") ? "Nous avons reçu des justificatifs. Un aménagement nous paraît envisageable, sous réserve des vérifications d'usage." : "Le dossier est vide : ni adresse vérifiable, ni activité. En l'état, nous ne pouvons pas proposer de mesure.") },
        { who: "parquet", t: casier >= 3 ? "Le parquet relève les antécédents : il s'oppose à toute mesure qui ne serait pas solidement garantie." : "Le parquet ne s'oppose pas à un aménagement, s'il est justifié." },
        { who: "president", name: "JAP", t: "Maître ?" },
        { plaidoirie: { role: "jld", titre: "Observations sur l'exécution de la peine", max: 2, args: [
          { id: "ddse", label: "La détention à domicile sous surveillance électronique", say: "Une adresse stable, pièces à l'appui : la surveillance électronique permet d'exécuter la peine sans rompre ce qui tient encore.", cards: ["AP_domicile", "AP_heberg", "CPP_723-15"] },
          { id: "semi", label: "La semi-liberté, pour garder le travail", say: "Un emploi, attesté par l'employeur : la semi-liberté le préserve, et la peine s'exécute chaque soir.", cards: ["AP_travail", "AP_formation", "CPP_723-15"] },
          { id: "placement", label: "Le placement à l'extérieur, avec les soins", say: "Un suivi est engagé : le placement à l'extérieur permet de le poursuivre.", cards: ["AP_soins"] },
          { id: "conversion", label: "La conversion en travail d'intérêt général (art. 747-1)", say: "Pour une peine de six mois au plus, la conversion en travail d'intérêt général répond mieux à la réinsertion.", cards: ["CPP_747-1"] },
        ] } },
        { do: (a, st) => a.run("japDecider", { played: st.played }) },
      ],
    };
  };
  // la décision : la mesure plaidée, si ce qui la justifie est au dossier ; sinon une autre mesure que les pièces permettent ;
  // à défaut d'éléments, le rapport du SPIP (une fois) ; enfin la date d'incarcération
  H.japDecider = (api, { played } = {}) => {
    const { s, cs } = api, ap = cs.vars.ap, t = genT(s, cs), A = t.A;
    if (!ap || ap.etat === "fini") return [];
    const pl = played || new Set();
    const ordre = ["ddse", "semi", "placement", "conversion"];
    const demande = ordre.find((m) => pl.has("arg:" + m)) || null;
    const casier = A.casier || 0;
    const court = ap.ferme <= 6;
    // une mesure justifiée : celle plaidée d'abord ; à six mois ou moins, toute mesure possible (obligation de la loi)
    let m = demande && K.peut(cs, demande) ? demande : null;
    if (!m && (court || demande)) m = ordre.find((x) => x !== "conversion" && K.peut(cs, x)) || (court && demande === "conversion" ? "conversion" : null);
    if (m && casier >= 3 && !court && !(K.peut(cs, "ddse") && K.peut(cs, "semi"))) m = null; // antécédents lourds : garanties doublées
    if (m) {
      ap.mesure = m;
      const txt = `J'ordonne ${K.LABEL[m]} pour l'exécution de la peine de ${K.mois(ap.ferme)} (art. ${m === "conversion" ? "747-1" : "723-15-1"} du code de procédure pénale).`;
      ap.prononce = txt;
      api.mail({ from: "Greffe de l'application des peines", subject: "Ordonnance d'aménagement de peine", kind: "greffe", body: [[txt], [m === "ddse" ? "La pose du bracelet est fixée par le service ; les horaires de sortie suivent les justificatifs produits." : m === "semi" ? "Le condamné rejoindra le centre de semi-liberté hors des heures de travail." : m === "conversion" ? "Le travail d'intérêt général sera exécuté sous le contrôle du service pénitentiaire d'insertion et de probation." : "Le placement s'exécutera sous le contrôle de l'administration."]] });
      K.clore(s, cs, `peine aménagée (${K.LABEL[m]})`);
      return [{ who: "president", name: "JAP", t: txt }];
    }
    if (!ap.renvois) {
      // art. 723-15-1 : faute d'éléments suffisants, le SPIP examine et rend un rapport sous deux mois
      ap.renvois = 1;
      let jour = s.day + int(CR.seeded(cs.id + ":ap:renvoi"), 30, 55);
      while (CR.isOuvrable && !CR.isOuvrable(jour)) jour++;
      ap.convocation = jour;
      api.hearing({ day: jour, min: 10 * 60, title: "Juge de l'application des peines — après rapport du SPIP", where: "Service de l'application des peines, tribunal judiciaire", script: "jap", done: "apresJap", onMiss: "_japSansVous", duree: 30 });
      const txt = `Je ne dispose pas des éléments suffisants. Je charge le service pénitentiaire d'insertion et de probation d'examiner les modalités d'un aménagement ; nous nous reverrons le ${CR.fmtDate(jour)} (art. 723-15-1).`;
      ap.prononce = txt; ap.justifsDemandes = null; // l'avocat peut encore réunir les pièces
      return [{ who: "president", name: "JAP", t: txt }];
    }
    // art. 723-15-2 : aucun aménagement possible au vu du rapport : le juge fixe la date d'incarcération
    let jour = s.day + int(CR.seeded(cs.id + ":ap:inc"), 20, 40);
    while (CR.isOuvrable && !CR.isOuvrable(jour)) jour++;
    const txt = `Au vu du rapport du service, aucun aménagement n'est possible en l'état : je fixe la date d'incarcération au ${CR.fmtDate(jour)} (art. 723-15-2).`;
    ap.prononce = txt; ap.incarceration = jour;
    K.clore(s, cs, `peine mise à exécution (incarcération le ${CR.fmtDate(jour)})`);
    return [{ who: "president", name: "JAP", t: txt }];
  };
  H.apresJap = (api) => { const { s, cs } = api; if (cs.vars.ap && cs.vars.ap.etat !== "fini") CR.updatedClient && CR.updatedClient(s, cs, 1); };
  // l'avocat absent : le juge statue sur ce que le condamné apporte seul — rien de plaidé
  H._japSansVous = (api) => {
    const { cs } = api;
    if (!cs.vars.ap || cs.vars.ap.etat === "fini") return;
    CR.erreur && CR.erreur(api.s, cs, { id: "jap_absent", texte: "Vous n'étiez pas au débat devant le juge de l'application des peines.", sanction: "Aucune mesure n'a été plaidée ; le juge a statué sur les seules pièces apportées par le condamné.", regul: "Aucune pour ce débat." });
    H.japDecider(api, { played: new Set() });
  };
  // un appel interrompt la procédure d'exécution : le dossier suit l'appel
  const ancienAppel = H.filed_appel;
  H.filed_appel = (api, o) => {
    const r = ancienAppel ? ancienAppel(api, o) : undefined;
    const { s, cs } = api, ap = cs.vars.ap;
    if (ap && ap.etat !== "fini" && cs.proc && cs.proc.appel) {
      for (const h of cs.hearings || []) if (h.script === "jap" && !h.attended && !h.missed) h.canceled = true;
      K.clore(s, cs, "appel formé : l'exécution attend l'arrêt");
    }
    return r;
  };
})();
