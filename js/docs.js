/* La Permanence — moteur de documents (CR.DOCS), lot 1 de la refonte du gameplay.
   Une pièce est composée dans la trame de son type (dev/ref/trames-pieces.md) à partir de la simulation de l'affaire :
   bandeau du service et grille de cotes, formule d'ouverture et visas, identité en grille, déclarations entre guillemets
   répétés et finies par des tirets, questions et réponses (art. 429), feuillets signés (art. 66), clôture horodatée.
   La pièce est paginée comme une vraie (environ 350 mots par feuillet pour un procès-verbal) et plafonnée à 2 000 mots.
   Sortie compatible avec UI.Paper : { title, kind, entete, paras, sigs } plus { trame, bandeau, pstyle, feuillets, cote }.
   Un paragraphe est une liste de segments (texte, ou { t, f, flag, paire } : fait du bloc-notes, irrégularité secrète).
   Les rédactions varient selon l'auteur (sec ou bavard, fautes de frappe plausibles) ; rien n'est tiré hors de la graine. */
(function () {
  const CR = (window.CR = window.CR || {});
  const DOCS = (CR.DOCS = {});

  // ---------------------------------------------------------------- dates et heures à la manière des procès-verbaux
  const NB = ["zéro", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf", "vingt", "vingt et une", "vingt-deux", "vingt-trois"];
  const m1440 = (m) => ((Math.round(m) % 1440) + 1440) % 1440;
  DOCS.hm = (m) => CR.fmtTime(m1440(m)).replace(/ /g, "\u00a0"); // « 9 h 23 », insécable
  DOCS.heures = (m) => { m = m1440(m); const h = Math.floor(m / 60), mn = m % 60; return `${h} heure${h > 1 ? "s" : ""} ${String(mn).padStart(2, "0")}`; }; // « 9 heures 23 »
  DOCS.jour = (d) => { const s = CR.fmtDate(d, "dow"); return s; }; // « mardi 1er décembre 2026 »
  DOCS.date = (d) => CR.fmtDate(d, "long");
  DOCS.num = (d) => CR.fmtDate(d, "num");
  DOCS.lettres = (n) => (n < NB.length ? NB[n].replace(/^une$/, "un") : String(n));
  // jour de l'acte quand l'heure déborde sur le lendemain (minutes comptées depuis minuit du jour des faits)
  DOCS.jourDe = (j0, m) => j0 + Math.floor(m / 1440);

  // ---------------------------------------------------------------- variations d'écriture
  // Fautes de frappe plausibles, seulement dans le texte courant (jamais dans un passage qui porte un fait ou une irrégularité)
  const FAUTES = [[/interpellé/, "interpelé"], [/téléphone/, "télephone"], [/procédons/, "procédont"], [/déclare/, "délcare"], [/présence/, "présense"], [/officier/, "oficier"], [/immédiatement/, "immédiatemment"], [/personne/, "personnne"], [/trottoir/, "trotoir"], [/apercevons/, "appercevons"], [/rapportons/, "raportons"], [/conformément/, "conformémént"]];
  DOCS.style = function (r, o) {
    o = o || {};
    return { bavard: o.bavard != null ? o.bavard : r() < 0.5, fautes: o.fautes != null ? o.fautes : 0.06 + r() * 0.16, graine: Math.floor(r() * 1e9) };
  };
  function fauter(st, txt, fr) {
    if (!st || typeof txt !== "string" || txt.length < 60) return txt;
    if (fr() > st.fautes * Math.min(1, txt.length / 400)) return txt;
    const cands = FAUTES.filter(([re]) => re.test(txt));
    if (!cands.length) return txt;
    const [re, by] = cands[Math.floor(fr() * cands.length)];
    return txt.replace(re, by);
  }

  // ---------------------------------------------------------------- blocs
  // b : { k: "p" | "decl" | "q" | "r" | "ligne" | "titre" | "mention" | "liste", s: [segments] | texte }
  const segs = (x) => (Array.isArray(x) ? x : [x]).filter((s) => s != null && s !== "" && s !== false);
  const motsDe = (ss) => ss.map((s) => (typeof s === "string" ? s : s.t || "")).join(" ").split(/\s+/).filter(Boolean).length;
  DOCS.p = (x) => ({ k: "p", s: segs(x) });
  DOCS.decl = (x) => ({ k: "decl", s: segs(x) });
  DOCS.q = (x) => ({ k: "q", s: segs(x).map((s, i) => (i === 0 && typeof s === "string" ? "Question : " + s : s)) });
  DOCS.r = (x) => ({ k: "r", s: segs(x).map((s, i) => (i === 0 ? (typeof s === "string" ? "Réponse : " + s : Object.assign({}, s, { t: "Réponse : " + s.t })) : s)) });
  DOCS.ligne = (label, val) => ({ k: "ligne", s: [`${label} : ${val}`] });
  DOCS.titre = (x) => ({ k: "titre", s: segs(x) });
  DOCS.mention = (x) => ({ k: "mention", s: segs(x) });
  DOCS.qr = (q, r) => [DOCS.q(q), DOCS.r(r)];

  // ---------------------------------------------------------------- pagination et sortie
  // o : { title, kind, cote, bandeau, entete, blocs, sigs, signataires, parFeuillet, st (style), plafond }
  DOCS.composer = function (o) {
    const par = o.parFeuillet || 350, plafond = o.plafond || 2000;
    const plat = (x) => (Array.isArray(x) ? [].concat(...x.map(plat)) : x ? [x] : []);
    const blocs = plat(o.blocs);
    const paras = [], pstyle = [];
    let n = 0, total = 0, feuillet = 1;
    // les fautes de frappe d'une pièce sont tirées de sa propre graine : la pièce relue dit toujours la même chose
    const fr = o.st ? CR.seeded(`${o.st.graine}:${o.cote || ""}:${o.title || ""}`) : null;
    for (const b of blocs) {
      let ss = b.s.map((s) => (typeof s === "string" && o.st && (b.k === "p" || b.k === "mention") ? fauter(o.st, s, fr) : s));
      const w = motsDe(ss);
      if (total + w > plafond && b.k !== "titre") { paras.push(["[suivent les mentions d'usage]"]); pstyle.push("mention"); break; }
      if (n > 0 && n + w > par && !["r"].includes(b.k)) { paras.push([`Feuillet ${feuillet}`]); pstyle.push("saut"); feuillet++; n = 0; }
      paras.push(ss); pstyle.push(b.k);
      n += w; total += w;
    }
    // le numéro total de feuillets est connu à la fin
    for (let i = 0; i < paras.length; i++) if (pstyle[i] === "saut") paras[i] = [paras[i][0] + ` / ${feuillet}`];
    // procédure pénale numérique : une signature électronique unique, sans signature par feuillet (art. 801-1)
    const sigs = (o.sigs || []).map((g) => (DOCS.numerique && g.t === "signé" ? Object.assign({}, g, { t: "signature électronique" }) : g));
    const doc = {
      title: o.title, kind: o.kind || "pv", trame: o.trame || "pv", cote: o.cote, bandeau: o.bandeau || null,
      entete: o.entete || [], paras, pstyle, sigs, feuillets: feuillet, signataires: o.signataires || null, mots: total, numerique: !!DOCS.numerique,
    };
    if (o.video) doc.video = o.video;
    if (o.schema) doc.schema = o.schema; // lésions à porter sur le schéma corporel (certificats)
    return doc;
  };

  // ---------------------------------------------------------------- le procès-verbal (forme commune)
  // o : { cote, proc, service, unite, cadre, titre, qualite, numPV, jour, heure, redacteur, visa, lieu, identite, blocs, cloture,
  //       signataires, st, objet }
  DOCS.pv = function (o) {
    const cadre = o.cadre || "FLAGRANT DÉLIT";
    const bandeau = {
      service: o.service, unite: o.unite, cadre, titre: o.titre.toUpperCase(), qualite: o.qualite ? o.qualite.toUpperCase() : null,
      grille: [["Procédure", o.proc], ["PV n°", o.numPV || "—"], ["Pièce", o.cote], ["Année", String(CR.ymd(o.jour).y)]].concat(DOCS.numerique ? [["Support", "procédure pénale numérique"]] : []),
    };
    const ouv = [
      DOCS.p(`Le ${DOCS.jour(o.jour)} à ${DOCS.heures(o.heure)} minutes,`),
      DOCS.p(`Nous, ${o.redacteur.nom}, ${o.redacteur.qualite},`),
      o.visa ? DOCS.p(o.visa) : DOCS.p(cadre === "FLAGRANT DÉLIT" ? "Vu les articles 53 et suivants du code de procédure pénale," : "Vu les articles 75 et suivants du code de procédure pénale,"),
      DOCS.p(`${o.lieu || "Nous trouvant au service"}, rapportons les opérations suivantes :`),
    ];
    if (o.objet) ouv.unshift(DOCS.titre(o.objet));
    const id = o.identite ? [
      DOCS.ligne("Nom", o.identite.nom.toUpperCase()), DOCS.ligne("Prénom", o.identite.prenom),
      o.identite.naissance ? DOCS.ligne("Né" + (o.identite.g === "f" ? "e" : ""), o.identite.naissance.replace(/^le /, "")) : null,
      o.identite.adresse ? DOCS.ligne("Demeurant", o.identite.adresse) : null,
      o.identite.tel ? DOCS.ligne("Téléphone", o.identite.tel) : null,
      o.identite.metier ? DOCS.ligne("Profession", o.identite.metier) : null,
      o.identite.famille ? DOCS.ligne("Situation de famille", o.identite.famille) : null,
      DOCS.ligne("Nationalité", o.identite.nationalite || "française"),
    ] : [];
    const blocs = [ouv, o.avantIdentite || [], id, o.blocs, o.cloture ? [o.cloture] : []];
    const sigs = (o.signataires || [`${o.redacteur.nom}, ${o.redacteur.qualite}`]).map((qui) => (typeof qui === "string" ? { qui, t: "signé" } : qui));
    return DOCS.composer({
      title: o.titreLong || o.titre, kind: "pv", trame: "pv", cote: o.cote, bandeau, blocs, sigs, st: o.st,
      entete: [`${o.service}${o.unite ? " · " + o.unite : ""}`, `Procédure n° ${o.proc} — cote ${o.cote}`], video: o.video,
    });
  };
  // formule de clôture d'une audition
  DOCS.clotureAudition = (lieu, jour, heure, qui) => DOCS.mention(`Fait et clos à ${lieu}, le ${DOCS.date(jour)} à ${DOCS.heures(heure)}. Lecture faite par ${qui === "lui" ? "lui-même" : qui === "elle" ? "elle-même" : qui}, ${qui === "elle" ? "elle" : "il"} persiste et signe avec nous${DOCS.numerique ? " sur la tablette de signature, après lecture de l'acte à l'écran (art. D. 589-4)" : ""}, n'ayant rien à changer, à ajouter ou à retrancher.`);

  // ---------------------------------------------------------------- pièce courte de pure forme (réquisition, avis, billet, bordereau)
  DOCS.forme = function (o) {
    return DOCS.composer({ title: o.title, kind: o.kind || "pv", trame: "forme", cote: o.cote, entete: o.entete, blocs: o.blocs, sigs: (o.sigs || []).map((qui) => (typeof qui === "string" ? { qui, t: "signé" } : qui)), st: o.st, schema: o.schema, video: o.video });
  };

  // ---------------------------------------------------------------- mesures
  DOCS.mots = (doc) => motsDe([].concat(...(doc.paras || [])));
  DOCS.texte = (doc) => (doc.paras || []).map((p) => p.map((s) => (typeof s === "string" ? s : s.t || "")).join("")).join("\n");
})();
