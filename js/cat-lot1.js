/* La Permanence — catalogue, lot 1 du programme : infractions voisines tirées comme des variantes des fiches existantes.
   Une variante est une scène de la fiche (f.sc) qui a sa propre qualification, son récit et, au besoin, ses preuves, mesures,
   victime et genres (I.scn[sc], lu par CAT.ficheDe). Violences : violences habituelles sur personne vulnérable, embuscade,
   administration de substances nuisibles, diffusion d'images de violences ; menaces : contre une personne chargée d'une mission
   de service public, intimidation d'une victime, subornation de témoin ; outrage à magistrat ; filouterie ; occupation d'un
   local et maintien malgré une expulsion ; entrave à un système informatique et extraction de données ; non-justification de
   ressources ; importation de stupéfiants, blanchiment du trafic, provocation à l'usage ; usurpation d'état civil.
   Rédigé le 9 novembre 2026, puis vérifié en ligne le même jour (Légifrance surtout ; sources secondaires indiquées texte par texte). */
(function () {
  const CR = window.CR;
  const CAT = CR.CAT;
  const { pk, int, ch } = CAT;
  const eur = (n) => CR.money(n);
  const cap = (s) => CR.cap(s);
  const S = (cite, texte) => ({ cite, texte, etat: "resume", extrait: false, source: CAT.VERIF });
  // texte vérifié en ligne le 9 novembre 2026 (Légifrance, ou source indiquée) ; le résumé reste une reformulation
  const SV = (cite, texte, src) => ({ cite, texte, etat: "resume", extrait: false, source: `Vérifié le 9 novembre 2026 (${src || "Légifrance"}) — résumé, le texte officiel fait foi` });
  const ittTexte = (itt) => (itt > 8 ? `une incapacité totale de travail de ${itt} jours` : itt ? `une incapacité totale de travail de ${itt} jour${itt > 1 ? "s" : ""}` : "aucune incapacité totale de travail");

  // ------------------------------------------------------------------ Textes (résumés, à revérifier)
  Object.assign(CAT.TEXTES, {
    "CP_222-14": [SV("Art. 222-14 du code pénal", "Les violences habituelles sur un mineur de quinze ans ou sur une personne dont la particulière vulnérabilité, due à son âge, à une maladie, à une infirmité, à une déficience physique ou psychique ou à un état de grossesse, est apparente ou connue de leur auteur, ou sur une personne en état de sujétion psychologique ou physique, sont punies de cinq ans d'emprisonnement et de 75 000 euros d'amende lorsqu'elles ont entraîné une incapacité totale de travail n'excédant pas huit jours, de dix ans et de 150 000 euros lorsqu'elles ont entraîné une incapacité de plus de huit jours, et de vingt ou trente ans de réclusion criminelle en cas de mutilation, d'infirmité permanente ou de mort. Les mêmes peines s'appliquent aux violences habituelles commises par le conjoint, le concubin ou le partenaire lié par un pacte civil de solidarité."), "Violences habituelles sur mineur ou personne vulnérable"],
    "CP_222-15": [SV("Art. 222-15 du code pénal", "L'administration de substances nuisibles ayant porté atteinte à l'intégrité physique ou psychique d'autrui est punie des peines mentionnées aux articles 222-7 à 222-14-1, suivant les distinctions prévues par ces articles."), "Administration de substances nuisibles"],
    "CP_222-15-1": [SV("Art. 222-15-1 du code pénal", "Constitue une embuscade le fait d'attendre un certain temps et dans un lieu déterminé un policier, un gendarme, un membre du personnel pénitentiaire ou toute autre personne dépositaire de l'autorité publique, un sapeur-pompier ou un agent d'un exploitant de réseau de transport public de voyageurs, dans le but, caractérisé par un ou plusieurs faits matériels, de commettre à son encontre, à l'occasion de l'exercice de ses fonctions, des violences avec usage ou menace d'une arme. Le texte protège aussi ses proches, visés en raison de ses fonctions. Elle est punie de cinq ans d'emprisonnement et de 75 000 euros d'amende ; sept ans et 100 000 euros lorsqu'elle est commise en réunion."), "L'embuscade"],
    "CP_222-33-3": [SV("Art. 222-33-3 du code pénal", "Est constitutif d'un acte de complicité des atteintes volontaires à l'intégrité de la personne le fait d'enregistrer sciemment, par quelque moyen que ce soit, sur tout support que ce soit, des images relatives à leur commission. Le fait de diffuser l'enregistrement de telles images est puni de cinq ans d'emprisonnement et de 75 000 euros d'amende. Le texte ne s'applique pas lorsque l'enregistrement ou la diffusion relève de l'exercice normal d'une profession qui informe le public, ou est réalisé pour servir de preuve en justice.", "presse, octobre 2026"), "Enregistrement et diffusion d'images de violences"],
    "CP_433-3": [SV("Art. 433-3 du code pénal", "La menace de commettre un crime ou un délit contre les personnes ou les biens proférée à l'encontre d'une personne dépositaire de l'autorité publique, chargée d'une mission de service public ou exerçant une des fonctions que le texte énumère (élus, magistrats, avocats, enseignants et personnels des établissements scolaires, agents d'un exploitant de transport public de voyageurs, professionnels de santé, agents de sécurité privée, notamment), lorsque sa qualité est apparente ou connue de l'auteur, est punie de trois ans d'emprisonnement et de 45 000 euros d'amende ; de cinq ans et 75 000 euros s'il s'agit d'une menace de mort ou d'atteinte aux biens dangereuse pour les personnes. User de menaces ou d'actes d'intimidation pour obtenir que la personne accomplisse ou s'abstienne d'accomplir un acte de sa fonction est puni de dix ans et 150 000 euros."), "Menaces contre une personne chargée d'une mission de service public"],
    "CP_434-5": [SV("Art. 434-5 du code pénal", "Toute menace ou tout autre acte d'intimidation à l'égard de quiconque, commis en vue de déterminer la victime d'un crime ou d'un délit à ne pas porter plainte ou à se rétracter, est puni de trois ans d'emprisonnement et de 45 000 euros d'amende."), "L'intimidation de la victime"],
    "CP_434-24": [SV("Art. 434-24 du code pénal", "L'outrage par paroles, gestes ou menaces, par écrits ou images de toute nature non rendus publics ou par l'envoi d'objets quelconques adressé à un magistrat, à un juré ou à toute personne siégeant dans une formation juridictionnelle dans l'exercice de ses fonctions ou à l'occasion de cet exercice et tendant à porter atteinte à sa dignité ou au respect dû à la fonction dont il est investi est puni d'un an d'emprisonnement et de 15 000 euros d'amende ; de deux ans et 30 000 euros s'il a lieu à l'audience."), "L'outrage à magistrat"],
    "CP_313-5": [SV("Art. 313-5 du code pénal", "La filouterie est le fait, par une personne qui sait être dans l'impossibilité absolue de payer ou qui est déterminée à ne pas payer, de se faire servir des boissons ou des aliments dans un établissement vendant des boissons ou des aliments, de se faire attribuer et d'occuper effectivement une ou plusieurs chambres dans un établissement louant des chambres (séjour de dix jours au plus), de faire remplir son réservoir de carburant par un professionnel de la distribution ou de se faire transporter en taxi ou en voiture de place. Elle est punie de six mois d'emprisonnement et de 7 500 euros d'amende. Depuis la loi du 24 janvier 2023, l'action publique peut être éteinte par une amende forfaitaire délictuelle de 300 euros (250 euros minorée, 600 euros majorée)."), "La filouterie"],
    "CP_315-1": [SV("Art. 315-1 du code pénal", "L'introduction dans un local à usage d'habitation ou à usage commercial, agricole ou professionnel à l'aide de manœuvres, menaces, voies de fait ou contrainte, hors les cas où la loi le permet, est punie de deux ans d'emprisonnement et de 30 000 euros d'amende. Le maintien dans le local à la suite de cette introduction est puni des mêmes peines."), "L'occupation frauduleuse d'un local"],
    "CP_315-2": [SV("Art. 315-2 du code pénal", "Le maintien sans droit ni titre dans un local à usage d'habitation en violation d'une décision de justice définitive et exécutoire ayant donné lieu à un commandement régulier de quitter les lieux depuis plus de deux mois est puni de 7 500 euros d'amende. Le texte ne s'applique pas pendant la trêve hivernale, lorsque le juge est saisi d'une demande de délais (jusqu'à sa décision de rejet) ou que les délais accordés courent encore, ni lorsque le logement appartient à un bailleur social ou à une personne morale de droit public.", "Légifrance et ANIL"), "Le maintien malgré une décision d'expulsion"],
    "CP_323-2": [SV("Art. 323-2 du code pénal", "Le fait d'entraver ou de fausser le fonctionnement d'un système de traitement automatisé de données est puni de cinq ans d'emprisonnement et de 150 000 euros d'amende."), "Entrave à un système informatique"],
    "CP_323-3": [SV("Art. 323-3 du code pénal", "Le fait d'introduire frauduleusement des données dans un système de traitement automatisé, d'extraire, de détenir, de reproduire, de transmettre, de supprimer ou de modifier frauduleusement les données qu'il contient est puni de cinq ans d'emprisonnement et de 150 000 euros d'amende."), "Atteintes aux données d'un système informatique"],
    "CP_321-6": [SV("Art. 321-6 du code pénal", "Le fait de ne pas pouvoir justifier de ressources correspondant à son train de vie ou de ne pas pouvoir justifier de l'origine d'un bien détenu, tout en étant en relations habituelles avec une ou plusieurs personnes qui soit se livrent à la commission de crimes ou de délits punis d'au moins cinq ans d'emprisonnement et procurant à celles-ci un profit direct ou indirect, soit sont les victimes d'une de ces infractions, est puni de trois ans d'emprisonnement et de 75 000 euros d'amende. Les biens dont l'origine n'est pas justifiée sont en principe confisqués.", "Juritravail, version du 15 juin 2025"), "La non-justification de ressources"],
    "CP_222-38": [SV("Art. 222-38 du code pénal", "Est puni de dix ans d'emprisonnement et de 750 000 euros d'amende le fait de faciliter, par tout moyen, la justification mensongère de l'origine des biens ou des revenus de l'auteur d'un trafic de stupéfiants, ou d'apporter son concours à une opération de placement, de dissimulation ou de conversion du produit de ce trafic. L'amende peut être portée à la moitié de la valeur des biens ou des fonds en cause.", "cabinet ACI, page mise à jour en juin 2026"), "Le blanchiment du trafic de stupéfiants"],
    "CSP_L3421-4": [SV("Art. L. 3421-4 du code de la santé publique", "La provocation au délit d'usage illicite de stupéfiants, au trafic de stupéfiants, ou le fait de présenter ces infractions sous un jour favorable, même lorsque la provocation n'a pas été suivie d'effet, est puni de cinq ans d'emprisonnement et de 75 000 euros d'amende ; sept ans et 100 000 euros lorsque les faits sont commis dans un établissement d'enseignement ou à ses abords, aux heures d'entrée et de sortie des élèves.", "CIDJ, septembre 2023"), "Provocation à l'usage de stupéfiants"],
    "CP_434-23": [SV("Art. 434-23 du code pénal", "Le fait de prendre le nom d'un tiers, dans des circonstances qui ont déterminé ou auraient pu déterminer contre celui-ci des poursuites pénales, est puni de cinq ans d'emprisonnement et de 75 000 euros d'amende."), "L'usurpation d'état civil"],
  });
  CAT.installTextes();

  // ------------------------------------------------------------------ Mécanique des variantes
  // p : part des affaires de la fiche qui tombent sur une variante (CAT.LOT1_P la force, pour les tests) ; V[sc] : { poids, tirer(r), qual(f), recit(X, f), requalif, scn }
  CAT.LOT1 = {};
  function variantes(id, p, V) {
    const I = CAT.INF[id];
    const t0 = I.tirer, q0 = I.qual, r0 = I.recit, rq0 = I.requalif;
    I.scn = Object.assign(I.scn || {}, Object.fromEntries(Object.entries(V).map(([k, v]) => [k, v.scn || {}])));
    CAT.LOT1[id] = Object.keys(V);
    const poids = Object.fromEntries(Object.entries(V).map(([k, v]) => [k, v.poids || 1]));
    I.tirer = function (r) {
      if (r() < (CAT.LOT1_P != null ? CAT.LOT1_P : p)) { const sc = CAT.poids(r, poids); return Object.assign({ agg: [] }, V[sc].tirer(r), { sc }); }
      return t0.call(this, r);
    };
    I.qual = function (f) { const v = f && V[f.sc]; return v ? v.qual(f) : q0.call(this, f); };
    I.recit = function (X, f) { const v = f && V[f.sc]; return v ? v.recit(X, f) : r0.call(this, X, f); };
    I.requalif = function (r, f) { const v = f && V[f.sc]; if (v) return v.requalif ? v.requalif(r, f) : null; return rq0 ? rq0.call(this, r, f) : null; };
  }
  const itt8 = (r, f) => (f.itt > 8 && f.itt <= 15 && ch(r, 0.4) ? { f2: Object.assign({}, f, { itt: int(r, 4, 8) }), quoi: "itt" } : null);

  // =================================================================== VIOLENCES
  variantes("violences", 0.24, {
    // ---------------------------------------------------------------- violences habituelles sur une personne vulnérable (222-14)
    habituelles: {
      poids: 1.2,
      tirer: (r) => ({ agg: ["vulnerable"], itt: CAT.itt(r, 0, 0.7, 0.3, 21), duree: int(r, 3, 14), arme: null }),
      qual: (f) => (f.itt > 8
        ? CAT.delit(120, 150000, "art. 222-14 CP", "violences habituelles sur une personne vulnérable ayant entraîné une incapacité totale de travail de plus de huit jours", { textes: ["CP_222-14"], itt: f.itt })
        : CAT.delit(60, 75000, "art. 222-14 CP", "violences habituelles sur une personne vulnérable ayant entraîné une incapacité totale de travail n'excédant pas huit jours", { textes: ["CP_222-14"], itt: f.itt })),
      requalif: itt8,
      scn: {
        nom: "Violences habituelles sur personne vulnérable", textes: ["CP_222-14"],
        elements: { legal: "Art. 222-14 CP.", materiel: "Des violences répétées, physiques ou psychologiques, sur un mineur de quinze ans ou une personne dont la vulnérabilité est apparente ou connue ; la peine suit l'ITT.", moral: "La volonté des gestes ; l'habitude se prouve par leur répétition dans le temps." },
        flagrance: 0.1, mesures: { gav: 0.7, al: 0.3 }, preuves: { plainte: 1, certificat: 1, temoin: 0.6, aveux: 0.4 },
        irr: ["heures"], camera: 0, sansDoutes: ["legitime_defense", "doute_ident"],
        metierAuteur: () => "auxiliaire de vie",
      },
      recit(X, f) {
        const { A, V, r } = X;
        const les = f.itt > 8 ? ["une fracture du poignet gauche", "des ecchymoses d'âges différents sur les deux bras"] : [pk(r, ["des ecchymoses d'âges différents sur les deux bras", "des hématomes aux poignets, en forme de doigts"]), pk(r, ["un hématome de la pommette droite", "une dermabrasion du coude"])];
        const parent = X.g(V).w("son père", "sa mère");
        return {
          titre: "l'auxiliaire de vie", lieu: `au domicile de ${X.nf(V)}, ${int(r, 2, 90)}, ${X.rue}`, lesions: les, itt: f.itt,
          resume: `${X.n(A)}, auxiliaire de vie chez ${X.nf(V)}, ${V.age} ans, est soupçonné${X.e(A)} de violences répétées sur ${X.lui(V)} depuis ${f.duree} mois.`,
          constat: [`Requis par la fille de ${X.nf(V)}, qui a découvert des marques sur les bras de ${parent} et redoute le passage de l'auxiliaire de vie.`, `Au domicile, constatons sur les bras de ${X.nf(V)} ${les[0]} ; ${X.n(A)} est sur place.`],
          plainte: [
            `${X.Il(A)} vient tous les matins pour la toilette et le repas. Quand je ne vais pas assez vite, ${X.il(A)} me serre les bras, ${X.il(A)} me pousse sur le fauteuil. Une fois, ${X.il(A)} m'a donné une gifle.`,
            `Je n'osais rien dire. J'avais peur qu'on me mette en maison de retraite.`,
            `J'ai eu ${les.join(" et ")}. Le médecin a fixé ${f.itt} jours d'ITT.`,
          ],
          temoin: [`J'habite sur le même palier. Plusieurs fois, le matin, j'ai entendu crier : « Dépêchez-vous ! », et ensuite des pleurs.`, "Je n'ai rien vu, je n'ai fait qu'entendre."],
          version: {
            nie: `Je ne ${X.la(V)} ai jamais frappé${X.e(V)}. ${X.Il(V)} prend des anticoagulants : au moindre choc, ça marque.`,
            minimise: `Je ${X.la(V)} tenais fermement pour ${X.la(V)} relever, oui. Jamais pour faire mal.`,
            reconnait: `J'ai craqué. Douze personnes par jour, je n'en pouvais plus. Je ${X.la(V)} ai bousculé${X.e(V)}, plusieurs fois. J'ai honte.`,
          },
          audition: [
            { q: `Le certificat médical relève ${les[0]}. Comment l'expliquez-vous ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: `${X.Il(V)} se cogne partout. ${X.Il(V)} tombe souvent.` } },
            { q: "Combien de temps passiez-vous chez cette personne ?", a: { silence: "…", expliquer: "Une heure le matin, une demi-heure le soir. L'agence nous presse.", partiel: "Une heure par jour." } },
          ],
          prevention: `habituellement commis des violences sur ${X.nf(V)}, ayant entraîné ${ittTexte(f.itt)}`,
          prejudice: [{ id: "dft", label: `Souffrances endurées (${les[0]})`, demande: 1500 + f.itt * 120, base: 1000 + f.itt * 100 }, { id: "moral", label: "Préjudice moral (la peur chez soi)", demande: 3000, base: 2000 }],
          qA: [{ q: "Vous aviez combien de personnes à voir par jour ?", a: ["Onze, douze. Un quart d'heure chacune, parfois moins."] }],
          qV: [{ q: "Vous avez vu un médecin ?", a: [`Oui, à l'unité médico-judiciaire. ${f.itt} jours d'ITT.`] }],
        };
      },
    },
    // ---------------------------------------------------------------- embuscade (222-15-1)
    embuscade: {
      poids: 0.8,
      tirer: (r) => ({ itt: 0, agg: ch(r, 0.75) ? ["reunion"] : [], arme: pk(r, ["des mortiers d'artifice", "des pierres et des boules de pétanque", "des bouteilles et des pavés"]), leurre: pk(r, ["un feu de poubelles", "un feu de voiture", "un faux appel pour une rixe"]), cible: ch(r, 0.3) ? "pompiers" : "police" }),
      qual: (f) => (f.agg.includes("reunion") ? CAT.delit(84, 100000, "art. 222-15-1 CP", "embuscade, en réunion", { textes: ["CP_222-15-1"] }) : CAT.delit(60, 75000, "art. 222-15-1 CP", "embuscade", { textes: ["CP_222-15-1"] })),
      scn: {
        nom: "Embuscade", textes: ["CP_222-15-1"], victime: "agent",
        elements: { legal: "Art. 222-15-1 CP.", materiel: "Attendre un certain temps, dans un lieu déterminé, un policier, un gendarme, un pompier ou un agent de transport, dans le but de commettre contre lui des violences avec usage ou menace d'une arme ; les violences n'ont pas à être commises.", moral: "Le but de commettre des violences armées contre l'agent, à raison de ses fonctions." },
        flagrance: 0.85, mesures: { gav: 1, al: 0 }, preuves: { constat: 1, video: 0.5, temoin: 0.25, saisie: 0.45, aveux: 0.3 },
        irr: ["controle_identite", "heures", "fouille"], controle: () => true, camera: 0.3, sansDoutes: ["legitime_defense"], pasGenres: ["al", "op"],
        metierVictime: (f, V) => (f.cible === "pompiers" ? (V.g === "f" ? "sapeuse-pompière" : "sapeur-pompier") : null),
      },
      recit(X, f) {
        const { A, V, r } = X;
        const reu = f.agg.includes("reunion");
        const unite = f.cible === "pompiers" ? "les sapeurs-pompiers" : "les policiers";
        const sac = f.arme.startsWith("des mortiers") ? "deux mortiers d'artifice non tirés et un briquet" : f.arme.startsWith("des pierres") ? "des pierres et deux boules de pétanque" : "trois bouteilles vides";
        return {
          titre: "l'embuscade", lieu: `${X.rue}, au pied des immeubles`,
          resume: `Après ${f.leurre}, ${unite} appelés sur place auraient été attendus par ${reu ? "un groupe" : "un individu"} armé de ${f.arme} ; ${X.n(A)} est interpellé${X.e(A)} à proximité.`,
          constat: [
            `Requis pour ${f.leurre} ${X.rue}. À notre arrivée, ${reu ? "une dizaine d'individus, le visage dissimulé, postés" : "un individu, le visage dissimulé, posté"} derrière les voitures en stationnement, ${reu ? "projettent" : "projette"} dans notre direction ${f.arme}.`,
            `Repli des effectifs ; ${X.nf(V)}, ${f.cible === "pompiers" ? V.metier : X.g(V).w("gardien de la paix", "gardienne de la paix")}, est atteint${X.e(V)} au casque, sans blessure.`,
            `Interpellation de ${X.n(A)} dans le hall du ${int(r, 2, 90)} ; ${X.il(A)} porte un sac contenant ${sac}.`,
          ],
          plainte: [`${cap(f.leurre)}, c'était pour nous faire venir. Ils nous attendaient, c'était préparé.`, "On a dû reculer jusqu'au véhicule. Sans le casque, je ne sais pas ce qui serait arrivé."],
          temoin: [`De ma fenêtre, j'ai vu des jeunes préparer des choses derrière les voitures, une demi-heure avant que ça commence.`, "Ensuite, il y avait trop de fumée, je n'ai plus rien vu."],
          saisie: sac,
          version: {
            nie: `Je rentrais chez moi. J'étais pas avec eux. On m'a attrapé${X.e(A)} parce que j'étais dans le hall.`,
            minimise: "J'étais là, j'ai regardé. J'ai rien lancé.",
            reconnait: "On les attendait, oui. Pour se venger des contrôles. J'ai lancé quelque chose, une seule fois.",
          },
          audition: [
            { q: `Que faisiez-vous ${X.rue} à ${X.h(X.hf)} ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je rentrais chez moi." } },
            { q: "Qui a allumé le feu ?", a: { silence: "…", expliquer: "Je sais pas. Et je donnerai pas de nom.", partiel: "Je sais pas." } },
          ],
          prevention: `attendu, un certain temps et dans un lieu déterminé, ${f.cible === "pompiers" ? "des sapeurs-pompiers" : "des fonctionnaires de la police nationale"}, dans le but de commettre à leur encontre, à l'occasion de l'exercice de leurs fonctions, des violences avec usage ou menace d'une arme, en l'espèce ${f.arme}`,
          prejudice: [{ id: "moral", label: "Préjudice moral de l'agent", demande: 800, base: 500 }],
        };
      },
    },
    // ---------------------------------------------------------------- administration de substances nuisibles (222-15)
    substances: {
      poids: 0.8,
      tirer: (r) => ({ agg: ["premeditation"], itt: CAT.itt(r, 0, 0.75, 0.25, 15), produit: pk(r, ["un laxatif puissant", "du liquide vaisselle", "des gouttes de collyre"]), cadre: pk(r, ["travail", "colocation"]), arme: null }),
      qual(f) {
        const plus8 = f.itt > 8;
        return CAT.delit(plus8 ? 60 : 36, plus8 ? 75000 : 45000, "art. 222-15 CP", `administration de substances nuisibles ayant porté atteinte à l'intégrité physique d'autrui, ayant entraîné une incapacité totale de travail ${plus8 ? "de plus de huit jours" : "n'excédant pas huit jours"}, avec préméditation`, { textes: ["CP_222-15"], itt: f.itt });
      },
      requalif: itt8,
      scn: {
        nom: "Administration de substances nuisibles", textes: ["CP_222-15"],
        elements: { legal: "Art. 222-15 CP, qui renvoie aux peines des violences (222-7 à 222-14) selon le résultat.", materiel: "L'administration d'une substance nuisible à la santé, ayant porté atteinte à l'intégrité physique ou psychique de la victime.", moral: "La conscience du caractère nuisible de la substance ; une « blague » n'efface pas l'intention." },
        flagrance: 0.15, mesures: { gav: 0.5, al: 0.5 }, preuves: { plainte: 1, certificat: 1, temoin: 0.5, saisie: 0.35, aveux: 0.45 },
        irr: ["heures", "perq_assentiment"], camera: 0, sansDoutes: ["legitime_defense", "doute_ident", "temoin_contra"],
      },
      recit(X, f) {
        const { A, V, r } = X;
        const tr = f.cadre === "travail";
        const les = f.itt > 8 ? ["une déshydratation sévère ayant nécessité trois jours d'hospitalisation", "des douleurs abdominales"] : [pk(r, ["des vomissements répétés", "des diarrhées profuses"]), "une déshydratation traitée par perfusion"];
        const flacon = f.produit.includes("laxatif") ? "un flacon de laxatif entamé" : f.produit.includes("vaisselle") ? "un flacon de liquide vaisselle" : "un flacon de collyre vide";
        return {
          titre: tr ? "la bouteille trafiquée au bureau" : "la bouteille trafiquée en colocation",
          lieu: tr ? `dans la salle de pause de l'entreprise, ${X.rue}` : `dans l'appartement partagé, ${X.rue}`, lesions: les, itt: f.itt,
          resume: `${X.n(A)} aurait versé ${f.produit} dans la bouteille d'eau de ${X.nf(V)}, ${tr ? X.g(V).w("son collègue", "sa collègue") : X.g(V).w("son colocataire", "sa colocataire")}, tombé${X.e(V)} malade dans l'heure.`,
          constat: [`Plainte de ${X.nf(V)}, avec le certificat des urgences et la bouteille, remise aux enquêteurs.`],
          plainte: [
            `L'eau avait un goût bizarre, j'ai cru que la bouteille était restée au soleil. Une heure après, j'étais malade comme jamais.`,
            `J'ai eu ${les.join(" et ")}. Aux urgences, on m'a donné ${f.itt} jours d'arrêt.`,
            `${X.Il(A)} m'en voulait depuis ${tr ? "que j'avais eu la promotion qu'" + X.il(A) + " voulait" : "une histoire de loyer"}. Je dépose plainte.`,
          ],
          temoin: [tr ? `J'ai vu ${X.n(A)} près du frigo de la salle de pause, avec la bouteille de ${X.nf(V)} à la main. Sur le coup, je n'y ai pas fait attention.` : `J'habite avec eux. Ce soir-là, ${X.n(A)} riait en regardant ${X.nf(V)} boire.`],
          saisie: flacon,
          version: {
            nie: `J'ai rien mis du tout. ${X.Il(V)} a dû manger quelque chose de pas frais.`,
            minimise: `C'était une blague. Quelques gouttes, pour rire. Je pensais pas qu'${X.il(V)} serait malade à ce point.`,
            reconnait: "Oui, je l'ai fait. Je voulais lui gâcher la journée. Je ne pensais pas que ça finirait à l'hôpital.",
          },
          audition: [{ q: `Avez-vous versé quelque chose dans la bouteille de ${X.nf(V)} ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Quelques gouttes. Pour rire." } }],
          prevention: `administré à ${X.nf(V)} une substance nuisible, en l'espèce ${f.produit}, ayant porté atteinte à son intégrité physique et entraîné ${ittTexte(f.itt)}`,
          prejudice: [{ id: "dft", label: `Souffrances endurées (${les[0]})`, demande: 600 + f.itt * 120, base: 400 + f.itt * 100 }, { id: "moral", label: "Préjudice moral", demande: 1000, base: 600 }].concat(f.itt > 8 && X.travaille(V) ? [{ id: "salaire", label: "Perte de salaire pendant l'arrêt de travail", demande: f.itt * 70, base: f.itt * 65, piece: "attestation_salaire" }] : []),
          qV: [{ q: "Vous avez vu un médecin ?", a: [`Les urgences, le soir même. ${f.itt} jours d'ITT.`] }],
        };
      },
    },
    // ---------------------------------------------------------------- diffusion d'images de violences, « happy slapping » (222-33-3)
    happy_slapping: {
      poids: 0.9,
      tirer: (r) => ({ itt: CAT.itt(r, 0.25, 0.6, 0.15, 20), vues: int(r, 3, 90) * 100, reseau: pk(r, ["Snapchat", "TikTok", "Instagram"]), endroit: pk(r, ["devant un fast-food", "sur le quai du métro", "dans un square"]), arme: null }),
      qual: () => CAT.delit(60, 75000, "art. 222-33-3 CP", "diffusion de l'enregistrement d'images relatives à la commission d'atteintes volontaires à l'intégrité de la personne", { textes: ["CP_222-33-3"] }),
      scn: {
        nom: "Diffusion d'images de violences", textes: ["CP_222-33-3"],
        elements: { legal: "Art. 222-33-3 CP.", materiel: "Filmer sciemment des violences en train d'être commises (c'est un acte de complicité), ou diffuser l'enregistrement (délit autonome).", moral: "La conscience de filmer ou de diffuser des violences ; peu importe que l'auteur n'ait pas frappé." },
        flagrance: 0, mesures: { gav: 0.45, al: 0.55 }, preuves: { plainte: 1, video: 1, telephonie: 0.6, saisie: 0.35, aveux: 0.45 },
        irr: ["requisition", "al_quitter", "perq_assentiment"], camera: 0, sansDoutes: ["legitime_defense", "temoin_contra", "doute_ident"], categorie: "num",
      },
      recit(X, f) {
        const { A, V } = X;
        return {
          titre: "la vidéo de l'agression", lieu: `${f.endroit}, ${X.rue}`,
          resume: `Des inconnus ont frappé ${X.nf(V)} ; ${X.n(A)} aurait filmé la scène puis publié la vidéo sur ${f.reseau}, vue ${f.vues} fois.`,
          constat: [`Plainte de ${X.nf(V)}, qui remet des captures de la publication. Réquisition à ${f.reseau} : le compte qui a publié la vidéo est rattaché au numéro de téléphone de ${X.n(A)}.`],
          plainte: [
            `Trois personnes sont venues vers moi et m'ont frappé${X.e(V)}, sans raison. Quelqu'un filmait avec son téléphone, en rigolant.`,
            `Le lendemain, la vidéo était partout : ${f.vues} vues. Des gens que je connais l'ont vue.`,
            "J'ai honte de sortir. Je dépose plainte.",
          ],
          video: { titre: "Procès-verbal d'exploitation de la vidéo publiée", source: `de la vidéo publiée sur ${f.reseau}, copiée par la victime et conservée sur support`, scene: `Durée : 41 secondes. Trois individus frappent ${X.nf(V)}, qui tombe au sol ; la personne qui filme se rapproche et rit. Légende : « Regardez-moi ça, ${X.il(V)} a rien compris ».`, ident: `Le compte qui publie la vidéo est celui dont la plateforme a communiqué les données d'inscription au nom de ${X.n(A)}.` },
          version: {
            nie: "C'est pas moi qui ai publié. Mon téléphone, tout le monde le prend.",
            minimise: "J'ai filmé, oui, comme tout le monde. Je l'ai mise en story : au bout de vingt-quatre heures, plus rien.",
            reconnait: "J'ai filmé et j'ai posté. C'était bête. Je l'ai supprimée quand j'ai vu que ça tournait.",
          },
          audition: [
            { q: "La vidéo a été publiée depuis un compte rattaché à votre numéro. L'avez-vous filmée et publiée ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je l'ai filmée. Pas publiée." } },
            { q: "Connaissez-vous les personnes qui frappent ?", a: { silence: "…", expliquer: "Non. Je passais par là.", partiel: "Non." } },
          ],
          prevention: `diffusé, sur le réseau ${f.reseau}, l'enregistrement d'images relatives à la commission de violences volontaires sur ${X.nf(V)}`,
          prejudice: [{ id: "moral", label: "Préjudice moral (l'humiliation publique)", demande: 2500, base: 1500 }],
          qV: [{ q: "La vidéo est-elle encore en ligne ?", a: ["Elle a été supprimée. Mais des gens l'ont enregistrée, elle ressort de temps en temps."] }],
        };
      },
    },
  });

  // =================================================================== MENACES
  const mots = (r, mort) => (mort ? pk(r, ["je vais te tuer", "je vais te crever", "je vais te planter"]) : pk(r, ["je vais te casser la gueule", "je vais t'attendre à la sortie", "je vais te défoncer"]));
  variantes("menaces", 0.32, {
    // ---------------------------------------------------------------- menaces contre une personne chargée d'une mission de service public (433-3)
    agent_public: {
      poids: 1.3,
      tirer(r) { const qualite = pk(r, ["enseignant", "mairie", "bus"]); return { mort: ch(r, 0.5), forme: qualite === "bus" ? "reiteree" : pk(r, ["reiteree", "ecrite"]), qualite, condition: false }; },
      qual: (f) => (f.mort
        ? CAT.delit(60, 75000, "art. 433-3 CP", "menace de mort à l'encontre d'une personne chargée d'une mission de service public", { textes: ["CP_433-3"] })
        : CAT.delit(36, 45000, "art. 433-3 CP", "menace de commettre un délit contre les personnes à l'encontre d'une personne chargée d'une mission de service public", { textes: ["CP_433-3"] })),
      scn: {
        nom: "Menaces contre une personne chargée d'une mission de service public", textes: ["CP_433-3"],
        elements: { legal: "Art. 433-3 CP.", materiel: "Une menace de crime ou de délit contre les personnes ou les biens, adressée à une personne dépositaire de l'autorité publique, chargée d'une mission de service public ou exerçant l'une des fonctions énumérées (enseignant, agent de transport public de voyageurs, professionnel de santé…).", moral: "La connaissance de la qualité de la victime ; la conscience d'intimider." },
        flagrance: 0.3, mesures: { gav: 0.6, al: 0.4 }, preuves: { plainte: 1, ecrits: 0.6, temoin: 0.5, aveux: 0.4 }, irr: ["al_quitter"], camera: 0,
        metierVictime: (f, V) => ({ enseignant: V.g === "f" ? "professeure de collège" : "professeur de collège", mairie: V.g === "f" ? "agente d'accueil de la mairie" : "agent d'accueil de la mairie", bus: V.g === "f" ? "conductrice de bus" : "conducteur de bus" })[f.qualite],
      },
      recit(X, f) {
        const { A, V, r } = X;
        const m = mots(r, f.mort);
        const ctx = { enseignant: `la sanction infligée ${X.enfants(A) ? "à son enfant" : "à son neveu"}`, mairie: "le délai de son rendez-vous pour une carte d'identité", bus: `un refus de ${X.la(A)} laisser monter sans titre de transport` }[f.qualite];
        const ecr = f.forme === "ecrite";
        const canal = f.qualite === "enseignant" ? "la messagerie du collège" : "le formulaire de contact de la mairie";
        return {
          titre: f.mort ? "les menaces de mort au service public" : "les menaces au service public",
          lieu: ecr ? `par ${canal}` : { enseignant: `devant le collège, ${X.rue}`, mairie: `à l'accueil de la mairie, ${X.rue}`, bus: `dans le bus, à l'arrêt ${X.rue}` }[f.qualite],
          resume: `Après ${ctx}, ${X.n(A)} aurait menacé ${X.nf(V)}, ${V.metier} : « ${cap(m)}. »`,
          constat: [ecr ? `Requis par ${X.nf(V)}, ${V.metier}, qui nous présente les messages reçus dans l'exercice de ses fonctions ; son administration a signalé les faits au parquet.` : `Requis par ${X.nf(V)}, ${V.metier}, menacé${X.e(V)} dans l'exercice de ses fonctions par ${X.n(A)}, encore sur place à notre arrivée.`],
          plainte: [
            `C'est à cause de ${ctx}. ${ecr ? `${X.Il(A)} m'a écrit, sur ${canal}` : `${X.Il(A)} est revenu${X.e(A)} trois fois, à l'accueil et à la sortie`} : « ${cap(m)}. »`,
            `Je ${X.la(A)} crois capable de le faire. Je change d'horaires pour ne pas ${X.la(A)} croiser.`,
          ],
          ecrits: ecr ? [`« ${cap(m)}. »`, "« Vous allez payer. Je sais où vous travaillez. »"] : null,
          temoin: ecr ? null : [`J'étais là. ${X.Il(A)} a crié : « ${m} ». Tout le monde l'a entendu.`],
          version: { nie: `J'ai jamais dit ça. ${X.Il(V)} invente pour se couvrir.`, minimise: "J'étais en colère. C'est une façon de parler, je ferais jamais rien.", reconnait: "Je l'ai dit. J'étais à bout. Je vais présenter mes excuses." },
          audition: [{ q: `Avez-vous dit à ${X.nf(V)} : « ${m} » ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je ne me souviens pas des mots exacts." } }],
          prevention: `menacé ${X.nf(V)}, ${V.metier}, personne chargée d'une mission de service public, dans l'exercice de ses fonctions, de ${f.mort ? "mort" : "commettre à son encontre un délit contre les personnes"}`,
          prejudice: [{ id: "moral", label: "Préjudice moral (la peur au travail)", demande: 1500, base: 900 }],
          qA: [{ q: "Vous l'avez dit sérieusement ?", a: ["Non. J'étais en colère contre l'administration, pas contre cette personne."] }],
        };
      },
    },
    // ---------------------------------------------------------------- intimidation de la victime pour qu'elle retire sa plainte (434-5)
    intimidation: {
      tirer: (r) => ({ forme: pk(r, ["reiteree", "ecrite"]), prev: pk(r, ["vol", "violences"]), mort: false, condition: true }),
      qual: () => CAT.delit(36, 45000, "art. 434-5 CP", "menace ou acte d'intimidation à l'égard de la victime d'un délit en vue de la déterminer à ne pas porter plainte ou à se rétracter", { textes: ["CP_434-5"] }),
      scn: {
        nom: "Intimidation d'une victime", textes: ["CP_434-5"],
        elements: { legal: "Art. 434-5 CP.", materiel: "Une menace ou un acte d'intimidation à l'égard de la victime d'un crime ou d'un délit.", moral: "Le but de la déterminer à ne pas porter plainte ou à se rétracter ; peu importe que la première plainte aboutisse." },
        flagrance: 0.2, mesures: { gav: 0.7, al: 0.3 }, preuves: { plainte: 1, ecrits: 0.6, temoin: 0.4, telephonie: 0.5, aveux: 0.4 }, irr: ["al_quitter", "requisition"], camera: 0,
      },
      recit(X, f) {
        const { A, V } = X;
        const objet = f.prev === "vol" ? "le vol de mon scooter" : "une agression dans mon quartier";
        const ecr = f.forme === "ecrite";
        return {
          titre: "la plainte qu'il fallait retirer", lieu: ecr ? "par messages" : `en bas de l'immeuble de ${X.nf(V)}, ${X.rue}`,
          resume: `${X.nf(V)} avait porté plainte contre ${X.n(A)} pour ${objet.replace("mon ", "son ")}. ${X.n(A)} aurait ensuite tenté de l'intimider pour qu'${X.il(V)} retire sa plainte.`,
          constat: [`Plainte de ${X.nf(V)}${ecr ? ", qui présente les messages reçus" : ""} ; rapprochement avec la première procédure, en cours.`],
          plainte: [
            `J'avais porté plainte pour ${objet}. Deux semaines après, ${ecr ? "j'ai reçu des messages : « Retire ta plainte. Tu sais ce qui arrive aux balances. »" : `${X.il(A)} m'attendait en bas de chez moi. ${X.Il(A)} m'a dit : « Tu retires ta plainte, sinon ça va mal finir pour toi. »`}`,
            `J'ai peur. Je ne sors plus seul${X.e(V)} le soir.`,
          ],
          ecrits: ecr ? ["« Retire ta plainte. Tu sais ce qui arrive aux balances. »", "« Dernier avertissement. »"] : null,
          temoin: ecr ? null : [`J'étais avec ${X.lui(V)}. ${X.Il(A)} a dit : « Tu retires ta plainte. » C'était une menace, clairement.`],
          version: { nie: `Je ${X.lui(V)} ai jamais parlé de sa plainte. Je l'ai croisé${X.e(V)}, c'est tout.`, minimise: "Je lui ai demandé de retirer sa plainte, calmement. Cette histoire, c'est un malentendu.", reconnait: `Je voulais qu'${X.il(V)} retire sa plainte. J'ai mal parlé. Je regrette.` },
          audition: [{ q: `Avez-vous demandé à ${X.nf(V)} de retirer sa plainte ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je lui ai parlé, c'est tout." } }],
          prevention: `usé de menace ou d'acte d'intimidation à l'égard de ${X.nf(V)}, victime d'un délit, en vue de la déterminer à ne pas porter plainte ou à se rétracter`,
          prejudice: [{ id: "moral", label: "Préjudice moral (la peur)", demande: 1200, base: 800 }],
        };
      },
    },
    // ---------------------------------------------------------------- subornation de témoin (434-15)
    subornation: {
      poids: 0.8,
      tirer: (r) => ({ forme: pk(r, ["reiteree", "ecrite"]), offre: ch(r, 0.4), mort: false, condition: true }),
      qual: () => CAT.delit(36, 45000, "art. 434-15 CP", "subornation de témoin", { textes: ["CP_434-15"] }),
      scn: {
        nom: "Subornation de témoin", textes: ["CP_434-15"],
        elements: { legal: "Art. 434-15 CP.", materiel: "Des promesses, offres, présents, pressions, menaces ou manœuvres, au cours d'une procédure ou en vue d'une demande ou défense en justice.", moral: "Le but de déterminer autrui à faire une déposition mensongère ou à s'abstenir de déposer ; le délit est constitué même sans effet." },
        flagrance: 0.1, mesures: { gav: 0.6, al: 0.4 }, preuves: { plainte: 1, ecrits: 0.6, telephonie: 0.5, temoin: 0.3, aveux: 0.4 }, irr: ["al_quitter", "requisition"], camera: 0,
      },
      recit(X, f) {
        const { A, V } = X;
        const ecr = f.forme === "ecrite";
        return {
          titre: "le témoin sous pression", lieu: ecr ? "par messages" : `${X.rue}, ${X.lieu}`,
          resume: `${X.nf(V)}, témoin d'une bagarre pour laquelle ${X.n(A)} est poursuivi${X.e(A)}, dit avoir subi des pressions pour changer sa déposition${f.offre ? ", contre de l'argent" : ""}.`,
          constat: [`Plainte de ${X.nf(V)}, entendu${X.e(V)} comme témoin dans une procédure de violences visant ${X.n(A)}${ecr ? " ; captures des messages reçus" : ""}.`],
          plainte: [
            "J'ai vu une bagarre devant chez moi. J'ai dit à la police ce que j'avais vu.",
            f.offre ? `Ensuite, ${X.il(A)} m'a proposé 500 euros pour que je dise que c'était l'autre qui avait frappé en premier.` : `Ensuite, ${X.il(A)} m'a dit de changer ma version : « Tu dis que t'as rien vu, sinon tu vas avoir des problèmes. »`,
            "J'ai peur de témoigner, maintenant.",
          ],
          ecrits: ecr ? [f.offre ? "« 500 € pour toi si tu dis que c'est lui qui a commencé. »" : "« T'as rien vu. Compris ? »", "« Réfléchis bien avant l'audience. »"] : null,
          version: { nie: `Je ${X.lui(V)} ai jamais rien proposé. ${X.Il(V)} ment depuis le début.`, minimise: "Je lui ai juste demandé de dire la vérité : que l'autre avait commencé.", reconnait: `J'ai voulu qu'${X.il(V)} change sa version. C'était une erreur.` },
          audition: [{ q: `${X.nf(V)} dit que vous lui avez ${f.offre ? "proposé de l'argent" : "demandé de changer sa déposition"}. Que répondez-vous ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je lui ai parlé, oui. Sans le menacer." } }],
          prevention: `usé de ${f.offre ? "promesses ou offres" : "pressions ou menaces"} afin de déterminer ${X.nf(V)} à faire une déposition mensongère ou à s'abstenir de déposer, au cours d'une procédure`,
          prejudice: [{ id: "moral", label: "Préjudice moral", demande: 800, base: 500 }],
        };
      },
    },
  });

  // =================================================================== OUTRAGE À MAGISTRAT (434-24)
  variantes("outrage", 0.16, {
    magistrat: {
      tirer: (r) => ({ forme: pk(r, ["courriels", "courrier", "appel"]), juge: pk(r, ["jaf", "jex", "jcp"]), cible: "magistrat" }),
      qual: () => CAT.delit(12, 15000, "art. 434-24 CP", "outrage à magistrat, à l'occasion de l'exercice de ses fonctions", { textes: ["CP_434-24"] }),
      scn: {
        nom: "Outrage à magistrat", textes: ["CP_434-24"],
        elements: { legal: "Art. 434-24 CP.", materiel: "Des paroles, gestes, menaces, écrits ou images non rendus publics, adressés à un magistrat ou à un juré dans l'exercice ou à l'occasion de ses fonctions ; la peine double à l'audience.", moral: "La volonté de porter atteinte à la dignité du magistrat ou au respect dû à sa fonction." },
        flagrance: 0, mesures: { gav: 0.3, al: 0.7 }, preuves: { plainte: 1, ecrits: 1, aveux: 0.4 }, irr: ["al_quitter", "requisition"], camera: 0,
        sansDoutes: ["temoin_contra", "doute_ident"],
        metierVictime: (f) => ({ jaf: "juge aux affaires familiales", jex: "juge de l'exécution", jcp: "juge des contentieux de la protection" })[f.juge],
      },
      recit(X, f) {
        const { A, V, r } = X;
        const aff = { jaf: `le divorce de ${X.n(A)}`, jex: `la saisie sur le salaire de ${X.n(A)}`, jcp: `l'expulsion de ${X.n(A)}` }[f.juge];
        const juge = `${X.nf(V)}, ${V.metier}`;
        const ins = X.lex(V.g === "f" ? "ins_f" : "ins_m");
        const suite = pk(r, ["une honte pour la justice", "la honte de ce tribunal", "pire qu'un huissier"]);
        const voie = f.forme === "appel" ? "par téléphone, au greffe" : f.forme === "courriels" ? "par courriels adressés au greffe" : "par une lettre adressée au tribunal";
        const propos = `« ${cap(ins)}. Vous êtes ${suite}. »`;
        return {
          titre: f.forme === "appel" ? "l'appel au greffe" : f.forme === "courriels" ? "les courriels au juge" : "la lettre au juge", lieu: voie,
          resume: `Après la décision rendue dans ${aff}, ${X.n(A)} aurait adressé, ${voie}, des propos outrageants à ${juge}.`,
          constat: [`Signalement du président du tribunal ; ${f.forme === "appel" ? "note de la greffière ayant reçu l'appel, rédigée le jour même" : "copie des écrits reçus, transmise au parquet"}.`],
          plainte: [`J'ai rendu ma décision dans ${aff}. Quelques jours plus tard, ${f.forme === "appel" ? "la greffière a reçu un appel" : "le greffe a reçu des écrits"} qui me visaient : ${propos}`, "On peut critiquer une décision : il y a l'appel pour cela. On ne peut pas insulter celui qui la rend."],
          ecritsPiece: { court: f.forme === "appel" ? "Note du greffe" : "Écrits reçus au greffe", titre: f.forme === "appel" ? "Procès-verbal de constatations — note du greffe" : "Procès-verbal de constatations — écrits reçus par le tribunal", intro: f.forme === "appel" ? "Constatons la note rédigée par la greffière le jour de l'appel, transmise au parquet :" : `Constatons les ${f.forme === "courriels" ? "courriels" : "termes de la lettre"} transmis par le président du tribunal :`, dater: f.forme === "courriels" },
          ecrits: f.forme === "appel" ? [`Note de la greffière : l'appelant a déclaré, en criant, que le juge était ${suite}, puis : « ${cap(ins)}. »`] : [propos, "« Je ferai appel, et je n'en resterai pas là. »"],
          version: { nie: f.forme === "appel" ? "J'ai appelé pour une question sur mon dossier, c'est tout." : "Je n'ai jamais écrit ça. Quelqu'un a utilisé mon adresse.", minimise: `J'étais en colère contre la décision. Je visais la justice, pas ${X.lui(V)}.`, reconnait: `C'est moi. J'avais tout perdu ce jour-là. Je présente mes excuses à ${X.nf(V)}.` },
          audition: [{ q: `Reconnaissez-vous être l'auteur de ${f.forme === "appel" ? "ces propos" : "ces écrits"} ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "J'étais en colère, je ne me souviens plus des mots." } }],
          prevention: `outragé, par ${f.forme === "appel" ? "paroles" : "écrits non rendus publics"}, ${juge}, magistrat, à l'occasion de l'exercice de ses fonctions`,
          prejudice: [{ id: "moral", label: "Préjudice moral du magistrat", demande: 500, base: 300 }],
        };
      },
    },
  });

  // =================================================================== FILOUTERIE (313-5)
  variantes("escroquerie", 0.18, {
    filouterie: {
      tirer: (r) => ({ lieu: pk(r, ["restaurant", "taxi", "hotel"]), montant: int(r, 4, 30) * 10 }),
      qual: (f) => CAT.delit(6, 7500, "art. 313-5 CP", `filouterie ${f.lieu === "restaurant" ? "d'aliments et de boissons" : f.lieu === "taxi" ? "de transport" : "de logement"}`, { textes: ["CP_313-5"] }),
      scn: {
        nom: "Filouterie", textes: ["CP_313-5"],
        elements: { legal: "Art. 313-5 CP.", materiel: "Se faire servir des aliments ou des boissons, occuper une chambre d'hôtel, se faire servir du carburant ou prendre un taxi, sans payer.", moral: "Savoir être dans l'impossibilité absolue de payer, ou être déterminé à ne pas payer ; un simple oubli ne suffit pas." },
        flagrance: 0.75, mesures: { gav: 0.55, al: 0.45 }, preuves: { constat: 0.8, plainte: 1, temoin: 0.6, video: 0.35, aveux: 0.5 },
        irr: ["controle_identite", "heures"], controle: () => true, camera: 0.3, sansDoutes: ["alibi_tel"], categorie: "scene",
        metierVictime: (f, V) => ({ restaurant: V.g === "f" ? "restauratrice" : "restaurateur", taxi: V.g === "f" ? "chauffeuse de taxi" : "chauffeur de taxi", hotel: V.g === "f" ? "gérante d'hôtel" : "gérant d'hôtel" })[f.lieu],
      },
      recit(X, f) {
        const { A, V, r } = X;
        const m = eur(f.montant);
        const nomLieu = f.lieu === "restaurant" ? pk(r, ["Le Petit Cambodge", "La Bonne Franquette", "Chez Gégène", "Le Relais du Nord"]) : pk(r, ["Hôtel du Commerce", "Hôtel des Arts", "Hôtel Excelsior"]);
        const L = {
          restaurant: { titre: "le repas impayé", lieu: `au restaurant « ${nomLieu} », ${X.rue}`, fait: `commandé un repas pour ${m}`, plainte: `${X.Il(A)} a pris une entrée, un plat, une bouteille de vin. Au moment de payer, ${X.il(A)} a dit qu'${X.il(A)} avait oublié sa carte. ${X.Il(A)} a voulu partir, je ${X.la(A)} ai retenu${X.e(A)} à la porte.`, temoin: `J'étais à la table d'à côté. ${X.Il(A)} a dit ${X.g(V).w("au patron", "à la patronne")} qu'${X.il(A)} n'avait pas sa carte, puis ${X.il(A)} s'est levé${X.e(A)} pour partir.` },
          taxi: { titre: "la course impayée", lieu: `${X.rue}, au terme d'une course depuis la gare de Lyon`, fait: `effectué une course en taxi de ${m}`, plainte: `À l'arrivée, ${X.il(A)} m'a dit qu'${X.il(A)} n'avait pas d'argent sur ${X.lui(A)}. ${X.Il(A)} voulait descendre « chercher sa carte ». J'ai refusé, j'ai verrouillé les portes et j'ai appelé la police.`, temoin: `Je passais. ${X.g(V).w("Le chauffeur", "La chauffeuse")} criait qu'on ne ${X.la(V)} payait pas, la personne à l'arrière voulait sortir.` },
          hotel: { titre: "la chambre d'hôtel impayée", lieu: `à l'« ${nomLieu} », ${X.rue}`, fait: `occupé une chambre trois nuits (${m})`, plainte: `${X.Il(A)} devait payer au départ. Le troisième jour, à six heures du matin, ${X.il(A)} est descendu${X.e(A)} avec sa valise par l'escalier de service. Le veilleur ${X.la(A)} a rattrapé${X.e(A)} dans le hall.`, temoin: `Je suis veilleur de nuit. J'ai vu cette personne descendre avec sa valise, sans passer à la réception.` },
        }[f.lieu];
        return {
          titre: L.titre, lieu: L.lieu, montant: f.montant,
          resume: `${X.n(A)} aurait ${L.fait}, en se sachant dans l'impossibilité de payer.`,
          constat: [`Requis par ${X.nf(V)}, ${V.metier}, ${L.lieu}. ${X.n(A)} déclare ne pas avoir d'argent ; ni carte bancaire ni espèces sur ${X.lui(A)}.`],
          plainte: [L.plainte, `La note est de ${m}. Je dépose plainte.`],
          temoin: [L.temoin],
          video: { source: f.lieu === "taxi" ? "de la caméra embarquée du taxi" : "du système de vidéosurveillance de l'établissement", scene: `On voit ${X.n(A)} ${f.lieu === "restaurant" ? "se lever de table et se diriger vers la sortie sans passer à la caisse" : f.lieu === "taxi" ? "tenter d'ouvrir la portière à l'arrivée, sans sortir de moyen de paiement" : "traverser le hall avec une valise, sans passer à la réception"}.`, ident: `La personne filmée est ${X.n(A)}, reconnu${X.e(A)} par ${X.nf(V)}.` },
          version: { nie: "J'avais l'intention de payer. Ma carte a été refusée, c'est tout.", minimise: "J'allais revenir payer le lendemain. Je l'ai proposé, on ne m'a pas cru.", reconnait: "Je savais que je n'avais pas un centime. J'avais faim. Je rembourserai." },
          audition: [{ q: `Aviez-vous de quoi payer ${m} ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je pensais que ma carte passerait." } }],
          prevention: `sachant être dans l'impossibilité absolue de payer ou étant déterminé${X.e(A)} à ne pas payer, ${{ restaurant: "consommé des boissons et des aliments servis dans un établissement vendant des boissons ou des aliments", taxi: "pris en location une voiture de place", hotel: "occupé une chambre qui lui avait été attribuée dans un établissement louant des chambres" }[f.lieu]}, au préjudice de ${X.nf(V)}`,
          prejudice: [{ id: "materiel", label: "Somme impayée", demande: f.montant, base: f.montant }],
        };
      },
    },
  });

  // =================================================================== OCCUPATION D'UN LOCAL (315-1) ET MAINTIEN MALGRÉ L'EXPULSION (315-2)
  variantes("violation_domicile", 0.35, {
    local: {
      poids: 1.3,
      tirer: (r) => ({ bien: pk(r, ["boutique", "logement_vide", "bureaux"]), duree: int(r, 1, 10) }),
      qual: (f) => CAT.delit(24, 30000, "art. 315-1 CP", `introduction et maintien dans un local à usage ${f.bien === "logement_vide" ? "d'habitation" : f.bien === "boutique" ? "commercial" : "professionnel"} à l'aide de manœuvres, menaces, voies de fait ou contrainte`, { textes: ["CP_315-1"] }),
      scn: {
        nom: "Occupation frauduleuse d'un local", textes: ["CP_315-1"],
        elements: { legal: "Art. 315-1 CP (loi du 27 juillet 2023).", materiel: "L'introduction dans un local d'habitation, commercial, agricole ou professionnel à l'aide de manœuvres, menaces, voies de fait ou contrainte, et le maintien qui s'ensuit ; le local n'a pas à être le domicile de quiconque.", moral: "La conscience d'entrer et de rester sans droit." },
        flagrance: 0.6, mesures: { gav: 0.7, al: 0.3 }, preuves: { constat: 0.8, plainte: 1, temoin: 0.5, aveux: 0.4 }, irr: ["heures"], camera: 0,
        metierVictime: (f, V) => (f.bien === "boutique" ? (V.g === "f" ? "commerçante" : "commerçant") : f.bien === "bureaux" ? (V.g === "f" ? "gérante de société" : "gérant de société") : null),
      },
      recit(X, f) {
        const { A, V, r } = X;
        const bien = { boutique: "une boutique fermée pour travaux", logement_vide: "un appartement vide entre deux locations", bureaux: "des bureaux inoccupés" }[f.bien];
        const porte = f.bien === "boutique" ? "le cadenas du rideau métallique" : "la serrure de la porte";
        return {
          titre: { boutique: "la boutique occupée", logement_vide: "l'appartement vide occupé", bureaux: "les bureaux occupés" }[f.bien], lieu: `${int(r, 2, 90)}, ${X.rue}`,
          resume: `${X.n(A)} occuperait depuis ${f.duree} semaine${f.duree > 1 ? "s" : ""} ${bien} appartenant à ${X.nf(V)}, après en avoir forcé ${porte}.`,
          constat: [`Sur place, constatons que ${porte} a été ${f.bien === "boutique" ? "sectionné et remplacé" : "changée"} ; à l'intérieur, ${X.n(A)}, un matelas et des effets personnels.`],
          plainte: [`J'ai voulu ${f.bien === "logement_vide" ? "faire visiter l'appartement à un futur locataire" : "reprendre les lieux pour les travaux"}. Ma clé ne marchait plus. Quelqu'un vivait là.`, `${X.Il(A)} m'a dit que c'était chez ${X.lui(A)}, maintenant, et qu'il fallait passer par un juge.`],
          temoin: [`J'ai vu quelqu'un forcer ${porte}, un soir, avec une pince. Depuis, la lumière est allumée la nuit.`],
          version: { nie: "C'était ouvert. Je n'ai rien forcé.", minimise: "Je n'avais nulle part où dormir. C'était vide depuis des mois, je n'ai rien abîmé.", reconnait: `J'ai forcé ${porte}. Je n'avais pas d'autre solution. Je vais partir.` },
          audition: [{ q: `Comment êtes-vous entré${X.e(A)} dans les lieux ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "C'était ouvert." } }],
          prevention: `pénétré dans ${bien}, local appartenant à ${X.nf(V)}, à l'aide de manœuvres, menaces, voies de fait ou contrainte, et de s'y être maintenu${X.e(A)}`,
          prejudice: [{ id: "materiel", label: `Remplacement de ${f.bien === "boutique" ? "la fermeture" : "la serrure"} (devis)`, demande: int(r, 3, 12) * 100, base: null, piece: "devis" }, { id: "jouissance", label: "Perte de loyer ou d'exploitation", demande: f.duree * 350, base: f.duree * 250 }],
        };
      },
    },
    maintien: {
      tirer: (r) => ({ mois: int(r, 3, 14) }),
      qual: () => CAT.delit(0, 7500, "art. 315-2 CP", "maintien sans droit ni titre dans un local à usage d'habitation en violation d'une décision de justice définitive et exécutoire", { textes: ["CP_315-2"] }),
      scn: {
        nom: "Maintien dans les lieux malgré une décision d'expulsion", textes: ["CP_315-2"],
        elements: { legal: "Art. 315-2 CP (loi du 27 juillet 2023).", materiel: "Rester dans un logement en violation d'une décision de justice définitive et exécutoire, plus de deux mois après un commandement régulier de quitter les lieux ; jamais pendant la trêve hivernale, ni dans un logement appartenant à un bailleur social ou à une personne morale de droit public, ni tant qu'une demande de délais est pendante ou que les délais accordés courent.", moral: "La connaissance de la décision et du commandement." },
        flagrance: 0, mesures: { gav: 0, al: 0.85, convocation: 0.15 }, preuves: { plainte: 1, ecrits: 1, temoin: 0.3, aveux: 0.5 }, irr: ["al_quitter"], camera: 0, pasGenres: ["gav", "ci", "op"],
      },
      recit(X, f) {
        const { A, V, r } = X;
        return {
          titre: "le locataire qui ne part pas", lieu: `${int(r, 2, 90)}, ${X.rue}`,
          resume: `Expulsé${X.e(A)} par un jugement devenu définitif, ${X.n(A)} se maintiendrait dans le logement de ${X.nf(V)} ${f.mois} mois après le commandement de quitter les lieux.`,
          constat: [`Plainte de ${X.nf(V)}, qui joint le jugement d'expulsion, le certificat de non-appel et le commandement de quitter les lieux délivré par le commissaire de justice.`],
          plainte: [`Le jugement est définitif depuis plus d'un an. Le commissaire de justice est passé : personne n'a ouvert.`, "Je rembourse le crédit de cet appartement et je ne touche plus rien depuis des mois."],
          ecritsPiece: { court: "Pièces jointes à la plainte", titre: "Procès-verbal de constatations — pièces remises par le plaignant", intro: `Pièces remises par ${X.nf(V)} et jointes à la procédure :`, dater: false },
          ecrits: [`Commandement de quitter les lieux, délivré il y a ${f.mois} mois.`, "Jugement : « Ordonne l'expulsion de l'occupant et de tous occupants de son chef. »"],
          temoin: [`J'habite l'immeuble. ${X.Il(A)} vit toujours là, je ${X.la(A)} croise tous les jours.`],
          version: { nie: "Je n'ai jamais reçu de commandement. Personne ne m'a rien remis.", minimise: "J'ai fait une demande de logement social. Je cherche, je ne trouve rien. Où voulez-vous que j'aille ?", reconnait: "Je sais que je dois partir. J'ai trouvé quelque chose pour le mois prochain." },
          audition: [{ q: `Le commandement de quitter les lieux vous a été délivré il y a ${f.mois} mois. Pourquoi êtes-vous encore dans le logement ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je cherche une solution." } }],
          prevention: `occupé sans droit ni titre un local à usage d'habitation appartenant à ${X.nf(V)}, en s'y maintenant en violation d'une décision de justice définitive et exécutoire ayant donné lieu à un commandement régulier de quitter les lieux depuis plus de deux mois`,
          prejudice: [{ id: "materiel", label: "Indemnités d'occupation impayées", demande: f.mois * 700, base: f.mois * 650, piece: "releve" }],
        };
      },
    },
  });

  // =================================================================== ENTRAVE (323-2) ET ATTEINTE AUX DONNÉES (323-3)
  variantes("acces_frauduleux", 0.4, {
    entrave: {
      tirer: (r) => ({ cible: pk(r, ["site", "messagerie"]), jours: int(r, 1, 6), modif: true }),
      qual: () => CAT.delit(60, 150000, "art. 323-2 CP", "entrave au fonctionnement d'un système de traitement automatisé de données", { textes: ["CP_323-2"] }),
      scn: {
        nom: "Entrave à un système informatique", textes: ["CP_323-2"],
        elements: { legal: "Art. 323-2 CP.", materiel: "Entraver ou fausser le fonctionnement d'un système de traitement automatisé de données : blocage, saturation, changement des accès.", moral: "La conscience d'empêcher le système de fonctionner normalement ; un différend sur des factures ne donne aucun droit de bloquer." },
      },
      recit(X, f) {
        const { A, V } = X;
        const quoi = f.cible === "site" ? "le site de vente en ligne" : "la messagerie de l'entreprise";
        return {
          titre: f.cible === "site" ? "le site bloqué" : "la messagerie bloquée", lieu: "à distance",
          resume: `${X.n(A)}, ${X.g(A).w("ancien prestataire", "ancienne prestataire")} informatique de la société de ${X.nf(V)}, aurait rendu ${quoi} inaccessible pendant ${f.jours} jour${f.jours > 1 ? "s" : ""}, après la fin de son contrat.`,
          constat: [`Plainte de ${X.nf(V)} ; journaux de l'hébergeur : modification des accès administrateur depuis une adresse IP attribuée, sur réquisition, à ${X.n(A)}.`],
          plainte: [`Le lendemain de la fin du contrat, ${quoi} ne marchait plus. Plus aucun accès administrateur : les mots de passe avaient été changés.`, `On a perdu ${f.jours} jour${f.jours > 1 ? "s" : ""} d'activité. Le nouveau prestataire a tout reconstruit.`],
          version: { nie: "Je n'ai rien touché. Ils ont mal géré la transition, c'est tout.", minimise: `J'ai changé les mots de passe pour sécuriser. Ils ne m'avaient pas payé${X.e(A)} ; je voulais être payé${X.e(A)} avant de tout rendre.`, reconnait: "J'ai bloqué l'accès. Ils me devaient trois factures. Je n'aurais pas dû." },
          audition: [{ q: "Pourquoi les accès administrateur ont-ils été modifiés depuis votre connexion, le lendemain de la fin de votre contrat ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Pour sécuriser le système." } }],
          prevention: `entravé le fonctionnement d'un système de traitement automatisé de données appartenant à la société de ${X.nf(V)}, en l'espèce en modifiant les accès administrateur et en rendant ${quoi} inaccessible pendant ${f.jours} jour${f.jours > 1 ? "s" : ""}`,
          prejudice: [{ id: "materiel", label: "Activité perdue et remise en service (facture du prestataire)", demande: f.jours * 900 + 1500, base: f.jours * 700 + 1500, piece: "facture" }],
        };
      },
    },
    donnees: {
      tirer: (r) => ({ fichier: pk(r, ["clients", "clients", "devis"]), nb: int(r, 8, 60) * 100, modif: true }),
      qual: () => CAT.delit(60, 150000, "art. 323-3 CP", "extraction et transmission frauduleuses de données contenues dans un système de traitement automatisé de données", { textes: ["CP_323-3"] }),
      scn: {
        nom: "Extraction frauduleuse de données", textes: ["CP_323-3"],
        elements: { legal: "Art. 323-3 CP.", materiel: "Introduire, extraire, détenir, reproduire, transmettre, supprimer ou modifier frauduleusement des données d'un système de traitement automatisé ; un accès autorisé n'autorise pas tout usage des données.", moral: "La conscience d'agir sans droit sur les données." },
      },
      recit(X, f) {
        const { A, V } = X;
        const fich = f.fichier === "clients" ? `le fichier des ${f.nb} clients` : `la base des devis et des tarifs (${f.nb} fiches)`;
        return {
          titre: "le fichier emporté", lieu: "à distance",
          resume: `${X.n(A)} aurait extrait ${fich} de la société de ${X.nf(V)}, la veille de son départ chez un concurrent.`,
          constat: [`Plainte de ${X.nf(V)} ; journal du serveur : export complet de ${fich} depuis le poste de ${X.n(A)}, puis envoi vers une adresse électronique personnelle.`],
          plainte: ["Deux semaines après son départ, nos clients ont reçu des offres d'un concurrent, avec leurs coordonnées exactes et nos tarifs.", "Le journal du serveur montre l'export, depuis son poste, la veille de son départ."],
          version: { nie: "Je n'ai rien exporté. Tout le monde avait accès à ce fichier.", minimise: "J'ai gardé une copie de mes propres contacts, ceux que j'avais apportés.", reconnait: "J'ai copié le fichier. Mon nouvel employeur me l'avait demandé." },
          audition: [{ q: "La veille de votre départ, un export complet part de votre poste vers votre adresse personnelle. Pourquoi ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "C'étaient mes contacts." } }],
          prevention: `frauduleusement extrait, détenu et transmis des données contenues dans le système de traitement automatisé de données de la société de ${X.nf(V)}, en l'espèce ${fich}`,
          prejudice: [{ id: "materiel", label: "Clientèle détournée (attestation de l'expert-comptable)", demande: 9000, base: 5000 }],
        };
      },
    },
  });

  // =================================================================== NON-JUSTIFICATION DE RESSOURCES (321-6)
  variantes("recel", 0.15, {
    ressources: {
      tirer: (r) => ({ especes: int(r, 8, 60) * 500, bien: pk(r, ["voiture", "montres", "bijoux"]), prix: 0 }),
      qual: () => CAT.delit(36, 75000, "art. 321-6 CP", "non-justification de ressources par une personne en relations habituelles avec l'auteur de délits punis d'au moins cinq ans d'emprisonnement", { textes: ["CP_321-6"] }),
      scn: {
        nom: "Non-justification de ressources", textes: ["CP_321-6"], victime: null,
        elements: { legal: "Art. 321-6 CP.", materiel: "Ne pas pouvoir justifier de ressources correspondant à son train de vie, ou de l'origine d'un bien, tout en étant en relations habituelles avec l'auteur de crimes ou de délits punis d'au moins cinq ans qui en tire profit.", moral: "La connaissance de l'activité de la personne fréquentée ; c'est à la défense de justifier les ressources." },
        flagrance: 0, mesures: { gav: 0.75, al: 0.25 }, preuves: { saisie: 1, releve: 0.9, telephonie: 0.4, aveux: 0.4 }, irr: ["perq_assentiment", "perq_nuit", "requisition"], camera: 0, pasGenres: ["pc", "op"],
      },
      recit(X, f) {
        const { A } = X;
        const bien = { voiture: "les clés et la carte grise d'une Mercedes achetée comptant", montres: "deux montres de luxe sans facture", bijoux: "un sac contenant des bijoux en or" }[f.bien];
        return {
          titre: "l'argent qu'on ne justifie pas", lieu: `au domicile de ${X.n(A)}, ${X.rue}`,
          resume: `Dans l'enquête visant son frère pour trafic de stupéfiants, ${X.n(A)} ne justifie pas de l'origine de ${eur(f.especes)} en espèces ni de ${bien.replace(/^les clés et la carte grise d'/, "")}.`,
          constat: [`Perquisition au domicile de ${X.n(A)} dans le cadre de l'enquête visant son frère, mis en examen pour trafic de stupéfiants.`, `Découverte de ${eur(f.especes)} en espèces dans une boîte à chaussures, et de ${bien}.`, `Les surveillances établissent des rencontres presque quotidiennes entre ${X.n(A)} et son frère.`],
          saisie: `${eur(f.especes)} en espèces et ${bien}`,
          version: { nie: "Cet argent, ce sont des économies de famille. Ma mère me le confie.", minimise: "Mon frère me donne un peu d'argent, oui. Je ne sais pas d'où il vient, je ne pose pas de questions.", reconnait: "Je savais que l'argent venait du trafic. Je le gardais pour lui." },
          audition: [{ q: `Comment justifiez-vous ${eur(f.especes)} en espèces, avec ${X.travaille(A) ? "votre salaire" : "vos revenus déclarés"} ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Ce sont des économies." } }],
          prevention: `été dans l'impossibilité de justifier de ressources correspondant à son train de vie et de l'origine des biens détenus, tout en étant en relations habituelles avec une personne se livrant au trafic de stupéfiants`,
          prejudice: [],
          qA: [{ q: "Votre frère vous a demandé de garder cet argent ?", a: ["Je ne dirai rien contre mon frère."] }],
        };
      },
    },
  });

  // =================================================================== STUPÉFIANTS : IMPORTATION, BLANCHIMENT DU TRAFIC, PROVOCATION À L'USAGE
  variantes("stups_trafic", 0.26, {
    importation: {
      poids: 1.3,
      tirer(r) { const produit = pk(r, ["cannabis", "cocaine"]); return { produit, quantite: produit === "cannabis" ? int(r, 10, 50) * 100 : int(r, 3, 15) * 100, especes: int(r, 2, 20) * 50, pays: pk(r, ["d'Espagne", "des Pays-Bas", "du Maroc", "de Belgique"]) }; },
      qual: () => CAT.delit(120, 7500000, "art. 222-36, al. 1 CP", "importation non autorisée de stupéfiants", { textes: ["CP_222-36"] }),
      scn: {
        nom: "Importation de stupéfiants", textes: ["CP_222-36"], victime: null,
        elements: { legal: "Art. 222-36, al. 1 CP (délit ; crime en bande organisée, al. 2).", materiel: "Faire entrer des stupéfiants sur le territoire national, par quelque moyen que ce soit ; la réception d'un colis venu de l'étranger peut suffire.", moral: "La connaissance de la nature du chargement : tout le débat de la « mule » et du destinataire de colis." },
        flagrance: 0.85, mesures: { gav: 1, al: 0 }, preuves: { constat: 0.9, saisie: 1, labo: 0.9, telephonie: 0.6, aveux: 0.35 },
        irr: ["perq_assentiment", "perq_nuit", "geoloc", "requisition"], camera: 0,
      },
      recit(X, f) {
        const { A, r } = X;
        const q = `${f.quantite} g de ${f.produit === "cannabis" ? "résine de cannabis" : "cocaïne"}`;
        const cache = pk(r, ["des boîtes de conserve", "un lot de jouets", "des paquets de café"]);
        return {
          titre: "le colis venu de l'étranger", lieu: `${X.rue}, lors de la remise d'un colis sous surveillance`,
          resume: `Un colis expédié ${f.pays}, contenant ${q}, est intercepté par la douane ; ${X.n(A)} est interpellé${X.e(A)} au moment où ${X.il(A)} le réceptionne.`,
          constat: [
            `Information de la direction régionale des douanes : colis postal en provenance ${f.pays}, contenant ${q} dissimulés dans ${cache}.`,
            `Livraison surveillée le ${X.date(X.faits)} ; le colis est remis à ${X.n(A)}, qui signe le bordereau d'un faux nom.`,
            `Interpellation dans le hall de l'immeuble ; découverte de ${eur(f.especes)} et de deux téléphones.`,
          ],
          saisie: `${q} et ${eur(f.especes)} en espèces`,
          version: { nie: "Je savais pas ce qu'il y avait dedans. Un gars m'a demandé de récupérer un colis, contre 200 euros.", minimise: "Je me doutais que c'était pas clair. Je pensais que c'étaient des cigarettes.", reconnait: "Je savais que c'était de la drogue. C'était le troisième colis." },
          audition: [{ q: `Le colis contenait ${q}. Saviez-vous ce qu'il y avait dedans ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "On m'a dit que c'étaient des vêtements." } }, { q: "Qui vous a demandé de récupérer ce colis ?", a: { silence: "…", expliquer: "Je donnerai pas de nom.", partiel: "Quelqu'un du quartier." } }],
          prevention: `importé illicitement des stupéfiants, en l'espèce ${q}, en provenance ${f.pays}`,
          prejudice: [],
          qA: [{ q: "Pourquoi avoir signé d'un faux nom ?", a: ["On m'avait dit de faire comme ça. Je n'ai pas réfléchi."] }],
        };
      },
    },
    blanchiment_stups: {
      tirer: (r) => ({ commerce: pk(r, ["laverie", "taxiphone", "snack"]), montant: int(r, 30, 180) * 1000, mois: int(r, 8, 20), produit: "cannabis", quantite: 0, especes: int(r, 5, 30) * 500 }),
      qual: () => CAT.delit(120, 750000, "art. 222-38 CP", "blanchiment du produit d'un trafic de stupéfiants", { textes: ["CP_222-38"] }),
      scn: {
        nom: "Blanchiment du produit d'un trafic de stupéfiants", textes: ["CP_222-38"], victime: null,
        elements: { legal: "Art. 222-38 CP (le blanchiment général est à l'art. 324-1).", materiel: "Faciliter la justification mensongère des ressources d'un trafiquant, ou concourir au placement, à la dissimulation ou à la conversion du produit du trafic.", moral: "La connaissance de l'origine des fonds ; elle se déduit souvent de l'importance et de la forme des dépôts." },
        flagrance: 0, mesures: { gav: 0.85, al: 0.15 }, preuves: { releve: 1, saisie: 0.5, telephonie: 0.6, temoin: 0.25, aveux: 0.35 },
        irr: ["perq_assentiment", "perq_nuit", "requisition", "geoloc"], camera: 0, pasGenres: ["ci", "op"],
        metierAuteur: (f, A) => ({ laverie: A.g === "f" ? "gérante d'une laverie" : "gérant d'une laverie", taxiphone: A.g === "f" ? "gérante d'un taxiphone" : "gérant d'un taxiphone", snack: A.g === "f" ? "gérante d'un snack" : "gérant d'un snack" })[f.commerce],
      },
      recit(X, f) {
        const { A } = X;
        const com = { laverie: "la laverie", taxiphone: "le taxiphone", snack: "le snack" }[f.commerce];
        return {
          titre: `${com} du trafic`, lieu: `${X.rue}`, montant: f.montant,
          resume: `${X.n(A)}, ${A.metier}, aurait déposé sur le compte de son commerce ${eur(f.montant)} en espèces issus d'un point de vente de stupéfiants voisin.`,
          constat: [`Signalement de Tracfin : dépôts d'espèces sans rapport avec l'activité d'un petit commerce de quartier (${eur(f.montant)} en ${f.mois} mois).`, `Surveillances : remises de sacs entre ${X.n(A)} et des vendeurs du point de vente situé ${X.rue}.`],
          saisie: `${eur(f.especes)} en espèces et un cahier de comptes`,
          temoin: [`J'ai travaillé ${com === "la laverie" ? "à la laverie" : com === "le snack" ? "au snack" : "au taxiphone"}. La caisse ne faisait jamais plus de 200 euros par jour. Le soir, des liasses arrivaient dans un sac.`],
          version: { nie: "C'est mon chiffre d'affaires. Je travaille sept jours sur sept.", minimise: "Des gens du quartier m'ont demandé de déposer de l'argent pour eux. Je rendais service.", reconnait: "Je savais d'où venait l'argent. Je prenais dix pour cent." },
          audition: [{ q: `Comment votre commerce déclare-t-il ${eur(f.montant)} de recettes en espèces ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Ça marche bien, c'est tout." } }],
          prevention: `apporté son concours à une opération de placement, de dissimulation ou de conversion du produit d'un trafic de stupéfiants, en l'espèce en déposant ${eur(f.montant)} en espèces sur le compte de son commerce`,
          prejudice: [],
        };
      },
    },
    provocation: {
      poids: 0.8,
      tirer: (r) => ({ reseau: pk(r, ["Instagram", "TikTok", "Snapchat"]), abonnes: int(r, 3, 90) * 1000, produit: pk(r, ["cannabis", "cocaine"]), quantite: 0, especes: 0 }),
      qual: () => CAT.delit(60, 75000, "art. L. 3421-4 CSP", "provocation à l'usage de stupéfiants et présentation de cet usage sous un jour favorable", { textes: ["CSP_L3421-4"] }),
      scn: {
        nom: "Provocation à l'usage de stupéfiants", textes: ["CSP_L3421-4"], victime: null,
        elements: { legal: "Art. L. 3421-4 du code de la santé publique.", materiel: "Provoquer à l'usage ou au trafic de stupéfiants, ou présenter ces infractions sous un jour favorable, même sans effet.", moral: "La conscience de valoriser l'usage ; l'humour ou la « fiction » se discutent." },
        flagrance: 0, mesures: { gav: 0.5, al: 0.5 }, preuves: { ecrits: 1, telephonie: 0.6, saisie: 0.3, aveux: 0.45 },
        irr: ["requisition", "al_quitter", "perq_assentiment"], camera: 0, pasGenres: ["ci", "op"],
      },
      recit(X, f) {
        const { A } = X;
        const prod = f.produit === "cannabis" ? "cannabis" : "cocaïne";
        return {
          titre: "le compte qui fait la promotion", lieu: `${X.rue}, ${X.lieu}`,
          resume: `${X.n(A)} animerait un compte ${f.reseau} de ${f.abonnes} abonnés publiant des vidéos qui présentent la consommation de ${prod} sous un jour favorable.`,
          constat: [`Veille des enquêteurs : vidéos montrant la consommation de ${prod}, avec des légendes valorisantes ; réquisition à ${f.reseau} : le compte est rattaché à l'adresse électronique de ${X.n(A)}.`],
          ecritsPiece: { court: "Publications du compte", titre: "Procès-verbal de constatations — publications en ligne", intro: `Constatons, sur le compte ${f.reseau} accessible à tous, les publications suivantes, dont nous réalisons des captures :`, dater: true },
          ecrits: ["Légende : « Rien de mieux pour finir la semaine. »", "Commentaire épinglé : « Vous savez ce qui vous reste à faire. »"],
          saisie: "deux téléphones et un ordinateur portable",
          version: { nie: "Ce n'est pas mon compte. On me l'a piraté.", minimise: "C'est de l'humour, de la fiction. Je ne vends rien, je ne dis à personne d'en prendre.", reconnait: "C'est mon compte. Ça faisait des vues, c'est tout. J'ai tout supprimé." },
          audition: [{ q: `Le compte ${f.reseau} qui publie ces vidéos est rattaché à votre adresse. En êtes-vous l'auteur ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je ne poste plus rien depuis longtemps." } }],
          prevention: `provoqué à l'usage illicite de stupéfiants et présenté cet usage sous un jour favorable, en l'espèce par des vidéos publiées sur le réseau ${f.reseau}`,
          prejudice: [],
        };
      },
    },
  });

  // =================================================================== USURPATION D'ÉTAT CIVIL (434-23)
  variantes("usurpation_identite", 0.35, {
    etat_civil: {
      tirer: (r) => ({ lien: pk(r, ["cousin", "ami"]), motif: pk(r, ["permis", "alcool"]) }),
      qual: () => CAT.delit(60, 75000, "art. 434-23 CP", "usurpation de l'identité d'un tiers dans des circonstances ayant pu déterminer contre lui des poursuites pénales", { textes: ["CP_434-23"] }),
      scn: {
        nom: "Usurpation d'état civil", textes: ["CP_434-23"],
        elements: { legal: "Art. 434-23 CP (à distinguer de l'usurpation d'identité de l'art. 226-4-1).", materiel: "Prendre le nom d'un tiers dans des circonstances qui ont déterminé, ou auraient pu déterminer, des poursuites pénales contre lui : typiquement, au contrôle.", moral: "La conscience de faire peser les poursuites sur un autre." },
        flagrance: 0, mesures: { gav: 0.45, al: 0.55 }, preuves: { plainte: 1, ecrits: 0.7, temoin: 0.3, aveux: 0.5, telephonie: 0.2 }, irr: ["al_quitter", "requisition"], camera: 0, categorie: "num",
      },
      recit(X, f) {
        const { A, V, T } = X;
        const lien = f.lien === "cousin" ? X.g(V).w("son cousin", "sa cousine") : X.g(V).w("un ami d'enfance", "une amie d'enfance");
        const infra = f.motif === "permis" ? "conduite sans permis" : "conduite en état alcoolique";
        return {
          titre: "le faux nom au contrôle", lieu: `${X.rue}, lors d'un contrôle routier`,
          resume: `Contrôlé${X.e(A)} pour ${infra}, ${X.n(A)} aurait donné l'identité de ${X.nf(V)}, ${lien}, qui a ensuite reçu la convocation.`,
          constat: [`Plainte de ${X.nf(V)}, qui conteste être l'auteur de la ${infra} relevée le ${X.date(X.faits)}.`, `Comparaison de la signature du procès-verbal de contrôle avec celle de ${X.nf(V)} ; les fonctionnaires qui ont procédé au contrôle ne ${X.la(V)} reconnaissent pas sur photographie.`],
          plainte: [`J'ai reçu une convocation pour ${infra}, pour un jour où ${X.travaille(V) ? "j'étais au travail toute la journée" : "je n'ai pas bougé de chez moi"}.`, `${X.n(A)} connaît ma date de naissance, mon adresse. ${X.Il(A)} est ${X.g(A).w("le seul", "la seule")} à avoir pu faire ça.`],
          ecritsPiece: { court: "Pièces de la première procédure", titre: "Procès-verbal de constatations — pièces de la procédure routière", intro: "Pièces de la procédure ouverte au nom du plaignant, jointes à la présente :", dater: false },
          ecrits: [`Procès-verbal de contrôle du ${X.date(X.faits)}, signé au nom de « ${V.prenom} ${V.nom} ».`, `Convocation adressée à ${X.nf(V)} devant le délégué du procureur.`],
          temoin: [`J'étais ${X.g(T).w("passager", "passagère")} de la voiture. C'est ${X.n(A)} qui conduisait. Au contrôle, ${X.il(A)} a donné un autre nom ; je n'ai rien dit.`],
          version: { nie: `C'est ${X.lui(V)} qui conduisait ce jour-là. Moi, je n'étais même pas là.`, minimise: "J'ai paniqué au contrôle. J'ai donné ce nom sans réfléchir, je comptais tout lui dire.", reconnait: `J'ai donné son nom parce que je n'avais pas le droit de conduire. Je m'excuse auprès de ${X.lui(V)}.` },
          audition: [{ q: `La signature du procès-verbal de contrôle ne correspond pas à la signature de ${X.nf(V)}. Est-ce vous qui avez été contrôlé${X.e(A)} ce jour-là ?`, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel: "Je ne me souviens pas." } }],
          prevention: `pris le nom de ${X.nf(V)}, dans des circonstances qui ont déterminé ou auraient pu déterminer contre ${X.lui(V)} des poursuites pénales`,
          prejudice: [{ id: "moral", label: "Préjudice moral (les poursuites subies à tort)", demande: 1500, base: 900 }],
        };
      },
    },
  });
})();
