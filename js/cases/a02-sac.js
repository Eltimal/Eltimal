/* Affaire 2 — Le sac arraché.
   Défense, commission d'office. Garde à vue, déferrement, comparution immédiate, récidive, détention.
   Anomalie : droits notifiés plus de deux heures après le début de la garde à vue, sans circonstance insurmontable. */
(function () {
  const CR = window.CR;
  const R = CR.R;
  const PEN = CR.PEN;
  const AUD = CR.AUD;
  const YANIS = { prenom: "Yanis", nom: "Mebarki", g: "m", age: 24, metier: "cariste intérimaire", tel: "07 81 22 40 19", trust: 45, look: { skin: 3, hair: "short", hc: "black" }, naissance: "le 9 février 2002 à Paris 18e", adresse: "chez sa mère, rue Marcadet, Paris 18e" };
  const VICTIME = { prenom: "Odile", nom: "Lefort", g: "f" };
  const DEF = "a02_sac";

  CR.defineCase({
    id: DEF, camp: "defense", domaine: "ci", domaineLib: "pp_jugement",
    title: "Mebarki — le sac arraché",
    arrive: { day: 2, min: 15 * 60 + 25 },
    client: YANIS, caller: "Permanence pénale de l'Ordre", leadKind: "permanence", silent: true, noWithdraw: false,
    profile: { wealth: 0, sens: 0.7, urgency: 1, temper: "anxieux" },
    honoraires: { aj: true },
    actors: { opj: "opj_benali", parquet: "pq_riboulet" },
    proc: { stade: "gav", nature: "delit", faits: 0, infractions: ["CP_311-5", "CP_132-10"], pcConstituee: true },
    facts: {
      A2_droits_tard: { label: "Les droits notifiés vers 15 heures, plus de deux heures après l'interpellation", key: true, why: "C'est la nullité du dossier : en comparution immédiate, elle se soulève à la barre, avant le fond." },
      A2_heberg: { label: "L'hébergement chez sa mère", key: true, why: "Première garantie de représentation : sans adresse, ni aménagement ni contrôle judiciaire." },
      A2_promesse: { label: "La promesse de mission d'intérim", key: true },
      A2_casier: { label: "La condamnation pour vol d'il y a trois ans", key: true, why: "Elle met Yanis en récidive légale : le maximum encouru double (art. 132-10)." },
      A2_pas_pousse: { label: "Il dit ne pas l'avoir poussée", why: "La version de Yanis : il a tiré sur le sac, elle est tombée." },
    },
    calls: {
      intake: {
        label: "Permanence pénale",
        opening: ["Maître, ici la permanence pénale de l'Ordre. Garde à vue au commissariat central du 18e : M. Yanis Mebarki, 24 ans, pour un vol avec violences. Il a demandé un avocat commis d'office. Vous pouvez y aller ?"],
        topics: [
          { id: "p_info", q: "Que savez-vous de l'affaire ?", a: [{ t: "Un arrachage de sac rue Ordener, ce midi. Interpellé en flagrance par une patrouille.", f: "A2_flagrance" }, { t: "La victime est une dame âgée, elle est tombée.", f: "A2_victime" }], cost: 2, tag: "good" },
          { id: "p_heure", q: "Depuis quand est-il en garde à vue ?", a: [{ t: "D'après l'officier, depuis 13 h 10. L'avis à avocat nous est parvenu à 15 h 20.", f: "A2_avis" }], cost: 1, tag: "good" },
          { id: "p_oui", q: "J'y vais.", a: ["Merci, maître. Je préviens le commissariat. L'officier de quart est le brigadier-chef Benali."], cost: 1, tag: "good", ends: true, fx: { flags: { accepte: true } } },
          { id: "p_non", q: "Je ne peux pas, je suis pris tout l'après-midi.", a: ["Entendu, j'appelle le confrère suivant sur la liste."], cost: 1, tag: "neutral", ends: true, fx: { flags: { refuse: true } } },
        ],
        start: ["p_info", "p_heure", "p_oui", "p_non"],
        patience: 60, advice: false,
        close: "Bonne garde à vue, maître.",
        onEnd: (api) => {
          const { s, cs } = api;
          if (cs.flags.accepte) {
            cs.status = "active"; cs.aj = true; cs.engaged = s.day; cs.lastUpdate = s.day;
            CR.unschedule(s, (e) => e.caseId === cs.id && (e.key === "_leadExpire" || e.key === "_prospectExpire"));
            api.schedule(0, "_tropTard", {}, Math.min(23 * 60, s.min + 150));
            CR.PROC.stade(api, "gav", "Garde à vue au commissariat central du 18e ; avocat commis d'office désigné.");
            api.log("Commission d'office : garde à vue de Yanis Mebarki.");
          } else {
            CR.unschedule(s, (e) => e.caseId === cs.id);
            CR.closeCase(s, cs, { type: "declined", note: "Permanence refusée ; un confrère a pris la garde à vue." });
          }
        },
      },
    },
    on: {
      arrive(api) {
        const { s, cs } = api;
        CR.ringNow(s, { from: "Permanence pénale de l'Ordre", caseId: cs.id, kind: "permanence", data: { call: "intake" }, vmText: "Maître, la permanence pénale. Une garde à vue au commissariat du 18e. Rappelez-nous vite, sinon nous appelons le confrère suivant." }, false);
        api.schedule(0, "_permanenceExpire", {}, Math.min(23 * 60, s.min + 45));
      },
      _permanenceExpire(api) {
        const { s, cs } = api;
        if (cs.status !== "lead") return;
        CR.closeCase(s, cs, { type: "lost-lead", note: "La permanence n'a pas pu vous joindre et a désigné un confrère." });
        s.voicemails = s.voicemails.filter((v) => v.caseId !== cs.id);
      },
      _tropTard(api) {
        const { s, cs } = api;
        if (cs.flags.gavStarted || cs.status !== "active") return;
        api.rep("confreres", -2, "commission d'office acceptée, jamais honorée");
        CR.erreur(s, cs, { id: "gav_absent", texte: "Vous avez accepté la commission d'office sans vous rendre au commissariat.", sanction: "Au bout de deux heures, le bâtonnier a désigné un autre avocat ; Yanis a attendu seul.", regul: "Aucune." });
        CR.closeCase(s, cs, { type: "transferred", note: "Un autre avocat commis d'office a assisté Yanis." });
      },
      gavFin(api) {
        const { s, cs } = api;
        api.aj("gav", "Garde à vue");
        const day = s.day + 1;
        CR.PROC.fixAudience(api, { day, min: 14 * 60 + 30, juridiction: "ci", mode: "ci", convocDay: s.day, president: "pr_lacassagne", script: "ci", done: "apresCI", onMiss: "_absentCI", title: "Comparution immédiate — 23e chambre", duree: 50, lieu: "palais" });
        CR.PROC.stade(api, "ci", "Fin de garde à vue ; déferrement au parquet et comparution immédiate (art. 395).");
        cs.vars.ciDay = day;
      },
      _absentCI(api) {
        const { s, cs } = api;
        CR.erreur(s, cs, { id: "ci_absent", texte: "Vous n'étiez pas à la comparution immédiate.", sanction: "Un avocat de permanence a découvert le dossier à la barre.", regul: "Aucune." });
        CR.closeCase(s, cs, { type: "transferred", note: "Jugé avec l'avocat de permanence de la 23e chambre." });
      },
      // ---------------------------------------------- comparution immédiate
      renvoiDetention(api, { st }) {
        const { s, cs } = api;
        const g = ["A2_heberg", "A2_promesse", "A2_mere_presente", "A2_esr"].filter((f) => CR.hasFact(cs, f) || st.played.has(f)).length + (st.played.has("arg:garanties") ? 1 : 0);
        const prof = api.profil("president") || CR.PROFILS.presse;
        const score = 0.62 + (prof.severite - 0.5) * 0.3 - g * 0.11 + (R.next(s) - 0.5) * 0.1;
        const dp = score > 0.3;
        cs.vars.renvoi = true;
        let day = CR.rollForward(s.day + R.int(s, 62, 80));
        cs.vars.renvoiDay = day;
        if (dp) {
          CR.PROC.detention(api, "dp", { etab: "sante" });
          return [{ who: "president", t: `Le tribunal renvoie l'affaire au ${CR.fmtDate(day, "long")}. Compte tenu de la récidive et pour garantir la représentation du prévenu, il est placé en détention provisoire jusqu'à l'audience (art. 397-3).` }, { who: "sys", t: "(Yanis vous regarde. Les escortes le reconduisent vers le dépôt.)" }];
        }
        CR.PROC.detention(api, "cj", {});
        return [{ who: "president", t: `Le tribunal renvoie l'affaire au ${CR.fmtDate(day, "long")} et place le prévenu sous contrôle judiciaire : résider chez sa mère, pointer chaque semaine au commissariat, ne pas entrer en contact avec la victime.` }, { who: "sys", t: "(Yanis souffle. Il sortira ce soir.)" }];
      },
      decider(api, { st }) {
        const { s, cs } = api;
        const c = cs.vars.conseilGav || "expliquer";
        const perso = ["A2_heberg", "A2_promesse", "A2_mere_presente", "A2_esr", "A2_contrat"].filter((f) => CR.hasFact(cs, f)).length * 0.8 + (st.dernierMot === "regrets" ? 1 : 0) - (st.dernierMot === "victime" ? 1 : 0);
        return PEN.juger(api, {
          st, juridiction: "ci", titre: "Jugement — comparution immédiate", prevenuNom: "Yanis Mebarki", pcNom: "Mme Odile Lefort", pcF: true,
          spec: { seuil: 0.55, pieces: {
            interpellation: { label: "L'interpellation en flagrance, sac à la main", sens: "charge", force: 0.42 },
            victime: { label: "Les déclarations de Mme Lefort", sens: "charge", force: 0.25 },
            auditions_gav: { label: "Les auditions de garde à vue", sens: "charge", force: c === "silence" ? 0.03 : c === "partiel" ? 0.1 : cs.flags.pvRectifie ? 0.12 : 0.18 },
          } },
          qualif: () => ({ id: "vol_violences_recidive", label: "vol avec violences ayant entraîné une incapacité totale de travail n'excédant pas huit jours, en état de récidive légale", court: "art. 311-5 et 132-10 CP", encourue: { prison: 168, amende: 200000 }, requis: cs.vars.requis, motif: "L'interpellation en flagrance et les déclarations constantes de la victime établissent les faits ; la condamnation de 2023 pour vol, assimilé au vol avec violences au regard de la récidive, place le prévenu en récidive légale (art. 132-10 et 132-16)." }),
          personnalite: Math.max(0, perso),
          detenu: cs.proc.detention.statut === "dp" || (cs.proc.audience && cs.proc.audience.mode === "ci"),
          sansDomicile: !CR.hasFact(cs, "A2_heberg"),
          civil: { postes: [{ label: "Souffrances endurées et déficit fonctionnel temporaire", demande: 900, base: 800 }, { label: "Lunettes cassées", demande: 240, base: 240 }], art475: 0 },
        });
      },
      apresCI(api, res) {
        const { s, cs } = api;
        if (cs.vars.renvoi && !res.decision) {
          if (!cs.vars.renvoiFixe) {
            cs.vars.renvoiFixe = true;
            CR.PROC.fixAudience(api, { day: cs.vars.renvoiDay, min: 14 * 60, juridiction: "ci", mode: "ci_renvoi", convocDay: s.day, president: "pr_lacassagne", script: "ci_fond", done: "apresCI", onMiss: "_absentCI", title: "Comparution immédiate (renvoi) — 23e chambre", duree: 50, lieu: "palais" });
            CR.PROC.stade(api, "ci_renvoi", "Renvoi à la demande du prévenu (art. 397-1).");
          }
          return;
        }
        const dec = res.decision || {};
        api.aj("ci", "Comparution immédiate");
        const pn = dec.peine;
        if (dec.coupable && pn && pn.mandatDepot && pn.ferme > 0) {
          const debut = cs.proc.detention.statut === "dp" ? cs.proc.detention.since : s.day;
          CR.condamneDetenu(s, cs, pn.ferme, "sante", debut);
          api.tl(`Mandat de dépôt : Yanis est écroué à la Santé, sortie prévue le ${CR.fmtDate(cs.proc.detention.until, "long")}.`);
        } else if (cs.proc.detention.statut === "dp") {
          CR.PROC.detention(api, "libre", {});
          api.tl("Yanis sort libre de l'audience.");
        }
        CR.closeCase(s, cs, PEN.issue(api, dec));
      },
    },
    docs: {
      pv_notification: () => ({
        title: "Procès-verbal de placement en garde à vue et de notification des droits", kind: "pv",
        entete: ["Préfecture de police · Commissariat central du 18e", "Procédure n° 2026/18/05112 — cote D3"],
        paras: [
          [{ t: "Placement en garde à vue décidé à 13 h 10 par le brigadier-chef Mourad Benali, officier de police judiciaire, avec effet à 12 h 55, heure de l'interpellation.", f: "A2_debut" }],
          ["Motif : vol avec violences commis ce jour rue Ordener ; nécessité d'empêcher une concertation et de garantir la présentation de la personne devant le procureur (art. 62-2)."],
          [{ t: "À 15 h 15, notifions à M. Yanis Mebarki, dans une langue qu'il comprend, ses droits : être examiné par un médecin, faire prévenir un proche et son employeur, être assisté par un avocat, faire des déclarations, répondre aux questions ou se taire.", f: "A2_notif_1515", flag: "gav_notif" }],
          ["La personne demande l'assistance d'un avocat commis d'office et que sa mère soit avisée. Avis à la permanence des avocats à 15 h 20 ; avis à Mme Nadia Mebarki à 15 h 25."],
        ],
        signed: "Brigadier-chef M. Benali, OPJ",
      }),
      pv_interpellation: () => ({
        title: "Procès-verbal d'interpellation", kind: "pv",
        entete: ["Commissariat central du 18e · Brigade anticriminalité", "Cote D1"],
        paras: [
          ["À 12 h 52, rue Ordener, sommes hélés par une passante qui nous désigne un individu courant vers la rue Championnet."],
          [{ t: "L'individu tient à la main un sac de couleur rouge. Le rattrapons et l'interpellons à 12 h 55, angle des rues Championnet et Poissonniers.", f: "A2_sac_main" }],
          ["Revenus sur les lieux, constatons qu'une femme âgée est assise sur le trottoir, la main en sang ; elle reconnaît son sac."],
        ],
        signed: "Gardiens de la paix Lebrun et Ortiz",
      }),
      certif_gav: () => ({ title: "Certificat médical de garde à vue", kind: "courrier", entete: ["Unité médico-judiciaire — médecin requis"], paras: [["Examen de M. Yanis Mebarki à 16 h 40 : pas de lésion récente. État de santé compatible avec la garde à vue."]], signed: "Dr C. Royer" }),
      pv_victime: () => ({
        title: "Procès-verbal d'audition de la victime", kind: "pv",
        entete: ["Commissariat central du 18e", "Audition de Mme Odile Lefort, 67 ans — cote D5"],
        paras: [
          ["Je marchais rue Ordener. Quelqu'un a tiré mon sac par derrière. J'ai tenu la anse, j'ai été tirée et je suis tombée."],
          [{ t: "Je ne peux pas dire s'il m'a poussée. J'ai senti la secousse et je suis tombée.", f: "A2_victime_doute" }],
          ["Mes lunettes sont cassées et j'ai mal au poignet. Les urgences m'ont donné trois jours d'ITT."],
        ],
        signed: "Lu, persiste et signe.",
      }),
      casier: () => ({ title: "Bulletin n° 1 du casier judiciaire", kind: "greffe", entete: ["Casier judiciaire national · Nantes"], paras: [["Yanis Mebarki, né le 9 février 2002 à Paris 18e."], [{ t: "Tribunal correctionnel de Paris, 14 mars 2023 : vol, quatre mois d'emprisonnement avec sursis.", f: "A2_casier_b1" }]] }),
      esr: () => ({
        title: "Enquête sociale rapide", kind: "courrier",
        entete: ["Association de contrôle judiciaire — permanence du dépôt"],
        paras: [
          [{ t: "Domicile : chez sa mère, Mme Nadia Mebarki, rue Marcadet, depuis toujours. Hébergement vérifié par téléphone.", f: "A2_esr" }],
          ["Situation : intérimaire, cariste, missions irrégulières depuis un an. Dette déclarée d'environ 300 euros auprès d'un ami."],
          ["Avis : pas d'objection à une mesure alternative à la détention si l'hébergement est confirmé par écrit."],
        ],
      }),
    },
    docTitles: { pv_notification: "Notification des droits (D3)", pv_interpellation: "Interpellation (D1)", certif_gav: "Certificat médical", pv_victime: "Audition de la victime (D5)", casier: "Casier judiciaire", esr: "Enquête sociale rapide" },
    anomalies: { gav_notif: { irreg: "gav_notif_tardive", piece: "pv_notification", annule: ["auditions_gav"] } },
    penal: { no: ["nullite", "prep", "actes", "copie", "requete"] },
    gav: (api) => ({
      mode: "gav", attente: 25,
      arrivee: [`Commissariat central du 18e, ${CR.fmtTime(api.s.min)}. Le brigadier-chef Benali vous tend la procédure sans lever les yeux : « Il est en cellule 3. Vous avez trente minutes. »`],
      pieces: ["pv_notification", "pv_interpellation", "certif_gav"],
      entretien: {
        opening: ["Il est assis sur le banc de la cellule, en sweat gris, les mains sur les genoux. « Je savais pas qu'ils allaient m'appeler un avocat. »"],
        topics: [
          { id: "e_faits", q: "Dites-moi ce qui s'est passé, sans rien cacher.", a: ["J'ai arraché le sac. C'est vrai.", { t: "Elle a pas lâché, elle est tombée. Je l'ai pas poussée.", f: "A2_pas_pousse" }, "J'ai couru. Ils m'ont rattrapé deux rues plus loin."], cost: 5, unlock: ["e_pourquoi"] },
          { id: "e_pourquoi", q: "Pourquoi ?", a: [{ t: "Je dois 300 euros à un gars. Il me met la pression.", f: "A2_dette" }, "C'était débile. Je regrette, vraiment."], cost: 3 },
          { id: "e_heure", q: "À quelle heure vous a-t-on lu vos droits ?", a: ["Tard. Ils ont fait les photos, les empreintes, la fouille…", { t: "Les droits, c'était vers trois heures. J'ai vu l'horloge du couloir.", f: "A2_droits_tard" }], cost: 3 },
          { id: "e_famille", q: "Où vivez-vous ? Avec qui ?", a: [{ t: "Chez ma mère, rue Marcadet. Elle peut dire au juge que j'habite là.", f: "A2_heberg" }, { t: "Elle viendra demain si on l'appelle : 06 52 18 33 07.", f: "A2_mere_tel" }], cost: 3 },
          { id: "e_travail", q: "Vous travaillez ?", a: [{ t: "Intérim, cariste. L'agence Interim Plus, à Clignancourt, m'a proposé une mission de trois mois qui commence lundi.", f: "A2_promesse_dite" }], cost: 3 },
          { id: "e_casier", q: "Avez-vous déjà été condamné ?", a: [{ t: "Une fois, il y a trois ans. Un vol de téléphone. Quatre mois avec sursis.", f: "A2_casier" }], cost: 2 },
          { id: "e_secret", q: "Ce que vous me dites reste entre nous. Votre mère vous a fait passer un message ?", a: ["Non. Mais dites-lui que je vais bien, s'il vous plaît."], cost: 2 },
        ],
        start: ["e_faits", "e_heure", "e_famille", "e_travail", "e_casier", "e_secret"],
      },
      audition: () => [
        { q: "Reconnaissez-vous avoir arraché le sac de Mme Lefort, rue Ordener, à 12 h 50 ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: "Oui. J'ai tiré le sac et j'ai couru.", partiel: "Je reconnais avoir pris le sac." } },
        { q: "Mme Lefort a soixante-sept ans. Elle est tombée, elle a trois jours d'ITT. Vous l'avez poussée ?", fq: "A2_q_itt", a: { silence: "Je ne souhaite pas répondre.", expliquer: "Non ! Elle tenait le sac, elle est tombée quand j'ai tiré.", partiel: "Je ne répondrai pas à ça." } },
        { q: "Une caméra de la RATP filme la sortie du métro Marcadet. On va vous voir, vous le savez ?", fq: "A2_q_camera", a: { silence: "…", expliquer: "Je sais pas. Je suis passé par là, oui.", partiel: "Je n'ai rien à ajouter." } },
        { q: "Vous avez déjà été condamné pour vol. Vous recommencez ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: "C'était il y a trois ans. J'ai fait une connerie aujourd'hui.", partiel: "Je n'ai rien à ajouter." } },
      ],
      questions: [
        { id: "q_heure", q: "À quelle heure les droits de mon client lui ont-ils été notifiés ?", a: "(L'officier, sèchement) : C'est au procès-verbal, maître. 15 h 15.", f: "A2_q_heure_opj", sensible: true },
        { id: "q_poussee", q: "Monsieur Mebarki, avez-vous poussé Mme Lefort ?", a: "Non. Elle a tenu le sac. Elle est tombée quand j'ai tiré.", f: "A2_pas_pousse" },
        { id: "q_mere", q: "Votre mère pourra-t-elle vous héberger ?", a: "Oui, je vis chez elle depuis toujours.", f: "A2_heberg", anodine: true },
      ],
      observations: [
        { id: "obs_notif", t: "Les droits ont été notifiés à 15 h 15, plus de deux heures après le début de la mesure (12 h 55), sans qu'aucune circonstance insurmontable soit mentionnée (art. 63-1).", flag: "gav_notif" },
        { id: "obs_garanties", t: "Mon client dispose d'un hébergement stable chez sa mère et d'une promesse de mission d'intérim." },
      ],
      get relecture() {
        const c = api.cs.vars.conseilGav;
        if (c === "silence") return { segs: [{ t: "La personne déclare : Je ne souhaite pas répondre aux questions." }] };
        return { segs: [{ t: "La personne déclare :" }, { t: "J'ai pris le sac de la dame." }, { t: "Je l'ai poussée pour prendre le sac.", erreur: true, correct: "Elle a tenu le sac ; elle est tombée quand j'ai tiré." }, { t: "Je regrette." }] };
      },
      issue: (a) => {
        a.run("gavFin");
        return { texte: [
          "Vers 19 heures, le brigadier-chef revient du téléphone : « Le parquet veut une comparution immédiate. Il est déféré demain matin, il passe au tribunal dans l'après-midi. »",
          "Yanis passera la nuit en cellule, puis au dépôt du tribunal. Demain, vous aurez quelques heures pour réunir ses garanties de représentation.",
        ] };
      },
    }),
    flow: { tasks: PEN.tasks },
    tasks(api, T) {
      const { s, cs } = api;
      if (cs.proc.stade === "gav" && !cs.flags.gavStarted) T({ id: "gav", label: "Assister Yanis en garde à vue", sub: "Commissariat central du 18e. L'entretien dure trente minutes au plus.", kind: "meet", time: 0, where: "commissariat", urgent: true, run: () => ({ scene: "gav" }) });
      const ci = cs.proc.audience;
      if (ci && ci.day === s.day && ["ci", "ci_renvoi"].includes(ci.mode)) {
        if (!cs.flags.depotVu) T({ id: "depot", label: "Lire le dossier et voir Yanis au dépôt", sub: "Au tribunal, avant l'audience : la victime, le casier, l'enquête sociale rapide.", kind: "meet", time: 30, where: "palais", urgent: true, run: () => {
          CR.spend(s, 30, "meet"); cs.flags.depotVu = s.day;
          for (const k of ["pv_victime", "casier", "esr"]) if (!CR.hasDoc(cs, k)) api.doc(k, api.def.docTitles[k]);
          cs.flags.prepClient = s.day; api.tl("Dossier consulté et Yanis vu au dépôt."); CR.toast(s, "Trois pièces versées à votre dossier : audition de la victime, casier, enquête sociale.", "info"); return null; } });
        PEN.persoTasks(api, T, [
          { id: "mere", label: "Appeler la mère de Yanis", sub: "Une attestation d'hébergement, et sa présence à l'audience.", fact: "A2_mere_presente", text: "Mme Mebarki confirme l'hébergement ; elle apporte une attestation et sa quittance de loyer, et sera dans la salle.", time: 15, cond: () => CR.hasFact(cs, "A2_mere_tel") || CR.hasFact(cs, "A2_heberg") },
          { id: "agence", label: "Appeler l'agence d'intérim", sub: "Une promesse de mission écrite, envoyée au greffe.", fact: "A2_promesse", text: "Interim Plus Clignancourt confirme par courriel une mission de cariste de trois mois à compter de lundi.", time: 15, cond: () => CR.hasFact(cs, "A2_promesse_dite"), fail: (a) => !a.cs.flags.agenceRappel && (a.cs.flags.agenceRappel = true) && R.chance(a.s, 0.5), failText: "L'agence ne répond pas. Réessayez dans un moment." },
        ]);
      }
    },
    audiences: {
      ci(api) { return script(api, true); },
      ci_fond(api) { return script(api, false); },
    },
    debrief(api, o) {
      const { cs } = api;
      const items = [{ kind: "rule", text: "En comparution immédiate, pas de délai de trois jours pour les nullités, mais l'exception se soulève avant toute défense au fond (art. 385)." }];
      const m = cs.proc.moyens.find((x) => x.flag === "gav_notif");
      if (!m) items.push({ kind: "surprise", text: "Les droits ont été notifiés à 15 h 15 pour une garde à vue commencée à 12 h 55 : personne n'a soulevé la nullité." });
      if (cs.vars.renvoi) items.push({ kind: "info", text: "Yanis a demandé un délai pour préparer sa défense : la peine encourue dépassant sept ans, le renvoi est de deux à quatre mois (art. 397-1)." });
      if (!CR.hasFact(cs, "A2_heberg")) items.push({ kind: "bad", text: "Sans hébergement établi, ni contrôle judiciaire ni aménagement de peine." });
      return items.concat(cs.vars.debriefJugement || []);
    },
    epilogue(api, o) {
      const p = api.cs.vars.peine;
      if (o.type === "relaxe") return "Yanis est sorti libre. Il a commencé sa mission chez Interim Plus le lundi suivant.";
      if (p && p.mandatDepot) return `${p.texte}. Yanis est à la Santé. Sa mère vient au parloir le samedi.`;
      if (p && p.amenagement) return `${p.texte}. Yanis porte un bracelet électronique et travaille comme cariste à Gennevilliers.`;
      return `${p ? p.texte : "Condamné"}. Yanis a commencé sa mission d'intérim ; il a remboursé sa dette en trois mois.`;
    },
    fiche(api, o) {
      return {
        phrase: "Vol avec violences en récidive, garde à vue puis comparution immédiate, avocat commis d'office de Yanis Mebarki.",
        notions: [
          { titre: "La notification immédiate des droits", regle: "Les droits sont notifiés dès le placement en garde à vue ; un retard que ne justifie aucune circonstance insurmontable porte nécessairement atteinte aux intérêts de la personne.", art: "art. 63-1 CPP", prog: "pp_enquete" },
          { titre: "La récidive légale délictuelle", regle: "Un nouveau délit identique ou assimilé dans les cinq ans de l'expiration ou de la prescription de la précédente peine double le maximum encouru ; le vol et le vol aggravé sont assimilés.", art: "art. 132-10 et 132-16 CP", prog: "dpg" },
          { titre: "Le renvoi en comparution immédiate", regle: "Le prévenu peut refuser d'être jugé le jour même ; le renvoi est de deux à six semaines, ou de deux à quatre mois si la peine encourue dépasse sept ans, avec une décision sur la détention.", art: "art. 397-1 et 397-3 CPP", prog: "pp_jugement" },
        ],
        piege: "Les garanties de représentation se rassemblent le matin même : une attestation d'hébergement vaut toutes les plaidoiries.",
        devenir: api.def.epilogue(api, o),
      };
    },
    corrige(api) {
      return [
        { probleme: "Quelle infraction, quelle peine encourue ?", regle: "Vol avec violences ayant entraîné une ITT de huit jours au plus : sept ans (art. 311-5 CP). En récidive légale, le maximum est doublé (art. 132-10).", application: "Trois jours d'ITT, une condamnation pour vol en 2023 : quatorze ans encourus." },
        { probleme: "La garde à vue est-elle régulière ?", regle: "La notification des droits doit être immédiate (art. 63-1) ; un retard injustifié entraîne la nullité sans qu'il soit besoin de prouver un grief. En comparution immédiate, l'exception se soulève avant toute défense au fond (art. 385), sans délai de trois jours.", application: "Interpellation à 12 h 55, notification à 15 h 15, aucune circonstance insurmontable : les auditions tombent. L'interpellation en flagrance et le témoignage de la victime restent." },
        { probleme: "Jugé aujourd'hui ou plus tard ?", regle: "Le prévenu peut demander un délai : deux à quatre mois quand la peine encourue dépasse sept ans (art. 397-1) ; le tribunal statue alors sur la détention (art. 397-3).", application: "Avec un hébergement et une promesse de mission, un contrôle judiciaire est plaidable ; sans garanties, le renvoi se fait en détention." },
      ];
    },
  });

  // L'audience de comparution immédiate : avec le choix du renvoi (premier passage) ou au fond (après renvoi)
  function script(api, premier) {
    const { s, cs } = api;
    const fond = [
      { limine: { joindre: true } },
      { who: "president", t: "Je résume. Rue Ordener, à 12 h 50, arrachage du sac de Mme Lefort, soixante-sept ans, qui chute. Interpellation trois minutes plus tard, sac à la main. Trois jours d'ITT." },
      { who: "president", t: "Monsieur Mebarki, vous reconnaissez les faits ?" },
      { if: () => !!cs.flags.depotVu, then: [{ who: "client", t: "Oui, monsieur le président. J'ai pris le sac. Elle a tenu, elle est tombée. Je regrette.", signal: "bon" }], else: [{ who: "client", t: "J'ai pris le sac, mais je l'ai pas poussée, faut pas exagérer.", fx: { cred: -2 }, signal: "mauvais" }] },
      { who: "president", t: "Votre casier : une condamnation pour vol en 2023. Vous êtes en récidive." },
      { who: "victime", name: "Odile Lefort", t: "Je voudrais juste qu'il ne recommence pas. Et mes lunettes, elles m'ont coûté 240 euros.", interject: { need: ["A2_victime_doute"], window: 5000, label: "Monsieur le président, Mme Lefort a déclaré aux enquêteurs ne pas pouvoir dire si elle a été poussée.", ok: { fx: { play: ["A2_victime_doute"] }, then: [{ who: "president", t: "C'est exact, cote D5. Madame ?" }, { who: "victime", name: "Odile Lefort", t: "Oui. Je ne sais pas. J'ai senti la secousse." }] } } },
      { card: { prompt: "Le président : « Maître, des garanties de représentation ? Je n'ai rien au dossier. »", accept: ["A2_mere_presente", "A2_promesse", "A2_esr", "A2_heberg"], window: 12000, ok: { fx: { flags: { garantiesProduites: true } }, then: [{ who: "president", t: "Bien. Je les verse au dossier." }] }, miss: { then: [{ who: "president", t: "Rien, donc." }] } } },
      AUD.requisitions({ ferme: 12, mandatDepot: true }, { avant: ["Un arrachage sur une personne âgée, en récidive, trois ans après une première condamnation pour vol.", "Le sursis n'a pas suffi. Je requiers une peine ferme et le maintien en détention."] }),
      { who: "president", t: "La parole est à la défense." },
      { plaidoirie: { role: "defense", max: 4,
        angles: [{ id: "peine", t: "La peine : un aménagement", sub: "Ne pas contester les faits ; obtenir une peine aménageable ou un sursis probatoire." }, { id: "relaxe", t: "La relaxe", sub: "Contester les violences et la culpabilité." }],
        mixte: (angle, picked) => angle === "relaxe" && picked.includes("garanties"),
        args: [
          { id: "garanties", label: "Un hébergement vérifié et une mission d'intérim lundi", say: "Il vit chez sa mère, qui est dans la salle ; une mission de trois mois commence lundi. Ce sont des garanties, pas des promesses.", cards: ["A2_heberg", "A2_mere_presente", "A2_promesse", "A2_esr"] },
          { id: "chute", label: "Elle a tenu le sac ; il ne l'a pas poussée", say: "Mme Lefort l'a dit elle-même : elle ne sait pas si elle a été poussée. Elle a tenu l'anse, elle est tombée quand il a tiré.", cards: ["A2_victime_doute", "A2_pas_pousse"] },
          { id: "aménagement", label: "Une peine aménageable (art. 132-19 et 132-25)", say: "L'emprisonnement ferme est le dernier recours ; jusqu'à un an, il doit être aménagé si la personnalité le permet.", cards: ["CP_132-19", "CP_132-25"] },
          { id: "regrets", label: "Ses regrets et l'indemnisation de la victime", say: "Il regrette, il le dira. Il remboursera les lunettes de Mme Lefort sur son premier salaire.", cards: ["A2_dette", "A2_pas_pousse"] },
          { id: "contestation", label: "Contester qu'il soit l'auteur", say: "Rien ne prouve que mon client soit l'auteur de l'arrachage.", pertinent: () => false },
        ] } },
      { dernierMot: { prepare: [
        { id: "regrets", label: "Des regrets, tournés vers Mme Lefort", t: "Je regrette, madame. Je vous rembourserai vos lunettes.", signal: "bon" },
        { id: "victime", label: "Dire qu'elle n'aurait pas dû résister", t: "Si elle avait lâché le sac, elle serait pas tombée.", fx: { cred: -4 }, signal: "mauvais" },
        { id: "rien", label: "Rien de plus", t: "Je n'ai rien à ajouter." },
      ], spontane: { id: "spontane", t: "Je… pardon. Je voulais pas qu'elle tombe." } } },
      { delibere: { texte: "Le tribunal se retire. Dix minutes plus tard — il reste vingt dossiers au rôle — : « Le tribunal ! »", duree: 15 } },
    ];
    const ouverture = AUD.ouverture(api, { prevenu: YANIS, prevenuWho: "client", prevention: "Vous êtes prévenu d'avoir, à Paris 18e, le " + CR.fmtDate(cs.proc.faitsDay, "long") + ", soustrait frauduleusement le sac à main de Mme Odile Lefort, avec cette circonstance que le vol a été accompagné de violences ayant entraîné une incapacité totale de travail n'excédant pas huit jours, et ce en état de récidive légale. Articles 311-5 et 132-10 du code pénal.", victime: VICTIME });
    const steps = premier
      ? ouverture.concat([
        { who: "president", t: "Monsieur, vous pouvez être jugé aujourd'hui, ou demander un délai pour préparer votre défense. La peine encourue dépassant sept ans, ce délai serait de deux à quatre mois. Votre avocat vous a conseillé ?" },
        { choose: [
          { t: "« Il accepte d'être jugé aujourd'hui. »", reply: "Bien. Nous retenons l'affaire.", then: fond },
          { t: "« Il demande un délai pour préparer sa défense (art. 397-1). »", reply: "Le tribunal entend le ministère public sur la détention.", then: [
            { who: "parquet", t: "Récidive, personne âgée, aucune garantie sérieuse au dossier : je requiers le placement en détention provisoire jusqu'à l'audience." },
            { who: "president", t: "Maître ?" },
            { plaidoirie: { role: "jld", max: 3, args: [
              { id: "garanties", label: "L'hébergement chez sa mère, vérifié", say: "Il vit chez sa mère depuis toujours ; elle est dans la salle, avec une attestation.", cards: ["A2_heberg", "A2_mere_presente", "A2_esr"] },
              { id: "travail", label: "La mission d'intérim qui commence lundi", say: "Une mission de trois mois commence lundi : la détention la lui ferait perdre.", cards: ["A2_promesse"] },
              { id: "cj", label: "Un contrôle judiciaire suffit", say: "Un contrôle judiciaire avec obligation de résider chez sa mère et interdiction de contact suffit.", cards: ["CPP_144", "CPP_143-1"] },
              { id: "nullite", label: "La nullité de la garde à vue", say: "La garde à vue est nulle ; je le plaiderai au fond.", pertinent: () => false },
            ] } },
            { do: (a, st) => a.run("renvoiDetention", { st }) },
            { end: true },
          ] },
        ] },
      ])
      : ouverture.concat([{ who: "president", t: "L'affaire a été renvoyée à la demande du prévenu. Nous retenons l'affaire au fond." }], fond);
    return { title: "23e chambre — comparutions immédiates", sub: "Tribunal judiciaire de Paris · Batignolles", decor: { scene: "salle", box: true, fin: "Les escortes ramènent Yanis vers le dépôt. Le dossier suivant est déjà appelé." }, steps };
  }
})();
