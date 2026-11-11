/* La Permanence — générateur de petites affaires (première version, conservée pour les anciennes sauvegardes).
   Depuis la phase 1 du moteur génératif (cat-*.js, gen-*.js), GEN.params délègue à CR.GEN2 ; ce fichier garde
   la planification des permanences, les appels et la reconstruction des affaires tirées avant le moteur.
   Trois familles, construites à partir des mêmes briques que les grandes affaires :
   - gav : appel de la permanence pénale (jour ou nuit), garde à vue au commissariat du 18e, orientation par le parquet,
           et parfois déferrement en comparution immédiate le lendemain ;
   - ci  : permanence des comparutions immédiates, un dossier attribué à midi, jugé l'après-midi ;
   - op  : un client payant qui a reçu une ordonnance pénale (opposition dans les 45 jours, art. 495-3).
   Chaque affaire générée est décrite par des paramètres sérialisables (s.generated) ; sa définition est reconstruite
   au chargement d'une sauvegarde. */
(function () {
  const CR = window.CR;
  const R = CR.R;
  const PEN = CR.PEN;
  const AUD = CR.AUD;
  const GEN = (CR.GEN = {});

  const PM = ["Mehdi", "Kevin", "Julien", "Moussa", "Thomas", "Bilal", "Nicolas", "Ibrahima", "Florian", "Sofiane", "Damien", "Alexandre", "Yacine", "Maxime", "Samir", "Loïc", "Adama", "Romain", "Anis", "Quentin"];
  const PF = ["Inès", "Laura", "Fatou", "Camille", "Sarah", "Amel", "Julie", "Aïcha", "Manon", "Léa", "Nadia", "Océane", "Kenza", "Marine", "Assia", "Pauline"];
  const NOMS = ["Bensaïd", "Martin", "Diarra", "Lefebvre", "Haddad", "Moreau", "Traoré", "Girard", "Mansouri", "Petit", "Camara", "Roux", "Belkacem", "Fournel", "Sissoko", "Garnier", "Amrani", "Lambert", "Kone", "Dubois", "Chérif", "Bonnet", "Fofana", "Lemoine"];
  const METIERS = [["livreur", true], ["serveur", true], ["agent d'entretien", true], ["étudiant", false], ["sans emploi", false], ["préparateur de commandes", true], ["vendeur", true], ["chauffeur VTC", true], ["intérimaire dans le bâtiment", true], ["sans emploi", false]];
  const RUES = ["rue Marcadet", "rue Ordener", "boulevard Barbès", "rue de Clignancourt", "rue Championnet", "rue Myrha", "rue Doudeauville", "rue Ramey", "rue Custine", "rue Labat"];
  const OPJ = ["opj_marchetti", "opj_rocher", "opj_benali"];
  const PQ = ["pq_delahaye", "pq_haddou", "pq_riboulet"];
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const GEN2PR = () => CR.GEN2.PR;
  const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  const hm = (m) => CR.fmtTime(((m % 1440) + 1440) % 1440);

  // ------------------------------------------------------------------ Infractions des petites affaires
  const INF = {
    vol_magasin: {
      court: "art. 311-3 CP", card: "CP_311-1", label: "vol", prison: 36, amende: 45000, gravite: 0.25, victime: null,
      titre: "le vol au supermarché", prevention: (p) => `soustrait frauduleusement ${p.d.objet} au préjudice du supermarché de la ${p.d.rue}`,
      detail: (r) => ({ objet: pick(r, ["trois paires d'écouteurs sans fil", "des bouteilles de whisky pour 160 euros", "des produits de beauté pour 210 euros", "deux manettes de console"]) }),
      constat: "Interpellé à la sortie des caisses par l'agent de sécurité, la marchandise dans son sac à dos.",
      version: "J'avais plus un rond. J'ai pris, j'ai pas réfléchi.",
      audition: [
        { q: "Reconnaissez-vous avoir quitté le magasin sans payer ces articles ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: "Oui. Je les ai mis dans mon sac.", partiel: "Je reconnais les avoir pris." } },
        { q: "Ce n'est pas la première fois, n'est-ce pas ? Le vigile dit vous avoir déjà vu.", a: { silence: "…", expliquer: "Je viens faire mes courses ici, c'est tout.", partiel: "Je n'ai rien à ajouter." } },
      ],
      requis: { ferme: 0, sursis: 4 }, requisRecidive: { ferme: 4, sursis: 4 },
    },
    recel: {
      court: "art. 321-1 CP", card: null, label: "recel de vol", prison: 60, amende: 375000, gravite: 0.4, victime: null,
      titre: "le téléphone volé", prevention: (p) => `sciemment recelé un téléphone portable qu'il savait provenir d'un vol commis le ${CR.fmtDate(p.day - 1, "long")}`,
      detail: () => ({}),
      constat: "Contrôlé rue Myrha, en possession d'un téléphone signalé volé la veille ; il propose de le revendre à un passant.",
      version: "Je l'ai acheté quarante euros à un gars, à Barbès. Je savais pas qu'il était volé.",
      audition: [
        { q: "Où avez-vous obtenu ce téléphone ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: "Je l'ai acheté quarante euros à un gars, à la sortie du métro.", partiel: "Je l'ai acheté." } },
        { q: "Quarante euros pour un téléphone qui en vaut mille : vous saviez qu'il était volé ?", fq: "G_q_prix", a: { silence: "…", expliquer: "Je me suis dit que c'était une bonne affaire. Bon, oui, je me doutais.", partiel: "Je n'ai rien à ajouter." } },
      ],
      requis: { ferme: 0, sursis: 6 }, requisRecidive: { ferme: 6, sursis: 6 },
    },
    alcool: {
      court: "art. L. 234-1 C. route", card: "CR_L234-1", label: "conduite d'un véhicule sous l'empire d'un état alcoolique", prison: 24, amende: 4500, gravite: 0.3, victime: null,
      titre: "le contrôle d'alcoolémie", prevention: (p) => `conduit un véhicule sous l'empire d'un état alcoolique caractérisé par une concentration d'alcool de ${p.d.taux} mg par litre d'air expiré`,
      detail: (r) => ({ taux: pick(r, ["0,52", "0,61", "0,74", "0,48"]) }),
      constat: "Contrôlé boulevard Barbès après un franchissement de feu orange ; dépistage positif, conduite au commissariat pour vérification par éthylomètre.",
      version: "J'avais bu deux bières à un anniversaire. Je me sentais bien.",
      audition: [
        { q: "Combien de verres aviez-vous bus ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: "Deux bières. Peut-être trois.", partiel: "Je reconnais avoir bu." } },
        { q: "Vous avez besoin de votre permis pour travailler ?", a: { silence: "…", expliquer: "Oui. Sans permis, je perds mon travail.", partiel: "Oui." } },
      ],
      requis: { ferme: 0, sursis: 2, complementaires: ["quatre mois de suspension du permis de conduire"] }, requisRecidive: { ferme: 3, sursis: 3, complementaires: ["annulation du permis de conduire"] },
    },
    rebellion: {
      court: "art. 433-6 et 433-7 CP", card: null, label: "rébellion", prison: 24, amende: 30000, gravite: 0.35, victime: "Le gardien de la paix Morel",
      titre: "la rébellion", prevention: () => "opposé une résistance violente à des personnes dépositaires de l'autorité publique agissant dans l'exercice de leurs fonctions",
      detail: () => ({}),
      constat: "Lors d'un contrôle d'identité rue Doudeauville, se débat au moment du menottage ; un gardien de la paix est légèrement blessé au poignet.",
      version: "Ils m'ont plaqué contre la voiture sans raison. J'ai juste essayé de me dégager.",
      audition: [
        { q: "Pourquoi avez-vous résisté à l'interpellation ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: "Ils m'ont plaqué contre la voiture, j'ai eu peur, je me suis dégagé.", partiel: "J'ai eu peur." } },
        { q: "Le gardien Morel a une entorse au poignet. Vous l'avez frappé ?", a: { silence: "…", expliquer: "Non ! Je l'ai jamais frappé. J'ai tiré mon bras.", partiel: "Je ne l'ai pas frappé." } },
      ],
      requis: { ferme: 0, sursis: 4 }, requisRecidive: { ferme: 4, sursis: 4 },
    },
    violences: {
      court: "art. 222-13 CP", card: null, label: "violences volontaires en réunion ayant entraîné une incapacité totale de travail n'excédant pas huit jours", prison: 36, amende: 45000, gravite: 0.4, victime: "M. Jérémy Vidal",
      titre: "la bagarre de la sortie de bar", prevention: () => "volontairement commis des violences sur M. Jérémy Vidal, en réunion, ayant entraîné une incapacité totale de travail de trois jours",
      detail: () => ({}),
      constat: "Bagarre à la sortie d'un bar de la rue Ramey ; la victime désigne deux hommes, dont lui, rattrapé par la patrouille.",
      version: "Il a insulté ma copine. On s'est poussés. J'ai mis un coup, un seul.",
      audition: [
        { q: "Avez-vous frappé M. Vidal ?", a: { silence: "Je ne souhaite pas répondre.", expliquer: "Une fois. Il avait insulté ma copine.", partiel: "Je reconnais un coup, un seul." } },
        { q: "Votre ami aussi a frappé. Qui a commencé ?", a: { silence: "…", expliquer: "C'est lui qui m'a poussé en premier.", partiel: "Il m'a poussé le premier." } },
      ],
      requis: { ferme: 0, sursis: 6 }, requisRecidive: { ferme: 6, sursis: 6 },
    },
  };
  const ANOM = {
    gav_notif: { irreg: "gav_notif_tardive" },
    interprete: { irreg: "interprete_absent" },
  };

  // ------------------------------------------------------------------ Paramètres d'une affaire générée (sérialisables)
  function person(r, opts) {
    const g = r() < 0.78 ? "m" : "f";
    const prenom = pick(r, g === "m" ? PM : PF);
    const nom = pick(r, NOMS);
    const age = int(r, opts.minAge || 19, opts.maxAge || 48);
    const [metier, emploi] = pick(r, METIERS);
    const rue = pick(r, RUES);
    const casier = r() < 0.55 ? 0 : r() < 0.6 ? 1 : 2;
    const an = 2026 - age;
    return { prenom, nom, g, age, metier, emploi, heberg: r() < 0.82, casier, rue, tel: `07 ${int(r, 10, 99)} ${int(r, 10, 99)} ${int(r, 10, 99)} ${int(r, 10, 99)}`, naissance: `le ${int(r, 1, 28)} ${pick(r, ["janvier", "mars", "mai", "juin", "septembre", "novembre"])} ${an} à ${pick(r, ["Paris", "Saint-Denis", "Bobigny", "Créteil", "Argenteuil", "Bamako", "Alger", "Lille"])}`, adresse: `${rue}, Paris 18e`, trust: 45 };
  }
  GEN.params = function (s, kind, extra = {}) {
    // Moteur génératif (phase 1) : toutes les nouvelles affaires ; l'ancien tirage ne sert plus qu'aux anciennes sauvegardes
    if (CR.GEN2 && CR.GEN2.GENRES[kind] && !extra.ancien) return CR.GEN2.params(s, kind, extra);
    s.genCount = (s.genCount || 0) + 1;
    const id = `g_${kind}_${s.genCount}`;
    const seed = id + ":" + s.seed;
    const r = CR.seeded(seed);
    const infs = kind === "op" ? ["alcool", "vol_magasin"] : Object.keys(INF);
    const inf = pick(r, infs);
    const p = {
      id, kind, seed, day: s.day, inf, night: !!extra.night,
      client: person(r, kind === "op" ? { minAge: 24, maxAge: 58 } : {}),
      d: INF[inf].detail(r),
      opj: pick(r, OPJ), parquet: pick(r, PQ),
      debut: extra.night ? int(r, 22 * 60, 23 * 60 + 40) - 1440 : (extra.min || s.min) - int(r, 60, 150),
      anomaly: r() < 0.38 ? (r() < 0.75 ? "gav_notif" : "interprete") : null,
      ethylo: inf === "alcool" && r() < 0.45,
      erreurPV: r() < 0.6,
    };
    if (p.anomaly === "interprete") p.client.etranger = pick(r, ["roumanophone", "anglophone, de nationalité ghanéenne", "arabophone, de nationalité égyptienne"]);
    if (kind === "op") { p.notif = s.day - int(r, 6, 38); while (!CR.isBusinessDay(p.notif)) p.notif--; p.client.emploi = true; p.anomaly = null; }
    s.generated = s.generated || [];
    s.generated.push(p);
    return p;
  };
  GEN.build = function (p) {
    const def = p.gen === 2 ? CR.GEN2.def(p) : p.kind === "op" ? buildOp(p) : buildPenal(p);
    def.generated = true;
    CR.defineCase(def);
    return def;
  };
  GEN.open = function (s, kind, extra) {
    const p = GEN.params(s, kind, extra);
    GEN.build(p);
    const cs = CR.openCase(s, p.id);
    return cs;
  };
  GEN.paramsOf = (s, id) => (s.generated || []).find((p) => p.id === id) || { t: null };
  CR.restoreGenerated = function (s) {
    if (CR.GEN2 && CR.GEN2.histDepuisPartie) CR.GEN2.histDepuisPartie(s);
    for (const p of s.generated || []) if (!CR.CASES[p.id]) { try { GEN.build(p); } catch (e) { console.error("Affaire générée non reconstruite", p.id, e); } }
  };

  // ------------------------------------------------------------------ Permanences : planification des appels
  CR.planDuty = function (s, day, type) {
    const r = CR.seeded("duty" + day + type + s.seed);
    const at = (d, m) => (d === s.day && m <= s.min + 20 ? (s.min + 40 < 19 * 60 ? s.min + 40 : null) : m);
    if (type === "gav_jour") {
      const n = r() < 0.7 ? 1 : 2;
      for (let i = 0; i < n; i++) { const m = at(day, 9 * 60 + 40 + int(r, 0, 7 * 60)); if (m != null) CR.schedule(s, { day, min: m, type: "fn", key: "dutyCall", data: { kind: "gav", day } }); }
    } else if (type === "gav_nuit") {
      if (r() < 0.85) CR.schedule(s, { day: day + 1, min: int(r, 30, 5 * 60 + 30), type: "fn", key: "dutyCall", data: { kind: "gav", night: true, day: day + 1 } });
    } else if (type === "ci") {
      const n = r() < 0.55 ? 1 : 2;
      for (let i = 0; i < n; i++) { const m = at(day, 12 * 60 + 10 + i * 35); if (m != null && m < 16 * 60) CR.schedule(s, { day, min: m, type: "fn", key: "dutyCall", data: { kind: "ci", day } }); }
    }
  };
  CR.GLOBAL_FN.dutyCall = function (s, d) {
    if (s.burnout || s.gameOver) return;
    if (d.day != null && s.day !== d.day) {
      CR.log(s, "Pendant votre permanence, la permanence pénale de l'Ordre n'a pas pu vous joindre : un confrère a été désigné à votre place.", "bad");
      CR.rep(s, "confreres", -1, "permanence manquée");
      return;
    }
    const cs = GEN.open(s, d.kind, { night: !!d.night, min: s.min });
    CR.runHook(s, cs, "arrive", {});
  };
  // Nouveaux clients : une convocation au tribunal, une audition libre, une victime, une ordonnance pénale
  GEN.lead = function (s, d, kind, extra) {
    const cs = GEN.open(s, kind || (CR.GEN2 ? CR.GEN2.leadKind(s) : "op"), extra || {});
    CR.runHook(s, cs, "arrive", {});
  };

  // =================================================================== GARDE À VUE et COMPARUTION IMMÉDIATE
  function buildPenal(p) {
    const I = INF[p.inf];
    const C = p.client;
    const nomc = `${C.prenom} ${C.nom}`;
    const il = C.g === "f" ? "elle" : "il";
    const Il = C.g === "f" ? "Elle" : "Il";
    const e = C.g === "f" ? "e" : "";
    const rec = C.casier === 2;
    const ci = p.kind === "ci";
    const notifMin = p.anomaly === "gav_notif" ? p.debut + int(CR.seeded(p.seed + "n"), 140, 190) : p.debut + 15;
    const prisonMax = rec ? I.prison * 2 : I.prison;
    const anomalies = {};
    if (p.anomaly === "gav_notif") anomalies.gav_notif = { irreg: "gav_notif_tardive", piece: "pv_notification", annule: ["auditions_gav"] };
    if (p.anomaly === "interprete") anomalies.interprete = { irreg: "interprete_absent", piece: "pv_notification", annule: ["auditions_gav"] };
    const facts = {
      G_heberg: { label: C.heberg ? `Un hébergement stable, ${C.rue}` : "Pas d'hébergement stable", key: true, why: "La première garantie de représentation : sans adresse, ni contrôle judiciaire ni aménagement." },
      G_casier: { label: C.casier ? (rec ? "Une condamnation récente pour des faits similaires : la récidive" : "Une ancienne condamnation") : "Aucune condamnation", key: true, why: rec ? "La récidive légale double le maximum encouru (art. 132-10)." : "" },
      G_version: { label: "Sa version des faits" },
    };
    if (p.anomaly === "gav_notif") facts.G_notif = { label: "Ses droits notifiés plus de deux heures après le début de la mesure", key: true, why: "Un retard que ne justifie aucune circonstance insurmontable entraîne la nullité de la garde à vue (art. 63-1)." };
    if (p.anomaly === "interprete") facts.G_langue = { label: `${Il} comprend mal le français`, key: true, why: "La personne qui ne comprend pas le français a droit à un interprète à chaque étape (art. 63-1)." };
    if (C.emploi && CR.MONDE.travaille(C)) facts.G_emploi = { label: `Un emploi : ${C.metier}`, key: true };
    if (p.ethylo) facts.G_ethylo = { label: "Le PV ne mentionne pas la vérification de l'éthylomètre" };

    // Pièces lisibles en entier (feuille de route, n° 2) : heures, mentions et signatures ; l'anomalie n'est jamais signalée
    const jf = p.day + (p.debut < 0 ? -1 : 0);
    const D = (d) => CR.fmtDate(d, "long");
    const opjN = (CR.acteur(p.opj) || {}).nom || "l'officier de police judiciaire";
    const proc = `2026/18/${String(5000 + (Math.abs(p.debut) * 7 + p.day * 13) % 4000).padStart(4, "0")}`;
    const lui = C.g === "f" ? "elle" : "lui";
    const notifTexte = p.anomaly === "interprete"
      ? { t: `À ${hm(p.debut + 15)}, notifions à ${nomc} ses droits, en langue française ; ${il} déclare comprendre et signe.`, f: "G_notif_fr", flag: "interprete" }
      : { t: `À ${hm(notifMin)}, notifions à ${nomc} ses droits : être examiné par un médecin, faire prévenir un proche et son employeur, être assisté par un avocat, faire des déclarations, répondre aux questions ou se taire.`, f: "G_notif_pv", flag: p.anomaly === "gav_notif" ? "gav_notif" : undefined };
    const camera = { violences: "Les faits se sont déroulés devant le bar de la rue Ramey, dont la façade est équipée d'une caméra.", rebellion: "Le contrôle a lieu devant un bureau de tabac de la rue Doudeauville, dont la vitrine est équipée d'une caméra." }[p.inf];
    const S = "signé";

    const docs = {
      pv_notification: () => ({ title: "Procès-verbal de placement en garde à vue et de notification des droits", kind: "pv", entete: ["Préfecture de police · Commissariat central du 18e arrondissement", `Procédure n° ${proc} — cote D3`], paras: [
        [`Le ${D(jf)}, à ${hm(p.debut + 10)}, nous, ${opjN}, officier de police judiciaire en fonction au commissariat central du 18e arrondissement,`],
        ["Vu les articles 62-2, 63 et 63-1 à 63-4-3 du code de procédure pénale ; vu le procès-verbal d'interpellation (cote D1) ;"],
        [{ t: `Placement en garde à vue de ${nomc}, né${e} ${C.naissance}, ${C.metier}, décidé par l'officier de police judiciaire, avec effet à ${hm(p.debut)}, heure de l'interpellation.`, f: "G_debut" }],
        [`Motifs : raisons plausibles de soupçonner ${lui === "elle" ? "qu'elle a" : "qu'il a"} commis ${I.label === "vol" ? "un vol" : `des faits de ${I.label}`} ; la mesure est l'unique moyen de permettre les investigations et de garantir sa présentation devant le procureur de la République (art. 62-2, 1° et 2°).`],
        [`Avis au procureur de la République à ${hm(p.debut + 20)}.`],
        [notifTexte],
        [{ t: "Interprète : sans objet, la personne déclarant comprendre le français.", flag: p.anomaly === "interprete" ? "interprete" : undefined }],
        ["Lui remettons le document énonçant ses droits (art. 803-6)."],
        [`La personne demande l'assistance d'un avocat commis d'office. Avis à la permanence des avocats à ${hm((p.anomaly === "gav_notif" ? notifMin : p.debut + 15) + 5)}.`],
        ["Dont procès-verbal, que la personne signe avec nous après lecture."],
      ], sigs: [{ qui: opjN + ", officier de police judiciaire", t: S }, { qui: "La personne gardée à vue", t: S }, { qui: "L'interprète (le cas échéant)", t: "", flag: p.anomaly === "interprete" ? "interprete" : undefined }] }),
      pv_interpellation: () => ({ title: "Procès-verbal d'interpellation", kind: "pv", entete: ["Commissariat central du 18e arrondissement", `Procédure n° ${proc} — cote D1`], paras: [
        [`Le ${D(jf)}, nous, Karim Ouali et Léa Perret, gardiens de la paix, agents de police judiciaire en patrouille dans le 18e arrondissement :`],
        [I.constat],
        [`Interpellation à ${hm(p.debut)}.`],
        p.anomaly === "interprete" ? [{ t: `La personne s'exprime avec difficulté en français ; ${il} est ${C.etranger}. Ses réponses se font par gestes et par mots isolés.`, f: "G_langue", paire: "interprete" }] : [`La personne décline son identité : ${nomc}.`],
        camera ? [{ t: camera, f: "G_camera" }] : ["Aucun témoin ne se fait connaître."],
        [`Conduite au commissariat central du 18e ; présentation à l'officier de police judiciaire à ${hm(p.debut + 8)}.`],
        ["Dont procès-verbal."],
      ], sigs: [{ qui: "Gardien de la paix K. Ouali", t: S }, { qui: "Gardienne de la paix L. Perret", t: S }] }),
      casier: () => ({ title: "Bulletin n° 1 du casier judiciaire", kind: "greffe", entete: ["Ministère de la Justice · Casier judiciaire national", "107, rue du Landreau, 44317 Nantes"], paras: [["Relevé délivré à l'autorité judiciaire."], [`Identité : ${C.nom} ${C.prenom}, né${e} ${C.naissance}.`], [{ t: C.casier === 0 ? "Néant." : rec ? `Tribunal correctionnel de Paris, il y a dix-huit mois : ${I.label}, quatre mois d'emprisonnement avec sursis.` : (() => { const n = CR.MONDE.ansCasier(C, 9); return CR.MONDE.casierMineur(C) ? `Tribunal pour enfants de Paris, il y a ${n > 1 ? "deux ans" : "un an"} : vol, avertissement judiciaire.` : `Tribunal correctionnel de Bobigny, il y a ${n} an${n > 1 ? "s" : ""} : vol, amende de 300 euros.`; })(), f: "G_casier_b1" }]] }),
      esr: () => ({ title: "Enquête sociale rapide", kind: "courrier", entete: ["Association de contrôle judiciaire — permanence du dépôt", "Article 41, alinéa 7, du code de procédure pénale"], paras: [
        [`Entretien avec ${nomc} au dépôt du tribunal.`],
        [{ t: C.heberg ? `Domicile déclaré : ${C.rue}, Paris 18e, vérifié par téléphone.` : "Pas de domicile stable : hébergé chez des amis, de façon intermittente.", f: "G_esr" }],
        [C.emploi && CR.MONDE.travaille(C) ? `Activité : ${C.metier}.` : /^étudiant/.test(C.metier) ? `Situation : ${C.metier}.` : "Sans activité déclarée."],
        [C.casier ? "Antécédents déclarés, conformes au casier." : "Aucun antécédent déclaré."],
        [`Avis : ${C.heberg ? "pas d'objection à une mesure alternative à la détention si l'hébergement est confirmé par écrit" : "garanties de représentation fragiles en l'absence de domicile"}.`],
      ], sigs: [{ qui: "L'enquêteur social", t: S }] }),
      enq_video: (x) => ({ title: "Procès-verbal de constat — images de vidéosurveillance", kind: "video", entete: ["Me Laure Dumas, commissaire de justice", "Rue de Clignancourt, 75018 Paris"], paras: [
        [`À la requête de ${nomc}, représenté${e} par Me ${x.s.player.prenom} ${x.s.player.nom}, j'ai visionné les images de la caméra ${p.inf === "violences" ? "du bar de la rue Ramey" : "du bureau de tabac de la rue Doudeauville"}, conservées à la demande de l'avocat.`],
        [`Horodatage : ${CR.fmtDate(jf, "num")}.`],
        p.inf === "violences"
          ? [`${hm(p.debut - 4).replace(" h ", ":")} — Trois hommes se poussent sur le trottoir. `, { t: "Deux d'entre eux portent des coups au troisième, en même temps ; l'image ne permet pas de distinguer lequel frappe au visage.", f: "G_victime_doute" }]
          : [`${hm(p.debut - 2).replace(" h ", ":")} — Deux policiers plaquent un homme contre un véhicule. `, { t: "L'homme tire son bras pour se dégager au moment du menottage ; aucun coup de poing ni de pied n'est visible.", f: "G_victime_doute" }],
        ["Copie des images remise à l'avocat requérant."],
      ], sigs: [{ qui: "Me L. Dumas, commissaire de justice", t: S }] }),
    };
    if (I.victime) docs.pv_victime = () => ({ title: "Procès-verbal d'audition de la victime", kind: "pv", entete: ["Commissariat central du 18e arrondissement", `Procédure n° ${proc} — cote D5`], paras: [
      [`Le ${D(jf)}, à ${hm(p.debut + 45)}, entendons ${I.victime}, qui déclare :`],
      [`${I.victime} déclare avoir été blessé${p.inf === "rebellion" ? " au poignet lors du menottage" : ", trois jours d'ITT"}.`],
      [{ t: p.inf === "violences" ? "« Ils étaient deux. Je ne sais pas lequel m'a frappé au visage. »" : "« Il tirait son bras de toutes ses forces. Je ne peux pas dire qu'il m'a frappé. »", f: "G_victime_doute" }],
      ["Lecture faite, persiste et signe."],
    ], sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "La personne entendue", t: S }] });
    const docTitles = { pv_notification: "Notification des droits (D3)", pv_interpellation: "Interpellation (D1)", casier: "Casier judiciaire", esr: "Enquête sociale rapide", pv_victime: "Audition de la victime (D5)" };
    const enquete = camera ? [{ id: "video", type: "video", titre: p.inf === "violences" ? "La caméra du bar de la rue Ramey" : "La caméra du bureau de tabac", desc: "Une caméra privée, à l'endroit des faits. Le gérant dit que les images sont écrasées au bout de sept jours.", piste: ["G_camera"],
      limite: () => jf + 7,
      modes: [{ id: "lettre", label: "Écrire au gérant et au parquet", sub: "Demande de conservation, copie au parquet. Gratuit, mais il faut le temps que la demande arrive.", temps: 25, delai: 8, saisie: 3 }, { id: "constat", label: "Mandater un commissaire de justice pour un constat", sub: "Il visionne les images sur place dès le lendemain.", argent: 380, frais: "Constat de commissaire de justice", delai: 3, saisie: 1 }],
      doc: "enq_video", titrePiece: "Constat : les images de la caméra",
      envoi: (api, st) => ({ from: st.mode === "constat" ? "Me Laure Dumas, commissaire de justice" : "Parquet de Paris", subject: "Images de la caméra", body: [["Maître, vous trouverez ci-joint le procès-verbal de constat des images."]] }),
      perdu: (api, st, lim) => ({ from: "Le gérant", subject: "Les images", body: [[`Maître, les images du ${CR.fmtDate(jf, "long")} ont été écrasées le ${CR.fmtDate(lim + 1, "long")}.`]] }) }] : [];

    const entretien = {
      opening: [p.anomaly === "interprete" ? `${nomc} vous regarde, inquiet${e}. « Pardon… je parle pas bien français. »` : `${nomc} est assis${e} sur le banc de la cellule. « Ils m'ont dit que vous étiez l'avocat. »`],
      topics: [
        { id: "g_faits", q: "Racontez-moi ce qui s'est passé.", a: [{ t: I.version, f: "G_version" }], cost: 5 },
        { id: "g_heure", q: "À quelle heure vous a-t-on notifié vos droits ?", a: p.anomaly === "gav_notif" ? ["Longtemps après. Ils m'ont laissé dans le couloir, les photos, les empreintes…", { t: `C'était vers ${hm(notifMin)}, j'ai vu l'horloge.`, f: "G_notif" }] : p.anomaly === "interprete" ? [{ t: "Un papier en français. J'ai signé. J'ai pas tout compris.", f: "G_langue" }] : ["Tout de suite, au début. Un papier à signer."], cost: 3, tag: "good" },
        { id: "g_logement", q: "Où habitez-vous ? Avec qui ?", a: [{ t: C.heberg ? `${C.rue}, chez ma ${pick(CR.seeded(p.seed + "h"), ["mère", "sœur", "tante"])}. Elle peut le confirmer.` : "Un peu chez des potes. J'ai pas d'adresse fixe en ce moment.", f: "G_heberg" }], cost: 3, tag: "good" },
        { id: "g_travail", q: "Vous travaillez ?", a: [GEN2PR().travaillez({ pk: (k, a) => a[0] }, C, "t")], cost: 2 },
        { id: "g_casier", q: "Avez-vous déjà été condamné ?", a: [{ t: C.casier === 0 ? "Jamais." : rec ? "Oui, il y a un an et demi. Le même genre de chose. Du sursis." : `Une fois, ${CR.MONDE.casierAncien(C) || "il y a longtemps"}. Une amende.`, f: "G_casier" }], cost: 2 },
      ],
      start: ["g_faits", "g_heure", "g_logement", "g_travail", "g_casier"],
    };
    const observations = [];
    if (p.anomaly === "gav_notif") observations.push({ id: "obs_notif", t: `Les droits ont été notifiés à ${hm(notifMin)}, pour une mesure ayant débuté à ${hm(p.debut)}, sans circonstance insurmontable mentionnée (art. 63-1).`, flag: "gav_notif", need: "G_notif" });
    if (p.anomaly === "interprete") observations.push({ id: "obs_interprete", t: "La personne, qui comprend mal le français, s'est vu notifier ses droits sans interprète (art. 63-1).", flag: "interprete", need: "G_langue" });
    observations.push({ id: "obs_garanties", t: "Mon client dispose d'un hébergement et d'attaches stables.", need: "G_heberg" });

    function orientation(api) {
      const { s, cs } = api;
      const c = cs.vars.conseilGav || "expliquer";
      const obsNull = (p.anomaly && cs.flags["obs_" + p.anomaly]) ? 1 : 0;
      const opts = [
        { voie: "classement", poids: 0.1 + obsNull * 0.6 + (c === "silence" ? 0.12 : 0) },
        { voie: "alternative", poids: C.casier === 0 ? 0.7 + (c !== "silence" ? 0.2 : 0) - I.gravite * 0.5 : 0.08 },
        { voie: "copj", poids: 0.55 },
        { voie: "ci", poids: (rec ? 0.9 : C.casier ? 0.25 : 0.05) + I.gravite * 0.4 - obsNull * 0.3 + (!C.heberg ? 0.25 : 0) },
      ];
      return CR.ACT.parquetChoix(api, opts).voie;
    }

    const def = {
      id: p.id, camp: "defense", domaine: ci ? "ci" : "gav", domaineLib: ci ? "pp_jugement" : "pp_enquete",
      title: `${C.nom} — ${I.titre}`,
      client: { prenom: C.prenom, nom: C.nom, g: C.g, age: C.age, metier: C.metier, tel: C.tel, trust: 45, naissance: C.naissance, adresse: C.adresse },
      caller: ci ? "Permanence des comparutions immédiates" : "Permanence pénale de l'Ordre", leadKind: "permanence", silent: true,
      profile: { wealth: 0, sens: 0.6, urgency: 1, temper: "anxieux" },
      honoraires: { aj: true },
      actors: { opj: p.opj, parquet: p.parquet, president: "pr_lacassagne" },
      proc: { stade: ci ? "ci" : "gav", nature: "delit", faits: 0, infractions: I.card ? [I.card] : [], pcConstituee: !!I.victime },
      facts, docs, docTitles, anomalies, enquete,
      penal: { no: ["nullite", "prep", "actes", "copie", "requete"] },
      calls: {
        intake: {
          label: ci ? "Permanence des comparutions immédiates" : "Permanence pénale",
          opening: [ci
            ? `Maître, ici la permanence des comparutions immédiates. Un dossier pour vous à la 23e chambre cet après-midi : ${nomc}, ${C.age} ans, déféré${e} pour ${I.label}. Le dossier est au bureau des avocats, la personne au dépôt.`
            : `Maître, ici la permanence pénale de l'Ordre. Garde à vue au commissariat central du 18e : ${nomc}, ${C.age} ans, pour ${I.label}. ${Il} a demandé un avocat commis d'office. Vous y allez ?`],
          topics: [
            { id: "p_info", q: "Que savez-vous de l'affaire ?", a: [I.constat], cost: 2, tag: "good" },
            { id: "p_oui", q: ci ? "Je prends le dossier." : "J'y vais.", a: [ci ? "Merci, maître. L'audience commence à 14 heures ; votre dossier passera dans l'après-midi." : "Merci, maître. Je préviens le commissariat."], cost: 1, tag: "good", ends: true, fx: { flags: { accepte: true } } },
            { id: "p_non", q: "Je ne peux pas, je suis pris.", a: ["Entendu, j'appelle le confrère suivant."], cost: 1, tag: "neutral", ends: true, fx: { flags: { refuse: true } } },
          ],
          start: ["p_info", "p_oui", "p_non"], patience: 50, advice: false, close: ci ? "Bonne audience, maître." : "Bonne garde à vue, maître.",
          onEnd: (api) => {
            const { s, cs } = api;
            if (cs.flags.accepte) {
              cs.status = "active"; cs.aj = true; cs.engaged = s.day; cs.lastUpdate = s.day;
              CR.unschedule(s, (ev) => ev.caseId === cs.id && (ev.key === "_permanenceExpire" || ev.key === "_leadExpire"));
              if (ci) api.run("_fixerCI", {});
              else { api.schedule(0, "_tropTard", {}, Math.min(23 * 60 + 20, s.min + 150)); CR.PROC.stade(api, "gav", "Garde à vue au commissariat central du 18e ; avocat commis d'office désigné."); }
              api.log(ci ? `Commission d'office : comparution immédiate de ${nomc}.` : `Commission d'office : garde à vue de ${nomc}.`);
            } else {
              CR.unschedule(s, (ev) => ev.caseId === cs.id);
              CR.closeCase(s, cs, { type: "declined", note: "Permanence refusée ; un confrère a pris le dossier." });
            }
          },
        },
        depot: {
          scene: "parloir", kind: "meet", label: "Entretien au dépôt", baseCost: 20,
          opening: [`Le dépôt du tribunal, sous la salle d'audience. ${nomc} a passé la nuit en garde à vue. « Il va se passer quoi ? »`],
          topics: entretien.topics.concat([{ id: "g_renvoi", q: "Je vous explique : vous pouvez être jugé aujourd'hui, ou demander un délai.", a: ["Si je demande un délai, je reste en prison ?", "D'accord. On fait ce que vous pensez."], cost: 4, tag: "good", fx: { trust: 4 } }]),
          start: entretien.start.concat(["g_renvoi"]), patience: 60, advice: false, close: "« À tout à l'heure, maître. »",
          onEnd: (api) => { api.cs.flags.depotVu = api.s.day; api.cs.flags.prepClient = api.s.day; },
        },
      },
      on: {
        arrive(api) {
          const { s, cs } = api;
          const vm = ci ? "Maître, la permanence des comparutions immédiates. Un dossier vous est attribué pour cet après-midi. Rappelez-nous vite." : `Maître, la permanence pénale. Une garde à vue au commissariat du 18e. Rappelez-nous vite, sinon nous appelons le confrère suivant.`;
          CR.ringNow(s, { from: def.caller, caseId: cs.id, kind: "permanence", data: { call: "intake" }, vmText: vm }, false);
          api.schedule(0, "_permanenceExpire", {}, Math.min(23 * 60 + 25, s.min + 45));
        },
        _permanenceExpire(api) {
          const { s, cs } = api;
          if (cs.status !== "lead") return;
          CR.rep(s, "confreres", -1, "permanence sans réponse");
          CR.closeCase(s, cs, { type: "lost-lead", note: "La permanence n'a pas pu vous joindre et a désigné un confrère." });
          s.voicemails = s.voicemails.filter((v) => v.caseId !== cs.id);
        },
        _tropTard(api) {
          const { s, cs } = api;
          if (cs.flags.gavStarted || cs.status !== "active") return;
          api.rep("confreres", -2, "commission d'office acceptée, jamais honorée");
          CR.erreur(s, cs, { id: "gav_absent", texte: "Vous avez accepté la commission d'office sans vous rendre au commissariat.", sanction: "Un autre avocat a été désigné ; la personne a attendu seule.", regul: "Aucune." });
          CR.closeCase(s, cs, { type: "transferred", note: "Un autre avocat commis d'office a assisté la personne." });
        },
        gavFin(api) {
          const { s, cs } = api;
          api.aj("gav", "Garde à vue");
          const voie = orientation(api);
          cs.vars.voie = voie;
          return voie;
        },
        _fermer(api, { voie }) {
          const { s, cs } = api;
          const out = { classement: { type: "classement" }, alternative: { type: "alternative", detail: "avertissement pénal probatoire" }, copj: { type: "done", detail: "convocation devant le tribunal correctionnel (COPJ)" } }[voie];
          if (voie === "copj") api.mail({ from: "Parquet de Paris", subject: `Convocation de ${nomc}`, kind: "greffe", body: [[`${nomc} a reçu une convocation par officier de police judiciaire pour comparaître devant le tribunal correctionnel dans quelques mois (art. 390-1). Un avocat sera désigné au titre de l'aide juridictionnelle s'il le demande.`]] });
          CR.closeCase(s, cs, out);
        },
        _fixerCI(api) {
          const { s, cs } = api;
          const day = ci ? s.day : s.day + 1;
          const min = ci ? Math.max(15 * 60, Math.min(18 * 60, s.min + 150)) : 14 * 60 + 30;
          CR.PROC.fixAudience(api, { day, min, juridiction: "ci", mode: "ci", convocDay: s.day, president: "pr_lacassagne", script: "ci", done: "apresCI", onMiss: "_absentCI", title: "Comparution immédiate — 23e chambre", duree: 40, lieu: "palais" });
          CR.PROC.stade(api, "ci", "Déferrement au parquet et comparution immédiate (art. 395).");
          if (ci) for (const k of ["pv_notification", "pv_interpellation", "casier", "esr"].concat(I.victime ? ["pv_victime"] : [])) if (!CR.hasDoc(cs, k)) api.doc(k, docTitles[k]);
        },
        _absentCI(api) {
          const { s, cs } = api;
          CR.erreur(s, cs, { id: "ci_absent", texte: "Vous n'étiez pas à la comparution immédiate.", sanction: "L'avocat de permanence a découvert le dossier à la barre.", regul: "Aucune." });
          CR.closeCase(s, cs, { type: "transferred", note: "Jugé avec l'avocat de permanence de la 23e chambre." });
        },
        renvoiDetention(api, { st }) {
          const { s, cs } = api;
          const g = ["G_attest", "G_attest_emploi", "G_heberg"].filter((f) => CR.hasFact(cs, f) || st.played.has(f)).length + (st.played.has("arg:garanties") ? 1 : 0);
          const prof = api.profil("president") || CR.PROFILS.presse;
          const score = 0.45 + (rec ? 0.2 : 0) + (C.heberg ? 0 : 0.25) + (prof.severite - 0.5) * 0.3 - g * 0.13 + (R.next(s) - 0.5) * 0.1;
          const dp = score > 0.35;
          cs.vars.renvoi = true;
          const sept = prisonMax > 84;
          const day = CR.rollForward(s.day + (sept ? R.int(s, 62, 100) : R.int(s, 15, 40)));
          cs.vars.renvoiDay = day;
          if (dp) { CR.PROC.detention(api, "dp", { etab: "sante" }); return [{ who: "president", t: `Le tribunal renvoie l'affaire au ${CR.fmtDate(day, "long")} et place le prévenu en détention provisoire jusqu'à l'audience (art. 397-3).` }]; }
          CR.PROC.detention(api, "cj", {});
          return [{ who: "president", t: `Le tribunal renvoie l'affaire au ${CR.fmtDate(day, "long")} et place le prévenu sous contrôle judiciaire.` }];
        },
        decider(api, { st }) {
          const { s, cs } = api;
          const c = cs.vars.conseilGav || "expliquer";
          const perso = ["G_attest", "G_attest_emploi", "G_heberg", "G_emploi"].filter((f) => CR.hasFact(cs, f)).length * 0.7 + (st.dernierMot === "regrets" ? 1 : 0);
          const pieces = { constat: { label: "Les constatations des policiers", sens: "charge", force: 0.45 }, auditions_gav: { label: "Les auditions de garde à vue", sens: "charge", force: c === "silence" ? 0.03 : c === "partiel" ? 0.1 : 0.18 } };
          if (I.victime) pieces.victime = { label: "Les déclarations de la victime", sens: "charge", force: 0.15 };
          if (I.victime) pieces.doute = { label: "La victime ne peut désigner l'auteur du coup", sens: "decharge", force: 0.1, need: ["G_victime_doute", "arg:doute"] };
          return PEN.juger(api, {
            st, juridiction: "ci", titre: "Jugement — comparution immédiate", prevenuNom: nomc, pcNom: I.victime || "", pcF: false,
            spec: { seuil: 0.5, pieces },
            qualif: () => ({ id: p.inf, label: I.label + (rec ? ", en état de récidive légale" : ""), court: I.court + (rec ? " et 132-10 CP" : ""), encourue: { prison: prisonMax, amende: I.amende }, requis: cs.vars.requis, motif: "Les constatations des policiers établissent les faits." }),
            personnalite: Math.round(perso), detenu: true, sansDomicile: !C.heberg && !CR.hasFact(cs, "G_attest"),
            civil: I.victime ? { postes: [{ label: "Préjudice moral et souffrances", demande: 600, base: 500 }], art475: 0 } : null,
          });
        },
        apresCI(api, res) {
          const { s, cs } = api;
          if (cs.vars.renvoi && !res.decision) {
            if (!cs.vars.renvoiFixe) {
              cs.vars.renvoiFixe = true;
              CR.PROC.fixAudience(api, { day: cs.vars.renvoiDay, min: 14 * 60, juridiction: "ci", mode: "ci_renvoi", convocDay: s.day, president: "pr_lacassagne", script: "ci_fond", done: "apresCI", onMiss: "_absentCI", title: "Comparution immédiate (renvoi) — 23e chambre", duree: 40, lieu: "palais" });
              CR.PROC.stade(api, "ci_renvoi", "Renvoi à la demande du prévenu (art. 397-1).");
            }
            return;
          }
          const dec = res.decision || {};
          api.aj("ci", "Comparution immédiate");
          const pn = dec.peine;
          if (dec.coupable && pn && pn.mandatDepot && pn.ferme > 0) CR.condamneDetenu(s, cs, pn.ferme, "sante", cs.proc.detention.statut === "dp" ? cs.proc.detention.since : s.day);
          else if (cs.proc.detention.statut === "dp") CR.PROC.detention(api, "libre", {});
          CR.closeCase(s, cs, PEN.issue(api, dec));
        },
      },
      gav: (api) => ({
        mode: "gav", attente: p.night ? 35 : 20,
        arrivee: [p.night ? `Commissariat central du 18e, ${CR.fmtTime(api.s.min)}. Les néons, une odeur de café froid. L'officier de quart : « Désolé de vous avoir réveillé, maître. Trente minutes. »` : `Commissariat central du 18e, ${CR.fmtTime(api.s.min)}. L'officier vous tend la procédure : « Trente minutes, maître. »`],
        pieces: ["pv_notification", "pv_interpellation"],
        entretien,
        audition: () => I.audition.map((a) => (/permis pour travailler/.test(a.q) ? { q: a.q, a: { silence: a.a.silence, expliquer: CR.MONDE.enjeuPermis(C).audition, partiel: CR.MONDE.enjeuPermis(C).oui ? "Oui." : "Non." } } : a)).concat([{ q: "Avez-vous quelque chose à ajouter ?", a: { silence: "Non.", expliquer: "Je regrette.", partiel: "Non." } }]),
        questions: [
          { id: "q_heure", q: "À quelle heure les droits de mon client lui ont-ils été notifiés ?", a: p.anomaly === "gav_notif" ? `(L'officier, agacé) : C'est au procès-verbal, maître. ${hm(notifMin)}.` : "(L'officier) : Dès le placement, maître, c'est au procès-verbal.", f: p.anomaly === "gav_notif" ? "G_q_heure" : null, sensible: true },
          { id: "q_logement", q: "Avez-vous vérifié son adresse ?", a: C.heberg ? "Oui, sa famille a confirmé par téléphone." : "Il n'a pas d'adresse vérifiable.", anodine: true },
        ],
        observations,
        get relecture() {
          const c = api.cs.vars.conseilGav;
          if (c === "silence") return { segs: [{ t: "La personne déclare : Je ne souhaite pas répondre aux questions." }] };
          return { segs: [{ t: "La personne déclare :" }, { t: I.version.split(".")[0] + "." }, p.erreurPV ? { t: "Je savais ce que je faisais, je l'ai fait exprès.", erreur: true, correct: "Je n'ai pas réfléchi." } : { t: "Je n'ai pas réfléchi." }, { t: "Je regrette." }] };
        },
        issue: (a) => {
          const voie = a.run("gavFin");
          if (voie === "ci") {
            a.run("_fixerCI", {});
            return { texte: ["Le parquet décide un déferrement : comparution immédiate demain après-midi, 23e chambre.", "La nuit au dépôt. Demain, quelques heures pour réunir les garanties de représentation."] };
          }
          a.schedule(0, "_fermer", { voie }, Math.min(23 * 60 + 25, a.s.min + 30));
          return { texte: [{ classement: "Le parquet ordonne la levée de la garde à vue et classe la procédure sans suite.", alternative: "Le parquet opte pour un avertissement pénal probatoire, notifié par un délégué du procureur (art. 41-1). Pas de procès.", copj: "Levée de la garde à vue : convocation devant le tribunal correctionnel dans quelques mois (art. 390-1)." }[voie], "Vous signez le registre et repartez."] };
        },
      }),
      flow: { tasks: PEN.tasks },
      tasks(api, T) {
        const { s, cs } = api;
        if (cs.proc.stade === "gav" && !cs.flags.gavStarted) T({ id: "gav", label: `Assister ${C.prenom} en garde à vue`, sub: "Commissariat central du 18e. L'entretien dure trente minutes au plus.", kind: "meet", time: 0, where: "commissariat", urgent: true, run: () => ({ scene: "gav" }) });
        const a = cs.proc.audience;
        if (a && a.day === s.day && ["ci", "ci_renvoi"].includes(a.mode)) {
          if (!cs.flags.dossierCI) T({ id: "dossier", label: "Lire le dossier au bureau des avocats", sub: "Procès-verbaux, casier, enquête sociale rapide.", kind: "admin", time: 20, where: "palais", urgent: true, run: () => {
            CR.spend(s, 20, "admin"); cs.flags.dossierCI = s.day;
            for (const k of ["pv_notification", "pv_interpellation", "casier", "esr"].concat(I.victime ? ["pv_victime"] : [])) if (!CR.hasDoc(cs, k)) api.doc(k, docTitles[k]);
            return null; } });
          if (!cs.flags.depotVu) T({ id: "depot", label: `Voir ${C.prenom} au dépôt`, sub: "Un entretien bref, avant l'audience.", kind: "meet", time: 0, where: "palais", urgent: true, run: () => ({ scene: "call", call: "depot" }) });
          PEN.persoTasks(api, T, [
            { id: "proche", label: "Appeler un proche pour l'hébergement", sub: "Une attestation écrite, envoyée au greffe avant l'audience.", fact: "G_attest", text: "Attestation d'hébergement et justificatif de domicile envoyés au greffe par la famille.", time: 15, cond: () => CR.hasFact(cs, "G_heberg") && C.heberg },
            { id: "employeur", label: "Appeler l'employeur", sub: "Une attestation d'emploi.", fact: "G_attest_emploi", text: `Attestation de l'employeur : ${C.metier}, en poste, attendu au travail.`, time: 15, cond: () => CR.hasFact(cs, "G_emploi"), fail: (x) => !x.cs.flags.empRappel && (x.cs.flags.empRappel = true) && R.chance(x.s, 0.4), failText: "Personne ne répond. Réessayez." },
          ]);
        }
      },
      audiences: { ci: (api) => ciScript(api, true), ci_fond: (api) => ciScript(api, false) },
      debrief(api, o) {
        const { cs } = api;
        const items = [];
        if (p.anomaly === "gav_notif") items.push(cs.proc.moyens.some((m) => m.flag === "gav_notif") || cs.flags.obs_gav_notif ? { kind: "good", text: "Vous avez relevé la notification tardive des droits." } : { kind: "surprise", text: `Les droits avaient été notifiés à ${hm(notifMin)} pour une mesure commencée à ${hm(p.debut)} : personne ne l'a relevé.` });
        if (p.anomaly === "interprete") items.push(cs.proc.moyens.some((m) => m.flag === "interprete") || cs.flags.obs_interprete ? { kind: "good", text: "Vous avez relevé l'absence d'interprète." } : { kind: "surprise", text: "La personne comprenait mal le français et n'a pas eu d'interprète : personne ne l'a relevé." });
        if (cs.vars.voie) items.push({ kind: "info", text: `Orientation du parquet : ${{ classement: "classement sans suite", alternative: "alternative aux poursuites", copj: "convocation devant le tribunal", ci: "comparution immédiate" }[cs.vars.voie]}.` });
        if (p.ethylo) items.push({ kind: "info", text: "Le procès-verbal ne mentionnait pas la vérification périodique de l'éthylomètre." });
        return items.concat(cs.vars.debriefJugement || []);
      },
      epilogue(api, o) {
        const pn = api.cs.vars.peine;
        if (o.type === "classement") return `${nomc} est ressorti${e} libre du commissariat.`;
        if (o.type === "alternative") return `${nomc} a reçu un avertissement pénal probatoire. Pas de casier.`;
        if (pn && pn.mandatDepot) return `${pn.texte}. ${nomc} a été écroué${e} à la Santé.`;
        return pn ? `${pn.texte}.` : "Dossier terminé.";
      },
      fiche(api, o) {
        return {
          phrase: `${CR.cap(I.label)}, ${ci ? "comparution immédiate" : "garde à vue"}, avocat commis d'office.`,
          notions: [
            { titre: "Les droits du gardé à vue", regle: "Notification immédiate des droits, dans une langue comprise ; entretien de trente minutes avec l'avocat ; audition en sa présence s'il a été demandé.", art: "art. 63-1, 63-4 et 63-4-2 CPP", prog: "pp_enquete" },
            { titre: "La comparution immédiate", regle: "Le prévenu peut refuser d'être jugé le jour même ; le tribunal statue alors sur la détention ; les nullités se soulèvent avant toute défense au fond.", art: "art. 395, 397-1 et 385 CPP", prog: "pp_jugement" },
          ],
          piege: p.anomaly ? "Lire les heures du procès-verbal de notification : c'est là que se cachent les nullités." : "Les garanties de représentation se rassemblent par téléphone, avant l'audience.",
          devenir: api.def.epilogue(api, o),
        };
      },
      corrige() {
        return [
          { probleme: "Quelle infraction ?", regle: `${CR.cap(I.label)} : ${CR.fmtMois(I.prison)} encourus (${I.court})${rec ? ", doublés en récidive légale (art. 132-10)" : ""}.`, application: I.constat },
          { probleme: "La garde à vue est-elle régulière ?", regle: "Droits notifiés immédiatement, dans une langue comprise (art. 63-1) ; à défaut, sans circonstance insurmontable, nullité.", application: p.anomaly === "gav_notif" ? `Début ${hm(p.debut)}, notification ${hm(notifMin)} : nullité.` : p.anomaly === "interprete" ? "Notification en français à une personne qui le comprend mal : nullité." : "Rien à relever." },
        ];
      },
    };

    function ciScript(api, premier) {
      const { cs } = api;
      const sept = prisonMax > 84;
      const fond = [
        { limine: { joindre: true } },
        { who: "president", t: `Je résume. ${I.constat}` },
        { who: "president", t: `${C.g === "f" ? "Madame" : "Monsieur"} ${C.nom}, vous reconnaissez les faits ?` },
        { if: () => !!cs.flags.depotVu, then: [{ who: "client", t: I.version, signal: "bon" }], else: [{ who: "client", t: "Je sais pas… C'est pas comme ils disent.", fx: { cred: -2 }, signal: "mauvais" }] },
        { who: "president", t: C.casier === 0 ? "Votre casier est vierge." : rec ? "Votre casier : une condamnation il y a dix-huit mois pour des faits similaires. Vous êtes en récidive." : "Votre casier : une ancienne condamnation, il y a neuf ans." },
        { card: { prompt: "Le président : « Maître, des garanties de représentation ? »", accept: ["G_attest", "G_attest_emploi", "G_esr", "G_heberg"], window: 12000, ok: { then: [{ who: "president", t: "Je les verse au dossier." }] }, miss: { then: [{ who: "president", t: "Rien, donc." }] } } },
        AUD.requisitions(rec ? Object.assign({ mandatDepot: true }, I.requisRecidive) : I.requis, { avant: [rec ? "Une récidive, dix-huit mois après un premier sursis." : "Des faits simples, reconnus pour l'essentiel."] }),
        { who: "president", t: "La parole est à la défense." },
        { plaidoirie: { role: "defense", max: 3,
          angles: [{ id: "peine", t: "La peine", sub: "Ne pas contester ; une peine aménageable." }, { id: "relaxe", t: "La relaxe", sub: "Contester les faits." }],
          args: [
            { id: "garanties", label: "Un hébergement et des attaches", say: "Il a une adresse, une famille qui l'attend, des garanties écrites au dossier.", cards: ["G_attest", "G_heberg", "G_esr"] },
            { id: "emploi", label: "Un emploi qu'une peine ferme lui ferait perdre", say: "Il travaille ; une peine ferme lui ferait perdre son emploi.", cards: ["G_attest_emploi", "G_emploi"] },
            { id: "amenagement", label: "Une peine aménageable (art. 132-19 et 132-25)", say: "Jusqu'à un an, la peine ferme doit être aménagée si la personnalité le permet.", cards: ["CP_132-19", "CP_132-25"] },
            { id: "doute", label: "La victime ne peut désigner l'auteur", say: "La victime elle-même ne sait pas qui l'a frappée.", cards: ["G_victime_doute"], pertinent: () => !!I.victime },
            { id: "casier", label: "Un casier vierge", say: "C'est sa première fois devant un tribunal.", pertinent: () => C.casier === 0 },
          ] } },
        { dernierMot: { prepare: [{ id: "regrets", label: "Des regrets sobres", t: "Je regrette. Je ne recommencerai pas." }, { id: "rien", label: "Rien de plus", t: "Je n'ai rien à ajouter." }], spontane: { id: "spontane", t: "Je… pardon." } } },
        { delibere: { texte: "Le tribunal se retire. Cinq minutes, entre deux dossiers : « Le tribunal ! »", duree: 10 } },
      ];
      const ouv = AUD.ouverture(api, { prevenu: def.client, prevenuWho: "client", prevention: `Vous êtes prévenu${e} d'avoir, à Paris 18e, le ${CR.fmtDate(cs.proc.faitsDay, "long")}, ${I.prevention(p)}${rec ? ", en état de récidive légale" : ""}. ${I.court}.` });
      const steps = premier ? ouv.concat([
        { who: "president", t: `Vous pouvez être jugé${e} aujourd'hui, ou demander un délai pour préparer votre défense : ${sept ? "deux à quatre mois" : "deux à six semaines"} (art. 397-1).` },
        { choose: [
          { t: "« Mon client accepte d'être jugé aujourd'hui. »", reply: "Nous retenons l'affaire.", then: fond },
          { t: "« Mon client demande un délai pour préparer sa défense (art. 397-1). »", reply: "Le tribunal entend le parquet sur la détention.", then: [
            { who: "parquet", t: rec ? "La récidive impose la détention jusqu'à l'audience." : "Je requiers un contrôle judiciaire." },
            { plaidoirie: { role: "jld", max: 2, args: [
              { id: "garanties", label: "Les garanties de représentation", say: "Il a une adresse et une famille ; un contrôle judiciaire suffit.", cards: ["G_attest", "G_heberg"] },
              { id: "emploi", label: "Son emploi", say: "Il travaille ; la détention le lui ferait perdre.", cards: ["G_attest_emploi", "G_emploi"] },
            ] } },
            { do: (a, st) => a.run("renvoiDetention", { st }) },
            { end: true },
          ] },
        ] },
      ]) : ouv.concat([{ who: "president", t: "L'affaire a été renvoyée à la demande du prévenu. Nous la retenons au fond." }], fond);
      return { title: "23e chambre — comparutions immédiates", sub: "Tribunal judiciaire de Paris · Batignolles", decor: { scene: "salle", box: true }, steps };
    }
    return def;
  }

  // =================================================================== ORDONNANCE PÉNALE (client payant)
  function buildOp(p) {
    const I = INF[p.inf];
    const C = p.client;
    const nomc = `${C.prenom} ${C.nom}`;
    const e = C.g === "f" ? "e" : "";
    const alcool = p.inf === "alcool";
    const op = alcool ? { amende: 500, comp: "quatre mois de suspension du permis de conduire", texte: "500 euros d'amende et quatre mois de suspension du permis de conduire" } : { amende: 300, comp: "", texte: "300 euros d'amende" };
    const facts = {
      O_notif: { label: "La date de notification de l'ordonnance pénale", key: true, why: "L'opposition se forme dans les quarante-cinq jours de la notification (art. 495-3)." },
      O_peine: { label: `L'ordonnance : ${op.texte}`, key: true },
      O_enjeu: { label: alcool ? CR.MONDE.enjeuPermis(C).label : "Une inscription au casier qui l'inquiète" },
    };
    if (p.ethylo) facts.O_ethylo = { label: "Aucune mention de la vérification de l'éthylomètre", key: true, why: "Une irrégularité qui se plaide devant le tribunal, après opposition, par conclusions de nullité déposées à temps (art. 385)." };
    const def = {
      id: p.id, camp: "defense", domaine: "tc", domaineLib: "pp_jugement",
      title: `${C.nom} — l'ordonnance pénale`,
      client: { prenom: C.prenom, nom: C.nom, g: C.g, age: C.age, metier: C.metier, tel: C.tel, trust: 55, naissance: C.naissance, adresse: C.adresse },
      leadTask: PEN.rdvTask(`Recevoir ${C.g === "f" ? "Mme" : "M."} ${C.nom} au cabinet`), leadPatience: 4,
      profile: { wealth: 3, sens: 0.5, urgency: 0.6, temper: pick(CR.seeded(p.seed + "t"), ["anxieux", "marchandeur", "presse"]) },
      honoraires: { forfait: 900, heures: 6, types: ["forfait", "temps"], resultat: "relaxe ou peine réduite" },
      mission: `Conseil de ${nomc} sur l'ordonnance pénale reçue, opposition le cas échéant et défense devant le tribunal correctionnel jusqu'au jugement.`,
      actors: { parquet: p.parquet, president: "pr_benkirane" },
      proc: { stade: "jugement", nature: "delit", faits: p.notif - p.day - 40, infractions: I.card ? [I.card] : [] },
      init(api, cs) { cs.vars.opNotifDay = p.notif; },
      vars: () => ({ notifDate: CR.fmtDate(p.notif, "long") }),
      facts,
      calls: { intake: {
        scene: "conference", kind: "meet", label: "Rendez-vous au cabinet",
        opening: [`${nomc} pose une enveloppe sur votre bureau. « J'ai reçu ça. Je ne comprends rien. »`],
        topics: [
          { id: "o_quoi", q: "Qu'avez-vous reçu, et quand ?", a: [{ t: `Une ordonnance pénale, en recommandé. J'ai signé l'avis le {notifDate}.`, f: "O_notif" }, { t: `Ils me condamnent à ${op.texte}.`, f: "O_peine" }], cost: 3, tag: "good" },
          { id: "o_faits", q: "Que s'était-il passé ?", a: [I.constat, I.version], cost: 4 },
          { id: "o_enjeu", q: "Qu'est-ce qui vous inquiète le plus ?", a: [{ t: (alcool ? CR.MONDE.enjeuPermis(C) : CR.MONDE.enjeuCasier(C)).dit[0], f: "O_enjeu" }], cost: 2 },
          { id: "o_proc", q: "Avez-vous des papiers de la procédure ?", a: ["Rien. Juste cette lettre."], cost: 1 },
        ],
        start: ["o_quoi", "o_faits", "o_enjeu", "o_proc"], patience: 80, close: "Alors, je fais quoi ?",
      } },
      advice: [
        { id: "o_delai", t: "Vous avez quarante-cinq jours à compter de la notification pour faire opposition." },
        { id: "o_risque", t: "Si nous faisons opposition, le tribunal pourra prononcer une peine plus lourde." },
        { id: "o_payer", t: "Payez tout de suite, c'est plus simple." },
      ],
      docs: {
        ordonnance: () => ({ title: "Ordonnance pénale", kind: "greffe", entete: ["Tribunal judiciaire de Paris · Président du tribunal", "Articles 495 à 495-6 du code de procédure pénale"], paras: [[`Vu les réquisitions du ministère public, condamnons ${nomc} pour ${I.label} à ${op.texte}.`], [{ t: `Notifiée par lettre recommandée, avis signé le ${CR.fmtDate(p.notif, "long")}. Opposition possible dans les quarante-cinq jours (art. 495-3).`, f: "O_notif" }]] }),
        pv: () => ({ title: alcool ? "Procès-verbal de vérification de l'alcoolémie" : "Procès-verbal de constatations", kind: "pv", entete: ["Commissariat central du 18e arrondissement", "Procédure ayant donné lieu à l'ordonnance pénale"], paras: alcool ? [
          [`Le ${CR.fmtDate(p.notif - 40, "long")}, à 23 h 05, nous, Gaëlle Perrin, lieutenant de police, officier de police judiciaire, procédons à la vérification de l'état alcoolique de ${nomc}, contrôlé${e} boulevard Barbès après un dépistage positif (art. L. 234-4 du code de la route).`],
          ["Vérification par éthylomètre de marque Dräger, modèle 7110 FP."],
          [{ t: p.ethylo ? "Appareil homologué, numéro de série ARCA-0291." : "Appareil homologué, numéro de série ARCA-0291, dernière vérification périodique le 3 mars 2026.", f: p.ethylo ? "O_ethylo" : null, flag: p.ethylo ? "ethylo" : undefined }],
          [`Mesure par éthylomètre : ${p.d.taux} mg par litre d'air expiré.`],
          ["Notifions le résultat et le droit à une seconde vérification ; la personne n'en fait pas usage."],
          ["Dont procès-verbal, clos à 23 h 20, signé après lecture."],
        ] : [[`Le ${CR.fmtDate(p.notif - 40, "long")}, à 17 h 30, nous, agents de police judiciaire, sommes requis par l'agent de sécurité du supermarché.`], [I.constat], ["Valeur des marchandises : restituées au magasin."], ["La personne reconnaît les faits. Dont procès-verbal."]], sigs: [{ qui: "L'officier de police judiciaire", t: "signé" }, { qui: "La personne contrôlée", t: "signé" }] }),
      },
      docTitles: { ordonnance: "Ordonnance pénale", pv: alcool ? "PV d'alcoolémie" : "PV de constatations" },
      anomalies: p.ethylo ? { ethylo: { irreg: "ethylometre_verif", piece: "pv", annule: ["mesure"], force: 0.7 } } : {},
      tpls: {
        opposition: (api) => ({
          title: "Déclaration d'opposition à l'ordonnance pénale", kind: "acte", time: 20, dirLabel: "Rédigée",
          depot: "palais", depotLabel: "Greffe du tribunal correctionnel (déclaration d'opposition)", depotTime: 15,
          slots: { fondement: CR.choiceSlot("Fondement", [{ t: "en application de l'article 495-3 du code de procédure pénale.", ok: true }]) },
          body: [[`${nomc}, assisté${e} de `, `Me ${api.s.player.nom}`, `, déclare former opposition à l'ordonnance pénale notifiée le ${CR.fmtDate(p.notif, "long")}, `, { s: "fondement" }]],
        }),
      },
      penal: { no: ["actes", "copie", "requete", "constitution"] },
      flow: { tasks: PEN.tasks },
      tasks(api, T) {
        const { s, cs } = api;
        if (!CR.hasDoc(cs, "pv")) T({ id: "procedure", label: "Consulter la procédure au greffe", sub: "Le procès-verbal sur lequel repose l'ordonnance.", kind: "admin", time: 30, where: "palais", run: () => { CR.spend(s, 30, "admin"); api.doc("ordonnance", "Ordonnance pénale"); api.doc("pv", def.docTitles.pv); return null; } });
        if (!CR.drafted(cs, "opposition") && !cs.vars.accepte) {
          T({ id: "opposition", label: "Former opposition", sub: "Déclaration au greffe. Comptez le délai vous-même.", kind: "draft", time: 20, run: () => ({ scene: "draft", tpl: "opposition" }) });
          T({ id: "accepter", label: "Conseiller de ne pas faire opposition", sub: "L'ordonnance deviendra définitive.", kind: "meet", time: 15, run: () => { CR.spend(s, 15, "meet"); cs.vars.accepte = s.day; api.run("_accepte"); return null; } });
        }
      },
      on: {
        arrive(api) {
          const { s, cs } = api;
          cs.status = "lead";
          api.mail({ from: nomc, subject: "Une ordonnance pénale", kind: "email", body: [[`Maître, j'ai reçu une ordonnance pénale : ${op.texte}. Je voudrais savoir si je peux la contester. Pourriez-vous me recevoir ?`]] });
          api.schedule(def.leadPatience, "_leadExpire");
        },
        engaged(api) { api.oblig({ id: "op495", label: "Opposition (art. 495-3)", due: CR.rollForward(p.notif + 45), silent: true, onMiss: "_noop" }); },
        _accepte(api) {
          const { s, cs } = api;
          CR.closeCase(s, cs, { type: "done", detail: "ordonnance pénale définitive" });
        },
        filed_opposition(api, { depot }) {
          const { s, cs } = api;
          if (!depot) return;
          api.satisfy("op495");
          const ctrl = CR.PROC.controle(api, "opposition_op", { day: s.day });
          if (!ctrl.ok) {
            CR.erreur(s, cs, { id: "op_tardive", texte: ctrl.motif, sanction: "Opposition irrecevable : l'ordonnance est définitive.", regul: "Aucune." });
            api.schedule(R.int(s, 20, 35), "_irrecevable");
            return;
          }
          let day = CR.rollForward(s.day + R.int(s, 35, 60));
          while (CR.dow(day) !== 2 || !CR.isBusinessDay(day)) day++;
          CR.PROC.fixAudience(api, { day, min: 13 * 60 + 30, juridiction: "tc", mode: "opposition", convocDay: s.day, president: "pr_benkirane", script: "tc", done: "apresTC", onMiss: "_absent", title: "Audience sur opposition — 24e chambre", duree: 40 });
          CR.PROC.event(api, "Opposition formée : l'ordonnance est non avenue, le tribunal jugera.");
        },
        _irrecevable(api) { CR.closeCase(api.s, api.cs, { type: "irrecevable", detail: "opposition tardive" }); },
        _absent(api) { CR.erreur(api.s, api.cs, { id: "absent", texte: "Vous n'étiez pas à l'audience.", sanction: "Jugé sans avocat.", regul: "Appel dans les dix jours." }); CR.closeCase(api.s, api.cs, { type: "condamnation", detail: "jugé sans avocat" }); },
        decider(api, { st }) {
          const { s, cs } = api;
          const pieces = alcool ? { mesure: { label: "La mesure de l'éthylomètre", sens: "charge", force: 0.5 }, signes: { label: "Les constatations des policiers", sens: "charge", force: 0.08 } } : { constat: { label: "Les constatations et la marchandise retrouvée", sens: "charge", force: 0.55 } };
          return PEN.juger(api, {
            st, juridiction: "tc", titre: "Jugement sur opposition", prevenuNom: nomc,
            spec: { seuil: 0.4, pieces },
            qualif: () => ({ id: p.inf, label: I.label, court: I.court, encourue: { prison: I.prison, amende: I.amende }, requis: cs.vars.requis, motif: "Les faits sont établis par la procédure." }),
            personnalite: (CR.hasFact(cs, "O_enjeu") ? 1 : 0) + (st.dernierMot === "regrets" ? 1 : 0) + 1,
          });
        },
        apresTC(api, res) { CR.closeCase(api.s, api.cs, PEN.issue(api, res.decision || {})); },
      },
      audiences: {
        tc(api) {
          const { cs } = api;
          return {
            title: "24e chambre correctionnelle", sub: "Audience sur opposition", decor: { scene: "salle" },
            steps: AUD.jugement(api, {
              prevenu: def.client,
              prevention: `Vous avez formé opposition à l'ordonnance pénale. Vous êtes prévenu${e} d'avoir, à Paris 18e, ${I.prevention(p)}. ${I.court}.`,
              instruction: [{ who: "president", t: "Vous reconnaissez les faits ?" }, { who: "client", t: I.version }],
              requis: { base: alcool ? { amende: 600, complementaires: ["six mois de suspension du permis de conduire"] } : { amende: 400 }, avant: ["L'opposition remet tout en jeu : le tribunal n'est pas tenu par l'ordonnance."] },
              defense: { max: 3, angles: [{ id: "peine", t: "La peine", sub: alcool ? (CR.MONDE.travaille(C) ? "Le permis, l'emploi." : "Le permis.") : "Une peine proportionnée." }, { id: "relaxe", t: "La relaxe", sub: "La procédure ne tient pas." }], args: [
                { id: "enjeu", label: alcool ? CR.MONDE.enjeuPermis(C).label : C.casier ? "Une seule mention au casier, ancienne" : "Une première fois, sans antécédent", say: alcool ? CR.MONDE.enjeuPermis(C).say : C.casier ? "Une seule mention au casier, ancienne et sans rapport. Une inscription de plus lui fermerait des portes." : "Une première fois : rien au casier. Une inscription lui fermerait des portes.", cards: ["O_enjeu"] },
                { id: "amenagement", label: "Une peine proportionnée", say: "Une amende proportionnée à ses revenus suffit.", cards: ["CP_132-19"] },
              ] },
            }),
          };
        },
      },
      debrief(api, o) {
        const { cs } = api;
        const items = [{ kind: "rule", text: `Opposition à l'ordonnance pénale délictuelle : quarante-cinq jours à compter de la notification (art. 495-3) — ici jusqu'au ${CR.fmtDate(CR.rollForward(p.notif + 45), "long")}. L'opposition remet l'affaire au tribunal, qui n'est pas tenu par l'ordonnance.` }];
        if (p.ethylo) items.push(cs.proc.moyens.some((m) => m.flag === "ethylo") ? { kind: "good", text: "Vous avez soulevé l'absence de mention de la vérification de l'éthylomètre." } : { kind: "surprise", text: "Le procès-verbal ne mentionnait pas la vérification de l'éthylomètre : une opposition se justifiait." });
        if (cs.vars.accepte && p.ethylo) items.push({ kind: "bad", text: "Vous avez laissé l'ordonnance devenir définitive alors que la procédure était discutable." });
        if (cs.vars.accepte && !p.ethylo) items.push({ kind: "good", text: "Sans moyen sérieux, l'opposition exposait à une peine plus lourde : laisser l'ordonnance devenir définitive était défendable." });
        return items.concat(cs.vars.debriefJugement || []);
      },
      epilogue(api, o) {
        if (o.type === "relaxe") return `${nomc} a été relaxé${e}. ${alcool ? "Le permis est sauf." : "Le casier reste vierge."}`;
        if (o.type === "done") return `L'ordonnance pénale est définitive : ${op.texte}.`;
        const pn = api.cs.vars.peine;
        return pn ? `${pn.texte}.` : "Dossier terminé.";
      },
      fiche(api, o) {
        return {
          phrase: `${CR.cap(I.label)}, ordonnance pénale, avocat de ${nomc}.`,
          notions: [{ titre: "L'ordonnance pénale délictuelle", regle: "Procédure écrite et sans débat ; le prévenu peut former opposition dans les quarante-cinq jours de la notification, l'affaire étant alors jugée par le tribunal, qui peut prononcer une peine plus lourde.", art: "art. 495 à 495-6 CPP", prog: "pp_jugement" }],
          piege: "Compter le délai depuis la notification, et peser le risque d'une peine plus lourde avant de faire opposition.",
          devenir: api.def.epilogue(api, o),
        };
      },
      corrige() {
        return [{ probleme: "Faut-il faire opposition ?", regle: "Opposition dans les quarante-cinq jours de la notification (art. 495-3) ; le tribunal juge alors l'affaire sans être tenu par l'ordonnance.", application: p.ethylo ? "Le procès-verbal ne mentionne pas la vérification de l'éthylomètre : un moyen sérieux, à soulever par conclusions déposées à temps." : "Sans moyen sérieux, l'opposition expose à une peine plus lourde." }];
      },
    };
    return def;
  }
})();
