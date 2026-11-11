/* La Permanence — catalogue, phase 2 : vols à main armée, séquestrations, trafic de stupéfiants en bande organisée, incendies.
   Mêmes fiches, mêmes contextes (au moins huit chacun) que les atteintes à la vie. La qualification dépend des faits tirés :
   une libération avant le septième jour, une bande organisée, une incapacité de plus de huit jours, une mort changent la peine
   et parfois la nature (crime ou délit). Peines et articles à revérifier sur Légifrance. */
(function () {
  const CR = window.CR;
  const CAT = CR.CAT;
  const C = CAT.CRIM;
  const { pk, int, ch } = CAT;
  const lab = (base, aggs) => `${base}${aggs.length ? ", " + aggs.map(CAT.aggLabel).join(", ") : ""}`;

  // =================================================================== VOL À MAIN ARMÉE
  C.fiche("vol_arme", {
    fam: "crim_biens", nom: "Vol à main armée", gravite: 0.75, deces: false, victime: "commerce",
    textes: ["CP_311-8", "CP_132-75", "CP_311-9"],
    elements: { legal: "Art. 311-1 et 311-8 CP ; en bande organisée, art. 311-9 ; arme par assimilation, art. 132-75.", materiel: "La soustraction frauduleuse de la chose d'autrui, commise avec usage ou menace d'une arme, ou par une personne porteuse d'une arme.", moral: "La conscience de s'approprier la chose d'autrui contre son gré." },
    prevention: (X) => `frauduleusement soustrait des biens au préjudice de ${X.nf(X.V)}, avec cette circonstance que les faits ont été commis avec usage ou menace d'une arme`,
    qual(f) {
      const aggs = (f.agg || []).filter((a) => ["bande_organisee", "reunion", "dissimulation"].includes(a));
      if (f.armeNonEtablie) {
        const n = 1 + aggs.filter((a) => a !== "bande_organisee").length;
        const [prison, amende] = CAT.palier([[60, 75000], [60, 75000], [84, 100000], [120, 150000]], n);
        return CAT.delit(prison, amende, "art. 311-4 CP", lab("vol accompagné de violences n'ayant pas entraîné d'incapacité totale de travail", aggs.filter((a) => a !== "bande_organisee")), { aggs: aggs.filter((a) => a !== "bande_organisee"), textes: ["CP_311-1", "CP_311-4"] });
      }
      if (aggs.includes("bande_organisee")) return CAT.crime(360, 150000, "art. 311-9 CP", lab("vol avec arme", aggs), { aggs, textes: ["CP_311-9", "CP_132-71"] });
      return CAT.crime(240, 150000, "art. 311-8 CP", lab("vol avec arme", aggs), { aggs, textes: ["CP_311-8"] });
    },
    requalif(r, f) {
      if (f.enjeux.includes("arme")) return { f2: Object.assign({}, f, { armeNonEtablie: true }), quoi: "arme" };
      if (f.enjeux.includes("bo") && (f.agg || []).includes("bande_organisee")) return { f2: Object.assign({}, f, { agg: f.agg.filter((a) => a !== "bande_organisee") }), quoi: "bo" };
      return null;
    },
    ctxs: {
      bijouterie: {
        w: 2, titre: "le braquage de la bijouterie", lieu: (X) => `dans une bijouterie, ${X.pk(["rue de Rivoli", "rue du Faubourg-Saint-Honoré", "boulevard Haussmann"])}`,
        pers: { A: { g: "m", min: 19, max: 40 }, V: { min: 30, max: 65, metier: "gérant de la bijouterie" } },
        agg: { dissimulation: 0.7, reunion: 0.4 },
        tirer: (r) => ({ arme: pk(r, ["un pistolet automatique", "une réplique d'arme de poing de type airsoft", "un revolver"]), butin: int(r, 20, 180) * 1000 }),
        heures: [[10 * 60, 19 * 60]],
        preuves: { video: 0.9, adn: 0.6, telephonie: 0.7, temoin: 0.8, saisie: 0.4 },
        enjeux: { identification: 0.6, arme: 0.3 },
        mobiles: ["Des dettes de jeu.", "Un « travail » proposé par un inconnu dans un bar.", "Une commande de bijoux pour un receleur."],
        resume: (X, f) => `Un homme casqué menace ${X.n(X.V)} avec ${f.arme} et emporte des bijoux pour ${CR.money(f.butin)} ; ${X.n(X.A)} est mis en cause par l'ADN et la téléphonie.`,
        victime: (X, f) => [`Il est entré casqué, il a sorti ${f.arme.replace(/^une réplique d'arme de poing de type airsoft$/, "un pistolet")} et il me l'a mis devant le visage. « La vitrine, vite. »`, "J'ai ouvert les vitrines. J'ai cru que j'allais mourir. Je ne dors plus."],
        video: (X, f) => `L'individu, casque intégral noir, braque ${/réplique/.test(f.arme) ? "un objet ayant l'apparence d'un pistolet" : "une arme de poing"} vers la gérante pendant les cinquante secondes de l'action.`,
        adn: (X) => `Profil génétique isolé sur la mentonnière du casque abandonné rue du Renard : concordance avec ${X.n(X.A)}.`,
        version: () => ({ nie: "Je n'y étais pas. Le casque, je l'ai prêté.", minimise: "J'ai fait le guet. C'est l'autre qui est entré.", reconnait: "C'était moi. J'avais des dettes. Le pistolet était faux." }),
        et: { arme: (X, f) => ({ piece: "temoin", fort: /réplique/.test(f.arme) ? "L'objet saisi est une réplique ; il est discernable d'une arme réelle par son bouchon orange, selon le rapport technique." : "« Je n'ai pas vu d'arme, je crois qu'il avait la main dans son blouson. »", faible: /réplique/.test(f.arme) ? "La réplique, noire, sans bouchon orange, est indiscernable d'une arme réelle à quelques mètres : elle est assimilée à une arme (art. 132-75)." : "« J'ai vu le canon, à vingt centimètres de mon visage. »" }) },
      },
      superette: {
        w: 2.5, titre: "la supérette", lieu: (X) => `dans une supérette, ${X.rue}`,
        pers: { A: { g: "m", min: 17, max: 35 }, V: { min: 20, max: 60, metier: "caissier" } }, mineurA: 0.25, ageMinA: 15,
        agg: { dissimulation: 0.6, reunion: 0.3 },
        tirer: (r) => ({ arme: pk(r, ["un couteau de cuisine", "un cutter", "un pistolet", "un tournevis"]), butin: int(r, 3, 15) * 100 }),
        heures: [[20 * 60, 23 * 60]],
        preuves: { video: 0.9, temoin: 0.6, telephonie: 0.5, adn: 0.3 },
        enjeux: { identification: 0.55, arme: 0.25 },
        mobiles: ["Il fallait payer un dealer.", "Un pari entre copains.", "La troisième supérette du mois."],
        resume: (X, f) => `${X.n(X.A)} braque une supérette avec ${f.arme} et repart avec ${CR.money(f.butin)} de la caisse.`,
        victime: (X, f) => [`Il a sauté par-dessus le comptoir avec ${f.arme}. Il criait « la caisse, la caisse ».`, "Il avait une écharpe sur le visage. Les yeux, je les reconnaîtrais."],
        video: (X, f) => `Un individu au visage partiellement masqué menace le caissier avec ${f.arme} ; il vide le tiroir-caisse en trente secondes.`,
        version: () => ({ nie: "Ce n'est pas moi sur la vidéo.", minimise: "J'avais un tournevis pour ouvrir la caisse, pas pour menacer.", reconnait: "Oui. Je ne voulais blesser personne. J'avais besoin d'argent tout de suite." }),
      },
      pharmacie: {
        w: 1.5, titre: "la pharmacie", lieu: (X) => `dans une pharmacie, ${X.rue}`,
        pers: { A: { g: "m", min: 20, max: 45 }, V: { min: 25, max: 65, metier: "pharmacienne" } },
        tirer: (r) => ({ arme: pk(r, ["une seringue présentée comme contaminée", "une bouteille cassée", "un marteau"]), butin: int(r, 2, 9) * 100 }),
        heures: [[9 * 60, 20 * 60]],
        preuves: { video: 0.8, temoin: 0.8, adn: 0.4 },
        enjeux: { arme: 0.5, altere: 0.2 },
        psy: { intact: 0.6, altere: 0.35, aboli: 0.05 },
        mobiles: ["Le manque : {il} voulait des médicaments de substitution.", "Une ordonnance refusée la veille.", "L'argent de la caisse."],
        resume: (X, f) => `${X.n(X.A)} menace ${X.n(X.V)} avec ${f.arme} pour obtenir des médicaments et la caisse.`,
        victime: (X, f) => [`Il m'a mis ${f.arme} sous le nez en disant : « Tu me donnes tout ou je te pique. »`],
        temoin: () => ["Il tremblait. Il avait l'air en manque."],
        version: () => ({ nie: "Je ne me souviens de rien.", minimise: "Je n'ai menacé personne. J'ai demandé mes médicaments.", reconnait: "J'étais en manque. J'ai fait peur à cette dame. Je m'en veux." }),
        et: { arme: (X, f) => ({ piece: "temoin", fort: `« Il tenait quelque chose dans la main, ${f.arme.split(" ")[1]}, mais il ne l'a jamais pointé vers moi. »`, faible: `« Il a pointé ${f.arme.split(" ").slice(0, 2).join(" ")} vers mon cou en disant qu'il allait me piquer. »` }) },
      },
      fourgon: {
        w: 1, titre: "l'attaque du fourgon", lieu: () => "sur la bretelle d'accès à l'autoroute A1, à Saint-Denis",
        pers: { A: { g: "m", min: 25, max: 50 }, V: { min: 25, max: 55, metier: "convoyeur de fonds" }, C2: true },
        imposees: () => ["bande_organisee", "dissimulation"],
        tirer: (r) => ({ arme: "des fusils d'assaut", butin: int(r, 4, 20) * 100000 }),
        heures: [[6 * 60, 9 * 60]],
        preuves: { telephonie: 0.95, video: 0.7, adn: 0.6, saisie: 0.6, balistique: 0.8 },
        enjeux: { identification: 0.5, role: 0.55, bo: 0.15 },
        mobiles: ["Une équipe montée depuis six mois.", "Un renseignement venu de l'intérieur de la société de transport.", "Un butin destiné à financer un trafic."],
        resume: (X, f) => `Un commando armé de fusils d'assaut attaque un fourgon blindé et emporte ${CR.money(f.butin)} ; ${X.n(X.A)} est mis en examen avec plusieurs membres présumés de l'équipe.`,
        scene: () => ["Fourgon immobilisé par deux véhicules volés ; tirs à l'arme de guerre sur le pare-brise ; les convoyeurs remettent les sacoches sous la menace.", "Les véhicules sont retrouvés incendiés dans une zone industrielle."],
        telephonie: (X) => `Une flotte de lignes « dédiées » ouvertes le même jour s'active autour du dépôt de la société de transport pendant trois semaines ; l'une d'elles est rattachée à ${X.n(X.A)} par son téléphone personnel, allumé au même endroit.`,
        version: () => ({ nie: "Je ne connais personne de cette équipe.", minimise: "J'ai seulement volé une des voitures, sur commande. Je ne savais pas pour quoi.", reconnait: "J'étais là. Je ne dirai pas qui d'autre." }),
        et: { role: () => ({ piece: "telephonie", fort: "Le mis en examen n'apparaît qu'à la phase de préparation logistique (vol de véhicules) ; aucun élément ne le place sur les lieux de l'attaque.", faible: "La ligne du mis en examen borne sur la bretelle d'autoroute à l'heure de l'attaque." }) },
      },
      home_jacking: {
        w: 1.5, titre: "le home-jacking", lieu: (X) => `au domicile de la victime, à ${X.pk(["Neuilly-sur-Seine", "Saint-Cloud", "Vincennes"])}`,
        pers: { A: { g: "m", min: 19, max: 40 }, V: { min: 35, max: 80 }, C2: true }, mineurA: 0.1, ageMinA: 16,
        imposees: () => ["reunion"], agg: { dissimulation: 0.7 },
        tirer: (r) => ({ arme: pk(r, ["un pistolet", "un couteau", "une matraque télescopique"]), butin: int(r, 10, 120) * 1000 }),
        heures: [[21 * 60, 23 * 60 + 50], [0, 5 * 60]],
        preuves: { adn: 0.7, telephonie: 0.8, saisie: 0.5, temoin: 0.3 },
        enjeux: { identification: 0.6, role: 0.3 },
        mobiles: ["Une information sur un coffre-fort.", "Une voiture de luxe repérée.", "Une montre vue sur un réseau social."],
        resume: (X, f) => `Trois hommes cagoulés s'introduisent la nuit chez ${X.n(X.V)}, ${X.la(X.V)} menacent avec ${f.arme} et emportent ${CR.money(f.butin)} de biens.`,
        victime: (X, f) => ["On a été réveillés par la lumière d'une lampe. Ils étaient trois, cagoulés.", `Celui qui avait ${f.arme} me l'a mis contre la tempe pour que je donne le code du coffre. Ma femme était attachée sur une chaise.`],
        adn: (X) => `Profil génétique sur un serre-câble abandonné dans la chambre : concordance avec ${X.n(X.A)}.`,
        version: () => ({ nie: "Ce serre-câble, n'importe qui l'a acheté.", minimise: "Je suis resté dans la voiture.", reconnait: "J'étais dedans. Je ne voulais pas qu'on leur fasse de mal." }),
      },
      station: {
        w: 1.5, titre: "la station-service", lieu: () => "dans une station-service du boulevard périphérique",
        pers: { A: { g: "m", min: 16, max: 30 }, V: { min: 20, max: 60, metier: "caissier" } }, mineurA: 0.4, ageMinA: 15,
        agg: { dissimulation: 0.5, reunion: 0.4 },
        tirer: (r) => ({ arme: pk(r, ["un pistolet à billes", "un pistolet", "une machette"]), butin: int(r, 3, 12) * 100 }),
        heures: [[22 * 60, 23 * 60 + 50], [0, 4 * 60]],
        preuves: { video: 0.9, telephonie: 0.6 },
        enjeux: { identification: 0.4, arme: 0.4 },
        mobiles: ["Un défi lancé sur les réseaux.", "Une dette envers un plus grand.", "Un trajet de nuit sans argent."],
        resume: (X, f) => `${X.n(X.A)}, ${X.A.age} ans, braque une station-service avec ${f.arme}.`,
        victime: (X, f) => [`Il était jeune, il tremblait. Il pointait ${f.arme} sur moi.`],
        video: (X, f) => `Un individu menace le caissier avec ${f.arme} ; ${/billes/.test(f.arme) ? "l'objet a l'aspect d'une arme de poing" : "l'arme est visible"}.`,
        version: () => ({ nie: "Ce n'est pas moi.", minimise: "C'était un pistolet à billes, pour rigoler.", reconnait: "J'ai braqué. On m'avait dit que c'était facile." }),
      },
      tabac: {
        w: 1.5, titre: "le bureau de tabac", lieu: (X) => `dans un bureau de tabac, ${X.rue}`,
        pers: { A: { g: "m", min: 20, max: 45 }, V: { min: 40, max: 70, metier: "buraliste" }, C2: true },
        agg: { reunion: 0.5, dissimulation: 0.7 },
        tirer: (r) => ({ arme: pk(r, ["un fusil à pompe", "un fusil de chasse à canon scié", "un pistolet"]), butin: int(r, 2, 25) * 1000 }),
        heures: [[7 * 60, 9 * 60], [18 * 60, 20 * 60]],
        preuves: { video: 0.8, temoin: 0.7, telephonie: 0.7, saisie: 0.4 },
        enjeux: { identification: 0.6 },
        mobiles: ["La recette des jeux du week-end.", "Le stock de cigarettes à revendre.", "Un tuyau donné par un ancien employé."],
        resume: (X, f) => `Deux hommes braquent un bureau de tabac au ${f.arme.replace(/^un /, "")} et emportent ${CR.money(f.butin)}.`,
        victime: (X, f) => [`Ils sont arrivés à l'ouverture. ${CR.cap(f.arme)} braqué sur moi, l'autre a vidé le coffre et les cartouches de cigarettes.`],
        version: () => ({ nie: "Je n'y étais pas.", minimise: "Je conduisais. Je ne savais pas qu'ils avaient un fusil.", reconnait: "C'est moi qui tenais le fusil. Il n'était pas chargé." }),
      },
      carjacking: {
        w: 1.5, titre: "le vol de la voiture sous la menace", lieu: (X) => `à un feu rouge, ${X.pk(["porte de la Chapelle", "boulevard Ney", "avenue de la Porte-de-Clignancourt"])}`,
        pers: { A: { g: "m", min: 17, max: 30 }, V: { min: 25, max: 65 } }, mineurA: 0.25, ageMinA: 16,
        agg: { reunion: 0.5 },
        tirer: (r) => ({ arme: pk(r, ["un pistolet", "un couteau", "une batte"]), butin: int(r, 15, 90) * 1000 }),
        heures: [[18 * 60, 23 * 60 + 50]],
        preuves: { video: 0.6, telephonie: 0.8, adn: 0.5, saisie: 0.5 },
        enjeux: { identification: 0.5, arme: 0.3 },
        mobiles: ["Une commande de véhicule pour l'export.", "Un go-fast à préparer.", "Une virée."],
        resume: (X, f) => `${X.n(X.V)} est extrait${X.e(X.V)} de son véhicule sous la menace d'${f.arme.replace(/^un /, "un ").replace(/^une /, "une ")} ; la voiture, d'une valeur de ${CR.money(f.butin)}, est retrouvée maquillée.`,
        victime: (X, f) => [`Ils ont ouvert ma portière au feu rouge. L'un avait ${f.arme}, il a crié de sortir.`],
        version: () => ({ nie: "J'ai acheté la voiture à un type. Je ne savais pas qu'elle était volée.", minimise: "J'étais avec eux mais c'est l'autre qui menaçait.", reconnait: "C'est moi qui ai ouvert la portière." }),
      },
    },
  });

  // =================================================================== SÉQUESTRATION
  C.fiche("sequestration", {
    fam: "crim_biens", nom: "Enlèvement et séquestration", gravite: 0.75, deces: false,
    textes: ["CP_224-1", "CP_224-3", "CP_224-4", "CP_224-5"],
    elements: { legal: "Art. 224-1 à 224-5 CP.", materiel: "Arrêter, enlever, détenir ou séquestrer une personne, sans ordre des autorités ; la durée et les conditions de la libération fixent la peine.", moral: "La conscience de priver la personne de sa liberté d'aller et venir." },
    prevention: (X) => `sans ordre des autorités constituées et hors les cas prévus par la loi, arrêté, enlevé, détenu ou séquestré ${X.nf(X.V)}`,
    qual(f) {
      const aggs = (f.agg || []).filter((a) => ["bande_organisee", "plusieurs_victimes", "otage", "mineur15", "tortures"].includes(a));
      const lourd = aggs.includes("bande_organisee") || aggs.includes("plusieurs_victimes") || aggs.includes("otage");
      if (aggs.includes("tortures")) return CAT.crime("perpetuite", 0, "art. 224-1 et 224-2 CP", lab("séquestration", aggs), { aggs, textes: ["CP_224-1", "CP_224-2"] });
      if (f.liberee) {
        if (lourd) return CAT.delit(120, 150000, `art. 224-1 et ${aggs.includes("otage") ? "224-4" : "224-3"} CP`, lab("séquestration, la victime ayant été libérée volontairement avant le septième jour", aggs), { aggs, textes: ["CP_224-1", aggs.includes("otage") ? "CP_224-4" : "CP_224-3"] });
        return CAT.delit(60, 75000, "art. 224-1, al. 3 CP", lab("séquestration, la victime ayant été libérée volontairement avant le septième jour", aggs), { aggs, textes: ["CP_224-1"] });
      }
      let prison = lourd ? 360 : 240;
      let perp = false;
      if (aggs.includes("mineur15")) { if (prison === 360) perp = true; else prison = 360; }
      const art = `art. 224-1${lourd ? (aggs.includes("otage") ? " et 224-4" : " et 224-3") : ""}${aggs.includes("mineur15") ? " et 224-5" : ""} CP`;
      return CAT.crime(perp ? "perpetuite" : prison, 0, art, lab(aggs.includes("otage") ? "enlèvement et séquestration comme otage" : "enlèvement et séquestration", aggs), { aggs, textes: ["CP_224-1"].concat(lourd ? [aggs.includes("otage") ? "CP_224-4" : "CP_224-3"] : [], aggs.includes("mineur15") ? ["CP_224-5"] : []) });
    },
    requalif(r, f) {
      if (f.enjeux.includes("liberation") && !f.liberee) return { f2: Object.assign({}, f, { liberee: true }), quoi: "liberation" };
      if (f.enjeux.includes("bo") && (f.agg || []).includes("bande_organisee")) return { f2: Object.assign({}, f, { agg: f.agg.filter((a) => a !== "bande_organisee") }), quoi: "bo" };
      return null;
    },
    ctxs: {
      dette: {
        w: 2.5, titre: "la dette", lieu: (X) => `dans une cave d'immeuble, ${X.rue}`,
        pers: { A: { g: "m", min: 18, max: 35 }, V: { g: "m", min: 17, max: 35 }, C2: true }, mineurA: 0.15, ageMinA: 16,
        agg: { bande_organisee: 0.2 },
        tirer: (r) => ({ jours: int(r, 1, 10), liberee: false, montant: int(r, 5, 40) * 100 }),
        heures: [[18 * 60, 23 * 60]],
        preuves: { telephonie: 0.85, temoin: 0.5, adn: 0.5, saisie: 0.4 },
        enjeux: { liberation: 0.55, role: 0.35 },
        mobiles: ["Une dette de stupéfiants.", "Un stock « perdu ».", "De l'argent prêté et jamais rendu."],
        resume: (X, f) => `${X.n(X.V)} est retenu ${f.jours} jour${f.jours > 1 ? "s" : ""} dans une cave pour une dette de ${CR.money(f.montant)} ; ${X.n(X.A)} est mis en examen.`,
        victime: (X, f) => ["Ils m'ont fait monter dans une voiture devant chez moi. Ils m'ont descendu dans une cave et attaché à un tuyau avec du scotch.", `Ils appelaient ma mère pour l'argent. On me donnait de l'eau et des chips. Au bout de ${f.jours} jour${f.jours > 1 ? "s" : ""}, ${f.jours < 7 ? "ils m'ont relâché sur un parking" : "les policiers ont défoncé la porte"}.`],
        telephonie: (X) => `La ligne de ${X.n(X.A)} appelle à onze reprises la mère de la victime pendant la séquestration ; les appels bornent sur le relais couvrant l'immeuble.`,
        version: () => ({ nie: "Je n'ai jamais vu ce garçon.", minimise: "Il est venu de lui-même. On parlait de sa dette. Il pouvait partir.", reconnait: "On l'a gardé pour que sa famille paie. Je ne l'ai pas frappé." }),
        et: { liberation: (X, f) => ({ piece: "victime", fort: "« Le quatrième jour, ils m'ont détaché, ils m'ont mis dans la voiture et ils m'ont laissé sur un parking. Ils m'ont dit de rentrer. »", faible: "« Je ne suis sorti que parce que la police est arrivée. Ils parlaient de m'emmener ailleurs. »" }) },
      },
      conjugale: {
        w: 2, titre: "l'appartement fermé à clé", lieu: (X) => `au domicile du couple, ${X.A.adresse}`,
        pers: { A: { g: "m", min: 22, max: 60 }, V: { g: "f", rel: "conjoint" } },
        tirer: (r) => ({ jours: int(r, 1, 21), liberee: false }),
        heures: [[8 * 60, 22 * 60]],
        preuves: { temoin: 0.7, ecrits: 0.7, telephonie: 0.5 },
        enjeux: { liberation: 0.4 },
        mobiles: ["{VIl} voulait partir.", "{Il} {Vla} soupçonnait d'une liaison.", "{VIl} avait parlé à une assistante sociale."],
        resume: (X, f) => `${X.n(X.V)} est enfermée par son conjoint, ${X.n(X.A)}, pendant ${f.jours} jours, sans téléphone ni clés.`,
        victime: (X, f) => ["Il partait travailler en fermant à double tour. Il emportait mon téléphone et les clés.", `${f.jours} jours. J'ai fini par écrire un mot et le jeter par la fenêtre à une voisine.`],
        temoin: () => ["J'ai trouvé un papier sur mon balcon : « Je suis enfermée au 4e, appelez la police. »"],
        version: () => ({ nie: "Elle pouvait sortir quand elle voulait. Elle a un double.", minimise: "Je fermais à clé par peur des cambrioleurs.", reconnait: "Je l'ai enfermée. J'avais peur qu'elle parte." }),
      },
      rancon: {
        w: 1.5, titre: "l'enlèvement contre rançon", lieu: (X) => `dans un pavillon loué, à ${X.pk(["Sevran", "Clichy-sous-Bois", "Gonesse"])}`,
        pers: { A: { g: "m", min: 20, max: 45 }, V: { min: 25, max: 70 }, C2: true },
        imposees: () => ["otage", "bande_organisee"],
        tirer: (r) => ({ jours: int(r, 2, 12), liberee: false, rancon: pk(r, [50000, 100000, 300000]) }),
        heures: [[7 * 60, 21 * 60]],
        preuves: { telephonie: 0.95, video: 0.5, adn: 0.7, saisie: 0.6, temoin: 0.4 },
        enjeux: { role: 0.6, identification: 0.3, liberation: 0.2 },
        mobiles: ["La victime, commerçante, était réputée fortunée.", "Une rumeur de cryptomonnaies.", "Un ancien associé de la victime renseignait l'équipe."],
        resume: (X, f) => `${X.n(X.V)} est enlevé${X.e(X.V)} et détenu${X.e(X.V)} ${f.jours} jours ; une rançon de ${CR.money(f.rancon)} est exigée de sa famille. ${X.n(X.A)} est mis en examen.`,
        victime: (X, f) => ["On m'a jeté dans un utilitaire, un sac sur la tête. Pendant des jours, je n'ai vu personne sans cagoule.", "Ils m'ont filmé en train de supplier ma famille de payer."],
        telephonie: () => "Les appels de rançon sont passés depuis des cabines et des lignes jetables ; l'une d'elles est activée à proximité du domicile d'un mis en examen.",
        version: () => ({ nie: "Je ne sais rien de cette histoire.", minimise: "J'apportais à manger. Je ne savais pas qu'il était retenu de force.", reconnait: "J'étais le gardien. Je lui donnais à manger. Je n'ai pas décidé." }),
      },
      squat: {
        w: 1, titre: "la séquestration dans le squat", lieu: () => "dans un immeuble squatté, porte de la Chapelle",
        pers: { A: { g: "m", min: 20, max: 45 }, V: { min: 18, max: 50 }, C2: true },
        agg: { tortures: 0.15 },
        tirer: (r) => ({ jours: int(r, 1, 5), liberee: false }),
        heures: [[20 * 60, 23 * 60 + 50]],
        preuves: { temoin: 0.6, medical: 0.8, adn: 0.4 },
        enjeux: { liberation: 0.4, role: 0.4 },
        mobiles: ["Un vol de doses reproché à la victime.", "Une dette de crack.", "Une rumeur de dénonciation."],
        resume: (X, f) => `${X.n(X.V)} est retenu${X.e(X.V)} ${f.jours} jours dans un squat et frappé${X.e(X.V)} pour un vol de doses.`,
        victime: (X, f) => [`Ils m'ont attaché${X.e(X.V)} à une chaise. Ils me brûlaient avec des cigarettes pour que je dise où était la came.`, `Un matin, la porte était ouverte, je suis parti${X.e(X.V)}.`],
        medical: (X, f) => ({ kind: "umj", lesions: ["des brûlures circulaires de cigarette, d'âges différents, sur les avant-bras", "des ecchymoses des poignets en bracelet"], itt: int(X.r, 10, 30) }),
        version: () => ({ nie: "Je ne connais pas ce squat.", minimise: "On voulait récupérer ce qu'il avait volé. Il pouvait partir.", reconnait: "On l'a gardé et frappé. Je n'ai pas fait les brûlures." }),
      },
      atelier: {
        w: 1, titre: "l'atelier clandestin", lieu: () => "dans un atelier de confection, à Aubervilliers",
        pers: { A: { min: 30, max: 60, metier: "gérant d'atelier" }, V: { min: 18, max: 45 } },
        imposees: () => ["plusieurs_victimes"], agg: { bande_organisee: 0.3 },
        tirer: (r) => ({ jours: int(r, 30, 300), liberee: false, nbVictimes: int(r, 4, 14) }),
        heures: [[6 * 60, 22 * 60]],
        preuves: { temoin: 0.9, saisie: 0.8, releve: 0.6 },
        enjeux: { role: 0.4, bo: 0.3 },
        mobiles: ["Des ouvriers sans papiers enfermés la nuit.", "Des passeports confisqués à l'arrivée.", "Une dette de voyage à « rembourser »."],
        resume: (X, f) => `${f.nbVictimes} ouvriers sont découverts enfermés dans un atelier où ils dormaient, passeports confisqués ; ${X.n(X.A)}, le gérant, est mis en examen.`,
        victime: (X) => [`On travaillait seize heures. La nuit, ${X.il(X.A)} fermait le rideau métallique de l'extérieur. ${X.Il(X.A)} gardait nos passeports dans un coffre.`, `${X.Il(X.A)} disait que si on partait, la police nous renverrait au pays.`],
        saisie: () => "treize passeports dans un coffre, des registres de « dettes » nominatifs, 24 000 euros en espèces",
        version: () => ({ nie: "Ce sont des employés. Ils rentrent chez eux le soir.", minimise: "Je fermais le rideau contre les vols. Ils avaient une clé.", reconnait: "Je les enfermais. Le patron au-dessus de moi l'exigeait." }),
      },
      bossnapping: {
        w: 1, titre: "les dirigeants retenus", lieu: () => "dans les bureaux d'une usine, à Gennevilliers",
        pers: { A: { min: 28, max: 60, metier: "délégué syndical" }, V: { min: 40, max: 65, metier: "directeur du site" } },
        imposees: () => ["plusieurs_victimes"],
        tirer: (r) => ({ jours: 1, liberee: true, heures: int(r, 10, 30) }),
        heures: [[9 * 60, 18 * 60]],
        preuves: { video: 0.6, temoin: 0.9 },
        enjeux: { role: 0.6 },
        mobiles: ["L'annonce de la fermeture du site.", "Un plan social de deux cents postes.", "Des primes de départ refusées."],
        resume: (X, f) => `Après l'annonce de la fermeture d'une usine, deux dirigeants sont retenus ${f.heures} heures dans un bureau par des salariés ; ${X.n(X.A)} est poursuivi comme meneur.`,
        victime: (X, f) => ["Ils ont bloqué la porte avec des palettes. Personne ne nous a frappés. On nous a apporté des sandwichs.", `Au bout de ${f.heures} heures, ils ont ouvert, après l'intervention du préfet.`],
        version: () => ({ nie: "Je n'ai retenu personne. J'étais là pour calmer les gens.", minimise: "On voulait qu'ils nous écoutent. Ils pouvaient partir à tout moment, en théorie.", reconnait: "On les a gardés. C'était notre seule façon d'être entendus." }),
      },
      racket: {
        w: 1.5, titre: "le racket du lycéen", lieu: (X) => `dans un parking, puis dans un appartement, ${X.rue}`,
        pers: { A: { g: "m", min: 16, max: 22 }, V: { g: "m", min: 14, max: 17 }, C2: true }, mineurA: 0.5, ageMinA: 15, ageV: [14, 17],
        tirer: (r) => ({ jours: 1, liberee: ch(r, 0.7), heures: int(r, 3, 20) }),
        heures: [[16 * 60, 22 * 60]],
        preuves: { telephonie: 0.8, ecrits: 0.7, temoin: 0.4 },
        enjeux: { liberation: 0.4, role: 0.5 },
        mobiles: ["Un téléphone à « rembourser ».", "Une vidéo humiliante pour faire pression.", "Une dette imaginaire."],
        resume: (X, f) => `${X.n(X.V)}, ${X.V.age} ans, est retenu ${f.heures} heures par plusieurs jeunes qui exigent de l'argent de sa famille.`,
        victime: (X, f) => ["Ils m'ont pris mon téléphone et ils m'ont emmené chez l'un d'eux. Ils filmaient en disant que si ma mère ne payait pas, ils allaient me frapper."],
        ecrits: (X) => ["Message à la mère de la victime : « 2000 balles ou ton fils rentre en morceaux »"],
        version: () => ({ nie: "On était juste ensemble, il était d'accord.", minimise: "On voulait qu'il rende ce qu'il devait. Il est rentré chez lui le soir même.", reconnait: "On l'a gardé pour l'argent. C'était l'idée d'un autre, mais j'étais là." }),
      },
      communaute: {
        w: 1, titre: "la communauté", lieu: () => "dans une maison isolée, dans l'Yonne",
        pers: { A: { min: 40, max: 70, metier: "dirigeant d'une association" }, V: { min: 18, max: 45 } },
        tirer: (r) => ({ jours: int(r, 20, 200), liberee: false }),
        heures: [[8 * 60, 20 * 60]],
        preuves: { temoin: 0.8, ecrits: 0.6, expertise: 0.6 },
        enjeux: { role: 0.3, liberation: 0.4 },
        psy: { intact: 0.7, altere: 0.25, aboli: 0.05 },
        mobiles: ["Une adepte voulait quitter la communauté.", "Une femme avait remis ses biens au « guide ».", "Un ancien membre menaçait de témoigner."],
        resume: (X, f) => `${X.n(X.V)} est retenu${X.e(X.V)} ${f.jours} jours dans une communauté dirigée par ${X.n(X.A)} ; ${X.il(X.V)} avait voulu partir.`,
        victime: (X) => [`Ils m'ont enfermé${X.e(X.V)} dans une chambre « de méditation » quand j'ai dit que je voulais rentrer chez mes parents.`, "La porte était fermée de l'extérieur. On me disait que c'était pour mon salut."],
        version: (X) => ({ nie: `${X.Il(X.V)} était libre. C'est une retraite volontaire.`, minimise: `${X.Il(X.V)} traversait une crise. Nous ${X.la(X.V)} protégions d'${X.lui(X.V)}-même.`, reconnait: `Nous l'avons empêché${X.e(X.V)} de partir. Je le regrette.` }),
      },
    },
  });

  // =================================================================== TRAFIC DE STUPÉFIANTS EN BANDE ORGANISÉE
  C.fiche("trafic_bo", {
    fam: "crim_stups", nom: "Trafic de stupéfiants en bande organisée", gravite: 0.8, deces: false, victime: "aucune",
    textes: ["CP_222-34", "CP_222-35", "CP_222-36", "CP_222-37", "CPP_706-88", "CPP_706-31"],
    elements: { legal: "Art. 222-34 à 222-37 CP ; bande organisée, art. 132-71 ; procédure de criminalité organisée, art. 706-73 et 706-88 CPP.", materiel: "Diriger un groupement, produire, importer, transporter, détenir, céder des stupéfiants.", moral: "La connaissance de la nature du produit et de son trafic." },
    prevention: (X, f) => ({ direction: "dirigé ou organisé un groupement ayant pour objet le trafic de stupéfiants", importation: "importé illicitement des produits stupéfiants", production: "produit ou fabriqué illicitement des produits stupéfiants", transport: "transporté, détenu, offert ou cédé illicitement des produits stupéfiants" })[f && f.role] || "transporté, détenu, offert ou cédé illicitement des produits stupéfiants",
    qual(f) {
      const bo = !!f.bo;
      const aggs = bo ? ["bande_organisee"] : [];
      const P = f.produit || "cocaïne";
      if (f.role === "direction") return CAT.crime("perpetuite", 7500000, "art. 222-34 CP", `direction d'un groupement ayant pour objet le trafic de stupéfiants (${P})`, { aggs: [], textes: ["CP_222-34"], prescAns: 30 });
      if (f.role === "importation") return bo ? CAT.crime(360, 7500000, "art. 222-36, al. 2 CP", lab(`importation de stupéfiants (${P})`, aggs), { aggs, textes: ["CP_222-36", "CP_132-71"], prescAns: 30 }) : CAT.delit(120, 7500000, "art. 222-36, al. 1 CP", `importation de stupéfiants (${P})`, { aggs: [], textes: ["CP_222-36"], prescAns: 20 });
      if (f.role === "production") return CAT.crime(bo ? 360 : 240, 7500000, bo ? "art. 222-35, al. 2 CP" : "art. 222-35, al. 1 CP", lab(`production de stupéfiants (${P})`, aggs), { aggs, textes: ["CP_222-35"].concat(bo ? ["CP_132-71"] : []), prescAns: 30 });
      return CAT.delit(120, 7500000, "art. 222-37 CP", `transport, détention, offre et cession de stupéfiants (${P})`, { aggs: [], textes: ["CP_222-37"], prescAns: 20 });
    },
    requalif(r, f) {
      if (f.enjeux.includes("bo") && f.bo && f.role !== "direction") return { f2: Object.assign({}, f, { bo: false }), quoi: "bo" };
      if (f.enjeux.includes("role") && f.role === "direction") return { f2: Object.assign({}, f, { role: "transport" }), quoi: "role" };
      return null;
    },
    ctxs: {
      go_fast: {
        w: 2, titre: "le go-fast", lieu: () => "sur l'autoroute A10, au péage de Saint-Arnoult",
        pers: { A: { g: "m", min: 20, max: 40 }, C2: true },
        tirer: (r) => ({ role: "importation", bo: true, produit: "résine de cannabis", kg: int(r, 200, 900) }),
        heures: [[1 * 60, 6 * 60]],
        preuves: { saisie: 1, telephonie: 0.9, video: 0.4, adn: 0.3 },
        enjeux: { connaissance: 0.45, bo: 0.25, role: 0.4 },
        mobiles: ["Dix mille euros pour un aller-retour en Espagne.", "Une dette envers le réseau.", "Un premier voyage « pour voir »."],
        resume: (X, f) => `Un convoi de deux véhicules venant d'Espagne est intercepté au péage ; ${f.kg} kilos de ${f.produit} dans le coffre. ${X.n(X.A)} conduisait le véhicule chargé.`,
        scene: (X, f) => [`Dispositif de l'office anti-stupéfiants, sur renseignement : interception d'une Audi et d'une Mercedes « ouvreuse » au péage.`, `Dans le coffre et sous la banquette arrière de l'Audi, ${int(X.r, 8, 30)} ballots de ${f.produit}, ${f.kg} kilos au total.`],
        telephonie: (X) => `La ligne de ${X.n(X.A)} et celle du conducteur de la voiture ouvreuse échangent quarante-trois appels pendant le trajet depuis Malaga ; une troisième ligne, au Maroc, les appelle toutes deux.`,
        saisie: (X, f) => `${f.kg} kilos de ${f.produit} conditionnés en ballots de trente kilos, deux téléphones, 3 200 euros en espèces`,
        version: () => ({ nie: "On m'a demandé de ramener une voiture. Je ne savais pas ce qu'il y avait dedans.", minimise: "Je savais qu'il y avait quelque chose. Je pensais à des cigarettes.", reconnait: "Je savais. Dix mille euros. Je n'avais jamais vu autant d'argent." }),
        et: { connaissance: () => ({ piece: "telephonie", fort: "Le mis en examen n'a reçu le véhicule qu'à Malaga, des mains d'un inconnu ; ses échanges avec l'ouvreuse portent sur l'itinéraire et les contrôles, jamais sur la marchandise.", faible: "Dans un message, le mis en examen écrit : « le chargement est bien calé, 30 par ballot »." }) },
      },
      mules: {
        w: 2, titre: "la mule de Cayenne", lieu: () => "à l'aéroport d'Orly, terminal 4, au débarquement du vol de Cayenne",
        pers: { A: { min: 19, max: 55 } },
        tirer: (r) => ({ role: "importation", bo: ch(r, 0.35), produit: "cocaïne", grammes: int(r, 600, 1400), ovules: int(r, 60, 110) }),
        heures: [[6 * 60, 9 * 60]],
        preuves: { saisie: 1, medical: 0.9, telephonie: 0.6 },
        enjeux: { contrainte: 0.45, role: 0.6, bo: 0.3 },
        psy: { intact: 0.85, altere: 0.13, aboli: 0.02 },
        mobiles: ["Trois mille euros promis pour le voyage.", "Une dette contractée par un fils.", "Des menaces sur la famille restée en Guyane."],
        resume: (X, f) => `${X.n(X.A)} est interpellé${X.e(X.A)} à la descente d'avion ; ${f.ovules} ovules de cocaïne (${f.grammes} grammes) sont expulsés à l'hôpital.`,
        scene: (X, f) => ["Contrôle douanier ciblé ; le passager présente des signes de malaise ; le scanner corporel révèle des corps étrangers intestinaux.", `Surveillance hospitalière à l'Hôtel-Dieu : expulsion de ${f.ovules} ovules.`],
        medical: (X, f) => ({ kind: "umj", lesions: [`${f.ovules} ovules thermoscellés, radio-opaques, dans le tube digestif`], itt: 0, texte: "Risque vital en cas de rupture d'un ovule ; surveillance en milieu hospitalier jusqu'à expulsion complète." }),
        saisie: (X, f) => `${f.ovules} ovules contenant ${f.grammes} grammes de cocaïne, un billet aller-retour réglé en espèces, un téléphone`,
        version: (X) => ({ nie: "Je ne savais pas ce que c'était. On m'a dit que c'était de l'or.", minimise: `Je savais que c'était interdit. On m'a forcé${X.e(X.A)}.`, reconnait: `J'ai avalé les ovules. ${X.enfants(X.A) ? "Pour payer la dette de mon fils." : "Pour payer une dette."}` }),
        et: { contrainte: () => ({ piece: "telephonie", fort: "Le téléphone contient des messages vocaux reçus la veille du départ : « si tu montes pas dans l'avion on brûle la maison avec ta mère dedans ».", faible: "Aucun message de menace n'est retrouvé ; le mis en examen évoque « une bonne affaire » à une amie." }) },
      },
      conteneur: {
        w: 1.5, titre: "le conteneur du Havre", lieu: () => "sur le port du Havre, terminal de France",
        pers: { A: { g: "m", min: 25, max: 55, metier: "docker" }, C2: true },
        tirer: (r) => ({ role: "importation", bo: true, produit: "cocaïne", kg: int(r, 150, 1200) }),
        heures: [[2 * 60, 6 * 60]],
        preuves: { saisie: 1, telephonie: 0.95, video: 0.6, releve: 0.6 },
        enjeux: { role: 0.55, connaissance: 0.3, bo: 0.15 },
        mobiles: ["Cinquante mille euros par conteneur « sorti ».", "Un collègue endetté qui l'a recruté.", "Des menaces sur ses enfants."],
        resume: (X, f) => `${f.kg} kilos de cocaïne sont découverts dans un conteneur de bananes ; ${X.n(X.A)}, docker, aurait organisé leur sortie du port.`,
        scene: (X, f) => ["Ciblage douanier d'un conteneur en provenance de l'Équateur.", `Derrière les cartons de bananes, ${Math.round(f.kg / 25)} sacs de sport contenant des pains de cocaïne marqués d'un logo de scorpion.`],
        telephonie: (X) => `Une messagerie cryptée attribuée à ${X.n(X.A)} donne la position du conteneur et l'heure de relève des agents de surveillance, la nuit précédente.`,
        releve: true,
        saisie: (X, f) => `${f.kg} kilos de cocaïne, un téléphone crypté, 86 000 euros en espèces dans un faux plafond`,
        version: (X) => ({ nie: "Je fais mon travail. Je n'ai jamais touché ce conteneur.", minimise: "On m'a demandé l'emplacement d'un conteneur. Je ne savais pas pour quoi.", reconnait: `J'ai donné les emplacements et les horaires. Contre de l'argent. ${X.enfants(X.A) ? "Ils savaient où habitent mes enfants." : "Ils savaient où habite ma famille."}` }),
      },
      point_deal: {
        w: 2.5, titre: "le point de deal", lieu: (X) => `au pied d'un immeuble, ${X.pk(["rue Myrha", "rue Polonceau", "rue Léon", "cité de la Chapelle"])}`,
        pers: { A: { g: "m", min: 16, max: 30 }, C2: true }, mineurA: 0.35, ageMinA: 15,
        tirer: (r) => ({ role: "transport", bo: false, produit: pk(r, ["résine de cannabis", "cocaïne", "crack"]), poste: pk(r, ["guetteur", "vendeur", "nourrice", "gérant"]), recette: int(r, 5, 30) * 1000 }),
        heures: [[10 * 60, 23 * 60]],
        preuves: { telephonie: 0.95, video: 0.8, saisie: 0.8, releve: 0.4 },
        enjeux: { role: 0.65 },
        mobiles: ["Cinquante euros la journée de guet.", "La promesse de devenir « gérant ».", "Une dette envers le point."],
        resume: (X, f) => `Démantèlement d'un point de vente de ${f.produit} réalisant ${CR.money(f.recette)} par jour ; ${X.n(X.A)}, ${X.A.age} ans, y aurait été ${f.poste}.`,
        scene: (X, f) => ["Huit mois de surveillance, de téléphonie et de captation d'images ; interpellation simultanée de onze personnes à l'aube.", `L'organisation relevée : guetteurs payés à la journée, vendeurs, nourrices, un « gérant » qui récupère la recette.`],
        telephonie: (X, f) => `Les écoutes attribuent au mis en examen le rôle de ${f.poste} ; il annonce les passages de police (« ara », « 22 ») et ${f.poste === "gérant" ? "fixe les horaires et la paie" : "reçoit ses consignes d'un « gérant »"}.`,
        saisie: (X, f) => `${int(X.r, 200, 3000)} grammes de ${f.produit}, une balance, des sachets, ${CR.money(int(X.r, 3, 40) * 100)} en coupures de 10 et 20 euros`,
        version: (X, f) => ({ nie: "J'habite là. Je suis tout le temps en bas, comme tout le monde.", minimise: `Je faisais le ${f.poste === "guetteur" ? "guet" : "guet, parfois"}. Pour cinquante euros.`, reconnait: `J'étais ${f.poste}. Je voulais de l'argent pour ma mère.` }),
        et: { role: (X, f) => ({ piece: "telephonie", fort: `Le mis en examen n'apparaît que sept jours sur huit mois, toujours comme guetteur, payé à la journée par un tiers.`, faible: `Le mis en examen apparaît chaque jour sur les images pendant cinq mois et donne des consignes aux vendeurs.` }) },
      },
      direction: {
        w: 1, titre: "la tête du réseau", lieu: () => "entre Paris, la Seine-Saint-Denis et Marbella",
        pers: { A: { g: "m", min: 28, max: 50 }, C2: true },
        tirer: (r) => ({ role: "direction", bo: true, produit: "cocaïne", ca: int(r, 2, 20) }),
        heures: [[8 * 60, 22 * 60]],
        preuves: { telephonie: 1, releve: 0.9, saisie: 0.8, video: 0.4 },
        enjeux: { identification: 0.5, role: 0.45 },
        mobiles: ["Une ascension depuis les points de vente du quartier.", "Un réseau hérité d'un frère incarcéré.", "Une alliance avec un fournisseur sud-américain."],
        resume: (X, f) => `${X.n(X.A)} est présenté comme la tête d'un réseau de cocaïne réalisant ${f.ca} millions d'euros par an ; il est interpellé à son retour d'Espagne.`,
        scene: () => ["Information judiciaire ouverte pour trafic en bande organisée, confiée à une juridiction spécialisée ; deux ans d'enquête.", "Sonorisations, géolocalisations, interceptions d'une messagerie cryptée ; dix-huit interpellations."],
        telephonie: (X) => `L'utilisateur du compte crypté « ${X.pk(["Pablo", "Le Banquier", "Sultan"])} » valide les achats, fixe les prix et ordonne des « corrections » ; l'attribution à ${X.n(X.A)} repose sur des recoupements de localisation et sur une photographie envoyée depuis son appartement.`,
        releve: true,
        saisie: () => "1,2 million d'euros en espèces, des montres de luxe, trois véhicules, un appartement à Marbella (saisie pénale)",
        version: () => ({ nie: "Je suis commerçant. Ce compte n'est pas le mien.", minimise: "J'ai rendu des services, prêté de l'argent. Je ne dirige rien.", reconnait: "Je ne parlerai pas du réseau." }),
        et: { identification: () => ({ piece: "telephonie", fort: "L'attribution du compte crypté repose sur deux recoupements de bornage ; la photographie envoyée ne montre aucun visage.", faible: "L'appareil crypté est saisi sur lui à l'aéroport, déverrouillé par son empreinte." }) },
        actes: () => [{ id: "crypto", t: "La communication des conditions de captation et de transmission des données de la messagerie cryptée par l'autorité étrangère." }],
      },
      culture: {
        w: 1.5, titre: "la culture en hangar", lieu: () => "dans un hangar loué, en Seine-et-Marne",
        pers: { A: { g: "m", min: 20, max: 50 }, C2: true },
        tirer: (r) => ({ role: "production", bo: ch(r, 0.7), produit: "cannabis", pieds: int(r, 800, 5000) }),
        heures: [[8 * 60, 20 * 60]],
        preuves: { saisie: 1, telephonie: 0.7, releve: 0.5, temoin: 0.4 },
        enjeux: { contrainte: 0.45, role: 0.5, bo: 0.3 },
        mobiles: ["Un jardinier logé sur place, passeport confisqué.", "Une reconversion d'un ancien maraîcher endetté.", "Un réseau qui loue des hangars sous de faux noms."],
        resume: (X, f) => `Une plantation de ${f.pieds} pieds de cannabis est découverte dans un hangar ; ${X.n(X.A)}, trouvé sur place, y vivait.`,
        scene: (X, f) => ["Signalement d'une consommation électrique anormale par le fournisseur d'énergie.", `${f.pieds} pieds sous lampes, système d'irrigation, extracteurs ; un matelas et un réchaud dans un local technique.`],
        saisie: (X, f) => `${f.pieds} pieds de cannabis, 46 kilos de têtes séchées, des lampes à sodium, un téléphone`,
        version: () => ({ nie: "Je suis gardien. Je ne savais pas ce qui poussait.", minimise: "J'arrosais. On ne me payait pas. Je ne pouvais pas partir.", reconnait: "Je cultivais pour eux. Ils avaient mon passeport." }),
        et: { contrainte: () => ({ piece: "temoin", fort: "Le mis en examen était enfermé de l'extérieur la nuit ; son passeport est retrouvé dans la voiture d'un autre mis en cause.", faible: "Le mis en examen disposait d'une clé et sortait chaque jour faire ses courses." }) },
      },
      darknet: {
        w: 1.5, titre: "les colis du darknet", lieu: (X) => `au domicile de ${X.n(X.A)}, ${X.A.adresse}`,
        pers: { A: { min: 19, max: 40, metier: "étudiant" } },
        tirer: (r) => ({ role: "importation", bo: false, produit: pk(r, ["MDMA", "cocaïne", "kétamine"]), colis: int(r, 12, 140) }),
        heures: [[9 * 60, 20 * 60]],
        preuves: { saisie: 1, releve: 0.8, telephonie: 0.6, expertise: 0.7 },
        enjeux: { identification: 0.55 },
        mobiles: ["Un « shop » ouvert pendant le confinement.", "Des cryptomonnaies à blanchir.", "Une revente aux étudiants du campus."],
        resume: (X, f) => `${f.colis} colis de ${f.produit} venant des Pays-Bas sont adressés à des boîtes aux lettres « relais » ; les enquêteurs remontent à ${X.n(X.A)}.`,
        scene: () => ["Signalement de La Poste ; livraisons surveillées ; perquisition au domicile.", "Un ordinateur ouvert sur une plateforme du darknet."],
        expertise: () => "Expertise informatique : l'ordinateur contient un portefeuille de cryptomonnaies et les identifiants d'une boutique ; plusieurs utilisateurs se connectaient à la même session.",
        saisie: (X, f) => `${int(X.r, 300, 4000)} grammes de ${f.produit}, des enveloppes à bulles, une soudeuse sous vide, un ordinateur`,
        version: () => ({ nie: "Mon colocataire utilisait mon ordinateur.", minimise: "J'achetais pour moi et des amis.", reconnait: "C'était ma boutique. Je la tenais seul." }),
        et: { identification: () => ({ piece: "expertise", fort: "L'expert relève que trois personnes partageaient l'ordinateur et la session ; aucune connexion n'est attribuable au seul mis en examen.", faible: "Seules les empreintes et le mot de passe du mis en examen donnent accès à la boutique." }) },
      },
      nourrice: {
        w: 1.5, titre: "la nourrice", lieu: (X) => `au domicile de ${X.n(X.A)}, ${X.A.adresse}`,
        pers: { A: { min: 30, max: 70 } },
        tirer: (r) => ({ role: "transport", bo: false, produit: pk(r, ["cocaïne", "résine de cannabis"]), kg: int(r, 2, 40) }),
        heures: [[6 * 60, 7 * 60]],
        preuves: { saisie: 1, telephonie: 0.6 },
        enjeux: { contrainte: 0.6, connaissance: 0.3 },
        mobiles: ["{Il} gardait un sac « pour un voisin ».", "Son fils était dans le réseau.", "On {le} payait cinq cents euros par mois."],
        resume: (X, f) => `${f.kg} kilos de ${f.produit} sont découverts dans un placard chez ${X.n(X.A)}, ${X.A.age} ans, qui gardait le stock d'un réseau.`,
        scene: (X, f) => ["Perquisition à six heures dans le cadre de l'information ouverte contre un réseau.", `Dans un placard de la chambre, deux sacs de sport : ${f.kg} kilos de ${f.produit}, une arme de poing.`],
        saisie: (X, f) => `${f.kg} kilos de ${f.produit}, une arme de poing approvisionnée, 9 000 euros en espèces`,
        version: (X) => ({ nie: "Ce n'est pas à moi. Je ne sais pas qui a mis ça là.", minimise: "On m'a demandé de garder un sac. Je n'ai pas ouvert.", reconnait: `Je savais. Ils m'ont menacé${X.e(X.A)}. ${X.enfants(X.A) ? "J'ai peur pour mon fils." : "J'ai peur pour ma famille."}` }),
      },
    },
  });

  // =================================================================== INCENDIE CRIMINEL
  C.fiche("incendie_criminel", {
    fam: "crim_biens", nom: "Incendie volontaire", gravite: 0.7, deces: false,
    textes: ["CP_322-6", "CP_322-7", "CP_322-8", "CP_322-10"],
    elements: { legal: "Art. 322-6 à 322-10 CP ; le mobile raciste ou religieux figure à l'art. 322-8.", materiel: "La destruction d'un bien appartenant à autrui par l'effet d'un incendie de nature à créer un danger pour les personnes ; les suites (blessures, mort) et la bande organisée font le crime.", moral: "La volonté de mettre le feu ; pas besoin de vouloir les suites." },
    prevention: (X) => `volontairement détruit ou dégradé, par l'effet d'un incendie de nature à créer un danger pour les personnes, un bien appartenant à autrui`,
    qual(f) {
      const aggs = (f.agg || []).filter((a) => ["bande_organisee", "racisme"].includes(a));
      const rac = aggs.includes("racisme");
      if (f.sansDanger) return CAT.delit(rac ? 36 : 24, 30000, "art. 322-1 CP", lab("destruction du bien d'autrui par incendie", aggs.filter((a) => a === "racisme")), { aggs: aggs.filter((a) => a === "racisme"), textes: ["CP_322-1"].concat(rac ? ["CP_132-76"] : []) });
      // Paliers vérifiés (novembre 2026) : 322-6, dix ans ; 322-7, ITT de huit jours au plus, quinze ans ; 322-8, bande organisée,
      // ITT de plus de huit jours ou mobile raciste, vingt ans ; 322-10, mort, perpétuité (la mutilation, 322-9, n'est pas tirée).
      const palier = f.mort ? 4 : aggs.includes("bande_organisee") || rac || f.itt > 8 ? 3 : f.itt > 0 ? 2 : 1;
      const art = ["", "art. 322-6 CP", "art. 322-6 et 322-7 CP", "art. 322-6 et 322-8 CP", "art. 322-6 et 322-10 CP"][palier];
      const base = f.mort ? "destruction par incendie ayant entraîné la mort" : f.itt > 8 ? "destruction par incendie ayant entraîné une incapacité totale de travail de plus de huit jours" : f.itt > 0 ? "destruction par incendie ayant entraîné une incapacité totale de travail de huit jours au plus" : "destruction du bien d'autrui par incendie de nature à créer un danger pour les personnes";
      const textes = ["CP_322-6"].concat(palier === 4 ? ["CP_322-10"] : palier === 3 ? ["CP_322-8"] : palier === 2 ? ["CP_322-7"] : []);
      if (palier === 1) return CAT.delit(120, 150000, art, lab(base, aggs), { aggs, textes });
      return CAT.crime(palier === 4 ? "perpetuite" : palier === 3 ? 240 : 180, 150000, art, lab(base, aggs), { aggs, textes });
    },
    requalif(r, f) {
      if (f.enjeux.includes("danger")) return { f2: Object.assign({}, f, { sansDanger: true, itt: 0, mort: false }), quoi: "danger" };
      if (f.enjeux.includes("causalite") && (f.itt > 8 || f.mort)) return { f2: Object.assign({}, f, { itt: 0, mort: false }), quoi: "causalite" };
      return null;
    },
    ctxs: {
      immeuble_ex: {
        w: 2.5, titre: "le feu chez son ancienne compagne", lieu: (X) => `dans l'immeuble de la victime, ${X.V.adresse}`,
        pers: { A: { g: "m", min: 22, max: 60 }, V: { g: "f", rel: "conjoint" } },
        tirer: (r) => ({ itt: pk(r, [0, 12, 21, 45]), mort: false, accelerant: true }),
        heures: [[1 * 60, 5 * 60]],
        preuves: { expertise: 1, video: 0.5, telephonie: 0.8, saisie: 0.6, temoin: 0.5 },
        enjeux: { identification: 0.4, danger: 0.15 },
        mobiles: ["{VIl} avait refait sa vie.", "{VIl} venait d'obtenir une ordonnance de protection.", "{Il} ne supportait pas la rupture."],
        resume: (X, f) => `Un incendie est allumé de nuit devant la porte de ${X.n(X.V)}, l'ancienne compagne de ${X.n(X.A)}${f.itt > 8 ? ` ; elle est hospitalisée, ${f.itt} jours d'ITT` : ""}.`,
        scene: () => ["Intervention des sapeurs-pompiers pour un feu de palier au 3e étage ; évacuation de l'immeuble par l'échelle aérienne.", "Une odeur d'essence ; un jerrican fondu dans l'escalier."],
        victime: (X) => [`L'alarme m'a réveillé${X.e(X.V)}, la porte était en feu. ${X.enfants(X.V) ? "J'ai pris mon fils et on est sortis sur le balcon." : `Je suis sorti${X.e(X.V)} sur le balcon, je ne pouvais plus respirer.`}`],
        medical: (X, f) => (f.itt > 0 ? { kind: "umj", lesions: C.lesions(X.r, "feu", true), itt: f.itt } : { kind: "aucun" }),
        expertise: () => "Laboratoire central : hydrocarbures légers (essence) sur le palier et sous la porte ; foyer unique, départ de feu volontaire.",
        telephonie: (X) => `La ligne de ${X.n(X.A)}, inactive depuis 22 heures, se rallume à 4 h 12 sur le relais couvrant l'immeuble de la victime.`,
        version: () => ({ nie: "J'étais chez moi. Je dormais.", minimise: "J'ai voulu lui faire peur. J'ai mis un peu d'essence sur le paillasson.", reconnait: "J'ai mis le feu. Je voulais qu'elle ait peur comme j'ai eu mal." }),
      },
      assurance: {
        w: 2, titre: "le restaurant en feu", lieu: (X) => `dans un restaurant, ${X.rue}`,
        pers: { A: { min: 30, max: 60, metier: "restaurateur" } },
        tirer: (r) => ({ itt: 0, mort: false, prime: int(r, 80, 400) * 1000 }),
        heures: [[2 * 60, 5 * 60]],
        preuves: { expertise: 1, releve: 0.9, video: 0.5, telephonie: 0.6 },
        enjeux: { identification: 0.4, danger: 0.4 },
        mobiles: ["Un fonds de commerce invendable.", "Des dettes fiscales.", "Un bail qui prenait fin."],
        resume: (X, f) => `Le restaurant de ${X.n(X.A)}, criblé de dettes, brûle une nuit ; l'assureur refuse de payer ${CR.money(f.prime)} et dépose plainte.`,
        scene: () => ["Feu de commerce au rez-de-chaussée d'un immeuble de six étages ; vingt-trois habitants évacués.", "Deux foyers distincts : la cuisine et la réserve."],
        expertise: () => "Expert incendie : deux foyers distincts, sans lien entre eux ; présence d'un accélérant ; les détecteurs avaient été débranchés.",
        releve: true,
        version: () => ({ nie: "C'était la friteuse. Un accident.", minimise: "Je n'ai rien fait. Peut-être un ancien employé qui m'en voulait.", reconnait: "J'ai mis le feu. Je pensais que personne ne risquait rien, la nuit." }),
        et: { danger: () => ({ piece: "expertise", fort: "Le local commercial est séparé des étages par une dalle coupe-feu ; aucun habitant n'était exposé selon l'expert.", faible: "Les fumées sont montées par la gaine technique jusqu'au sixième étage, où deux habitants ont été intoxiqués." }) },
      },
      emeutes: {
        w: 2, titre: "les voitures incendiées", lieu: (X) => `${X.rue}, lors d'une nuit de violences urbaines`,
        pers: { A: { g: "m", min: 14, max: 22 }, C2: true }, mineurA: 0.55, ageMinA: 13,
        agg: { reunion: 0 },
        tirer: (r) => ({ itt: 0, mort: false, vehicules: int(r, 2, 9) }),
        heures: [[22 * 60, 23 * 60 + 50], [0, 3 * 60]],
        preuves: { video: 0.9, telephonie: 0.7, saisie: 0.5 },
        enjeux: { identification: 0.65, danger: 0.3 },
        mobiles: ["La mort d'un jeune du quartier lors d'un contrôle.", "Des vidéos appelant à « tout brûler ».", "Un défi entre groupes."],
        resume: (X, f) => `${f.vehicules} véhicules incendiés lors d'une nuit de violences urbaines ; ${X.n(X.A)}, ${X.A.age} ans, est identifié sur une vidéo.`,
        scene: (X, f) => [`${f.vehicules} véhicules en feu, stationnés le long des immeubles ; une façade noircie jusqu'au deuxième étage.`],
        video: () => "Vidéo diffusée sur un réseau social : un individu en survêtement, visage partiellement masqué, verse un liquide sur un véhicule et l'enflamme.",
        version: () => ({ nie: "Ce n'est pas moi sur la vidéo. On était tous habillés pareil.", minimise: "J'étais là. Je n'ai rien brûlé.", reconnait: "J'ai mis le feu à une voiture. Je ne sais pas pourquoi, tout le monde le faisait." }),
        et: { danger: () => ({ piece: "expertise", fort: "Les véhicules étaient garés sur un parking isolé, à plus de trente mètres de toute habitation.", faible: "Les véhicules étaient garés contre la façade ; les flammes ont atteint des fenêtres d'appartements occupés." }) },
      },
      squat: {
        w: 1.5, titre: "l'incendie mortel du squat", lieu: () => "dans un immeuble squatté, rue Doudeauville",
        pers: { A: { min: 20, max: 50 }, V: { min: 20, max: 60 }, P: "fratrie" },
        tirer: (r) => ({ itt: 0, mort: true }),
        deces: true,
        heures: [[1 * 60, 6 * 60]],
        preuves: { expertise: 1, temoin: 0.8, telephonie: 0.5 },
        enjeux: { causalite: 0.35, identification: 0.4 },
        mobiles: ["Une dispute entre occupants.", "Une vengeance après un vol.", "Pour chasser un groupe rival."],
        resume: (X) => `Un incendie volontaire dans un squat tue ${X.n(X.V)} ; ${X.n(X.A)}, ancien occupant, est mis en examen.`,
        medical: (X) => ({ kind: "autopsie", lesions: C.lesions(X.r, "feu", false), cause: C.cause("feu") }),
        scene: () => ["Incendie d'un immeuble insalubre occupé par une quarantaine de personnes ; un corps découvert au deuxième étage.", "Un départ de feu au pied de l'unique escalier."],
        expertise: () => "Expert incendie : départ de feu au pied de l'escalier, à l'aide d'un accélérant ; propagation rapide par la cage d'escalier.",
        temoin: (X) => [`${X.Il(X.A)} avait juré qu'${X.il(X.A)} nous ferait sortir d'ici. ${X.Il(X.A)} est revenu${X.e(X.A)} cette nuit-là, je l'ai vu${X.e(X.A)} dans l'escalier.`],
        version: () => ({ nie: "Je n'y étais plus depuis des semaines.", minimise: "J'ai mis le feu à un matelas en bas. Je pensais que ça ferait juste de la fumée.", reconnait: "J'ai mis le feu. Je ne voulais tuer personne." }),
        et: { causalite: () => ({ piece: "medical", fort: "La victime présentait une alcoolémie de 3,4 g/l ; l'expert discute une impossibilité de fuir indépendante de l'incendie.", faible: "La victime est morte d'une intoxication aux fumées, dans la cage d'escalier, en tentant de fuir." }) },
      },
      molotov: {
        w: 1.5, titre: "le cocktail Molotov dans le bar", lieu: (X) => `dans un bar, ${X.rue}`,
        pers: { A: { g: "m", min: 20, max: 45 }, V: { min: 20, max: 60 } },
        tirer: (r) => ({ itt: int(r, 9, 60), mort: false }),
        heures: [[21 * 60, 23 * 60 + 50]],
        preuves: { video: 0.8, expertise: 0.9, telephonie: 0.7, temoin: 0.7 },
        enjeux: { identification: 0.55 },
        mobiles: ["Une expulsion de l'établissement la semaine précédente.", "Une dette avec le gérant.", "Une rivalité de commerces."],
        resume: (X, f) => `Un cocktail incendiaire est lancé dans un bar plein ; ${X.n(X.V)} est grièvement brûlé${X.e(X.V)} (${f.itt} jours d'ITT). ${X.n(X.A)} est mis en examen.`,
        scene: () => ["Bouteille enflammée projetée par la porte ouverte ; feu sur la moquette et sur deux clients.", "Débris de verre et mèche en tissu sur place."],
        victime: () => ["J'ai vu une flamme passer au-dessus de ma tête. Après, ma jambe brûlait."],
        medical: (X, f) => ({ kind: "umj", lesions: C.lesions(X.r, "feu", true), itt: f.itt }),
        expertise: () => "Laboratoire : bouteille contenant un mélange d'essence et d'huile ; mèche en coton.",
        version: () => ({ nie: "Je n'étais pas dans le quartier.", minimise: "Je voulais brûler la devanture, pas les gens.", reconnait: "J'ai lancé la bouteille. J'étais fou de rage." }),
      },
      pyromane: {
        w: 1, titre: "le pyromane", lieu: (X) => `dans plusieurs locaux à poubelles, ${X.rue} et rues voisines`,
        pers: { A: { min: 18, max: 60 } },
        tirer: (r) => ({ itt: pk(r, [0, 0, 10]), mort: false, feux: int(r, 6, 24) }),
        psy: { intact: 0.4, altere: 0.5, aboli: 0.1 },
        heures: [[1 * 60, 5 * 60]],
        preuves: { video: 0.7, telephonie: 0.8, temoin: 0.4 },
        enjeux: { altere: 0.5, danger: 0.4 },
        mobiles: ["Une fascination pour le feu depuis l'enfance.", "Une rupture, et des nuits d'errance.", "{Il} appelait {lui}-même les pompiers."],
        resume: (X, f) => `${f.feux} départs de feu en deux mois dans des locaux à poubelles du quartier ; le dernier s'étend à un immeuble. ${X.n(X.A)} est interpellé.`,
        scene: () => ["Feu de local à poubelles propagé à la cage d'escalier ; quarante habitants évacués.", "Le requérant de l'appel aux pompiers est le mis en cause lui-même."],
        telephonie: (X) => `La ligne de ${X.n(X.A)} est présente à proximité de dix-neuf des départs de feu ; elle appelle le 18 à sept reprises.`,
        version: () => ({ nie: "Je passais. J'ai appelé les pompiers, c'est tout.", minimise: "J'ai allumé des poubelles. Pas les immeubles.", reconnait: "Je mets le feu. Je n'arrive pas à m'en empêcher." }),
      },
      lieu_culte: {
        w: 1.2, titre: "l'incendie du lieu de culte", lieu: (X) => `devant un lieu de culte, ${X.rue}`,
        pers: { A: { g: "m", min: 18, max: 50 } },
        imposees: () => ["racisme"],
        tirer: (r) => ({ itt: 0, mort: false }),
        heures: [[1 * 60, 5 * 60]],
        preuves: { video: 0.8, saisie: 0.8, telephonie: 0.7, ecrits: 0.8 },
        enjeux: { identification: 0.5, danger: 0.4 },
        mobiles: ["Des messages haineux publiés depuis des mois.", "Un groupe en ligne qui appelait à « agir ».", "Une série de tags la semaine précédente."],
        resume: (X) => `Un incendie est allumé contre la porte d'un lieu de culte, de nuit ; des messages haineux sont retrouvés chez ${X.n(X.A)}.`,
        scene: () => ["Porte en bois et vitraux du rez-de-chaussée détruits ; le logement du gardien, au-dessus, est enfumé.", "Des tags injurieux sur la façade."],
        ecrits: (X) => ["Publications saisies : appels à « nettoyer le quartier », images de lieux de culte barrées d'une croix."],
        saisie: () => "un bidon d'essence, des gants, un ordinateur contenant les publications",
        version: () => ({ nie: "Ces messages, c'est de l'humour. Je n'ai rien brûlé.", minimise: "J'ai fait les tags. Pas le feu.", reconnait: "J'ai mis le feu. Je ne pensais pas au gardien." }),
        et: { danger: () => ({ piece: "expertise", fort: "La porte incendiée donne sur une salle vide ; le logement du gardien, de l'autre côté du bâtiment, n'a pas été exposé.", faible: "Le logement du gardien, juste au-dessus de la porte, a été envahi par les fumées." }) },
      },
      bailleur: {
        w: 1, titre: "le marchand de sommeil", lieu: () => "dans un immeuble insalubre, rue Marx-Dormoy",
        pers: { A: { g: "m", min: 40, max: 70, metier: "propriétaire bailleur" }, V: { min: 20, max: 60 }, P: "fratrie" },
        tirer: (r) => ({ itt: 0, mort: ch(r, 0.4) }),
        deces: (X, f) => f.mort,
        heures: [[2 * 60, 5 * 60]],
        preuves: { expertise: 1, temoin: 0.8, releve: 0.6 },
        enjeux: { identification: 0.5, causalite: 0.3 },
        mobiles: ["Des locataires qui refusaient de partir avant la vente.", "Un permis de démolir obtenu.", "Des loyers impayés."],
        resume: (X, f) => `Un incendie détruit un immeuble que son propriétaire, ${X.n(X.A)}, voulait vider${f.mort ? ` ; ${X.n(X.V)} meurt` : ""}.`,
        scene: () => ["Feu dans les parties communes ; les portes palières avaient été retirées « pour travaux ».", "Les locataires décrivent des menaces répétées du propriétaire."],
        medical: (X, f) => (f.mort ? { kind: "autopsie", lesions: C.lesions(X.r, "feu", false), cause: C.cause("feu") } : { kind: "aucun" }),
        expertise: () => "Expert incendie : départ de feu volontaire dans un local de stockage du rez-de-chaussée ; les extincteurs avaient été retirés.",
        temoin: () => ["Il nous disait qu'il nous ferait partir « d'une façon ou d'une autre ». Deux jours avant, il a retiré les extincteurs."],
        version: () => ({ nie: "Je n'étais pas à Paris. Ce sont les locataires, ils fument partout.", minimise: "Je voulais qu'ils partent, oui. Pas comme ça.", reconnait: "J'ai payé quelqu'un pour mettre le feu au local. Il ne devait y avoir personne." }),
      },
    },
  });
})();
