/* Affaire 7 — La perquisition de 5 h 30.
   Défense. Information judiciaire : interrogatoire de première comparution, débat devant le JLD (art. 145),
   copie du dossier (art. 114), requête en nullité dans les quatre mois (art. 173-1), chambre de l'instruction.
   Anomalie : aucune ordonnance du juge n'autorise une perquisition de nuit (art. 59 et 706-91). */
(function () {
  const CR = window.CR;
  const R = CR.R;
  const PEN = CR.PEN;
  const AUD = CR.AUD;
  const ILYES = { prenom: "Ilyes", nom: "Kaddour", g: "m", age: 27, metier: "sans emploi", tel: "07 62 19 84 33", trust: 50, look: { skin: 2, hair: "buzz", hc: "black", beard: 1 }, naissance: "le 4 juillet 1999 à Saint-Denis", adresse: "rue Belliard, Paris 18e" };
  const DEF = "a07_perquisition";
  const DOCS = ["pv_perquisition", "pv_saisie", "rapport_surv", "pv_gav", "cr_ji"];

  CR.defineCase({
    id: DEF, camp: "defense", domaine: "instruction", domaineLib: "pp_instruction",
    title: "Kaddour — la perquisition de 5 h 30",
    arrive: { day: 37, min: 9 * 60 + 40 },
    client: ILYES, caller: "Sabrina Kaddour, sa sœur", leadPatience: 1, urgence: true,
    voicemail: "Maître, Sabrina Kaddour. Mon frère Ilyes a été arrêté hier matin chez lui. Il passe devant le juge d'instruction cet après-midi, à 15 heures. Il a demandé que ce soit vous. Rappelez-moi, je vous en supplie.",
    profile: { wealth: 3, sens: 0.5, urgency: 1, temper: "presse" },
    honoraires: { forfait: 2800, heures: 16, types: ["forfait"], resultat: "non-lieu ou mise en liberté", intro: "Sabrina paiera ; elle a vidé son livret." },
    mission: "Assistance de M. Ilyes Kaddour dans l'information judiciaire ouverte à Paris, devant le juge d'instruction, le juge des libertés et de la détention et la chambre de l'instruction, jusqu'à l'ordonnance de règlement.",
    actors: { ji: "ji_vauclair", jld: "jld_pimentel", parquet: "pq_riboulet", president: "pr_chins" },
    proc: { stade: "information", nature: "delit", faits: -1, infractions: ["CP_222-37"] },
    init(api, cs) { cs.vars.ipcDay = cs.vars.base; cs.vars.perqDay = cs.vars.base - 1; },
    vars: (s, cs) => ({ perqDate: CR.fmtDate(cs.vars.perqDay, "long") }),
    facts: {
      K7_heure: { label: "La perquisition a commencé à 5 h 30", key: true, why: "Avant 6 heures : une perquisition de nuit, qui exige une autorisation du juge (art. 59 et 706-91)." },
      K7_quantite: { label: "300 grammes de résine", key: true },
      K7_mere: { label: "L'hébergement possible chez sa mère, à Saint-Ouen", key: true, why: "La garantie de représentation qui permet un contrôle judiciaire." },
      K7_promesse: { label: "La promesse d'embauche en entrepôt", key: true },
      K7_casier: { label: "Aucune condamnation" },
      K7_conso: { label: "Il dit fumer, pas vendre", why: "Sa version : la quantité pèse contre lui, mais aucune vente n'est filmée." },
    },
    calls: {
      intake: {
        opening: ["Maître, c'est Sabrina, la sœur d'Ilyes. Ils sont venus hier à l'aube, ils ont cassé la porte. Il est présenté au juge d'instruction aujourd'hui à 15 heures."],
        topics: [
          { id: "i_quoi", q: "Que lui reproche-t-on ?", a: [{ t: "Ils ont trouvé 300 grammes de résine chez lui, et de l'argent. Ils parlent de trafic.", f: "K7_quantite" }, "C'est un juge d'instruction, M. Vauclair, je crois."], cost: 3, unlock: ["i_heure", "i_conso"] },
          { id: "i_heure", q: "À quelle heure exactement la police est-elle entrée ?", a: [{ t: "5 h 30. J'étais chez lui, je dormais sur le canapé. J'ai regardé mon téléphone.", f: "K7_heure" }], cost: 2, tag: "good" },
          { id: "i_conso", q: "Que dit Ilyes de cette résine ?", a: [{ t: "Il fume, oui. Mais il ne vend pas. Il le dit depuis le début.", f: "K7_conso" }], cost: 2 },
          { id: "i_mere", q: "Où pourrait-il vivre s'il sortait ?", a: [{ t: "Chez notre mère, à Saint-Ouen. Elle est d'accord, elle l'a dit.", f: "K7_mere" }], cost: 2, tag: "good" },
          { id: "i_travail", q: "Il travaille ?", a: [{ t: "Il avait une promesse d'embauche dans un entrepôt à Gennevilliers. Il devait commencer le mois prochain.", f: "K7_promesse" }], cost: 2, tag: "good" },
          { id: "i_casier", q: "Il a déjà été condamné ?", a: [{ t: "Jamais. Un contrôle une fois, c'est tout.", f: "K7_casier" }], cost: 1 },
          { id: "i_message", q: "Si je le vois, vous voulez que je lui transmette quelque chose ?", a: ["Dites-lui de ne rien dire, que je m'occupe du reste."], cost: 1, tag: "neutral", fx: { flags: { messageFamille: true } } },
        ],
        start: ["i_quoi", "i_mere", "i_travail", "i_casier", "i_message"],
        patience: 80, close: "Vous y allez ? Merci. 15 heures, au tribunal.",
      },
    },
    advice: [
      { id: "i_attest", t: "Faites établir par votre mère une attestation d'hébergement, avec une quittance de loyer et sa pièce d'identité." },
      { id: "i_promesse", t: "Demandez à l'entrepôt une promesse d'embauche écrite." },
      { id: "i_secret", t: "Je ne peux pas vous répéter ce qu'il me dira, ni ce que contient le dossier." },
      { id: "i_rien", t: "Ne vous inquiétez pas, il sortira ce soir." },
    ],
    docs: {
      pv_perquisition: (x) => ({ title: "Procès-verbal de perquisition", kind: "pv", entete: ["Préfecture de police · Brigade des stupéfiants", "Commission rogatoire de M. Vauclair, juge d'instruction — cote D21"], paras: [
        [{ t: `Le ${CR.fmtDate(x.cs.vars.perqDay, "long")} à 5 h 30, agissant en exécution de la commission rogatoire de M. Vauclair, juge d'instruction, nous présentons au domicile de M. Ilyes Kaddour, rue Belliard, Paris 18e.`, f: "K7_pv_heure", flag: "perq_nuit" }],
        ["En l'absence de réponse, procédons à l'ouverture forcée de la porte. M. Kaddour est présent, ainsi que sa sœur."],
        [{ t: "Dans la chambre, découvrons sous le lit une boîte contenant trois plaquettes de résine de cannabis, une balance électronique et 1 200 euros en espèces.", f: "K7_decouverte" }],
        ["Opérations terminées à 6 h 40, en présence de la personne."],
      ], signed: "Capitaine L. Arnoux, OPJ" }),
      pv_saisie: () => ({ title: "Procès-verbal de saisie et de pesée", kind: "pv", entete: ["Brigade des stupéfiants — cote D22"], paras: [[{ t: "Pesée : 302 grammes de résine de cannabis. Placés sous scellés n° 1 à 3, avec la balance (scellé 4) et les espèces (scellé 5).", f: "K7_pesee" }]] }),
      rapport_surv: (x) => ({ title: "Rapport de surveillance", kind: "pv", entete: ["Brigade des stupéfiants — cote D14"], paras: [[`Du ${CR.fmtDate(x.cs.vars.perqDay - 29, "long")} au ${CR.fmtDate(x.cs.vars.perqDay - 15, "long")}, surveillance de l'immeuble de la rue Belliard.`], [{ t: "Constatons des allées et venues fréquentes au domicile de M. Kaddour, en soirée. Aucune remise de produit n'est observée.", f: "K7_aucune_vente" }]] }),
      pv_gav: () => ({ title: "Procès-verbal d'audition en garde à vue (extrait)", kind: "pv", entete: ["Brigade des stupéfiants — cote D30"], paras: [[{ t: "« La résine, c'est pour moi. Je fume depuis longtemps. Les espèces, c'est l'argent de ma mère pour le loyer. »", f: "K7_version" }]] }),
      cr_ji: () => ({ title: "Commission rogatoire", kind: "greffe", entete: ["Tribunal judiciaire de Paris · Cabinet de M. Vauclair — cote D10"], paras: [["Donnons commission rogatoire au chef de la brigade des stupéfiants de procéder à tous actes utiles à la manifestation de la vérité, notamment perquisitions et saisies, dans les conditions légales."], [{ t: "La commission rogatoire ne contient aucune autorisation de perquisition en dehors des heures légales, et aucune ordonnance en ce sens ne figure au dossier.", f: "K7_pas_ordonnance" }]] }),
      ordo_dp: (x) => ({ title: "Ordonnance de placement en détention provisoire", kind: "greffe", entete: ["Juge des libertés et de la détention"], paras: [["Ordonnons le placement en détention provisoire de M. Ilyes Kaddour, la détention étant l'unique moyen d'empêcher le renouvellement de l'infraction et une concertation frauduleuse (art. 144, 4° et 6°)."], ["Ordonnance notifiée à la personne et à son avocat."]] }),
      ordo_cj: () => ({ title: "Ordonnance de placement sous contrôle judiciaire", kind: "greffe", entete: ["Juge des libertés et de la détention"], paras: [["M. Ilyes Kaddour est placé sous contrôle judiciaire : résider chez sa mère à Saint-Ouen, se présenter chaque semaine au commissariat, ne pas paraître dans le 18e arrondissement, justifier d'une activité professionnelle."]] }),
      arret_chins: (x) => ({ title: "Arrêt de la chambre de l'instruction", kind: "greffe", entete: ["Cour d'appel de Paris · Chambre de l'instruction"], paras: (x.cs.vars.arretTexte || []).map((t) => [t]) }),
    },
    docTitles: { pv_perquisition: "Perquisition (D21)", pv_saisie: "Saisie et pesée (D22)", rapport_surv: "Surveillance (D14)", pv_gav: "Audition en garde à vue (D30)", cr_ji: "Commission rogatoire (D10)", ordo_dp: "Ordonnance de détention", ordo_cj: "Ordonnance de contrôle judiciaire", arret_chins: "Arrêt de la chambre de l'instruction" },
    anomalies: { perq_nuit: { irreg: "perquisition_nuit", piece: "pv_perquisition", annule: ["perquisition", "saisie"] } },
    penal: {
      no: ["nullite"],
      copie: DOCS,
      dml: { garanties: [
        { id: "heberg", t: "Attestation d'hébergement de sa mère à Saint-Ouen, avec quittance de loyer.", needs: ["K7_attest", "K7_mere"] },
        { id: "emploi", t: "Promesse d'embauche écrite de l'entrepôt de Gennevilliers.", needs: "K7_promesse_ecrite" },
        { id: "casier", t: "Casier judiciaire vierge.", needs: "K7_casier" },
      ] },
    },
    tpls: {
      appel_dp: (api) => ({
        title: "Déclaration d'appel d'une ordonnance de placement en détention provisoire", kind: "acte", time: 30, dirLabel: "Rédigée",
        depot: "palais", depotLabel: "Greffe du juge d'instruction (déclaration d'appel, art. 502)", depotTime: 15,
        slots: {
          decision: CR.autoSlot(api.cs.vars.dpDay != null ? `l'ordonnance du juge des libertés et de la détention du ${CR.fmtDate(api.cs.vars.dpDay, "long")} plaçant M. Ilyes Kaddour en détention provisoire` : "l'ordonnance de placement en détention provisoire"),
          motifs: CR.choiceSlot("Les motifs", [
            { t: "Les garanties de représentation présentées permettent d'atteindre les objectifs de l'article 144 par un contrôle judiciaire ou une assignation à résidence.", ok: true },
            { t: "Mon client est innocent et la perquisition est nulle.", ok: false, defect: "motifs:hors_sujet" },
          ]),
        },
        checks: [{ id: "garanties", label: "Les pièces jointes", heading: "Pièces jointes :", options: [
          { id: "heberg", t: "Attestation d'hébergement de Mme Kaddour à Saint-Ouen, avec quittance.", ok: null, needs: "K7_attest" },
          { id: "emploi", t: "Promesse d'embauche écrite de l'entrepôt de Gennevilliers.", ok: null, needs: "K7_promesse_ecrite" },
          { id: "casier", t: "Bulletin n° 1 du casier judiciaire : néant.", ok: null, needs: "K7_casier" },
        ] }],
        body: [["Je soussigné, ", `Me ${api.s.player.nom}`, ", avocat au barreau de Paris, déclare interjeter appel, au nom de M. Ilyes Kaddour, de ", { s: "decision" }, " (art. 186 CPP)."], [{ s: "motifs" }]],
      }),
    },
    flow: { tasks: PEN.tasks },
    tasks(api, T) {
      const { s, cs } = api;
      if (!cs.proc.mex && s.day === cs.vars.ipcDay && !cs.flags.dossierLu) T({ id: "dossier", label: "Consulter le dossier au cabinet du juge", sub: "Avant l'interrogatoire de première comparution : vous y avez droit (art. 114).", kind: "admin", time: 45, where: "palais", urgent: true, run: () => {
        CR.spend(s, 45, "admin"); cs.flags.dossierLu = s.day;
        for (const k of DOCS) if (!CR.hasDoc(cs, k)) api.doc(k, api.def.docTitles[k]);
        CR.toast(s, "Vous lisez le dossier : cinq pièces notées dans le dossier du cabinet. Ce n'est pas encore la copie.", "info"); return null; } });
      if (cs.proc.detention.statut === "dp" && cs.vars.dpDay != null && !CR.drafted(cs, "appel_dp")) T({ id: "appel_dp", label: "Faire appel de l'ordonnance de placement en détention", sub: "Devant la chambre de l'instruction. Comptez le délai vous-même.", kind: "draft", time: 30, run: () => ({ scene: "draft", tpl: "appel_dp" }) });
      PEN.persoTasks(api, T, [
        { id: "attest", label: "Obtenir l'attestation d'hébergement de la mère", sub: "Avec une quittance de loyer et sa pièce d'identité.", fact: "K7_attest", text: "Attestation d'hébergement de Mme Kaddour, rue du Docteur-Bauer à Saint-Ouen, avec quittance et pièce d'identité.", time: 20, cond: () => CR.hasFact(cs, "K7_mere") },
        { id: "promesse", label: "Obtenir la promesse d'embauche écrite", sub: "Entrepôt de Gennevilliers, poste de préparateur de commandes.", fact: "K7_promesse_ecrite", text: "Promesse d'embauche en CDD de six mois, préparateur de commandes, entrepôt Logistique Nord à Gennevilliers.", time: 25, cond: () => CR.hasFact(cs, "K7_promesse") },
      ]);
    },
    on: {
      engaged(api) {
        const { s, cs } = api;
        if (cs.vars.ipcFixe) return;
        cs.vars.ipcFixe = true;
        if (s.day > cs.vars.ipcDay || s.min > 18 * 60) {
          api.tl("L'interrogatoire a eu lieu sans vous, avec l'avocat de permanence.");
          api.run("_mex", {});
          CR.PROC.detention(api, "dp", { etab: "sante" });
          cs.vars.jldDecision = "dp";
          cs.vars.dpDay = s.day;
          api.doc("ordo_dp", "Ordonnance de détention");
          api.mail({ from: "Sabrina Kaddour", subject: "Il est à la Santé", kind: "sms", body: [["Le juge n'a pas attendu. Un avocat commis d'office était là. Ilyes est en détention à la Santé. Vous prenez quand même le dossier ?"]] });
          return;
        }
        const min = Math.max(15 * 60, s.min + 60);
        api.hearing({ day: s.day, min, title: "Interrogatoire de première comparution et débat devant le JLD", where: "Cabinet de M. Vauclair, tribunal judiciaire", lieu: "palais", script: "ipc", done: "apresIPC", onMiss: "_absentIPC", duree: 60 });
      },
      _absentIPC(api) {
        const { s, cs } = api;
        CR.erreur(s, cs, { id: "ipc_absent", texte: "Vous n'étiez pas à l'interrogatoire de première comparution.", sanction: "Ilyes a été mis en examen avec l'avocat de permanence, puis placé en détention provisoire.", regul: "Reprendre le dossier : copie, demande de mise en liberté." });
        api.run("_mex", {});
        CR.PROC.detention(api, "dp", { etab: "sante" });
        cs.vars.dpDay = s.day;
        api.doc("ordo_dp", "Ordonnance de détention");
        api.mail({ from: "Sabrina Kaddour", subject: "Vous n'êtes pas venu", kind: "sms", body: [["Il est à la Santé. Vous n'étiez pas là."]] });
        api.trust(-30);
      },
      _mex(api) {
        const { s, cs } = api;
        if (cs.proc.mex != null) return;
        cs.proc.mex = s.day;
        CR.PROC.stade(api, "information", "Mise en examen pour acquisition, détention, offre ou cession de stupéfiants (art. 222-37).");
        api.schedule(100, "_finInfo");
      },
      jldDecider(api, { st, differe }) {
        const { s, cs } = api;
        const pl = st.played;
        const g = ["K7_attest", "K7_promesse_ecrite"].filter((f) => CR.hasFact(cs, f)).length * 1.2 + ["K7_mere", "K7_promesse", "K7_casier"].filter((f) => pl.has(f) || CR.hasFact(cs, f)).length * 0.4;
        const r = CR.ACT.jld(api, { garanties: g, criteres: 2, gravite: 0.55, debatDiffere: !!differe, argument144: pl.has("arg:144") });
        cs.vars.jldDecision = r.decision;
        if (r.decision === "dp" && cs.advice.includes("i_rien")) api.trust(-15);
        if (r.decision === "dp") {
          CR.PROC.detention(api, "dp", { etab: "sante" });
          cs.vars.dpDay = s.day;
          api.doc("ordo_dp", "Ordonnance de détention");
          return [{ who: "jld", t: "Je place M. Kaddour en détention provisoire : c'est l'unique moyen d'empêcher le renouvellement de l'infraction et une concertation avec d'éventuels complices (art. 144)." }, { who: "sys", t: "(Ilyes baisse la tête. Il sera écroué ce soir à la maison d'arrêt de la Santé.)" }];
        }
        CR.PROC.detention(api, r.decision, {});
        api.doc("ordo_cj", "Ordonnance de contrôle judiciaire");
        return [{ who: "jld", t: r.decision === "arse" ? "Je place M. Kaddour sous assignation à résidence avec surveillance électronique, chez sa mère, à Saint-Ouen." : "Je place M. Kaddour sous contrôle judiciaire : il résidera chez sa mère, pointera chaque semaine, et ne paraîtra pas dans le 18e arrondissement." }, { who: "sys", t: "(Ilyes sortira ce soir. Sabrina pleure dans le couloir.)" }];
      },
      apresIPC(api) {
        const { s, cs } = api;
        if (cs.flags.delaiJLD && !cs.vars.jldFixe) {
          cs.vars.jldFixe = true;
          CR.PROC.detention(api, "dp", { etab: "sante" });
          let d = CR.addOuvrables(s.day, 3);
          while (!CR.isBusinessDay(d)) d--;
          cs.vars.jldDiffDay = d;
          api.hearing({ day: d, min: 14 * 60, title: "Débat différé devant le JLD (art. 145)", where: "Tribunal judiciaire de Paris", lieu: "palais", script: "jld", done: "apresJLD", duree: 45 });
          api.tl(`Incarcération provisoire jusqu'au débat différé du ${CR.fmtDate(d, "dow")}.`);
        }
        CR.updatedClient(s, cs, 1);
      },
      apresJLD(api) { CR.updatedClient(api.s, api.cs, 1); },
      filed_appel_dp(api, { res, depot }) {
        const { s, cs } = api;
        if (!depot) return;
        const due = CR.rollForward(cs.vars.dpDay + 10);
        CR.PROC.event(api, "Appel de l'ordonnance de placement en détention provisoire.");
        if (s.day > due) {
          CR.erreur(s, cs, { id: "appel_dp_tardif", texte: `Appel de l'ordonnance de détention formé le ${CR.fmtDate(s.day, "long")}, après le délai de dix jours (art. 186).`, sanction: "Appel irrecevable.", regul: "Une demande de mise en liberté (art. 148)." });
          api.schedule(4, "_appelDpIrrecevable");
          return;
        }
        cs.vars.appelDp = { day: s.day, garanties: (res.picks.garanties || []).length, motifsOk: !res.defects.some((d) => d.startsWith("motifs")) };
        let d = CR.rollForward(s.day + R.int(s, 8, 12));
        api.hearing({ day: d, min: 9 * 60 + 30, title: "Chambre de l'instruction — appel de l'ordonnance de détention", where: "Cour d'appel de Paris, Île de la Cité", lieu: "cite", script: "chinsDp", done: "apresChambreDp", duree: 40 });
      },
      _appelDpIrrecevable(api) {
        api.mail({ from: "Greffe de la chambre de l'instruction", subject: "Arrêt — appel irrecevable", kind: "greffe", body: [["La chambre de l'instruction déclare l'appel irrecevable comme tardif : il a été formé plus de dix jours après la notification de l'ordonnance (art. 186)."]] });
      },
      decisionChambreDp(api, { st }) {
        const { s, cs } = api;
        const a = cs.vars.appelDp || {};
        const g = a.garanties * 1.2 + (st.played.has("arg:garanties") ? 0.6 : 0) + (st.played.has("arg:144") ? 0.4 : 0);
        const jld = cs.actors.jld;
        cs.actors.jld = "pr_chins";
        const r = CR.ACT.jld(api, { garanties: g, criteres: 2, gravite: 0.55, argument144: a.motifsOk });
        cs.actors.jld = jld;
        cs.vars.chambreDp = r.decision;
        if (r.decision === "dp") return [{ who: "president", t: "La cour confirme l'ordonnance : la détention demeure l'unique moyen de prévenir le renouvellement des faits (art. 144)." }];
        CR.PROC.detention(api, r.decision, {});
        api.run("libere", { decision: r.decision });
        return [{ who: "president", t: "La cour infirme l'ordonnance et place M. Kaddour sous contrôle judiciaire : résidence chez sa mère à Saint-Ouen, pointage hebdomadaire, interdiction de paraître dans le 18e arrondissement." }];
      },
      apresChambreDp(api) { CR.updatedClient(api.s, api.cs, 1); },
      libere(api) { api.mail({ from: "Sabrina Kaddour", subject: "Il est sorti", kind: "sms", body: [["Ilyes est sorti ! Merci, maître."]] }); },
      apresRequete(api, { moyens }) {
        const { s, cs } = api;
        cs.vars.requeteFaite = s.day;
        api.cancel("_finInfo");
        api.cancel("_renvoi");
        const d = CR.rollForward(s.day + R.int(s, 30, 42));
        api.hearing({ day: d, min: 10 * 60, title: "Chambre de l'instruction — requête en nullité", where: "Cour d'appel de Paris, Île de la Cité", lieu: "cite", script: "chins", done: "apresChambre", duree: 50 });
        CR.PROC.event(api, "Requête en nullité déclarée au greffe de la chambre de l'instruction.");
      },
      statuerChambre(api) {
        const { s, cs } = api;
        const res = CR.PROC.statuerNullites(api, CR.profil("pr_chins"));
        const m = res.find((x) => x.flag === "perq_nuit") || res[0];
        const lines = [];
        const arret = ["La chambre de l'instruction, statuant sur la requête en nullité de M. Ilyes Kaddour :"];
        if (!m) { lines.push({ who: "president", t: "La requête ne vise aucun acte : elle est rejetée." }); arret.push("Rejette la requête."); }
        else if (m.decision === "irrecevable") { lines.push({ who: "president", t: `La requête est irrecevable : ${m.motif}.` }); arret.push(`Déclare la requête irrecevable : ${m.motif}.`); }
        else if (m.decision === "annule") {
          cs.vars.annulation = true;
          if (cs.vars.requeteCascade) for (const p of ["aveux", "gav"]) if (!cs.proc.annules.includes(p)) cs.proc.annules.push(p);
          lines.push({ who: "president", t: "La chambre annule le procès-verbal de perquisition, commencée à 5 h 30 sans autorisation, la saisie qui en découle" + (cs.vars.requeteCascade ? ", et les actes dont ils sont le support nécessaire (art. 174)." : ".") });
          arret.push("Annule le procès-verbal de perquisition (cote D21) et la saisie (cote D22)" + (cs.vars.requeteCascade ? ", ainsi que les actes dont ils sont le support nécessaire (art. 174)." : "."), "Ordonne le retrait de ces pièces du dossier ; il est interdit d'y puiser aucun renseignement contre les parties (art. 174).");
        } else { lines.push({ who: "president", t: "La requête est rejetée." }); arret.push("Rejette la requête."); }
        cs.vars.arretTexte = arret;
        api.doc("arret_chins", "Arrêt de la chambre de l'instruction");
        return lines;
      },
      apresChambre(api) {
        const { s, cs } = api;
        if (cs.vars.annulation) api.schedule(R.int(s, 18, 28), "_nonLieu");
        else if (cs.vars.finInfo) api.schedule(R.int(s, 20, 30), "_renvoi");
        else api.schedule(R.int(s, 30, 45), "_finInfo");
      },
      _nonLieu(api) {
        const { s, cs } = api;
        api.mail({ from: "Cabinet de M. Vauclair, juge d'instruction", subject: "Ordonnance de non-lieu", kind: "greffe", important: true, body: [["Les pièces annulées retirées du dossier, il ne résulte pas de l'information de charges suffisantes contre M. Ilyes Kaddour d'avoir commis les faits reprochés (art. 177)."], ["Disons n'y avoir lieu à suivre. Ordonnons la mise en liberté de la personne si elle est détenue."]] });
        if (cs.proc.detention.statut !== "libre") CR.PROC.detention(api, "libre", {});
        CR.PROC.stade(api, "definitif", "Ordonnance de non-lieu.");
        CR.closeCase(s, cs, { type: "non_lieu" });
      },
      _finInfo(api) {
        const { s, cs } = api;
        if (cs.vars.finInfo) return;
        cs.vars.finInfo = true;
        api.mail({ from: "Cabinet de M. Vauclair, juge d'instruction", subject: "Avis de fin d'information (art. 175)", kind: "greffe", body: [["L'information me paraît terminée. Les parties disposent des délais de l'article 175 pour présenter leurs observations et leurs demandes."], ["Le procureur de la République prendra ensuite ses réquisitions définitives."]] });
        CR.PROC.stade(api, "reglement", "Avis de fin d'information (art. 175).");
        api.schedule(R.int(s, 28, 35), "_renvoi");
      },
      _renvoi(api) {
        const { s, cs } = api;
        let day = CR.rollForward(s.day + 30);
        while (CR.dow(day) !== 4 || !CR.isBusinessDay(day)) day++;
        CR.PROC.fixAudience(api, { day, min: 13 * 60 + 30, juridiction: "tc", mode: "ordonnance", convocDay: s.day, president: "pr_dessaint", script: "tc", done: "apresTC", onMiss: "_absentTC", title: "Audience — 16e chambre correctionnelle", duree: 70 });
        CR.PROC.stade(api, "jugement", "Ordonnance de renvoi devant le tribunal correctionnel.");
        api.mail({ from: "Greffe correctionnel", subject: "Ordonnance de renvoi — Kaddour", kind: "greffe", important: true, body: [[`M. Ilyes Kaddour est renvoyé devant le tribunal correctionnel. Audience le ${CR.fmtDate(day, "dow")} à 13 h 30.`], ["Les nullités de l'instruction ne peuvent plus être soulevées devant le tribunal (art. 385, alinéa 1er)."]] });
      },
      _absentTC(api) {
        const { s, cs } = api;
        CR.erreur(s, cs, { id: "tc_absent", texte: "Vous n'étiez pas à l'audience.", sanction: "Ilyes a été jugé sans avocat.", regul: "Appel dans les dix jours." });
        CR.closeCase(s, cs, { type: "condamnation", detail: "jugé sans avocat" });
      },
      decider(api, { st }) {
        const { cs } = api;
        return PEN.juger(api, {
          st, juridiction: "tc", titre: "Jugement correctionnel", prevenuNom: "Ilyes Kaddour",
          spec: { seuil: 0.55, pieces: {
            saisie: { label: "La saisie de 302 g de résine, d'une balance et de 1 200 €", sens: "charge", force: 0.55 },
            surveillance: { label: "Les allées et venues observées", sens: "charge", force: 0.12 },
            aveux: { label: "Ses déclarations en garde à vue", sens: "charge", force: 0.08 },
            pasdevente: { label: "Aucune vente observée", sens: "decharge", force: 0.08, need: ["K7_aucune_vente", "arg:vente"] },
          } },
          qualif: () => ({ id: "222-37", label: "acquisition, détention, offre ou cession de stupéfiants", court: "art. 222-37 CP", encourue: { prison: 120, amende: 7500000 }, requis: cs.vars.requis, motif: "La quantité saisie, la balance et les espèces caractérisent la détention en vue de la cession." }),
          personnalite: ["K7_attest", "K7_promesse_ecrite", "K7_casier"].filter((f) => CR.hasFact(cs, f)).length + (st.dernierMot === "regrets" ? 1 : 0),
          detenu: cs.proc.detention.statut === "dp",
        });
      },
      apresTC(api, res) {
        const { s, cs } = api;
        const dec = res.decision || {};
        const pn = dec.peine;
        if (dec.coupable && pn && pn.mandatDepot && pn.ferme > 0) CR.condamneDetenu(s, cs, pn.ferme, cs.proc.detention.etab || "sante", cs.proc.detention.statut === "dp" ? cs.proc.detention.since : s.day);
        else if (cs.proc.detention.statut === "dp") CR.PROC.detention(api, "libre", {});
        CR.closeCase(s, cs, PEN.issue(api, dec));
      },
    },
    audiences: {
      ipc(api) {
        const { s, cs } = api;
        const jld = jldSteps(api, false);
        return {
          title: "Cabinet du juge d'instruction", sub: "Tribunal judiciaire de Paris · M. Vauclair", decor: { scene: "cabinet_ji", judge: CR.px.acteurLook(CR.acteur("ji_vauclair")) },
          steps: [
            { who: "sys", t: "(Un bureau étroit, des chemises roses empilées jusqu'au plafond. Ilyes entre, menotté, escorté par deux policiers.)" },
            { who: "ji", name: "M. Vauclair", t: `Monsieur Kaddour, je vous informe que j'envisage votre mise en examen pour acquisition, détention, offre ou cession de stupéfiants, faits commis à Paris jusqu'au ${CR.fmtDate(cs.vars.perqDay, "long")} (art. 222-37 du code pénal).` },
            { who: "ji", name: "M. Vauclair", t: "Vous pouvez vous taire, faire des déclarations ou être interrogé. Votre avocat est présent et a pu consulter le dossier." },
            { if: () => !cs.flags.dossierLu, then: [{ who: "sys", t: "(Vous n'avez pas lu le dossier. Vous découvrez les pièces en même temps que le juge les évoque.)", fx: { cred: -2 } }] },
            { who: "ji", name: "M. Vauclair", t: "Monsieur Kaddour, voulez-vous faire des déclarations ?" },
            { choose: [
              { t: "Il se tait, sur votre conseil : il s'expliquera plus tard, dossier lu.", fx: { csFlags: { silenceIPC: true } }, reply: "C'est votre droit.", replyWho: "ji" },
              { t: "Il dit que la résine est pour lui, qu'il ne vend pas.", reply: "C'est noté.", replyWho: "ji" },
            ] },
            { who: "ji", name: "M. Vauclair", t: "Maître, des observations avant ma décision ?" },
            { choose: [
              { t: "« Je demande que mon client soit entendu comme témoin assisté : aucune vente n'est établie. »", need: "K7_aucune_vente", fx: { cred: 1 }, reply: "J'en prends note, maître. Des indices graves ou concordants me paraissent réunis.", replyWho: "ji" },
              { t: "« Je relève que la perquisition a commencé à 5 h 30. »", need: "K7_pv_heure", fx: { csFlags: { heureSignalee: true } }, reply: "Ce sera, le cas échéant, l'affaire de la chambre de l'instruction, maître.", replyWho: "ji" },
              { t: "« Pas d'observation. »" },
            ] },
            { who: "ji", name: "M. Vauclair", t: "Je vous mets en examen. Le parquet requiert votre placement en détention provisoire ; je saisis le juge des libertés et de la détention." },
            { do: (a) => { a.run("_mex"); return []; } },
            { who: "sys", t: "(Un couloir plus loin. Le cabinet du juge des libertés et de la détention.)" },
            { who: "jld", t: "Monsieur Kaddour, vous pouvez demander un délai pour préparer votre défense. Vous seriez alors incarcéré provisoirement, quatre jours ouvrables au plus, jusqu'au débat (art. 145)." },
            { choose: [
              { t: "« Nous débattons tout de suite. »", then: jld },
              { t: "« Mon client demande un délai pour préparer sa défense (art. 145). »", fx: { csFlags: { delaiJLD: true } }, reply: "Entendu. Le débat aura lieu dans les quatre jours ouvrables. D'ici là, M. Kaddour est incarcéré provisoirement à la Santé.", replyWho: "jld", then: [{ end: true }] },
            ] },
          ],
        };
      },
      jld(api) { return { title: "Juge des libertés et de la détention", sub: "Débat contradictoire différé", decor: { scene: "cabinet_ji", judge: CR.px.acteurLook(CR.acteur("jld_pimentel")) }, steps: [{ who: "sys", t: "(Ilyes arrive de la Santé, escorté. Quelques nuits de cellule ; il a maigri.)" }].concat(jldSteps(api, true)) }; },
      chins(api) {
        const { cs } = api;
        return {
          title: "Chambre de l'instruction", sub: "Cour d'appel de Paris · Île de la Cité", decor: { scene: "assises" },
          steps: [
            { who: "huissier", t: "La cour !" },
            { who: "president", t: "Requête en nullité de M. Ilyes Kaddour. Le conseiller rapporteur a fait son rapport. Maître, vous avez la parole." },
            { plaidoirie: { role: "defense", max: 4, args: [
              { id: "heure", label: "La perquisition a commencé à 5 h 30, avant l'heure légale (art. 59)", say: "Le procès-verbal le dit lui-même : 5 h 30. Les perquisitions ne peuvent commencer avant 6 heures.", cards: ["K7_pv_heure", "K7_heure", "CPP_59"] },
              { id: "ordonnance", label: "Aucune ordonnance n'autorise une perquisition de nuit (art. 706-91)", say: "Une perquisition de nuit suppose une ordonnance motivée du juge ; il n'y en a aucune au dossier, et la commission rogatoire n'en contient pas.", cards: ["K7_pas_ordonnance", "CPP_706-91"] },
              { id: "grief", label: "L'atteinte au domicile fait nécessairement grief", say: "L'irrégularité touche au domicile, à l'heure où il est le plus protégé : elle porte nécessairement atteinte aux intérêts de mon client.", cards: ["CPP_171", "CPP_802"] },
              { id: "cascade", label: "La saisie et les actes qui en découlent tombent (art. 174)", say: "La saisie n'existe que par la perquisition ; elle tombe avec elle, et avec elle les actes dont elle est le support nécessaire.", cards: ["CPP_174"] },
              { id: "innocent", label: "Mon client est innocent", say: "Mon client ne vend pas de résine.", pertinent: () => false },
            ] } },
            { who: "parquet", name: "L'avocat général", t: "L'heure n'est pas contestable. Le ministère public s'en rapporte, en relevant que la quantité saisie est significative." },
            { who: "president", t: "La cour va délibérer." },
            { do: (a) => a.run("statuerChambre") },
          ],
        };
      },
      chinsDp(api) {
        return {
          title: "Chambre de l'instruction", sub: "Appel d'une ordonnance de détention · Île de la Cité", decor: { scene: "assises", box: true },
          steps: [
            { who: "huissier", t: "La cour !" },
            { who: "president", t: "Appel de M. Ilyes Kaddour contre l'ordonnance de placement en détention provisoire. Monsieur l'avocat général ?" },
            { who: "parquet", name: "L'avocat général", t: "Je requiers la confirmation : la quantité saisie, la balance, les espèces. Le risque de renouvellement est réel." },
            { who: "president", t: "Maître, vous avez la parole. Votre client parlera en dernier." },
          ].concat(jldArgs("defense"), [
            { who: "client", t: "Je veux juste travailler. Je ne retournerai pas dans le 18e." },
            { who: "president", t: "La cour statue sur-le-champ." },
            { do: (a, st) => a.run("decisionChambreDp", { st }) },
          ]),
        };
      },
      tc(api) {
        const { cs } = api;
        return {
          title: "16e chambre correctionnelle", sub: "Tribunal judiciaire de Paris", decor: { scene: "salle", box: cs.proc.detention.statut === "dp" },
          steps: AUD.jugement(api, {
            prevenu: ILYES, prevention: `Vous êtes prévenu d'avoir, à Paris, jusqu'au ${CR.fmtDate(cs.vars.perqDay, "long")}, acquis, détenu, offert ou cédé des stupéfiants, en l'espèce environ 300 grammes de résine de cannabis. Article 222-37 du code pénal.`,
            sansLimine: "L'affaire vient sur ordonnance de renvoi du juge d'instruction : les nullités de la procédure antérieure sont purgées (art. 385, alinéa 1er). Nous abordons le fond.",
            instruction: [
              { who: "president", t: "302 grammes, une balance, 1 200 euros. Monsieur Kaddour ?" },
              { if: () => !!cs.flags.prepClient, then: [{ who: "client", t: "Je fumais beaucoup. J'ai arrêté depuis. J'ai un travail qui m'attend.", signal: "bon" }], else: [{ who: "client", t: "C'est pas à moi, la balance.", fx: { cred: -2 } }] },
            ],
            requis: { base: { ferme: 12, sursis: 12 }, avant: ["Une quantité qui n'est pas celle d'un consommateur, une balance, des espèces."] },
            defense: { max: 4, angles: [{ id: "peine", t: "La peine", sub: "Aménagement, emploi, hébergement." }, { id: "relaxe", t: "La relaxe", sub: "Aucune vente n'est établie." }], args: [
              { id: "vente", label: "Aucune vente n'est observée en quinze jours de surveillance", say: "Quinze jours de surveillance, aucune remise de produit.", cards: ["K7_aucune_vente"] },
              { id: "garanties", label: "Un hébergement et un emploi qui l'attendent", say: "Sa mère l'héberge ; un entrepôt l'attend.", cards: ["K7_attest", "K7_promesse_ecrite", "K7_mere", "K7_promesse"] },
              { id: "amenagement", label: "Une peine aménageable (art. 132-19 et 132-25)", say: "Jusqu'à un an ferme, la peine doit être aménagée si la personnalité le permet.", cards: ["CP_132-19", "CP_132-25"] },
              { id: "casier", label: "Aucun antécédent", say: "Vingt-sept ans, aucune condamnation.", cards: ["K7_casier"] },
            ] },
          }),
        };
      },
    },
    debrief(api, o) {
      const { cs } = api;
      const items = [{ kind: "rule", text: "Requête en nullité dans les quatre mois de la mise en examen (art. 173-1, loi du 23 juillet 2026) ; le délai part de la copie du dossier si elle est demandée dans les sept jours." }];
      const due = CR.PROC.delai1731(cs);
      if (due != null) items.push({ kind: "info", text: `Pour Ilyes, le délai expirait le ${CR.fmtDate(due, "long")}.` });
      if (!cs.proc.moyens.some((m) => m.flag === "perq_nuit")) items.push({ kind: "surprise", text: "La perquisition a commencé à 5 h 30, sans aucune ordonnance autorisant une perquisition de nuit : personne n'a saisi la chambre de l'instruction." });
      if (cs.flags.messageFamille) items.push({ kind: "bad", text: "Vous avez proposé de transmettre au détenu un message de la famille : l'avocat n'est pas un intermédiaire entre la personne détenue et des tiers." });
      if (cs.advice.includes("i_rien")) items.push({ kind: "bad", text: "Vous avez promis à Sabrina qu'Ilyes sortirait le soir même : on ne promet jamais un résultat." });
      if (cs.advice.includes("i_secret")) items.push({ kind: "good", text: "Vous avez rappelé à la famille le secret de l'instruction et le secret professionnel." });
      if (cs.vars.jldDecision) items.push({ kind: "info", text: `Le JLD a décidé : ${{ dp: "détention provisoire", cj: "contrôle judiciaire", arse: "assignation à résidence sous surveillance électronique" }[cs.vars.jldDecision]}.` });
      return items.concat(cs.vars.debriefJugement || []);
    },
    epilogue(api, o) {
      if (o.type === "non_lieu") return "Non-lieu. Ilyes a commencé à l'entrepôt de Gennevilliers. Il a déménagé à Saint-Ouen, chez sa mère.";
      const p = api.cs.vars.peine;
      if (p && p.mandatDepot && p.ferme > 0) return `${p.texte}. Ilyes est reparti de l'audience entre deux policiers. Sabrina lui écrit chaque semaine.`;
      return `${p ? p.texte : "Condamné"}. Ilyes travaille à l'entrepôt ; il se présente au SPIP le premier lundi du mois.`;
    },
    fiche(api, o) {
      return {
        phrase: "Trafic de stupéfiants, information judiciaire, avocat d'Ilyes Kaddour : JLD, copie du dossier, requête en nullité.",
        notions: [
          { titre: "La détention provisoire et le délai de l'article 145", regle: "Possible pour un délit puni d'au moins trois ans (art. 143-1), si elle est l'unique moyen d'atteindre un objectif de l'article 144 ; la personne peut demander un délai pour préparer sa défense, avec une incarcération provisoire de quatre jours ouvrables au plus.", art: "art. 143-1, 144 et 145 CPP", prog: "pp_instruction" },
          { titre: "Les heures légales des perquisitions", regle: "Pas de perquisition avant 6 heures ni après 21 heures ; en criminalité organisée, une perquisition de nuit exige une autorisation motivée, à des conditions renforcées dans un domicile.", art: "art. 59 et 706-91 CPP", prog: "pp_enquete" },
          { titre: "Le délai de la requête en nullité", regle: "Quatre mois à compter de la mise en examen ; l'annulation emporte les actes dont l'acte annulé est le support nécessaire.", art: "art. 173-1 et 174 CPP", prog: "pp_instruction" },
        ],
        piege: "Les nullités de l'instruction se plaident devant la chambre de l'instruction, dans les quatre mois : après l'ordonnance de renvoi, elles sont purgées.",
        devenir: api.def.epilogue(api, o),
      };
    },
    corrige() {
      return [
        { probleme: "Quelle infraction, la détention est-elle possible ?", regle: "Trafic de stupéfiants : dix ans (art. 222-37 CP). Détention provisoire possible à partir de trois ans encourus (art. 143-1), sur les critères de l'article 144 ; délai de préparation avec incarcération provisoire de quatre jours ouvrables au plus (art. 145).", application: "Hébergement chez la mère et promesse d'embauche écrite : des garanties pour un contrôle judiciaire." },
        { probleme: "La perquisition est-elle régulière ?", regle: "En principe entre 6 h et 21 h (art. 59) ; de nuit, en criminalité organisée, sur autorisation motivée, à des conditions renforcées dans un domicile (art. 706-91).", application: "5 h 30, aucune ordonnance au dossier : la perquisition est nulle, et la saisie avec elle (art. 174)." },
        { probleme: "Comment et quand le faire juger ?", regle: "Requête à la chambre de l'instruction dans les quatre mois de la mise en examen (art. 173-1), la copie demandée dans les sept jours repoussant le point de départ. Nouvelle demande de mise en liberté irrecevable tant que la précédente n'est pas jugée définitivement (loi du 23 juillet 2026).", application: "Demander la copie dans les sept jours, compter quatre mois, déclarer la requête au greffe de la chambre." },
      ];
    },
  });

  function jldArgs(role) {
    return [{ plaidoirie: { role, max: 3, args: [
        { id: "garanties", label: "L'hébergement chez sa mère, à Saint-Ouen", say: "Sa mère l'héberge à Saint-Ouen : loin du 18e, avec une attestation et une quittance.", cards: ["K7_attest", "K7_mere"] },
        { id: "emploi", label: "Une promesse d'embauche à Gennevilliers", say: "Un emploi l'attend le mois prochain dans un entrepôt de Gennevilliers.", cards: ["K7_promesse_ecrite", "K7_promesse"] },
        { id: "144", label: "Un contrôle judiciaire suffit aux objectifs de l'article 144", say: "Interdiction de paraître dans le 18e, pointage, emploi : chacun des objectifs de l'article 144 est atteint sans détention.", cards: ["CPP_144", "CPP_143-1"] },
        { id: "casier", label: "Aucun antécédent", say: "Il n'a jamais été condamné.", cards: ["K7_casier"] },
        { id: "nullite", label: "La perquisition est nulle", say: "La perquisition est nulle, il faut le libérer.", pertinent: () => false },
      ] } }];
  }
  function jldSteps(api, differe) {
    return [
      { who: "parquet", t: "Trois cents grammes, une balance, des espèces : je requiers la détention provisoire, pour éviter le renouvellement des faits et une concertation (art. 144)." },
      { who: "jld", t: "Maître ?" },
      { plaidoirie: { role: "jld", max: 3, args: [
        { id: "garanties", label: "L'hébergement chez sa mère, à Saint-Ouen", say: "Sa mère l'héberge à Saint-Ouen : loin du 18e, avec une attestation et une quittance.", cards: ["K7_attest", "K7_mere"] },
        { id: "emploi", label: "Une promesse d'embauche à Gennevilliers", say: "Un emploi l'attend le mois prochain dans un entrepôt de Gennevilliers.", cards: ["K7_promesse_ecrite", "K7_promesse"] },
        { id: "144", label: "Un contrôle judiciaire suffit aux objectifs de l'article 144", say: "Interdiction de paraître dans le 18e, pointage, emploi : chacun des objectifs de l'article 144 est atteint sans détention.", cards: ["CPP_144", "CPP_143-1"] },
        { id: "casier", label: "Aucun antécédent", say: "Il n'a jamais été condamné.", cards: ["K7_casier"] },
        { id: "nullite", label: "La perquisition est nulle", say: "La perquisition est nulle, il faut le libérer.", pertinent: () => false },
      ] } },
      { do: (a, st) => a.run("jldDecider", { st, differe }) },
    ];
  }
})();
