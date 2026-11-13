/* La Permanence — catalogue : atteintes aux biens et stupéfiants.
   Peines et articles rédigés hors ligne, à revérifier sur Légifrance. */
(function () {
  const CR = window.CR;
  const CAT = CR.CAT;
  const { pk, int, ch } = CAT;
  const eur = (n) => CR.money(n);
  const MAGASINS = ["Franprix", "Monoprix", "Carrefour City", "Lidl", "Sephora", "Fnac", "Darty", "Decathlon", "Picard", "Tati"];
  const TELS = [["un iPhone 15", 950], ["un iPhone 14 Pro", 1100], ["un Samsung Galaxy S24", 900], ["un Xiaomi Redmi Note", 260], ["un Google Pixel 8", 700]];
  const BIJOUX = [["une chaîne en or", 1400], ["un collier en or avec une médaille", 900], ["une montre Rolex Datejust", 9500], ["un bracelet en or", 1200]];

  // =================================================================== VOL (simple et aggravé)
  CAT.def("vol", {
    fam: "biens", nom: "Vol", gravite: 0.3, op: true,
    textes: ["CP_311-1", "CP_311-3", "CP_311-4", "CP_311-5", "CP_311-6", "CP_132-16"],
    elements: { legal: "Art. 311-1 CP (définition), 311-3 (peine), 311-4 à 311-6 (aggravations).", materiel: "La soustraction de la chose d'autrui : l'appréhension, même brève, contre la volonté du propriétaire.", moral: "L'intention de se comporter, même momentanément, en propriétaire." },
    victimeDe: (f) => (["magasin", "vestiaire"].includes(f.sc) ? "commerce" : "personne"),
    mesures: { gav: 0.78, al: 0.15, convocation: 0.07 }, flagrance: 0.75,
    voies: { classement: 0.08, alternative: 0.22, copj: 0.35, ci: 0.25, crpc: 0.12, op: 0.12 },
    preuves: { constat: 0.6, temoin: 0.4, video: 0.6, saisie: 0.55, aveux: 0.4, telephonie: 0.1, adn: 0.04 },
    camera: 0.35, irr: ["controle_identite", "heures", "fouille"],
    // scènes de rue (un contrôle d'identité y précède parfois l'interpellation) et part de flagrance selon la scène
    controle: (f) => ["transport", "tire", "arrachage", "vehicule"].includes(f.sc),
    flagranceDe: (f) => ({ magasin: 0.95, transport: 0.9, tire: 0.8, arrachage: 0.6, vehicule: 0.85, vestiaire: 0.1, vulnerable: 0.05 })[f.sc],
    metierAuteur: (f, A) => (f.sc === "vestiaire" ? (A.g === "f" ? "vendeuse" : "vendeur") : null),
    tirer(r) {
      const sc = pk(r, ["magasin", "magasin", "transport", "tire", "arrachage", "arrachage", "vehicule", "vestiaire", "vulnerable"]);
      const res = { reunion: 0.25, dissimulation: 0.04 };
      if (sc === "transport") res.transport = 0.95;
      if (sc === "vulnerable") res.vulnerable = 0.95;
      if (sc === "arrachage") res.violence0 = 0.55;
      let agg = CAT.tirerAgg(r, res, 2);
      let itt = 0;
      if (sc === "arrachage" && !agg.includes("violence0") && ch(r, 0.7)) itt = CAT.itt(r, 0, 0.85, 0.15, 20);
      const [objet, valeur] = {
        magasin: pk(r, [["trois paires d'écouteurs sans fil", 540], ["des bouteilles de whisky", 160], ["des produits de beauté", 210], ["deux manettes de console", 140], ["une trottinette électrique", 480], ["des barquettes de viande", 85]]),
        transport: pk(r, TELS), tire: pk(r, [["un portefeuille contenant 180 euros et des cartes", 260], ["un téléphone", 700], ["un sac à main", 650]]),
        arrachage: pk(r, TELS.concat(BIJOUX)), vehicule: pk(r, [["un scooter Yamaha TMax", 9000], ["un scooter Piaggio", 3200], ["un vélo électrique", 2100]]),
        vestiaire: pk(r, [["la caisse du soir, 640 euros en espèces", 640], ["du matériel de chantier", 2800], ["des téléphones de la boutique", 1900]]),
        vulnerable: pk(r, [["un porte-monnaie et une carte bancaire", 340], ["des bijoux de famille", 3800]]),
      }[sc];
      return { sc, agg, itt, objet, valeur };
    },
    qual(f) {
      const c = f.agg.filter((a) => a !== "violence0");
      if (f.itt > 8) return CAT.delit(120, 150000, "art. 311-6 CP", "vol précédé, accompagné ou suivi de violences ayant entraîné une incapacité totale de travail de plus de huit jours", { textes: ["CP_311-6"], aggs: f.agg });
      if (f.itt > 0) return c.length
        ? CAT.delit(120, 150000, "art. 311-5 CP", `vol accompagné de violences ayant entraîné une incapacité totale de travail n'excédant pas huit jours, ${c.map(CAT.aggLabel).join(", ")}`, { textes: ["CP_311-5"], aggs: f.agg })
        : CAT.delit(84, 100000, "art. 311-5 CP", "vol accompagné de violences ayant entraîné une incapacité totale de travail n'excédant pas huit jours", { textes: ["CP_311-5"], aggs: f.agg });
      const n = f.agg.length;
      if (!n) return CAT.delit(36, 45000, "art. 311-1 et 311-3 CP", "vol", { textes: ["CP_311-1", "CP_311-3"] });
      const [p, a] = CAT.palier([[36, 45000], [60, 75000], [84, 100000], [120, 150000]], n);
      return CAT.delit(p, a, "art. 311-1 et 311-4 CP", `vol ${f.agg.map(CAT.aggLabel).join(", ")}`, { textes: ["CP_311-1", "CP_311-4"] });
    },
    requalif(r, f) {
      if (f.agg.includes("reunion") && ch(r, 0.35)) return { f2: Object.assign({}, f, { agg: f.agg.filter((a) => a !== "reunion") }), quoi: "reunion" };
      if (f.agg.includes("violence0") && ch(r, 0.4)) return { f2: Object.assign({}, f, { agg: f.agg.filter((a) => a !== "violence0") }), quoi: "violence" };
      return null;
    },
    comp: () => [],
    recit(X, f) {
      const { A, V, r } = X;
      const mag = pk(r, MAGASINS);
      const reu = f.agg.includes("reunion");
      const comp = pk(r, ["un mineur resté non identifié", "un complice qui a pris la fuite", "un second homme, interpellé plus tard"]);
      const R = {
        magasin: { titre: `le vol au ${mag}`, lieu: `dans le magasin ${mag}, ${X.rue}`, constat: [`Requis par l'agent de sécurité du magasin ${mag}, ${X.rue}.`, `${X.n(A)} a été retenu${X.e(A)} à la sortie des caisses, après le portique, avec dans son sac à dos ${f.objet} (valeur : ${eur(f.valeur)}), sans ticket de caisse.`], plainte: [`Je suis ${X.civ(V) === "Mme" ? "la directrice" : "le directeur"} du magasin. L'agent de sécurité l'a vu${X.e(A)} sur les écrans retirer les antivols et mettre ${f.objet} dans son sac.`, "Nous déposons plainte au nom de la société. Nous avons des vols tous les jours."] },
        transport: { titre: "le téléphone volé dans le métro", lieu: (() => { const st = pk(r, ["Barbès-Rochechouart", "Château-Rouge", "Marcadet-Poissonniers", "Simplon"]); return `dans la rame de la ligne 4, entre les stations ${st} et Gare du Nord`; })(), constat: [`Patrouille de la brigade des réseaux franciliens. Observons ${X.n(A)} se placer derrière ${X.nf(V)} au moment de la fermeture des portes, puis glisser la main dans la poche de son manteau.`, `Interpellation sur le quai ; découverte, dans la poche de sa veste, de ${f.objet}, que ${X.nf(V)} reconnaît comme sien.`], plainte: [`J'étais debout près des portes, mon téléphone dans la poche du manteau. Je n'ai rien senti. Ce sont les policiers en civil qui me l'ont rendu.`] },
        tire: { titre: "le vol à la tire de la butte", lieu: "rue Steinkerque, au pied de la butte Montmartre", constat: [`Sur réquisition de ${X.nf(V)}, touriste, qui désigne un groupe s'éloignant vers le boulevard.`, `${X.n(A)} est interpellé${X.e(A)} en possession de ${f.objet}.`], plainte: [`On m'a bousculé${X.e(V)}, deux personnes m'ont demandé de signer une pétition. Après, mon sac était ouvert.`] },
        arrachage: { titre: "l'arrachage dans la rue", lieu: `${X.rue}, à hauteur du numéro ${int(r, 2, 80)}`, constat: [`Requis pour un vol avec violence ${X.rue}. ${X.nf(V)} indique s'être fait arracher ${f.objet} par un individu ${pk(r, ["à scooter", "à pied, qui s'est enfui vers le métro", "en trottinette"])}.`, f.itt ? `${X.Il(V)} présente des dermabrasions du cou et une douleur à l'épaule.` : `${X.Il(V)} est choqué${X.e(V)}, sans blessure apparente.`], plainte: [`Je marchais en téléphonant. Quelqu'un m'a ${f.objet.includes("chaîne") || f.objet.includes("collier") ? "arraché ma chaîne par derrière, ça m'a brûlé le cou" : "arraché le téléphone des mains"}.${f.itt || f.agg.includes("violence0") ? ` On m'a poussé${X.e(V)}, je suis tombé${X.e(V)} sur le trottoir.` : ""}${f.itt ? ` Le médecin a fixé l'ITT à ${f.itt} jours.` : ""}`] },
        vehicule: { titre: "le scooter volé", lieu: `${X.rue}, sur une place deux-roues`, constat: [`Signalement d'un vol de deux-roues en cours. Sur place, ${X.n(A)} est trouvé${X.e(A)} accroupi${X.e(A)} près de ${f.objet}, le neiman forcé, un tournevis à la main.`], plainte: [`Mon ${f.objet.replace(/^un /, "")} était garé en bas de chez moi, avec antivol. C'est mon outil de travail.`] },
        vestiaire: { titre: "le vol chez l'employeur", lieu: `dans les locaux de l'entreprise, ${X.rue}`, constat: [`Plainte de l'employeur : disparition de ${f.objet} ; la vidéosurveillance interne montre ${X.n(A)}, salarié${X.e(A)}, dans le bureau à l'heure des faits.`], plainte: [`${X.Il(A)} travaillait chez nous depuis huit mois. Le soir des faits, ${X.il(A)} a fermé seul${X.e(A)}. Le lendemain, il manquait ${f.objet}.`] },
        vulnerable: { titre: "le vol au préjudice d'une personne âgée", lieu: `au domicile de ${X.nf(V)}, ${X.rue}`, constat: [`Plainte de ${X.nf(V)}, ${V.age} ans. ${X.n(A)}, qui l'aidait à porter ses courses depuis des semaines, est soupçonné${X.e(A)} de lui avoir dérobé ${f.objet}.`], plainte: [`${X.Il(A)} était gentil${X.e(A)}, ${X.il(A)} montait mes courses. Un jour, ${f.objet} ${/ et /.test(f.objet) ? "ont" : "a"} disparu. ${X.Il(A)} était seul${X.e(A)} dans la cuisine avec mon sac.`] },
      }[f.sc];
      return {
        titre: R.titre, lieu: R.lieu, objet: f.objet, valeur: f.valeur, itt: f.itt,
        resume: `${X.n(A)} est mis${X.e(A)} en cause pour le vol de ${f.objet} (${eur(f.valeur)})${reu ? ", avec " + comp : ""}.`,
        constat: R.constat.concat(reu ? [`${CR.cap(comp)} accompagnait l'auteur${f.sc === "magasin" ? " et faisait le guet près des caisses" : ""}.`] : []),
        plainte: R.plainte,
        temoin: [pk(r, ["J'ai vu toute la scène.", "J'étais juste à côté."]) + " " + (reu ? "Ils étaient deux, l'un a pris, l'autre surveillait." : `${X.Il(A)} était seul${X.e(A)}. ${X.Il(A)} a pris et ${X.il(A)} est parti${X.e(A)} en courant.`)],
        saisie: f.sc === "vehicule" ? "un tournevis plat, une pince coupante" : f.objet,
        version: { nie: "J'ai rien volé. Je l'ai trouvé par terre, je voulais le rapporter.", minimise: f.sc === "magasin" ? "J'avais plus un rond. J'ai pris, j'ai pas réfléchi. J'allais payer une partie." : "Je l'ai ramassé. Je sais pas pourquoi j'ai fait ça.", reconnait: "Oui, je l'ai volé. Je regrette. Je peux rembourser." },
        audition: [
          { q: `Reconnaissez-vous avoir pris ${f.objet} ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je reconnais l'avoir eu sur moi." } },
          { q: reu ? "Qui était avec vous ?" : "Ce n'est pas la première fois, n'est-ce pas ?", a: { silence: "…", expliquer: reu ? "Je ne donnerai pas de nom." : A.casier ? `Non. Il y a eu une fois, ${X.ancien(A)}.` : "Si, c'est la première fois. Je n'ai jamais eu affaire à la police.", partiel: "Je n'ai rien à ajouter." } },
        ],
        prevention: `frauduleusement soustrait ${f.objet}${/euros/.test(f.objet) ? "" : `, d'une valeur de ${eur(f.valeur)}`}, au préjudice de ${f.sc === "magasin" ? "la société " + mag : f.sc === "vestiaire" ? "son employeur" : X.nf(V)}`,
        prejudice: [{ id: "materiel", label: `Valeur de ${f.objet} (non restitué)`, demande: f.valeur, base: f.valeur, piece: "facture" }, { id: "moral", label: "Préjudice moral", demande: f.itt ? 1500 : 500, base: f.itt ? 900 : 200 }],
        qA: [{ q: "Pourquoi avez-vous fait ça ?", a: [pk(r, [{ salarie: "Mon salaire ne suffisait plus. Le loyer, les dettes.", independant: "Mon activité ne marche plus. Je n'y arrivais plus.", etudiant: "Ma bourse n'était pas tombée. J'avais rien.", retraite: "Ma retraite ne suffit plus. À la fin du mois, il n'y a plus rien.", rsa: "Avec le RSA, à la fin du mois, il n'y a plus rien.", scolaire: "Je voulais l'argent. C'est tout." }[X.situ(A)] || "J'ai perdu mon travail il y a deux mois.", "J'avais pas d'argent pour manger.", "C'était bête. Un pari."])] }],
        qV: [{ q: "Vous avez récupéré votre bien ?", a: [f.sc === "transport" ? "Oui, le soir même." : "Non. Jamais."] }],
      };
    },
  });

  // =================================================================== CAMBRIOLAGE
  CAT.def("cambriolage", {
    fam: "biens", nom: "Cambriolage", gravite: 0.5,
    textes: ["CP_311-1", "CP_311-4"],
    elements: { legal: "Art. 311-1 et 311-4 CP (local d'habitation ou d'entrepôt, pénétration par ruse, effraction ou escalade).", materiel: "La soustraction, dans un local d'habitation ou d'entrepôt, après une pénétration par effraction, ruse ou escalade.", moral: "L'intention frauduleuse." },
    victimeDe: (f) => (f.sc === "local" ? "commerce" : "personne"),
    mesures: { gav: 0.95, al: 0.05, convocation: 0 }, flagrance: 0.35,
    voies: { classement: 0.04, alternative: 0.04, copj: 0.3, ci: 0.42, crpc: 0.2 },
    preuves: { adn: 0.5, telephonie: 0.5, video: 0.45, saisie: 0.5, temoin: 0.3, aveux: 0.35, constat: 0.35 },
    camera: 0.3, irr: ["perq_assentiment", "perq_nuit", "heures", "requisition"],
    tirer(r) { const sc = pk(r, ["appartement", "appartement", "cave", "local"]); const agg = CAT.tirerAgg(r, { reunion: 0.4, dissimulation: 0.08 }, 3, [sc === "local" ? "entrepot" : "local_habitation"]); return { sc, agg, valeur: int(r, 8, 140) * 100, mode: pk(r, ["pied-de-biche", "carte de fidélité glissée", "fenêtre forcée", "porte enfoncée", "cylindre arraché"]) }; },
    qual(f) { const [p, a] = CAT.palier([[36, 45000], [60, 75000], [84, 100000], [120, 150000]], f.agg.length); return CAT.delit(p, a, "art. 311-1 et 311-4 CP", `vol ${f.agg.map(CAT.aggLabel).join(", ")}`); },
    requalif(r, f) { return f.agg.includes("reunion") && ch(r, 0.3) ? { f2: Object.assign({}, f, { agg: f.agg.filter((a) => a !== "reunion") }), quoi: "reunion" } : null; },
    recit(X, f) {
      const { A, V, r } = X;
      const butin = pk(r, ["un ordinateur portable, une console et des bijoux", "des bijoux et 600 euros en espèces", "deux vélos et des outils", "une télévision et une montre", "du matériel informatique"]);
      return {
        titre: f.sc === "local" ? "le cambriolage de la boutique" : f.sc === "cave" ? "le cambriolage des caves" : "le cambriolage de l'appartement",
        lieu: f.sc === "local" ? `dans la réserve d'une boutique, ${X.rue}` : `${f.sc === "cave" ? "dans les caves de l'immeuble du" : "dans l'appartement du"} ${int(r, 2, 90)}, ${X.rue}`, valeur: f.valeur,
        resume: `Cambriolage (${f.mode}) ; préjudice de ${eur(f.valeur)} ; ${X.n(A)} est identifié${X.e(A)} ${pk(r, ["par une trace ADN", "par le bornage de son téléphone", "par la vidéo du hall"])}${f.agg.includes("reunion") ? ", avec un complice" : ""}.`,
        constat: [`Constatations au domicile de ${X.nf(V)} : effraction (${f.mode}), pièces fouillées, tiroirs renversés.`, `Prélèvements effectués par le service de police technique et scientifique : une trace papillaire sur le chambranle, un mégot sur le palier.`],
        plainte: [`En rentrant ${X.travaille(V) ? "du travail" : "chez moi"}, la porte était entrouverte. Ils ont pris ${butin}. Préjudice estimé à ${eur(f.valeur)}.`, X.enfants(V) ? (V.enfants > 1 ? "Les enfants ne veulent plus dormir dans leur chambre." : "Ma fille ne veut plus dormir dans sa chambre.") : "Je n'arrive plus à dormir chez moi."],
        temoin: [`J'ai vu ${f.agg.includes("reunion") ? "deux jeunes" : "un jeune"} descendre l'escalier avec des sacs, vers ${pk(r, ["14 heures", "11 heures", "16 h 30"])}. ${pk(r, ["Capuche sur la tête.", "Il m'a dit bonjour.", "Je n'ai pas vu les visages."])}`],
        saisie: butin.split(",")[0],
        version: { nie: "J'y suis jamais allé. Mon ADN, c'est que j'ai fumé une clope dans le quartier.", minimise: "J'ai fait le guet, c'est tout. Je suis pas entré.", reconnait: "Oui, j'y étais. On avait besoin d'argent. Je regrette." },
        audition: [{ q: "Votre ADN a été retrouvé sur place. Comment l'expliquez-vous ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je suis passé dans l'immeuble, c'est possible." } }, { q: "Où étiez-vous l'après-midi des faits ?", a: { silence: "…", expliquer: pk(r, ["Chez ma copine.", "Au foot, avec des potes.", "Je sais plus."]), partiel: "Je ne sais plus." } }],
        prevention: `frauduleusement soustrait ${butin}, d'une valeur de ${eur(f.valeur)}, au préjudice de ${X.nf(V)}`,
        prejudice: [{ id: "materiel", label: "Biens volés non retrouvés (factures)", demande: f.valeur, base: Math.round(f.valeur * 0.85), piece: "facture" }, { id: "porte", label: "Réparation de la porte", demande: 900, base: 900, piece: "devis" }, { id: "moral", label: "Préjudice moral (l'intimité violée)", demande: 1500, base: 800 }],
      };
    },
  });

  // =================================================================== RECEL
  CAT.def("recel", {
    fam: "biens", nom: "Recel", gravite: 0.35, op: true,
    textes: ["CP_321-1", "CP_321-2", "CP_132-16"],
    elements: { legal: "Art. 321-1 CP ; 321-2 (habitude, activité professionnelle).", materiel: "La détention ou la transmission d'une chose provenant d'un crime ou d'un délit, ou le bénéfice de son produit.", moral: "La connaissance de l'origine frauduleuse : elle se déduit souvent des circonstances (prix dérisoire, absence de facture)." },
    victimeDe: () => "personne",
    mesures: { gav: 0.75, al: 0.2, convocation: 0.05 }, flagrance: 0.6,
    voies: { classement: 0.1, alternative: 0.2, copj: 0.35, ci: 0.2, crpc: 0.15, op: 0 },
    preuves: { constat: 0.6, saisie: 0.9, telephonie: 0.3, aveux: 0.45, temoin: 0.15 },
    camera: 0.1, irr: ["controle_identite", "perq_assentiment", "fouille"],
    controle: (f) => f.sc !== "boutique",
    tirer(r) { const habitude = ch(r, 0.15); return { sc: habitude ? "boutique" : pk(r, ["telephone", "scooter", "bijoux"]), agg: habitude ? ["habitude"] : [], prix: int(r, 3, 12) * 10 }; },
    qual: (f) => (f.agg.includes("habitude") ? CAT.delit(120, 750000, "art. 321-1 et 321-2 CP", "recel habituel", { textes: ["CP_321-2"] }) : CAT.delit(60, 375000, "art. 321-1 CP", "recel de vol")),
    recit(X, f) {
      const { A, V, r } = X;
      const [obj, val] = f.sc === "scooter" ? ["un scooter Yamaha TMax", 9000] : f.sc === "bijoux" ? pk(r, BIJOUX) : pk(r, TELS);
      return {
        titre: f.sc === "boutique" ? "le recel de la boutique de téléphones" : `le recel ${f.sc === "scooter" ? "du scooter" : f.sc === "bijoux" ? "des bijoux" : "du téléphone"}`,
        lieu: f.sc === "boutique" ? `dans une boutique de réparation de téléphones, ${X.rue}` : `${X.rue}, ${X.lieu}`, objet: obj, valeur: val,
        resume: `${X.n(A)} est trouvé${X.e(A)} en possession de ${obj}, signalé volé ; ${X.il(A)} dit l'avoir acheté ${f.prix} euros.`,
        constat: [f.sc === "boutique" ? `Perquisition de la boutique de ${X.n(A)} : découverte de 23 téléphones dont 11 signalés volés (IMEI consultés au fichier), sans facture d'achat.` : `Contrôle de ${X.n(A)} ${X.rue}. En sa possession, ${obj}, dont ${f.sc === "telephone" ? "l'IMEI" : "le numéro de série"} correspond à un bien déclaré volé le ${X.date(X.faits - int(r, 1, 9))}.`],
        plainte: [`${X.nf(V)}, propriétaire de ${obj}, déclare qu'on le lui a volé ${pk(r, ["dans le métro", "en terrasse", "dans sa voiture"])} ; valeur : ${eur(val)}.`],
        saisie: obj,
        version: { nie: "Je l'ai acheté normalement. Je savais pas qu'il était volé.", minimise: `Je l'ai acheté ${f.prix} euros à un gars, à Barbès. Bon, je me doutais un peu.`, reconnait: `Oui, je savais. À ${f.prix} euros, forcément.` },
        audition: [{ q: `${f.prix} euros pour ${obj} qui en vaut ${eur(val)} : vous saviez qu'il était volé ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je me suis dit que c'était une bonne affaire." } }],
        prevention: `sciemment recelé ${obj}, qu'il savait provenir d'un vol commis au préjudice de ${X.nf(V)}`,
        prejudice: [{ id: "materiel", label: "Dépréciation du bien restitué", demande: Math.round(val * 0.3), base: Math.round(val * 0.2) }],
      };
    },
  });

  // =================================================================== ESCROQUERIE
  CAT.def("escroquerie", {
    fam: "biens", nom: "Escroquerie", gravite: 0.45,
    textes: ["CP_313-1", "CP_313-2", "CP_132-16"],
    elements: { legal: "Art. 313-1 CP ; 313-2 (circonstances).", materiel: "Un moyen frauduleux — faux nom, fausse qualité, abus d'une qualité vraie ou manœuvres frauduleuses — déterminant une remise ; le simple mensonge ne suffit pas.", moral: "L'intention de tromper." },
    victimeDe: () => "personne",
    mesures: { gav: 0.55, al: 0.4, convocation: 0.05 }, flagrance: 0.1,
    voies: { classement: 0.1, alternative: 0.1, copj: 0.5, ci: 0.12, crpc: 0.18 },
    preuves: { plainte: 1, releve: 0.9, telephonie: 0.6, ecrits: 0.5, aveux: 0.35, temoin: 0.15 },
    camera: 0.05, irr: ["requisition", "al_quitter"],
    tirer(r) {
      const sc = pk(r, ["faux_conseiller", "annonce", "faux_plombier", "faux_policier", "location"]);
      const agg = CAT.tirerAgg(r, { vulnerable: sc === "faux_plombier" || sc === "faux_policier" ? 0.7 : 0.05, qualite_usurpee: sc === "faux_policier" ? 0.9 : 0 }, 2);
      return { sc, agg, montant: sc === "faux_conseiller" ? int(r, 12, 90) * 100 : sc === "faux_policier" ? int(r, 20, 150) * 100 : int(r, 4, 30) * 50 };
    },
    qual(f) { const n = f.agg.length; return CAT.delit(n ? 84 : 60, n ? 750000 : 375000, n ? "art. 313-1 et 313-2 CP" : "art. 313-1 CP", `escroquerie${n ? ", " + f.agg.map(CAT.aggLabel).join(", ") : ""}`, { textes: n ? ["CP_313-1", "CP_313-2"] : ["CP_313-1"] }); },
    requalif(r, f) { return f.agg.includes("vulnerable") && ch(r, 0.3) ? { f2: Object.assign({}, f, { agg: f.agg.filter((a) => a !== "vulnerable") }), quoi: "vulnerable" } : null; },
    recit(X, f) {
      const { A, V, r } = X;
      const m = eur(f.montant);
      const S = {
        faux_conseiller: { titre: `${A.g === "f" ? "la fausse conseillère" : "le faux conseiller"} bancaire`, moyen: `en se présentant par téléphone comme ${A.g === "f" ? "conseillère" : "conseiller"} du service des fraudes de la banque de la victime, numéro usurpé à l'appui (« spoofing »), et en la convainquant de valider des virements « pour sécuriser son compte »`, plainte: `${A.g === "f" ? "Une femme" : "Un homme"} m'a appelé${X.e(V)}, le numéro de ma banque s'affichait. ${X.Il(A)} connaissait mon nom, mes derniers achats. ${X.Il(A)} m'a dit que mon compte était piraté et qu'il fallait valider des opérations « de protection ». J'ai validé trois virements : ${m}.` },
        annonce: { titre: "l'arnaque à l'annonce", moyen: `en publiant sur un site de petites annonces la vente d'une console qu'il ne possédait pas, sous un faux nom, avec de fausses photos, et en obtenant un virement`, plainte: `J'ai vu une annonce pour une console à moitié prix. ${A.g === "f" ? "La vendeuse" : "Le vendeur"} m'a envoyé une photo de sa carte d'identité. J'ai viré ${m}. Plus de nouvelles, le compte a été supprimé.` },
        faux_plombier: { titre: `${A.g === "f" ? "la fausse plombière" : "le faux plombier"}`, moyen: `en se présentant au domicile de la victime comme envoyé${X.e(A)} du syndic pour une « fuite urgente », en simulant une intervention et en exigeant un paiement immédiat sans rapport avec le travail fait`, plainte: `${X.Il(A)} a sonné en disant que le syndic l'envoyait pour une fuite chez le voisin du dessous. ${X.Il(A)} a démonté un joint, ${X.il(A)} a dit que c'était très grave. ${X.Il(A)} m'a fait payer ${m} par carte, tout de suite.` },
        faux_policier: { titre: "le faux policier", moyen: `en se présentant comme ${A.g === "f" ? "policière" : "policier"}, carte factice à l'appui, et en se faisant remettre bijoux et espèces « pour les mettre en sécurité » avant un prétendu cambriolage`, plainte: `Deux policiers en civil sont venus. Ils m'ont montré une carte. Ils ont dit qu'une bande allait cambrioler l'immeuble et qu'il fallait leur confier mes bijoux et mon argent liquide. Ils m'ont fait un reçu. Il y en avait pour ${m}, en tout.` },
        location: { titre: "la fausse location", moyen: `en proposant à la location un appartement dont ${X.il(A)} n'était ni propriétaire ni mandataire, en organisant une fausse visite et en encaissant un dépôt de garantie`, plainte: `J'ai visité un studio avec ${X.lui(A)}, ${X.il(A)} avait les clés. J'ai donné ${m} en liquide pour le dépôt et le premier mois. Le jour de l'emménagement, le vrai propriétaire était là.` },
      }[f.sc];
      return {
        titre: S.titre, lieu: f.sc === "annonce" || f.sc === "faux_conseiller" ? "à distance, par téléphone et sur internet" : `${X.rue}, ${X.lieu}`, montant: f.montant,
        resume: `${X.n(A)} est soupçonné${X.e(A)} d'avoir obtenu ${m} de ${X.nf(V)}, ${S.moyen.split(",")[0]}.`,
        constat: [`Plainte de ${X.nf(V)}${f.agg.includes("vulnerable") ? `, ${V.age} ans` : ""}. Réquisitions bancaires : les fonds ont été versés sur un compte ouvert au nom de ${X.n(A)}, puis retirés en espèces dans les quarante-huit heures.`],
        plainte: [S.plainte, "J'ai honte. Je n'en ai parlé à personne pendant une semaine."],
        ecrits: f.sc === "annonce" ? ["« Bonjour, toujours dispo, envoi rapide »", "« Virement instantané svp, autre acheteur intéressé »"] : f.sc === "faux_conseiller" ? ["SMS : « Votre code de validation : 482 913. Ne le communiquez à personne. »"] : null,
        version: { nie: "Ce compte, on me l'a volé. J'ai prêté ma carte à quelqu'un.", minimise: "J'ai juste prêté mon compte à un ami. On m'a donné 300 euros. Je savais pas d'où venait l'argent.", reconnait: "Oui, c'était moi. Je rembourserai." },
        audition: [{ q: `${m} sont arrivés sur votre compte puis ont été retirés en espèces. Qui a fait ces retraits ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "J'ai fait des retraits, oui." } }],
        prevention: `${S.moyen}, trompé ${X.nf(V)} et ainsi déterminé${X.e(V)} à remettre la somme de ${m}`,
        prejudice: [{ id: "materiel", label: "Sommes escroquées", demande: f.montant, base: f.montant, piece: "releve" }, { id: "moral", label: "Préjudice moral", demande: 1200, base: 600 }],
      };
    },
  });

  // =================================================================== ABUS DE CONFIANCE
  CAT.def("abus_confiance", {
    fam: "biens", nom: "Abus de confiance", gravite: 0.4,
    textes: ["CP_314-1", "CP_132-16"],
    elements: { legal: "Art. 314-1 CP.", materiel: "Le détournement d'un bien remis à titre précaire, à charge de le rendre, de le représenter ou d'en faire un usage déterminé.", moral: "La conscience de détourner, au préjudice d'autrui." },
    victimeDe: (f) => (f.sc === "caisse" ? "commerce" : "personne"),
    mesures: { gav: 0.25, al: 0.7, convocation: 0.05 }, flagrance: 0,
    voies: { classement: 0.12, alternative: 0.2, copj: 0.5, ci: 0, crpc: 0.18 },
    preuves: { plainte: 1, releve: 0.9, ecrits: 0.5, temoin: 0.3, aveux: 0.4, expertise: 0.2 },
    camera: 0, irr: ["al_quitter", "requisition"],
    metierAuteur: (f, A) => ({ caisse: A.g === "f" ? "caissière" : "caissier", acompte: A.g === "f" ? "artisane cuisiniste" : "artisan cuisiniste" })[f.sc] || null,
    tirer(r) { return { sc: pk(r, ["caisse", "association", "acompte", "voiture", "tutelle"]), montant: int(r, 15, 220) * 100, duree: int(r, 2, 30) }; },
    qual: () => CAT.delit(60, 375000, "art. 314-1 CP", "abus de confiance"),
    recit(X, f) {
      const { A, V, r } = X;
      const m = eur(f.montant);
      const S = {
        caisse: { titre: "la caisse du magasin", objet: "les recettes en espèces qui lui étaient confiées pour être déposées à la banque", plainte: `Pendant ${f.duree} mois, les dépôts d'espèces ne correspondaient pas aux tickets Z. Il manque ${m}. C'est ${X.n(A)} qui faisait les dépôts.` },
        association: { titre: `${A.g === "f" ? "la trésorière" : "le trésorier"} de l'association`, objet: `les fonds de l'association dont ${X.il(A)} était ${X.g(A).w("trésorier", "trésorière")}, utilisés à des fins personnelles`, plainte: `Quand le nouveau bureau a repris les comptes, on a découvert des retraits et des achats sans rapport avec l'association : ${m} en ${f.duree} mois.` },
        acompte: { titre: "l'acompte de l'artisan", objet: "un acompte versé pour l'achat de matériaux déterminés, employé à d'autres fins", plainte: `J'ai versé ${m} d'acompte pour la cuisine, pour qu'${X.il(A)} commande les meubles. ${X.Il(A)} n'a jamais rien commandé, et ${X.il(A)} ne répond plus.` },
        voiture: { titre: "la voiture jamais rendue", objet: "un véhicule prêté pour un week-end, conservé et utilisé comme le sien pendant des mois", plainte: `Je lui ai prêté ma voiture pour un déménagement. Ça fait ${f.duree} mois. ${X.Il(A)} ne la rend pas, et j'ai des amendes à mon nom.` },
        tutelle: { titre: "le compte de la grand-mère", objet: `les fonds de sa grand-mère, dont ${X.il(A)} avait la procuration pour payer ses factures`, plainte: `${X.Il(A)} avait la procuration sur le compte de notre grand-mère, en maison de retraite. En ${f.duree} mois, ${X.il(A)} a retiré ${m} pour ${X.lui(A)}.` },
      }[f.sc];
      return {
        titre: S.titre, lieu: X.lieu, montant: f.montant,
        resume: `${X.n(A)} aurait détourné ${S.objet} (${m}).`,
        constat: [`Plainte de ${X.nf(V)} ; relevés bancaires et pièces comptables joints. Réquisition à la banque : mouvements du compte de ${X.n(A)} sur la période.`],
        plainte: [S.plainte],
        version: { nie: "Tout a été utilisé normalement. Ils ont mal fait leurs comptes.", minimise: "J'ai emprunté, je comptais rembourser. Je n'ai rien volé.", reconnait: "J'ai pris l'argent. J'avais des dettes. Je veux rembourser." },
        audition: [{ q: `Il manque ${m}. Où est passé cet argent ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Une partie, je l'ai utilisée. Je comptais rembourser." } }],
        prevention: `détourné, au préjudice de ${X.nf(V)}, ${S.objet}, pour un montant de ${m}`,
        prejudice: [{ id: "materiel", label: "Sommes détournées", demande: f.montant, base: f.montant, piece: "releve" }, { id: "moral", label: "Préjudice moral (la confiance trahie)", demande: 1000, base: 500 }],
      };
    },
  });

  // =================================================================== EXTORSION ET CHANTAGE
  CAT.def("extorsion", {
    fam: "biens", nom: "Extorsion", gravite: 0.6,
    textes: ["CP_312-1", "CP_312-10"],
    elements: { legal: "Art. 312-1 et 312-2 CP ; 312-10 (chantage).", materiel: "Obtenir, par violence, menace de violences ou contrainte, une remise, une signature ou un secret ; pour le chantage, par la menace de révéler des faits portant atteinte à l'honneur.", moral: "La conscience d'obtenir par la contrainte." },
    victimeDe: () => "personne",
    mesures: { gav: 0.85, al: 0.15, convocation: 0 }, flagrance: 0.3,
    voies: { classement: 0.04, alternative: 0.04, copj: 0.32, ci: 0.42, crpc: 0.18 },
    preuves: { plainte: 1, ecrits: 0.5, telephonie: 0.5, temoin: 0.35, video: 0.3, aveux: 0.35 },
    camera: 0.3, irr: ["heures", "requisition"],
    tirer(r) { const sc = pk(r, ["racket", "racket", "dette", "chantage"]); const vul = sc === "racket" && ch(r, 0.2); const itt = sc !== "chantage" && ch(r, 0.3) ? int(r, 1, 8) : 0; return { sc, agg: vul ? ["vulnerable"] : [], itt, montant: sc === "chantage" ? int(r, 5, 40) * 100 : int(r, 2, 30) * 50 }; },
    qual(f) {
      if (f.sc === "chantage") return CAT.delit(60, 75000, "art. 312-10 CP", "chantage", { textes: ["CP_312-10"] });
      const agg = f.itt > 0 || f.agg.length;
      return CAT.delit(agg ? 120 : 84, agg ? 150000 : 100000, agg ? "art. 312-1 et 312-2 CP" : "art. 312-1 CP", `extorsion${f.itt ? " accompagnée de violences ayant entraîné une incapacité totale de travail n'excédant pas huit jours" : ""}${f.agg.length ? ", " + f.agg.map(CAT.aggLabel).join(", ") : ""}`);
    },
    recit(X, f) {
      const { A, V, r } = X;
      const m = eur(f.montant);
      const S = {
        racket: { titre: "le racket", plainte: `${X.Il(A)} m'a coincé${X.e(V)} dans le hall. ${X.Il(A)} m'a dit : « Tu me donnes ton téléphone et ta carte, ou ${X.lex("menace")}. »${f.itt ? ` ${X.Il(A)} m'a mis une claque et un coup de genou.` : ""} J'ai donné, et le code. ${X.Il(A)} a retiré ${m}.` },
        dette: { titre: "la dette réclamée par la force", plainte: `${X.Il(A)} dit que je lui dois de l'argent pour une histoire d'avant. ${X.Il(A)} m'a attendu${X.e(V)} en bas de chez moi avec deux autres. « Tu ramènes ${m} vendredi ou on s'occupe de ta sœur. »${f.itt ? ` ${X.Il(A)} m'a frappé${X.e(V)} au visage.` : ""} J'ai payé une partie.` },
        chantage: { titre: "le chantage aux photos", plainte: `Nous avions une relation. ${X.Il(A)} a des photos de moi, intimes, prises avec mon accord. Après la rupture, ${X.il(A)} m'a écrit : « ${m} ou j'envoie tout à ta famille et à ton patron. » J'ai payé une première fois.` },
      }[f.sc];
      return {
        titre: S.titre, lieu: `${X.rue}, ${X.lieu}`, montant: f.montant, itt: f.itt,
        resume: `${X.n(A)} aurait obtenu de ${X.nf(V)} ${m} par ${f.sc === "chantage" ? "la menace de diffuser des photos intimes" : "la menace et la violence"}.`,
        constat: [`Plainte de ${X.nf(V)} ; ${f.sc === "chantage" ? "messages de menace conservés sur le téléphone de la victime" : "relevé des retraits effectués avec sa carte bancaire après les faits"}.`],
        plainte: [S.plainte, "J'ai peur de le croiser."],
        ecrits: f.sc === "chantage" ? [`« ${m} avant dimanche. Sinon tout le monde verra. »`, "« Tu crois que je bluffe ? Je commence par ta mère. »"] : f.sc === "dette" ? ["« T'as jusqu'à vendredi. »"] : null,
        version: { nie: `${X.Il(V)} m'a donné de l'argent qu'${X.il(V)} me devait. Personne ne l'a menacé${X.e(V)}.`, minimise: "Je lui ai demandé de me rembourser, un peu fort, d'accord.", reconnait: "Je lui ai fait peur pour qu'il paie. C'était mal." },
        audition: [{ q: `${X.nf(V)} dit que vous l'avez menacé${X.e(V)} pour obtenir ${m}. Que répondez-vous ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: `${X.Il(V)} me devait de l'argent.` } }],
        prevention: f.sc === "chantage" ? `obtenu de ${X.nf(V)} la remise de la somme de ${m}, en menaçant de révéler des faits de nature à porter atteinte à son honneur ou à sa considération` : `obtenu de ${X.nf(V)}, par violence, menace de violences ou contrainte, la remise de la somme de ${m}`,
        prejudice: [{ id: "materiel", label: "Sommes extorquées", demande: f.montant, base: f.montant, piece: "releve" }, { id: "moral", label: "Préjudice moral", demande: 2000, base: 1200 }],
      };
    },
  });

  // =================================================================== DESTRUCTIONS ET DÉGRADATIONS
  CAT.def("degradations", {
    fam: "biens", nom: "Destructions et dégradations", gravite: 0.25, op: true, recidive5: true,
    textes: ["CP_322-1", "CP_322-3", "CP_R635-1"],
    elements: { legal: "Art. 322-1 et 322-3 CP ; R. 635-1 pour le dommage léger.", materiel: "La destruction, dégradation ou détérioration d'un bien d'autrui ; la gravité du dommage sépare le délit de la contravention.", moral: "La volonté de dégrader (la dégradation involontaire n'est punie qu'en cas d'incendie ou d'explosion)." },
    victimeDe: (f) => (f.sc === "vitrine" || f.sc === "tag" ? "commerce" : "personne"),
    mesures: { gav: 0.7, al: 0.25, convocation: 0.05 }, flagrance: 0.7,
    voies: { classement: 0.1, alternative: 0.35, copj: 0.3, ci: 0.08, crpc: 0.1, op: 0.07 },
    preuves: { constat: 0.7, temoin: 0.45, video: 0.45, aveux: 0.4, plainte: 1 },
    camera: 0.4, irr: ["controle_identite"],
    controle: (f) => f.sc === "tag",
    tirer(r) {
      const sc = pk(r, ["voiture", "vitrine", "tag", "porte", "scooter"]);
      const leger = sc === "tag" ? ch(r, 0.7) : ch(r, 0.25);
      return { sc, leger, tag: sc === "tag", agg: leger ? [] : CAT.tirerAgg(r, { reunion: 0.25, dissimulation: 0.05 }, 1), montant: leger ? int(r, 1, 4) * 50 : int(r, 6, 60) * 100 };
    },
    qual(f) {
      if (f.leger && f.tag) return CAT.delit(0, 3750, "art. 322-1, al. 2 CP", "inscriptions sans autorisation sur un bien d'autrui, dont il n'est résulté qu'un dommage léger");
      if (f.leger) return CAT.contrav(5, "art. R. 635-1 CP", "destruction, dégradation ou détérioration volontaire d'un bien appartenant à autrui dont il n'est résulté qu'un dommage léger", { textes: ["CP_R635-1"] });
      return f.agg.length ? CAT.delit(60, 75000, "art. 322-1 et 322-3 CP", `dégradation ou détérioration d'un bien appartenant à autrui, ${f.agg.map(CAT.aggLabel).join(", ")}`, { textes: ["CP_322-1", "CP_322-3"] }) : CAT.delit(24, 30000, "art. 322-1 CP", "dégradation ou détérioration d'un bien appartenant à autrui", { textes: ["CP_322-1"] });
    },
    requalif(r, f) { return !f.leger && f.montant <= 900 && ch(r, 0.5) ? { f2: Object.assign({}, f, { leger: true, agg: [] }), quoi: "leger" } : null; },
    comp: (q) => (q.nature === "delit" && q.prison === 0 ? ["travail d'intérêt général de quarante heures"] : []),
    recit(X, f) {
      const { A, V, r } = X;
      const S = {
        voiture: { titre: "la voiture rayée", moi: "ma voiture", objet: `le véhicule ${pk(r, ["Peugeot 308", "Renault Clio", "Tesla Model 3", "Volkswagen Golf"])} de ${X.nf(V)}`, quoi: f.leger ? "une rayure d'une dizaine de centimètres sur la portière" : "les quatre pneus crevés, une portière rayée sur toute la longueur, le rétroviseur arraché" },
        vitrine: { titre: "la vitrine brisée", moi: "la vitrine de mon commerce", objet: `la vitrine du commerce ${pk(r, ["Optique Clignancourt", "Le Fournil de Marcadet", "Phone House Barbès", "la pharmacie Ordener"])}`, quoi: f.leger ? "une fissure dans le coin inférieur de la vitre" : "la vitrine entièrement brisée à coups de pied" },
        tag: { titre: "les tags", moi: "la façade et le rideau de ma boutique", objet: "la façade de l'immeuble et le rideau métallique d'une boutique", quoi: f.leger ? "un tag d'un mètre au marqueur" : "une fresque de six mètres à la bombe, sur pierre de taille" },
        porte: { titre: "la porte de l'ex", moi: "ma porte", objet: `la porte palière de ${X.nf(V)}`, quoi: f.leger ? "des traces de coups sur la peinture" : "la porte enfoncée, la serrure arrachée" },
        scooter: { titre: "le scooter du voisin", moi: "mon scooter", objet: `le scooter de ${X.nf(V)}`, quoi: f.leger ? "le carénage rayé" : "le carénage cassé à coups de barre, le compteur brisé" },
      }[f.sc];
      return {
        titre: S.titre, lieu: `${X.rue}, ${X.lieu}`, montant: f.montant,
        resume: `${X.n(A)} aurait dégradé ${S.objet} : ${S.quoi}. Dommage : ${eur(f.montant)}.`,
        constat: [`Constatons, sur ${S.objet} : ${S.quoi}.`, `${X.n(A)} est ${pk(r, ["interpellé à proximité", "désigné par un témoin", "identifié par la vidéo"])}${f.tag ? ", les mains couvertes de peinture, une bombe dans son sac" : ""}.`],
        plainte: [`On a abîmé ${S.moi} : ${S.quoi}. Le devis est de ${eur(f.montant)}.`],
        temoin: [`J'ai vu ${f.agg.includes("reunion") ? "deux personnes" : "quelqu'un"} ${f.tag ? "peindre sur le mur" : "taper dessus"}, vers ${pk(r, ["2 heures", "23 heures", "4 heures du matin"])}.`],
        version: { nie: "C'est pas moi. J'étais juste là.", minimise: `J'ai donné un coup de pied, j'étais énervé${X.e(A)}. Je pensais pas que ça casserait.`, reconnait: "C'est moi. Je veux payer les réparations." },
        audition: [{ q: `Avez-vous dégradé ${S.objet} ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "J'étais là, oui." } }],
        prevention: f.tag && f.leger ? `tracé sans autorisation préalable des inscriptions sur ${S.objet}` : `volontairement dégradé ${S.objet}`,
        prejudice: [{ id: "materiel", label: "Réparations (devis)", demande: f.montant, base: f.montant, piece: "devis" }],
      };
    },
  });

  // =================================================================== INCENDIE
  CAT.def("incendie", {
    fam: "biens", nom: "Incendie", gravite: 0.6,
    textes: ["CP_322-6", "CP_322-5"],
    elements: { legal: "Art. 322-6 CP (incendie volontaire d'un bien d'autrui créant un danger pour les personnes) ; 322-5 (involontaire).", materiel: "La destruction ou la dégradation d'un bien d'autrui par l'effet d'un incendie.", moral: "Pour 322-6, la volonté de mettre le feu ; pour 322-5, un manquement à une obligation de prudence ou de sécurité." },
    victimeDe: () => "personne",
    mesures: { gav: 0.85, al: 0.15, convocation: 0 }, flagrance: 0.45,
    voies: { classement: 0.05, alternative: 0.06, copj: 0.35, ci: 0.36, crpc: 0.18 },
    preuves: { constat: 0.6, expertise: 0.8, temoin: 0.45, video: 0.45, telephonie: 0.3, aveux: 0.35 },
    camera: 0.35, irr: ["heures", "perq_assentiment"],
    tirer(r) { const vol = ch(r, 0.78); return { sc: vol ? pk(r, ["voiture", "poubelles", "scooter", "porte"]) : pk(r, ["cigarette", "barbecue"]), volontaire: vol, delibere: !vol && ch(r, 0.3), montant: int(r, 15, 250) * 100, agg: [] }; },
    qual(f) { if (f.volontaire) return CAT.delit(120, 150000, "art. 322-6 CP", "destruction d'un bien appartenant à autrui par l'effet d'un incendie de nature à créer un danger pour les personnes", { textes: ["CP_322-6"] }); return CAT.delit(f.delibere ? 24 : 12, f.delibere ? 30000 : 15000, "art. 322-5 CP", `destruction involontaire d'un bien d'autrui par l'effet d'un incendie provoqué par un manquement à une obligation de prudence${f.delibere ? ", la violation de l'obligation étant manifestement délibérée" : ""}`, { textes: ["CP_322-5"] }); },
    recit(X, f) {
      const { A, V, r } = X;
      const moi = { voiture: "Ma voiture", poubelles: "Les poubelles du hall", scooter: "Mon scooter", porte: "Ma porte", cigarette: "Mon appartement", barbecue: "Ma terrasse" }[f.sc];
      const obj = { voiture: `le véhicule Renault Mégane de ${X.nf(V)}, stationné ${X.rue}`, poubelles: `les conteneurs à ordures du hall de l'immeuble du ${int(r, 2, 90)}, ${X.rue}`, scooter: `le scooter de ${X.nf(V)}, garé contre la façade`, porte: `la porte palière de ${X.nf(V)}`, cigarette: `l'appartement de ${X.nf(V)}, au-dessous de celui de ${X.n(A)}`, barbecue: `la terrasse et les stores de ${X.nf(V)}` }[f.sc];
      return {
        titre: f.volontaire ? { voiture: "la voiture incendiée", poubelles: "le feu dans le hall", scooter: "le scooter brûlé", porte: "la porte incendiée" }[f.sc] : "l'incendie involontaire",
        lieu: `${X.rue}, ${X.lieu}`, montant: f.montant,
        resume: f.volontaire ? `${X.n(A)} aurait mis le feu à ${obj.split(",")[0]}. Dommages : ${eur(f.montant)}.` : `Un incendie, parti de chez ${X.n(A)} (${f.sc === "cigarette" ? "une cigarette mal éteinte" : "un barbecue sur le balcon"}), a endommagé ${obj}.`,
        constat: [`Intervention de la brigade de sapeurs-pompiers de Paris pour un feu de ${obj}.`, f.volontaire ? `Le laboratoire central de la préfecture de police relève la présence d'un accélérant (traces d'hydrocarbure) ; l'origine volontaire est retenue.` : "L'enquête des pompiers situe le départ de feu sur le balcon de l'étage supérieur."],
        plainte: [`${moi} ${f.sc === "poubelles" ? "ont" : "a"} brûlé. ${f.sc === "poubelles" ? "La fumée est montée dans tous les étages, une voisine âgée a été évacuée." : "Tout est perdu."} Le préjudice est de ${eur(f.montant)}.`],
        temoin: [f.volontaire ? `J'ai vu ${pk(r, ["un homme en capuche", "un jeune avec un bidon", "quelqu'un en scooter"])} s'approcher, puis les flammes. Il est parti en courant.` : "J'ai vu de la fumée sortir du balcon du dessus."],
        version: { nie: "Je n'ai rien fait. J'étais chez moi.", minimise: f.volontaire ? "J'ai allumé un papier pour faire peur. Je pensais pas que ça prendrait." : "J'ai fumé sur le balcon, c'est vrai. Je croyais l'avoir éteinte.", reconnait: f.volontaire ? `J'ai mis le feu. J'avais la rage contre ${X.lui(V)}.` : "C'est de ma faute. Mon assurance va payer." },
        audition: [{ q: f.volontaire ? "Un bidon d'essence a été retrouvé près de chez vous. Est-il à vous ?" : "Fumiez-vous sur votre balcon ce soir-là ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je ne sais pas." } }],
        prevention: f.volontaire ? `volontairement détruit ${obj}, bien appartenant à autrui, par l'effet d'un incendie de nature à créer un danger pour les personnes` : `involontairement détruit ${obj} par l'effet d'un incendie provoqué par manquement à une obligation de prudence ou de sécurité`,
        prejudice: [{ id: "materiel", label: "Dommages matériels (rapport d'expertise)", demande: f.montant, base: Math.round(f.montant * 0.9), piece: "devis" }, { id: "moral", label: "Préjudice moral", demande: 1500, base: 800 }],
      };
    },
  });

  // =================================================================== STUPÉFIANTS : USAGE
  const PRODUITS = { cannabis: ["résine de cannabis", "herbe de cannabis"], cocaine: ["cocaïne"], crack: ["crack"], mdma: ["MDMA"], ketamine: ["kétamine"], heroine: ["héroïne"] };
  CAT.def("stups_usage", {
    fam: "stups", nom: "Usage de stupéfiants", gravite: 0.15, op: true, recidive: true,
    textes: ["CSP_L3421-1"],
    elements: { legal: "Art. L. 3421-1 du code de la santé publique.", materiel: "L'usage illicite d'un produit classé comme stupéfiant ; la détention d'une petite quantité en vue de la seule consommation est souvent poursuivie sous cette qualification.", moral: "La conscience de consommer un produit stupéfiant." },
    victimeDe: () => null,
    mesures: { gav: 0.55, al: 0.4, convocation: 0.05 }, flagrance: 1,
    voies: { classement: 0.15, alternative: 0.55, copj: 0.1, ci: 0, crpc: 0.05, op: 0.15 },
    preuves: { constat: 1, saisie: 1, labo: 0.4, aveux: 0.7 },
    camera: 0, irr: ["controle_identite", "fouille"],
    tirer(r) { const p = pk(r, ["cannabis", "cannabis", "cannabis", "cocaine", "mdma", "crack"]); return { sc: pk(r, ["rue", "soiree", "voiture"]), produit: p, quantite: p === "cannabis" ? int(r, 1, 12) : int(r, 1, 3) / 2, agg: [] }; },
    qual: () => CAT.delit(12, 3750, "art. L. 3421-1 du code de la santé publique", "usage illicite de stupéfiants", { textes: ["CSP_L3421-1"] }),
    comp: () => ["stage de sensibilisation aux dangers de l'usage de produits stupéfiants"],
    recit(X, f) {
      const { A, r } = X;
      const prod = pk(r, PRODUITS[f.produit]);
      return {
        titre: f.sc === "soiree" ? "la sortie de soirée" : f.sc === "voiture" ? "la consommation en voiture" : f.produit === "cannabis" ? "le joint au square" : "la consommation dans le square", lieu: f.sc === "voiture" ? `dans un véhicule stationné ${X.rue}` : f.sc === "soiree" ? "à la sortie d'une soirée, boulevard de Clichy" : `square ${pk(r, ["Léon", "Louise-Michel", "d'Anvers", "des Deux-Nèthes"])}, ${X.rue}`,
        resume: `Contrôlé${X.e(A)} en possession de ${String(f.quantite).replace(".", ",")} g de ${prod}.`,
        constat: [`Lors d'une patrouille, observons ${X.n(A)} ${{ cannabis: "fumant une cigarette roulée dégageant une forte odeur caractéristique de cannabis", crack: "allumer une pipe artisanale en verre", mdma: "avaler un comprimé que lui tend un tiers" }[f.produit] || "porter à son nez une clé sur laquelle se trouve une poudre blanche"}.`, `Palpation de sécurité : découverte de ${String(f.quantite).replace(".", ",")} g de ${prod} dans la poche avant de son pantalon.`],
        saisie: `${String(f.quantite).replace(".", ",")} g de ${prod}`,
        version: { nie: "C'est pas à moi, on me l'a donné pour le garder.", minimise: "Je fume de temps en temps, le soir, pour dormir.", reconnait: "Je consomme, oui. Je veux arrêter." },
        audition: [{ q: "Depuis quand consommez-vous ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "De temps en temps." } }],
        prevention: `fait illicitement usage de ${prod}, substance classée comme stupéfiant`,
        prejudice: [],
      };
    },
  });

  // =================================================================== STUPÉFIANTS : DÉTENTION
  CAT.def("stups_detention", {
    fam: "stups", nom: "Détention de stupéfiants", gravite: 0.45,
    textes: ["CP_222-37"],
    elements: { legal: "Art. 222-37 CP.", materiel: "Le transport, la détention, l'offre, la cession, l'acquisition ou l'emploi illicites de stupéfiants.", moral: "La conscience de détenir un produit stupéfiant." },
    victimeDe: () => null,
    mesures: { gav: 0.95, al: 0.05, convocation: 0 }, flagrance: 0.8,
    voies: { classement: 0.04, alternative: 0.1, copj: 0.32, ci: 0.36, crpc: 0.18 },
    preuves: { constat: 0.8, saisie: 1, labo: 0.9, telephonie: 0.35, aveux: 0.5 },
    camera: 0, irr: ["controle_identite", "fouille", "perq_assentiment", "perq_nuit"],
    tirer(r) { const p = pk(r, ["cannabis", "cannabis", "cocaine", "mdma", "ketamine"]); return { sc: pk(r, ["domicile", "voiture", "rue"]), produit: p, quantite: p === "cannabis" ? int(r, 25, 450) : int(r, 4, 60), agg: [] }; },
    qual: () => CAT.delit(120, 7500000, "art. 222-37 CP", "détention, transport et acquisition non autorisés de stupéfiants", { textes: ["CP_222-37"] }),
    requalif(r, f) { return (f.produit === "cannabis" ? f.quantite < 60 : f.quantite < 8) && ch(r, 0.7) ? { f2: { sc: f.sc, produit: f.produit, quantite: f.quantite, agg: [] }, inf2: "stups_usage", quoi: "usage" } : null; },
    comp: (q, ctx) => ["confiscation des scellés", `interdiction de séjour ${(ctx && ctx.zone) || "dans le 18e arrondissement"} pendant deux ans`],
    recit(X, f) {
      const { A, r } = X;
      const prod = pk(r, PRODUITS[f.produit]);
      const q = `${f.quantite} g de ${prod}`;
      return {
        titre: f.sc === "domicile" ? "les stupéfiants dans l'appartement" : "les stupéfiants dans la voiture", lieu: f.sc === "domicile" ? `au domicile de ${X.n(A)}, ${int(r, 2, 90)}, ${X.rue}` : f.sc === "voiture" ? `dans le véhicule de ${X.n(A)}, ${X.rue}` : `${X.rue}, ${X.lieu}`,
        resume: `Découverte de ${q} ${{ domicile: "au domicile de", voiture: "dans le véhicule de", rue: "sur" }[f.sc]} ${X.n(A)}, ${pk(r, ["en un seul bloc", "en plusieurs sachets", "dans une boîte à chaussures"])}.`,
        constat: [f.sc === "domicile" ? `Perquisition au domicile de ${X.n(A)} : découverte, dans un placard de la cuisine, de ${q}, d'une balance de précision et de ${int(r, 2, 40)} sachets vides.` : `Contrôle de ${X.n(A)} ; fouille : découverte de ${q}${f.sc === "voiture" ? ", sous le siège conducteur" : ", dans un sac banane"}.`, `Placement sous scellé n° ${int(r, 1, 9)} ; pesée et test de terrain positif.`],
        saisie: q,
        version: { nie: "C'est pas à moi. C'est à un ami qui dormait chez moi.", minimise: "C'est pour ma consommation. J'achète en gros, c'est moins cher.", reconnait: "Je la gardais pour quelqu'un. On me payait pour ça." },
        audition: [{ q: `${q} : c'est beaucoup pour un consommateur. Que comptiez-vous en faire ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "C'est pour moi." } }, { q: "À qui appartient la balance ?", a: { silence: "…", expliquer: "À moi. Pour vérifier qu'on m'arnaque pas.", partiel: "Je ne sais pas." } }],
        prevention: `détenu, transporté et acquis illicitement des stupéfiants, en l'espèce ${q}`,
        prejudice: [],
      };
    },
  });

  // =================================================================== STUPÉFIANTS : TRAFIC (revente)
  CAT.def("stups_trafic", {
    fam: "stups", nom: "Trafic de stupéfiants", gravite: 0.65,
    textes: ["CP_222-37", "CP_222-39"],
    elements: { legal: "Art. 222-37 CP (détention, offre, cession) ; 222-39 (cession à un consommateur).", materiel: "L'offre ou la cession de stupéfiants, la détention en vue de la revente.", moral: "La conscience de participer au trafic." },
    victimeDe: () => null,
    mesures: { gav: 1, al: 0, convocation: 0 }, flagrance: 0.75,
    voies: { classement: 0.01, alternative: 0.01, copj: 0.25, ci: 0.55, crpc: 0.18 },
    preuves: { constat: 0.9, saisie: 1, labo: 0.9, telephonie: 0.6, temoin: 0.2, aveux: 0.35, video: 0.25 },
    camera: 0, irr: ["controle_identite", "fouille", "perq_assentiment", "perq_nuit", "geoloc", "requisition"],
    tirer(r) { const p = pk(r, ["cannabis", "cocaine", "crack", "cannabis"]); return { sc: pk(r, ["point_deal", "point_deal", "livraison", "guetteur"]), produit: p, quantite: p === "cannabis" ? int(r, 40, 900) : int(r, 10, 180), especes: int(r, 3, 60) * 50, agg: [] }; },
    qual: () => CAT.delit(120, 7500000, "art. 222-37 CP", "détention, offre et cession non autorisées de stupéfiants", { textes: ["CP_222-37"] }),
    comp: (q, ctx) => ["confiscation des scellés et des sommes saisies", `interdiction de paraître ${(ctx && ctx.zone) || "dans le 18e arrondissement"} pendant trois ans`],
    recit(X, f) {
      const { A, r } = X;
      const prod = pk(r, PRODUITS[f.produit]);
      const q = `${f.quantite} g de ${prod}`;
      const lieu = f.sc === "livraison" ? `${X.rue}, lors d'une « livraison » commandée par messagerie` : `au pied de l'immeuble du ${int(r, 2, 90)}, ${X.rue}, point de vente connu des services`;
      return {
        titre: f.sc === "livraison" ? "le livreur de drogue" : "le point de deal", lieu,
        resume: `${X.n(A)} est interpellé${X.e(A)} ${f.sc === "guetteur" ? "comme guetteur" : "en flagrant délit de vente"} ; saisie de ${q} et de ${eur(f.especes)} en espèces.`,
        constat: [`Surveillance ${f.sc === "livraison" ? "d'un véhicule signalé pour des livraisons" : "du point de vente"} à partir de ${X.h(X.hf)}.`, f.sc === "guetteur" ? `Observons ${X.n(A)} crier « ${pk(r, ["Ara ! Ara !", "Ça bouge !", "Les condés !"])} » à l'approche de notre véhicule.` : `Observons ${X.n(A)} remettre à trois personnes successives de petits objets contre des billets.`, `Interpellation ; découverte de ${q}, conditionnés en ${int(r, 10, 120)} pochons, et de ${eur(f.especes)} en coupures de 10 et 20 euros.`],
        temoin: [`Un acheteur, contrôlé à la sortie : « Je lui ai acheté une barrette pour 20 euros. Je viens ici tous les vendredis. »`],
        saisie: `${q} et ${eur(f.especes)} en espèces`,
        version: { nie: "J'étais là, j'attendais un pote. La drogue, c'est pas à moi.", minimise: "Je faisais que guetter. On me donnait 50 euros la journée.", reconnait: "Je vendais. J'avais une dette au quartier, je devais la rembourser." },
        audition: [{ q: `${q}, ${eur(f.especes)} en petites coupures : vous vendiez ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je ne vendais pas." } }, { q: "Pour qui travaillez-vous ?", a: { silence: "…", expliquer: "Je donnerai pas de nom. J'ai une famille.", partiel: "Personne." } }],
        prevention: `détenu, offert et cédé illicitement des stupéfiants, en l'espèce ${q}`,
        prejudice: [],
        qA: [{ q: "Vous avez peur de quelqu'un ?", a: ["Si je parle, ma mère va avoir des problèmes. C'est tout ce que je dirai."] }],
      };
    },
  });
  // =================================================================== ARME DE CATÉGORIE B (n° 12 : seulement en concours, avec un trafic)
  CAT.def("arme_b", {
    fam: "stups", nom: "Détention d'une arme de catégorie B", gravite: 0.5, secondaire: true, victime: null, pasCI: false,
    textes: ["CP_222-52"],
    elements: { legal: "Art. 222-52 du code pénal.", materiel: "La détention, sans autorisation préfectorale, d'une arme ou de munitions classées dans la catégorie B.", moral: "La conscience de détenir l'arme." },
    mesures: { gav: 1, al: 0, convocation: 0 }, flagrance: 1,
    voies: { copj: 0.5, ci: 0.5 },
    preuves: { saisie: 1 },
    camera: 0, irr: [],
    tirer(r) { return { arme: pk(r, ["un pistolet semi-automatique de calibre 9 mm", "un revolver de calibre .38"]), lieu: "dans une sacoche", munitions: int(r, 4, 15), agg: [] }; },
    qual: () => CAT.delit(60, 75000, "art. 222-52 CP", "détention sans autorisation d'une arme de catégorie B", { textes: ["CP_222-52"] }),
    comp: () => ["confiscation de l'arme", "interdiction de détenir une arme soumise à autorisation pendant cinq ans"],
    recit(X, f) { return { titre: "l'arme", resume: `${X.n(X.A)} détenait ${f.arme} ${f.lieu}.`, constat: [`Découvrons ${f.arme}, chargeur garni de ${f.munitions} cartouches, ${f.lieu}.`], version: { nie: "Ce n'est pas à moi.", minimise: "On me l'a confiée.", reconnait: "C'était pour me protéger." }, audition: [], prevention: `détenu sans autorisation une arme de catégorie B, en l'espèce ${f.arme}`, prejudice: [] }; },
  });
})();
