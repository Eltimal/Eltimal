/* La Permanence — le monde du générateur : personnes, lieux, entourage, et le contexte de récit (X) que lisent les fiches du catalogue.
   Tout est tiré à partir d'une graine : la même affaire se reconstruit à l'identique au chargement d'une sauvegarde. */
(function () {
  const CR = window.CR;
  const CAT = CR.CAT;
  const M = (CR.MONDE = {});
  const pk = (r, a) => a[Math.floor(r() * a.length)];
  const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));

  M.PM = ["Mehdi", "Kevin", "Julien", "Moussa", "Thomas", "Bilal", "Nicolas", "Ibrahima", "Florian", "Sofiane", "Damien", "Alexandre", "Yacine", "Maxime", "Samir", "Loïc", "Adama", "Romain", "Anis", "Quentin", "Mamadou", "Hugo", "Karim", "Lucas", "Ousmane", "Théo", "Rayan", "Antoine", "Wassim", "Cédric", "Jonathan", "Brahim", "Arnaud", "Steeve", "Cheikh", "Mathieu", "Ilyes", "Jérôme", "Dylan", "Patrick", "Abdel", "Grégory", "Souleymane", "Vincent", "Nordine", "Franck", "Issa", "Baptiste", "Malik", "Jean-Marc"];
  M.PF = ["Inès", "Laura", "Fatou", "Camille", "Sarah", "Amel", "Julie", "Aïcha", "Manon", "Léa", "Nadia", "Océane", "Kenza", "Marine", "Assia", "Pauline", "Mariam", "Chloé", "Yasmina", "Émilie", "Aminata", "Sabrina", "Clara", "Leïla", "Sandrine", "Dounia", "Mélissa", "Hawa", "Nathalie", "Samia", "Jessica", "Awa", "Céline", "Rokia", "Margaux", "Sonia"];
  M.NOMS = ["Bensaïd", "Martin", "Diarra", "Lefebvre", "Haddad", "Moreau", "Traoré", "Girard", "Mansouri", "Petit", "Camara", "Roux", "Belkacem", "Fournel", "Sissoko", "Garnier", "Amrani", "Lambert", "Koné", "Dubois", "Chérif", "Bonnet", "Fofana", "Lemoine", "Benali", "Mercier", "Ndiaye", "Faure", "Bouaziz", "Rousseau", "Keita", "Blanc", "Zerrouki", "Guérin", "Cissé", "Morel", "Hamidi", "Leroy", "Touré", "Perrin", "Saïdi", "Chevalier", "Coulibaly", "Robin", "Aït-Ali", "Masson", "Diallo", "Henry", "Ouattara", "Gauthier", "Messaoudi", "Nicolas", "Bah", "Durand", "Kaci", "Lopez", "Dembélé", "Fontaine", "Rahmani", "Pereira", "Nguyen", "Da Silva", "Ferreira", "Cohen", "Popescu", "Kowalski", "Ben Youssef", "Barry", "Mendy", "Vidal"];
  M.METIERS = [["livreur", true], ["serveur", true], ["agent d'entretien", true], ["étudiant", false], ["sans emploi", false], ["préparateur de commandes", true], ["vendeur", true], ["chauffeur VTC", true], ["intérimaire dans le bâtiment", true], ["sans emploi", false], ["aide-soignant", true], ["cuisinier", true], ["agent de sécurité", true], ["maçon", true], ["coiffeur", true], ["caissier", true], ["magasinier", true], ["électricien", true], ["chauffeur-livreur", true], ["plombier", true], ["comptable", true], ["commercial", true], ["infirmier", true], ["professeur des écoles", true], ["développeur informatique", true], ["auto-entrepreneur", true], ["bénéficiaire du RSA", false], ["retraité", false], ["lycéen en alternance", true], ["boulanger", true]];
  M.METIERS_F = { "directeur juridique": "directrice juridique", "directeur administratif et financier": "directrice administrative et financière", "président de société": "présidente de société", "ouvrier du bâtiment": "ouvrière du bâtiment", "opérateur sur presse": "opératrice sur presse", "canalisateur": "canalisatrice", "collégien": "collégienne", "lycéen": "lycéenne", "lycéen en CAP": "lycéenne en CAP", "apprenti": "apprentie", "écolier": "écolière", "livreur": "livreuse", "serveur": "serveuse", "vendeur": "vendeuse", "étudiant": "étudiante", "préparateur de commandes": "préparatrice de commandes", "cuisinier": "cuisinière", "caissier": "caissière", "aide-soignant": "aide-soignante", "coiffeur": "coiffeuse", "infirmier": "infirmière", "commercial": "commerciale", "retraité": "retraitée", "boulanger": "boulangère", "magasinier": "magasinière", "chauffeur-livreur": "chauffeuse-livreuse", "électricien": "électricienne", "plombier": "plombière", "développeur informatique": "développeuse informatique", "intérimaire dans le bâtiment": "intérimaire dans le bâtiment", "lycéen en alternance": "lycéenne en alternance" };
  // Un métier imposé par l'affaire (« étudiant », « docker ») : en emploi, sauf les situations sans travail
  M.enEmploi = (m) => { const e = M.METIERS.find((x) => x[0] === m); return e ? e[1] : !/^(étudiant|lycéen|collégien|écolier|retraité|sans emploi|bénéficiaire)/.test(m || ""); };

  // ------------------------------------------------------------------ La situation d'une personne, et ce qu'elle peut en dire
  // salarie, independant (à son compte), etudiant, scolaire (collège, lycée), retraite, rsa, chomage.
  // Tout ce qu'une personne dit de son travail, de son permis ou de son casier passe par ici : ses paroles suivent sa fiche.
  const INDEP = /auto-entrepreneu|chauffeur VTC|gérant|gérante|commerçant|consultant|entrepreneu|artisan|promoteur|restaurateur|propriétaire bailleur|fournisseur|coiffeu|chef d'entreprise|cheffe d'entreprise|architecte|médecin généraliste|kinésithérapeute|notaire|dentiste|pharmacien|expert-comptable|experte-comptable|agent immobilier|agente immobilière/;
  const VOLANT = /livreu|chauffeu|VTC|commercia|plombi|électricien|maçon|bâtiment|aide-soignant|infirmi|artisan|conducteur de travaux|auto-entrepreneu|fournisseur|entreprise de sous-traitance|entrepreneu|promoteur|acheteu|conducteur de bus|conductrice de bus|technicien de maintenance|technicienne de maintenance|agent immobilier|agente immobilière|kinésithérapeute|médecin généraliste/;
  M.situ = function (P) {
    const m = (P && P.metier) || "";
    if (/^sans emploi/.test(m)) return "chomage";
    if (/^(collégien|lycéen|écolier)/.test(m) && !(P && P.emploi)) return "scolaire";
    if (/^étudiant/.test(m)) return "etudiant";
    if (/^retraité/.test(m)) return "retraite";
    if (/RSA/.test(m)) return "rsa";
    if (!(P && P.emploi)) return "chomage";
    return INDEP.test(m) ? "independant" : "salarie";
  };
  M.travaille = (P) => ["salarie", "independant"].includes(M.situ(P));
  M.auVolant = (P) => M.travaille(P) && VOLANT.test(P.metier || "");
  // Ce qui inquiète une personne qui risque une suspension de permis : sa réponse, et l'argument que l'avocat en tire
  M.enjeuPermis = function (P) {
    const m = P.metier, f = P.g === "f", il = f ? "elle" : "il", Il = f ? "Elle" : "Il", e = f ? "e" : "";
    const C = m ? m[0].toUpperCase() + m.slice(1) : m;
    switch (M.situ(P)) {
      case "salarie": case "independant":
        if (M.auVolant(P)) return {
          dit: [`Le permis. Je suis ${m} : sans permis, je perds mon travail.`, `Mon permis. Sans permis, je ne travaille plus. Je suis ${m}, vous comprenez.`],
          audition: "Oui. Sans permis, je perds mon travail.", oui: true,
          label: `Sans permis, ${il} perd son ${M.situ(P) === "independant" ? "activité" : "emploi"}`,
          say: `${C} : sans permis, ${il} perd son ${M.situ(P) === "independant" ? "activité" : "emploi"}. Une suspension courte suffirait.` };
        return {
          dit: [`Le permis. Je suis ${m}, je commence tôt, et à ces heures-là il n'y a pas de transports. Sans voiture, je ne peux plus aller travailler.`, `Mon permis. Je travaille en horaires décalés, je suis ${m}. Sans voiture, je ne peux plus y aller.`],
          audition: "Pour y aller, oui. Je commence tôt, il n'y a pas de transports à ces heures-là.", oui: true,
          label: `Sans permis, ${il} ne peut plus se rendre au travail`,
          say: `${C}, ${il} travaille en horaires décalés : sans voiture, ${il} ne peut plus s'y rendre. Une suspension courte suffirait.` };
      case "chomage": case "rsa":
        return {
          dit: ["Le permis. Je cherche du travail, et toutes les offres demandent le permis B. Sans permis, je ne retrouverai rien.", "Mon permis. Je suis sans travail ; les annonces, c'est « permis B exigé ». Sans permis, c'est fini."],
          audition: "Je n'ai pas de travail en ce moment. Mais sans permis, je n'en retrouverai pas.", oui: false,
          label: `Sans permis, ${il} ne retrouvera pas d'emploi`,
          say: `${Il} cherche du travail, et les offres qu'${il} vise exigent le permis : une longue suspension l'éloignerait de l'emploi. Une suspension courte suffirait.` };
      case "etudiant":
        return {
          dit: [`Le permis. Je suis ${m}, j'ai un stage en banlieue, je ne peux y aller qu'en voiture.`, `Mon permis. Je l'ai eu il n'y a pas longtemps. Et j'en ai besoin pour mon stage, en banlieue.`],
          audition: "Je suis étudiant" + e + ". Pour mon stage, oui.", oui: false,
          label: `Sans permis, ${il} perd son stage`,
          say: `${Il} est ${m} : sans voiture, ${il} ne peut pas rejoindre son stage. Une suspension courte suffirait.` };
      case "retraite":
        return {
          dit: [`Mon permis. Je suis ${m}. Sans voiture, je ne vois plus personne : ma famille est loin, et pour le médecin, les courses, il me faut la voiture.`, `Le permis. À mon âge, sans voiture, je suis coincé${e} chez moi.`],
          audition: "Je suis retraité" + e + ". Mais sans voiture, je suis coincé" + e + " chez moi.", oui: false,
          label: `Sans voiture, ${il} se retrouve isolé${e}`,
          say: `${C}, ${il} a besoin de sa voiture pour ses soins et ses courses : sans permis, ${il} se retrouve isolé${e}. Une suspension courte suffirait.` };
      default:
        return { dit: ["Le permis. Je venais de l'avoir.", "Mon permis. J'en ai besoin pour mon apprentissage."], audition: "Non.", oui: false, label: `Le permis, à peine obtenu`, say: `${Il} venait d'obtenir son permis. Une suspension courte suffirait.` };
    }
  };
  // Ce qui inquiète une personne qui risque une inscription au casier
  M.enjeuCasier = function (P) {
    const m = P.metier, e = P.g === "f" ? "e" : "";
    switch (M.situ(P)) {
      case "salarie": case "independant":
        if (/sécurité/.test(m)) return { dit: [`Le casier. Je suis ${m} : avec une condamnation, on peut me retirer ma carte professionnelle.`, "Le casier. Dans la sécurité, ils regardent le bulletin n° 2 : je peux perdre ma carte."] };
        return { dit: [`Le casier. Je suis ${m}, je ne veux pas que ça me suive.`, "Le casier judiciaire. J'ai un travail, je ne veux pas que ça me retombe dessus."] };
      case "chomage": case "rsa": return { dit: ["Le casier. Je postule dans la sécurité.", "Le casier judiciaire. Je cherche un poste dans la sécurité, ils demandent le bulletin."] };
      case "etudiant": return { dit: ["Le casier. Je veux passer des concours, ils vérifient le casier.", "Le casier judiciaire. Pour les concours de la fonction publique, ils demandent le bulletin."] };
      case "retraite": return { dit: P.casier ? ["La honte, surtout. À mon âge.", "Le casier. À mon âge, encore une condamnation…"] : [`Le casier. J'ai ${P.age} ans, je n'ai jamais eu affaire à la justice.`, "La honte. À mon âge, une condamnation…"] };
      default: return { dit: ["Le casier. Je ne veux pas que ça me suive.", "Le casier judiciaire. Pour plus tard."] };
    }
  };
  // Depuis combien d'années remonte une ancienne condamnation (sans récidive) : jamais avant la majorité.
  // Le bulletin n° 1 tire un nombre d'années ; une personne jeune n'a pu être condamnée qu'après ses dix-huit ans.
  // Une personne de moins de dix-neuf ans n'a pu être condamnée que mineure : devant le tribunal pour enfants.
  M.ansCasier = (P, tire) => { const age = P.age || 40; return age < 19 ? (age - 13 > 1 ? 2 : 1) : Math.max(1, Math.min(tire, age - 18)); };
  M.casierMineur = (P) => (P.age || 40) < 19;
  // Ce que la personne en dit : « il y a longtemps » seulement si c'est vrai
  M.casierAncien = function (P) {
    const ans = M.ansCasier(P, 99);
    if (ans >= 7) return null;
    return ans <= 1 ? "l'an dernier" : `il y a ${["", "un", "deux", "trois", "quatre", "cinq", "six"][ans]} ans`;
  };
  M.RUES = ["rue Marcadet", "rue Ordener", "boulevard Barbès", "rue de Clignancourt", "rue Championnet", "rue Myrha", "rue Doudeauville", "rue Ramey", "rue Custine", "rue Labat", "rue Poulet", "rue des Poissonniers", "rue Léon", "rue Polonceau", "rue de la Goutte-d'Or", "rue Stephenson", "rue Marx-Dormoy", "rue Riquet", "rue Philippe-de-Girard", "rue Pajol", "rue Belliard", "rue Letort", "rue Duhesme", "rue Damrémont", "rue Caulaincourt", "rue Lepic", "rue des Abbesses", "rue Muller", "rue Ernestine", "rue Simplon", "rue du Poteau", "rue Hermel", "rue Versigny", "rue Lamarck", "avenue de Saint-Ouen", "rue Boinod", "rue Leibniz", "rue Vauvenargues", "rue Félix-Ziem", "rue Joseph-Dijon"];
  M.VILLES = ["Paris", "Saint-Denis", "Bobigny", "Créteil", "Argenteuil", "Bamako", "Alger", "Lille", "Marseille", "Lyon", "Dakar", "Casablanca", "Tunis", "Montreuil", "Aubervilliers", "Sarcelles", "Rouen", "Bucarest", "Kinshasa", "Abidjan", "Nanterre", "Pontoise", "Évry", "Oran", "Lisbonne", "Varsovie", "Hô Chi Minh-Ville"];
  M.MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  M.ENTOURAGE = ["sa mère", "sa sœur", "sa tante", "son frère", "son père", "sa compagne", "son compagnon", "sa grand-mère", "un cousin", "son oncle"];
  M.LANGUES = ["roumanophone", "anglophone, de nationalité ghanéenne", "arabophone, de nationalité égyptienne", "tamoulophone, de nationalité sri-lankaise", "lusophone, de nationalité brésilienne", "pachtounophone, de nationalité afghane", "sinophone, de nationalité chinoise", "géorgianophone"];

  // ------------------------------------------------------------------ Phase 3 : le Paris des affaires
  // Secteurs : les vingt arrondissements et des communes de la petite couronne. Rues réelles ; commissariats et compétences
  // territoriales « à revérifier ». mil : part des milieux populaire, intermédiaire, aisé ; w : fréquence relative des affaires.
  // Le tribunal compétent est celui du lieu des faits (art. 382 CPP, qui retient aussi la résidence du prévenu et le lieu de son arrestation) ; la permanence pénale d'un avocat au
  // barreau de Paris ne couvre que Paris : gardes à vue et comparutions immédiates restent à Paris.
  const SECT = [
    ["p1", "Paris 1er", "75001", 2, [2.3410, 48.8625], "centre", [0.15, 0.45, 0.4], ["rue de Rivoli", "rue Saint-Denis", "rue Berger", "rue du Pont-Neuf", "rue Montmartre", "rue Saint-Honoré"]],
    ["p2", "Paris 2e", "75002", 1.5, [2.3445, 48.8685], "centre", [0.15, 0.5, 0.35], ["rue Réaumur", "rue du Sentier", "rue Montorgueil", "rue de Cléry", "boulevard Bonne-Nouvelle"]],
    ["p3", "Paris 3e", "75003", 1.5, [2.3610, 48.8630], "centre", [0.15, 0.45, 0.4], ["rue de Bretagne", "rue Beaubourg", "rue du Temple", "rue de Turbigo", "rue Charlot"]],
    ["p4", "Paris 4e", "75004", 1.5, [2.3560, 48.8545], "centre", [0.1, 0.4, 0.5], ["rue Saint-Antoine", "rue des Rosiers", "rue de la Verrerie", "quai de l'Hôtel-de-Ville", "rue du Renard"]],
    ["p5", "Paris 5e", "75005", 2, [2.3500, 48.8450], "5e", [0.1, 0.45, 0.45], ["rue Mouffetard", "boulevard Saint-Michel", "rue Monge", "rue Gay-Lussac", "rue des Écoles"]],
    ["p6", "Paris 6e", "75006", 1.5, [2.3330, 48.8490], "6e", [0.05, 0.35, 0.6], ["rue de Rennes", "boulevard Saint-Germain", "rue de Seine", "rue du Four", "rue de Vaugirard"]],
    ["p7", "Paris 7e", "75007", 1.5, [2.3120, 48.8560], "7e", [0.05, 0.3, 0.65], ["rue Cler", "avenue Bosquet", "rue de Grenelle", "rue du Bac", "avenue de La Motte-Picquet"]],
    ["p8", "Paris 8e", "75008", 3, [2.3120, 48.8730], "8e", [0.05, 0.35, 0.6], ["rue du Faubourg-Saint-Honoré", "avenue des Champs-Élysées", "rue La Boétie", "boulevard Haussmann", "rue de Rome"]],
    ["p9", "Paris 9e", "75009", 3, [2.3380, 48.8770], "9e", [0.15, 0.5, 0.35], ["rue des Martyrs", "rue de Clichy", "rue La Fayette", "rue du Faubourg-Montmartre", "rue Saint-Lazare"]],
    ["p10", "Paris 10e", "75010", 6, [2.3610, 48.8760], "10e", [0.4, 0.45, 0.15], ["rue du Faubourg-Saint-Denis", "boulevard de Magenta", "rue de Château-Landon", "rue des Vinaigriers", "rue Louis-Blanc", "quai de Valmy"]],
    ["p11", "Paris 11e", "75011", 6, [2.3800, 48.8590], "11e", [0.25, 0.5, 0.25], ["rue Oberkampf", "boulevard Voltaire", "rue de la Roquette", "rue du Faubourg-Saint-Antoine", "rue Saint-Maur", "rue Jean-Pierre-Timbaud"]],
    ["p12", "Paris 12e", "75012", 4, [2.3920, 48.8400], "12e", [0.2, 0.55, 0.25], ["avenue Daumesnil", "rue de Charenton", "boulevard Diderot", "rue de Picpus", "avenue du Général-Michel-Bizot"]],
    ["p13", "Paris 13e", "75013", 6, [2.3620, 48.8280], "13e", [0.35, 0.45, 0.2], ["avenue d'Italie", "boulevard Vincent-Auriol", "rue de Tolbiac", "avenue de Choisy", "rue Nationale", "rue du Château-des-Rentiers"]],
    ["p14", "Paris 14e", "75014", 4, [2.3270, 48.8290], "14e", [0.2, 0.5, 0.3], ["avenue du Maine", "rue d'Alésia", "rue Raymond-Losserand", "avenue du Général-Leclerc", "rue de la Gaîté", "rue Didot"]],
    ["p15", "Paris 15e", "75015", 5, [2.2990, 48.8400], "15e", [0.15, 0.5, 0.35], ["rue de Vaugirard", "rue de la Convention", "rue du Commerce", "rue Lecourbe", "boulevard de Grenelle"]],
    ["p16", "Paris 16e", "75016", 3, [2.2720, 48.8600], "16e", [0.05, 0.25, 0.7], ["avenue Mozart", "rue de Passy", "avenue Victor-Hugo", "rue de la Pompe", "avenue de Versailles"]],
    ["p17", "Paris 17e", "75017", 5, [2.3070, 48.8870], "17e", [0.2, 0.45, 0.35], ["avenue de Clichy", "rue des Moines", "boulevard Malesherbes", "avenue de Wagram", "rue de Lévis", "boulevard Bessières"]],
    ["p18", "Paris 18e", "75018", 9, [2.3480, 48.8920], "18e", [0.45, 0.4, 0.15], null],
    ["p19", "Paris 19e", "75019", 8, [2.3850, 48.8870], "19e", [0.5, 0.4, 0.1], ["avenue de Flandre", "rue de Crimée", "avenue Jean-Jaurès", "rue de Belleville", "rue Manin", "rue de Meaux", "rue de Tanger"]],
    ["p20", "Paris 20e", "75020", 7, [2.4010, 48.8640], "20e", [0.45, 0.42, 0.13], ["rue des Pyrénées", "rue de Ménilmontant", "boulevard de Belleville", "rue d'Avron", "rue de Bagnolet", "rue des Orteaux"]],
    // Seine-Saint-Denis (tribunal judiciaire de Bobigny)
    ["c_stdenis", "Saint-Denis", "93200", 6, [2.3580, 48.9360], "93", [0.7, 0.25, 0.05], ["rue de la République", "boulevard Anatole-France", "rue Gabriel-Péri", "avenue du Président-Wilson", "rue du Landy"]],
    ["c_montreuil", "Montreuil", "93100", 4, [2.4430, 48.8610], "93", [0.4, 0.45, 0.15], ["rue de Paris", "boulevard Rouget-de-Lisle", "rue de Rosny", "avenue de la Résistance", "rue Marceau"]],
    ["c_aubervilliers", "Aubervilliers", "93300", 4, [2.3830, 48.9140], "93", [0.75, 0.22, 0.03], ["avenue Jean-Jaurès", "rue du Moutier", "boulevard Félix-Faure", "rue de la Courneuve"]],
    ["c_bobigny", "Bobigny", "93000", 3, [2.4400, 48.9080], "93", [0.65, 0.3, 0.05], ["avenue Paul-Vaillant-Couturier", "rue de l'Union", "avenue Jean-Jaurès", "rue Édouard-Vaillant"]],
    ["c_pantin", "Pantin", "93500", 2, [2.4040, 48.8940], "93", [0.45, 0.4, 0.15], ["avenue Jean-Lolive", "rue Hoche", "quai de l'Aisne", "rue Delizy"]],
    ["c_stouen", "Saint-Ouen-sur-Seine", "93400", 3, [2.3330, 48.9120], "93", [0.45, 0.4, 0.15], ["avenue Gabriel-Péri", "rue des Rosiers", "boulevard Victor-Hugo", "rue Saint-Denis"]],
    ["c_clichysb", "Clichy-sous-Bois", "93390", 2, [2.5460, 48.9100], "93", [0.85, 0.13, 0.02], ["allée de Gagny", "boulevard Émile-Zola", "avenue de Sévigné"]],
    ["c_aulnay", "Aulnay-sous-Bois", "93600", 3, [2.4970, 48.9380], "93", [0.55, 0.35, 0.1], ["boulevard de Strasbourg", "rue Jacques-Duclos", "avenue Anatole-France"]],
    ["c_noisy", "Noisy-le-Grand", "93160", 2, [2.5530, 48.8480], "93", [0.4, 0.45, 0.15], ["boulevard du Mont-d'Est", "rue Pierre-Brossolette", "avenue Émile-Cossonneau"]],
    // Val-de-Marne (tribunal judiciaire de Créteil)
    ["c_creteil", "Créteil", "94000", 4, [2.4550, 48.7900], "94", [0.4, 0.45, 0.15], ["avenue du Général-de-Gaulle", "rue de Mesly", "avenue Laferrière", "rue de Paris"]],
    ["c_vitry", "Vitry-sur-Seine", "94400", 4, [2.3920, 48.7870], "94", [0.6, 0.35, 0.05], ["avenue Rouget-de-Lisle", "rue Camille-Groult", "avenue Paul-Vaillant-Couturier", "rue Pasteur"]],
    ["c_ivry", "Ivry-sur-Seine", "94200", 3, [2.3850, 48.8130], "94", [0.55, 0.38, 0.07], ["rue Marat", "avenue Georges-Gosnat", "boulevard de Brandebourg", "rue Ledru-Rollin"]],
    ["c_champigny", "Champigny-sur-Marne", "94500", 3, [2.5150, 48.8170], "94", [0.55, 0.38, 0.07], ["avenue Roger-Salengro", "rue Jean-Jaurès", "boulevard de Stalingrad"]],
    ["c_vincennes", "Vincennes", "94300", 2, [2.4390, 48.8470], "94", [0.1, 0.45, 0.45], ["rue de Fontenay", "avenue de Paris", "rue du Midi", "rue de Montreuil"]],
    ["c_stmaur", "Saint-Maur-des-Fossés", "94100", 2, [2.4850, 48.7990], "94", [0.1, 0.4, 0.5], ["avenue de la République", "boulevard de Créteil", "rue Saint-Hilaire"]],
    ["c_villejuif", "Villejuif", "94800", 2, [2.3640, 48.7920], "94", [0.5, 0.4, 0.1], ["avenue de Paris", "boulevard Maxime-Gorki", "rue Jean-Jaurès"]],
    ["c_maisons", "Maisons-Alfort", "94700", 2, [2.4380, 48.8050], "94", [0.25, 0.55, 0.2], ["avenue du Général-Leclerc", "rue Jean-Jaurès", "avenue de la République"]],
    // Hauts-de-Seine (tribunal judiciaire de Nanterre)
    ["c_nanterre", "Nanterre", "92000", 4, [2.2070, 48.8920], "92", [0.5, 0.4, 0.1], ["avenue Pablo-Picasso", "avenue Joliot-Curie", "rue Maurice-Thorez", "boulevard du Général-Leclerc"]],
    ["c_boulogne", "Boulogne-Billancourt", "92100", 3, [2.2400, 48.8350], "92", [0.08, 0.42, 0.5], ["route de la Reine", "boulevard Jean-Jaurès", "rue de Silly", "avenue Édouard-Vaillant"]],
    ["c_neuilly", "Neuilly-sur-Seine", "92200", 1.5, [2.2690, 48.8850], "92", [0.03, 0.22, 0.75], ["avenue Charles-de-Gaulle", "boulevard Victor-Hugo", "rue de Chartres"]],
    ["c_colombes", "Colombes", "92700", 3, [2.2540, 48.9230], "92", [0.4, 0.45, 0.15], ["rue Saint-Denis", "boulevard Charles-de-Gaulle", "rue Gabriel-Péri"]],
    ["c_gennevilliers", "Gennevilliers", "92230", 3, [2.2930, 48.9330], "92", [0.7, 0.27, 0.03], ["avenue Gabriel-Péri", "rue Pierre-Timbaud", "avenue du Vieux-Chemin-de-Saint-Denis"]],
    ["c_clichy", "Clichy", "92110", 2, [2.3060, 48.9040], "92", [0.35, 0.45, 0.2], ["boulevard Jean-Jaurès", "rue Martre", "rue de Paris"]],
    ["c_levallois", "Levallois-Perret", "92300", 2, [2.2870, 48.8950], "92", [0.1, 0.45, 0.45], ["rue Anatole-France", "rue Voltaire", "rue Aristide-Briand"]],
    ["c_issy", "Issy-les-Moulineaux", "92130", 2, [2.2700, 48.8240], "92", [0.15, 0.5, 0.35], ["rue du Général-Leclerc", "boulevard Gallieni", "rue Ernest-Renan"]],
    ["c_courbevoie", "Courbevoie", "92400", 2, [2.2530, 48.8970], "92", [0.1, 0.5, 0.4], ["rue de Bezons", "boulevard de Verdun", "avenue Marceau"]],
  ];
  const ORD = (n) => (n === 1 ? "1er" : n + "e");
  M.SECTEURS = {};
  for (const [id, nom, cp, w, geo, cm, mil, rues] of SECT) {
    const paris = id[0] === "p";
    const dep = paris ? "75" : cm;
    const arr = paris ? ORD(+id.slice(1)) : null;
    const centre = cm === "centre";
    M.SECTEURS[id] = {
      id, nom, cp, w, geo, dep, paris, arr, mil, rues: rues || M.RUES,
      ville: paris ? "Paris" : nom,
      tj: { 75: "paris", 93: "bobigny", 94: "creteil", 92: "nanterre" }[dep],
      comm: paris ? (centre ? "Commissariat central de Paris Centre" : `Commissariat central du ${arr} arrondissement`) : `Commissariat de police de ${nom}`,
      commCourt: paris ? (centre ? "commissariat de Paris Centre" : `commissariat du ${arr}`) : `commissariat de ${nom}`,
      // le lieu de la garde à vue sur la carte : le commissariat du 18e existe déjà ; les autres s'ajoutent à la partie
      place: id === "p18" ? "commissariat" : "comm_" + id,
    };
  }
  M.secteur = (id) => M.SECTEURS[id] || M.SECTEURS.p18;
  // Le commissariat d'un secteur, comme lieu de la partie (garde à vue, audition libre) : celui du 18e existe déjà sur la carte
  M.placeComm = function (s, S) {
    if (!S || S.place === "commissariat") return "commissariat";
    if (s && CR.addTempPlace && !CR.placeOf(s, S.place)) {
      CR.addTempPlace(s, S.place, { nom: S.comm, sous: S.paris ? `${S.arr} arrondissement` : S.nom, type: "commissariat", scene: "commissariat", zone: S.paris ? "paris" : "couronne", geo: S.geo, x: 0.535 + (S.geo[0] - 2.3455) * 3.6, y: 0.505 - (S.geo[1] - 48.8556) * 4.8, temp: true, desc: "Gardes à vue, auditions libres, dépôts de plainte." });
    }
    return S.place;
  };
  // Les tribunaux judiciaires et ce qui en dépend (cour d'appel, cour d'assises, maison d'arrêt, unité médico-judiciaire)
  // Hauts-de-Seine : cour d'appel de Versailles. Tout est « à revérifier » (organisation judiciaire, établissements).
  const tj = (id, ville, dep, depLong, lieu, o) => Object.assign({
    id, ville, dep, depLong, lieu, paris: id === "paris",
    tj: `Tribunal judiciaire de ${ville}`, tc: `Tribunal correctionnel de ${ville}`, tp: `Tribunal de police de ${ville}`, tpe: `Tribunal pour enfants de ${ville}`,
    parquet: `Parquet de ${ville}`, procureur: `procureur de la République près le tribunal judiciaire de ${ville}`,
    sub: `Tribunal judiciaire · ${ville}`, ci: "chambre des comparutions immédiates",
    ca: "Cour d'appel de Paris", caLieu: "cite", caSub: "Île de la Cité",
    assises: `Cour d'assises ${depLong}`, ccd: `Cour criminelle départementale ${depLong}`,
  }, o || {});
  M.TJ = {
    paris: tj("paris", "Paris", "75", "de Paris", "palais", { sub: "Tribunal judiciaire · Batignolles", ci: "23e chambre (comparutions immédiates)", ma: "sante", umj: "Unité médico-judiciaire de l'Hôtel-Dieu", assises: "Cour d'assises de Paris", ccd: "Cour criminelle départementale de Paris" }),
    bobigny: tj("bobigny", "Bobigny", "93", "de la Seine-Saint-Denis", "tj_bobigny", { ma: "villepinte", umj: "Unité médico-judiciaire de Bondy (hôpital Jean-Verdier)" }),
    creteil: tj("creteil", "Créteil", "94", "du Val-de-Marne", "tj_creteil", { ma: "fresnes", umj: "Unité médico-judiciaire de Créteil" }),
    nanterre: tj("nanterre", "Nanterre", "92", "des Hauts-de-Seine", "tj_nanterre", { ma: "ma_nanterre", umj: "Unité médico-judiciaire de Garches (hôpital Raymond-Poincaré)", ca: "Cour d'appel de Versailles", caLieu: "ca_versailles", caSub: "Versailles" }),
  };
  // Le lieu d'une affaire générée : le secteur des faits (t.lieu.f) et le tribunal compétent. Une ancienne affaire n'a pas
  // de lieu : Paris 18e, comme avant. Le parquet national financier poursuit devant le tribunal de Paris.
  M.lieuxDe = function (t) {
    const L = (t && t.lieu) || {};
    const F = M.secteur(L.f || "p18");
    const T = M.TJ[t && t.pnf ? "paris" : F.tj] || M.TJ.paris;
    return { F, TJ: T, A: L.a ? M.secteur(L.a) : null, V: L.v ? M.secteur(L.v) : null, ancien: !L.f };
  };
  // Milieux : métiers, revenus et sommes en jeu suivent le quartier. Mêmes nombres de tirages que l'ancien tableau (un seul
  // tirage par métier) : la suite du hasard ne change pas.
  M.METIERS_MIL = {
    populaire: M.METIERS,
    mixte: [["infirmier", true], ["professeur des écoles", true], ["comptable", true], ["commercial", true], ["technicien de maintenance", true], ["secrétaire médical", true], ["agent administratif", true], ["conducteur de bus", true], ["chef de rayon", true], ["développeur informatique", true], ["aide-soignant", true], ["électricien", true], ["auto-entrepreneur", true], ["étudiant", false], ["retraité", false], ["sans emploi", false], ["gardien d'immeuble", true], ["boulanger", true], ["coiffeur", true], ["cuisinier", true], ["vendeur", true], ["plombier", true], ["artisan peintre", true], ["chauffeur VTC", true], ["assistant de direction", true], ["kinésithérapeute", true], ["bénéficiaire du RSA", false], ["serveur", true], ["caissier", true], ["agent de sécurité", true]],
    aise: [["cadre dans une banque", true], ["ingénieur", true], ["médecin généraliste", true], ["architecte", true], ["consultant", true], ["directeur commercial", true], ["pharmacien", true], ["chef d'entreprise", true], ["cadre dans l'assurance", true], ["journaliste", true], ["professeur de lycée", true], ["kinésithérapeute", true], ["notaire", true], ["dentiste", true], ["chef de projet", true], ["expert-comptable", true], ["directeur d'agence", true], ["étudiant", false], ["retraité", false], ["commerçant", true], ["gérant de société", true], ["développeur informatique", true], ["comptable", true], ["infirmier", true], ["agent immobilier", true], ["sans emploi", false], ["cadre dans la fonction publique", true], ["chef de projet", true], ["consultant", true], ["ingénieur", true]],
  };
  Object.assign(M.METIERS_F, { "technicien de maintenance": "technicienne de maintenance", "secrétaire médical": "secrétaire médicale", "agent administratif": "agente administrative", "conducteur de bus": "conductrice de bus", "chef de rayon": "cheffe de rayon", "gardien d'immeuble": "gardienne d'immeuble", "artisan peintre": "artisane peintre", "assistant de direction": "assistante de direction", "ingénieur": "ingénieure", "consultant": "consultante", "directeur commercial": "directrice commerciale", "pharmacien": "pharmacienne", "chef d'entreprise": "cheffe d'entreprise", "professeur de lycée": "professeure de lycée", "chef de projet": "cheffe de projet", "expert-comptable": "experte-comptable", "directeur d'agence": "directrice d'agence", "commerçant": "commerçante", "gérant de société": "gérante de société", "agent immobilier": "agente immobilière" });
  // Un milieu tiré selon le secteur ; quelques familles d'infractions le déplacent (pénal des affaires, trafic)
  M.milieu = function (r, S, fam) {
    let [p, m, a] = S.mil;
    if (fam === "affaires") { a = a * 2.5 + 0.2; p *= 0.3; }
    if (fam === "stups") p *= 1.5;
    const x = r() * (p + m + a);
    return x < p ? "populaire" : x < p + m ? "mixte" : "aise";
  };
  // Revenu mensuel net (euros), selon la situation, le milieu et le métier ; « à revérifier » : ordres de grandeur
  M.revenu = function (r, P, mil) {
    const k = { populaire: 0, mixte: 1, aise: 2 }[mil || "populaire"];
    const R = (a, b) => Math.round((a + r() * (b - a)) / 50) * 50;
    switch (M.situ(P)) {
      case "rsa": return R(600, 650);
      case "chomage": return P.age < 25 ? 0 : R(900, 1300);
      case "etudiant": return r() < 0.5 ? 0 : R(400, 800);
      case "scolaire": return 0;
      case "retraite": return [R(1000, 1400), R(1500, 2300), R(2600, 4500)][k];
      case "independant": return [R(1200, 2400), R(2000, 4000), R(4500, 12000)][k];
      default: return [R(1300, 1900), R(1900, 3000), R(3500, 7500)][k];
    }
  };
  // Le lieu des faits, puis les domiciles : la victime et les témoins près des faits, l'auteur souvent ailleurs.
  // o : { genre, fam } ; tout sur le fil r (propre à la phase 3)
  const poidsSect = (filtre, f) => { const e = Object.values(M.SECTEURS).filter(filtre); const w = e.map((S) => S.w * (f ? f(S) : 1)); return { e, w }; };
  const tirerSect = (r, { e, w }) => { let x = r() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < e.length; i++) { x -= w[i]; if (x < 0) return e[i]; } return e[e.length - 1]; };
  M.tirerLieux = function (r, o = {}) {
    const permanence = o.genre === "gav" || o.genre === "ci" || o.permanence;
    const aff = (S) => (o.fam === "affaires" ? 0.3 + S.mil[1] + S.mil[2] * 3 : 1);
    const F = tirerSect(r, poidsSect((S) => (permanence ? S.paris : true), (S) => aff(S) * (S.paris ? 1 : 0.9)));
    const pres = (S0, pMeme, pDep) => { const x = r(); if (x < pMeme) return S0; if (x < pMeme + pDep) return tirerSect(r, poidsSect((S) => S.dep === S0.dep)); return tirerSect(r, poidsSect(() => true)); };
    const A = pres(F, o.fam === "affaires" ? 0.2 : 0.35, 0.35);
    const V = pres(F, 0.5, 0.3);
    const T = pres(F, 0.65, 0.25);
    return { F, A, V, T, milA: M.milieu(r, A, o.fam), milV: M.milieu(r, V), milT: M.milieu(r, T) };
  };

  // Une personne : identité, âge, métier, logement, casier, entourage
  // o : { g, minAge, maxAge, metier, casier, majeur, lieu (secteur du domicile), milieu }
  M.personne = function (r, o = {}) {
    const g = o.g || (r() < (o.pf != null ? 1 - o.pf : 0.78) ? "m" : "f");
    const prenom = pk(r, g === "m" ? M.PM : M.PF);
    const nom = pk(r, M.NOMS);
    const age = int(r, Math.max(18, o.minAge || 19), o.maxAge || 52);
    let [metier, emploi] = o.metier ? [o.metier, M.enEmploi(o.metier)] : pk(r, M.METIERS_MIL[o.milieu] || M.METIERS);
    if (metier === "retraité" && age < 60) [metier, emploi] = ["sans emploi", false];
    if (metier === "lycéen en alternance" && age > 21) [metier, emploi] = ["préparateur de commandes", true];
    // une situation qui va avec l'âge : pas d'étudiant de cinquante ans, pas de RSA ni de chômage passé l'âge de la retraite
    if (metier === "étudiant" && age > 30 && !o.metier) [metier, emploi] = ["sans emploi", false];
    if ((metier === "sans emploi" || metier === "bénéficiaire du RSA") && age >= 64 && !o.metier) [metier, emploi] = ["retraité", false];
    if (age < 22 && /^(infirmier|professeur des écoles|comptable|développeur informatique)$/.test(metier) && !o.metier) [metier, emploi] = ["étudiant", false];
    // phase 3 : les métiers des milieux aisés demandent des années d'études (âges minimaux, ordres de grandeur)
    const AGE_MIN = { pharmacien: 25, "médecin généraliste": 28, notaire: 28, dentiste: 25, architecte: 25, "expert-comptable": 26, ingénieur: 23, kinésithérapeute: 23, "cadre dans une banque": 24, "cadre dans l'assurance": 24, "cadre dans la fonction publique": 24, "directeur commercial": 30, "directeur d'agence": 30, "chef d'entreprise": 25, "gérant de société": 23, "chef de projet": 24, consultant: 23, journaliste: 22, "professeur de lycée": 24, "assistant de direction": 21, "agent immobilier": 20, "secrétaire médical": 20, "technicien de maintenance": 20, "chef de rayon": 21, électricien: 19 };
    if (!o.metier && AGE_MIN[metier] && age < AGE_MIN[metier]) [metier, emploi] = age <= 26 ? ["étudiant", false] : ["commercial", true];
    if (g === "f" && M.METIERS_F[metier]) metier = M.METIERS_F[metier];
    const S = o.lieu ? M.secteur(o.lieu) : null;
    const rue = pk(r, S ? S.rues : M.RUES);
    const casier = o.casier != null ? o.casier : r() < 0.55 ? 0 : r() < 0.6 ? 1 : 2;
    const an = 2026 - age;
    const p = {
      prenom, nom, g, age, metier, emploi, heberg: r() < 0.84, casier, rue,
      tel: `0${pk(r, ["6", "7"])} ${int(r, 10, 99)} ${int(r, 10, 99)} ${int(r, 10, 99)} ${int(r, 10, 99)}`,
      naissance: `le ${int(r, 1, 28)} ${pk(r, M.MOIS)} ${an} à ${pk(r, M.VILLES)}`,
      adresse: `${int(r, 2, 120)}, ${rue}, ${S ? S.nom : "Paris 18e"}`, trust: 45,
      proche: pk(r, M.ENTOURAGE), enfants: age > 24 && r() < 0.45 ? int(r, 1, 3) : 0,
    };
    if (S) { p.sect = S.id; if (o.milieu) p.mil = o.milieu; }
    return p;
  };
  // Un policier, un contrôleur : la victime « agent » des fiches d'autorité
  M.agent = (r, msp, lieu) => Object.assign(M.personne(r, { pf: 0.3, minAge: 23, maxAge: 48, metier: msp ? "agent de contrôle de la RATP" : "gardien de la paix", casier: 0, lieu }), { agent: true });
  M.gpx = (r) => `${pk(r, ["Karim Ouali", "Léa Perret", "Julien Moreau", "Sarah Benchetrit", "Kévin Lopes", "Aurélie Dumont", "Mickaël Tessier", "Nadia Ferhat", "Thomas Vasseur", "Inès Bouchard"])}`;

  // ------------------------------------------------------------------ Contexte de récit (X) passé aux fiches
  M.X = function (t, r, niveau) {
    const G = (P) => CR.GEN2.PR.gram(P || { g: "m" });
    const X = {
      r, niveau: niveau || "realiste", A: t.A, V: t.V || t.A, T: t.T, P: t.P, T2: t.T2 || t.T, C2: t.C2 || null,
      // initiales (mineur victime d'une infraction sexuelle : jamais son nom dans le récit)
      ini: (P) => (P ? `${P.prenom[0]}. ${P.nom[0]}.` : ""),
      rue: t.rue, faits: t.d ? t.d.faits : 0,
      // phase 3 : le lieu des faits (« à Montreuil », « Paris 11e »), son commissariat, son tribunal
      lieu: M.lieuxDe(t).F.nom, aLieu: "à " + M.lieuxDe(t).F.nom, comm: M.lieuxDe(t).F.comm, commCourt: M.lieuxDe(t).F.commCourt, tjv: M.lieuxDe(t).TJ.ville, arr: M.lieuxDe(t).F.arr, ancien: M.lieuxDe(t).ancien, hf: t.d && t.d.h != null ? t.d.h : 22 * 60, quoi: t.quoi || null,
      n: (P) => (P ? `${P.prenom} ${P.nom}` : ""),
      nf: (P) => (P ? `${G(P).civ} ${P.prenom} ${P.nom}` : ""),
      civ: (P) => G(P).civ, Civ: (P) => G(P).Civ,
      e: (P) => G(P).e,
      il: (P) => G(P).il, Il: (P) => G(P).Il,
      lui: (P) => G(P).soi,
      la: (P) => G(P).le,
      g: (P) => G(P),
      nombre: (k) => ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze"][k] || String(k),
      h: (m) => CR.fmtTime(((m % 1440) + 1440) % 1440),
      date: (d) => CR.fmtDate(d, "long"),
      lex: (k) => CAT.lex(niveau || "realiste", k, r),
      pk: (a) => pk(r, a), int: (a, b) => int(r, a, b),
      // la situation d'une personne, pour que ses paroles suivent sa fiche (travail, enfants, casier)
      situ: (P) => M.situ(P), travaille: (P) => M.travaille(P), permis: (P) => M.enjeuPermis(P),
      enfants: (P) => !!(P && P.enfants), ancien: (P) => M.casierAncien(P) || "il y a longtemps",
    };
    return X;
  };
})();
