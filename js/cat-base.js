/* La Permanence — catalogue des infractions (moteur génératif, phase 1) : le socle.
   Chaque infraction du catalogue (cat-personnes.js, cat-biens.js, cat-route.js) décrit son texte d'incrimination et de peine,
   ses éléments constitutifs, ses circonstances aggravantes, la peine encourue, la prescription, la juridiction, les procédures
   possibles et les preuves typiques ; elle sait tirer des faits cohérents (tirer) et les qualifier (qual).
   Le moteur (gen-moteur.js) s'en sert pour qualifier, calculer les délais, choisir le tribunal et le juge.
   Tout est rédigé hors ligne d'après le document de conception : chaque texte est à revérifier sur Légifrance.
   Niveau de contenu : un réglage du générateur (CR.CONTENU) ; seul « réaliste » existe pour l'instant ; les textes crus passent
   par le lexique (CAT.lex), qu'un mode adouci pourra remplacer sans réécrire les affaires. */
(function () {
  const CR = window.CR;
  const VERIF = "Catalogue rédigé pour le jeu (octobre 2026), points sensibles vérifiés en ligne le 10 novembre 2026 — à relire sur Légifrance avant tout usage réel";
  const CAT = (CR.CAT = { VERIF, INF: {}, ORDRE: [] });

  // ------------------------------------------------------------------ Niveau de contenu
  CR.CONTENU = {
    realiste: { label: "Réaliste", sub: "Les faits sont décrits comme dans un vrai dossier pénal, mots crus compris. Violences sexuelles : description clinique ; mineurs victimes d'infractions sexuelles : procédure seulement.", actif: true },
    // adouci : { label: "Adouci", actif: false } — à venir ; il ne remplacera que le lexique et les passages marqués.
  };
  CR.contenu = (s) => { const n = s && s.settings && s.settings.contenu; return CR.CONTENU[n] && CR.CONTENU[n].actif ? n : "realiste"; };
  CAT.LEX = {
    realiste: {
      ins_m: ["fils de pute", "enculé", "connard", "bâtard", "sale merde", "pédé", "trou du cul", "petite bite"],
      ins_f: ["sale pute", "salope", "connasse", "grosse pute", "sale chienne", "pétasse"],
      ins_flic: ["sale flic", "bande d'enculés", "poulets de merde", "nique la police", "fils de pute de keufs", "bâtards"],
      menace: ["je vais te crever", "je vais te tuer", "je vais te planter", "t'es mort", "je vais te défoncer la gueule", "je vais te saigner", "je connais ton adresse, je vais venir"],
      juron: ["putain", "bordel", "merde", "ta gueule", "va te faire foutre", "casse-toi"],
    },
  };
  // Une entrée du lexique (k) pour le niveau de contenu de l'affaire ; à défaut, le niveau réaliste
  CAT.lex = (niveau, k, r) => { const L = (CAT.LEX[niveau] || {})[k] || CAT.LEX.realiste[k] || [""]; return L[Math.floor((r ? r() : 0) * L.length)]; };

  // ------------------------------------------------------------------ Familles
  CAT.FAMILLES = {
    personnes: "Atteintes aux personnes", biens: "Atteintes aux biens", stups: "Stupéfiants", route: "Circulation routière",
    autorite: "Atteintes à l'autorité", affaires: "Droit pénal des affaires", numerique: "Infractions numériques",
    // phase 2 : les crimes (et les délits qu'on instruit avec eux), tirés seulement pour les informations judiciaires
    crim_personnes: "Atteintes volontaires à la vie", crim_sexuel: "Violences sexuelles", crim_biens: "Vols à main armée, séquestrations, incendies", crim_stups: "Trafic de stupéfiants en bande organisée",
  };

  // ------------------------------------------------------------------ Circonstances aggravantes (libellé court, prévention)
  CAT.AGG = {
    reunion: { label: "en réunion", prev: "avec cette circonstance que les faits ont été commis par plusieurs personnes agissant en qualité d'auteur ou de complice" },
    arme: { label: "avec usage ou menace d'une arme", prev: "avec cette circonstance que les faits ont été commis avec usage ou menace d'une arme" },
    ivresse: { label: "en état d'ivresse manifeste", prev: "avec cette circonstance que les faits ont été commis par une personne agissant en état d'ivresse manifeste" },
    stupefiants: { label: "sous l'emprise manifeste de stupéfiants", prev: "avec cette circonstance que les faits ont été commis par une personne agissant sous l'emprise manifeste de produits stupéfiants" },
    transport: { label: "dans un transport collectif", prev: "avec cette circonstance que les faits ont été commis dans un véhicule affecté au transport collectif de voyageurs ou dans un lieu destiné à l'accès à un tel moyen de transport" },
    vulnerable: { label: "sur une personne vulnérable", prev: "avec cette circonstance que les faits ont été commis sur une personne dont la particulière vulnérabilité, due à son âge, était apparente ou connue de son auteur" },
    conjoint: { label: "par le conjoint, concubin ou partenaire", prev: "avec cette circonstance que les faits ont été commis par le conjoint, le concubin ou le partenaire lié à la victime par un pacte civil de solidarité (art. 132-80 du code pénal)" },
    ex_conjoint: { label: "par l'ancien conjoint, concubin ou partenaire", prev: "avec cette circonstance que les faits ont été commis par l'ancien concubin de la victime, en raison des relations ayant existé entre eux (art. 132-80 du code pénal)" },
    mineur_present: { label: "en présence d'un mineur", prev: "avec cette circonstance que les faits ont été commis en présence d'un mineur" },
    pdap: { label: "sur une personne dépositaire de l'autorité publique", prev: "avec cette circonstance que la victime est une personne dépositaire de l'autorité publique, dans l'exercice de ses fonctions, sa qualité étant apparente et connue de l'auteur" },
    msp: { label: "sur une personne chargée d'une mission de service public", prev: "avec cette circonstance que la victime est chargée d'une mission de service public, dans l'exercice de ses fonctions, sa qualité étant apparente et connue de l'auteur" },
    premeditation: { label: "avec préméditation ou guet-apens", prev: "avec cette circonstance que les faits ont été commis avec préméditation ou avec guet-apens" },
    dissimulation: { label: "visage dissimulé", prev: "avec cette circonstance que les faits ont été commis par une personne dissimulant volontairement en tout ou partie son visage afin de ne pas être identifiée" },
    local_habitation: { label: "dans un local d'habitation, par effraction", prev: "avec cette circonstance que les faits ont été commis dans un local d'habitation, en y pénétrant par effraction" },
    entrepot: { label: "dans un local d'entrepôt, par effraction", prev: "avec cette circonstance que les faits ont été commis dans un lieu destiné à l'entrepôt de marchandises, en y pénétrant par effraction" },
    violence0: { label: "accompagné de violences sans ITT", prev: "avec cette circonstance que le vol a été accompagné de violences sur autrui n'ayant pas entraîné d'incapacité totale de travail" },
    en_ligne: { label: "par un service de communication en ligne", prev: "avec cette circonstance que les faits ont été commis par l'utilisation d'un service de communication au public en ligne ou par le biais d'un support numérique ou électronique" },
    abus_autorite: { label: "par abus de l'autorité conférée par les fonctions", prev: "avec cette circonstance que les faits ont été commis par une personne qui abuse de l'autorité que lui confèrent ses fonctions" },
    qualite_usurpee: { label: "en usurpant une qualité", prev: "avec cette circonstance que les faits ont été commis par une personne prenant indûment la qualité d'une personne chargée d'une mission de service public" },
    itt8: { label: "ITT de plus de huit jours", prev: "avec cette circonstance que les faits ont causé une incapacité totale de travail supérieure à huit jours" },
    habitude: { label: "de façon habituelle", prev: "avec cette circonstance que les faits ont été commis de façon habituelle" },
    // circonstances de la route (homicide et blessures routiers, loi du 9 juillet 2025)
    r_alcool: { label: "en état alcoolique", prev: "le conducteur se trouvant en état alcoolique caractérisé par une concentration d'alcool supérieure au seuil légal" },
    r_stups: { label: "après usage de stupéfiants", prev: "le conducteur ayant fait usage de substances ou plantes classées comme stupéfiants" },
    r_vitesse: { label: "grand excès de vitesse", prev: "le conducteur ayant commis un dépassement de la vitesse maximale autorisée égal ou supérieur à 50 km/h" },
    r_permis: { label: "sans permis", prev: "le conducteur n'étant pas titulaire du permis de conduire exigé par la loi" },
    r_fuite: { label: "délit de fuite", prev: "le conducteur, sachant qu'il venait de causer ou d'occasionner un accident, ne s'étant pas arrêté" },
    r_telephone: { label: "téléphone tenu en main", prev: "le conducteur faisant usage d'un téléphone tenu en main" },
    // circonstances des crimes (phase 2)
    mineur15: { label: "sur un mineur de quinze ans", prev: "avec cette circonstance que la victime est un mineur de quinze ans" },
    ascendant: { label: "sur un ascendant", prev: "avec cette circonstance que les faits ont été commis sur un ascendant légitime, naturel ou adoptif" },
    autorite: { label: "par un ascendant ou une personne ayant autorité", prev: "avec cette circonstance que les faits ont été commis par un ascendant ou par toute autre personne ayant sur la victime une autorité de droit ou de fait" },
    bande_organisee: { label: "en bande organisée", prev: "avec cette circonstance que les faits ont été commis en bande organisée (art. 132-71 du code pénal)" },
    drogue_insu: { label: "après administration d'une substance à l'insu de la victime", prev: "avec cette circonstance qu'une substance a été administrée à la victime, à son insu, afin d'altérer son discernement ou le contrôle de ses actes" },
    rencontre_en_ligne: { label: "victime rencontrée par un réseau de communication électronique", prev: "avec cette circonstance que la victime a été mise en contact avec l'auteur des faits grâce à l'utilisation d'un réseau de communication électronique pour la diffusion de messages à destination d'un public non déterminé" },
    plusieurs_victimes: { label: "à l'égard de plusieurs personnes", prev: "avec cette circonstance que les faits ont été commis à l'égard de plusieurs personnes" },
    otage: { label: "pour obtenir une rançon", prev: "avec cette circonstance que la personne a été arrêtée, enlevée, détenue ou séquestrée comme otage pour obtenir l'exécution d'un ordre ou d'une condition, et notamment le versement d'une rançon" },
    racisme: { label: "à raison de l'appartenance, vraie ou supposée, à une religion ou une ethnie", prev: "avec cette circonstance que les faits ont été commis à raison de l'appartenance, vraie ou supposée, de la victime à une ethnie, une nation, une prétendue race ou une religion déterminée (art. 132-76 du code pénal)" },
    temoin_victime: { label: "sur un témoin", prev: "avec cette circonstance que la victime est un témoin, pour l'empêcher de dénoncer les faits ou de témoigner" },
    auteur_pdap: { label: "par une personne dépositaire de l'autorité publique dans l'exercice de ses fonctions", prev: "avec cette circonstance que les faits ont été commis par une personne dépositaire de l'autorité publique dans l'exercice de ses fonctions" },
    tortures: { label: "précédés ou accompagnés d'actes de torture ou de barbarie", prev: "avec cette circonstance que les faits ont été précédés ou accompagnés de tortures ou d'actes de barbarie" },
  };
  CAT.aggLabel = (id) => (CAT.AGG[id] ? CAT.AGG[id].label : id);
  CAT.aggPrev = (id) => (CAT.AGG[id] ? CAT.AGG[id].prev : "");

  // ------------------------------------------------------------------ Contraventions (art. 131-13)
  CAT.CLASSES = { 1: 38, 2: 150, 3: 450, 4: 750, 5: 1500 };
  // Une contravention : { classe, art, label }
  CAT.contrav = (classe, art, label, extra) => Object.assign({ nature: "contravention", classe, prison: 0, amende: CAT.CLASSES[classe], art, label }, extra || {});
  // Un délit : { prison (mois), amende, art, label }
  CAT.delit = (prison, amende, art, label, extra) => Object.assign({ nature: "delit", prison, amende, art, label }, extra || {});
  // Peines par paliers selon le nombre de circonstances : paliers = [[prison, amende, art], …] ; n = 0, 1, 2…
  CAT.palier = (paliers, n) => paliers[Math.max(0, Math.min(paliers.length - 1, n))];

  // ------------------------------------------------------------------ Qualification
  // Retourne la qualification complète d'un jeu de faits : libellé, article, peine encourue, nature, juridiction, prescription.
  CAT.qualifier = function (id, f) {
    const I = CAT.INF[id];
    if (!I) throw new Error("Infraction inconnue du catalogue : " + id);
    const q = I.qual(f || {});
    if (!q) return null;
    const IT = CAT.ficheDe(I, f || {});
    const aggs = (q.aggs || (f && f.agg) || []).filter((a) => CAT.AGG[a]);
    const nature = q.nature || (q.prison > 0 || q.amende > 3000 ? "delit" : "contravention");
    const out = Object.assign({ id, fam: I.fam, nom: IT.nom }, q, {
      aggs, nature,
      jur: nature === "contravention" ? "tp" : nature === "crime" ? "assises" : "tc",
      prescAns: q.prescAns || (nature === "contravention" ? 1 : nature === "crime" ? 20 : 6),
      textes: [].concat(q.textes || [], IT.textes || []).filter((x, i, a) => a.indexOf(x) === i),
      recidivable: (nature === "delit" || nature === "crime") && I.recidive !== false,
      source: VERIF,
    });
    out.court = out.court || out.art;
    return out;
  };
  // La réclusion criminelle à perpétuité, en mois (plafond des calculs) ; q.perpetuite le signale
  CAT.PERPETUITE = 1200;
  // Récidive légale : délit, maximum doublé (art. 132-10) ; crime (art. 132-8), quinze ans portés à trente, vingt ou trente ans à la perpétuité
  CAT.avecRecidive = function (q) {
    if (!q || !q.recidivable) return q;
    if (q.nature === "crime") {
      const perp = q.perpetuite || q.prison >= 240;
      return Object.assign({}, q, { prison: perp ? CAT.PERPETUITE : 360, perpetuite: perp || undefined, recidive: true, label: q.label + ", en état de récidive légale", court: q.court + " et 132-8 CP" });
    }
    return Object.assign({}, q, { prison: q.prison * 2, amende: q.amende * 2, recidive: true, label: q.label + ", en état de récidive légale", court: q.court + " et 132-10 CP" });
  };
  // « trois ans d'emprisonnement et 45 000 € d'amende » ; « vingt ans de réclusion criminelle » ; « la réclusion criminelle à perpétuité »
  CAT.encourueTexte = (q) => {
    if (!q) return "";
    if (q.nature === "contravention") return `${CR.money(q.amende)} d'amende (contravention de la ${q.classe}e classe)`;
    if (q.nature === "crime") return (q.perpetuite ? "la réclusion criminelle à perpétuité" : `${CR.fmtMois(q.prison)} de réclusion criminelle`) + (q.amende ? ` et ${CR.money(q.amende)} d'amende` : "");
    return (q.prison ? `${CR.fmtMois(q.prison)} d'emprisonnement et ` : "") + `${CR.money(q.amende)} d'amende`;
  };
  // Un crime (prison en mois de réclusion) : { prison, amende, art, label } ; perpetuite : true pour la perpétuité
  CAT.crime = (prison, amende, art, label, extra) => Object.assign({ nature: "crime", prison: prison === "perpetuite" ? CAT.PERPETUITE : prison, perpetuite: prison === "perpetuite" || undefined, amende: amende || 0, art, label }, extra || {});

  // « art. 311-1 et 311-4 CP » → « les articles 311-1 et 311-4 du code pénal », pour les phrases d'un acte ou d'une audience
  CAT.courtLong = function (court) {
    let s = String(court || "").replace(/\bC\. route\b\.?/g, "du code de la route").replace(/\bC\. com\./g, "du code de commerce").replace(/\bCSI\b/g, "du code de la sécurité intérieure").replace(/\bCP\b/g, "du code pénal");
    s = s.replace(/(\S+) du code pénal et (\S+) du code pénal/g, "$1 et $2 du code pénal");
    return s.replace(/^art\.\s+/, () => (/\set\s/.test(s) ? "les articles " : "l'article "));
  };

  // Élisions et contractions après assemblage des phrases : « de un » → « d'un », « à le » → « au », « de herbe » → « d'herbe »
  const V0 = "aeéèêiîïoôuAEÉÈÊIÎÏOÔU";
  const AV = "(^|[\\s(«“])";
  // « de le faire », « à les croiser » : le pronom devant un infinitif ne se contracte pas
  const INF = "(?!(?:faire|refaire|voir|revoir|croiser|recroiser|dire|laisser|rendre|payer|tuer|frapper|prendre|reprendre|rembourser|quitter|retrouver|reconnaître|perdre|rencontrer|appeler|rappeler|contacter|garder|protéger|aider|croire|suivre|attendre|lire|signer|déposer|porter|mettre|remettre|tenir|savoir|connaître|regarder|toucher|menacer|calmer|convaincre|défendre|juger|condamner|libérer|sortir|placer|interroger|entendre|écouter|voler|vendre|acheter|cacher|ramener|emmener|chercher|trouver|blesser|insulter|harceler|empêcher|forcer|obliger|pousser|retenir|lâcher|relâcher|soigner|sauver|prévenir|avertir|accuser|dénoncer|couvrir|nourrir|élever|garder)\\b)";
  CAT.typo = (s) => (typeof s !== "string" ? s : s
    .replace(new RegExp(AV + "([dD])e (le|les) " + INF, "g"), (m, a, d, l) => `${a}${d}${l === "le" ? "u" : "es"} `)
    .replace(new RegExp(AV + "([àÀ]) (le|les) " + INF, "g"), (m, a, x, l) => `${a}${x === "À" ? "A" : "a"}${l === "le" ? "u" : "ux"} `)
    .replace(new RegExp(AV + "([dD])e (herbe|héroïne|hydrocarbure|homme|heure|hôpital|huile)", "g"), "$1$2'$3")
    .replace(new RegExp(AV + "([dD])e ([" + V0 + "])", "g"), "$1$2'$3")
    .replace(new RegExp(AV + "([dD])e « ([" + V0 + "])", "g"), "$1$2'« $3")
    .replace(new RegExp(AV + "([qQ])ue (il|elle|ils|elles|on|un|une)(?![\\wéèà])", "g"), "$1$2u'$3")
    .replace(new RegExp(AV + "([lL])e ([aeéèêiîoôuAEÉIOU][\\wéèêàîôûç]+)", "g"), (m, a, l, w) => (/^(un|une|onze|oui|ouate)$/i.test(w) ? m : `${a}${l}'${w}`)));
  CAT.typoDeep = (o) => (typeof o === "string" ? CAT.typo(o) : Array.isArray(o) ? o.map(CAT.typoDeep) : o && typeof o === "object" ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, ["f", "flag", "paire", "id", "piece", "fq", "who", "look"].includes(k) ? v : CAT.typoDeep(v)])) : o);

  // ------------------------------------------------------------------ Procédures possibles (coherence des voies)
  // Garde à vue et audition libre sous contrainte : crime ou délit puni d'emprisonnement (art. 62-2)
  CAT.gavPossible = (q) => !!q && q.nature !== "contravention" && q.prison > 0;
  // Comparution immédiate (art. 395) : délit puni d'au moins deux ans, ou six mois en flagrance ; exclusions de l'art. 397-6
  CAT.ciPossible = (q, flagrance) => !!q && q.nature === "delit" && !CAT.INF[q.id].pasCI && q.prison >= (flagrance ? 6 : 24);
  // Ordonnance pénale délictuelle (art. 495) : la liste des délits du texte ; pas de victime qui demande réparation
  CAT.opPossible = (q) => !!q && q.nature === "delit" && !!CAT.INF[q.id].op && !q.aggs.length && q.prison <= 60;
  // CRPC (art. 495-7 et 495-16) : tout délit, sauf homicides involontaires, délits de presse et politiques,
  // et violences ou menaces punies de plus de cinq ans
  CAT.crpcPossible = (q) => !!q && q.nature === "delit" && !CAT.INF[q.id].pasCRPC && !(CAT.INF[q.id].violences && q.prison > 60);
  // Délai de prescription de l'action publique, à partir du jour de départ
  CAT.prescription = (q, depart) => ({ ans: q.prescAns, depart, expire: CR.addYears ? CR.addYears(depart, q.prescAns) : depart + q.prescAns * 365 });

  // ------------------------------------------------------------------ Réquisitions et peines complémentaires (base)
  // Le parquet requiert en fonction de la gravité, du casier et de la récidive ; le profil du substitut module ensuite (CR.ACT.requis)
  CAT.requisBase = function (q, ctx) {
    ctx = ctx || {};
    const I = CAT.INF[q.id] || {};
    if (q.nature === "contravention") return { amende: Math.max(50, Math.round((q.amende * (0.35 + (ctx.casier ? 0.15 : 0))) / 50) * 50), complementaires: (I.compContrav || []).slice() };
    const max = q.prison;
    const g = I.gravite != null ? I.gravite : 0.4;
    let sursis = Math.max(2, Math.min(24, Math.round(max * (0.06 + g * 0.1))));
    let ferme = 0;
    if (ctx.recidive) ferme = Math.max(2, Math.round(sursis * 0.8));
    else if (ctx.casier && g > 0.45) ferme = Math.max(0, Math.round(sursis * 0.35));
    if (max === 0) sursis = 0;
    const amende = !max || I.amendeRequise ? Math.max(200, Math.round((Math.min(q.amende, ctx.revenus || 20000) * 0.04) / 50) * 50) : 0;
    const out = { ferme, sursis, complementaires: (I.comp ? I.comp(q, ctx) : []) };
    if (amende) out.amende = amende;
    if (ctx.recidive) out.mandatDepot = ferme > 6;
    return out;
  };

  // ------------------------------------------------------------------ Textes ajoutés à la base (règle résumée, à revérifier)
  // Format de CR.TEXTES (texts.js) ; ils deviennent consultables, enregistrables dans un dossier et citables.
  const S = (cite, texte) => ({ cite, texte, etat: "resume", extrait: false, source: VERIF });
  CAT.TEXTES = {
    "CP_222-13": [S("Art. 222-13 du code pénal", "Les violences ayant entraîné une incapacité totale de travail inférieure ou égale à huit jours, ou n'ayant entraîné aucune incapacité, sont punies de trois ans d'emprisonnement et de 45 000 euros d'amende lorsqu'elles sont commises dans l'une des circonstances que le texte énumère (notamment sur une personne vulnérable, sur une personne dépositaire de l'autorité publique, par le conjoint ou concubin, en réunion, avec arme, en état d'ivresse manifeste, dans un transport collectif). Cinq ans et 75 000 euros avec deux circonstances, sept ans et 100 000 euros avec trois."), "Violences aggravées : ITT de huit jours au plus"],
    "CP_R624-1": [S("Art. R. 624-1 du code pénal", "Hors les cas prévus par les articles 222-13 et 222-14, les violences volontaires n'ayant entraîné aucune incapacité totale du travail sont punies de l'amende prévue pour les contraventions de la 4e classe."), "Violences sans ITT : contravention de 4e classe"],
    "CP_132-80": [S("Art. 132-80 du code pénal", "Dans les cas prévus par la loi, les peines encourues pour un crime ou un délit sont aggravées lorsque l'infraction est commise par le conjoint, le concubin ou le partenaire lié à la victime par un pacte civil de solidarité, y compris lorsqu'ils ne cohabitent pas. La circonstance aggravante est également constituée lorsque les faits sont commis par l'ancien conjoint, concubin ou partenaire, en raison des relations ayant existé entre l'auteur et la victime."), "Violences au sein du couple : la circonstance aggravante"],
    "CP_222-18": [S("Art. 222-18 du code pénal", "La menace, par quelque moyen que ce soit, de commettre un crime ou un délit contre les personnes est punie de trois ans d'emprisonnement et de 45 000 euros d'amende lorsqu'elle est faite avec l'ordre de remplir une condition ; cinq ans et 75 000 euros s'il s'agit d'une menace de mort."), "Menaces sous condition"],
    "CP_222-18-3": [S("Art. 222-18-3 du code pénal", "Lorsque les menaces sont commises par le conjoint, le concubin ou le partenaire de la victime, les peines sont portées à deux ans et 30 000 euros pour la menace simple réitérée ou matérialisée, à cinq ans et 75 000 euros pour la menace de mort ou la menace sous condition, à sept ans et 100 000 euros pour la menace de mort sous condition."), "Menaces au sein du couple"],
    "CP_222-16": [S("Art. 222-16 du code pénal", "Les appels téléphoniques malveillants réitérés, les envois réitérés de messages malveillants émis par la voie des communications électroniques ou les agressions sonores en vue de troubler la tranquillité d'autrui sont punis d'un an d'emprisonnement et de 15 000 euros d'amende ; trois ans et 45 000 euros lorsqu'ils sont commis par le conjoint, le concubin ou le partenaire de la victime."), "Appels et messages malveillants"],
    "CP_222-33": [S("Art. 222-33 du code pénal", "Le harcèlement sexuel est le fait d'imposer à une personne, de façon répétée, des propos ou comportements à connotation sexuelle ou sexiste qui portent atteinte à sa dignité en raison de leur caractère dégradant ou humiliant, ou créent à son encontre une situation intimidante, hostile ou offensante ; est assimilé le fait d'user d'une pression grave dans le but d'obtenir un acte de nature sexuelle. Deux ans et 30 000 euros ; trois ans et 45 000 euros dans les circonstances que le texte énumère (abus d'autorité, victime vulnérable, plusieurs auteurs, usage d'un service en ligne…)."), "Le harcèlement sexuel"],
    "CP_222-33-2": [S("Art. 222-33-2 du code pénal", "Le fait de harceler autrui par des propos ou comportements répétés ayant pour objet ou pour effet une dégradation des conditions de travail susceptible de porter atteinte à ses droits et à sa dignité, d'altérer sa santé physique ou mentale ou de compromettre son avenir professionnel est puni de deux ans d'emprisonnement et de 30 000 euros d'amende."), "Le harcèlement moral au travail"],
    "CP_222-33-2-1": [S("Art. 222-33-2-1 du code pénal", "Le fait de harceler son conjoint, son concubin ou son partenaire, ou son ancien conjoint, concubin ou partenaire, par des propos ou comportements répétés ayant pour objet ou pour effet une dégradation de ses conditions de vie se traduisant par une altération de sa santé physique ou mentale est puni de trois ans d'emprisonnement et de 45 000 euros d'amende lorsque ces faits ont causé une incapacité totale de travail de huit jours au plus ou aucune incapacité ; cinq ans et 75 000 euros au-delà de huit jours ou lorsqu'un mineur était présent et y a assisté."), "Le harcèlement au sein du couple"],
    "CP_226-4": [S("Art. 226-4 du code pénal", "L'introduction dans le domicile d'autrui à l'aide de manœuvres, menaces, voies de fait ou contrainte, hors les cas où la loi le permet, est punie de trois ans d'emprisonnement et de 45 000 euros d'amende ; le maintien dans le domicile à la suite de l'introduction est puni des mêmes peines."), "La violation de domicile"],
    "CP_311-3": [S("Art. 311-3 du code pénal", "Le vol est puni de trois ans d'emprisonnement et de 45 000 euros d'amende."), "La peine du vol simple"],
    "CP_311-4": [S("Art. 311-4 du code pénal", "Le vol est puni de cinq ans d'emprisonnement et de 75 000 euros d'amende lorsqu'il est commis dans l'une des circonstances que le texte énumère : notamment par plusieurs personnes, accompagné de violences n'ayant pas entraîné d'incapacité totale de travail, dans un local d'habitation ou d'entrepôt en y pénétrant par ruse, effraction ou escalade, dans un transport collectif de voyageurs, au préjudice d'une personne vulnérable, par une personne dissimulant son visage. Sept ans et 100 000 euros avec deux circonstances, dix ans et 150 000 euros avec trois."), "Le vol aggravé"],
    "CP_311-6": [S("Art. 311-6 du code pénal", "Le vol est puni de dix ans d'emprisonnement et de 150 000 euros d'amende lorsqu'il est précédé, accompagné ou suivi de violences sur autrui ayant entraîné une incapacité totale de travail pendant plus de huit jours."), "Vol avec violences : ITT de plus de huit jours"],
    "CP_321-1": [S("Art. 321-1 du code pénal", "Le recel est le fait de dissimuler, de détenir ou de transmettre une chose, ou de faire office d'intermédiaire afin de la transmettre, en sachant que cette chose provient d'un crime ou d'un délit ; constitue également un recel le fait, en connaissance de cause, de bénéficier, par tout moyen, du produit d'un crime ou d'un délit. Cinq ans d'emprisonnement et 375 000 euros d'amende."), "Le recel"],
    "CP_321-2": [S("Art. 321-2 du code pénal", "Le recel est puni de dix ans d'emprisonnement et de 750 000 euros d'amende lorsqu'il est commis de façon habituelle ou en utilisant les facilités que procure l'exercice d'une activité professionnelle, ou en bande organisée."), "Le recel aggravé"],
    "CP_312-1": [S("Art. 312-1 du code pénal", "L'extorsion est le fait d'obtenir par violence, menace de violences ou contrainte soit une signature, un engagement ou une renonciation, soit la révélation d'un secret, soit la remise de fonds, de valeurs ou d'un bien quelconque. Sept ans d'emprisonnement et 100 000 euros d'amende ; dix ans et 150 000 euros lorsqu'elle est précédée, accompagnée ou suivie de violences ayant entraîné une incapacité totale de travail de huit jours au plus, ou commise au préjudice d'une personne vulnérable (art. 312-2)."), "L'extorsion"],
    "CP_312-10": [S("Art. 312-10 du code pénal", "Le chantage est le fait d'obtenir, en menaçant de révéler ou d'imputer des faits de nature à porter atteinte à l'honneur ou à la considération, soit une signature, un engagement ou une renonciation, soit la révélation d'un secret, soit la remise de fonds, de valeurs ou d'un bien quelconque. Cinq ans d'emprisonnement et 75 000 euros d'amende."), "Le chantage"],
    "CP_322-1": [S("Art. 322-1 du code pénal", "La destruction, la dégradation ou la détérioration d'un bien appartenant à autrui est punie de deux ans d'emprisonnement et de 30 000 euros d'amende, sauf s'il n'en est résulté qu'un dommage léger. Le fait de tracer des inscriptions, signes ou dessins, sans autorisation préalable, sur les façades, les véhicules, les voies publiques ou le mobilier urbain est puni de 3 750 euros d'amende et d'un travail d'intérêt général lorsqu'il n'en est résulté qu'un dommage léger."), "Destructions et dégradations"],
    "CP_322-3": [S("Art. 322-3 du code pénal", "Les peines de l'article 322-1 sont portées à cinq ans d'emprisonnement et 75 000 euros d'amende lorsque l'infraction est commise dans l'une des circonstances que le texte énumère (notamment en réunion, au préjudice d'une personne dépositaire de l'autorité publique, par une personne dissimulant son visage)."), "Dégradations aggravées"],
    "CP_R635-1": [S("Art. R. 635-1 du code pénal", "La destruction, la dégradation ou la détérioration volontaire d'un bien appartenant à autrui dont il n'est résulté qu'un dommage léger est punie de l'amende prévue pour les contraventions de la 5e classe."), "Dégradation légère : contravention de 5e classe"],
    "CP_322-5": [S("Art. 322-5 du code pénal", "La destruction, la dégradation ou la détérioration involontaire d'un bien appartenant à autrui par l'effet d'un incendie provoqué par manquement à une obligation de prudence ou de sécurité imposée par la loi ou le règlement est punie d'un an d'emprisonnement et de 15 000 euros d'amende ; deux ans et 30 000 euros en cas de violation manifestement délibérée."), "Incendie involontaire"],
    "CP_322-6": [S("Art. 322-6 du code pénal", "La destruction, la dégradation ou la détérioration d'un bien appartenant à autrui par l'effet d'une substance explosive, d'un incendie ou de tout autre moyen de nature à créer un danger pour les personnes est punie de dix ans d'emprisonnement et de 150 000 euros d'amende."), "Incendie volontaire"],
    "CP_222-39": [S("Art. 222-39 du code pénal", "La cession ou l'offre illicites de stupéfiants à une personne en vue de sa consommation personnelle sont punies de cinq ans d'emprisonnement et de 75 000 euros d'amende ; dix ans lorsque les stupéfiants sont offerts ou cédés à des mineurs ou dans des centres d'enseignement ou d'éducation."), "Cession de stupéfiants à un consommateur"],
    "CP_434-10": [S("Art. 434-10 du code pénal", "Le fait, pour tout conducteur d'un véhicule ou engin terrestre, sachant qu'il vient de causer ou d'occasionner un accident, de ne pas s'arrêter et de tenter ainsi d'échapper à la responsabilité pénale ou civile qu'il peut avoir encourue, est puni de trois ans d'emprisonnement et de 75 000 euros d'amende."), "Le délit de fuite"],
    "CP_221-19": [S("Art. 221-19 du code pénal (loi n° 2025-622 du 9 juillet 2025)", "Blessures routières : le conducteur d'un véhicule terrestre à moteur qui cause sans intention à autrui une incapacité totale de travail de plus de trois mois, avec au moins une des circonstances prévues par la loi (état alcoolique, usage de stupéfiants, défaut de permis, grand excès de vitesse, délit de fuite, usage du téléphone tenu en main…), encourt cinq ans d'emprisonnement et 75 000 euros d'amende ; sept ans et 100 000 euros avec deux circonstances ou plus. Sans aucune de ces circonstances, les faits restent des blessures involontaires (art. 222-19-1)."), "Blessures routières : ITT de plus de trois mois"],
    "CP_221-20": [S("Art. 221-20 du code pénal (loi n° 2025-622 du 9 juillet 2025)", "Blessures routières : le conducteur d'un véhicule terrestre à moteur qui cause sans intention à autrui une incapacité totale de travail de trois mois au plus, avec au moins une des circonstances prévues par la loi, encourt trois ans d'emprisonnement et 45 000 euros d'amende ; cinq ans et 75 000 euros avec deux circonstances ou plus. Sans aucune de ces circonstances, les faits restent des blessures involontaires (art. 222-20-1)."), "Blessures routières : ITT de trois mois au plus"],
    "CP_433-5": [S("Art. 433-5 du code pénal", "Constituent un outrage les paroles, gestes ou menaces, les écrits ou images de toute nature non rendus publics, adressés à une personne chargée d'une mission de service public, dans l'exercice ou à l'occasion de l'exercice de sa mission, et de nature à porter atteinte à sa dignité ou au respect dû à la fonction : 7 500 euros d'amende. Adressé à une personne dépositaire de l'autorité publique, l'outrage est puni d'un an d'emprisonnement et de 15 000 euros d'amende ; deux ans et 30 000 euros en réunion."), "L'outrage"],
    "CP_433-6": [S("Art. 433-6 du code pénal", "Constitue une rébellion le fait d'opposer une résistance violente à une personne dépositaire de l'autorité publique ou chargée d'une mission de service public agissant, dans l'exercice de ses fonctions, pour l'exécution des lois, des ordres de l'autorité publique, des décisions ou mandats de justice."), "La rébellion : définition"],
    "CP_433-7": [S("Art. 433-7 du code pénal", "La rébellion est punie de deux ans d'emprisonnement et de 30 000 euros d'amende ; commise en réunion, de trois ans et 45 000 euros. La rébellion armée est punie de cinq ans et 75 000 euros (art. 433-8)."), "La rébellion : peines"],
    "CP_324-1": [S("Art. 324-1 du code pénal", "Le blanchiment est le fait de faciliter, par tout moyen, la justification mensongère de l'origine des biens ou des revenus de l'auteur d'un crime ou d'un délit ayant procuré à celui-ci un profit direct ou indirect, ou d'apporter un concours à une opération de placement, de dissimulation ou de conversion du produit direct ou indirect d'un crime ou d'un délit. Cinq ans d'emprisonnement et 375 000 euros d'amende ; dix ans et 750 000 euros lorsqu'il est commis de façon habituelle, en utilisant les facilités d'une activité professionnelle ou en bande organisée (art. 324-2)."), "Le blanchiment"],
    "CP_433-1": [S("Art. 433-1 du code pénal", "Est puni de dix ans d'emprisonnement et d'une amende d'un million d'euros, dont le montant peut être porté au double du produit de l'infraction, le fait de proposer sans droit à une personne dépositaire de l'autorité publique, chargée d'une mission de service public ou investie d'un mandat électif public, des offres, des promesses, des dons, des présents ou des avantages quelconques, pour qu'elle accomplisse ou s'abstienne d'accomplir un acte de sa fonction (corruption active)."), "La corruption active d'agent public"],
    "CP_445-1": [S("Art. 445-1 du code pénal", "Est puni de cinq ans d'emprisonnement et d'une amende de 500 000 euros, dont le montant peut être porté au double du produit de l'infraction, le fait de proposer ou d'octroyer sans droit à une personne qui exerce, dans le cadre d'une activité professionnelle, une fonction de direction ou un travail pour une personne physique ou morale, des avantages quelconques pour qu'elle accomplisse ou s'abstienne d'accomplir un acte de son activité ou de sa fonction, en violation de ses obligations (corruption privée active ; l'article 445-2 réprime la corruption passive des mêmes peines)."), "La corruption privée"],
    "CP_441-1": [S("Art. 441-1 du code pénal", "Constitue un faux toute altération frauduleuse de la vérité, de nature à causer un préjudice et accomplie par quelque moyen que ce soit, dans un écrit ou tout autre support d'expression de la pensée qui a pour objet ou qui peut avoir pour effet d'établir la preuve d'un droit ou d'un fait ayant des conséquences juridiques. Le faux et l'usage de faux sont punis de trois ans d'emprisonnement et de 45 000 euros d'amende ; cinq ans et 75 000 euros pour un document délivré par une administration publique (art. 441-2)."), "Le faux et l'usage de faux"],
    "CP_323-1": [S("Art. 323-1 du code pénal", "Le fait d'accéder ou de se maintenir, frauduleusement, dans tout ou partie d'un système de traitement automatisé de données est puni de trois ans d'emprisonnement et de 100 000 euros d'amende ; lorsqu'il en est résulté soit la suppression ou la modification de données contenues dans le système, soit une altération de son fonctionnement, cinq ans et 150 000 euros."), "L'accès frauduleux à un système informatique"],
    "CP_226-4-1": [S("Art. 226-4-1 du code pénal", "Le fait d'usurper l'identité d'un tiers ou de faire usage d'une ou plusieurs données de toute nature permettant de l'identifier en vue de troubler sa tranquillité ou celle d'autrui, ou de porter atteinte à son honneur ou à sa considération, est puni d'un an d'emprisonnement et de 15 000 euros d'amende ; mêmes peines sur un réseau de communication au public en ligne ; deux ans et 30 000 euros lorsque les faits sont commis par le conjoint, le concubin ou le partenaire de la victime."), "L'usurpation d'identité"],
    "CR_R234-1": [S("Art. R. 234-1 du code de la route", "Le fait de conduire un véhicule sous l'empire d'un état alcoolique caractérisé par une concentration d'alcool dans le sang égale ou supérieure à 0,50 gramme par litre ou par une concentration dans l'air expiré égale ou supérieure à 0,25 milligramme par litre, sans atteindre les seuils du délit, est puni de l'amende prévue pour les contraventions de la 4e classe ; suspension possible du permis, retrait de six points."), "Alcool au volant : la contravention"],
    "CR_L234-8": [S("Art. L. 234-8 du code de la route", "Le fait de refuser de se soumettre aux vérifications destinées à établir l'état alcoolique est puni de deux ans d'emprisonnement et de 4 500 euros d'amende."), "Refus de se soumettre aux vérifications"],
    "CR_L235-1": [S("Art. L. 235-1 du code de la route", "Le fait de conduire un véhicule alors qu'il résulte d'une analyse sanguine ou salivaire que l'on a fait usage de substances ou plantes classées comme stupéfiants est puni de deux ans d'emprisonnement et de 4 500 euros d'amende ; trois ans et 9 000 euros si la personne se trouvait également sous l'empire d'un état alcoolique."), "Conduite après usage de stupéfiants"],
    "CR_L221-2": [S("Art. L. 221-2 du code de la route", "Le fait de conduire un véhicule sans être titulaire du permis de conduire correspondant à la catégorie du véhicule considéré est puni d'un an d'emprisonnement et de 15 000 euros d'amende."), "La conduite sans permis"],
    "CR_L224-16": [S("Art. L. 224-16 du code de la route", "Le fait de conduire un véhicule malgré la notification d'une décision prononçant à son encontre la suspension, la rétention, l'annulation ou l'interdiction d'obtenir la délivrance du permis de conduire, ou malgré l'invalidation du permis pour solde de points nul, est puni de deux ans d'emprisonnement et de 4 500 euros d'amende."), "Conduite malgré suspension ou annulation"],
    "CR_L233-1": [S("Art. L. 233-1 du code de la route", "Le fait pour tout conducteur d'omettre d'obtempérer à une sommation de s'arrêter émanant d'un fonctionnaire ou d'un agent chargé de constater les infractions et muni des insignes extérieurs et apparents de sa qualité est puni de deux ans d'emprisonnement et de 15 000 euros d'amende ; cinq ans et 75 000 euros lorsque les faits ont exposé autrui à un risque de mort ou de blessures graves (art. L. 233-1-1)."), "Le refus d'obtempérer"],
    "CSP_L3421-1": [S("Art. L. 3421-1 du code de la santé publique", "L'usage illicite de l'une des substances ou plantes classées comme stupéfiants est puni d'un an d'emprisonnement et de 3 750 euros d'amende ; l'action publique peut être éteinte par le paiement d'une amende forfaitaire délictuelle de 200 euros."), "L'usage de stupéfiants"],
    "CCOM_L241-3": [S("Art. L. 241-3 du code de commerce", "Est puni d'un emprisonnement de cinq ans et d'une amende de 375 000 euros le fait, pour les gérants d'une société à responsabilité limitée, de faire, de mauvaise foi, des biens ou du crédit de la société, un usage qu'ils savent contraire à l'intérêt de celle-ci, à des fins personnelles ou pour favoriser une autre société ou entreprise dans laquelle ils sont intéressés directement ou indirectement (4°)."), "L'abus de biens sociaux"],
    "CPP_56": [S("Art. 56 du code de procédure pénale", "En flagrance, l'officier de police judiciaire peut se transporter au domicile des personnes qui paraissent avoir participé au crime ou au délit pour y procéder à une perquisition ; la fouille à corps, assimilée à une perquisition, relève de l'officier de police judiciaire, ou d'un agent agissant sous son contrôle."), "Perquisitions et fouilles en flagrance"],
    "CPP_76": [S("Art. 76 du code de procédure pénale", "En enquête préliminaire, les perquisitions, visites domiciliaires et saisies de pièces à conviction ne peuvent être effectuées sans l'assentiment exprès de la personne chez laquelle l'opération a lieu ; cet assentiment doit faire l'objet d'une déclaration écrite de la main de l'intéressé, ou d'une mention au procès-verbal s'il ne sait écrire. À défaut, une autorisation du juge des libertés et de la détention est nécessaire pour les délits punis d'au moins trois ans d'emprisonnement."), "Perquisition en préliminaire : l'assentiment écrit"],
    "CPP_77-1-1": [S("Art. 77-1-1 du code de procédure pénale", "En enquête préliminaire, le procureur de la République ou, sur son autorisation, l'officier de police judiciaire peut requérir de toute personne, de tout établissement ou organisme, la remise d'informations intéressant l'enquête, y compris celles issues d'un système informatique. Les données de connexion ne peuvent être requises que dans les cas de l'article 60-1-2 (loi du 2 mars 2022) : crime ou délit puni d'au moins trois ans d'emprisonnement, délit puni d'au moins un an commis au moyen d'un réseau de communications électroniques, équipement de la victime à sa demande, recherche d'une personne disparue. La chambre criminelle exige en outre une criminalité grave et un contrôle indépendant ; la nullité suppose un grief (Crim. 12 juill. 2022)."), "Réquisitions en enquête préliminaire"],
    "CPP_78-2": [S("Art. 78-2 du code de procédure pénale", "Les officiers et agents de police judiciaire peuvent inviter à justifier de son identité toute personne à l'égard de laquelle existent une ou plusieurs raisons plausibles de soupçonner qu'elle a commis ou tenté de commettre une infraction, se prépare à en commettre une, ou peut fournir des renseignements utiles à une enquête ; ou, sur réquisitions écrites du procureur de la République, dans les lieux et pour la période qu'il détermine. Hors ces cas, le contrôle est irrégulier et les actes qui en découlent peuvent être annulés."), "Les contrôles d'identité"],
    "CPP_230-33": [S("Art. 230-33 du code de procédure pénale", "La géolocalisation en temps réel est autorisée en enquête de flagrance ou préliminaire par le procureur de la République pour une durée maximale de quinze jours consécutifs (huit jours dans certains cas) ; au-delà, elle est autorisée par le juge des libertés et de la détention, à la requête du procureur, pour une durée d'un mois renouvelable."), "La géolocalisation"],
    "CPP_63-3-1": [S("Art. 63-3-1 du code de procédure pénale", "Dès le début de la garde à vue, la personne peut demander à être assistée par un avocat ; l'avocat désigné est informé par l'officier de police judiciaire de la nature et de la date présumée de l'infraction."), "Le droit à l'avocat en garde à vue"],
    "CGI_1741": [S("Art. 1741 du code général des impôts", "Quiconque s'est frauduleusement soustrait ou a tenté de se soustraire frauduleusement à l'établissement ou au paiement total ou partiel des impôts, soit qu'il ait volontairement omis de faire sa déclaration dans les délais prescrits, soit qu'il ait volontairement dissimulé une part des sommes sujettes à l'impôt, est passible d'une amende de 500 000 euros, dont le montant peut être porté au double du produit tiré de l'infraction, et d'un emprisonnement de cinq ans. Poursuites sur plainte de l'administration ou dénonciation obligatoire au parquet (art. L. 228 du livre des procédures fiscales)."), "La fraude fiscale"],
  };
  // Inscription dans la base des textes et dans la bibliothèque (sans écraser l'existant)
  CAT.installTextes = function () {
    CR.TEXTES = CR.TEXTES || {};
    for (const [id, [t, titre]] of Object.entries(CAT.TEXTES)) {
      if (!CR.TEXTES[id]) CR.TEXTES[id] = t;
      if (CR.LIB && !CR.LIB.some((x) => x.id === id)) CR.LIB.push({ id, titre, domaine: /^C[CG]/.test(id) ? "dps" : "dps", temps: 15, gen: true });
    }
  };
  CAT.installTextes();

  // ------------------------------------------------------------------ Outils communs des fiches
  CAT.def = function (id, o) { o.id = id; CAT.INF[id] = o; CAT.ORDRE.push(id); return o; };
  // Variantes d'une fiche (lot 1 : infractions voisines tirées comme des scènes de la fiche). I.scn[sc] remplace, pour cette
  // scène seulement, les preuves, mesures, flagrance, irrégularités, caméra, victime, métiers, genres exclus (pasGenres) et
  // doutes exclus (sansDoutes). Les fiches sans variante ne changent pas.
  CAT.estVariante = (id, f) => !!(CAT.INF[id] && CAT.INF[id].scn && f && CAT.INF[id].scn[f.sc]);
  CAT.ficheDe = function (I, f) {
    const o = I && I.scn && f && I.scn[f.sc];
    if (!o) return I;
    const J = Object.assign(Object.create(I), o);
    if (o.flagrance != null && !("flagranceDe" in o)) J.flagranceDe = null;
    if ("victime" in o && !("victimeDe" in o)) J.victimeDe = null;
    if (!("controle" in o)) J.controle = () => false;
    return J;
  };
  CAT.pk = (r, a) => a[Math.floor(r() * a.length)];
  CAT.int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  CAT.ch = (r, p) => r() < p;
  // tirage pondéré : { a: 2, b: 1 } → "a" deux fois plus souvent
  CAT.poids = function (r, w) {
    const e = Object.entries(w).filter(([, v]) => v > 0);
    const tot = e.reduce((a, [, v]) => a + v, 0);
    let x = r() * tot;
    for (const [k, v] of e) { x -= v; if (x < 0) return k; }
    return e.length ? e[e.length - 1][0] : null;
  };
  // ITT tirée : 0, de un à huit jours, ou plus de huit jours
  CAT.itt = (r, w0, wle8, wgt8, max) => { const k = CAT.poids(r, { z: w0, a: wle8, b: wgt8 }); return k === "z" ? 0 : k === "a" ? CAT.int(r, 1, 8) : CAT.int(r, 9, max || 30); };
  // Violences graduées selon l'ITT et le nombre de circonstances (art. 222-11 à 222-13, R. 624-1 et R. 625-1)
  CAT.qualViolences = function (f, base) {
    const n = (f.agg || []).filter((a) => !["itt8"].includes(a)).length;
    const itt = f.itt || 0;
    const sur = base || "";
    if (itt > 8) {
      const [prison, amende, art] = CAT.palier([[36, 45000, "art. 222-11 CP"], [60, 75000, "art. 222-12 CP"], [84, 100000, "art. 222-12 CP"], [120, 150000, "art. 222-12 CP"]], n);
      return CAT.delit(prison, amende, art, `violences volontaires${sur} ayant entraîné une incapacité totale de travail de plus de huit jours${n ? ", " + (f.agg || []).map(CAT.aggLabel).join(", ") : ""}`, { textes: ["CP_222-11", "CP_222-12"], itt });
    }
    if (n === 0) {
      return itt === 0
        ? CAT.contrav(4, "art. R. 624-1 CP", `violences volontaires${sur} n'ayant entraîné aucune incapacité totale de travail`, { textes: ["CP_R624-1"], itt })
        : CAT.contrav(5, "art. R. 625-1 CP", `violences volontaires${sur} ayant entraîné une incapacité totale de travail n'excédant pas huit jours`, { textes: ["CP_R625-1"], itt });
    }
    const [prison, amende] = CAT.palier([[0, 0], [36, 45000], [60, 75000], [84, 100000]], n);
    return CAT.delit(prison, amende, "art. 222-13 CP", `violences volontaires${sur} ${itt ? "ayant entraîné une incapacité totale de travail n'excédant pas huit jours" : "n'ayant entraîné aucune incapacité totale de travail"}, ${(f.agg || []).map(CAT.aggLabel).join(", ")}`, { textes: ["CP_222-13"], itt });
  };
  // Liste des circonstances tirées dans un réservoir { id: probabilité }, au plus `max`
  CAT.tirerAgg = function (r, res, max, imposees) {
    const out = (imposees || []).slice();
    for (const [k, p] of Object.entries(res)) if (out.length < (max || 2) && !out.includes(k) && r() < p) out.push(k);
    return out;
  };
  CAT.heure = (r, plages) => { const [a, b] = CAT.pk(r, plages); return CAT.int(r, a, b); };

  // ================================================================== N° 12 : plusieurs infractions, récidive, personnes morales
  // Les règles générales de la peine, communes à toutes les fiches : concours (art. 132-2 à 132-7 CP), récidive légale (132-8 à
  // 132-11, assimilations des art. 132-16 à 132-16-4, relevé d'office de l'art. 132-16-5), réitération (132-16-7), sursis
  // antérieur (132-35 et 132-36), personnes morales (121-2, 131-38, 131-39), délégation de pouvoirs, convention judiciaire
  // d'intérêt public (art. 41-1-2 CPP), parquet national financier (art. 705 CPP), plainte préalable de l'administration fiscale
  // (art. L. 228 LPF), prescription des infractions occultes ou dissimulées (art. 9-1 CPP). Rédigé hors ligne d'après le document
  // de conception : chaque règle et chaque texte sont à revérifier sur Légifrance (arrêts : sur Judilibre).
  const pk = CAT.pk, int = CAT.int;
  Object.assign(CAT.TEXTES, {
    "CP_121-2": [S("Art. 121-2 du code pénal", "Les personnes morales, à l'exclusion de l'État, sont responsables pénalement des infractions commises, pour leur compte, par leurs organes ou représentants. Cette responsabilité n'exclut pas celle des personnes physiques auteurs ou complices des mêmes faits, sous réserve de l'article 121-3, alinéa 4."), "La responsabilité des personnes morales"],
    "CP_121-3": [S("Art. 121-3 du code pénal", "Il n'y a point de crime ou de délit sans intention de le commettre ; lorsque la loi le prévoit, il y a délit en cas d'imprudence, de négligence ou de manquement à une obligation de prudence ou de sécurité, si l'auteur n'a pas accompli les diligences normales. La personne physique qui n'a pas causé directement le dommage, mais a créé la situation qui l'a permis ou n'a pas pris les mesures pour l'éviter, n'est responsable que si elle a violé de façon manifestement délibérée une obligation particulière de prudence ou de sécurité, ou commis une faute caractérisée exposant autrui à un risque d'une particulière gravité qu'elle ne pouvait ignorer."), "Faute d'imprudence et causalité indirecte"],
    "CP_131-38": [S("Art. 131-38 du code pénal", "Le taux maximum de l'amende applicable aux personnes morales est égal au quintuple de celui prévu pour les personnes physiques par la loi qui réprime l'infraction. Pour un crime qui ne prévoit aucune amende contre les personnes physiques, l'amende encourue par les personnes morales est d'un million d'euros."), "L'amende des personnes morales : le quintuple"],
    "CP_131-39": [S("Art. 131-39 du code pénal", "Lorsque la loi le prévoit, un crime ou un délit commis par une personne morale peut être sanctionné d'une ou plusieurs peines : dissolution, interdiction d'exercer une activité, placement sous surveillance judiciaire, fermeture d'établissement, exclusion des marchés publics, interdiction de faire appel public à l'épargne, confiscation, affichage ou diffusion de la décision."), "Les autres peines des personnes morales"],
    "CP_132-2": [S("Art. 132-2 du code pénal", "Il y a concours d'infractions lorsqu'une infraction est commise par une personne avant que celle-ci ait été définitivement condamnée pour une autre infraction."), "Le concours d'infractions"],
    "CP_132-3": [S("Art. 132-3 du code pénal", "Lorsque, à l'occasion d'une même procédure, la personne poursuivie est reconnue coupable de plusieurs infractions en concours, chacune des peines encourues peut être prononcée. Toutefois, lorsque plusieurs peines de même nature sont encourues, il ne peut être prononcé qu'une seule peine de cette nature dans la limite du maximum légal le plus élevé."), "Concours dans une même procédure : le plafond par nature"],
    "CP_132-4": [S("Art. 132-4 du code pénal", "Lorsque, à l'occasion de procédures séparées, la personne poursuivie a été reconnue coupable de plusieurs infractions en concours, les peines prononcées s'exécutent cumulativement dans la limite du maximum légal le plus élevé. Toutefois, la confusion totale ou partielle des peines de même nature peut être ordonnée soit par la dernière juridiction appelée à statuer, soit dans les conditions prévues par le code de procédure pénale."), "Procédures séparées : la confusion des peines"],
    "CP_132-5": [S("Art. 132-5 du code pénal", "Pour l'application des articles 132-3 et 132-4, les peines privatives de liberté sont de même nature et toute peine privative de liberté est confondue avec une peine perpétuelle. Il est tenu compte, s'il y a lieu, de l'état de récidive."), "Ce qui compte comme une même nature de peine"],
    "CP_132-7": [S("Art. 132-7 du code pénal", "Par dérogation aux articles 132-3 et 132-4, les peines d'amende pour contraventions se cumulent entre elles et avec celles encourues ou prononcées pour des crimes ou délits en concours."), "Les amendes contraventionnelles se cumulent"],
    "CP_132-9": [S("Art. 132-9 du code pénal", "La personne déjà condamnée définitivement pour un crime ou pour un délit puni de dix ans d'emprisonnement qui commet, dans le délai de dix ans à compter de l'expiration ou de la prescription de la précédente peine, un délit puni de dix ans encourt le double du maximum ; le maximum est également doublé si elle commet, dans le délai de cinq ans, un délit puni d'un emprisonnement supérieur à un an et inférieur à dix ans."), "Récidive après un crime ou un délit puni de dix ans"],
    "CP_132-11": [S("Art. 132-11 du code pénal", "Dans les cas où le règlement le prévoit, la personne déjà condamnée définitivement pour une contravention de la 5e classe qui commet, dans le délai d'un an à compter de l'expiration ou de la prescription de la précédente peine, la même contravention, encourt une amende dont le maximum est porté à 3 000 euros."), "La récidive contraventionnelle"],
    "CP_132-16-2": [S("Art. 132-16-2 du code pénal", "Les délits d'homicide ou d'atteintes involontaires commis à l'occasion de la conduite d'un véhicule terrestre à moteur sont, au regard de la récidive, une même infraction ; les délits des articles L. 221-2, L. 234-1, L. 235-1 et L. 413-1 du code de la route le sont aussi entre eux, et leur sont assimilés lorsque ces derniers constituent le second terme de la récidive."), "Récidive : les délits routiers assimilés"],
    "CP_132-16-4": [S("Art. 132-16-4 du code pénal", "Les délits de violences volontaires aux personnes ainsi que tout délit commis avec la circonstance aggravante de violences sont considérés, au regard de la récidive, comme une même infraction."), "Récidive : violences et délits avec violences"],
    "CP_132-16-5": [S("Art. 132-16-5 du code pénal", "L'état de récidive légale peut être relevé d'office par la juridiction de jugement même lorsqu'il n'est pas mentionné dans l'acte de poursuites, dès lors qu'au cours de l'audience la personne poursuivie en a été informée et qu'elle a été mise en mesure d'être assistée d'un avocat et de faire valoir ses observations."), "La récidive relevée à l'audience"],
    "CP_132-16-7": [S("Art. 132-16-7 du code pénal", "Il y a réitération d'infractions pénales lorsqu'une personne a déjà été condamnée définitivement pour un crime ou un délit et commet une nouvelle infraction qui ne répond pas aux conditions de la récidive légale. Les peines prononcées pour l'infraction commise en réitération se cumulent sans limitation de quantum et sans possibilité de confusion avec les peines définitivement prononcées lors de la condamnation précédente."), "La réitération"],
    "CP_132-35": [S("Art. 132-35 du code pénal", "La condamnation pour crime ou délit assortie du sursis simple est réputée non avenue si le condamné n'a pas commis, dans le délai de cinq ans à compter de celle-ci, un crime ou un délit de droit commun suivi d'une nouvelle condamnation ayant ordonné la révocation totale du sursis."), "Le délai d'épreuve du sursis simple"],
    "CP_132-36": [S("Art. 132-36 du code pénal", "La juridiction peut, par décision spéciale, révoquer totalement ou partiellement le sursis antérieurement accordé lorsqu'elle prononce une nouvelle condamnation à une peine de réclusion ou d'emprisonnement sans sursis. La révocation n'est plus automatique : sans décision spéciale, le premier sursis demeure."), "La révocation du sursis : une décision spéciale"],
    "CP_321-5": [S("Art. 321-5 du code pénal", "Le recel est assimilé, au regard de la récidive, à l'infraction dont provient le bien recelé."), "Le recel et la récidive"],
    "CP_222-19": [S("Art. 222-19 du code pénal", "Le fait de causer à autrui, dans les conditions de l'article 121-3, par maladresse, imprudence, inattention, négligence ou manquement à une obligation de prudence ou de sécurité imposée par la loi ou le règlement, une incapacité totale de travail de plus de trois mois est puni de deux ans d'emprisonnement et de 30 000 euros d'amende ; trois ans et 45 000 euros en cas de violation manifestement délibérée d'une obligation particulière de prudence ou de sécurité."), "Blessures involontaires : ITT de plus de trois mois"],
    "CPP_9-1": [S("Art. 9-1 du code de procédure pénale", "Le délai de prescription de l'action publique de l'infraction occulte ou dissimulée court à compter du jour où l'infraction est apparue et a pu être constatée dans des conditions permettant la mise en mouvement de l'action publique, sans pouvoir excéder douze années révolues pour les délits, trente pour les crimes, à compter du jour de l'infraction. Est occulte l'infraction qui, en raison de ses éléments constitutifs, ne peut être connue ni de la victime ni de l'autorité judiciaire ; est dissimulée celle dont l'auteur accomplit délibérément toute manœuvre caractérisée tendant à en empêcher la découverte."), "Les infractions occultes ou dissimulées"],
    "CPP_41-1-2": [S("Art. 41-1-2 du code de procédure pénale", "Tant que l'action publique n'a pas été mise en mouvement, le procureur de la République peut proposer à une personne morale mise en cause pour corruption, trafic d'influence, fraude fiscale, blanchiment de fraude fiscale ou infractions connexes, une convention judiciaire d'intérêt public : amende d'intérêt public proportionnée aux avantages tirés, dans la limite de 30 % du chiffre d'affaires moyen annuel des trois derniers exercices, programme de mise en conformité contrôlé par l'Agence française anticorruption, réparation du préjudice de la victime. Le président du tribunal la valide en audience publique ; elle n'emporte pas déclaration de culpabilité et n'est pas inscrite au casier ; la personne morale dispose de dix jours pour se rétracter. Les représentants légaux restent responsables comme personnes physiques."), "La convention judiciaire d'intérêt public"],
    "CPP_705": [S("Art. 705 du code de procédure pénale", "Le procureur de la République financier, le juge d'instruction et le tribunal correctionnel de Paris exercent une compétence concurrente sur l'ensemble du territoire national pour les atteintes à la probité (corruption, trafic d'influence…), la fraude fiscale aggravée ou commise en bande organisée, le blanchiment de ces délits, et les infractions connexes, dans les affaires qui sont ou apparaîtraient d'une grande complexité."), "Le parquet national financier"],
    "CPP_706-43": [S("Art. 706-43 du code de procédure pénale", "L'action publique est exercée à l'encontre de la personne morale prise en la personne de son représentant légal à l'époque des poursuites. Lorsque des poursuites pour les mêmes faits ou pour des faits connexes sont engagées contre ce représentant, celui-ci peut saisir le président du tribunal pour faire désigner un mandataire de justice qui représentera la personne morale."), "Qui représente la personne morale poursuivie"],
    "LPF_L228": [S("Art. L. 228 du livre des procédures fiscales", "Sous peine d'irrecevabilité, les poursuites pour fraude fiscale (art. 1741 CGI) sont engagées sur plainte de l'administration, après avis conforme de la commission des infractions fiscales, ou sur la dénonciation que l'administration doit adresser au procureur de la République lorsque les droits éludés dépassent 100 000 euros et qu'ils ont donné lieu à certaines majorations (régime issu de la loi du 23 octobre 2018). Le blanchiment de fraude fiscale peut être poursuivi sans cette plainte."), "La plainte préalable de l'administration fiscale"],
    "CP_222-52": [S("Art. 222-52 du code pénal", "Le fait d'acquérir, de détenir ou de céder, sans autorisation, des matériels de guerre, armes, éléments d'armes ou munitions des catégories A ou B est puni de cinq ans d'emprisonnement et de 75 000 euros d'amende ; sept ans et 100 000 euros si l'auteur a déjà été condamné à un an d'emprisonnement ferme au moins pour certaines infractions ; dix ans et 500 000 euros lorsque les faits sont commis par au moins deux personnes. La détention sans déclaration d'une arme de catégorie C relève, elle, du code de la sécurité intérieure (art. L. 317-4-1)."), "La détention d'une arme de catégorie B"],
    "JP_CRIM_1993_03_11": [S("Cass. crim., 11 mars 1993 (référence à vérifier sur Judilibre)", "Sauf si la loi en dispose autrement, le chef d'entreprise qui n'a pas personnellement pris part à la réalisation de l'infraction peut s'exonérer de sa responsabilité pénale s'il rapporte la preuve qu'il a délégué ses pouvoirs à une personne pourvue de la compétence, de l'autorité et des moyens nécessaires."), "La délégation de pouvoirs"],
    "JP_CRIM_2021_12_15": [S("Cass. crim., 15 décembre 2021, n° 21-81.864 (référence à vérifier sur Judilibre)", "Un même fait ne peut fonder deux déclarations de culpabilité lorsque l'une des qualifications est un élément constitutif ou une circonstance aggravante de l'autre, ou qu'elle n'en réprime qu'une modalité particulière : la juridiction écarte alors la qualification en surnombre et ne retient que la plus haute."), "Le cumul de qualifications pour un même fait"],
    "JP_CRIM_1997_05_05": [S("Cass. crim., 5 mai 1997 (référence à vérifier sur Judilibre)", "La prescription de l'abus de biens sociaux court, sauf dissimulation, à compter de la présentation des comptes annuels par lesquels les dépenses litigieuses sont mises indûment à la charge de la société."), "Le point de départ de la prescription de l'abus de biens sociaux"],
    "JP_CRIM_2008_02_20": [S("Cass. crim., 20 février 2008 (référence à vérifier sur Judilibre)", "Le délit de blanchiment de fraude fiscale est un délit général et autonome : sa poursuite n'est pas subordonnée au dépôt d'une plainte préalable de l'administration fiscale."), "Le blanchiment de fraude fiscale sans plainte"],
  });
  CAT.installTextes();

  // ------------------------------------------------------------------ Concours d'infractions (art. 132-2 à 132-7)
  // qs : les qualifications retenues, chacune déjà portée en récidive s'il y a lieu (art. 132-5). Une seule peine privative de
  // liberté dans la limite du maximum le plus élevé (la perpétuité absorbe le reste), une seule amende délictuelle ou criminelle
  // au plus du maximum le plus élevé ; les amendes contraventionnelles s'y ajoutent (art. 132-7).
  CAT.concours = function (qs) {
    const L = (qs || []).filter(Boolean);
    const cd = L.filter((q) => q.nature !== "contravention");
    const ct = L.filter((q) => q.nature === "contravention");
    const perpetuite = cd.some((q) => q.perpetuite);
    const prison = perpetuite ? CAT.PERPETUITE : cd.reduce((a, q) => Math.max(a, q.prison || 0), 0);
    const amendeCD = cd.reduce((a, q) => Math.max(a, q.amende || 0), 0);
    const amendeC = ct.reduce((a, q) => a + (q.amende || 0), 0);
    return {
      nature: L.some((q) => q.nature === "crime") ? "crime" : cd.length ? "delit" : "contravention",
      prison, amende: amendeCD + amendeC, amendeContrav: amendeC, perpetuite: perpetuite || undefined,
      somme: cd.reduce((a, q) => a + (q.prison || 0), 0), sommeAmende: L.reduce((a, q) => a + (q.amende || 0), 0), n: L.length,
      textes: ["CP_132-2", "CP_132-3", "CP_132-5"].concat(ct.length ? ["CP_132-7"] : []),
    };
  };
  // « Une seule peine d'emprisonnement, au plus cinq ans (et non huit, la somme des maxima) … »
  CAT.concoursTexte = function (c) {
    if (!c || c.n < 2) return "";
    const pr = c.perpetuite ? "la réclusion criminelle à perpétuité, qui absorbe les autres peines privatives de liberté" : c.prison ? `une seule peine d'emprisonnement, au plus ${CR.fmtMois(c.prison)}${c.somme > c.prison ? ` (et non ${CR.fmtMois(c.somme)}, la somme des maxima)` : ""}` : "aucune peine d'emprisonnement";
    const am = c.amende - c.amendeContrav;
    return `Concours d'infractions jugées ensemble (art. 132-2, 132-3 et 132-5) : ${pr} ; ${am ? `une seule amende délictuelle, au plus ${CR.money(am)}` : "pas d'amende délictuelle"}${c.amendeContrav ? `, à laquelle s'ajoutent les amendes contraventionnelles (${CR.money(c.amendeContrav)}, art. 132-7)` : ""}.`;
  };

  // ------------------------------------------------------------------ Récidive : même délit et délits assimilés
  CAT.artBase = (art) => { const m = /art\.\s*((?:[LRD]\.\s?)?\d+(?:-\d+)*)/.exec(String(art || "")); return m ? m[1].replace(/\s/g, "") : ""; };
  CAT.ASSIMIL = [
    { id: "biens", art: "132-16", textes: ["CP_132-16", "CP_321-5"], label: "le vol, l'extorsion, le chantage, l'escroquerie et l'abus de confiance (le recel suit l'infraction d'origine, art. 321-5)", infs: ["vol", "cambriolage", "extorsion", "escroquerie", "abus_confiance", "recel"] },
    { id: "violences", art: "132-16-4", textes: ["CP_132-16-4"], label: "les violences volontaires et tout délit commis avec la circonstance de violences", infs: ["violences", "violences_conj", "violences_pdap"], violence: true },
    { id: "conduite", art: "132-16-2", textes: ["CP_132-16-2"], label: "la conduite sans permis, sous l'empire d'un état alcoolique, après usage de stupéfiants, le grand excès de vitesse", arts: ["L.221-2", "L.234-1", "L.235-1", "L.413-1"] },
    { id: "route_inv", art: "132-16-2", textes: ["CP_132-16-2"], label: "l'homicide et les blessures involontaires commis au volant", infs: ["blessures_routieres", "homicide_routier"], second: "conduite" },
  ];
  const dansGroupe = (G, x) => (G.infs && G.infs.includes(x.inf)) || (G.violence && x.violence) || (G.arts && G.arts.includes(CAT.artBase(x.art)));
  // a : le premier terme ({ inf, art, violence }) ; b : le second ; renvoie le fondement de l'assimilation, ou null
  CAT.assimiles = function (a, b) {
    if (!a || !b) return null;
    if (a.inf === b.inf && CAT.artBase(a.art) === CAT.artBase(b.art)) return { art: "132-10", label: "le même délit", textes: [] };
    for (const G of CAT.ASSIMIL) {
      if (dansGroupe(G, a) && dansGroupe(G, b)) return { art: G.art, label: G.label, textes: G.textes };
      // les délits de conduite (premier terme) sont assimilés aux atteintes involontaires routières (second terme)
      if (G.second && dansGroupe(G, b) && dansGroupe(CAT.ASSIMIL.find((x) => x.id === G.second), a)) return { art: G.art, label: "un délit de conduite suivi d'une atteinte involontaire au volant", textes: G.textes };
    }
    return null;
  };
  // Le délit qualifié porte-t-il la circonstance de violences ? (art. 132-16-4)
  CAT.avecViolences = (inf, q) => !!q && (CAT.INF[inf] && CAT.INF[inf].violences || ["violences", "violences_conj", "violences_pdap"].includes(inf) || (q.aggs || []).includes("violence0") || /311-5|311-6/.test(q.art || ""));

  // ------------------------------------------------------------------ Antécédents tirés (premier terme possible)
  // inf : la fiche dont relève la condamnation (assimilations) ; prison : le maximum légal du premier terme, en mois
  CAT.ANT = {
    vol: { inf: "vol", label: "vol", art: "art. 311-3 CP", prison: 36 },
    vol_reunion: { inf: "vol", label: "vol en réunion", art: "art. 311-4 CP", prison: 60 },
    vol_violences: { inf: "vol", label: "vol avec violences", art: "art. 311-4 CP", prison: 60, violence: true },
    escroquerie: { inf: "escroquerie", label: "escroquerie", art: "art. 313-1 CP", prison: 60 },
    abus_confiance: { inf: "abus_confiance", label: "abus de confiance", art: "art. 314-1 CP", prison: 36 },
    recel: { inf: "recel", label: "recel de vol", art: "art. 321-1 CP", prison: 60 },
    violences: { inf: "violences", label: "violences volontaires aggravées", art: "art. 222-13 CP", prison: 36, violence: true },
    violences_conj: { inf: "violences_conj", label: "violences volontaires par conjoint", art: "art. 222-13 CP", prison: 36, violence: true },
    menaces: { inf: "menaces", label: "menaces de mort", art: "art. 222-17 CP", prison: 36 },
    degradations: { inf: "degradations", label: "dégradation du bien d'autrui", art: "art. 322-1 CP", prison: 24 },
    outrage: { inf: "outrage", label: "outrage à personne dépositaire de l'autorité publique", art: "art. 433-5 CP", prison: 12 },
    rebellion: { inf: "rebellion", label: "rébellion", art: "art. 433-6 et 433-7 CP", prison: 24 },
    alcool: { inf: "alcool", label: "conduite sous l'empire d'un état alcoolique", art: "art. L. 234-1 C. route", prison: 24 },
    stups_volant: { inf: "stups_volant", label: "conduite après usage de stupéfiants", art: "art. L. 235-1 C. route", prison: 24 },
    sans_permis: { inf: "defaut_permis", label: "conduite sans permis", art: "art. L. 221-2 C. route", prison: 12 },
    usage: { inf: "stups_usage", label: "usage de stupéfiants", art: "art. L. 3421-1 CSP", prison: 12 },
    detention: { inf: "stups_detention", label: "détention de stupéfiants", art: "art. 222-37 CP", prison: 120 },
    trafic: { inf: "stups_trafic", label: "trafic de stupéfiants (détention, offre et cession)", art: "art. 222-37 CP", prison: 120 },
    faux: { inf: "faux_usage", label: "faux et usage de faux", art: "art. 441-1 CP", prison: 36 },
    vol_arme: { inf: "vol_arme", label: "vol avec arme", art: "art. 311-8 CP", prison: 240, nature: "crime", juridiction: "Cour d'assises de Paris" },
    violences_c5: { inf: "violences", label: "violences volontaires (ITT de huit jours au plus)", art: "art. R. 625-1 CP", nature: "contravention", classe: 5, juridiction: "Tribunal de police de Paris" },
    degradation_c5: { inf: "degradations", label: "dégradation légère du bien d'autrui", art: "art. R. 635-1 CP", nature: "contravention", classe: 5, juridiction: "Tribunal de police de Paris" },
  };
  // L'antécédent qui correspond exactement à la qualification poursuivie (le même délit)
  CAT.antMeme = function (inf, q) {
    const I = CAT.INF[inf] || {};
    return { inf, label: String(q.label || I.nom || "").split(",")[0].trim().replace(/^./, (c) => c.toLowerCase()), art: q.art, prison: q.prison, nature: q.nature, classe: q.classe, violence: CAT.avecViolences(inf, q) };
  };

  // ------------------------------------------------------------------ L'état légal : récidive, réitération ou concours
  // ant : { inf, art, nature, prison, classe, violence, def (jour où la condamnation est devenue définitive), fin (expiration de la
  // peine) } ; nv : { inf, q (sans la récidive), faits }. Renvoie { etat, type, art, delai, motif, regle, textes }.
  CAT.etatLegal = function (ant, nv) {
    if (!ant || ant.mineur) return { etat: null };
    const q = nv.q;
    const out = (o) => Object.assign({ textes: [] }, o);
    if (ant.def == null || nv.faits <= ant.def) return out({ etat: "concours", motif: "non_definitive", art: "132-2", textes: ["CP_132-2", "CP_132-4"], regle: "La première condamnation n'était pas définitive au jour des nouveaux faits : il n'y a pas récidive mais concours d'infractions (art. 132-2) ; les peines de même nature peuvent être confondues (art. 132-4)." });
    const dans = (ans) => nv.faits <= CR.addYears(ant.fin != null ? ant.fin : ant.def, ans);
    const grave = ant.nature === "crime" || (ant.nature !== "contravention" && ant.prison >= 120);
    const reit = (motif, regle) => out({ etat: ant.nature === "contravention" ? null : "reiteration", motif, art: "132-16-7", textes: ["CP_132-16-7"], regle: regle + (ant.nature === "contravention" ? "" : " C'est une réitération (art. 132-16-7) : pas de maximum doublé, mais les peines se cumulent, sans confusion possible avec la précédente.") });
    if (q.nature === "crime") return grave ? out({ etat: "recidive", type: "criminelle", art: "132-8", textes: ["CP_132-8"], regle: "Crime commis après une condamnation définitive pour un crime ou un délit puni de dix ans : récidive criminelle, sans condition de délai ; le maximum de vingt ou trente ans devient la perpétuité, celui de quinze ans passe à trente (art. 132-8)." }) : reit("terme", "Le premier terme n'est ni un crime ni un délit puni de dix ans : la récidive criminelle de l'article 132-8 n'est pas constituée.");
    if (q.nature === "delit") {
      if (grave && q.prison >= 120 && dans(10)) return out({ etat: "recidive", type: "delictuelle", art: "132-9", delai: 10, textes: ["CP_132-9"], regle: "Délit puni de dix ans commis dans les dix ans de l'expiration de la peine prononcée pour un crime ou un délit puni de dix ans : maximum doublé (art. 132-9, al. 1)." });
      if (grave && q.prison > 12 && q.prison < 120 && dans(5)) return out({ etat: "recidive", type: "delictuelle", art: "132-9", delai: 5, textes: ["CP_132-9"], regle: "Délit puni de plus d'un an commis dans les cinq ans de l'expiration de la peine prononcée pour un crime ou un délit puni de dix ans : maximum doublé (art. 132-9, al. 2)." });
      const as = ant.nature !== "contravention" ? CAT.assimiles(ant, { inf: nv.inf, art: q.art, violence: CAT.avecViolences(nv.inf, q) }) : null;
      if (as && dans(5)) return out({ etat: "recidive", type: "delictuelle", art: "132-10", assimilation: as, delai: 5, textes: ["CP_132-10"].concat(as.textes), regle: `Même délit ou délit assimilé (${as.label}${as.art !== "132-10" ? `, art. ${as.art}` : ""}), commis dans les cinq ans de l'expiration de la précédente peine : maximum doublé (art. 132-10).` });
      if (ant.nature === "contravention") return out({ etat: null, motif: "contravention" });
      if (as) return reit("delai", "Le délai de cinq ans courant de l'expiration de la précédente peine était écoulé au jour des nouveaux faits : la récidive de l'article 132-10 n'est pas constituée.");
      return reit("non_assimilee", "Les deux délits ne sont ni identiques ni assimilés au regard de la récidive (art. 132-16 à 132-16-4), et le premier terme n'est pas puni de dix ans (art. 132-9) : la récidive n'est pas constituée.");
    }
    // contravention de la 5e classe : la même contravention, dans l'année (art. 132-11), si le règlement le prévoit
    const I = CAT.INF[nv.inf] || {};
    if (q.classe === 5 && I.recidive5 && ant.nature === "contravention" && ant.inf === nv.inf && CAT.artBase(ant.art) === CAT.artBase(q.art)) {
      if (dans(1)) return out({ etat: "recidive", type: "contraventionnelle", art: "132-11", delai: 1, textes: ["CP_132-11"], regle: "La même contravention de la 5e classe, commise dans l'année de l'expiration de la précédente peine, le règlement prévoyant la récidive : l'amende encourue est portée à 3 000 euros (art. 132-11)." });
      return out({ etat: null, motif: "delai", regle: "Plus d'un an s'était écoulé depuis l'expiration de la précédente peine : pas de récidive contraventionnelle (art. 132-11)." });
    }
    return ant.nature === "contravention" ? out({ etat: null }) : reit("non_assimilee", "Une contravention commise après une condamnation pour crime ou délit n'est pas en récidive.");
  };
  CAT.ETAT_LABEL = { recidive: "récidive légale", reiteration: "réitération", concours: "concours d'infractions" };

  // Récidive légale appliquée à une qualification : rec = { type, art } (par défaut, la récidive délictuelle de l'art. 132-10)
  const avecRecidive0 = CAT.avecRecidive;
  CAT.avecRecidive = function (q, rec) {
    if (!q) return q;
    if (q.nature === "contravention") {
      if (!(rec && rec.type === "contraventionnelle" && q.classe === 5)) return q;
      return Object.assign({}, q, { amende: 3000, recidive: true, label: q.label + ", en état de récidive", court: q.court + " et 132-11 CP" });
    }
    if (!q.recidivable) return q;
    if (q.nature === "crime" || !rec || !rec.art || rec.art === "132-10") return avecRecidive0(q);
    return Object.assign(avecRecidive0(q), { court: q.court + " et " + rec.art + " CP" });
  };

  // ------------------------------------------------------------------ Le sursis antérieur (art. 132-35 et 132-36)
  // Révocable seulement si les nouveaux faits tombent dans le délai d'épreuve de cinq ans ; la révocation n'est plus automatique :
  // le tribunal la prononce, totale ou partielle, par une décision spéciale, et seulement avec une peine ferme.
  CAT.sursisRevocable = (ant, faits) => !!(ant && ant.peine && ant.peine.sursis > 0 && ant.def != null && faits > ant.def && faits <= CR.addYears(ant.def, 5) && ant.nature !== "contravention");

  // ------------------------------------------------------------------ Personnes morales (art. 121-2, 131-38 et 131-39)
  CAT.pourPersonneMorale = function (q) {
    if (!q) return q;
    const amende = q.nature === "crime" && !q.amende ? 1000000 : (q.amende || 0) * 5;
    return Object.assign({}, q, { prison: 0, perpetuite: undefined, amende, pm: true, amendePP: q.amende, court: q.court + " ; art. 121-2 et 131-38 CP", textes: (q.textes || []).concat(["CP_121-2", "CP_131-38"]).filter((x, i, a) => a.indexOf(x) === i) });
  };
  // Le parquet requiert contre une personne morale : une amende (part du maximum selon la gravité et le chiffre d'affaires) et
  // une peine complémentaire de l'art. 131-39
  CAT.requisPM = function (qpm, ctx) {
    ctx = ctx || {};
    const I = CAT.INF[qpm.id] || {};
    const g = I.gravite != null ? I.gravite : 0.4;
    const part = 0.06 + g * 0.14 + (ctx.recidive ? 0.1 : 0);
    const plafondCA = ctx.ca ? ctx.ca * 0.02 : Infinity;
    const amende = Math.max(5000, Math.round(Math.min(qpm.amende * part, Math.max(qpm.amende * 0.04, plafondCA)) / 1000) * 1000);
    return { ferme: 0, sursis: 0, amende, complementaires: ["affichage et diffusion de la décision (art. 131-39, 9°)"].concat(g >= 0.5 ? ["exclusion des marchés publics pendant deux ans (art. 131-39, 5°)"] : []) };
  };
  // La délégation de pouvoirs écarte la responsabilité du dirigeant si le délégataire avait la compétence, l'autorité et les moyens
  CAT.delegationValide = (d) => !!(d && d.existe && d.competence && d.autorite && d.moyens);
  CAT.delegationDefaut = (d) => (!d || !d.existe ? "absente" : !d.competence ? "competence" : !d.autorite ? "autorite" : !d.moyens ? "moyens" : null);
  CAT.DELEG_LABEL = { competence: "la compétence technique", autorite: "l'autorité sur les équipes", moyens: "les moyens, notamment budgétaires" };
  // Convention judiciaire d'intérêt public : personnes morales, atteintes à la probité, fraude fiscale et blanchiment de fraude
  // fiscale ; amende plafonnée à 30 % du chiffre d'affaires moyen annuel (art. 41-1-2 CPP)
  CAT.CJIP_INFS = ["corruption", "fraude_fiscale", "blanchiment"];
  CAT.cjipPossible = (inf, pm) => !!pm && CAT.CJIP_INFS.includes(inf);
  CAT.cjipPlafond = (ca) => Math.round((ca || 0) * 0.3);
  // Parquet national financier (art. 705 CPP) : probité, fraude fiscale grave ou internationale, blanchiment de ces délits
  CAT.pnfCompetent = (inf, f) => inf === "corruption" || (inf === "fraude_fiscale" && (f.montant >= 500000 || f.sc === "independant")) || (inf === "blanchiment" && f.sc === "commerce" && f.montant >= 300000);
  // Fraude fiscale : poursuites recevables seulement sur plainte de l'administration (avis de la commission des infractions
  // fiscales) ou sur sa dénonciation obligatoire (art. L. 228 LPF) ; aucune pour le blanchiment de fraude fiscale
  CAT.fraudeRecevable = (fisc) => !!fisc && (fisc.plainte === "ciff" || fisc.plainte === "denonciation");
  // Infraction occulte ou dissimulée (art. 9-1 CPP ; abus de biens sociaux : présentation des comptes, sauf dissimulation)
  // pr : { faits (dernier fait), comptes (approbation des comptes qui montrent la dépense), dissimule, decouverte, poursuite }
  CAT.prescriptionOcculte = function (pr, ans) {
    if (!pr) return null;
    ans = ans || 6;
    const depart = pr.dissimule ? pr.decouverte : pr.comptes;
    const butoir = CR.addYears(pr.faits, 12);
    const expire = Math.min(CR.addYears(depart, ans), butoir);
    return { depart, butoir, expire, acquise: pr.poursuite > expire };
  };

  // ------------------------------------------------------------------ Scénarios de concours (affaires à plusieurs infractions)
  // Chaque scénario part d'une fiche (base) et ajoute des infractions tirées dans la même scène ; memeFait : le même geste poursuivi
  // sous deux qualifications (le tribunal peut écarter la qualification en surnombre : Crim. 15 déc. 2021, n° 21-81.864).
  CAT.CONCOURS = {
    vol_violences_rebellion: {
      base: ["vol"], genres: ["gav", "ci", "copj"], p: 0.55,
      cond: (f) => ["magasin", "arrachage", "transport", "tire"].includes(f.sc) && !(f.itt > 0),
      tirer(r, f) {
        const agg = (f.agg || []).filter((a) => a !== "violence0").slice(0, 1).concat(["violence0"]);
        const f1 = Object.assign({}, f, { agg, itt: 0 });
        return { f: f1, conc: [
          { inf: "violences", f: { sc: "rue", agg: [], itt: 0, arme: null, mobile: 0 }, memeFait: true, quoi: "violence_vol", qui: f.sc === "magasin" ? "le vigile" : "la victime" },
          { inf: "rebellion", f: { sc: "interpellation", agg: [], itt: 0 } },
        ] };
      },
    },
    trafic_arme: {
      base: ["stups_trafic", "stups_detention"], genres: ["gav", "ci", "copj"], p: 0.3,
      cond: (f) => !CAT.estVariante("stups_trafic", f),
      tirer(r, f) { return { f, conc: [{ inf: "arme_b", f: { arme: pk(r, ["un pistolet semi-automatique de calibre 9 mm", "un revolver de calibre .38", "un pistolet automatique de calibre 7,65 mm"]), lieu: pk(r, ["sous le matelas", "dans une sacoche", "dans le coffre du scooter"]), munitions: int(r, 4, 15), agg: [] } }] }; },
    },
    escroquerie_faux: {
      base: ["escroquerie"], genres: ["gav", "ci", "copj"], p: 0.45,
      cond: (f) => ["annonce", "faux_plombier", "location"].includes(f.sc),
      tirer(r, f) { return { f, conc: [{ inf: "faux_usage", f: { sc: "attestation", admin: false, agg: [] }, memeFait: true, quoi: "usage_manoeuvre", doc: { annonce: "une fausse facture d'achat de la console", faux_plombier: "un faux ordre d'intervention à l'en-tête du syndic", location: "un faux mandat de gestion locative signé du propriétaire" }[f.sc] }] }; },
    },
    rebellion_outrage: {
      base: ["rebellion"], genres: ["gav", "ci", "copj"], p: 0.5,
      tirer(r, f) { return { f, conc: [{ inf: "outrage", f: { sc: "controle", agg: (f.agg || []).includes("reunion") ? ["reunion"] : [], cible: "pdap" } }] }; },
    },
    alcool_permis: {
      base: ["alcool"], genres: ["gav", "ci", "copj"], p: 0.35,
      cond: (f) => !f.refus && f.taux >= 0.4,
      tirer(r, f) { return { f, conc: [{ inf: "defaut_permis", f: { sc: "jamais", agg: [], vehicule: f.vehicule } }] }; },
    },
  };
  // Ce que disent les pièces et la prévention de chaque infraction ajoutée (X : contexte du récit, t : le tirage, c : l'infraction)
  // prevention : la suite de « Vous êtes prévenu d'avoir… » ; constat : les lignes du procès-verbal ; fait : le passage à noter
  CAT.CONC_RECIT = {
    violences: (X, t, c) => {
      const qui = c.qui === "le vigile" ? "le vigile du magasin" : X.nf(t.V);
      return { prevention: `volontairement commis des violences n'ayant entraîné aucune incapacité totale de travail sur ${qui}, en ${c.qui === "le vigile" ? "le" : X.la(t.V)} repoussant pour prendre la fuite`, constat: `Pour s'enfuir avec ${t.f.sc === "magasin" ? "la marchandise" : "l'objet"}, ${X.n(t.A)} repousse des deux mains ${qui}, qui tente de ${X.la(t.A)} retenir ; c'est le seul geste de violence relevé.`, fait: "G_meme_fait", label: "Un seul geste de violence : la poussée pour s'enfuir" };
    },
    rebellion: (X, t) => ({ prevention: `opposé une résistance violente aux gardiens de la paix ${t.gpx[0]} et ${t.gpx[1]}, agissant dans l'exercice de leurs fonctions pour l'exécution des lois, en se débattant lors de son interpellation`, constat: `Lors du menottage, ${X.n(t.A)} se débat, donne des coups de coude et tente de se dégager ; il faut deux fonctionnaires pour ${X.la(t.A)} maîtriser.`, fait: "G_conc_rebellion", label: "La résistance au menottage" }),
    outrage: (X, t) => { const ins = X.lex("ins_flic"); return { prevention: `adressé aux gardiens de la paix ${t.gpx[0]} et ${t.gpx[1]}, dans l'exercice de leurs fonctions, des paroles de nature à porter atteinte à leur dignité et au respect dû à leur fonction, en l'espèce « ${ins} »`, constat: `Avant l'interpellation, ${X.n(t.A)} lance aux fonctionnaires : « ${ins} ».`, fait: "G_conc_outrage", label: "Les insultes aux policiers, avant l'interpellation" }; },
    arme_b: (X, t, c) => ({ prevention: `détenu sans autorisation une arme de catégorie B, en l'espèce ${c.f.arme}, et ${c.f.munitions} cartouches`, constat: `Au cours de la perquisition, découvrons ${c.f.arme}, ${c.f.lieu}, chargeur garni de ${c.f.munitions} cartouches ; le fichier des détenteurs d'armes ne fait apparaître aucun titre à son nom.`, fait: "G_conc_arme", label: "L'arme découverte à la perquisition" }),
    faux_usage: (X, t, c) => ({ prevention: `fabriqué ${c.doc} et fait usage de ce faux en le remettant à ${X.nf(t.V)} pour obtenir la remise des fonds`, constat: `Le document que ${X.n(t.A)} a remis à ${X.nf(t.V)} pour obtenir la remise des fonds, ${c.doc}, est un faux : l'en-tête et la signature ont été fabriqués.`, fait: "G_meme_fait", label: "Le faux remis à la victime pour obtenir l'argent" }),
    defaut_permis: (X, t, c) => ({ prevention: `conduit le véhicule ${c.f.vehicule || "en cause"} sans être titulaire du permis de conduire correspondant à sa catégorie`, constat: `Interrogé sur son permis de conduire, ${X.n(t.A)} déclare ne l'avoir jamais passé ; la consultation du fichier national des permis de conduire le confirme.`, fait: "G_conc_permis", label: "Jamais titulaire du permis de conduire" }),
  };
  // Le cumul écarté : la qualification qu'on écarte, et pourquoi (pour le jugement, le débrief et la fiche)
  CAT.CUMUL = {
    violence_vol: { ecarte: "les violences volontaires", motif: "La poussée pour s'enfuir est déjà la circonstance aggravante de violences du vol : un même fait ne peut fonder à la fois une circonstance aggravante et une seconde déclaration de culpabilité.", textes: ["JP_CRIM_2021_12_15", "CP_311-4"] },
    usage_manoeuvre: { ecarte: "l'usage de faux", motif: "La remise du faux à la victime est la manœuvre frauduleuse de l'escroquerie : l'usage n'est qu'un élément constitutif de l'escroquerie ; seule la fabrication du faux peut être retenue en plus.", textes: ["JP_CRIM_2021_12_15", "CP_313-1", "CP_441-1"], reste: "faux" },
  };
  // Tire un scénario pour l'infraction principale (ou rien) : { scenario, f (faits principaux, éventuellement complétés), conc }
  CAT.tirerConcours = function (r, inf, f, genre) {
    for (const [id, S0] of Object.entries(CAT.CONCOURS)) {
      if (!S0.base.includes(inf) || !S0.genres.includes(genre) || (S0.cond && !S0.cond(f))) continue;
      if (r() >= S0.p) continue; // un scénario manqué laisse sa chance au suivant (version 4)
      const o = S0.tirer(r, f);
      const conc = o.conc.map((c) => Object.assign({}, c, { q: CAT.qualifier(c.inf, c.f) })).filter((c) => c.q);
      return conc.length ? { scenario: id, f: o.f, conc } : null;
    }
    return null;
  };
})();
