/* Affaire 12 — La bijouterie.
   Défense. Jordan, détenu depuis onze mois, mis en examen pour vol avec arme (un pistolet factice).
   Désignation de l'avocat (art. 115), permis de communiquer, parloir, débat de prolongation (art. 145-2),
   demande de mise en liberté, réunion préparatoire criminelle, cour criminelle départementale (art. 380-16).
   Dilemme : le client avoue au parloir et veut contester. Pièges : « un pistolet factice n'est pas une arme » (art. 132-75) ;
   faire citer un témoin qu'on sait mensonger (art. 434-15). */
(function () {
  const CR = window.CR;
  const R = CR.R;
  const PEN = CR.PEN;
  const JORDAN = { prenom: "Jordan", nom: "Leroy", g: "m", age: 29, metier: "livreur", tel: "", trust: 45, look: { skin: 1, hair: "buzz", hc: "brown", beard: 1 }, naissance: "le 7 novembre 1997 à Ivry-sur-Seine", adresse: "détenu à la maison d'arrêt de Fresnes" };
  const DEF = "a12_bijouterie";

  CR.defineCase({
    id: DEF, camp: "defense", domaine: "criminel", domaineLib: "pp_instruction",
    title: "Leroy — la bijouterie",
    arrive: { day: 86, min: 10 * 60 + 20 },
    client: JORDAN, caller: "Martine Leroy, sa mère", leadPatience: 4,
    voicemail: "Maître, Martine Leroy. Mon fils Jordan est en détention à Fresnes depuis onze mois, pour une bijouterie. Son avocat l'a laissé tomber. On m'a dit que vous étiez bien. Rappelez-moi, s'il vous plaît.",
    profile: { wealth: 3, sens: 0.6, urgency: 0.7, temper: "anxieux" },
    honoraires: { forfait: 5000, heures: 40, types: ["forfait"], resultat: "mise en liberté ou peine réduite", intro: "Martine a vendu sa voiture." },
    mission: "Défense de M. Jordan Leroy, détenu, dans l'information ouverte pour vol avec arme : détention provisoire, fin de l'information, réunion préparatoire et audience de la cour criminelle départementale, jusqu'à l'arrêt.",
    actors: { ji: "ji_ferraud", jld: "jld_cherkaoui", parquet: "pq_riboulet", president: "pr_ccd", adverse: "av_tessier" },
    proc: { stade: "information", nature: "crime", faits: -340, infractions: ["CP_311-8", "CP_132-75"], mex: -335, detention: "dp", detentionSince: -335, etab: "fresnes" },
    init(api, cs) {
      cs.vars.permisDemande = "designation";
      cs.vars.unAn = CR.addMonths(cs.proc.detention.since, 12);
    },
    vars: (s, cs) => ({ faitsDate: CR.fmtDate(cs.proc.faitsDay, "long") }),
    facts: {
      J_detenu: { label: "Détenu à Fresnes depuis onze mois", key: true, why: "En matière criminelle, la détention initiale est d'un an ; au-delà, le JLD doit la prolonger après un débat (art. 145-2)." },
      J_parti: { label: "Son premier avocat s'est déchargé du dossier", key: true, why: "Le nouvel avocat doit être désigné par la personne mise en examen (art. 115) avant d'obtenir le permis de communiquer et la copie." },
      J_factice: { label: "« Le pistolet était faux »", key: true, why: "Un objet ressemblant à une arme, utilisé pour menacer, est assimilé à une arme (art. 132-75) : le vol reste un vol avec arme." },
      J_heberg: { label: "Il peut vivre chez sa mère, à Ivry-sur-Seine", key: true },
      J_fille: { label: "Une fille de quatre ans" },
      J_travail: { label: "Livreur à vélo avant son incarcération" },
      J_casier: { label: "Une condamnation pour recel, il y a six ans" },
      J_aveu_prive: { label: "Au parloir, Jordan reconnaît les faits", why: "Le secret professionnel couvre cet aveu. L'avocat peut plaider l'insuffisance des preuves si le client conteste, mais ne doit ni mentir ni produire un témoignage qu'il sait faux (art. 434-15 CP)." },
    },
    calls: {
      intake: {
        opening: ["Maître, Martine Leroy. Merci de rappeler. Jordan est à Fresnes depuis le mois de février. Il dit qu'il n'a rien fait."],
        topics: [
          { id: "l_quoi", q: "De quoi l'accuse-t-on ?", a: ["Le braquage d'une bijouterie, rue de Rivoli. Ils disent qu'il avait un pistolet.", { t: "Mais le pistolet était faux ! Un jouet. Ça ne compte pas, non ?", f: "J_factice" }], cost: 4, unlock: ["l_detention"] },
          { id: "l_detention", q: "Depuis quand est-il détenu ?", a: [{ t: "Onze mois. À Fresnes. Je vais le voir le samedi.", f: "J_detenu" }], cost: 2, tag: "good" },
          { id: "l_avocat", q: "Et son avocat ?", a: [{ t: "Il nous a écrit qu'il se déchargeait du dossier. Jordan n'a plus personne.", f: "J_parti" }], cost: 2, tag: "good" },
          { id: "l_maison", q: "S'il sortait, où vivrait-il ?", a: [{ t: "Chez moi, à Ivry. J'ai une chambre pour lui.", f: "J_heberg" }, { t: "Il a une petite fille de quatre ans. Il la voyait tous les week-ends.", f: "J_fille" }], cost: 3, tag: "good" },
          { id: "l_travail", q: "Que faisait-il avant ?", a: [{ t: "Livreur à vélo, pour une plateforme.", f: "J_travail" }, { t: "Il a été condamné une fois, pour recel, il y a six ans.", f: "J_casier" }], cost: 2 },
        ],
        start: ["l_quoi", "l_avocat", "l_maison", "l_travail"],
        patience: 90, close: "Vous irez le voir ?",
      },
      parloir: (api) => ({
        scene: "parloir", kind: "meet", label: "Parloir avocat · Fresnes", baseCost: 45,
        opening: ["Jordan s'assoit, les avant-bras sur la table. « Ma mère m'a dit que vous viendriez. L'autre, je l'ai vu deux fois en onze mois. »"],
        topics: [
          { id: "j_dossier", q: "Je vous explique ce qu'il y a dans le dossier : la reconnaissance, l'ADN sur le pistolet, votre téléphone.", a: ["Il écoute sans bouger.", "L'ADN, c'est parce que j'ai touché ce pistolet chez Kevin, une semaine avant. C'était un jouet de son petit frère."], cost: 10, tag: "good", fx: { trust: 5, flags: { versionKevin: true } }, unlock: ["j_verite"] },
          { id: "j_verite", q: "Jordan, ce que vous me dites reste entre nous. Que s'est-il vraiment passé ?", a: ["Un long silence.", { t: "C'était moi. J'avais des dettes. Mais je veux dire que je n'y étais pas. Kevin dira que le pistolet était chez lui.", f: "J_aveu_prive" }], cost: 6, unlock: ["j_respect", "j_kevin", "j_reconnaitre"] },
          { id: "j_respect", q: "C'est votre défense et votre choix. Mais je ne ferai venir aucun faux témoin et je ne dirai rien de faux : je plaiderai seulement ce que l'accusation ne prouve pas.", a: ["« Ça me va. »"], cost: 4, tag: "good", fx: { flags: { deontoOk: true } } },
          { id: "j_kevin", q: "D'accord. Je ferai citer Kevin pour dire que le pistolet était chez lui.", a: ["« Merci, maître. Kevin est prêt. »"], cost: 2, tag: "bad", fx: { flags: { fauxTemoinPromis: true } } },
          { id: "j_reconnaitre", q: "Je vous conseille de reconnaître : la cour en tiendra compte dans la peine. Réfléchissez-y.", a: ["« Je vais y réfléchir. Je ne veux pas prendre quinze ans. »"], cost: 5, tag: "good", fx: { flags: { conseilReconnaitre: true }, trust: 2 } },
          { id: "j_cond", q: "Comment se passe la détention ?", a: ["Cellule à trois. Je travaille aux ateliers depuis deux mois, je gagne un peu."], cost: 4, tag: "good", fx: { trust: 3 } },
          { id: "j_promesse", q: "Je vous sortirai d'ici avant l'été.", a: ["« Vous êtes sûr ? »"], cost: 1, tag: "bad", fx: { flags: { promesse: true } } },
        ],
        start: ["j_dossier", "j_cond", "j_promesse"],
        patience: 100, advice: false, close: "« Revenez, maître. »",
        onEnd: (a) => { const x = a.s.detenus.find((d) => d.caseId === a.cs.id); if (x) x.humeur = CR.clamp(x.humeur + 12, 0, 100); a.cs.vars.parloirs = (a.cs.vars.parloirs || 0) + 1; },
      }),
    },
    advice: [
      { id: "l_lettre", t: "Je vais écrire à Jordan pour qu'il me désigne auprès du juge : sans désignation, je ne peux ni le voir ni lire le dossier." },
      { id: "l_pieces", t: "Préparez une attestation d'hébergement et une copie de votre bail." },
      { id: "l_jouet", t: "Avec un faux pistolet, ce n'est qu'un vol simple." },
      { id: "l_sortie", t: "Il sera dehors dans un mois." },
    ],
    docs: {
      pv_vol: (x) => ({ title: "Procès-verbal de plainte et de constatations", kind: "pv", entete: ["Brigade de répression du banditisme · Cote D1"], paras: [
        [{ t: `Le ${CR.fmtDate(x.cs.proc.faitsDay, "long")} à 10 h 40, bijouterie Maison Roussel, rue de Rivoli (4e) : un homme casqué menace la gérante avec un pistolet et emporte des bagues pour 48 000 euros.`, f: "J_faits" }],
        ["Aucun coup, aucun blessé. L'homme s'enfuit à pied vers la rue du Renard."],
      ] }),
      reco: () => ({ title: "Procès-verbal de présentation sur planche photographique", kind: "pv", entete: ["Cote D17"], paras: [[{ t: "Sur une planche de six photographies, Mme Roussel désigne le n° 4, M. Jordan Leroy : « Je dirais lui, à soixante-dix pour cent. Il avait un casque. »", f: "J_reco" }]] }),
      adn: () => ({ title: "Rapport d'expertise génétique", kind: "pv", entete: ["Laboratoire de police scientifique · Cote D24"], paras: [[{ t: "Profil génétique de M. Jordan Leroy isolé sur la crosse du pistolet retrouvé dans une poubelle de la rue du Renard, à 300 mètres. Profil unique, en quantité importante.", f: "J_adn" }]] }),
      arme: () => ({ title: "Examen de l'objet saisi", kind: "pv", entete: ["Cote D25"], paras: [[{ t: "Réplique d'arme de poing, type airsoft, de couleur noire, sans bouchon orange : indiscernable d'une arme réelle à quelques mètres.", f: "J_replique" }]] }),
      tel: () => ({ title: "Rapport de téléphonie", kind: "pv", entete: ["Cote D31"], paras: [[{ t: "Le téléphone de M. Leroy déclenche à 10 h 32 la borne de Châtelet-Les Halles, qui couvre la rue de Rivoli. Il est éteint de 10 h 35 à 11 h 20.", f: "J_borne" }]] }),
      pv_jordan: () => ({ title: "Interrogatoire de première comparution (extrait)", kind: "pv", entete: ["Cabinet de Mme Ferraud · Cote D40"], paras: [[{ t: "« Je n'y étais pas. Le pistolet, je l'ai tenu chez un ami. »", f: "J_version" }]] }),
      ordo_prolong: (x) => ({ title: x.cs.vars.prolongDecision === "dp" ? "Ordonnance de prolongation de la détention provisoire" : "Ordonnance de mise en liberté sous contrôle judiciaire", kind: "greffe", entete: ["Juge des libertés et de la détention"], paras: [[x.cs.vars.prolongDecision === "dp" ? "Prolongeons la détention provisoire de M. Jordan Leroy pour une durée de six mois (art. 145-2)." : `Ordonnons la mise en liberté de M. Jordan Leroy, placé sous ${x.cs.vars.prolongDecision === "arse" ? "assignation à résidence avec surveillance électronique" : "contrôle judiciaire"} chez sa mère à Ivry-sur-Seine.`]] }),
      oma: (x) => ({ title: "Ordonnance de mise en accusation", kind: "greffe", entete: ["Cabinet de Mme Ferraud, juge d'instruction"], paras: [["Ordonnons la mise en accusation de M. Jordan Leroy devant la cour criminelle départementale de Paris du chef de vol avec arme (art. 311-8 et 132-75 du code pénal)."], [x.cs.proc.detention.statut === "dp" ? "Disons que la détention provisoire se poursuivra jusqu'à la comparution devant la cour (art. 181)." : "Disons que le contrôle judiciaire de l'accusé est maintenu jusqu'à sa comparution devant la cour (art. 181)."]] }),
    },
    docTitles: { pv_vol: "Plainte et constatations (D1)", reco: "Planche photographique (D17)", adn: "Expertise génétique (D24)", arme: "L'objet saisi (D25)", tel: "Téléphonie (D31)", pv_jordan: "Première comparution (D40)", ordo_prolong: "Ordonnance du JLD (art. 145-2)", oma: "Ordonnance de mise en accusation" },
    penal: {
      no: ["nullite", "requete", "copie", "dml", "actes", "prep"],
      copie: ["pv_vol", "reco", "adn", "arme", "tel", "pv_jordan"],
      dml: { garanties: [
        { id: "heberg", t: "Attestation d'hébergement de Mme Martine Leroy à Ivry-sur-Seine, avec bail.", needs: ["J_attest", "J_heberg"] },
        { id: "travail", t: "Promesse d'embauche d'une entreprise de logistique d'Ivry.", needs: "J_promesse" },
        { id: "fille", t: "Il est père d'une enfant de quatre ans.", needs: "J_fille" },
        { id: "duree", t: "Onze mois de détention pour un vol sans violence physique : la détention excède désormais une durée raisonnable.", needs: "J_detenu" },
      ] },
    },
    flow: { tasks: PEN.tasks },
    tasks(api, T) {
      const { s, cs } = api;
      const p = cs.proc;
      if (!cs.flags.designe && !cs.vars.lettreDesignation) T({ id: "designation", label: "Écrire à Jordan pour qu'il vous désigne (art. 115)", sub: "Une déclaration au greffe de Fresnes, transmise au juge.", kind: "admin", time: 15, urgent: true, run: () => { CR.spend(s, 15, "desk"); cs.vars.lettreDesignation = s.day; api.schedule(R.int(s, 4, 7), "_designe"); api.tl("Lettre à Jordan avec un modèle de déclaration de désignation."); return null; } });
      if (cs.flags.designe && p.copieDemandee == null) T({ id: "copie", label: "Demander la copie du dossier", sub: "Article 114.", kind: "admin", time: 10, run: () => { PEN.demanderCopie(api); return null; } });
      if (cs.flags.designe && p.detention.statut === "dp" && ["information", "reglement", "jugement"].includes(p.stade)) T({ id: "dml", label: "Rédiger une demande de mise en liberté", sub: "Article 148, avec les garanties de représentation.", kind: "draft", time: 60, run: () => ({ scene: "draft", tpl: "dml" }) });
      PEN.persoTasks(api, T, [
        { id: "attest", label: "Obtenir l'attestation d'hébergement de Mme Leroy", sub: "Avec le bail et sa pièce d'identité.", fact: "J_attest", text: "Attestation d'hébergement de Mme Martine Leroy, avenue Danielle-Casanova à Ivry-sur-Seine, bail et pièce d'identité joints.", time: 15, cond: () => CR.hasFact(cs, "J_heberg") },
        { id: "promesse", label: "Chercher une promesse d'embauche", sub: "Une entreprise de logistique d'Ivry, contactée par Mme Leroy.", fact: "J_promesse", text: "Promesse d'embauche d'Ivry Logistique, préparateur de commandes, dès sa libération.", time: 30, cond: () => cs.engaged != null },
      ]);
      const libre = p.detention.statut !== "dp";
      if (p.audience && p.audience.day >= s.day && (cs.flags.permis || libre) && !cs.flags.prepClient) T({ id: "prep", label: libre ? "Préparer Jordan au procès" : "Préparer Jordan au procès (au parloir)", sub: "Ce que la cour demandera, la question de la reconnaissance.", kind: "meet", time: 0, where: libre ? "cabinet" : "fresnes", run: () => { CR.spend(s, 90, "meet"); cs.flags.prepClient = s.day; CR.updatedClient(s, cs, 1.5); api.tl("Jordan préparé au procès."); return null; } });
    },
    on: {
      engaged(api) {
        const { s, cs } = api;
        if (cs.vars.engagedOnce) return;
        cs.vars.engagedOnce = true;
        const d = CR.rollForward(cs.vars.unAn - 4);
        cs.vars.prolongDay = d;
        api.hearing({ day: d, min: 14 * 60 + 30, title: "Débat de prolongation de la détention (art. 145-2)", where: "Juge des libertés et de la détention, tribunal judiciaire", lieu: "palais", script: "prolong", done: "apresProlong", onMiss: "_prolongSansVous", duree: 45 });
        api.mail({ from: "Cabinet de Mme Ferraud, juge d'instruction", subject: "Débat sur la prolongation de la détention", kind: "greffe", body: [[`La détention de M. Leroy atteindra un an le ${CR.fmtDate(cs.vars.unAn, "long")}. Le juge des libertés et de la détention est saisi aux fins de prolongation ; débat le ${CR.fmtDate(d, "dow")} à 14 h 30.`]] });
        api.schedule(48, "_finInfo");
      },
      _designe(api) {
        const { s, cs } = api;
        cs.flags.designe = s.day;
        cs.vars.permisDemande = null;
        CR.PROC.event(api, "Désignation de l'avocat par la personne détenue (art. 115).");
        api.mail({ from: "Cabinet de Mme Ferraud, juge d'instruction", subject: "Désignation enregistrée", kind: "greffe", body: [["La déclaration de M. Leroy vous désignant a été transmise par le greffe de la maison d'arrêt (art. 115). Vous pouvez demander un permis de communiquer et la copie du dossier."]] });
      },
      _prolongSansVous(api) {
        const { s, cs } = api;
        cs.vars.prolongDecision = "dp";
        api.doc("ordo_prolong", "Ordonnance du JLD (art. 145-2)");
        api.trust(-20);
      },
      prolongDecider(api, { st }) {
        const { s, cs } = api;
        const pl = st.played;
        const g = ["J_attest", "J_promesse"].filter((f) => CR.hasFact(cs, f)).length * 1.2 + ["J_heberg", "J_fille"].filter((f) => pl.has(f) || CR.hasFact(cs, f)).length * 0.4 + (pl.has("arg:duree") ? 0.8 : 0);
        const r = CR.ACT.jld(api, { garanties: g, criteres: 2, gravite: 0.8, argument144: pl.has("arg:144") });
        cs.vars.prolongDecision = r.decision;
        api.doc("ordo_prolong", "Ordonnance du JLD (art. 145-2)");
        if (r.decision === "dp") return [{ who: "jld", t: "Je prolonge la détention pour six mois : le risque de pression sur la victime et de réitération demeure, et l'information touche à sa fin (art. 144 et 145-2)." }];
        CR.PROC.detention(api, r.decision, {});
        api.run("libere", {});
        return [{ who: "jld", t: `Je ne prolonge pas. M. Leroy sera placé sous ${r.decision === "arse" ? "assignation à résidence avec surveillance électronique" : "contrôle judiciaire"} chez sa mère, avec interdiction de paraître dans le 4e arrondissement et de contacter Mme Roussel.` }, { who: "sys", t: "(Jordan ferme les yeux. Derrière la vitre du box, il ne dit rien.)" }];
      },
      apresProlong(api) { CR.updatedClient(api.s, api.cs, 1); },
      libere(api) { api.mail({ from: "Martine Leroy", subject: "Il est rentré", kind: "sms", body: [["Jordan est à la maison. Il a dormi quatorze heures. Merci, maître."]] }); },
      _finInfo(api) {
        const { s, cs } = api;
        if (cs.vars.finInfo) return;
        cs.vars.finInfo = s.day;
        CR.PROC.stade(api, "reglement", "Avis de fin d'information (art. 175).");
        api.mail({ from: "Cabinet de Mme Ferraud, juge d'instruction", subject: "Avis de fin d'information (art. 175)", kind: "greffe", body: [["L'information me paraît terminée. Les parties disposent des délais de l'article 175 pour présenter leurs observations et demandes."]] });
        api.schedule(R.int(s, 22, 28), "_oma");
      },
      _oma(api) {
        const { s, cs } = api;
        api.mail({ from: "Cabinet de Mme Ferraud, juge d'instruction", subject: "Ordonnance de mise en accusation", kind: "greffe", important: true, doc: "oma", title: "Ordonnance de mise en accusation" });
        CR.PROC.stade(api, "jugement", "Mise en accusation devant la cour criminelle départementale de Paris (art. 380-16).");
        const r = CR.rollForward(s.day + 21);
        cs.vars.reunionDay = r;
        api.hearing({ day: r, min: 10 * 60, title: "Réunion préparatoire criminelle", where: "Cour criminelle départementale, Île de la Cité", lieu: "cite", script: "reunion", done: "apresReunion", onMiss: "_reunionSansVous", duree: 40 });
        let day = CR.rollForward(s.day + 60);
        while (CR.dow(day) !== 1 || !CR.isBusinessDay(day)) day++;
        CR.PROC.fixAudience(api, { day, min: 9 * 60 + 30, juridiction: "ccd", mode: "oma", convocDay: s.day, president: "pr_ccd", script: "ccd", done: "apresCCD", onMiss: "_absent", title: "Cour criminelle départementale — procès de M. Leroy", duree: 360 });
        cs.actors.parquet = "pq_ag";
      },
      _reunionSansVous(api) {
        const { s, cs } = api;
        cs.vars.liste = ["enqueteur", "victime"];
        CR.erreur(s, cs, { id: "reunion_absent", texte: "Vous n'étiez pas à la réunion préparatoire criminelle.", sanction: "La liste des témoins et experts a été arrêtée sans la défense ; elle ne changera plus qu'exceptionnellement.", regul: "Aucune." });
      },
      apresReunion(api) {
        const { s, cs } = api;
        const l = [];
        for (const k of ["victime", "expert_adn", "kevin", "enqueteur"]) if (cs.flags["liste_" + k]) l.push(k);
        if (!l.includes("enqueteur")) l.push("enqueteur");
        cs.vars.liste = l;
        if (l.includes("kevin") && CR.hasFact(cs, "J_aveu_prive")) {
          CR.erreur(s, cs, { id: "faux_temoin", texte: "Vous avez fait citer Kevin en sachant, par l'aveu de Jordan, que son témoignage serait faux.", sanction: "Manquement à la probité ; le délit de subornation de témoin n'est pas loin (art. 434-15 CP).", regul: "Aucune : on ne produit jamais un témoignage qu'on sait mensonger." });
          api.disc("probite", 7, "Le parquet général signale qu'un avocat aurait fait citer un témoin dont il connaissait le caractère mensonger.");
        }
        api.tl(`Liste des témoins et experts arrêtée : ${l.join(", ")}.`);
      },
      _absent(api) {
        const { s, cs } = api;
        CR.erreur(s, cs, { id: "absent", texte: "Vous n'étiez pas au procès.", sanction: "Un avocat commis d'office a plaidé sans connaître le dossier.", regul: "Appel devant la cour d'assises d'appel." });
        CR.closeCase(s, cs, { type: "condamnation", detail: "procès sans votre défense" });
      },
      decider(api, { st }) {
        const { s, cs } = api;
        const pl = st.played;
        const aveu = !!cs.flags.aveuAudience;
        const l = cs.vars.liste || [];
        const pieces = {
          adn: { label: "L'ADN de Jordan sur la crosse, en quantité importante", sens: "charge", force: 0.36 },
          reco: { label: "La reconnaissance « à soixante-dix pour cent », sous un casque", sens: "charge", force: pl.has("arg:reco") ? 0.05 : 0.14 },
          tel: { label: "Le téléphone à Châtelet, éteint pendant les faits", sens: "charge", force: 0.12 },
        };
        if (aveu) pieces.aveu = { label: "Les aveux de Jordan à l'audience", sens: "charge", force: 0.6 };
        if (!aveu && l.includes("kevin")) pieces.kevin = { label: "Le témoignage de Kevin, démenti à l'audience", sens: "charge", force: 0.06 };
        if (!aveu && l.includes("expert_adn") && pl.has("arg:transfert")) pieces.transfert = { label: "L'expert admet un transfert d'ADN possible", sens: "decharge", force: 0.08 };
        const perso = ["J_attest", "J_promesse", "J_fille", "J_travail"].filter((f) => CR.hasFact(cs, f) || pl.has(f)).length * 0.6 + (aveu ? 2 : 0) + (st.dernierMot === "regrets" ? 1 : 0);
        const dec = PEN.juger(api, {
          st, juridiction: "ccd", titre: "Arrêt de la cour criminelle départementale", prevenuNom: "Jordan Leroy",
          spec: { seuil: 0.42, pieces },
          qualif: () => ({ id: "311-8", label: "vol avec arme", court: "art. 311-8 et 132-75 CP", encourue: { prison: 240, amende: 150000 }, requis: cs.vars.requis, motif: "La réplique, indiscernable d'une arme réelle et utilisée pour menacer la gérante, est assimilée à une arme (art. 132-75)." }),
          personnalite: Math.round(perso),
          detenu: cs.proc.detention.statut === "dp",
        });
        if (pl.has("arg:jouet")) dec.questions.push({ q: "Sur l'argument du « jouet »", r: "La cour l'écarte.", motif: "Un objet présentant avec une arme une ressemblance de nature à créer une confusion, utilisé pour menacer, est assimilé à une arme (art. 132-75)." });
        return dec;
      },
      apresCCD(api, res) {
        const { s, cs } = api;
        const dec = res.decision || {};
        const pn = dec.peine;
        if (!dec.coupable) {
          if (cs.proc.detention.statut === "dp") CR.PROC.detention(api, "libre", {});
          CR.closeCase(s, cs, { type: "acquittement" });
          return;
        }
        if (pn && pn.ferme > 0 && (pn.mandatDepot || cs.proc.detention.statut === "dp")) CR.condamneDetenu(s, cs, pn.ferme, "fresnes", cs.proc.detention.statut === "dp" ? cs.proc.detention.since : s.day);
        CR.closeCase(s, cs, PEN.issue(api, dec));
      },
    },
    audiences: {
      prolong(api) {
        const { cs } = api;
        return {
          title: "Juge des libertés et de la détention", sub: "Débat de prolongation · tribunal judiciaire", decor: { scene: "cabinet_ji", judge: CR.px.acteurLook(CR.acteur("jld_cherkaoui")) },
          steps: [
            { who: "sys", t: "(Jordan arrive de Fresnes, menotté, escorté de deux surveillants. Il s'assoit à côté de vous.)" },
            { who: "jld", t: "Le juge d'instruction me saisit aux fins de prolongation de la détention provisoire de M. Leroy, qui atteint un an. Monsieur le procureur ?" },
            { who: "parquet", t: "Je requiers la prolongation : la gravité des faits, le risque de pression sur la gérante, un antécédent de recel." },
            { who: "jld", t: "Maître ?" },
            { plaidoirie: { role: "jld", max: 3, args: [
              { id: "garanties", label: "Un hébergement chez sa mère et un emploi qui l'attend", say: "Sa mère l'héberge à Ivry, attestation et bail à l'appui ; une entreprise de logistique l'embauche dès sa sortie.", cards: ["J_attest", "J_promesse", "J_heberg"] },
              { id: "duree", label: "Onze mois pour un vol sans violence : la durée n'est plus raisonnable", say: "Onze mois de détention, aucun blessé, une information qui se termine : la détention n'est plus nécessaire, et sa durée cesse d'être raisonnable.", cards: ["J_detenu", "CPP_145-2"] },
              { id: "144", label: "Une ARSE répond aux objectifs de l'article 144", say: "Un bracelet, une interdiction de paraître dans le 4e et de contacter Mme Roussel : chaque objectif de l'article 144 est atteint.", cards: ["CPP_144"] },
              { id: "fille", label: "Une fille de quatre ans", say: "Il a une fille de quatre ans, qu'il ne voit plus qu'au parloir.", cards: ["J_fille"] },
              { id: "jouet", label: "Le pistolet était un jouet", say: "Le pistolet n'était qu'un jouet.", pertinent: () => false },
            ] } },
            { do: (a, st) => a.run("prolongDecider", { st }) },
          ],
        };
      },
      reunion(api) {
        const { cs } = api;
        return {
          title: "Réunion préparatoire criminelle", sub: "Cour criminelle départementale · cabinet du président", decor: { scene: "cabinet_ji", judge: CR.px.acteurLook(CR.acteur("pr_ccd")) },
          steps: [
            { who: "president", t: "Maîtres, monsieur l'avocat général : nous arrêtons ensemble la liste des témoins et des experts, et la durée de l'audience. Ce que nous fixons aujourd'hui ne changera plus qu'exceptionnellement." },
            { who: "parquet", t: "Le ministère public fera entendre l'enquêteur de la brigade de répression du banditisme." },
            { who: "president", t: "Maître, pour la défense ?" },
            { questions: { prompt: "Questions de liste : témoins et experts que la défense fait citer", who: "president", max: 3, options: [
              { id: "l_victime", t: "Mme Roussel, la gérante, pour l'interroger sur la reconnaissance.", a: "Retenu.", fx: { csFlags: { liste_victime: true } } },
              { id: "l_adn", t: "L'expert en génétique, sur la possibilité d'un transfert d'ADN.", a: "Retenu.", fx: { csFlags: { liste_expert_adn: true } } },
              { id: "l_kevin", t: "M. Kevin Mendy, qui dira que le pistolet était chez lui la semaine précédente.", a: "Retenu.", fx: { csFlags: { liste_kevin: true } } },
              { id: "l_mere", t: "Mme Martine Leroy, témoin de personnalité.", a: "Retenu.", fx: { csFlags: { liste_mere: true } } },
            ] } },
            { who: "president", t: "La liste est arrêtée. L'audience est prévue sur une journée." },
          ],
        };
      },
      ccd(api) {
        const { cs } = api;
        const l = cs.vars.liste || ["enqueteur"];
        const steps = [
          { who: "huissier", t: "La cour !" },
          { who: "sys", t: cs.proc.detention.statut === "dp" ? "(Cinq magistrats professionnels, aucun juré. Jordan est dans le box vitré.)" : "(Cinq magistrats professionnels, aucun juré. Jordan, libre sous contrôle judiciaire, est assis devant vous.)" },
          { who: "president", t: "Monsieur Leroy, levez-vous. Vous êtes accusé de vol avec arme. Vous avez le droit de faire des déclarations, de répondre aux questions ou de vous taire." },
          { if: () => !!cs.flags.conseilReconnaitre && !!cs.flags.prepClient && cs.trust >= 35, then: [{ who: "client", t: "Je veux dire quelque chose. C'était moi. J'avais des dettes. Je demande pardon à Mme Roussel.", fx: { csFlags: { aveuAudience: true } } }, { who: "sys", t: "(Un silence. La gérante, au premier rang, porte la main à sa bouche.)" }], else: [{ who: "client", t: "Je n'y étais pas." }] },
          { who: "temoin", name: "Le commandant Viallet, enquêteur", t: "L'ADN sur la crosse, la téléphonie, la reconnaissance : trois éléments concordants." },
        ];
        if (l.includes("victime")) steps.push({ who: "temoin", name: "Mme Roussel", t: "Il avait un casque. Je me souviens de ses yeux. C'est lui, je crois." }, { questions: { prompt: "Questions à Mme Roussel", who: "temoin", name: "Mme Roussel", max: 1, options: [
          { id: "q_casque", t: "Madame, avec un casque intégral, qu'avez-vous vu de son visage ?", a: "Les yeux. Juste les yeux. Je… je ne suis pas certaine.", f: "J_reco_doute", signal: "bon" },
        ] } });
        if (l.includes("expert_adn")) steps.push({ who: "temoin", name: "L'expert en génétique", t: "La quantité d'ADN est importante. Un transfert secondaire n'est pas exclu, mais il est peu probable pour une telle quantité." });
        if (l.includes("kevin") && !cs.flags.aveuAudience) steps.push({ who: "temoin", name: "Kevin Mendy", t: "Le pistolet était chez moi. Jordan l'a tenu, la semaine d'avant. C'était celui de mon petit frère." }, { who: "parquet", t: "Monsieur Mendy, votre frère a déclaré aux enquêteurs avoir acheté sa réplique en avril, deux mois après les faits. Vous maintenez ?" }, { who: "temoin", name: "Kevin Mendy", t: "Je… je ne sais plus. Peut-être que je me trompe de pistolet." }, { who: "sys", t: "(Le président note quelque chose, longuement. Jordan regarde ses chaussures.)" });
        if (l.includes("mere")) steps.push({ who: "temoin", name: "Martine Leroy", t: "Jordan a toujours travaillé. Il a fait une bêtise avec des gens qui lui prêtaient de l'argent. Sa fille le réclame." });
        steps.push(
          { who: "president", t: "La parole est à la partie civile." },
          { who: "adverse", t: "Mme Roussel ne dort plus. Elle a fermé la boutique trois mois. Elle demande réparation." },
          CR.AUD.requisitions(cs.flags.aveuAudience ? { ferme: 60 } : { ferme: 84 }, { avant: ["Un braquage en plein jour, une arme pointée sur une femme seule."] }),
          { who: "president", t: "La parole est à la défense. L'accusé aura la parole en dernier." },
          { plaidoirie: { role: "defense", max: 4, args: [
            { id: "reco", label: "Une reconnaissance « à soixante-dix pour cent », sous un casque", say: "Soixante-dix pour cent, sous un casque intégral : ce n'est pas une reconnaissance, c'est une impression.", cards: ["J_reco", "J_reco_doute"], pertinent: () => !cs.flags.aveuAudience },
            { id: "transfert", label: "L'ADN a pu être déposé avant les faits", say: "L'expert l'a dit : un transfert n'est pas exclu. L'ADN prouve qu'il a tenu ce pistolet, pas quand.", cards: ["J_adn", "J_version"], pertinent: () => !cs.flags.aveuAudience },
            { id: "aveu", label: "Il a reconnu, devant vous et devant elle", say: "Jordan a fait aujourd'hui ce qui coûte le plus : il a dit la vérité, devant la femme qu'il a menacée.", pertinent: () => !!cs.flags.aveuAudience },
            { id: "personne", label: "Aucune violence, une fille, un emploi qui l'attend", say: "Pas un coup, pas un blessé. Une fille de quatre ans, une mère qui l'héberge, un employeur qui l'attend.", cards: ["J_fille", "J_attest", "J_promesse", "J_travail"] },
            { id: "detention", label: "Treize mois déjà passés à Fresnes", say: "Il a déjà passé plus d'un an à Fresnes : la détention provisoire s'impute sur la peine.", cards: ["J_detenu"] },
            { id: "jouet", label: "Un pistolet factice n'est pas une arme", say: "Ce pistolet était un jouet : il n'y a pas de vol avec arme.", pertinent: () => false },
          ] } },
          { dernierMot: { prepare: [{ id: "regrets", label: "Demander pardon à Mme Roussel", t: "Je demande pardon à Mme Roussel." }, { id: "rien", label: "Rien de plus", t: "Je n'ai rien à ajouter." }], spontane: { id: "spontane", t: "Je… je veux rentrer voir ma fille." } } },
          { delibere: { texte: "La cour se retire pour délibérer. Trois heures plus tard : « La cour ! »" } },
        );
        return { title: "Cour criminelle départementale de Paris", sub: "Île de la Cité · M. Ndiaye", decor: { scene: "assises", box: cs.proc.detention.statut === "dp" }, steps };
      },
    },
    debrief(api, o) {
      const { cs } = api;
      const items = [{ kind: "rule", text: "Vol avec arme : vingt ans (art. 311-8) ; une réplique de nature à créer une confusion, utilisée pour menacer, est assimilée à une arme (art. 132-75). Crime puni de vingt ans commis par un majeur : cour criminelle départementale, sans jury (art. 380-16)." }];
      if (!cs.flags.designe) items.push({ kind: "bad", text: "Jordan ne vous a jamais désigné : sans désignation (art. 115), ni permis de communiquer ni copie du dossier." });
      if (!cs.vars.parloirs) items.push({ kind: "bad", text: "Vous n'êtes jamais allé voir Jordan au parloir." });
      if (cs.vars.prolongDecision) items.push({ kind: "info", text: `Débat de prolongation : ${{ dp: "détention prolongée de six mois", cj: "mise en liberté sous contrôle judiciaire", arse: "assignation à résidence sous surveillance électronique" }[cs.vars.prolongDecision]}.` });
      if (cs.flags.deontoOk) items.push({ kind: "good", text: "Face à l'aveu de Jordan, vous avez accepté de plaider l'insuffisance des preuves sans rien affirmer de faux ni produire de faux témoin." });
      if (cs.flags.fauxTemoinPromis) items.push({ kind: "bad", text: "Vous avez promis de faire citer Kevin alors que vous saviez son témoignage faux : l'avocat ne prête jamais son concours à un mensonge (art. 434-15 CP)." });
      if (cs.advice.includes("l_jouet")) items.push({ kind: "bad", text: "Vous avez dit qu'un faux pistolet ferait un vol simple : c'est faux (art. 132-75)." });
      return items.concat(cs.vars.debriefJugement || []);
    },
    epilogue(api, o) {
      if (o.type === "acquittement") return "Acquitté. Jordan est sorti de Fresnes le soir même ; le parquet a fait appel. Il attend la cour d'assises d'appel, chez sa mère.";
      const p = api.cs.vars.peine;
      return `${p ? p.texte : "Condamné"}. Jordan travaille aux ateliers de Fresnes ; sa fille vient le voir un samedi sur deux.`;
    },
    fiche(api, o) {
      return {
        phrase: "Braquage d'une bijouterie avec une réplique d'arme, information criminelle, détenu, avocat de Jordan Leroy devant la cour criminelle départementale.",
        notions: [
          { titre: "L'arme par assimilation", regle: "Est assimilé à une arme tout objet qui, présentant avec une arme une ressemblance de nature à créer une confusion, est utilisé pour menacer.", art: "art. 132-75 et 311-8 CP", prog: "dps" },
          { titre: "La détention provisoire criminelle", regle: "Un an, puis des prolongations de six mois par le JLD, après débat contradictoire, dans les plafonds de l'article 145-2.", art: "art. 145-2 CPP", prog: "pp_instruction" },
          { titre: "La cour criminelle départementale", regle: "Crimes punis de quinze ou vingt ans commis par des majeurs, " + CR.ccdRegle() + " ; cinq magistrats, sans jury ; réunion préparatoire obligatoire qui arrête la liste des témoins et experts.", art: "art. 380-16 CPP", prog: "pp_jugement" },
        ],
        piege: "Le client avoue en privé : l'avocat garde le secret, peut plaider l'insuffisance des preuves, mais ne ment pas et ne produit jamais un témoignage qu'il sait faux.",
        devenir: api.def.epilogue(api, o),
      };
    },
    corrige() {
      return [
        { probleme: "Quelle infraction, quelle juridiction ?", regle: "Vol avec arme : vingt ans (art. 311-8) ; la réplique est assimilée à une arme (art. 132-75). Crime puni de vingt ans commis par un majeur : cour criminelle départementale, sans jury (art. 380-16), " + CR.ccdRegle() + ".", application: "« C'était un jouet » n'est pas un moyen de défense." },
        { probleme: "Comment reprendre un dossier de détenu ?", regle: "Se faire désigner (art. 115), obtenir le permis de communiquer et la copie (art. 114), aller au parloir ; détention criminelle d'un an, puis prolongations de six mois après débat devant le JLD (art. 145-2) ; demandes de mise en liberté à tout moment (art. 148), une nouvelle demande étant irrecevable tant que la précédente n'est pas définitivement jugée (loi du 23 juillet 2026).", application: "Désignation dès le premier jour, garanties écrites pour le débat de prolongation." },
        { probleme: "Que faire de l'aveu au parloir ?", regle: "Il est couvert par le secret professionnel (RIN, art. 2). L'avocat peut plaider l'insuffisance des preuves si le client conteste, conseiller de reconnaître, mais ne doit ni mentir ni produire un témoignage qu'il sait faux (art. 434-15 CP). La réunion préparatoire arrête la liste des témoins et experts.", application: "Ne pas faire citer Kevin ; faire citer la gérante et l'expert, plaider la reconnaissance fragile ou, si Jordan reconnaît, la personnalité et la détention déjà subie." },
      ];
    },
  });
})();
