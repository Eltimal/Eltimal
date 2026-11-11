/* La Permanence — catalogue, lot 2 du programme : délits fréquents en permanence (nouvelles fiches).
   Mise en danger d'autrui, non-assistance à personne en péril, abus de faiblesse, dénonciation calomnieuse, atteintes à la vie
   privée (captation et diffusion d'images intimes), exhibition sexuelle, outrage sexiste aggravé, abandon de famille,
   non-représentation d'enfant, violation d'une ordonnance de protection, apologie du terrorisme, refus de remettre le code de
   déchiffrement (en concours avec un trafic), évasion, fausse monnaie.
   Textes et peines vérifiés en ligne le 9 novembre 2026 (source indiquée texte par texte) ; les récits sont fictifs. */
(function () {
  const CR = window.CR;
  const CAT = CR.CAT;
  const { pk, int, ch } = CAT;
  const eur = (n) => CR.money(n);
  const cap = (s) => CR.cap(s);
  const SV = (cite, texte, src) => ({ cite, texte, etat: "resume", extrait: false, source: `Vérifié le 9 novembre 2026 (${src || "Légifrance"}) — résumé, le texte officiel fait foi` });

  // ------------------------------------------------------------------ Textes (vérifiés le 9 novembre 2026)
  Object.assign(CAT.TEXTES, {
    "CP_223-1": [SV("Art. 223-1 du code pénal", "Le fait d'exposer directement autrui à un risque immédiat de mort ou de blessures de nature à entraîner une mutilation ou une infirmité permanente par la violation manifestement délibérée d'une obligation particulière de prudence ou de sécurité imposée par la loi ou le règlement est puni d'un an d'emprisonnement et de 15 000 euros d'amende."), "La mise en danger délibérée d'autrui"],
    "CP_223-6": [SV("Art. 223-6 du code pénal", "Quiconque pouvant empêcher par son action immédiate, sans risque pour lui ou pour les tiers, soit un crime, soit un délit contre l'intégrité corporelle de la personne s'abstient volontairement de le faire est puni de cinq ans d'emprisonnement et de 75 000 euros d'amende. Sont punis des mêmes peines ceux qui s'abstiennent volontairement de porter à une personne en péril l'assistance que, sans risque pour eux ou pour les tiers, ils pouvaient lui prêter soit par leur action personnelle, soit en provoquant un secours. Sept ans et 100 000 euros lorsque la personne en péril est un mineur de quinze ans.", "Juritravail, version du 6 août 2018"), "La non-assistance à personne en péril"],
    "CP_223-15-2": [SV("Art. 223-15-2 du code pénal", "Est puni de trois ans d'emprisonnement et de 375 000 euros d'amende l'abus frauduleux de l'état d'ignorance ou de la situation de faiblesse d'un mineur, ou d'une personne dont la particulière vulnérabilité, due à son âge, à une maladie, à une infirmité, à une déficience physique ou psychique ou à un état de grossesse, est apparente ou connue de son auteur, ou d'une personne en état de sujétion psychologique ou physique, pour conduire ce mineur ou cette personne à un acte ou à une abstention qui lui sont gravement préjudiciables. Des peines plus lourdes sont prévues dans certains cas (en ligne, en bande organisée).", "Juritravail"), "L'abus de faiblesse"],
    "CP_226-10": [SV("Art. 226-10 du code pénal", "La dénonciation, effectuée par tout moyen et dirigée contre une personne déterminée, d'un fait de nature à entraîner des sanctions judiciaires, administratives ou disciplinaires et que l'on sait totalement ou partiellement inexact, lorsqu'elle est adressée à un officier de justice ou de police administrative ou judiciaire, à une autorité ayant le pouvoir d'y donner suite, ou aux supérieurs hiérarchiques ou à l'employeur de la personne dénoncée, est punie de cinq ans d'emprisonnement et de 45 000 euros d'amende. La fausseté du fait dénoncé résulte nécessairement de la décision, devenue définitive, d'acquittement, de relaxe ou de non-lieu déclarant que le fait n'a pas été commis ou que celui-ci n'est pas imputable à la personne dénoncée ; en tout autre cas, le tribunal apprécie la pertinence des accusations.", "Juritravail, version du 11 décembre 2016"), "La dénonciation calomnieuse"],
    "CP_226-1": [SV("Art. 226-1 du code pénal", "Est puni d'un an d'emprisonnement et de 45 000 euros d'amende le fait, au moyen d'un procédé quelconque, volontairement de porter atteinte à l'intimité de la vie privée d'autrui en captant, enregistrant ou transmettant, sans le consentement de leur auteur, des paroles prononcées à titre privé ou confidentiel, en fixant, enregistrant ou transmettant, sans son consentement, l'image d'une personne se trouvant dans un lieu privé, ou en captant, enregistrant ou transmettant, par quelque moyen que ce soit, la localisation en temps réel ou en différé d'une personne sans son consentement. Deux ans et 60 000 euros lorsque les faits sont commis par le conjoint, le concubin ou le partenaire lié par un pacte civil de solidarité.", "Juritravail, version du 23 mars 2024"), "L'atteinte à l'intimité de la vie privée"],
    "CP_226-2-1": [SV("Art. 226-2-1 du code pénal", "Lorsque les délits prévus aux articles 226-1 et 226-2 portent sur des paroles ou des images présentant un caractère sexuel prises dans un lieu public ou privé, les peines sont portées à deux ans d'emprisonnement et à 60 000 euros d'amende. Est puni des mêmes peines le fait, en l'absence d'accord de la personne pour la diffusion, de porter à la connaissance du public ou d'un tiers tout enregistrement ou tout document portant sur des paroles ou des images présentant un caractère sexuel, obtenu, avec le consentement exprès ou présumé de la personne ou par elle-même.", "Juritravail, version du 9 octobre 2016"), "La diffusion d'images intimes sans accord"],
    "CP_222-32": [SV("Art. 222-32 du code pénal", "L'exhibition sexuelle imposée à la vue d'autrui dans un lieu accessible aux regards du public est punie d'un an d'emprisonnement et de 15 000 euros d'amende ; deux ans et 30 000 euros lorsqu'elle est commise au préjudice d'un mineur de quinze ans.", "ministère des Armées, fiche pratique"), "L'exhibition sexuelle"],
    "CP_222-33-1-1": [SV("Art. 222-33-1-1 du code pénal", "Depuis le 1er avril 2023, l'outrage sexiste et sexuel (imposer un propos ou un comportement à connotation sexuelle ou sexiste qui porte atteinte à la dignité ou crée une situation intimidante, hostile ou offensante) est un délit puni de 3 750 euros d'amende lorsqu'il est commis avec une circonstance aggravante : notamment par une personne abusant de l'autorité de ses fonctions, sur un mineur ou une personne vulnérable, en réunion, dans un véhicule de transport collectif ou un lieu destiné à l'accès à un tel transport, ou en raison de l'orientation sexuelle de la victime. L'action publique peut être éteinte par une amende forfaitaire délictuelle de 300 euros (250 euros minorée, 600 euros majorée). Sans circonstance, c'est une contravention de la 5e classe (art. R. 625-8-3).", "éditions Tissot ; ministère de la Justice, annexe de la circulaire de février 2023"), "L'outrage sexiste et sexuel aggravé"],
    "CP_227-3": [SV("Art. 227-3 du code pénal", "Le fait, pour une personne, de ne pas exécuter une décision judiciaire ou une convention judiciairement homologuée lui imposant de verser au profit d'un enfant mineur, d'un descendant, d'un ascendant ou du conjoint une pension, une contribution, des subsides ou des prestations de toute nature dues en raison de l'une des obligations familiales prévues par le code civil, en demeurant plus de deux mois sans s'acquitter intégralement de cette obligation, est puni de deux ans d'emprisonnement et de 15 000 euros d'amende. Les mêmes peines s'appliquent au débiteur qui ne paie pas à l'organisme chargé de l'intermédiation financière.", "Juritravail, version du 1er mars 2022"), "L'abandon de famille"],
    "CP_227-5": [SV("Art. 227-5 du code pénal", "Le fait de refuser indûment de représenter un enfant mineur à la personne qui a le droit de le réclamer est puni d'un an d'emprisonnement et de 15 000 euros d'amende.", "Juritravail"), "La non-représentation d'enfant"],
    "CP_227-4-2": [SV("Art. 227-4-2 du code pénal", "Le fait, pour une personne faisant l'objet d'une ordonnance de protection ou d'une ordonnance provisoire de protection immédiate, de ne pas se conformer à une ou plusieurs obligations ou interdictions imposées dans cette ordonnance est puni de trois ans d'emprisonnement et de 45 000 euros d'amende (peines portées à ce niveau par la loi du 13 juin 2024 ; deux ans et 15 000 euros auparavant).", "Actu-Juridique, loi n° 2024-536 du 13 juin 2024"), "La violation d'une ordonnance de protection"],
    "CP_421-2-5": [SV("Art. 421-2-5 du code pénal", "Le fait de provoquer directement à des actes de terrorisme ou de faire publiquement l'apologie de ces actes est puni de cinq ans d'emprisonnement et de 75 000 euros d'amende ; sept ans et 100 000 euros lorsque les faits ont été commis en utilisant un service de communication au public en ligne."), "La provocation et l'apologie du terrorisme"],
    "CP_434-15-2": [SV("Art. 434-15-2 du code pénal", "Est puni de trois ans d'emprisonnement et de 270 000 euros d'amende le fait, pour quiconque ayant connaissance de la convention secrète de déchiffrement d'un moyen de cryptologie susceptible d'avoir été utilisé pour préparer, faciliter ou commettre un crime ou un délit, de refuser de remettre ladite convention aux autorités judiciaires ou de la mettre en œuvre, sur les réquisitions de ces autorités. Cinq ans et 450 000 euros si le refus a empêché d'éviter la commission d'un crime ou d'un délit ou d'en limiter les effets. Le code de déverrouillage d'un téléphone peut être une telle convention lorsque l'appareil chiffre ses données (Cass. ass. plén., 7 novembre 2022, n° 21-83.146)."), "Le refus de remettre le code de déchiffrement"],
    "CP_434-27": [SV("Art. 434-27 du code pénal", "Constitue une évasion punissable le fait, par un détenu, de se soustraire à la garde à laquelle il est soumis. L'évasion est punie de trois ans d'emprisonnement et de 45 000 euros d'amende ; cinq ans et 75 000 euros lorsqu'elle est réalisée par violence, effraction ou corruption. Est considérée comme détenue notamment la personne placée en garde à vue (art. 434-28). L'article 434-29 assimile à l'évasion la non-réintégration à l'issue d'une permission de sortir, d'une semi-liberté ou d'un placement à l'extérieur."), "L'évasion"],
    "CP_442-2": [SV("Art. 442-2 du code pénal", "Le transport, la mise en circulation ou la détention en vue de la mise en circulation des signes monétaires contrefaits ou falsifiés sont punis de dix ans d'emprisonnement et de 150 000 euros d'amende ; trente ans de réclusion criminelle et 450 000 euros d'amende en bande organisée. Celui qui, ayant reçu de bonne foi de faux billets, les remet en circulation après en avoir découvert les vices n'encourt que 7 500 euros d'amende (art. 442-7)."), "La fausse monnaie"],
  });
  CAT.installTextes();

  const D = (o) => CAT.def(o.id, o);
  const rep = (q, partiel) => ({ q, a: { silence: "Je ne souhaite pas répondre.", expliquer: null, partiel } });

  // =================================================================== MISE EN DANGER DÉLIBÉRÉE D'AUTRUI (223-1)
  D({
    id: "mise_en_danger", fam: "personnes", nom: "Mise en danger délibérée d'autrui", gravite: 0.35,
    pasMensonges: ["pas_frappe"], // pas de coups dans ces faits : le mensonge « je ne l'ai pas frappé » n'a pas de sens
    textes: ["CP_223-1"],
    elements: { legal: "Art. 223-1 CP.", materiel: "Exposer directement autrui à un risque immédiat de mort ou de blessures graves, par la violation d'une obligation particulière de prudence ou de sécurité imposée par la loi ou le règlement ; aucun dommage n'est exigé.", moral: "Une violation manifestement délibérée : l'auteur connaissait la règle et l'a écartée sciemment." },
    victimeDe: (f) => (f.sc === "chantier" ? "personne" : null),
    mesures: { gav: 0.6, al: 0.35, convocation: 0.05 }, flagrance: 0.6,
    flagranceDe: (f) => (f.sc === "conduite" ? 0.9 : 0),
    voies: { classement: 0.08, alternative: 0.2, copj: 0.45, ci: 0.12, crpc: 0.15 },
    preuves: { constat: 0.8, temoin: 0.5, plainte: 0.6, aveux: 0.4 },
    camera: 0.2, irr: ["controle_identite", "heures"],
    controle: (f) => f.sc === "conduite",
    metierAuteur: (f, A) => (f.sc === "chantier" ? (A.g === "f" ? "cheffe d'entreprise du bâtiment" : "chef d'entreprise du bâtiment") : null),
    metierVictime: (f, V) => (f.sc === "chantier" ? (V.g === "f" ? "ouvrière du bâtiment" : "ouvrier du bâtiment") : null),
    tirer(r) { return { sc: pk(r, ["conduite", "conduite", "chantier"]), vitesse: int(r, 9, 14) * 10, hauteur: int(r, 5, 12), agg: [] }; },
    qual: () => CAT.delit(12, 15000, "art. 223-1 CP", "mise en danger délibérée de la personne d'autrui", { textes: ["CP_223-1"] }),
    recit(X, f) {
      const { A, V, r } = X;
      if (f.sc === "chantier") return {
        titre: "le toit sans garde-corps", lieu: `sur un chantier de rénovation, ${int(r, 2, 90)}, ${X.rue}`,
        resume: `${X.n(A)}, ${A.metier}, aurait fait travailler ${X.nf(V)} sur une toiture à ${f.hauteur} mètres, sans garde-corps ni harnais.`,
        constat: [`Contrôle de l'inspection du travail sur le chantier : ${X.nf(V)} travaille sur la toiture, à ${f.hauteur} mètres du sol, sans protection collective ni équipement antichute ; les harnais sont restés dans la camionnette.`, "L'entreprise avait reçu une mise en demeure de l'inspection du travail le mois précédent, pour le même chantier."],
        plainte: [`On nous dit de monter sans harnais, sinon on perd du temps. ${X.Il(A)} dit que les garde-corps coûtent trop cher à louer.`, `Un jour, j'ai glissé, je me suis rattrapé${X.e(V)} à la gouttière. Personne n'a rien dit.`],
        temoin: [`Je travaille sur le même chantier. Le matin, ${X.n(A)} a vu qu'on montait sans rien. ${X.Il(A)} a dit : « Faites vite. »`],
        version: { nie: "Les harnais étaient à disposition. S'ils ne les mettent pas, ce n'est pas ma faute.", minimise: "C'était pour une heure de travail. On allait installer les garde-corps l'après-midi.", reconnait: "Je savais que c'était interdit. On était en retard sur le chantier, j'ai laissé faire." },
        audition: [rep("L'inspection du travail vous avait mis en demeure le mois dernier. Pourquoi n'y avait-il toujours ni garde-corps ni harnais ?", "Le matériel était commandé.")],
        prevention: `exposé directement ${X.nf(V)} à un risque immédiat de mort ou de blessures graves, en ${X.la(V)} faisant travailler à ${f.hauteur} mètres de hauteur sans protection collective ni équipement antichute, en violation manifestement délibérée des obligations de sécurité imposées par le code du travail`,
        prejudice: [{ id: "moral", label: "Préjudice moral (la peur au travail)", demande: 1500, base: 800 }],
        qA: [{ q: "Vous connaissiez la règle ?", a: ["Bien sûr. Mais tout le monde fait comme ça, sur les chantiers de cette taille."] }],
      };
      return {
        titre: "la course en ville", lieu: `${X.rue}, ${X.lieu}`,
        resume: `${X.n(A)} aurait traversé le quartier à ${f.vitesse} km/h dans une rue limitée à 30, à contresens et sur le trottoir, pour échapper à un contrôle.`,
        constat: [`Remarquons un véhicule qui circule à une vitesse que nous estimons supérieure à ${f.vitesse - 10} km/h ${X.rue}, voie limitée à 30 km/h, à l'heure de la sortie des écoles.`, "Le conducteur franchit deux feux rouges, emprunte un sens interdit et monte sur le trottoir, obligeant des piétons à se jeter de côté.", `Le véhicule est immobilisé quelques rues plus loin ; ${X.n(A)} en est le conducteur.`],
        temoin: ["J'étais sur le trottoir, devant l'école. La voiture est passée à un mètre de nous, sur le trottoir. J'ai cru qu'on allait mourir."],
        version: { nie: "Je roulais normalement. Ils exagèrent, je n'ai mis personne en danger.", minimise: "J'ai eu peur de la police, j'ai accéléré. Mais il n'y avait personne sur le trottoir.", reconnait: "J'ai paniqué, j'ai roulé n'importe comment. J'aurais pu tuer quelqu'un." },
        audition: [rep(`Les fonctionnaires vous ont vu rouler à plus de ${f.vitesse - 10} km/h, sur le trottoir, à la sortie des écoles. Pourquoi ?`, "J'ai eu peur.")],
        prevention: `exposé directement autrui à un risque immédiat de mort ou de blessures graves, en circulant à ${f.vitesse} km/h dans une voie limitée à 30 km/h, à contresens et sur le trottoir, en violation manifestement délibérée des obligations de prudence imposées par le code de la route`,
        prejudice: [],
      };
    },
  });

  // =================================================================== NON-ASSISTANCE À PERSONNE EN PÉRIL (223-6, al. 2)
  D({
    id: "non_assistance", fam: "personnes", nom: "Non-assistance à personne en péril", gravite: 0.45, victime: "personne", pasCI: true,
    pasMensonges: ["pas_frappe"], // pas de coups dans ces faits : le mensonge « je ne l'ai pas frappé » n'a pas de sens
    textes: ["CP_223-6"],
    elements: { legal: "Art. 223-6, al. 2 CP.", materiel: "Un péril grave et imminent pour une personne ; une assistance possible sans risque pour soi ou pour les tiers (au minimum, appeler les secours) ; une abstention.", moral: "La conscience du péril et la volonté de ne pas agir ; si l'auteur n'a pas mesuré la gravité de l'état de la victime, l'intention se discute." },
    mesures: { gav: 0.4, al: 0.55, convocation: 0.05 }, flagrance: 0,
    voies: { classement: 0.1, alternative: 0.05, copj: 0.65, ci: 0, crpc: 0.2 },
    preuves: { plainte: 1, temoin: 0.7, telephonie: 0.6, certificat: 0.8, aveux: 0.4 },
    camera: 0, irr: ["al_quitter", "requisition"], categorie: "scene",
    tirer(r) { return { sc: pk(r, ["soiree", "soiree", "rixe"]), heures: int(r, 2, 6), itt: int(r, 9, 45), agg: [] }; },
    qual: () => CAT.delit(60, 75000, "art. 223-6, al. 2 CP", "abstention volontaire de porter assistance à une personne en péril", { textes: ["CP_223-6"] }),
    recit(X, f) {
      const { A, V } = X;
      const so = f.sc === "soiree";
      const les = so ? ["une intoxication éthylique sévère", "une hypothermie"] : ["un traumatisme crânien", "une fracture de la mâchoire"];
      return {
        titre: so ? "la soirée qui finit mal" : "la bagarre sans secours", lieu: so ? `dans l'appartement de ${X.n(A)}, ${X.rue}` : `${X.rue}, ${X.lieu}`, lesions: les, itt: f.itt,
        resume: so ? `${X.nf(V)}, inconscient${X.e(V)} après une soirée, aurait été laissé${X.e(V)} seul${X.e(V)} par ${X.n(A)} pendant ${f.heures} heures, sans appel aux secours.` : `${X.nf(V)}, frappé${X.e(V)} par des inconnus et resté${X.e(V)} au sol, n'aurait pas été secouru${X.e(V)} par ${X.n(A)}, présent${X.e(A)}, qui serait parti${X.e(A)} sans appeler les secours.`,
        constat: [so ? `Intervention des sapeurs-pompiers à l'appel d'un voisin : ${X.nf(V)} est retrouvé${X.e(V)} inconscient${X.e(V)}, en hypothermie, dans le salon ; ${X.n(A)} a quitté l'appartement depuis plusieurs heures.` : `Une passante découvre ${X.nf(V)} au sol, ${X.rue} ; la ligne de ${X.n(A)} déclenche le relais le plus proche à l'heure des faits, sans aucun appel au 15, au 17 ni au 18.`],
        plainte: [so ? `On avait beaucoup bu. Je me souviens d'être tombé${X.e(V)} sur le canapé, après plus rien. ${X.Il(A)} est parti${X.e(A)} dormir chez quelqu'un d'autre.` : `On s'est fait attaquer en sortant du bar. Moi, je suis tombé${X.e(V)}. ${X.Il(A)} était là, ${X.il(A)} a vu que je ne bougeais plus, et ${X.il(A)} est parti${X.e(A)}.`, `J'ai eu ${les.join(" et ")}. Le médecin dit que quelques heures de plus, j'y restais.`, "Je dépose plainte. Un simple appel aurait suffi."],
        temoin: [so ? "J'habite à côté. Vers cinq heures, j'ai entendu un bruit de chute, puis plus rien. Le matin, la porte était entrouverte : j'ai appelé les pompiers." : `C'est moi qui ai trouvé ${X.nf(V)}. Il n'y avait plus personne autour.`],
        version: { nie: so ? `Quand je suis parti${X.e(A)}, ${X.il(V)} dormait normalement. ${X.Il(V)} ronflait.` : "Je n'étais plus là quand c'est arrivé.", minimise: so ? `Je pensais qu'${X.il(V)} cuvait. Je ne pouvais pas savoir que c'était grave.` : `J'ai eu peur, je suis parti${X.e(A)} en courant. Je pensais que quelqu'un d'autre appellerait.`, reconnait: "J'aurais dû appeler. Je n'ai pas réfléchi. Je m'en veux." },
        audition: [rep(`${X.nf(V)} ne réagissait plus. Pourquoi ne pas avoir appelé les secours ?`, "Je ne pensais pas que c'était grave.")],
        prevention: `volontairement omis de porter à ${X.nf(V)}, personne en péril, l'assistance que, sans risque pour ${X.lui(A)} ou pour les tiers, ${X.il(A)} pouvait lui prêter, soit par son action personnelle, soit en provoquant un secours`,
        prejudice: [{ id: "dft", label: `Souffrances endurées (${les[0]})`, demande: 3000, base: 2000 }, { id: "moral", label: "Préjudice moral (l'abandon)", demande: 3000, base: 1500 }],
        qA: [{ q: "Vous aviez votre téléphone ?", a: ["Oui, et la batterie était pleine. Je n'ai pas pensé à appeler."] }],
      };
    },
  });

  // =================================================================== ABUS DE FAIBLESSE (223-15-2)
  D({
    id: "abus_faiblesse", fam: "biens", nom: "Abus de faiblesse", gravite: 0.45, victime: "personne", victimeAgee: true, pasCI: true, categorie: "fin",
    pasMensonges: ["absent"],
    textes: ["CP_223-15-2"],
    elements: { legal: "Art. 223-15-2 CP.", materiel: "Une victime particulièrement vulnérable (âge, maladie, déficience), dont l'état est apparent ou connu de l'auteur ; un acte ou une abstention gravement préjudiciable obtenu en abusant de cet état (chèques, procuration, travaux).", moral: "La conscience de la vulnérabilité et de l'abus ; elle se lit dans la répétition et l'ampleur des remises." },
    mesures: { gav: 0.35, al: 0.6, convocation: 0.05 }, flagrance: 0,
    voies: { classement: 0.08, alternative: 0.1, copj: 0.62, ci: 0, crpc: 0.2 },
    preuves: { plainte: 1, releve: 1, temoin: 0.4, aveux: 0.4 },
    camera: 0, irr: ["al_quitter", "requisition"],
    tirer(r) { return { sc: pk(r, ["voisin", "aide", "travaux"]), montant: int(r, 40, 400) * 100, mois: int(r, 3, 24), agg: [] }; }, // la vulnérabilité est un élément du délit, pas une circonstance : pas d'agg « vulnerable » (victimeAgee donne l'âge)
    qual: () => CAT.delit(36, 375000, "art. 223-15-2 CP", "abus frauduleux de l'état de faiblesse d'une personne particulièrement vulnérable", { textes: ["CP_223-15-2"] }),
    metierAuteur: (f, A) => (f.sc === "aide" ? (A.g === "f" ? "aide ménagère" : "aide ménager") : f.sc === "travaux" ? (A.g === "f" ? "artisane" : "artisan") : null),
    recit(X, f) {
      const { A, V } = X;
      const m = eur(f.montant);
      const S = {
        voisin: { titre: "le voisin trop serviable", comment: `en se rendant indispensable auprès de ${X.nf(V)}, ${V.age} ans, puis en se faisant remettre chèques et retraits d'espèces`, dit: `${X.Il(A)} me disait que c'était pour des courses, pour des factures. Je signais.` },
        aide: { titre: "les chèques de l'aide à domicile", comment: `en profitant de son travail au domicile de ${X.nf(V)}, ${V.age} ans, pour se faire signer des chèques`, dit: `${X.Il(A)} me tendait le chéquier, ${X.il(A)} disait que c'était pour son salaire. Je signais.` },
        travaux: { titre: "les travaux à prix d'or", comment: `en faisant signer à ${X.nf(V)}, ${V.age} ans, des devis de travaux inutiles et surfacturés, payés d'avance`, dit: `${X.Il(A)} revenait chaque mois avec un nouveau devis : la toiture, les canalisations, l'humidité. Je signais.` },
      }[f.sc];
      return {
        titre: S.titre, lieu: `au domicile de ${X.nf(V)}, ${X.rue}`, montant: f.montant,
        resume: `${X.n(A)} aurait obtenu ${m} en ${f.mois} mois ${S.comment}.`,
        constat: [`Signalement de la banque de ${X.nf(V)} au procureur de la République, puis plainte : relevés de compte sur la période, copies des chèques, certificat du médecin traitant décrivant des troubles cognitifs.`],
        plainte: [`C'est ma famille qui a vu les relevés. Moi, je ne me rendais pas compte. ${X.n(A)} était gentil${X.e(A)}, ${X.il(A)} passait souvent.`, S.dit, `En tout, il manque ${m}.`],
        temoin: [`Je suis l'auxiliaire de vie de ${X.nf(V)}. ${X.Il(V)} oublie ce qu'on lui a dit dans l'heure. Ça se voit tout de suite.`],
        version: { nie: `${X.Il(V)} m'a donné cet argent librement, pour me remercier. ${X.Il(V)} a toute sa tête.`, minimise: "Ce sont des prêts. Je comptais rembourser.", reconnait: `Je savais qu'${X.il(V)} ne se rendait pas compte. J'avais des dettes. Je rembourserai.` },
        audition: [rep(`${m} en ${f.mois} mois, de la part d'une personne qui ne se souvient plus de ce qu'on lui a dit dans l'heure. Vous ne voyiez pas son état ?`, `${X.Il(V)} avait l'air bien, avec moi.`)],
        prevention: `frauduleusement abusé de l'état de faiblesse de ${X.nf(V)}, ${V.age} ans, personne particulièrement vulnérable en raison de son âge, pour ${X.la(V)} conduire à des actes qui lui étaient gravement préjudiciables, en l'espèce la remise de la somme de ${m}`,
        prejudice: [{ id: "materiel", label: "Sommes obtenues", demande: f.montant, base: f.montant, piece: "releve" }, { id: "moral", label: "Préjudice moral", demande: 3000, base: 1500 }],
        qA: [{ q: "Vous saviez que cette personne avait des troubles de la mémoire ?", a: ["Tout le monde oublie des choses, à cet âge."] }],
      };
    },
  });

  // =================================================================== DÉNONCIATION CALOMNIEUSE (226-10)
  D({
    id: "denonciation", fam: "personnes", nom: "Dénonciation calomnieuse", gravite: 0.35, victime: "personne", pasCI: true, categorie: "num",
    pasMensonges: ["pas_frappe", "absent"],
    textes: ["CP_226-10"],
    elements: { legal: "Art. 226-10 CP.", materiel: "Une dénonciation spontanée, contre une personne déterminée, d'un fait de nature à entraîner des sanctions, adressée à une autorité qui peut y donner suite ; un fait faux. La relaxe, l'acquittement ou le non-lieu définitifs déclarant que le fait n'a pas été commis ou n'est pas imputable à la personne prouvent à eux seuls la fausseté ; sinon (classement sans suite, par exemple), le tribunal l'apprécie.", moral: "La connaissance, au moment de dénoncer, de la fausseté du fait." },
    mesures: { gav: 0.25, al: 0.7, convocation: 0.05 }, flagrance: 0,
    voies: { classement: 0.12, alternative: 0.15, copj: 0.55, ci: 0, crpc: 0.18 },
    preuves: { plainte: 1, ecrits: 0.8, temoin: 0.4, aveux: 0.35 },
    camera: 0, irr: ["al_quitter"],
    tirer(r) { return { sc: pk(r, ["vol_employe", "violences_voisin"]), issue: pk(r, ["relaxe", "classement"]), agg: [] }; },
    qual: () => CAT.delit(60, 45000, "art. 226-10 CP", "dénonciation calomnieuse", { textes: ["CP_226-10"] }),
    metierAuteur: (f, A) => (f.sc === "vol_employe" ? (A.g === "f" ? "gérante de magasin" : "gérant de magasin") : null),
    metierVictime: (f, V) => (f.sc === "vol_employe" ? (V.g === "f" ? "vendeuse" : "vendeur") : null),
    qVictime: (t, N, o) => ({ q: `Qu'est-ce qui montre qu'on vous a accusé${o.Gp.e} à tort ?`, a: [t.f.issue === "relaxe" ? "Le jugement. Le tribunal a dit que je n'avais rien fait, et c'est définitif." : `L'affaire a été classée. Mais on m'a expliqué que classée, ce n'est pas innocenté${o.Gp.e}.`].concat(t.preuves.includes("ecrits") ? ["Et il y a ce message, écrit la veille de la plainte."] : []) }),
    recit(X, f) {
      const { A, V } = X;
      const vol = f.sc === "vol_employe";
      const fait = vol ? "d'un vol de 1 200 euros dans la caisse du magasin" : "de violences dans le hall de l'immeuble";
      const issue = f.issue === "relaxe" ? `${X.nf(V)} a été relaxé${X.e(V)} par un jugement devenu définitif, le tribunal retenant que les faits n'avaient pas été commis` : `la plainte contre ${X.nf(V)} a été classée sans suite, l'enquête n'ayant rien établi`;
      return {
        titre: vol ? "l'accusation de vol" : "l'accusation de violences", lieu: X.lieu,
        resume: `${X.n(A)} aurait accusé ${X.nf(V)} ${fait}, en le sachant faux ; ${issue}.`,
        constat: [`Plainte de ${X.nf(V)}, qui joint la plainte initiale déposée par ${X.n(A)} et ${f.issue === "relaxe" ? "le jugement de relaxe, avec son certificat de non-appel" : "l'avis de classement sans suite"}.`],
        plainte: [vol ? `J'ai été convoqué${X.e(V)} au commissariat pour un vol que je n'ai pas commis. On m'a mis${X.e(V)} à pied, sans salaire, pendant l'enquête.` : `J'ai été placé${X.e(V)} en garde à vue pour des coups que je n'ai jamais donnés.`, vol ? "La vidéo du magasin montrait que c'était une erreur de caisse : on l'a su après." : `${X.n(A)} voulait que je déménage. ${X.Il(A)} l'a dit devant tout le monde.`, f.issue === "relaxe" ? `Le tribunal m'a relaxé${X.e(V)}. Maintenant, je veux que ce soit reconnu.` : "L'affaire a été classée. Mais on me regarde encore de travers."],
        ecrits: [vol ? `Message de ${X.n(A)} à un collègue, la veille de la plainte : « La caisse, c'est une erreur, mais ça me permettra de m'en débarrasser. »` : `Message de ${X.n(A)} à un voisin, la veille de la plainte : « Avec ma plainte, ${X.il(V)} va enfin partir. »`],
        ecritsPiece: { court: "Le message de la veille", titre: "Procès-verbal de constatations — message", intro: `Constatons, sur le téléphone présenté par ${X.nf(V)} et remis par son destinataire, le message suivant :`, dater: true },
        version: { nie: `J'étais sûr${X.e(A)} de moi quand j'ai porté plainte. Je n'ai menti sur rien.`, minimise: `Je me suis peut-être trompé${X.e(A)}. Mais j'étais de bonne foi.`, reconnait: "J'ai exagéré. Je voulais m'en débarrasser. Je n'aurais pas dû." },
        audition: [rep(vol ? "Votre message de la veille parle d'une « erreur ». Saviez-vous que l'accusation était fausse quand vous avez porté plainte ?" : `La veille de votre plainte, vous écriviez : « Avec ma plainte, ${X.il(V)} va enfin partir. » Saviez-vous que l'accusation était fausse ?`, "Je pensais que c'était vrai.")],
        prevention: `dénoncé à un officier de police judiciaire ${X.nf(V)} comme ${vol ? "l'auteur d'un vol" : "l'auteur de violences"}, fait de nature à entraîner des sanctions judiciaires et qu'${X.il(A)} savait totalement ou partiellement inexact`,
        prejudice: [{ id: "moral", label: "Préjudice moral (l'accusation, la procédure subie)", demande: 5000, base: 2500 }].concat(vol && X.travaille(V) ? [{ id: "materiel", label: "Perte de salaire (la mise à pied)", demande: 2500, base: 1800, piece: "attestation_salaire" }] : []),
      };
    },
  });

  // =================================================================== VIE PRIVÉE : CAPTATION ET DIFFUSION (226-1, 226-2-1)
  D({
    id: "vie_privee", fam: "numerique", nom: "Atteinte à la vie privée", gravite: 0.4, victime: "personne", conjugal: true, pasCI: true, categorie: "num",
    pasMensonges: ["absent", "jamais_touche"],
    textes: ["CP_226-1", "CP_226-2-1"],
    elements: { legal: "Art. 226-1 et 226-2-1 CP.", materiel: "Capter, enregistrer ou transmettre sans consentement des paroles privées, l'image d'une personne dans un lieu privé ou sa localisation ; ou diffuser sans accord des images à caractère sexuel, même obtenues avec le consentement de la personne.", moral: "La volonté de porter atteinte à l'intimité ; pour la diffusion, l'accord donné à la prise des images ne vaut pas accord pour leur diffusion." },
    mesures: { gav: 0.45, al: 0.5, convocation: 0.05 }, flagrance: 0,
    voies: { classement: 0.08, alternative: 0.1, copj: 0.6, ci: 0, crpc: 0.22 },
    preuves: { plainte: 1, ecrits: 0.7, telephonie: 0.7, expertise: 0.5, aveux: 0.4 },
    camera: 0, irr: ["requisition", "al_quitter", "perq_assentiment"],
    tirer(r) { const sc = pk(r, ["diffusion", "diffusion", "traceur"]); return { sc, agg: sc === "traceur" ? ["conjoint"] : [], semaines: int(r, 2, 20) }; },
    qual: (f) => (f.sc === "diffusion"
      ? CAT.delit(24, 60000, "art. 226-2-1 CP", "diffusion sans accord d'images présentant un caractère sexuel", { textes: ["CP_226-2-1"] })
      : CAT.delit(24, 60000, "art. 226-1 CP", "atteinte à l'intimité de la vie privée par captation de la localisation d'une personne sans son consentement, commise par son concubin", { textes: ["CP_226-1"] })),
    recit(X, f) {
      const { A, V } = X;
      if (f.sc === "traceur") return {
        titre: "le traceur sous la voiture", lieu: X.lieu,
        resume: `${X.n(A)} aurait suivi pendant ${f.semaines} semaines les déplacements de ${X.nf(V)}, qui partage sa vie, grâce à un traceur caché sous sa voiture et à une application installée sur son téléphone.`,
        constat: [`Plainte de ${X.nf(V)}, qui remet le boîtier découvert par un garagiste sous le pare-chocs de son véhicule ; l'examen de son téléphone révèle une application de localisation installée à son insu, reliée au compte de ${X.n(A)}.`],
        plainte: [`${X.Il(A)} savait toujours où j'étais. ${X.Il(A)} me disait : « Tu étais chez ta sœur, hier. » Je ne lui avais rien dit.`, "Le garagiste a trouvé le boîtier en changeant le pot d'échappement. J'ai eu peur."],
        ecrits: [`Message de ${X.n(A)} : « Pourquoi tu es resté${X.e(V)} deux heures rue des Martyrs ? »`, `Message de ${X.n(A)} : « Je sais où tu es. Rentre. »`],
        version: { nie: "Le traceur, c'est contre le vol de la voiture. Je ne l'ai jamais consulté.", minimise: `On est en couple, je m'inquiétais pour ${X.lui(V)}. Ce n'est pas de l'espionnage.`, reconnait: `Je voulais savoir où ${X.il(V)} allait. J'étais ${X.g(A).w("jaloux", "jalouse")}. Je l'ai fait.` },
        audition: [rep("L'application de localisation a été installée depuis votre compte. Pourquoi ?", `Pour savoir si ${X.il(V)} allait bien.`)],
        prevention: `porté atteinte à l'intimité de la vie privée de ${X.nf(V)} en captant et en enregistrant sa localisation en temps réel sans son consentement, au moyen d'un traceur et d'une application installée à son insu`,
        prejudice: [{ id: "moral", label: "Préjudice moral (la surveillance subie)", demande: 3000, base: 1800 }],
      };
      return {
        titre: "les images diffusées", lieu: X.lieu,
        resume: `Après leur séparation, ${X.n(A)} aurait envoyé à des proches de ${X.nf(V)}, et publié sur un réseau social, des images intimes prises pendant leur relation.`,
        constat: [`Plainte de ${X.nf(V)}, qui remet les captures des publications et des messages reçus par sa famille ; réquisition à la plateforme : le compte est rattaché au numéro de ${X.n(A)}.`],
        plainte: [`Ces photos, je les avais envoyées quand on était ensemble, à ${X.lui(A)} ${X.g(A).w("seul", "seule")}. Jamais je n'aurais accepté qu'${X.il(A)} les montre.`, "Ma sœur et des amis les ont reçues. Je n'ose plus sortir de chez moi."],
        ecrits: [`Message de ${X.n(A)} accompagnant l'envoi : « Voilà qui ${X.il(V)} est vraiment. »`, "Publication sur le réseau social, retirée au bout de deux jours, accompagnée du prénom et de la ville de la plaignante."],
        version: { nie: "Mon téléphone a été piraté. Ce n'est pas moi qui ai envoyé ça.", minimise: `${X.Il(V)} me les avait envoyées ${X.lui(V)}-même. Je les ai montrées à un ami, c'est tout.`, reconnait: "Je l'ai fait par vengeance, après la rupture. C'était ignoble. Je regrette." },
        audition: [rep(`Les images ont été envoyées depuis votre numéro. ${X.nf(V)} vous avait-${X.il(V)} donné son accord pour les montrer ?`, `${X.Il(V)} me les avait envoyées.`)],
        prevention: `porté à la connaissance de tiers et du public, sans l'accord de ${X.nf(V)}, des images présentant un caractère sexuel ${X.la(V)} concernant, obtenues avec son consentement`,
        prejudice: [{ id: "moral", label: "Préjudice moral (l'humiliation, l'intimité exposée)", demande: 8000, base: 5000 }],
      };
    },
  });

  // =================================================================== EXHIBITION SEXUELLE (222-32)
  D({
    id: "exhibition", fam: "personnes", nom: "Exhibition sexuelle", gravite: 0.3, victime: "personne", sexes: { V: "f" }, categorie: "scene",
    pasMensonges: ["pas_frappe"], // pas de coups dans ces faits : le mensonge « je ne l'ai pas frappé » n'a pas de sens
    textes: ["CP_222-32"],
    elements: { legal: "Art. 222-32 CP.", materiel: "Une exhibition sexuelle imposée à la vue d'autrui, dans un lieu accessible aux regards du public.", moral: "La conscience d'imposer cette vue à autrui." },
    mesures: { gav: 0.7, al: 0.25, convocation: 0.05 }, flagrance: 0.6,
    voies: { classement: 0.08, alternative: 0.25, copj: 0.4, ci: 0.12, crpc: 0.15 },
    preuves: { plainte: 1, constat: 0.5, temoin: 0.5, video: 0.4, aveux: 0.4 },
    camera: 0.3, irr: ["heures"],
    tirer(r) { return { sc: pk(r, ["metro", "square"]), agg: [] }; },
    qual: () => CAT.delit(12, 15000, "art. 222-32 CP", "exhibition sexuelle imposée à la vue d'autrui dans un lieu accessible aux regards du public", { textes: ["CP_222-32"] }),
    recit(X, f) {
      const { A, V } = X;
      const metro = f.sc === "metro";
      return {
        titre: metro ? "le passager du métro" : "le banc du square", lieu: metro ? `dans une rame de métro, à la station proche de ${X.rue}` : `dans le square, ${X.rue}`,
        resume: `${X.n(A)} se serait exhibé${X.e(A)} devant ${X.nf(V)} ${metro ? "dans une rame de métro presque vide" : "dans un square, en milieu de journée"}.`,
        constat: [metro ? `Requis par ${X.nf(V)} sur le quai ; ${X.il(V)} désigne ${X.n(A)}, qui descend de la même rame.` : `Requis pour un individu au comportement suspect dans le square ; ${X.nf(V)} désigne ${X.n(A)}, assis${X.e(A)} sur un banc.`],
        plainte: [`${X.Il(A)} s'est assis${X.e(A)} en face de moi. ${X.Il(A)} a ouvert son pantalon et s'est exhibé${X.e(A)} en me regardant. J'ai changé de place, ${X.il(A)} a continué.`, metro ? "J'ai eu peur. Depuis, je ne prends plus cette ligne le soir." : "J'ai eu peur. Depuis, je ne passe plus par ce square."],
        temoin: [`J'étais dans ${metro ? "la rame" : "le square"}. J'ai vu ${X.nf(V)} changer de place, très mal à l'aise. Je n'ai pas vu le reste.`],
        version: { nie: `Je n'ai rien fait. ${X.Il(V)} a mal vu, je remettais ma ceinture.`, minimise: "J'avais trop bu, je ne me souviens pas. Je ne visais personne.", reconnait: "Je l'ai fait. J'ai un problème. Je veux me soigner." },
        audition: [rep(`${X.nf(V)} vous désigne formellement. Que s'est-il passé ?`, "Je ne me souviens pas.")],
        prevention: `imposé à la vue de ${X.nf(V)} une exhibition sexuelle dans un lieu accessible aux regards du public`,
        prejudice: [{ id: "moral", label: "Préjudice moral (la peur)", demande: 1500, base: 800 }],
      };
    },
  });

  // =================================================================== OUTRAGE SEXISTE ET SEXUEL AGGRAVÉ (222-33-1-1)
  D({
    id: "outrage_sexiste", fam: "personnes", nom: "Outrage sexiste et sexuel aggravé", gravite: 0.2, victime: "personne", sexes: { V: "f" }, pasCI: true, categorie: "scene",
    pasMensonges: ["pas_frappe"], // pas de coups dans ces faits : le mensonge « je ne l'ai pas frappé » n'a pas de sens
    textes: ["CP_222-33-1-1"],
    elements: { legal: "Art. 222-33-1-1 CP (délit depuis le 1er avril 2023) ; sans circonstance aggravante, contravention de l'art. R. 625-8-3.", materiel: "Imposer un propos ou un comportement à connotation sexuelle ou sexiste qui porte atteinte à la dignité de la personne ou crée à son encontre une situation intimidante, hostile ou offensante ; ici dans un transport collectif, circonstance aggravante qui fait le délit.", moral: "La conscience d'imposer le propos ; l'action publique peut être éteinte par l'amende forfaitaire délictuelle de 300 euros." },
    mesures: { gav: 0, al: 0.7, convocation: 0.3 }, flagrance: 0.5,
    voies: { classement: 0.1, alternative: 0.3, copj: 0.5, ci: 0, crpc: 0.1 },
    preuves: { plainte: 1, temoin: 0.6, video: 0.5, constat: 0.4, aveux: 0.4 },
    camera: 0, irr: ["al_quitter"],
    tirer(r) { return { sc: pk(r, ["bus", "rer"]), agg: [] }; },
    qual: () => CAT.delit(0, 3750, "art. 222-33-1-1 CP", "outrage sexiste et sexuel aggravé, commis dans un véhicule affecté au transport collectif de voyageurs", { textes: ["CP_222-33-1-1"] }),
    recit(X, f) {
      const { A, V } = X;
      const lieu = f.sc === "bus" ? "dans un bus de la ligne 38" : "dans une rame du RER B";
      return {
        titre: "les remarques dans le transport", lieu: `${lieu}, à hauteur de ${X.rue}`,
        resume: `${X.n(A)} aurait imposé à ${X.nf(V)}, ${lieu}, des remarques à connotation sexuelle pendant plusieurs arrêts, et insisté pour ${X.la(V)} raccompagner.`,
        constat: [`Plainte de ${X.nf(V)}, après un signalement aux agents de sûreté du réseau ; ${X.n(A)} est identifié${X.e(A)} par les agents à la descente.`],
        plainte: [`${X.Il(A)} s'est assis${X.e(A)} juste à côté de moi alors qu'il y avait de la place. ${X.Il(A)} a commenté mon corps, à voix haute, pendant quatre arrêts : « T'es bien faite, tu descends où ? Je te raccompagne. »`, `Je lui ai dit d'arrêter. ${X.Il(A)} a ri. Tout le monde regardait ailleurs.`],
        temoin: [`J'étais en face. ${X.Il(A)} insistait, ${X.il(V)} lui a dit d'arrêter deux fois. ${X.Il(V)} tremblait en descendant.`],
        version: { nie: "Je lui ai juste parlé. Je n'ai rien dit de sexuel.", minimise: "C'était un compliment. On ne peut plus rien dire.", reconnait: `J'ai insisté, j'ai été lourd${X.e(A)}. Je comprends que ça l'ait gêné${X.e(V)}.` },
        audition: [rep(`Le témoin vous a entendu${X.e(A)} commenter le corps de la plaignante pendant quatre arrêts. Que répondez-vous ?`, "Je lui faisais un compliment.")],
        prevention: `imposé à ${X.nf(V)}, dans un véhicule affecté au transport collectif de voyageurs, des propos à connotation sexuelle portant atteinte à sa dignité en raison de leur caractère dégradant et créant à son encontre une situation intimidante et offensante`,
        prejudice: [{ id: "moral", label: "Préjudice moral", demande: 800, base: 400 }],
      };
    },
  });

  // =================================================================== ABANDON DE FAMILLE (227-3)
  const lesEnf = (V, det) => (V.enfants > 1 ? { nos: "nos enfants", leurs: "leurs enfants", ses: "ses enfants", les: "les enfants" } : { nos: "notre enfant", leurs: "leur enfant", ses: "son enfant", les: "notre enfant" })[det];
  D({
    id: "abandon_famille", fam: "personnes", nom: "Abandon de famille", gravite: 0.3, victime: "personne", conjugal: true, parents: true, pasCI: true, categorie: "fin",
    pasMensonges: ["pas_frappe", "absent"],
    textes: ["CP_227-3"],
    elements: { legal: "Art. 227-3 CP.", materiel: "Une décision de justice (ou une convention judiciairement homologuée) fixant une pension ; plus de deux mois sans paiement intégral.", moral: "Le non-paiement volontaire ; l'impossibilité réelle de payer (perte d'emploi, maladie) peut l'écarter, pas la simple gêne ni un différend sur le droit de visite." },
    mesures: { gav: 0.1, al: 0.8, convocation: 0.1 }, flagrance: 0,
    voies: { classement: 0.12, alternative: 0.25, copj: 0.5, ci: 0, crpc: 0.13 },
    preuves: { plainte: 1, releve: 1, ecrits: 0.6, aveux: 0.5 },
    camera: 0, irr: ["al_quitter"],
    tirer(r) { return { sc: "pension", mois: int(r, 3, 18), pension: int(r, 15, 50) * 10, agg: [] }; },
    qual: () => CAT.delit(24, 15000, "art. 227-3 CP", "abandon de famille, par défaut de paiement de la pension alimentaire pendant plus de deux mois", { textes: ["CP_227-3"] }),
    qVictime: (t) => ({ q: "Vous avez une trace des versements ? Depuis quand plus rien ?", a: [`Tout est sur mes relevés : plus aucun virement depuis ${t.f.mois} mois.`].concat(t.preuves.includes("ecrits") ? ["Et j'ai ses messages, où on comprend bien pourquoi."] : []) }),
    recit(X, f) {
      const { A, V } = X;
      const total = f.mois * f.pension;
      return {
        titre: "la pension impayée", lieu: X.lieu, montant: total,
        resume: `${X.n(A)} ne verserait plus depuis ${f.mois} mois la pension de ${eur(f.pension)} par mois fixée par le juge aux affaires familiales pour ${lesEnf(V, "leurs")} (${eur(total)} d'arriéré).`,
        constat: [`Plainte de ${X.nf(V)}, qui joint le jugement du juge aux affaires familiales, sa signification et ses relevés de compte sur la période.`],
        plainte: [`Le juge a fixé ${eur(f.pension)} par mois pour ${lesEnf(V, "nos")}. Depuis ${f.mois} mois, plus rien.`, `${X.Il(A)} a changé de voiture cet été. Mais pour la pension, ${X.il(A)} dit qu'${X.il(A)} n'a pas les moyens.`],
        ecrits: [`Message de ${X.n(A)} : « Je paierai quand tu me laisseras voir ${lesEnf(V, "les")} comme je veux. »`],
        ecritsPiece: { court: "Les messages", titre: "Procès-verbal de constatations — messages", intro: `Constatons, sur le téléphone présenté par ${X.nf(V)}, le message suivant :`, dater: true },
        version: { nie: `J'ai payé en espèces, de la main à la main. ${X.Il(V)} ment.`, minimise: "J'ai perdu des heures de travail, je n'y arrive plus. J'ai payé quand je pouvais.", reconnait: `Je n'ai pas payé. J'étais en colère contre ${X.lui(V)}. Je vais régulariser.` },
        audition: [rep(`Depuis ${f.mois} mois, aucun versement. Pourquoi ?`, "Je n'avais pas les moyens.")],
        prevention: `omis, alors qu'${X.il(A)} était tenu${X.e(A)} par une décision judiciaire de verser une pension alimentaire au profit de ${lesEnf(V, "ses")}, de s'en acquitter intégralement pendant plus de deux mois`,
        prejudice: [{ id: "materiel", label: "Pensions impayées", demande: total, base: total, piece: "releve" }, { id: "moral", label: "Préjudice moral", demande: 1000, base: 500 }],
      };
    },
  });

  // =================================================================== NON-REPRÉSENTATION D'ENFANT (227-5)
  D({
    id: "non_representation", fam: "personnes", nom: "Non-représentation d'enfant", gravite: 0.3, victime: "personne", conjugal: true, parents: true, pasCI: true, categorie: "conj",
    pasMensonges: ["pas_frappe", "absent"],
    textes: ["CP_227-5"],
    elements: { legal: "Art. 227-5 CP.", materiel: "Le refus de remettre l'enfant à la personne qui a le droit de le réclamer, en vertu d'une décision de justice.", moral: "Un refus indu ; ni la réticence de l'enfant ni le désaccord avec la décision ne le justifient, sauf danger établi pour l'enfant." },
    mesures: { gav: 0.15, al: 0.8, convocation: 0.05 }, flagrance: 0,
    voies: { classement: 0.15, alternative: 0.35, copj: 0.4, ci: 0, crpc: 0.1 },
    preuves: { plainte: 1, ecrits: 0.8, temoin: 0.3, aveux: 0.5 },
    camera: 0, irr: ["al_quitter"],
    tirer(r) { return { sc: "visite", fois: int(r, 3, 9), agg: [] }; },
    qual: () => CAT.delit(12, 15000, "art. 227-5 CP", "non-représentation d'enfant", { textes: ["CP_227-5"] }),
    qVictime: (t) => ({ q: "Vous avez des traces des week-ends manqués ?", a: ["J'ai fait une main courante à chaque fois. Le vendredi, à l'heure du jugement, en bas de l'immeuble."].concat(t.preuves.includes("ecrits") ? ["Et j'ai les messages. Tout est écrit."] : []) }),
    recit(X, f) {
      const { A, V } = X;
      return {
        titre: "les week-ends refusés", lieu: X.lieu,
        resume: `${X.n(A)} aurait refusé ${f.fois} fois de remettre l'enfant commun à ${X.nf(V)}, malgré le droit de visite et d'hébergement fixé par le juge aux affaires familiales.`,
        constat: [`Plainte de ${X.nf(V)}, qui joint le jugement fixant son droit de visite et d'hébergement et ${f.fois} mains courantes déposées les vendredis concernés.`],
        plainte: [`Le juge m'a donné un week-end sur deux. Les ${f.fois} derniers, je suis venu${X.e(V)} à l'heure en bas de chez ${X.lui(A)} : personne n'est descendu.`, `${X.Il(A)} m'écrit que l'enfant ne veut pas venir. C'est faux : on s'appelle tous les soirs.`],
        ecrits: [`Message de ${X.n(A)} : « Tu ne verras pas l'enfant ce week-end, tu sais pourquoi. »`, `Message de ${X.n(A)} : « Fais appel si tu n'es pas content${X.e(V)}. »`],
        version: { nie: "Je n'ai jamais empêché personne de voir l'enfant. C'est l'enfant qui refuse.", minimise: "L'enfant pleure à chaque départ. Je ne vais pas l'arracher de force.", reconnait: `Je ne voulais pas que l'enfant parte chez ${X.lui(V)}. J'ai eu tort, je vais respecter le jugement.` },
        audition: [rep(`Le jugement fixe un week-end sur deux. Pourquoi l'enfant n'a-t-il pas été remis à ${X.nf(V)} ces ${f.fois} fois ?`, "L'enfant ne voulait pas y aller.")],
        prevention: `refusé indûment, à ${f.fois} reprises, de représenter l'enfant mineur à ${X.nf(V)}, qui avait le droit de réclamer cet enfant en vertu d'une décision de justice`,
        prejudice: [{ id: "moral", label: "Préjudice moral (les week-ends perdus)", demande: 2000, base: 1000 }],
      };
    },
  });

  // =================================================================== VIOLATION D'UNE ORDONNANCE DE PROTECTION (227-4-2)
  D({
    id: "ordonnance_protection", fam: "personnes", nom: "Violation d'une ordonnance de protection", gravite: 0.5, victime: "personne", conjugal: true, categorie: (f) => (f.sc === "messages" ? "msg" : "conj"),
    pasMensonges: (f) => (f.sc === "messages" ? ["pas_frappe", "absent"] : ["pas_frappe"]),
    textes: ["CP_227-4-2"],
    elements: { legal: "Art. 227-4-2 CP (peines portées à trois ans et 45 000 euros par la loi du 13 juin 2024).", materiel: "Une ordonnance de protection (ou une ordonnance provisoire de protection immédiate) ; le non-respect d'une de ses obligations ou interdictions : entrer en contact avec la personne protégée, paraître à son domicile.", moral: "La connaissance de l'interdiction, qui suppose la notification de l'ordonnance ; un contact recherché par la personne protégée se plaide, sans effacer le délit." },
    mesures: { gav: 0.85, al: 0.15, convocation: 0 }, flagrance: 0.5,
    flagranceDe: (f) => (f.sc === "domicile" ? 1 : 0),
    voies: { classement: 0.03, alternative: 0.07, copj: 0.4, ci: 0.35, crpc: 0.15 },
    preuves: { plainte: 1, ecrits: 0.7, telephonie: 0.6, constat: 0.5, temoin: 0.3, aveux: 0.4 },
    camera: 0.2, irr: ["heures", "al_quitter", "requisition"],
    tirer(r) { return { sc: pk(r, ["messages", "domicile"]), nb: int(r, 4, 60), agg: [] }; },
    qual: () => CAT.delit(36, 45000, "art. 227-4-2 CP", "violation des obligations ou interdictions imposées par une ordonnance de protection", { textes: ["CP_227-4-2"] }),
    recit(X, f) {
      const { A, V } = X;
      const dom = f.sc === "domicile";
      return {
        titre: dom ? "l'interphone, à vingt-deux heures" : "les messages interdits", lieu: dom ? `devant le domicile de ${X.nf(V)}, ${X.rue}` : X.lieu,
        resume: `Malgré l'ordonnance de protection qui lui interdit tout contact avec ${X.nf(V)}, ${X.n(A)} ${dom ? `se serait présenté${X.e(A)} devant son domicile` : `lui aurait adressé ${f.nb} messages`}.`,
        constat: [dom ? `Requis par ${X.nf(V)}, qui a déclenché son téléphone grave danger ; ${X.n(A)} est interpellé${X.e(A)} au pied de l'immeuble. Copie de l'ordonnance de protection et de sa notification.` : `Plainte de ${X.nf(V)}, qui présente ${f.nb} messages reçus ; copie de l'ordonnance de protection et de sa notification à ${X.n(A)}.`],
        plainte: [dom ? `${X.Il(A)} a sonné à l'interphone à vingt-deux heures. ${X.Il(A)} criait mon nom. Le juge lui a interdit de s'approcher.` : `${X.Il(A)} n'a pas le droit de me contacter. ${X.Il(A)} m'écrit tous les jours, avec des numéros différents.`, "J'ai peur que ça recommence."],
        ...(dom ? {} : { ecrits: ["« Tu crois qu'un papier va m'empêcher de te parler ? »", "« Retire ta plainte et on oublie tout. »"] }),
        version: { nie: dom ? "Je passais dans la rue pour aller chez un ami." : "Ce n'est pas moi, ce ne sont pas mes numéros.", minimise: `Je voulais juste parler de nos affaires. Je ne l'ai pas menacé${X.e(V)}.`, reconnait: "Je sais que je n'avais pas le droit. Je n'arrivais pas à accepter." },
        audition: [rep("L'ordonnance de protection vous a été notifiée. Saviez-vous que tout contact était interdit ?", "Je n'avais pas bien compris.")],
        prevention: `méconnu, alors qu'${X.il(A)} faisait l'objet d'une ordonnance de protection lui interdisant d'entrer en contact avec ${X.nf(V)}, cette interdiction, ${dom ? "en se présentant à son domicile" : `en lui adressant ${f.nb} messages`}`,
        prejudice: [{ id: "moral", label: "Préjudice moral (la peur)", demande: 2500, base: 1500 }],
      };
    },
  });

  // =================================================================== APOLOGIE DU TERRORISME (421-2-5)
  D({
    id: "apologie", fam: "autorite", nom: "Apologie du terrorisme", gravite: 0.55, victime: null,
    pasMensonges: (f) => (f.sc === "en_ligne" ? ["absent"] : []),
    textes: ["CP_421-2-5"],
    elements: { legal: "Art. 421-2-5 CP.", materiel: "Présenter publiquement sous un jour favorable des actes de terrorisme ou leurs auteurs, dans un lieu public ou en ligne (peine aggravée en ligne).", moral: "La conscience de valoriser l'acte ; l'ivresse, la provocation ou la colère se plaident pour la peine, mais n'effacent pas le délit si l'éloge est clair." },
    mesures: { gav: 0.9, al: 0.1, convocation: 0 }, flagrance: 0.5,
    flagranceDe: (f) => (f.sc === "public" ? 1 : 0),
    voies: { classement: 0.03, alternative: 0.05, copj: 0.4, ci: 0.4, crpc: 0.12 },
    preuves: { constat: 0.9, ecrits: 0.9, temoin: 0.4, aveux: 0.45 },
    camera: 0, irr: ["heures", "requisition"],
    tirer(r) { return { sc: pk(r, ["en_ligne", "en_ligne", "public"]), abonnes: int(r, 1, 60) * 100, agg: [] }; },
    qual: (f) => (f.sc === "en_ligne"
      ? CAT.delit(84, 100000, "art. 421-2-5 CP", "apologie publique d'actes de terrorisme, commise en utilisant un service de communication au public en ligne", { textes: ["CP_421-2-5"] })
      : CAT.delit(60, 75000, "art. 421-2-5 CP", "apologie publique d'actes de terrorisme", { textes: ["CP_421-2-5"] })),
    recit(X, f) {
      const { A } = X;
      if (f.sc === "public") return {
        titre: "les mots à l'arrêt de bus", lieu: `${X.rue}, ${X.lieu}`,
        resume: `Le lendemain d'un attentat, ${X.n(A)} aurait, devant des passants puis devant des policiers, présenté ses auteurs comme des modèles.`,
        constat: [`Requis pour un individu qui tient des propos véhéments à un arrêt de bus ; ${X.n(A)}, en état d'ébriété manifeste, déclare à voix haute, devant plusieurs passants, que les auteurs de l'attentat de la veille « ont eu raison » et qu'ils sont « des héros ».`, `${X.Il(A)} réitère ces propos devant nous.`],
        temoin: [`J'attendais le bus. ${X.Il(A)} criait que les terroristes étaient des héros. Des gens sont partis.`],
        version: { nie: `Je n'ai jamais dit ça. Ils ont mal compris, j'étais énervé${X.e(A)} contre la police, c'est tout.`, minimise: "J'avais bu. Je voulais provoquer, pas soutenir des terroristes.", reconnait: "J'ai dit ça. C'était ignoble. Je ne le pense pas." },
        audition: [rep("Vous avez qualifié les auteurs de l'attentat de « héros ». Que vouliez-vous dire ?", "Je voulais provoquer les policiers.")],
        prevention: "publiquement fait l'apologie d'actes de terrorisme, en présentant favorablement l'attentat commis la veille et ses auteurs",
        prejudice: [],
      };
      return {
        titre: "la publication du soir de l'attentat", lieu: X.lieu,
        resume: `Le soir d'un attentat, ${X.n(A)} aurait publié sur un réseau social, devant ${String(f.abonnes).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} abonnés, un message saluant l'attaque et ses auteurs.`,
        constat: [`Signalement par la plateforme PHAROS d'une publication, le soir de l'attentat, présentant l'attaque comme « méritée » et ses auteurs comme des exemples ; sur réquisition, la plateforme rattache le compte à l'adresse électronique de ${X.n(A)}.`],
        ecrits: ["Publication : l'attaque est présentée comme « méritée », avec la photographie de l'un de ses auteurs.", "Réponse du titulaire du compte à un commentaire indigné : « J'assume. »"],
        ecritsPiece: { court: "Captures de la publication", titre: "Procès-verbal de constatations — publication en ligne", intro: "Constatons, sur le réseau social, depuis le poste de l'enquêteur, la publication et la réponse suivantes, dont nous réalisons des captures d'écran :", dater: false },
        version: { nie: "Ce n'est pas mon compte. On me l'a piraté.", minimise: "C'était de la colère, de la provocation. Je n'ai jamais soutenu le terrorisme.", reconnait: "J'ai écrit ça sous le coup de la colère. Je regrette. Je l'ai supprimé dans la nuit." },
        audition: [rep("Vous avez présenté l'attaque comme « méritée ». Que vouliez-vous dire ?", "C'était de la colère.")],
        prevention: "publiquement fait l'apologie d'actes de terrorisme, en publiant sur un service de communication au public en ligne un message présentant favorablement l'attentat et ses auteurs",
        prejudice: [],
      };
    },
  });

  // =================================================================== ÉVASION (434-27, 434-28)
  D({
    id: "evasion", fam: "autorite", nom: "Évasion", gravite: 0.45, victime: null,
    textes: ["CP_434-27"],
    elements: { legal: "Art. 434-27 CP ; la personne en garde à vue est un « détenu » au sens du texte (art. 434-28) ; l'art. 434-29 assimile à l'évasion la non-réintégration après une permission de sortir.", materiel: "Se soustraire à la garde à laquelle on est soumis ; la violence, l'effraction ou la corruption aggravent.", moral: "La volonté d'échapper à la garde." },
    mesures: { gav: 1, al: 0, convocation: 0 }, flagrance: 1,
    voies: { classement: 0, alternative: 0, copj: 0.25, ci: 0.6, crpc: 0.15 },
    preuves: { constat: 1, temoin: 0.4, aveux: 0.5 },
    camera: 0, irr: ["heures"],
    tirer(r) { return { sc: pk(r, ["commissariat", "hopital"]), heures: int(r, 2, 30), effraction: ch(r, 0.25), agg: [] }; },
    qual: (f) => (f.effraction ? CAT.delit(60, 75000, "art. 434-27 CP", "évasion par effraction", { textes: ["CP_434-27"] }) : CAT.delit(36, 45000, "art. 434-27 CP", "évasion", { textes: ["CP_434-27"] })),
    recit(X, f) {
      const { A, T } = X;
      const com = f.sc === "commissariat";
      return {
        titre: com ? "la fenêtre du commissariat" : "la fuite des urgences", lieu: com ? X.comm : `aux urgences de l'hôpital, ${X.lieu}`,
        resume: `Placé${X.e(A)} en garde à vue pour un vol, ${X.n(A)} se serait enfui${X.e(A)} ${com ? "du commissariat" : `des urgences où ${X.il(A)} avait été conduit${X.e(A)} pour un examen`}, avant d'être interpellé${X.e(A)} ${f.heures} heures plus tard.`,
        constat: [com ? `Au cours de sa garde à vue, ${X.n(A)} demande à se rendre aux toilettes ; ${f.effraction ? "descellant la grille de la fenêtre" : "profitant d'une fenêtre restée ouverte"}, ${X.il(A)} prend la fuite par la cour.` : `Conduit${X.e(A)} aux urgences pendant sa garde à vue, ${X.n(A)} profite d'un moment d'inattention pour quitter le box d'examen et s'enfuir par la sortie des ambulances${f.effraction ? ", après avoir forcé la porte de secours" : ""}.`, `${X.Il(A)} est interpellé${X.e(A)} ${f.heures} heures plus tard au domicile d'un proche.`],
        temoin: [com ? "J'étais dans la cour pour fumer. J'ai vu quelqu'un sauter de la fenêtre et partir en courant." : `Je suis ${X.g(T).w("infirmier", "infirmière")}. Je me suis retourné${X.e(T)}, le box était vide.`],
        version: { nie: `Je ne me suis pas évadé${X.e(A)}. J'ai paniqué, je suis sorti${X.e(A)} prendre l'air.`, minimise: "J'avais peur d'aller en prison. Je voulais voir ma famille avant.", reconnait: `Je me suis enfui${X.e(A)}. C'était idiot. J'aurais dû attendre.` },
        audition: [rep(`Pourquoi vous êtes-vous enfui${X.e(A)} ?`, "J'ai eu peur.")],
        prevention: `pris la fuite alors qu'${X.il(A)} était placé${X.e(A)} en garde à vue, et de s'être ainsi soustrait${X.e(A)} à la garde à laquelle ${X.il(A)} était soumis${X.e(A)} en qualité de détenu${X.e(A)} au sens de l'article 434-28 du code pénal${f.effraction ? ", avec cette circonstance que l'évasion a été réalisée par effraction" : ""}`,
        prejudice: [],
      };
    },
  });

  // =================================================================== FAUSSE MONNAIE (442-2)
  D({
    id: "fausse_monnaie", fam: "biens", nom: "Fausse monnaie", gravite: 0.55, victimeDe: () => "commerce",
    textes: ["CP_442-2"],
    elements: { legal: "Art. 442-2 CP ; art. 442-7 pour celui qui a reçu les billets de bonne foi.", materiel: "Transporter, mettre en circulation ou détenir en vue de les mettre en circulation des billets contrefaits.", moral: "La connaissance de la fausseté ; à défaut, si les billets ont été reçus de bonne foi puis remis en circulation après la découverte des vices, ce n'est que le délit de l'art. 442-7 (7 500 euros d'amende)." },
    mesures: { gav: 0.9, al: 0.1, convocation: 0 }, flagrance: 0.8,
    voies: { classement: 0.02, alternative: 0.03, copj: 0.4, ci: 0.4, crpc: 0.15 },
    preuves: { constat: 1, saisie: 0.9, temoin: 0.4, video: 0.5, aveux: 0.4 },
    camera: 0.3, irr: ["fouille", "heures"], controle: () => false,
    tirer(r) { return { sc: pk(r, ["tabac", "boulangerie", "superette"]), billets: int(r, 2, 14), coupure: pk(r, [20, 50, 50, 100]), agg: [] }; },
    qual: () => CAT.delit(120, 150000, "art. 442-2 CP", "mise en circulation et détention en vue de la mise en circulation de signes monétaires contrefaits", { textes: ["CP_442-2"] }),
    recit(X, f) {
      const { A, V } = X;
      const com = { tabac: ["le bureau de tabac", "au bureau de tabac"], boulangerie: ["la boulangerie", "à la boulangerie"], superette: ["la supérette", "à la supérette"] }[f.sc];
      const total = f.billets * f.coupure;
      return {
        titre: "les faux billets", lieu: `${com[0]}, ${X.rue}`, montant: f.coupure,
        resume: `${X.n(A)} aurait payé un achat de deux euros avec un faux billet de ${f.coupure} euros ${com[1]} ; ${f.billets - 1} autres faux billets sont découverts sur ${X.lui(A)}.`,
        constat: [`Requis par ${X.nf(V)}, ${V.metier}, dont le détecteur a signalé un billet de ${f.coupure} euros ; ${X.n(A)} est encore dans la boutique.`, `Sur ${X.lui(A)}, découvrons ${f.billets - 1} billets de ${f.coupure} euros portant tous le même numéro de série.`],
        plainte: [`${X.Il(A)} a acheté un paquet de chewing-gums et m'a tendu un billet de ${f.coupure}. Le détecteur a sonné. Le papier était trop lisse.`, "La semaine dernière, on en avait déjà trouvé un dans la caisse."],
        temoin: [`J'étais derrière dans la file. Quand on lui a dit que le billet était faux, ${X.il(A)} a voulu reprendre sa monnaie et partir.`],
        saisie: `${f.billets} billets de ${f.coupure} euros (${eur(total)} en valeur faciale), portant le même numéro de série`,
        version: { nie: "Je ne savais pas qu'il était faux. On me l'a rendu en monnaie hier.", minimise: `Un ami me les a vendus moitié prix. Je me doutais un peu, mais je n'étais pas sûr${X.e(A)}.`, reconnait: "Je savais qu'ils étaient faux. Je les écoulais dans de petits commerces." },
        audition: [rep(`${f.billets} billets de ${f.coupure} euros avec le même numéro de série, et un achat de deux euros pour faire de la monnaie : vous saviez qu'ils étaient faux ?`, "On me les a donnés.")],
        prevention: `mis en circulation et détenu en vue de leur mise en circulation ${f.billets} billets de ${f.coupure} euros contrefaits`,
        prejudice: [{ id: "materiel", label: "Monnaie rendue sur le faux billet", demande: f.coupure - 2, base: f.coupure - 2 }],
      };
    },
  });

  // =================================================================== REFUS DE REMETTRE LE CODE (434-15-2) — seulement en concours, avec un trafic
  CAT.def("refus_code", {
    fam: "stups", nom: "Refus de remettre la convention de déchiffrement", gravite: 0.4, secondaire: true, victime: null, pasCI: false,
    textes: ["CP_434-15-2"],
    elements: { legal: "Art. 434-15-2 CP ; Cass. ass. plén., 7 novembre 2022, n° 21-83.146.", materiel: "Refuser, sur réquisition d'une autorité judiciaire, de remettre ou de mettre en œuvre la convention de déchiffrement d'un moyen de cryptologie susceptible d'avoir servi à une infraction ; le code d'un téléphone en est une lorsque l'appareil chiffre ses données.", moral: "La connaissance du code et la volonté de ne pas le remettre ; la défense discute le chiffrement effectif de l'appareil, la réquisition et la connaissance du code." },
    mesures: { gav: 1, al: 0, convocation: 0 }, flagrance: 1,
    voies: { copj: 0.5, ci: 0.5 },
    preuves: { saisie: 1 },
    camera: 0, irr: [],
    tirer(r) { return { telephone: pk(r, ["un iPhone", "un téléphone Samsung"]), agg: [] }; },
    qual: () => CAT.delit(36, 270000, "art. 434-15-2 CP", "refus de remettre aux autorités judiciaires la convention secrète de déchiffrement d'un moyen de cryptologie", { textes: ["CP_434-15-2"] }),
    recit(X, f) { return { titre: "le code du téléphone", resume: `${X.n(X.A)} refuse de communiquer le code de ${f.telephone}.`, constat: [`${X.n(X.A)} refuse de communiquer le code de déverrouillage de son téléphone.`], version: { nie: "Je ne m'en souviens plus.", minimise: "Ma vie privée est dans ce téléphone.", reconnait: "Je ne voulais pas qu'ils voient mes messages." }, audition: [], prevention: "refusé de remettre la convention secrète de déchiffrement de son téléphone", prejudice: [] }; },
  });
  CAT.CONC_RECIT.refus_code = (X, t, c) => ({
    prevention: `refusé de remettre aux autorités judiciaires, ou de mettre en œuvre, sur leurs réquisitions, la convention secrète de déchiffrement d'un moyen de cryptologie susceptible d'avoir été utilisé pour préparer, faciliter ou commettre un délit, en l'espèce le code de déverrouillage de ${c.f.telephone} trouvé en sa possession`,
    constat: `Sur réquisition de l'officier de police judiciaire, ${X.n(t.A)} est invité${X.e(t.A)} à communiquer le code de déverrouillage de ${c.f.telephone} trouvé en sa possession, appareil dont les données sont chiffrées ; ${X.il(t.A)} refuse, après avoir été avisé${X.e(t.A)} que ce refus constitue un délit.`,
    fait: "G_conc_code", label: "Le refus de donner le code du téléphone",
  });
  CAT.CONCOURS.trafic_code = {
    base: ["stups_trafic"], genres: ["gav", "ci", "copj"], p: 0.25,
    cond: (f) => !CAT.estVariante("stups_trafic", f),
    tirer(r, f) { return { f, conc: [{ inf: "refus_code", f: { telephone: pk(r, ["un iPhone", "un téléphone Samsung", "un téléphone Google Pixel"]), agg: [] } }] }; },
  };

  // ------------------------------------------------------------------ Fréquences dans leur famille (lues par gen-moteur), et la liste du lot (tests)
  CAT.LOT2 = ["mise_en_danger", "non_assistance", "abus_faiblesse", "denonciation", "vie_privee", "exhibition", "outrage_sexiste", "abandon_famille", "non_representation", "ordonnance_protection", "apologie", "evasion", "fausse_monnaie"];
  CAT.LOT2_FREQ = { mise_en_danger: 1, non_assistance: 0.7, abus_faiblesse: 1.5, denonciation: 0.7, vie_privee: 2, exhibition: 0.8, outrage_sexiste: 0.8, abandon_famille: 1.5, non_representation: 1.5, ordonnance_protection: 1.5, apologie: 1, evasion: 0.8, fausse_monnaie: 1.5 };
})();
