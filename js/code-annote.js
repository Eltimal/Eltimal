/* La Permanence — le code annoté (9 novembre 2026).
   La bibliothèque est rangée comme un code annoté : le vrai plan des codes (intitulés officiels des livres, titres,
   chapitres et sections), les articles du jeu placés à leur rang, les arrêts en notes sous les articles qu'ils
   appliquent, un index alphabétique et un recueil de jurisprudence filtrable.
   Plan relevé le 9 novembre 2026 sur les tables des matières générées depuis Légifrance (codes.droit.org : code pénal
   éd. du 20 oct. 2026, code de procédure pénale éd. du 23 oct. 2026, code de la route éd. du 27 oct. 2026, CJPM, code
   de commerce, CGI, LPF, CSI). Le code de la santé publique n'a pas pu être relu : ses intitulés restent « à revérifier ».
   Chargé après les fiches (cat-*.js, qui ajoutent des textes à CR.LIB) et avant l'interface. */
(function () {
  const CR = (window.CR = window.CR || {});

  // =================================================================== Numéros d'articles
  // « R625-1 » → { pre: "R", n: [625, 1] } ; null si illisible (« 224-1 A », « L.O630 »…)
  const parseNum = (num) => {
    const m = /^([LRDA]?)\.?\s*(\d+(?:-\d+)*)$/.exec(String(num || "").trim());
    return m ? { pre: m[1], n: m[2].split("-").map(Number) } : null;
  };
  const cmpN = (a, b) => {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] == null) return -1;
      if (b[i] == null) return 1;
      if (a[i] !== b[i]) return a[i] - b[i];
    }
    return 0;
  };
  CR.cmpArticle = (x, y) => { const a = parseNum(x), b = parseNum(y); if (!a || !b) return 0; if (a.pre !== b.pre) return a.pre < b.pre ? -1 : 1; return cmpN(a.n, b.n); };
  const numOfId = (id) => { const i = String(id).indexOf("_"); return i < 0 ? "" : String(id).slice(i + 1); };

  // =================================================================== Plan des codes
  // N(intitulé, titre, de, a, enfants) : « de » = premier article de la division (sert au rangement), « a » = dernier
  // quand la table le donne. Une division sans « de » n'accueille aucun article : elle s'affiche grisée.
  const N = (t, h, de, a, c) => ({ t, h, de: de || null, a: a || null, c: c || [] });
  const L = (t, h, de, a) => N(t, h, de, a);
  // G : « de » interne, pas lu dans la table des matières (sert seulement au rangement, jamais affiché)
  const G = (n) => { n.cache = true; return n; };

  const CP = [
    N("Livre Ier", "Dispositions générales", "111-1", null, [
      N("Titre Ier", "De la loi pénale", "111-1", null, [
        L("Chapitre Ier", "Des principes généraux", "111-1"),
        L("Chapitre II", "De l'application de la loi pénale dans le temps", "112-1"),
        N("Chapitre III", "De l'application de la loi pénale dans l'espace", "113-1", null, [
          L("Section 1", "Des infractions commises ou réputées commises sur le territoire de la République", "113-2", "113-5"),
          L("Section 2", "Des infractions commises hors du territoire de la République", "113-6", "113-14"),
        ]),
      ]),
      N("Titre II", "De la responsabilité pénale", "121-1", null, [
        L("Chapitre Ier", "Dispositions générales", "121-1", "121-7"),
        L("Chapitre II", "Des causes d'irresponsabilité ou d'atténuation de la responsabilité", "122-1", "122-9"),
      ]),
      N("Titre III", "Des peines", "131-1", null, [
        N("Chapitre Ier", "De la nature des peines", "131-1", null, [
          L("Section 1", "Des peines applicables aux personnes physiques", "131-1"),
          L("Section 2", "Des peines applicables aux personnes morales", "131-37"),
        ]),
        N("Chapitre II", "Du régime des peines", "132-1", null, [
          L("Section 1", "Dispositions générales", "132-2"),
          L("Section 2", "Des modes de personnalisation des peines", "132-24"),
          L("Section 3", "De la définition de certaines circonstances entraînant l'aggravation, la diminution ou l'exemption des peines", "132-71", "132-80"),
        ]),
        L("Chapitre III", "De l'extinction des peines et de l'effacement des condamnations", "133-1"),
      ]),
    ]),
    N("Livre II", "Des crimes et délits contre les personnes", "211-1", null, [
      N("Titre Ier", "Des crimes contre l'humanité et contre l'espèce humaine", "211-1", null, [
        N("Sous-titre Ier", "Des crimes contre l'humanité", "211-1", null, [
          L("Chapitre Ier", "Du génocide", "211-1"), L("Chapitre II", "Des autres crimes contre l'humanité", "212-1"), L("Chapitre III", "Dispositions communes", "213-1"),
        ]),
        N("Sous-titre II", "Des crimes contre l'espèce humaine", "214-1", null, [
          L("Chapitre Ier", "Des crimes d'eugénisme et de clonage reproductif", "214-1"), L("Chapitre II", "Dispositions communes", "215-1"),
        ]),
      ]),
      N("Titre II", "Des atteintes à la personne humaine", "221-1", null, [
        N("Chapitre Ier", "Des atteintes à la vie de la personne", "221-1", null, [
          L("Section 1", "Des atteintes volontaires à la vie", "221-1", "221-5-4"),
          L("Section 1 bis", "De l'atteinte à la vie résultant d'une intoxication volontaire", "221-5-6"),
          L("Section 2", "Des atteintes involontaires à la vie", "221-6", "221-7"),
          L("Section 3", "Peines complémentaires applicables aux personnes physiques", "221-8", "221-11-1"),
        ]),
        L("Chapitre Ier bis", "Des atteintes à la personne constituées par les disparitions forcées", "221-12"),
        L("Chapitre Ier ter", "Des homicides et blessures routiers", "221-18"),
        N("Chapitre II", "Des atteintes à l'intégrité physique ou psychique de la personne", "222-1", null, [
          L("Section 1", "Des atteintes volontaires à l'intégrité de la personne", "222-1", "222-18-3"),
          L("Section 1 bis", "De l'atteinte à l'intégrité de la personne résultant d'une intoxication volontaire", "222-18-4"),
          L("Section 2", "Des atteintes involontaires à l'intégrité de la personne", "222-19", "222-21"),
          L("Section 3", "Du viol, de l'inceste et des autres agressions sexuelles", "222-22"),
          L("Section 4", "De l'outrage sexiste et sexuel", "222-33-1-1"),
          L("Section 5", "Du harcèlement moral", "222-33-2", "222-33-2-3"),
          L("Section 6", "De l'enregistrement et de la diffusion d'images de violence", "222-33-3"),
          L("Section 7", "Du trafic de stupéfiants", "222-34", "222-43-1"),
          L("Section 8", "Peines complémentaires applicables aux personnes physiques", "222-44", "222-48-5"),
          L("Section 9", "Dispositions communes aux personnes physiques et aux personnes morales", "222-49", "222-51"),
          L("Section 10", "Du trafic d'armes", "222-52", "222-67-1"),
        ]),
        N("Chapitre III", "De la mise en danger de la personne", "223-1", null, [
          L("Section 1", "Des risques causés à autrui", "223-1", "223-2"),
          L("Section 2", "Du délaissement d'une personne hors d'état de se protéger", "223-3", "223-4"),
          L("Section 3", "De l'entrave aux mesures d'assistance et de l'omission de porter secours", "223-5", "223-7-1"),
          L("Section 4", "De l'expérimentation sur la personne humaine", "223-8", "223-9"),
          L("Section 5", "De l'interruption illégale de la grossesse", "223-10", "223-11"),
          L("Section 6", "De la provocation au suicide", "223-13", "223-15-1"),
          L("Section 6 bis", "De l'abus frauduleux de l'état d'ignorance ou de faiblesse et de la sujétion psychologique ou physique", "223-15-2", "223-15-5"),
          L("Section 7", "Peines complémentaires applicables aux personnes physiques", "223-16", "223-20"),
        ]),
        N("Chapitre IV", "Des atteintes aux libertés de la personne", "224-1", null, [
          L("Section 1", "De la réduction en esclavage et de l'exploitation de personnes réduites en esclavage"),
          L("Section 1 bis", "De l'enlèvement et de la séquestration", "224-1", "224-5-2"),
          L("Section 2", "Du détournement d'aéronef, de navire ou de tout autre moyen de transport", "224-6", "224-8-1"),
          L("Section 3", "Peines complémentaires applicables aux personnes physiques", "224-9", "224-10"),
        ]),
        L("Chapitre V", "Des atteintes à la dignité de la personne", "225-1"),
        N("Chapitre VI", "Des atteintes à la personnalité", "226-1", null, [
          L("Section 1", "De l'atteinte à la vie privée", "226-1", "226-7"),
          L("Section 2", "De l'atteinte à la représentation de la personne", "226-8", "226-9"),
          L("Section 3", "De la dénonciation calomnieuse", "226-10", "226-12"),
          L("Section 4", "De l'atteinte au secret", "226-13"),
          L("Section 5", "Des atteintes aux droits de la personne résultant des fichiers ou des traitements informatiques", "226-16", "226-24"),
          L("Section 6", "Des atteintes à la personne résultant de l'examen de ses caractéristiques génétiques ou de l'identification par ses empreintes génétiques", "226-25", "226-30"),
          L("Section 7", "Peines complémentaires applicables aux personnes physiques", "226-31", "226-32"),
        ]),
        N("Chapitre VII", "Des atteintes aux mineurs et à la famille", "227-1", null, [
          L("Section 1", "Du délaissement de mineur", "227-1", "227-2"),
          L("Section 2", "De l'abandon de famille", "227-3", "227-4-1"),
          L("Section 2 bis", "De la violation des ordonnances prises par le juge aux affaires familiales en cas de violences", "227-4-2", "227-4-3"),
          L("Section 3", "Des atteintes à l'exercice de l'autorité parentale", "227-5", "227-11"),
          L("Section 4", "Des atteintes à la filiation", "227-12", "227-14"),
          L("Section 5", "De la mise en péril des mineurs", "227-15"),
          L("Section 6", "Peines complémentaires applicables aux personnes physiques", "227-29", "227-31-1"),
          L("Section 7", "Peine complémentaire commune aux personnes physiques et aux personnes morales", "227-33"),
        ]),
        L("Chapitre VIII", "Du retrait total ou partiel de l'autorité parentale et du retrait de l'exercice de l'autorité parentale", "228-1"),
      ]),
    ]),
    N("Livre III", "Des crimes et délits contre les biens", "311-1", null, [
      N("Titre Ier", "Des appropriations frauduleuses", "311-1", null, [
        N("Chapitre Ier", "Du vol", "311-1", null, [
          L("Section 1", "Du vol simple et des vols aggravés", "311-1", "311-11"),
          L("Section 2", "Dispositions générales", "311-12", "311-13"),
          L("Section 3", "Peines complémentaires applicables aux personnes physiques et responsabilité des personnes morales", "311-14", "311-16"),
        ]),
        N("Chapitre II", "De l'extorsion", "312-1", null, [
          L("Section 1", "De l'extorsion", "312-1", "312-9"),
          L("Section 2", "Du chantage", "312-10", "312-12"),
          L("Section 2 bis", "De la demande de fonds sous contrainte", "312-12-1"),
          L("Section 3", "Peines complémentaires applicables aux personnes physiques et responsabilité des personnes morales", "312-13", "312-15"),
        ]),
        N("Chapitre III", "De l'escroquerie et des infractions voisines", "313-1", null, [
          L("Section 1", "De l'escroquerie", "313-1", "313-3"),
          L("Section 2", "Des infractions voisines de l'escroquerie", "313-5", "313-6-2"),
          L("Section 3", "Peines complémentaires applicables aux personnes physiques et responsabilité des personnes morales", "313-7", "313-9"),
        ]),
        N("Chapitre IV", "Des détournements", "314-1", null, [
          L("Section 1", "De l'abus de confiance", "314-1", "314-4"),
          L("Section 2", "Du détournement de gage ou d'objet saisi", "314-5", "314-6"),
          L("Section 3", "De l'organisation frauduleuse de l'insolvabilité", "314-7", "314-9"),
          L("Section 4", "Peines complémentaires applicables aux personnes physiques et responsabilité des personnes morales", "314-10", "314-13"),
        ]),
        L("Chapitre V", "De l'occupation frauduleuse d'un local à usage d'habitation ou à usage commercial, agricole ou professionnel", "315-1", "315-2"),
      ]),
      N("Titre II", "Des autres atteintes aux biens", "321-1", null, [
        N("Chapitre Ier", "Du recel et des infractions assimilées ou voisines de celui-ci", "321-1", null, [
          L("Section 1", "Du recel", "321-1", "321-5"),
          L("Section 2", "Des infractions assimilées au recel ou voisines de celui-ci", "321-6", "321-8"),
          L("Section 3", "Peines complémentaires applicables aux personnes physiques et responsabilité de personnes morales", "321-9", "321-12"),
        ]),
        N("Chapitre II", "Des destructions, dégradations et détériorations", "322-1", null, [
          L("Section 1", "Des destructions, dégradations et détériorations ne présentant pas de danger pour les personnes", "322-1", "322-4-2"),
          L("Section 2", "Des destructions, dégradations et détériorations dangereuses pour les personnes", "322-5", "322-11-1"),
          L("Section 3", "Des menaces de destruction, de dégradation ou de détérioration et des fausses alertes", "322-12", "322-14"),
          L("Section 4", "Peines complémentaires applicables aux personnes physiques et responsabilité des personnes morales", "322-15", "322-18"),
        ]),
        L("Chapitre III", "Des atteintes aux systèmes de traitement automatisé de données", "323-1", "323-8"),
        N("Chapitre IV", "Du blanchiment", "324-1", null, [
          L("Section 1", "Du blanchiment simple et du blanchiment aggravé", "324-1", "324-6-1"),
          L("Section 2", "Peines complémentaires applicables aux personnes physiques et responsabilité pénale des personnes morales", "324-7", "324-9"),
        ]),
      ]),
    ]),
    N("Livre IV", "Des crimes et délits contre la nation, l'Etat et la paix publique", "411-1", null, [
      N("Titre Ier", "Des atteintes aux intérêts fondamentaux de la nation", "411-1", null, [
        L("Chapitre Ier", "De la trahison et de l'espionnage", "411-1"),
        L("Chapitre II", "Des autres atteintes aux institutions de la République ou à l'intégrité du territoire national", "412-1"),
        L("Chapitre III", "Des autres atteintes à la défense nationale", "413-1"),
        L("Chapitre IV", "Dispositions particulières", "414-1"),
      ]),
      N("Titre II", "Du terrorisme", "421-1", null, [
        L("Chapitre Ier", "Des actes de terrorisme", "421-1", "421-8"),
        L("Chapitre II", "Dispositions particulières", "422-1"),
      ]),
      N("Titre III", "Des atteintes à l'autorité de l'Etat", "431-1", null, [
        N("Chapitre Ier", "Des atteintes à la paix publique", "431-1", null, [
          L("Section 1", "Des entraves à l'exercice des libertés d'expression, du travail, d'association, de réunion ou de manifestation", "431-1", "431-2"),
          L("Section 2", "De la participation délictueuse à un attroupement", "431-3", "431-8-1"),
          L("Section 3", "Des manifestations illicites et de la participation délictueuse à une manifestation ou à une réunion publique", "431-9", "431-11"),
          L("Section 4", "Des groupes de combat et des mouvements dissous", "431-13", "431-21"),
          L("Section 5", "De l'intrusion dans un établissement d'enseignement scolaire", "431-22", "431-26"),
          L("Section 7", "De la distribution d'argent à des fins publicitaires sur la voie publique", "431-29", "431-30"),
        ]),
        N("Chapitre II", "Des atteintes à l'administration publique commises par des personnes exerçant une fonction publique", "432-1", null, [
          L("Section 1", "Des abus d'autorité dirigés contre l'administration", "432-1", "432-3"),
          L("Section 2", "Des abus d'autorité commis contre les particuliers", "432-4"),
          L("Section 3", "Des manquements au devoir de probité", "432-10"),
          L("Section 4", "Peines complémentaires", "432-17", "432-18"),
        ]),
        N("Chapitre III", "Des atteintes à l'administration publique commises par les particuliers", "433-1", null, [
          L("Section 1", "De la corruption active et du trafic d'influence commis par les particuliers", "433-1", "433-2-1"),
          L("Section 2", "Des menaces et actes d'intimidation commis contre les personnes exerçant une fonction publique", "433-3", "433-3-1"),
          L("Section 3", "De la soustraction et du détournement de biens contenus dans un dépôt public", "433-4"),
          L("Section 4", "De l'outrage", "433-5", "433-5-1"),
          L("Section 5", "De la rébellion", "433-6", "433-10"),
          L("Section 6", "De l'opposition à l'exécution de travaux publics", "433-11"),
          L("Section 7", "De l'usurpation de fonctions", "433-12", "433-13"),
          L("Section 8", "De l'usurpation de signes réservés à l'autorité publique", "433-14", "433-16"),
          L("Section 9", "De l'usurpation de titres", "433-17"),
          L("Section 10", "De l'usage irrégulier de qualité", "433-18"),
          L("Section 11", "Des atteintes à l'état civil des personnes", "433-18-1", "433-21-1"),
          L("Section 12", "Peines complémentaires et responsabilité des personnes morales", "433-22", "433-26"),
        ]),
        N("Chapitre IV", "Des atteintes à l'action de justice", "434-1", null, [
          L("Section 1", "Des entraves à la saisine de la justice", "434-1", "434-7"),
          L("Section 2", "Des entraves à l'exercice de la justice", "434-7-1", "434-23-1"),
          L("Section 3", "Des atteintes à l'autorité de la justice", "434-24"),
          L("Section 4", "Peines complémentaires et responsabilité des personnes morales", "434-44", "434-48"),
        ]),
        L("Chapitre V", "Des atteintes à l'administration publique et à l'action de la justice des Communautés européennes, des Etats membres de l'Union européenne, des autres Etats étrangers et des autres organisations internationales publiques", "435-1"),
        L("Chapitre VI", "De la participation à une activité mercenaire", "436-1"),
      ]),
      N("Titre IV", "Des atteintes à la confiance publique", "441-1", null, [
        L("Chapitre Ier", "Des faux", "441-1", "441-12"),
        L("Chapitre II", "De la fausse monnaie", "442-1", "442-16"),
        L("Chapitre III", "De la falsification des titres ou autres valeurs fiduciaires émises par l'autorité publique", "443-1"),
        L("Chapitre IV", "De la falsification des marques de l'autorité", "444-1"),
        L("Chapitre V", "De la corruption des personnes n'exerçant pas une fonction publique", "445-1"),
        L("Chapitre VI", "De la violation des dispositions réglementant les professions exercées dans les lieux publics", "446-1"),
      ]),
      L("Titre V", "De la participation à une association de malfaiteurs et du concours à une organisation criminelle", "450-1"),
    ]),
    N("Livre IV bis", "Des crimes et des délits de guerre", "461-1", null, [
      L("Chapitre Ier", "Des différents crimes et délits de guerre", "461-1"), L("Chapitre II", "Dispositions particulières", "462-1"),
    ]),
    N("Livre V", "Des autres crimes et délits", "511-1", null, [
      N("Titre Ier", "Des infractions en matière de santé publique", "511-1", null, [L("Chapitre Ier", "Des infractions en matière d'éthique biomédicale", "511-1")]),
      N("Titre II", "Autres dispositions", "521-1", null, [
        L("Chapitre Ier", "Des sévices graves ou actes de cruauté envers les animaux", "521-1"),
        L("Chapitre II", "Des atteintes volontaires à la vie d'un animal", "522-1"),
      ]),
    ]),
    N("Livre VI", "Des contraventions", "611-1", null, [L("Titre Ier", "Du recours à la prostitution", "611-1")]),
    N("Livre VII", "Dispositions relatives à l'outre-mer", "711-1", null, [
      L("Titre Ier", "Dispositions applicables dans les collectivités d'outre-mer et en Nouvelle-Calédonie", "711-1"),
      L("Titre II", "Dispositions particulières au Département-Région de Mayotte", "721-1"),
    ]),
  ];
  const CP_R = [
    N("Livre VI", "Des contraventions", "R610-1", null, [
      L("Titre Ier", "Dispositions générales", "R610-1", "R610-5"),
      N("Titre II", "Des contraventions contre les personnes", "R621-1", null, [
        L("Chapitre Ier", "Des contraventions de la 1re classe contre les personnes", "R621-1"),
        L("Chapitre II", "Des contraventions de la 2e classe contre les personnes", "R622-1"),
        L("Chapitre III", "Des contraventions de la 3e classe contre les personnes", "R623-1"),
        L("Chapitre IV", "Des contraventions de la 4e classe contre les personnes", "R624-1"),
        L("Chapitre V", "Des contraventions de la 5e classe contre les personnes", "R625-1"),
      ]),
      N("Titre III", "Des contraventions contre les biens", "R631-1", null, [
        L("Chapitre Ier", "Des contraventions de la 1re classe contre les biens", "R631-1"),
        L("Chapitre III", "Des contraventions de la 3e classe contre les biens", "R633-1"),
        L("Chapitre IV", "Des contraventions de la 4e classe contre les biens", "R634-1"),
        L("Chapitre V", "Des contraventions de la 5e classe contre les biens", "R635-1"),
      ]),
      L("Titre IV", "Des contraventions contre la nation, l'Etat ou la paix publique", "R641-1"),
      L("Titre V", "Des autres contraventions", "R653-1"),
    ]),
  ];

  const CPP = [
    N("Titre préliminaire", "Dispositions générales", "1", null, [
      L("Sous-titre Ier", "De l'action publique et de l'action civile", "1", "10"),
      L("Sous-titre II", "De la justice restaurative", "10-1", "10-1-1"),
      L("Sous-titre III", "Des droits des victimes", "10-2", "10-6"),
    ]),
    N("Livre Ier", "De la conduite de la politique pénale, de l'exercice de l'action publique et de l'instruction", "11", null, [
      N("Titre Ier", "Des autorités chargées de la conduite de la politique pénale, de l'action publique et de l'instruction", "11", null, [
        N("Chapitre Ier", "De la police judiciaire", "12", null, [
          L("Section 1", "Dispositions générales", "12", "15-6"), L("Section 2", "Des officiers de police judiciaire", "16", "19-1"),
          L("Section 3", "Des agents de police judiciaire", "20", "21-2"), L("Section 4", "Des assistants d'enquête", "21-3"),
          L("Section 5", "Des fonctionnaires et agents chargés de certaines fonctions de police judiciaire", "22"),
        ]),
        L("Chapitre Ier bis", "Des attributions du garde des sceaux, ministre de la justice", "30"),
        N("Chapitre II", "Du ministère public", "31", null, [
          L("Section 1", "Dispositions générales", "31", "33"), L("Section 2", "Des attributions du procureur général près la cour d'appel", "34", "38"),
          L("Section 3", "Des attributions du procureur de la République", "39", "44-1"), L("Section 4", "Du ministère public près le tribunal de police", "45", "48"),
          L("Section 5", "Du bureau d'ordre national automatisé des procédures judiciaires", "48-1"),
        ]),
        L("Chapitre III", "Du juge d'instruction", "49", "52-1"),
      ]),
      N("Titre II", "Des enquêtes et des contrôles d'identité", "53", null, [
        L("Chapitre Ier", "Des crimes et des délits flagrants", "53", "74-2"),
        L("Chapitre II", "De l'enquête préliminaire", "75", "78"),
        L("Chapitre III", "Des contrôles, des vérifications et des relevés d'identité", "78-1", "78-7"),
      ]),
      N("Titre III", "Des juridictions d'instruction", "79", null, [
        N("Chapitre Ier", "Du juge d'instruction : juridiction d'instruction du premier degré", "79", null, [
          L("Section 1", "Dispositions générales", "79", "84-1"),
          L("Section 2", "De la constitution de la partie civile et de ses effets", "85", "91-1"),
          L("Section 3", "Des transports, des perquisitions, des saisies et des interceptions de correspondances émises par la voie des télécommunications", "92"),
          L("Section 4", "Des auditions de témoins", "101"),
          L("Section 5", "Des interrogatoires et confrontations", "114", "121"),
          L("Section 6", "Des mandats et de leur exécution", "122", "136"),
          L("Section 7", "Du contrôle judiciaire, de l'assignation à résidence et de la détention provisoire", "137"),
          L("Section 8", "Des commissions rogatoires", "151", "154-2"),
          L("Section 9", "De l'expertise", "156", "169-1"),
          L("Section 10", "Des nullités de l'information", "170", "174-1"),
          L("Section 11", "Des ordonnances de règlement", "175", "184"),
          L("Section 12", "De l'appel des ordonnances du juge d'instruction ou du juge des libertés et de la détention", "185", "187-3"),
          L("Section 13", "De la reprise de l'information sur charges nouvelles", "188", "190"),
        ]),
        N("Chapitre II", "De la chambre de l'instruction : juridiction d'instruction du second degré", "191", null, [
          L("Section 1", "Dispositions générales", "191", "218"),
          L("Section 2", "Pouvoirs propres du président de la chambre de l'instruction", "219", "223"),
          L("Section 3", "Du contrôle de l'activité des officiers et agents de police judiciaire", "224", "230"),
        ]),
      ]),
      N("Titre IV", "Dispositions communes", "230-1", null, [
        L("Chapitre Ier", "De la mise au clair des données chiffrées nécessaires à la manifestation de la vérité", "230-1", "230-5"),
        G(L("Chapitre II", "Des fichiers de police judiciaire", "230-6")),
        L("Chapitre III", "Des logiciels de rapprochement judiciaire", "230-20", "230-27"),
        L("Chapitre IV", "Des autopsies judiciaires", "230-28", "230-31"),
        L("Chapitre V", "De la géolocalisation", "230-32", "230-44"),
        L("Chapitre VI", "De la plate-forme nationale des interceptions judiciaires", "230-45"),
        L("Chapitre VII", "De l'enquête sous pseudonyme", "230-46"),
        L("Chapitre VIII", "Des captations et fixations d'images dans les lieux publics au moyen de dispositifs aéroportés", "230-47", "230-53"),
        L("Chapitre IX", "Du recours aux informateurs et de la protection de leur anonymat", "230-54"),
      ]),
    ]),
    N("Livre II", "Des juridictions de jugement", "231", null, [
      N("Titre Ier", "De la cour d'assises et de la cour criminelle départementale", "231", null, [
        N("Sous-titre Ier", "De la cour d'assises", "231", null, [
          L("Chapitre Ier", "De la compétence de la cour d'assises", "231"), L("Chapitre II", "De la tenue des assises", "232", "239"),
          L("Chapitre III", "De la composition de la cour d'assises", "240", "242-1"), L("Chapitre IV", "De la procédure préparatoire aux sessions d'assises", "269"),
          L("Chapitre V", "De l'ouverture des sessions", "288"), L("Chapitre VI", "Des débats", "306"), L("Chapitre VII", "Du jugement", "355"),
          L("Chapitre VIII", "Du défaut en matière criminelle", "379-2", "379-7"),
          L("Chapitre IX", "De l'appel des décisions rendues par la cour d'assises en premier ressort", "380-1"),
        ]),
        L("Sous-titre II", "De la cour criminelle départementale", "380-16", "380-22"),
      ]),
      N("Titre II", "Du jugement des délits", "381", null, [
        N("Chapitre Ier", "Du tribunal correctionnel", "381", null, [
          L("Section 1", "De la compétence et de la saisine du tribunal correctionnel", "381"),
          L("Section 2", "De la composition du tribunal et de la tenue des audiences", "398"),
          L("Section 3", "De la publicité et de la police de l'audience", "400", "405"),
          L("Section 4", "Des débats", "406"), L("Section 5", "Du jugement", "462"),
          L("Section 6", "Du jugement par défaut et de l'opposition", "487"),
          L("Section 7", "De la procédure simplifiée", "495", "495-6"),
          L("Section 8", "De la comparution sur reconnaissance préalable de culpabilité", "495-7", "495-16"),
          L("Section 9", "De la procédure de l'amende forfaitaire applicable à certains délits", "495-17", "495-25"),
        ]),
        N("Chapitre II", "De la cour d'appel en matière correctionnelle", "496", null, [
          L("Section 1", "De l'exercice du droit d'appel", "496", "509-1"),
          L("Section 2", "De la composition de la chambre des appels correctionnels", "510", "511"),
          L("Section 3", "De la procédure devant la chambre des appels correctionnels", "512", "520-1"),
        ]),
      ]),
      N("Titre III", "Du jugement des contraventions", "521", null, [
        L("Chapitre Ier", "De la compétence du tribunal de police", "521", "523"), L("Chapitre II", "De la procédure simplifiée", "524", "528-2"),
        G(L("Chapitre II bis", "De la procédure de l'amende forfaitaire", "529")), L("Chapitre III", "De la saisine du tribunal de police", "531", "533"),
        L("Chapitre IV", "De l'instruction définitive devant le tribunal de police", "534", "543"),
        L("Chapitre V", "Du jugement par défaut et de l'opposition", "544", "545"), L("Chapitre VI", "De l'appel des jugements de police", "546", "549"),
      ]),
      L("Titre IV", "Des citations et significations", "550", "566"),
    ]),
    N("Livre III", "Des voies de recours extraordinaires", "567", null, [
      N("Titre Ier", "Du pourvoi en cassation", "567", null, [
        L("Chapitre Ier", "Des décisions susceptibles d'être attaquées et des conditions du pourvoi", "567", "574-2"),
        L("Chapitre II", "Des formes du pourvoi", "576", "590-2"), L("Chapitre III", "Des ouvertures à cassation", "591", "600"),
        L("Chapitre IV", "De l'instruction des recours et des audiences", "601", "604"),
        L("Chapitre V", "Des arrêts rendus par la Cour de cassation", "605", "619"), L("Chapitre VI", "Du pourvoi dans l'intérêt de la loi", "620", "621"),
      ]),
      N("Titre II", "Des demandes en révision et en réexamen", "622", null, [
        L("Chapitre Ier", "Des demandes en révision et en réexamen", "622", "622-2"), L("Chapitre II", "De la cour de révision et de réexamen", "623", "623-1"),
        L("Chapitre III", "De la procédure suivie devant la cour de révision et de réexamen", "624", "624-6"),
        L("Chapitre IV", "De la décision de la cour de révision et de réexamen", "624-7"),
        L("Chapitre V", "Des demandes de suspension de l'exécution de la condamnation", "625"), L("Chapitre VI", "Des demandes d'actes préalables", "626"),
        L("Chapitre VII", "De la réparation à raison d'une condamnation", "626-1"),
      ]),
    ]),
    N("Livre IV", "De quelques procédures particulières", "627", null, [
      L("Titre Ier", "Des règles de procédure applicables aux crimes contre l'humanité et aux crimes de guerre", "627"),
      L("Titre Ier bis", "De la question prioritaire de constitutionnalité"),
      L("Titre II", "Du faux", "642", "647-4"),
      L("Titre III", "De la manière de procéder en cas de disparition des pièces d'une procédure", "648", "651"),
      L("Titre IV", "De la manière dont sont reçues les dépositions des membres du Gouvernement et celles des représentants des puissances étrangères", "652", "656"),
      L("Titre IV bis", "De la manière dont sont reçues les dépositions des personnels de certains services ou unités spécialisés", "656-1", "656-2"),
      L("Titre V", "Des règlements de juges", "657", "661"), L("Titre VI", "Des renvois d'un tribunal à un autre", "662", "667-1"),
      L("Titre VII", "De la récusation", "668", "674-2"), L("Titre VIII", "Du jugement des infractions commises à l'audience des cours et tribunaux", "675", "678"),
      N("Titre IX", "Des infractions commises hors du territoire de la République", "689", null, [
        L("Chapitre Ier", "De la compétence des juridictions françaises", "689", "689-14"),
        L("Chapitre II", "De l'exercice des poursuites et de la juridiction territorialement compétente", "692", "693"),
      ]),
      G(L("Titre X", "De l'entraide judiciaire internationale", "694")),
      L("Titre X bis", "Du parquet européen", "696-108"),
      G(N("Titre XI", "Des infractions en matière militaire et des crimes et délits contre les intérêts fondamentaux de la nation", "697", null, [
        G(L("Chapitre Ier", "De la poursuite, de l'instruction et du jugement des infractions en matière militaire en temps de paix", "697")),
        L("Chapitre II", "Des juridictions compétentes en cas de guerre, de mobilisation, d'état de siège ou d'état d'urgence", "699", "700"),
        L("Chapitre III", "Des crimes et délits contre les intérêts fondamentaux de la Nation", "701", "702"),
      ])),
      L("Titre XII", "Des demandes présentées en vue d'être relevé des interdictions, déchéances ou incapacités", "702-1", "703"),
      N("Titre XIII", "De la procédure applicable aux infractions en matière économique et financière", "704", null, [
        L("Chapitre Ier", "Des compétences des juridictions interrégionales spécialisées en matière économique et financière", "704", "704-4"),
        L("Chapitre II", "Des compétences particulières du tribunal judiciaire de Paris et du procureur de la République financier", "705", "705-5"),
        L("Chapitre III", "Dispositions diverses", "706", "706-1-3"),
      ]),
      L("Titre XIII bis", "De la procédure applicable aux infractions en matière sanitaire et environnementale", "706-2"),
      L("Titre XIV", "Du recours en indemnité ouvert à certaines victimes de dommages résultant d'une infraction", "706-3", "706-15"),
      L("Titre XIV bis", "De l'aide au recouvrement des dommages et intérêts pour les victimes d'infractions", "706-15-1", "706-15-2"),
      L("Titre XIV quater", "Du bureau d'aide aux victimes", "706-15-4"),
      L("Titre XV", "De la poursuite, de l'instruction et du jugement des actes de terrorisme", "706-16"),
      L("Titre XVI", "De la poursuite, de l'instruction et du jugement des infractions en matière de trafic de stupéfiants", "706-26", "706-33"),
      L("Titre XVII", "De la poursuite, de l'instruction et du jugement des infractions en matière de traite des êtres humains", "706-34", "706-40"),
      L("Titre XVIII", "De la poursuite, de l'instruction et du jugement des infractions commises par les personnes morales", "706-41", "706-46"),
      N("Titre XIX", "De la procédure applicable aux infractions de nature sexuelle et de la protection des mineurs victimes", "706-47", null, [
        L("Chapitre Ier", "Dispositions générales", "706-47-1", "706-53"),
        L("Chapitre II", "Du fichier judiciaire national automatisé des auteurs d'infractions sexuelles ou violentes", "706-53-1", "706-53-12"),
        L("Chapitre III", "De la rétention de sûreté et de la surveillance de sûreté", "706-53-13", "706-53-22"),
      ]),
      L("Titre XX", "Du fichier national automatisé des empreintes génétiques", "706-54", "706-56-1-1"),
      L("Titre XX bis", "Du répertoire des données à caractère personnel collectées dans le cadre des procédures judiciaires", "706-56-2"),
      L("Titre XXI", "De la protection des témoins et des victimes", "706-57", "706-63"),
      L("Titre XXI bis", "Des collaborateurs de justice"),
      L("Titre XXII", "Saisine pour avis de la Cour de cassation", "706-64", "706-70"),
      L("Titre XXIII", "De l'utilisation de moyens de télécommunications au cours de la procédure", "706-71", "706-71-1"),
      L("Titre XXIV", "De la procédure applicable aux atteintes aux systèmes de traitement automatisé de données", "706-72", "706-72-6"),
      N("Titre XXV", "De la procédure applicable à la criminalité et à la délinquance organisées et aux crimes", "706-73", null, [
        L("Chapitre Ier A", "Du procureur de la République anti-criminalité organisée", "706-74-2", "706-74-7"),
        L("Chapitre Ier", "Compétence des juridictions spécialisées", "706-75", "706-79-2"),
        G(L("Chapitre II", "Procédure", "706-80")),
      ]),
      L("Titre XXV bis", "De la procédure applicable aux crimes sériels ou non élucidés", "706-106-1", "706-106-5"),
      L("Titre XXVI", "De la procédure applicable en cas de pollution des eaux maritimes par rejets des navires et d'atteinte aux biens culturels maritimes", "706-107"),
      L("Titre XXVII", "De la poursuite, de l'instruction et du jugement des infractions commises par des majeurs protégés", "706-112", "706-118"),
      N("Titre XXVIII", "De la procédure et des décisions d'irresponsabilité pénale pour cause de trouble mental", "706-119", null, [
        L("Chapitre Ier", "Dispositions applicables devant le juge d'instruction et la chambre de l'instruction", "706-119", "706-128"),
        G(L("Chapitre II", "Dispositions applicables devant le tribunal correctionnel ou la cour d'assises", "706-129")),
        L("Chapitre III", "Mesures de sûreté pouvant être ordonnées en cas de déclaration d'irresponsabilité pénale pour cause de trouble mental", "706-135", "706-139"),
        L("Chapitre IV", "Dispositions applicables aux infractions d'atteintes à la personne résultant d'une intoxication volontaire", "706-139-1", "706-140"),
      ]),
      L("Titre XXIX", "Des saisies spéciales", "706-141"),
      L("Titre XXX", "De l'agence de gestion et de recouvrement des avoirs saisis et confisqués", "706-159"),
      L("Titre XXXI", "Des mesures conservatoires", "706-166"),
      L("Titre XXXII", "De la procédure applicable aux infractions relatives à la prolifération d'armes de destruction massive et de leurs vecteurs", "706-167"),
      L("Titre XXXIII", "De la procédure applicable en cas d'accident collectif", "706-176", "706-182"),
    ]),
    N("Livre V", "Des procédures d'exécution", "707", null, [
      N("Titre Ier", "De l'exécution des sentences pénales", "707", null, [
        L("Chapitre Ier", "Dispositions générales", "707", "712"), G(L("Chapitre II", "Des juridictions de l'application des peines", "712-1")),
        G(L("Chapitre III", "De la coopération internationale aux fins d'exécution des décisions de confiscation", "713")),
      ]),
      L("Titre Ier bis", "De la peine de détention à domicile sous surveillance électronique", "713-42", "713-49"),
      N("Titre II", "De la détention", "714", null, [
        L("Chapitre Ier", "De l'exécution de la détention provisoire", "714", "716"),
        N("Chapitre II", "De l'exécution des peines privatives de liberté", "716-1", null, [
          L("Section 1", "Dispositions générales", "716-1", "719"), L("Section 1 bis", "De la libération sous contrainte", "720"),
          L("Section 2", "De la suspension et du fractionnement des peines privatives de liberté", "720-1", "720-1-1"),
          L("Section 3", "De la période de sûreté", "720-2", "720-5"), L("Section 4", "Des réductions de peines", "721", "721-4"),
          L("Section 5", "Du placement à l'extérieur, de la semi-liberté, des permissions de sortir et des autorisations de sortie sous escorte", "723", "723-6"),
          L("Section 6", "Du placement sous surveillance électronique", "723-7", "723-13-1"),
          L("Section 7", "Des procédures simplifiées d'aménagement des peines", "723-15"),
          L("Section 9", "Dispositions relatives à la surveillance judiciaire de personnes dangereuses condamnées pour crime ou délit", "723-29", "723-39"),
        ]),
        L("Chapitre III", "Des dispositions communes aux différents établissements pénitentiaires", "724", "727-1"),
        L("Chapitre V", "Du transfèrement des personnes condamnées", "728-2", "728-9"),
      ]),
      L("Titre III", "De la libération conditionnelle", "729", "733"),
      L("Titre III bis", "Du travail d'intérêt général", "733-1", "733-2"),
      N("Titre IV", "Du sursis et de l'ajournement", "734", null, [
        L("Chapitre Ier", "Du sursis simple", "735", "736"), L("Chapitre II", "Du sursis probatoire", "739", "747"),
        L("Chapitre III", "Des conversions de peines", "747-1", "747-1-1"), L("Chapitre IV", "De l'ajournement", "747-3", "747-4"),
      ]),
      L("Titre V", "De la reconnaissance de l'identité des individus condamnés", "748"),
      L("Titre VI", "De la contrainte judiciaire", "749", "762"), L("Titre VII", "De l'interdiction de séjour", "762-1", "763"),
      L("Titre VII bis", "Du suivi socio-judiciaire", "763-1", "763-9"),
      L("Titre VII ter", "Du placement sous surveillance électronique mobile à titre de mesure de sûreté", "763-10", "763-14"),
      L("Titre VII quater", "De l'exécution des condamnations et des décisions de probation en application de la décision-cadre du Conseil de l'Union européenne", "764-1"),
      L("Titre VII quinquies", "De la peine de programme de mise en conformité", "764-44"),
      L("Titre VIII", "Du casier judiciaire", "768", "781"),
      L("Titre IX", "De la réhabilitation des condamnés", "782"),
      L("Titre X", "Des frais de justice", "800", "800-2"),
    ]),
    L("", "Dispositions générales", "801", "803-11"),
    G(N("Livre VI", "Dispositions relatives à l'outre-mer", "804", null, [
      L("Titre Ier", "Dispositions applicables en Polynésie française, dans les îles Wallis et Futuna et en Nouvelle-Calédonie"),
      L("Titre II", "Dispositions particulières au Département-Région de Mayotte"),
      L("Titre III", "Dispositions particulières à la collectivité territoriale de Saint-Pierre-et-Miquelon"),
      L("Titre IV", "Dispositions particulières applicables aux collectivités de Saint-Barthélemy et de Saint-Martin", "935", "937"),
    ])),
  ];

  const ROUTE = [
    G(N("Livre 2", "Le conducteur", "L211-1", null, [
      N("Titre 1er", "Enseignement de la conduite et de la sécurité routière", "L211-1", null, [
        L("Chapitre 1er", "Formation à la conduite et à la sécurité routière", "L211-1", "L211-7"),
        L("Chapitre 2", "Enseignement à titre onéreux et animation de stages de sensibilisation à la sécurité routière", "L212-1", "L212-5"),
        L("Chapitre 3", "Etablissements d'enseignement et d'animation de stages de sensibilisation à la sécurité routière", "L213-1", "L213-9"),
      ]),
      N("Titre 2", "Permis de conduire", "L221-1", null, [
        L("Chapitre 1er", "Vérification d'aptitude, délivrance et catégories", "L221-1", "L221-10"),
        L("Chapitre 3", "Permis à points", "L223-1", "L223-9"),
        L("Chapitre 3 bis", "Points affectés au conducteur titulaire d'un permis de conduire délivré par une autorité étrangère", "L223-10", "L223-11"),
        L("Chapitre 4", "Interdiction de délivrance, rétention, suspension et annulation", "L224-1", "L224-18"),
        L("Chapitre 5", "Enregistrement et communication des informations relatives au permis de conduire", "L225-1", "L225-9"),
      ]),
      N("Titre 3", "Comportement du conducteur", "L231-1", null, [
        L("Chapitre 1er", "Comportement en cas d'accident", "L231-1", "L231-3"),
        L("Chapitre 2", "Atteintes involontaires aux personnes", "L232-1", "L232-4"),
        L("Chapitre 3", "Comportement en cas de contrôle routier", "L233-1", "L233-2"),
        L("Chapitre 4", "Conduite sous l'influence de l'alcool", "L234-1", "L234-18"),
        L("Chapitre 5", "Conduite après usage de substances ou plantes classées comme stupéfiants", "L235-1", "L235-5"),
        L("Chapitre 6", "Comportements compromettant délibérément la sécurité ou la tranquillité des usagers de la route", "L236-1", "L236-3"),
        L("Chapitre 7", "Conduite malgré l'usage ou la consommation manifeste de substances entraînant une altération de la vigilance", "L237-1", "L237-4"),
      ]),
      L("Titre 4", "Dispositions relatives à l'outre-mer", "L241-1"),
    ])),
  ];
  const ROUTE_R = [
    G(N("Livre II", "Le conducteur", "R221-1", null, [
      G(N("Titre II", "Permis de conduire", "R221-1", null, [
        G(L("Chapitre Ier", "Vérification d'aptitude, délivrance et catégories", "R221-1")), L("Chapitre II", "Reconnaissance et équivalences", "R222-1", "D222-8"),
        G(L("Chapitre III", "Permis à points", "R223-1")), G(L("Chapitre IV", "Interdiction de délivrance, rétention, suspension, annulation, invalidation", "R224-1")),
        L("Chapitre V", "Enregistrement et communication des informations relatives au permis de conduire", "R225-1", "R225-6"),
      ])),
      N("Titre III", "Comportement du conducteur", "R231-1", null, [
        L("Chapitre Ier", "Comportement en cas d'accident", "R231-1"), L("Chapitre III", "Comportement en cas de contrôle routier", "R233-1", "R233-3"),
        L("Chapitre IV", "Conduite sous l'influence de l'alcool", "R234-1", "R234-7"),
        G(L("Chapitre V", "Conduite après usage de substances ou plantes classées comme stupéfiants", "R235-1")),
      ]),
    ])),
  ];

  const CJPM = [
    N("Titre préliminaire", "Des principes généraux de la justice pénale des mineurs", "L11-1", null, [
      L("Chapitre Ier", "Des principes généraux du droit pénal applicable aux mineurs", "L11-1", "L11-5"),
      L("Chapitre II", "Des principes généraux de la procédure pénale applicable aux mineurs", "L12-1", "L12-6"),
      L("Chapitre III", "Dispositions communes", "L13-1", "L13-4"),
    ]),
    N("Livre Ier", "Des mesures éducatives et des peines", "L111-1", null, [
      L("Titre Ier", "Des mesures éducatives", "L111-1"),
      N("Titre II", "Des peines", "L121-1", null, [
        L("Chapitre Ier", "Des peines encourues", "L121-1", "L121-8"), L("Chapitre II", "Du contenu et des modalités d'application de certaines peines", "L122-1", "L122-6"),
        L("Chapitre III", "Du prononcé des peines", "L123-1", "L123-2"), L("Chapitre IV", "Du régime d'incarcération", "L124-1", "L124-2"),
      ]),
    ]),
    N("Livre II", "De la spécialisation des acteurs", "L211-1", null, [
      L("Titre Ier", "Du ministère public", "L211-1", "L211-3"), L("Titre II", "Du juge d'instruction", "L221-1", "L221-3"),
      L("Titre III", "Des juridictions de jugement", "L231-1", "L231-10"), L("Titre IV", "De la protection judiciaire de la jeunesse", "L241-1", "L241-2"),
    ]),
    N("Livre III", "Dispositions communes aux différentes phases de la procédure pénale", "L311-1", null, [
      L("Titre Ier", "Du droit du mineur à l'accompagnement et à l'information", "L311-1", "L311-4"),
      L("Titre II", "Des investigations et de la mesure éducative judiciaire provisoire", "L321-1"),
      N("Titre III", "Des mesures de sûreté", "L331-1", null, [
        L("Chapitre Ier", "Du contrôle judiciaire", "L331-1", "L331-7"), L("Chapitre II", "De l'exécution des mandats des juridictions pour mineurs", "L332-1", "L332-2"),
        L("Chapitre III", "De l'assignation à résidence avec surveillance électronique", "L333-1", "L333-2"), L("Chapitre IV", "De la détention provisoire", "L334-1", "L334-6"),
      ]),
    ]),
    N("Livre IV", "De la procédure préalable au jugement", "L411-1", null, [
      L("Titre Ier", "De l'audition du mineur suspect", "L411-1"), L("Titre II", "De l'action publique", "L421-1"), L("Titre III", "De l'information judiciaire", "L431-1"),
    ]),
    N("Livre V", "Du jugement", "L511-1", null, [
      N("Titre Ier", "Dispositions générales", "L511-1", null, [
        L("Chapitre Ier", "Des débats", "L511-1", "L511-5"), L("Chapitre II", "De l'action civile", "L512-1", "L512-4"), L("Chapitre III", "De la publicité des audiences", "L513-1", "L513-4"),
      ]),
      L("Titre II", "De la procédure de jugement", "L521-1"), L("Titre III", "Des voies de recours", "L531-1"),
    ]),
    L("Livre VI", "L'application et l'exécution des mesures éducatives et des peines", "L611-1"),
    L("Livre VII", "Dispositions relatives à l'outre-mer", "L711-1"),
  ];

  // =================================================================== Plan officiel tiré du texte intégral (lot 9)
  // Quand js/codes/<code>.js est chargé (CR.INTEGRAL), le plan du code est celui du fichier : toutes les divisions en
  // vigueur, chaque article à sa place exacte (n.integ, dans l'ordre du code). Les plans relevés à la main ci-dessus
  // restent la solution de repli si les fichiers manquent.
  const DIV = /^(Partie|Livre|Titre|Sous-titre|Chapitre|Section|Sous-section|Paragraphe|Sous-paragraphe|Annexe)/i;
  const coupe = (titre) => {
    const x = String(titre || "").replace(/^(LIVRE|TITRE|CHAPITRE|SECTION|PARTIE|PARAGRAPHE)\b/, (w) => w.charAt(0) + w.slice(1).toLowerCase());
    const i = x.indexOf(" : ");
    if (i > 0) return [x.slice(0, i).trim(), x.slice(i + 3).trim()];
    return DIV.test(x) ? [x, ""] : ["", x];
  };
  const depuisIntegral = (code) => {
    const I = (CR.INTEGRAL || {})[code];
    if (!I || !Array.isArray(I.plan)) return null;
    const conv = (x) => {
      const [t, h] = coupe(x.t);
      const c = (x.c || []).map(conv);
      const integ = (x.a || []).map((a) => code + "_" + a);
      const tous = integ.concat(...c.map((y) => y.tousIds));
      const n = N(t, h, tous.length ? numOfId(tous[0]) : null, tous.length > 1 ? numOfId(tous[tous.length - 1]) : null, c);
      n.integ = integ; n.tousIds = tous;
      return n;
    };
    return I.plan.map((p) => {
      const noeuds = (p.c || []).map(conv);
      const integ = (p.a || []).map((a) => code + "_" + a);
      const premier = integ[0] || (noeuds[0] && noeuds[0].tousIds[0]);
      const P = parseNum(numOfId(premier || ""));
      return { nom: p.t, noeuds, integ, pre: P && P.pre ? P.pre : undefined, integral: true };
    });
  };
  CR.integralDe = (code) => (CR.INTEGRAL || {})[code] || null;
  // Un article du texte intégral, qu'il soit ou non une fiche du jeu : { id, lib, alineas, officiel, cite, maj }
  CR.article = function (id) {
    const pre = String(id).split("_")[0], num = numOfId(id);
    const I = CR.integralDe(pre);
    const al = I && I.arts[num];
    const l = CR.lib ? CR.lib(id) : null;
    if (!al && !l) return null;
    const nom = I ? I.nom.charAt(0).toLowerCase() + I.nom.slice(1) : "";
    return { id, lib: l, alineas: al || String(l.texte || "").split("\n"), officiel: !!al, cite: l ? l.cite : `Art. ${num} du ${nom}`, maj: I ? I.maj : null };
  };
  CR.dateCode = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); return m ? `${+m[3] === 1 ? "1er" : +m[3]} ${["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"][+m[2] - 1]} ${m[1]}` : iso || ""; };

  const AVERIF = "à revérifier sur Légifrance";
  // { id: préfixe des identifiants, nom, parties: [{ nom, noeuds }] }
  CR.CODES_PLAN = [
    { id: "CP", nom: "Code pénal", parties: depuisIntegral("CP") || [{ nom: "Partie législative", noeuds: CP }, { nom: "Partie réglementaire", noeuds: CP_R, pre: "R" }] },
    { id: "CPP", nom: "Code de procédure pénale", parties: depuisIntegral("CPP") || [{ nom: "Partie législative", noeuds: CPP }] },
    { id: "CR", nom: "Code de la route", note: CR.integralDe("CR") ? null : "Seul le livre 2 (le conducteur) figure dans la bibliothèque du jeu.", parties: depuisIntegral("CR") || [{ nom: "Partie législative", noeuds: ROUTE, pre: "L" }, { nom: "Partie réglementaire", noeuds: ROUTE_R, pre: "R" }] },
    { id: "CJPM", nom: "Code de la justice pénale des mineurs", parties: depuisIntegral("CJPM") || [{ nom: "Partie législative", noeuds: CJPM, pre: "L" }] },
    { id: "CSP", nom: "Code de la santé publique", note: "Intitulés " + AVERIF + " (table des matières non relue).", parties: [{ nom: "Partie législative", pre: "L", noeuds: [G(N("Troisième partie", "Lutte contre les maladies et dépendances", "L3111-1", null, [G(N("Livre IV", "Lutte contre la toxicomanie", "L3411-1", null, [G(N("Titre II", "Dispositions pénales et mesures d'accompagnement", "L3421-1", null, [G(L("Chapitre Ier", "Dispositions pénales", "L3421-1"))]))]))]))] }] },
    { id: "CCOM", nom: "Code de commerce", parties: [{ nom: "Partie législative", pre: "L", noeuds: [G(N("Livre II", "Des sociétés commerciales et des groupements d'intérêt économique", "L210-1", null, [G(N("Titre IV", "Dispositions pénales", "L241-1", null, [L("Chapitre Ier", "Des infractions concernant les sociétés à responsabilité limitée", "L241-2", "L241-9")]))]))] }] },
    { id: "CGI", nom: "Code général des impôts", parties: [{ nom: "", noeuds: [G(N("Livre II", "Recouvrement de l'impôt", "1658", null, [G(N("Chapitre II", "Pénalités", "1725", null, [G(N("Section I", "Dispositions communes", "1725", null, [L("C", "Sanctions pénales", "1741", "1753 bis B")]))]))]))] }] },
    { id: "LPF", nom: "Livre des procédures fiscales", parties: [{ nom: "Première partie : partie législative", pre: "L", noeuds: [G(N("Titre III", "Le contentieux de l'impôt", "L190", null, [G(N("Chapitre II", "Les procédures pénales", "L226", null, [L("Section II", "Exercice des poursuites pénales", "L227")]))]))] }] },
    { id: "CSI", nom: "Code de la sécurité intérieure", parties: [{ nom: "Partie législative", pre: "L", noeuds: [G(N("Livre III", "Polices administratives spéciales", "L311-1", null, [G(N("Titre Ier", "Armes et munitions", "L311-1", null, [L("Chapitre VII", "Dispositions pénales", "L317-1", "L317-12")]))]))] }] },
    { id: "HORS", nom: "Textes hors codes", hors: true, parties: [{ nom: "", noeuds: [] }] },
  ];
  // Textes hors codes : un nœud par texte (préfixe de l'identifiant → intitulé officiel)
  CR.HORS_CODES = {
    L85: "Loi n° 85-677 du 5 juillet 1985 tendant à l'amélioration de la situation des victimes d'accidents de la circulation et à l'accélération des procédures d'indemnisation",
    L71: "Loi n° 71-1130 du 31 décembre 1971 portant réforme de certaines professions judiciaires et juridiques",
    D91: "Décret n° 91-1197 du 27 novembre 1991 organisant la profession d'avocat",
    RIN: "Règlement intérieur national de la profession d'avocat",
  };
  for (const c of CR.CODES_PLAN) c.integral = c.parties.some((p) => p.integral);
  const integraux = CR.CODES_PLAN.filter((c) => c.integral);
  CR.PLAN_SOURCE_MAIN = "Intitulés relevés le 9 novembre 2026 sur les tables des matières générées depuis Légifrance (codes.droit.org : code pénal éd. du 20 octobre 2026, code de procédure pénale éd. du 23 octobre 2026, code de la route éd. du 27 octobre 2026).";
  CR.PLAN_SOURCE = integraux.length ? `Texte intégral et plan officiel des articles en vigueur, générés depuis Légifrance (base LEGI, Licence Ouverte) par codes.droit.org : ${integraux.map((c) => `${c.nom.charAt(0).toLowerCase() + c.nom.slice(1)}, version du ${CR.dateCode(CR.integralDe(c.id).maj)}`).join(" ; ")}.${integraux.length < 4 ? " " + CR.PLAN_SOURCE_MAIN : ""}` : CR.PLAN_SOURCE_MAIN;

  // Clés stables des nœuds (code/partie/chemin) et ordre d'affichage
  (function indexer() {
    for (const c of CR.CODES_PLAN) c.parties.forEach((p, ip) => {
      const walk = (arr, key, path) => arr.forEach((n, i) => {
        n.key = `${key}.${i}`; n.code = c.id; n.path = path.concat(n);
        walk(n.c, n.key, n.path);
      });
      walk(p.noeuds, `${c.id}:${ip}`, []);
      p.key = `${c.id}:${ip}`;
    });
  })();
  const NODES = {};
  for (const c of CR.CODES_PLAN) for (const p of c.parties) { const w = (arr) => arr.forEach((n) => { NODES[n.key] = n; w(n.c); }); w(p.noeuds); }
  CR.planNode = (k) => NODES[k] || null;

  // =================================================================== Ranger un article dans le plan
  // Le nœud le plus profond dont la plage contient l'article ; une plage sans fin s'arrête au début de la division suivante.
  function placer(arr, num) {
    const avecDe = arr.filter((n) => n.de && parseNum(n.de));
    let best = null;
    for (let i = 0; i < avecDe.length; i++) {
      const n = avecDe[i];
      if (CR.cmpArticle(n.de, num) > 0) continue;
      if (parseNum(n.de).pre !== (parseNum(num) || {}).pre) continue;
      const suiv = avecDe.slice(i + 1).find((x) => CR.cmpArticle(x.de, n.de) > 0);
      if (n.a ? CR.cmpArticle(num, n.a) > 0 : suiv && CR.cmpArticle(num, suiv.de) >= 0) continue;
      best = n;
    }
    if (!best) return null;
    return placer(best.c, num) || best;
  }
  function partieDe(code, num) {
    const P = parseNum(num);
    if (!P) return null;
    const parties = code.parties;
    return parties.find((p) => (p.pre || "") === P.pre) || parties.find((p) => !p.pre && (P.pre === "" || P.pre === "L")) || parties[0];
  }
  let RANGE = null;
  // Rangement de toute la bibliothèque : CR.planOf(id) → { code, partie, node | null } ; node.arts = ids rangés là
  CR.ranger = function () {
    for (const k of Object.keys(NODES)) NODES[k].arts = [];
    for (const c of CR.CODES_PLAN) for (const p of c.parties) p.arts = [];
    const hors = CR.CODES_PLAN.find((c) => c.hors);
    hors.parties[0].noeuds = [];
    RANGE = {};
    const horsN = {};
    // Codes en texte intégral : chaque article à sa division ; node.tous = tous les articles, node.arts = les fiches du jeu
    const estFiche = new Set((CR.LIB || []).filter((e) => !CR.estJP(e.id)).map((e) => e.id));
    for (const c of CR.CODES_PLAN) if (c.integral) for (const p of c.parties) {
      p.tous = p.integ.slice();
      for (const id of p.integ) { RANGE[id] = { code: c, partie: p, node: null }; if (estFiche.has(id)) p.arts.push(id); }
      const w = (arr) => arr.forEach((n) => { n.tous = n.integ.slice(); for (const id of n.integ) { RANGE[id] = { code: c, partie: p, node: n }; if (estFiche.has(id)) n.arts.push(id); } w(n.c); });
      w(p.noeuds);
    }
    for (const e of CR.LIB || []) {
      if (CR.estJP(e.id)) continue;
      if (RANGE[e.id]) continue;
      const pre = String(e.id).split("_")[0];
      const num = numOfId(e.id);
      const code = CR.CODES_PLAN.find((c) => c.id === pre);
      if (code) {
        const p = partieDe(code, num);
        const n = p ? placer(p.noeuds, num) : null;
        (n ? n.arts : p ? p.arts : []).push(e.id);
        if (code.integral && (n || p)) (n || p).tous.push(e.id); // une fiche absente du texte intégral, rangée par sa plage
        RANGE[e.id] = { code, partie: p, node: n };
      } else if (CR.HORS_CODES[pre]) {
        if (!horsN[pre]) { horsN[pre] = N("", CR.HORS_CODES[pre]); horsN[pre].key = "HORS:0." + pre; horsN[pre].code = "HORS"; horsN[pre].path = [horsN[pre]]; horsN[pre].arts = []; NODES[horsN[pre].key] = horsN[pre]; hors.parties[0].noeuds.push(horsN[pre]); }
        horsN[pre].arts.push(e.id);
        RANGE[e.id] = { code: hors, partie: hors.parties[0], node: horsN[pre] };
      }
    }
    const tri = (a, b) => CR.cmpArticle(numOfId(a), numOfId(b));
    const rang = {};
    for (const c of CR.CODES_PLAN) if (c.integral) for (const p of c.parties) { let i = 0; p.tous.forEach((id) => { rang[id] = i++; }); const w = (arr) => arr.forEach((n) => { n.tous.forEach((id) => { rang[id] = i++; }); w(n.c); }); w(p.noeuds); }
    // l'ordre du code quand il est connu (« 16-1 A » après « 16-1 »), sinon l'ordre des numéros
    const triCode = (a, b) => (rang[a] != null && rang[b] != null ? rang[a] - rang[b] : tri(a, b));
    for (const k of Object.keys(NODES)) NODES[k].arts.sort(triCode);
    // Compte des textes (fiches du jeu), des articles du texte intégral et des arrêts sous chaque nœud
    const compter = (n) => { let t = n.arts.length, j = n.arts.reduce((x, id) => x + CR.notesOf(id).length, 0), a = (n.tous || n.arts).length; for (const c of n.c) { const r = compter(c); t += r.t; j += r.j; a += r.a; } n.nTextes = t; n.nArrets = j; n.nTous = a; return { t, j, a }; };
    for (const c of CR.CODES_PLAN) { c.nTextes = 0; c.nTous = 0; for (const p of c.parties) { p.nTextes = p.arts.length; p.nTous = (p.tous || p.arts).length; for (const n of p.noeuds) { compter(n); p.nTextes += n.nTextes; p.nTous += n.nTous; } c.nTextes += p.nTextes; c.nTous += p.nTous; } }
    return RANGE;
  };
  CR.planOf = (id) => { if (!RANGE) CR.ranger(); return RANGE[id] || null; };
  // Chemin lisible : « CPP › Livre Ier › Titre II › Chapitre Ier »
  CR.planChemin = (id, court) => {
    const r = CR.planOf(id);
    if (!r) return "";
    const parts = [r.code.nom].concat(r.code.parties.length > 1 && r.partie && r.partie.nom ? [r.partie.nom] : [], (r.node ? r.node.path : []).map((n) => (court ? n.t || n.h : `${n.t ? n.t + " : " : ""}${n.h}`)));
    return parts.join(" › ");
  };
  const showNum = (x) => String(x).replace(/^([LRD])(\d)/, "$1. $2");
  CR.planRange = (n) => (n.cache || !n.de ? "" : n.a ? `art. ${showNum(n.de)} à ${showNum(n.a)}` : `art. ${showNum(n.de)} et s.`);

  // =================================================================== Jurisprudence
  // jur : formation ; form : mention de publication de la Cour (F-B, FS-B, P+B+R+I) quand elle est vérifiée ; date ISO ; num : n° de pourvoi ou de décision ; solution ; pub : "B" (publié au Bulletin), "BRI"
  // (publié au Bulletin, au Rapport et sur internet), "I" (inédit) ou null (non vérifié) ; articles : ids de la bibliothèque
  // sous lesquels l'arrêt est annoté ; titrage : chaîne de mots-clés (le 2e sert de thème aux notes) ; sommaire : rédigé
  // pour le jeu, jamais recopié ; depasse : { par (id), loi, sur } ; appuie / contre : régimes d'irrégularité (CR.IRREG)
  // que l'arrêt soutient ou contredit ; verif : { le, src, niveau } (niveau : integral, commentaire, officiel, a_verifier).
  const V = (src, niveau) => ({ le: "9 novembre 2026", src, niveau });
  CR.JP = {
    JP_AP_2011_04_15: {
      form: "P+B+R+I",
      jur: "Cass. ass. plén.", date: "2011-04-15", num: "10-30.313", solution: "Rejet", pub: "BRI", temps: 25,
      titre: "Garde à vue sans avocat : application immédiate de la Convention",
      articles: ["CPP_63-3-1", "CPP_63-4-2", "CPP_802"], visas: ["art. 6 §§ 1 et 3 Conv. EDH", "art. 63-4 CPP (rédaction alors en vigueur)"],
      titrage: ["Garde à vue", "Droits de la personne gardée à vue", "Assistance de l'avocat", "Application immédiate de la Convention européenne des droits de l'homme"],
      sommaire: "Les États parties doivent tirer les conséquences des arrêts de la Cour européenne des droits de l'homme sans attendre d'être condamnés ni d'avoir changé leur loi. Pour que le droit à un procès équitable soit réel, la personne gardée à vue doit en principe pouvoir être assistée d'un avocat dès le début de la mesure et pendant ses auditions. L'assemblée plénière n'en reporte pas l'effet : une garde à vue menée sans cette assistance est irrégulière.",
      appuie: ["gav_audition_sans_avocat"], verif: V("texte intégral reproduit par la Revue générale du droit (arrêt n° 591, P+B+R+I)", "integral"),
    },
    JP_CRIM_2010_10_19: {
      jur: "Cass. crim.", date: "2010-10-19", num: "10-82.306", solution: "Cassation partielle sans renvoi", pub: null, temps: 20,
      titre: "Garde à vue et Convention : une application reportée",
      articles: ["CPP_63-3-1", "CPP_63-4-2"], visas: ["art. 6 Conv. EDH"],
      titrage: ["Garde à vue", "Droits de la personne gardée à vue", "Assistance de l'avocat", "Effet dans le temps"],
      sommaire: "La chambre criminelle admet que la Convention impose l'accès à un avocat dès le premier interrogatoire, sauf raisons impérieuses. Mais, par souci de sécurité juridique, elle refuse d'appliquer cette règle aux gardes à vue menées conformément à la loi alors en vigueur : la règle ne prendra effet qu'avec la réforme législative, au plus tard le 1er juillet 2011.",
      depasse: { par: "JP_AP_2011_04_15", sur: "le report dans le temps : l'assemblée plénière a appliqué la règle immédiatement le 15 avril 2011" },
      verif: V("texte de l'arrêt reproduit par la Revue générale du droit", "integral"),
    },
    JP_CC_2010_07_30: {
      jur: "Cons. const.", date: "2010-07-30", num: "2010-14/22 QPC", solution: "Non-conformité à effet différé", pub: "JO", temps: 25,
      titre: "Le régime de la garde à vue déclaré contraire à la Constitution",
      articles: ["CPP_63", "CPP_63-1", "CPP_63-3-1"], visas: ["art. 9 et 16 de la Déclaration de 1789", "art. 66 de la Constitution"],
      titrage: ["Garde à vue", "Régime de droit commun", "Question prioritaire de constitutionnalité", "Abrogation différée au 1er juillet 2011"],
      sommaire: "Le Conseil juge que le régime de droit commun de la garde à vue alors en vigueur ne conciliait plus de façon équilibrée la recherche des auteurs d'infractions et les libertés, notamment faute d'assistance effective d'un avocat et d'information sur le droit de se taire. Il reporte l'abrogation au 1er juillet 2011 pour laisser au législateur le temps de réformer.",
      verif: V("référence confirmée par le commentaire officiel publié par le Conseil constitutionnel", "commentaire"),
    },
    JP_CRIM_2001_05_10: {
      jur: "Cass. crim.", date: "2001-05-10", num: "01-81.441", solution: null, pub: null, temps: 15,
      titre: "Avis tardif au procureur : le grief est présumé",
      articles: ["CPP_63"], visas: ["art. 63 CPP"],
      titrage: ["Garde à vue", "Avis au procureur de la République", "Retard", "Grief présumé"],
      sommaire: "L'officier de police judiciaire doit informer le procureur de la République dès le début de la garde à vue. Un retard qu'aucune circonstance insurmontable n'explique porte nécessairement atteinte aux intérêts de la personne : il n'y a pas à prouver un grief.",
      appuie: ["gav_avis_parquet_tardif"], verif: V("cité par le cabinet Seban et associés (chronique sur l'avis au procureur)", "commentaire"),
    },
    JP_CRIM_2016_05_24: {
      jur: "Cass. crim.", date: "2016-05-24", num: "16-80.564", solution: null, pub: null, temps: 15,
      titre: "Avis au procureur : la règle du grief présumé confirmée",
      articles: ["CPP_63"], visas: ["art. 63 CPP"],
      titrage: ["Garde à vue", "Avis au procureur de la République", "Retard", "Grief présumé"],
      sommaire: "La chambre criminelle rappelle que tout retard dans l'avis au procureur du placement en garde à vue, s'il n'est pas justifié par une circonstance insurmontable, fait nécessairement grief à la personne gardée à vue.",
      appuie: ["gav_avis_parquet_tardif"], verif: V("cité par le cabinet Seban et associés (chronique sur l'avis au procureur)", "commentaire"),
    },
    JP_CRIM_2024_03_06: {
      form: "F-B",
      jur: "Cass. crim.", date: "2024-03-06", num: "22-80.895", solution: "Cassation", pub: "B", temps: 20,
      titre: "Avis au procureur : l'heure doit figurer au procès-verbal",
      articles: ["CPP_63", "CPP_802"], visas: ["art. 63, al. 2, CPP"],
      titrage: ["Garde à vue", "Avis au procureur de la République", "Preuve", "Heure de l'avis"],
      sommaire: "Un procès-verbal qui ne mentionne pas l'heure à laquelle le procureur a été avisé ne prouve pas que celui-ci a été informé dès le début de la mesure. Une cour d'appel ne peut pas écarter la nullité en se contentant d'affirmer que l'avis a été donné presque aussitôt.",
      portee: "Inflexion : des arrêts antérieurs se contentaient d'une mention du type « avisé immédiatement » sans heure.",
      appuie: ["gav_avis_parquet_tardif"], verif: V("commentaires du Monde du droit et du Mag juridique ; publication (F-B) d'après Dalloz actualité", "commentaire"),
    },
    JP_CRIM_2025_09_17: {
      form: "F-B",
      jur: "Cass. crim.", date: "2025-09-17", num: "25-80.555", solution: "Rejet", pub: "B", temps: 20,
      titre: "Ivresse du gardé à vue : la notification peut attendre",
      articles: ["CPP_63-1"], visas: ["art. 63-1 CPP", "art. R. 234-1 C. route"],
      titrage: ["Garde à vue", "Notification des droits", "Report", "Circonstance insurmontable : imprégnation alcoolique"],
      sommaire: "Les taux d'alcool mesurés suffisent à établir que la personne n'était pas en état de comprendre ses droits. Cette incapacité est une circonstance insurmontable qui permet de différer la notification jusqu'à ce que l'imprégnation alcoolique ait suffisamment baissé.",
      contre: ["gav_notif_tardive"], verif: V("commentaire du Monde du droit ; publication et solution (F-B, rejet) d'après la Gazette du Palais", "commentaire"),
    },
    JP_CRIM_2013_10_22: {
      jur: "Cass. crim.", date: "2013-10-22", num: "13-81.949", solution: "Cassation", pub: null, temps: 20,
      titre: "Géolocalisation : le contrôle d'un juge est nécessaire",
      articles: ["CPP_230-33"], visas: ["art. 8 Conv. EDH"],
      titrage: ["Géolocalisation", "Contrôle de l'autorité judiciaire", "Procureur de la République", "Article 8 de la Convention"],
      sommaire: "Suivre une personne en temps réel par son téléphone est une ingérence dans sa vie privée assez grave pour exiger le contrôle d'un juge. Le procureur de la République n'en est pas un au sens de la Convention : une géolocalisation qu'il a seul autorisée encourt l'annulation.",
      depasse: { loi: "loi n° 2014-372 du 28 mars 2014", sur: "le texte applicable : la géolocalisation est désormais régie par les art. 230-32 et suivants du code de procédure pénale, qui organisent l'intervention du JLD" },
      appuie: ["geolocalisation_sans_autorisation"], verif: V("commentaire du Monde du droit (ECLI:FR:CCASS:2013:CR05238)", "commentaire"),
    },
    JP_CRIM_2021_09_07: {
      form: "FS-B",
      jur: "Cass. crim.", date: "2021-09-07", num: "21-80.642", solution: "Cassation", pub: "B", temps: 25,
      titre: "Nullités : qui peut agir, et quel grief prouver",
      articles: ["CPP_56", "CPP_171", "CPP_802"], visas: ["art. 56, 57, 171 et 802 CPP"],
      titrage: ["Nullités", "Qualité pour agir", "Perquisition et saisie", "Procès-verbal non signé", "Grief"],
      sommaire: "La partie poursuivie à partir des objets saisis a qualité pour invoquer l'absence de signature du procès-verbal de perquisition et de saisie, même sans droit sur les lieux. Mais être mise en cause par l'acte ne suffit pas à prouver un grief : il faut contester la présence des objets lors de l'opération.",
      portee: "Revirement sur la qualité pour agir, autrefois réservée au titulaire d'un droit sur les lieux perquisitionnés.",
      verif: V("commentaire de LexisVeille ; formation et publication (FS-B)", "commentaire"),
    },
    JP_CRIM_2021_09_07_B: {
      form: "FS-B",
      jur: "Cass. crim.", date: "2021-09-07", num: "20-87.191", solution: "Rejet", pub: "B", temps: 20,
      titre: "Nullités : le même raisonnement, sans cassation",
      articles: ["CPP_171", "CPP_802"], visas: ["art. 171 et 802 CPP"],
      titrage: ["Nullités", "Qualité pour agir", "Grief"],
      sommaire: "Rendu le même jour, cet arrêt applique la même méthode en trois temps (qualité pour agir, irrégularité, grief) mais ne casse pas : faute de grief démontré, la nullité est écartée.",
      verif: V("commentaire de LexisVeille ; formation et publication (FS-B)", "commentaire"),
    },
    JP_CRIM_2025_09_16: {
      jur: "Cass. crim.", date: "2025-09-16", num: "24-87.080", solution: null, pub: null, temps: 15,
      titre: "Procès-verbal non signé par l'OPJ : pas de nullité sans grief",
      articles: ["CPP_802"], visas: ["art. 802 CPP"],
      titrage: ["Nullités", "Procès-verbal", "Signature de l'officier de police judiciaire", "Grief"],
      sommaire: "L'absence de signature de l'officier de police judiciaire sur un procès-verbal n'en entraîne l'annulation que si elle a porté atteinte aux intérêts de la personne. Une attestation de conformité établie après coup ne régularise pas l'acte.",
      verif: V("chronique des nullités 2025 d'un avocat du barreau de Colmar (consultation.avocat.fr)", "commentaire"),
    },
    JP_CRIM_2025_11_18: {
      jur: "Cass. crim.", date: "2025-11-18", num: "25-82.629", solution: null, pub: null, temps: 20,
      titre: "Avocat différé : la décision doit être écrite et motivée",
      articles: ["CPP_706-88", "CPP_63-3-1"], visas: ["art. 706-88 CPP"],
      titrage: ["Garde à vue", "Criminalité organisée", "Report de l'intervention de l'avocat", "Motivation"],
      sommaire: "Le report de l'intervention de l'avocat en criminalité organisée suppose une décision écrite et motivée ou, si elle est orale, consignée avec ses motifs et sa durée. À défaut, l'atteinte aux droits de la personne est établie.",
      appuie: ["avocat_differe_non_motive"], verif: V("chronique des nullités 2025 d'un avocat du barreau de Colmar (consultation.avocat.fr)", "commentaire"),
    },
    JP_CRIM_2025_12_02: {
      jur: "Cass. crim.", date: "2025-12-02", num: "25-81.132", solution: null, pub: null, temps: 20,
      titre: "Géolocalisation poursuivie à l'étranger : nullité d'ordre public",
      articles: ["CPP_230-33", "CPP_802"], visas: ["art. 230-32 CPP"],
      titrage: ["Géolocalisation", "Poursuite sur un territoire étranger", "Souveraineté", "Nullité d'ordre public"],
      sommaire: "Les données d'une géolocalisation en temps réel poursuivie sur le territoire d'un autre État, au mépris de sa souveraineté, peuvent être contestées par toute partie, sans avoir à démontrer un grief.",
      verif: V("chronique des nullités 2025 d'un avocat du barreau de Colmar (consultation.avocat.fr)", "commentaire"),
    },
    // Arrêts déjà présents dans le jeu (texts.js, cat-base.js) : rangés et décrits ici, leur texte reste celui de la base
    JP_CRIM_2026_06_23: {
      jur: "Cass. crim.", date: "2026-06-23", num: "25-87.950", solution: null, pub: null, temps: 30,
      titre: "Prescription suspendue au profit de la victime",
      articles: ["CPP_8", "CPP_85"], titrage: ["Prescription de l'action publique", "Suspension", "Plainte simple", "Délai de trois mois de l'art. 85"],
      verif: V("cité par 21 avocats (source du jeu, antérieure)", "commentaire"),
    },
    JP_AP_1995: {
      jur: "Cass. ass. plén.", date: "1995-11-10", num: "94-13.912", solution: null, pub: null, temps: 25,
      titre: "La faute inexcusable de la victime",
      articles: ["L85_3"], titrage: ["Accident de la circulation", "Victime non conductrice", "Faute inexcusable", "Définition"],
      verif: V("référence à vérifier sur Judilibre", "a_verifier"),
    },
    JP_CRIM_1993_03_11: {
      jur: "Cass. crim.", date: "1993-03-11", num: null, solution: null, pub: null, temps: 20,
      titre: "La délégation de pouvoirs",
      articles: ["CP_121-2"], titrage: ["Responsabilité pénale", "Chef d'entreprise", "Délégation de pouvoirs", "Conditions"],
      verif: V("référence à vérifier sur Judilibre", "a_verifier"),
    },
    JP_CRIM_2021_12_15: {
      jur: "Cass. crim.", date: "2021-12-15", num: "21-81.864", solution: null, pub: null, temps: 20,
      titre: "Le cumul de qualifications pour un même fait",
      articles: ["CP_132-2"], titrage: ["Concours d'infractions", "Cumul de qualifications", "Même fait", "Qualification la plus haute"],
      verif: V("référence à vérifier sur Judilibre", "a_verifier"),
    },
    JP_CRIM_1997_05_05: {
      jur: "Cass. crim.", date: "1997-05-05", num: null, solution: null, pub: null, temps: 20,
      titre: "La prescription de l'abus de biens sociaux",
      articles: ["CCOM_L241-3", "CPP_8"], titrage: ["Abus de biens sociaux", "Prescription", "Point de départ", "Présentation des comptes"],
      verif: V("référence à vérifier sur Judilibre", "a_verifier"),
    },
    JP_CRIM_2008_02_20: {
      jur: "Cass. crim.", date: "2008-02-20", num: null, solution: null, pub: null, temps: 20,
      titre: "Le blanchiment de fraude fiscale sans plainte",
      articles: ["CP_324-1", "LPF_L228"], titrage: ["Blanchiment", "Fraude fiscale", "Plainte de l'administration", "Délit autonome"],
      verif: V("référence à vérifier sur Judilibre", "a_verifier"),
    },
  };
  CR.estJP = (id) => /^JP_/.test(String(id || ""));
  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const MOIS_C = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juill.", "août", "sept.", "oct.", "nov.", "déc."];
  CR.jpDate = (j, court) => { const [y, m, d] = j.date.split("-").map(Number); return `${d === 1 ? "1er" : d} ${(court ? MOIS_C : MOIS)[m - 1]} ${y}`; };
  const JUR_COURT = { "Cass. crim.": "Crim.", "Cass. ass. plén.": "Ass. plén.", "Cons. const.": "Cons. const." };
  // « Cass. crim., 6 mars 2024, n° 22-80.895 » ; court : « Crim. 6 mars 2024 »
  CR.jpCite = (id, court) => {
    const j = CR.JP[id];
    if (!j) return id;
    if (court) return `${JUR_COURT[j.jur] || j.jur} ${CR.jpDate(j, true)}`;
    return `${j.jur}, ${CR.jpDate(j)}${j.num ? (j.jur === "Cons. const." ? `, n° ${j.num}` : `, n° ${j.num}`) : ""}`;
  };
  CR.PUB_LABEL = { B: "Publié au Bulletin", BRI: "Publié au Bulletin et au Rapport", JO: "Publiée au Journal officiel", I: "Inédit" };
  CR.VERIF_LABEL = { integral: "Texte intégral lu", commentaire: "Vérifié sur commentaires", officiel: "Vérifié sur source officielle", a_verifier: "À vérifier" };

  // Inscription des arrêts dans la base des textes et dans la bibliothèque (cartes jouables, enregistrement dans un dossier)
  CR.installerJP = function () {
    CR.TEXTES = CR.TEXTES || {};
    for (const [id, j] of Object.entries(CR.JP)) {
      j.id = id;
      const cite = CR.jpCite(id);
      if (!CR.TEXTES[id]) CR.TEXTES[id] = { cite, texte: j.sommaire || "", etat: "texte" };
      else { CR.TEXTES[id].cite = cite; if (!j.sommaire) j.sommaire = CR.TEXTES[id].texte; }
      const art = j.articles[0];
      const lib = (CR.LIB || []).find((x) => x.id === art);
      const e = (CR.LIB || []).find((x) => x.id === id);
      if (e) { e.titre = j.titre; e.temps = j.temps; e.jp = true; }
      else if (CR.LIB) CR.LIB.push({ id, titre: j.titre, domaine: lib ? lib.domaine : "pp_jugement", temps: j.temps, jp: true });
    }
  };

  // Notes sous un article : groupées par thème (2e terme du titrage), dans l'ordre des dates à l'intérieur d'un thème
  let NOTES = null;
  CR.notesOf = function (artId) {
    if (!NOTES) {
      NOTES = {};
      const par = {};
      for (const j of Object.values(CR.JP)) for (const a of j.articles) (par[a] = par[a] || []).push(j);
      for (const [a, js] of Object.entries(par)) {
        const themes = [];
        for (const j of js.slice().sort((x, y) => (x.date < y.date ? -1 : 1))) { const th = j.titrage[1] || j.titrage[0]; if (!themes.includes(th)) themes.push(th); }
        const rows = [];
        themes.forEach((th, ti) => js.filter((j) => (j.titrage[1] || j.titrage[0]) === th).sort((x, y) => (x.date < y.date ? 1 : -1)).forEach((j) => rows.push({ n: rows.length + 1, theme: th, ti, jp: j.id })));
        NOTES[a] = rows;
      }
    }
    return NOTES[artId] || [];
  };
  CR.noteNum = (artId, jpId) => { const r = CR.notesOf(artId).find((x) => x.jp === jpId); return r ? r.n : null; };

  // =================================================================== Index alphabétique (table analytique)
  // Entrées : les mots-clés des arrêts (« Garde à vue — Avis au procureur — Retard → CPP, art. 63, note 2 ») et les
  // titres des articles (« Vol → CP, art. 311-1 »).
  CR.indexAnalytique = function () {
    const E = {};
    const add = (mot, sous, cible) => { const k = mot.trim(); (E[k] = E[k] || []).push({ sous, cible }); };
    for (const [id, j] of Object.entries(CR.JP)) for (const a of j.articles) {
      if (!CR.lib(a)) continue;
      add(j.titrage[0], j.titrage.slice(1).join(" — "), { art: a, jp: id, note: CR.noteNum(a, id) });
      if (j.titrage[1]) add(j.titrage[1], j.titrage[0], { art: a, jp: id, note: CR.noteNum(a, id) });
    }
    for (const e of CR.LIB || []) {
      if (CR.estJP(e.id)) continue;
      const t = e.titre.replace(/^(L'|Le |La |Les |Un |Une )/, "");
      add(t.charAt(0).toUpperCase() + t.slice(1), "", { art: e.id });
    }
    const fold = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    return Object.keys(E).sort((a, b) => fold(a).localeCompare(fold(b), "fr")).map((mot) => ({ mot, lettre: fold(mot).charAt(0).toUpperCase(), refs: E[mot] }));
  };

  // =================================================================== Saisie d'un arrêt (à l'audience, mode saisie)
  // Reconnaît le n° de pourvoi (« 22-80.895 », « 2280895 ») ou la formation et la date (« Crim. 6 mars 2024 », « 06/03/2024 »).
  CR.parseJP = function (input) {
    const t = String(input || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    if (!t.trim()) return { vide: true };
    const ids = Object.keys(CR.JP);
    const chiffres = (s) => String(s || "").replace(/\D/g, "");
    const nm = t.match(/(\d{2})\s*-?\s*(\d{2})\s*\.?\s*(\d{3})\b/) || t.match(/\b(20\d{2})-(\d{2})\/(\d{2})\b/);
    if (nm) { const c = nm.slice(1).join(""); const id = ids.find((k) => chiffres(CR.JP[k].num) === c || chiffres(CR.JP[k].num).startsWith(c)); return id ? { id, par: "num" } : { inconnu: true }; }
    let d = null;
    const md = t.match(/\b(\d{1,2})(?:er)?\s+(janv(?:ier)?|fevr(?:ier)?|mars|avr(?:il)?|mai|juin|juil(?:let)?|aout|sept(?:embre)?|oct(?:obre)?|nov(?:embre)?|dec(?:embre)?)\.?\s+(\d{4})\b/);
    if (md) { const mi = ["janv", "fevr", "mars", "avr", "mai", "juin", "juil", "aout", "sept", "oct", "nov", "dec"].findIndex((m) => md[2].startsWith(m)); d = `${md[3]}-${String(mi + 1).padStart(2, "0")}-${md[1].padStart(2, "0")}`; }
    const mn = t.match(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/);
    if (!d && mn) d = `${mn[3]}-${mn[2].padStart(2, "0")}-${mn[1].padStart(2, "0")}`;
    if (!d) return { illisible: true };
    const jur = /plen|pleniere/.test(t) ? "Cass. ass. plén." : /cons|constit|qpc/.test(t) ? "Cons. const." : /crim/.test(t) ? "Cass. crim." : null;
    const cands = ids.filter((k) => CR.JP[k].date === d && (!jur || CR.JP[k].jur === jur));
    if (cands.length === 1) return { id: cands[0], par: "date" };
    if (cands.length > 1) return { ambigu: cands, date: d };
    return { inconnu: true, date: d, jur };
  };
  // ok : bon arrêt ; voisin : même formation, autre arrêt sur le même article ; faux ; absent
  CR.gradeJP = function (p, attendu) {
    if (!p || !p.id) return { g: "absent" };
    if (p.id === attendu) return { g: "ok" };
    const a = CR.JP[attendu], b = CR.JP[p.id];
    if (a && b && a.articles.some((x) => b.articles.includes(x))) return { g: "voisin" };
    return { g: "faux" };
  };

  // =================================================================== Effets en jeu
  // L'arrêt enregistré dans le dossier qui soutient (ou contredit) un régime d'irrégularité
  CR.jpAppui = function (s, cs, irreg) {
    if (!s || !cs || !CR.pinnedTexts) return null;
    const ids = CR.pinnedTexts(s, cs).filter((id) => CR.JP[id] && (CR.JP[id].appuie || []).includes(irreg));
    const bons = ids.filter((id) => !CR.JP[id].depasse);
    return bons.length ? CR.JP[bons[0]] : null;
  };
  // Un arrêt dépassé : la solution abandonnée est connue du joueur s'il a lu l'arrêt qui l'a remplacée
  CR.jpDepasseConnu = (s, id) => { const j = CR.JP[id]; return !!(j && j.depasse && (!j.depasse.par || (s && s.researched || []).includes(j.depasse.par))); };

  // Domaine (programme) d'un texte ajouté par les fiches, d'après sa place dans le code (corrige l'ancien rangement en « dps »)
  CR.domaineAuto = function (id) {
    const pre = String(id).split("_")[0], num = numOfId(id), P = parseNum(num);
    if (!P) return "dps";
    if (pre === "CP") return P.pre === "" && P.n[0] < 200 ? "dpg" : "dps";
    if (pre === "CJPM") return "pp_jugement";
    if (pre !== "CPP") return "dps";
    const x = P.n[0];
    if (x <= 10 || (x >= 31 && x <= 48)) return "pp_action";
    if ((x >= 12 && x <= 30) || (x >= 53 && x < 79) || x === 230 || (x === 706 && (P.n[1] || 0) >= 73 && (P.n[1] || 0) <= 106)) return "pp_enquete";
    if (x >= 79 && x < 231) return "pp_instruction";
    if ((x >= 496 && x <= 520) || (x >= 567 && x <= 626)) return "pp_recours";
    if (x >= 707 && x <= 800) return "pp_peine";
    return "pp_jugement";
  };

  // Mise en place : les arrêts, puis le domaine des textes des fiches, puis le rangement
  CR.installerJP();
  for (const e of CR.LIB || []) if (e.gen && !CR.estJP(e.id)) e.domaine = CR.domaineAuto(e.id);
  NOTES = null;
  CR.ranger();
  // Le libellé d'un arrêt dans la fiche de révision et le classeur
  const keyLabel0 = CR.keyLabel;
  CR.keyLabel = (k) => (CR.JP && CR.JP[k] ? CR.jpCite(k) : keyLabel0 ? keyLabel0(k) : k);
})();
