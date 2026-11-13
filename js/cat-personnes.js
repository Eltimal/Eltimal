/* La Permanence — catalogue : atteintes aux personnes et à l'autorité.
   Chaque fiche : textes, éléments constitutifs, procédures et preuves typiques, tirage des faits (tirer), qualification (qual),
   requalification possible (requalif) et récit (recit) : les mots des procès-verbaux, à partir des personnes tirées (X).
   Peines et articles : rédigés hors ligne, à revérifier sur Légifrance. */
(function () {
  const CR = window.CR;
  const CAT = CR.CAT;
  const { pk, int, ch } = CAT;

  const BARS = ["Le Balto", "Le Ramey", "Chez Paulette", "Le Saint-Pierre", "L'Été en pente douce", "Le Royal Barbès", "Le Marcadet", "La Mascotte", "Le Clignancourt", "Le Soleil de Montmartre"];
  const STATIONS = [["Barbès-Rochechouart", "2 et 4"], ["Château-Rouge", "4"], ["Marx-Dormoy", "12"], ["Jules-Joffrin", "12"], ["Porte de Clignancourt", "4"], ["La Chapelle", "2"], ["Marcadet-Poissonniers", "4 et 12"], ["Simplon", "4"], ["Lamarck-Caulaincourt", "12"], ["Anvers", "2"]];
  const LESIONS = {
    0: ["une rougeur de la pommette gauche", "des griffures superficielles du cou", "une ecchymose de l'avant-bras droit", "une dermabrasion du coude"],
    1: ["une plaie de l'arcade sourcilière droite, suturée par trois points", "une contusion nasale avec épistaxis", "un hématome péri-orbitaire gauche", "une entorse bénigne du poignet droit", "une plaie de la lèvre inférieure, deux points de suture", "des contusions multiples du thorax et du dos"],
    2: ["une fracture des os propres du nez, déplacée", "une fracture de la branche montante de la mandibule", "une fracture de deux côtes à droite", "une plaie de l'avant-bras gauche de huit centimètres, suturée par douze points", "une fracture du plancher de l'orbite droite", "une fracture du cinquième métacarpien droit", "une luxation de l'épaule gauche"],
  };
  const lesions = (r, itt) => { const L = LESIONS[itt === 0 ? 0 : itt <= 8 ? 1 : 2]; const a = pk(r, L); const b = pk(r, L.concat(LESIONS[itt <= 8 ? 0 : 1])); return a === b ? [a] : [a, b]; };
  const ARMES = ["une bouteille de bière", "une ceinture à boucle métallique", "un casque de scooter", "un couteau de cuisine", "une barre de fer", "un tesson de bouteille", "un cutter", "une matraque télescopique"];
  const ittTexte = (itt) => (itt > 8 ? `une incapacité totale de travail de ${itt} jours` : itt ? `une incapacité totale de travail de ${itt} jour${itt > 1 ? "s" : ""}` : "aucune incapacité totale de travail");
  const coups = (r, arme, e) => pk(r, arme ? [`m'a frappé${e} avec ${arme}`, `m'a donné un coup avec ${arme}`, `s'est jeté${e === "e" ? "e" : ""} sur moi avec ${arme}`] : ["m'a mis un coup de poing au visage", "m'a donné plusieurs coups de poing", "m'a mis un coup de tête", `m'a poussé${e} violemment, puis m'a donné des coups de pied`, `m'a attrapé${e} par le col et m'a frappé${e}`]);
  // une lésion telle que la voient les policiers, sans le détail médical
  const vue = (l) => String(l).replace(/,\s*(suturée|deux points|déplacée|opérée)[^;]*$/, "");

  // =================================================================== VIOLENCES VOLONTAIRES (graduées selon l'ITT)
  CAT.def("violences", {
    fam: "personnes", nom: "Violences volontaires", violences: true, gravite: 0.45, victime: "personne", recidive5: true,
    textes: ["CP_222-11", "CP_222-12", "CP_222-13", "CP_R625-1", "CP_R624-1"],
    elements: { legal: "Art. 222-11 à 222-13 CP ; R. 624-1 et R. 625-1 CP pour les violences sans circonstance d'au plus huit jours d'ITT.", materiel: "Un acte de violence, physique ou psychique, sur la personne d'autrui ; un résultat mesuré par l'ITT fixée par un médecin.", moral: "La volonté de commettre l'acte ; peu importe que le résultat ait été voulu." },
    mesures: { gav: 0.7, al: 0.22, convocation: 0.08 }, flagrance: 0.72,
    voies: { classement: 0.08, alternative: 0.22, copj: 0.4, ci: 0.28, crpc: 0.14 },
    preuves: { constat: 0.55, certificat: 1, temoin: 0.55, video: 0.35, aveux: 0.45, telephonie: 0.03 },
    camera: 0.5, irr: ["controle_identite", "heures"],
    controle: (f) => ["bar", "rue", "transport"].includes(f.sc),
    flagranceDe: (f) => ({ bar: 0.85, rue: 0.8, transport: 0.85, voisinage: 0.45, circulation: 0.6, travail: 0.3, file: 0.7, sport: 0.5 })[f.sc],
    tirer(r) {
      const sc = pk(r, ["bar", "bar", "rue", "transport", "voisinage", "circulation", "travail", "file", "sport"]);
      const res = { reunion: 0.22, ivresse: sc === "bar" ? 0.45 : 0.12, arme: 0.16, dissimulation: 0.03, premeditation: 0.03 };
      if (sc === "transport") res.transport = 0.85;
      const agg = CAT.tirerAgg(r, res, 2);
      if (sc === "voisinage" && ch(r, 0.15)) agg.length < 2 && agg.push("vulnerable");
      const itt = CAT.itt(r, 0.15, 0.55, 0.3, 30);
      return { sc, agg, itt, arme: agg.includes("arme") ? pk(r, ARMES) : null, mobile: int(r, 0, 5) };
    },
    qual: (f) => CAT.qualViolences(f),
    // L'ITT des urgences (retenue par la prévention) et celle de l'UMJ divergent : la défense peut obtenir une requalification
    requalif(r, f) {
      if (f.itt > 8 && f.itt <= 15 && ch(r, 0.45)) return { f2: Object.assign({}, f, { itt: int(r, 4, 8) }), quoi: "itt" };
      if (f.agg.includes("reunion") && ch(r, 0.25)) return { f2: Object.assign({}, f, { agg: f.agg.filter((a) => a !== "reunion") }), quoi: "reunion" };
      return null;
    },
    comp: (q) => (q.aggs.includes("arme") ? ["interdiction de détenir ou de porter une arme soumise à autorisation pendant cinq ans"] : []),
    recit(X, f) {
      const { A, V, r } = X;
      const lieu = {
        bar: `devant le bar « ${pk(r, BARS)} », ${X.rue}`, rue: `${X.rue}, à hauteur du numéro ${int(r, 2, 80)}`,
        transport: (() => { const [st, l] = pk(r, STATIONS); return `sur le quai de la station ${st} (ligne${l.includes(" ") ? "s" : ""} ${l})`; })(),
        voisinage: `dans le hall de l'immeuble du ${int(r, 2, 90)}, ${X.rue}`, circulation: `au carrefour de la ${X.rue} et du boulevard Barbès`,
        travail: `dans la réserve du magasin où ${X.il(A)} travaillait, ${X.rue}`, file: `dans la file d'attente de la boulangerie du ${int(r, 2, 90)}, ${X.rue}`,
        sport: `sur le terrain de football du square Léon, ${X.rue}`,
      }[f.sc];
      const mob = {
        bar: [`${X.Il(V)} a renversé sa bière sur ${X.lui(A)}`, `${X.Il(V)} aurait regardé l'amie de ${X.n(A)}`, "Une histoire de cigarette refusée", "Une dispute sur l'addition", "Un mot de trop sur le trottoir", "Une bousculade en sortant"],
        rue: ["Un regard, puis des insultes", "Une trottinette mal garée", "Un téléphone qu'on accusait l'autre d'avoir pris", "Une vieille dette de 200 euros", "Un chien sans laisse", "Une remarque sur une cigarette jetée"],
        transport: ["Une place assise", "Une bousculade à la fermeture des portes", "Une musique trop forte", "Une remarque sur un masque", "Un sac posé sur un siège", "Un regard insistant"],
        voisinage: ["Le bruit, encore, à deux heures du matin", "Une fuite d'eau jamais réparée", "Des poubelles déposées sur le palier", "Une place de parking dans la cour", "Un chien qui aboie", "Des travaux le dimanche"],
        circulation: ["Un refus de priorité", "Un coup de klaxon", "Un rétroviseur arraché", "Une place de livraison", "Un dépassement par la droite", "Un piéton frôlé"],
        travail: ["Un planning modifié", "Une accusation de vol de pourboires", "Des retards répétés", "Un reproche devant les clients", "Une prime refusée", "Une histoire de vestiaire"],
        file: ["Quelqu'un est passé devant", "Une poussette dans le passage", "Un mot sur l'accent", "Une monnaie mal rendue", "Un coup de coude", "Une remarque sur le téléphone"],
        sport: ["Un tacle par derrière", "Un but contesté", "Une insulte sur le terrain", "Une équipe qui refusait de sortir", "Un ballon envoyé sur le banc", "Un carton imaginaire"],
      }[f.sc][f.mobile];
      const les = lesions(r, f.itt);
      const ins = X.lex(V.g === "f" ? "ins_f" : "ins_m");
      const co = coups(r, f.arme, X.e(V));
      const plural = f.agg.includes("reunion");
      const second = plural ? `${pk(r, ["un autre homme", "un de ses amis", "un homme qui l'accompagnait"])}` : null;
      return {
        titre: { bar: "la bagarre à la sortie du bar", rue: "l'altercation dans la rue", transport: "la bagarre dans le métro", voisinage: "la dispute entre voisins", circulation: "l'altercation au carrefour", travail: "la bagarre au travail", file: "la dispute dans la file d'attente", sport: "la bagarre du match" }[f.sc],
        lieu, lesions: les, itt: f.itt, arme: f.arme,
        resume: `${mob} ; ${X.n(A)} est mis${X.e(A)} en cause pour des coups portés à ${X.nf(V)}${plural ? ", avec un second homme" : ""}${f.arme ? `, avec ${f.arme}` : ""}.`,
        constat: [
          `Requis par ${pk(r, ["le centre d'information et de commandement", "un appel au 17", "un passant"])} pour une rixe ${lieu}.`,
          `Sur place, constatons la présence de ${X.nf(V)}, ${V.age} ans, présentant ${vue(les[0])}. ${X.Il(V)} désigne ${plural ? "deux individus" : "un individu"} qui s'éloigne${plural ? "nt" : ""} en direction du boulevard${f.arme ? `, l'un d'eux tenant ${f.arme}` : ""}.`,
          `Rattrapé${X.e(A)} à une centaine de mètres, ${X.n(A)} ${f.agg.includes("ivresse") ? "présente une haleine fortement alcoolisée, des propos incohérents, une démarche titubante" : "est calme et coopérant" + X.e(A)}.`,
        ],
        plainte: [
          `${mob}. ${X.Il(A)} s'est approché${X.e(A)} et m'a dit : « ${CR.cap(ins)}, qu'est-ce que tu regardes ? ${CR.cap(X.lex("menace"))}. »`,
          `Ensuite ${X.il(A)} ${co}.${plural ? ` ${CR.cap(second)} m'a tenu par les bras pendant ce temps-là.` : ""} Je suis tombé${X.e(V)} par terre.`,
          `J'ai eu ${les.join(" et ")}. ${f.itt ? `Aux urgences de Lariboisière, on m'a donné ${f.itt} jours d'arrêt.` : "Je n'ai pas eu d'arrêt."}`,
          `Je dépose plainte. Je veux que ça s'arrête là, mais je veux qu'${X.il(A)} soit puni${X.e(A)}.`,
        ],
        temoin: [
          `J'étais ${f.sc === "transport" ? "sur le quai" : f.sc === "bar" ? "en terrasse" : "à côté"}. Il y a eu des cris, des insultes des deux côtés.`,
          plural ? "Ils étaient deux contre un. Le plus grand a frappé au visage, l'autre tenait la victime." : `${A.g === "f" ? "La femme" : "Le garçon"} en ${pk(r, ["survêtement noir", "doudoune bleue", "veste en jean", "sweat gris"])} a frappé ${A.g === "f" ? "la première" : "le premier"}, une fois, fort. L'autre n'a pas eu le temps de réagir.`,
          "Je ne connais aucun des deux.",
        ],
        version: {
          nie: `C'est ${X.lui(V)} qui m'a cherché${X.e(A)}. Je l'ai juste repoussé${X.e(V)}, je l'ai jamais frappé${X.e(V)}. ${X.Il(V)} est tombé${X.e(V)} tout${X.e(V) ? "e" : ""} seul${X.e(V)}.`,
          minimise: `${mob}. ${X.Il(V)} m'a insulté${X.e(A)}, ma mère, tout. J'ai mis une gifle, une seule. Je voulais pas ${f.itt > 8 ? "lui casser quoi que ce soit" : "lui faire mal"}.`,
          reconnait: `Oui, j'ai frappé. J'avais bu, j'ai pété les plombs. Je regrette, je voudrais m'excuser auprès de ${X.lui(V)}.`,
        },
        audition: [
          { q: `Avez-vous frappé ${X.nf(V)} ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je reconnais un geste. Un seul." } },
          { q: `${X.Il(V)} a ${les[0]}. Comment l'expliquez-vous ?`, a: { silence: "…", expliquer: f.arme ? `C'est pas moi qui avais ${f.arme}.` : "Je sais pas. Peut-être en tombant.", partiel: "Je n'ai rien à ajouter." } },
          { q: f.agg.includes("ivresse") ? "Combien de verres aviez-vous bus ?" : "Connaissiez-vous la victime ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: f.agg.includes("ivresse") ? "Cinq ou six bières. Peut-être plus." : "Jamais vu avant.", partiel: "Non." } },
        ],
        prevention: `volontairement commis des violences sur ${X.nf(V)}, ayant entraîné ${ittTexte(f.itt)}`,
        prejudice: [
          { id: "dft", label: `Souffrances endurées et déficit fonctionnel temporaire (${les[0]})`, demande: 400 + f.itt * 120, base: 300 + f.itt * 100 },
          { id: "moral", label: "Préjudice moral", demande: 800, base: 500 },
        ].concat(f.itt > 8 && X.travaille(V) ? [{ id: "salaire", label: "Perte de salaire pendant l'arrêt de travail", demande: f.itt * 70, base: f.itt * 65, piece: "attestation_salaire" }] : []),
        qA: [{ q: `${X.Il(V)} vous a provoqué${X.e(A)} ?`, a: [`${mob}. ${X.Il(V)} m'a insulté${X.e(A)} en premier, devant tout le monde.`] }, { q: "Vous aviez bu ?", a: [f.agg.includes("ivresse") ? "Oui, pas mal. Je le reconnais." : "Deux verres, pas plus."] }],
        qV: [{ q: "Vous avez vu un médecin ?", a: [f.itt ? `Les urgences, puis l'UMJ. ${f.itt} jours d'ITT.` : "Mon généraliste, le lendemain. Il n'a pas mis d'arrêt."] }],
      };
    },
  });

  // =================================================================== VIOLENCES CONJUGALES
  CAT.def("violences_conj", {
    fam: "personnes", nom: "Violences conjugales", violences: true, gravite: 0.6, victime: "personne", conjugal: true, pasCI: false,
    textes: ["CP_222-11", "CP_222-12", "CP_222-13", "CP_132-80"],
    elements: { legal: "Art. 222-11 à 222-13 CP, circonstance tenant à la qualité de conjoint, concubin ou partenaire, y compris ancien (art. 132-80 CP).", materiel: "Des violences, physiques ou psychiques, sur le conjoint ou l'ancien conjoint ; l'ITT fixe la peine.", moral: "La volonté de l'acte." },
    mesures: { gav: 0.88, al: 0.1, convocation: 0.02 }, flagrance: 0.6,
    voies: { classement: 0.04, alternative: 0.1, copj: 0.32, ci: 0.42, crpc: 0.12 },
    preuves: { constat: 0.6, certificat: 1, temoin: 0.35, ecrits: 0.35, aveux: 0.4, telephonie: 0.1 },
    camera: 0, irr: ["heures"],
    tirer(r) {
      const ex = ch(r, 0.3);
      const agg = CAT.tirerAgg(r, { mineur_present: 0.38, ivresse: 0.28, arme: 0.1 }, 3, [ex ? "ex_conjoint" : "conjoint"]);
      const itt = CAT.itt(r, 0.18, 0.6, 0.22, 21);
      return { sc: ex ? "ex" : pk(r, ["domicile", "domicile", "voiture", "rue"]), agg, itt, arme: agg.includes("arme") ? pk(r, ["un couteau de cuisine", "une poêle", "une ceinture", "un câble de chargeur"]) : null, mobile: int(r, 0, 5), mains: ch(r, 0.4), anciennete: int(r, 1, 14) };
    },
    qual: (f) => CAT.qualViolences(f),
    requalif(r, f) { return f.itt > 8 && f.itt <= 12 && ch(r, 0.35) ? { f2: Object.assign({}, f, { itt: int(r, 3, 8) }), quoi: "itt" } : null; },
    comp: (q, c) => ["interdiction d'entrer en contact avec la victime et de paraître à son domicile pendant trois ans", "stage de responsabilisation pour la prévention et la lutte contre les violences au sein du couple"],
    recit(X, f) {
      const { A, V, r } = X;
      const amis = X.travaille(V) ? "collègues" : "amies";
      const mob = ["Il a vu un message sur mon téléphone", "Une dispute sur l'argent, encore", "Je lui ai dit que je voulais partir", "Il est rentré ivre à trois heures du matin", `Il n'a pas supporté que je sorte avec mes ${amis}`, "Une dispute sur la garde des enfants"][f.mobile];
      const mob3 = ["Après avoir lu un message sur son téléphone", "Au cours d'une dispute sur l'argent", "Alors qu'elle lui annonçait vouloir partir", "Rentré ivre à trois heures du matin", `Furieux qu'elle soit sortie avec ses ${amis}`, "Au cours d'une dispute sur la garde des enfants"][f.mobile];
      const les = lesions(r, f.itt);
      const mp = f.agg.includes("mineur_present");
      // l'enfant présent : un âge possible pour sa mère, un nombre qui suit la fiche
      const enfant = ((e) => (e === "les deux petits" && !(V.enfants > 1) ? "notre fille de quatre ans" : V.age < 24 ? "notre fils de deux ans" : V.age < 28 && /six|neuf/.test(e) ? "notre fille de quatre ans" : e))(pk(r, ["notre fils de six ans", "ma fille de neuf ans", "les deux petits", "notre fille de quatre ans"]));
      const ilE = /fille/.test(enfant) ? "Elle" : /deux/.test(enfant) ? "Ils" : "Il";
      const enfant3 = enfant.replace(/^(mon|ma|notre|les)\b/, (m) => ({ mon: "son", ma: "sa", notre: "leur", les: "leurs" })[m]);
      const lieu = f.sc === "voiture" ? `dans le véhicule du couple stationné ${X.rue}` : f.sc === "rue" ? `sur le trottoir devant le ${int(r, 2, 90)}, ${X.rue}` : `au domicile ${f.sc === "ex" ? "de " + X.nf(V) : "du couple"}, ${int(r, 2, 90)}, ${X.rue}, ${int(r, 1, 6)}e étage`;
      const ins = X.lex(V.g === "f" ? "ins_f" : "ins_m");
      return {
        titre: f.sc === "ex" ? "les violences sur l'ex-compagne" : "les violences au domicile",
        lieu, lesions: les, itt: f.itt, arme: f.arme,
        resume: `${mob3}, ${X.n(A)} aurait frappé ${f.sc === "ex" ? "son ancienne compagne" : "sa compagne"}, ${X.nf(V)}${mp ? ", devant " + enfant.replace(/^(mon|ma|notre|les)\b/, (m) => ({ mon: "son", ma: "sa", notre: "leur", les: "leurs" })[m]) : ""}.`,
        constat: [
          `Requis à ${X.h(X.hf)} par ${pk(r, ["un appel de voisins au 17 signalant des cris", "un appel de la victime au 17", "le 17, après un appel d'un enfant"])}, ${lieu}.`,
          f.sc === "voiture" || f.sc === "rue" ? `${X.nf(V)}, en pleurs, vient à notre rencontre ; ${vue(les[0])} est visible. ${mp ? CR.cap(enfant3) + " est à l'arrière du véhicule." : ""}` : `${X.nf(V)} nous ouvre en pleurs ; ${vue(les[0])} est visible. ${mp ? CR.cap(enfant3) + " se tient dans le couloir, en pyjama." : "Elle est seule avec l'auteur désigné."}`,
          `${X.n(A)} est présent, ${f.agg.includes("ivresse") ? "dans un état d'ivresse manifeste" : "calme"} ; ${X.il(A)} déclare : « Elle s'est cognée, c'est tout. »`,
        ],
        plainte: [
          f.sc === "ex" ? `On a vécu ensemble ${f.anciennete} an${f.anciennete > 1 ? "s" : ""}. On est séparés depuis trois mois. Il vient quand même. ${mob}.` : `On est ensemble depuis ${f.anciennete} an${f.anciennete > 1 ? "s" : ""}. ${mob}.`,
          `Il m'a traitée de « ${ins} ». Il m'a attrapée par les cheveux${f.mains ? ", il m'a serré le cou avec ses deux mains, je n'arrivais plus à respirer" : ""}${f.arme ? `, il a pris ${f.arme}` : ""} et il m'a frappée${f.itt > 8 ? " plusieurs fois, au visage et dans les côtes" : " au visage"}.`,
          mp ? `${CR.cap(enfant)} ${ilE === "Ils" ? "ont" : "a"} tout vu. ${ilE} ${ilE === "Ils" ? "criaient" : "criait"} « Arrête papa ».` : "Personne n'a vu, mais les voisins ont entendu.",
          "Ce n'est pas la première fois. J'ai déjà fait une main courante l'an dernier. J'ai peur de rentrer chez moi.",
        ],
        temoin: [`J'habite en dessous. J'ai entendu des cris, un choc contre le mur, une femme qui disait « Arrête, tu me fais mal ».`, "Ça arrive souvent, mais cette fois c'était plus fort. J'ai appelé la police."],
        version: {
          nie: "Je l'ai jamais touchée. Elle s'est cognée contre la porte en partant. Elle veut le logement, c'est tout.",
          minimise: "On s'est disputés, elle m'a griffé, je l'ai repoussée. Elle est tombée contre le meuble. J'ai pas frappé.",
          reconnait: "Je l'ai frappée. J'avais bu. Je sais que c'est pas excusable. Je veux me soigner.",
        },
        audition: [
          { q: `Avez-vous frappé ${X.nf(V)} ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je l'ai repoussée." } },
          f.mains ? { q: "Elle dit que vous lui avez serré le cou. Est-ce vrai ?", a: { silence: "…", expliquer: "Non ! Je l'ai tenue par les épaules pour qu'elle se calme.", partiel: "Je ne l'ai pas étranglée." } } : { q: "Elle parle d'une main courante l'an dernier. Que s'était-il passé ?", a: { silence: "…", expliquer: "Une dispute. Rien de plus.", partiel: "Rien." } },
          { q: mp ? "Votre enfant était présent ?" : "Combien aviez-vous bu ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: mp ? `${ilE} ${ilE === "Ils" ? "dormaient" : "dormait"}. Enfin, je croyais.` : "Quelques bières.", partiel: "Je ne sais pas." } },
        ],
        prevention: `volontairement commis des violences sur ${X.nf(V)}, ayant entraîné ${ittTexte(f.itt)}`,
        prejudice: [
          { id: "dft", label: `Souffrances endurées (${les[0]})`, demande: 600 + f.itt * 150, base: 500 + f.itt * 120 },
          { id: "moral", label: "Préjudice moral (la peur, au domicile)", demande: 2500, base: 1500 },
        ],
        qA: [{ q: "Ça s'était déjà produit ?", a: ["On se disputait. Jamais comme ça."] }, { q: "Où pouvez-vous aller ce soir, si on vous interdit le domicile ?", a: [pk(r, ["Chez ma mère, à Saint-Denis.", "Chez mon frère, à Aubervilliers.", "Je sais pas. Un hôtel, peut-être."])] }],
        qV: [{ q: "Vous êtes en sécurité ce soir ?", a: ["Je suis chez ma sœur. Je n'ose pas rentrer."] }],
      };
    },
  });

  // =================================================================== VIOLENCES SUR PERSONNE DÉPOSITAIRE DE L'AUTORITÉ PUBLIQUE
  CAT.def("violences_pdap", {
    fam: "autorite", nom: "Violences sur personne dépositaire de l'autorité publique", violences: true, gravite: 0.5, victime: "agent",
    textes: ["CP_222-13", "CP_222-12"],
    elements: { legal: "Art. 222-12 et 222-13 CP (victime dépositaire de l'autorité publique ou chargée d'une mission de service public).", materiel: "Des violences sur l'agent, dans l'exercice ou du fait de ses fonctions.", moral: "La volonté de l'acte, et la connaissance de la qualité de la victime (uniforme, brassard, carte)." },
    mesures: { gav: 1, al: 0, convocation: 0 }, flagrance: 1,
    voies: { classement: 0.04, alternative: 0.06, copj: 0.35, ci: 0.45, crpc: 0.15 },
    preuves: { constat: 1, certificat: 1, temoin: 0.3, video: 0.4, aveux: 0.3 },
    camera: 0.45, irr: ["controle_identite", "heures"],
    tirer(r) {
      const sc = pk(r, ["controle", "controle", "interpellation", "transport", "commissariat"]);
      const agg = CAT.tirerAgg(r, { ivresse: 0.3, reunion: 0.15, arme: 0.06 }, 3, [sc === "transport" ? "msp" : "pdap"]);
      return { sc, agg, itt: CAT.itt(r, 0.3, 0.6, 0.1, 15), mobile: int(r, 0, 3) };
    },
    qual: (f) => CAT.qualViolences(f),
    requalif(r, f) { return f.itt > 0 && f.itt <= 8 && ch(r, 0.2) ? { f2: Object.assign({}, f, { itt: 0 }), quoi: "itt" } : null; },
    comp: () => [],
    recit(X, f) {
      const { A, V, r } = X;
      const agent = f.sc === "transport" ? `${X.nf(V)}, agent de contrôle de la RATP,` : `${V.g === "f" ? "la gardienne" : "le gardien"} de la paix ${V.prenom} ${V.nom}`;
      const les = lesions(r, f.itt);
      const motif = f.sc === "transport" ? "un contrôle des titres de transport" : f.sc === "commissariat" ? "une fouille de sécurité" : pk(r, ["un contrôle d'identité", "une verbalisation pour stationnement", "un contrôle routier", "une intervention pour tapage"]);
      const lieu = f.sc === "transport" ? (() => { const [st] = pk(r, STATIONS); return `dans le couloir de correspondance de la station ${st}`; })() : f.sc === "commissariat" ? `dans les locaux du ${X.commCourt}, au moment de la fouille` : `${X.rue}, à hauteur du numéro ${int(r, 2, 80)}`;
      return {
        titre: f.sc === "transport" ? "le contrôleur frappé" : "le policier blessé",
        lieu, lesions: les, itt: f.itt,
        resume: `Lors d'${motif}, ${X.n(A)} aurait frappé ${agent.replace(/,$/, "")}.`,
        constat: [
          `${CR.cap(lieu)}, procédons à ${motif} de ${X.n(A)}.`,
          `L'intéressé${X.e(A)} refuse ${f.sc === "transport" ? "de présenter son titre de transport" : f.sc === "commissariat" ? "de vider ses poches" : "de présenter une pièce d'identité"}, devient véhément${X.e(A)} : « ${CR.cap(X.lex("ins_flic"))} ! »`,
          `Au moment où ${agent} lui saisit le bras, ${X.n(A)} lui porte ${pk(r, ["un coup de poing au visage", "un coup de coude au thorax", "un coup de pied dans le genou", "une gifle"])}. ${CR.cap(agent.replace(/,$/, ""))}${f.sc === "transport" ? "," : ""} présente ${vue(les[0])}.`,
          "Maîtrisé au sol ; menottage ; conduite au commissariat.",
        ],
        plainte: [`J'étais en tenue, brassard visible. ${motif === "un contrôle d'identité" ? "J'ai demandé ses papiers." : "J'ai demandé le titre de transport."} ${X.Il(A)} m'a insulté${X.e(V)}, puis ${X.il(A)} m'a frappé${X.e(V)}. ${f.itt ? `Le médecin m'a donné ${f.itt} jours d'ITT.` : "Pas d'arrêt."}`, "Je dépose plainte et je me constitue partie civile."],
        temoin: [`Il y avait une dispute, les agents l'ont attrapé${X.e(A)}, ça a été très vite.`, pk(r, [`Je n'ai pas vu de coup, ${X.il(A)} se débattait.`, `${X.Il(A)} a donné un coup, oui, au visage de l'agent.`, `C'est l'agent qui l'a plaqué${X.e(A)} en premier, je crois.`])],
        version: {
          nie: "Ils m'ont sauté dessus sans raison. J'ai rien frappé, j'ai juste essayé de me protéger.",
          minimise: `${X.Il(V)} m'a tordu le bras, j'ai eu mal, j'ai fait un mouvement. C'était pas pour ${V.g === "f" ? "la" : "le"} frapper.`,
          reconnait: `J'ai mis un coup, j'étais énervé${X.e(A)}, j'avais bu. Je m'excuse auprès de ${X.lui(V)}.`,
        },
        audition: [
          { q: "Pourquoi avez-vous refusé le contrôle ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: "Je me fais contrôler trois fois par semaine. J'en ai marre.", partiel: `J'étais énervé${X.e(A)}.` } },
          { q: `Avez-vous frappé ${agent} ?`, a: { silence: "…", expliquer: null, partiel: "Je n'ai pas voulu le frapper." } },
        ],
        prevention: `volontairement commis des violences sur ${agent.replace(/,$/, "")}, ${f.sc === "transport" ? "personne chargée d'une mission de service public" : "personne dépositaire de l'autorité publique"}, ayant entraîné ${ittTexte(f.itt)}`,
        prejudice: [{ id: "moral", label: "Préjudice moral de l'agent", demande: 600, base: 400 }],
        qA: [{ q: "Pourquoi le contrôle a-t-il dégénéré ?", a: [`Ils m'ont parlé mal. Je me suis énervé${X.e(A)}. C'est vrai.`] }],
      };
    },
  });

  // =================================================================== HARCÈLEMENT MORAL (voisinage, couple, travail)
  CAT.def("harcelement_moral", {
    fam: "personnes", nom: "Harcèlement moral", gravite: 0.4, victime: "personne", pasCI: true,
    textes: ["CP_222-33-2-2", "CP_222-33-2-1", "CP_222-33-2"],
    elements: { legal: "Art. 222-33-2-2 CP (harcèlement de droit commun) ; 222-33-2-1 (au sein du couple) ; 222-33-2 (au travail).", materiel: "Des propos ou comportements répétés, ayant pour objet ou pour effet une dégradation des conditions de vie (ou de travail) ; une altération de la santé pour le droit commun et le couple.", moral: "La conscience de harceler : l'intention se déduit de la répétition." },
    mesures: { gav: 0.3, al: 0.6, convocation: 0.1 }, flagrance: 0.05,
    voies: { classement: 0.15, alternative: 0.25, copj: 0.45, ci: 0.03, crpc: 0.12 },
    preuves: { plainte: 1, ecrits: 0.85, temoin: 0.45, certificat: 0.7, telephonie: 0.3, aveux: 0.3 },
    camera: 0, irr: ["al_quitter"],
    tirer(r) {
      const sc = pk(r, ["voisinage", "couple", "couple", "travail"]);
      const agg = sc === "couple" ? CAT.tirerAgg(r, { mineur_present: 0.25 }, 2, [ch(r, 0.7) ? "ex_conjoint" : "conjoint"]) : CAT.tirerAgg(r, { en_ligne: 0.3, vulnerable: sc === "voisinage" ? 0.2 : 0 }, 2);
      return { sc, agg, itt: CAT.itt(r, 0.45, 0.4, 0.15, 30), duree: int(r, 2, 14), nb: int(r, 25, 300) };
    },
    qual(f) {
      const itt8 = f.itt > 8;
      if (f.sc === "travail") return CAT.delit(24, 30000, "art. 222-33-2 CP", "harcèlement moral au travail", { textes: ["CP_222-33-2"] });
      if (f.sc === "couple") {
        const lourd = itt8 || f.agg.includes("mineur_present");
        return CAT.delit(lourd ? 60 : 36, lourd ? 75000 : 45000, "art. 222-33-2-1 CP", `harcèlement ${f.agg.includes("ex_conjoint") ? "de son ancien conjoint ou concubin" : "de son conjoint ou concubin"}${itt8 ? " ayant entraîné une incapacité totale de travail de plus de huit jours" : ""}${f.agg.includes("mineur_present") ? ", en présence d'un mineur" : ""}`, { textes: ["CP_222-33-2-1"], aggs: f.agg });
      }
      const n = f.agg.length + (itt8 ? 1 : 0);
      const [prison, amende] = CAT.palier([[12, 15000], [24, 30000], [36, 45000]], n);
      return CAT.delit(prison, amende, "art. 222-33-2-2 CP", `harcèlement moral${itt8 ? " ayant entraîné une incapacité totale de travail de plus de huit jours" : ""}${f.agg.length ? ", " + f.agg.map(CAT.aggLabel).join(", ") : ""}`, { textes: ["CP_222-33-2-2"], aggs: f.agg.concat(itt8 ? ["itt8"] : []) });
    },
    requalif(r, f) { return f.itt > 8 && f.sc !== "travail" && ch(r, 0.3) ? { f2: Object.assign({}, f, { itt: int(r, 0, 8) }), quoi: "itt" } : null; },
    comp: (q) => ["interdiction d'entrer en contact avec la victime pendant trois ans"],
    recit(X, f) {
      const { A, V, r } = X;
      const sc = f.sc;
      const nb = f.nb;
      const ex = f.agg.includes("ex_conjoint");
      const mots = { voisinage: [`« ${CR.cap(X.lex(V.g === "f" ? "ins_f" : "ins_m"))}, tu vas déménager »`, "des coups dans le plafond à toute heure", "des mots glissés sous la porte", "son nom tagué dans l'ascenseur"], couple: ["« Tu es à moi »", `« ${CR.cap(X.lex("ins_f"))}, je vais te pourrir la vie »`, "des dizaines d'appels la nuit", "des messages à sa mère et à son employeur"], travail: ["des remarques humiliantes en réunion", "des mails envoyés à 23 heures", "des tâches retirées une à une", "« Tu sers à rien, démissionne »"] }[sc];
      return {
        titre: { voisinage: "le harcèlement du voisin", couple: ex ? "le harcèlement de l'ex-compagne" : "le harcèlement dans le couple", travail: "le harcèlement au travail" }[sc],
        lieu: sc === "travail" ? `dans les locaux de la société ${pk(r, ["Logistique Ordener", "Aximo Services", "Clean'Pro", "Maison Varenne"])}, ${X.rue}` : `${X.rue}, ${X.lieu}`,
        itt: f.itt, duree: f.duree,
        resume: `Pendant ${f.duree} mois, ${X.n(A)} aurait harcelé ${X.nf(V)} : ${mots.slice(0, 2).join(", ")}.`,
        constat: [`Plainte de ${X.nf(V)} déposée au ${X.commCourt}, appuyée de captures d'écran et d'un certificat médical.`],
        plainte: [
          sc === "couple" ? `${ex ? "On s'est séparés il y a " + f.duree + " mois. Depuis," : "Depuis " + f.duree + " mois,"} il m'envoie des messages tous les jours : environ ${nb}, j'ai tout gardé.` : sc === "travail" ? `Depuis ${f.duree} mois, ${A.g === "f" ? "ma responsable" : "mon responsable"}, ${X.n(A)}, me rabaisse devant toute l'équipe.` : `Depuis ${f.duree} mois, ${A.g === "f" ? "ma voisine" : "mon voisin"}, ${X.n(A)}, me fait vivre un enfer.`,
          `Il y a eu ${mots.join(", ")}.`,
          `Je ne dors plus. Mon médecin m'a mis${X.e(V)} sous anxiolytiques. ${f.itt ? `Il a fixé l'ITT à ${f.itt} jours.` : ""}`,
        ],
        ecrits: Array.from({ length: 4 }, (_, i) => sc === "travail" ? pk(r, ["« Encore en retard sur le dossier, tu le fais exprès ? »", "« Je vais finir par te mettre au placard, tu le sais ? »", "« Tout le monde rigole de toi ici »", "« Réponds immédiatement. »", "« Tu crois vraiment que tu vas garder ton poste ? »"]) : pk(r, [`« ${CR.cap(X.lex("ins_f"))} »`, "« Réponds-moi ou je viens »", "« Je sais où tu es en ce moment »", "« T'as cru que t'allais m'échapper ? »", `« ${CR.cap(X.lex("menace"))} »`, "« Je vais dire à tout le monde ce que tu es »", "« Pourquoi tu réponds pas ? »"])),
        temoin: [sc === "travail" ? `Je travaille dans la même équipe. ${X.Il(A)} lui parle comme à un chien, devant nous. ${X.Il(V)} pleure aux toilettes.` : "Je suis sa voisine de palier. J'ai vu les mots, j'ai entendu les coups dans le plafond."],
        version: { nie: `J'ai jamais harcelé personne. On s'écrivait, c'est tout. ${X.Il(V)} répondait aussi.`, minimise: "J'ai envoyé des messages, beaucoup, c'est vrai. J'étais mal. Mais jamais pour lui faire du mal.", reconnait: "Oui, j'ai insisté. Trop. Je comprends que ça lui ait fait peur. J'ai arrêté." },
        audition: [
          { q: `Reconnaissez-vous avoir envoyé environ ${nb} messages à ${X.nf(V)} ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je lui ai écrit, oui." } },
          { q: `Saviez-vous qu'${X.il(V)} était suivi${X.e(V)} par un médecin ?`, a: { silence: "…", expliquer: `Non. ${X.Il(V)} me l'a jamais dit.`, partiel: "Non." } },
        ],
        prevention: sc === "travail" ? `harcelé ${X.nf(V)} par des propos ou comportements répétés ayant pour effet une dégradation de ses conditions de travail susceptible de porter atteinte à ses droits et à sa dignité, d'altérer sa santé ou de compromettre son avenir professionnel` : `harcelé ${X.nf(V)} par des propos ou comportements répétés ayant eu pour effet une dégradation de ses conditions de vie se traduisant par une altération de sa santé physique ou mentale`,
        prejudice: [{ id: "moral", label: "Préjudice moral (des mois d'angoisse)", demande: 3000, base: 1800 }, { id: "soins", label: "Frais de suivi psychologique", demande: 720, base: 720, piece: "facture_soins" }],
        qA: [{ q: "Pourquoi autant de messages ?", a: [`Je voulais juste qu'${X.il(V)} me réponde. Une fois.`] }],
        qV: [{ q: "Vous avez gardé les messages ?", a: ["Tous. Des captures, avec les dates."] }],
      };
    },
  });

  // =================================================================== CYBERHARCÈLEMENT
  CAT.def("cyberharcelement", {
    fam: "personnes", nom: "Cyberharcèlement", gravite: 0.4, victime: "personne", pasCI: true,
    textes: ["CP_222-33-2-2", "CP_113-2-1"],
    elements: { legal: "Art. 222-33-2-2 CP, 4° (service de communication au public en ligne) ; le « raid numérique » concerté est visé par le même texte.", materiel: "Des propos répétés en ligne — par une personne ou par plusieurs de manière concertée — dégradant les conditions de vie de la victime.", moral: "La conscience de participer à un harcèlement." },
    mesures: { gav: 0.35, al: 0.6, convocation: 0.05 }, flagrance: 0,
    voies: { classement: 0.15, alternative: 0.25, copj: 0.45, ci: 0, crpc: 0.15 },
    preuves: { plainte: 1, ecrits: 1, telephonie: 0.8, expertise: 0.4, aveux: 0.35 },
    camera: 0, irr: ["al_quitter", "requisition"],
    tirer(r) { const agg = CAT.tirerAgg(r, { vulnerable: 0.08 }, 2, ["en_ligne"]); return { sc: pk(r, ["raid", "ex", "influence", "jeu"]), agg, itt: CAT.itt(r, 0.5, 0.35, 0.15, 30), nb: int(r, 15, 400), reseau: pk(r, ["Instagram", "TikTok", "X", "Snapchat", "Discord", "Facebook"]) }; },
    qual(f) { const itt8 = f.itt > 8; const n = f.agg.length + (itt8 ? 1 : 0); const [prison, amende] = CAT.palier([[12, 15000], [24, 30000], [36, 45000]], n); return CAT.delit(prison, amende, "art. 222-33-2-2 CP", `harcèlement moral par l'utilisation d'un service de communication au public en ligne${itt8 ? ", ayant entraîné une incapacité totale de travail de plus de huit jours" : ""}`, { aggs: f.agg.concat(itt8 ? ["itt8"] : []) }); },
    comp: () => ["suspension des comptes en ligne utilisés pour commettre l'infraction pendant six mois"],
    recit(X, f) {
      const { A, V, r } = X;
      const pseudo = `@${pk(r, ["darkvador", "lapin_noir", "zz.real", "le_vrai_", "anonyme"])}${int(r, 10, 999)}`;
      return {
        titre: `le harcèlement sur ${f.reseau}`,
        lieu: `sur le réseau social ${f.reseau}`, itt: f.itt,
        resume: `${X.n(A)} serait derrière le compte ${pseudo}, qui a publié ou envoyé ${f.nb} messages visant ${X.nf(V)}.`,
        constat: [`Plainte de ${X.nf(V)} ; captures d'écran horodatées du compte ${pseudo} ; réquisition à la plateforme ${f.reseau} et à l'opérateur pour identifier l'adresse IP de connexion.`],
        plainte: [
          f.sc === "raid" ? `Après une vidéo que j'ai postée, des dizaines de comptes m'ont écrit en même temps. Le premier, c'est ${pseudo}.` : f.sc === "ex" ? `Depuis notre rupture, un compte anonyme, ${pseudo}, commente toutes mes photos. Je sais que c'est ${X.lui(A)} : ${X.il(A)} cite des choses que ${X.lui(A)} seul${X.e(A)} connaît.` : `Le compte ${pseudo} me harcèle depuis des semaines : ${f.nb} messages.`,
          `Ils disent « ${CR.cap(X.lex(V.g === "f" ? "ins_f" : "ins_m"))} », « suicide-toi », « on sait où tu habites ».`,
          "J'ai fermé mes comptes. Je ne sors plus. J'ai arrêté les cours pendant un mois.",
        ],
        ecrits: [`${pseudo} : « ${CR.cap(X.lex(V.g === "f" ? "ins_f" : "ins_m"))} »`, `${pseudo} : « on sait où tu habites, ${X.rue} »`, `${pseudo} : « personne te regrettera »`, `${pseudo} : « ${CR.cap(X.lex("menace"))} »`],
        version: { nie: "Ce compte, c'est pas moi. N'importe qui peut se connecter à ma box.", minimise: "J'ai écrit deux ou trois commentaires. Tout le monde le faisait. C'était pour rigoler.", reconnait: `C'est moi. J'avais la haine contre ${X.lui(V)}. Je regrette, j'ai supprimé le compte.` },
        audition: [{ q: `Le compte ${pseudo} se connectait depuis votre adresse IP. Est-ce vous ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je l'ai utilisé, quelques fois." } }],
        prevention: `harcelé ${X.nf(V)} par des propos ou comportements répétés, au moyen du compte ${pseudo} sur le réseau ${f.reseau}, ayant eu pour effet une dégradation de ses conditions de vie se traduisant par une altération de sa santé`,
        prejudice: [{ id: "moral", label: "Préjudice moral", demande: 2500, base: 1500 }],
        qA: [{ q: "Qui d'autre utilise votre connexion ?", a: [pk(r, ["Mon frère, et des copains qui passent.", `Personne. J'habite seul${X.e(X.A)}.`, "Mes colocataires."])] }],
      };
    },
  });

  // =================================================================== HARCÈLEMENT SEXUEL (victimes majeures ; description factuelle)
  CAT.def("harcelement_sexuel", {
    fam: "personnes", nom: "Harcèlement sexuel", gravite: 0.45, victime: "personne", pasCI: true, majeurSeulement: true, sexes: { A: "m", V: "f" },
    textes: ["CP_222-33"],
    elements: { legal: "Art. 222-33 CP.", materiel: "Des propos ou comportements à connotation sexuelle ou sexiste imposés de façon répétée, ou une pression grave, même unique, dans le but d'obtenir un acte sexuel.", moral: "La conscience d'imposer ces propos ou comportements." },
    mesures: { gav: 0.2, al: 0.75, convocation: 0.05 }, flagrance: 0,
    voies: { classement: 0.18, alternative: 0.15, copj: 0.55, ci: 0, crpc: 0.12 },
    preuves: { plainte: 1, ecrits: 0.8, temoin: 0.55, aveux: 0.25 },
    camera: 0, irr: ["al_quitter"],
    metierAuteur: (f, A) => ({ travail: "chef d'équipe", bailleur: "propriétaire bailleur" })[f.sc] || null,
    tirer(r) { const sc = pk(r, ["travail", "travail", "bailleur", "transport"]); const agg = CAT.tirerAgg(r, { en_ligne: 0.35, abus_autorite: sc === "travail" || sc === "bailleur" ? 0.7 : 0 }, 2); return { sc, agg, duree: int(r, 2, 10), pression: ch(r, 0.25) }; },
    qual(f) { const n = f.agg.length; return CAT.delit(n ? 36 : 24, n ? 45000 : 30000, "art. 222-33 CP", `harcèlement sexuel${n ? ", " + f.agg.map(CAT.aggLabel).join(", ") : ""}`); },
    comp: () => ["interdiction d'entrer en contact avec la victime pendant trois ans"],
    recit(X, f) {
      const { A, V, r } = X;
      const role = { travail: "son chef d'équipe", bailleur: "son propriétaire", transport: "un usager du même bus, tous les matins" }[f.sc];
      return {
        titre: { travail: "le harcèlement du chef d'équipe", bailleur: "le harcèlement du propriétaire", transport: "le harcèlement dans le bus" }[f.sc],
        lieu: f.sc === "travail" ? `dans les locaux de l'entreprise, ${X.rue}` : f.sc === "bailleur" ? `au domicile de la victime, ${X.rue}` : "dans le bus 85",
        duree: f.duree,
        resume: `${X.nf(V)} accuse ${role}, ${X.n(A)}, de lui imposer depuis ${f.duree} mois des propos et des gestes à connotation sexuelle.`,
        constat: [`Plainte de ${X.nf(V)}, majeure, déposée au ${X.commCourt} ; messages joints.`],
        plainte: [
          `Depuis ${f.duree} mois, ${role} me fait des remarques sur mon corps, presque tous les jours : sur mes vêtements, sur ma poitrine, sur ce qu'il « me ferait ».`,
          f.pression ? (f.sc === "bailleur" ? "Il m'a dit que si je voulais garder l'appartement malgré le retard de loyer, je savais ce que j'avais à faire." : "Il m'a dit que mon contrat ne serait pas renouvelé si je n'acceptais pas de dîner avec lui, et plus.") : "Il pose sa main sur mon épaule ou sur ma taille quand il passe derrière moi. Je lui ai dit d'arrêter, deux fois, devant témoin.",
          "Je change d'horaires pour l'éviter. Je fais des cauchemars.",
        ],
        ecrits: [pk(r, ["« Tu étais très jolie aujourd'hui, ta jupe… »", "« Ce soir je pense à toi, tu sais à quoi »", "« Pas besoin de faire la prude avec moi »"]), pk(r, ["« Un dîner, et on oublie le retard »", "« Ton contrat, ça dépend de toi »", "« Réponds, je sais que tu as vu »"])],
        temoin: [f.sc === "transport" ? "Je prends le même bus. Il se colle à elle, il lui parle à l'oreille. Elle change de place, il la suit." : "Je travaille avec eux. Il lui fait des remarques sur son physique, devant nous. Elle lui a dit d'arrêter."],
        version: { nie: "C'est faux. Je suis gentil avec tout le monde. Elle invente pour obtenir quelque chose.", minimise: "Des compliments, de l'humour. Je ne pensais pas que ça la gênait.", reconnait: "J'ai insisté, c'est vrai. J'ai dépassé les bornes." },
        audition: [{ q: "Lui avez-vous écrit ces messages ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je reconnais les messages." } }],
        prevention: `imposé de façon répétée à ${X.nf(V)} des propos ou comportements à connotation sexuelle portant atteinte à sa dignité en raison de leur caractère dégradant ou humiliant, ou créant à son encontre une situation intimidante, hostile ou offensante`,
        prejudice: [{ id: "moral", label: "Préjudice moral", demande: 3000, base: 2000 }],
        qA: [{ q: "Elle vous a dit d'arrêter ?", a: ["Une fois peut-être. Je croyais qu'elle plaisantait."] }],
      };
    },
  });

  // =================================================================== MENACES
  CAT.def("menaces", {
    fam: "personnes", nom: "Menaces", gravite: 0.35, victime: "personne", violences: true, pasCI: false,
    textes: ["CP_222-17", "CP_222-18", "CP_222-18-3"],
    elements: { legal: "Art. 222-17 CP (menace réitérée ou matérialisée), 222-18 (menace sous condition), 222-18-3 (au sein du couple).", materiel: "Une menace de crime ou de délit contre les personnes : réitérée, ou matérialisée par un écrit, une image, un objet, ou assortie d'un ordre de remplir une condition.", moral: "La conscience d'intimider ; peu importe l'intention de passer à l'acte." },
    mesures: { gav: 0.55, al: 0.4, convocation: 0.05 }, flagrance: 0.35,
    voies: { classement: 0.15, alternative: 0.3, copj: 0.35, ci: 0.12, crpc: 0.12 },
    preuves: { plainte: 1, ecrits: 0.6, temoin: 0.4, telephonie: 0.35, aveux: 0.4 },
    camera: 0.15, irr: ["al_quitter"],
    tirer(r) {
      const forme = pk(r, ["reiteree", "ecrite", "ecrite", "condition"]);
      const conj = ch(r, 0.25);
      return { sc: conj ? "couple" : pk(r, ["voisin", "dette", "travail", "rue"]), forme, mort: ch(r, 0.55), condition: forme === "condition", agg: conj ? [ch(r, 0.5) ? "ex_conjoint" : "conjoint"] : [] };
    },
    qual(f) {
      const cj = f.agg.includes("conjoint") || f.agg.includes("ex_conjoint");
      if (f.condition) {
        const [p, a] = cj ? (f.mort ? [84, 100000] : [60, 75000]) : f.mort ? [60, 75000] : [36, 45000];
        return CAT.delit(p, a, cj ? "art. 222-18 et 222-18-3 CP" : "art. 222-18 CP", `menace${f.mort ? " de mort" : " de commettre un délit contre les personnes"} faite avec l'ordre de remplir une condition`, { textes: ["CP_222-18"].concat(cj ? ["CP_222-18-3"] : []) });
      }
      const [p, a] = cj ? (f.mort ? [60, 75000] : [24, 30000]) : f.mort ? [36, 45000] : [6, 7500];
      return CAT.delit(p, a, cj ? "art. 222-17 et 222-18-3 CP" : "art. 222-17 CP", `menace${f.mort ? " de mort" : " de commettre un délit contre les personnes"}, ${f.forme === "ecrite" ? "matérialisée par un écrit" : "réitérée"}`, { textes: ["CP_222-17"].concat(cj ? ["CP_222-18-3"] : []) });
    },
    requalif(r, f) { return f.mort && f.forme === "reiteree" && ch(r, 0.3) ? { f2: Object.assign({}, f, { mort: false }), quoi: "mort" } : null; },
    comp: () => ["interdiction d'entrer en contact avec la victime pendant deux ans"],
    recit(X, f) {
      const { A, V, r } = X;
      const m = f.mort ? pk(r, ["je vais te tuer", "je vais te crever", V.g === "f" ? "t'es une femme morte" : "t'es un homme mort", "je vais te planter"]) : pk(r, ["je vais te casser les jambes", "je vais te défoncer la gueule", "je vais brûler ta voiture", "je vais te faire la peau"]);
      const cond = f.condition ? pk(r, [" si tu me rends pas mes 500 euros avant vendredi", " si tu retires pas ta plainte", " si tu parles encore à ma femme", " si tu reviens dans le quartier"]) : "";
      const ctx = { voisin: "un conflit de voisinage", dette: "une dette de 800 euros", travail: "un licenciement", rue: "une altercation de rue", couple: "une séparation" }[f.sc];
      return {
        titre: f.mort ? "les menaces de mort" : "les menaces",
        lieu: f.forme === "ecrite" ? "par messages SMS" : `${X.rue}, ${X.lieu}`,
        resume: `Sur fond d'${ctx}, ${X.n(A)} aurait menacé ${X.nf(V)} : « ${CR.cap(m)}${cond}. »`,
        constat: [`Plainte de ${X.nf(V)}${f.forme === "ecrite" ? ", qui présente les messages reçus sur son téléphone : captures d'écran réalisées par l'enquêteur" : ""}.`],
        plainte: [
          `C'est à cause d'${ctx}. ${f.forme === "reiteree" ? `Trois fois en une semaine, dans la rue et devant chez moi, ${X.il(A)} m'a dit` : f.forme === "ecrite" ? `${X.Il(A)} m'a écrit` : `${X.Il(A)} m'a dit, en me regardant dans les yeux`} : « ${CR.cap(m)}${cond}. »`,
          `Je ${A.g === "f" ? "la" : "le"} crois capable de le faire. ${V.enfants ? "Je ne laisse plus mes enfants descendre seuls." : "Je ne sors plus le soir."}`,
        ],
        ecrits: f.forme === "ecrite" || f.condition ? [`« ${CR.cap(m)}${cond} »`, `« Tu crois que je rigole ? ${CR.cap(X.lex("juron"))} »`, "« Je sais où tu travailles »"] : null,
        temoin: f.forme === "reiteree" ? [`J'étais avec ${X.lui(V)}. ${X.Il(A)} a dit : « ${m} ». ${X.Il(A)} était très énervé${X.e(A)}.`] : null,
        version: { nie: `J'ai jamais dit ça. ${X.Il(V)} ment pour se venger.`, minimise: `On s'est engueulés. J'ai dit des choses, sous le coup de la colère. « ${CR.cap(m)} », c'est une façon de parler.`, reconnait: "Je l'ai dit. Je ne l'aurais jamais fait. Je m'excuse." },
        audition: [{ q: `Avez-vous dit à ${X.nf(V)} : « ${m}${cond} » ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je ne me souviens pas des mots exacts." } }],
        prevention: `menacé ${X.nf(V)} de ${f.mort ? "mort" : "commettre à son encontre un délit contre les personnes"}${f.condition ? ", avec l'ordre de remplir une condition" : f.forme === "ecrite" ? ", la menace étant matérialisée par un écrit" : ", la menace étant réitérée"}`,
        prejudice: [{ id: "moral", label: "Préjudice moral (la peur)", demande: 1200, base: 700 }],
        qA: [{ q: "Vous l'avez dit sérieusement ?", a: ["Non ! J'étais en colère. Je ferais jamais ça."] }],
      };
    },
  });

  // =================================================================== APPELS ET MESSAGES MALVEILLANTS
  CAT.def("appels_malveillants", {
    fam: "personnes", nom: "Appels et messages malveillants", gravite: 0.25, victime: "personne", pasCI: true, op: false,
    textes: ["CP_222-16"],
    elements: { legal: "Art. 222-16 CP.", materiel: "Des appels ou messages réitérés, ou des agressions sonores.", moral: "Le but de troubler la tranquillité d'autrui." },
    mesures: { gav: 0.2, al: 0.75, convocation: 0.05 }, flagrance: 0,
    voies: { classement: 0.2, alternative: 0.4, copj: 0.3, ci: 0, crpc: 0.1 },
    preuves: { plainte: 1, telephonie: 1, ecrits: 0.5, aveux: 0.4 },
    camera: 0, irr: ["al_quitter", "requisition"],
    tirer(r) { const cj = ch(r, 0.35); return { sc: cj ? "couple" : pk(r, ["voisin", "client", "inconnu"]), nb: int(r, 30, 600), nuit: ch(r, 0.6), agg: cj ? [pk(r, ["conjoint", "ex_conjoint", "ex_conjoint"])] : [] }; },
    qual(f) { const cj = f.agg.length > 0; return CAT.delit(cj ? 36 : 12, cj ? 45000 : 15000, "art. 222-16 CP", `appels téléphoniques malveillants réitérés${cj ? ", par " + (f.agg[0] === "ex_conjoint" ? "l'ancien" : "le") + " conjoint ou concubin" : ""}`); },
    comp: () => ["interdiction d'entrer en contact avec la victime pendant deux ans"],
    recit(X, f) {
      const { A, V, r } = X;
      return {
        titre: "les appels malveillants", lieu: "par téléphone",
        resume: `${f.nb} appels et messages${f.nuit ? ", surtout la nuit," : ""} attribués à ${X.n(A)}, reçus par ${X.nf(V)}.`,
        constat: [`Plainte de ${X.nf(V)} ; réquisition à l'opérateur : relevé des appels entrants sur la ligne de la victime.`],
        plainte: [`Je reçois des appels en masque, ${f.nuit ? "entre deux et quatre heures du matin" : "toute la journée"}. ${X.Il(A)} ne dit rien, ${X.il(A)} respire, ou ${X.il(A)} raccroche. Parfois des messages vocaux : « ${CR.cap(X.lex("juron"))}, décroche. »`, `Au total, j'en ai compté environ ${Math.max(10, Math.round((f.nb * (1 + (((f.nb * 7) % 41) - 20) / 100)) / 10) * 10)}.`],
        version: { nie: "J'ai pas appelé. Mon téléphone, plein de gens s'en servent.", minimise: "J'ai appelé, oui, pour parler. Quelques fois.", reconnait: "C'est moi. Je n'arrivais pas à m'arrêter." },
        audition: [{ q: `L'opérateur relève ${f.nb} appels depuis votre ligne vers celle de ${X.nf(V)}. Que répondez-vous ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "J'ai appelé, oui." } }],
        prevention: `émis des appels téléphoniques malveillants réitérés à destination de ${X.nf(V)}, en vue de troubler sa tranquillité`,
        prejudice: [{ id: "moral", label: "Préjudice moral (des nuits sans sommeil)", demande: 1000, base: 600 }],
      };
    },
  });

  // =================================================================== VIOLATION DE DOMICILE
  CAT.def("violation_domicile", {
    fam: "personnes", nom: "Violation de domicile", gravite: 0.35, victime: "personne", pasCI: false,
    textes: ["CP_226-4"],
    elements: { legal: "Art. 226-4 CP (peines relevées par la loi du 27 juillet 2023).", materiel: "L'introduction dans le domicile d'autrui par manœuvres, menaces, voies de fait ou contrainte, ou le maintien qui s'ensuit.", moral: "La conscience de pénétrer chez autrui contre sa volonté." },
    mesures: { gav: 0.8, al: 0.15, convocation: 0.05 }, flagrance: 0.8,
    voies: { classement: 0.15, alternative: 0.3, copj: 0.35, ci: 0.12, crpc: 0.1 },
    preuves: { constat: 0.8, plainte: 1, temoin: 0.5, aveux: 0.4 },
    camera: 0.1, irr: ["heures"],
    tirer(r) { return { sc: pk(r, ["ex", "squat", "voisin"]), agg: [] }; },
    qual: () => CAT.delit(36, 45000, "art. 226-4 CP", "violation de domicile"),
    recit(X, f) {
      const { A, V, r } = X;
      return {
        titre: f.sc === "squat" ? "l'appartement occupé" : "l'intrusion au domicile",
        lieu: `au domicile de ${X.nf(V)}, ${int(r, 2, 90)}, ${X.rue}`,
        resume: { ex: `${X.n(A)} serait entré${X.e(A)} chez ${V.g === "f" ? "son ancienne compagne" : "son ancien compagnon"} en forçant la porte, pour « récupérer ses affaires ».`, squat: `${X.n(A)} occupait l'appartement de ${X.nf(V)}, vide pendant ses vacances, après avoir changé la serrure.`, voisin: `${X.n(A)} serait entré${X.e(A)} chez ${V.g === "f" ? "sa voisine" : "son voisin"} par le balcon, après une dispute.` }[f.sc],
        constat: [f.sc === "squat" ? `Constatons que la serrure de la porte palière a été remplacée ; à l'intérieur, ${X.n(A)} et des effets personnels qui ne sont pas ceux de la propriétaire.` : `Sur place, constatons une porte palière dont le chambranle est fendu au niveau de la gâche ; ${X.n(A)} est dans l'entrée.`],
        plainte: [{ ex: `${X.Il(A)} a tapé à la porte, je n'ai pas ouvert. ${X.Il(A)} a donné des coups d'épaule et la porte a cédé. ${X.Il(A)} est entré${X.e(A)} en criant.`, squat: "En rentrant de vacances, ma clé ne marchait plus. Quelqu'un vivait chez moi. Mes affaires étaient dans des sacs poubelle sur le palier.", voisin: `Je l'ai trouvé${X.e(A)} dans mon salon. ${X.Il(A)} était passé${X.e(A)} par le balcon. J'ai hurlé.` }[f.sc]],
        version: { nie: "J'avais les clés. C'est chez moi aussi.", minimise: "La porte était ouverte. Je voulais juste récupérer mes affaires.", reconnait: "J'ai forcé la porte. Je n'aurais pas dû." },
        audition: [{ q: "Comment êtes-vous entré dans le logement ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "La porte n'était pas fermée." } }],
        prevention: `introduit dans le domicile de ${X.nf(V)} à l'aide de manœuvres, menaces, voies de fait ou contrainte, et s'y être maintenu`,
        prejudice: [{ id: "materiel", label: "Réparation de la porte (devis du serrurier)", demande: int(r, 4, 14) * 100, base: null, piece: "devis" }, { id: "moral", label: "Préjudice moral", demande: 1500, base: 800 }],
      };
    },
  });

  // =================================================================== OUTRAGE
  CAT.def("outrage", {
    fam: "autorite", nom: "Outrage", gravite: 0.2, victime: "agent", op: false, pasCI: false,
    textes: ["CP_433-5"],
    elements: { legal: "Art. 433-5 CP.", materiel: "Des paroles, gestes, menaces, écrits ou images non rendus publics, adressés à une personne dépositaire de l'autorité publique ou chargée d'une mission de service public, dans l'exercice de sa mission.", moral: "La volonté d'atteindre la dignité de la personne ou le respect dû à sa fonction." },
    mesures: { gav: 0.85, al: 0.1, convocation: 0.05 }, flagrance: 1,
    voies: { classement: 0.1, alternative: 0.3, copj: 0.35, ci: 0.12, crpc: 0.13 },
    preuves: { constat: 1, temoin: 0.25, video: 0.2, aveux: 0.35 },
    camera: 0.2, irr: ["controle_identite"],
    tirer(r) { const sc = pk(r, ["controle", "controle", "transport", "verbalisation"]); return { sc, agg: CAT.tirerAgg(r, { reunion: 0.2 }, 1), cible: sc === "transport" ? "msp" : "pdap" }; },
    qual(f) {
      const reu = f.agg.includes("reunion");
      if (f.cible === "msp") return CAT.delit(reu ? 6 : 0, 7500, "art. 433-5 CP", "outrage à une personne chargée d'une mission de service public" + (reu ? ", en réunion" : ""));
      return CAT.delit(reu ? 24 : 12, reu ? 30000 : 15000, "art. 433-5 CP", "outrage à une personne dépositaire de l'autorité publique" + (reu ? ", en réunion" : ""));
    },
    recit(X, f) {
      const { A, V, r } = X;
      const agent = f.cible === "msp" ? `${X.nf(V)}, ${V.g === "f" ? "contrôleuse" : "contrôleur"} de la RATP` : `${V.g === "f" ? "la gardienne" : "le gardien"} de la paix ${V.prenom} ${V.nom}`;
      const mots = X.lex("ins_flic");
      return {
        titre: "l'outrage au contrôle", lieu: f.cible === "msp" ? "dans le bus 31, arrêt Château-Rouge" : `${X.rue}, ${X.lieu}`,
        resume: `Lors d'${f.sc === "verbalisation" ? "une verbalisation" : "un contrôle"}, ${X.n(A)} aurait insulté ${agent}.`,
        constat: [`Procédons au contrôle de ${X.n(A)}${f.agg.includes("reunion") ? ", accompagné de deux amis qui reprennent ses propos en chœur" : ""}. L'intéressé${X.e(A)} nous déclare à voix haute : « ${CR.cap(mots)}, ${X.lex("ins_m")} ! Vous êtes des ${pk(r, ["merdes", "chiens", "racistes", "bons à rien"])}. »`, `${X.Il(A)} réitère ces propos devant les passants, malgré nos injonctions.`],
        plainte: [`J'étais en tenue. ${X.Il(A)} m'a traité${X.e(V)} de « ${X.lex(V.g === "f" ? "ins_f" : "ins_m")} » devant tout le monde. Je dépose plainte.`],
        version: { nie: "J'ai rien dit de tout ça. J'ai juste demandé pourquoi on me contrôlait.", minimise: "J'ai dit un gros mot, sous le coup de l'énervement. Pas contre lui.", reconnait: "Je les ai insultés. J'étais à bout. Je m'excuse." },
        audition: [{ q: `Avez-vous traité ${agent} de « ${X.lex("ins_m")} » ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: `J'ai été énervé${X.e(A)}.` } }],
        prevention: `outragé, par paroles, ${agent}, ${f.cible === "msp" ? "personne chargée d'une mission de service public" : "personne dépositaire de l'autorité publique"}, dans l'exercice de ses fonctions`,
        prejudice: [{ id: "moral", label: "Préjudice moral de l'agent", demande: 300, base: 200 }],
      };
    },
  });

  // =================================================================== RÉBELLION
  CAT.def("rebellion", {
    fam: "autorite", nom: "Rébellion", gravite: 0.35, victime: "agent",
    textes: ["CP_433-6", "CP_433-7"],
    elements: { legal: "Art. 433-6 à 433-8 CP.", materiel: "Une résistance violente — active — opposée à un agent agissant pour l'exécution des lois ; la résistance passive n'en est pas une.", moral: "La conscience de s'opposer à un agent dans l'exercice de ses fonctions." },
    mesures: { gav: 1, al: 0, convocation: 0 }, flagrance: 1,
    voies: { classement: 0.08, alternative: 0.15, copj: 0.4, ci: 0.25, crpc: 0.15 },
    preuves: { constat: 1, certificat: 0.4, temoin: 0.3, video: 0.4, aveux: 0.35 },
    camera: 0.5, irr: ["controle_identite", "heures"],
    tirer(r) { return { sc: pk(r, ["controle", "interpellation", "expulsion"]), agg: CAT.tirerAgg(r, { reunion: 0.18 }, 1), itt: CAT.itt(r, 0.6, 0.4, 0, 4) }; },
    qual: (f) => (f.agg.includes("reunion") ? CAT.delit(36, 45000, "art. 433-6 et 433-7 CP", "rébellion en réunion") : CAT.delit(24, 30000, "art. 433-6 et 433-7 CP", "rébellion")),
    requalif(r, f) { return f.agg.includes("reunion") && ch(r, 0.3) ? { f2: Object.assign({}, f, { agg: [] }), quoi: "reunion" } : null; },
    recit(X, f) {
      const { A, V, r } = X;
      const motif = { controle: "un contrôle d'identité", interpellation: "son interpellation pour un vol à l'étalage signalé", expulsion: "l'expulsion d'un bar dont le gérant avait appelé la police" }[f.sc];
      return {
        titre: "la rébellion", lieu: `${X.rue}, devant ${pk(r, ["un bureau de tabac", "une supérette", "la sortie du métro", "un bar"])}`, itt: f.itt,
        resume: `Lors de ${motif}, ${X.n(A)} se serait débattu${X.e(A)} violemment ; ${V.g === "f" ? "la gardienne" : "le gardien"} de la paix ${V.nom} est ${f.itt ? "légèrement blessé" + X.e(V) : "indemne"}.`,
        constat: [`Lors de ${motif}, ${X.n(A)} refuse de nous suivre.`, `Au moment du menottage, ${X.il(A)} se débat, ${pk(r, ["donne des coups de pied en direction des fonctionnaires", "tire violemment ses bras", "se jette au sol en se débattant", "repousse le gardien de la paix des deux mains"])}${f.agg.includes("reunion") ? " ; deux de ses amis tentent de l'arracher à notre étreinte" : ""}.`, f.itt ? `${V.g === "f" ? "La gardienne" : "Le gardien"} de la paix ${V.prenom} ${V.nom} présente une entorse du poignet (ITT : ${f.itt} jours).` : "Aucun fonctionnaire n'est blessé."],
        plainte: [`${X.Il(A)} tirait de toutes ses forces, ${X.il(A)} donnait des coups de pied.${f.itt ? ` Je me suis fait mal au poignet en ${A.g === "f" ? "la" : "le"} maintenant.` : ""}`],
        temoin: [pk(r, [`${X.Il(A)} se débattait, oui, mais ils étaient trois sur ${X.lui(A)}.`, `${X.Il(A)} a donné des coups de pied, je l'ai vu.`, `Ils l'ont plaqué${X.e(A)} contre la voiture, ${X.il(A)} a crié qu'${X.il(A)} avait mal.`])],
        version: { nie: `J'ai rien fait. Ils m'ont plaqué${X.e(A)} contre la voiture sans raison. J'ai crié, c'est tout.`, minimise: "J'ai eu peur, j'ai tiré mon bras. Je n'ai frappé personne.", reconnait: `Je me suis débattu${X.e(A)}. J'étais énervé${X.e(A)}. Je regrette.` },
        audition: [{ q: "Pourquoi avez-vous résisté ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "J'ai eu peur." } }, { q: `${V.g === "f" ? "La gardienne" : "Le gardien"} ${V.nom} ${f.itt ? "a une entorse au poignet" : `dit que vous ${V.g === "f" ? "l'avez frappée" : "l'avez frappé"}`}. Vous ${V.g === "f" ? "l'avez frappée" : "l'avez frappé"} ?`, a: { silence: "…", expliquer: "Non ! J'ai tiré mon bras, c'est tout.", partiel: `Je ne ${V.g === "f" ? "l'ai pas frappée" : "l'ai pas frappé"}.` } }],
        prevention: "opposé une résistance violente à des personnes dépositaires de l'autorité publique agissant, dans l'exercice de leurs fonctions, pour l'exécution des lois",
        prejudice: [{ id: "moral", label: "Préjudice moral du policier", demande: 400, base: 250 }],
      };
    },
  });
})();
