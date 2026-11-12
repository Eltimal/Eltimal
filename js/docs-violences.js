// La Permanence — refonte du gameplay, lot 1 : le moteur de documents (CR.DOCSV)
// Chaque pièce est une vue de la simulation (CR.SIMV), composée à son ouverture dans la trame de son type
// (dev/ref/trames-pieces.md), puis mise en feuillets. Plafond : 2 000 mots par pièce, 1 000 visés.
// Une pièce = { id, cote, trame, titre, forme, m, par, blocs, feuillets, mots, acces }.
// Blocs : bandeau, entete, titre, stitre, p (cls : decl, mention, centre, droite, petit), qr, grille, table, liste,
// sig, tampon, manus, image. Aucune phrase n'est marquée : une irrégularité ne se lit que dans les heures et les absences.
(function () {
  "use strict";
  const CR = window.CR, SIM = CR.SIMV;
  const DOCS = (CR.DOCSV = {});
  DOCS.MOTS_MAX = 2000;
  DOCS.LIGNES = 43; // lignes d'un feuillet
  const CPL = 80;   // caractères par ligne en corps courant (mesuré dans Chromium : 82 à 86)

  // ------------------------------------------------------------------ Outils de rédaction
  const MAJ = (s) => String(s).toUpperCase();
  const nomP = (P) => `${P.prenom} ${MAJ(P.nom)}`.trim();
  const nomG = (P) => `${MAJ(P.nom)} ${P.prenom}`.trim();
  const gram = (P) => CR.GEN2.PR.gram(P);
  const civ = (P) => `${gram(P).civ} ${nomP(P)}`;
  const artLong = (a) => { const m = /^art\. (.*) (CP|CPP)$/.exec(a || ""); return m ? `${/ et |,/.test(m[1]) ? "les articles" : "l'article"} ${m[1]} du code ${m[2] === "CP" ? "pénal" : "de procédure pénale"}` : a; };
  const AGG = {
    reunion: "par plusieurs personnes agissant en qualité d'auteur ou de complice", ivresse: "par une personne agissant en état d'ivresse manifeste", arme: "avec usage ou menace d'une arme",
    transport: "dans un véhicule affecté au transport collectif de voyageurs ou dans un lieu destiné à l'accès à un tel moyen de transport", dissimulation: "par une personne dissimulant volontairement tout ou partie de son visage afin de ne pas être identifiée",
    premeditation: "avec préméditation", vulnerable: "sur une personne dont la particulière vulnérabilité était apparente ou connue de son auteur",
  };
  const ittPrev = (n) => (n > 8 ? `une incapacité totale de travail supérieure à huit jours, en l'espèce ${n} jours` : n ? `une incapacité totale de travail n'excédant pas huit jours, en l'espèce ${n} jour${n > 1 ? "s" : ""}` : "aucune incapacité totale de travail");
  const enLettres = (n) => ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf", "vingt", "vingt et un", "vingt-deux", "vingt-trois", "vingt-quatre", "vingt-cinq", "vingt-six", "vingt-sept", "vingt-huit", "vingt-neuf", "trente"][n] || String(n);
  const COQUILLES = [["conformément", "conformement"], ["interpellé", "interpelé"], ["laquelle", "la quelle"], ["ci-dessus", "ci dessus"], ["immédiatement", "immédiatemment"], ["intéressé", "interessé"], [" à hauteur", " a hauteur"], ["procédons", "procedons"], ["accompagné", "accompagner"], ["Mentionnons", "Mentionons"]];

  // ------------------------------------------------------------------ Contexte de composition
  function contexte(S, id) {
    const r = SIM.fil(S.sig + ":doc:" + id);
    const doc = { horsSim: [], heures: [] };
    const h = (m, style) => { m = Math.round(m); doc.heures.push(m); if (!S.heures.has(m)) doc.horsSim.push(m); return SIM.heure(m, style); };
    const C = {
      S, t: S.t, P: S.P, a: S.a, r, doc, h,
      // « le 7 novembre 2026 à 23 heures 41 minutes »
      // une heure dite de mémoire (« vers 18 heures 50 ») : arrondie, elle n'engage pas la simulation
      vers: (m) => { const x = Math.round(m / 5) * 5, [hh, mn] = SIM.hm(x); return `vers ${hh} heure${hh > 1 ? "s" : ""}${mn ? " " + mn : ""}`; },
      dh: (m) => `le ${SIM.date(S, m)} à ${h(m)}`,
      DH: (m) => `Le ${SIM.date(S, m, "dow")}, à ${h(m)}`,
      d: (m, st) => SIM.date(S, m, st),
      p: (t, o) => Object.assign({ k: "p", t }, o || {}),
      decl: (t, o) => Object.assign({ k: "p", cls: "decl", t }, o || {}),
      men: (t, o) => Object.assign({ k: "p", cls: "mention", t }, o || {}),
      qr: (q, rep, o) => Object.assign({ k: "qr", q, r: rep }, o || {}),
      st: (t) => ({ k: "stitre", t }),
      // coquilles de l'auteur : une au plus par paragraphe, jamais dans un nom ni une heure
      coq(txt, taux) { if (!(r.next() < taux * 1.5)) return txt; for (const [a, b] of r.sh(COQUILLES)) if (txt.includes(a)) return txt.replace(a, b); return txt; },
    };
    return C;
  }
  const service = (S) => `${S.lieu.paris ? "PRÉFECTURE DE POLICE" : "DIRECTION DÉPARTEMENTALE DE LA POLICE NATIONALE"} — ${MAJ(S.lieu.comm)}`;
  const agent = (X) => `${nomP(X)}, ${X.grade} de police, ${X.qual}`;
  // Le procès-verbal : bandeau, ouverture, corps, clôture, signatures
  function pv(C, o) {
    const { S } = C, X = S.P[o.par];
    const blocs = [{ k: "bandeau", service: service(S), cadre: "FLAGRANT DÉLIT", titre: MAJ(o.titre), qualite: o.qualite || "", grille: { "Code unité": S.codeUnite, "N° PV": S.proc, "Année": String(CR.ymd(SIM.jour(S, o.m)).y), "N° pièce": "" } }];
    blocs.push(C.p(`${C.DH(o.m)},`));
    blocs.push(C.p(`Nous, ${agent(X)}, en fonction au ${S.lieu.commCourt},${X.mat ? ` matricule ${X.mat},` : ""}`));
    blocs.push(C.p(`${o.vu || (X.qual === "officier de police judiciaire" ? "Agissant en flagrant délit, vu les articles 53 et suivants du code de procédure pénale," : "Agissant en flagrant délit, vu les articles 20, 21-1, 53 et 73 du code de procédure pénale,")}`));
    if (o.suite) blocs.push(C.p(o.suite));
    for (const b of o.corps) blocs.push(b.k === "p" && !b.cls && X.style ? Object.assign({}, b, { t: C.coq(b.t, X.style.coquilles) }) : b);
    blocs.push(C.p(o.cloture || "Dont procès-verbal, que nous signons.", { cls: "cloture" }));
    blocs.push({ k: "sig", cases: o.sigs || [{ role: X.qual === "officier de police judiciaire" ? "L'officier de police judiciaire" : "L'agent de police judiciaire", nom: nomP(X), etat: "signe" }] });
    return { titre: o.titre, forme: "pv", m: o.m, par: o.par, blocs, piedSig: o.piedSig || null };
  }
  const identite = (P, S, plus) => ({ k: "grille", rows: [["Nom", MAJ(P.nom)], ["Prénom", P.prenom], ["Né" + gram(P).e, P.naissance || ""], ["Âge", P.naissance ? "" : `${P.age} ans`], ["Sexe", P.g === "f" ? "féminin" : "masculin"], ["Demeurant", P.adresse || ""], ["Profession", P.metier || "sans"], ["Téléphone", P.tel || "non communiqué"]].concat(plus || []).filter((x) => x[1] !== "") });
  const sigOPJ = (X) => ({ role: X.qual === "officier de police judiciaire" ? "L'officier de police judiciaire" : "L'agent de police judiciaire", nom: nomP(X), etat: "signe" });

  // ------------------------------------------------------------------ Les trames
  const T = (DOCS.TRAMES = {});
  const prevention = (S) => {
    const { t } = S, V = S.P.V, aggs = (t.f.agg || []).map((a) => AGG[a]).filter(Boolean);
    return `d'avoir ${S.lieu.paris ? `à Paris (${S.lieu.nomSecteur.replace("Paris ", "")})` : `à ${S.lieu.ville}`}, le ${SIM.date(S, S.T0)}, en tout cas sur le territoire national et depuis temps non couvert par la prescription, volontairement commis des violences ayant entraîné ${ittPrev(t.f.itt)}, sur la personne de ${nomP(V)}${aggs.length ? `, avec ${aggs.length > 1 ? "ces circonstances" : "cette circonstance"} que les faits ont été commis ${aggs.join(", et ")}` : ""}`;
  };
  DOCS.prevention = prevention;

  // --- saisine et interpellation
  T.saisine = function (C) {
    const { S, a, P, h } = C, { A, V, G1, G2, OPJ } = P, v = S.verite, f = S.t.f, gA = gram(A), gV = gram(V);
    const corps = [];
    const type = { bar: "une rixe devant un débit de boissons", rue: "une rixe sur la voie publique", transport: "une agression dans l'enceinte des transports", voisinage: "un différend entre voisins avec violences", circulation: "une altercation entre usagers de la route", travail: "une altercation avec violences dans un commerce", file: "une altercation devant un commerce", sport: "une bagarre sur un terrain de sport" }[f.sc];
    corps.push(C.p(`Étant de patrouille portée à bord du véhicule sérigraphié indicatif ${S.x.indicatif}, en tenue d'uniforme, en compagnie de notre collègue ${nomP(G2)}, ${G2.grade},`));
    corps.push(C.p(`Sommes requis à ${h(a.appel.m)} par la salle d'information et de commandement de nous transporter ${S.lieu.ou}, pour ${type}. ${S.t.preuves.includes("temoin") ? "Le requérant, témoin des faits, se trouve sur place." : "Le requérant n'a pas souhaité communiquer son identité."}`, { ref: ["appel17"] }));
    const vueLes = v.lesions[0].replace(/, (de |suturée|sans|déplacée|immobilisée|réduite).*$/, "");
    corps.push(C.p(`Arrivons sur place à ${h(a.arrivee.m)}. Sommes en présence d'une personne se disant ${nomP(V)}, ${V.age} ans, ${v.chute ? "assise au sol" : "debout, en état de choc"}, qui présente ${vueLes}${v.lesions.length > 1 ? " et se plaint d'autres douleurs" : ""}.`, { ref: ["arrivee_police"] }));
    const coupDit = v.coups[0] === "arme" ? `un coup avec ${f.arme}` : { gifle: "une gifle", poing: "un coup de poing au visage", tete: "un coup de tête", poussee: "une violente poussée" }[v.coups[0]];
    if (!a.designation) {
      corps.push(C.p(`${gV.Il} nous déclare avoir reçu ${coupDit} de la part d'un individu qu'${gV.il} décrit seulement comme « ${A.g === "f" ? "une femme" : "un homme"} en ${SIM.accorde("un haut", A.sig.hautCoul)} », parti à pied en direction ${v.fuiteDe}. ${gV.Il} n'est pas en mesure de préciser davantage son signalement.`));
      corps.push(C.p(`Effectuons une ronde dans le secteur. À ${h(a.interp.m)}, à ${v.dist} mètres environ des lieux, remarquons un individu marchant seul, qui porte ${SIM.tenue(A)}. Décidons de procéder au contrôle de son identité. L'intéressé${gA.e} nous présente une pièce au nom de ${nomP(A)}.`, { ref: ["interpellation"] }));
      corps.push(C.p(`Invitons l'intéressé${gA.e} à nous suivre auprès ${gV.w("du plaignant", "de la plaignante")}, ${gV.w("lequel", "laquelle")} déclare ${gA.le} reconnaître. Procédons alors à son interpellation.`));
    } else {
      corps.push(C.p(`${gV.Il} nous déclare spontanément avoir reçu ${coupDit}${v.role2 === "tient" ? `, alors qu'un second individu ${gV.le} maintenait` : ""}, et nous désigne ${v.role2 ? "l'un des deux individus" : "un individu"} qui s'éloigne à pied en direction ${v.fuiteDe}, vêtu${gA.e} d'${SIM.tenue(A)}.`, { ref: ["designation"] }));
      corps.push(C.p(`À ${h(a.interp.m)}, à ${v.dist} mètres environ des lieux, procédons à l'interpellation de l'individu désigné, ${gA.w("lequel", "laquelle")} porte ${SIM.tenue(A)}. ${gA.Il} déclare se nommer ${nomP(A)}.`, { ref: ["interpellation"] }));
    }
    if (v.role2 && !v.innocent) corps.push(C.p("Le second individu signalé n'est pas retrouvé malgré nos recherches aux abords."));
    corps.push(C.p(`${S.t.f.agg.includes("ivresse") ? `L'intéressé${gA.e} présente les signes de l'ivresse : haleine sentant fortement l'alcool, propos répétitifs, équilibre incertain.` : S.x.calme ? `L'intéressé${gA.e} est calme et n'oppose aucune résistance.` : `L'intéressé${gA.e} est agité${gA.e} et conteste vivement son interpellation.`}${S.langue ? ` ${gA.Il} s'exprime difficilement en français et nous indique parler ${S.langue.parle}.` : ""} Spontanément, ${gA.il} nous déclare : « ${S.x.spontane} »`));
    corps.push(C.p(`Procédons à une palpation de sécurité, ${f.arme && S.a.scelle ? `au cours de laquelle découvrons, dans la poche droite de son vêtement, ${f.arme}, que nous appréhendons` : "laquelle s'avère négative"}.${f.arme && !S.a.scelle ? ` L'objet décrit par la victime, ${f.arme}, n'est pas retrouvé malgré nos recherches aux abords.` : ""} ${S.x.calme ? "Compte tenu du risque de fuite" : "Compte tenu de son état d'agitation"}, procédons à son menottage, conformément aux dispositions de l'article 803 du code de procédure pénale.`));
    corps.push(C.p(`L'informons qu'${gA.il} fait l'objet d'une interpellation pour des faits de violences volontaires et qu'${gA.il} va être présenté${gA.e} à un officier de police judiciaire.`));
    const pomp = S.faits.find((x) => x.id === "pompiers");
    if (pomp) corps.push(C.p(`Les sapeurs-pompiers, sur place à ${h(pomp.m)}, prennent en charge la victime et la transportent vers l'${S.lieu.hopital}.`, { ref: ["pompiers"] }));
    else corps.push(C.p("La victime, qui refuse l'intervention des secours, est invitée à se présenter au service pour y déposer plainte."));
    if (S.t.preuves.includes("temoin")) corps.push(C.p(`Relevons l'identité d'un témoin, ${civ(P.T)}, qui déclare avoir assisté à la scène et accepte d'être entendu${gram(P.T).e} au service.`));
    if (S.cam) corps.push(C.p(`Constatons que les lieux sont couverts par ${S.cam.src.replace(/^le système/, "un système").replace(/^la caméra/, "une caméra").replace(/^le plan/, "une caméra du plan")}. En rendons compte à l'officier de police judiciaire.`));
    corps.push(C.p(`Regagnons le service, où nous arrivons à ${h(a.arrPoste.m)}. Présentons l'intéressé${gA.e} au ${OPJ.grade} ${nomP(OPJ)}, officier de police judiciaire de permanence, à qui nous rendons compte des faits.`, { ref: ["arrivee_poste"] }));
    return pv(C, { par: "G1", m: a.arrPoste.m, titre: "Procès-verbal de saisine et d'interpellation", corps, cloture: `Dont procès-verbal, fait et clos à ${h(S.x.pvSaisine)}, que nous signons avec notre collègue.`, sigs: [sigOPJ(G1), { role: "Le second agent", nom: nomP(G2), etat: "signe" }] });
  };

  // --- placement en garde à vue et notification des droits
  T.notification = function (C) {
    const { S, a, P, h } = C, { A, OPJ } = P, gA = gram(A), D = S.droits, f = S.t.f;
    const motifs = ["permettre l'exécution des investigations impliquant la présence ou la participation de la personne", "garantir la présentation de la personne devant le procureur de la République afin que ce magistrat puisse apprécier la suite à donner à l'enquête", "empêcher que la personne ne fasse pression sur les témoins ou les victimes"].concat(f.agg.includes("reunion") ? ["empêcher que la personne ne se concerte avec d'autres personnes susceptibles d'être ses coauteurs ou complices"] : []);
    const corps = [
      C.p(`Poursuivant l'enquête, constatons que nous est présenté${gA.e} par l'équipage interpellateur la personne ci-dessous dénommée :`),
      identite(A, S, [["Nationalité", S.langue ? `se dit de nationalité ${S.langue.nat}` : "française"], ["Situation", `${A.enfants ? `${enLettres(A.enfants)} enfant${A.enfants > 1 ? "s" : ""} à charge` : "sans enfant à charge"}`]]),
      C.p(`Lui notifions qu'${gA.il} est placé${gA.e} en garde à vue à compter du ${SIM.date(S, a.notif.effet)} à ${h(a.notif.effet)}, heure de son interpellation, pour une durée de vingt-quatre heures, cette mesure pouvant être prolongée pour une nouvelle durée de vingt-quatre heures au plus sur autorisation du procureur de la République.`, { ref: ["notification", "interpellation"] }),
      C.p(`L'informons qu'il existe à son encontre une ou plusieurs raisons plausibles de soupçonner qu'${gA.il} a commis ou tenté de commettre l'infraction de violences volontaires${f.agg.length ? " aggravées" : ""}, faits prévus et réprimés par ${artLong(S.t.q.art)}, présumés commis le ${SIM.date(S, S.T0)} ${S.lieu.paris ? "à Paris" : "à " + S.lieu.ville}, ${S.lieu.court}.`),
      C.p(`L'informons que cette mesure constitue l'unique moyen de parvenir aux objectifs suivants (article 62-2 du code de procédure pénale) : ${motifs.join(" ; ")}.`),
      C.st("Notification des droits"),
      C.p(`L'informons, ${S.langue ? "en langue française" : "dans une langue qu'" + gA.il + " comprend, le français"}, qu'${gA.il} bénéficie :`),
      { k: "liste", items: [
        "du droit de faire prévenir un proche ou toute autre personne qu'" + gA.il + " désigne, ainsi que son employeur et, le cas échéant, les autorités consulaires de l'État dont " + gA.il + " est ressortissant" + gA.e + ", et de communiquer avec ces personnes (article 63-2) ;",
        "du droit d'être examiné" + gA.e + " par un médecin (article 63-3) ;",
        "du droit d'être assisté" + gA.e + " par un avocat, choisi ou commis d'office, dès le début de la mesure et pendant ses auditions (articles 63-3-1 à 63-4-3) ;",
        "s'il y a lieu, du droit d'être assisté" + gA.e + " par un interprète ;",
        "du droit de consulter, au plus tard avant l'éventuelle prolongation de la mesure, le présent procès-verbal, le certificat médical et les procès-verbaux de ses auditions (article 63-4-1) ;",
        "du droit de présenter des observations au magistrat appelé à statuer sur l'éventuelle prolongation de la mesure, tendant à ce qu'il y soit mis fin ;",
        "du droit, lors des auditions, après avoir décliné son identité, de faire des déclarations, de répondre aux questions qui lui sont posées ou de se taire.",
      ] },
      C.p(`Lui remettons le document énonçant ses droits prévu par l'article 803-6 du code de procédure pénale, qu'${gA.il} conserve pendant la durée de la mesure.`),
      C.st("Exercice des droits"),
      C.p(`Proche : ${D.proche ? `« Je veux qu'on prévienne ${A.proche ? A.proche.replace(/^sa /, "ma ").replace(/^son /, "mon ").replace(/^ses /, "mes ") : "quelqu'un de ma famille"}. »` : "« Je ne veux prévenir personne. »"}${D.employeur ? " Demande également que son employeur soit prévenu." : ""}`),
      C.p(`Médecin : ${D.medecin ? (f.agg.includes("ivresse") ? "ne formule pas de demande ; décidons d'office de requérir un médecin au vu de son état." : "« Oui, je veux voir un médecin. »") : "« Non, je n'ai pas besoin de médecin. »"}`),
      C.p(`Avocat : « Je n'ai pas d'avocat. Je veux un avocat commis d'office. »`),
      C.p(S.langue ? `Interprète : l'intéressé${gA.e} s'exprimant en langue française, il n'est pas fait appel à un interprète.` : "Interprète : sans objet."),
    ];
    if (a.ethylo) corps.push(C.men(`Mentionnons que l'intéressé${gA.e} a été soumis${gA.e} à ${h(a.ethylo.m)} à une mesure de son imprégnation alcoolique au moyen de l'éthylomètre du service (numéro de série ${S.x.nSerie}), laquelle a révélé un taux de ${String(a.ethylo.taux).replace(".", ",")} milligramme par litre d'air expiré.`, { ref: ["ethylo"] }));
    return pv(C, { par: "OPJ", m: a.notif.m, titre: "Procès-verbal de notification de placement en garde à vue et des droits", qualite: "PERSONNE GARDÉE À VUE", corps,
      cloture: `Lecture faite par ${gA.w("lui-même", "elle-même")}, l'intéressé${gA.e} ${S.x.refusSigne ? "refuse de signer le présent" : "persiste et signe avec nous le présent"}.`,
      sigs: [{ role: "La personne gardée à vue", nom: nomP(A), etat: S.x.refusSigne ? "refus" : "signe" }, sigOPJ(OPJ)], piedSig: ["La personne gardée à vue", "L'officier de police judiciaire"] });
  };

  // --- la déclaration des droits remise (formulaire officiel, résumé)
  T.droits = function (C) {
    const blocs = [
      { k: "entete", lignes: ["MINISTÈRE DE LA JUSTICE"], droite: [] },
      { k: "titre", t: "Déclaration des droits remise à une personne placée en garde à vue — droit commun" },
      C.p("(articles 63-1 et 803-6 du code de procédure pénale)", { cls: "centre" }),
      C.p("Les informations ci-dessous doivent vous être données dans une langue que vous comprenez. Vous pouvez conserver ce document pendant toute la durée de votre garde à vue.", { cls: "petit" }),
      C.st("Vous êtes informé(e) des faits et de la durée de la mesure"),
      C.p("Vous êtes placé(e) en garde à vue parce qu'il existe contre vous une ou plusieurs raisons plausibles de soupçonner que vous avez commis ou tenté de commettre une infraction punie d'une peine d'emprisonnement. Vous êtes informé(e) de la qualification, de la date et du lieu présumés de cette infraction, ainsi que des motifs de la mesure."),
      C.p("La garde à vue dure vingt-quatre heures. Elle peut être prolongée de vingt-quatre heures sur autorisation du magistrat. À l'issue, vous serez soit remis(e) en liberté, soit présenté(e) à un magistrat, au plus tard dans les vingt heures suivant la fin de la mesure."),
      C.st("Vous pouvez faire prévenir certaines personnes"),
      C.p("Vous pouvez faire prévenir par téléphone une personne avec laquelle vous vivez habituellement, l'un de vos parents, frères ou sœurs, ou toute autre personne que vous désignez, ainsi que votre employeur et, si vous êtes de nationalité étrangère, votre consulat. Sauf circonstances insurmontables, ces diligences interviennent au plus tard dans les trois heures de votre demande. Le magistrat peut les différer ou les refuser pour les nécessités de l'enquête. Vous pouvez communiquer avec l'une de ces personnes si l'officier de police judiciaire l'estime compatible avec l'enquête."),
      C.st("Vous pouvez être examiné(e) par un médecin"),
      C.p("Le médecin se prononce sur votre aptitude à rester en garde à vue. L'examen peut être renouvelé en cas de prolongation."),
      C.st("Vous pouvez vous taire"),
      C.p("Lors de vos auditions, après avoir décliné votre identité, vous avez le droit de faire des déclarations, de répondre aux questions ou de garder le silence."),
      C.st("Vous pouvez être assisté(e) par un avocat"),
      C.p("Dès le début de la mesure, vous pouvez demander l'assistance d'un avocat de votre choix ou commis d'office. Vous pouvez vous entretenir avec lui pendant trente minutes, dans des conditions qui garantissent la confidentialité. Il peut assister à vos auditions et confrontations, poser des questions à leur issue et présenter des observations écrites."),
      C.st("Vous pouvez être assisté(e) par un interprète"),
      C.p("Si vous ne parlez pas ou ne comprenez pas le français, vous avez droit à l'assistance gratuite d'un interprète pour vos auditions et pour communiquer avec votre avocat."),
      C.st("Vous pouvez consulter certaines pièces et présenter des observations"),
      C.p("Vous pouvez demander à consulter, au plus tard avant la prolongation de la mesure, le procès-verbal de notification de votre placement en garde à vue, le certificat médical établi par le médecin et les procès-verbaux de vos auditions. Vous pouvez demander au magistrat, lorsqu'il se prononce sur la prolongation, qu'il soit mis fin à la mesure."),
    ];
    return { titre: "Déclaration des droits (formulaire remis)", forme: "formulaire", m: C.a.notif.m, par: "OPJ", blocs, sansHeure: true };
  };

  // --- avis à magistrat
  T.avis_parquet = function (C) {
    const { S, a, P, h } = C, { A, PQ } = P, gA = gram(A);
    return pv(C, { par: "OPJ", m: a.avis.m, titre: "Procès-verbal d'avis à magistrat", corps: [
      C.p(`Avisons par téléphone la permanence du parquet de ${S.lieu.tj.ville}, en la personne de ${PQ.civ === "Mme" ? "Madame" : "Monsieur"} ${MAJ(PQ.nom)}, ${PQ.qual}, du placement en garde à vue ${gA.w("du nommé", "de la nommée")} ${nomP(A)}, à compter du ${SIM.date(S, a.notif.effet)} à ${h(a.notif.effet)}, pour des faits de violences volontaires${S.t.f.agg.length ? " aggravées" : ""}, ainsi que des motifs de cette mesure.`, { ref: ["avis_parquet"] }),
      C.p("Ce magistrat nous prescrit de poursuivre l'enquête et de lui rendre compte."),
    ], cloture: "Dont mention." });
  };

  // --- diligences : avocat, proche, employeur
  T.diligences = function (C) {
    const { S, a, P, h } = C, { A } = P, gA = gram(A), corps = [];
    corps.push(C.men(`À ${h(a.avisAvocat.m)}, avisons par téléphone la permanence pénale de l'ordre des avocats au barreau de ${S.lieu.tj.ville} de la demande de l'intéressé${gA.e} d'être assisté${gA.e} par un avocat commis d'office, en précisant la nature et la date présumée de l'infraction. ${S.P.AV.joueur ? "La permanence nous indique qu'un avocat est désigné et se transporte au service." : `La permanence nous indique que ${S.P.AV.nom}, avocat de permanence, est désigné.`}`, { ref: ["avis_avocat"] }));
    if (a.avisProche) corps.push(C.men(`À ${h(a.avisProche.m)}, avisons par téléphone ${(A.proche || "le proche désigné").replace(/^sa /, "la ").replace(/^son /, "le ").replace(/^un /, "le ").replace(/^une /, "la ")} de l'intéressé${gA.e} de la mesure dont ${gA.il} fait l'objet.`, { ref: ["avis_proche"] }));
    if (S.droits.employeur) corps.push(C.men("L'employeur, appelé au numéro communiqué, n'a pu être joint. Laissons un message invitant à rappeler le service."));
    return pv(C, { par: "OPJ", m: a.avisAvocat.m, titre: "Procès-verbal de diligences", suite: "Poursuivant l'exécution des droits demandés par la personne gardée à vue,", corps, cloture: "Dont mention." });
  };

  // --- inventaire des effets, saisie
  T.fouille = function (C) {
    const { S, a, P, h } = C, { A, G2 } = P, gA = gram(A);
    const objets = S.x.objets.concat(a.fouille.tel ? ["un téléphone portable, écran fissuré"] : []).concat(a.fouille.argent ? [`la somme de ${a.fouille.argent} euros en numéraire`] : []).concat(["une ceinture et une paire de lacets"]);
    const corps = [
      C.p(`À ${h(a.fouille.m)}, procédons, pour des raisons de sécurité, à l'inventaire contradictoire des effets que l'intéressé${gA.e} détient sur ${gA.soi}, en sa présence constante. La mesure est réalisée par palpation, sans déshabillage.`, { ref: ["fouille"] }),
      { k: "liste", items: objets.map((o) => o + " ;") },
      C.p("Ces effets sont placés dans la fouille du service contre émargement au registre. Ils seront restitués à l'issue de la mesure."),
    ];
    if (a.scelle) corps.push(C.p(`À ${h(a.scelle.m)}, l'officier de police judiciaire procède à la saisie de ${a.scelle.objet}, ${S.t.f.arme ? "découvert lors de la palpation de sécurité" : "porté par l'intéressé" + gA.e + " lors de son interpellation"}, et le place sous scellé fermé numéro ${a.scelle.no}, en présence de l'intéressé${gA.e}.`, { ref: ["scelle"] }));
    return pv(C, { par: "G2", m: a.fouille.m, titre: a.scelle ? "Procès-verbal d'inventaire et de saisie" : "Procès-verbal d'inventaire des effets", corps, cloture: `Dont procès-verbal, que l'intéressé${gA.e} ${S.x.refusSigne ? "refuse de signer" : "signe avec nous"}.`, sigs: [{ role: "La personne gardée à vue", nom: nomP(A), etat: S.x.refusSigne ? "refus" : "signe" }, sigOPJ(G2)] });
  };

  // --- réquisition à médecin, certificat de compatibilité
  T.req_medecin = function (C) {
    const { S, a, P } = C, { A, MED } = P, gA = gram(A);
    return pv(C, { par: "OPJ", m: a.reqMed.m, titre: "Réquisition à médecin", vu: "Vu l'article 63-3 du code de procédure pénale,", corps: [
      C.p(`Requérons le docteur ${nomP(MED)}, médecin de permanence, à l'effet de procéder à l'examen médical de ${nomP(A)}, né${gA.e} ${A.naissance}, gardé${gA.e} à vue dans nos locaux, et de dire si son état de santé est compatible avec le maintien de la mesure dans les locaux de police, le cas échéant sous quelles conditions.`, { ref: ["req_medecin"] }),
      C.p("Le médecin requis établira un certificat qui sera versé à la procédure."),
    ], cloture: "Dont réquisition." });
  };
  T.certificat_gav = function (C) {
    const { S, a, P, h } = C, { A, MED } = P, gA = gram(A), m = a.examen.ecrit != null ? a.examen.ecrit : a.examen.m;
    const blocs = [
      { k: "entete", lignes: [`Docteur ${nomP(MED)}`, "Médecine générale — permanence de garde à vue"], droite: [`${S.lieu.ville}, le ${SIM.date(S, m)}`] },
      { k: "titre", t: "Certificat médical — examen d'une personne gardée à vue" },
      C.p(`Je soussigné${gram(MED).e}, docteur ${nomP(MED)}, requis${gram(MED).e} par le ${P.OPJ.grade} ${nomP(P.OPJ)}, officier de police judiciaire, certifie avoir examiné ce jour à ${h(m)}, dans les locaux du ${S.lieu.commCourt}, une personne qui me dit se nommer ${nomP(A)}, né${gA.e} ${A.naissance}.`, { ref: ["examen"] }),
      C.st("Dires de la personne"),
      C.p(`${S.t.f.agg.includes("ivresse") ? "Déclare avoir consommé de l'alcool dans la soirée. " : ""}Ne signale aucun traitement en cours ni antécédent notable.${S.x.couA ? " Se plaint d'une douleur du cou." : ""}${S.x.mainA ? " Se plaint d'une douleur de la main droite." : ""}`),
      C.st("Examen"),
      C.p(`État général conservé. Conscience normale, propos cohérents${S.t.f.agg.includes("ivresse") ? ", haleine œnolique" : ""}. Pouls à ${S.x.pouls} par minute, tension artérielle à ${S.x.ta}.`),
      C.p(`Téguments : ${S.x.couA ? S.x.couA + "." : "pas de lésion traumatique récente du visage ni du cou."} Mains : ${S.x.mainA ? S.x.mainA + ", sans plaie." : "pas de lésion traumatique des mains."}`),
      C.st("Conclusion"),
      C.p(`L'état de santé de l'intéressé${gA.e} est compatible avec le maintien en garde à vue dans les locaux de police${S.x.mainA || S.x.couA ? ", sous réserve de la délivrance d'un antalgique en cas de douleur" : ""}.`),
      C.p("Certificat établi sur réquisition et remis à l'autorité requérante.", { cls: "petit" }),
      { k: "sig", cases: [{ role: "Le médecin", nom: `Dr ${nomP(MED)}`, etat: "signe", tampon: `Dr ${nomP(MED)} · médecine générale` }] },
    ];
    return { titre: "Certificat médical de garde à vue", forme: "certificat", m, par: "MED", blocs };
  };

  // --- plainte
  T.plainte = function (C) {
    const { S, a, P, h } = C, { A, V, B1 } = P, gV = gram(V), gA = gram(A), v = S.verite, d = (k) => SIM.dit(S, "V", k).texte;
    const corps = [
      C.p(`Recevons dans les locaux du service la personne ci-dessous dénommée, qui se présente ${a.urgences.m < a.plainte.m ? `au sortir de l'${S.lieu.hopital}` : "spontanément"} et désire déposer plainte :`),
      identite(V, S),
      C.p("L'informons de ses droits de victime, conformément à l'article 10-2 du code de procédure pénale : obtenir réparation de son préjudice, se constituer partie civile, être assistée d'un avocat, être aidée par une association d'aide aux victimes, saisir le cas échéant la commission d'indemnisation des victimes d'infractions.", { cls: "mention" }),
      C.p("Entendons la personne dénommée ci-dessus, qui nous déclare :"),
      C.decl(`Je me présente pour déposer plainte pour des violences dont j'ai été victime ${SIM.jour(S, a.plainte.m) === SIM.jour(S, S.T0) ? "aujourd'hui" : "hier"}, ${C.vers(S.T0)}, ${S.lieu.court}.`),
      C.decl(`${d("mobile")} ${d("insulte")}`, { ref: ["mobile", "insulte"] }),
      C.decl(`${d("coups")} ${d("chute")}`, { ref: ["coups", "chute"] }),
      C.decl(`${v.role2 || v.innocent ? "" : gA.Il + " est parti" + gA.e + " tout de suite après, à pied. "}Des gens ont appelé la police. ${a.urgences.m < a.plainte.m ? `Les pompiers m'ont emmené${gV.e} à l'hôpital. ` : ""}${d("lesions")}${S.t.f.itt ? ` Le médecin m'a donné ${S.t.f.itt} jour${S.t.f.itt > 1 ? "s" : ""} d'incapacité.` : ""}`),
    ];
    const Q = [];
    Q.push(["Connaissez-vous la personne qui vous a frappé" + gV.e + " ?", d("auteur")]);
    Q.push([`Aviez-vous, de votre côté, insulté ou touché cette personne ?`, d("premier")]);
    Q.push(["Pouvez-vous décrire cette personne ?", `${A.g === "f" ? "Une femme" : "Un homme"} d'à peu près ${Math.round(A.age / 5) * 5} ans, ${A.sig.corp === "forte" ? "plutôt costaud" + gA.e : "de corpulence " + A.sig.corp}, avec ${A.sig.haut} ${SIM.accorde(A.sig.haut, A.sig.hautCoul)}.${v.role2 ? " L'autre, je ne l'ai presque pas vu." : ""}`]);
    if (S.t.f.arme) Q.push([`Vous évoquez ${S.t.f.arme}. D'où provenait cet objet ?`, "Je ne sais pas. Je l'ai vu dans sa main au dernier moment."]);
    Q.push(["Aviez-vous consommé de l'alcool ?", d("alcool")]);
    Q.push(["Y avait-il des témoins ?", S.t.preuves.includes("temoin") ? "Oui, il y avait du monde. Une personne est restée avec moi jusqu'à l'arrivée de la police." : "Il y avait du monde, mais personne n'est resté."]);
    Q.push(["Combien de temps la scène a-t-elle duré ?", "Deux ou trois minutes en tout. Les coups, quelques secondes."]);
    Q.push(["Avez-vous perdu connaissance ?", v.chute && S.t.f.itt > 8 ? `Je ne crois pas. J'étais sonné${gV.e}, je ne sais plus très bien.` : "Non."]);
    Q.push(["Exercez-vous une activité professionnelle ? Un arrêt de travail vous a-t-il été prescrit ?", V.emploi ? `Je suis ${V.metier}. ${S.t.f.itt > 2 ? "Oui, j'ai un arrêt de travail." : "Non, pas d'arrêt de travail."}` : `Je ne travaille pas en ce moment${V.metier && !/sans/.test(V.metier) ? ", je suis " + V.metier : ""}.`]);
    Q.push(["Avez-vous subi un préjudice matériel ?", S.x.materiel || "Non."]);
    Q.push(["Accepteriez-vous d'être confronté" + gV.e + " à la personne interpellée ?", V.age > 50 || S.t.f.itt > 8 ? "Je préférerais l'éviter." : "Oui, s'il le faut."]);
    Q.push(["Souhaitez-vous ajouter quelque chose ?", d("suite")]);
    for (const [q, rep] of Q) corps.push(C.qr(q, rep));
    corps.push(C.men("Remettons à la personne un récépissé de dépôt de plainte et l'informons qu'une copie du présent lui sera délivrée sur sa demande. L'invitons à se présenter à l'unité médico-judiciaire sur notre réquisition."));
    return pv(C, { par: "B1", m: a.plainte.m, titre: "Procès-verbal de plainte", qualite: "VICTIME", corps,
      cloture: `Le ${SIM.date(S, a.plainte.fin)} à ${h(a.plainte.fin)}, lecture faite par ${gV.w("lui-même", "elle-même")} de la déclaration ci-dessus, ${gV.il} y persiste et n'a rien à y changer, à y ajouter ou à y retrancher.`,
      sigs: [{ role: "La personne entendue", nom: nomP(V), etat: "signe" }, sigOPJ(B1)], piedSig: ["La personne entendue", "L'agent de police judiciaire"] });
  };

  // --- certificat médical initial (urgences) et certificat de l'unité médico-judiciaire
  function certificat(C, o) {
    const { S, P, h } = C, V = P.V, gV = gram(V), v = S.verite, M = P[o.par];
    const blocs = [
      { k: "entete", lignes: o.entete, droite: [`Le ${SIM.date(S, o.m)}`] },
      { k: "titre", t: o.titre },
      C.p(`Je soussigné${gram(M).e}, docteur ${nomP(M)}, ${M.qual}, ${o.requis ? `requis${gram(M).e} par le ${P.OPJ.grade} ${nomP(P.OPJ)}, officier de police judiciaire, prêtant serment d'apporter mon concours à la justice en mon honneur et en ma conscience, ` : ""}certifie avoir examiné le ${SIM.date(S, o.m)} à ${h(o.m)} une personne qui me dit s'appeler ${nomP(V)}, né${gV.e} ${V.naissance}.`, { ref: [o.acte] }),
      C.st("Faits ou commémoratifs"),
      C.p(`La personne déclare avoir été victime de violences le ${SIM.date(S, S.T0)} : « ${SIM.dit(S, "V", "coups").texte} »`),
      C.st("Doléances exprimées par la personne"),
      C.p(`« J'ai mal ${v.lesions[0].includes("thora") || v.lesions[0].includes("côte") ? "quand je respire" : /nez|nasale/.test(v.lesions[0]) ? "au nez" : /poignet|épaule|coude|paume/.test(v.lesions[0]) ? "au bras" : "au visage"}. » Douleur évaluée par la personne à ${S.x.douleur} sur 10.${o.requis ? " Se dit encore choqué" + gV.e + ", dort mal." : ""}`),
      C.st("Examen clinique"),
      { k: "liste", items: v.lesions.map((l) => l + " ;").concat(["absence de trouble de la conscience ; examen neurologique sans particularité.", o.requis ? "retentissement psychologique : anxiété réactionnelle, sans élément dissociatif." : "état psychique : personne choquée, discours cohérent."]) },
      C.p(S.x.radio ? "Examens complémentaires : radiographies réalisées, compte rendu joint au dossier médical." : "Examens complémentaires : aucun."),
      C.st("Incapacité totale de travail"),
      C.p(o.itt ? `L'incapacité totale de travail, au sens pénal du terme, est de ${enLettres(o.itt)} (${o.itt}) jour${o.itt > 1 ? "s" : ""} à compter des faits, sous réserve de complications ultérieures.` : "Ces lésions n'entraînent pas d'incapacité totale de travail au sens pénal du terme, sous réserve de complications ultérieures."),
      C.p(o.requis ? "Rapport établi sur réquisition et remis à l'autorité requérante." : "Certificat établi à la demande de l'intéressé" + gV.e + " et remis en main propre pour servir et faire valoir ce que de droit.", { cls: "petit" }),
      { k: "image", spec: { type: "schema", lesions: v.lesions }, legende: "Schéma corporel — siège des lésions constatées" },
      { k: "sig", cases: [{ role: "Le médecin", nom: `Dr ${nomP(M)}`, etat: "signe", tampon: o.tampon }] },
    ];
    return { titre: o.titre, forme: "certificat", m: o.m, par: o.par, blocs };
  }
  T.certificat_urg = (C) => certificat(C, { par: "URG", m: C.a.urgences.m, acte: "urgences", itt: C.S.t.f.itt, titre: "Certificat médical initial", entete: [`${MAJ(C.S.lieu.hopital.replace(", à ", " — "))}`, "Service d'accueil des urgences"], tampon: "Service d'accueil des urgences" });
  T.umj = (C) => certificat(C, { par: "LEG", m: C.a.umj.m, acte: "umj", itt: C.a.umj.itt, requis: true, titre: "Certificat médico-judiciaire sur réquisition", entete: [MAJ(C.S.lieu.umj.replace(/, à .*$/, "")), "Médecine légale du vivant"], tampon: "Unité médico-judiciaire" });

  // --- audition de témoin
  T.aud_temoin = function (C) {
    const { S, a, P, h } = C, { T: Tm, B1 } = P, gT = gram(Tm), d = (k) => SIM.dit(S, "T", k).texte;
    const corps = [
      C.p("Entendons en qualité de témoin la personne ci-dessous dénommée, qui déclare n'avoir aucun lien de parenté, d'alliance ou de subordination avec les parties :"),
      identite(Tm, S),
      C.p("Entendons la personne dénommée ci-dessus, qui nous déclare :"),
      C.decl(`${d("cris")}`, { ref: ["cris"] }),
      C.decl(`${d("premier")}`, { ref: ["premier"] }),
      C.decl(`${d("coups")} ${S.verite.chute ? "La personne frappée est tombée." : "La personne frappée a reculé, elle est restée debout."} Celui qui avait frappé est parti à pied, sans courir. C'est moi qui ai appelé la police.`.replace("Celui qui avait frappé est parti", S.P[S.verite.frappeur].g === "f" ? "Celle qui avait frappé est partie" : "Celui qui avait frappé est parti"), { ref: ["coups"] }),
    ];
    for (const [q, rep] of [["Pouvez-vous décrire la personne qui a porté les coups ?", d("description")], ["Avez-vous vu son visage ? Seriez-vous en mesure de la reconnaître ?", d("visage")], ["La personne interpellée par nos collègues est-elle celle que vous avez vue frapper ?", Tm.vu.visage ? "Je pense que oui." : "Je ne peux pas l'affirmer. Quand la police est revenue avec quelqu'un, j'étais occupé" + gT.e + " avec la victime."], ["Connaissez-vous l'une ou l'autre de ces personnes ?", d("connait")], ["À quelle distance vous trouviez-vous, et comment était l'éclairage ?", `À ${Tm.dist} mètres environ. ${S.nuit ? "Il faisait nuit, il y avait l'éclairage de la rue." : "Il faisait jour."}`]]) corps.push(C.qr(q, rep));
    return pv(C, { par: "B1", m: a.temoin.m, titre: "Procès-verbal d'audition de témoin", qualite: "TÉMOIN", corps,
      cloture: `Le ${SIM.date(S, a.temoin.fin)} à ${h(a.temoin.fin)}, lecture faite par ${gT.w("lui-même", "elle-même")} de la déclaration ci-dessus, ${gT.il} y persiste et n'a rien à y changer, à y ajouter ou à y retrancher.`,
      sigs: [{ role: "La personne entendue", nom: nomP(Tm), etat: "signe" }, sigOPJ(B1)], piedSig: ["La personne entendue", "L'agent de police judiciaire"] });
  };

  // --- images : réquisition, puis exploitation avec planche
  T.req_video = function (C) {
    const { S, a, h } = C, cam = S.cam;
    return pv(C, { par: "OPJ", m: a.reqVideo.m, titre: "Réquisition judiciaire", vu: "Vu les articles 60-1 et 60-2 du code de procédure pénale,", corps: [
      C.p(`Requérons ${cam.det} de nous remettre sans délai, sur tout support numérique, les enregistrements issus de ${cam.src.replace(/^le /, "son ").replace(/^la /, "sa ")} et couvrant ${S.lieu.zone}, pour la période du ${SIM.date(S, S.T0)} comprise entre ${h(S.faits.find((x) => x.id === "mobile").m)} et ${h(a.interp.m)}.`, { ref: ["req_video"] }),
      C.p("La présente réquisition est exécutoire sans que puisse être opposée l'obligation au secret professionnel, sauf motif légitime."),
    ], cloture: "Dont réquisition, remise au requis." });
  };
  T.video = function (C) {
    const { S, a, P, h } = C, cam = S.cam, v = S.verite, A = P.A, Fr = P[v.frappeur], gF = gram(Fr), gA = gram(A);
    const t0 = `${h(S.T0, "n")}:${String(cam.sec).padStart(2, "0")}`;
    const corps = [
      C.p(`Exploitons l'enregistrement remis sur notre réquisition par ${cam.det}, fichier « ${cam.fichier} », d'une durée de ${cam.duree} secondes, issu de la caméra « ${cam.label} ». L'horodatage incrusté à l'image n'a pas été comparé à l'heure légale.`, { ref: ["exploitation_video"] }),
      C.p(`La caméra, fixe, filme ${S.lieu.zone} en plongée, à une distance que nous estimons à ${cam.dist} mètres de la scène. L'image est ${cam.ir ? "en noir et blanc, prise en mode infrarouge" : cam.nuit ? "en couleur, sombre, éclairée par l'éclairage public" : "en couleur"}, de définition ${cam.dist > 14 ? "médiocre" : "moyenne"}. Il n'y a pas de son.`),
      C.st("Constatations"),
      C.p(cam.horsChamp ? `Au début de la séquence, la scène est vide. Deux personnes entrent dans le champ par le bord gauche de l'image, déjà face à face : ce qui précède n'est pas filmé.` : `Au début de la séquence, deux personnes se font face au centre de l'image${v.role2 ? ", une troisième se tient en retrait" : ""}. Elles échangent des gestes pendant une dizaine de secondes${v.premier === "V" && !cam.horsChamp ? " ; la personne en " + SIM.accorde("un haut", P.V.sig.hautCoul) + " avance le bras vers l'autre" : ""}.`),
      C.p(`À ${t0} à l'horodatage, la personne vêtue d'un haut ${SIM.accorde("un haut", Fr.sig.hautCoul)}${Fr.sig.capuche ? ", capuche relevée," : ""} porte ${v.coups[0] === "arme" ? "un coup, un objet à la main," : v.coups[0] === "poussee" ? "les deux mains en avant" : v.coups[0] === "tete" ? "un coup de la tête" : "le bras"} vers le haut du corps de la seconde${v.coups.length > 1 ? `, ${v.coups.length > 2 ? "à plusieurs reprises" : "à deux reprises"}` : ""}. ${v.chute ? "Celle-ci tombe au sol." : "Celle-ci recule de deux pas et reste debout."}${v.role2 === "tient" ? " La troisième personne se tient derrière la victime, les bras autour d'elle." : ""}`, { ref: ["coup1"] }),
      C.p(`La personne qui a porté le ou les coups quitte le champ par le ${v.fuite === "le boulevard" ? "haut" : "bord droit"} de l'image${v.innocent ? " ; une autre personne en haut sombre, restée en bordure du champ, s'éloigne dans la même direction quelques secondes plus tard" : ""}. Des passants s'approchent de la personne ${v.chute ? "à terre" : "frappée"}.`),
      { k: "image", spec: { type: "camera" }, legende: `Planche 1 — capture d'écran à ${t0} (horodatage de la caméra)` },
      C.st("Observations"),
      C.p(cam.visage ? `Le visage de l'auteur des coups est visible. Sa tenue et sa physionomie correspondent à celles de ${nomP(A)}, interpellé${gA.e} quelques minutes plus tard.` : cam.affirme ? `Reconnaissons formellement ${nomP(A)} comme étant l'auteur des coups, à sa tenue vestimentaire et à sa corpulence.` : `Le visage de l'auteur des coups n'est pas discernable${Fr.sig.capuche ? " en raison de la capuche" : cam.nuit ? " en raison de l'obscurité" : " à cette distance"}. Sa tenue est compatible avec celle que portait ${nomP(A)} lors de son interpellation.`),
      C.p("Gravons l'enregistrement sur un disque que nous plaçons sous scellé et annexons au présent une planche photographique d'une capture."),
    ];
    return pv(C, { par: "OPJ", m: a.video.m, titre: "Procès-verbal d'exploitation de vidéoprotection", corps, cloture: `Dont procès-verbal, clos à ${h(a.video.fin)}.` });
  };

  // --- audition de la personne gardée à vue
  T.audition = function (C) {
    const { S, a, P, h, r } = C, { A, V, OPJ, AV } = P, gA = gram(A), gV = gram(V), v = S.verite, f = S.t.f, d = (k) => SIM.dit(S, "A", k).texte, st = S.t.stance;
    const sait = (x) => x && (x.fin || x.m) <= a.audition.m; // ce que l'enquêteur a en main quand il commence
    const corps = [
      C.p(`Faisons extraire de sa chambre de sûreté la personne gardée à vue ${nomP(A)} et procédons à son audition${a.audition.avocat ? `, en présence de ${AV.joueur ? "son avocat" : AV.nom + ", avocat au barreau de " + S.lieu.tj.ville}, qui s'est entretenu avec ${gA.soi} de ${h(a.entretien.m)} à ${h(a.entretien.fin)}` : ""}.`),
    ];
    if (!a.audition.avocat) corps.push(C.men(`Mentionnons que l'avocat de permanence, avisé à ${h(a.avisAvocat.m)}, ne s'est pas présenté à cette heure. Procédons à l'audition.`));
    corps.push(C.p(`Lui rappelons qu'${gA.il} est entendu${gA.e} sur des faits de violences volontaires${f.agg.length ? " aggravées" : ""} commis le ${SIM.date(S, S.T0)} ${S.lieu.court}, et qu'${gA.il} a le droit de faire des déclarations, de répondre aux questions qui lui sont posées ou de se taire.`));
    const Q = [];
    if (S.langue) Q.push(["Comprenez-vous bien le français ?", "Un peu. Pas tout. Vous parlez doucement, ça va."]);
    Q.push(["Souhaitez-vous répondre à nos questions ?", "Oui, je veux bien répondre."]);
    Q.push(["Quelle est votre situation familiale ?", `${A.enfants ? `J'ai ${enLettres(A.enfants)} enfant${A.enfants > 1 ? "s" : ""}.` : "Je n'ai pas d'enfant."} ${A.heberg ? "Je suis hébergé" + gA.e + " en ce moment." : "J'ai mon logement."}`]);
    Q.push(["Quelles sont votre profession et vos ressources ?", A.emploi ? `Je suis ${A.metier}. Je gagne dans les ${CR.num(Math.round((A.revenu || 1500) / 50) * 50)} euros par mois.` : `Je ne travaille pas en ce moment${A.metier && !/sans/.test(A.metier) ? ", je suis " + A.metier : ""}.${A.revenu ? ` Je touche à peu près ${CR.num(Math.round(A.revenu / 50) * 50)} euros par mois.` : ""}`]);
    Q.push(["Avez-vous déjà eu affaire aux services de police ou à la justice ?", A.casier || S.t.ant ? (st === "reconnait" ? "Oui, j'ai déjà été condamné" + gA.e + "." : "Une fois, c'est vieux.") : "Non, jamais."]);
    Q.push([`Que faisiez-vous ${S.lieu.court} ?`, f.sc === "bar" ? `J'étais au bar depuis un moment${v.role2 ? ", avec une connaissance" : ""}. Je buvais un verre.` : f.sc === "transport" ? "Je rentrais chez moi." : f.sc === "voisinage" ? "J'habite là. Je rentrais." : f.sc === "travail" ? "Je travaillais." : f.sc === "sport" ? "Je jouais, comme chaque semaine." : f.sc === "file" ? "Je faisais la queue, comme tout le monde." : "Je passais, c'est tout."]);
    Q.push([`Que s'est-il passé avec ${civ(V)} ?`, `${d("mobile")} ${d("insulte")}`]);
    Q.push(["Qui a eu le premier geste ?", d("premier")]);
    Q.push([`Avez-vous porté des coups à ${civ(V)} ?`, d("coups")]);
    Q.push(["Décrivez précisément votre geste.", st === "reconnait" ? `De la main ${v.main}${v.coups[0] === "poing" ? ", le poing fermé" : ""}. C'est parti tout seul.` : st === "minimise" ? `Une gifle, de la main ${v.main}, la main ouverte. Pas un coup de poing.` : v.innocent ? "Je n'ai fait aucun geste. J'étais à côté, les mains dans les poches." : `J'ai tendu le bras pour ${gV.le} tenir à distance, c'est tout.`]);
    Q.push([`${civ(V)} est-${gV.il} tombé${gV.e} ?`, v.chute ? (st === "reconnait" ? "Oui. J'ai eu peur en voyant ça." : st === "minimise" ? `${gV.Il} a reculé et ${gV.il} a glissé.` : v.innocent ? "Oui, je l'ai vu tomber. Ce n'est pas moi qui l'ai fait tomber." : `${gV.Il} est tombé${gV.e} tout${gV.f ? "e" : ""} seul${gV.e}, je vous l'ai dit.`) : `Non, ${gV.il} est resté${gV.e} debout.`]);
    if (OPJ.style.pressant && st !== "reconnait") Q.push(["Je vous repose la question. Avez-vous, oui ou non, frappé cette personne ?", st === "nie" ? "Non. Je vous l'ai dit." : "Une gifle. Je ne vais pas dire autre chose."]);
    if (sait(a.plainte)) Q.push([`${OPJ.style.bavard ? `Nous avons entendu ${civ(V)}. ${gV.Il} déclare, je cite : « ${SIM.dit(S, "V", "coups").texte} »` : `${civ(V)} déclare que vous lui avez porté plusieurs coups.`} Qu'avez-vous à répondre ?`.replace("plusieurs coups", v.coups.length + (v.vExagere ? 2 : 0) > 1 ? "plusieurs coups" : "un coup"), st === "nie" ? `C'est faux. ${gV.Il} raconte ce qu'${gV.il} veut.` : st === "minimise" ? `${gV.Il} en rajoute. Une gifle, pas plus.` : "C'est possible. Tout est allé très vite, je ne sais plus combien."]);
    if (sait(a.urgences)) Q.push([`Le certificat médical relève ${v.lesions[0].replace(/,.*$/, "")}${f.itt ? ` et ${f.itt} jour${f.itt > 1 ? "s" : ""} d'incapacité totale de travail` : ""}. Comment l'expliquez-vous ?`, st === "reconnait" ? "C'est moi. Je ne pensais pas avoir tapé si fort." : st === "minimise" ? `Une gifle ne fait pas ça. ${gV.Il} a dû se faire mal en tombant.` : v.innocent ? "Ce n'est pas moi qui l'ai frappé" + gV.e + ", je ne peux pas vous l'expliquer." : `${gV.Il} est tombé${gV.e}, je vous dis.`]);
    if (sait(a.temoin)) Q.push([OPJ.style.bavard ? `Un témoin, qui se trouvait à ${P.T.dist} mètres, déclare : « ${SIM.dit(S, "T", "coups").texte} » Qu'en dites-vous ?` : "Un témoin déclare vous avoir vu porter les coups. Qu'en dites-vous ?", st === "reconnait" ? "Ce témoin dit vrai." : st === "minimise" ? "Ce témoin a vu une gifle, alors." : "Ce témoin se trompe de personne."]);
    if (sait(a.video)) Q.push([`Les images de vidéoprotection montrent une personne vêtue comme vous porter ${v.coups.length > 1 ? "des coups" : "un coup"}. Vous reconnaissez-vous ?`, st === "reconnait" ? "Oui, c'est moi." : st === "minimise" ? "C'est moi sur l'image, oui. Mais on voit bien que c'est rapide." : v.innocent ? "Non. Regardez bien, ce ne sont pas mes vêtements. Moi, je suis sur le côté." : "On ne voit pas de visage. Ce n'est pas moi."]);
    if (f.arme) Q.push([`${sait(a.plainte) ? "La victime déclare" : "Il nous a été rapporté"} que vous teniez ${f.arme}. Est-ce exact ?`, d("arme")]);
    if (v.role2 || f.agg.includes("reunion")) Q.push(["Qui était la personne qui vous accompagnait ?", d("second")]);
    Q.push(["Aviez-vous consommé de l'alcool ou des produits stupéfiants ?", d("alcool") + (f.agg.includes("ivresse") ? "" : " Pas de stupéfiants.")]);
    if (a.ethylo) Q.push([`L'éthylomètre a mesuré ${String(a.ethylo.taux).replace(".", ",")} milligramme par litre d'air expiré. Maintenez-vous vos déclarations ?`, "J'ai peut-être bu un peu plus. Je ne compte pas."]);
    Q.push(["Pourquoi avoir quitté les lieux ?", d("depart")]);
    Q.push(["Où alliez-vous lorsque nos collègues vous ont interpellé" + gA.e + " ?", S.x.allait]);
    if (A.sig.capuche) Q.push(["Pourquoi portiez-vous votre capuche sur la tête ?", S.nuit ? "Il faisait froid. Je la mets tout le temps." : "Par habitude."]);
    Q.push([`Avez-vous vu que ${civ(V)} était blessé${gV.e} ?`, st === "reconnait" ? "J'ai vu du sang. C'est pour ça que je suis parti" + gA.e + ", j'ai paniqué." : v.innocent ? "J'ai vu des gens autour. Je n'ai pas regardé." : `Non. Quand je suis parti${gA.e}, ${gV.il} ${v.chute ? "se relevait" : "était debout"}.`]);
    Q.push([`Connaissiez-vous ${civ(V)} avant les faits ?`, d("connait")]);
    if (OPJ.style.pressant) Q.push(["Vous rendez-vous compte de la gravité de ce qui vous est reproché ?", st === "reconnait" ? "Oui. Je m'en rends compte." : "Je n'ai rien fait de grave."]);
    Q.push(["Acceptez-vous de vous soumettre aux opérations de relevés signalétiques, photographies et empreintes ?", "Oui."]);
    Q.push([`Accepteriez-vous d'être confronté${gA.e} à ${civ(V)} ?`, st === "reconnait" ? "Oui. Je voudrais m'excuser en face." : st === "minimise" ? "Si vous voulez." : "Oui. Je n'ai rien à cacher."]);
    Q.push(["Avez-vous quelque chose à ajouter ?", st === "reconnait" ? `Je voudrais m'excuser auprès de ${gV.soi}. Je suis prêt${gA.e} à payer les soins.` : st === "minimise" ? "Je regrette que ça ait dégénéré. Mais je ne suis pas quelqu'un de violent." : "Je veux rentrer chez moi. Je n'ai rien fait."]);
    for (const [q, rep] of Q) corps.push(C.qr(q, rep));
    if (a.audition.avocat) corps.push(C.men(`${AV.joueur ? "L'avocat" : AV.nom}, invité à poser des questions à l'issue de l'audition, ${AV.joueur ? "[vos questions et vos observations seront reportées ici]" : "n'en pose pas et ne formule pas d'observations écrites"}.`));
    const fin = a.audition.finEcrite != null ? a.audition.finEcrite : a.audition.fin;
    return pv(C, { par: "OPJ", m: a.audition.m, titre: "Procès-verbal d'audition", qualite: "PERSONNE GARDÉE À VUE", corps,
      cloture: `Le ${SIM.date(S, fin)} à ${h(fin)}, lecture faite par ${gA.w("lui-même", "elle-même")} de la déclaration ci-dessus, ${gA.il} y persiste et n'a rien à y changer, à y ajouter ou à y retrancher${S.x.refusSigne ? ". Refuse de signer" : ""}.`,
      sigs: [{ role: "La personne gardée à vue", nom: nomP(A), etat: S.x.refusSigne ? "refus" : "signe" }].concat(a.audition.avocat ? [{ role: "L'avocat", nom: AV.joueur ? "" : AV.nom, etat: AV.joueur ? "vide" : "signe" }] : []).concat([sigOPJ(OPJ)]), piedSig: ["La personne gardée à vue", "L'officier de police judiciaire"] });
  };

  // --- prolongation
  T.prolongation = function (C) {
    const { S, a, P, h } = C, { A, PQ } = P, gA = gram(A);
    const blocs = [
      { k: "entete", lignes: [`COUR D'APPEL DE ${MAJ(S.lieu.tj.ville === "Paris" ? "Paris" : S.lieu.tj.dep === "92" ? "Versailles" : "Paris")}`, MAJ(S.lieu.tj.tj), "PARQUET DU PROCUREUR DE LA RÉPUBLIQUE"], droite: [`N° de procédure : ${S.proc}`] },
      { k: "titre", t: "Autorisation de prolongation de garde à vue" },
      C.p(`Nous, ${PQ.civ === "Mme" ? "Madame" : "Monsieur"} ${nomP(PQ)}, ${PQ.qual} près le ${S.lieu.tj.tj.replace(/^T/, "t")},`),
      C.p("Vu l'article 63 du code de procédure pénale ;"),
      C.p(`Vu la procédure suivie en flagrant délit contre ${nomP(A)}, né${gA.e} ${A.naissance}, placé${gA.e} en garde à vue le ${SIM.date(S, a.notif.effet)} à ${h(a.notif.effet)} ;`),
      C.p(`Vu la demande de l'officier de police judiciaire et les observations de la personne, ${a.prolong.visio ? "entendue par un moyen de télécommunication audiovisuelle" : "qui nous a été présentée"} ;`),
      C.p("Attendu que l'infraction est punie d'une peine d'emprisonnement supérieure ou égale à un an ; que la prolongation de la mesure est l'unique moyen de permettre l'exécution des investigations restant à accomplir, notamment l'examen de la victime par l'unité médico-judiciaire et la présentation de la personne devant nous ;"),
      C.p(`AUTORISONS la prolongation de la garde à vue de ${nomP(A)} pour une durée de vingt-quatre heures à compter de l'expiration du délai initial.`, { cls: "dispositif" }),
      C.p(`Fait au parquet, le ${SIM.date(S, a.prolong.m)} à ${h(a.prolong.m)}.`, { cls: "droite", ref: ["prolongation"] }),
      { k: "sig", cases: [{ role: "Le procureur de la République", nom: nomP(PQ), etat: "signe", tampon: "Parquet de " + S.lieu.tj.ville }] },
    ];
    return { titre: "Autorisation de prolongation de garde à vue", forme: "parquet", m: a.prolong.m, par: "PQ", blocs };
  };

  // --- bulletin n° 1
  T.casier = function (C) {
    const { S, P } = C, A = P.A, gA = gram(A), lignes = S.casier;
    const blocs = [
      { k: "entete", lignes: ["MINISTÈRE DE LA JUSTICE", "CASIER JUDICIAIRE NATIONAL", "44317 NANTES CEDEX 3"], droite: [`Demande du ${SIM.date(S, C.a.casier.m)}`] },
      { k: "titre", t: "Bulletin n° 1" },
      C.p("Relevé intégral des fiches du casier judiciaire, délivré à l'autorité judiciaire (article 774 du code de procédure pénale).", { cls: "centre" }),
      { k: "grille", rows: [["Nom", MAJ(A.nom)], ["Prénom", A.prenom], ["Né" + gA.e, A.naissance], ["Sexe", A.g === "f" ? "féminin" : "masculin"]] },
      lignes.length ? { k: "table", head: ["N°", "Condamnation"], rows: lignes.map((l, i) => [String(i + 1), l]) } : { k: "titre", t: "NÉANT" },
      C.p(lignes.length ? "Fin du relevé." : "Aucune condamnation ne figure au casier judiciaire de cette personne.", { cls: "centre" }),
    ];
    return { titre: "Bulletin n° 1 du casier judiciaire", forme: "formulaire", m: C.a.casier.m, par: "OPJ", blocs, sansHeure: true };
  };

  // --- déroulement et fin de garde à vue (article 64)
  T.deroulement = function (C) {
    const { S, a, P, h } = C, { A } = P, gA = gram(A);
    const ev = [];
    const add = (m, quoi, fin) => ev.push({ m, quoi, fin });
    add(a.notif.effet, "Début de la mesure (interpellation)");
    add(a.notif.m, "Notification du placement et des droits");
    add(a.avis.m, "Avis au procureur de la République");
    add(a.avisAvocat.m, "Appel à la permanence des avocats");
    if (a.avisProche) add(a.avisProche.m, "Avis au proche désigné");
    if (a.examen) add(a.examen.m, "Examen médical", a.examen.fin);
    add(a.entretien.m, "Entretien avec l'avocat", a.entretien.fin);
    add(a.audition.m, "Audition", a.audition.fin);
    for (const x of S.repas) add(x.m, x.pris ? "Repas chaud, pris" : "Repas proposé, refusé");
    if (a.prolong) add(a.prolong.m, "Notification de la prolongation autorisée par le procureur de la République");
    add(a.fin.m, "Fin de la mesure");
    ev.sort((x, y) => x.m - y.m);
    const rows = ev.map((e) => [`${SIM.date(S, e.m, "num")} ${h(e.m, "h")}${e.fin ? ` à ${h(e.fin, "h")}` : ""}`, e.quoi + (e.fin ? ` (${SIM.duree(e.fin - e.m)})` : "")]);
    const corps = [
      C.p(`Mettons fin, sur instructions du procureur de la République, à la garde à vue de ${nomP(A)}, et relatons le déroulement de la mesure, conformément à l'article 64 du code de procédure pénale.`, { ref: ["fin_gav"] }),
      { k: "table", head: ["Date et heure", "Opération"], rows },
      C.p(`Durée totale de l'audition : ${SIM.duree(a.audition.fin - a.audition.m)}. Le reste du temps, l'intéressé${gA.e} a été placé${gA.e} au repos en chambre de sûreté. ${gA.Il} n'a fait l'objet d'aucune fouille intégrale ni d'aucune investigation corporelle interne.`),
      C.p(`Durée totale de la mesure : ${SIM.duree(a.fin.m - a.notif.effet)}.`),
      C.p(S.voie === "ci" ? `À l'issue, l'intéressé${gA.e} est conduit${gA.e} sous escorte devant le procureur de la République près le ${S.lieu.tj.tj.replace(/^T/, "t")}, conformément à ses instructions.` : S.voie === "copj" ? `À l'issue, l'intéressé${gA.e} est remis${gA.e} en liberté après s'être vu remettre une convocation devant le tribunal correctionnel. Ses effets lui sont restitués.` : `À l'issue, l'intéressé${gA.e} est remis${gA.e} en liberté, la procédure étant transmise au parquet pour suite à donner. Ses effets lui sont restitués.`),
    ];
    return pv(C, { par: "OPJ", m: a.fin.m, titre: "Procès-verbal de déroulement et de fin de garde à vue", qualite: "PERSONNE GARDÉE À VUE", corps,
      cloture: `Lecture faite, l'intéressé${gA.e} ${S.x.refusSigne ? "refuse d'émarger les mentions ci-dessus" : "émarge les mentions ci-dessus et signe avec nous"}.`,
      sigs: [{ role: "La personne gardée à vue", nom: nomP(A), etat: S.x.refusSigne ? "refus" : "signe" }, sigOPJ(P.OPJ)] });
  };

  // --- synthèse
  T.synthese = function (C, cotes) {
    const { S, a, P, h } = C, { A, V } = P, gA = gram(A), gV = gram(V), v = S.verite, f = S.t.f, st = S.t.stance;
    const co = (id) => (cotes && cotes[id] ? ` (${cotes[id]})` : "");
    const corps = [
      C.st("Préambule"),
      C.p(`La présente procédure, diligentée en flagrant délit, concerne des faits de violences volontaires${f.agg.length ? " aggravées" : ""} commis le ${SIM.date(S, S.T0)} ${C.vers(S.T0)}, ${S.lieu.ou}, au préjudice de ${civ(V)}.`),
      C.st("Exposé des faits"),
      C.p(`Requis à ${h(a.appel.m)}, l'équipage ${S.x.indicatif} constate sur place la présence de la victime, blessée, ${a.designation ? `qui désigne son agresseur. ${nomP(A)} est interpellé${gA.e} à ${h(a.interp.m)} à proximité des lieux` : `puis procède, à ${h(a.interp.m)}, au contrôle de ${nomP(A)}, que la victime reconnaît`}${co("saisine")}.`),
      C.st("Enquête"),
    ];
    const L = [];
    L.push(`Placement en garde à vue et notification des droits${co("notification")} ; avis à magistrat${co("avis_parquet")}.`);
    if (a.plainte) L.push(`Plainte de ${civ(V)}, qui déclare avoir reçu ${v.coups.length + (v.vExagere ? 2 : 0) > 1 ? "plusieurs coups" : "un coup"}${v.role2 === "tient" ? ` alors qu'un second individu ${gV.le} maintenait` : ""}${co("plainte")}.`);
    L.push(`Certificat médical initial : ${f.itt ? `incapacité totale de travail de ${f.itt} jour${f.itt > 1 ? "s" : ""}` : "pas d'incapacité totale de travail"}${co("certificat_urg")}.`);
    if (a.umj) L.push(`Certificat de l'unité médico-judiciaire sur réquisition${co("umj")}.`);
    if (a.temoin) L.push(`Audition d'un témoin, qui confirme ${v.coups.length > 1 ? "les coups" : "le coup"} porté${v.coups.length > 1 ? "s" : ""} à la victime${co("aud_temoin")}.`);
    if (a.video) L.push(`Exploitation de la vidéoprotection : la scène est filmée${S.cam.visage || S.cam.affirme ? ` et ${nomP(A)} y est reconnu${gA.e}` : ""}${co("video")}.`);
    if (a.scelle) L.push(`Saisie de ${a.scelle.objet}, placé sous scellé${co("fouille")}.`);
    L.push(`Audition de ${nomP(A)}, qui ${st === "reconnait" ? "reconnaît les faits" : st === "minimise" ? "reconnaît un geste unique et conteste le surplus" : "conteste les faits"}${co("audition")}.`);
    L.push(`Bulletin n° 1 : ${S.t.ant || A.casier ? "porte mention d'une condamnation" : "néant"}${co("casier")}.`);
    corps.push({ k: "liste", items: L });
    corps.push(C.st("Clôture"));
    corps.push(C.p(`De l'enquête effectuée, il ressort qu'il existe une ou plusieurs raisons plausibles de présumer que l'infraction de violences volontaires${f.agg.length ? " aggravées" : ""} a été commise par ${nomP(A)} et peut être retenue à son encontre.`));
    corps.push(C.p(`Avisé à ${h(a.compteRendu.m)} du résultat de nos investigations, le magistrat de permanence nous prescrit ${S.voie === "ci" ? `de mettre fin à la mesure et de lui présenter l'intéressé${gA.e}` : S.voie === "copj" ? `de remettre à l'intéressé${gA.e} une convocation en justice et de mettre fin à la mesure` : "de mettre fin à la mesure et de lui transmettre la procédure"}.`, { ref: ["compte_rendu"] }));
    corps.push(C.p("En conséquence, faisons parvenir au magistrat la présente procédure, constituée en double exemplaire, tel que le détail en figure au bordereau d'envoi."));
    return pv(C, { par: "OPJ", m: a.synthese.m, titre: "Procès-verbal de synthèse", corps, cloture: "Dont procès-verbal." });
  };

  // --- enquête sociale rapide (comparution immédiate)
  T.esr = function (C) {
    const { S, a, P } = C, A = P.A, gA = gram(A), e = S.x.esr;
    const blocs = [
      { k: "entete", lignes: [MAJ(e.assoc.replace(/^l'|^le /, "")), `Permanence du ${S.lieu.tj.tj.replace(/^T/, "t")}`], droite: [`Le ${SIM.date(S, a.comparution.m)}`] },
      { k: "titre", t: "Enquête sociale rapide" },
      C.p(`(article 41 du code de procédure pénale) — Parquet n° ${S.proc}`, { cls: "centre" }),
      C.p(`Entretien réalisé ce jour au dépôt avec ${nomP(A)}, né${gA.e} ${A.naissance}, avant sa présentation au procureur de la République. Les éléments ci-dessous reposent sur ses déclarations ; les vérifications faites sont indiquées.`),
      C.st("Situation familiale et logement"),
      C.p(`${A.enfants ? `${CR.cap(enLettres(A.enfants))} enfant${A.enfants > 1 ? "s" : ""} à charge.` : "Sans enfant à charge."} ${A.heberg ? "Se dit hébergé" + gA.e : "Se dit locataire"} au ${A.adresse}. ${e.logement ? `Vérification : ${A.proche ? A.proche.replace(/^sa /, "la ").replace(/^son /, "le ").replace(/^un /, "le ").replace(/^une /, "la ") : "un proche"}, joint${/^(sa|une) /.test(A.proche || "") ? "e" : ""} par téléphone, confirme l'adresse.` : "Vérification : personne n'a pu être joint au numéro communiqué."}`),
      C.st("Situation professionnelle et ressources"),
      C.p(A.emploi ? `Déclare travailler comme ${A.metier} pour un revenu de ${CR.num(Math.round((A.revenu || 1500) / 50) * 50)} euros par mois environ. ${e.emploi ? "Vérification : l'employeur, joint par téléphone, confirme l'emploi." : "Vérification : l'employeur n'a pu être joint ; aucun justificatif présenté."}` : `Déclare être sans emploi.${A.revenu ? ` Ressources déclarées : ${CR.num(Math.round(A.revenu / 50) * 50)} euros par mois environ.` : " Sans ressources déclarées."} Aucun justificatif présenté.`),
      C.st("Santé"),
      C.p(S.t.f.agg.includes("ivresse") ? "Évoque une consommation d'alcool régulière, sans suivi. Se dit prêt" + gA.e + " à rencontrer un service spécialisé." : "Ne signale ni traitement ni suivi."),
      C.st("Observations"),
      C.p(`${e.logement ? "L'adresse est vérifiée" : "L'adresse n'a pu être vérifiée"}${A.emploi ? (e.emploi ? " ; l'emploi l'est également." : " ; l'emploi ne l'est pas.") : "."} En cas de renvoi de l'affaire, un contrôle judiciaire ${e.logement ? "paraît envisageable à l'adresse déclarée" : "supposerait la production d'un justificatif de domicile"}.`),
      { k: "sig", cases: [{ role: "L'enquêteur social", nom: "", etat: "signe" }] },
    ];
    return { titre: "Enquête sociale rapide", forme: "formulaire", m: a.comparution.m, par: "ESR", blocs, sansHeure: true };
  };

  // --- comparution devant le procureur (comparution immédiate) ou convocation par officier de police judiciaire
  T.comparution = function (C) {
    const { S, a, P, h } = C, { A, PQ } = P, gA = gram(A), st = S.t.stance;
    const blocs = [
      { k: "entete", lignes: [MAJ(S.lieu.tj.tj), "PARQUET DU PROCUREUR DE LA RÉPUBLIQUE"], droite: [`N° parquet : ${S.proc}`] },
      { k: "titre", t: "Procès-verbal de comparution" },
      C.p("(articles 393 à 395 du code de procédure pénale)", { cls: "centre" }),
      C.p(`${C.DH(a.comparution.m)}, devant nous, ${PQ.civ === "Mme" ? "Madame" : "Monsieur"} ${nomP(PQ)}, ${PQ.qual} près le ${S.lieu.tj.tj.replace(/^T/, "t")}, a comparu la personne déférée ci-après dénommée :`, { ref: ["comparution"] }),
      identite(A, S),
      C.p(`Après avoir constaté son identité, lui avons fait connaître les faits qui lui sont reprochés ainsi que leur qualification juridique :`),
      C.p(`${prevention(S)}, faits prévus et réprimés par ${artLong(S.t.q.art)}.`, { cls: "prevention" }),
      C.p(`L'avons informé${gA.e} de son droit à l'assistance d'un avocat de son choix ou commis d'office, de son droit d'être assisté${gA.e} par un interprète, ainsi que de son droit de faire des déclarations, de répondre aux questions qui lui sont posées ou de se taire. L'avocat de permanence, avisé sans délai, a pu consulter le dossier et communiquer librement avec ${gA.soi}.`),
      C.p(`La personne déclare : « ${st === "reconnait" ? "Je reconnais les faits. Je regrette." : st === "minimise" ? "Je reconnais une gifle. Le reste, non." : "Je conteste. Je n'ai frappé personne."} »`),
      C.p(`L'avocat, entendu en ses observations, s'en rapporte.`),
      C.p(`Lui notifions qu'${gA.il} est traduit${gA.e} ce jour devant le tribunal correctionnel selon la procédure de comparution immédiate, à l'audience de ${h(S.x.audCI)}, les charges réunies paraissant suffisantes et l'affaire étant en état d'être jugée. ${gA.Il} est retenu${gA.e} jusqu'à sa comparution.`, { cls: "dispositif" }),
      { k: "sig", cases: [{ role: "La personne déférée", nom: nomP(A), etat: S.x.refusSigne ? "refus" : "signe" }, { role: "Le procureur de la République", nom: nomP(PQ), etat: "signe", tampon: "Parquet de " + S.lieu.tj.ville }] },
    ];
    return { titre: "Procès-verbal de comparution devant le procureur de la République", forme: "parquet", m: a.comparution.m, par: "PQ", blocs };
  };
  T.copj = function (C) {
    const { S, a, P, h } = C, { A } = P, gA = gram(A);
    const corps = [
      C.p(`Sur instructions de ${P.PQ.civ === "Mme" ? "Madame" : "Monsieur"} le procureur de la République, notifions à ${nomP(A)}, né${gA.e} ${A.naissance}, demeurant ${A.adresse}, qu'${gA.il} est convoqué${gA.e} devant le tribunal correctionnel de ${S.lieu.tj.ville}, à l'audience du ${CR.fmtDate(a.copj.jour, "dow")} à ${h(a.copj.heure)}, pour y être jugé${gA.e} sur les faits suivants :`, { ref: ["copj"] }),
      C.p(`${prevention(S)}, faits prévus et réprimés par ${artLong(S.t.q.art)}.`, { cls: "prevention" }),
      C.p(`L'informons qu'${gA.il} peut se faire assister d'un avocat de son choix ou, s'${gA.il} en fait la demande, d'un avocat commis d'office, dont les frais seront à sa charge sauf s'${gA.il} remplit les conditions d'accès à l'aide juridictionnelle, et qu'${gA.il} a la possibilité de bénéficier de conseils juridiques dans une structure d'accès au droit.`),
      C.p(`L'informons qu'${gA.il} doit comparaître à l'audience en possession des justificatifs de ses revenus ainsi que de ses avis d'imposition ou de non-imposition, et que le droit fixe de procédure peut être majoré s'${gA.il} ne comparaît pas.`),
      C.p("La présente convocation vaut citation à personne."),
    ];
    return pv(C, { par: "OPJ", m: a.copj.m, titre: "Convocation en justice par officier de police judiciaire", vu: "Vu l'article 390-1 du code de procédure pénale,", corps,
      cloture: `Copie de la présente est remise à l'intéressé${gA.e}, qui ${S.x.refusSigne ? "refuse de signer" : "signe avec nous"}.`, sigs: [{ role: "La personne convoquée", nom: nomP(A), etat: S.x.refusSigne ? "refus" : "signe" }, sigOPJ(P.OPJ)] });
  };

  // ------------------------------------------------------------------ Le dossier : liste, cotes, composition
  // ordre du dossier : celui des opérations ; la déclaration des droits est annexée à la notification
  DOCS.liste = function (S) {
    const a = S.a, L = [];
    const add = (id, m, o) => L.push(Object.assign({ id, m }, o || {}));
    add("saisine", a.arrPoste.m);
    add("notification", a.notif.m, { acces: true });
    add("droits", a.notif.m + 0.1, { annexe: "notification" });
    add("avis_parquet", a.avis.m);
    add("diligences", a.avisAvocat.m);
    add("fouille", a.fouille.m);
    if (a.reqMed) { add("req_medecin", a.reqMed.m); add("certificat_gav", a.examen.m, { acces: true }); }
    add("certificat_urg", a.urgences.m);
    if (a.plainte) add("plainte", a.plainte.m);
    if (a.temoin) add("aud_temoin", a.temoin.m);
    if (a.reqVideo) { add("req_video", a.reqVideo.m); add("video", a.video.m); }
    add("audition", a.audition.m, { acces: true });
    add("casier", a.casier.m);
    if (a.prolong) add("prolongation", a.prolong.m);
    if (a.umj) add("umj", a.umj.m);
    add("synthese", a.synthese.m);
    if (a.copj) add("copj", a.copj.m);
    add("deroulement", a.fin.m);
    if (a.comparution) { add("esr", a.comparution.m - 1); add("comparution", a.comparution.m); }
    L.sort((x, y) => x.m - y.m);
    let n = 0;
    for (const x of L) { if (x.annexe) { const p = L.find((y) => y.id === x.annexe); x.cote = `${p.cote}/1`; } else x.cote = "D" + ++n; }
    return L;
  };
  const cacheD = {};
  DOCS.composer = function (S, id) {
    const k = S.sig + "|" + id;
    if (cacheD[k] && cacheD[k].S === S) return cacheD[k].doc;
    const L = DOCS.liste(S), e = L.find((x) => x.id === id);
    if (!e) return null;
    const C = contexte(S, id);
    const cotes = {}; for (const x of L) cotes[x.id] = x.cote;
    const d = T[id](C, cotes);
    const doc = Object.assign(d, { id, trame: id, cote: e.cote, acces: !!e.acces, horsSim: C.doc.horsSim, heures: C.doc.heures });
    for (const b of doc.blocs) if (b.k === "bandeau") b.grille["N° pièce"] = e.cote;
    doc.mots = DOCS.mots(doc);
    doc.feuillets = paginer(doc);
    cacheD[k] = { S, doc };
    return doc;
  };
  // le bordereau : composé en dernier, il compte les feuillets de chaque pièce
  DOCS.bordereau = function (S) {
    const L = DOCS.liste(S), C = contexte(S, "bordereau");
    const rows = L.map((e) => { const d = DOCS.composer(S, e.id); return [e.cote, d.titre, SIM.date(S, d.m, "num"), String(d.feuillets.length)]; });
    const blocs = [
      { k: "entete", lignes: [service(S)], droite: [`Procédure n° ${S.proc}`] },
      { k: "titre", t: "Bordereau d'envoi" },
      C.p(`Transmis à ${S.P.PQ.civ === "Mme" ? "Madame" : "Monsieur"} le procureur de la République près le ${S.lieu.tj.tj.replace(/^T/, "t")}.`, { cls: "centre" }),
      C.p(`Affaire contre ${nomP(S.P.A)} — violences volontaires${S.t.f.agg.length ? " aggravées" : ""} — faits du ${SIM.date(S, S.T0)}.`, { cls: "centre" }),
      { k: "table", head: ["Cote", "Nature de la pièce", "Date", "Feuillets"], rows },
      C.p(`Soit ${rows.length} pièces et ${rows.reduce((n, x) => n + +x[3], 0)} feuillets.${S.a.scelle ? " Scellé joint : un." : " Sans scellé."}`),
      { k: "sig", cases: [sigOPJ(S.P.OPJ)] },
    ];
    const doc = { id: "bordereau", trame: "bordereau", cote: "", titre: "Bordereau d'envoi", forme: "formulaire", m: S.a.fin.m, par: "OPJ", blocs, horsSim: [], heures: [], sansHeure: true };
    doc.mots = DOCS.mots(doc); doc.feuillets = paginer(doc);
    return doc;
  };
  DOCS.dossier = (S) => [DOCS.bordereau(S)].concat(DOCS.liste(S).map((e) => DOCS.composer(S, e.id)));
  // ce que l'avocat peut consulter pendant la garde à vue (article 63-4-1) : notification, certificat médical, auditions
  DOCS.consultables = (S, m) => DOCS.liste(S).filter((e) => e.acces && e.m <= m).map((e) => DOCS.composer(S, e.id));

  // ------------------------------------------------------------------ Texte, mots, feuillets
  const texteBloc = (b) => {
    switch (b.k) {
      case "bandeau": return [b.service, b.cadre, b.titre, b.qualite].filter(Boolean).join("\n");
      case "entete": return b.lignes.concat(b.droite || []).join("\n");
      case "qr": return `Question : ${b.q}\nRéponse : ${b.r}`;
      case "grille": return b.rows.map((x) => x.join(" : ")).join("\n");
      case "table": return [b.head.join(" | ")].concat(b.rows.map((x) => x.join(" | "))).join("\n");
      case "liste": return b.items.join("\n");
      case "sig": return b.cases.map((c) => `${c.role}${c.nom ? " : " + c.nom : ""}${c.etat === "refus" ? " (refuse de signer)" : ""}`).join("\n");
      case "image": return b.legende || "";
      default: return b.t || "";
    }
  };
  DOCS.texte = (doc) => doc.blocs.map(texteBloc).join("\n");
  DOCS.motsBlocs = (blocs) => ((blocs || []).map(texteBloc).join("\n").match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
  DOCS.mots = (doc) => (DOCS.texte(doc).match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
  DOCS.minutes = (doc) => Math.max(1, Math.round(doc.mots / 200)); // lecture d'un texte juridique dense
  // hauteur d'un bloc en lignes d'un feuillet (86 caractères par ligne en corps courant)
  const L = (txt, cpl) => Math.max(1, Math.ceil(String(txt).length / cpl));
  function lignes(b) {
    switch (b.k) {
      case "bandeau": return 8.2;
      case "entete": return Math.max(b.lignes.length, (b.droite || []).length) + 2;
      case "titre": return L(b.t, CPL * 0.52) * 1.5 + 1.7;
      case "stitre": return 2.4;
      case "qr": return L("QUESTION : " + b.q + " -----", CPL) + L("RÉPONSE : " + b.r + " -----", CPL) + 1.1;
      case "grille": return b.rows.reduce((n, x) => n + L(x[1], CPL * 0.66) * 1.18, 0) + 1.2;
      case "table": return b.rows.reduce((n, x) => n + Math.max(...x.map((c, i) => L(c, x.length > 2 ? (i === 1 ? CPL * 0.5 : CPL * 0.15) : i ? CPL * 0.66 : CPL * 0.3))) * 1.22, 0) + 2.8;
      case "liste": return b.items.reduce((n, x) => n + L(x, CPL - 4) + 0.25, 0) + 0.9;
      case "sig": return 8.2;
      case "image": return b.spec && b.spec.type === "schema" ? 15.5 : 20.5;
      default: return L(b.t + (b.cls === "decl" ? " ------------" : ""), b.cls === "decl" ? CPL - 4 : b.cls === "petit" ? CPL * 1.2 : b.cls === "mention" || b.cls === "prevention" ? CPL - 5 : CPL) + (b.cls === "petit" ? 0.5 : b.cls === "cloture" ? 1.9 : 0.75);
    }
  }
  function paginer(doc) {
    const pied = doc.piedSig ? 3 : 0, cap = DOCS.LIGNES - pied, pages = [[]];
    let n = 0;
    for (const b of doc.blocs) {
      const hb = lignes(b);
      if (n + hb > cap && pages[pages.length - 1].length) {
        // les signatures ne partent jamais seules : la formule de clôture les suit
        const prec = pages[pages.length - 1], der = prec[prec.length - 1];
        pages.push([]); n = doc.forme === "pv" ? 2.6 : 0;
        if (b.k === "sig" && der && der.k === "p" && prec.length > 1) { prec.pop(); pages[pages.length - 1].push(der); n += lignes(der); }
      }
      pages[pages.length - 1].push(b); n += hb;
    }
    return pages;
  }
  DOCS.lignes = lignes;

  // ------------------------------------------------------------------ Contrôle (tests) : structure d'une trame
  DOCS.STRUCTURE = {
    pv: (d) => d.blocs[0].k === "bandeau" && d.blocs.some((b) => b.k === "sig") && /Nous, /.test(DOCS.texte(d)),
    certificat: (d) => d.blocs[0].k === "entete" && d.blocs.some((b) => b.k === "sig") && /certifie avoir examiné/.test(DOCS.texte(d)),
    parquet: (d) => d.blocs[0].k === "entete" && d.blocs.some((b) => b.k === "sig"),
    formulaire: (d) => d.blocs.some((b) => b.k === "titre"),
  };
})();
