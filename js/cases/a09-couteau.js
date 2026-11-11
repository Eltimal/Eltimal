/* Affaire 9 — Les coups de couteau.
   Camp au choix : la mère de Malik appelle pour sa défense, Hugo demande un rendez-vous pour être assisté.
   On ne peut pas prendre les deux (conflit d'intérêts). Information pour tentative de meurtre : interrogatoire,
   confrontation, demandes d'actes, observations de l'article 175, correctionnalisation (art. 186-3 et 469),
   cour d'assises avec tirage et récusation des jurés (art. 298). */
(function () {
  const CR = window.CR;
  const R = CR.R;
  const PEN = CR.PEN;
  const AUD = CR.AUD;
  const MALIK = { prenom: "Malik", nom: "Ferhat", g: "m", age: 23, metier: "apprenti boulanger", tel: "07 81 40 26 93", trust: 50, look: { skin: 3, hair: "short", hc: "black", beard: 0 }, naissance: "le 14 février 2003 à Montreuil", adresse: "rue des Pyrénées, Paris 20e" };
  const HUGO = { prenom: "Hugo", nom: "Lemaire", g: "m", age: 25, metier: "serveur", tel: "06 33 18 72 05", trust: 50, look: { skin: 0, hair: "side", hc: "blonde", beard: 1 }, naissance: "le 2 mai 2001 à Rouen", adresse: "rue de la Folie-Méricourt, Paris 11e" };
  const BASE_DAY = 63;
  const IDS = { defense: "a09_malik", pc: "a09_hugo" };

  const FACTS = {
    K9_faits: { label: "Deux coups de couteau au thorax, rue Oberkampf", key: true },
    K9_plaies: { label: "Une plaie de 6 cm de profondeur, à 2 cm du péricarde", key: true, why: "La zone visée et la profondeur des coups : c'est sur eux que se juge l'intention de tuer." },
    K9_lame: { label: "Un couteau pliant, lame de 9 cm" },
    K9_trois: { label: "Ils étaient trois sur Malik", key: true, why: "Le contexte de la rixe : ce n'est pas une légitime défense (la riposte est disproportionnée), mais il pèse sur l'intention." },
    K9_peur: { label: "« Je voulais leur faire peur »", key: true },
    K9_deux_coups: { label: "Deux coups, très vite, au torse" },
    K9_rendu: { label: "Malik s'est présenté au commissariat le lendemain" },
  };
  const DOCS = {
    pv_constat: (x) => ({ title: "Procès-verbal de constatations", kind: "pv", entete: ["Commissariat central du 11e", "Cote D2"], paras: [
      [{ t: `Le ${CR.fmtDate(x.cs.proc.faitsDay, "long")} à 1 h 50, rue Oberkampf, devant le bar « Le Zinc », un homme est allongé sur le trottoir, blessé au thorax.`, f: "K9_faits" }],
      ["La victime, Hugo Lemaire, est transportée à l'hôpital Saint-Antoine. L'auteur a pris la fuite à pied vers la rue Saint-Maur."],
    ] }),
    certif: () => ({ title: "Certificat médical et compte rendu opératoire (extraits)", kind: "pv", entete: ["Hôpital Saint-Antoine · Service de chirurgie thoracique", "Cote D8"], paras: [
      [{ t: "Deux plaies thoraciques gauches. L'une, de 6 cm de profondeur, s'arrête à 2 cm du péricarde ; l'autre, superficielle, sur le flanc.", f: "K9_plaies" }],
      [{ t: "Incapacité totale de travail : 30 jours, sous réserve de complications.", f: "K9_itt" }],
    ], signed: "Dr C. Aubert" }),
    pv_gav_malik: () => ({ title: "Procès-verbal d'audition de M. Ferhat en garde à vue (extrait)", kind: "pv", entete: ["Commissariat central du 11e · Cote D14"], paras: [
      [{ t: "« Ils étaient trois sur moi. J'étais par terre, ils me donnaient des coups de pied. »", f: "K9_trois" }],
      [{ t: "« J'ai sorti le couteau pour leur faire peur. Je ne voulais pas le tuer. »", f: "K9_peur" }],
      [{ t: "M. Ferhat s'est présenté spontanément au commissariat le lendemain à 10 heures, avec le couteau.", f: "K9_rendu" }],
    ] }),
    pv_videur: () => ({ title: "Procès-verbal d'audition de M. Soumaré, agent de sécurité du bar", kind: "pv", entete: ["Commissariat central du 11e · Cote D11"], paras: [
      [{ t: "« Trois garçons tapaient le petit. Il est tombé. Quand il s'est relevé, il a frappé deux fois, très vite, au torse du grand blond. »", f: "K9_deux_coups" }],
    ] }),
    scelle: () => ({ title: "Procès-verbal de placement sous scellé", kind: "pv", entete: ["Commissariat central du 11e · Cote D15"], paras: [[{ t: "Couteau pliant à cran d'arrêt, lame de 9 cm, remis par M. Ferhat.", f: "K9_lame" }]] }),
    pv_hugo: () => ({ title: "Procès-verbal d'audition de M. Lemaire (extrait)", kind: "pv", entete: ["Commissariat central du 11e · Cote D20"], paras: [
      [{ t: "« On se disputait avec son copain, à propos d'une fille. Lui, il s'est mêlé. Il m'a regardé et il a frappé. »", f: "K9_hugo_version" }],
      ["« Je ne l'ai pas frappé, moi. Peut-être mes amis, je ne sais pas. »"],
    ] }),
    video: () => ({ title: "Exploitation de la vidéo du bar", kind: "pv", entete: ["Commission rogatoire · Cote D41"], paras: [
      [{ t: "1 h 48 min 10 s : M. Ferhat est au sol ; trois hommes, dont M. Lemaire, lui portent des coups de pied.", f: "K9_video_sol" }],
      [{ t: "1 h 48 min 31 s : M. Ferhat se relève, la lame déjà ouverte, et porte deux coups au thorax de M. Lemaire en moins de deux secondes. Il s'enfuit aussitôt.", f: "K9_video_coups" }],
    ] }),
    expertise: () => ({ title: "Rapport d'expertise médico-légale (conclusions)", kind: "pv", entete: ["Expert près la cour d'appel de Paris · Cote D44"], paras: [
      [{ t: "Coups portés de face, de bas en haut, à courte distance, compatibles avec des gestes rapides au cours d'une mêlée.", f: "K9_melee" }],
      [{ t: "Sans intervention chirurgicale dans l'heure, la plaie profonde engageait le pronostic vital.", f: "K9_vital" }],
    ] }),
    personnalite: () => ({ title: "Enquête de personnalité (extrait)", kind: "pv", entete: ["Association de contrôle judiciaire · Cote B3"], paras: [[{ t: "Apprenti boulanger depuis dix-huit mois, très bien noté par son maître d'apprentissage. Aucun antécédent. Porte un couteau depuis une agression subie à 17 ans.", f: "K9_perso" }]] }),
    oma: () => ({ title: "Ordonnance de mise en accusation", kind: "greffe", entete: ["Cabinet de M. Vauclair, juge d'instruction"], paras: [["Attendu que le nombre de coups, la zone visée et la profondeur de la plaie caractérisent l'intention homicide ;"], ["Ordonnons la mise en accusation de M. Malik Ferhat devant la cour d'assises de Paris, du chef de tentative de meurtre (art. 121-5 et 221-1 du code pénal)."]] }),
    ortc: () => ({ title: "Ordonnance de requalification et de renvoi devant le tribunal correctionnel", kind: "greffe", entete: ["Cabinet de M. Vauclair, juge d'instruction"], paras: [["Attendu que l'intention de tuer n'est pas suffisamment établie, les coups ayant été portés au cours d'une rixe où M. Ferhat était lui-même frappé ;"], ["Requalifions les faits en violences avec usage d'une arme ayant entraîné une incapacité totale de travail supérieure à huit jours (art. 222-12 du code pénal) et renvoyons M. Malik Ferhat devant le tribunal correctionnel."], ["Les parties peuvent interjeter appel de la présente ordonnance si elles estiment que les faits constituent un crime (art. 186-3)."]] }),
  };
  const TITLES = { pv_constat: "Constatations (D2)", certif: "Certificat médical (D8)", pv_gav_malik: "Audition de M. Ferhat (D14)", pv_videur: "Témoin, agent de sécurité (D11)", scelle: "Scellé : le couteau (D15)", pv_hugo: "Audition de M. Lemaire (D20)", video: "Vidéo du bar (D41)", expertise: "Expertise médico-légale (D44)", personnalite: "Enquête de personnalité (B3)", oma: "Ordonnance de mise en accusation", ortc: "Ordonnance de renvoi (correctionnalisation)" };
  const COPIE = ["certif", "pv_gav_malik", "pv_videur", "scelle", "pv_hugo"];

  function build(camp) {
    const D = camp === "defense";
    const id = IDS[camp];
    const other = IDS[D ? "pc" : "defense"];
    const facts = Object.assign({}, FACTS, D
      ? { K9_hugo: { label: "La victime, Hugo Lemaire", cat: "party", party: "Hugo Lemaire" }, K9_apprenti: { label: "Malik est apprenti boulanger, sans antécédent", key: true }, K9_cj: { label: "Malik est sous contrôle judiciaire, chez sa mère" } }
      : { K9_malik: { label: "L'auteur, Malik Ferhat", cat: "party", party: "Malik Ferhat" }, K9_salaire: { label: "Hugo a perdu deux mois de salaire", key: true }, K9_cicatrice: { label: "Une cicatrice de 12 cm sur le thorax" }, K9_peur_sortir: { label: "Hugo ne sort plus le soir" } });
    const pcPostes = [
      { id: "dft", label: "Déficit fonctionnel temporaire (30 jours d'ITT)", demande: 1200, base: 900, needs: ["K9_itt", "K9_plaies"], justif: ["K9_itt"] },
      { id: "souffrances", label: "Souffrances endurées", demande: 8000, base: 6000, needs: null, justif: ["K9_plaies"] },
      { id: "esthetique", label: "Préjudice esthétique (cicatrice thoracique)", demande: 4000, base: 3000, needs: ["K9_cicatrice"], justif: ["K9_cicatrice"] },
      { id: "gains", label: "Perte de gains professionnels (deux mois)", demande: 3600, base: 3600, needs: ["K9_salaire"], justif: ["K9_bulletins"] },
    ];
    return {
      id, camp, domaine: D ? "instruction" : "pc", domaineLib: "pp_instruction",
      title: D ? "Ferhat — les coups de couteau" : "Lemaire — les coups de couteau",
      conflict: other,
      arrive: D ? { day: BASE_DAY, min: 10 * 60 + 10 } : { day: BASE_DAY, min: 11 * 60, how: "rdv", mail: { from: "Hugo Lemaire", subject: "Rendez-vous — j'ai été poignardé", kind: "email", body: [["Maître, j'ai reçu deux coups de couteau rue Oberkampf il y a six semaines. Le type est mis en examen pour tentative de meurtre. Je sors de l'hôpital. Je voudrais être défendu. Pouvez-vous me recevoir ?"]] } },
      leadTask: D ? undefined : PEN.rdvTask("Recevoir M. Lemaire au cabinet"),
      client: D ? MALIK : HUGO,
      caller: D ? "Samira Ferhat, sa mère" : undefined,
      voicemail: D ? "Maître, Samira Ferhat. Mon fils Malik est mis en examen pour tentative de meurtre. Il a un avocat commis d'office qu'il n'a vu qu'une fois. Nous voudrions que vous le défendiez. Rappelez-moi." : undefined,
      leadPatience: 4,
      profile: D ? { wealth: 3, sens: 0.5, urgency: 0.6, temper: "anxieux" } : { wealth: 2, sens: 0.6, urgency: 0.5, temper: "mefiant" },
      honoraires: D ? { forfait: 4500, heures: 30, types: ["forfait"], resultat: "correctionnalisation ou requalification", intro: "Samira paiera en trois fois." } : { aj: true },
      mission: D ? "Défense de M. Malik Ferhat dans l'information ouverte pour tentative de meurtre, devant le juge d'instruction et, le cas échéant, la chambre de l'instruction, puis devant la juridiction de jugement, jusqu'à la décision de première instance." : "Assistance de M. Hugo Lemaire, partie civile, dans l'information ouverte pour tentative de meurtre et devant la juridiction de jugement, jusqu'à la décision de première instance.",
      actors: { ji: "ji_vauclair", president: "ji_vauclair", parquet: "pq_riboulet", adverse: D ? "av_tessier" : "av_villeneuve" },
      proc: { stade: "information", nature: "crime", faits: -42, infractions: ["CP_221-1", "CP_121-5"], mex: -40, pcConstituee: D, detention: "cj", detentionSince: -40 },
      init(api, cs) { cs.vars.camp = camp; },
      facts,
      calls: { intake: D ? {
        opening: ["Maître, Samira Ferhat. Malik est à côté de moi. Il ne dort plus. Il dit qu'il ne voulait pas le tuer."],
        topics: [
          { id: "m_quoi", q: "Passez-moi Malik, s'il vous plaît. Que s'est-il passé ?", a: ["(Malik prend le téléphone.) C'était à la sortie d'un bar, rue Oberkampf. Mon copain se disputait avec un grand blond.", { t: "Ils étaient trois. Ils m'ont mis par terre, ils me donnaient des coups de pied.", f: "K9_trois" }, { t: "J'avais mon couteau. Je l'ai sorti pour leur faire peur. J'ai frappé deux fois, je crois.", f: "K9_peur" }, { t: "Le blond, c'est Hugo Lemaire, je l'ai appris après.", f: "K9_hugo" }], cost: 6, unlock: ["m_couteau", "m_apres"] },
          { id: "m_couteau", q: "Pourquoi aviez-vous un couteau sur vous ?", a: ["Depuis qu'on m'a agressé à dix-sept ans, je le garde. C'est bête, je sais.", { t: "Un couteau pliant. La lame fait à peu près neuf centimètres.", f: "K9_lame" }], cost: 3 },
          { id: "m_apres", q: "Qu'avez-vous fait ensuite ?", a: ["J'ai couru. J'avais peur.", { t: "Le lendemain matin, je suis allé au commissariat avec ma mère, et j'ai donné le couteau.", f: "K9_rendu" }], cost: 3, tag: "good" },
          { id: "m_situation", q: "Où en est la procédure ?", a: [{ t: "Le juge Vauclair m'a mis en examen pour tentative de meurtre. Je suis sous contrôle judiciaire, chez ma mère.", f: "K9_cj" }], cost: 2 },
          { id: "m_travail", q: "Vous travaillez ?", a: [{ t: "Je suis apprenti boulanger, rue de Belleville. Mon patron m'a gardé. Je n'ai jamais été condamné.", f: "K9_apprenti" }], cost: 2, tag: "good" },
          { id: "m_viser", q: "Avez-vous visé le cœur ?", a: ["Non ! Je ne sais pas où j'ai frappé. Tout est allé si vite."], cost: 2, tag: "neutral" },
        ],
        start: ["m_quoi", "m_situation", "m_travail"],
        patience: 100, close: "Merci, maître. Vous allez le voir, le juge ?",
      } : {
        scene: "conference", kind: "meet", label: "Rendez-vous au cabinet",
        opening: ["Hugo Lemaire se tient très droit, une main sur le flanc. « Je ne peux toujours pas lever le bras. »"],
        topics: [
          { id: "h_quoi", q: "Racontez-moi la soirée.", a: [{ t: "On sortait du Zinc, rue Oberkampf. Je me suis embrouillé avec un type. Son copain s'est mêlé, et il m'a planté. Deux fois, au thorax.", f: "K9_faits" }, { t: "Il s'appelle Malik Ferhat. Il est mis en examen pour tentative de meurtre.", f: "K9_malik" }], cost: 5, unlock: ["h_avant", "h_blessure"] },
          { id: "h_avant", q: "Vous ou vos amis, l'aviez-vous frappé avant ?", a: ["Hugo se tait un moment.", { t: "Il était par terre, oui. Mes potes l'ont un peu tapé. Pas moi. Enfin… je ne sais plus.", f: "K9_trois" }], cost: 3, tag: "good" },
          { id: "h_blessure", q: "Que disent les médecins ?", a: [{ t: "Une des lames est passée à deux centimètres du cœur. Opéré en urgence à Saint-Antoine.", f: "K9_plaies" }, { t: "J'ai une cicatrice de douze centimètres.", f: "K9_cicatrice" }], cost: 3 },
          { id: "h_travail", q: "Vous avez pu reprendre le travail ?", a: [{ t: "Non. Je suis serveur, je porte des plateaux. Deux mois sans salaire, à peu près 1 800 euros par mois.", f: "K9_salaire" }], cost: 2, tag: "good" },
          { id: "h_vie", q: "Comment allez-vous, depuis ?", a: [{ t: "Je ne sors plus le soir. Je sursaute dans le métro.", f: "K9_peur_sortir" }], cost: 2 },
          { id: "h_prison", q: "Qu'attendez-vous de ce procès ?", a: ["Qu'il prenne vingt ans. Il a voulu me tuer."], cost: 1, tag: "neutral" },
        ],
        start: ["h_quoi", "h_travail", "h_vie", "h_prison"],
        patience: 100, close: "D'accord. On fait comme vous dites.",
      } },
      advice: D ? [
        { id: "m_silence", t: "Ne parlez de l'affaire à personne, ni sur les réseaux, ni à vos amis présents ce soir-là." },
        { id: "m_cj", t: "Respectez scrupuleusement votre contrôle judiciaire : un manquement, et c'est la détention." },
        { id: "m_contact", t: "Écrivez à Hugo Lemaire pour vous excuser." },
        { id: "m_acquitte", t: "Vous serez acquitté, c'était de la légitime défense." },
      ] : [
        { id: "h_bulletins", t: "Rassemblez vos bulletins de salaire et vos arrêts de travail." },
        { id: "h_medecin", t: "Faites établir un certificat sur vos séquelles par votre médecin." },
        { id: "h_reseaux", t: "Ne publiez rien sur l'affaire, et ne contactez pas M. Ferhat." },
        { id: "h_vingt", t: "Il prendra vingt ans, c'est certain." },
      ],
      docs: DOCS,
      docTitles: TITLES,
      tpls: Object.assign(D ? {} : { constitution_ji: (api) => ({
          title: "Constitution de partie civile devant le juge d'instruction", kind: "courrier", time: 30, dirLabel: "Envoyée",
          to: "M. Bastien Vauclair, juge d'instruction, tribunal judiciaire de Paris",
          slots: { voie: CR.choiceSlot("La voie", [
            { t: "L'information étant ouverte, M. Hugo Lemaire déclare se constituer partie civile par la présente lettre (art. 87).", ok: true },
            { t: "M. Hugo Lemaire dépose plainte avec constitution de partie civile entre les mains du doyen des juges d'instruction (art. 85).", ok: false, defect: "voie:doyen" },
          ]) },
          body: [["Monsieur le juge,"], ["J'assiste M. Hugo Lemaire, victime des coups de couteau portés rue Oberkampf. ", { s: "voie" }]],
        }) }, {
        observations_175: (api) => ({
          title: "Observations après l'avis de fin d'information (art. 175)", kind: "courrier", time: 75, dirLabel: "Déposées",
          to: "M. Bastien Vauclair, juge d'instruction",
          slots: { qualif: CR.choiceSlot("La qualification soutenue", D ? [
            { t: "L'intention de tuer n'est pas établie : les faits doivent être requalifiés en violences avec arme ayant entraîné une ITT de plus de huit jours (art. 222-12) et renvoyés devant le tribunal correctionnel.", ok: true, v: "requalif" },
            { t: "M. Ferhat a agi en état de légitime défense : un non-lieu s'impose (art. 122-5).", ok: false, v: "ld", defect: "qualif:ld" },
          ] : [
            { t: "Deux coups portés au thorax, la lame ouverte avant de se relever, une plaie à deux centimètres du cœur : l'intention de tuer est caractérisée. La partie civile demande la mise en accusation pour tentative de meurtre (art. 121-5 et 221-1).", ok: true, v: "crime" },
            { t: "La partie civile s'en rapporte sur la qualification.", ok: true, v: "rapport" },
          ]) },
          checks: [{ id: "points", label: "À l'appui", heading: "La partie relève :", options: D ? [
            { id: "trois", t: "M. Ferhat était au sol, frappé par trois hommes, quelques secondes avant les coups.", ok: null, needs: ["K9_trois", "K9_video_sol"] },
            { id: "melee", t: "L'expert décrit des gestes rapides, au cours d'une mêlée, et non des coups ajustés.", ok: null, needs: "K9_melee" },
            { id: "rendu", t: "Il s'est présenté de lui-même le lendemain, avec le couteau.", ok: null, needs: "K9_rendu" },
            { id: "perso", t: "Apprenti très bien noté, sans antécédent.", ok: null, needs: ["K9_perso", "K9_apprenti"] },
            { id: "121-5", t: "Le texte de la tentative suppose la volonté de commettre le crime : l'intention de tuer doit être prouvée (art. 121-5 et 221-1).", ok: null, needs: ["CP_121-5", "CP_221-1"] },
          ] : [
            { id: "video", t: "La vidéo montre la lame ouverte avant que M. Ferhat se relève, puis deux coups en moins de deux secondes.", ok: null, needs: "K9_video_coups" },
            { id: "vital", t: "L'expert conclut que la plaie engageait le pronostic vital.", ok: null, needs: "K9_vital" },
            { id: "plaies", t: "Une plaie de six centimètres, à deux centimètres du péricarde.", ok: null, needs: "K9_plaies" },
            { id: "121-5", t: "La tentative est punissable dès le commencement d'exécution, sans désistement volontaire (art. 121-5).", ok: null, needs: "CP_121-5" },
          ] }],
          body: [["Monsieur le juge,"], ["En réponse à votre avis de fin d'information, ", D ? "la défense de M. Malik Ferhat" : "la partie civile, M. Hugo Lemaire,", " a l'honneur de présenter les observations suivantes. ", { s: "qualif" }]],
        }),
        appel_ortc: (api) => ({
          title: "Déclaration d'appel de l'ordonnance de renvoi (art. 186-3)", kind: "acte", time: 20, dirLabel: "Rédigée",
          depot: "palais", depotLabel: "Greffe du juge d'instruction", depotTime: 15,
          slots: { motif: CR.choiceSlot("Le motif", [{ t: "Les faits renvoyés devant le tribunal correctionnel constituent un crime, la tentative de meurtre, qui relève de la cour d'assises.", ok: true }]) },
          body: [["Je soussigné, ", `Me ${api.s.player.nom}`, ", déclare interjeter appel, au nom de ", D ? "M. Malik Ferhat" : "M. Hugo Lemaire", ", de l'ordonnance de requalification et de renvoi devant le tribunal correctionnel. ", { s: "motif" }]],
        }),
      }),
      penal: {
        no: ["nullite", "requete", "actes", "copie"],
        actes: D ? [
          { id: "video", t: "La réquisition et l'exploitation de la vidéo du bar « Le Zinc ».", ok: null },
          { id: "expertise", t: "Une expertise médico-légale sur la trajectoire et la dynamique des coups.", ok: null },
          { id: "personnalite", t: "Une enquête de personnalité.", ok: null, needs: "K9_apprenti" },
          { id: "relaxe", t: "Le prononcé d'un non-lieu immédiat.", ok: false, defect: "actes:nonlieu" },
        ] : [
          { id: "video", t: "La réquisition et l'exploitation de la vidéo du bar « Le Zinc ».", ok: null },
          { id: "expertise", t: "Une expertise médico-légale : profondeur des plaies, pronostic vital.", ok: null, needs: "K9_plaies" },
          { id: "medical", t: "Une expertise médicale de M. Lemaire sur ses séquelles, en vue de leur consolidation.", ok: null },
          { id: "detention", t: "Le placement de M. Ferhat en détention provisoire.", ok: false, defect: "actes:detention" },
        ],
        copie: COPIE,
        chiffrage: { postes: pcPostes, art475: 2000 },
      },
      flow: { tasks: PEN.tasks },
      tasks(api, T) {
        const { s, cs } = api;
        const p = cs.proc;
        if (!D && !p.pcConstituee && !cs.vars.constitutionEnvoyee) T({ id: "constitution_ji", label: "Constituer M. Lemaire partie civile", sub: "Une information est déjà ouverte.", kind: "draft", time: 30, urgent: true, run: () => ({ scene: "draft", tpl: "constitution_ji" }) });
        const partie = D || p.pcConstituee;
        if (partie && ["information", "reglement"].includes(p.stade)) {
          if (!CR.drafted(cs, "demande_actes") && !cs.vars.finInfo) T({ id: "actes", label: "Rédiger une demande d'actes", sub: "Article 82-1 : vidéo, expertises.", kind: "draft", time: 60, run: () => ({ scene: "draft", tpl: "demande_actes" }) });
          if (p.copieDemandee == null) T({ id: "copie", label: "Demander la copie du dossier", sub: "Article 114.", kind: "admin", time: 10, run: () => { PEN.demanderCopie(api); return null; } });
          if (cs.vars.finInfo && !CR.drafted(cs, "observations_175") && !cs.vars.reglement) T({ id: "obs175", label: "Rédiger les observations de l'article 175", sub: "La qualification que vous soutenez.", kind: "draft", time: 75, urgent: true, run: () => ({ scene: "draft", tpl: "observations_175" }) });
        }
        if (cs.vars.reglement === "ortc" && !CR.drafted(cs, "appel_ortc") && !p.audience) T({ id: "appel_ortc", label: "Faire appel de l'ordonnance de renvoi (art. 186-3)", sub: "Ou accepter la correctionnalisation. Comptez le délai.", kind: "draft", time: 20, run: () => ({ scene: "draft", tpl: "appel_ortc" }) });
        if (cs.vars.reglement === "ortc" && !cs.vars.ortcAcceptee && !CR.drafted(cs, "appel_ortc") && !p.audience) T({ id: "accepter_ortc", label: "Accepter la correctionnalisation", sub: D ? "Le tribunal correctionnel, cinq ans encourus au lieu de trente." : "Un procès plus rapide, une peine encourue moindre.", kind: "admin", time: 5, run: () => { cs.vars.ortcAcceptee = s.day; api.tl("Vous ne ferez pas appel de l'ordonnance de renvoi."); api.run("_audienceTC"); return null; } });
        if (D) {
          if (cs.vars.interroDay != null && s.day <= cs.vars.interroDay && !cs.flags.prepInterro) T({ id: "prep_interro", label: "Préparer Malik à son interrogatoire", sub: "Au cabinet : ce que dit le dossier, ce qu'il faut expliquer.", kind: "meet", time: 60, run: () => { CR.spend(s, 60, "meet"); cs.flags.prepInterro = s.day; CR.updatedClient(s, cs, 1.5); api.tl("Malik préparé à son interrogatoire."); return null; } });
          PEN.persoTasks(api, T, [{ id: "patron", label: "Obtenir l'attestation du maître d'apprentissage", sub: "Boulangerie, rue de Belleville.", fact: "K9_attest_patron", text: "Attestation du maître d'apprentissage : apprenti sérieux, ponctuel, qu'il reprendra quoi qu'il arrive.", time: 20, cond: () => CR.hasFact(cs, "K9_apprenti") }]);
        } else {
          PEN.persoTasks(api, T, [{ id: "bulletins", label: "Obtenir les bulletins de salaire de Hugo", sub: "Et ses arrêts de travail.", fact: "K9_bulletins", text: "Bulletins de salaire (1 800 € net) et arrêts de travail de deux mois.", time: 15, cond: () => CR.hasFact(cs, "K9_salaire") }]);
        }
        if (p.audience && p.audience.day >= s.day) PEN.prepPC(api, T, D ? "Préparer Malik à l'audience" : "Préparer Hugo à l'audience");
      },
      on: {
        engaged(api) {
          const { s, cs } = api;
          if (cs.vars.engagedOnce) return;
          cs.vars.engagedOnce = true;
          api.doc("pv_constat", TITLES.pv_constat);
          if (D) api.run("_planInstruction");
        },
        filed_constitution_ji(api, { res }) {
          const { s, cs } = api;
          cs.vars.constitutionEnvoyee = s.day;
          if (res.defects.includes("voie:doyen")) { CR.erreur(s, cs, { id: "constitution_doyen", texte: "Plainte avec constitution adressée au doyen alors qu'une information était déjà ouverte.", sanction: "Dix jours perdus.", regul: "Une lettre au juge d'instruction suffisait (art. 87)." }); api.schedule(10, "_constituee"); return; }
          api.run("_constituee");
        },
        _constituee(api) {
          const { cs } = api;
          cs.proc.pcConstituee = true;
          CR.PROC.event(api, "Constitution de partie civile de M. Lemaire (art. 87).");
          api.mail({ from: "Cabinet de M. Vauclair, juge d'instruction", subject: "Constitution de partie civile — Lemaire", kind: "greffe", body: [["Nous avons reçu la constitution de partie civile de M. Lemaire. Il sera entendu prochainement ; vous serez convoqué."]] });
          api.run("_planInstruction");
        },
        _planInstruction(api) {
          const { s, cs } = api;
          if (cs.vars.interroDay != null) return;
          const d1 = CR.rollForward(CR.addOuvrables(s.day, 8));
          cs.vars.interroDay = d1;
          api.hearing({ day: d1, min: 14 * 60, title: D ? "Interrogatoire de M. Ferhat par le juge d'instruction" : "Audition de M. Lemaire, partie civile", where: "Cabinet de M. Vauclair, tribunal judiciaire", lieu: "palais", script: "interro", done: "apresInterro", duree: 70 });
          api.mail({ from: "Cabinet de M. Vauclair, juge d'instruction", subject: "Convocation de l'avocat (art. 114)", kind: "greffe", body: [[`Vous êtes convoqué pour ${D ? "l'interrogatoire de votre client" : "l'audition de votre client, partie civile"}, le ${CR.fmtDate(d1, "dow")} à 14 heures. Le dossier est à votre disposition au cabinet, quatre jours ouvrables au plus tard avant (art. 114).`]] });
          const d2 = CR.rollForward(d1 + 21);
          cs.vars.confrontDay = d2;
          api.at(d2, "_convocConfront", {}, 9 * 60);
        },
        _convocConfront(api) {
          const { s, cs } = api;
          const d = CR.rollForward(s.day + 7);
          api.hearing({ day: d, min: 10 * 60, title: "Confrontation devant le juge d'instruction", where: "Cabinet de M. Vauclair, tribunal judiciaire", lieu: "palais", script: "confront", done: "apresConfront", duree: 80 });
          api.mail({ from: "Cabinet de M. Vauclair, juge d'instruction", subject: "Confrontation", kind: "greffe", body: [[`Confrontation entre M. Ferhat et M. Lemaire le ${CR.fmtDate(d, "dow")} à 10 heures.`]] });
        },
        apresInterro(api) { CR.updatedClient(api.s, api.cs, 1); },
        apresConfront(api) {
          const { s, cs } = api;
          CR.updatedClient(s, cs, 1);
          if (!cs.vars.actesFaits) api.schedule(R.int(s, 25, 35), "_finInfo");
        },
        reponseActes(api, d) {
          const { s, cs } = api;
          const p = d.picks || [];
          cs.vars.actesFaits = true;
          const l = [];
          if (p.includes("video")) { api.doc("video", TITLES.video); l.push("versons au dossier l'exploitation de la vidéo du bar"); cs.vars.video = true; }
          if (p.includes("expertise")) { cs.vars.expertise = true; l.push("ordonnons une expertise médico-légale"); }
          if (p.includes("personnalite")) { api.doc("personnalite", TITLES.personnalite); l.push("ordonnons une enquête de personnalité"); }
          if (p.includes("medical")) { cs.vars.expertiseVictime = true; l.push("ordonnons une expertise médicale de la partie civile"); }
          api.mail({ from: "Cabinet de M. Vauclair, juge d'instruction", subject: "Ordonnance sur demande d'actes", kind: "greffe", important: true, body: [[l.length ? `Faisant droit à la demande, ${l.join(" ; ")}.` : "Rejetons la demande d'actes."], p.includes("detention") ? ["La partie civile n'a pas qualité pour demander la détention provisoire."] : p.includes("relaxe") ? ["Il n'y a pas lieu, à ce stade, de statuer sur le règlement de l'information."] : [""]] });
          api.cancel("_finInfo");
          api.schedule(R.int(s, 25, 35), "_rapports");
        },
        _rapports(api) {
          const { s, cs } = api;
          if (cs.vars.expertise) api.doc("expertise", TITLES.expertise);
          if (cs.vars.expertise || cs.vars.expertiseVictime) api.mail({ from: "Cabinet de M. Vauclair, juge d'instruction", subject: "Dépôt des rapports d'expertise", kind: "greffe", body: [["Les rapports ont été déposés et versés au dossier (art. 167)."]] });
          api.schedule(R.int(s, 12, 20), "_finInfo");
        },
        _finInfo(api) {
          const { s, cs } = api;
          if (cs.vars.finInfo) return;
          cs.vars.finInfo = s.day;
          CR.PROC.stade(api, "reglement", "Avis de fin d'information (art. 175).");
          api.mail({ from: "Cabinet de M. Vauclair, juge d'instruction", subject: "Avis de fin d'information (art. 175)", kind: "greffe", important: true, body: [["L'information me paraît terminée. Les parties disposent des délais de l'article 175 pour adresser leurs observations, notamment sur la qualification."]] });
          api.schedule(R.int(s, 26, 32), "_reglement");
        },
        filed_observations_175(api, { res }) {
          const { cs } = api;
          cs.vars.obs175 = { qualif: res.filled.qualif, points: res.picks.points || [], defects: res.defects };
        },
        _reglement(api) {
          const { s, cs } = api;
          const o = cs.vars.obs175 || { points: [] };
          let crime = 0.5 + (cs.vars.video ? 0.05 : 0) + (cs.vars.expertise ? 0.04 : 0);
          if (D) crime -= o.qualif === "requalif" ? 0.12 + o.points.length * 0.06 : 0;
          else crime += o.qualif === "crime" ? 0.08 + o.points.length * 0.05 : 0;
          crime += (R.next(s) - 0.5) * 0.3;
          cs.vars.reglement = crime > 0.5 ? "oma" : "ortc";
          if (cs.vars.reglement === "oma") {
            api.doc("oma", TITLES.oma);
            api.mail({ from: "Cabinet de M. Vauclair, juge d'instruction", subject: "Ordonnance de mise en accusation", kind: "greffe", important: true, doc: "oma", title: TITLES.oma });
            api.run("_audienceAssises");
          } else {
            api.doc("ortc", TITLES.ortc);
            cs.vars.ortcDay = s.day;
            api.mail({ from: "Cabinet de M. Vauclair, juge d'instruction", subject: "Ordonnance de requalification et de renvoi", kind: "greffe", important: true, body: [["Les faits sont requalifiés en violences avec arme ayant entraîné une ITT de plus de huit jours (art. 222-12) ; M. Ferhat est renvoyé devant le tribunal correctionnel."], ["Appel possible dans les dix jours (art. 186-3) ; à défaut, le tribunal correctionnel ne pourra plus se déclarer incompétent (art. 469)."]] });
            api.schedule(11, "_ortcDefinitive");
          }
        },
        _ortcDefinitive(api) {
          const { cs } = api;
          if (CR.drafted(cs, "appel_ortc") && CR.drafted(cs, "appel_ortc").depose) return;
          if (!cs.vars.ortcAcceptee) { cs.vars.ortcAcceptee = api.s.day; api.tl("Délai d'appel expiré : l'ordonnance de renvoi est définitive."); api.run("_audienceTC"); }
        },
        filed_appel_ortc(api, { depot }) {
          const { s, cs } = api;
          if (!depot) return;
          const due = CR.rollForward(cs.vars.ortcDay + 10);
          if (s.day > due) { CR.erreur(s, cs, { id: "appel_ortc_tardif", texte: "Appel de l'ordonnance de renvoi formé après le délai de dix jours.", sanction: "Irrecevable ; le tribunal correctionnel jugera.", regul: "Aucune." }); return; }
          CR.PROC.event(api, "Appel de l'ordonnance de renvoi devant la chambre de l'instruction (art. 186-3).");
          cs.vars.appelOrtc = s.day;
          api.cancel("_ortcDefinitive");
          api.schedule(R.int(s, 30, 45), "_arretChambre");
        },
        _arretChambre(api) {
          const { s, cs } = api;
          const o = cs.vars.obs175 || { points: [] };
          const p = 0.5 + (cs.vars.video ? 0.08 : 0) + (cs.vars.expertise ? 0.08 : 0) + (!D && o.qualif === "crime" ? 0.1 : 0) - (D && o.qualif === "requalif" ? 0.1 : 0);
          const crime = R.chance(s, CR.clamp(p, 0.2, 0.85));
          api.mail({ from: "Greffe de la chambre de l'instruction", subject: "Arrêt sur l'appel de l'ordonnance de renvoi", kind: "greffe", important: true, body: [[crime ? "La chambre de l'instruction infirme l'ordonnance : les faits constituent une tentative de meurtre. Elle prononce la mise en accusation de M. Ferhat devant la cour d'assises de Paris." : "La chambre de l'instruction confirme l'ordonnance de requalification et de renvoi devant le tribunal correctionnel."]] });
          if (crime) { cs.vars.reglement = "oma"; api.doc("oma", TITLES.oma); api.run("_audienceAssises"); } else { cs.vars.ortcAcceptee = s.day; api.run("_audienceTC"); }
        },
        _audienceTC(api) {
          const { s, cs } = api;
          if (cs.proc.audience) return;
          cs.vars.fond = "tc";
          let day = CR.rollForward(s.day + 40);
          while (CR.dow(day) !== 3 || !CR.isBusinessDay(day)) day++;
          cs.proc.nature = "delit";
          cs.proc.pcConstituee = cs.proc.pcConstituee || D;
          CR.PROC.fixAudience(api, { day, min: 13 * 60 + 30, juridiction: "tc", mode: "ordonnance", convocDay: s.day, president: "pr_dessaint", script: "tc", done: "apresFond", onMiss: "_absent", title: "Audience — 16e chambre correctionnelle", duree: 90 });
          CR.PROC.stade(api, "jugement", "Renvoi devant le tribunal correctionnel pour violences avec arme (art. 222-12).");
          api.mail({ from: "Greffe correctionnel", subject: "Audience — Ferhat", kind: "greffe", body: [[`Audience le ${CR.fmtDate(day, "dow")} à 13 h 30, 16e chambre correctionnelle.`]] });
        },
        _audienceAssises(api) {
          const { s, cs } = api;
          if (cs.proc.audience) return;
          cs.vars.fond = "assises";
          let day = CR.rollForward(s.day + 60);
          while (CR.dow(day) !== 1 || !CR.isBusinessDay(day)) day++;
          CR.PROC.fixAudience(api, { day, min: 9 * 60 + 30, juridiction: "assises", mode: "oma", convocDay: s.day, president: "pr_assises", script: "assises", done: "apresFond", onMiss: "_absent", title: "Cour d'assises de Paris — procès de M. Ferhat", duree: 420 });
          cs.actors.parquet = "pq_ag";
          CR.PROC.stade(api, "jugement", "Mise en accusation devant la cour d'assises de Paris pour tentative de meurtre.");
          api.mail({ from: "Greffe de la cour d'assises", subject: "Session d'assises — Ferhat", kind: "greffe", important: true, body: [[`L'affaire est inscrite au rôle de la session : ouverture des débats le ${CR.fmtDate(day, "dow")} à 9 h 30, cour d'assises de Paris, Île de la Cité.`], ["Le tirage au sort des jurés aura lieu à l'ouverture. La défense dispose de quatre récusations, le ministère public de trois (art. 298)."]] });
        },
        _absent(api) {
          const { s, cs } = api;
          CR.erreur(s, cs, { id: "absent", texte: "Vous n'étiez pas au procès.", sanction: D ? "Un avocat commis d'office a plaidé sans connaître le dossier." : "Les demandes de M. Lemaire n'ont pas été soutenues.", regul: "Aucune." });
          CR.closeCase(s, cs, D ? { type: "condamnation", detail: "procès sans votre défense" } : { type: "done", detail: "procès sans l'avocat de la partie civile" });
        },
        decider(api, { st }) {
          const { s, cs } = api;
          const pl = st.played;
          const assises = cs.vars.fond === "assises";
          const jury = cs.vars.jures || [];
          const lean = jury.length ? jury.reduce((a, j) => a + j.lean, 0) / jury.length : 0;
          let intention = 0.55 + (cs.vars.video ? 0.08 : 0) + (cs.vars.expertise ? 0.04 : 0);
          if (pl.has("arg:intention") || pl.has("arg:video_lame")) intention += 0.12;
          if (pl.has("arg:vital")) intention += 0.06;
          if (pl.has("arg:melee")) intention -= 0.14;
          if (pl.has("arg:peur")) intention -= 0.08;
          if (pl.has("arg:rendu")) intention -= 0.05;
          if (pl.has("arg:ld")) intention += 0.05;
          intention -= lean * 0.5;
          intention += (CR.seeded(cs.id + "int" + s.seed)() - 0.5) * 0.2;
          const tentative = assises && intention > 0.5;
          cs.vars.intention = Math.round(intention * 100);
          const perso = ["K9_attest_patron", "K9_perso", "K9_rendu", "K9_apprenti"].filter((f) => CR.hasFact(cs, f) || pl.has(f)).length + (st.dernierMot === "regrets" ? 1 : 0);
          const picks = (cs.vars.chiffrage && cs.vars.chiffrage.postes) || [];
          const autres = (cs.vars.chiffrage && cs.vars.chiffrage.autres) || [];
          const postes = pcPostes.filter((p) => picks.includes(p.id));
          return PEN.juger(api, {
            st, juridiction: assises ? "assises" : "tc", titre: assises ? "Arrêt de la cour d'assises" : "Jugement correctionnel", prevenuNom: "Malik Ferhat", pcNom: "M. Hugo Lemaire",
            spec: { seuil: 0.4, pieces: { aveu: { label: "Les coups reconnus par M. Ferhat", sens: "charge", force: 0.5 }, temoin: { label: "Le témoin, agent de sécurité", sens: "charge", force: 0.15 }, ld: { label: "La légitime défense invoquée", sens: "decharge", force: 0.03, need: ["arg:ld"] } } },
            qualif: () => tentative
              ? { id: "221-1", label: "tentative de meurtre", court: "art. 121-5 et 221-1 CP", encourue: { prison: 360 }, requis: Object.assign({}, cs.vars.requis), motif: "La cour et le jury ont répondu « oui » à la question de l'intention homicide : deux coups au thorax, la lame ouverte avant de se relever, une plaie engageant le pronostic vital." }
              : { id: "222-12", label: "violences avec usage d'une arme ayant entraîné une incapacité totale de travail supérieure à huit jours", court: "art. 222-12 CP", encourue: { prison: 60, amende: 75000 }, favorable: assises, requis: Object.assign({}, cs.vars.requis, assises ? { ferme: Math.min(36, (cs.vars.requis && cs.vars.requis.ferme) || 36), sursis: 12 } : {}), motif: assises ? "À la question principale de l'intention homicide, la majorité requise n'a pas été réunie ; la cour et le jury ont répondu « oui » à la question subsidiaire des violences avec arme." : "Les violences avec arme ayant entraîné une ITT de trente jours sont établies (art. 222-12)." },
            personnalite: perso,
            detenu: false,
            civil: !D ? { postes, art475: autres.includes("art475") ? 2000 : 0 } : null,
          });
        },
        apresFond(api, res) {
          const { s, cs } = api;
          const dec = res.decision || {};
          const pn = dec.peine;
          if (D && dec.coupable && pn && pn.mandatDepot && pn.ferme > 0) CR.condamneDetenu(s, cs, pn.ferme, "fresnes", s.day);
          if (cs.aj) { api.aj("instruction_crim"); if (cs.vars.fond === "assises") api.aj("criminel"); else api.aj("pc"); }
          CR.closeCase(s, cs, PEN.issue(api, dec));
        },
      },
      audiences: {
        interro(api) {
          const { cs } = api;
          const steps = D ? [
            { who: "sys", t: "(Le cabinet du juge Vauclair. Malik s'assoit à côté de vous ; il serre ses mains entre ses genoux.)" },
            { who: "ji", t: "Monsieur Ferhat, nous reprenons les faits. Pourquoi avoir sorti ce couteau ?" },
            { if: () => !!cs.flags.prepInterro, then: [{ who: "client", t: "J'étais par terre. Ils étaient trois à me frapper. Je l'ai sorti pour qu'ils arrêtent, pour leur faire peur.", signal: "bon", fx: { csFlags: { interroBon: true } } }], else: [{ who: "client", t: "Je sais pas… j'avais la haine. J'ai frappé là où je pouvais.", fx: { cred: -2, csFlags: { interroMauvais: true } } }] },
            { who: "ji", t: "Vous avez frappé deux fois, au thorax. Vous saviez que le cœur est là ?" },
            { choose: [
              { t: "(Vous intervenez) « Monsieur le juge, mon client a dit qu'il ne visait pas. »", reply: "Laissez-le répondre, maître. Vous pourrez poser vos questions à la fin.", replyWho: "ji", fx: { cred: -1 } },
              { t: "(Vous laissez Malik répondre.)", reply: "", then: [{ who: "client", t: "Je n'ai pas visé. Tout est allé en deux secondes." }] },
            ] },
            { questions: { prompt: "Questions à votre client (art. 120)", to: "client", who: "client", max: 2, options: [
              { id: "q_sol", t: "Où étiez-vous juste avant les coups ?", a: "Par terre. Ils me donnaient des coups de pied dans les côtes.", f: "K9_trois", signal: "bon" },
              { id: "q_rendu", t: "Qu'avez-vous fait le lendemain matin ?", a: "Je suis allé au commissariat avec ma mère, et j'ai rendu le couteau.", f: "K9_rendu", signal: "bon" },
              { id: "q_couteau", t: "Pourquoi portiez-vous ce couteau ?", a: "Depuis mon agression, à dix-sept ans. J'avais peur.", signal: "neutre" },
            ] } },
            { who: "ji", t: "Je vous remercie. Nous en avons terminé." },
          ] : [
            { who: "sys", t: "(Le cabinet du juge Vauclair. Hugo regarde la porte à chaque bruit de couloir.)" },
            { who: "ji", t: "Monsieur Lemaire, vous êtes entendu en qualité de partie civile. Racontez-moi." },
            { who: "client", t: "On s'est embrouillés avec son copain. Lui s'est mêlé. Il a sorti un couteau et il m'a planté deux fois." },
            { who: "ji", t: "Vos amis ont-ils frappé M. Ferhat avant cela ?" },
            { choose: [
              { t: "(Vous laissez Hugo répondre honnêtement.)", then: [{ who: "client", t: "Oui. Il était par terre. Je ne l'ai pas frappé, moi, mais j'étais là." }], fx: { csFlags: { hugoHonnete: true }, cred: 1 } },
              { t: "(Vous intervenez) « Mon client n'a pas à répondre pour ses amis. »", reply: "Il est entendu comme partie civile, maître, pas comme mis en examen. La question est légitime.", replyWho: "ji", fx: { cred: -2 } },
            ] },
            { questions: { prompt: "Questions à votre client", to: "client", who: "client", max: 2, options: [
              { id: "q_lame", t: "Quand avez-vous vu la lame ?", a: "Elle était déjà ouverte quand il s'est relevé. Je l'ai vue briller.", f: "K9_lame_ouverte", signal: "bon" },
              { id: "q_suite", t: "Où en êtes-vous aujourd'hui, physiquement ?", a: "Je ne peux pas lever le bras gauche. J'ai une cicatrice de douze centimètres.", f: "K9_cicatrice", signal: "bon" },
            ] } },
            { who: "ji", t: "Je vous remercie." },
          ];
          return { title: "Cabinet du juge d'instruction", sub: "Tribunal judiciaire de Paris · M. Vauclair", decor: { scene: "cabinet_ji", judge: CR.px.acteurLook(CR.acteur("ji_vauclair")) }, steps };
        },
        confront(api) {
          const { cs } = api;
          const steps = [
            { who: "sys", t: "(Malik et Hugo sont assis à deux mètres l'un de l'autre. Ils ne se regardent pas. L'autre avocat salue d'un signe de tête.)" },
            { who: "ji", t: "Monsieur Lemaire, maintenez-vous que M. Ferhat vous a frappé sans raison ?" },
            { who: D ? "temoin" : "client", name: D ? "Hugo Lemaire" : undefined, t: "Il s'est relevé et il m'a planté. Voilà." },
            { who: "ji", t: "Monsieur Ferhat ?" },
            { who: D ? "client" : "temoin", name: D ? undefined : "Malik Ferhat", t: "Ils étaient trois sur moi. Je voulais qu'ils arrêtent." },
            { questions: D
              ? { prompt: "Questions à M. Lemaire (art. 120)", who: "temoin", name: "Hugo Lemaire", max: 2, options: [
                { id: "c_sol", t: "Monsieur Lemaire, M. Ferhat était-il au sol avant les coups de couteau ?", a: "… Oui. Mes amis le tapaient. Pas moi.", f: "K9_hugo_admet", signal: "bon" },
                { id: "c_pieds", t: "Vos amis lui donnaient-ils des coups de pied ?", a: "Je ne sais plus. Peut-être.", signal: "neutre" },
                { id: "c_menteur", t: "Pourquoi mentez-vous ?", a: "Je ne mens pas !", fx: { cred: -2 }, signal: "mauvais" },
              ] }
              : { prompt: "Questions à M. Ferhat (art. 120)", who: "temoin", name: "Malik Ferhat", max: 2, options: [
                { id: "c_ouvert", t: "Monsieur Ferhat, votre lame était-elle ouverte avant que vous vous releviez ?", a: "… Je l'avais ouverte par terre. Oui.", f: "K9_ouvert_avant", signal: "bon" },
                { id: "c_ou", t: "Où avez-vous frappé ?", a: "Au torse. Je ne visais pas.", signal: "neutre" },
                { id: "c_tuer", t: "Vous vouliez le tuer, avouez-le !", a: "Non !", fx: { cred: -2 }, signal: "mauvais" },
              ] } },
            { who: "ji", t: "La confrontation est terminée. Je vous remercie." },
          ];
          return { title: "Confrontation", sub: "Cabinet de M. Vauclair", decor: { scene: "cabinet_ji", judge: CR.px.acteurLook(CR.acteur("ji_vauclair")) }, steps };
        },
        tc(api) {
          const { cs } = api;
          return {
            title: "16e chambre correctionnelle", sub: "Tribunal judiciaire de Paris", decor: { scene: "salle" },
            steps: AUD.jugement(api, {
              prevenu: MALIK, victime: D ? null : HUGO, victimeAvocat: D ? null : `Me ${api.s.player.nom}`,
              prevention: `Vous êtes prévenu d'avoir, à Paris, le ${CR.fmtDate(cs.proc.faitsDay, "long")}, volontairement commis des violences sur M. Hugo Lemaire, avec usage d'une arme, ayant entraîné une incapacité totale de travail supérieure à huit jours. Article 222-12 du code pénal.`,
              sansLimine: D ? "L'affaire vient sur ordonnance de renvoi : les nullités de l'instruction sont purgées, et le tribunal ne peut plus se déclarer incompétent (art. 385 et 469). Nous abordons le fond." : null,
              exceptionAdverse: "Aucune, monsieur le président.",
              instruction: [
                { who: "president", t: D ? "Monsieur Ferhat, expliquez au tribunal." : "Monsieur Ferhat, expliquez-vous." },
                { who: D ? "client" : "prevenu", name: D ? undefined : "Malik Ferhat", t: "Ils étaient trois sur moi. J'ai sorti le couteau. Je regrette tous les jours." },
                { who: "president", t: "Monsieur Lemaire ?" },
                { who: D ? "temoin" : "client", name: D ? "Hugo Lemaire" : undefined, t: "Je ne peux toujours pas lever le bras." },
              ],
              pc: D ? null : { max: 4, args: pcArgs(false) },
              pcAdverse: D ? ["Monsieur le président, mon client garde une cicatrice de douze centimètres et la peur de sortir le soir. Il demande réparation."] : null,
              requis: { base: { ferme: 12, sursis: 24 }, avant: ["Un couteau porté sur soi, deux coups au thorax. La rixe n'excuse rien."] },
              defense: D ? { max: 4, angles: [{ id: "peine", t: "La peine", sub: "Un apprenti sans antécédent, qui s'est rendu." }], args: defArgs(false) } : null,
              defenseAdverse: D ? null : ["Mon client était au sol, frappé par trois hommes. Il s'est rendu le lendemain. Je demande une peine qui lui permette de garder son apprentissage."],
              dernierMotAdverse: "Je demande pardon à M. Lemaire.",
            }),
          };
        },
        assises(api) {
          const { cs } = api;
          const steps = [
            { who: "huissier", t: "La cour !" },
            { who: "president", t: "L'audience est reprise. Les jurés ont prêté serment. Greffière, donnez lecture de la décision de renvoi." },
            { who: "greffier", t: "Ordonnance de mise en accusation de M. Malik Ferhat du chef de tentative de meurtre sur la personne de M. Hugo Lemaire…" },
            { who: "president", t: "Monsieur Ferhat, levez-vous. Vous avez le droit, au cours des débats, de faire des déclarations, de répondre aux questions ou de vous taire." },
            { who: D ? "client" : "prevenu", name: D ? undefined : "Malik Ferhat", t: "Je veux répondre. Je ne voulais pas le tuer." },
            { who: "president", t: "Nous entendons l'expert." },
            { who: "temoin", name: "L'expert médico-légal", t: cs.vars.expertise ? "Coups portés de face, de bas en haut, rapides. La plaie profonde engageait le pronostic vital sans chirurgie dans l'heure." : "Je n'ai été commis qu'au stade de l'enquête : deux plaies, dont l'une profonde, à deux centimètres du péricarde." },
            { who: "president", t: "Nous visionnons la vidéo." },
            { if: () => !!cs.vars.video, then: [{ who: "sys", t: "(Sur l'écran : Malik au sol, trois hommes autour, des coups de pied. Il se relève, la lame déjà ouverte. Deux gestes, très vite. Il s'enfuit.)" }], else: [{ who: "sys", t: "(La vidéo du bar n'a jamais été versée au dossier. Le président passe aux témoins.)" }] },
            { who: "temoin", name: "M. Soumaré, agent de sécurité", t: "Trois garçons tapaient le petit. Quand il s'est relevé, il a frappé deux fois, très vite." },
            { questions: D
              ? { prompt: "Questions au témoin", who: "temoin", name: "M. Soumaré", max: 2, options: [
                { id: "a_combien", t: "Combien de temps entre le moment où il se relève et les coups ?", a: "Une seconde, deux peut-être. Il n'a pas réfléchi, si vous voulez mon avis.", signal: "bon", fx: { play: ["arg:melee"] } },
                { id: "a_pieds", t: "Les trois hommes lui donnaient-ils des coups de pied ?", a: "Oui, au sol. Je m'apprêtais à intervenir.", f: "K9_trois", signal: "bon" },
              ] }
              : { prompt: "Questions au témoin", who: "temoin", name: "M. Soumaré", max: 2, options: [
                { id: "a_lame", t: "Avez-vous vu la lame avant les coups ?", a: "Oui. Elle était ouverte quand il s'est relevé.", f: "K9_lame_ouverte", signal: "bon" },
                { id: "a_vise", t: "Où a-t-il frappé ?", a: "Au torse, à gauche. Les deux fois.", signal: "bon" },
              ] } },
          ];
          if (!D) steps.push({ who: "president", t: "La parole est à la partie civile." }, { plaidoirie: { role: "pc", max: 4, args: pcArgs(true) } });
          else steps.push({ who: "president", t: "La parole est à la partie civile." }, { who: "adverse", t: "Hugo Lemaire a vu la lame. Il a senti la deuxième entrer. Il vit avec cela. La partie civile demande réparation." });
          steps.push(AUD.requisitions({ ferme: 96, complementaires: ["interdiction de porter une arme pendant cinq ans"] }, { avant: ["Deux coups, au thorax, à deux centimètres du cœur. L'intention de tuer se lit dans ces deux gestes."] }));
          if (D) steps.push({ who: "president", t: "La parole est à la défense. L'accusé aura la parole en dernier." }, { plaidoirie: { role: "defense", max: 4, args: defArgs(true) } }, { dernierMot: { prepare: [{ id: "regrets", label: "Demander pardon à Hugo", t: "Je demande pardon à M. Lemaire. Je pense à lui tous les jours." }, { id: "rien", label: "Rien de plus", t: "Je n'ai rien à ajouter." }], spontane: { id: "spontane", t: "Je… je ne voulais pas." } } });
          else steps.push({ who: "president", t: "La parole est à la défense." }, { who: "adverse", t: "Un garçon au sol, frappé par trois hommes, qui se relève et frappe en deux secondes : où est la volonté de tuer ? Vous répondrez non à la question de l'intention." }, { who: "president", t: "Monsieur Ferhat, vous avez la parole en dernier." }, { who: "prevenu", name: "Malik Ferhat", t: "Je demande pardon à M. Lemaire." });
          steps.push({ delibere: { texte: "La cour et les jurés se retirent pour délibérer. Les débats sont clos ; le président emporte le dossier. Quatre heures plus tard : « La cour ! »" } });
          return { title: "Cour d'assises de Paris", sub: "Île de la Cité · Mme Arnault-Royer", decor: { scene: "assises", box: D }, jury: true, juryDefense: D, steps };
        },
      },
      debrief(api, o) {
        const { cs } = api;
        const items = [{ kind: "rule", text: "L'intention de tuer se déduit de l'arme, de la zone visée, du nombre et de la violence des coups ; sans elle, ce sont des violences avec arme (art. 222-12, cinq ans)." }];
        if (cs.vars.reglement === "ortc") items.push({ kind: "info", text: cs.vars.appelOrtc ? "Vous avez fait appel de la correctionnalisation (art. 186-3) : la chambre de l'instruction a tranché la qualification." : "Sans appel de l'ordonnance de renvoi dans les dix jours, le tribunal correctionnel ne pouvait plus se déclarer incompétent (art. 469)." });
        if (D && cs.vars.appelOrtc) items.push({ kind: "bad", text: "En défense, faire appel d'une correctionnalisation, c'est risquer la cour d'assises et trente ans encourus au lieu de cinq." });
        if (cs.vars.fond === "assises") items.push({ kind: "info", text: `La tentative de meurtre est punie de trente ans : elle relève de la cour d'assises, pas de la cour criminelle départementale, qui ne juge que les crimes punis de quinze ou vingt ans. Intention retenue par la cour : ${cs.vars.intention > 50 ? "oui" : "non"}.` });
        if (D && cs.advice.includes("m_contact")) items.push({ kind: "bad", text: "Vous avez conseillé à Malik d'écrire à la victime : son contrôle judiciaire le lui interdisait sans doute, et toute lettre aurait été versée au dossier." });
        if (D && cs.advice.includes("m_acquitte")) items.push({ kind: "bad", text: "Deux coups de couteau contre des coups de pied : la riposte n'était pas proportionnée, la légitime défense ne tenait pas (art. 122-5). Et on ne promet jamais un acquittement." });
        if (!D && cs.advice.includes("h_vingt")) items.push({ kind: "bad", text: "Vous avez promis une peine : la partie civile ne requiert pas, et on ne promet jamais un résultat." });
        if (!D && cs.flags.hugoHonnete) items.push({ kind: "good", text: "Vous avez laissé Hugo reconnaître que ses amis avaient frappé : une partie civile qui ment perd tout crédit." });
        return items.concat(cs.vars.debriefJugement || []);
      },
      epilogue(api, o) {
        const p = api.cs.vars.peine;
        if (D) return p && p.mandatDepot ? `${p.texte}. Malik a été conduit à Fresnes. Son patron lui a écrit qu'il garderait sa place.` : `${p ? p.texte : "Jugé"}. Malik a repris l'apprentissage. Il ne porte plus de couteau.`;
        return o.type === "indemnise" ? "Malik ne pouvant pas payer, Hugo a saisi la commission d'indemnisation des victimes d'infractions avec le jugement. Il a repris le service, le midi seulement." : "Hugo n'a rien obtenu. Il a déménagé loin d'Oberkampf.";
      },
      fiche(api, o) {
        return {
          phrase: `Coups de couteau dans une rixe, information pour tentative de meurtre, ${D ? "avocat de Malik Ferhat" : "avocat de Hugo Lemaire, partie civile"}.`,
          notions: [
            { titre: "Tentative de meurtre ou violences avec arme", regle: "Le meurtre suppose l'intention de tuer (art. 221-1, trente ans) ; la tentative est punissable s'il y a commencement d'exécution sans désistement volontaire (art. 121-5). Sans intention : violences avec arme, ITT de plus de huit jours (art. 222-12, cinq ans).", art: "art. 121-5, 221-1, 222-12 CP", prog: "dpg" },
            { titre: "La correctionnalisation", regle: "Le juge peut renvoyer devant le tribunal correctionnel des faits requalifiés en délit ; les parties peuvent en faire appel (art. 186-3) ; à défaut, le tribunal ne peut plus se déclarer incompétent (art. 469).", art: "art. 186-3 et 469 CPP", prog: "pp_instruction" },
            { titre: "Le jury d'assises", regle: "Six jurés en premier ressort ; récusations sans motif : quatre pour l'accusé, trois pour le ministère public (art. 298).", art: "art. 298 CPP", prog: "pp_jugement" },
          ],
          piege: D ? "Faire appel d'une correctionnalisation favorable à son client." : "Laisser passer les dix jours de l'article 186-3 sans avoir décidé, en connaissance de cause, d'accepter ou non la correctionnalisation.",
          devenir: api.def.epilogue(api, o),
        };
      },
      corrige() {
        return [
          { probleme: "Quelle qualification ?", regle: "Meurtre : trente ans (art. 221-1) ; tentative en cas de commencement d'exécution sans désistement volontaire (art. 121-5) ; l'intention se déduit de l'arme, de la zone visée et du nombre de coups. Violences avec arme ayant entraîné une ITT de plus de huit jours : cinq ans (art. 222-12).", application: "Deux coups au thorax, lame ouverte, plaie engageant le pronostic vital, contre une riposte en deux secondes au sortir d'un passage à tabac : la qualification se plaide." },
          { probleme: "Quelle juridiction ?", regle: "La tentative de meurtre est punie de trente ans : cour d'assises. La cour criminelle départementale ne juge que les crimes punis de quinze ou vingt ans.", application: "Si le juge requalifie, le tribunal correctionnel ; l'appel de l'article 186-3 permet de discuter la qualification devant la chambre de l'instruction, faute de quoi l'article 469 interdit au tribunal de se déclarer incompétent." },
          { probleme: "Que faire aux assises ?", regle: "Récusations sans motif : quatre pour l'accusé, trois pour le ministère public (art. 298). La cour et le jury répondent à la question de l'intention, et à une question subsidiaire de violences si elle est posée.", application: "En défense, tout se joue sur l'intention ; en partie civile, sur la lame ouverte, la zone et le pronostic vital, et sur des préjudices justifiés." },
        ];
      },
    };
  }

  function pcArgs(assises) {
    return [
      { id: "video_lame", label: "La lame ouverte avant de se relever, deux coups en deux secondes", say: "La vidéo le montre : la lame est ouverte avant même qu'il se relève. Deux coups, au même endroit, en deux secondes.", cards: ["K9_video_coups", "K9_ouvert_avant", "K9_lame_ouverte"] },
      { id: "vital", label: "Une plaie à deux centimètres du cœur, le pronostic vital engagé", say: "Six centimètres de lame, deux centimètres du péricarde : sans le chirurgien de Saint-Antoine, Hugo serait mort.", cards: ["K9_plaies", "K9_vital"] },
      { id: "intention", label: "L'intention de tuer se lit dans l'arme, la zone et le nombre de coups", say: "On ne frappe pas deux fois au thorax pour faire peur : l'arme, la zone, le nombre de coups disent l'intention.", cards: ["CP_221-1", "CP_121-5"], pertinent: () => assises },
      { id: "prejudice", label: "Les préjudices : souffrances, cicatrice, deux mois de salaire", say: "Trente jours d'incapacité, une cicatrice de douze centimètres, deux mois sans salaire : les bulletins sont au dossier.", cards: ["K9_bulletins", "K9_cicatrice", "K9_salaire"] },
      { id: "honnete", label: "Hugo n'a pas caché que ses amis avaient frappé", say: "Hugo n'a rien caché : ses amis ont frappé, il l'a dit au juge. Cela ne donnait à personne le droit de lui planter une lame dans la poitrine.", cards: ["K9_trois"] },
      { id: "vingt", label: "Réclamer vingt ans de réclusion", say: "Je demande vingt ans.", pertinent: () => false },
    ];
  }
  function defArgs(assises) {
    return [
      { id: "melee", label: "Une riposte en deux secondes, au sortir d'un passage à tabac", say: "Malik est au sol, trois hommes le frappent. Il se relève et frappe en deux secondes : ce sont des gestes de panique, pas un projet de tuer.", cards: ["K9_melee", "K9_video_sol", "K9_hugo_admet", "K9_trois"] },
      { id: "peur", label: "« Pour leur faire peur » : l'intention de tuer n'est pas prouvée", say: "Il l'a dit dès la garde à vue : pour leur faire peur. Le doute sur l'intention doit lui profiter.", cards: ["K9_peur", "CP_121-5"], pertinent: () => assises || true },
      { id: "rendu", label: "Il s'est rendu le lendemain, avec le couteau", say: "Le lendemain matin, il est allé au commissariat avec sa mère, et il a rendu le couteau.", cards: ["K9_rendu"] },
      { id: "perso", label: "Un apprenti que son patron attend", say: "Dix-huit mois d'apprentissage, un patron qui le reprend quoi qu'il arrive.", cards: ["K9_attest_patron", "K9_perso", "K9_apprenti"] },
      { id: "ld", label: "La légitime défense", say: "Il s'est défendu contre trois agresseurs.", pertinent: () => false },
    ];
  }

  CR.defineCase(build("defense"));
  CR.defineCase(build("pc"));
})();
