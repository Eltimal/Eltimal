/* La Permanence — actes pénaux communs à toutes les affaires.
   Chaque affaire décrit ses faits (def.penal) ; les gabarits, dépôts et contrôles viennent d'ici et du moteur de procédure. */
(function () {
  const CR = (window.CR = window.CR || {});
  const R = CR.R;
  const PEN = (CR.PEN = {});
  const TPL = CR.SHARED_TPL;
  const H = CR.FLOW_HOOKS;
  const cfg = (api) => api.def.penal || {};
  const titre = (api) => `${api.c.prenom} ${api.c.nom}`;
  const avocat = (s) => `Me ${s.player.prenom} ${s.player.nom}`;

  // Effets d'une réplique ou d'un choix sur le dossier
  CR.applyFx = function (api, fx) {
    if (!fx) return;
    const { s, cs } = api;
    if (fx.trust) CR.trust(s, cs, fx.trust);
    if (fx.flags) Object.assign(cs.flags, fx.flags);
    if (fx.vars) Object.assign(cs.vars, fx.vars);
    if (fx.cards) fx.cards.forEach((c) => CR.addCard(cs, c));
    if (fx.rep) for (const [k, v] of Object.entries(fx.rep)) CR.rep(s, k, v);
  };

  // Les irrégularités relevées par le joueur deviennent des moyens possibles
  PEN.moyensOptions = (api) => api.cs.issues.map((i) => ({ id: i.id, t: i.text.length > 160 ? i.text.slice(0, 157) + "…" : i.text, flag: i.flag || null, ok: null }));
  PEN.flagsFrom = (api, picks) => {
    const ids = picks || [];
    return ids.map((id) => { const i = api.cs.issues.find((x) => x.id === id); return i ? i.flag || "faux_" + i.id : null; }).filter(Boolean);
  };

  // =================================================================== Conclusions de nullité (tribunal correctionnel ou de police)
  TPL.conclusions_nullite = (api) => {
    const { s, cs } = api;
    const a = cs.proc.audience;
    const j = a ? CR.PROC.JURIDICTIONS[a.juridiction] : null;
    return {
      title: "Conclusions aux fins de nullité", kind: "acte", time: 90, dirLabel: "Rédigées",
      depot: (api.def.tj && !api.def.tj.paris && api.def.tj.lieu) || (j && j.lieu) || "palais", depotLabel: api.def.tj && !api.def.tj.paris ? `Greffe correctionnel, tribunal de ${api.def.tj.ville} (dépôt horodaté)` : "Greffe correctionnel, Batignolles (dépôt horodaté)",
      caption: { court: (api.def.tj && !api.def.tj.paris ? api.def.tj.tc : j ? j.label : "Tribunal correctionnel de Paris").toUpperCase(), left: `POUR : ${titre(api)}, prévenu\nAyant pour avocat ${avocat(s)}`, right: a ? `Audience du ${CR.fmtDate(a.day, "long")}` : "Audience" },
      slots: {
        fondement: CR.choiceSlot("Fondement", [
          { t: "In limine litis, avant toute défense au fond, en application des articles 385 et 802 du code de procédure pénale.", ok: true },
          { t: "À titre subsidiaire, après la discussion sur la culpabilité.", ok: false, defect: "fondement:tardif" },
        ]),
      },
      checks: [
        { id: "moyens", label: "Les moyens de nullité", heading: "Il plaira au tribunal d'annuler :", options: PEN.moyensOptions(api) },
        { id: "grief", label: "Le grief", heading: "Sur le grief :", options: [{ id: "grief", t: "L'irrégularité a porté atteinte aux intérêts du prévenu : les actes viciés fondent la poursuite (art. 171 et 802).", ok: null }] },
      ],
      body: [["PLAISE AU TRIBUNAL"], [{ s: "fondement" }], ["Le prévenu soulève les exceptions de nullité suivantes, et demande l'annulation des actes viciés et de ceux dont ils sont le support nécessaire."]],
    };
  };
  H.filed_conclusions_nullite = (api, { res, depot }) => {
    const { s, cs } = api;
    if (!depot) return;
    const flags = PEN.flagsFrom(api, res.picks.moyens);
    const grief = (res.picks.grief || []).length > 0;
    if (!flags.length) { api.tl("Conclusions déposées sans aucun moyen."); return; }
    const out = CR.PROC.soulever(api, { flags, vehicle: "conclusions", day: s.day, grief });
    if (res.defects.includes("fondement:tardif")) out.forEach((m) => { m.recevable = false; m.motif = "Exception présentée après la défense au fond (art. 385)"; });
    const a = cs.proc.audience;
    const ob = a && api.obl("art385_" + a.hid);
    if (ob) CR.satisfy(s, cs, ob.id);
    CR.toast(s, `Conclusions déposées et horodatées : ${CR.fmtDate(s.day, "short")} à ${CR.fmtTime(s.min)}.`, "info");
    if (out.some((m) => !m.recevable)) api.tl("Le greffier vise les conclusions. Leur recevabilité sera discutée à l'audience.");
  };

  // =================================================================== Requête en nullité (chambre de l'instruction)
  TPL.requete_nullite = (api) => {
    const { s } = api;
    return {
      title: "Requête en nullité (art. 173 CPP)", kind: "acte", time: 120, dirLabel: "Rédigée",
      depot: "cite", depotLabel: "Greffe de la chambre de l'instruction, Île de la Cité (déclaration constatée et datée)",
      caption: { court: "COUR D'APPEL DE PARIS — CHAMBRE DE L'INSTRUCTION", left: `Requérant : ${titre(api)}, mis en examen\nAvocat : ${avocat(s)}`, right: "Requête en nullité" },
      slots: {
        copie: CR.choiceSlot("Copie au juge d'instruction", [
          { t: "Copie de la présente requête est adressée au juge d'instruction, qui transmettra le dossier au président de la chambre de l'instruction.", ok: true },
          { t: "(Pas de copie au juge.)", ok: false, defect: "copie:absente" },
        ]),
      },
      checks: [
        { id: "moyens", label: "Les moyens", heading: "Le requérant demande l'annulation de :", options: PEN.moyensOptions(api) },
        { id: "etendue", label: "L'étendue", heading: "Et par voie de conséquence :", options: [{ id: "cascade", t: "L'annulation des actes dont les pièces viciées sont le support nécessaire (art. 174).", ok: null }] },
      ],
      body: [["À Mesdames et Messieurs les président et conseillers composant la chambre de l'instruction,"], ["Le requérant a l'honneur de soulever la nullité des actes suivants."], [{ s: "copie" }]],
    };
  };
  H.filed_requete_nullite = (api, { res, depot }) => {
    const { s, cs } = api;
    if (!depot) return;
    const flags = PEN.flagsFrom(api, res.picks.moyens);
    const out = CR.PROC.soulever(api, { flags, vehicle: "requete", day: s.day, grief: true });
    cs.vars.requeteCascade = (res.picks.etendue || []).length > 0;
    cs.vars.requeteDay = s.day;
    CR.toast(s, `Requête déclarée au greffe le ${CR.fmtDate(s.day, "short")}.`, "info");
    if (CR.hookExists(cs, "apresRequete")) CR.runHook(s, cs, "apresRequete", { moyens: out });
  };

  // =================================================================== Plainte simple
  TPL.plainte_simple = (api) => {
    const P = cfg(api).plainte || {};
    return {
      title: "Plainte", kind: "courrier", time: 50, dirLabel: "Envoyée",
      to: "Monsieur le procureur de la République, tribunal judiciaire de Paris",
      slots: {
        voie: CR.choiceSlot("Envoi", [
          { t: "Par lettre recommandée avec demande d'avis de réception, adressée au procureur de la République.", ok: true, v: "lrar" },
          { t: "Par courrier simple au commissariat.", ok: false, defect: "voie:simple", v: "simple" },
        ]),
        victime: CR.autoSlot(titre(api)),
        date: CR.factSlot("date des faits", P.date || []),
        lieu: CR.factSlot("lieu des faits", P.lieu || []),
        auteur: CR.factSlot("l'auteur", P.auteur || [], { optional: !!P.auteurInconnu }),
        faits: CR.factSlot("ce qui s'est passé", P.faits || []),
        prejudice: CR.factSlot("le préjudice", P.prejudice || []),
        qualif: CR.choiceSlot("Qualification proposée", P.qualifs || [{ t: "Toute qualification que l'enquête permettra de retenir.", ok: true }]),
      },
      checks: P.pieces ? [{ id: "pieces", label: "Pièces jointes", heading: "Pièces jointes :", options: P.pieces }] : [],
      body: [["Monsieur le procureur de la République,"], ["Je porte plainte au nom de ", { s: "victime" }, ", que j'assiste, pour les faits suivants."], ["Le ", { s: "date" }, ", à ", { s: "lieu" }, " : ", { s: "faits" }, "."], ["Auteur : ", { s: "auteur" }, "."], ["Préjudice : ", { s: "prejudice" }, "."], [{ s: "qualif" }], [{ s: "voie" }]],
    };
  };
  H.filed_plainte_simple = (api, { res }) => {
    const { s, cs } = api;
    cs.vars.plainteSimpleDay = s.day;
    cs.vars.plainteSimpleProcureur = !res.defects.includes("voie:simple");
    cs.flags.plainteSimple = true;
    CR.PROC.event(api, "Plainte simple adressée " + (cs.vars.plainteSimpleProcureur ? "au procureur par lettre recommandée." : "par courrier simple au commissariat."));
    if (CR.hookExists(cs, "apresPlainte")) CR.runHook(s, cs, "apresPlainte", { res });
  };

  // =================================================================== Plainte avec constitution de partie civile
  TPL.pcpc = (api) => {
    const P = cfg(api).pcpc || cfg(api).plainte || {};
    return {
      title: "Plainte avec constitution de partie civile", kind: "acte", time: 120, dirLabel: "Rédigée",
      depot: (api.def.tj && api.def.tj.lieu) || "palais", depotLabel: api.def.tj && !api.def.tj.paris ? `Cabinet du doyen des juges d'instruction, tribunal de ${api.def.tj.ville}` : "Cabinet du doyen des juges d'instruction, Batignolles", depotTime: 20,
      to: "Monsieur le doyen des juges d'instruction, tribunal judiciaire de Paris",
      slots: {
        juge: CR.choiceSlot("Destinataire", [
          { t: "Le doyen des juges d'instruction du tribunal judiciaire compétent.", ok: true },
          { t: "Le procureur de la République.", ok: false, defect: "juge:procureur" },
          { t: "Le président du tribunal correctionnel.", ok: false, defect: "juge:tc" },
        ]),
        victime: CR.autoSlot(titre(api)),
        faits: CR.factSlot("les faits", P.faits || []),
        auteur: CR.factSlot("l'auteur", P.auteur || [], { optional: true }),
        prejudice: CR.factSlot("le préjudice", P.prejudice || []),
        prealable: CR.choiceSlot("Recevabilité (art. 85)", [
          { t: "La plainte simple déposée au procureur est restée sans réponse depuis plus de trois mois, ou a été classée.", ok: true, v: "ok" },
          { t: "(Aucune mention de la plainte préalable.)", ok: false, defect: "prealable:absent", v: "rien" },
        ]),
        qualif: CR.choiceSlot("Qualification", P.qualifs || [{ t: "Toute qualification que l'information permettra de retenir.", ok: true }]),
      },
      body: [["Destinataire : ", { s: "juge" }], ["Madame, Monsieur le juge,"], [{ s: "victime" }, " déclare porter plainte et se constituer partie civile entre vos mains, en application des articles 85 et suivants du code de procédure pénale."], ["Les faits : ", { s: "faits" }, "."], ["L'auteur : ", { s: "auteur" }, "."], ["Le préjudice : ", { s: "prejudice" }, "."], [{ s: "qualif" }], [{ s: "prealable" }]],
    };
  };
  H.filed_pcpc = (api, { res, depot }) => {
    const { s, cs } = api;
    if (!depot) return;
    cs.vars.pcpcDay = s.day;
    const ctrl = CR.PROC.controle(api, "pcpc", { day: s.day });
    if (res.defects.some((d) => d.startsWith("juge"))) { ctrl.ok = false; ctrl.sanction = "irrecevabilite"; ctrl.motif = "La plainte avec constitution de partie civile se dépose devant le doyen des juges d'instruction (art. 85)."; ctrl.regul = "La redéposer au bon destinataire"; }
    if (ctrl.ok) {
      CR.PROC.interrompre(api, s.day, "plainte avec constitution de partie civile (art. 9-2, 1°)");
      CR.PROC.event(api, "Plainte avec constitution de partie civile déposée entre les mains du doyen des juges d'instruction.");
      api.schedule(R.int(s, 14, 28), "_consignation");
    } else {
      api.schedule(R.int(s, 20, 40), "_pcpcIrrecevable", { motif: ctrl.motif, regul: ctrl.regul, sanction: ctrl.sanction });
    }
    if (CR.hookExists(cs, "apresPcpc")) CR.runHook(s, cs, "apresPcpc", { ok: ctrl.ok, res });
  };
  H._consignation = (api) => {
    const { s, cs, def } = api;
    const montant = (cfg(api).consignation != null ? cfg(api).consignation : 1500);
    cs.vars.consignation = { montant, due: CR.rollForward(s.day + 30), paid: false };
    api.oblig({ id: "consignation", label: "Verser la consignation", due: cs.vars.consignation.due, onMiss: "_consignationManquee" });
    api.mail({ from: "Cabinet du doyen des juges d'instruction", subject: "Ordonnance fixant la consignation", kind: "greffe", important: true,
      body: [[`Constatons le dépôt de la plainte avec constitution de partie civile de ${titre(api)}.`], [`Fixons à ${CR.money(montant)} le montant de la consignation à déposer au greffe, par l'intermédiaire de la régie du tribunal, dans le délai d'un mois à compter de la présente ordonnance, sous peine de non-recevabilité de la plainte (art. 88 CPP).`], [`Fait le ${CR.fmtDate(s.day, "long")}.`]] });
  };
  H._consignationManquee = (api) => {
    const { cs } = api;
    if (cs.vars.consignation && cs.vars.consignation.paid) return;
    CR.erreur(api.s, cs, { id: "consignation", texte: "La consignation n'a pas été versée dans le délai fixé par le juge.", sanction: "Plainte avec constitution de partie civile non recevable (art. 88).", regul: "Aucune pour cette plainte ; il faut en déposer une nouvelle si la prescription le permet." });
    api.mail({ from: "Cabinet du doyen des juges d'instruction", subject: "Ordonnance de non-recevabilité", kind: "greffe", important: true, body: [["La consignation n'ayant pas été versée dans le délai imparti, la plainte avec constitution de partie civile est déclarée non recevable (art. 88 CPP)."]] });
    if (CR.hookExists(cs, "pcpcEchec")) api.run("pcpcEchec", { motif: "consignation" });
  };
  H._pcpcIrrecevable = (api, d) => {
    const { cs } = api;
    CR.erreur(api.s, cs, { id: "pcpc_irrecevable", texte: d.motif, sanction: "Ordonnance d'irrecevabilité de la plainte avec constitution de partie civile.", regul: d.regul });
    api.mail({ from: "Cabinet du doyen des juges d'instruction", subject: "Ordonnance d'irrecevabilité", kind: "greffe", important: true, body: [["Disons la plainte avec constitution de partie civile irrecevable."], [d.motif]] });
    if (CR.hookExists(cs, "pcpcEchec")) api.run("pcpcEchec", { motif: d.sanction });
  };
  // Verser la consignation : les fonds du client transitent par la CARPA
  PEN.verserConsignation = (api) => {
    const { s, cs } = api;
    const c = cs.vars.consignation;
    if (!c || c.paid) return;
    CR.spend(s, 15, "admin");
    CR.carpaDeposit(s, cs.id, c.montant, `Fonds du client pour la consignation — ${CR.clientName(cs)}`);
    CR.carpaWithdraw(s, cs.id, c.montant, "Consignation versée à la régie du tribunal");
    c.paid = s.day;
    api.satisfy("consignation");
    CR.PROC.event(api, `Consignation de ${CR.money(c.montant)} versée.`);
    if (CR.hookExists(cs, "consignationVersee")) api.run("consignationVersee", {});
  };

  // =================================================================== Citation directe
  TPL.citation = (api) => {
    const { s, cs } = api;
    const P = cfg(api).citation || {};
    const date = cs.vars.dateAudiencement;
    return {
      title: "Citation directe", kind: "acte", time: 100, dirLabel: "Rédigée",
      depot: "cj", depotLabel: "Étude de commissaires de justice (délivrance sous 2 à 4 jours)", depotTime: 15, cost: 0,
      slots: {
        juridiction: CR.choiceSlot("Juridiction", [
          { t: "Tribunal de police de Paris", ok: P.juridiction === "tp", v: "tp", defect: "juridiction:tp" },
          { t: "Tribunal correctionnel de Paris", ok: P.juridiction === "tc", v: "tc", defect: "juridiction:tc" },
        ]),
        date: CR.autoSlot(date != null ? `${CR.fmtDate(date, "dow")} à ${CR.fmtTime(P.heure || 13 * 60 + 30)}` : "[date d'audience à obtenir du greffe]"),
        prevenu: CR.factSlot("le prévenu", P.prevenu || []),
        faits: CR.factSlot("les faits", P.faits || []),
        date_faits: CR.factSlot("la date des faits", P.dateFaits || []),
        qualif: CR.choiceSlot("Qualification", P.qualifs || []),
        demandes: CR.choiceSlot("Demandes", [
          { t: "Déclarer le prévenu coupable, recevoir la constitution de partie civile, le condamner à réparer le préjudice et à payer une somme au titre de l'article 475-1.", ok: true },
          { t: "Condamner le prévenu à la peine la plus sévère.", ok: false, defect: "demandes:peine" },
        ]),
      },
      body: [["L'AN DEUX MILLE VINGT-SIX, à la requête de ", titre(api), ", ayant pour avocat ", avocat(s), ","], ["Nous, commissaire de justice, avons donné citation à ", { s: "prevenu" }, " d'avoir à comparaître devant le ", { s: "juridiction" }, ", le ", { s: "date" }, "."], ["Pour avoir, le ", { s: "date_faits" }, " : ", { s: "faits" }, "."], [{ s: "qualif" }], ["Plaise au tribunal : ", { s: "demandes" }]],
    };
  };
  H.filed_citation = (api, { res, depot }) => {
    const { s, cs } = api;
    if (!depot) return;
    const juri = (res.filled && res.filled.juridiction) || "tc";
    const delivery = CR.rollForward(s.day + R.int(s, 2, 4));
    cs.vars.citation = { juridiction: juri, deposeDay: s.day, delivery, audienceDay: cs.vars.dateAudiencement };
    api.cost(150, "Délivrance de la citation par commissaire de justice");
    api.at(delivery, "_citationDelivree");
    if (res.defects.includes("demandes:peine")) cs.flags.demandePeine = true;
  };
  H._citationDelivree = (api) => {
    const { s, cs } = api;
    const c = cs.vars.citation;
    const ctrl = CR.PROC.controle(api, "citation", { day: s.day, juridiction: c.juridiction, audienceDay: c.audienceDay });
    c.ctrl = ctrl;
    api.mail({ from: "Étude Marchal & Rives", subject: "Citation délivrée — procès-verbal de remise", kind: "courrier", body: [[`La citation a été délivrée le ${CR.fmtDate(s.day, "long")} à la personne citée.`], ["Vous trouverez ci-joint le procès-verbal de remise. Nos frais : 150 €."]] });
    if (ctrl.sanction === "prescription") { if (CR.hookExists(cs, "citationPrescrite")) api.run("citationPrescrite", { ctrl }); return; }
    CR.PROC.interrompre(api, s.day, "citation directe délivrée (art. 9-2, 1°)");
    cs.proc.pcConstituee = true;
    CR.PROC.stade(api, "citation", `Citation directe délivrée pour l'audience du ${CR.fmtDate(c.audienceDay, "long")}.`);
    if (CR.hookExists(cs, "citationDelivree")) api.run("citationDelivree", { ctrl });
  };
  // Obtenir une date d'audience au greffe (audiencement)
  PEN.audiencement = (api, juridiction) => {
    const { s, cs } = api;
    CR.spend(s, 20, "admin");
    const P = cfg(api).citation || {};
    const day = CR.rollForward(s.day + R.int(s, 26, 34));
    const fix = CR.dow(day) === 2 ? day : CR.rollForward(day + ((9 - CR.dow(day)) % 7));
    cs.vars.dateAudiencement = fix;
    cs.vars.juridictionAudiencement = juridiction || P.juridiction;
    api.note(`Date d'audience donnée par le greffe : ${CR.fmtDate(fix, "dow")}, ${CR.fmtTime(P.heure || 13 * 60 + 30)}`, "F_audiencement", "doc");
    CR.toast(s, `Le greffe vous donne une date : ${CR.fmtDate(fix, "dow")}.`, "info");
    return fix;
  };

  // =================================================================== Constitution de partie civile et chiffrage
  TPL.constitution_pc = (api) => {
    const { s, cs } = api;
    const P = cfg(api).chiffrage || {};
    const a = cs.proc.audience;
    return {
      title: "Conclusions de partie civile", kind: "acte", time: 90, dirLabel: "Rédigées",
      caption: { court: (a ? CR.PROC.JURIDICTIONS[a.juridiction].label : "Tribunal correctionnel de Paris").toUpperCase(), left: `POUR : ${titre(api)}, partie civile\nAyant pour avocat ${avocat(s)}`, right: a ? `Audience du ${CR.fmtDate(a.day, "long")}` : "" },
      slots: {
        envoi: CR.choiceSlot("Comment vous vous constituez", [
          { t: "Par lettre recommandée avec avis de réception parvenue au tribunal vingt-quatre heures au moins avant l'audience, pièces justificatives jointes (art. 420-1) ; conclusions soutenues à la barre.", ok: true, v: "lettre" },
          { t: "À la barre, le jour de l'audience, avant les réquisitions du ministère public (art. 421).", ok: true, v: "barre" },
        ]),
      },
      checks: [
        { id: "postes", label: "Les postes de préjudice (nomenclature Dintilhac)", heading: "Il est demandé au tribunal de condamner le prévenu à verser :", options: (P.postes || []).map((p) => ({ id: p.id, t: `${p.label} : ${CR.money(p.demande)}`, ok: null, needs: p.needs })) },
        { id: "autres", label: "Autres demandes", heading: "Et encore :", options: [
          { id: "art475", t: `Au titre de l'article 475-1 du code de procédure pénale : ${CR.money(P.art475 || 1500)}.`, ok: null },
          { id: "renvoi", t: "À titre subsidiaire, ordonner une expertise et renvoyer sur les intérêts civils (art. 464).", ok: null },
          { id: "prison", t: "Prononcer une peine d'emprisonnement ferme exemplaire.", ok: false, defect: "pc:peine" },
        ] },
      ],
      body: [["PLAISE AU TRIBUNAL"], ["Recevoir ", titre(api), " en sa constitution de partie civile. ", { s: "envoi" }], ["Déclarer le prévenu entièrement responsable du préjudice subi."]],
    };
  };
  H.filed_constitution_pc = (api, { res }) => {
    const { s, cs } = api;
    cs.vars.chiffrage = res.picks;
    cs.vars.constitutionMode = res.filled.envoi || "barre";
    const a = cs.proc.audience;
    if (cs.vars.constitutionMode === "lettre" && a && a.day - s.day >= 2) { cs.proc.pcConstituee = true; CR.PROC.event(api, "Constitution de partie civile adressée au tribunal par lettre recommandée."); }
    if (res.defects.includes("pc:peine")) cs.flags.demandePeine = true;
  };

  // =================================================================== Demande d'actes
  TPL.demande_actes = (api) => {
    const P = cfg(api).actes || [];
    return {
      title: "Demande d'actes (art. 82-1 CPP)", kind: "acte", time: 60, dirLabel: "Envoyée",
      to: `${(api.actor("ji") || { nom: "Le juge d'instruction" }).nom}, juge d'instruction`,
      slots: { motivation: CR.choiceSlot("Motivation", [
        { t: "Ces actes sont nécessaires à la manifestation de la vérité, pour les raisons exposées ci-dessous.", ok: true },
        { t: "Le juge voudra bien faire ce qui lui paraît utile.", ok: false, defect: "motivation:absente" },
      ]) },
      checks: [{ id: "actes", label: "Les actes demandés", heading: "La partie demande qu'il soit procédé à :", options: P }],
      body: [["Madame, Monsieur le juge d'instruction,"], ["En application de l'article 82-1 du code de procédure pénale, la partie que j'assiste sollicite les actes suivants. ", { s: "motivation" }]],
    };
  };
  H.filed_demande_actes = (api, { res }) => {
    const { s, cs } = api;
    cs.vars.demandeActesDay = s.day;
    CR.PROC.event(api, "Demande d'actes adressée au juge d'instruction.");
    api.schedule(R.int(s, 14, 30), "_reponseActes", { picks: res.picks.actes || [], motive: !res.defects.includes("motivation:absente") });
  };
  H._reponseActes = (api, d) => {
    const { cs } = api;
    if (CR.hookExists(cs, "reponseActes")) return api.run("reponseActes", d);
  };

  // =================================================================== Demande de mise en liberté
  TPL.dml = (api) => {
    const P = cfg(api).dml || {};
    return {
      title: "Demande de mise en liberté", kind: "acte", time: 60, dirLabel: "Rédigée",
      depot: (api.def.tj && api.def.tj.lieu) || "palais", depotLabel: api.def.tj && !api.def.tj.paris ? `Greffe du juge d'instruction, tribunal de ${api.def.tj.ville}` : "Greffe du juge d'instruction, Batignolles", depotTime: 10,
      to: "Juge d'instruction, tribunal judiciaire de Paris",
      slots: {
        criteres: CR.choiceSlot("Sur l'article 144", [
          { t: "Aucun des objectifs de l'article 144 n'exige plus la détention ; un contrôle judiciaire ou une assignation à résidence suffirait.", ok: true },
          { t: "La détention est injuste.", ok: false, defect: "criteres:vague" },
        ]),
      },
      checks: [{ id: "garanties", label: "Les garanties de représentation", heading: "À l'appui de la demande :", options: (P.garanties || []).map((g) => ({ id: g.id, t: g.t, ok: null, needs: g.needs })) }],
      body: [["En application de l'article 148 du code de procédure pénale, ", titre(api), " sollicite sa mise en liberté."], [{ s: "criteres" }]],
    };
  };
  H.filed_dml = (api, { res, depot }) => {
    const { s, cs } = api;
    if (!depot) return;
    const ctrl = CR.PROC.controle(api, "dml", { day: s.day });
    if (!ctrl.ok) {
      CR.erreur(s, cs, { id: "dml_" + s.day, texte: "Demande de mise en liberté déposée alors que la précédente n'était pas définitivement jugée.", sanction: "Irrecevabilité (loi du 23 juillet 2026).", regul: ctrl.regul });
      api.schedule(3, "_dmlIrrecevable");
      return;
    }
    cs.vars.dmlPendante = true;
    cs.vars.dmlGaranties = (res.picks.garanties || []).length;
    cs.vars.dmlOk = !res.defects.length;
    CR.PROC.event(api, "Demande de mise en liberté déposée au greffe du juge d'instruction.");
    api.schedule(R.int(s, 5, 8), "_dmlDecision");
  };
  H._dmlIrrecevable = (api) => {
    api.mail({ from: "Juge des libertés et de la détention", subject: "Ordonnance — demande de mise en liberté irrecevable", kind: "greffe", body: [["Disons irrecevable la demande de mise en liberté : il n'a pas encore été statué définitivement sur la demande précédente."]] });
  };
  H._dmlDecision = (api) => {
    const { s, cs } = api;
    if (CR.hookExists(cs, "dmlDecision")) return api.run("dmlDecision", {});
    const r = CR.ACT.jld(api, { garanties: cs.vars.dmlGaranties || 0, criteres: cs.vars.criteres144 != null ? cs.vars.criteres144 : 1, gravite: cs.vars.gravite || 0.6, argument144: cs.vars.dmlOk });
    cs.vars.dmlPendante = false;
    const libre = r.decision !== "dp";
    api.mail({ from: "Juge des libertés et de la détention", subject: libre ? "Ordonnance de mise en liberté sous contrôle judiciaire" : "Ordonnance de rejet de la demande de mise en liberté", kind: "greffe", important: true,
      body: [[libre ? `Ordonnons la mise en liberté de ${titre(api)} et son placement sous ${r.decision === "arse" ? "assignation à résidence avec surveillance électronique" : "contrôle judiciaire"}.` : "Rejetons la demande : la détention demeure l'unique moyen de garantir le maintien de la personne à la disposition de la justice et d'empêcher toute pression sur les témoins (art. 144)."]] });
    if (libre) { CR.PROC.detention(api, r.decision, {}); if (CR.hookExists(cs, "libere")) api.run("libere", { decision: r.decision }); }
  };

  // =================================================================== Déclaration d'appel
  TPL.appel = (api) => {
    const { s, cs } = api;
    return {
      title: "Déclaration d'appel", kind: "acte", time: 20, dirLabel: "Rédigée",
      depot: cs.vars.appelLieu || (api.def.tj && api.def.tj.lieu) || "palais", depotLabel: "Greffe de la juridiction qui a rendu la décision (art. 502)", depotTime: 15,
      slots: {
        decision: CR.autoSlot(cs.vars.jugementDay != null ? `le jugement rendu le ${CR.fmtDate(cs.vars.jugementDay, "long")}` : "la décision"),
        etendue: CR.choiceSlot("Étendue de l'appel (art. 509)", [
          { t: "Appel portant sur l'ensemble des dispositions pénales et civiles.", ok: true, v: "total" },
          { t: "Appel limité aux dispositions pénales.", ok: true, v: "penal" },
          { t: "Appel limité aux dispositions civiles.", ok: true, v: "civil" },
        ]),
      },
      body: [["Je soussigné, ", avocat(s), ", déclare interjeter appel, au nom de ", titre(api), ", de ", { s: "decision" }, "."], [{ s: "etendue" }]],
    };
  };
  H.filed_appel = (api, { res, depot }) => {
    const { s, cs } = api;
    if (!depot) return;
    const opt = CR.getTpl(s, cs, "appel").slots.etendue.options.find((o) => o.v === (res.filled && res.filled.etendue));
    const ctrl = CR.PROC.controle(api, "appel_corr", { day: s.day });
    cs.proc.appel = { day: s.day, etendue: opt ? opt.v : "total", recevable: ctrl.ok, motif: ctrl.motif };
    CR.PROC.event(api, `Déclaration d'appel au greffe (${opt ? opt.t.toLowerCase() : "appel total"}).`);
    if (CR.hookExists(cs, "apresAppel")) api.run("apresAppel", { ctrl, etendue: cs.proc.appel.etendue });
  };

  // =================================================================== Copie du dossier, permis de communiquer
  PEN.demanderCopie = (api) => {
    const { s, cs } = api;
    CR.spend(s, 10, "admin");
    cs.proc.copieDemandee = s.day;
    CR.PROC.event(api, "Copie du dossier demandée (art. 114).");
    api.at(CR.rollForward(s.day + R.int(s, 6, 15)), "_copieDelivree");
  };
  H._copieDelivree = (api) => {
    const { s, cs, def } = api;
    cs.proc.copieDelivree = s.day;
    const docs = (cfg(api).copie || []);
    // mode libre : la copie arrive par e-Partage (PLEX), à télécharger avant l'expiration du lien
    if (CR.EB && CR.libre && CR.libre(s)) { CR.EB.partager(s, cs, docs, def.docTitles || {}); if (CR.hookExists(cs, "copieDelivree")) api.run("copieDelivree", {}); return; }
    for (const k of docs) if (!CR.hasDoc(cs, k)) api.doc(k, (def.docTitles && def.docTitles[k]) || k);
    api.mail({ from: "Greffe du juge d'instruction", subject: "Copie du dossier de la procédure", kind: "greffe", pages: 10, body: [[`La copie du dossier est à votre disposition : ${CR.plural(docs.length, "pièce")} versée${docs.length > 1 ? "s" : ""} à votre dossier.`], ["Rappel : la reproduction des pièces est réservée à l'usage exclusif de la défense (art. 114)."]] });
    if (CR.hookExists(cs, "copieDelivree")) api.run("copieDelivree", {});
  };
  PEN.demanderPermis = (api) => {
    const { s, cs } = api;
    CR.spend(s, 10, "admin");
    cs.vars.permisDemande = s.day;
    api.schedule(R.int(s, 2, 5), "_permisDelivre");
  };
  H._permisDelivre = (api) => {
    const { cs } = api;
    cs.flags.permis = true;
    const x = api.s.detenus.find((d) => d.caseId === cs.id);
    if (x) x.permis = true;
    api.mail({ from: "Cabinet du juge d'instruction", subject: "Permis de communiquer", kind: "greffe", body: [[`Permis de communiquer délivré à ${avocat(api.s)} pour s'entretenir avec ${titre(api)}, détenu.`]] });
  };

  // =================================================================== Copie de la procédure devant le tribunal (def.penal.copieTC)
  PEN.copieTask = function (api, T, o = {}) {
    const { s, cs } = api;
    if (cs.vars.copieDemandee || (o.cond && !o.cond(api))) return;
    T({ id: "copie_tc", label: o.label || "Demander la copie de la procédure", sub: o.sub || "Au greffe. Personne ne vous l'enverra sans demande.", kind: "admin", time: 15, where: (api.def.tj && !api.def.tj.paris && api.def.tj.lieu) || o.where || "palais",
      run: () => { cs.vars.copieDemandee = s.day; CR.spend(s, 15, "admin"); api.schedule(o.delai != null ? o.delai : R.int(s, 3, 5), "_copieTC"); api.tl("Copie de la procédure demandée."); CR.toast(s, "Copie demandée : comptez quelques jours.", "info"); return null; } });
  };
  H._copieTC = (api) => {
    const C = cfg(api).copieTC || {};
    const docs = typeof C.docs === "function" ? C.docs(api) : C.docs || [];
    for (const k of docs) if (!CR.hasDoc(api.cs, k)) api.doc(k, (api.def.docTitles && api.def.docTitles[k]) || k);
    for (const c of C.cards || []) api.card(c);
    api.mail({ from: C.from || "Greffe correctionnel", subject: C.subject || `Copie de la procédure — ${CR.clientName(api.cs)}`, kind: "greffe", pages: docs.length + 2, body: [[C.texte || `La copie de la procédure est versée à votre dossier (${CR.plural(docs.length, "pièce")}).`]] });
    if (CR.hookExists(api.cs, "copieRecue")) api.run("copieRecue", {});
  };
  // Préparer son client (partie civile) à l'audience
  PEN.prepPC = function (api, T, label) {
    const { s, cs } = api;
    const a = cs.proc.audience;
    if (!a || a.day < s.day || cs.flags.prepClient) return;
    T({ id: "prep_pc", label: label || `Préparer ${CR.client(cs).prenom} à l'audience`, sub: "Le déroulé, ce que demandera le président, ce qu'il ne faut pas dire.", kind: "meet", time: 45, run: () => { CR.spend(s, 45, "meet"); cs.flags.prepClient = s.day; CR.updatedClient(s, cs, 1.5); api.tl("Client préparé à l'audience."); return null; } });
  };
  // Tâche d'entrée pour un rendez-vous au cabinet
  PEN.rdvTask = (label) => (api, T) => T({ id: "rdv", label: label || `Recevoir ${CR.clientName(api.cs)} au cabinet`, sub: "Premier rendez-vous : écouter, noter, poser les bonnes questions.", kind: "meet", time: 0, where: "cabinet", urgent: true, run: () => ({ scene: "call", call: "intake" }) });

  // =================================================================== Dossier de personnalité
  // items : [{ id, label, sub, time, fact, text, kind, cond(api) }]
  PEN.persoTasks = function (api, T, items) {
    const { s, cs } = api;
    for (const it of items || []) {
      if (it.cond && !it.cond(api)) continue;
      const done = CR.hasFact(cs, it.fact);
      T({ id: "perso_" + it.id, label: done ? `${it.label} (fait)` : it.label, sub: done ? it.text : it.sub, kind: it.kind || "call", time: it.time || 20, enabled: !done, run: () => {
        CR.spend(s, it.time || 20, it.kind === "meet" ? "meet" : "call");
        if (it.fail && it.fail(api)) { CR.toast(s, it.failText || "Personne ne répond.", "warn"); return null; }
        api.note(it.text, it.fact, "doc");
        CR.toast(s, "Pièce de personnalité ajoutée au carnet.", "good");
        return null;
      } });
    }
  };
  PEN.persoCount = (api, ids) => ids.filter((id) => CR.hasFact(api.cs, id)).length;

  // =================================================================== Tâches pénales communes
  PEN.tasks = function (api, T) {
    const { s, cs, def } = api;
    const p = cs.proc;
    const C = cfg(api);
    const no = new Set(C.no || []);
    if (!p) return;
    // défense devant le tribunal : nullités, préparation du client
    if (cs.camp === "defense" && p.audience && p.audience.day >= s.day && ["tc", "tp"].includes(p.audience.juridiction)) {
      if (!no.has("nullite") && cs.issues.length && !CR.drafted(cs, "conclusions_nullite")) T({ id: "nullite", label: "Rédiger des conclusions de nullité", sub: "À partir des irrégularités que vous avez relevées dans les pièces.", kind: "draft", time: 90, run: () => ({ scene: "draft", tpl: "conclusions_nullite" }) });
      if (!no.has("prep") && !cs.flags.prepClient) T({ id: "prep", label: "Préparer le client à l'audience", sub: "Une heure : le déroulé, les questions du président, le dernier mot.", kind: "meet", time: 60, run: () => { CR.spend(s, 60, "meet"); cs.flags.prepClient = s.day; CR.updatedClient(s, cs, 1.5); api.tl("Client préparé à l'audience."); return null; } });
    }
    // partie civile : constitution et chiffrage
    if (cs.camp === "pc" && p.audience && p.audience.day >= s.day && !no.has("constitution") && !CR.drafted(cs, "constitution_pc")) T({ id: "constitution", label: "Rédiger la constitution de partie civile et le chiffrage", sub: "Postes de préjudice, pièces justificatives, article 475-1.", kind: "draft", time: 90, run: () => ({ scene: "draft", tpl: "constitution_pc" }) });
    // instruction
    if (["information", "reglement"].includes(p.stade)) {
      if (!no.has("copie") && p.copieDemandee == null && (cs.camp === "pc" || p.mex != null)) T({ id: "copie", label: "Demander la copie du dossier", sub: "Article 114. Pour le mis en examen, la date compte pour le délai des nullités.", kind: "admin", time: 10, run: () => { if (CR.EB && CR.libre && CR.libre(s)) return { scene: "ebarreau", objet: "Demande de copie du dossier" }; PEN.demanderCopie(api); return null; } });
      if (!no.has("actes") && C.actes) T({ id: "actes", label: "Rédiger une demande d'actes", sub: "Article 82-1 : expertise, audition, confrontation, transport sur les lieux.", kind: "draft", time: 60, run: () => ({ scene: "draft", tpl: "demande_actes" }) });
      if (!no.has("requete") && cs.camp === "defense" && cs.issues.length) T({ id: "requete", label: "Rédiger une requête en nullité", sub: "Devant la chambre de l'instruction, par déclaration au greffe.", kind: "draft", time: 120, run: () => ({ scene: "draft", tpl: "requete_nullite" }) });
    }
    // détention
    if (p.detention && p.detention.statut === "dp") {
      if (!cs.flags.permis && !cs.vars.permisDemande) T({ id: "permis", label: "Demander un permis de communiquer", sub: "Au magistrat chargé du dossier ; il faut l'avoir pour aller au parloir.", kind: "admin", time: 10, run: () => { PEN.demanderPermis(api); return null; } });
      if (cs.flags.permis && !no.has("parloir")) {
        const et = p.detention.etab || "sante";
        T({ id: "parloir", label: "Rendre visite au client au parloir", sub: `${CR.PLACES[et].nom}. Réservation, contrôles, attente.`, kind: "meet", time: 0, where: et, run: () => ({ scene: "call", call: "parloir" }) });
      }
      if (!no.has("dml") && C.dml) T({ id: "dml", label: "Rédiger une demande de mise en liberté", sub: "Article 148, avec les garanties de représentation.", kind: "draft", time: 60, run: () => ({ scene: "draft", tpl: "dml" }) });
    }
    // consignation à verser
    if (cs.vars.consignation && !cs.vars.consignation.paid) T({ id: "consignation", label: "Verser la consignation", sub: `${CR.money(cs.vars.consignation.montant)} : fonds du client, par la CARPA.`, kind: "admin", time: 15, urgent: true, run: () => { PEN.verserConsignation(api); return null; } });
    // appel ouvert après un jugement (le délai n'est pas affiché : à vous de compter)
    if (cs.vars.jugementDay != null && !p.appel && !no.has("appel") && !cs.flags.pasAppel) T({ id: "appel", label: "Faire appel du jugement", sub: "Déclaration au greffe de la juridiction qui a statué. Comptez le délai vous-même.", kind: "draft", time: 20, run: () => ({ scene: "draft", tpl: "appel" }) });
  };
})();
