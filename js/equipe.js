/* La Permanence — l'équipe du cabinet (feuille de route, n° 14)
   Postes (assistante, collaborateur libéral, élève avocat, juriste), parcours et personnalité, recrutement par annonce
   (CV, entretien, négociation, période d'essai), tâches confiées (capacité, charge, qualité, relecture, erreurs),
   assistante au téléphone (messages précis, rendez-vous, rappels), réunion du lundi, paie et charges, moral,
   progression, formation, entretien annuel, départs, déontologie (secret, conflits, clientèle du collaborateur).
   Tous les tirages passent par un générateur propre à l'équipe (s.team.rng, dérivé de la graine) : le reste
   de la partie tire toujours la même suite. Les chiffres de droit du travail et de déontologie ont été vérifiés en novembre 2026
   (CR.EQ_CHIFFRES) ; les estimations propres au jeu sont signalées. */
(function () {
  const CR = window.CR;

  // =================================================================== ÉTAT, HASARD PROPRE À L'ÉQUIPE
  CR.equipe = function (s) {
    if (!s.team) s.team = { v: 1, rng: CR.hash(String(s.seed) + ":equipe") | 0, annonces: [], candidats: [], taches: [], reunion: null, rappels: [], partis: [] };
    if (!s.staff) s.staff = [];
    for (const st of s.staff) if (!st.parcours) migrer(s, st);
    if (s.applicants && s.applicants.length) s.applicants = [];
    return s.team;
  };
  const TR = {
    next(s) {
      const q = s.team || CR.equipe(s);
      let t = (q.rng = (q.rng + 0x6d2b79f5) | 0);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(s, a, b) { return a + Math.floor(TR.next(s) * (b - a + 1)); },
    chance(s, p) { return TR.next(s) < p; },
    pick(s, arr) { return arr[Math.floor(TR.next(s) * arr.length)]; },
  };
  CR.TR = TR;
  const clamp = CR.clamp;
  const r50 = (x) => Math.round(x / 50) * 50;
  const weekOf = (d) => d - ((CR.dow(d) + 6) % 7);
  CR.weekOf = weekOf;

  // =================================================================== CHIFFRES
  // Vérifiés le 10 novembre 2026 (etat "verifie", avec la source) ; les estimations propres au jeu sont dites comme telles.
  CR.EQ_CHIFFRES = [
    { k: "charges", v: 0.42, etat: "estimation", label: "Charges patronales sur un salaire", val: "environ 42 % du brut (réduction générale non comptée)" },
    { k: "smic", v: 1867, etat: "verifie", label: "SMIC mensuel brut, 35 heures (12,31 € l'heure depuis le 1er juin 2026)", val: "1 867 €" },
    { k: "minAssistante", v: 1930, etat: "verifie", label: "Minimum conventionnel, assistante ou secrétaire juridique, coefficient 240 (convention collective des salariés des cabinets d'avocats du 21 juin 2024, grille du 1er janvier 2025)", val: "1 930 € brut par mois à temps plein" },
    { k: "minJuriste", v: 2994, etat: "verifie", label: "Minimum conventionnel, juriste cadre, coefficient 385 (même convention, même grille)", val: "2 994 € brut par mois à temps plein" },
    { k: "retroMin", v: 3700, etat: "verifie", label: "Rétrocession minimale d'un collaborateur libéral, Ordre de Paris, première année d'exercice (2026)", val: "3 700 € HT par mois" },
    { k: "retroMin2", v: 4100, etat: "verifie", label: "Rétrocession minimale d'un collaborateur libéral, Ordre de Paris, à partir de la deuxième année (2026)", val: "4 100 € HT par mois" },
    { k: "gratif", v: 1120, etat: "verifie", label: "Gratification minimale de l'élève avocat en stage : 60 % du SMIC dans un cabinet de deux salariés non avocats au plus (accord du 19 janvier 2007)", val: "1 120 € par mois, due dès le premier jour" },
    { k: "gratif2", v: 1307, etat: "verifie", label: "Même gratification, cabinet de trois à cinq salariés non avocats : 70 % du SMIC", val: "1 307 € par mois" },
    { k: "gratif3", v: 1587, etat: "verifie", label: "Même gratification, cabinet de six salariés non avocats et plus : 85 % du SMIC", val: "1 587 € par mois" },
    { k: "gratifSeuil", v: 683, etat: "verifie", label: "Part de la gratification exonérée de cotisations (4,50 € l'heure en 2026, 15 % du plafond horaire de la sécurité sociale × 151,67 h)", val: "environ 683 € par mois" },
    { k: "congesCollab", v: 5, etat: "verifie", label: "Repos rémunéré du collaborateur libéral (règlement intérieur national, art. 14.2)", val: "5 semaines par an" },
    { k: "congesSal", v: 5, etat: "verifie", label: "Congés payés des salariés", val: "5 semaines par an" },
    { k: "essaiEmploye", v: 2, etat: "verifie", label: "Période d'essai, employé (maximum légal)", val: "2 mois" },
    { k: "essaiCadre", v: 4, etat: "verifie", label: "Période d'essai, cadre (maximum légal)", val: "4 mois" },
    { k: "essaiCollab", v: 3, etat: "verifie", label: "Période d'essai, collaboration libérale (règlement intérieur national, art. 14.4)", val: "3 mois au plus" },
    { k: "preavisEmploye", v: 1, etat: "verifie", label: "Préavis, employé de moins de deux ans d'ancienneté", val: "1 mois" },
    { k: "preavisCadre", v: 3, etat: "estimation", label: "Préavis, cadre (usage)", val: "3 mois" },
    { k: "prevenance", v: 3, etat: "verifie", label: "Délai de prévenance pour mettre fin à une collaboration libérale, hors période d'essai (règlement intérieur national, art. 14.4)", val: "3 mois" },
    { k: "stage", v: 6, etat: "verifie", label: "Stage en cabinet de l'élève avocat", val: "6 mois" },
    { k: "formation", v: 20, etat: "verifie", label: "Formation continue obligatoire des avocats", val: "20 heures par an" },
    { k: "coutFormation", v: 45, etat: "estimation", label: "Coût d'une heure de formation (organisme privé)", val: "45 € HT" },
    { k: "indemLic", v: 0.25, etat: "verifie", label: "Indemnité légale de licenciement", val: "1/4 de mois par année d'ancienneté (8 mois d'ancienneté au moins)" },
  ];
  CR.chiffre = (k) => (CR.EQ_CHIFFRES.find((x) => x.k === k) || {}).v;
  const CH = CR.chiffre;

  // =================================================================== POSTES
  CR.ROLES = {
    assistante: { label: "Assistante juridique", labelM: "Assistant juridique", court: "Assistante", courtM: "Assistant", statut: "salarie", cadre: false, heures: 35, min: "minAssistante",
      perk: "Accueil, téléphone, agenda, courrier, copies de dossier, facturation et relances, prise de rendez-vous.", taches: ["depot", "copie", "relances"] },
    collaborateur: { label: "Collaborateur libéral", labelF: "Collaboratrice libérale", court: "Collaborateur", courtF: "Collaboratrice", statut: "liberal", avocat: true, heures: 30, min: "retroMin",
      perk: "Avocat : recherches, actes, parloirs, permanences, substitutions, petits dossiers plaidés. Garde du temps pour sa clientèle personnelle.", taches: ["recherche", "redaction", "depot", "copie", "parloir", "point", "plaidoirie", "substitution", "permanence"] },
    eleve: { label: "Élève avocat en stage", labelF: "Élève avocate en stage", court: "Stagiaire", statut: "stage", heures: 35, min: "gratif",
      perk: "Convention avec l'école d'avocats, six mois. Recherches, projets d'actes, démarches ; ne plaide pas seul. Progresse vite.", taches: ["recherche", "redaction", "depot", "copie", "point"] },
    juriste: { label: "Juriste", court: "Juriste", statut: "salarie", cadre: true, heures: 35, min: "minJuriste",
      perk: "Recherches, notes, préparation des dossiers et projets d'actes ; ne plaide pas, ne reçoit pas seul les clients.", taches: ["recherche", "redaction", "depot", "copie"] },
  };
  CR.roleLabel = (st, court) => {
    const r = CR.ROLES[st.role];
    if (!r) return st.role;
    const f = st.g === "f";
    return court ? (f ? r.courtF || r.court : r.courtM || r.court) : f ? r.labelF || r.label : r.labelM || r.label;
  };
  // Rémunération de marché selon le poste et le niveau (estimation du jeu)
  CR.MARCHE = {
    assistante: { debutant: 2050, confirme: 2350, experimente: 2750 },
    juriste: { debutant: 3050, confirme: 3400, experimente: 3900 },
    collaborateur: { debutant: 3900, confirme: 5300, experimente: 6400 },
    eleve: { debutant: 1200, confirme: 1300, experimente: 1400 },
  };
  CR.NIVEAUX = [["debutant", "Débutant"], ["confirme", "Confirmé (2 à 5 ans)"], ["experimente", "Expérimenté (6 ans et plus)"]];
  // Le minimum dépend du poste, et aussi : pour le collaborateur, de son année d'exercice (première année, puis au-delà) ;
  // pour l'élève avocat, du nombre de salariés non avocats du cabinet (accord du 19 janvier 2007).
  CR.minimumLegal = (role, temps, niveau, s) => {
    const r = CR.ROLES[role];
    if (role === "collaborateur") return CH(niveau && niveau !== "debutant" ? "retroMin2" : "retroMin");
    if (role === "eleve") { const n = s ? (s.staff || []).filter((x) => CR.ROLES[x.role] && CR.ROLES[x.role].statut === "salarie" && !(x.depart && x.depart.fait)).length : 0; return CH(n >= 6 ? "gratif3" : n >= 3 ? "gratif2" : "gratif"); }
    const m = CH(r.min);
    return r.statut === "salarie" ? Math.round(m * (temps || 1)) : m;
  };

  CR.EXP = [["gav", "Garde à vue et permanences"], ["ci", "Comparution immédiate"], ["tc", "Tribunal correctionnel"], ["instr", "Instruction et détention"], ["assises", "Assises et cour criminelle"], ["victimes", "Victimes"], ["affaires", "Pénal des affaires"], ["mineurs", "Mineurs"], ["peines", "Application des peines"], ["redaction", "Rédaction"], ["recherche", "Recherche juridique"]];
  CR.TRAITS = [["rigueur", "Rigueur"], ["oral", "Aisance orale"], ["empathie", "Empathie avec les clients"], ["stress", "Résistance au stress"], ["ambition", "Ambition"], ["loyaute", "Loyauté"], ["autonomie", "Autonomie"]];
  const DOM_EXP = { gav: "gav", ci: "ci", tc: "tc", tp: "tc", appel: "tc", instruction: "instr", criminel: "assises", pc: "victimes" };
  CR.expDomaine = (cs) => { const def = CR.caseDef(cs); if (def.domaineLib === "dpg" && def.camp === "pc") return "affaires"; return DOM_EXP[def.domaine] || "tc"; };

  // =================================================================== PARCOURS ET PERSONNALITÉ
  const PRENOMS_F = ["Inès", "Sarah", "Léa", "Chloé", "Manon", "Amina", "Clara", "Zoé", "Camille", "Yasmine", "Laura", "Mathilde", "Fatou", "Julie", "Héloïse", "Nadia", "Anaïs", "Margaux"];
  const PRENOMS_M = ["Lucas", "Hugo", "Nathan", "Yanis", "Théo", "Jules", "Rayan", "Adam", "Karim", "Thomas", "Mehdi", "Antoine", "Samuel", "Bilal", "Romain", "Victor", "Issa", "Paul"];
  const NOMS = ["Martin", "Bernard", "Petit", "Robert", "Richard", "Durand", "Moreau", "Laurent", "Simon", "Michel", "Lefebvre", "Leroy", "Roux", "Fournier", "Girard", "Diallo", "Nguyen", "Haddad", "Benali", "Mercier", "Faure", "Lambert", "Bonnet", "Chevalier", "Traoré", "Ferreira", "Lemaire", "Garnier", "Boyer", "Rousseau"];
  const UNIVS = ["Paris 1 Panthéon-Sorbonne", "Paris 2 Panthéon-Assas", "Paris Nanterre", "Paris-Saclay", "Université Paris Cité", "Paris-Est Créteil", "Cergy Paris Université", "Lyon 3 Jean-Moulin", "Lille", "Bordeaux", "Aix-Marseille", "Toulouse Capitole", "Montpellier", "Strasbourg", "Rennes", "Université des Antilles"];
  const MASTERS = {
    penal: ["Master 2 Droit pénal et sciences criminelles", "Master 2 Droit pénal et procédure pénale", "Master 2 Justice pénale", "Master 2 Droit pénal international et européen"],
    affaires: ["Master 2 Droit pénal des affaires", "Master 2 Droit des affaires", "Master 2 Droit bancaire et financier"],
    general: ["Master 2 Contentieux", "Master 2 Droit privé général", "Master 2 Droit processuel", "Master 2 Droits de l'homme et libertés"],
  };
  const FORM_ASSIST = ["BTS Support à l'action managériale", "Licence professionnelle Assistant juridique", "Licence en droit", "Titre de collaborateur juridique (ENADEP)", "Capacité en droit"];
  const ECOLES = ["EFB (Paris)", "EFB (Paris)", "EFB (Paris)", "HEDAC (Versailles)", "EDA Centre-Sud", "ERAGE (Strasbourg)", "IXAD (Lille)", "EDA Rhône-Alpes"];
  const CAB = {
    penal: ["Cabinet Delmas", "Me Arnaud Ferrand", "SCP Vasseur-Benali", "Cabinet Kessler & Lenoir", "Me Hélène Garnier-Faure", "Cabinet Ouattara"],
    affaires: ["AARPI Morel Saint-Clair", "Cabinet Lagarde", "SELAS Brunet & associés"],
    generaliste: ["Cabinet Rousseau", "Me Paul Achard", "SCP Lemoine-Diallo", "Cabinet Bérard (Créteil)"],
    parquet: ["Parquet de Bobigny (juriste assistant)", "Parquet de Paris (attaché de justice)", "Parquet de Créteil (assistant spécialisé)"],
    greffe: ["Greffe du tribunal judiciaire de Paris", "Greffe correctionnel de Nanterre", "Greffe de l'instruction de Bobigny"],
    entreprise: ["Service juridique d'une banque", "Service juridique d'un assureur", "Office notarial"],
  };
  CR.CAB_TYPES = { penal: "pénal", affaires: "affaires", generaliste: "généraliste", parquet: "parquet", greffe: "greffe", entreprise: "entreprise" };
  const LANGUES = ["anglais", "anglais", "anglais", "espagnol", "arabe", "portugais", "italien", "allemand", "russe", "chinois", "wolof", "roumain", "polonais", "créole"];
  // Ce que chaque type de poste apprend, par domaine
  const PROFIL = {
    penal: { gav: 1, ci: 0.9, tc: 1, instr: 0.7, victimes: 0.5, assises: 0.3, mineurs: 0.3, peines: 0.3, redaction: 0.6, recherche: 0.5 },
    affaires: { affaires: 1, tc: 0.3, instr: 0.3, redaction: 0.8, recherche: 0.7 },
    generaliste: { tc: 0.7, victimes: 0.6, gav: 0.4, ci: 0.3, mineurs: 0.3, redaction: 0.6, recherche: 0.4 },
    parquet: { tc: 0.8, instr: 0.8, ci: 0.5, peines: 0.5, mineurs: 0.3, redaction: 0.7, recherche: 0.8 },
    greffe: { tc: 0.6, instr: 0.5, redaction: 0.7, recherche: 0.3 },
    entreprise: { affaires: 0.3, redaction: 0.6, recherche: 0.4 },
  };
  const nouvelleExp = () => Object.fromEntries(CR.EXP.map(([k]) => [k, 0]));

  // Tire une personne : { g, prenom, nom, age, parcours, exp, perso, cv }
  function tirerPersonne(s, o) {
    const role = o.role, niveau = o.niveau || "confirme";
    const R = CR.ROLES[role];
    const g = role === "assistante" ? (TR.chance(s, 0.8) ? "f" : "m") : TR.chance(s, 0.55) ? "f" : "m";
    const prenom = TR.pick(s, g === "f" ? PRENOMS_F : PRENOMS_M), nom = TR.pick(s, NOMS);
    const an = CR.ymd(s.day).y;
    const ans = role === "eleve" ? 0 : niveau === "debutant" ? TR.int(s, 0, 1) : niveau === "confirme" ? TR.int(s, 2, 5) : TR.int(s, 6, 13);
    const veut = o.domaines || [];
    const spe = veut.includes("affaires") && TR.chance(s, 0.6) ? "affaires" : TR.chance(s, o.match ? 0.8 : 0.5) ? "penal" : TR.pick(s, ["affaires", "general"]);
    const reconv = (role === "juriste" || role === "assistante") && TR.chance(s, 0.22) ? TR.pick(s, ["greffe", "parquet"]) : role === "collaborateur" && TR.chance(s, 0.08) ? "parquet" : null;
    const univ = TR.pick(s, UNIVS);
    const diplome = role === "assistante" ? TR.pick(s, FORM_ASSIST) : TR.pick(s, MASTERS[spe]);
    // postes précédents
    const cabinets = [];
    let reste = ans;
    if (reconv && ans >= 2) { const y = Math.min(reste, TR.int(s, 2, Math.max(2, Math.round(ans * 0.6)))); cabinets.push({ type: reconv, nom: TR.pick(s, CAB[reconv]), ans: y }); reste -= y; }
    const typeCab = role === "assistante" ? TR.pick(s, ["penal", "generaliste", "affaires", "entreprise"]) : spe === "general" ? "generaliste" : spe;
    while (reste > 0) {
      const y = cabinets.length >= 2 ? reste : Math.min(reste, TR.int(s, 1, Math.max(1, reste)));
      const ty = cabinets.length && TR.chance(s, 0.35) ? TR.pick(s, ["penal", "generaliste", "affaires"]) : typeCab;
      cabinets.push({ type: ty, nom: TR.pick(s, CAB[ty]), ans: y });
      reste -= y;
    }
    const avocatOuEleve = role === "collaborateur" || role === "eleve";
    const crfpa = avocatOuEleve ? (role === "eleve" ? an - TR.int(s, 0, 1) : an - ans - TR.int(s, 1, 2)) : null;
    const ecole = avocatOuEleve ? TR.pick(s, ECOLES) : null;
    const ecoleFin = role === "eleve" ? null : crfpa ? crfpa + 2 : null;
    const age = role === "eleve" ? TR.int(s, 23, 27) : role === "assistante" ? 21 + ans + TR.int(s, 0, 9) : 24 + ans + TR.int(s, 0, 3);
    const langues = ["français"];
    for (let i = TR.int(s, 0, 2); i > 0; i--) { const l = TR.pick(s, LANGUES); if (!langues.includes(l)) langues.push(l); }
    // expérience par domaine
    const exp = nouvelleExp();
    for (const k of Object.keys(exp)) exp[k] = TR.int(s, 0, 8);
    for (const c of cabinets) for (const [k, w] of Object.entries(PROFIL[c.type] || {})) exp[k] += w * (14 + 8 * c.ans) + TR.int(s, -5, 5);
    if (role !== "assistante") { exp.recherche += 14; exp.redaction += 10; if (spe === "affaires") exp.affaires += 14; if (spe === "penal") { exp.tc += 6; exp.instr += 4; } }
    if (role === "eleve") { exp.recherche += TR.int(s, 8, 20); exp.redaction += TR.int(s, 5, 15); }
    if (role === "assistante") { exp.redaction += 8 + 3 * ans; exp.recherche = Math.round(exp.recherche / 2); }
    if (o.match) for (const k of veut) exp[k] += TR.int(s, 10, 25);
    for (const k of Object.keys(exp)) exp[k] = Math.round(clamp(exp[k], 0, 95));
    // personnalité
    const perso = {};
    for (const [k] of CR.TRAITS) perso[k] = TR.int(s, 25, 92);
    if (avocatOuEleve) perso.ambition = Math.min(95, perso.ambition + 10);
    // CV : ce que la personne annonce (parfois enjolivé)
    const cv = { exp: Object.assign({}, exp), ans, langues: langues.slice(), incoh: null };
    if (TR.chance(s, 0.24)) {
      let kind = TR.pick(s, ["annees", "langue", "dates"]);
      if (kind === "dates" && !avocatOuEleve) kind = "annees";
      if (kind === "annees" && ans < 1) kind = "langue";
      const top = Object.entries(exp).filter(([k]) => k !== "redaction" && k !== "recherche").sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[0]);
      if (kind === "annees") {
        cv.ans = ans + TR.int(s, 2, 3);
        for (const k of top) cv.exp[k] = Math.min(95, exp[k] + 20);
        cv.incoh = { kind, aveu: `{Il} reconnaît avoir compté ses stages et ses années d'études : ${ans ? ans + " an" + (ans > 1 ? "s" : "") : "moins d'un an"} d'expérience réelle.` };
      } else if (kind === "langue") {
        const l = langues.find((x) => x !== "français") || "anglais";
        if (!cv.langues.includes(l)) cv.langues.push(l);
        cv.langueEnjolivee = l;
        cv.incoh = { kind, aveu: `Vous passez à l'${l === "anglais" ? "anglais" : l} : {il} comprend, mais ne tient pas une conversation. « Courant » était exagéré.` };
        for (const k of top) cv.exp[k] = Math.min(95, exp[k] + 8);
      } else {
        cv.crfpa = crfpa + 1;
        cv.incoh = { kind, aveu: `{Il} a échoué une première fois au CRFPA et a corrigé la date sur son CV pour le cacher.` };
        perso.loyaute = Math.max(20, perso.loyaute - 10);
      }
    }
    return { g, prenom, nom, age, parcours: { univ, diplome, spe, crfpa, ecole, ecoleFin, ans, cabinets, langues }, exp, perso, cv };
  }
  CR.tirerPersonne = tirerPersonne;

  // Les employés des anciennes sauvegardes reçoivent un parcours et une personnalité tirés au sort
  function migrer(s, st) {
    const [prenom, ...rest] = String(st.name || "").split(" ");
    const niveau = st.skill > 75 ? "experimente" : st.skill > 55 ? "confirme" : "debutant";
    const p = tirerPersonne(s, { role: st.role, niveau, domaines: [] });
    st.prenom = prenom || p.prenom;
    st.nom = rest.join(" ") || p.nom;
    st.g = PRENOMS_F.includes(st.prenom) ? "f" : PRENOMS_M.includes(st.prenom) ? "m" : p.g;
    st.age = p.age;
    st.parcours = p.parcours;
    st.exp = p.exp;
    const k = (st.skill || 60) / 60;
    for (const x of Object.keys(st.exp)) st.exp[x] = Math.round(clamp(st.exp[x] * k, 0, 95));
    st.perso = p.perso;
    st.cv = { exp: Object.assign({}, st.exp), ans: p.parcours.ans, langues: p.parcours.langues.slice(), incoh: null };
    initEmploye(s, st, { arrive: st.hired != null ? st.hired : s.day, temps: 1, salary: st.salary || CR.MARCHE[st.role].confirme });
    st.essaiFin = null;
    st.ancien = true;
    st.morale = st.morale != null ? st.morale : 70;
    st.vu = { traits: {}, exp: {} };
  }
  function initEmploye(s, st, o) {
    st.name = `${st.prenom} ${st.nom}`;
    st.arrive = o.arrive;
    st.hired = st.hired != null ? st.hired : s.day;
    st.temps = o.temps || 1;
    st.salary = o.salary;
    st.morale = st.morale != null ? st.morale : 68;
    st.vu = st.vu || { traits: {}, exp: {} };
    st.indices = st.indices || {};
    st.formation = { annee: CR.ymd(s.day).y, h: 0 };
    st.clientele = [];
    st.taches = 0;
    st.erreurs = 0;
    st.reproches = 0;
    st.lastFelicite = -99;
    st.revue = CR.addMonths(o.arrive, 12);
    st.arrieres = 0;
    st.retards = 0;
    st.depart = null;
    st.incidents = [];
    st.oisif = 0;
    st.cantonne = 0;
    st.hSemaine = 0;
    st.semaine = weekOf(s.day);
    st.journal = [];
    st.skill = Math.round(CR.sum(Object.values(st.exp)) / CR.EXP.length);
    const R = CR.ROLES[st.role];
    const m = st.role === "eleve" ? 0 : R.statut === "liberal" ? CH("essaiCollab") : R.cadre ? CH("essaiCadre") : CH("essaiEmploye");
    st.essaiFin = m ? CR.addMonths(o.arrive, m) : null;
    st.stageFin = st.role === "eleve" ? CR.addMonths(o.arrive, CH("stage")) : null;
  }
  const noteJ = (s, st, text) => { st.journal = st.journal || []; st.journal.unshift({ day: s.day, text }); if (st.journal.length > 30) st.journal.length = 30; };

  // Accords : {il}, {Il}, {e}, {le}
  CR.accordE = (txt, g) => String(txt).replace(/\{il\}/g, g === "f" ? "elle" : "il").replace(/\{Il\}/g, g === "f" ? "Elle" : "Il").replace(/\{e\}/g, g === "f" ? "e" : "").replace(/\{le\}/g, g === "f" ? "la" : "le");
  const A = CR.accordE;

  // =================================================================== INDICES DE PERSONNALITÉ (entretien, travail)
  const INDICES = {
    rigueur: ["A apporté ses diplômes et ses attestations, classés dans une pochette.", "Dossier complet, quelques approximations de dates.", "Ne retrouve plus la date de son dernier contrat ; deux fautes dans la lettre de motivation."],
    oral: ["S'exprime avec aisance : phrases nettes, ton posé, regarde son interlocuteur.", "Clair, un peu scolaire.", "Cherche ses mots, parle bas, se perd dans les détails."],
    empathie: ["Parle de ses anciens clients avec égards ; écoute la question jusqu'au bout.", "Courtois, sans plus.", "Évoque les clients comme « des dossiers pénibles »."],
    stress: ["Reste calme quand vous le relancez sèchement.", "Se raidit un instant, puis se reprend.", "Rougit et perd le fil quand vous le pressez."],
    ambition: ["Veut plaider aux assises d'ici deux ans ; demande quand on peut s'associer ici.", "Veut progresser, sans se presser.", "Cherche un poste stable et des horaires prévisibles."],
    loyaute: ["Est resté{e} longtemps dans ses précédents postes ; parle bien de ses anciens patrons.", "Parle de ses anciens employeurs sans chaleur.", "Critique durement son ancien cabinet ; a changé trois fois de poste en deux ans."],
    autonomie: ["Raconte des dossiers menés seul{e} de bout en bout.", "A besoin d'un cadre, mais prend des initiatives.", "Demande beaucoup comment les choses se font ici."],
  };
  const niv = (v) => (v >= 68 ? 0 : v >= 45 ? 1 : 2);
  CR.indiceTrait = (k, v, g) => A(INDICES[k][niv(v)], g);
  CR.niveauTrait = (v) => ["élevée", "moyenne", "faible"][niv(v)];
  CR.niveauExp = (v) => (v >= 60 ? "solide" : v >= 35 ? "correcte" : v >= 15 ? "faible" : "aucune");

  // =================================================================== RECRUTEMENT
  CR.QUESTIONS_ENTRETIEN = [
    { id: "situation", label: "Mise en situation pénale", traits: ["oral", "stress"] },
    { id: "parcours", label: "Le parcours, poste par poste", traits: ["rigueur"] },
    { id: "dispo", label: "Disponibilité", traits: [] },
    { id: "pretentions", label: "Prétentions", traits: ["ambition"] },
    { id: "motivation", label: "Motivation", traits: ["loyaute", "empathie"] },
    { id: "autonomie", label: "Un dossier mené seul", traits: ["autonomie"] },
  ];
  const SITUATIONS = {
    gav: "Votre client est en garde à vue depuis dix-huit heures ; l'officier refuse de vous montrer le procès-verbal de notification des droits. Que faites-vous ?",
    ci: "Comparution immédiate dans une heure, quatre-vingts pages de procédure, le client veut être jugé tout de suite. Que lui conseillez-vous ?",
    tc: "Audience correctionnelle demain : vous découvrez que la citation ne mentionne pas le texte de répression. Qu'en faites-vous ?",
    instr: "Votre client est en détention provisoire depuis trois mois. Quelles échéances surveillez-vous, et que demandez-vous ?",
    assises: "Vous plaidez la légitime défense devant une cour criminelle. Comment préparez-vous votre client à l'interrogatoire ?",
    victimes: "Une victime de violences conjugales veut retirer sa plainte. Que lui dites-vous ?",
    affaires: "Un dirigeant poursuivi pour abus de biens sociaux veut produire une attestation antidatée. Que répondez-vous ?",
    mineurs: "Un mineur de seize ans est convoqué devant le juge des enfants. Qu'expliquez-vous à ses parents ?",
    peines: "Votre client condamné à dix-huit mois ferme veut éviter la détention. Que demandez-vous, et à qui ?",
    redaction: "Rédigez de tête le dispositif de conclusions de relaxe. Qu'y mettez-vous ?",
    recherche: "Où cherchez-vous la jurisprudence récente sur les nullités de garde à vue ?",
  };
  const SIT_ASSIST = "Un client furieux appelle pendant que l'avocat est en audience et exige de lui parler tout de suite. Que faites-vous ?";

  // Publier une annonce : poste, domaines recherchés, niveau, rémunération, temps de travail
  CR.publierAnnonce = function (s, o) {
    const q = CR.equipe(s);
    const role = o.role;
    const temps = CR.ROLES[role].statut === "salarie" ? o.temps || 1 : 1;
    const min = CR.minimumLegal(role, temps, o.niveau, s);
    const remu = Math.round(o.remu || 0);
    if (remu < min) return { ok: false, texte: `Rémunération sous le minimum (${CR.money(min)} par mois).` };
    const niveau = role === "eleve" ? "debutant" : o.niveau || "confirme";
    const domaines = (o.domaines || []).slice(0, 3);
    const a = { id: CR.uid("an"), role, domaines, niveau, remu, temps, day: s.day, fin: s.day + 21, candidats: 0 };
    const marche = CR.MARCHE[role][niveau] * temps;
    const attrait = clamp(0.6 + (remu - marche) / marche * 2.2 + (s.reps.clients + s.reps.confreres) / 120, 0.25, 1.9) * (niveau === "experimente" ? 0.7 : 1);
    const base = { assistante: 6, juriste: 5, collaborateur: 4, eleve: 7 }[role];
    const n = Math.max(1, Math.round(base * attrait + TR.int(s, -1, 1)));
    for (let i = 0; i < n; i++) {
      const match = TR.chance(s, 0.6);
      const nivC = TR.chance(s, 0.7) ? niveau : TR.pick(s, ["debutant", "confirme", "experimente"]);
      const p = tirerPersonne(s, { role, niveau: role === "eleve" ? "debutant" : nivC, domaines, match });
      const c = Object.assign(p, { id: CR.uid("c"), annonce: a.id, role, niveau: nivC, seed: TR.int(s, 1, 1e6), arrive: CR.rollForward(s.day + TR.int(s, 1, 9)), etat: "nouveau", indices: {}, reponses: [], offres: 0 });
      const qual = (CR.sum(domaines.length ? domaines : ["tc", "redaction"], (k) => p.exp[k] || 0) / Math.max(1, domaines.length || 2)) / 100 * 0.6 + (p.perso.rigueur + p.perso.oral) / 200 * 0.4;
      c.qualite = qual;
      c.demande = Math.max(CR.minimumLegal(role, temps, nivC, s), r50(CR.MARCHE[role][nivC] * temps * (0.9 + qual * 0.4) * (p.perso.ambition > 75 ? 1.05 : 1)));
      c.autreOffre = qual > 0.5 && TR.chance(s, 0.5);
      c.expire = c.arrive + (qual > 0.55 ? TR.int(s, 5, 9) : TR.int(s, 9, 20));
      c.dispo = CR.rollForward(c.arrive + TR.int(s, 3, 25));
      c.temps = temps;
      q.candidats.push(c);
      a.candidats++;
    }
    q.annonces.push(a);
    CR.payOut(s, 90, `Annonce de recrutement — ${CR.ROLES[role].label.toLowerCase()} (site de l'Ordre et plateforme d'emploi juridique)`);
    CR.spend(s, 20, "admin");
    CR.log(s, `Annonce publiée : ${CR.ROLES[role].label.toLowerCase()}, ${CR.money(remu)} par mois.`, "info");
    return { ok: true, annonce: a };
  };
  CR.annonceOf = (s, c) => (s.team.annonces || []).find((a) => a.id === c.annonce) || null;
  CR.candidatsVisibles = (s) => (CR.equipe(s).candidats || []).filter((c) => c.arrive <= s.day && !["parti", "embauche", "ecarte"].includes(c.etat));
  CR.lireCV = function (s, cid) {
    const c = s.team.candidats.find((x) => x.id === cid);
    if (!c || c.lu) return c;
    c.lu = true;
    if (c.etat === "nouveau") c.etat = "lu";
    CR.spend(s, 5, "desk");
    return c;
  };
  // Entretien de trente minutes, trois questions au plus
  CR.entretien = function (s, cid, questions) {
    const c = s.team.candidats.find((x) => x.id === cid);
    if (!c || c.entretien) return null;
    const qs = (questions || []).slice(0, 3);
    CR.spend(s, 30, "meet");
    c.lu = true;
    c.entretien = { day: s.day, q: qs };
    const g = c.g;
    const rep = [];
    const annonce = CR.annonceOf(s, c);
    for (const qid of qs) {
      const Q = CR.QUESTIONS_ENTRETIEN.find((x) => x.id === qid);
      if (!Q) continue;
      let t = "";
      if (qid === "situation") {
        if (c.role === "assistante") {
          t = `« ${SIT_ASSIST} » — ` + (c.perso.empathie >= 60 && c.perso.stress >= 50 ? A("{Il} propose de prendre un message précis, de rassurer le client et de vous joindre à la suspension.", g) : c.perso.stress < 45 ? A("{Il} hésite : « Je lui passerais le numéro du tribunal ? »", g) : A("Réponse correcte : prendre le message, rappeler plus tard.", g));
          for (const k of ["empathie", "stress"]) c.indices[k] = CR.indiceTrait(k, c.perso[k], g);
        } else {
          const dom = (annonce && annonce.domaines[0]) || Object.entries(c.exp).sort((a, b) => b[1] - a[1])[0][0];
          const v = c.exp[dom] || 0;
          t = `« ${SITUATIONS[dom] || SITUATIONS.tc} » — ` + (v >= 60 ? A("Réponse précise : {il} cite les bons textes et pense au délai.", g) : v >= 30 ? A("Réponse correcte, mais {il} oublie un délai.", g) : A("Réponse vague ; {il} confond les procédures.", g));
          if ((c.cv.exp[dom] || 0) - v >= 15) t += " Loin de ce qu'annonce son CV.";
          c.expVue = Object.assign(c.expVue || {}, { [dom]: CR.niveauExp(v) });
          for (const k of Q.traits) c.indices[k] = CR.indiceTrait(k, c.perso[k], g);
        }
      } else if (qid === "parcours") {
        t = c.cv.incoh ? A(c.cv.incoh.aveu, g) : "Le parcours se tient : dates, postes et diplômes concordent.";
        if (c.cv.incoh) c.incohVue = true;
        c.indices.rigueur = CR.indiceTrait("rigueur", c.perso.rigueur, g);
      } else if (qid === "dispo") {
        t = A(`Disponible à partir du ${CR.fmtDate(c.dispo, "dowshort")}.`, g) + (c.autreOffre ? A(" {Il} a un autre processus avancé et attend une réponse sous quelques jours.", g) : A(" Pas d'autre piste en cours.", g));
        c.dispoVue = true;
      } else if (qid === "pretentions") {
        t = `Demande ${CR.money(c.demande)} ${CR.ROLES[c.role].statut === "liberal" ? "HT de rétrocession" : CR.ROLES[c.role].statut === "stage" ? "de gratification" : "brut"} par mois.`;
        c.demandeVue = true;
        c.indices.ambition = CR.indiceTrait("ambition", c.perso.ambition, g);
      } else {
        for (const k of Q.traits) c.indices[k] = CR.indiceTrait(k, c.perso[k], g);
        t = Q.traits.map((k) => c.indices[k]).join(" ");
      }
      rep.push({ q: Q.label, t });
    }
    c.reponses = rep;
    c.etat = "entretien";
    c.expire = c.autreOffre ? s.day + 3 : Math.max(c.expire, s.day + 8);
    return c;
  };
  // Faire une offre : accepte, contre-propose une fois, ou décline
  CR.proposer = function (s, cid, montant) {
    const c = s.team.candidats.find((x) => x.id === cid);
    if (!c || ["parti", "embauche", "ecarte"].includes(c.etat)) return { ok: false, texte: "Candidature close." };
    montant = Math.round(montant || 0);
    const min = CR.minimumLegal(c.role, c.temps, c.niveau, s);
    if (montant < min) return { ok: false, illegal: true, texte: `En dessous du minimum : ${CR.money(min)} par mois.` };
    CR.spend(s, 10, "call");
    c.offres++;
    const a = CR.annonceOf(s, c);
    const envie = clamp(0.3 + (s.reps.clients + s.reps.confreres) / 150 + (a ? (a.remu - c.demande) / c.demande : 0) + (c.entretien ? 0.1 : 0), 0, 1);
    const seuil = c.demande * (1 - 0.04 - 0.08 * envie);
    if (montant >= seuil) { const st = CR.embaucher(s, c, montant); return { ok: true, texte: A(`{Il} accepte. Arrivée le ${CR.fmtDate(st.arrive, "dowshort")}.`, c.g), st }; }
    if (c.offres === 1) {
      c.contre = Math.max(min, r50(Math.max(seuil, (c.demande + montant) / 2)));
      return { ok: false, texte: A(`{Il} ne descendra pas sous ${CR.money(c.contre)} par mois.`, c.g) };
    }
    c.etat = "parti";
    c.raison = "a décliné votre offre";
    return { ok: false, texte: A("{Il} décline : l'écart est trop grand.", c.g) };
  };
  CR.ecarter = function (s, cid) {
    const c = s.team.candidats.find((x) => x.id === cid);
    if (c) { c.etat = "ecarte"; CR.spend(s, 3, "admin"); }
  };
  CR.embaucher = function (s, c, montant) {
    CR.equipe(s);
    const st = { id: CR.uid("p"), role: c.role, prenom: c.prenom, nom: c.nom, g: c.g, age: c.age, seed: c.seed, parcours: c.parcours, exp: c.exp, perso: c.perso, cv: c.cv, indices: Object.assign({}, c.indices), incohVue: !!c.incohVue, hired: s.day };
    st.vu = { traits: Object.fromEntries(Object.keys(c.indices).map((k) => [k, "indice"])), exp: {} };
    initEmploye(s, st, { arrive: CR.rollForward(Math.max(s.day + 1, c.dispo || s.day + 1)), temps: c.temps || 1, salary: montant });
    s.staff.push(st);
    c.etat = "embauche";
    const a = CR.annonceOf(s, c);
    if (a) a.pourvue = s.day;
    CR.log(s, `${st.name} rejoint le cabinet (${CR.roleLabel(st).toLowerCase()}, ${CR.money(montant)} par mois), à partir du ${CR.fmtDate(st.arrive, "short")}.`, "info");
    noteJ(s, st, "Recrutement.");
    return st;
  };
  // Compatibilité avec l'ancien panneau
  // L'ancien vivier de candidats tirait seize nombres au début de la partie et chaque premier lundi du mois.
  // On garde ces tirages, sans effet, pour qu'une même graine donne toujours le même monde qu'avant.
  CR.refreshApplicants = function (s) { for (let i = 0; i < 16; i++) CR.R.next(s); };
  CR.hire = function (s, id) { const c = (CR.equipe(s).candidats || []).find((x) => x.id === id); return c ? CR.embaucher(s, c, c.demande) : null; };

  // =================================================================== PRÉSENCE, CONGÉS, CAPACITÉ, CHARGE
  CR.congesAn = function (st, y) {
    const r = CR.seeded(`${st.seed}:conges:${y}`);
    const lundi = (d) => d - ((CR.dow(d) + 6) % 7) + 7;
    const ete = lundi(CR.dayOf(y, 7, 6 + Math.floor(r() * 24)));
    const weeks = [ete, ete + 7, ete + 14, lundi(CR.dayOf(y, 12, 18)), lundi(CR.dayOf(y, 4, 1 + Math.floor(r() * 20)))];
    return weeks;
  };
  CR.enConges = function (st, d) {
    if (st.role === "eleve") return false;
    const y = CR.ymd(d).y;
    return CR.congesAn(st, y).some((w) => d >= w && d < w + 7);
  };
  CR.present = (s, st, d = s.day) => !!st && !(st.depart && st.depart.fait) && d >= st.arrive && CR.isBusinessDay(d) && !CR.enConges(st, d);
  CR.capaciteJour = (st) => (CR.ROLES[st.role].heures * (st.temps || 1)) / 5;
  CR.capaciteSemaine = (st) => CR.ROLES[st.role].heures * (st.temps || 1);
  const ouvertes = (s, st) => (s.team ? s.team.taches : []).filter((t) => t.staffId === st.id && ["attente", "en_cours", "planifiee", "oubli"].includes(t.etat));
  CR.tachesDe = (s, st) => (s.team ? s.team.taches : []).filter((t) => t.staffId === st.id);
  CR.heuresRestantes = (s, st) => CR.sum(ouvertes(s, st), (t) => Math.max(0, t.heures - t.fait));
  CR.charge = (s, st) => CR.heuresRestantes(s, st) / Math.max(1, CR.capaciteSemaine(st));
  const reunionSemaine = (s) => !!(s.team && s.team.reunion === weekOf(s.day));

  // =================================================================== TÂCHES CONFIÉES
  CR.DELEG = {
    recherche: { label: "Recherche et note", heures: 4, exp: "recherche", trait: "rigueur", relecture: 20, factur: true },
    redaction: { label: "Projet d'acte", heures: 4, exp: "redaction", trait: "rigueur", relecture: 25, factur: true },
    depot: { label: "Dépôt au greffe", heures: 2, exp: null, trait: "rigueur", relecture: 5, admin: true },
    copie: { label: "Démarche au greffe", heures: 2, exp: null, trait: "rigueur", relecture: 5, admin: true },
    parloir: { label: "Visite au parloir", heures: 4, exp: "domaine", trait: "empathie", relecture: 0, factur: true },
    point: { label: "Faire le point avec le client", heures: 1, exp: "domaine", trait: "empathie", relecture: 0, factur: true },
    plaidoirie: { label: "Plaider le dossier", heures: 7, exp: "domaine", trait: "oral", relecture: 30, fixe: true, factur: true },
    substitution: { label: "Substitution à l'audience", heures: 3, exp: "domaine", trait: "oral", relecture: 0, fixe: true },
    permanence: { label: "Permanence pénale", heures: 8, exp: "gav", trait: "stress", relecture: 0, fixe: true },
    relances: { label: "Relances de facturation", heures: 2, exp: null, trait: "empathie", relecture: 0, admin: true },
    formation: { label: "Formation continue", heures: 7, exp: null, trait: "rigueur", relecture: 0 },
  };
  const ERREURS = {
    recherche: "Note incomplète : un texte hors sujet, le bon article manque",
    redaction: "Projet d'acte mal rédigé : un article mal visé et une date inexacte",
    delai: "Délai manqué : la démarche a été oubliée deux jours",
    piece: "Pièce oubliée : il a fallu retourner au greffe",
    accueil: "Client mal reçu : explications confuses, rendez-vous écourté",
    plaidoirie: "Plaidoirie faible : le dossier mal maîtrisé",
  };
  CR.peutFaire = (st, type) => (CR.ROLES[st.role].taches || []).includes(type) || type === "formation";

  // Ce qu'on peut confier dans un dossier
  CR.tachesDelegables = function (s, cs) {
    if (!cs || cs.status !== "active") return [];
    const def = CR.caseDef(cs);
    const out = [];
    let tasks = [];
    try { tasks = CR.caseTasks(s, cs); } catch (e) { tasks = []; }
    for (const t of tasks) {
      if (!t.enabled || t.danger) continue;
      if (t.kind === "admin" && /^depot_/.test(t.id)) out.push({ type: "depot", label: t.label, ref: { taskId: t.id } });
      else if (t.kind === "admin" && /copie|justificatif|pièces|permis de communiquer/i.test(t.label)) out.push({ type: "copie", label: t.label, ref: { taskId: t.id } });
      else if (t.kind === "draft" && !/convention|refus|décharger/i.test(t.label) && t.run) {
        const src = String(t.run);
        if (/scene:\s*"draft"/.test(src) && !/spend|api\.|CR\./.test(src)) { let r = null; try { r = t.run(); } catch (e) { r = null; } if (r && r.tpl) out.push({ type: "redaction", label: "Projet : " + t.label.replace(/^Rédiger (l'|le |la |les |une |un )?/i, ""), ref: { taskId: t.id, tpl: r.tpl } }); }
      }
    }
    out.push({ type: "recherche", label: "Recherche et note sur le dossier", ref: { k: "recherche" } });
    if (cs.lastUpdate !== s.day) out.push({ type: "point", label: "Faire le point avec le client", ref: { k: "point" } });
    if ((s.detenus || []).some((x) => x.caseId === cs.id)) out.push({ type: "parloir", label: "Visite au parloir", ref: { k: "parloir" } });
    for (const h of cs.hearings || []) {
      if (h.attended || h.missed || h.canceled || h.day < s.day || h.day > s.day + 45) continue;
      if (!h.substitue && !h.delegue) out.push({ type: "substitution", label: `Substitution : ${h.title}, ${CR.fmtDate(h.day, "dowshort")}`, ref: { hid: h.id }, jour: h.day });
      const petit = def.generated && ["tc", "tp"].includes(def.domaine) && !(s.detenus || []).some((x) => x.caseId === cs.id) && /Audience/.test(h.title || "") && !h.delegue;
      if (petit) out.push({ type: "plaidoirie", label: `Plaider : ${h.title}, ${CR.fmtDate(h.day, "dowshort")}`, ref: { hid: h.id }, jour: h.day });
    }
    return out;
  };
  const memeTache = (t, cs, it) => t.caseId === (cs ? cs.id : null) && t.type === it.type && JSON.stringify(t.ref || {}) === JSON.stringify(it.ref || {}) && ["attente", "en_cours", "planifiee", "a_relire", "oubli"].includes(t.etat);
  CR.dejaConfiee = (s, cs, it) => (s.team ? s.team.taches : []).find((t) => memeTache(t, cs, it)) || null;

  // Qualité attendue (0 à 1) : expérience dans le domaine, personnalité, charge, moral, coordination
  CR.qualiteTache = function (s, st, type, cs) {
    const D = CR.DELEG[type];
    const dom = cs ? st.exp[CR.expDomaine(cs)] || 0 : type === "permanence" ? st.exp.gav || 0 : 40;
    const sk = D.exp && D.exp !== "domaine" ? st.exp[D.exp] || 0 : dom;
    const p = st.perso;
    let q = D.admin ? 0.55 * p.rigueur / 100 + 0.25 * p.autonomie / 100 + 0.2 * Math.min(1, (st.taches + 3) / 10) : 0.4 * dom / 100 + 0.25 * sk / 100 + 0.2 * (p[D.trait] || 50) / 100 + 0.15 * p.rigueur / 100;
    if (st.morale < 40) q -= 0.08;
    if (CR.charge(s, st) > 1.2) q -= 0.08;
    if (reunionSemaine(s)) q += 0.04;
    if (st.lastReproche != null && s.day - st.lastReproche < 30) q += 0.03;
    return clamp(q, 0.05, 0.97);
  };
  const pErreur = (q) => clamp(0.03 + (1 - q) * 0.42, 0.02, 0.6);
  CR.qualiteLabel = (q) => (q >= 0.7 ? "bonne" : q >= 0.5 ? "correcte" : "fragile");
  CR.estimer = function (s, st, it, cs) {
    const D = CR.DELEG[it.type];
    const q = CR.qualiteTache(s, st, it.type, cs);
    let jour = it.jour != null ? it.jour : null;
    if (jour == null) {
      let h = CR.heuresRestantes(s, st) + D.heures;
      let d = Math.max(s.day + 1, st.arrive);
      for (let i = 0; i < 120; i++, d++) { if (!CR.present(s, st, d)) continue; h -= CR.capaciteJour(st); if (h <= 0) break; }
      jour = d;
    }
    const dispo = it.jour != null ? dispoJour(s, st, it.jour, it.type) : true;
    return { q, label: CR.qualiteLabel(q), risque: Math.round(pErreur(q) * 100), heures: D.heures, jour, dispo };
  };
  // Disponible un jour donné : au cabinet, ou (permanence) simplement pas en congé
  const dispoJour = (s, st, d, type) => (type === "permanence" ? d >= st.arrive && !CR.enConges(st, d) && !(st.depart && st.depart.fait) : CR.present(s, st, d));
  // Confier une tâche
  CR.confier = function (s, cs, stId, it, opts = {}) {
    const q = CR.equipe(s);
    const st = s.staff.find((x) => x.id === stId);
    if (!st) return { ok: false, texte: "Personne." };
    if (!CR.peutFaire(st, it.type)) return { ok: false, texte: `${CR.roleLabel(st)} ne peut pas s'en charger.` };
    if (st.depart && st.depart.fait) return { ok: false, texte: "Parti." };
    if (CR.dejaConfiee(s, cs, it)) return { ok: false, texte: "Déjà confiée." };
    const D = CR.DELEG[it.type];
    if (it.jour != null && !dispoJour(s, st, it.jour, it.type)) return { ok: false, texte: `${st.prenom} n'est pas au cabinet ce jour-là.` };
    if (st.role === "eleve" && it.type === "plaidoirie") return { ok: false, texte: "Un élève avocat ne plaide pas seul." };
    const est = CR.estimer(s, st, it, cs);
    const t = { id: CR.uid("t"), staffId: st.id, caseId: cs ? cs.id : null, type: it.type, label: it.label || D.label, ref: it.ref || {}, jour: it.jour != null ? it.jour : null, heures: D.heures, fait: 0, etat: D.fixe ? "planifiee" : "attente", relire: !!opts.relire && D.relecture > 0, created: s.day, prevu: est.jour, erreur: null, resultat: null };
    q.taches.push(t);
    CR.spend(s, 5, "admin", cs ? { caseId: cs.id } : {});
    if (it.type === "substitution" && cs) { const h = CR.hearingById(cs, it.ref.hid); if (h) { h.substitue = `Me ${st.name}`; h.substituePar = st.id; } }
    if (it.type === "plaidoirie" && cs) { const h = CR.hearingById(cs, it.ref.hid); if (h) h.delegue = st.id; }
    if (it.type === "permanence") { const du = (s.duty || []).find((x) => x.day === it.ref.day && x.type === it.ref.dtype); if (du) du.delegue = st.id; }
    if (cs) CR.timeline(s, cs, `Confié à ${st.prenom} : ${t.label}.`);
    noteJ(s, st, `Reçoit : ${t.label}${cs ? " (" + CR.caseTitle(s, cs) + ")" : ""}.`);
    return { ok: true, tache: t, est };
  };
  CR.annulerTache = function (s, tid) {
    const t = (s.team.taches || []).find((x) => x.id === tid);
    if (!t || !["attente", "planifiee"].includes(t.etat)) return false;
    t.etat = "annulee";
    liberer(s, t);
    return true;
  };
  function liberer(s, t) {
    const cs = t.caseId ? s.cases[t.caseId] : null;
    if (cs && t.ref && t.ref.hid) { const h = CR.hearingById(cs, t.ref.hid); if (h) { if (h.substituePar === t.staffId) { h.substitue = null; h.substituePar = null; } if (h.delegue === t.staffId) h.delegue = null; } }
    if (t.type === "permanence") { const du = (s.duty || []).find((x) => x.day === t.ref.day && x.type === t.ref.dtype); if (du && du.delegue === t.staffId) du.delegue = null; }
  }

  // Exécute une tâche du dossier sans prendre le temps du joueur : le temps passé est celui de l'employé
  function executerTacheDossier(s, cs, taskId, st) {
    const t = CR.caseTasks(s, cs).find((x) => x.id === taskId && x.enabled);
    if (!t || !t.run) return { fait: false };
    const sp = CR.spend;
    const etat = { min: s.min, energy: s.energy, at: s.at, workedToday: s.workedToday };
    const prev = s.workCase;
    let res = null;
    CR.spend = function (s2, minutes) { return Math.max(1, Math.round(minutes)); };
    try { s.workCase = cs.id; res = t.run(); } catch (e) { console.error("Tâche confiée en échec", e); } finally { CR.spend = sp; s.workCase = prev; Object.assign(s, etat); }
    if (res && res.scene) return { fait: false, scene: true };
    return { fait: true, label: t.label };
  }

  // Effet d'une tâche terminée ; err : type d'erreur non rattrapée, ou null
  function appliquer(s, t, st, err) {
    const cs = t.caseId ? s.cases[t.caseId] : null;
    const def = cs ? CR.caseDef(cs) : null;
    const nomP = st.prenom;
    const q = t.qualite != null ? t.qualite : 0.6;
    let txt = "";
    // facturation du temps passé (au taux horaire du dossier ; l'assistante relève des frais généraux)
    if (cs && CR.DELEG[t.type].factur && st.role !== "assistante") {
      const m = Math.round(t.heures * 60 * (st.role === "eleve" ? 0.5 : 1));
      cs.workedBy = cs.workedBy || {};
      cs.workedBy[st.id] = (cs.workedBy[st.id] || 0) + m;
      if (cs.status === "active") cs.worked = (cs.worked || 0) + m;
    }
    switch (t.type) {
      case "recherche": {
        if (!cs) break;
        const deja = new Set(cs.cards);
        const pool = (CR.LIB || []).filter((x) => x.domaine === def.domaineLib && !deja.has(x.id));
        const autres = (CR.LIB || []).filter((x) => x.domaine !== def.domaineLib && !deja.has(x.id));
        const pris = [];
        if (pool.length) pris.push(TR.pick(s, pool));
        if (pool.length > 1 && q >= 0.6) { const b = TR.pick(s, pool.filter((x) => x !== pris[0])); if (b) pris.push(b); }
        if (err && autres.length) { pris.length = Math.max(0, pris.length - 1); pris.push(TR.pick(s, autres)); }
        for (const x of pris) CR.pinText(s, cs, x.id);
        txt = pris.length ? `Note de recherche de ${nomP} : ${pris.map((x) => `${(CR.lib(x.id) || {}).cite || x.id} (${x.titre})`).join(" ; ")}.` : `Note de recherche de ${nomP} : les textes utiles sont déjà au dossier.`;
        CR.addOwnNote(s, cs, { text: txt, cat: err ? null : "verifier" });
        break;
      }
      case "redaction": {
        if (!cs) break;
        cs.projets = cs.projets || {};
        cs.projets[t.ref.tpl] = { by: st.id, nom: st.name, day: s.day, defaut: err ? "redaction" : null };
        txt = `Projet prêt : ${t.label.replace(/^Projet : /, "")}. Il vous reste à le relire, le compléter et le signer.`;
        break;
      }
      case "depot":
      case "copie": {
        if (!cs) break;
        const r = executerTacheDossier(s, cs, t.ref.taskId, st);
        txt = r.fait ? `${r.label} : fait par ${nomP}.` : `${t.label} : plus rien à faire (déjà fait, ou démarche qui demande l'avocat).`;
        break;
      }
      case "parloir":
        if (!cs) break;
        CR.trust(s, cs, err ? -6 : Math.round(3 + q * 6));
        cs.lastUpdate = s.day;
        txt = err ? `Parloir de ${nomP} : ${CR.clientName(cs)} est ressorti inquiet, ${err === "accueil" ? "les explications étaient confuses" : "rien n'a avancé"}.` : `Parloir de ${nomP} : ${CR.clientName(cs)} a été vu, rassuré, et vous transmet ses questions.`;
        CR.timeline(s, cs, `Visite au parloir par ${st.name}.`);
        break;
      case "point":
        if (!cs) break;
        if (err) { CR.trust(s, cs, -5); cs.lastUpdate = s.day; txt = `${CR.clientName(cs)} se plaint de l'appel de ${nomP} : on ne lui a rien expliqué.`; }
        else { CR.updatedClient(s, cs, 0.5 + q * 0.6); txt = `${nomP} a fait le point avec ${CR.clientName(cs)}.`; }
        break;
      case "plaidoirie":
        txt = plaider(s, t, st, err);
        break;
      case "relances": {
        const dus = s.order.map((id) => s.cases[id]).filter((c) => c && c.flags && c.flags.impaye && c.facture && c.facture.reste > 0);
        const ok = [];
        for (const c of dus) {
          if (err) { CR.trust(s, c, -5); continue; }
          if (TR.chance(s, 0.35 + q * 0.45)) { const m = c.facture.reste; CR.payIn(s, m, `Solde d'honoraires après relance — ${CR.clientName(c)}`, c.id); c.collected += m; s.stats.honoraires += m; c.facture.reste = 0; c.flags.impaye = false; ok.push(c); }
        }
        txt = err ? `Relances de ${nomP} trop sèches : deux clients s'en plaignent.` : ok.length ? `Relances de ${nomP} : ${CR.plural(ok.length, "facture")} réglée${ok.length > 1 ? "s" : ""} (${ok.map(CR.clientName).join(", ")}).` : `Relances de ${nomP} : pas de règlement pour l'instant.`;
        if (err) CR.rep(s, "clients", -1, "relances maladroites");
        break;
      }
      case "formation": {
        const k = t.ref.k || "tc";
        st.exp[k] = Math.min(95, (st.exp[k] || 0) + 4);
        st.formation.h += 7;
        st.morale = clamp(st.morale + 3, 0, 100);
        txt = `${nomP} a suivi sept heures de formation (${(CR.EXP.find((x) => x[0] === k) || [0, k])[1].toLowerCase()}).`;
        break;
      }
      default:
        break;
    }
    t.resultat = txt;
    // responsabilité : une erreur non rattrapée est la vôtre
    if (err) {
      st.erreurs++;
      st.derniereErreur = s.day;
      t.erreur = { type: err, texte: ERREURS[err] || "Erreur", rattrapee: false };
      if (cs) CR.erreur(s, cs, { id: "deleg_" + t.id, texte: `${ERREURS[err] || "Erreur"} (tâche confiée à ${st.name}).`, sanction: "Vous répondez du travail de ceux que vous encadrez.", regul: "Relire avant envoi ; superviser." });
      if (["redaction", "plaidoirie", "accueil"].includes(err) && TR.chance(s, 0.12)) CR.plainteBatonnier(s, cs, "supervision", 2, `${cs ? CR.clientName(cs) : "Un client"} se plaint du travail confié à ${st.name} sans supervision${cs ? " dans le dossier " + CR.caseTitle(s, cs) : ""}.`);
      st.morale = clamp(st.morale - 2, 0, 100);
    }
    if (txt) CR.mail(s, { from: `${st.name}, ${CR.roleLabel(st, true).toLowerCase()}`, subject: `${t.label}${cs ? " — " + CR.clientName(cs) : ""}`, kind: "note", caseId: cs ? cs.id : null, body: [[txt]] });
    // progression
    const D = CR.DELEG[t.type];
    const keys = [cs ? CR.expDomaine(cs) : t.type === "permanence" ? "gav" : null, D.exp && D.exp !== "domaine" ? D.exp : null].filter(Boolean);
    for (const k of new Set(keys)) {
      const gain = (st.role === "eleve" ? 5 : 3) * (1 - (st.exp[k] || 0) / 100) * (t.relire ? 1.3 : 1) + 0.5;
      st.exp[k] = Math.min(95, Math.round(((st.exp[k] || 0) + gain) * 10) / 10);
      st.vu.exp[k] = true;
    }
    if (D.trait && st.vu.traits[D.trait] !== "confirme" && TR.chance(s, 0.5)) st.vu.traits[D.trait] = "confirme";
    st.taches++;
    if (["assises", "instr"].includes(keys[0]) || t.type === "plaidoirie") st.morale = clamp(st.morale + (st.perso.ambition > 65 ? 3 : 2), 0, 100);
    st.skill = Math.round(CR.sum(Object.values(st.exp)) / CR.EXP.length);
    t.etat = "fait";
    t.fin = s.day;
    noteJ(s, st, `${err ? "Erreur" : "Terminé"} : ${t.label}.`);
  }

  // Un petit dossier plaidé par le collaborateur : issue tirée selon la qualité et la préparation
  function plaider(s, t, st, err) {
    const cs = s.cases[t.caseId];
    if (!cs || cs.status !== "active") return "";
    const h = CR.hearingById(cs, t.ref.hid);
    if (!h || h.attended || h.canceled) return "";
    let q = (t.qualite != null ? t.qualite : 0.5) + (t.prepare ? 0.12 : 0) + Math.min(0.1, (cs.issues || []).length * 0.04) - (err ? 0.25 : 0);
    q = clamp(q, 0, 1);
    h.attended = true;
    h.plaidePar = st.id;
    const def = CR.caseDef(cs);
    let issue;
    if (cs.camp === "pc") issue = TR.chance(s, 0.45 + q * 0.4) ? { type: "indemnise", detail: `plaidé par Me ${st.name}` } : { type: "deboute", detail: `plaidé par Me ${st.name}` };
    else { const x = TR.next(s); issue = x < 0.08 + q * 0.25 ? { type: "relaxe", detail: `plaidé par Me ${st.name}` } : x < 0.12 + q * 0.37 ? { type: "requalification_favorable", detail: `plaidé par Me ${st.name}` } : { type: "condamnation", detail: `peine plaidée par Me ${st.name}` }; }
    if (cs.aj && CR.ajMission) CR.ajMission(s, cs, def.domaine === "tp" ? "tp" : "tc");
    CR.timeline(s, cs, `${h.title} : plaidé par ${st.name}.`);
    CR.closeCase(s, cs, issue);
    const bon = ["relaxe", "requalification_favorable", "indemnise"].includes(issue.type);
    st.morale = clamp(st.morale + (bon ? 5 : -1), 0, 100);
    return `${h.title} plaidée par ${st.name} : ${CR.outcomeLabel(cs.outcome)}.${t.prepare ? "" : " Vous n'aviez pas préparé l'audience avec " + (st.g === "f" ? "elle" : "lui") + "."}`;
  }

  // Relire (ou préparer avec lui) : coûte du temps, rattrape les erreurs
  CR.relire = function (s, tid) {
    const t = (s.team.taches || []).find((x) => x.id === tid);
    if (!t) return null;
    const st = s.staff.find((x) => x.id === t.staffId);
    const D = CR.DELEG[t.type];
    if (t.type === "plaidoirie" && t.etat === "planifiee") {
      if (t.prepare) return null;
      CR.spend(s, D.relecture, "meet", { caseId: t.caseId });
      t.prepare = true;
      return { texte: `Plaidoirie préparée avec ${st ? st.prenom : "votre collaborateur"}.` };
    }
    if (t.etat !== "a_relire" || !st) return null;
    CR.spend(s, D.relecture, "desk", { caseId: t.caseId });
    const vigilance = s.energy < 30 ? 0.75 : 0.9;
    const err = t.erreurCachee;
    t.erreurCachee = null;
    if (err && TR.chance(s, vigilance)) {
      t.erreur = { type: err, texte: ERREURS[err] || "Erreur", rattrapee: true };
      noteJ(s, st, `Erreur rattrapée à la relecture : ${t.label}.`);
      t.relu = s.day;
      appliquer(s, t, st, null);
      t.erreur = { type: err, texte: ERREURS[err] || "Erreur", rattrapee: true };
      st.derniereErreurRattrapee = s.day;
      return { rattrapee: true, texte: `Relu : ${(ERREURS[err] || "erreur").toLowerCase()}. Corrigé avant envoi.` };
    }
    t.relu = s.day;
    appliquer(s, t, st, err || null);
    return { rattrapee: false, texte: err ? "Relu, mais l'erreur vous a échappé." : "Relu : rien à reprendre." };
  };

  // Le travail d'une journée, pour chaque personne présente
  function travailler(s, d) {
    const q = s.team;
    for (const st of s.staff) {
      if (st.depart && st.depart.fait) continue;
      // tâches à jour fixe
      // permanences passées sans appel
      for (const t of q.taches.filter((x) => x.staffId === st.id && x.type === "permanence" && ["planifiee", "en_cours"].includes(x.etat) && x.jour < d - 1)) {
        t.etat = "fait"; t.fin = t.jour; t.resultat = t.resultat || "Permanence calme : aucun appel."; liberer(s, t);
      }
      for (const t of q.taches.filter((x) => x.staffId === st.id && x.etat === "planifiee" && x.jour != null && x.jour <= d)) {
        if (t.type === "permanence") { if (t.jour === d) { t.fait = t.heures; st.hSemaine += t.heures; t.etat = "en_cours"; } continue; }
        if (!CR.present(s, st, d) || t.jour < d) {
          t.etat = "echec";
          liberer(s, t);
          t.resultat = `${st.prenom} n'était pas disponible : ${t.label} vous revient.`;
          CR.mail(s, { from: st.name, subject: `Empêchement — ${t.label}`, kind: "note", important: true, caseId: t.caseId, body: [[t.resultat]] });
          continue;
        }
        t.qualite = CR.qualiteTache(s, st, t.type, t.caseId ? s.cases[t.caseId] : null);
        t.fait = t.heures;
        st.hSemaine += t.heures;
        if (t.type === "substitution") { t.etat = "fait"; t.fin = d; t.resultat = `${st.name} a répondu à l'appel de l'affaire et l'a fait retenir jusqu'à votre arrivée.`; st.taches++; continue; }
        const err = TR.chance(s, pErreur(t.qualite)) ? "plaidoirie" : null;
        appliquer(s, t, st, err);
      }
      if (!CR.present(s, st, d)) continue;
      // reprise des démarches oubliées
      for (const t of q.taches.filter((x) => x.staffId === st.id && x.etat === "oubli" && d >= x.reprise)) {
        appliquer(s, t, st, null);
        t.resultat = (t.resultat || "") + " Avec deux jours de retard.";
        t.erreur = { type: "delai", texte: ERREURS.delai, rattrapee: false };
        st.erreurs++;
      }
      let h = CR.capaciteJour(st);
      const queue = q.taches.filter((x) => x.staffId === st.id && ["attente", "en_cours"].includes(x.etat) && x.jour == null);
      const reste = CR.sum(queue, (x) => x.heures - x.fait);
      const tard = reste > CR.capaciteSemaine(st) * 0.6 && reste > h * 3;
      if (tard) { h *= 1.25; st.morale = clamp(st.morale - 0.8, 0, 100); st.tard = (st.tard || 0) + 1; }
      for (const t of queue) {
        if (h <= 0) break;
        const x = Math.min(h, t.heures - t.fait);
        t.fait += x;
        h -= x;
        st.hSemaine += x;
        t.etat = "en_cours";
        if (t.fait >= t.heures - 1e-6) terminer(s, t, st);
      }
      // charge et moral
      const ratio = CR.charge(s, st);
      if (ratio > 1.4) st.morale -= 1.2;
      else if (ratio > 1) st.morale -= 0.4;
      else if (ratio < 0.15 && st.role !== "assistante") { st.oisif = (st.oisif || 0) + 1; if (st.oisif > 8 && st.perso.ambition > 55) st.morale -= 0.3; }
      else { st.oisif = 0; if (st.morale < 75) st.morale += 0.15; }
      if (ratio >= 0.15) st.oisif = 0;
      st.morale = clamp(st.morale, 0, 100);
    }
  }
  function terminer(s, t, st) {
    const cs = t.caseId ? s.cases[t.caseId] : null;
    if (cs && cs.status === "closed") { t.etat = "annulee"; t.resultat = "Dossier clos entre-temps."; return; }
    t.qualite = CR.qualiteTache(s, st, t.type, cs);
    const D = CR.DELEG[t.type];
    let err = TR.chance(s, pErreur(t.qualite)) ? (D.admin && t.type !== "relances" ? TR.pick(s, ["delai", "piece"]) : t.type === "recherche" ? "recherche" : t.type === "redaction" ? "redaction" : "accueil") : null;
    if (t.type === "formation") err = null;
    if (err === "delai") { t.etat = "oubli"; t.reprise = CR.rollForward(s.day + 2); return; }
    if (t.relire) { t.etat = "a_relire"; t.erreurCachee = err; t.pret = s.day; CR.mail(s, { from: st.name, subject: `À relire — ${t.label}`, kind: "note", caseId: t.caseId, body: [[`${t.label} : prêt. Je l'envoie dès que vous l'avez relu.`]] }); return; }
    if (err === "piece" && !t.retour) {
      t.retour = true;
      t.fait = 0;
      t.heures += 1;
      t.etat = "attente";
      t.erreur = { type: "piece", texte: ERREURS.piece, rattrapee: false };
      st.erreurs++;
      noteJ(s, st, `Pièce oubliée : ${t.label}.`);
      return;
    }
    appliquer(s, t, st, err === "piece" ? null : err);
  }

  // =================================================================== ASSISTANTE : TÉLÉPHONE, RENDEZ-VOUS, RAPPELS
  CR.assistanteDispo = function (s) {
    if (!s.staff || !s.staff.length || !CR.isBusinessDay(s.day) || s.min < 8 * 60 + 30 || s.min > 19 * 60) return null;
    return s.staff.find((st) => st.role === "assistante" && CR.present(s, st)) || null;
  };
  const objetCourt = (txt) => {
    const t = String(txt || "").replace(/\s+/g, " ").trim();
    const ph = t.split(/(?<=[.!?…])\s+/).slice(0, 2).join(" ");
    return ph.length > 190 ? ph.slice(0, 187) + "…" : ph;
  };
  // Appelée à la place du répondeur. Renvoie le message pris, { oubli: true }, ou null si personne ne décroche.
  CR.equipeDecroche = function (s, r, vm0) {
    if (r.noStaff) return null;
    const a = CR.assistanteDispo(s);
    if (!a) return null;
    CR.equipe(s);
    const cs = r.caseId ? s.cases[r.caseId] : null;
    const def = cs ? CR.caseDef(cs) : null;
    const pf = clamp((0.02 + (1 - a.perso.rigueur / 100) * 0.12) * (CR.charge(s, a) > 1.1 ? 1.5 : 1) * (reunionSemaine(s) ? 0.6 : 1), 0.01, 0.25);
    const urgence = r.kind === "permanence" || r.kind === "greffe" ? "très urgent" : def && def.urgence ? "urgent" : "normal";
    let rdv = null;
    if (cs && cs.status === "lead" && r.kind !== "permanence" && r.kind !== "greffe") {
      const day = CR.nextBusinessDay(s.day);
      const min = 10 * 60 + 30 * TR.int(s, 0, 12);
      rdv = { day, min };
    }
    const objet = objetCourt(r.vmText) || (r.kind === "lead" ? "Souhaite consulter un avocat." : "Demande que vous le rappeliez.");
    const qui = `${r.from}${cs ? ` (${CR.caseTitle(s, cs)})` : ""}`;
    const txt = `Message pris par ${a.prenom} à ${CR.fmtTime(s.min)}. Qui : ${qui}. Objet : « ${objet} » Urgence : ${urgence}.${rdv ? ` Rendez-vous fixé le ${CR.fmtDate(rdv.day, "dowshort")} à ${CR.fmtTime(rdv.min)}, inscrit à l'agenda.` : " Rappel demandé."}`;
    if (TR.chance(s, pf)) {
      a.oublis = (a.oublis || 0) + 1;
      noteJ(s, a, `Message oublié : ${r.from}.`);
      const data = Object.assign({}, r, { vmText: `${txt} (Retrouvé sur le bureau de ${a.prenom}, transmis avec un jour de retard.)`, taken: a.id, prisPar: a.prenom, noStaff: true, onMissed: null });
      CR.schedule(s, { day: CR.nextBusinessDay(s.day), min: 9 * 60 + 15, type: "fn", key: "msgOublie", data });
      if (r.onMissed && r.caseId && s.cases[r.caseId]) CR.runHook(s, s.cases[r.caseId], r.onMissed, r.data);
      return { oubli: true };
    }
    if (rdv) {
      s.agenda.push({ id: CR.uid("a"), created: s.day, day: rdv.day, min: rdv.min, title: `Rendez-vous : ${r.from}`, caseId: cs.id, ref: null, parAssistante: a.id });
      s.agenda.sort((x, y) => x.day - y.day || (x.min || 0) - (y.min || 0));
      for (const e of s.pending) if (e.caseId === cs.id && e.key === "_leadExpire") e.day = Math.max(e.day, rdv.day + 2);
      cs.flags.rdvAssistante = rdv;
    }
    a.appels = (a.appels || 0) + 1;
    s.team.appelsPris = (s.team.appelsPris || 0) + 1;
    return vm0(s, Object.assign({}, r, { vmText: txt, taken: a.id, prisPar: a.prenom, urgence }));
  };
  CR.GLOBAL_FN.msgOublie = (s, d) => { if (CR._voicemail0) CR._voicemail0(s, Object.assign({}, d, { at: s.min })); };
  // Le répondeur passe d'abord par l'assistante ; le filtre annonce l'appel
  const vm0 = CR.voicemail;
  CR._voicemail0 = vm0;
  CR.voicemail = function (s, r) {
    const pris = CR.equipeDecroche(s, r, vm0);
    if (pris && pris.oubli) return null;
    return pris || vm0(s, r);
  };
  const ring0 = CR.ringNow;
  CR.ringNow = function (s, r, busy) {
    const x = ring0(s, r, busy);
    if (x) { const a = CR.assistanteDispo(s); if (a) { const cs = x.caseId ? s.cases[x.caseId] : null; x.filtre = `${a.prenom} : « ${x.from}${cs ? `, pour le dossier ${CR.caseTitle(s, cs)}` : ""}. Je vous le passe ? »`; x.prisPar = a.prenom; } }
    return x;
  };
  // Rappels des échéances inscrites à l'agenda et des audiences du lendemain
  function rappels(s, d) {
    const a = s.staff.find((st) => st.role === "assistante" && CR.present(s, st, d));
    if (!a) return;
    const q = s.team;
    const items = [];
    for (const e of s.agenda) if ((e.day === d || e.day === CR.nextBusinessDay(d)) && !e.parAssistante) items.push({ k: "a" + e.id + ":" + d, t: `${e.day === d ? "Aujourd'hui" : CR.fmtDate(e.day, "dowshort")}${e.min != null ? " à " + CR.fmtTime(e.min) : ""} : ${e.title}` });
    for (const id of s.order) {
      const cs = s.cases[id];
      if (!cs || cs.status === "closed") continue;
      for (const h of cs.hearings || []) if (!h.attended && !h.canceled && h.day === CR.nextBusinessDay(d)) items.push({ k: "h" + h.id + ":" + d, t: `${CR.fmtDate(h.day, "dowshort")} à ${CR.fmtTime(h.min)} : ${h.title} (${CR.caseTitle(s, cs)})${h.delegue ? " — plaidée par votre collaborateur" : ""}` });
    }
    const pf = clamp((0.02 + (1 - a.perso.rigueur / 100) * 0.1) * (CR.charge(s, a) > 1.1 ? 1.5 : 1) * (reunionSemaine(s) ? 0.6 : 1), 0.01, 0.25);
    const dits = items.filter((x) => !q.rappels.includes(x.k) && !TR.chance(s, pf));
    if (!dits.length) return;
    for (const x of dits) q.rappels.push(x.k);
    if (q.rappels.length > 120) q.rappels.splice(0, q.rappels.length - 120);
    CR.mail(s, { from: `${a.name}, ${CR.roleLabel(a, true).toLowerCase()}`, subject: "Échéances", kind: "note", body: [["Bonjour, voici ce qui arrive :"], ...dits.map((x) => ["• " + x.t])] });
  }

  // =================================================================== RÉUNION DU LUNDI
  CR.reunionPossible = (s) => CR.dow(s.day) === 1 && CR.isBusinessDay(s.day) && s.team && s.team.reunion !== weekOf(s.day) && s.staff.some((st) => CR.present(s, st)) && s.min < 17 * 60;
  CR.reunion = function (s) {
    if (!CR.reunionPossible(s)) return null;
    CR.spend(s, 45, "meet");
    s.team.reunion = weekOf(s.day);
    const lignes = [];
    for (const st of s.staff.filter((x) => CR.present(s, x))) {
      st.morale = clamp(st.morale + (CR.charge(s, st) > 1.2 ? 2 : 4), 0, 100);
      const ts = ouvertes(s, st);
      lignes.push(`• ${st.name} — charge ${Math.round(CR.charge(s, st) * 100)} % : ${ts.length ? ts.map((t) => t.label).join(" ; ") : "rien en cours"}.`);
    }
    const sem = s.agenda.filter((a) => a.day >= s.day && a.day < s.day + 7).map((a) => `• ${CR.fmtDate(a.day, "dowshort")} : ${a.title}`);
    CR.mail(s, { from: "Vous (note pour vous-même)", subject: "Réunion d'équipe du lundi", kind: "note", body: [["Point sur les dossiers, les délais de la semaine et la charge de chacun."], ...lignes.map((l) => [l]), ...(sem.length ? [["Agenda de la semaine :"], ...sem.map((l) => [l])] : [])] });
    return true;
  };

  // =================================================================== RECONNAISSANCE, REPROCHES, FORMATION, ENTRETIEN ANNUEL
  CR.feliciter = function (s, id) {
    const st = s.staff.find((x) => x.id === id);
    if (!st) return;
    CR.spend(s, 5, "meet");
    st.morale = clamp(st.morale + (s.day - st.lastFelicite >= 14 ? 6 : 1), 0, 100);
    st.lastFelicite = s.day;
    noteJ(s, st, "Félicitations.");
  };
  CR.reprocher = function (s, id) {
    const st = s.staff.find((x) => x.id === id);
    if (!st) return;
    CR.spend(s, 10, "meet");
    st.reproches++;
    st.lastReproche = s.day;
    st.morale = clamp(st.morale - (st.derniereErreur != null && s.day - st.derniereErreur < 20 ? 5 : 10), 0, 100);
    noteJ(s, st, st.derniereErreur != null && s.day - st.derniereErreur < 20 ? "Reproche après une erreur." : "Reproche sans motif récent.");
  };
  CR.domaineFaible = (st) => ["gav", "ci", "tc", "instr", "assises", "victimes"].sort((a, b) => (st.exp[a] || 0) - (st.exp[b] || 0))[0];
  CR.financerFormation = function (s, id) {
    const st = s.staff.find((x) => x.id === id);
    if (!st) return null;
    const cout = 7 * CH("coutFormation");
    CR.payOut(s, cout, `Formation continue — ${st.name} (7 h)`);
    return CR.confier(s, null, st.id, { type: "formation", label: `Formation : ${(CR.EXP.find((x) => x[0] === CR.domaineFaible(st)) || [0, ""])[1].toLowerCase()}`, ref: { k: CR.domaineFaible(st) } });
  };
  CR.revueDue = (s, st) => st.revueDemande && st.revueDemande.statut === "attente";
  CR.repondreRevue = function (s, id, choix) {
    const st = s.staff.find((x) => x.id === id);
    if (!st || !CR.revueDue(s, st)) return;
    const R = st.revueDemande;
    CR.spend(s, 30, "meet");
    if (choix === "accorder") { st.salary = r50(st.salary * (1 + R.pct / 100)); st.morale = clamp(st.morale + 12, 0, 100); }
    else if (choix === "moitie") { st.salary = r50(st.salary * (1 + R.pct / 200)); st.morale = clamp(st.morale + 3, 0, 100); }
    else { st.morale = clamp(st.morale - (st.perso.ambition > 65 ? 14 : 8), 0, 100); }
    if (R.assoc && choix !== "refuser") { st.perspectiveAssoc = s.day; st.morale = clamp(st.morale + 6, 0, 100); st.perso.loyaute = Math.min(95, st.perso.loyaute + 5); }
    R.statut = choix;
    R.reponse = s.day;
    st.revue = CR.addMonths(s.day, 12);
    noteJ(s, st, `Entretien annuel : ${choix === "accorder" ? "augmentation accordée" : choix === "moitie" ? "moitié accordée" : "refus"}.`);
  };

  // =================================================================== FIN DE CONTRAT, DÉPARTS
  CR.enEssai = (s, st) => st.essaiFin != null && s.day < st.essaiFin;
  CR.finContrat = function (s, id) {
    const st = s.staff.find((x) => x.id === id);
    if (!st || st.depart) return null;
    const R = CR.ROLES[st.role];
    CR.spend(s, 20, "meet");
    if (CR.enEssai(s, st) || s.day < st.arrive) return CR.depart(s, st, "fin de la période d'essai à votre initiative", { jours: 8 });
    if (st.role === "eleve") return CR.depart(s, st, "fin anticipée du stage, l'école d'avocats prévenue", { jours: 8 });
    if (R.statut === "liberal") return CR.depart(s, st, "fin de la collaboration à votre initiative", { mois: CH("prevenance") });
    const anc = (s.day - st.arrive) / 30.4;
    const indem = anc >= 8 ? Math.round(st.salary * CH("indemLic") * anc / 12) : 0;
    return CR.depart(s, st, "licenciement", { mois: R.cadre ? CH("preavisCadre") : CH("preavisEmploye"), indem });
  };
  CR.letGo = CR.finContrat;
  // Annonce un départ (préavis) ou part tout de suite
  CR.depart = function (s, st, raison, o = {}) {
    if (st.depart) return st.depart;
    const jour = o.immediat ? s.day : o.mois ? CR.addMonths(s.day, o.mois) : s.day + (o.jours || 8);
    st.depart = { annonce: s.day, jour, raison, indem: o.indem || 0, installation: !!o.installation, fait: false };
    noteJ(s, st, `Départ annoncé : ${raison}.`);
    CR.log(s, `${st.name} quittera le cabinet le ${CR.fmtDate(jour, "short")} (${raison}).`, "bad");
    if (o.immediat) finaliser(s, st);
    return st.depart;
  };
  function finaliser(s, st) {
    st.depart.fait = true;
    for (const t of (s.team.taches || []).filter((x) => x.staffId === st.id && ["attente", "en_cours", "planifiee", "a_relire", "oubli"].includes(x.etat))) { t.etat = "abandonnee"; t.resultat = `${st.prenom} est parti${st.g === "f" ? "e" : ""} avant de la finir.`; liberer(s, t); }
    if (st.depart.indem) CR.payOut(s, st.depart.indem, `Indemnité de licenciement — ${st.name}`);
    let emmene = null;
    if (st.depart.installation) {
      const cands = s.order.map((id) => s.cases[id]).filter((c) => c && c.status === "active" && (c.workedBy || {})[st.id] >= 120 && c.trust < 75);
      if (cands.length && TR.chance(s, 0.5)) { emmene = cands.sort((a, b) => b.workedBy[st.id] - a.workedBy[st.id])[0]; CR.closeCase(s, emmene, { type: "fired", detail: `le client a suivi Me ${st.name}` }); }
    }
    s.staff = s.staff.filter((x) => x !== st);
    s.team.partis.unshift({ id: st.id, name: st.name, role: st.role, g: st.g, seed: st.seed, arrive: st.arrive, fin: s.day, raison: st.depart.raison, clients: (st.clientele || []).length, emmene: emmene ? CR.clientName(emmene) : null });
    CR.log(s, `${st.name} a quitté le cabinet (${st.depart.raison})${(st.clientele || []).length ? `, avec sa clientèle personnelle (${(st.clientele || []).length} clients)` : ""}${emmene ? ` ; ${CR.clientName(emmene)} le suit` : ""}.`, "bad");
  }
  function departsEtSemaine(s, d) {
    for (const st of s.staff.slice()) {
      if (st.depart && !st.depart.fait && d >= st.depart.jour) { finaliser(s, st); continue; }
      if (st.role === "eleve" && st.stageFin != null && d >= st.stageFin && !st.depart) {
        CR.mail(s, { from: st.name, subject: "Fin de mon stage", kind: "email", body: [["Mon stage s'achève aujourd'hui. Merci pour tout ce que j'ai appris ici."], [st.exp.tc + st.exp.recherche > 80 ? "Si une collaboration était possible, j'en serais heureu" + (st.g === "f" ? "se" : "x") + "." : "Je vous souhaite le meilleur pour le cabinet."]] });
        s.team.ancienStagiaire = { id: st.id, jusqua: d + 10, nom: st.name, prenom: st.prenom, nomF: st.nom, g: st.g, seed: st.seed, parcours: st.parcours, exp: Object.assign({}, st.exp), perso: Object.assign({}, st.perso), cv: st.cv, indices: st.indices };
        CR.depart(s, st, "fin du stage", { immediat: true });
      }
    }
    if (CR.dow(d) !== 1) return;
    // chaque lundi : départs volontaires, cantonnement du collaborateur
    for (const st of s.staff.slice()) {
      if (st.depart || d < st.arrive) continue;
      const R = CR.ROLES[st.role];
      if (st.morale < 30) {
        const p = clamp((30 - st.morale) / 40 * (1.25 - st.perso.loyaute / 100), 0.05, 0.6);
        if (TR.chance(s, p)) {
          const mois = CR.enEssai(s, st) ? 0 : st.role === "eleve" ? 0 : R.statut === "liberal" ? CH("prevenance") : R.cadre ? CH("preavisCadre") : CH("preavisEmploye");
          CR.mail(s, { from: st.name, subject: "Ma démission", kind: "email", important: true, body: [[st.morale < 15 ? "Je n'en peux plus. Je pars." : "J'ai décidé de quitter le cabinet. Ce n'est pas une décision facile."], [mois ? `J'effectuerai mon ${R.statut === "liberal" ? "délai de prévenance" : "préavis"} jusqu'au ${CR.fmtDate(CR.addMonths(d, mois), "long")}.` : "Je pars à la fin de la semaine prochaine."]] });
          CR.depart(s, st, "démission", mois ? { mois } : { jours: 8 });
          continue;
        }
      }
      if (st.role === "collaborateur") {
        const semH = st.hSemaine;
        if (semH > CR.capaciteSemaine(st) * 1.15) st.cantonne++;
        else st.cantonne = Math.max(0, st.cantonne - 1);
        if (st.cantonne === 3) { st.morale = clamp(st.morale - 5, 0, 100); CR.mail(s, { from: st.name, subject: "Ma clientèle personnelle", kind: "email", important: true, body: [["Depuis trois semaines, je n'ai plus une heure pour mes propres clients. Le contrat de collaboration me garantit le temps de développer ma clientèle personnelle (art. 14.3 du règlement intérieur national)."], ["Pouvons-nous en parler ?"]] }); }
        if (st.cantonne >= 6 && !st.reclamOrdre) { st.reclamOrdre = true; CR.plainteBatonnier(s, null, "collaboration", 3, `Votre collaborateur ${st.name} saisit l'Ordre : vous l'empêchez de développer sa clientèle personnelle en le chargeant au-delà de ce que prévoit son contrat.`); }
        const anc = d - st.arrive;
        if (anc > 270 && st.perso.ambition >= 70 && (st.clientele || []).length >= 4 && TR.chance(s, 0.04)) {
          CR.mail(s, { from: st.name, subject: "Je m'installe", kind: "email", important: true, body: [["J'ai décidé de m'installer à mon compte. Ma clientèle personnelle me suivra."], [`Je respecte le délai de prévenance de trois mois : je pars le ${CR.fmtDate(CR.addMonths(d, CH("prevenance")), "long")}.`]] });
          CR.depart(s, st, "installation à son compte", { mois: CH("prevenance"), installation: true });
        }
      }
      st.hSemaine = 0;
      st.semaine = weekOf(d);
    }
  }

  // =================================================================== DÉONTOLOGIE (chaque mois)
  const CLIENTS_PERSO = ["M. Ferhat", "Mme Lopes", "M. Kowalski", "Mme N'Diaye", "M. Barbier", "Mme Perrin", "M. Abdi", "Mme Colin", "M. Vidal", "Mme Brun"];
  function partiesAdverses(s) {
    const out = [];
    for (const id of s.order) {
      const cs = s.cases[id];
      if (!cs || !["active", "prospect"].includes(cs.status)) continue;
      const def = CR.caseDef(cs);
      for (const f of Object.values(def.facts || {})) if (f.cat === "party" && f.party) out.push({ nom: f.party, cs });
    }
    return out;
  }
  function deontoMois(s, d) {
    for (const st of s.staff) {
      if (d < st.arrive || (st.depart && st.depart.fait)) continue;
      // secret professionnel partagé : un employé indiscret crée un incident
      const p = 0.008 + Math.max(0, (60 - st.perso.loyaute) + (60 - st.perso.rigueur)) / 2200;
      if (TR.chance(s, p)) {
        const actifs = s.order.map((id) => s.cases[id]).filter((c) => c && c.status === "active");
        const cs = actifs.length ? TR.pick(s, actifs) : null;
        const txt = `${st.name} a parlé ${cs ? "du dossier " + CR.caseTitle(s, cs) : "d'un dossier du cabinet"} à voix haute à la buvette du Palais ; un journaliste a entendu.`;
        st.incidents.push({ day: d, text: txt });
        noteJ(s, st, "Indiscrétion.");
        CR.rep(s, "clients", -3, "une indiscrétion au cabinet");
        if (cs) CR.trust(s, cs, -10);
        CR.mail(s, { from: cs ? CR.clientName(cs) : "Un client", subject: "Ce que j'ai lu", kind: "email", important: true, caseId: cs ? cs.id : null, body: [[txt], ["Le secret professionnel s'impose à tout le cabinet, pas seulement à l'avocat."]] });
        if (TR.chance(s, 0.4)) CR.plainteBatonnier(s, cs, "secret", 3, `Violation du secret professionnel au sein de votre cabinet : ${txt}`);
      }
      // clientèle personnelle du collaborateur, et ses conflits
      if (st.role === "collaborateur" && !st.depart) {
        if (TR.chance(s, 0.25 + st.perso.ambition / 400)) {
          const adv = partiesAdverses(s);
          if (adv.length && TR.chance(s, 0.25)) {
            const x = TR.pick(s, adv);
            if (TR.chance(s, st.perso.rigueur / 100 * 0.85 + 0.05)) {
              CR.mail(s, { from: st.name, subject: "Conflit d'intérêts évité", kind: "email", caseId: x.cs.id, body: [[`${x.nom} m'a demandé de l'assister. J'ai vérifié nos dossiers : c'est la partie adverse dans ${CR.caseTitle(s, x.cs)}. J'ai refusé.`]] });
            } else {
              st.clientele.push({ nom: x.nom, day: d, conflit: x.cs.id });
              CR.mail(s, { from: "Le confrère adverse", subject: "Conflit d'intérêts dans votre cabinet", kind: "courrier", important: true, caseId: x.cs.id, body: [[`Votre collaborateur ${st.name} assiste ${x.nom}, partie adverse de votre client dans ${CR.caseTitle(s, x.cs)}. Un même cabinet ne peut défendre des intérêts opposés.`]] });
              CR.plainteBatonnier(s, x.cs, "conflit", 3, `Conflit d'intérêts : votre collaborateur ${st.name} assiste ${x.nom}, partie adverse de votre client (${CR.caseTitle(s, x.cs)}). Les conflits se vérifient pour tout le cabinet.`);
              st.clientele = st.clientele.filter((c) => c.nom !== x.nom);
              st.morale = clamp(st.morale - 5, 0, 100);
              noteJ(s, st, `Conflit d'intérêts : ${x.nom}.`);
            }
          } else st.clientele.push({ nom: TR.pick(s, CLIENTS_PERSO), day: d });
        }
      }
      // formation continue : fin d'année
      const y = CR.ymd(d).y;
      if (st.formation && st.formation.annee !== y) {
        if (CR.ROLES[st.role].avocat && st.formation.h < CH("formation")) { st.morale = clamp(st.morale - 3, 0, 100); noteJ(s, st, "A dû financer seul sa formation."); }
        st.formation = { annee: y, h: 0 };
      }
      // entretien annuel
      if (!st.revueDemande || st.revueDemande.statut !== "attente") {
        if (d >= st.revue && !st.depart) {
          const pct = st.perso.ambition > 70 ? 8 : st.perso.ambition > 50 ? 5 : 3;
          const expMoy = (st.exp.tc + st.exp.instr + st.exp.gav + st.exp.redaction) / 4;
          st.revueDemande = { day: d, pct, assoc: st.role === "collaborateur" && st.perso.ambition >= 70 && expMoy >= 50 && d - st.arrive > 700, statut: "attente" };
          CR.mail(s, { from: st.name, subject: "Mon entretien annuel", kind: "email", important: true, body: [[`Cela fait un an. J'aimerais que nous fassions le point : je souhaite une ${st.role === "collaborateur" ? "hausse de rétrocession" : "augmentation"} de ${pct} %.`], st.revueDemande.assoc ? ["J'aimerais aussi savoir si une association est envisageable."] : []] });
        }
      } else if (d - st.revueDemande.day > 30) { st.revueDemande.statut = "ignoree"; st.morale = clamp(st.morale - 8, 0, 100); st.revue = CR.addMonths(d, 12); noteJ(s, st, "Entretien annuel jamais tenu."); }
    }
  }

  // =================================================================== PAIE (le 1er du mois, après les charges du cabinet)
  CR.coutMensuel = function (st) {
    const R = CR.ROLES[st.role];
    if (R.statut === "salarie") return Math.round(st.salary * (1 + CH("charges")));
    if (R.statut === "stage") return Math.round(st.salary + Math.max(0, st.salary - CH("gratifSeuil")) * CH("charges"));
    return st.salary;
  };
  CR.coutEquipe = (s) => CR.sum((s.staff || []).filter((st) => !(st.depart && st.depart.fait)), CR.coutMensuel);
  function lignesPaie(st, prorata) {
    const R = CR.ROLES[st.role];
    const b = Math.round(st.salary * prorata);
    if (R.statut === "salarie") return [[`Salaire brut — ${st.name}`, b], [`Charges patronales — ${st.name}`, Math.round(b * CH("charges"))]];
    if (R.statut === "stage") { const ex = Math.max(0, b - Math.round(CH("gratifSeuil") * prorata)); return [[`Gratification de stage — ${st.name}`, b]].concat(ex ? [[`Charges sur la gratification au-delà du seuil — ${st.name}`, Math.round(ex * CH("charges"))]] : []); }
    return [[`Rétrocession d'honoraires — Me ${st.name} (HT)`, b]];
  }
  CR.equipePaie = function (s, d) {
    CR.equipe(s);
    const debut = CR.addMonths(d, -1);
    const room = () => s.cash + (s.decouvert.limit - s.decouvert.used);
    let total = 0;
    for (const st of s.staff.slice()) {
      const jours = Math.max(0, d - Math.max(debut, st.arrive));
      const prorata = clamp(jours / Math.max(1, d - debut), 0, 1);
      const lignes = prorata > 0 ? lignesPaie(st, prorata) : [];
      if (st.arrieres) lignes.unshift([`Rappel de rémunération impayée — ${st.name}`, st.arrieres]);
      const du = CR.sum(lignes, (l) => l[1]);
      if (!du) continue;
      if (room() >= du) {
        for (const [label, m] of lignes) if (m > 0) { CR.payOut(s, m, label); total += m; }
        st.arrieres = 0;
        st.retards = 0;
      } else {
        st.arrieres = du;
        st.retards = (st.retards || 0) + 1;
        st.morale = clamp(st.morale - 15, 0, 100);
        noteJ(s, st, "Paie en retard.");
        CR.mail(s, { from: st.name, subject: "Ma paie n'est pas arrivée", kind: "email", important: true, body: [[`Ma ${CR.ROLES[st.role].statut === "liberal" ? "rétrocession" : "paie"} du mois n'a pas été versée. J'ai un loyer à payer.`]] });
        if (st.retards >= 2 && !st.depart) {
          if (CR.ROLES[st.role].statut === "liberal") CR.plainteBatonnier(s, null, "collaboration", 3, `Votre collaborateur ${st.name} saisit le bâtonnier : deux rétrocessions impayées.`);
          else { CR.payOut(s, Math.round(st.salary), `Prud'hommes — indemnité transactionnelle, ${st.name}`); }
          CR.depart(s, st, "rupture après des paies impayées", { immediat: true });
          CR.payOut(s, st.arrieres, `Arriérés de rémunération — ${st.name}`);
        }
      }
    }
    s.team.dernierePaie = { day: d, total };
    return total;
  };

  // =================================================================== PERMANENCES CONFIÉES
  const duty0 = CR.GLOBAL_FN.dutyCall;
  CR.GLOBAL_FN.dutyCall = function (s, d) {
    const type = d.kind === "ci" ? ["ci"] : d.night ? ["gav_nuit"] : ["gav_jour"];
    const jourDuty = d.night ? (d.day != null ? d.day - 1 : s.day - 1) : d.day != null ? d.day : s.day;
    const du = (s.duty || []).find((x) => x.delegue && type.includes(x.type) && x.day === jourDuty);
    const st = du && s.staff.find((x) => x.id === du.delegue && !(x.depart && x.depart.fait));
    if (!st) return duty0(s, d);
    const t = (s.team.taches || []).find((x) => x.type === "permanence" && x.staffId === st.id && x.ref.day === du.day && x.ref.dtype === du.type);
    const q = CR.qualiteTache(s, st, "permanence", null);
    const err = TR.chance(s, pErreur(q)) ? "accueil" : null;
    if (CR.ajMission) CR.ajMission(s, null, d.kind === "ci" ? "ci" : "gav", `assurée par ${st.name}`);
    st.exp[d.kind === "ci" ? "ci" : "gav"] = Math.min(95, (st.exp[d.kind === "ci" ? "ci" : "gav"] || 0) + 2);
    st.vu.exp.gav = true;
    const quoi = TR.pick(s, ["un vol à l'étalage", "des violences sur conjoint", "un refus d'obtempérer", "une détention de stupéfiants", "un outrage", "un vol avec effraction"]);
    const txt = err ? `Permanence : ${st.name} a assisté un gardé à vue pour ${quoi}. L'entretien a été bâclé ; le gardé à vue s'en plaint.` : `Permanence : ${st.name} a assisté un ${d.kind === "ci" ? "prévenu en comparution immédiate" : "gardé à vue"} pour ${quoi}. Attestation de fin de mission transmise.`;
    if (err) { CR.rep(s, "confreres", -1, "une permanence bâclée"); st.erreurs++; }
    CR.mail(s, { from: st.name, subject: "Permanence", kind: "note", body: [[txt]] });
    if (t) { t.resultat = (t.resultat ? t.resultat + " " : "") + txt; t.etat = "fait"; t.fin = s.day; if (err) t.erreur = { type: "accueil", texte: ERREURS.accueil, rattrapee: false }; }
    st.taches++;
    noteJ(s, st, "Intervention de permanence.");
  };
  CR.permanencesConfiables = (s) => (s.duty || []).filter((x) => x.day > s.day && !x.delegue);

  // =================================================================== RACCORDS AVEC LE RESTE DU JEU
  // Le collaborateur peut substituer quand deux audiences se chevauchent
  const chev0 = CR.chevauchementTasks;
  CR.chevauchementTasks = function (s, cs, T) {
    chev0(s, cs, T);
    const ch = s.chevauchement;
    if (!ch || ch.solution || !s.staff) return;
    for (const h of cs.hearings) {
      if (!h.conflit || h.attended || h.missed || h.canceled || h.day < s.day || h.substitue) continue;
      const col = s.staff.find((st) => st.role === "collaborateur" && CR.present(s, st, h.day) && !st.depart);
      if (!col) continue;
      T({ id: "subst_collab_" + h.id, label: `Envoyer ${col.name} à l'audience`, sub: `Votre collaborat${col.g === "f" ? "rice" : "eur"} répond à l'appel de l'affaire et la fait retenir jusqu'à votre arrivée. Sans frais.`, kind: "call", time: 5, urgent: h.day - s.day <= 3, run: () => { CR.confier(s, cs, col.id, { type: "substitution", label: `Substitution : ${h.title}`, ref: { hid: h.id }, jour: h.day }); if (CR.finChevauchement) CR.finChevauchement(s, "collaborateur"); return null; } });
    }
  };
  // Conflits d'intérêts : la clientèle personnelle des collaborateurs compte aussi
  const conf0 = CR.conflictCheck;
  CR.conflictCheck = function (s, cs) {
    const res = conf0(s, cs);
    const def = CR.caseDef(cs);
    const names = res.searched || [];
    for (const st of s.staff || []) for (const c of st.clientele || []) for (const nm of names) if (nm && c.nom && c.nom.toLowerCase().includes(nm.toLowerCase().split(" ").pop())) res.hits.push({ name: nm, caseId: null, title: `client personnel de ${st.name}` });
    if (res.hits.length) cs.flags.conflictFound = true;
    return res;
  };
  // Un projet d'acte préparé par l'équipe réduit le temps de rédaction ; non relu et fautif, l'erreur passe dans l'acte
  const file0 = CR.fileDraft;
  CR.fileDraft = function (s, cs, key, filled, checks, opts = {}) {
    const pr = cs.projets && cs.projets[key];
    if (!pr) return file0(s, cs, key, filled, checks, opts);
    const tpl = CR.getTpl(s, cs, key);
    const t0 = tpl.time;
    tpl.time = Math.max(10, Math.round((t0 || 60) * 0.4));
    let res;
    try { res = file0(s, cs, key, filled, checks, opts); } finally { tpl.time = t0; }
    delete cs.projets[key];
    if (pr.defaut) {
      CR.erreur(s, cs, { id: "projet_" + key, texte: `${tpl.title} : repris tel quel du projet de ${pr.nom}, avec un article mal visé et une date inexacte.`, sanction: "L'acte porte votre signature ; l'erreur est la vôtre.", regul: "Relire les projets avant de les signer." });
      CR.rep(s, "siege", -1, "un acte mal relu");
    }
    return res;
  };

  // =================================================================== LA JOURNÉE ET LE MOIS
  CR.equipeJour = function (s, d) {
    if (!s.staff || (!s.staff.length && !(s.team && (s.team.candidats || []).length))) return;
    const q = CR.equipe(s);
    // candidatures : départs vers la concurrence
    for (const c of q.candidats) {
      if (["parti", "embauche", "ecarte"].includes(c.etat) || c.arrive > d) continue;
      if (d > c.expire) {
        c.etat = "parti";
        c.raison = c.autreOffre ? "a accepté une offre chez un concurrent" : "a retiré sa candidature";
        if (c.entretien || c.lu) CR.mail(s, { from: `${c.prenom} ${c.nom}`, subject: "Ma candidature", kind: "email", body: [[c.autreOffre ? "Sans réponse de votre part, j'ai accepté une autre proposition. Merci pour l'entretien." : "Je retire ma candidature. Bonne continuation."]] });
      }
    }
    if (q.candidats.length > 80) q.candidats = q.candidats.filter((c) => !["parti", "ecarte"].includes(c.etat) || d - c.arrive < 60);
    if (s.team.ancienStagiaire && d > s.team.ancienStagiaire.jusqua) s.team.ancienStagiaire = null;
    departsEtSemaine(s, d);
    travailler(s, d);
    rappels(s, d);
  };
  CR.equipeMois = function (s, d) {
    if (!s.staff || !s.staff.length) return;
    CR.equipe(s);
    deontoMois(s, d);
  };
  // Proposer une collaboration à l'élève dont le stage vient de finir
  CR.proposerCollaboration = function (s) {
    const a = s.team && s.team.ancienStagiaire;
    if (!a) return null;
    const st = { id: CR.uid("p"), role: "collaborateur", prenom: a.prenom, nom: a.nomF, g: a.g, age: null, seed: a.seed, parcours: Object.assign({}, a.parcours, { crfpa: a.parcours.crfpa, ecoleFin: CR.ymd(s.day).y }), exp: a.exp, perso: a.perso, cv: a.cv, indices: a.indices || {}, hired: s.day };
    st.vu = { traits: Object.fromEntries(CR.TRAITS.map(([k]) => [k, "confirme"])), exp: Object.fromEntries(CR.EXP.map(([k]) => [k, true])) };
    initEmploye(s, st, { arrive: CR.rollForward(s.day + 1), temps: 1, salary: CH("retroMin") });
    st.essaiFin = null;
    st.morale = 80;
    s.staff.push(st);
    s.team.ancienStagiaire = null;
    CR.spend(s, 20, "meet");
    CR.log(s, `${st.name}, votre ancien${st.g === "f" ? "ne" : ""} stagiaire, devient collaborat${st.g === "f" ? "rice" : "eur"} du cabinet.`, "good");
    return st;
  };

  // Anciennes sauvegardes : employés existants complétés au chargement
  const des0 = CR.deserialize;
  CR.deserialize = function (json) {
    const s = des0(json);
    if (s.staff && s.staff.length) CR.equipe(s);
    return s;
  };
})();
