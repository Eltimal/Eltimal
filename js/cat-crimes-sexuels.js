/* La Permanence — catalogue, phase 2 : les violences sexuelles.
   Viol (crime) et agressions sexuelles (délits, souvent instruits avec un viol ou après correctionnalisation).
   Règles de contenu : les faits sont décrits de façon factuelle et clinique, comme dans un procès-verbal ou une expertise,
   jamais de façon érotisée ; lorsque la victime est mineure, rien des faits n'est décrit : seulement la procédure
   (audition filmée, administrateur ad hoc, expertises, qualification). Peines et articles à revérifier sur Légifrance. */
(function () {
  const CR = window.CR;
  const CAT = CR.CAT;
  const C = CAT.CRIM;
  const { pk, int, ch } = CAT;

  const AGG_222_24 = ["mineur15", "vulnerable", "autorite", "abus_autorite", "reunion", "arme", "rencontre_en_ligne", "conjoint", "ex_conjoint", "ivresse", "stupefiants", "drogue_insu", "itt8"];
  const AGG_222_28 = ["itt8", "autorite", "abus_autorite", "reunion", "arme", "conjoint", "ex_conjoint", "ivresse", "stupefiants", "rencontre_en_ligne", "drogue_insu", "vulnerable"];
  const lab = (base, aggs) => `${base}${aggs.length ? ", " + aggs.map(CAT.aggLabel).join(", ") : ""}`;
  // Prescription des infractions sexuelles sur mineur : à compter de la majorité de la victime (art. 7 et 8 CPP)
  const prescMineur = (f, ans) => (f.ageV != null && f.ageV < 18 ? { prescAns: ans, prescMajorite: true } : {});

  function qualViol(f) {
    const aggs = (f.agg || []).filter((a) => AGG_222_24.includes(a));
    const m15 = aggs.includes("mineur15");
    const autres = aggs.filter((a) => a !== "mineur15");
    return CAT.crime(aggs.length ? 240 : 180, 0, m15 ? `art. 222-23-1${autres.length ? " et 222-24" : ""} CP` : aggs.length ? "art. 222-23 et 222-24 CP" : "art. 222-23 CP", m15 ? lab("viol sur mineur de quinze ans", autres) : lab("viol", aggs),
      Object.assign({ aggs, textes: ["CP_222-23"].concat(m15 ? ["CP_222-23-1"] : [], aggs.length ? ["CP_222-24"] : []) }, prescMineur(f, 30)));
  }
  function qualAS(f) {
    const aggs = (f.agg || []).filter((a) => AGG_222_28.includes(a) || a === "mineur15");
    const m15 = aggs.includes("mineur15");
    const [prison, amende, art] = m15 ? [120, 150000, "art. 222-29-1 CP"] : aggs.length ? [84, 100000, "art. 222-27 et 222-28 CP"] : [60, 75000, "art. 222-27 CP"];
    return CAT.delit(prison, amende, art, m15 ? lab("agression sexuelle sur mineur de quinze ans", aggs.filter((a) => a !== "mineur15")) : lab("agression sexuelle", aggs),
      Object.assign({ aggs, textes: ["CP_222-22", "CP_222-27"].concat(m15 ? ["CP_222-29-1"] : aggs.length ? ["CP_222-28"] : []) }, prescMineur(f, m15 ? 20 : 10)));
  }
  // Examen médico-légal d'une victime majeure : constatations cliniques, prélèvements
  const examen = (X, f, o = {}) => ({
    kind: "examen_sexuel",
    lesions: [o.lesion || X.pk(["ecchymoses des faces internes des deux bras, d'allure digitée", "ecchymoses des faces internes des cuisses", "dermabrasion du poignet droit", "aucune lésion traumatique externe"]), o.gyneco || X.pk(["une érosion muqueuse récente, compatible avec une pénétration récente", "aucune lésion génitale récente, ce qui n'exclut pas un rapport non consenti", "une ecchymose récente de la région génitale"])],
    prelevements: "Prélèvements réalisés aux fins de recherche de spermatozoïdes, d'ADN et de toxiques, placés sous scellés.",
    itt: o.itt != null ? o.itt : int(X.r, 0, 6),
    retentissement: "Retentissement psychologique important : sidération, troubles du sommeil, reviviscences. ITT fixée en tenant compte de ce retentissement.",
  });
  // Ce que dit la procédure quand la victime est mineure : aucune description des faits
  const leMin = (X) => (X.V.g === "f" ? "la mineure" : "le mineur");
  const procMineur = (X) => ({ kind: "procedural_mineur", lesions: [], itt: null, texte: `Examen médico-légal ${X.V.g === "f" ? "de la mineure" : "du mineur"} ${X.ini(X.V)} réalisé à l'unité médico-judiciaire pédiatrique, en présence de son représentant légal ; le rapport, coté au dossier, est communiqué aux parties dans les conditions de l'article 114.` });
  const audMineur = (X, f) => [`Audition ${X.V.g === "f" ? "de la mineure" : "du mineur"} ${X.ini(X.V)}, ${X.V.age} ans, réalisée selon le protocole d'audition des mineurs victimes et enregistrée (art. 706-52), en présence d'un administrateur ad hoc désigné par le parquet (art. 706-50).`, `${CR.cap(leMin(X))} dénonce des faits de nature sexuelle commis par ${X.n(X.A)} ; le procès-verbal de retranscription est coté au dossier et l'enregistrement peut être visionné par les parties.`, "Expertise psychologique ordonnée : elle conclut à un retentissement important et à l'absence d'élément évocateur d'une affabulation ou d'une suggestion."];

  // =================================================================== VIOL
  C.fiche("viol", {
    fam: "crim_sexuel", nom: "Viol", gravite: 0.85, deces: false,
    textes: ["CP_222-22", "CP_222-23", "CP_222-24", "CPP_306"],
    elements: { legal: "Art. 222-22, 222-23 à 222-26 CP.", materiel: "Un acte de pénétration sexuelle, de quelque nature qu'il soit, ou un acte bucco-génital, commis sur la personne d'autrui ou sur celle de l'auteur.", moral: "Par violence, contrainte, menace ou surprise : l'auteur a conscience d'imposer l'acte. L'absence de lésion n'établit pas le consentement." },
    prevention: (X) => (X.V.age < 18 ? `commis un acte de pénétration sexuelle sur la personne ${X.V.g === "f" ? "de la mineure" : "du mineur"} ${X.ini(X.V)}` : `par violence, contrainte, menace ou surprise, commis un acte de pénétration sexuelle sur la personne de ${X.nf(X.V)}`),
    qual: (f) => qualViol(f),
    requalif(r, f) {
      if (f.enjeux.includes("penetration")) return { inf2: "agression_sexuelle", f2: Object.assign({}, f), quoi: "penetration" };
      return null;
    },
    ctxs: {
      conjugal: {
        w: 3, titre: "le viol conjugal", lieu: (X) => `au domicile du couple, ${X.A.adresse}`,
        pers: { A: { g: "m", min: 24, max: 60 }, V: { g: "f", rel: "conjoint" } },
        imposees: (r) => [ch(r, 0.25) ? "ex_conjoint" : "conjoint"], agg: { ivresse: 0.3 },
        heures: [[22 * 60, 23 * 60 + 50], [0, 3 * 60]],
        preuves: { ecrits: 0.7, temoin: 0.6, medical: 1, telephonie: 0.3 },
        enjeux: { consentement: 0.75 },
        mobiles: ["{VIl} dormait dans la chambre de l'enfant depuis des semaines.", "{VIl} venait d'annoncer la séparation.", "{Il} rentrait d'une soirée alcoolisée."],
        resume: (X, f) => `${X.n(X.V)} dénonce un viol commis par son ${f.agg.includes("ex_conjoint") ? "ancien conjoint" : "conjoint"}, ${X.n(X.A)}, au domicile ; il soutient qu'elle était consentante.`,
        victime: (X) => ["Je lui ai dit non. Plusieurs fois. Je lui ai dit que je ne voulais pas, que j'étais fatiguée, que je voulais dormir.", "Il m'a tenue par les poignets sur le lit. Il m'a imposé un rapport. J'ai arrêté de me débattre parce que j'avais peur qu'il réveille la petite.", "Le matin, il a fait comme si rien ne s'était passé. Il m'a demandé ce qu'on mangeait à midi."],
        medical: (X, f) => examen(X, f, { lesion: "ecchymoses d'allure digitée aux deux poignets" }),
        ecrits: (X) => [`${X.A.prenom} : « je suis désolé pour hier soir. j'avais trop bu »`, `${X.V.prenom} : « tu sais ce que tu as fait. je t'ai dit non »`, `${X.A.prenom} : « tu es ma femme »`],
        temoin: (X) => [`${X.V.prenom} est arrivée chez moi le lendemain matin avec la petite. Elle tremblait. Elle m'a dit : « Il m'a violée. » Elle n'arrivait pas à dire autre chose.`],
        version: () => ({ nie: "Il ne s'est rien passé cette nuit-là. Elle invente pour avoir la garde.", minimise: "On a eu un rapport. Elle n'a pas dit non. Elle ne disait rien, je pensais qu'elle était d'accord.", reconnait: "Elle a dit non. J'ai continué. Je pensais que c'était normal, entre mari et femme. Je sais aujourd'hui que non." }),
        et: { consentement: (X) => ({ piece: "ecrits", fort: "Dans les jours qui suivent, les messages du couple portent sur l'organisation familiale, sans allusion aux faits ; la plainte intervient trois mois plus tard, après la séparation.", faible: `Le lendemain, ${X.A.prenom} écrit : « je suis désolé pour hier soir », et ${X.V.prenom} répond : « je t'ai dit non ».` }) },
        interro: () => [{ q: "Elle vous a dit non ?", a: { nie: "Il ne s'est rien passé.", minimise: "Elle n'a rien dit. Elle ne bougeait pas.", reconnait: "Oui. Elle l'a dit." } }],
      },
      soiree: {
        w: 2.5, titre: "la nuit après la fête", lieu: (X) => { const a = X.pk(["18e", "17e", "9e"]); return X.ancien ? `dans un appartement du ${a} arrondissement, lors d'une soirée` : `dans un appartement ${X.arr ? `du ${X.arr} arrondissement` : X.aLieu}, lors d'une soirée`; },
        pers: { A: { g: "m", min: 18, max: 35 }, V: { g: "f", min: 18, max: 30 } }, mineurA: 0.1, ageMinA: 16,
        agg: { ivresse: 0.4 },
        heures: [[1 * 60, 5 * 60]],
        preuves: { temoin: 0.85, medical: 1, ecrits: 0.6, adn: 0.6 },
        enjeux: { consentement: 0.75, penetration: 0.15 },
        mobiles: ["Une soirée d'anniversaire.", "Une fête d'étudiants.", "Une soirée après un concert."],
        resume: (X) => `Après une soirée très alcoolisée, ${X.n(X.V)} se réveille dans une chambre avec ${X.n(X.A)} ; elle dénonce un viol par surprise, il parle d'un rapport consenti.`,
        victime: (X) => ["J'avais beaucoup bu. Je suis allée m'allonger dans la chambre, seule.", "Je me suis réveillée, il était sur moi. Il me pénétrait. Je n'arrivais ni à bouger ni à parler. Je le connaissais à peine.", "Je suis partie à six heures. J'ai pris une douche en rentrant, je sais que ce n'est pas ce qu'il fallait faire."],
        medical: (X, f) => examen(X, f, { lesion: "aucune lésion traumatique externe" }),
        temoin: (X) => [`${X.V.prenom} ne tenait plus debout. Elle est allée s'allonger vers deux heures. ${X.A.prenom} l'a suivie un peu après. Je n'ai rien dit, je pensais qu'il allait voir si elle allait bien.`],
        temoin2: (X) => [`Le lendemain, ${X.V.prenom} m'a appelée en pleurant. Elle m'a dit qu'elle ne se souvenait pas de tout, mais qu'elle s'était réveillée avec lui sur elle.`],
        version: () => ({ nie: "Je ne suis pas entré dans cette chambre.", minimise: "Elle m'a embrassé dans la cuisine. Après, dans la chambre, elle était d'accord. Elle était saoule, oui, mais elle savait.", reconnait: "Elle dormait presque. Je savais qu'elle n'était pas en état. Je l'ai fait quand même." }),
        et: { consentement: (X) => ({ piece: "temoin", fort: "« Ils s'étaient embrassés dans la cuisine vers une heure. Elle riait. Elle n'avait pas l'air si saoule. »", faible: `« Elle ne tenait plus debout. Elle s'est couchée toute seule. Lui a dit : “je vais voir comment elle va”. »` }) },
        interro: () => [{ q: "Dans quel état était-elle quand vous êtes entré dans la chambre ?", a: { nie: "Je n'y suis pas entré.", minimise: "Fatiguée. Mais réveillée.", reconnait: "Elle dormait. Je l'ai vu." } }],
      },
      soumission: {
        w: 1.5, titre: "la soumission chimique", lieu: (X) => `au domicile de ${X.n(X.A)}, ${X.A.adresse}`,
        pers: { A: { g: "m", min: 25, max: 60 }, V: { g: "f", min: 18, max: 50 } },
        imposees: () => ["drogue_insu"],
        heures: [[21 * 60, 23 * 60 + 50]],
        preuves: { medical: 1, toxico: 0.95, telephonie: 0.6, saisie: 0.7, video: 0.3 },
        enjeux: { identification: 0.35, consentement: 0.3 },
        mobiles: ["Un dîner chez un collègue.", "Un verre après un rendez-vous professionnel.", "Une soirée chez un voisin."],
        resume: (X) => `${X.n(X.V)} perd connaissance après un verre chez ${X.n(X.A)} et se réveille sans souvenir ; les analyses révèlent une substance administrée à son insu.`,
        victime: () => ["Il m'a servi un verre de vin. Après, plus rien. Un trou noir de six heures.", "Je me suis réveillée sur son canapé, mes vêtements n'étaient plus à la même place, j'avais mal. Je ne sais pas ce qui s'est passé, et c'est ce qui est le pire."],
        medical: (X, f) => examen(X, f, { gyneco: "des lésions muqueuses récentes, compatibles avec une pénétration dans les vingt-quatre heures" }),
        toxico: () => "Analyse segmentaire des cheveux : présence d'acide gamma-hydroxybutyrique (GHB) dans le segment correspondant à la date des faits ; un somnifère de la classe des benzodiazépines est retrouvé dans les urines.",
        saisie: () => "deux flacons sans étiquette, une boîte de somnifères prescrits à un tiers, un ordinateur et un téléphone",
        version: () => ({ nie: "Elle a trop bu. Elle s'est endormie. Je ne l'ai pas touchée.", minimise: "On a eu un rapport, elle était d'accord. Je ne lui ai rien fait boire.", reconnait: "J'ai mis quelque chose dans son verre. Je ne sais pas pourquoi j'ai fait ça." }),
        et: { identification: () => ({ piece: "toxico", fort: "Le laboratoire indique que le GHB est aussi produit en faible quantité par l'organisme ; la concentration mesurée est proche du seuil d'interprétation.", faible: "La concentration de GHB est très supérieure aux valeurs physiologiques ; le flacon saisi contient la même substance." }) },
        actes: () => [{ id: "ordi", t: "L'expertise de l'ordinateur et du téléphone saisis (recherches, photographies, autres victimes)." }],
      },
      appli: {
        w: 2, titre: "le premier rendez-vous", lieu: (X) => `au domicile de ${X.n(X.A)}, ${X.A.adresse}`,
        pers: { A: { g: "m", min: 20, max: 50 }, V: { g: "f", min: 18, max: 45 } },
        imposees: () => ["rencontre_en_ligne"],
        heures: [[21 * 60, 23 * 60 + 50], [0, 3 * 60]],
        preuves: { ecrits: 0.95, medical: 1, telephonie: 0.7, adn: 0.5 },
        enjeux: { consentement: 0.8 },
        mobiles: ["Un premier rendez-vous après trois semaines de messages.", "Une rencontre organisée le soir même.", "Un second rendez-vous."],
        resume: (X) => `${X.n(X.V)} rencontre ${X.n(X.A)} par une application de rencontre ; au premier rendez-vous chez lui, elle dénonce un viol.`,
        victime: () => ["On devait boire un verre. Il a insisté pour qu'on aille chez lui, j'ai accepté parce qu'il pleuvait.", "Quand j'ai voulu partir, il avait fermé la porte à clé et gardé la clé. Je lui ai dit non, plusieurs fois. Il m'a poussée sur le lit et il m'a imposé un rapport.", "Après, il m'a ouvert la porte comme si de rien n'était."],
        medical: (X, f) => examen(X, f, { lesion: "une ecchymose de la face antérieure du bras gauche" }),
        ecrits: (X) => [`Avant : ${X.A.prenom} : « on se boit un verre ? sans pression »`, `Après, à 1 h 52 : ${X.V.prenom} : « tu m'as violée. je t'ai dit non »`, `À 1 h 58 : ${X.A.prenom} : « arrête ton cinéma t'étais d'accord »`],
        version: () => ({ nie: "Il ne s'est rien passé. On a parlé, elle est partie.", minimise: "On a eu un rapport. Elle n'a jamais dit non. Elle a changé d'avis après, je ne sais pas pourquoi.", reconnait: "Elle a voulu partir. J'ai fermé la porte. Je ne pensais pas que c'était un viol." }),
        et: { consentement: (X) => ({ piece: "ecrits", fort: "La veille, les échanges évoquent explicitement un rapport sexuel au premier rendez-vous ; aucun message n'est envoyé dans les heures qui suivent.", faible: `À 1 h 52, ${X.V.prenom} écrit : « tu m'as violée. je t'ai dit non » ; il répond : « arrête ton cinéma ».` }) },
        interro: () => [{ q: "Pourquoi la porte était-elle fermée à clé ?", a: { nie: "Elle ne l'était pas.", minimise: "Je ferme toujours à clé, par habitude.", reconnait: "Pour qu'elle reste." } }],
      },
      autorite: {
        w: 1.5, titre: "le praticien", lieu: (X) => `dans le cabinet de ${X.n(X.A)}, ${X.rue}`,
        pers: { A: { g: "m", min: 38, max: 68, metier: "médecin généraliste" }, V: { g: "f", min: 18, max: 55 } },
        imposees: () => ["abus_autorite"],
        heures: [[9 * 60, 19 * 60]],
        preuves: { temoin: 0.7, expertise: 0.9, ecrits: 0.4 },
        // consentement : ce que voit la secrétaire du cabinet, à la sortie de la consultation (D-95)
        et: { consentement: () => ({ piece: "temoin", fort: "« Ce jour-là, la patiente est ressortie normalement ; elle a pris son rendez-vous suivant au secrétariat. »", faible: "« Ce jour-là, elle est sortie du cabinet en pleurs, sans prendre de rendez-vous. Elle m'a dit : “il n'avait pas le droit”. »" }) },
        enjeux: { geste_medical: 0.7, consentement: 0.2 },
        tirer: (r) => ({ autresPlaignantes: int(r, 0, 5), metier: pk(r, ["médecin généraliste", "kinésithérapeute", "gynécologue", "ostéopathe"]) }),
        mobiles: ["Une consultation pour des douleurs lombaires.", "Un suivi régulier depuis des années.", "Une consultation pour un certificat de sport."],
        resume: (X, f) => `${X.n(X.V)} dénonce un acte de pénétration digitale imposé par son praticien, ${X.n(X.A)}, au cours d'une consultation${f.autresPlaignantes ? ` ; ${f.autresPlaignantes} autre${f.autresPlaignantes > 1 ? "s" : ""} patiente${f.autresPlaignantes > 1 ? "s" : ""} se manifeste${f.autresPlaignantes > 1 ? "nt" : ""} ensuite` : ""}.`,
        victime: () => ["Je venais pour le dos. Il m'a demandé de me déshabiller entièrement, sans gants. Il a pratiqué une pénétration avec ses doigts sans rien m'expliquer.", "J'étais tétanisée. C'était mon médecin. Je suis sortie et j'ai payé la consultation, je ne sais même pas pourquoi."],
        medical: (X, f) => examen(X, f, { lesion: "aucune lésion traumatique externe", gyneco: "aucune lésion génitale récente" }),
        expertise: (X, f) => `Expertise d'un praticien de la même spécialité : l'examen pratiqué ${f.forts && f.forts.includes("geste_medical") ? "peut correspondre à une indication reconnue dans certaines conditions, qui supposent l'information et le consentement de la patiente" : "ne correspond à aucune indication pour le motif de consultation déclaré"}.`,
        temoin: (X) => [`Je suis la secrétaire. Plusieurs patientes sont ressorties en pleurs ces dernières années. On me disait qu'elles étaient sensibles.`],
        version: () => ({ nie: "Je n'ai pratiqué qu'un examen clinique classique.", minimise: "Il s'agissait d'un examen médical justifié. Peut-être ai-je mal expliqué.", reconnait: "Ce geste n'avait pas de justification médicale. Je ne m'explique pas mon comportement." }),
        actes: () => [{ id: "patientes", t: "L'audition des patientes qui se sont manifestées et la saisie du registre des consultations." }],
      },
      inconnu: {
        w: 2, titre: "le parking", lieu: (X) => `dans le parking souterrain d'un immeuble, ${X.rue}`,
        pers: { A: { g: "m", min: 18, max: 45 }, V: { g: "f", min: 18, max: 60 } }, mineurA: 0.1, ageMinA: 16,
        agg: { arme: 0.45 },
        tirer: (r, f) => ({ arme: f.agg.includes("arme") ? pk(r, ["un couteau", "un cutter"]) : null }),
        heures: [[22 * 60, 23 * 60 + 50], [0, 2 * 60]],
        preuves: { medical: 1, adn: 0.95, video: 0.5, telephonie: 0.5 },
        enjeux: { identification: 0.75 },
        mobiles: ["{VIl} rentrait du travail.", "{VIl} garait sa voiture.", "{VIl} sortait les poubelles."],
        resume: (X) => `${X.n(X.V)} est violée par un inconnu dans un parking ; l'ADN, comparé au fichier national, désigne ${X.n(X.A)}.`,
        victime: (X, f) => ["Il m'a attrapée par derrière, la main sur la bouche." + (f.arme ? ` Il avait ${f.arme}, il l'a mis contre ma gorge.` : ""), "Il m'a mise par terre entre deux voitures et il m'a violée. Ça a duré quelques minutes. Il a dit : « Si tu cries je te tue. »", "Je n'ai pas vu son visage. Il avait une capuche et une odeur de cigarette."],
        medical: (X, f) => examen(X, f, { lesion: "dermabrasions des genoux et des coudes, ecchymose de la lèvre inférieure", itt: int(X.r, 3, 10) }),
        adn: (X) => `Profil génétique masculin isolé sur les prélèvements vaginaux : concordance avec le profil de ${X.n(X.A)}, enregistré au fichier national pour une procédure antérieure.`,
        version: () => ({ nie: "Je ne connais pas cette femme. Je ne suis jamais allé dans ce parking.", minimise: "On a eu un rapport, elle était d'accord. Je l'avais rencontrée dans un bar.", reconnait: "C'est moi. Je ne sais pas expliquer." }),
        et: { identification: () => ({ piece: "adn", fort: "Le profil isolé est un mélange de deux contributeurs masculins ; celui du mis en examen n'est que partiel.", faible: "Le profil isolé est complet et unique ; il correspond à celui du mis en examen." }) },
      },
      collectif: {
        w: 1.5, titre: "le viol en réunion", lieu: (X) => `dans une cave d'immeuble, ${X.rue}`,
        pers: { A: { g: "m", min: 15, max: 25 }, V: { g: "f", min: 15, max: 22 }, C2: true }, mineurA: 0.35, ageMinA: 14,
        imposees: () => ["reunion"],
        heures: [[18 * 60, 23 * 60]],
        preuves: { medical: 1, telephonie: 0.8, video: 0.5, ecrits: 0.6, adn: 0.6 },
        enjeux: { role: 0.65, consentement: 0.35 },
        procedural: (X) => X.V.age < 18,
        mobiles: ["Un rendez-vous avec quelqu'un qu'{Vil} connaissait.", "Une soirée qui devait se terminer chez une amie.", "On lui avait proposé de « passer en bas »."],
        resume: (X) => (X.V.age < 18 ? `${CR.cap(leMin(X))} ${X.ini(X.V)}, ${X.V.age} ans, dénonce un viol commis en réunion ; ${X.n(X.A)} est mis en examen avec plusieurs autres.` : `${X.n(X.V)} dénonce un viol en réunion dans une cave ; ${X.n(X.A)} est l'un des mis en cause.`),
        victime: (X) => (X.V.age < 18 ? audMineur(X) : ["Il m'a dit de descendre, qu'on serait tranquilles. En bas, il y avait trois autres garçons.", "Ils m'ont tenue. Ils m'ont violée l'un après l'autre. L'un d'eux filmait.", "Après, ils m'ont dit que si je parlais, la vidéo serait partout."]),
        medical: (X, f) => (X.V.age < 18 ? procMineur(X) : examen(X, f, { lesion: "ecchymoses des deux bras et du dos", itt: int(X.r, 5, 15) })),
        video: (X) => (X.V.age < 18 ? "Une vidéo est découverte dans le téléphone d'un des mis en cause ; elle est placée sous scellé, sans retranscription, et n'est consultable qu'au greffe." : "Une vidéo de quarante secondes, tournée dans la cave, est retrouvée dans le téléphone d'un des mis en cause ; elle est placée sous scellé."),
        version: () => ({ nie: "Je n'étais pas dans la cave. J'étais en haut.", minimise: "J'étais là. Je n'ai rien fait. Je n'ai pas osé partir.", reconnait: "On était plusieurs. Je l'ai fait aussi. Je savais qu'elle ne voulait pas." }),
        et: { role: () => ({ piece: "telephonie", fort: "Le téléphone du mis en examen borne hors de la cave au moment des faits ; un seul témoin le place dans l'escalier.", faible: "Le mis en examen apparaît sur la vidéo, à côté de la victime." }), consentement: () => ({ piece: "ecrits", fort: "La défense produit des messages antérieurs entre la plaignante et l'un des mis en examen ; leur portée est discutée.", faible: "Dans un message envoyé le soir même, un mis en cause écrit : « elle voulait pas mais on s'en fout »." }) },
      },
      vulnerable: {
        w: 1, titre: "le foyer", lieu: (X) => `dans un foyer d'accueil médicalisé, à ${X.pk(["Saint-Denis", "Montreuil", "Vitry-sur-Seine"])}`,
        pers: { A: { g: "m", min: 25, max: 60, metier: "aide médico-psychologique" }, V: { min: 20, max: 50 } },
        imposees: () => ["vulnerable", "abus_autorite"],
        heures: [[21 * 60, 23 * 60 + 50], [0, 6 * 60]],
        preuves: { temoin: 0.7, adn: 0.7, expertise: 0.9, medical: 1 },
        enjeux: { identification: 0.5, penetration: 0.3 },
        mobiles: ["Une garde de nuit, {seul} avec les résidents.", "Une toilette du soir.", "Un résident signalé comme « agité »."],
        resume: (X) => `${X.n(X.V)}, résident${X.e(X.V)} d'un foyer, atteint${X.e(X.V)} d'une déficience intellectuelle, est victime d'un viol ; un salarié de nuit, ${X.n(X.A)}, est mis en cause.`,
        victime: (X) => [`Audition adaptée de ${X.nf(X.V)}, en présence d'une psychologue : ${X.il(X.V)} désigne « le monsieur de la nuit » et mime un geste de contrainte ; ses déclarations sont retranscrites mot pour mot.`],
        medical: (X, f) => examen(X, f, { lesion: "ecchymoses des avant-bras" }),
        expertise: (X) => `Expertise psychiatrique de ${X.nf(X.V)} : déficience intellectuelle moyenne ; incapacité à consentir de façon éclairée à un acte sexuel ; ses déclarations sont jugées cohérentes avec son niveau de langage.`,
        temoin: () => ["J'ai trouvé la porte de la chambre fermée à clé, de l'intérieur. Il est sorti, il m'a dit qu'il faisait un change."],
        version: () => ({ nie: "Je n'ai jamais rien fait de tel. Il y a trois veilleurs de nuit.", minimise: "Je faisais une toilette. Il a pu mal comprendre.", reconnait: "J'ai profité de la situation. Je n'ai pas d'excuse." }),
      },
      mineur_famille: {
        w: 2, titre: "les faits intrafamiliaux", lieu: () => "au domicile familial",
        pers: { A: { g: "m", min: 28, max: 60 }, V: { g: "f", mineur: true }, P: "parent" }, ageV: [6, 14],
        imposees: () => ["autorite"],
        procedural: true, photos: false,
        heures: [[18 * 60, 22 * 60]],
        preuves: { medical: 1, expertise: 0.9, temoin: 0.6, saisie: 0.5 },
        enjeux: { penetration: 0.45 },
        mobiles: ["Révélation à l'infirmière scolaire.", "Révélation à sa mère.", "Signalement de l'école au parquet."],
        resume: (X) => `Signalement concernant ${leMin(X)} ${X.ini(X.V)}, ${X.V.age} ans ; ${X.n(X.A)}, ${X.pk(["son beau-père", "son père", "son oncle"])}, est mis en examen pour des faits de nature sexuelle.`,
        scene: (X) => [`Signalement de ${X.pk(["l'infirmière scolaire", "la directrice de l'école", "la mère de l'enfant"])} au parquet des mineurs ; ouverture d'une enquête et placement de la mineure sous la protection du juge des enfants.`],
        victime: (X) => audMineur(X),
        medical: (X) => procMineur(X),
        expertise: (X) => `Expertise psychologique ${X.V.g === "f" ? "de la mineure" : "du mineur"} ${X.ini(X.V)} : retentissement important (troubles du sommeil, régression scolaire) ; aucun élément évocateur d'une suggestion. Expertise psychiatrique de ${X.n(X.A)} : pas d'abolition ni d'altération du discernement.`,
        temoin: (X) => [`Audition du parent qui a recueilli la révélation : il décrit des changements de comportement de l'enfant depuis plusieurs mois et rapporte ses propos, consignés au procès-verbal.`],
        version: () => ({ nie: "Je n'ai jamais rien fait. Sa mère la monte contre moi.", minimise: "Il y a eu des gestes ambigus. Rien de ce qu'elle dit.", reconnait: "Je reconnais les faits. Je demande pardon." }),
        et: { penetration: () => ({ piece: "victime", fort: "Les déclarations enregistrées de l'enfant ne permettent pas d'établir, selon le juge d'instruction lui-même, l'existence d'un acte de pénétration.", faible: "Les déclarations enregistrées de l'enfant, constantes, décrivent des actes que la qualification de viol recouvre." }) },
      },
      mineur_autorite: {
        w: 1.2, titre: "l'entraîneur", lieu: (X) => `au gymnase municipal, ${X.rue}`,
        pers: { A: { g: "m", min: 28, max: 60, metier: "éducateur sportif" }, V: { mineur: true }, P: "parent" }, ageV: [13, 17],
        imposees: () => ["abus_autorite"],
        procedural: true, photos: false,
        heures: [[17 * 60, 21 * 60]],
        preuves: { medical: 1, ecrits: 0.8, telephonie: 0.6, temoin: 0.6 },
        enjeux: { penetration: 0.35 },
        mobiles: ["Révélation à une camarade, qui prévient ses parents.", "Plainte des parents après la lecture de messages.", "Signalement de la fédération sportive."],
        resume: (X) => `${X.n(X.A)}, éducateur sportif, est mis en examen pour des faits de nature sexuelle dénoncés par ${X.V.g === "f" ? "une mineure" : "un mineur"} de son club, ${X.ini(X.V)}, ${X.V.age} ans.`,
        scene: () => ["Plainte des parents au commissariat ; ouverture d'une information ; la fédération suspend l'éducateur."],
        victime: (X) => audMineur(X),
        medical: (X) => procMineur(X),
        ecrits: (X) => [`Messages de ${X.n(X.A)} au mineur, extraits par les enquêteurs : leur contenu est versé au dossier sous scellé ; le procès-verbal relève leur fréquence (plus de 1 200 messages en quatre mois) et des demandes de secret.`],
        temoin: () => ["Audition d'un autre membre du club : il rapporte des entraînements individuels « à part », le soir, et des cadeaux."],
        version: () => ({ nie: "Je n'ai jamais eu de geste déplacé. C'était un lien d'entraîneur.", minimise: "J'ai été trop proche, c'est vrai. Il n'y a rien eu de sexuel.", reconnait: "Je reconnais les faits." }),
      },
    },
  });

  // =================================================================== AGRESSIONS SEXUELLES (délits, instruits)
  C.fiche("agression_sexuelle", {
    fam: "crim_sexuel", nom: "Agression sexuelle", gravite: 0.55, deces: false, crime: false,
    textes: ["CP_222-22", "CP_222-27", "CP_222-28"],
    elements: { legal: "Art. 222-22, 222-27 à 222-30 CP.", materiel: "Une atteinte sexuelle sans pénétration (contact physique sur une partie sexuelle du corps, ou de nature sexuelle).", moral: "Commise avec violence, contrainte, menace ou surprise." },
    prevention: (X) => (X.V.age < 18 ? `commis une atteinte sexuelle avec violence, contrainte, menace ou surprise sur la personne ${X.V.g === "f" ? "de la mineure" : "du mineur"} ${X.ini(X.V)}` : `commis une atteinte sexuelle avec violence, contrainte, menace ou surprise sur la personne de ${X.nf(X.V)}`),
    qual: (f) => qualAS(f),
    requalif: () => null,
    ctxs: {
      transports: {
        w: 2.5, titre: "le métro", lieu: () => "dans une rame de la ligne 4, entre Barbès et Château-Rouge",
        pers: { A: { g: "m", min: 20, max: 65 }, V: { g: "f", min: 18, max: 45 } },
        heures: [[8 * 60, 9 * 60 + 30], [17 * 60, 19 * 60 + 30]],
        preuves: { video: 0.8, temoin: 0.7 },
        enjeux: { identification: 0.6 },
        mobiles: ["L'heure de pointe.", "Une rame bondée après un incident.", "Un retour de soirée."],
        resume: (X) => `${X.n(X.V)} dénonce des attouchements dans une rame bondée ; ${X.n(X.A)} est interpellé à la station suivante.`,
        victime: () => ["J'ai senti une main sur mes fesses, puis entre mes jambes, par-dessus mon pantalon. Au début j'ai cru que c'était la foule. Ça a recommencé.", "Je me suis retournée et j'ai crié. Il a regardé ailleurs."],
        video: () => "Les images de la rame montrent la plaignante se retourner et désigner un homme ; les mains ne sont pas visibles en raison de la densité des voyageurs.",
        temoin: () => ["Elle a crié « c'est lui ». L'homme a voulu sortir, on l'a retenu à la porte."],
        version: () => ({ nie: "Il y avait du monde, on était serrés. Je n'ai rien fait.", minimise: "Ma main a pu la toucher, avec les secousses.", reconnait: "Je l'ai touchée. Je ne sais pas ce qui me prend dans le métro." }),
        et: { identification: () => ({ piece: "video", fort: "Sur les images, trois hommes se tiennent derrière la plaignante au moment des faits ; les mains d'aucun d'eux ne sont visibles.", faible: "Sur les images, le mis en cause est le seul voyageur au contact de la plaignante pendant les deux minutes du trajet." }) },
      },
      travail: {
        w: 2, titre: "le supérieur hiérarchique", lieu: (X) => `dans les locaux d'une entreprise, ${X.rue}`,
        pers: { A: { g: "m", min: 35, max: 62, metier: "directeur commercial" }, V: { g: "f", min: 20, max: 45 } },
        imposees: () => ["abus_autorite"],
        heures: [[9 * 60, 20 * 60]],
        preuves: { temoin: 0.7, ecrits: 0.8 },
        // consentement : ce que voit et sait une collègue, au bureau (D-95)
        et: { consentement: () => ({ piece: "temoin", fort: "« Ils s'entendaient bien, ils déjeunaient souvent ensemble. Elle ne m'a jamais parlé de gestes déplacés. »", faible: "« Elle m'a montré le message qu'elle lui avait écrit après : “arrête de me toucher, je te l'ai déjà dit”. »" }) },
        enjeux: { consentement: 0.5 },
        mobiles: ["Un entretien d'évaluation.", "Une réunion tardive.", "Un séminaire d'entreprise."],
        resume: (X) => `${X.n(X.V)} dénonce des attouchements imposés par son supérieur, ${X.n(X.A)}, dans son bureau ; d'autres salariées témoignent.`,
        victime: () => ["Il a fermé la porte du bureau. Il s'est mis derrière moi et il m'a touché la poitrine, puis il a mis la main sous ma jupe.", "Il a dit : « Ton contrat se termine en juin. »"],
        ecrits: (X) => [`${X.A.prenom} : « tu étais très belle aujourd'hui »`, `${X.A.prenom} : « on parle de ton renouvellement ce soir, 19h, mon bureau »`],
        temoin: () => ["Ça s'est produit avec d'autres. On en parlait entre nous. Personne n'osait aller aux ressources humaines."],
        version: () => ({ nie: "Je n'ai jamais touché cette salariée.", minimise: "Il y avait une relation de séduction réciproque. Je n'ai rien imposé.", reconnait: "J'ai eu des gestes inadmissibles. Je les reconnais." }),
      },
      endormie: {
        w: 2, titre: "la nuit chez un ami", lieu: (X) => `au domicile de ${X.n(X.A)}, ${X.A.adresse}`,
        pers: { A: { g: "m", min: 18, max: 40 }, V: { g: "f", min: 18, max: 35 } }, mineurA: 0.1, ageMinA: 16,
        agg: { ivresse: 0.3 },
        heures: [[2 * 60, 6 * 60]],
        preuves: { temoin: 0.6, ecrits: 0.8 },
        enjeux: { consentement: 0.65 },
        mobiles: ["{VIl} dormait sur le canapé après une soirée.", "{VIl} avait raté le dernier métro.", "{VIl} hébergeait une amie et son copain."],
        resume: (X) => `${X.n(X.V)}, qui dormait chez des amis, se réveille alors que ${X.n(X.A)} la touche ; elle dénonce une agression sexuelle par surprise.`,
        victime: () => ["Je me suis réveillée, il avait la main dans mon short. Je me suis levée d'un coup. Il a fait semblant de dormir."],
        ecrits: (X) => [`${X.V.prenom} : « tu as fait quoi cette nuit ? »`, `${X.A.prenom} : « pardon. j'avais bu. n'en parle à personne »`],
        version: () => ({ nie: "Je dormais. Elle a rêvé.", minimise: "On s'était rapprochés pendant la soirée, je pensais qu'elle était d'accord.", reconnait: "Elle dormait. J'ai profité. J'ai honte." }),
        et: { consentement: (X) => ({ piece: "ecrits", fort: "Les messages échangés pendant la soirée évoquent un flirt réciproque ; aucun message ne mentionne les faits avant la plainte.", faible: `Le lendemain, ${X.A.prenom} écrit : « pardon. j'avais bu. n'en parle à personne ».` }) },
      },
      soin: {
        w: 1.5, titre: "la séance de kinésithérapie", lieu: (X) => `dans le cabinet de ${X.n(X.A)}, ${X.rue}`,
        pers: { A: { g: "m", min: 30, max: 65, metier: "kinésithérapeute" }, V: { g: "f", min: 18, max: 60 } },
        imposees: () => ["abus_autorite"],
        heures: [[9 * 60, 19 * 60]],
        preuves: { expertise: 0.9, temoin: 0.4 },
        enjeux: { geste_medical: 0.75 },
        mobiles: ["Une rééducation du genou.", "Des douleurs lombaires.", "Une rééducation périnéale prescrite après une naissance."],
        resume: (X) => `${X.n(X.V)} dénonce des attouchements de la poitrine pendant une séance de soins ; ${X.n(X.A)} invoque un geste thérapeutique.`,
        victime: () => ["Il massait le dos. Ses mains sont passées sur ma poitrine, plusieurs fois, sans rapport avec la douleur."],
        expertise: () => "Expertise d'un masseur-kinésithérapeute désigné par le juge : discussion du protocole de soins et de la zone traitée, au regard de la prescription.",
        version: () => ({ nie: "Il n'y a eu aucun contact de cette nature.", minimise: "Le protocole impose de travailler la zone thoracique. J'aurais dû mieux expliquer.", reconnait: "Ce geste n'était pas thérapeutique." }),
      },
      rue: {
        w: 2, titre: "l'agression dans la rue", lieu: (X) => `${X.rue}, devant un hall d'immeuble`,
        pers: { A: { g: "m", min: 16, max: 45 }, V: { g: "f", min: 18, max: 60 } }, mineurA: 0.15, ageMinA: 15,
        heures: [[20 * 60, 23 * 60 + 50]],
        preuves: { video: 0.6, telephonie: 0.6, adn: 0.4 },
        enjeux: { identification: 0.75 },
        mobiles: ["{VIl} rentrait du travail à pied.", "{VIl} attendait un taxi.", "{VIl} sortait de la boulangerie."],
        resume: (X) => `${X.n(X.V)} est agressée sexuellement par un homme qui la suit puis la plaque contre un mur ; ${X.n(X.A)} est identifié par la vidéoprotection et la téléphonie.`,
        victime: () => ["Il m'a suivie depuis le métro. Devant l'immeuble, il m'a plaquée contre le mur et il m'a touché les seins et le sexe par-dessus mes vêtements. J'ai hurlé, il est parti en courant."],
        video: () => "Les caméras de la Ville montrent un homme en blouson clair suivre la plaignante sur trois cents mètres ; le visage n'est visible qu'à un instant, de trois quarts.",
        version: () => ({ nie: "Ce n'est pas moi. Des blousons comme ça, il y en a des milliers.", minimise: "Je l'ai abordée, elle m'a repoussé, je suis parti.", reconnait: "C'est moi. Je ne me contrôlais plus." }),
        et: { identification: () => ({ piece: "video", fort: "Sur les images, le visage n'apparaît qu'une seconde, de trois quarts, à vingt mètres ; la plaignante n'a pas reconnu le mis en examen sur planche photographique.", faible: "La plaignante reconnaît formellement le mis en examen sur planche photographique." }) },
      },
      conjoint: {
        w: 1.5, titre: "le conjoint", lieu: (X) => `au domicile du couple, ${X.A.adresse}`,
        pers: { A: { g: "m", min: 22, max: 60 }, V: { g: "f", rel: "conjoint" } },
        imposees: (r) => [ch(r, 0.3) ? "ex_conjoint" : "conjoint"],
        heures: [[20 * 60, 23 * 60 + 50]],
        preuves: { temoin: 0.5, ecrits: 0.7 },
        // consentement : pas de témoin de soirée dans un couple ; les messages du lendemain (D-95)
        et: { consentement: () => ({ piece: "ecrits", fort: "Les messages échangés le lendemain sont affectueux et portent sur la vie du couple ; aucune allusion aux faits.", faible: "Le lendemain, elle écrit : « je t'avais dit non, tu n'as pas arrêté »." }) },
        enjeux: { consentement: 0.6 },
        mobiles: ["Une dispute au moment de la séparation.", "Une soirée alcoolisée.", "{VIl} avait refusé de dormir dans la même chambre."],
        resume: (X) => `${X.n(X.V)} dénonce des attouchements imposés par son conjoint, ${X.n(X.A)}, malgré son refus.`,
        victime: () => ["Il m'a coincée contre le plan de travail. Il m'a touché le sexe par-dessus mon pyjama. Je l'ai repoussé et je me suis enfermée dans la salle de bain."],
        ecrits: (X) => [`${X.A.prenom} : « je ne sais plus ce qui m'a pris hier »`],
        version: () => ({ nie: "Il ne s'est rien passé.", minimise: "C'était un geste de tendresse. Elle a réagi de façon disproportionnée.", reconnait: "Elle m'a dit non. J'ai continué. Je le reconnais." }),
      },
      boite: {
        w: 1.5, titre: "la boîte de nuit", lieu: () => "dans une boîte de nuit, boulevard de Clichy",
        pers: { A: { g: "m", min: 18, max: 40 }, V: { g: "f", min: 18, max: 30 } }, mineurA: 0.08, ageMinA: 16,
        agg: { ivresse: 0.4, reunion: 0.15 },
        heures: [[1 * 60, 5 * 60]],
        preuves: { video: 0.6, temoin: 0.8 },
        enjeux: { identification: 0.5, consentement: 0.3 },
        mobiles: ["Une piste de danse bondée.", "Un passage étroit vers le vestiaire.", "Une file d'attente aux toilettes."],
        resume: (X) => `Dans une boîte de nuit, ${X.n(X.V)} est saisie par un homme qui lui impose des attouchements ; les agents de sécurité retiennent ${X.n(X.A)}.`,
        victime: () => ["Il m'a attrapée par la taille sur la piste, il a mis sa main entre mes jambes. Je l'ai giflé, il a ri."],
        temoin: () => ["Je l'ai vue le gifler. Lui riait. On l'a sorti, il disait qu'elle l'avait chauffé."],
        version: () => ({ nie: "Je dansais, c'est tout.", minimise: "On dansait collés. Je pensais que ça lui plaisait.", reconnait: "Je l'ai touchée. J'avais trop bu." }),
      },
      mineur_club: {
        w: 1.2, titre: "le club", lieu: () => "dans les vestiaires d'un club sportif",
        pers: { A: { g: "m", min: 22, max: 60, metier: "bénévole du club" }, V: { mineur: true }, P: "parent" }, ageV: [10, 16],
        imposees: () => ["abus_autorite"],
        procedural: true, photos: false,
        heures: [[17 * 60, 20 * 60]],
        preuves: { medical: 1, temoin: 0.6, ecrits: 0.6 },
        enjeux: { identification: 0.3 },
        mobiles: ["Révélation à un camarade.", "Signalement d'un parent.", "Signalement du club."],
        resume: (X) => `${X.n(X.A)}, bénévole d'un club sportif, est mis en examen pour des faits d'agression sexuelle dénoncés par un mineur du club, ${X.ini(X.V)}, ${X.V.age} ans.`,
        scene: () => ["Plainte des parents ; ouverture d'une information ; suspension du bénévole par le club."],
        victime: (X) => audMineur(X),
        medical: (X) => procMineur(X),
        temoin: () => ["Audition d'un autre bénévole : il relate que le mis en cause restait seul dans les vestiaires après les entraînements, malgré la règle du club."],
        version: () => ({ nie: "Il n'y a jamais rien eu. Je ne suis jamais seul avec un enfant.", minimise: "J'ai pu avoir des gestes mal compris.", reconnait: "Je reconnais les faits." }),
        et: { identification: () => ({ piece: "temoin", fort: "Le planning du club montre que trois adultes encadraient le groupe ce soir-là.", faible: "Le planning du club montre que le mis en examen était le seul adulte présent." }) },
      },
    },
  });
})();
