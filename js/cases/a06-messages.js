/* Affaire 6 — Les messages.
   Défense. Audition libre, menaces ou harcèlement, alternatives aux poursuites.
   Pièges : laisser le client reconnaître des faits avant d'avoir entendu les messages ; oublier qu'il peut quitter les locaux. */
(function () {
  const CR = window.CR;
  const R = CR.R;
  const PEN = CR.PEN;
  const AUD = CR.AUD;
  const KARIM = { prenom: "Karim", nom: "Benhamou", g: "m", age: 38, metier: "restaurateur", tel: "06 58 41 77 02", trust: 55, look: { skin: 3, hair: "side", hc: "black", beard: 1 }, naissance: "le 30 janvier 1988 à Argenteuil", adresse: "rue Custine, Paris 18e" };
  const DEF = "a06_messages";

  CR.defineCase({
    id: DEF, camp: "defense", domaine: "tc", domaineLib: "dps",
    title: "Benhamou — les messages",
    arrive: { day: 23, min: 9 * 60 + 50 },
    client: KARIM, leadPatience: 3,
    voicemail: "Maître, Karim Benhamou. La police me convoque pour une audition, à cause de messages que j'ai envoyés à mon ancien associé. C'est dans quatre jours. Rappelez-moi.",
    profile: { wealth: 3, sens: 0.4, urgency: 0.8, temper: "presse" },
    honoraires: { forfait: 1300, heures: 7, types: ["forfait", "temps"], resultat: "classement ou alternative aux poursuites" },
    mission: "Assistance de M. Benhamou lors de son audition libre et auprès du parquet ; en cas de poursuite, défense devant le tribunal correctionnel jusqu'à la décision de première instance.",
    urgence: true,
    actors: { opj: "opj_marchetti", parquet: "pq_haddou", president: "pr_benkirane", adverse: "av_tessier" },
    proc: { stade: "enquete", nature: "delit", faits: -20, infractions: ["CP_222-17", "CP_222-33-2-2"], pcConstituee: true },
    init(api, cs) { cs.vars.auditionDay = CR.rollForward(cs.vars.base + 4); api.at(cs.vars.auditionDay, "_auditionCheck", {}, 16 * 60); },
    vars: (s, cs) => ({ auditionDow: cs.vars.auditionDay != null ? CR.fmtDate(cs.vars.auditionDay, "dowshort") : "…" }),
    facts: {
      K_convoc: { label: "La date de l'audition libre", key: true },
      K_dette: { label: "La dette de 12 000 € de l'ancien associé", key: true, why: "Le contexte explique les messages, sans les excuser : c'est la base d'une alternative aux poursuites." },
      K_regretter: { label: "« Tu vas le regretter »", key: true, why: "Une menace de crime ou de délit ? C'est toute la question de l'article 222-17." },
      K_femme: { label: "« Je vais tout raconter à ta femme »", why: "Une pression, pas une menace de crime ou de délit contre les personnes." },
      K_nombre: { label: "Une quarantaine de messages en deux semaines", key: true, why: "La répétition fait le harcèlement (art. 222-33-2-2)." },
      K_arrete: { label: "Il a cessé d'écrire depuis la convocation", why: "Un élément décisif pour le parquet." },
    },
    calls: {
      intake: {
        opening: ["Maître, Karim Benhamou. J'ai une convocation de la police, pour une audition libre. Mon ancien associé a porté plainte à cause de mes messages."],
        topics: [
          { id: "k_quand", q: "Quand et où êtes-vous convoqué ?", a: [{ t: "{auditionDow}, à 14 heures, au commissariat du 18e. Audition libre, c'est écrit.", f: "K_convoc" }], cost: 2 },
          { id: "k_contexte", q: "Que s'est-il passé avec votre associé ?", a: ["On avait un restaurant ensemble, rue Ordener. On a fermé en juin.", { t: "Julien Mercier me doit 12 000 euros sur la liquidation. Il ne répond plus.", f: "K_dette" }, { t: "C'est mon ancien associé, Julien Mercier.", f: "K_mercier" }], cost: 4, unlock: ["k_messages"] },
          { id: "k_messages", q: "Qu'avez-vous écrit, exactement ? Je dois tout savoir.", a: ["Beaucoup de messages. Je voulais qu'il réponde.", { t: "Une quarantaine, peut-être, en deux semaines.", f: "K_nombre" }, "Je ne me souviens pas de tout. Il y en a un où je dis qu'il va le regretter."], cost: 4, unlock: ["k_menace"] },
          { id: "k_menace", q: "« Il va le regretter » : vous pensiez à quoi ?", a: ["À un procès ! Au tribunal de commerce. Je ne suis pas violent, maître."], cost: 2 },
          { id: "k_arret", q: "Lui écrivez-vous encore ?", a: [{ t: "Non. Depuis la convocation, plus rien.", f: "K_arrete" }], cost: 2 },
          { id: "k_casier", q: "Avez-vous déjà eu affaire à la justice ?", a: [{ t: "Jamais.", f: "K_casier" }], cost: 1 },
          { id: "k_bad", q: "Expliquez-lui tout, aux policiers, vous n'avez rien à cacher.", a: ["Oui, voilà. Je vais tout leur dire."], cost: 1, tag: "bad", fx: { flags: { conseilTout: true } } },
        ],
        start: ["k_quand", "k_contexte", "k_arret", "k_casier", "k_bad"],
        patience: 75,
        close: "Bon. Vous serez avec moi ?",
      },
    },
    advice: [
      { id: "k_stop", t: "N'envoyez plus aucun message à M. Mercier, d'aucune façon." },
      { id: "k_attendre", t: "Avant de répondre aux policiers, écoutons ensemble les messages qu'ils vous liront." },
      { id: "k_quitter", t: "Souvenez-vous que vous pouvez quitter les locaux à tout moment : c'est une audition libre." },
      { id: "k_commerce", t: "Pour la dette, saisissez le tribunal de commerce, pas son téléphone." },
      { id: "k_dernier", t: "Envoyez-lui un dernier message pour vous excuser." },
    ],
    tpls: {
      observations_parquet: (api) => ({
        title: "Observations au procureur de la République", kind: "courrier", time: 50, dirLabel: "Envoyées",
        to: "Madame la procureure de la République, tribunal judiciaire de Paris",
        slots: { objet: CR.choiceSlot("Objet", [
          { t: "Je me permets de vous adresser, avant toute décision sur l'orientation de la procédure, les observations suivantes.", ok: true },
          { t: "Je vous demande de classer immédiatement cette plainte mensongère.", ok: false, defect: "objet:agressif" },
        ]) },
        checks: [{ id: "points", label: "Les observations", heading: "Sur la procédure :", options: [
          { id: "contexte", t: "Le contexte : une dette de 12 000 € née de la liquidation de leur société, que M. Mercier refuse de régler.", ok: null, needs: "K_dette" },
          { id: "qualif", t: "« Tu vas le regretter » ne menace d'aucun crime ni délit contre les personnes : la menace de l'article 222-17 n'est pas caractérisée.", ok: null, needs: ["K_regretter", "CP_222-17"] },
          { id: "arret", t: "M. Benhamou a cessé tout contact depuis sa convocation et s'engage à ne plus écrire.", ok: null, needs: "K_arrete" },
          { id: "casier", t: "Il n'a aucun antécédent judiciaire.", ok: null, needs: "K_casier" },
          { id: "alternative", t: "Une mesure alternative aux poursuites — un avertissement pénal probatoire, ou un stage de citoyenneté — répondrait aux faits (art. 41-1).", ok: null, needs: "CPP_41-1" },
          { id: "menteur", t: "M. Mercier est un menteur qui cherche à échapper à ses dettes.", ok: false, defect: "points:attaque" },
        ] }],
        body: [["Madame la procureure,"], ["J'assiste M. Karim Benhamou, entendu librement le ", CR.fmtDate(api.cs.vars.auditionDay || api.s.day, "long"), " sur la plainte de M. Julien Mercier. ", { s: "objet" }]],
      }),
    },
    docs: {
      convocation: (x) => ({ title: "Convocation en audition libre", kind: "pv", entete: ["Commissariat central du 18e"], paras: [[`M. Karim Benhamou est invité à se présenter le ${CR.fmtDate(x.cs.vars.auditionDay, "dow")} à 14 heures, pour être entendu librement sur des faits de menaces et de harcèlement (art. 61-1).`], ["Il peut être assisté par un avocat."]] }),
      plainte: () => ({ title: "Plainte de M. Julien Mercier", kind: "pv", entete: ["Commissariat central du 18e · cote D1"], paras: [["Depuis la fermeture de notre restaurant, M. Benhamou m'envoie des messages tous les jours, la nuit aussi."], [{ t: "Il m'a écrit : « Tu vas le regretter. » J'ai peur pour moi et pour ma famille.", f: "K_plainte_peur" }], ["J'ai changé de numéro. Je dors mal."]], signed: "Lu, persiste et signe." }),
      captures: () => ({ title: "Captures d'écran des messages (extraits)", kind: "sms", paras: [
        [{ t: "« Réponds. » (trente et une fois en deux semaines)", f: "K_nombre" }],
        [{ t: "« Tu vas le regretter. »", f: "K_regretter" }],
        [{ t: "« Je vais tout raconter à ta femme. »", f: "K_femme" }],
        ["« Tu me dois 12 000 euros, tu le sais. »"],
      ] }),
      certificat: () => ({ title: "Certificat médical de M. Mercier", kind: "courrier", entete: ["Dr Paul Lemoine, médecin généraliste"], paras: [[{ t: "État anxieux réactionnel ; troubles du sommeil. Pas d'incapacité totale de travail.", f: "K_certif" }]] }),
      avertissement: () => ({ title: "Avertissement pénal probatoire", kind: "greffe", entete: ["Parquet de Paris · délégué du procureur"], paras: [["M. Karim Benhamou a été convoqué devant le délégué du procureur."], ["Il lui a été rappelé les obligations résultant de la loi et les peines encourues ; il s'est engagé à ne plus entrer en contact avec M. Mercier pendant un an. En cas de nouvelle infraction dans ce délai, le procureur pourra engager des poursuites pour les faits initiaux (art. 41-1, 1°)."]] }),
    },
    docTitles: { convocation: "Convocation en audition libre", plainte: "Plainte de M. Mercier (D1)", captures: "Captures des messages", certificat: "Certificat de M. Mercier", avertissement: "Avertissement pénal probatoire" },
    penal: { no: ["actes", "copie", "requete"], copieTC: { docs: ["plainte", "captures", "certificat"] } },
    gav: (api) => ({
      mode: "audition", attente: 15,
      arrivee: ["Commissariat central du 18e, 14 heures. La capitaine Marchetti vous reçoit dans un bureau sans fenêtre, un épais dossier devant elle."],
      droits: [
        `Monsieur Benhamou, vous êtes entendu librement sur des faits de menaces et de harcèlement à l'encontre de M. Julien Mercier, commis à Paris entre le ${CR.fmtDate(api.cs.proc.faitsDay - 12, "long")} et le ${CR.fmtDate(api.cs.proc.faitsDay, "long")}.`,
        { t: "Vous pouvez quitter à tout moment les locaux où vous êtes entendu.", f: "K_droit_quitter" },
        "Vous avez le droit de faire des déclarations, de répondre aux questions ou de vous taire.",
        "Vous êtes assisté de votre avocat. Vous pouvez bénéficier de conseils juridiques gratuits.",
      ],
      conseils: [
        { id: "silence", t: "Garder le silence", sub: "Il ne dit rien des messages. Le parquet décidera sans sa version." },
        { id: "partiel", t: "Écouter d'abord, puis reconnaître les messages sur la dette", sub: "Il admet avoir écrit, parle de la dette, conteste toute intention de menacer." },
        { id: "expliquer", t: "Tout reconnaître tout de suite", sub: "Il dit avoir voulu lui faire peur, avant même d'entendre les messages." },
        { id: "quitter", t: "Écourter : il quitte les locaux après les premières questions", sub: "C'est son droit. L'audition s'arrête là ; le parquet décidera sur le dossier." },
      ],
      audition: (a, ctx) => {
        const all = [
          { q: "Reconnaissez-vous avoir envoyé une quarantaine de messages à M. Mercier en deux semaines ?", fq: "K_nombre", a: { silence: "Je ne souhaite pas répondre.", partiel: "Je lui ai écrit, oui. Il me doit 12 000 euros et ne répond plus.", expliquer: "Oui. Je voulais lui faire peur, qu'il paie.", quitter: "…" } },
          { q: "Je vous lis l'un d'eux : « Tu vas le regretter. » Que vouliez-vous dire ?", fq: "K_regretter", a: { silence: "Je ne souhaite pas répondre.", partiel: "Qu'il allait regretter de ne pas payer : j'allais l'assigner au tribunal de commerce.", expliquer: "Qu'il allait avoir des problèmes. Je voulais qu'il ait peur.", quitter: "Je préfère m'arrêter là. Je pars." } },
          { q: "Et celui-ci : « Je vais tout raconter à ta femme. »", fq: "K_femme", a: { silence: "…", partiel: "Il lui a caché la dette. C'était bête.", expliquer: "Oui, pour faire pression." } },
          { q: "M. Mercier a changé de numéro. Il dit avoir peur pour sa famille. Vous comprenez ?", a: { silence: "…", partiel: "Je ne voulais pas qu'il ait peur. J'ai arrêté.", expliquer: "Il exagère. Mais oui, j'ai insisté." } },
        ];
        return ctx.conseil === "quitter" ? all.slice(0, 2) : all;
      },
      questions: [
        { id: "q_dette", q: "Monsieur Benhamou, que vous doit M. Mercier ?", a: "12 000 euros, sur la liquidation de notre société. J'ai les comptes.", f: "K_dette" },
        { id: "q_arret", q: "Avez-vous écrit à M. Mercier depuis votre convocation ?", a: "Non. Plus rien depuis.", f: "K_arrete", anodine: true },
        { id: "q_violence", q: "Capitaine, la plainte fait-elle état d'une menace de violence précise ?", a: "(L'officière) : Je ne répondrai pas à cette question, maître.", sensible: true },
      ],
      observations: [
        { id: "obs_dette", t: "Les messages s'inscrivent dans un litige commercial : une dette de 12 000 € née de la liquidation de leur société." },
        { id: "obs_arret", t: "Mon client a cessé tout contact et s'engage à ne plus écrire." },
      ],
      get relecture() {
        const c = api.cs.vars.conseilGav;
        if (c === "silence" || c === "quitter") return { segs: [{ t: "La personne déclare : Je ne souhaite pas répondre aux questions." }] };
        if (c === "expliquer") return { segs: [{ t: "La personne déclare : J'ai envoyé ces messages." }, { t: "Je voulais lui faire peur." }] };
        return { segs: [{ t: "La personne déclare : J'ai écrit à M. Mercier au sujet de sa dette." }, { t: "Quand j'ai écrit qu'il allait le regretter, je pensais à des menaces.", erreur: true, correct: "Quand j'ai écrit qu'il allait le regretter, je pensais à une action devant le tribunal de commerce." }, { t: "J'ai cessé de lui écrire." }] };
      },
      issue: (a, ctx) => {
        const { s, cs } = a;
        cs.flags.auditionFaite = s.day;
        if (ctx.conseil === "quitter") cs.flags.parti = true;
        a.run("_transmission");
        return { texte: [ctx.conseil === "quitter" ? "M. Benhamou se lève : « Je m'arrête là. » La capitaine note l'heure : « C'est votre droit. Le dossier part au parquet. »" : "« Le dossier part au parquet, maître. Vous aurez des nouvelles par la procureure. »", "Le parquet décidera dans les semaines qui viennent : classement, alternative aux poursuites, ou tribunal. Rien ne vous interdit de lui écrire d'ici là."] };
      },
    }),
    flow: { tasks: PEN.tasks },
    tasks(api, T) {
      const { s, cs } = api;
      const jour = cs.vars.auditionDay;
      if (!cs.flags.auditionFaite && s.day <= jour) {
        const tard = s.day === jour && s.min > 15 * 60;
        T({ id: "audition", label: "Assister Karim à son audition libre", sub: s.day < jour ? `${CR.cap(CR.fmtDate(jour, "dowshort"))} à 14 heures, commissariat du 18e.` : tard ? "Trop tard : l'audition a commencé." : "Aujourd'hui à 14 heures.", kind: "meet", time: 0, where: "commissariat", urgent: s.day === jour, enabled: s.day === jour && !tard, why: s.day < jour ? `Elle a lieu ${CR.fmtDate(jour, "dowshort")}.` : "", run: () => { if (s.min < 14 * 60) CR.spend(s, 14 * 60 - s.min, "idle", { fixed: true, busy: true }); return { scene: "gav" }; } });
      }
      if (cs.flags.auditionFaite && !cs.vars.decisionParquet && !CR.drafted(cs, "observations_parquet")) T({ id: "observations", label: "Adresser des observations au procureur", sub: "Avant que le parquet ne décide de l'orientation : contexte, qualification, alternative.", kind: "draft", time: 50, run: () => ({ scene: "draft", tpl: "observations_parquet" }) });
      if (cs.proc.audience && cs.proc.audience.juridiction === "tc") PEN.copieTask(api, T);
    },
    on: {
      engaged(api) {
        const { cs } = api;
        api.mail({ from: "Karim Benhamou", subject: "Ma convocation", kind: "email", doc: "convocation", title: "Convocation en audition libre", body: [["Voici la convocation, maître."]] });
        if (cs.advice.includes("k_dernier")) cs.flags.nouveauxMessages = true;
        if (!cs.advice.includes("k_stop") && R.chance(api.s, 0.5)) cs.flags.nouveauxMessages = true;
      },
      _auditionCheck(api) {
        const { s, cs } = api;
        if (cs.flags.auditionFaite || cs.flags.gavStarted === s.day) return;
        cs.flags.auditionFaite = s.day;
        cs.vars.conseilGav = "expliquer";
        if (cs.status === "active") { CR.erreur(s, cs, { id: "audition_seul", texte: "Karim a été entendu sans vous : il a tout reconnu, y compris avoir voulu « faire peur ».", sanction: "Ses déclarations sont au dossier.", regul: "Aucune." }); api.trust(-20); }
        api.run("_transmission");
      },
      _transmission(api) { api.schedule(R.int(api.s, 14, 24), "_decisionParquet"); },
      filed_observations_parquet(api, { res }) {
        const { s, cs } = api;
        cs.vars.obsParquet = res.picks.points || [];
        cs.vars.obsDefauts = res.defects;
        CR.PROC.event(api, "Observations écrites adressées au procureur de la République.");
      },
      _decisionParquet(api) {
        const { s, cs } = api;
        const o = cs.vars.obsParquet || [];
        const bad = (cs.vars.obsDefauts || []).some((d) => /agressif|attaque/.test(d));
        const c = cs.vars.conseilGav || "expliquer";
        const neuf = cs.flags.nouveauxMessages;
        const wAlt = 1 + o.filter((x) => ["contexte", "arret", "casier", "alternative"].includes(x)).length * 0.45 + (c === "partiel" ? 0.4 : c === "silence" || c === "quitter" ? -0.2 : 0) - (neuf ? 1 : 0) - (bad ? 0.6 : 0);
        const wCl = 0.25 + (o.includes("qualif") ? 0.5 : 0) + (c === "silence" ? 0.15 : 0);
        const wPours = 0.9 + (c === "expliquer" ? 0.6 : 0) + (neuf ? 1.2 : 0) + (bad ? 0.5 : 0) - (o.length ? 0.3 : 0);
        const choix = CR.ACT.parquetChoix(api, [{ voie: "alternative", poids: Math.max(0.05, wAlt) }, { voie: "classement", poids: wCl }, { voie: "copj", poids: Math.max(0.1, wPours) }]);
        cs.vars.decisionParquet = choix.voie;
        if (neuf) CR.erreur(s, cs, { id: "nouveaux", texte: "Karim a écrit de nouveau à M. Mercier après l'audition.", sanction: "Le parquet y voit la persistance des faits : la poursuite devient probable.", regul: "Lui faire cesser tout contact, par écrit, dès le premier rendez-vous." });
        if (choix.voie === "classement") {
          api.mail({ from: "Parquet de Paris", subject: "Avis de classement sans suite", kind: "greffe", body: [["La procédure ouverte contre M. Karim Benhamou fait l'objet d'un classement sans suite : infraction insuffisamment caractérisée."]] });
          CR.PROC.stade(api, "classement", "Classement sans suite.");
          CR.closeCase(s, cs, { type: "classement" });
        } else if (choix.voie === "alternative") {
          api.mail({ from: "Parquet de Paris — délégué du procureur", subject: "Avertissement pénal probatoire", kind: "greffe", doc: "avertissement", title: "Avertissement pénal probatoire" });
          CR.PROC.stade(api, "alternative", "Avertissement pénal probatoire (art. 41-1, 1°).");
          CR.closeCase(s, cs, { type: "alternative", detail: "avertissement pénal probatoire" });
        } else {
          let day = CR.rollForward(s.day + 40);
          while (CR.dow(day) !== 2 || !CR.isBusinessDay(day)) day++;
          CR.PROC.fixAudience(api, { day, min: 13 * 60 + 30, juridiction: "tc", mode: "convocation", convocDay: s.day, president: "pr_benkirane", script: "tc", done: "apresTC", onMiss: "_absent", title: "Audience — 24e chambre correctionnelle", duree: 60 });
          CR.PROC.stade(api, "convocation", "Le parquet poursuit : convocation devant le tribunal correctionnel.");
          api.mail({ from: "Karim Benhamou", subject: "Convocation au tribunal", kind: "email", important: true, body: [[`Maître, j'ai reçu une convocation au tribunal correctionnel pour le ${CR.fmtDate(day, "dow")}. Harcèlement et menaces. Qu'est-ce qu'on fait ?`]] });
        }
      },
      _absent(api) {
        const { s, cs } = api;
        CR.erreur(s, cs, { id: "absent", texte: "Vous n'étiez pas à l'audience.", sanction: "Karim a été jugé sans avocat.", regul: "Faire appel dans les dix jours." });
        CR.closeCase(s, cs, { type: "condamnation", detail: "jugé sans avocat" });
      },
      decider(api, { st }) {
        const { cs } = api;
        const pl = st.played;
        const c = cs.vars.conseilGav || "expliquer";
        const menaceEcartee = pl.has("arg:qualif") || (pl.has("CP_222-17") && pl.has("K_regretter"));
        const dec = PEN.juger(api, {
          st, juridiction: "tc", titre: "Jugement correctionnel", prevenuNom: "Karim Benhamou", pcNom: "M. Julien Mercier",
          spec: { seuil: 0.55, pieces: {
            captures: { label: "Les captures des messages", sens: "charge", force: 0.45 },
            plainte: { label: "La plainte de M. Mercier", sens: "charge", force: 0.12 },
            certificat: { label: "Le certificat médical (état anxieux)", sens: "charge", force: 0.08 },
            aveu: { label: "Ses déclarations en audition libre", sens: "charge", force: c === "expliquer" ? 0.15 : c === "partiel" ? (cs.flags.pvRectifie ? 0.04 : 0.08) : 0 },
            dette: { label: "Le litige commercial, plaidé par la défense", sens: "decharge", force: 0.06, need: ["arg:contexte"] },
          } },
          qualif: () => menaceEcartee
            ? { id: "harcelement", label: "harcèlement moral ayant entraîné une incapacité totale de travail n'excédant pas huit jours, le tribunal le relaxant du chef de menaces", court: "art. 222-33-2-2 CP", encourue: { prison: 12, amende: 15000 }, requis: cs.vars.requis, favorable: true, motif: "Les messages répétés ont dégradé les conditions de vie de M. Mercier ; en revanche, « tu vas le regretter » ne menace d'aucun crime ni délit contre les personnes (art. 222-17)." }
            : { id: "harcelement_menaces", label: "harcèlement moral et menaces réitérées", court: "art. 222-33-2-2 et 222-17 CP", encourue: { prison: 12, amende: 15000 }, requis: cs.vars.requis, motif: "Les messages répétés, dont « tu vas le regretter », caractérisent le harcèlement et une menace réitérée." },
          personnalite: ["K_casier", "K_arrete"].filter((f) => CR.hasFact(cs, f)).length + (st.dernierMot === "regrets" ? 1 : 0),
          civil: { postes: [{ label: "Préjudice moral", demande: 3000, base: 1200 }], art475: 1000 },
        });
        return dec;
      },
      apresTC(api, res) { CR.closeCase(api.s, api.cs, PEN.issue(api, res.decision || {})); },
    },
    audiences: {
      tc(api) {
        const { cs } = api;
        return {
          title: "24e chambre correctionnelle", sub: "Tribunal judiciaire de Paris", decor: { scene: "salle" },
          steps: AUD.jugement(api, {
            prevenu: KARIM, victime: { prenom: "Julien", nom: "Mercier", g: "m" }, victimeAvocat: "Me Tessier",
            prevention: `Vous êtes prévenu d'avoir, à Paris, entre le ${CR.fmtDate(cs.proc.faitsDay - 12, "long")} et le ${CR.fmtDate(cs.proc.faitsDay, "long")}, harcelé M. Julien Mercier par des messages répétés ayant dégradé ses conditions de vie, et de l'avoir menacé de manière réitérée. Articles 222-33-2-2 et 222-17 du code pénal.`,
            instruction: [
              { who: "president", t: "Quarante messages en deux semaines, monsieur. Pourquoi ?" },
              { if: () => !!cs.flags.prepClient, then: [{ who: "client", t: "Parce qu'il me doit 12 000 euros et ne répondait plus. J'ai eu tort de le harceler. J'ai arrêté.", signal: "bon" }], else: [{ who: "client", t: "Parce que c'est un voleur ! Il me doit de l'argent !", fx: { cred: -3 }, signal: "mauvais" }] },
              { who: "president", t: "« Tu vas le regretter. » Qu'entendiez-vous par là ?" },
              { who: "client", t: "Le tribunal de commerce, madame la présidente." },
            ],
            pcAdverse: ["M. Mercier a changé de numéro, il dort mal. Je demande 3 000 euros pour son préjudice moral."],
            requis: { base: { sursis: 4, complementaires: ["interdiction d'entrer en contact avec M. Mercier pendant deux ans", "stage de citoyenneté"] }, avant: ["Quarante messages, une menace. Je requiers une peine avec sursis, un stage et l'interdiction de contact."] },
            defense: { max: 4,
              angles: [{ id: "requalif", t: "Écarter les menaces", sub: "Le harcèlement se discute peu ; la menace, beaucoup." }, { id: "peine", t: "La peine", sub: "Un litige commercial qui a dérapé ; il a cessé." }],
              args: [
                { id: "qualif", label: "« Tu vas le regretter » ne menace d'aucun crime ni délit (art. 222-17)", say: "L'article 222-17 punit la menace de commettre un crime ou un délit contre les personnes. « Tu vas le regretter » n'annonce rien de tel : c'était un procès.", cards: ["CP_222-17", "K_regretter"] },
                { id: "contexte", label: "Une dette de 12 000 euros, un litige commercial", say: "Tout part d'une dette de 12 000 euros que M. Mercier refuse de payer.", cards: ["K_dette"] },
                { id: "arret", label: "Il a cessé d'écrire depuis la convocation", say: "Depuis sa convocation, plus un message. Il s'y est engagé et il l'a tenu.", cards: ["K_arrete"] },
                { id: "casier", label: "Aucun antécédent", say: "Trente-huit ans, aucun antécédent.", cards: ["K_casier"] },
                { id: "femme", label: "M. Mercier mentait à sa femme", say: "M. Mercier cachait la dette à sa propre épouse.", cards: ["K_femme"], pertinent: () => false },
              ] },
          }),
        };
      },
    },
    debrief(api, o) {
      const { cs } = api;
      const items = [{ kind: "rule", text: "La personne entendue librement peut quitter les locaux à tout moment, se taire, être assistée d'un avocat si l'infraction est punie d'emprisonnement (art. 61-1)." }];
      if (cs.flags.conseilTout || cs.vars.conseilGav === "expliquer") items.push({ kind: "bad", text: "Karim a reconnu avoir voulu « faire peur » avant même d'avoir entendu les messages : c'est l'élément intentionnel que cherchait le parquet." });
      if (cs.vars.conseilGav === "partiel") items.push({ kind: "good", text: "Il a écouté les messages, puis reconnu les faits matériels en contestant toute intention de menacer." });
      if (cs.vars.decisionParquet) items.push({ kind: "info", text: `Le parquet a choisi : ${{ alternative: "une alternative aux poursuites", classement: "le classement", copj: "la poursuite devant le tribunal" }[cs.vars.decisionParquet]}.` });
      if (!(cs.vars.obsParquet || []).length) items.push({ kind: "surprise", text: "Vous n'avez adressé aucune observation au parquet avant sa décision." });
      return items.concat(cs.vars.debriefJugement || []);
    },
    epilogue(api, o) {
      if (o.type === "alternative") return "Karim a respecté l'avertissement. Il a assigné M. Mercier devant le tribunal de commerce et récupéré 9 000 euros.";
      if (o.type === "classement") return "Classement sans suite. Karim a assigné son ancien associé devant le tribunal de commerce.";
      return `${api.cs.vars.peine ? api.cs.vars.peine.texte : "Condamné"}. Karim a rouvert un restaurant, seul, rue Custine.`;
    },
    fiche(api, o) {
      return {
        phrase: "Messages à un ancien associé, audition libre puis décision du parquet, avocat de Karim Benhamou.",
        notions: [
          { titre: "Les droits en audition libre", regle: "Infraction reprochée, droit de quitter les locaux à tout moment, interprète, droit de se taire, avocat si l'infraction est punie d'emprisonnement, conseils juridiques.", art: "art. 61-1 CPP", prog: "pp_enquete" },
          { titre: "Menaces et harcèlement", regle: "La menace punissable vise un crime ou un délit contre les personnes, réitérée ou matérialisée ; le harcèlement suppose des propos répétés dégradant les conditions de vie et altérant la santé.", art: "art. 222-17 et 222-33-2-2 CP", prog: "dps" },
          { titre: "Les alternatives aux poursuites", regle: "Le procureur peut notamment prononcer un avertissement pénal probatoire, qui a remplacé le rappel à la loi, ou orienter vers un stage.", art: "art. 41-1 CPP", prog: "pp_action" },
        ],
        piege: "Entendre les messages avant de laisser le client répondre : on ne reconnaît pas une intention qu'on n'a pas eue.",
        devenir: api.def.epilogue(api, o),
      };
    },
    corrige() {
      return [
        { probleme: "Que permet l'audition libre ?", regle: "Droits de l'article 61-1 : quitter les locaux à tout moment, se taire, être assisté d'un avocat si l'infraction est punie d'emprisonnement.", application: "Karim peut écouter les questions, se taire, ou partir ; l'avocat l'aide à ne pas reconnaître une intention de menacer qu'il conteste." },
        { probleme: "Menaces ou harcèlement ?", regle: "Menace : crime ou délit contre les personnes, réitérée ou matérialisée (art. 222-17) ; harcèlement moral : propos répétés dégradant les conditions de vie (art. 222-33-2-2).", application: "« Tu vas le regretter » se discute au regard de l'article 222-17 ; quarante messages en deux semaines caractérisent plus sûrement le harcèlement." },
        { probleme: "Comment éviter le tribunal ?", regle: "Le procureur choisit librement l'orientation : classement, alternative (art. 41-1), poursuite. L'avocat peut lui adresser des observations.", application: "Le contexte commercial, l'arrêt des messages et l'absence d'antécédent plaident pour un avertissement pénal probatoire." },
      ];
    },
  });
})();
