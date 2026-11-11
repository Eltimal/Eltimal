/* Affaire 5 — Le faux conseiller en placement.
   Partie civile. Escroquerie, plainte avec constitution de partie civile (condition des trois mois), consignation, instruction.
   Pièges : déposer la plainte avec constitution avant les trois mois ; citer directement sur un dossier faible (relaxe, art. 472). */
(function () {
  const CR = window.CR;
  const R = CR.R;
  const PEN = CR.PEN;
  const AUD = CR.AUD;
  const BERNARD = { prenom: "Jacqueline", nom: "Bernard", g: "f", age: 74, metier: "institutrice retraitée", tel: "01 46 06 31 84", trust: 50, look: { skin: 0, hair: "short", hc: "white", glasses: 1 } };
  const ROLLAND = { prenom: "Sébastien", nom: "Rolland", g: "m", naissance: "le 21 août 1985 à Nice", adresse: "à Cagnes-sur-Mer", metier: "se disant conseiller en patrimoine" };
  const DEF = "a05_placement";
  const POSTES = [
    { id: "materiel", label: "Préjudice matériel : les trois virements", demande: 18000, base: 18000, needs: ["A5_virements_doc", "A5_virements"], justif: ["A5_virements_doc"] },
    { id: "moral", label: "Préjudice moral (angoisse, honte, isolement)", demande: 3000, base: 1500, needs: null, justif: null },
    { id: "frais", label: "Frais bancaires et de recherche", demande: 240, base: 240, needs: ["A5_frais"], justif: ["A5_frais"] },
  ];

  CR.defineCase({
    id: DEF, camp: "pc", domaine: "pc", domaineLib: "pp_action",
    title: "Bernard — le faux conseiller en placement",
    arrive: { day: 16, min: 14 * 60 + 30, how: "rdv", mail: { from: "Jacqueline Bernard", subject: "Rendez-vous — escroquerie", kind: "email", body: [["Maître, on m'a escroquée de 18 000 euros. J'ai déjà porté plainte, mais rien ne bouge. Ma fille m'a dit d'aller voir un avocat. Je peux passer cet après-midi ?"]] } },
    leadTask: PEN.rdvTask("Recevoir Mme Bernard au cabinet"),
    client: BERNARD, leadPatience: 6,
    profile: { wealth: 3, sens: 0.6, urgency: 0.5, temper: "anxieux" },
    honoraires: { forfait: 2200, heures: 14, types: ["forfait", "temps"], resultat: "condamnation et indemnisation" },
    mission: "Assistance de Mme Bernard, victime d'une escroquerie : plainte avec constitution de partie civile ou citation directe, suivi de la procédure et demande de réparation, jusqu'à la décision de première instance.",
    actors: { ji: "ji_ferraud", parquet: "pq_haddou", adverse: "av_villeneuve" },
    proc: { stade: "enquete", nature: "delit", faits: -95, infractions: ["CP_313-1"] },
    init(api, cs) {
      cs.vars.plainteSimpleDay = cs.vars.base - 60;
      cs.vars.plainteSimpleCopie = true;
      cs.proc.events.push({ day: cs.vars.base - 120, text: "Premier virement à « Rolland Patrimoine Conseil »." }, { day: cs.vars.base - 60, text: "Plainte simple au commissariat du 18e, récépissé remis." });
    },
    vars: (s, cs) => ({ plainteDate: cs.vars.plainteSimpleDay != null ? CR.fmtDate(cs.vars.plainteSimpleDay, "long") : "" }),
    facts: {
      A5_plainte: { label: "La date de la plainte simple et le récépissé", key: true, why: "Elle fait courir les trois mois de l'article 85 : avant, la plainte avec constitution est irrecevable." },
      A5_auteur: { label: "L'identité de l'auteur, Sébastien Rolland", key: true, cat: "party", party: "Sébastien Rolland" },
      A5_virements: { label: "Les trois virements de 6 000 €", key: true },
      A5_age: { label: "« À votre âge, il faut sécuriser votre épargne »", key: true, why: "Il connaissait sa vulnérabilité : c'est la circonstance aggravante de l'article 313-2." },
      A5_isoler: { label: "« Ne dites rien à vos enfants »", key: true },
      A5_amf: { label: "Le site figure sur la liste noire de l'AMF", why: "Une manœuvre frauduleuse : la fausse apparence d'un professionnel autorisé." },
    },
    calls: {
      intake: {
        scene: "conference", kind: "meet", label: "Rendez-vous au cabinet",
        opening: ["Mme Bernard serre son sac contre elle. « J'ai honte, maître. Ma fille dit que ce n'est pas ma faute. Je ne sais plus. »"],
        topics: [
          { id: "b_quoi", q: "Racontez-moi, depuis le début.", a: ["Une publicité sur internet, en juin. Un livret « garanti à 8 % ».", { t: "Un monsieur m'a appelée : Sébastien Rolland, de « Rolland Patrimoine Conseil ». Très poli, très patient.", f: "A5_auteur" }, { t: "Je lui ai fait trois virements de 6 000 euros, en juillet et en août.", f: "A5_virements" }], cost: 6, unlock: ["b_messages", "b_rendement", "b_identite"] },
          { id: "b_messages", q: "Vous avez gardé vos échanges avec lui ?", a: ["Tout est dans mon téléphone, sur WhatsApp.", { t: "Il m'écrivait : « À votre âge, il faut sécuriser votre épargne. »", f: "A5_age" }, { t: "Et : « Ne dites rien à vos enfants, ils ne comprendraient pas. »", f: "A5_isoler" }], cost: 4 },
          { id: "b_rendement", q: "Que vous avait-il promis exactement ?", a: [{ t: "Un rendement garanti de 8 % par an, sans risque, « adossé à une grande banque ».", f: "A5_garanti" }], cost: 2 },
          { id: "b_identite", q: "Comment savez-vous qui il est vraiment ?", a: [{ t: "Ma fille a cherché : il existe, il habite près de Nice. Sa société a été radiée l'an dernier.", f: "A5_radiee" }, { t: "Et son site est sur une liste de l'Autorité des marchés financiers, une liste noire.", f: "A5_amf" }], cost: 3 },
          { id: "b_plainte", q: "Où et quand avez-vous porté plainte ?", a: [{ t: "Au commissariat du 18e, le {plainteDate}. J'ai le récépissé.", f: "A5_plainte" }, "Depuis, plus rien. Pas un courrier."], cost: 2 },
          { id: "b_banque", q: "Votre banque vous a-t-elle remboursée ?", a: ["Ils disent que j'ai validé moi-même les virements.", { t: "J'ai payé 240 euros de frais pour les recherches et les courriers recommandés.", f: "A5_frais" }], cost: 2 },
          { id: "b_vite", q: "Nous allons tout de suite déposer une plainte avec constitution de partie civile.", a: ["Oui, s'il vous plaît, vite."], cost: 1, tag: "neutral" },
        ],
        start: ["b_quoi", "b_plainte", "b_banque"],
        patience: 110,
        close: "Merci, maître. Vous croyez qu'on reverra l'argent ?",
      },
    },
    advice: [
      { id: "a5_garder", t: "Gardez tous les messages, les relevés et les courriels : ne supprimez rien." },
      { id: "a5_rien_payer", t: "Si quelqu'un vous propose de récupérer l'argent contre des frais, raccrochez : c'est une seconde escroquerie." },
      { id: "a5_garantie", t: "Je vous garantis que vous serez remboursée." },
    ],
    docs: {
      recepisse: (x) => ({ title: "Récépissé de dépôt de plainte", kind: "pv", entete: ["Commissariat central du 18e"], paras: [[{ t: `Plainte déposée le ${CR.fmtDate(x.cs.vars.plainteSimpleDay, "long")} par Mme Jacqueline Bernard pour escroquerie.`, f: "A5_recepisse" }], ["Le présent récépissé vaut preuve du dépôt (art. 15-3 CPP)."]] }),
      releve: (x) => ({ title: "Relevés bancaires (extraits)", kind: "courrier", entete: ["Banque Postale · compte de Mme Bernard"], paras: [[{ t: "Trois virements de 6 000 € chacun vers « Rolland Patrimoine Conseil », IBAN FR76 3047 8000 1234 5678 9012 345, en juillet et août.", f: "A5_virements_doc" }]] }),
      messages: () => ({ title: "Captures des messages WhatsApp", kind: "sms", paras: [
        [{ t: "« À votre âge, il faut sécuriser votre épargne, madame Bernard. »", f: "A5_age" }],
        [{ t: "« Rendement garanti de 8 %, sans aucun risque, adossé à une grande banque. »", f: "A5_garanti" }],
        [{ t: "« Ne dites rien à vos enfants, ils ne comprendraient pas. »", f: "A5_isoler" }],
        ["« Le dernier virement débloque vos intérêts. »"],
      ] }),
      amf: () => ({ title: "Liste noire de l'AMF (extrait)", kind: "courrier", entete: ["Autorité des marchés financiers"], paras: [[{ t: "Site rolland-patrimoine.fr : proposition de placements sans autorisation. Inscription sur la liste des sites non autorisés.", f: "A5_amf_doc" }]] }),
      ordo_ri: () => ({ title: "Avis d'ouverture d'information", kind: "greffe", entete: ["Tribunal judiciaire de Paris · Cabinet de Mme Ondine Ferraud, juge d'instruction"], paras: [["Une information judiciaire est ouverte du chef d'escroquerie au préjudice de Mme Jacqueline Bernard, partie civile."], ["La partie civile peut demander la copie du dossier et des actes (art. 114 et 82-1)."]] }),
      mex: (x) => ({ title: "Procès-verbal d'interrogatoire de première comparution (extrait)", kind: "pv", entete: ["Cabinet du juge d'instruction"], paras: [[{ t: `M. Sébastien Rolland est mis en examen du chef d'${x.cs.vars.vulnDossier ? "escroquerie commise au préjudice d'une personne particulièrement vulnérable" : "escroquerie"}.`, f: "A5_mex" }], [{ t: "« J'ai eu des difficultés. Je comptais rembourser tout le monde. »", f: "A5_aveu" }]] }),
      reqbank: () => ({ title: "Réponse aux réquisitions bancaires", kind: "pv", entete: ["Cabinet du juge d'instruction · cote D45"], paras: [[{ t: "Les fonds reçus sur le compte de Rolland Patrimoine Conseil ont été virés, sous quarante-huit heures, vers les comptes personnels de M. Rolland et retirés en espèces.", f: "A5_flux" }], ["Onze autres personnes, toutes âgées de plus de soixante-dix ans, ont versé des fonds sur ce compte."]] }),
    },
    docTitles: { recepisse: "Récépissé de plainte", releve: "Relevés bancaires", messages: "Messages WhatsApp", amf: "Liste noire de l'AMF", ordo_ri: "Ouverture d'information", mex: "Mise en examen de M. Rolland", reqbank: "Réquisitions bancaires (D45)" },
    penal: {
      no: [],
      consignation: 800,
      pcpc: {
        faits: ["A5_garanti", "A5_virements", "A5_virements_doc"], auteur: ["A5_auteur"], prejudice: ["A5_virements", "A5_virements_doc"],
        qualifs: [
          { t: "Escroquerie commise au préjudice d'une personne dont la particulière vulnérabilité, due à son âge, était connue de son auteur (art. 313-1 et 313-2 du code pénal).", ok: true },
          { t: "Escroquerie (art. 313-1 du code pénal).", ok: true },
          { t: "Vol (art. 311-1 du code pénal).", ok: false, defect: "qualif:vol" },
        ],
      },
      citation: { juridiction: "tc", heure: 13 * 60 + 30, prevenu: ["A5_auteur"], faits: ["A5_garanti", "A5_virements", "A5_virements_doc"], dateFaits: ["A5_virements"], qualifs: [{ t: "Escroquerie (art. 313-1 du code pénal).", ok: true }, { t: "Abus de confiance.", ok: false, defect: "qualif:abus" }] },
      actes: [
        { id: "banque", t: "Des réquisitions bancaires sur le compte de Rolland Patrimoine Conseil et la destination des fonds.", ok: null },
        { id: "audition", t: "L'audition et, s'il y a lieu, la mise en examen de M. Sébastien Rolland.", ok: null, needs: "A5_auteur" },
        { id: "telephone", t: "L'extraction et le versement au dossier des messages WhatsApp de Mme Bernard.", ok: null, needs: ["A5_age", "A5_isoler"] },
        { id: "expertise", t: "Une expertise psychiatrique de Mme Bernard.", ok: false, defect: "actes:inutile" },
      ],
      copie: ["recepisse", "releve"],
      chiffrage: { postes: POSTES, art475: 2000 },
    },
    flow: { tasks: PEN.tasks },
    tasks(api, T) {
      const { s, cs } = api;
      const ouvert = ["information", "reglement", "jugement", "citation"].includes(cs.proc.stade) || cs.vars.pcpcOk;
      if (!ouvert && !cs.vars.citation) {
        if (!CR.drafted(cs, "pcpc")) T({ id: "pcpc", label: "Rédiger la plainte avec constitution de partie civile", sub: "Devant le doyen des juges d'instruction (art. 85).", kind: "draft", time: 120, run: () => ({ scene: "draft", tpl: "pcpc" }) });
        if (!cs.vars.dateAudiencement && !CR.drafted(cs, "pcpc")) T({ id: "audiencement", label: "Obtenir une date pour une citation directe", sub: "Au greffe correctionnel : vous saisiriez vous-même le tribunal.", kind: "admin", time: 20, where: "palais", run: () => { PEN.audiencement(api, "tc"); return null; } });
        if (cs.vars.dateAudiencement && !CR.drafted(cs, "citation") && !CR.drafted(cs, "pcpc")) T({ id: "citation", label: "Rédiger la citation directe", sub: "Devant le tribunal correctionnel. La preuve sera à votre charge.", kind: "draft", time: 100, run: () => ({ scene: "draft", tpl: "citation" }) });
      }
      if (!cs.flags.piecesVersees && CR.hasFact(cs, "A5_age")) T({ id: "pieces", label: "Rassembler les pièces de Mme Bernard", sub: "Relevés bancaires, captures des messages, liste noire de l'AMF.", kind: "admin", time: 30, run: () => {
        CR.spend(s, 30, "admin"); cs.flags.piecesVersees = s.day;
        for (const k of ["releve", "messages", "amf", "recepisse"]) if (!CR.hasDoc(cs, k)) api.doc(k, api.def.docTitles[k]);
        CR.toast(s, "Quatre pièces versées au dossier.", "info"); return null; } });
      PEN.prepPC(api, T, "Préparer Mme Bernard à l'audience");
    },
    on: {
      apresPcpc(api, { ok }) {
        const { s, cs } = api;
        if (ok) { cs.vars.pcpcOk = true; CR.bon(s, cs, { id: "pcpc_ok", texte: "Plainte avec constitution de partie civile déposée après l'expiration des trois mois : recevable (art. 85)." }); }
      },
      pcpcEchec(api, { motif }) {
        const { s, cs } = api;
        cs.vars.pcpcOk = false;
        cs.drafted.pcpc = [];
        api.mail({ from: "Jacqueline Bernard", subject: "Le juge a refusé ?", kind: "email", body: [["Maître, j'ai reçu copie d'une ordonnance. Ma fille dit que la plainte est refusée. Qu'est-ce qu'on fait ?"]] });
        if (/consignation/.test(motif || "")) return;
      },
      consignationVersee(api) {
        const { s, cs } = api;
        api.schedule(R.int(s, 10, 16), "_information");
      },
      _information(api) {
        const { s, cs } = api;
        CR.PROC.stade(api, "information", "Réquisitoire introductif : information ouverte du chef d'escroquerie, Mme Ondine Ferraud désignée.");
        api.mail({ from: "Cabinet de Mme Ferraud, juge d'instruction", subject: "Ouverture d'information — Bernard", kind: "greffe", doc: "ordo_ri", title: "Avis d'ouverture d'information" });
        cs.vars.infoDay = s.day;
        api.schedule(70, "_lenteur");
      },
      reponseActes(api, d) {
        const { s, cs } = api;
        const p = d.picks || [];
        const lines = [];
        if (p.includes("banque")) { cs.vars.banque = true; lines.push("ordonnons des réquisitions bancaires sur le compte de Rolland Patrimoine Conseil"); }
        if (p.includes("audition")) { cs.vars.audition = true; lines.push("ordonnons la comparution de M. Sébastien Rolland"); }
        if (p.includes("telephone")) { cs.vars.vulnDossier = true; lines.push("ordonnons le versement au dossier des messages de la partie civile"); }
        const refus = p.includes("expertise");
        api.mail({ from: "Cabinet de Mme Ferraud, juge d'instruction", subject: "Ordonnance sur demande d'actes", kind: "greffe", important: true, body: [[lines.length ? `Faisant partiellement droit à la demande, ${lines.join(" ; ")}.` : "Rejetons la demande d'actes, insuffisamment motivée."], refus ? ["Rejetons la demande d'expertise psychiatrique de la partie civile, sans utilité pour la manifestation de la vérité."] : [""]] });
        if (cs.vars.banque || cs.vars.audition) { CR.unschedule(s, (e) => e.caseId === cs.id && e.key === "_lenteur"); api.schedule(R.int(s, 18, 26), "_mex"); }
      },
      _lenteur(api) { api.run("_mex"); },
      _mex(api) {
        const { s, cs } = api;
        if (cs.vars.mexFaite) return;
        cs.vars.mexFaite = true;
        if (cs.vars.banque && !CR.hasDoc(cs, "reqbank")) api.doc("reqbank", api.def.docTitles.reqbank);
        api.mail({ from: "Cabinet de Mme Ferraud, juge d'instruction", subject: "Mise en examen de M. Rolland", kind: "greffe", doc: "mex", title: "Mise en examen de M. Rolland" });
        CR.PROC.event(api, `Mise en examen de M. Sébastien Rolland${cs.vars.vulnDossier ? " pour escroquerie aggravée" : ""}.`);
        api.schedule(R.int(s, 28, 38), "_renvoi");
      },
      _renvoi(api) {
        const { s, cs } = api;
        let day = CR.rollForward(s.day + 32);
        while (CR.dow(day) !== 3 || !CR.isBusinessDay(day)) day++;
        CR.PROC.stade(api, "reglement", "Avis de fin d'information (art. 175), puis ordonnance de renvoi devant le tribunal correctionnel.");
        CR.PROC.fixAudience(api, { day, min: 13 * 60 + 30, juridiction: "tc", mode: "ordonnance", convocDay: s.day, president: "pr_dessaint", script: "tc", done: "apresTC", onMiss: "_absent", title: "Audience — 16e chambre correctionnelle", duree: 75 });
        cs.proc.pcConstituee = true;
        api.mail({ from: "Greffe correctionnel", subject: "Ordonnance de renvoi — audience", kind: "greffe", important: true, body: [[`Par ordonnance du juge d'instruction, M. Sébastien Rolland est renvoyé devant le tribunal correctionnel. Audience le ${CR.fmtDate(day, "dow")} à 13 h 30, 16e chambre.`], ["La partie civile constituée devant le juge d'instruction l'est aussi devant le tribunal ; elle chiffrera ses demandes."]] });
      },
      citationDelivree(api, { ctrl }) {
        const { s, cs } = api;
        const C = cs.vars.citation;
        cs.vars.citationDirecte = true;
        cs.vars.consignation = { montant: 1000, due: CR.rollForward(C.audienceDay - 2), paid: false };
        api.oblig({ id: "consignation", label: "Verser la consignation", due: cs.vars.consignation.due, onMiss: "_consignationCitation" });
        api.mail({ from: "Greffe correctionnel", subject: "Consignation — citation directe", kind: "greffe", important: true, body: [["La partie civile qui cite directement consigne une somme garantissant le paiement d'une éventuelle amende civile (art. 392-1)."], [`Montant fixé : ${CR.money(1000)}, à verser avant l'audience, sous peine d'irrecevabilité.`]] });
        CR.PROC.fixAudience(api, { day: C.audienceDay, min: 13 * 60 + 30, juridiction: "tc", mode: "citation", convocDay: s.day, president: "pr_dessaint", script: "tc", done: "apresTC", onMiss: "_absent", title: "Audience — 16e chambre (citation directe)", duree: 75 });
        if (ctrl.sanction === "citation_courte") CR.erreur(s, cs, { id: "citation_courte", texte: "La citation a été délivrée moins de quinze jours avant l'audience (art. 552).", sanction: "Renvoi de droit si le prévenu le demande.", regul: "Citer plus tôt." });
      },
      _consignationCitation(api) {
        const { s, cs } = api;
        if (cs.vars.consignation && cs.vars.consignation.paid) return;
        CR.erreur(s, cs, { id: "consignation", texte: "La consignation de la citation directe n'a pas été versée.", sanction: "Citation irrecevable (art. 392-1).", regul: "Citer à nouveau et consigner, ou déposer une plainte avec constitution de partie civile." });
        cs.proc.audience = null;
        for (const h of cs.hearings) if (!h.attended) h.canceled = true;
        cs.vars.citation = null; cs.vars.dateAudiencement = null; cs.vars.citationDirecte = false; cs.drafted.citation = [];
      },
      _absent(api) {
        const { s, cs } = api;
        CR.erreur(s, cs, { id: "absent", texte: "Vous n'étiez pas à l'audience.", sanction: "Les demandes de Mme Bernard n'ont pas été soutenues.", regul: "Aucune." });
        CR.closeCase(s, cs, { type: "done", detail: "audience sans l'avocat de la partie civile" });
      },
      decider(api, { st }) {
        const { s, cs } = api;
        const pl = st.played;
        const directe = !!cs.vars.citationDirecte;
        const pieces = {
          virements: { label: "Les trois virements", sens: "charge", force: 0.15 },
          declarations: { label: "Les déclarations de Mme Bernard", sens: "charge", force: 0.12 },
        };
        if (CR.hasDoc(cs, "messages") || pl.has("A5_age")) pieces.messages = { label: "Les messages de M. Rolland", sens: "charge", force: 0.18 };
        if (CR.hasDoc(cs, "amf") || pl.has("A5_amf")) pieces.amf = { label: "L'inscription sur la liste noire de l'AMF", sens: "charge", force: 0.08 };
        if (cs.vars.banque) pieces.flux = { label: "Les réquisitions bancaires : fonds détournés vers ses comptes", sens: "charge", force: 0.35 };
        if (cs.vars.mexFaite) pieces.aveu = { label: "M. Rolland reconnaît des « difficultés »", sens: "charge", force: 0.08 };
        pieces.souscription = { label: "Le bulletin de souscription signé, plaidé par la défense", sens: "decharge", force: directe ? 0.12 : 0.05, need: ["arg:souscription"] };
        pl.add("arg:souscription");
        const vuln = (pl.has("arg:vulnerabilite") && (CR.hasFact(cs, "A5_age") || CR.hasFact(cs, "A5_isoler"))) || cs.vars.vulnDossier;
        const picks = (cs.vars.chiffrage && cs.vars.chiffrage.postes) || [];
        const autres = (cs.vars.chiffrage && cs.vars.chiffrage.autres) || [];
        const dec = PEN.juger(api, {
          st, juridiction: "tc", titre: "Jugement correctionnel", prevenuNom: "Sébastien Rolland", pcNom: "Mme Jacqueline Bernard", pcF: true,
          spec: { seuil: 0.55, pieces },
          qualif: () => vuln
            ? { id: "313-2", label: "escroquerie commise au préjudice d'une personne dont la particulière vulnérabilité, due à son âge, était connue de son auteur", court: "art. 313-1 et 313-2 CP", encourue: { prison: 84, amende: 750000 }, requis: Object.assign({}, cs.vars.requis, { ferme: 12, sursis: 12 }), motif: "Les messages adressés à la victime (« à votre âge », « ne dites rien à vos enfants ») établissent que le prévenu connaissait sa vulnérabilité (art. 313-2)." }
            : { id: "313-1", label: "escroquerie", court: "art. 313-1 CP", encourue: { prison: 60, amende: 375000 }, requis: cs.vars.requis, motif: "Les manœuvres frauduleuses — fausse société, rendement garanti, apparence d'un professionnel autorisé — ont déterminé la remise des fonds (art. 313-1)." },
          personnalite: 1,
          civil: { postes: POSTES.filter((p) => picks.includes(p.id)), art475: autres.includes("art475") ? 2000 : 0 },
        });
        if (!dec.coupable && directe) {
          const dommages = 1500;
          cs.vars.art472 = dommages;
          dec.questions.push({ q: "Sur la demande du prévenu relaxé (art. 472)", r: `La partie civile, qui a mis l'action publique en mouvement par une citation téméraire, est condamnée à payer ${CR.money(dommages)} de dommages-intérêts au prévenu.`, motif: "La citation reposait sur un dossier dépourvu de toute investigation sur la destination des fonds." });
          dec.dispositif += ` Condamne Mme Bernard à payer ${CR.money(dommages)} à M. Rolland (art. 472).`;
        }
        return dec;
      },
      apresTC(api, res) {
        const { s, cs } = api;
        const dec = res.decision || {};
        if (cs.vars.art472) { CR.erreur(s, cs, { id: "art472", texte: "La citation directe, sans investigation sur les flux, a abouti à une relaxe.", sanction: `Mme Bernard est condamnée à verser ${CR.money(cs.vars.art472)} au prévenu (art. 472) ; l'action publique est jugée.`, regul: "Aucune : il fallait passer par le juge d'instruction." }); api.trust(-25); }
        CR.closeCase(s, cs, PEN.issue(api, dec));
      },
    },
    audiences: {
      tc(api) {
        const { cs } = api;
        return {
          title: "16e chambre correctionnelle", sub: "Tribunal judiciaire de Paris", decor: { scene: "salle" },
          steps: AUD.jugement(api, {
            prevenu: ROLLAND, victime: BERNARD, victimeAvocat: `Me ${api.s.player.nom}`,
            prevention: `Vous êtes prévenu d'avoir, à Paris et sur le territoire national, entre juillet et août 2026, par l'usage d'une fausse qualité et de manœuvres frauduleuses, trompé Mme Jacqueline Bernard et l'avoir déterminée à remettre des fonds, en l'espèce 18 000 euros. Article 313-1 du code pénal.`,
            exceptionAdverse: "Aucune, monsieur le président.",
            instruction: [
              { who: "president", t: "Monsieur Rolland, vous avez reçu 18 000 euros de Mme Bernard. Où sont-ils ?" },
              { who: "prevenu", name: "Sébastien Rolland", t: "C'était un placement. Il y avait des risques, Mme Bernard le savait. Elle a signé un bulletin de souscription." },
              { who: "president", t: "Madame Bernard ?" },
              { if: () => !!cs.flags.prepClient, then: [{ who: "client", t: "Il m'avait dit « garanti ». Il m'appelait tous les jours. Il m'a dit de ne rien dire à mes enfants.", signal: "bon" }], else: [{ who: "client", t: "Je ne sais plus… J'ai signé quelque chose, oui. Je suis désolée.", fx: { cred: -2 } }] },
            ],
            questions: { prompt: "Questions au prévenu (art. 442-1)", who: "prevenu", name: "Sébastien Rolland", max: 2, options: [
              { id: "q_garanti", t: "Monsieur Rolland, vous avez écrit « rendement garanti de 8 %, sans aucun risque ». Où est le risque ?", need: "A5_garanti", a: "C'était… une formule commerciale.", fx: { play: ["A5_garanti"] }, signal: "bon" },
              { id: "q_enfants", t: "Pourquoi lui demander de ne rien dire à ses enfants ?", need: "A5_isoler", a: "Je… pour ne pas l'inquiéter.", fx: { play: ["A5_isoler"] }, signal: "bon" },
              { id: "q_amf", t: "Saviez-vous que votre site figure sur la liste noire de l'AMF ?", need: "A5_amf", a: "Je n'ai jamais rien reçu de l'AMF.", fx: { play: ["A5_amf"] }, signal: "neutre" },
            ] },
            pc: { max: 4, args: [
              { id: "manoeuvres", label: "Les manœuvres : fausse société, rendement garanti, liste noire de l'AMF", say: "Une société radiée, un site sur la liste noire de l'AMF, un « rendement garanti » : ce ne sont pas des risques, ce sont des manœuvres frauduleuses.", cards: ["A5_garanti", "A5_radiee", "A5_amf", "A5_amf_doc"] },
              { id: "vulnerabilite", label: "La vulnérabilité connue : « à votre âge », « ne dites rien à vos enfants »", say: "« À votre âge », « ne dites rien à vos enfants » : il savait à qui il parlait. C'est l'article 313-2.", cards: ["A5_age", "A5_isoler", "CP_313-2"] },
              { id: "flux", label: "L'argent viré sur ses comptes personnels en quarante-huit heures", say: "Les réquisitions bancaires montrent que l'argent a quitté la société pour ses comptes personnels en quarante-huit heures.", cards: ["A5_flux"] },
              { id: "prejudice", label: "Le préjudice : 18 000 euros d'économies d'une vie", say: "Dix-huit mille euros, les économies d'une institutrice : les relevés le prouvent.", cards: ["A5_virements_doc", "A5_virements"] },
              { id: "art475", label: "Les frais d'avocat (art. 475-1)", say: "Je demande enfin une somme au titre de l'article 475-1.", cards: ["CPP_475-1"] },
              { id: "prison", label: "Réclamer une lourde peine de prison", say: "Je demande qu'il aille en prison.", pertinent: () => false },
            ] },
            requis: { base: { sursis: 18, sursisType: "probatoire", complementaires: ["obligation d'indemniser la victime"] }, avant: ["Un démarchage organisé, ciblant une personne âgée. Je requiers une peine avec sursis probatoire et l'obligation d'indemniser."] },
            defenseAdverse: ["Monsieur le président, un placement qui tourne mal n'est pas une escroquerie. Mme Bernard a signé, elle a été informée.", "Aucune manœuvre n'est démontrée. Je demande la relaxe."],
            dernierMotAdverse: "Je voulais rembourser. Je rembourserai.",
          }),
        };
      },
    },
    debrief(api, o) {
      const { cs } = api;
      const items = [{ kind: "rule", text: "En matière délictuelle, la plainte avec constitution de partie civile n'est recevable qu'après une plainte simple restée trois mois sans réponse, ou classée (art. 85) ; la consignation fixée doit être versée dans le délai (art. 88)." }];
      if (cs.erreurs.some((e) => e.id === "pcpc_irrecevable")) items.push({ kind: "info", text: "Une plainte avec constitution déposée trop tôt est irrecevable, mais l'erreur se régularise : il suffit d'attendre la fin des trois mois et de la déposer à nouveau." });
      if (cs.vars.citationDirecte) items.push({ kind: "info", text: "En citation directe, aucune investigation : la partie civile apporte seule la preuve, et répond d'une citation téméraire (art. 472)." });
      if (cs.vars.banque) items.push({ kind: "good", text: "Les réquisitions bancaires demandées au juge ont montré la destination des fonds." });
      return items.concat(cs.vars.debriefJugement || []);
    },
    epilogue(api, o) {
      if (o.type === "indemnise") return "M. Rolland a été condamné à rembourser ; il verse 300 euros par mois. Mme Bernard a raconté son histoire au club de son quartier, pour que d'autres ne tombent pas dans le piège.";
      if (o.type === "deboute") return "M. Rolland a été relaxé. Mme Bernard n'a rien récupéré ; sa fille gère désormais ses comptes.";
      return "Mme Bernard attend toujours. Elle a cessé de répondre aux numéros inconnus.";
    },
    fiche(api, o) {
      return {
        phrase: "Escroquerie au faux placement, plainte avec constitution de partie civile, avocat de la victime, Mme Bernard.",
        notions: [
          { titre: "La condition des trois mois", regle: "En matière délictuelle, la plainte avec constitution de partie civile suppose une plainte simple préalable restée sans réponse trois mois, ou classée ; la prescription est suspendue pendant ce délai au profit de la victime.", art: "art. 85 CPP ; Crim. 23 juin 2026", prog: "pp_action" },
          { titre: "La consignation", regle: "Le doyen fixe une consignation selon les ressources de la partie civile ; à défaut de versement dans le délai, la plainte est irrecevable.", art: "art. 88 CPP", prog: "pp_action" },
          { titre: "L'escroquerie aggravée", regle: "Escroquerie : cinq ans ; sept ans si la particulière vulnérabilité de la victime, due notamment à son âge, est apparente ou connue de l'auteur.", art: "art. 313-1 et 313-2 CP", prog: "dps" },
        ],
        piege: "Une citation directe sur un dossier sans investigation expose à la relaxe et aux dommages-intérêts de l'article 472.",
        devenir: api.def.epilogue(api, o),
      };
    },
    corrige() {
      return [
        { probleme: "Quelle infraction ?", regle: "Escroquerie : tromper par une fausse qualité ou des manœuvres frauduleuses pour déterminer une remise (art. 313-1, cinq ans) ; sept ans si la vulnérabilité de la victime est apparente ou connue (art. 313-2).", application: "Fausse société, rendement « garanti », site sur la liste noire de l'AMF ; « à votre âge » et « ne dites rien à vos enfants » montrent qu'il connaissait sa vulnérabilité." },
        { probleme: "Plainte avec constitution ou citation directe ?", regle: "Plainte avec constitution après trois mois de silence du parquet (art. 85), consignation (art. 88), amende civile si elle est abusive (art. 177-2). Citation directe : consignation (art. 392-1), quinze jours de délai (art. 552), dommages-intérêts au prévenu relaxé (art. 472).", application: "Sans investigation sur les flux, le dossier est faible : l'instruction permet les réquisitions bancaires et la mise en examen." },
        { probleme: "La prescription menace-t-elle ?", regle: "Six ans pour un délit ; la prescription est suspendue au profit de la victime entre la plainte simple et la réponse du parquet, trois mois au plus (Crim. 23 juin 2026, n° 25-87.950).", application: "Faits de l'été 2026 : aucune urgence de prescription, mais une urgence pour les fonds." },
      ];
    },
  });
})();
