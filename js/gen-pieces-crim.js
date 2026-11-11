/* La Permanence — les pièces des affaires criminelles générées (phase 2).
   Réquisitoire introductif, constatations et planche photographique décrite, rapport d'autopsie ou certificat médico-légal,
   auditions (victime, proches, témoins), garde à vue de 48 heures (96 heures en criminalité organisée) et ses prolongations,
   audition du gardé à vue, perquisition, réquisitions téléphoniques, ADN, balistique, toxicologie, expertises, vidéos, messages,
   expertise psychiatrique, enquête de personnalité ; puis l'interrogatoire de première comparution et l'ordonnance du juge des
   libertés quand le client arrive en cours d'information. Les irrégularités tirées sont portées en secret (flag), jamais signalées.
   Les enjeux de défense (CAT.ENJEUX) sont portés par une phrase de la pièce qui les concerne (fait « E_<enjeu> »).
   GEN2.piecesCrim(t, N) rend la même forme que GEN2.pieces : { docs, titres, anomalies, facts, listes, cotes, C }. */
(function () {
  const CR = window.CR;
  const CAT = CR.CAT;
  const GEN2 = CR.GEN2;
  const S = "signé";
  const hm = (m) => CR.fmtTime(((Math.round(m) % 1440) + 1440) % 1440);
  const D = (d) => CR.fmtDate(d, "long");
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const guill = (x) => String(x).replace(/«\s?/g, "“").replace(/\s?»/g, "”");
  const VERIF = CAT.VERIF;

  // ------------------------------------------------------------------ Régimes des irrégularités propres aux affaires criminelles
  const IRR_CRIM = {
    gav_enregistrement_absent: { label: "Audition criminelle en garde à vue sans enregistrement audiovisuel", regle: "En matière criminelle, les auditions du gardé à vue sont enregistrées (art. 64-1) ; l'impossibilité technique doit être mentionnée au procès-verbal et le procureur avisé. À défaut, l'audition encourt l'annulation.", textes: ["CPP_64-1"], sanction: "nullite", grief: "presume", effet: "Annulation des auditions non enregistrées", regul: false, prog: "pp_enquete" },
    gav_prolongation_bo: { label: "Garde à vue de criminalité organisée prolongée au-delà de 48 heures sans décision du juge", regle: "Au-delà de quarante-huit heures, la garde à vue de criminalité organisée n'est prolongée que par une décision écrite et motivée du juge des libertés et de la détention ou du juge d'instruction, prise avant l'expiration du délai (art. 706-88).", textes: ["CPP_706-88"], sanction: "nullite", grief: "presume", effet: "Annulation de la mesure au-delà de la quarante-huitième heure et des auditions qui s'y sont tenues", regul: false, prog: "pp_enquete" },
    avocat_differe_non_motive: { label: "Intervention de l'avocat différée sans décision écrite et motivée", regle: "Le report de l'intervention de l'avocat en criminalité organisée suppose une décision écrite et motivée du procureur ou du juge, au regard de raisons impérieuses tenant aux circonstances (art. 706-88).", textes: ["CPP_706-88", "CPP_63-3-1"], sanction: "nullite", grief: "presume", effet: "Annulation des auditions réalisées hors la présence de l'avocat", regul: false, prog: "pp_enquete" },
    interrogatoire_sans_avis_avocat: { label: "Interrogatoire du juge d'instruction sans convocation régulière de l'avocat", regle: "L'avocat est convoqué au plus tard cinq jours ouvrables avant l'interrogatoire et la procédure est mise à sa disposition quatre jours ouvrables avant (art. 114), sauf renonciation expresse de la personne.", textes: ["CPP_114"], sanction: "nullite", grief: "presume", effet: "Annulation de l'interrogatoire", regul: false, prog: "pp_instruction" },
    perquisition_nuit_crim: { label: "Perquisition commencée de nuit hors des cas autorisés", regle: "Sauf réclamation de la personne ou exceptions légales (criminalité organisée sur autorisation du juge), les perquisitions ne peuvent être commencées avant six heures ni après vingt et une heures (art. 59).", textes: ["CPP_59"], sanction: "nullite", grief: "presume", effet: "Annulation de la perquisition et des saisies", regul: false, prog: "pp_enquete" },
  };
  for (const [k, v] of Object.entries(IRR_CRIM)) if (!CR.IRREG[k]) CR.IRREG[k] = Object.assign({ id: k, source: VERIF }, v);
  Object.assign(CR.INDICES, {
    gav_enregistrement_absent: "C'est une garde à vue pour crime. Que dit le procès-verbal de l'enregistrement des auditions ? Et l'article 64-1 ?",
    gav_prolongation_bo: "Comptez les heures depuis le début de la mesure. Qui a autorisé la prolongation au-delà de la quarante-huitième heure, et quand ?",
    avocat_differe_non_motive: "L'avocat est arrivé tard. Qui a décidé de différer son intervention, et sous quelle forme ?",
    interrogatoire_sans_avis_avocat: "Quand l'avocat a-t-il été convoqué pour cet interrogatoire ? Comptez les jours ouvrables.",
    perquisition_nuit_crim: "À quelle heure la perquisition a-t-elle commencé ? Est-ce une affaire de criminalité organisée ?",
  });
  // Irrégularités que le moteur sait glisser dans un dossier criminel (même forme que GEN2.IRR)
  GEN2.IRR_CRIM = {
    gav_notif: { regime: "gav_notif_tardive", annule: ["aveux"], p: 0.25, piece: "pv_gav" },
    avis_parquet: { regime: "gav_avis_parquet_tardif", annule: ["aveux"], p: 0.1, piece: "pv_gav" },
    interprete: { regime: "interprete_absent", annule: ["aveux"], p: 0.1, piece: "pv_gav", cond: (t) => !!t.A.etranger },
    gav_enreg: { regime: "gav_enregistrement_absent", annule: ["aveux"], p: 0.22, piece: "pv_audition_gav", cond: (t) => !t.bo && t.q.nature === "crime" },
    prolong_bo: { regime: "gav_prolongation_bo", annule: ["aveux"], p: 0.25, piece: "pv_prolongation_bo", cond: (t) => t.bo },
    avocat_differe: { regime: "avocat_differe_non_motive", annule: ["aveux"], p: 0.25, piece: "pv_gav", cond: (t) => t.bo },
    perq_nuit: { regime: "perquisition_nuit_crim", annule: ["saisie"], p: 0.18, piece: "pv_perquisition", cond: (t) => !t.bo && t.preuves.includes("saisie") },
    geoloc: { regime: "geolocalisation_sans_autorisation", annule: ["telephonie"], p: 0.15, piece: "requisitions_tel", cond: (t) => !t.flagrance && t.preuves.includes("telephonie") },
    avis_114: { regime: "interrogatoire_sans_avis_avocat", annule: ["interro"], p: 0.3, piece: "pv_ipc", cond: (t) => t.camp === "defense" && ["detenu", "libre"].includes(t.entree) },
  };

  // Le service d'enquête selon l'affaire
  const SERVICE = (t) => {
    const fam = CAT.INF[t.inf].fam;
    if (t.f.ctx === "interpellation") return "Inspection générale de la police nationale";
    if (["voisin_fusil", "culture"].includes(t.f.ctx)) return "Groupement de gendarmerie de l'Essonne · Brigade de recherches";
    if (fam === "crim_stups") return "Office anti-stupéfiants · antenne de Paris";
    if (fam === "crim_sexuel") return t.V && t.V.age < 18 ? "Brigade de protection des mineurs" : "Brigade de protection de la famille";
    if (["vol_arme", "sequestration"].includes(t.inf)) return "Brigade de répression du banditisme";
    return "Direction régionale de la police judiciaire · Brigade criminelle";
  };

  GEN2.piecesCrim = function (t, N) {
    let r = CR.seeded(t.sig + ":pieces");
    const TJ = CR.MONDE.lieuxDe(t).TJ;
    const caDe = TJ.ca.replace(/^Cour/, "cour");
    const A = t.A, V = t.V, T = t.T, T2 = t.T2, P = t.P;
    const n = (x) => (x ? `${x.prenom} ${x.nom}` : "");
    const civ = (x) => (x && x.g === "f" ? "Mme" : "M.");
    const nf = (x) => `${civ(x)} ${n(x)}`;
    const e = (x) => (x && x.g === "f" ? "e" : "");
    const il = (x) => (x && x.g === "f" ? "elle" : "il");
    const has = (k) => t.preuves.includes(k);
    const irr = (k) => t.irr.includes(k);
    const q = t.q;
    const proc = N.procedural;
    const nomV = (x) => (proc && x === V ? `${x.g === "f" ? "la mineure" : "le mineur"} ${x.prenom[0]}. ${x.nom[0]}.` : nf(x));
    const opjN = `${pk(r, ["Commandant", "Capitaine", "Lieutenant"])} ${pk(r, ["Hélène Garnier", "Marc Viallet", "Sonia Rahmani", "Pierre Lestrade", "Aurélie Dumas", "Karim Benhamou"])}`;
    const svc = SERVICE(t);
    const docs = {}, titres = {}, facts = {}, anomalies = {};
    let cote = 0;
    const cotes = {};
    const add = (key, titre, fn) => { cote++; cotes[key] = "D" + cote; titres[key] = `${titre} (D${cote})`; docs[key] = fn; };
    const ent = (key, s2) => [s2 || `Préfecture de police · ${svc}`, `Procédure n° ${t.proc} — information n° ${t.ninfo} — cote ${cotes[key]}`];
    const fact = (id, o) => { if (!facts[id]) facts[id] = o; };
    const d = t.d;
    const jf = d.faits;
    // les phrases des enjeux, rangées par pièce
    // Chaque enjeu est porté par une pièce, choisie à la construction (jamais au rendu : l'ordre de lecture ne doit rien changer)
    const ENDOC = {};
    const ed = (docKey) => (ENDOC[docKey] || []).map((x) => [{ t: x.t, f: x.f }]);
    const enjeuVers = (piece) => Object.values(N.enjeux || {}).some((x) => x.piece === piece);

    // ---------------------------------------------------------------- Chronologie de la garde à vue (48 h, 96 h en criminalité organisée)
    const C = {};
    C.jg = d.gav;
    C.debut = d.gavMin;
    C.notif = irr("gav_notif") ? C.debut + int(CR.seeded(t.sig + "n"), 140, 200) : C.debut + int(r, 10, 25);
    C.avisPq = irr("avis_parquet") ? C.debut + int(r, 190, 280) : C.debut + int(r, 15, 40);
    C.avocat = t.bo ? (irr("avocat_differe") ? C.debut + 2880 + 15 : C.debut + 2880 + 10) : C.notif + int(r, 50, 150);
    C.aud = t.bo ? C.debut + int(r, 600, 900) : C.avocat + int(r, 35, 70);
    C.aud2 = C.debut + 1440 + int(r, 120, 400);
    C.prol24 = C.debut + 1440 - int(r, 40, 140);
    C.prolBO = irr("prolong_bo") ? C.debut + 2880 + int(r, 30, 110) : C.debut + 2880 - int(r, 40, 160);
    C.fin = C.debut + (t.bo ? int(r, 3600, 5600) : int(r, 2400, 2860));

    // ---------------------------------------------------------------- Faits du bloc-notes
    fact("G_version", { label: "Sa version des faits" });
    if (t.camp === "defense") {
      fact("G_heberg", { label: A.heberg ? `Un hébergement stable, ${A.rue}` : "Pas d'hébergement stable", key: true, why: "La première garantie de représentation, devant le juge des libertés comme pour une demande de mise en liberté." });
      fact("G_casier", { label: A.casier ? (t.rec ? "Une condamnation récente : la récidive" : "Une ancienne condamnation") : "Aucune condamnation", key: true, why: t.rec ? "La récidive criminelle relève le maximum (art. 132-8)." : "" });
      if (A.emploi) fact("G_emploi", { label: `Un emploi : ${A.metier}`, key: true });
    }
    fact("G_qualif", { label: `La qualification : ${q.label} (${q.court})`, key: true, why: `Peine encourue : ${CAT.encourueTexte(q)}. Jugée par ${CAT.JUR_LABEL[t.jur] || "la juridiction compétente"}.` });
    for (const [eid, x] of Object.entries(N.enjeux || {})) fact(x.f, { label: x.fort ? CAT.enjeuLabel(eid, t.A, t.V) : `${CAT.enjeuLabel(eid, t.A, t.V)} ? Le dossier le dément en partie`, key: x.fort, why: x.fort ? CAT.ENJEUX[eid].arg : "Un enjeu discuté : la pièce ne le soutient pas, mais il faut le savoir avant de plaider." });

    // ---------------------------------------------------------------- D : réquisitoire introductif
    const pq = (CR.acteur(t.parquet) || { nom: "Le substitut du procureur" }).nom;
    add("ri", "Réquisitoire introductif", () => ({ title: "Réquisitoire introductif", kind: "greffe", entete: [`${TJ.tj} · Parquet · section ` + (t.mineur ? "des mineurs" : CAT.INF[t.inf].fam === "crim_stups" ? "de la criminalité organisée" : "criminelle"), `Procédure n° ${t.proc}`], paras: [
      [`Le ${TJ.procureur}, vu les pièces de la procédure établie par ${svc.split(" · ").pop().toLowerCase().replace(/^brigade/, "la brigade").replace(/^office/, "l'office").replace(/^inspection/, "l'inspection").replace(/^direction/, "la direction").replace(/^groupement/, "le groupement")} ;`],
      [`Attendu qu'il en résulte contre ${n(A)}${t.mineur ? `, mineur${e(A)} de ${t.ageFaits} ans au moment des faits,` : ""} des indices graves ou concordants d'avoir, à Paris et sur le territoire national, le ${D(jf)}, ${N.prevention}${(t.f.agg || []).map(CAT.aggPrev).filter(Boolean).map((x) => ", " + x).join("")} ;`],
      [{ t: `Faits prévus et réprimés par ${CAT.courtLong(q.court)} ;`, f: "G_qualif" }],
      [`Vu les articles 79, 80 et 80-1 du code de procédure pénale${t.mineur ? " et les dispositions du code de la justice pénale des mineurs" : ""} ;`],
      [`Requiert qu'il plaise au juge d'instruction informer contre ${n(A)}${t.co ? " et tous autres" : ""}, procéder à son interrogatoire de première comparution et à sa mise en examen${t.dpRequise ? ", et saisir le juge des libertés et de la détention aux fins de placement en détention provisoire" : ""}.`],
      [`Fait au parquet, le ${D(d.ri)}.`],
    ], sigs: [{ qui: pq + ", substitut du procureur de la République", t: S }] }));

    // ---------------------------------------------------------------- D : transport sur les lieux, constatations, planche photographique
    if (N.constat.length || N.photos.length) add("pv_constat", proc ? "Signalement et saisine" : "Constatations et planche photographique", () => ({ title: proc ? "Procès-verbal de saisine" : "Procès-verbal de transport, de constatations et de saisies", kind: "pv", entete: ent("pv_constat"), paras: [
      [`Le ${D(jf)}${proc ? "" : `, à ${hm(t.d.h + int(r, 15, 50))}`}, nous, ${opjN}, officier de police judiciaire,${proc ? "" : ` nous transportons ${N.lieu}.`}`],
      ...N.constat.map((x) => [x]),
      ...ed("pv_constat"),
      ...(N.photos.length ? [["Planche photographique jointe (vingt-quatre clichés) ; extraits :"]].concat(N.photos.map((x) => [{ t: x, f: "X_photos" }])) : []),
      ["Dont procès-verbal."],
    ], sigs: [{ qui: `${opjN}, officier de police judiciaire`, t: S }] }));
    if (N.photos.length) fact("X_photos", { label: "La planche photographique des lieux" });

    // ---------------------------------------------------------------- D : le corps, ou la victime : autopsie, certificat, examen médico-légal
    const M = N.medical || { kind: "aucun" };
    const medecin = `Dr ${pk(r, ["Élise Vannier", "Marc Dubreuil", "Nora Belhadj", "Thomas Lepage", "Anne Collard"])}, médecin légiste`;
    if (M.kind === "autopsie" && V) {
      add("medical", "Rapport d'autopsie", () => ({ title: "Rapport d'autopsie médico-légale", kind: "courrier", entete: ["Institut médico-légal de Paris · 2, place Mazas, 75012 Paris", `Réquisition du procureur de la République — procédure n° ${t.proc}`], paras: [
        [`Autopsie de ${nomV(V)}, ${V.age === 0 ? "âgé de quelques mois" : `${V.age} ans`}, pratiquée le ${D(jf + int(r, 1, 3))}, en présence d'un officier de police judiciaire.`],
        [`Examen externe : ${M.mineur ? "nourrisson eutrophe, sans trace de dénutrition" : `${pk(r, ["sujet de corpulence normale", "sujet de forte corpulence", "sujet maigre"])}, rigidité ${pk(r, ["installée", "en cours de levée"])}, lividités ${pk(r, ["dorsales fixées", "déclives non fixées"])}`}.`],
        [{ t: `Lésions : ${(M.lesions || []).join(" ; ")}.`, f: "X_lesions" }],
        ...(M.mineur ? [] : [[`Toxicologie : ${pk(r, ["alcoolémie de 0,4 g/l ; pas de stupéfiant", "absence d'alcool et de stupéfiants", "présence de cannabinoïdes, sans alcool", "alcoolémie de 1,6 g/l"])}.`]]),
        ...ed("medical"),
        [{ t: `Conclusion : ${M.cause || "décès d'origine traumatique"}`, f: "X_mort" }],
      ], sigs: [{ qui: medecin, t: S }] }));
      fact("X_mort", { label: "La cause de la mort, selon l'autopsie", key: true });
      fact("X_lesions", { label: "Les lésions décrites à l'autopsie" });
    } else if ((M.kind === "umj" || M.kind === "examen_sexuel") && V) {
      add("medical", M.kind === "examen_sexuel" ? "Examen médico-légal de la victime" : "Certificat médico-légal", () => ({ title: M.kind === "examen_sexuel" ? "Rapport d'examen médico-légal — victime d'agression sexuelle" : "Certificat médical — unité médico-judiciaire", kind: "courrier", entete: ["Unité médico-judiciaire de l'Hôtel-Dieu · AP-HP", `Réquisition de l'officier de police judiciaire — procédure n° ${t.proc}`], paras: [
        [`Examen de ${nomV(V)}, ${V.age} ans, le ${D(jf + int(r, 0, 2))}${M.kind === "examen_sexuel" ? ", en présence d'une infirmière, après recueil du consentement à l'examen" : ""}.`],
        [{ t: `Constatations : ${(M.lesions || []).join(" ; ") || "pas de lésion traumatique récente"}.`, f: "X_lesions" }],
        M.prelevements ? [M.prelevements] : null,
        M.texte ? [M.texte] : null,
        M.retentissement ? [M.retentissement] : null,
        ...ed("medical"),
        M.itt != null ? [{ t: `Conclusion : incapacité totale de travail, au sens pénal, de ${M.itt} jour${M.itt > 1 ? "s" : ""}${M.itt ? ", sous réserve de complications" : ""}.`, f: "X_itt" }] : null,
      ].filter(Boolean), sigs: [{ qui: medecin, t: S }] }));
      fact("X_itt", { label: `L'ITT fixée par l'unité médico-judiciaire${M.itt != null ? ` : ${M.itt} jours` : ""}`, key: true });
      fact("X_lesions", { label: "Les constatations médico-légales" });
    } else if (M.kind === "procedural_mineur" && V) {
      add("medical", "Examen médico-légal du mineur", () => ({ title: "Procès-verbal de remise du rapport médico-légal", kind: "pv", entete: ent("medical"), paras: [[M.texte], ...ed("medical")], sigs: [{ qui: `${opjN}, officier de police judiciaire`, t: S }] }));
    }

    // ---------------------------------------------------------------- D : la victime, les proches, les témoins
    if (N.victime && V) {
      const jv = jf + (t.flagrance ? 0 : int(r, 0, 4));
      add("pv_victime", proc ? "Audition enregistrée du mineur" : M.kind === "autopsie" ? "Audition" : "Audition de la victime", () => ({ title: proc ? "Procès-verbal d'audition d'un mineur victime (art. 706-52)" : "Procès-verbal d'audition de la victime", kind: "pv", entete: ent("pv_victime"), paras: [
        proc ? [`Le ${D(jv)}, nous, ${opjN}, officier de police judiciaire de la ${svc.split(" · ").pop().toLowerCase()} :`] : [`Le ${D(jv)}, à ${hm(int(r, 9 * 60, 19 * 60))}, devant nous, ${opjN}, comparaît ${nf(V)}, ${V.age} ans, ${V.metier}, qui déclare :`],
        ...N.victime.map((x, i) => [proc || /^Audition /.test(x) ? { t: x, f: i === (proc ? 1 : 0) ? "X_victime" : undefined } : { t: `« ${guill(x)} »`, f: i === 0 ? "X_victime" : undefined }]),
        ...ed("pv_victime"),
        [proc ? "Dont procès-verbal." : "Lecture faite, persiste et signe."],
      ], sigs: proc ? [{ qui: "L'officier de police judiciaire", t: S }, { qui: "L'administrateur ad hoc", t: S }] : [{ qui: "L'officier de police judiciaire", t: S }, { qui: "La personne entendue", t: S }] }));
      fact("X_victime", { label: proc ? "Les déclarations enregistrées du mineur" : `Les déclarations de ${nf(V)}`, key: t.camp === "pc" });
    }
    if (N.proche && P) {
      add("pv_proche", `Audition de ${nf(P)}`, () => ({ title: "Procès-verbal d'audition de témoin", kind: "pv", entete: ent("pv_proche"), paras: [
        [`Le ${D(jf + int(r, 1, 3))}, entendons ${nf(P)}, ${P.age} ans, ${P.metier}, ${P.lien} de ${proc ? nomV(V) : n(V)}, qui déclare :`],
        ...N.proche.map((x, i) => [{ t: `« ${guill(x)} »`, f: i === 0 ? "X_proche" : undefined }]),
        ...ed("pv_proche"),
        ["Lecture faite, persiste et signe."],
      ], sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "Le témoin", t: S }] }));
      fact("X_proche", { label: `Les déclarations de ${nf(P)}, ${P.lien} de la victime` });
    }
    const temoins = [T, T2];
    N.temoins.forEach((tm, i) => {
      const W = temoins[i] || T;
      const key = i ? "pv_temoin2" : "pv_temoin";
      add(key, `Audition de ${nf(W)}`, () => ({ title: "Procès-verbal d'audition de témoin", kind: "pv", entete: ent(key), paras: [
        [`Le ${D(jf + (t.flagrance && i === 0 ? 0 : int(r, 1, 12)))}, entendons ${nf(W)}, ${W.age} ans, ${W.metier}, demeurant ${W.adresse}, qui déclare :`],
        ...tm.lines.map((x, j) => [/^Audition /.test(x) ? x : { t: `« ${guill(x)} »`, f: j === 0 ? (i ? "X_temoin2" : "X_temoin") : undefined }]),
        ...ed(key),
        ["Lecture faite, persiste et signe."],
      ], sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "Le témoin", t: S }] }));
      fact(i ? "X_temoin2" : "X_temoin", { label: `Le témoignage de ${nf(W)}`, key: t.camp === "pc" });
    });

    // ---------------------------------------------------------------- D : garde à vue (placement, droits, prolongations, auditions)
    add("pv_gav", "Placement en garde à vue", () => ({ title: "Procès-verbal de placement en garde à vue et de notification des droits", kind: "pv", entete: ent("pv_gav"), paras: [
      [`Le ${D(C.jg)}, à ${hm(C.debut + 5)}, nous, ${opjN}, officier de police judiciaire,`],
      [`Vu les articles 62-2, 63, 63-1 à 63-4-3${t.bo ? " et 706-88" : ""}${t.mineur ? " du code de procédure pénale et les dispositions du code de la justice pénale des mineurs" : " du code de procédure pénale"} ;`],
      [{ t: `Placement en garde à vue de ${n(A)}, né${e(A)} ${A.naissance}${t.mineur ? `, mineur${e(A)} de ${t.ageFaits} ans` : ""}, avec effet à ${hm(C.debut)}, pour des faits de ${q.label}.`, f: "X_gav" }],
      [{ t: `Avis au procureur de la République à ${hm(C.avisPq)}.`, flag: irr("avis_parquet") ? "avis_parquet" : undefined }],
      irr("interprete") ? [{ t: `À ${hm(C.debut + 15)}, notifions à ${n(A)} ses droits, en langue française ; ${il(A)} déclare comprendre et signe.`, flag: "interprete" }]
        : [{ t: `À ${hm(C.notif)}, notifions à ${n(A)} ses droits : faire prévenir un proche${t.mineur ? " et ses représentants légaux, qui en sont avisés" : ""}, être examiné${e(A)} par un médecin, être assisté${e(A)} par un avocat, par un interprète, faire des déclarations, répondre aux questions ou se taire.`, flag: irr("gav_notif") ? "gav_notif" : undefined }],
      [`${CR.cap(il(A))} demande l'assistance d'${pk(r, ["un avocat commis d'office", "un avocat de son choix"])}.`],
      t.bo ? [{ t: irr("avocat_differe") ? `Intervention de l'avocat différée jusqu'à la quarante-huitième heure, sur instruction téléphonique du magistrat du parquet de permanence.` : `Par décision écrite et motivée du procureur de la République, versée en annexe, l'intervention de l'avocat est différée jusqu'à la quarante-huitième heure en raison de la nécessité de procéder à des interpellations en cours (art. 706-88).`, flag: irr("avocat_differe") ? "avocat_differe" : undefined }] : [`Avis à l'avocat à ${hm(C.notif + 5)} ; entretien confidentiel de trente minutes à ${hm(C.avocat - 30)}.`],
      t.mineur ? ["Examen médical de droit du mineur de moins de seize ans, ou à la demande, réalisé ; les représentants légaux sont informés."] : ["Examen médical : la personne ne le demande pas."],
      ["Dont procès-verbal, que la personne signe avec nous après lecture."],
    ], sigs: [{ qui: opjN + ", officier de police judiciaire", t: S }, { qui: "La personne gardée à vue", t: S }, { qui: "L'interprète (le cas échéant)", t: "", flag: irr("interprete") ? "interprete" : undefined }] }));
    fact("X_gav", { label: `La garde à vue, à partir du ${D(C.jg)} à ${hm(C.debut)}` });
    add("pv_prolongation", "Prolongation de la garde à vue", () => ({ title: "Procès-verbal de prolongation de la garde à vue", kind: "pv", entete: ent("pv_prolongation"), paras: [
      [`Présentation de ${n(A)} au procureur de la République par visioconférence.`],
      [`Le ${D(C.jg + Math.floor(C.prol24 / 1440))}, à ${hm(C.prol24)}, le procureur de la République autorise par écrit la prolongation de la garde à vue pour vingt-quatre heures, à compter de ${hm(C.debut)}, aux fins de poursuivre les investigations (art. 63, II).`],
    ], sigs: [{ qui: "L'officier de police judiciaire", t: S }] }));
    if (t.bo) add("pv_prolongation_bo", "Prolongation exceptionnelle (criminalité organisée)", () => ({ title: "Procès-verbal de prolongation de la garde à vue au-delà de quarante-huit heures", kind: "pv", entete: ent("pv_prolongation_bo"), paras: [
      [`Présentation de ${n(A)} au juge des libertés et de la détention.`],
      [{ t: `Le ${D(C.jg + Math.floor(C.prolBO / 1440))}, à ${hm(C.prolBO)}, le juge des libertés et de la détention autorise, par ordonnance écrite et motivée, la prolongation de la garde à vue pour une durée de quarante-huit heures, à compter de la quarante-huitième heure (art. 706-88).`, flag: irr("prolong_bo") ? "prolong_bo" : undefined }],
    ], sigs: [{ qui: "Le juge des libertés et de la détention", t: S }] }));
    const declGav = (N.audition || []).map((a) => [{ t: `Question : ${a.q}` }, { t: `Réponse : ${t.stance === "nie" ? a.a.silence === "…" ? a.a.partiel : (a.a.expliquer || N.version.nie) : a.a.expliquer || N.version[t.stance]}`, f: a === N.audition[0] ? "X_aveux" : undefined }]);
    add("pv_audition_gav", "Audition en garde à vue", () => ({ title: "Procès-verbal d'audition de la personne gardée à vue", kind: "pv", entete: ent("pv_audition_gav"), paras: [
      [`Le ${D(C.jg + Math.floor(C.aud / 1440))}, de ${hm(C.aud)} à ${hm(C.aud + int(r, 60, 150))}, entendons ${n(A)}, en présence de son avocat${t.bo ? " (intervention différée : audition sans avocat)" : ""}.`],
      [{ t: irr("gav_enreg") ? "Enregistrement audiovisuel : sans objet." : t.bo ? "Enregistrement audiovisuel : non réalisé (art. 64-1, dernier alinéa : criminalité organisée), le procureur de la République en étant avisé." : `Enregistrement audiovisuel de l'audition, gravé sur support numérique placé sous scellé n° ${int(r, 1, 9)} (art. 64-1).`, flag: irr("gav_enreg") ? "gav_enreg" : undefined }],
      ...declGav,
      ...ed("pv_audition_gav"),
      ["Lecture faite, persiste et signe."],
    ], sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "La personne entendue", t: S }, { qui: "L'avocat", t: t.bo ? "" : S }] }));
    fact("X_aveux", { label: "Ses déclarations en garde à vue" });

    // ---------------------------------------------------------------- D : perquisition et saisies
    if (has("saisie")) {
      const hP = irr("perq_nuit") ? int(r, 22 * 60 + 5, 23 * 60 + 40) : int(r, 6 * 60, 9 * 60);
      add("pv_perquisition", "Perquisition et saisies", () => ({ title: "Procès-verbal de perquisition et de saisies", kind: "pv", entete: ent("pv_perquisition"), paras: [
        [{ t: `Le ${D(C.jg)}, à ${hm(hP)}, nous transportons au domicile de ${n(A)}, ${A.adresse}, et procédons à une perquisition en sa présence${t.bo ? ", sur autorisation écrite du juge des libertés et de la détention (art. 706-89)" : ""}.`, flag: irr("perq_nuit") ? "perq_nuit" : undefined }],
        [{ t: `Découvrons et saisissons : ${N.saisie || pk(r, ["deux téléphones, un ordinateur portable et des vêtements tachés", "un sac de sport, des gants et un téléphone", "des documents et deux téléphones"])}, placés sous scellés.`, f: "X_saisie" }],
        [`Fin des opérations à ${hm(hP + int(r, 50, 150))}.`],
      ], sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "La personne chez qui la perquisition a eu lieu", t: S }] }));
      fact("X_saisie", { label: "Les objets saisis en perquisition" });
    }

    // ---------------------------------------------------------------- D : téléphonie, ADN, balistique, toxicologie, expertises techniques
    if (has("telephonie")) {
      const j0 = jf - int(r, 20, 40);
      add("requisitions_tel", "Réquisitions téléphoniques", () => ({ title: "Procès-verbal d'exploitation des réquisitions téléphoniques", kind: "releve", entete: ent("requisitions_tel"), paras: [
        [`Réquisitions adressées aux opérateurs, ${t.flagrance ? "sur autorisation du procureur de la République (art. 60-1 et 60-2)" : "sur commission rogatoire du juge d'instruction"} : liste des appels et des relais déclenchés par les lignes utiles à la manifestation de la vérité.`],
        irr("geoloc") ? [{ t: `Poursuivons la géolocalisation en temps réel de la ligne et du véhicule de ${n(A)}, autorisée par le procureur de la République le ${D(j0)}, jusqu'au ${D(j0 + int(r, 21, 34))}.`, flag: "geoloc" }] : null,
        [{ t: N.telephonie || `Le jour des faits, à ${hm(t.d.h)}, la ligne attribuée à ${n(A)} déclenche le relais couvrant les lieux.`, f: "X_tel" }],
        ...ed("requisitions_tel"),
      ].filter(Boolean), sigs: [{ qui: "L'officier de police judiciaire", t: S }] }));
      fact("X_tel", { label: "La téléphonie du mis en cause", key: true });
    }
    if (has("adn")) add("rapport_adn", "Rapport d'analyse génétique", () => ({ title: "Rapport d'analyse génétique", kind: "courrier", entete: ["Laboratoire de police scientifique de Paris", `Procédure n° ${t.proc}`], paras: [
      [`Scellés analysés : ${pk(r, ["écouvillons de frottis réalisés sur les lieux", "prélèvements sous les ongles de la victime", "objets saisis sur les lieux"])}.`],
      ...(ENDOC.rapport_adn ? ed("rapport_adn") : [[{ t: N.adn || `Profil génétique isolé, comparé au fichier national automatisé des empreintes génétiques : concordance avec le profil de ${n(A)}.`, f: "X_adn" }]]),
      ["La présence d'un ADN sur un objet ne renseigne pas, à elle seule, sur la date ni sur les circonstances du dépôt."],
    ], sigs: [{ qui: "L'expert en génétique", t: S }] }));
    if (has("adn")) fact("X_adn", { label: "Le rapport d'analyse génétique", key: true });
    if (has("balistique")) add("balistique", "Rapport balistique", () => ({ title: "Rapport d'examen balistique", kind: "courrier", entete: ["Laboratoire central de la préfecture de police · section balistique", `Procédure n° ${t.proc}`], paras: [
      [`Examen des étuis et projectiles placés sous scellés, ${t.f.arme ? `et de l'arme saisie (${t.f.arme})` : "aucune arme n'ayant été retrouvée"}.`],
      [{ t: t.f.arme ? "Les étuis présentent les traces de percussion et d'éjection caractéristiques de l'arme saisie ; les projectiles ont été tirés par le même canon." : "Les étuis proviennent d'une même arme, inconnue du fichier des armes ; elle n'a pas été utilisée dans une autre affaire.", f: "X_balistique" }],
    ], sigs: [{ qui: "L'expert en balistique", t: S }] }));
    if (has("toxico")) add("toxico", "Rapport toxicologique", () => ({ title: "Rapport d'analyse toxicologique", kind: "courrier", entete: ["Laboratoire de toxicologie de la préfecture de police", `Procédure n° ${t.proc}`], paras: [[{ t: N.toxico || "Analyse des prélèvements : résultats versés au dossier.", f: "X_toxico" }], ...ed("toxico")], sigs: [{ qui: "Le toxicologue", t: S }] }));
    if (has("expertise") || N.expertise || enjeuVers("expertise")) add("expertise_tech", "Rapport d'expertise", () => ({ title: "Rapport d'expertise", kind: "courrier", entete: [`Expert près la ${caDe}`, `Procédure n° ${t.proc}`], paras: [
      [`Mission confiée par ${t.flagrance ? "l'officier de police judiciaire, sur instructions du parquet" : "le juge d'instruction"}.`],
      N.expertise ? [{ t: N.expertise, f: "X_expertise" }] : null,
      ...ed("expertise_tech"),
    ].filter(Boolean), sigs: [{ qui: "L'expert", t: S }] }));
    if (N.expertise) fact("X_expertise", { label: "Les conclusions de l'expert" });
    if (has("toxico")) fact("X_toxico", { label: "L'analyse toxicologique", key: true });
    if (has("balistique")) fact("X_balistique", { label: "L'expertise balistique", key: true });
    if (has("releve")) fact("X_releve", { label: "Les mouvements bancaires", key: true });
    if (has("video") || N.video || enjeuVers("video")) add("video", "Exploitation des images", () => ({ title: "Procès-verbal d'exploitation des images", kind: "video", entete: ent("video"), paras: [
      [`Exploitation des images ${pk(r, ["de la caméra de vidéoprotection la plus proche", "de la caméra de l'établissement", "versées par un témoin"])}, horodatage du ${CR.fmtDate(jf, "num")}.`],
      N.video ? [{ t: N.video, f: "X_video" }] : [{ t: N.resume, f: "X_video" }],
      ...ed("video"),
    ], sigs: [{ qui: "L'officier de police judiciaire", t: S }] }));
    if (docs.video) fact("X_video", { label: "Ce que montrent les images", key: true });
    if ((has("ecrits") && N.ecrits && N.ecrits.length) || enjeuVers("ecrits")) add("captures", "Messages", () => ({ title: "Procès-verbal d'exploitation des messages", kind: "releve", entete: ent("captures"), paras: [["Extraits des messages retrouvés dans les téléphones exploités :"]].concat((N.ecrits || []).map((m, i) => [{ t: /^(Courrier|Main courante|Publications|Carnet|Messages de|Message à|Groupe|Avant|Après|À )/.test(m) ? m : `${CR.fmtDate(jf - (N.ecrits.length - i) * int(r, 1, 6), "num")}, ${hm(int(r, 0, 1439))} — ${m}`, f: i === 0 ? "X_ecrits" : undefined }]), ed("captures")), sigs: [{ qui: "L'officier de police judiciaire", t: S }] }));
    if (N.ecrits && N.ecrits.length) fact("X_ecrits", { label: "Les messages retrouvés" });
    if (has("releve")) add("releve", "Relevés bancaires", () => ({ title: "Réponse à réquisition bancaire", kind: "releve", entete: [pk(r, ["Banque Postale", "BNP Paribas", "Société Générale"]) + " · service des réquisitions judiciaires", `Procédure n° ${t.proc}`], paras: [[`Titulaire : ${n(A)}.`], [{ t: `Mouvements en espèces et virements sans rapport avec les revenus déclarés : ${CR.money(int(r, 8, 120) * 1000)} sur les douze mois précédant les faits.`, f: "X_releve" }]], sigs: [] }));

    // ---------------------------------------------------------------- D : expertise psychiatrique, enquête de personnalité, casier
    add("expertise_psy", "Expertise psychiatrique", () => ({ title: "Rapport d'expertise psychiatrique", kind: "courrier", entete: [`Expert psychiatre près la ${caDe}`, `Ordonnance du juge d'instruction — information n° ${t.ninfo}`], paras: [
      ...N.psy.map((x, i) => [i === N.psy.length - 1 ? { t: x, f: "X_psy" } : x]),
      ...ed("expertise_psy"),
    ], sigs: [{ qui: `Dr ${pk(r, ["Jean-Luc Ferrand", "Claire Morand", "Hakim Sefraoui"])}, psychiatre`, t: S }] }));
    fact("X_psy", { label: `L'expertise psychiatrique : discernement ${{ intact: "ni aboli ni altéré", altere: "altéré", aboli: "aboli" }[t.f.psy]}`, key: t.f.psy !== "intact", why: "Abolition : irresponsabilité pénale ; altération : la peine encourue est réduite du tiers (art. 122-1)." });
    add("personnalite", "Enquête de personnalité", () => ({ title: "Rapport d'enquête de personnalité", kind: "courrier", entete: [t.mineur ? "Protection judiciaire de la jeunesse · service territorial éducatif" : "Association d'enquêtes sociales près le tribunal judiciaire", `Information n° ${t.ninfo}`], paras: N.personnalite.map((x) => [x]).concat([[{ t: A.heberg ? `Hébergement possible : ${A.adresse}, chez ${A.proche}.` : "Aucun hébergement stable identifié.", f: "G_heberg" }]]), sigs: [{ qui: "L'enquêteur", t: S }] }));
    docs.casier = () => ({ title: "Bulletin n° 1 du casier judiciaire", kind: "greffe", entete: ["Ministère de la Justice · Casier judiciaire national", "107, rue du Landreau, 44317 Nantes"], paras: [["Relevé délivré à l'autorité judiciaire."], [`Identité : ${A.nom} ${A.prenom}, né${e(A)} ${A.naissance}.`], [{ t: A.casier === 0 ? "Néant." : t.rec ? `Cour d'assises de ${pk(r, ["Paris", "Seine-Saint-Denis", "Val-de-Marne"])}, il y a ${Math.max(4, Math.min(int(r, 4, 9), A.age - 22))} ans : vol avec arme, huit ans de réclusion criminelle.` : (() => {
      // une ancienne condamnation : après la majorité (ou devant le tribunal pour enfants pour un mineur)
      const jur = pk(r, ["Bobigny", "Paris", "Créteil"]), tire = int(r, 5, 12), quoi = pk(r, ["vol", "usage de stupéfiants", "violences"]), peine = pk(r, ["amende de 400 euros", "deux mois avec sursis"]);
      // le même nombre d'années que ce que dit la personne (M.casierAncien) ; le tirage de « tire » reste, pour la suite du hasard
      const n = tire >= 0 ? CR.MONDE.ansCasier(A, 99) : 0;
      if (CR.MONDE.casierMineur(A)) return `Tribunal pour enfants de ${jur}, il y a ${n > 1 ? "deux ans" : "un an"} : ${quoi}, avertissement judiciaire.`;
      return `Tribunal correctionnel de ${jur}, il y a ${n} an${n > 1 ? "s" : ""} : ${quoi}, ${peine}.`;
    })(), f: "G_casier_b1" }]] });
    titres.casier = "Casier judiciaire";

    // ---------------------------------------------------------------- D : l'information déjà engagée (client qui arrive en cours d'information)
    if (t.camp === "defense" && ["detenu", "libre"].includes(t.entree)) {
      const avIPC = irr("avis_114") ? `Me ${pk(r, ["Paul Ravel", "Inès Morel", "Hugo Lasne"])}, convoqué par télécopie la veille, absent ; la personne déclare accepter d'être entendue` : `En présence de Me ${pk(r, ["Paul Ravel", "Inès Morel", "Hugo Lasne"])}, avocat choisi, convoqué dans les formes de l'article 114`;
      add("pv_ipc", "Interrogatoire de première comparution", () => ({ title: "Procès-verbal d'interrogatoire de première comparution", kind: "pv", entete: [`Cabinet de ${(CR.acteur(t.ji) || { nom: "le juge d'instruction" }).nom}, juge d'instruction`, `Information n° ${t.ninfo} — cote ${cotes.pv_ipc}`], paras: [
        [`Le ${D(d.mex)}, devant nous, ${(CR.acteur(t.ji) || { nom: "le juge d'instruction" }).nom}, juge d'instruction, assisté de notre greffier, comparaît ${n(A)}.`],
        [{ t: `${avIPC}.`, flag: irr("avis_114") ? "avis_114" : undefined }],
        [`Faisons connaître à la personne chacun des faits dont nous sommes saisis et leur qualification : ${q.label}. L'avisons de son droit de faire des déclarations, de répondre aux questions ou de se taire.`],
        [{ t: `La personne déclare : « ${t.stance === "nie" ? "Je conteste. " + N.version.nie : t.stance === "reconnait" ? N.version.reconnait : "Je préfère me taire pour l'instant." } »`, f: "X_ipc" }],
        [`Estimant qu'il existe des indices graves ou concordants (art. 80-1), mettons ${n(A)} en examen du chef de ${q.label}.`],
      ], sigs: [{ qui: "Le juge d'instruction", t: S }, { qui: "La personne mise en examen", t: S }, { qui: "Le greffier", t: S }] }));
      fact("X_ipc", { label: "Ses déclarations devant le juge d'instruction" });
      if (t.entree === "detenu") add("ordo_dp", "Ordonnance de placement en détention provisoire", () => ({ title: "Ordonnance de placement en détention provisoire", kind: "greffe", entete: [`${(CR.acteur(t.jld) || { nom: "Le juge des libertés et de la détention" }).nom}, juge des libertés et de la détention`, `Information n° ${t.ninfo}`], paras: [
        [`Vu le débat contradictoire du ${D(d.mex)} ; vu les articles 137, 143-1, 144 et 145${t.mineur ? " du code de procédure pénale et les dispositions du code de la justice pénale des mineurs" : " du code de procédure pénale"} ;`],
        [`Attendu que la détention est l'unique moyen ${pk(r, ["d'empêcher une pression sur les témoins ou la victime", "de garantir le maintien de la personne à la disposition de la justice", "de mettre fin au trouble exceptionnel et persistant à l'ordre public causé par la gravité de l'infraction"])} (art. 144) ;`],
        [{ t: `Ordonnons le placement en détention provisoire de ${n(A)} ; la détention ne pourra excéder ${t.mineur ? "six mois" : t.q.nature === "crime" ? "un an" : "quatre mois"}, sauf prolongation après débat contradictoire.`, f: "X_dp" }],
      ], sigs: [{ qui: "Le juge des libertés et de la détention", t: S }] }));
      fact("X_dp", { label: `En détention provisoire depuis le ${D(d.dp)}`, key: true, why: t.q.nature === "crime" ? "Détention criminelle : un an, puis prolongations de six mois après débat (art. 145-2) ; plafonds selon la peine encourue." : "Détention correctionnelle : quatre mois, prolongations (art. 145-1)." });
    }

    // ---------------------------------------------------------------- D : procès-verbal de synthèse (et les enjeux sans autre pièce)
    const PIECE_DOC = { medical: "medical", temoin: "pv_temoin", victime: docs.pv_victime ? "pv_victime" : "pv_proche", telephonie: "requisitions_tel", adn: "rapport_adn", psy: "expertise_psy", expertise: "expertise_tech", video: "video", ecrits: "captures", toxico: "toxico", audition: "pv_audition_gav", constat: "pv_constat" };
    add("pv_synthese", "Synthèse de l'enquête", () => ({ title: "Procès-verbal de synthèse", kind: "pv", entete: ent("pv_synthese"), paras: [
      [`Synthèse des investigations conduites par ${svc.split(" · ").pop().toLowerCase()} dans la procédure n° ${t.proc}.`],
      [{ t: N.resume, f: "X_synthese" }],
      N.mobile ? [`Contexte relevé par l'enquête : ${N.mobile.replace(/\.$/, "")}.`] : null,
      ...ed("pv_synthese"),
      [`${CR.cap(n(A))} ${t.stance === "nie" ? "conteste les faits" : t.stance === "minimise" ? "reconnaît une partie des faits et en conteste la portée" : "reconnaît les faits"}.`],
    ].filter(Boolean), sigs: [{ qui: `${opjN}, officier de police judiciaire`, t: S }] }));
    fact("X_synthese", { label: "La synthèse des enquêteurs" });
    for (const [eid, x] of Object.entries(N.enjeux || {})) {
      let k = PIECE_DOC[x.piece] || "pv_synthese";
      if (!docs[k]) k = "pv_synthese";
      (ENDOC[k] = ENDOC[k] || []).push({ t: /^«/.test(x.t) ? x.t : x.t, f: x.f, eid });
    }

    // ---------------------------------------------------------------- Anomalies : régime, pièce, pièces du calcul annulées
    for (const id of t.irr) {
      const x = GEN2.IRR_CRIM[id];
      if (!x || !docs[x.piece]) continue;
      anomalies[id] = { irreg: x.regime, piece: x.piece, annule: x.annule.slice(), force: 0.7 };
    }

    // ---------------------------------------------------------------- Listes : ce que l'avocat voit, et quand
    const tous = Object.keys(docs);
    const instruction = ["expertise_psy", "personnalite"].concat(t.entree === "deferement" || t.entree === "pc" || t.entree === "convoc" ? ["balistique", "toxico", "expertise_tech", "rapport_adn"] : []).filter((k) => docs[k]);
    const enquete = tous.filter((k) => !instruction.includes(k) && k !== "casier");
    const listes = {
      enquete,
      instruction,
      ipc: ["ri", "pv_constat", "medical", "pv_victime", "pv_gav", "pv_audition_gav"].filter((k) => docs[k]),
      dossier: enquete.concat(["casier"]),
      copie: tous.filter((k) => !instruction.includes(k)),
      tout: tous,
      client: [],
    };
    for (const k of Object.keys(docs)) if (!titres[k]) titres[k] = k;
    for (const k of Object.keys(docs)) { const fn = docs[k]; docs[k] = (x) => { r = CR.seeded(t.sig + ":" + k); return CAT.typoDeep(fn(x)); }; }
    return { docs, titres, anomalies, facts, listes, cotes, C };
  };
})();
