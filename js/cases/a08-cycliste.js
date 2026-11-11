/* Affaire 8 — Le cycliste.
   Partie civile. Homicide routier (art. 221-18 CP), information judiciaire ouverte, constitution incidente,
   demandes d'actes (images de vidéoprotection conservées un mois au plus), loi du 5 juillet 1985 face à l'assureur.
   Pièges : croire que la faute du cycliste efface la responsabilité du conducteur, ou qu'elle réduit l'indemnisation
   comme celle d'un automobiliste ; laisser les parents signer l'offre réduite de l'assureur. */
(function () {
  const CR = window.CR;
  const R = CR.R;
  const PEN = CR.PEN;
  const AUD = CR.AUD;
  const SYLVIE = { prenom: "Sylvie", nom: "Fournier", g: "f", age: 51, metier: "infirmière scolaire", tel: "06 71 22 40 18", trust: 55, look: { skin: 0, hair: "bob", hc: "brown", glasses: 1 } };
  const VASSEUR = { prenom: "Grégory", nom: "Vasseur", g: "m", naissance: "le 3 mars 1992 à Creil", adresse: "à Saint-Denis", metier: "commercial" };
  const DEF = "a08_cycliste";
  const OFFRE = 36400;
  const POSTES = [
    { id: "aff_mere", label: "Préjudice d'affection de Mme Sylvie Fournier, sa mère", demande: 30000, base: 28000, needs: null, justif: null },
    { id: "aff_pere", label: "Préjudice d'affection de M. Patrick Fournier, son père", demande: 30000, base: 28000, needs: null, justif: null },
    { id: "aff_frere", label: "Préjudice d'affection de Léo, son frère mineur, représenté par ses parents", demande: 15000, base: 12000, needs: ["F8_frere"], justif: null },
    { id: "obseques", label: "Frais d'obsèques", demande: 4800, base: 4800, needs: ["F8_obseques", "F8_facture"], justif: ["F8_facture"] },
    { id: "economique", label: "Préjudice économique des parents (perte de revenus futurs de Bastien)", demande: 40000, base: 0, needs: null, justif: ["F8_dependance"], sansJustif: 0 },
  ];

  CR.defineCase({
    id: DEF, camp: "pc", domaine: "pc", domaineLib: "dps",
    title: "Fournier — le cycliste",
    arrive: { day: 45, min: 17 * 60 + 30, how: "rdv", mail: { from: "Sylvie Fournier", subject: "Notre fils Bastien", kind: "email", body: [["Maître, notre fils Bastien, 19 ans, a été tué à vélo il y a trois semaines, boulevard de Magenta. Le conducteur était sous cannabis et dit que Bastien a grillé le feu. Une juge d'instruction a été désignée. Nous ne savons pas quoi faire. Pouvons-nous vous voir ?"]] } },
    leadTask: PEN.rdvTask("Recevoir M. et Mme Fournier au cabinet"),
    client: SYLVIE, leadPatience: 5,
    profile: { wealth: 3, sens: 0.7, urgency: 0.6, temper: "anxieux" },
    honoraires: { forfait: 3000, heures: 18, types: ["forfait", "temps"], resultat: "indemnisation intégrale" },
    mission: "Assistance de M. et Mme Fournier, en leur nom et au nom de leur fils mineur Léo, parties civiles dans l'information ouverte après la mort de Bastien Fournier ; demandes d'actes, relations avec l'assureur, audience de jugement jusqu'à la décision de première instance.",
    actors: { ji: "ji_ferraud", parquet: "pq_delahaye", president: "pr_aubriot", adverse: "av_pernot" },
    proc: { stade: "information", nature: "delit", faits: -24, infractions: ["CP_221-18"] },
    init(api, cs) {
      const f = cs.proc.faitsDay;
      cs.vars.videoLimite = f + 30;
      cs.proc.events.push({ day: f, text: "Accident mortel, boulevard de Magenta, à 23 h 10." }, { day: f + 6, text: "Information judiciaire ouverte ; M. Vasseur mis en examen et placé sous contrôle judiciaire, suspension de son permis." });
    },
    vars: (s, cs) => ({ faitsDate: CR.fmtDate(cs.proc.faitsDay, "long") }),
    facts: {
      F8_faits: { label: "Le choc, le soir, au carrefour Magenta–La Fayette", key: true },
      F8_thc: { label: "Le conducteur a été dépisté positif au cannabis", key: true, why: "L'usage de stupéfiants fait de l'homicide involontaire un homicide routier (art. 221-18), s'il est établi par l'analyse." },
      F8_feu: { label: "Le conducteur dit que Bastien a grillé le feu rouge", key: true, why: "Au pénal, la faute de la victime n'exonère le prévenu que si elle est la cause exclusive du dommage. Au civil, Bastien n'était pas conducteur d'un véhicule à moteur : seule une faute inexcusable, cause exclusive de l'accident, lui serait opposable (loi du 5 juillet 1985, art. 3)." },
      F8_camera: { label: "Des caméras au carrefour, et celle de la pharmacie à l'angle", key: true, why: "Les images de vidéoprotection ne sont conservées qu'un mois au plus : il fallait les demander tout de suite." },
      F8_temoin: { label: "Un livreur à scooter a vu l'accident", key: true },
      F8_frere: { label: "Léo, 15 ans, le petit frère", key: true, why: "Les frères et sœurs subissent eux aussi un préjudice d'affection." },
      F8_obseques: { label: "Les obsèques ont coûté 4 800 €", key: true },
      F8_assureur: { label: "L'assureur parle de « responsabilité partagée »" },
      F8_casque: { label: "Bastien ne portait pas de casque", why: "Le casque n'est obligatoire à vélo que pour les enfants de moins de douze ans : son absence n'est pas une faute opposable." },
      F8_prelevement: { label: "Le résultat de l'analyse de sang n'est pas au dossier" },
    },
    calls: {
      intake: {
        scene: "conference", kind: "meet", label: "Rendez-vous au cabinet",
        opening: ["M. et Mme Fournier s'assoient sans retirer leurs manteaux. Le père regarde ses mains. « Bastien allait à son cours du soir. Il faisait ce trajet tous les jours. »"],
        topics: [
          { id: "f_quoi", q: "Que savez-vous de l'accident ?", a: [{ t: "C'était le {faitsDate}, vers 23 h 10, au carrefour du boulevard de Magenta et de la rue La Fayette.", f: "F8_faits" }, "Une voiture, un gros SUV, l'a percuté. Il est mort à Lariboisière dans la nuit."], cost: 5, unlock: ["f_conducteur", "f_camera", "f_temoin"] },
          { id: "f_conducteur", q: "Que dit le conducteur ?", a: [{ t: "Il a été testé positif au cannabis, la police nous l'a dit.", f: "F8_thc" }, { t: "Et il dit que Bastien a grillé le feu rouge. Bastien ne faisait jamais ça.", f: "F8_feu" }], cost: 4, unlock: ["f_analyse"] },
          { id: "f_analyse", q: "A-t-on fait une prise de sang au conducteur ?", a: [{ t: "Oui, le policier a parlé d'une prise de sang à l'hôpital. On ne connaît pas le résultat.", f: "F8_prelevement" }], cost: 2, tag: "good" },
          { id: "f_camera", q: "Y a-t-il des caméras à ce carrefour ?", a: [{ t: "Il y en a une sur le mât, au-dessus des feux. Et la pharmacie, à l'angle, a une caméra sur sa vitrine.", f: "F8_camera" }], cost: 2, tag: "good" },
          { id: "f_temoin", q: "Quelqu'un a-t-il vu l'accident ?", a: [{ t: "Un livreur à scooter s'est arrêté. Il a donné son numéro aux policiers. Il a dit au père que Bastien était passé à l'orange.", f: "F8_temoin" }], cost: 2 },
          { id: "f_famille", q: "Parlez-moi de votre famille.", a: [{ t: "Nous avons un autre fils, Léo, il a 15 ans. Il ne parle plus.", f: "F8_frere" }, "Bastien était étudiant en architecture, à La Villette. Il vivait encore avec nous."], cost: 3 },
          { id: "f_frais", q: "Quels frais avez-vous déjà engagés ?", a: [{ t: "Les obsèques : 4 800 euros. J'ai la facture des pompes funèbres.", f: "F8_obseques" }], cost: 2 },
          { id: "f_assureur", q: "Avez-vous eu des contacts avec une assurance ?", a: [{ t: "L'assureur du conducteur a appelé. Il parle de « responsabilité partagée », à cause du feu. Et parce que Bastien n'avait pas de casque.", f: "F8_assureur" }, { t: "C'est vrai, il ne mettait jamais de casque.", f: "F8_casque" }], cost: 3, tag: "good" },
          { id: "f_drogue", q: "Bastien avait-il bu ou consommé quelque chose ce soir-là ?", a: ["Le père se lève. « Vous êtes de quel côté, maître ? »", "La mère le fait rasseoir. « Non. Rien. Il sortait d'un cours. »"], cost: 2, tag: "bad", fx: { trust: -8 } },
        ],
        start: ["f_quoi", "f_famille", "f_frais", "f_assureur", "f_drogue"],
        patience: 120,
        close: "Merci, maître. Nous voulons seulement savoir ce qui s'est passé.",
      },
    },
    advice: [
      { id: "f_rien_signer", t: "Ne signez rien avec l'assureur avant que je l'aie lu." },
      { id: "f_factures", t: "Gardez toutes les factures : obsèques, déplacements, soins de Léo." },
      { id: "f_prison", t: "Le conducteur ira en prison, je vous le promets." },
      { id: "f_feu", t: "Si Bastien a vraiment grillé le feu, vous ne toucherez presque rien." },
    ],
    docs: {
      pv_constat: (x) => ({ title: "Procès-verbal de constatations", kind: "pv", entete: ["Préfecture de police · Service de traitement judiciaire des accidents", "Cote D3"], paras: [
        [{ t: `Le ${CR.fmtDate(x.cs.proc.faitsDay, "long")} à 23 h 10, au carrefour du boulevard de Magenta et de la rue La Fayette (10e), collision entre un véhicule Peugeot 5008 et un cycliste.`, f: "F8_faits_pv" }],
        ["Vitesse limitée à 30 km/h. Chaussée sèche. Carrefour équipé de feux tricolores."],
        [{ t: "Le cycliste, Bastien Fournier, 19 ans, ne porte pas de casque. Il décède à l'hôpital Lariboisière à 1 h 40.", f: "F8_casque" }],
        [{ t: "Le carrefour est couvert par une caméra de vidéoprotection de la préfecture de police (mât n° 10-214).", f: "F8_camera" }],
      ], signed: "Brigadier-chef Hamon" }),
      pv_depistage: (x) => ({ title: "Procès-verbal de dépistage et de prélèvement", kind: "pv", entete: ["Service de traitement judiciaire des accidents · Cote D5"], paras: [
        [{ t: "À 23 h 40, dépistage salivaire de M. Grégory Vasseur : positif au tétrahydrocannabinol (THC).", f: "F8_thc" }],
        [{ t: "À 0 h 55, prélèvement sanguin à l'hôpital Lariboisière, placé sous scellé et adressé au laboratoire pour analyse. Résultat non joint à la procédure.", f: "F8_prelevement" }],
        ["Dépistage de l'imprégnation alcoolique : négatif."],
      ] }),
      pv_vasseur: () => ({ title: "Procès-verbal d'audition de M. Vasseur (extrait)", kind: "pv", entete: ["Service de traitement judiciaire des accidents · Cote D9"], paras: [
        [{ t: "« Le feu était vert pour moi. Le vélo a grillé le rouge, il est sorti de nulle part. »", f: "F8_version" }],
        [{ t: "« Je roulais à trente, quarante maximum. »", f: "F8_vitesse_dite" }],
        ["« Le joint, c'était la veille au soir. Je n'étais pas défoncé. »"],
      ] }),
      facture: () => ({ title: "Facture des pompes funèbres", kind: "courrier", entete: ["Pompes funèbres du Faubourg · rue du Faubourg-Saint-Denis"], paras: [[{ t: "Obsèques de M. Bastien Fournier : cercueil, cérémonie, inhumation au cimetière parisien de Pantin. Total TTC : 4 800,00 €.", f: "F8_facture" }]] }),
      offre: (x) => ({ title: "Offre d'indemnisation de l'assureur", kind: "courrier", entete: ["Mutuelle Atlantique Assurances · Service des sinistres corporels", "Loi n° 85-677 du 5 juillet 1985"], paras: [
        ["Madame, Monsieur,"],
        ["En notre qualité d'assureur du véhicule de M. Vasseur, nous vous présentons nos condoléances."],
        [{ t: "Il résulte des déclarations de notre assuré que votre fils a franchi le feu alors qu'il était rouge, sans casque. Ces fautes justifient un partage de responsabilité par moitié.", f: "F8_offre_partage" }],
        [{ t: `Nous vous proposons, pour l'ensemble de la famille et pour solde de tout compte, la somme de ${CR.money(OFFRE)}.`, f: "F8_offre" }],
        ["Nous vous remercions de nous retourner la quittance signée."],
      ], signed: "Le gestionnaire du dossier" }),
      video: () => ({ title: "Exploitation des images de vidéoprotection", kind: "pv", entete: ["Cabinet de Mme Ferraud · Commission rogatoire · Cote D31"], paras: [
        [{ t: "Le feu du cycliste passe au rouge une seconde avant que la roue avant franchisse la ligne d'arrêt.", f: "F8_video_feu" }],
        [{ t: "Le véhicule Peugeot 5008 aborde le carrefour à une vitesse estimée à 62 km/h, pour une vitesse limitée à 30 km/h.", f: "F8_vitesse" }],
        ["Le conducteur ne freine qu'au moment du choc."],
      ] }),
      expertise: (x) => ({ title: "Rapport d'expertise accidentologique (conclusions)", kind: "pv", entete: ["Expert près la cour d'appel de Paris · Cote D38"], paras: [
        [{ t: `Vitesse du véhicule au moment du choc : ${x.cs.vars.videoOk ? "62 km/h, d'après les images" : "entre 55 et 65 km/h, d'après les déformations"}.`, f: "F8_vitesse" }],
        [{ t: "À 30 km/h, la distance d'arrêt était d'environ 13 mètres : le véhicule se serait arrêté avant le point de choc. À cette vitesse, la collision était évitable.", f: "F8_causal" }],
      ] }),
      temoin: () => ({ title: "Procès-verbal d'audition de M. Diakité, témoin", kind: "pv", entete: ["Commission rogatoire · Cote D33"], paras: [[{ t: "« Le vélo est passé à l'orange, peut-être au tout début du rouge. La voiture arrivait très vite, elle n'a pas ralenti. »", f: "F8_temoin_pv" }]] }),
      tox: () => ({ title: "Rapport d'analyse toxicologique", kind: "pv", entete: ["Laboratoire de toxicologie · Cote D35"], paras: [[{ t: "Prélèvement sanguin de M. Grégory Vasseur : présence de THC à 3,1 ng/ml, compatible avec un usage récent.", f: "F8_tox" }]] }),
    },
    docTitles: { pv_constat: "Constatations (D3)", pv_depistage: "Dépistage et prélèvement (D5)", pv_vasseur: "Audition de M. Vasseur (D9)", facture: "Facture des obsèques", offre: "Offre de l'assureur", video: "Images de vidéoprotection (D31)", expertise: "Expertise accidentologique (D38)", temoin: "Audition du témoin (D33)", tox: "Analyse toxicologique (D35)" },
    tpls: {
      constitution_ji: (api) => ({
        title: "Constitution de partie civile devant le juge d'instruction", kind: "courrier", time: 40, dirLabel: "Envoyée",
        to: "Mme Ondine Ferraud, juge d'instruction, tribunal judiciaire de Paris",
        slots: { voie: CR.choiceSlot("La voie", [
          { t: "Une information étant ouverte, M. et Mme Fournier déclarent se constituer partie civile, en leur nom personnel et au nom de leur fils mineur Léo, par la présente lettre (art. 87).", ok: true },
          { t: "M. et Mme Fournier déposent plainte avec constitution de partie civile entre les mains du doyen des juges d'instruction (art. 85).", ok: false, defect: "voie:doyen" },
        ]) },
        body: [["Madame la juge,"], ["Je vous informe que j'assiste M. Patrick Fournier et Mme Sylvie Fournier, parents de Bastien Fournier, décédé le ", CR.fmtDate(api.cs.proc.faitsDay, "long"), " à la suite de l'accident survenu boulevard de Magenta. ", { s: "voie" }], ["Je vous serais reconnaissant de me faire connaître les actes de la procédure."]],
      }),
      reponse_assureur: (api) => ({
        title: "Réponse à l'offre de l'assureur", kind: "courrier", time: 40, dirLabel: "Envoyée",
        to: "Mutuelle Atlantique Assurances, service des sinistres corporels",
        slots: { position: CR.choiceSlot("La position", [
          { t: "Bastien n'était pas conducteur d'un véhicule terrestre à moteur : seule une faute inexcusable, cause exclusive de l'accident, pourrait lui être opposée (loi du 5 juillet 1985, art. 3). Franchir un feu ne l'est pas. Nous refusons tout partage et vous demandons une offre intégrale.", ok: true, v: "art3" },
          { t: "Bastien n'a commis aucune faute : nous refusons votre offre.", ok: false, v: "aucune", defect: "position:fait" },
          { t: "Mes clients acceptent votre offre et vous retournent la quittance signée.", ok: false, v: "accepte", defect: "position:accepte" },
        ]) },
        checks: [{ id: "points", label: "Les autres points", heading: "Nous ajoutons :", options: [
          { id: "casque", t: "Le port du casque n'est obligatoire à vélo que pour les enfants de moins de douze ans : son absence n'est pas une faute.", ok: null, needs: "F8_casque" },
          { id: "ricochet", t: "Le préjudice des proches est réparé dans les mêmes limites que celui de la victime directe (art. 6) : aucun partage ne peut leur être opposé.", ok: null, needs: "L85_3" },
          { id: "vitesse", t: "Votre assuré roulait à plus du double de la vitesse autorisée.", ok: null, needs: "F8_vitesse" },
        ] }],
        body: [["Madame, Monsieur,"], ["J'interviens pour M. et Mme Fournier. ", { s: "position" }]],
      }),
    },
    penal: {
      no: ["actes", "copie", "nullite", "requete"],
      actes: [
        { id: "video", t: "La réquisition en urgence des images de vidéoprotection du carrefour et de la caméra de la pharmacie, avant leur effacement.", ok: null, needs: "F8_camera" },
        { id: "expertise", t: "Une expertise accidentologique : vitesse du véhicule, cycle des feux, distance d'arrêt.", ok: null },
        { id: "temoin", t: "L'audition du livreur témoin de l'accident.", ok: null, needs: "F8_temoin" },
        { id: "tox", t: "Le versement au dossier du résultat de l'analyse du prélèvement sanguin de M. Vasseur.", ok: null, needs: "F8_prelevement" },
        { id: "detention", t: "Le placement de M. Vasseur en détention provisoire.", ok: false, defect: "actes:detention" },
      ],
      copie: ["pv_constat", "pv_depistage", "pv_vasseur"],
      chiffrage: { postes: POSTES, art475: 3000 },
    },
    flow: { tasks: PEN.tasks },
    tasks(api, T) {
      const { s, cs } = api;
      const p = cs.proc;
      if (!p.pcConstituee && !cs.vars.constitutionEnvoyee) T({ id: "constitution_ji", label: "Constituer les parents partie civile", sub: "Une information est déjà ouverte.", kind: "draft", time: 40, urgent: true, run: () => ({ scene: "draft", tpl: "constitution_ji" }) });
      if (p.pcConstituee && ["information", "reglement"].includes(p.stade)) {
        if (!CR.drafted(cs, "demande_actes")) T({ id: "actes", label: "Rédiger une demande d'actes", sub: "Article 82-1 : images, expertise, témoin, analyses.", kind: "draft", time: 60, run: () => ({ scene: "draft", tpl: "demande_actes" }) });
        if (p.copieDemandee == null) T({ id: "copie", label: "Demander la copie du dossier", sub: "Article 114 : la partie civile y a droit par son avocat.", kind: "admin", time: 10, run: () => { PEN.demanderCopie(api); return null; } });
      }
      if (CR.hasDoc(cs, "offre") && !cs.vars.transaction && !CR.drafted(cs, "reponse_assureur")) T({ id: "assureur", label: "Répondre à l'offre de l'assureur", sub: "Mutuelle Atlantique : un partage par moitié.", kind: "draft", time: 40, run: () => ({ scene: "draft", tpl: "reponse_assureur" }) });
      if (cs.vars.transaction && !cs.vars.transaction.denoncee && s.day <= cs.vars.transaction.day + 15) T({ id: "denoncer", label: "Dénoncer la transaction signée par les parents", sub: "Lettre recommandée à l'assureur.", kind: "admin", time: 20, urgent: true, run: () => { api.run("denoncer"); return null; } });
      if (!cs.flags.factures && CR.hasFact(cs, "F8_obseques")) T({ id: "factures", label: "Réunir les justificatifs des préjudices", sub: "Facture des obsèques, livret de famille.", kind: "admin", time: 20, run: () => {
        CR.spend(s, 20, "admin"); cs.flags.factures = s.day;
        if (!CR.hasDoc(cs, "facture")) api.doc("facture", api.def.docTitles.facture);
        CR.toast(s, "Facture des obsèques versée au dossier.", "info"); return null; } });
      PEN.prepPC(api, T, "Préparer M. et Mme Fournier à l'audience");
    },
    on: {
      engaged(api) {
        const { s, cs } = api;
        if (cs.vars.engagedOnce) return;
        cs.vars.engagedOnce = true;
        for (const k of ["pv_constat"]) if (!CR.hasDoc(cs, k)) api.doc(k, api.def.docTitles[k]);
        api.schedule(R.int(s, 7, 12), "_offre");
        api.schedule(60, "_lenteur");
      },
      filed_constitution_ji(api, { res }) {
        const { s, cs } = api;
        cs.vars.constitutionEnvoyee = s.day;
        if (res.defects.includes("voie:doyen")) {
          CR.erreur(s, cs, { id: "constitution_doyen", texte: "Plainte avec constitution adressée au doyen alors qu'une information était déjà ouverte.", sanction: "Le doyen la transmet à la juge saisie : dix jours perdus.", regul: "Une simple lettre au juge d'instruction suffisait (art. 87)." });
          api.schedule(10, "_constituee");
          return;
        }
        api.run("_constituee");
      },
      _constituee(api) {
        const { s, cs } = api;
        cs.proc.pcConstituee = true;
        CR.PROC.event(api, "Constitution de partie civile de M. et Mme Fournier, en leur nom et au nom de Léo (art. 87).");
        api.mail({ from: "Cabinet de Mme Ferraud, juge d'instruction", subject: "Constitution de partie civile — Fournier", kind: "greffe", body: [["Nous avons reçu votre constitution de partie civile. Vos clients ont désormais accès au dossier par votre intermédiaire et peuvent présenter des demandes d'actes (art. 82-1)."]] });
        for (const k of ["pv_depistage", "pv_vasseur"]) if (!CR.hasDoc(cs, k)) api.doc(k, api.def.docTitles[k]);
      },
      _offre(api) {
        const { s, cs } = api;
        api.mail({ from: "Mutuelle Atlantique Assurances", subject: "Offre d'indemnisation — sinistre Fournier", kind: "courrier", doc: "offre", title: "Offre de l'assureur" });
        if (!cs.advice.includes("f_rien_signer") && R.chance(s, 0.45)) api.schedule(2, "_signee");
      },
      _signee(api) {
        const { s, cs } = api;
        if (CR.drafted(cs, "reponse_assureur")) return;
        cs.vars.transaction = { day: s.day, montant: OFFRE };
        api.mail({ from: "Sylvie Fournier", subject: "Nous avons signé", kind: "email", important: true, body: [["Maître, l'assureur a rappelé hier. Il disait que l'offre ne serait pas renouvelée. Patrick a signé la quittance. Nous avons bien fait ?"]] });
        CR.erreur(s, cs, { id: "transaction", texte: "Les parents ont signé seuls l'offre réduite de moitié : vous ne leur aviez pas dit de ne rien signer.", sanction: "Une transaction pour solde de tout compte.", regul: "La victime peut dénoncer la transaction par lettre recommandée dans les quinze jours de sa conclusion (art. L. 211-16 du code des assurances)." });
      },
      denoncer(api) {
        const { s, cs } = api;
        CR.spend(s, 20, "admin");
        cs.vars.transaction.denoncee = s.day;
        cs.vars.transaction = null;
        CR.bon(s, cs, { id: "denonciation", texte: "Transaction dénoncée dans les quinze jours (art. L. 211-16 du code des assurances)." });
        api.tl("Transaction dénoncée par lettre recommandée.");
        CR.toast(s, "Lettre recommandée envoyée : la transaction est dénoncée.", "good");
      },
      filed_reponse_assureur(api, { res }) {
        const { s, cs } = api;
        const v = res.filled.position;
        cs.vars.reponseAssureur = v;
        if (v === "accepte") { cs.vars.transaction = { day: s.day, montant: OFFRE, parAvocat: true }; CR.erreur(s, cs, { id: "transaction_avocat", texte: "Vous avez accepté pour les parents une offre réduite de moitié.", sanction: "Transaction pour solde de tout compte.", regul: "Dénonciation possible dans les quinze jours (art. L. 211-16 du code des assurances)." }); return; }
        if (v === "art3") api.schedule(R.int(s, 12, 20), "_nouvelleOffre", { points: res.picks.points || [] });
      },
      _nouvelleOffre(api, { points }) {
        const { s, cs } = api;
        const full = (points || []).includes("ricochet");
        cs.vars.assureurAligne = full;
        api.mail({ from: "Mutuelle Atlantique Assurances", subject: "Sinistre Fournier — votre courrier", kind: "courrier", body: [[full ? "Après examen, nous renonçons à opposer un partage de responsabilité. Nous interviendrons à l'audience pénale sur le montant des préjudices (art. 388-1 CPP)." : "Nous prenons note de votre position. Nous la discuterons devant le tribunal, où nous interviendrons (art. 388-1 CPP)."]] });
      },
      _lenteur(api) { const { cs } = api; if (!CR.drafted(cs, "demande_actes")) api.run("_finInfo"); },
      reponseActes(api, d) {
        const { s, cs } = api;
        const p = d.picks || [];
        const lignes = [];
        const sent = cs.vars.demandeActesDay;
        api.cancel("_lenteur");
        if (p.includes("video")) {
          if (sent <= cs.vars.videoLimite - 2) { cs.vars.videoOk = true; api.doc("video", api.def.docTitles.video); lignes.push("ordonnons la réquisition des images de vidéoprotection, versées au dossier"); }
          else { cs.vars.videoPerdue = true; lignes.push("la réquisition des images de vidéoprotection est sans objet : elles ont été effacées à l'expiration du délai de conservation d'un mois"); }
        }
        if (p.includes("expertise")) { cs.vars.expertise = true; lignes.push("ordonnons une expertise accidentologique"); }
        if (p.includes("temoin")) { cs.vars.temoin = true; api.doc("temoin", api.def.docTitles.temoin); lignes.push("ordonnons l'audition du témoin"); }
        if (p.includes("tox")) { cs.vars.toxConfirmee = true; api.doc("tox", api.def.docTitles.tox); lignes.push("ordonnons le versement du rapport d'analyse toxicologique"); }
        const refus = p.includes("detention");
        api.mail({ from: "Cabinet de Mme Ferraud, juge d'instruction", subject: "Ordonnance sur demande d'actes — Fournier", kind: "greffe", important: true, body: [[lignes.length ? `Faisant droit à la demande, ${lignes.join(" ; ")}.` : "Rejetons la demande d'actes, insuffisamment motivée."], refus ? ["Disons n'y avoir lieu de statuer sur la détention provisoire : la partie civile ne peut pas la demander."] : [""]] });
        if (cs.vars.expertise) api.schedule(R.int(s, 30, 40), "_rapportExpert");
        else api.schedule(R.int(s, 20, 30), "_finInfo");
      },
      _rapportExpert(api) {
        const { s, cs } = api;
        api.doc("expertise", api.def.docTitles.expertise);
        api.mail({ from: "Cabinet de Mme Ferraud, juge d'instruction", subject: "Dépôt du rapport d'expertise", kind: "greffe", body: [["Le rapport d'expertise accidentologique a été déposé et versé au dossier. Les parties disposent d'un délai pour présenter des observations ou une demande de contre-expertise (art. 167)."]] });
        api.schedule(R.int(s, 18, 25), "_finInfo");
      },
      _finInfo(api) {
        const { s, cs } = api;
        if (cs.vars.finInfo) return;
        cs.vars.finInfo = true;
        CR.PROC.stade(api, "reglement", "Avis de fin d'information (art. 175).");
        api.mail({ from: "Cabinet de Mme Ferraud, juge d'instruction", subject: "Avis de fin d'information (art. 175)", kind: "greffe", body: [["L'information me paraît terminée. Les parties disposent des délais de l'article 175 pour présenter leurs observations et leurs demandes."]] });
        api.schedule(R.int(s, 28, 36), "_renvoi");
      },
      _renvoi(api) {
        const { s, cs } = api;
        let day = CR.rollForward(s.day + 35);
        while (CR.dow(day) !== 2 || !CR.isBusinessDay(day)) day++;
        CR.PROC.fixAudience(api, { day, min: 13 * 60 + 30, juridiction: "tc", mode: "ordonnance", convocDay: s.day, president: "pr_aubriot", script: "tc", done: "apresTC", onMiss: "_absent", title: "Audience — 10e chambre correctionnelle", duree: 90 });
        CR.PROC.stade(api, "jugement", `Ordonnance de renvoi devant le tribunal correctionnel du chef ${cs.vars.toxConfirmee ? "d'homicide routier (art. 221-18)" : "d'homicide involontaire (art. 221-6), l'usage de stupéfiants n'étant pas établi par une analyse"}.`);
        api.mail({ from: "Greffe correctionnel", subject: "Ordonnance de renvoi — Vasseur", kind: "greffe", important: true, body: [[`M. Grégory Vasseur est renvoyé devant le tribunal correctionnel. Audience le ${CR.fmtDate(day, "dow")} à 13 h 30, 10e chambre.`], ["Les parties civiles constituées devant le juge d'instruction le sont devant le tribunal ; elles chiffreront leurs demandes."]] });
      },
      _absent(api) {
        const { s, cs } = api;
        CR.erreur(s, cs, { id: "absent", texte: "Vous n'étiez pas à l'audience.", sanction: "Les demandes des parents n'ont pas été soutenues.", regul: "Aucune." });
        CR.closeCase(s, cs, { type: "done", detail: "audience sans l'avocat des parties civiles" });
      },
      decider(api, { st }) {
        const { s, cs } = api;
        const pl = st.played;
        const pieces = {
          choc: { label: "La collision, le défaut de maîtrise et le dépistage salivaire positif", sens: "charge", force: 0.55 },
          version: { label: "Le feu franchi par le cycliste, invoqué par la défense", sens: "decharge", force: pl.has("arg:exclusive") ? 0.04 : 0.16 },
        };
        if (cs.vars.videoOk) pieces.video = { label: "Les images : 62 km/h en zone 30", sens: "charge", force: 0.22 };
        if (cs.vars.expertise) pieces.expertise = { label: "L'expertise : à 30 km/h, la collision était évitable", sens: "charge", force: 0.18 };
        if (cs.vars.temoin) pieces.temoin = { label: "Le témoin : « la voiture arrivait très vite »", sens: "charge", force: 0.06 };
        const routier = !!cs.vars.toxConfirmee;
        const partage = pl.has("arg:partage");
        const trans = cs.vars.transaction;
        const picks = (cs.vars.chiffrage && cs.vars.chiffrage.postes) || [];
        const autres = (cs.vars.chiffrage && cs.vars.chiffrage.autres) || [];
        const postes = POSTES.filter((p) => picks.includes(p.id)).map((p) => Object.assign({}, p, { base: partage ? Math.round(p.base / 2) : p.base, label: p.label + (partage ? " (partage concédé)" : "") }));
        const dec = PEN.juger(api, {
          st, juridiction: "tc", titre: "Jugement correctionnel", prevenuNom: "Grégory Vasseur", pcNom: "M. et Mme Fournier", pcF: false, pcPl: true,
          spec: { seuil: 0.35, pieces },
          qualif: () => routier
            ? { id: "221-18", label: "homicide routier, en l'espèce avec usage de stupéfiants", court: "art. 221-18 CP", encourue: { prison: 84, amende: 100000 }, requis: Object.assign({ complementaires: ["annulation du permis de conduire"] }, cs.vars.requis), motif: "L'analyse du prélèvement sanguin établit l'usage de stupéfiants ; la faute de la victime, à la supposer établie, n'est pas la cause exclusive de l'accident." }
            : { id: "221-6", label: "homicide involontaire", court: "art. 221-6 CP", encourue: { prison: 36, amende: 45000 }, requis: Object.assign({ complementaires: ["suspension du permis de conduire"] }, cs.vars.requis, { ferme: 0, sursis: 18 }), motif: "Le seul dépistage salivaire, sans analyse de confirmation au dossier, ne suffit pas à établir l'usage de stupéfiants : la circonstance de l'article 221-18 n'est pas retenue." },
          personnalite: 1,
          civil: trans ? null : { postes, art475: autres.includes("art475") ? 3000 : 0 },
        });
        if (trans && dec.coupable) {
          dec.questions.push({ q: "Sur l'action civile", r: `Les parties civiles ont transigé avec l'assureur pour ${CR.money(trans.montant)} ; le tribunal leur donne acte de cette transaction.`, motif: "La transaction conclue pour solde de tout compte éteint leur demande d'indemnisation." });
          dec.civil = { lignes: [], total: trans.montant, art475: 0, transaction: true };
          cs.vars.civil = dec.civil;
        }
        if (partage) cs.vars.partageConcede = true;
        return dec;
      },
      apresTC(api, res) {
        const { s, cs } = api;
        CR.closeCase(s, cs, PEN.issue(api, res.decision || {}));
      },
    },
    audiences: {
      tc(api) {
        const { cs } = api;
        return {
          title: "10e chambre correctionnelle", sub: "Tribunal judiciaire de Paris", decor: { scene: "salle" },
          steps: AUD.jugement(api, {
            prevenu: VASSEUR,
            prevention: `Vous êtes prévenu d'avoir, à Paris, le ${CR.fmtDate(cs.proc.faitsDay, "long")}, en conduisant un véhicule terrestre à moteur, involontairement causé la mort de Bastien Fournier${cs.vars.toxConfirmee ? ", avec cette circonstance que vous aviez fait usage de stupéfiants. Article 221-18 du code pénal." : ". Article 221-6 du code pénal."}`,
            exceptionAdverse: "Aucune, madame la présidente.",
            avantFond: [{ who: "sys", t: "(Au premier rang, M. et Mme Fournier. Léo n'est pas venu. Derrière eux, l'avocate de l'assureur, qui intervient à l'audience.)" }],
            instruction: [
              { who: "president", t: "Monsieur Vasseur, expliquez-nous." },
              { who: "prevenu", name: "Grégory Vasseur", t: "Le feu était vert pour moi. Il est passé au rouge. Je n'ai rien pu faire." },
              { if: () => !!cs.vars.videoOk, then: [{ who: "president", t: "Les images vous montrent à 62 km/h. C'est une zone 30, monsieur." }, { who: "prevenu", name: "Grégory Vasseur", t: "Je… je ne regardais pas le compteur." }] },
              { if: () => !!cs.flags.prepClient, then: [{ who: "client", t: "Bastien faisait ce trajet tous les soirs. Il rentrait. C'est tout ce qu'il faisait : il rentrait.", signal: "bon" }], else: [{ who: "client", t: "Vous l'avez tué ! Vous étiez drogué !", fx: { cred: -2 } }] },
            ],
            questions: { prompt: "Questions au prévenu (art. 442-1)", who: "prevenu", name: "Grégory Vasseur", max: 2, options: [
              { id: "q_vitesse", t: "Monsieur Vasseur, vous avez déclaré « trente, quarante maximum ». Que répondez-vous aux 62 km/h de l'expertise ?", need: "F8_vitesse", a: "Je… je l'ai mal évalué.", fx: { play: ["F8_vitesse"] }, signal: "bon" },
              { id: "q_joint", t: "Quand avez-vous fumé pour la dernière fois avant de prendre le volant ?", need: "F8_thc", a: "La veille. Enfin… dans l'après-midi.", fx: { play: ["F8_tox"] }, signal: "bon" },
              { id: "q_freiner", t: "Avez-vous freiné avant le choc ?", need: "F8_video_feu", a: "Je n'ai pas eu le temps.", signal: "neutre" },
            ] },
            pc: { max: 4, args: [
              { id: "exclusive", label: "La faute de la victime n'exonère que si elle est la cause exclusive", say: "Même si Bastien est entré au tout début du rouge, sa faute n'est pas la cause exclusive de sa mort : à 30 km/h, la voiture s'arrêtait avant lui.", cards: ["F8_causal", "F8_vitesse", "F8_temoin_pv"] },
              { id: "loi85", label: "Loi de 1985 : aucun partage contre un cycliste, sauf faute inexcusable", say: "Bastien n'était pas conducteur d'un véhicule à moteur : seule une faute inexcusable, cause exclusive de l'accident, lui serait opposable. Franchir un feu n'en est pas une. Ses proches doivent être indemnisés intégralement.", cards: ["L85_3", "JP_AP_1995"] },
              { id: "stupefiants", label: "L'usage de stupéfiants, établi par l'analyse de sang", say: "L'analyse de sang établit un usage récent de cannabis : c'est l'homicide routier.", cards: ["F8_tox", "CP_221-18"] },
              { id: "affection", label: "Le préjudice d'affection des parents et de Léo", say: "Un fils de dix-neuf ans, un frère de quinze ans qui ne parle plus : je demande la réparation du préjudice d'affection de chacun.", cards: ["F8_frere"] },
              { id: "obseques", label: "Les frais d'obsèques, facture à l'appui", say: "Les frais d'obsèques sont justifiés par la facture : 4 800 euros.", cards: ["F8_facture"] },
              { id: "partage", label: "Admettre une part de responsabilité de Bastien", say: "Mes clients ne contestent pas que Bastien a pu commettre une imprudence en franchissant le feu.", pertinent: () => false },
              { id: "art475", label: "Les frais d'avocat (art. 475-1)", say: "Je demande enfin une somme au titre de l'article 475-1.", cards: ["CPP_475-1"] },
            ] },
            pcApres: [{ who: "adverse", name: "L'avocate de l'assureur", t: cs.vars.assureurAligne ? "L'assureur ne conteste pas le droit à indemnisation intégrale. Il s'en rapporte sur les montants." : "L'assureur maintient que la victime a commis une faute en franchissant le feu rouge et demande un partage par moitié." }],
            requis: { base: { ferme: 12, sursis: 24, complementaires: ["annulation du permis de conduire"] }, avant: ["Un jeune homme est mort parce qu'un conducteur, après avoir fumé, roulait à une vitesse qu'il ne pouvait pas maîtriser."] },
            defenseAdverse: ["Madame la présidente, personne ne conteste la douleur des parents. Mais la victime est entrée dans le carrefour au rouge.", "M. Vasseur n'était pas sous l'emprise de quoi que ce soit au sens où on l'entend. Je demande que le tribunal tienne compte de la faute de la victime."],
            dernierMotAdverse: "Je pense à lui tous les jours. Je suis désolé.",
          }),
        };
      },
    },
    debrief(api, o) {
      const { cs } = api;
      const items = [{ kind: "rule", text: "Loi du 5 juillet 1985 : la victime non conductrice d'un véhicule à moteur — un cycliste, un piéton — n'est privée d'indemnisation que par sa faute inexcusable, cause exclusive de l'accident (art. 3) ; ses proches sont indemnisés dans les mêmes limites (art. 6)." }];
      if (cs.vars.videoPerdue) items.push({ kind: "bad", text: "Les images de vidéoprotection ont été effacées : elles ne sont conservées qu'un mois au plus. La demande d'actes devait partir dans les jours suivant le premier rendez-vous." });
      if (cs.vars.videoOk) items.push({ kind: "good", text: "Les images, demandées à temps, ont révélé la vitesse du véhicule." });
      if (!cs.vars.toxConfirmee) items.push({ kind: "surprise", text: "Sans le résultat de l'analyse de sang au dossier, l'usage de stupéfiants n'était pas établi : la qualification d'homicide routier est tombée." });
      if (cs.vars.partageConcede) items.push({ kind: "bad", text: "Vous avez concédé une part de responsabilité à Bastien : le tribunal vous a pris au mot, alors que la loi de 1985 l'excluait." });
      if (cs.advice.includes("f_feu")) items.push({ kind: "bad", text: "Vous avez dit aux parents qu'un feu grillé les priverait d'indemnisation : c'est faux pour un cycliste, qui n'est pas conducteur d'un véhicule à moteur." });
      if (cs.advice.includes("f_prison")) items.push({ kind: "bad", text: "Vous avez promis une peine : la partie civile ne demande pas de peine, et on ne promet jamais un résultat." });
      return items.concat(cs.vars.debriefJugement || []);
    },
    epilogue(api, o) {
      const c = api.cs.vars.civil;
      if (c && c.transaction) return `Les parents ont touché ${CR.money(c.total)} de l'assureur, la moitié de ce que la loi leur assurait. Ils ont fait poser un vélo blanc au carrefour, attaché au feu.`;
      if (o.type === "indemnise") return "L'assureur a payé. M. et Mme Fournier ont fait poser un vélo blanc au carrefour, attaché au feu. Léo a recommencé à parler, un peu.";
      return "Le jugement n'a rien réparé. Un vélo blanc est attaché au feu du boulevard de Magenta.";
    },
    fiche(api, o) {
      return {
        phrase: "Homicide routier d'un cycliste, information judiciaire, avocat des parents parties civiles.",
        notions: [
          { titre: "L'homicide routier", regle: "La mort causée sans intention par un conducteur, avec au moins une circonstance prévue par le texte (stupéfiants, alcool, etc.) : sept ans ; dix ans avec deux circonstances. Sans circonstance : homicide involontaire.", art: "art. 221-18 et 221-6 CP (loi du 9 juillet 2025)", prog: "dps" },
          { titre: "La victime non conductrice et la loi de 1985", regle: "Le cycliste, le piéton, le passager ne se voient opposer que leur faute inexcusable, cause exclusive de l'accident ; le préjudice des proches suit le même régime.", art: "loi n° 85-677 du 5 juillet 1985, art. 3 et 6", prog: "dps" },
          { titre: "La partie civile dans l'information", regle: "Une information ouverte, la victime se constitue par simple déclaration au juge ; elle peut alors demander des actes et la copie du dossier.", art: "art. 87, 82-1 et 114 CPP", prog: "pp_instruction" },
        ],
        piege: "La faute du cycliste n'efface ni la responsabilité pénale du conducteur, sauf cause exclusive, ni l'indemnisation des proches, sauf faute inexcusable.",
        devenir: api.def.epilogue(api, o),
      };
    },
    corrige() {
      return [
        { probleme: "Quelle qualification ?", regle: "Homicide routier : mort causée sans intention par le conducteur d'un véhicule terrestre à moteur, avec au moins une circonstance (stupéfiants) : sept ans et 100 000 € (art. 221-18 CP, loi du 9 juillet 2025). Sans circonstance : homicide involontaire (art. 221-6).", application: "L'usage de stupéfiants doit être établi par l'analyse du prélèvement ; il faut obtenir son versement au dossier." },
        { probleme: "La faute de la victime ?", regle: "Au pénal, elle n'exonère le prévenu que si elle est la cause exclusive du dommage. Au civil, le cycliste n'est pas conducteur d'un véhicule à moteur : seule sa faute inexcusable, cause exclusive, lui est opposable (loi de 1985, art. 3), et ses proches sont indemnisés dans les mêmes limites (art. 6).", application: "Franchir un feu au tout début du rouge n'est pas une faute inexcusable ; à 30 km/h, la collision était évitable." },
        { probleme: "Que faire tout de suite ?", regle: "Se constituer partie civile par déclaration au juge d'instruction (art. 87), demander des actes (art. 82-1) ; les images de vidéoprotection ne sont conservées qu'un mois au plus.", application: "Constitution et demande d'actes dans la semaine ; refuser l'offre de partage de l'assureur, qui peut être dénoncée dans les quinze jours si elle a été signée (art. L. 211-16 C. assur.)." },
      ];
    },
  });
})();
