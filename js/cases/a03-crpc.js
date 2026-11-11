/* Affaire 3 — Le contrôle de 2 h du matin.
   Défense. Conduite sous l'empire d'un état alcoolique, comparution sur reconnaissance préalable de culpabilité.
   Anomalie : le procès-verbal ne mentionne pas la dernière vérification périodique de l'éthylomètre
   (effet exact : jurisprudence à vérifier avant saisie ; le jeu la traite comme une nullité à grief à prouver). */
(function () {
  const CR = window.CR;
  const R = CR.R;
  const PEN = CR.PEN;
  const AUD = CR.AUD;
  const CLAIRE = { prenom: "Claire", nom: "Morin", g: "f", age: 45, metier: "infirmière de nuit", tel: "06 33 70 12 58", trust: 55, look: { skin: 1, hair: "bob", hc: "auburn", glasses: 1 }, naissance: "le 17 mai 1981 à Lille", adresse: "rue Hoche, à Pantin" };
  const DEF = "a03_crpc";
  const EAD = "interdiction pendant six mois de conduire un véhicule non équipé d'un éthylotest antidémarrage";
  const SUSP = "six mois de suspension du permis de conduire";
  const STAGE = "stage de sensibilisation à la sécurité routière à ses frais";

  function proposer(api, base) {
    const { cs } = api;
    const p = Object.assign({ sursis: 4, complementaires: [SUSP, STAGE] }, base || {});
    p.texte = CR.PROC.peineTexte({ ferme: 0, sursis: p.sursis, sursisType: "simple", amende: p.amende || 0, complementaires: p.complementaires });
    cs.vars.proposition = p;
    return p;
  }
  const homologation = (api) => [
    { who: "sys", t: "(Une heure plus tard, une petite salle d'audience. Le juge de l'homologation a le dossier ouvert devant lui.)" },
    { who: "president", t: "Madame Morin, je suis le juge de l'homologation. Reconnaissez-vous les faits qui vous sont reprochés ? Acceptez-vous la peine proposée par le procureur de la République ?" },
    { who: "client", t: "Oui." },
    { who: "president", t: "Maître, des observations ?" },
    { choose: [
      { t: "« Aucune observation. »" },
      { t: "« Ma cliente est infirmière de nuit, sans antécédent : la peine proposée lui permet de garder son emploi. »", need: "A3_nuit", fx: { cred: 1 } },
    ] },
    { do: (a) => a.run("homologuer") },
  ];
  const refus = (api) => [
    { who: "client", t: "Je refuse." },
    { who: "parquet", t: "C'est noté. Le procureur saisira le tribunal correctionnel. Rien de ce que vous avez dit ce matin ne pourra être utilisé contre vous (art. 495-14)." },
    { fx: { csFlags: { crpcRefusee: true } } },
    { end: true },
  ];

  CR.defineCase({
    id: DEF, camp: "defense", domaine: "tc", domaineLib: "dps",
    title: "Morin — le contrôle de 2 h du matin",
    arrive: { day: 4, min: 11 * 60 + 5 },
    client: CLAIRE, leadPatience: 4,
    voicemail: "Bonjour maître, Claire Morin. J'ai été arrêtée en voiture après mon service, avec un peu d'alcool. J'ai reçu une convocation pour une procédure… de reconnaissance de culpabilité. Je suis infirmière, j'ai besoin de mon permis. Pouvez-vous me rappeler ?",
    profile: { wealth: 3, sens: 0.5, urgency: 0.6, temper: "anxieux" },
    honoraires: { forfait: 1100, heures: 6, types: ["forfait", "temps"], resultat: "maintien du permis de conduire", intro: "Elle sort d'une nuit de garde ; elle a gardé sa blouse sous son manteau." },
    mission: "Assistance de Mme Morin dans la procédure de comparution sur reconnaissance préalable de culpabilité et, en cas de refus, devant le tribunal correctionnel, jusqu'à la décision de première instance.",
    actors: { parquet: "pq_delahaye", president: "pr_benkirane" },
    proc: { stade: "crpc", voie: "crpc", nature: "delit", faits: -6, infractions: ["CR_L234-1"] },
    init(api, cs) {
      cs.vars.crpcDay = CR.rollForward(cs.vars.base + 18);
      while (CR.dow(cs.vars.crpcDay) === 1) cs.vars.crpcDay = CR.nextBusinessDay(cs.vars.crpcDay);
    },
    vars: (s, cs) => ({ crpcDow: cs.vars.crpcDay != null ? CR.fmtDate(cs.vars.crpcDay, "dowshort") : "…", faitsDate: cs.proc ? CR.fmtDate(cs.proc.faitsDay, "dowshort") : "" }),
    facts: {
      A3_convoc: { label: "La date de la convocation en CRPC", key: true, why: "L'avocat est obligatoire en CRPC : sans vous, pas de proposition." },
      A3_taux: { label: "Le taux de 0,52 mg/l", key: true, why: "Au-dessus de 0,40 mg/l d'air expiré, c'est un délit (art. L. 234-1)." },
      A3_nuit: { label: "Infirmière de nuit, la voiture indispensable", key: true, why: "L'argument qui fait changer la peine complémentaire." },
      A3_casier: { label: "Aucun antécédent" },
      A3_ethylo_pv: { label: "Le PV de mesure ne mentionne aucune vérification périodique", key: true, why: "La faiblesse du dossier : un levier pour négocier, ou un moyen à soulever devant le tribunal." },
    },
    calls: {
      intake: {
        opening: ["Bonjour maître. Claire Morin. J'ai été arrêtée en voiture, il y a une semaine, après mon service. Un contrôle d'alcoolémie."],
        topics: [
          { id: "c_quand", q: "Racontez-moi le contrôle.", a: [{ t: "{faitsDate}, vers 2 h 10, boulevard de la Chapelle. Je rentrais chez moi, à Pantin.", f: "A3_heure" }, { t: "Ils m'ont fait souffler, puis au commissariat, l'éthylomètre : 0,52.", f: "A3_taux" }], cost: 4, unlock: ["c_verres", "c_mesures"] },
          { id: "c_verres", q: "Qu'aviez-vous bu ?", a: [{ t: "Deux verres de vin au pot de départ d'une collègue, après mon service du soir. Je me sentais bien.", f: "A3_verres" }], cost: 2 },
          { id: "c_mesures", q: "Combien de fois avez-vous soufflé dans l'éthylomètre ? On vous a montré quelque chose ?", a: [{ t: "Deux fois. Ils m'ont montré le ticket, 0,54 puis 0,52.", f: "A3_deux_mesures" }, "Personne ne m'a parlé de l'appareil."], cost: 2 },
          { id: "c_convoc", q: "Qu'y a-t-il exactement sur votre convocation ?", a: [{ t: "« Comparution sur reconnaissance préalable de culpabilité », {crpcDow}, à 9 h 30, au tribunal.", f: "A3_convoc" }, "Il est écrit que l'avocat est obligatoire."], cost: 2 },
          { id: "c_travail", q: "Pourquoi le permis est-il si important pour vous ?", a: [{ t: "Je suis infirmière de nuit à Lariboisière. Je commence à 21 heures et je finis à 7 heures.", f: "A3_nuit" }, { t: "De Pantin, la nuit, il n'y a rien. Sans voiture, je perds mon poste.", f: "A3_transports" }], cost: 3 },
          { id: "c_casier", q: "Avez-vous déjà été condamnée, ou contrôlée ?", a: [{ t: "Jamais. Pas même un excès de vitesse.", f: "A3_casier" }], cost: 2 },
          { id: "c_alcool", q: "L'alcool, c'est un sujet pour vous ?", a: ["Non… Enfin, après les nuits difficiles, un verre pour décompresser. Je pourrais en parler à quelqu'un, si ça aide.", { t: "Je veux bien voir un addictologue, si c'est utile.", f: "A3_addicto_dit" }], cost: 3 },
          { id: "c_bad", q: "Ne vous inquiétez pas : avec un bon avocat, on garde toujours son permis.", a: ["Ah, tant mieux…"], cost: 1, tag: "bad", fx: { flags: { promesse: true } } },
        ],
        start: ["c_quand", "c_convoc", "c_travail", "c_casier", "c_alcool", "c_bad"],
        patience: 90,
        close: "Merci. Vous serez là avec moi, le jour de la convocation ?",
      },
    },
    advice: [
      { id: "a3_ne_pas_conduire", t: "Ne reprenez pas le volant après avoir bu, même un verre : une récidive changerait tout." },
      { id: "a3_attestation", t: "Demandez à votre cadre de santé une attestation de vos horaires de nuit." },
      { id: "a3_rien_signer", t: "Ne signez rien avant la convocation sans m'en parler." },
      { id: "a3_contester", t: "On va dire que l'éthylomètre était faux, on gagnera." },
    ],
    docs: {
      convocation: (x) => ({ title: "Convocation en vue d'une comparution sur reconnaissance préalable de culpabilité", kind: "greffe", entete: ["Tribunal judiciaire de Paris · Parquet", "Articles 495-7 et suivants du code de procédure pénale"], paras: [[`Mme Claire Morin est convoquée le ${CR.fmtDate(x.cs.vars.crpcDay, "dow")} à 9 h 30, bureau des CRPC, pour se voir proposer une ou plusieurs peines par le procureur de la République.`], ["L'assistance d'un avocat est obligatoire ; la personne peut bénéficier de l'aide juridictionnelle."]] }),
      pv_controle: (x) => ({ title: "Procès-verbal de dépistage", kind: "pv", entete: ["Commissariat central du 18e · Unité de voie publique", "Cote D1"], paras: [[`Le ${CR.fmtDate(x.cs.proc.faitsDay, "long")} à 2 h 10, boulevard de la Chapelle, contrôle préventif. Dépistage de l'imprégnation alcoolique par éthylotest : positif.`], [{ t: "La conductrice a l'haleine sentant l'alcool ; propos cohérents, démarche assurée, pas de signe d'ivresse manifeste.", f: "A3_pas_ivresse" }], ["Conduite au commissariat pour vérification par éthylomètre."]], signed: "Gardiens de la paix Morel et Fofana" }),
      pv_mesure: (x) => ({ title: "Procès-verbal de vérification de l'état alcoolique", kind: "pv", entete: ["Commissariat central du 18e", "Cote D2"], paras: [
        ["Vérification par éthylomètre de marque Dräger, modèle 7110 FP."],
        [{ t: "Appareil homologué, numéro de série ARCA-0157.", f: "A3_ethylo_pv", flag: "ethylo" }],
        [{ t: "Première mesure à 2 h 25 : 0,54 mg/l d'air expiré. Seconde mesure à 2 h 32 : 0,52 mg/l. Retenons la mesure la plus favorable : 0,52 mg/l.", f: "A3_mesures" }],
        ["Notifions à l'intéressée le résultat et son droit à une seconde vérification, qu'elle a exercé."],
      ], signed: "Lieutenant Gaëlle Perrin, OPJ" }),
      pv_audition: () => ({ title: "Procès-verbal d'audition libre", kind: "pv", entete: ["Commissariat central du 18e", "Cote D4"], paras: [["J'ai bu deux verres de vin au pot de départ d'une collègue, entre minuit et une heure. Je me sentais capable de conduire. Je regrette."]], signed: "Lu, persiste et signe." }),
      casier: () => ({ title: "Bulletin n° 1 du casier judiciaire", kind: "greffe", entete: ["Casier judiciaire national"], paras: [["Claire Morin, née le 17 mai 1981 à Lille."], [{ t: "Néant.", f: "A3_casier_b1" }]] }),
      copj: (x) => ({ title: "Convocation devant le tribunal correctionnel", kind: "greffe", entete: ["Tribunal judiciaire de Paris · Parquet", "Article 495-12 et 390-1 du code de procédure pénale"], paras: [["La proposition de peine ayant été refusée, Mme Claire Morin est convoquée devant le tribunal correctionnel :"], [{ t: `le ${CR.fmtDate(x.cs.proc.audience.day, "dow")} à 13 h 30, 10e chambre.`, f: "A3_audience_tc" }], ["Pour conduite d'un véhicule sous l'empire d'un état alcoolique caractérisé par une concentration d'alcool de 0,52 mg par litre d'air expiré (art. L. 234-1 du code de la route)."]] }),
    },
    docTitles: { convocation: "Convocation en CRPC", pv_controle: "PV de dépistage (D1)", pv_mesure: "PV de mesure (D2)", pv_audition: "Audition libre (D4)", casier: "Casier judiciaire", copj: "Convocation devant le tribunal" },
    anomalies: { ethylo: { irreg: "ethylometre_verif", piece: "pv_mesure", annule: ["pv_mesure"], force: 0.75 } },
    penal: { no: ["actes", "copie", "requete"] },
    flow: { tasks: PEN.tasks },
    tasks(api, T) {
      const { s, cs } = api;
      if (!cs.flags.dossierConsulte && !cs.flags.crpcRefusee) T({ id: "dossier", label: "Consulter le dossier au parquet", sub: "Les procès-verbaux de dépistage et de mesure, l'audition, le casier.", kind: "admin", time: 30, where: "palais", run: () => {
        CR.spend(s, 30, "admin"); cs.flags.dossierConsulte = s.day;
        for (const k of ["pv_controle", "pv_mesure", "pv_audition", "casier"]) if (!CR.hasDoc(cs, k)) api.doc(k, api.def.docTitles[k]);
        api.tl("Dossier consulté au parquet."); CR.toast(s, "Quatre pièces versées à votre dossier.", "info"); return null; } });
      PEN.persoTasks(api, T, [
        { id: "attest", label: "Obtenir l'attestation de l'employeur", sub: "Horaires de nuit, absence de transports, importance du poste.", fact: "A3_attest", text: "Attestation de la cadre de santé de Lariboisière : Mme Morin travaille de 21 h à 7 h, quatre nuits par semaine ; son poste suppose un véhicule.", time: 20 },
        { id: "addicto", label: "Orienter Claire vers une consultation d'addictologie", sub: "Une démarche volontaire, avant l'audience.", fact: "A3_addicto", text: "Attestation de première consultation au centre d'addictologie de l'hôpital Fernand-Widal.", time: 20, cond: () => CR.hasFact(cs, "A3_addicto_dit") },
      ]);
      if (!cs.flags.crpcRefusee && !cs.flags.prepClient && cs.vars.crpcDay >= s.day) T({ id: "prep", label: "Préparer Claire à la CRPC", sub: "Ce que dira le procureur, ce qu'on peut négocier, le délai de réflexion, le refus.", kind: "meet", time: 45, run: () => { CR.spend(s, 45, "meet"); cs.flags.prepClient = s.day; CR.updatedClient(s, cs, 1.5); return null; } });
    },
    on: {
      engaged(api) {
        const { s, cs } = api;
        api.mail({ from: "Claire Morin", subject: "Ma convocation", kind: "email", doc: "convocation", title: "Convocation en CRPC", body: [["Bonjour maître, voici la convocation. Merci de m'accompagner."]] });
        if (!cs.vars.crpcFixe) {
          cs.vars.crpcFixe = true;
          api.hearing({ day: cs.vars.crpcDay, min: 9 * 60 + 30, title: "CRPC — bureau du procureur", where: "Tribunal judiciaire de Paris, parquet", lieu: "palais", script: "crpc", done: "apresCRPC", onMiss: "_absentCRPC", duree: 60 });
          cs.proc.audience = { day: cs.vars.crpcDay, min: 570, juridiction: "crpc", convocDay: s.day, mode: "crpc" };
        }
      },
      _absentCRPC(api) {
        const { s, cs } = api;
        CR.erreur(s, cs, { id: "crpc_absent", texte: "Vous n'étiez pas à la convocation en CRPC.", sanction: "Sans avocat, la proposition ne peut pas être faite : le procureur saisit le tribunal correctionnel.", regul: "Préparer l'audience correctionnelle." });
        cs.flags.crpcRefusee = true;
        api.trust(-20);
        api.run("_versTribunal");
      },
      contreProposition(api, { st }) {
        const { s, cs } = api;
        const pl = st.played;
        const pq = api.profil("parquet") || CR.PROFILS.deborde;
        let ead = pl.has("arg:ead") && (pl.has("A3_nuit") || pl.has("A3_attest") || pl.has("arg:emploi"));
        let sursis = 4;
        if (pl.has("arg:casier")) sursis -= 1;
        if (pl.has("arg:addicto")) sursis -= 1;
        if (pl.has("arg:ethylo")) sursis -= 1;
        if (R.next(s) > pq.alternative + 0.4) ead = false;
        const p = proposer(api, { sursis: Math.max(2, sursis), complementaires: ead ? [EAD, STAGE] : [SUSP, STAGE] });
        const lines = [];
        if (pl.has("arg:ethylo")) lines.push({ who: "parquet", t: "La vérification de l'éthylomètre ? Je ne vais pas en débattre ici, maître. Si vous contestez la mesure, refusez, et plaidez-le devant le tribunal." });
        if (pl.has("arg:prison")) lines.push({ who: "parquet", t: "Maître, je ne propose aucun emprisonnement ferme. De quoi parlez-vous ?" });
        lines.push({ who: "parquet", t: ead ? `Bien. Je modifie ma proposition : ${p.texte.replace(/^./, (c) => c.toLowerCase())}. Elle gardera sa voiture, avec un éthylotest antidémarrage.` : `Je maintiens l'essentiel : ${p.texte.replace(/^./, (c) => c.toLowerCase())}.` });
        if (ead) CR.bon(s, cs, { id: "ead", texte: "Vous avez obtenu une interdiction de conduire sans éthylotest antidémarrage à la place de la suspension : Claire garde son emploi." });
        return lines;
      },
      homologuer(api) {
        const { s, cs } = api;
        const p = cs.vars.proposition;
        cs.vars.homologue = true;
        cs.vars.peine = { texte: p.texte };
        CR.PROC.event(api, `Ordonnance d'homologation : ${p.texte.toLowerCase()}.`);
        return [{ who: "president", t: `J'homologue la proposition : ${p.texte.replace(/^./, (c) => c.toLowerCase())}. L'ordonnance a les effets d'un jugement de condamnation ; elle est immédiatement exécutoire.` }];
      },
      apresCRPC(api, res) {
        const { s, cs } = api;
        if (cs.vars.homologue) { CR.closeCase(s, cs, { type: "crpc", detail: cs.vars.proposition.texte }); return; }
        if (cs.flags.reflexion && !cs.vars.reflexionFixee) {
          cs.vars.reflexionFixee = true;
          const d = CR.rollForward(s.day + 10);
          api.hearing({ day: d, min: 9 * 60 + 30, title: "CRPC — réponse à la proposition", where: "Tribunal judiciaire de Paris, parquet", lieu: "palais", script: "crpc_retour", done: "apresCRPC", onMiss: "_absentCRPC", duree: 45 });
          cs.proc.audience = { day: d, min: 570, juridiction: "crpc", convocDay: s.day, mode: "crpc" };
          api.tl(`Délai de réflexion de dix jours : retour le ${CR.fmtDate(d, "dow")}.`);
          return;
        }
        if (cs.flags.crpcRefusee) api.run("_versTribunal");
      },
      _versTribunal(api) {
        const { s, cs } = api;
        if (cs.vars.copjEnvoyee) return;
        cs.vars.copjEnvoyee = true;
        api.schedule(R.int(s, 8, 14), "_copj");
      },
      _copj(api) {
        const { s, cs } = api;
        let day = CR.rollForward(s.day + 35);
        while (CR.dow(day) !== 4 || !CR.isBusinessDay(day)) day++;
        CR.PROC.fixAudience(api, { day, min: 13 * 60 + 30, juridiction: "tc", mode: "convocation", convocDay: s.day, president: "pr_aubriot", script: "tc", done: "apresTC", onMiss: "_absentTC", title: "Audience — 10e chambre correctionnelle", duree: 60 });
        CR.PROC.stade(api, "convocation", "Après le refus de la CRPC, convocation devant le tribunal correctionnel (art. 495-12).");
        api.mail({ from: "Claire Morin", subject: "J'ai reçu une convocation au tribunal", kind: "email", doc: "copj", title: "Convocation devant le tribunal", body: [["Maître, la police m'a remis cette convocation. C'est grave ?"]] });
        if (!cs.flags.dossierConsulte) for (const k of ["pv_controle", "pv_mesure", "pv_audition", "casier"]) if (!CR.hasDoc(cs, k)) api.doc(k, api.def.docTitles[k]);
      },
      _absentTC(api) {
        const { s, cs } = api;
        CR.erreur(s, cs, { id: "tc_absent", texte: "Vous n'étiez pas à l'audience.", sanction: "Claire a été jugée seule ; vos conclusions n'ont pas été soutenues.", regul: "Faire appel dans les dix jours." });
        CR.closeCase(s, cs, { type: "condamnation", detail: "jugée sans avocat" });
      },
      decider(api, { st }) {
        const { cs } = api;
        const ead = st.played.has("arg:ead") && (st.played.has("A3_attest") || st.played.has("A3_nuit"));
        const perso = ["A3_attest", "A3_addicto", "A3_casier_b1"].filter((f) => CR.hasFact(cs, f)).length + (st.dernierMot === "regrets" ? 1 : 0);
        return PEN.juger(api, {
          st, juridiction: "tc", titre: "Jugement correctionnel", prevenuNom: "Claire Morin",
          spec: { seuil: 0.55, pieces: {
            pv_mesure: { label: "La mesure par éthylomètre (0,52 mg/l)", sens: "charge", force: 0.75 },
            depistage: { label: "Le dépistage positif", sens: "charge", force: 0.08 },
            audition: { label: "Ses déclarations en audition libre (deux verres)", sens: "charge", force: 0.06 },
            sobre: { label: "Aucun signe d'ivresse manifeste au procès-verbal", sens: "decharge", force: 0.05, need: ["A3_pas_ivresse", "arg:ivresse"] },
          } },
          qualif: () => ({ id: "cea", label: "conduite sous l'empire d'un état alcoolique", court: "art. L. 234-1 C. route", encourue: { prison: 24, amende: 4500 }, requis: Object.assign({}, cs.vars.requis, { complementaires: [ead ? EAD : SUSP, STAGE] }), motif: "La mesure de 0,52 mg/l, au-delà du seuil délictuel de 0,40 mg/l, établit l'infraction (art. L. 234-1)." }),
          personnalite: perso,
        });
      },
      apresTC(api, res) {
        const { s, cs } = api;
        CR.closeCase(s, cs, PEN.issue(api, res.decision || {}));
      },
    },
    audiences: {
      crpc(api) { return crpcScript(api, false); },
      crpc_retour(api) { return crpcScript(api, true); },
      tc(api) {
        const { cs } = api;
        return {
          title: "10e chambre correctionnelle", sub: "Tribunal judiciaire de Paris", decor: { scene: "salle" },
          steps: AUD.jugement(api, {
            prevenu: CLAIRE, prevention: `Vous êtes prévenue d'avoir, à Paris 18e, le ${CR.fmtDate(cs.proc.faitsDay, "long")}, conduit un véhicule sous l'empire d'un état alcoolique caractérisé par une concentration d'alcool de 0,52 milligramme par litre d'air expiré. Article L. 234-1 du code de la route.`,
            instruction: [
              { who: "president", t: "Contrôle à 2 h 10, boulevard de la Chapelle. Éthylomètre : 0,52. Madame, vous reconnaissez ?" },
              { if: () => !!cs.flags.prepClient, then: [{ who: "client", t: "J'ai bu deux verres. Je n'aurais pas dû prendre le volant. Je suis infirmière de nuit ; j'ai commencé à voir un addictologue.", signal: "bon" }], else: [{ who: "client", t: "Deux verres, ce n'est rien, tout le monde fait ça.", fx: { cred: -3 }, signal: "mauvais" }] },
              { who: "president", t: "La CRPC a été refusée ; je n'en connais pas le contenu et n'ai pas à le connaître." },
            ],
            card: { prompt: "La présidente : « Maître, la situation professionnelle de votre cliente : vous avez une pièce ? »", accept: ["A3_attest", "A3_addicto", "A3_casier_b1"], window: 12000, ok: { fx: { flags: { piecesPerso: true } } } },
            requis: { base: { sursis: 4 }, avant: ["0,52 mg/l. Le seuil délictuel est à 0,40. Je requiers quatre mois avec sursis, six mois de suspension du permis et un stage."] },
            defense: { max: 4,
              angles: [{ id: "relaxe", t: "La relaxe", sub: "Sans mesure régulière, rien ne prouve le taux." }, { id: "peine", t: "La peine", sub: "Garder l'emploi : l'éthylotest antidémarrage plutôt que la suspension." }],
              args: [
                { id: "ethylo", label: "Sans vérification périodique établie, la mesure ne vaut rien", say: "Aucune mention de la dernière vérification périodique de l'éthylomètre : sans elle, la mesure n'a pas de valeur probante.", cards: ["A3_ethylo_pv"], pertinent: (a, st, angle) => angle === "relaxe" },
                { id: "ivresse", label: "Aucun signe d'ivresse manifeste", say: "Les agents eux-mêmes notent des propos cohérents et une démarche assurée.", cards: ["A3_pas_ivresse"] },
                { id: "ead", label: "Un éthylotest antidémarrage plutôt qu'une suspension (art. L. 234-2)", say: "Le tribunal peut interdire de conduire un véhicule non équipé d'un éthylotest antidémarrage : la sécurité est assurée et l'emploi préservé.", cards: ["CR_L234-2"], pertinent: (a, st, angle) => angle === "peine" },
                { id: "emploi", label: "Infirmière de nuit, la voiture indispensable", say: "Elle travaille de 21 h à 7 h à Lariboisière ; la nuit, de Pantin, il n'y a pas de transports.", cards: ["A3_nuit", "A3_attest", "A3_transports"] },
                { id: "addicto", label: "Une démarche de soins volontaire", say: "Elle a consulté de sa propre initiative au centre d'addictologie de Fernand-Widal.", cards: ["A3_addicto"] },
              ] },
          }),
        };
      },
    },
    debrief(api, o) {
      const { cs } = api;
      const items = [{ kind: "rule", text: "En CRPC, la peine proposée ne peut dépasser trois ans ni la moitié de l'emprisonnement encouru (art. 495-8) ; l'avocat est obligatoire ; la personne peut demander dix jours de réflexion." }];
      if (cs.vars.homologue) items.push({ kind: "info", text: `Proposition homologuée : ${cs.vars.proposition.texte}.` });
      if (cs.flags.crpcRefusee) items.push({ kind: "info", text: "La CRPC refusée, le dossier revient au parquet ; les déclarations faites pendant la procédure ne peuvent pas être utilisées (art. 495-14)." });
      if (!cs.issues.some((i) => i.flag === "ethylo")) items.push({ kind: "surprise", text: "Le PV de mesure ne mentionne pas la dernière vérification périodique de l'éthylomètre. Vous ne l'avez pas relevé." });
      if (cs.advice.includes("a3_contester") || cs.flags.promesse) items.push({ kind: "bad", text: "Vous avez promis une issue. On promet son travail, pas un résultat." });
      return items.concat(cs.vars.debriefJugement || []);
    },
    epilogue(api, o) {
      const p = api.cs.vars.peine;
      const t = (p && p.texte) || (api.cs.vars.proposition && api.cs.vars.proposition.texte) || "";
      if (o.type === "relaxe") return "Relaxée. Claire a gardé son permis et son poste ; elle ne prend plus le volant après un pot, même d'un seul verre.";
      if (/antidémarrage/.test(t)) return `${t}. Claire a fait poser l'éthylotest antidémarrage et a gardé ses nuits à Lariboisière.`;
      return `${t}. Six mois sans permis : Claire a dû passer de jour, puis a demandé une mutation plus près de chez elle.`;
    },
    fiche(api, o) {
      return {
        phrase: "Conduite sous l'empire d'un état alcoolique, comparution sur reconnaissance préalable de culpabilité, avocate de Claire Morin.",
        notions: [
          { titre: "Le seuil délictuel de l'alcool au volant", regle: "À partir de 0,40 mg/l d'air expiré (0,80 g/l de sang) : délit puni de deux ans et 4 500 € d'amende ; suspension et éthylotest antidémarrage en peines complémentaires.", art: "art. L. 234-1 et L. 234-2 C. route", prog: "dps" },
          { titre: "La CRPC", regle: "Proposition plafonnée à trois ans et à la moitié de l'emprisonnement encouru ; avocat obligatoire ; délai de réflexion de dix jours ; homologation par un juge.", art: "art. 495-8 CPP", prog: "pp_jugement" },
          { titre: "Le refus de CRPC", regle: "Le procureur saisit le tribunal ; ni le procès-verbal ni les déclarations faites pendant la procédure ne peuvent être utilisés.", art: "art. 495-12 et 495-14 CPP", prog: "pp_jugement" },
        ],
        piege: "Une faiblesse de procédure ne se plaide pas devant le procureur : elle sert de levier, ou elle se soulève devant le tribunal, avant le fond.",
        devenir: api.def.epilogue(api, o),
      };
    },
    corrige() {
      return [
        { probleme: "Quelle infraction ?", regle: "Conduite sous l'empire d'un état alcoolique à partir de 0,40 mg/l d'air expiré, deux ans et 4 500 € (art. L. 234-1 C. route) ; suspension ou interdiction de conduire sans éthylotest antidémarrage en peine complémentaire (art. L. 234-2).", application: "0,52 mg/l retenus, la mesure la plus favorable : le délit est constitué si la mesure est régulière." },
        { probleme: "Que peut proposer le procureur ?", regle: "Une peine d'au plus trois ans et de la moitié de l'emprisonnement encouru (art. 495-8), soit un an ici ; avocat obligatoire ; refus ou non-homologation : retour au parquet, et les déclarations ne peuvent pas être utilisées (art. 495-14).", application: "Quatre mois avec sursis et six mois de suspension sont proposés ; l'emploi de nuit et l'éthylotest antidémarrage permettent de négocier la peine complémentaire." },
        { probleme: "Que vaut la mesure ?", regle: "La mesure n'a de valeur que si l'éthylomètre est homologué et a subi ses vérifications périodiques. Effet exact du défaut de mention au procès-verbal : jurisprudence à vérifier avant saisie.", application: "Le PV ne mentionne aucune vérification : un levier en CRPC, une exception à soulever devant le tribunal avant toute défense au fond." },
      ];
    },
  });

  function crpcScript(api, retour) {
    const { s, cs } = api;
    const negociation = [
      { plaidoirie: { role: "crpc", max: 3, intro: "Monsieur le procureur, avant que ma cliente vous réponde, quelques éléments.", args: [
        { id: "emploi", label: "Infirmière de nuit : sans voiture, elle perd son poste", say: "Mme Morin est infirmière de nuit à Lariboisière : de 21 h à 7 h, de Pantin, sans voiture, elle perd son poste.", cards: ["A3_nuit", "A3_transports", "A3_attest"] },
        { id: "ead", label: "L'éthylotest antidémarrage plutôt que la suspension (art. L. 234-2)", say: "Je vous propose de remplacer la suspension par une interdiction de conduire un véhicule non équipé d'un éthylotest antidémarrage.", cards: ["CR_L234-2"] },
        { id: "casier", label: "Aucun antécédent", say: "Aucun antécédent, pas même une contravention.", cards: ["A3_casier", "A3_casier_b1"] },
        { id: "addicto", label: "Une démarche de soins volontaire", say: "Elle a consulté en addictologie, de sa propre initiative.", cards: ["A3_addicto"] },
        { id: "ethylo", label: "La vérification de l'éthylomètre n'est pas mentionnée", say: "Je relève que le procès-verbal ne mentionne aucune vérification périodique de l'éthylomètre.", cards: ["A3_ethylo_pv"] },
        { id: "prison", label: "Contester une peine de prison ferme", say: "Une peine de prison ferme serait disproportionnée.", pertinent: () => false },
      ] } },
      { do: (a, st) => a.run("contreProposition", { st }) },
      { choose: [
        { t: "Claire accepte la proposition.", then: homologation(api) },
        { t: "Claire refuse : nous plaiderons devant le tribunal.", then: refus(api) },
      ] },
    ];
    return {
      title: "Bureau du procureur — CRPC", sub: "Tribunal judiciaire de Paris · parquet", decor: { scene: "cabinet_ji", judge: CR.px.acteurLook(CR.acteur(cs.actors.parquet)) },
      steps: [
        { who: "sys", t: retour ? "(Dix jours ont passé. Même bureau, même pile de dossiers.)" : "(Un bureau au troisième étage du tribunal. La substitute a quinze CRPC ce matin.)" },
        { who: "parquet", t: retour ? "Madame Morin, vous avez réfléchi. Je vous rappelle ma proposition." : "Madame Morin, maître. Vous reconnaissez avoir conduit avec 0,52 milligramme d'alcool par litre d'air expiré ?" },
        retour ? { who: "client", t: "Oui." } : { if: () => !!cs.flags.prepClient, then: [{ who: "client", t: "Oui, je le reconnais." }], else: [{ who: "client", t: "Oui… enfin, je ne me sentais pas ivre." }, { who: "parquet", t: "Ce n'est pas la question, madame." }] },
        { do: (a) => { const p = retour && cs.vars.proposition ? cs.vars.proposition : proposer(a); return [{ who: "parquet", t: `Je vous propose : ${p.texte.replace(/^./, (c) => c.toLowerCase())}.` }]; } },
        { choose: [
          { t: "Claire accepte la proposition.", then: homologation(api) },
          { t: "Négocier la proposition.", then: negociation },
          retour ? null : { t: "Demander le délai de réflexion de dix jours (art. 495-8).", fx: { csFlags: { reflexion: true } }, reply: "Entendu. Revenez dans dix jours.", replyWho: "parquet", then: [{ end: true }] },
          { t: "Claire refuse la proposition.", then: refus(api) },
        ].filter(Boolean) },
      ],
    };
  }
})();
