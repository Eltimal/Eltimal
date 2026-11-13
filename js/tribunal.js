// La Permanence — refonte du gameplay, lot 4a : le tribunal qui raisonne (CR.TRIB)
// Le délibéré n'additionne plus des poids : il examine chaque élément de l'infraction — l'acte, son imputation au
// prévenu, l'intention —, cherche pour chacun la preuve qui le porte parmi les pièces qui restent au dossier (une pièce
// annulée en sort), et la confronte aux moyens que la défense a effectivement soutenus. Puis il examine les causes
// d'irresponsabilité. Le jugement écrit est la trace de ce raisonnement : le joueur lit pourquoi il a gagné ou perdu.
// Périmètre : les délits des affaires générées (le tirage porte ses preuves et ses doutes). Le reste garde l'ancien calcul.
(function () {
  "use strict";
  const CR = window.CR;
  const T = (CR.TRIB = {});

  // ------------------------------------------------------------------ Ce que chaque preuve prouve (D-08)
  // part de la force d'une preuve (B.FORCE, la même échelle qu'avant) portée par chaque élément
  T.PORTEE = {
    constat: { acte: 0.6, auteur: 0.9 }, plainte: { acte: 1, auteur: 0.6 }, certificat: { acte: 1.2, auteur: 0 },
    temoin: { acte: 1, auteur: 0.8 }, video: { acte: 1, auteur: 0.45 }, telephonie: { acte: 0.3, auteur: 1 },
    adn: { acte: 0.3, auteur: 1.1 }, expertise: { acte: 1, auteur: 0.2 }, saisie: { acte: 0.8, auteur: 0.9 },
    labo: { acte: 1, auteur: 0.4 }, ecrits: { acte: 0.9, auteur: 0.8 }, releve: { acte: 0.9, auteur: 0.7 },
    ethylo: { acte: 1, auteur: 0.9 }, fichier: { acte: 1, auteur: 0.6 }, autopsie: { acte: 1, auteur: 0 },
    aveux: { acte: 1, auteur: 1, intention: 1.2 },
  };
  // ce que chaque moyen de la défense attaque (doutes du tirage) ; ld = cause d'irresponsabilité
  T.ATTAQUE = { doute_ident: "auteur", alibi_tel: "auteur", temoin_contra: "acte", d_video: "acte", notif_permis: "intention", legitime_defense: "ld", d_deleg: "auteur" };
  T.ELEMENTS = [["acte", "L'élément matériel"], ["auteur", "L'imputation des faits au prévenu"], ["intention", "L'élément moral"]];
  // seuils (calés contre l'ancien calcul, D-10) ; la sévérité du magistrat les déplace un peu
  T.SEUIL = { acte: 0.27, auteur: 0.265, intention: 0.2 };

  const genT = (s, cs) => { const p = CR.GEN && CR.GEN.paramsOf ? CR.GEN.paramsOf(s, cs.id) : null; return p && p.t ? p.t : null; };
  T.actif = (s, cs, spec) => { const t = genT(s, cs); return !!(t && spec && spec.pieces && !t.info && t.genre !== "info" && !(CR.CAT && CR.CAT.INF[t.inf] && CR.CAT.INF[t.inf].info)); };

  // ------------------------------------------------------------------ Le raisonnement
  // rend { coupable, elements: [{ id, porte, attaque, etabli, preuves:[{k, label, part}], moyens:[{k, label, soutenu}] }], ld, ... }
  T.raisonner = function (api, spec, ctx) {
    const { s, cs } = api;
    const t = genT(s, cs);
    const juge = ctx.juge || { severite: 0.5 };
    const played = new Set(ctx.played || []);
    const annules = (cs.proc && cs.proc.annules) || [];
    const E = {};
    for (const [id, label] of T.ELEMENTS) E[id] = { id, label, porte: 0, attaque: 0, preuves: [], moyens: [], ecartees: [] };
    E.ld = { id: "ld", label: "La légitime défense", porte: 0, attaque: 0, preuves: [], moyens: [], ecartees: [] };
    for (const [k, pc] of Object.entries(spec.pieces || {})) {
      if (pc.sens === "charge") {
        const por = T.PORTEE[k] || { acte: 1, auteur: 0.5 };
        if (annules.includes(k)) { for (const e of Object.keys(por)) if (E[e] && por[e]) E[e].ecartees.push({ k, label: pc.label }); continue; }
        for (const [e, part] of Object.entries(por)) if (E[e] && part) { E[e].porte += pc.force * part; E[e].preuves.push({ k, label: pc.label, part: pc.force * part }); }
      } else {
        const id = k.replace(/^d_/, ""), cible = T.ATTAQUE[id] || T.ATTAQUE[k] || "acte";
        const soutenu = !pc.need || [].concat(pc.need).some((n) => played.has(n) || (pc.noteSuffit && CR.hasFact(cs, n)));
        E[cible].moyens.push({ k, label: pc.label, soutenu, force: pc.force });
        if (soutenu) E[cible].attaque += pc.force * ({ ld: 1, acte: 1.9, intention: 0.8 }[cible] || 1.25);
      }
    }
    // l'intention se déduit de l'acte établi, sauf moyen contraire
    E.intention.porte += Math.min(E.acte.porte, 0.45) * 0.6;
    // les arguments de culpabilité plaidés (anciennes fiches) : ils pèsent sur l'élément le plus discuté
    for (const [aid, a] of Object.entries(spec.arguments || {})) {
      if (a.type && a.type !== "culpabilite") continue;
      if (![].concat(a.cards || []).some((c) => played.has(c))) continue;
      const pert = a.pertinent ? a.pertinent(api, ctx) : true;
      E.auteur.attaque += pert ? a.poids : -0.04;
    }
    const sev = ((juge.severite || 0.5) - 0.5) * 0.1;
    const bruit = (CR.seeded(cs.id + "delib" + s.seed)() - 0.5) * 0.06;
    for (const [id] of T.ELEMENTS) {
      const e = E[id];
      e.net = e.porte - e.attaque + sev + bruit;
      e.etabli = e.net >= T.SEUIL[id];
      e.preuves.sort((x, y) => y.part - x.part);
    }
    // la légitime défense : admise si le moyen est soutenu et que l'accusation n'établit pas la riposte disproportionnée
    const ldMoyen = E.ld.moyens.find((m) => m.soutenu);
    E.ld.admise = !!ldMoyen && E.ld.attaque - (E.acte.porte - 0.35) * 0.5 + bruit > 0.06;
    const manque = T.ELEMENTS.map(([id]) => E[id]).find((e) => !e.etabli) || null;
    const coupable = !manque && !E.ld.admise;
    // trace pour le débrief (même forme qu'avant)
    const calc = [];
    for (const [id] of T.ELEMENTS) {
      const e = E[id];
      calc.push({ k: e.etabli ? "charge" : "decharge", t: `${e.label} : ${e.etabli ? "établi" : "non établi"} (preuves ${Math.round(e.porte * 100)}, moyens soutenus ${Math.round(e.attaque * 100)}, seuil ${Math.round(T.SEUIL[id] * 100)})` });
      for (const m of e.moyens) if (!m.soutenu) calc.push({ k: "oubli", t: `${m.label} : jamais plaidé` });
      for (const p of e.ecartees) calc.push({ k: "annulee", t: `${p.label} : annulée, écartée` });
    }
    if (ldMoyen) calc.push({ k: E.ld.admise ? "decharge" : "charge", t: `Légitime défense : ${E.ld.admise ? "admise" : "écartée"}` });
    const R = { coupable, manque: manque && manque.id, ld: E.ld.admise ? "admise" : ldMoyen ? "ecartee" : null, elements: T.ELEMENTS.map(([id]) => { const e = E[id]; return { id, etabli: e.etabli, preuves: e.preuves.slice(0, 3).map((p) => p.k), ecartees: e.ecartees.map((p) => p.k), moyens: e.moyens.map((m) => ({ k: m.k, soutenu: m.soutenu })) }; }), inf: t && t.inf };
    // score continu : la marge de l'élément le plus faible (positive = culpabilité établie), comme l'ancien score
    const score = Math.min(...T.ELEMENTS.map(([id]) => E[id].net - T.SEUIL[id])) - (E.ld.admise ? 1 : 0);
    return { coupable, score, calc, questions: [], raisonnement: R };
  };

  // ------------------------------------------------------------------ Les motifs, en français de jugement
  const LIB = { constat: "les constatations des fonctionnaires interpellateurs", plainte: "les déclarations constantes de la partie civile", certificat: "les constatations médicales", temoin: "le témoignage recueilli au cours de l'enquête", video: "l'exploitation des images de vidéoprotection", telephonie: "l'exploitation des données téléphoniques", adn: "la comparaison génétique", expertise: "les conclusions de l'expertise", saisie: "la saisie opérée", labo: "l'analyse du laboratoire", ecrits: "les messages versés au dossier", releve: "les relevés bancaires", ethylo: "la mesure de l'imprégnation alcoolique", fichier: "les mentions du fichier national des permis de conduire", autopsie: "les constatations médico-légales", aveux: "les déclarations du prévenu lui-même" };
  const MOY = { doute_ident: "que l'identification du prévenu comme auteur des faits n'est pas établie avec certitude", alibi_tel: "que les données de son téléphone le situent ailleurs au moment des faits", temoin_contra: "que le témoin ne confirme pas la version de l'accusation", video: "que les images ne montrent pas le geste reproché", notif_permis: "que le prévenu ignorait la mesure dont la violation lui est reprochée", legitime_defense: "que le prévenu a agi en état de légitime défense", deleg: "que le prévenu avait valablement délégué ses pouvoirs" };
  const liste = (a) => (a.length <= 1 ? a.join("") : a.slice(0, -1).join(", ") + " et " + a[a.length - 1]);
  // la cote d'une preuve, si la pièce est au dossier (moteur de documents)
  T.COTE_KEYS = { constat: ["pv_interpellation", "constat"], plainte: ["pv_victime", "plainte"], certificat: ["certificat_umj", "certificat", "umj"], temoin: ["pv_temoin", "temoin"], video: ["pv_video", "video"], telephonie: ["pv_telephonie"], adn: ["rapport_adn"], saisie: ["pv_saisie", "saisie", "pv_perquisition"], labo: ["rapport_labo"], ecrits: ["captures"], releve: ["releve"], ethylo: ["pv_alcoolemie"], fichier: ["fichier_permis"], aveux: ["pv_audition"], expertise: ["expertise"], autopsie: ["autopsie"] };
  T.cote = function (s, cs, k) {
    for (const key of T.COTE_KEYS[k] || []) {
      const d = cs.docs.find((x) => x.key === key);
      if (!d) continue;
      try { const r = CR.renderDoc(s, cs, d); if (r && r.cote) return r.cote; } catch (e) { /* pièce ancienne */ }
    }
    return null;
  };
  T.motifs = function (s, cs, R, nom) {
    const out = [];
    const cite = (k) => { const c = T.cote(s, cs, k); return LIB[k] + (c ? ` (${c})` : ""); };
    for (const el of R.elements) {
      const titre = { acte: "Sur la matérialité des faits", auteur: "Sur l'imputation des faits", intention: "Sur l'élément intentionnel" }[el.id];
      const moyens = el.moyens.filter((m) => m.soutenu).map((m) => MOY[m.k.replace(/^d_/, "")] || "que les faits ne sont pas établis");
      let txt = "";
      if (el.ecartees.length) txt += `Les actes annulés, ${liste(el.ecartees.map((k) => LIB[k] || k))}, sont retirés du dossier et ne peuvent fonder la décision. `;
      if (moyens.length) txt += `La défense soutient ${liste(moyens)}. `;
      if (el.etabli) txt += el.preuves.length ? `Il résulte toutefois ${el.id === "intention" ? "des circonstances mêmes de l'action, et de" : "de"} ${liste(el.preuves.map(cite))}, ${moyens.length ? "que cet argument ne suffit pas à faire naître un doute" : "que cet élément est établi"}${el.id === "auteur" ? ` à l'égard de ${nom}` : ""}.` : "Cet élément résulte des circonstances de l'action.";
      else txt += el.preuves.length ? `Or ${liste(el.preuves.map(cite))} ne ${el.preuves.length > 1 ? "suffisent" : "suffit"} pas, à ${el.preuves.length > 1 ? "eux" : "lui"} seul${el.preuves.length > 1 ? "s" : ""}, à l'établir avec la certitude qu'exige la loi pénale ; le doute doit profiter au prévenu.` : "Aucune pièce régulière du dossier ne permet de l'établir ; le doute doit profiter au prévenu.";
      out.push({ titre, t: txt.trim(), etabli: el.etabli });
      if (!el.etabli) break; // le tribunal s'arrête au premier élément manquant
    }
    if (R.ld && !out.some((x) => !x.etabli)) out.push({ titre: "Sur la légitime défense", t: "La défense soutient que le prévenu a agi en état de légitime défense. " + (R.ld === "admise" ? "Il ressort des débats que le prévenu a riposté à une atteinte injustifiée, dans le même temps et par un geste proportionné. Les conditions de l'article 122-5 du code pénal sont réunies : il n'est pas pénalement responsable." : "La riposte alléguée n'apparaît ni nécessaire ni proportionnée à l'atteinte invoquée ; les conditions de l'article 122-5 du code pénal ne sont pas réunies."), etabli: R.ld !== "admise" });
    return out;
  };

  // ------------------------------------------------------------------ Branchement : délibéré et jugement
  if (CR.PROC && CR.PROC.deliberer && !CR.PROC.deliberer.trib) {
    const ancien = CR.PROC.deliberer;
    CR.PROC.deliberer = function (api, spec, ctx) {
      if (T.off || !T.actif(api.s, api.cs, spec)) return ancien(api, spec, ctx);
      const d = T.raisonner(api, spec, ctx);
      const played = new Set(ctx.played || []);
      if (d.coupable && spec.qualif) d.qualif = spec.qualif(api, Object.assign({}, ctx, { played }));
      if (d.coupable && spec.peine) d.peine = spec.peine(api, Object.assign({}, ctx, { played, qualif: d.qualif }));
      if (spec.civil && api.cs.proc.pcConstituee !== false) d.civil = spec.civil(api, Object.assign({}, ctx, { played, coupable: d.coupable, qualif: d.qualif }));
      api.cs.vars.raisonnement = d.raisonnement;
      return d;
    };
    CR.PROC.deliberer.trib = true;
    CR.PROC.deliberer.ancien = ancien;
  }
  // le jugement : les motifs de culpabilité deviennent le raisonnement ; la décision écrite suit par le greffe (D-11)
  T.brancherJuger = function () {
    const PEN = CR.PEN;
    if (!PEN || !PEN.juger || PEN.juger.trib) return;
    const ancien = PEN.juger;
    PEN.juger = function (api, o) {
      const { s, cs } = api;
      delete cs.vars.raisonnement;
      const dec = ancien(api, o);
      const R = cs.vars.raisonnement;
      if (!R || !dec) return dec;
      const q = dec.questions.find((x) => x.q === "Sur la culpabilité");
      const M = T.motifs(s, cs, R, o.prevenuNom || "le prévenu");
      if (q) q.motif = M.map((m) => `${m.titre}. ${m.t}`).join(" ");
      T.notifier(api, o, dec, M);
      return dec;
    };
    PEN.juger.trib = true;
  };
  T.brancherJuger();

  // ------------------------------------------------------------------ Le jugement écrit (trame : dev/ref/trames-pieces.md)
  const MAJ = (x) => String(x || "").toUpperCase();
  T.notifier = function (api, o, dec, M) {
    const { s, cs } = api;
    const t = genT(s, cs);
    const jour = CR.addBusinessDays(s.day, 1 + (CR.hash(cs.id + ":notif") % 3));
    cs.vars.jugementEcrit = { day: s.day, min: s.min, titre: o.titre || "Jugement correctionnel", juridiction: o.juridiction || "tc", motifs: M, dispositif: dec.dispositif, questions: dec.questions.map((x) => ({ q: x.q, r: x.r, motif: x.motif })), prevenu: o.prevenuNom || "", pc: o.pcNom || "", qualif: dec.qualif ? { label: dec.qualif.label, court: dec.qualif.court || dec.qualif.art || "" } : null, prevention: (cs.proc && cs.proc.prevention) || (t && CR.CAT && CR.CAT.INF[t.inf] ? CR.CAT.INF[t.inf].nom : ""), coupable: dec.coupable, notifie: jour, president: (CR.acteur(cs.actors && cs.actors.president) || {}).nom || "", parquet: (CR.acteur(cs.actors && cs.actors.parquet) || {}).nom || "", inf: t && t.inf };
    CR.schedule(s, { day: jour, min: 10 * 60 + (CR.hash(cs.id) % 300), type: "fn", key: "jugementEcrit", data: { caseId: cs.id } });
  };
  CR.GLOBAL_FN = CR.GLOBAL_FN || {};
  CR.GLOBAL_FN.jugementEcrit = function (s, d) {
    const cs = s.cases[d.caseId];
    if (!cs || !cs.vars.jugementEcrit || CR.hasDoc(cs, "_jugement")) return;
    const J = cs.vars.jugementEcrit;
    CR.fileDoc(s, cs, { key: "_jugement", title: `${J.titre} du ${CR.fmtDate(J.day, "long")}`, dir: "in" });
    CR.mail(s, { from: "Greffe correctionnel", subject: `Copie du jugement — ${J.prevenu}`, kind: "greffe", caseId: cs.id, body: [[`Maître, vous trouverez au dossier la copie du jugement rendu le ${CR.fmtDate(J.day, "long")}. Le délai d'appel court depuis son prononcé, la décision étant contradictoire (art. 498 du code de procédure pénale).`]] });
  };
  CR.SHARED_DOCS = CR.SHARED_DOCS || {};
  CR.SHARED_DOCS._jugement = function (x) {
    const J = x.cs.vars.jugementEcrit;
    if (!J) return { title: "Jugement", paras: [["(décision indisponible)"]] };
    const jur = (CR.PROC.JURIDICTIONS[J.juridiction] || {}).label || "Tribunal correctionnel";
    const P = [];
    const p = (t) => P.push([t]);
    p(`À l'audience publique du ${MAJ(CR.fmtDate(J.day, "long"))}, le ${jur.replace(/^Tribunal/, "tribunal")}, composé de ${J.president ? J.president + ", président" : "son président"}, assisté du greffier, en présence de ${J.parquet ? J.parquet + ", substitut du procureur de la République" : "du ministère public"}, a rendu le jugement suivant.`);
    p("ENTRE : Monsieur le procureur de la République près ce tribunal, demandeur et poursuivant" + (J.pc ? ` ; ${J.pc}, partie civile` : "") + ".");
    p(`ET : ${J.prevenu}, prévenu${/^Mme|Madame/.test(J.prevenu) ? "e" : ""}, comparant, assisté de son avocat.`);
    if (J.prevention) p(`Prévenu${/^Mme|Madame/.test(J.prevenu) ? "e" : ""} du chef de : ${MAJ(J.prevention)}${J.qualif && J.qualif.court ? `, faits prévus et réprimés par ${J.qualif.court}` : ""}.`);
    p("DÉBATS. Le président a constaté l'identité du prévenu, donné connaissance de l'acte qui a saisi le tribunal et informé le prévenu de son droit, au cours des débats, de faire des déclarations, de répondre aux questions ou de se taire. Il a été procédé à l'instruction de l'affaire et à l'interrogatoire du prévenu. Le ministère public a été entendu en ses réquisitions, l'avocat du prévenu en sa plaidoirie ; le prévenu a eu la parole en dernier. Le greffier a tenu note du déroulement des débats.");
    p("Le tribunal, après en avoir délibéré, a statué en ces termes :");
    p("MOTIFS — SUR L'ACTION PUBLIQUE");
    const exc = J.questions.filter((q) => /nullité|recevabilité|prescription/i.test(q.q));
    for (const q of exc) p(`${q.q}. ${q.motif || ""} ${q.r}`.trim());
    for (const m of J.motifs || []) p(`${m.titre}. ${m.t}`);
    const cul = J.questions.find((q) => q.q === "Sur la culpabilité");
    if (cul) p(cul.r + (J.qualif && J.coupable ? ` Les faits sont retenus sous la qualification de ${J.qualif.label}.` : ""));
    for (const q of J.questions.filter((q) => !/nullité|recevabilité|prescription|culpabilité/i.test(q.q))) p(`${q.q.toUpperCase()}. ${q.motif ? q.motif + " " : ""}${q.r}`);
    p("PAR CES MOTIFS");
    p(`Le tribunal, statuant publiquement, en premier ressort et contradictoirement à l'égard de ${J.prevenu} :`);
    p(J.dispositif);
    if (J.coupable) p("Le président a donné au condamné l'avertissement prévu par la loi. La présente décision est assujettie au droit fixe de procédure prévu par l'article 1018 A du code général des impôts, diminué de 20 % s'il est payé dans le délai d'un mois.");
    p("Voies de recours : appel dans le délai de dix jours à compter du prononcé, par déclaration au greffe de la juridiction (art. 498 et 502 du code de procédure pénale).");
    p("Et le présent jugement a été signé par le président et le greffier.");
    return { title: `${J.titre} — ${CR.fmtDate(J.day, "long")}`, kind: "greffe", entete: [jur, `Jugement du ${CR.fmtDate(J.day, "long")}`, "Copie délivrée à l'avocat"], paras: P };
  };
})();
