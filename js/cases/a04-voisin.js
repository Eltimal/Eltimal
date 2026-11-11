/* Affaire 4 — Le voisin du dessus.
   Partie civile. Contravention de cinquième classe, prescription d'un an, citation directe devant le tribunal de police.
   Pièges : saisir le tribunal correctionnel ; laisser passer la date anniversaire ; citer moins de quinze jours avant l'audience. */
(function () {
  const CR = window.CR;
  const R = CR.R;
  const PEN = CR.PEN;
  const AUD = CR.AUD;
  const DIALLO = { prenom: "Mamadou", nom: "Diallo", g: "m", age: 68, metier: "retraité de la RATP", tel: "06 14 92 30 66", trust: 55, look: { skin: 5, hair: "short", hc: "gray", glasses: 1 } };
  const PICHON = { prenom: "Gérard", nom: "Pichon", g: "m", naissance: "le 3 avril 1961 à Rouen", adresse: "rue de Clignancourt, Paris 18e", metier: "chauffeur de taxi" };
  const DEF = "a04_voisin";
  const POSTES = [
    { id: "lunettes", label: "Lunettes cassées (facture de l'opticien)", demande: 380, base: 380, needs: ["A4_lunettes_facture"], justif: ["A4_lunettes_facture"] },
    { id: "se", label: "Souffrances endurées et déficit fonctionnel temporaire (entorse, deux jours d'ITT)", demande: 900, base: 700, needs: ["A4_itt2", "A4_itt2_doc"], justif: ["A4_itt2_doc"] },
    { id: "moral", label: "Préjudice moral (la peur dans son propre immeuble)", demande: 800, base: 500, needs: null, justif: null },
  ];

  CR.defineCase({
    id: DEF, camp: "pc", domaine: "pc", domaineLib: "pp_action",
    title: "Diallo — le voisin du dessus",
    arrive: { day: 10, min: 10 * 60 + 30, how: "rdv", mail: { from: "Mamadou Diallo", subject: "Demande de rendez-vous", kind: "email", body: [["Bonjour maître, mon voisin du dessus m'a bousculé dans l'escalier il y a presque un an. Ma plainte a été classée. Un ami m'a dit qu'il fallait faire vite. Je passe à votre cabinet ce matin, si vous le permettez."]] } },
    leadTask: PEN.rdvTask("Recevoir M. Diallo au cabinet"),
    client: DIALLO, leadPatience: 5,
    profile: { wealth: 2, sens: 0.6, urgency: 0.7, temper: "marchandeur" },
    honoraires: { forfait: 1200, heures: 7, types: ["forfait", "temps"], resultat: "condamnation", intro: "Il pose sur votre bureau une chemise cartonnée, bien rangée." },
    mission: "Assistance de M. Diallo pour citer directement M. Pichon devant la juridiction pénale compétente et obtenir réparation, jusqu'à la décision de première instance.",
    actors: { parquet: "pq_haddou", president: "pr_roquebert" },
    proc: { stade: "classement", nature: "contravention", faits: -335, infractions: ["CP_R625-1"] },
    init(api, cs) {
      const f = cs.proc.faitsDay;
      cs.flags.classement = true;
      cs.vars.auditionPichon = f + 21;
      cs.proc.prescStart = f + 21;
      cs.proc.events.push({ day: f + 1, text: "Plainte de M. Diallo au commissariat du 18e." }, { day: f + 21, text: "Audition de M. Pichon par les enquêteurs." }, { day: f + 70, text: "Classement sans suite : infraction insuffisamment caractérisée." });
      api.at(CR.addYears(cs.proc.prescStart, 1) + 1, "_prescriptionCheck");
    },
    vars: (s, cs) => ({ faitsDate: cs.proc ? CR.fmtDate(cs.proc.faitsDay, "long") : "" }),
    facts: {
      A4_date: { label: "La date exacte des faits", key: true, why: "C'est le point de départ de la prescription d'un an." },
      A4_auteur: { label: "Le nom du voisin, Gérard Pichon", key: true, cat: "party", party: "Gérard Pichon" },
      A4_itt2: { label: "Deux jours d'ITT", key: true, why: "Moins de huit jours, sans circonstance aggravante : une contravention, donc le tribunal de police." },
      A4_classement: { label: "Le classement sans suite", why: "Il n'éteint pas l'action : la victime peut citer directement." },
      A4_audition_date: { label: "La date de l'audition de M. Pichon", key: true, why: "Un acte d'enquête qui interrompt la prescription (art. 9-2) : le délai repart de là." },
      A4_temoin_pv: { label: "Le témoignage de Mme Roux", key: true, why: "En citation directe, c'est la partie civile qui apporte la preuve." },
    },
    calls: {
      intake: {
        scene: "conference", kind: "meet", label: "Rendez-vous au cabinet",
        opening: ["M. Diallo s'assoit, sa chemise cartonnée sur les genoux. « Maître, je ne veux pas d'histoires. Je veux juste que la justice dise qu'il n'avait pas le droit. »"],
        topics: [
          { id: "d_quoi", q: "Que s'est-il passé ?", a: [{ t: "C'était le {faitsDate}, vers 19 heures, dans l'escalier de mon immeuble, rue de Clignancourt.", f: "A4_date" }, { t: "Mon voisin du dessus, M. Gérard Pichon, m'a bousculé. Je suis tombé sur quelques marches.", f: "A4_bouscule" }, { t: "C'est mon voisin du dessus : Gérard Pichon.", f: "A4_auteur" }], cost: 5, unlock: ["d_pourquoi", "d_temoin", "d_blessure"] },
          { id: "d_pourquoi", q: "Pourquoi cette dispute ?", a: ["Une fuite d'eau chez moi, qui venait de chez lui. Je suis monté lui en parler. Il est descendu derrière moi en criant."], cost: 2 },
          { id: "d_blessure", q: "Vous avez été blessé ?", a: [{ t: "Une entorse du poignet. Le médecin m'a donné deux jours d'ITT.", f: "A4_itt2" }, { t: "Et mes lunettes, cassées : 380 euros chez l'opticien. J'ai la facture.", f: "A4_lunettes" }], cost: 3 },
          { id: "d_temoin", q: "Quelqu'un a vu la scène ?", a: [{ t: "Mme Roux, du deuxième. Elle a été entendue par la police, je crois.", f: "A4_temoin" }], cost: 2 },
          { id: "d_plainte", q: "Qu'est devenue votre plainte ?", a: [{ t: "J'ai porté plainte le lendemain au commissariat du 18e.", f: "A4_plainte" }, { t: "Et puis, il y a sept mois, une lettre du procureur : classement sans suite.", f: "A4_classement" }, "On m'a dit qu'au bout d'un an, c'était fini. C'est vrai ?"], cost: 3, unlock: ["d_police"] },
          { id: "d_police", q: "La police a-t-elle entendu M. Pichon ?", a: ["Oui, quelques semaines après. Il s'en est vanté dans l'escalier."], cost: 2 },
          { id: "d_promesse", q: "Ne vous inquiétez pas, il ira en prison.", a: ["En prison ? Je ne demande pas ça…"], cost: 1, tag: "bad", fx: { flags: { promesse: true } } },
        ],
        start: ["d_quoi", "d_plainte", "d_promesse"],
        patience: 100,
        close: "Merci, maître. Vous me direz combien de temps il nous reste.",
      },
    },
    advice: [
      { id: "a4_pieces", t: "Apportez-moi l'avis de classement, le certificat médical et la facture des lunettes." },
      { id: "a4_pas_contact", t: "Évitez M. Pichon dans l'escalier, et ne répondez pas à ses provocations." },
      { id: "a4_temps", t: "Nous avons du temps : rien ne presse." },
    ],
    docs: {
      avis_classement: (x) => ({ title: "Avis de classement sans suite", kind: "greffe", entete: ["Tribunal judiciaire de Paris · Parquet", "Article 40-2 du code de procédure pénale"], paras: [
        [`Monsieur Mamadou Diallo, la procédure ouverte sur votre plainte du ${CR.fmtDate(x.cs.proc.faitsDay + 1, "long")} contre M. Gérard Pichon a fait l'objet d'un classement sans suite le ${CR.fmtDate(x.cs.proc.faitsDay + 70, "long")}.`],
        ["Motif : infraction insuffisamment caractérisée."],
        [{ t: "Vous pouvez former un recours auprès du procureur général, ou citer directement l'auteur des faits devant le tribunal compétent.", f: "A4_recours" }],
      ] }),
      certificat: (x) => ({ title: "Certificat médical", kind: "courrier", entete: ["Dr Hélène Barbier, médecin généraliste", "Rue Ordener, Paris 18e"], paras: [[`Examen de M. Mamadou Diallo le ${CR.fmtDate(x.cs.proc.faitsDay, "long")} à 21 h : entorse du poignet gauche, contusion de la hanche.`], [{ t: "Incapacité totale de travail : 2 (deux) jours.", f: "A4_itt2_doc" }]], signed: "Dr H. Barbier" }),
      facture: () => ({ title: "Facture de l'opticien", kind: "courrier", entete: ["Optique Clignancourt"], paras: [[{ t: "Remplacement de monture et de verres progressifs : 380 € TTC.", f: "A4_lunettes_facture" }]] }),
      pv_audition_pichon: (x) => ({ title: "Procès-verbal d'audition de M. Pichon", kind: "pv", entete: ["Commissariat central du 18e", "Cote D4"], paras: [
        [{ t: `Le ${CR.fmtDate(x.cs.vars.auditionPichon, "long")}, entendons M. Gérard Pichon, chauffeur de taxi.`, f: "A4_audition_date" }],
        [{ t: "Je l'ai écarté de la main, il était sur mon chemin. Il est tombé tout seul.", f: "A4_pichon_ecarte" }],
      ], signed: "Lu, persiste et signe." }),
      pv_temoin_roux: () => ({ title: "Procès-verbal d'audition de Mme Roux", kind: "pv", entete: ["Commissariat central du 18e", "Cote D5"], paras: [[{ t: "J'ai vu M. Pichon pousser M. Diallo des deux mains dans l'escalier. M. Diallo est tombé sur trois ou quatre marches.", f: "A4_temoin_pv" }], ["M. Pichon criait depuis le palier."]], signed: "Lu, persiste et signe." }),
    },
    docTitles: { avis_classement: "Avis de classement", certificat: "Certificat médical", facture: "Facture de l'opticien", pv_audition_pichon: "Audition de M. Pichon (D4)", pv_temoin_roux: "Audition de Mme Roux (D5)" },
    penal: {
      no: ["actes", "copie"],
      citation: { juridiction: "tp", heure: 9 * 60 + 30, prevenu: ["A4_auteur"], faits: ["A4_bouscule", "A4_temoin_pv"], dateFaits: ["A4_date"],
        qualifs: [
          { t: "Violences volontaires n'ayant pas entraîné d'incapacité totale de travail supérieure à huit jours, contravention de cinquième classe prévue par l'article R. 625-1 du code pénal.", ok: true },
          { t: "Violences volontaires ayant entraîné une incapacité totale de travail de plus de huit jours (art. 222-11 du code pénal).", ok: false, defect: "qualif:delit" },
          { t: "Tentative de meurtre.", ok: false, defect: "qualif:fantaisiste" },
        ] },
      chiffrage: { postes: POSTES, art475: 1200 },
      copieTC: { docs: ["pv_audition_pichon", "pv_temoin_roux"], from: "Parquet de Paris — archives", subject: "Copie de la procédure classée", texte: "Vous trouverez la copie de la procédure classée sans suite : audition du mis en cause et du témoin." },
    },
    flow: { tasks: PEN.tasks },
    tasks(api, T) {
      const { s, cs } = api;
      const C = cs.vars.citation;
      PEN.copieTask(api, T, { label: "Demander la copie de la procédure classée", sub: "Au parquet. En citation directe, c'est vous qui apportez la preuve.", where: "palais" });
      if (!cs.vars.dateAudiencement && !C) T({ id: "audiencement", label: "Obtenir une date d'audience au greffe", sub: "La citation doit indiquer la date ; elle sera délivrée au moins quinze jours avant (art. 552).", kind: "admin", time: 20, where: "palais", run: () => { PEN.audiencement(api, "tp"); return null; } });
      if (cs.vars.dateAudiencement && !C && !CR.drafted(cs, "citation")) T({ id: "citation", label: "Rédiger la citation directe", sub: "Juridiction, prévenu, faits, qualification, demandes. Puis la remettre à un commissaire de justice.", kind: "draft", time: 100, urgent: true, run: () => ({ scene: "draft", tpl: "citation" }) });
      PEN.prepPC(api, T, "Préparer M. Diallo à l'audience");
    },
    on: {
      engaged(api) {
        const { cs } = api;
        api.mail({ from: "Mamadou Diallo", subject: "Mes papiers", kind: "email", doc: "avis_classement", title: "Avis de classement sans suite", body: [["Voici l'avis de classement. Je vous envoie le certificat et la facture."]] });
        api.doc("certificat", "Certificat médical");
        api.doc("facture", "Facture de l'opticien");
        if (cs.advice.includes("a4_temps")) CR.erreur(api.s, cs, { id: "rien_presse", texte: "Vous avez dit au client que rien ne pressait, à quelques semaines de la prescription.", sanction: "Aucune tant que vous agissez à temps ; votre responsabilité sinon.", regul: "Compter le délai dès le premier rendez-vous." });
      },
      citationDelivree(api, { ctrl }) {
        const { s, cs } = api;
        const C = cs.vars.citation;
        cs.vars.consignation = { montant: 250, due: CR.rollForward(C.audienceDay - 2), paid: false };
        api.oblig({ id: "consignation", label: "Verser la consignation", due: cs.vars.consignation.due, onMiss: "_consignationOubliee" });
        api.mail({ from: C.juridiction === "tc" ? "Greffe correctionnel" : "Greffe du tribunal de police", subject: "Consignation — citation directe Diallo contre Pichon", kind: "greffe", important: true, body: [["La partie civile qui cite directement doit consigner au greffe une somme destinée à garantir le paiement d'une éventuelle amende civile (art. 392-1)."], [`Montant fixé : ${CR.money(250)}, à verser avant l'audience, sous peine d'irrecevabilité de la citation.`]] });
        const day = C.audienceDay;
        if (ctrl.sanction === "incompetence") {
          CR.erreur(s, cs, { id: "incompetence", texte: "Vous avez cité devant le tribunal correctionnel pour une contravention.", sanction: "Le tribunal correctionnel se déclarera incompétent (art. 381 et 521).", regul: "Citer à nouveau devant le tribunal de police, si la prescription le permet encore." });
          CR.PROC.fixAudience(api, { day, min: 13 * 60 + 30, juridiction: "tc", mode: "citation", convocDay: s.day, president: "pr_aubriot", script: "incompetence", done: "apresIncompetence", title: "Audience — tribunal correctionnel (citation directe)", duree: 30 });
          return;
        }
        if (ctrl.sanction === "citation_courte") { cs.flags.citationCourte = true; CR.erreur(s, cs, { id: "citation_courte", texte: "La citation a été délivrée moins de quinze jours avant l'audience.", sanction: "Le prévenu qui comparaît peut obtenir un renvoi (art. 552 et 553).", regul: "Citer plus tôt, ou accepter le renvoi." }); }
        CR.PROC.fixAudience(api, { day, min: 9 * 60 + 30, juridiction: "tp", mode: "citation", convocDay: s.day, president: "pr_roquebert", script: cs.flags.citationCourte ? "renvoi" : "tp", done: cs.flags.citationCourte ? "apresRenvoi" : "apresTP", onMiss: "_absent", title: "Audience — tribunal de police", duree: 45 });
      },
      citationPrescrite(api) {
        const { s, cs } = api;
        CR.erreur(s, cs, { id: "prescrit", texte: "La citation a été délivrée après l'expiration du délai de prescription d'un an.", sanction: "L'action publique est éteinte : le tribunal la constaterait d'office (art. 9).", regul: "Aucune devant le juge pénal ; M. Diallo ne peut plus que saisir le juge civil." });
        CR.rcp(s, cs, "la citation directe a été délivrée après la prescription de l'action publique");
        CR.closeCase(s, cs, { type: "prescrit" });
      },
      _prescriptionCheck(api) {
        const { s, cs } = api;
        const C = cs.vars.citation;
        if (C && C.ctrl && C.ctrl.sanction !== "prescription") return;
        if (C && !C.ctrl) return;
        if (cs.status !== "active") { if (cs.status === "prospect") CR.closeCase(s, cs, { type: "prescrit", note: "Le dossier n'a jamais été engagé ; la prescription est acquise." }); return; }
        CR.erreur(s, cs, { id: "prescrit", texte: "Aucune citation n'a été délivrée dans l'année du dernier acte d'enquête.", sanction: "Prescription de l'action publique (art. 9 et 9-2) : aucune poursuite n'est plus possible.", regul: "Aucune devant le juge pénal." });
        api.mail({ from: "Mamadou Diallo", subject: "Alors ?", kind: "email", body: [["Maître, cela fait un an et je n'ai aucune nouvelle. Mon ami me dit que c'est trop tard. Est-ce vrai ?"]] });
        CR.rcp(s, cs, "l'action publique s'est prescrite faute de diligence");
        CR.closeCase(s, cs, { type: "prescrit" });
      },
      _consignationOubliee(api) {
        const { s, cs } = api;
        if (cs.vars.consignation && cs.vars.consignation.paid) return;
        cs.flags.consignationManquee = true;
        CR.erreur(s, cs, { id: "consignation", texte: "La consignation n'a pas été versée avant l'audience.", sanction: "Citation directe irrecevable (art. 392-1).", regul: "Citer à nouveau si la prescription le permet, et consigner." });
      },
      apresIncompetence(api) {
        const { s, cs } = api;
        cs.vars.citation = null; cs.vars.dateAudiencement = null; cs.proc.audience = null;
        cs.drafted.citation = [];
        cs.vars.consignation = null;
        CR.PROC.stade(api, "classement", "Le tribunal correctionnel s'est déclaré incompétent.");
        api.tl("Incompétence : il faut citer à nouveau devant le tribunal de police.");
      },
      apresRenvoi(api) {
        const { s, cs } = api;
        const d = CR.rollForward(s.day + 28);
        cs.flags.citationCourte = false;
        CR.PROC.fixAudience(api, { day: d, min: 9 * 60 + 30, juridiction: "tp", mode: "renvoi", convocDay: s.day, president: "pr_roquebert", script: "tp", done: "apresTP", onMiss: "_absent", title: "Audience — tribunal de police (après renvoi)", duree: 45 });
      },
      _absent(api) {
        const { s, cs } = api;
        CR.erreur(s, cs, { id: "absent", texte: "Vous n'étiez pas à l'audience.", sanction: "La partie civile citante qui ne comparaît pas est réputée se désister (art. 425).", regul: "Aucune." });
        CR.closeCase(s, cs, { type: "done", detail: "désistement réputé" });
      },
      decider(api, { st }) {
        const { cs } = api;
        const pieces = { plainte: { label: "Les déclarations de M. Diallo", sens: "charge", force: 0.25 } };
        if (CR.hasFact(cs, "A4_temoin_pv") || st.played.has("A4_temoin_pv")) pieces.temoin = { label: "Le témoignage de Mme Roux", sens: "charge", force: 0.35 };
        if (CR.hasFact(cs, "A4_itt2_doc")) pieces.certificat = { label: "Le certificat médical (deux jours d'ITT)", sens: "charge", force: 0.12 };
        if (CR.hasFact(cs, "A4_pichon_ecarte") || st.played.has("A4_pichon_ecarte")) pieces.audition = { label: "M. Pichon reconnaît l'avoir « écarté de la main »", sens: "charge", force: 0.15 };
        pieces.version = { label: "M. Pichon soutient que M. Diallo est tombé seul", sens: "decharge", force: 0.1, need: ["arg:seul"] };
        st.played.add("arg:seul");
        const picks = (cs.vars.chiffrage && cs.vars.chiffrage.postes) || [];
        const autres = (cs.vars.chiffrage && cs.vars.chiffrage.autres) || [];
        if (cs.flags.consignationManquee) return { titre: "Jugement", entete: "Tribunal de police de Paris.", questions: [{ q: "Sur la recevabilité de la citation", r: "La citation est déclarée irrecevable.", motif: "La consignation fixée n'a pas été versée (art. 392-1)." }], dispositif: "Déclare la citation irrecevable.", coupable: false, irrecevable: true };
        return PEN.juger(api, {
          st, juridiction: "tp", titre: "Jugement du tribunal de police", prevenuNom: "Gérard Pichon", pcNom: "Mamadou Diallo",
          spec: { seuil: 0.55, pieces },
          qualif: () => ({ id: "contrav", label: "violences volontaires n'ayant pas entraîné d'incapacité totale de travail supérieure à huit jours", court: "contravention de 5e classe, art. R. 625-1 CP", encourue: { amende: 1500 }, requis: cs.vars.requis, motif: "Deux jours d'incapacité : contravention de cinquième classe (art. R. 625-1)." }),
          personnalite: 1,
          civil: { postes: POSTES.filter((p) => picks.includes(p.id)), art475: autres.includes("art475") ? 1200 : 0 },
        });
      },
      apresTP(api, res) {
        const { s, cs } = api;
        const dec = res.decision || {};
        if (dec.irrecevable) { CR.closeCase(s, cs, { type: "irrecevable", detail: "consignation non versée" }); return; }
        CR.closeCase(s, cs, PEN.issue(api, dec));
      },
    },
    audiences: {
      tp(api) {
        const { cs } = api;
        return {
          title: "Tribunal de police de Paris", sub: "Tribunal judiciaire · Batignolles", decor: { scene: "salle" },
          steps: AUD.jugement(api, {
            prevenu: PICHON, victime: DIALLO, victimeAvocat: `Me ${api.s.player.nom}`,
            prevention: `Vous êtes cité par M. Mamadou Diallo pour avoir, à Paris 18e, le ${CR.fmtDate(cs.proc.faitsDay, "long")}, volontairement commis des violences n'ayant pas entraîné d'incapacité totale de travail supérieure à huit jours. Contravention prévue par l'article R. 625-1 du code pénal.`,
            exceptionAdverse: "Le prévenu comparaît seul. Il ne soulève rien.",
            instruction: [
              { who: "president", t: "Monsieur Pichon, que s'est-il passé dans l'escalier ?" },
              { who: "prevenu", name: "Gérard Pichon", t: "Je l'ai à peine touché. Il est tombé tout seul. Et puis ça fait plus d'un an, c'est prescrit, non ?", interject: { need: ["A4_audition_date", "CPP_9-2"], window: 6000, label: "Madame la présidente, l'audition de M. Pichon par les enquêteurs a interrompu la prescription ; la citation a été délivrée dans l'année qui a suivi (art. 9-2).", ok: { fx: { cred: 2 }, then: [{ who: "president", t: "C'est exact, maître. Le tribunal l'aurait relevé de toute façon. Monsieur Pichon, l'action n'est pas prescrite." }] } } },
              { who: "president", t: "Monsieur Diallo ?" },
              { if: () => !!cs.flags.prepClient, then: [{ who: "client", t: "Il m'a poussé des deux mains. Mme Roux l'a vu. Je suis tombé sur les marches.", signal: "bon" }], else: [{ who: "client", t: "Cet homme est méchant, madame la juge. Depuis des années, il fait du bruit, il…", fx: { cred: -2 } }, { who: "president", t: "Restons-en aux faits, monsieur." }] },
            ],
            questions: { prompt: "Questions au prévenu (art. 442-1)", who: "prevenu", name: "Gérard Pichon", max: 2, options: [
              { id: "q_ecarte", t: "Monsieur Pichon, vous avez dit aux enquêteurs l'avoir « écarté de la main ». C'est bien ça ?", need: "A4_pichon_ecarte", a: "…Oui. Écarté. Pas poussé.", fx: { play: ["A4_pichon_ecarte"] }, signal: "bon" },
              { id: "q_roux", t: "Mme Roux dit vous avoir vu pousser M. Diallo des deux mains. Elle ment ?", need: "A4_temoin_pv", a: "Elle a toujours pris son parti.", fx: { play: ["A4_temoin_pv"] }, signal: "bon" },
              { id: "q_bruit", t: "Vous faites beaucoup de bruit, la nuit ?", a: "Ça n'a rien à voir !", fx: { cred: -2 }, signal: "mauvais" },
            ] },
            pc: { max: 4, args: [
              { id: "temoin", label: "Le témoignage de Mme Roux", say: "Mme Roux, voisine du deuxième, a vu M. Pichon pousser M. Diallo des deux mains.", cards: ["A4_temoin_pv"] },
              { id: "aveu", label: "M. Pichon reconnaît l'avoir « écarté de la main »", say: "M. Pichon le reconnaît lui-même : il l'a « écarté de la main ». Un geste volontaire.", cards: ["A4_pichon_ecarte"] },
              { id: "qualif", label: "Deux jours d'ITT : la contravention de l'article R. 625-1", say: "Deux jours d'incapacité : c'est la contravention de cinquième classe de l'article R. 625-1, dont le tribunal de police est saisi.", cards: ["A4_itt2", "A4_itt2_doc", "CP_R625-1"] },
              { id: "prejudice", label: "Le préjudice : l'entorse et les lunettes", say: "Une entorse, deux jours d'incapacité, des lunettes à 380 euros, facture à l'appui.", cards: ["A4_lunettes_facture", "A4_itt2_doc"] },
              { id: "prison", label: "Demander une peine de prison", say: "Je demande une peine exemplaire.", pertinent: () => false },
              { id: "art475", label: "Les frais d'avocat (art. 475-1)", say: "Je sollicite une somme au titre de l'article 475-1.", cards: ["CPP_475-1"] },
            ] },
            requis: { base: { amende: 600 }, avant: ["Les faits sont établis par le témoignage de Mme Roux. Je requiers une amende."] },
            dernierMotAdverse: "Je ne voulais pas qu'il tombe. Mais il m'a cherché.",
          }),
        };
      },
      renvoi(api) {
        return { title: "Tribunal de police de Paris", sub: "Tribunal judiciaire · Batignolles", decor: { scene: "salle" }, steps: [
          { who: "huissier", t: "Le tribunal !" },
          { who: "president", t: "Affaire Diallo contre Pichon, sur citation directe. Monsieur Pichon, vous êtes présent." },
          { who: "prevenu", name: "Gérard Pichon", t: "J'ai reçu ce papier il y a dix jours. Je n'ai pas eu le temps de prendre un avocat. Je demande un délai." },
          { who: "president", t: "La citation a été délivrée moins de quinze jours avant l'audience (art. 552). Le prévenu qui comparaît a droit au renvoi. L'affaire est renvoyée à quatre semaines." },
          { who: "sys", t: "(M. Diallo soupire. Une matinée perdue, et quatre semaines d'attente.)" },
        ] };
      },
      incompetence(api) {
        return { title: "Tribunal correctionnel de Paris", sub: "Tribunal judiciaire · Batignolles", decor: { scene: "salle" }, steps: [
          { who: "huissier", t: "Le tribunal !" },
          { who: "president", t: "Citation directe de M. Diallo contre M. Pichon, pour des violences ayant entraîné deux jours d'incapacité totale de travail." },
          { who: "president", t: "Maître, deux jours d'incapacité, sans circonstance aggravante : c'est une contravention de cinquième classe. Le tribunal correctionnel n'en est pas saisi régulièrement." },
          { who: "parquet", t: "Le ministère public conclut à l'incompétence." },
          { who: "president", t: "Le tribunal se déclare incompétent. Il appartiendra à la partie civile de mieux se pourvoir." },
          { who: "sys", t: "(M. Diallo vous regarde sans comprendre.)" },
        ] };
      },
    },
    debrief(api, o) {
      const { cs } = api;
      const items = [{ kind: "rule", text: "Contravention : prescription d'un an (art. 9), interrompue par tout acte d'enquête ou de poursuite (art. 9-2) ; le délai repart en entier." }];
      const pr = CR.PROC.prescription(cs);
      if (pr) items.push({ kind: "info", text: `Le dernier acte d'enquête, l'audition de M. Pichon, datait du ${CR.fmtDate(cs.vars.auditionPichon, "long")} : la prescription était acquise le lendemain du ${CR.fmtDate(CR.addYears(cs.vars.auditionPichon, 1), "long")}.` });
      if (!CR.hasFact(cs, "A4_temoin_pv")) items.push({ kind: "bad", text: "Vous n'avez pas produit l'audition de Mme Roux : en citation directe, la preuve est à la charge de la partie civile." });
      if (cs.erreurs.some((e) => e.id === "incompetence")) items.push({ kind: "bad", text: "Le tribunal correctionnel ne juge pas les contraventions : il fallait citer devant le tribunal de police." });
      return items.concat(cs.vars.debriefJugement || []);
    },
    epilogue(api, o) {
      if (o.type === "indemnise") return "M. Pichon a payé, en deux fois. Dans l'escalier, il dit maintenant bonjour à M. Diallo, du bout des lèvres.";
      if (o.type === "prescrit") return "M. Diallo n'a rien obtenu. Il a déménagé chez sa fille, à Saint-Ouen.";
      return "M. Diallo est reparti sans réparation. Il croise toujours M. Pichon dans l'escalier.";
    },
    fiche(api, o) {
      return {
        phrase: "Violences légères entre voisins, citation directe devant le tribunal de police, avocat de la victime, M. Diallo.",
        notions: [
          { titre: "La prescription des contraventions", regle: "Un an à compter des faits ; tout acte d'enquête ou de poursuite l'interrompt et fait courir un nouveau délai d'un an.", art: "art. 9 et 9-2 CPP", prog: "pp_action" },
          { titre: "Le classement sans suite n'éteint pas l'action", regle: "La victime peut citer directement l'auteur devant la juridiction de jugement ; elle consigne, et la preuve est à sa charge.", art: "art. 40-2, 392-1 et 551 CPP", prog: "pp_action" },
          { titre: "La compétence du tribunal de police", regle: "Le tribunal de police juge les contraventions ; le tribunal correctionnel, les délits.", art: "art. 521 et 381 CPP", prog: "pp_jugement" },
        ],
        piege: "Le délai court à partir du dernier acte d'enquête, pas forcément des faits : lisez les dates des procès-verbaux. Et quinze jours au moins entre la citation et l'audience.",
        devenir: api.def.epilogue(api, o),
      };
    },
    corrige() {
      return [
        { probleme: "Délit ou contravention, et quel tribunal ?", regle: "Violences avec ITT de huit jours au plus sans circonstance aggravante : contravention de cinquième classe (art. R. 625-1 CP), compétence du tribunal de police (art. 521 CPP).", application: "Deux jours d'ITT, aucune circonstance : tribunal de police. Citer le tribunal correctionnel conduit à l'incompétence." },
        { probleme: "Est-il encore temps ?", regle: "Prescription d'un an (art. 9 CPP), interrompue par les actes d'enquête (art. 9-2) ; une fois acquise, elle est relevée d'office.", application: "Les faits ont onze mois ; l'audition du voisin a fait repartir le délai. Il faut citer avant la date anniversaire de ce dernier acte." },
        { probleme: "Le classement sans suite ferme-t-il la porte ?", regle: "Non : la victime peut citer directement (art. 551), en consignant (art. 392-1), avec un délai de quinze jours entre la citation et l'audience (art. 552).", application: "Audiencement au greffe, citation par commissaire de justice, consignation, puis chiffrage du préjudice." },
      ];
    },
  });
})();
