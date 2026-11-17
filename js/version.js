/* La Permanence — numérotation des versions et notes de mise à jour.
   Comme dans les grands jeux : MAJEUR.MINEUR.CORRECTIF, un nom par mise à jour de contenu, un numéro de build, un canal.
   - MAJEUR : 0 tant que le jeu n'est pas sorti officiellement ; 1 à la sortie 1.0 (checklist de SORTIE_1.0.md cochée et
     refonte du gameplay menée jusqu'au pilote jugé par Kevin) ; 2 pour une refonte d'ampleur après la sortie.
   - MINEUR : une mise à jour de contenu, qui change la façon de jouer ou ajoute un pan du jeu (un lot de la refonte, par
     exemple) ; elle porte un nom (« La parole »).
   - CORRECTIF : corrections et réglages sans contenu nouveau.
   - Build : le numéro de publication (nombre de commits de la branche) ; c'est lui que l'app compare pour se mettre à jour.
     L'app Mac le transmet à la page (?build=…&canal=…) ; dans le navigateur de développement, il n'est pas connu.
   - Canal : un seul (publications « jeu-N »), depuis le commit poussé ; plus de version « bêta ».
   Référence complète affichée : « 0.9.0.167 » (version et build), comme les numéros de build des consoles.
   À chaque publication : le correctif monte pour des corrections ; le mineur monte (correctif à 0) pour du contenu, avec un
   nom et ses notes en tête de HISTORIQUE ; tests/tson.js vérifie la cohérence (version = première entrée, ordre). */
(function () {
  const CR = (window.CR = window.CR || {});

  // les mises à jour, la plus récente d'abord
  const HISTORIQUE = [
    {
      version: "1.5.3", nom: "", date: "17 novembre 2026", type: "correctif", // livraison de la 1.5 « La preuve filmée » (D-101)
      resume: "La preuve filmée, quatrième livraison : le distributeur de billets, le guichet de la banque, la sonnette connectée.",
      notes: [
        "Le distributeur : sa caméra fait face au client, de tout près. La banque joint le journal des retraits ; quand l'horloge de la caméra est décalée, les heures ne concordent plus.",
        "Retraits avec la carte d'une victime (faux conseiller, fausse annonce, fausse location), mule bancaire qui enchaîne les cartes, tuteur qui retire l'argent de la personne protégée.",
        "Le guichet : dépôt d'espèces, ouverture d'un compte avec une fausse identité, faux bulletins de paie pour un prêt, voisin qui accompagne une personne âgée et parle à sa place.",
        "La sonnette connectée, avec le son, en infrarouge la nuit : l'ex qui tambourine malgré l'interdiction, le faux artisan, le faux policier ou le faux plombier qu'on laisse entrer, le parent qui vient chercher l'enfant et à qui l'on n'ouvre pas.",
        "Les affaires tirées avant cette version gardent leurs vidéos et leurs pièces.",
      ],
    },
    {
      version: "1.5.2", nom: "", date: "17 novembre 2026", type: "correctif", // livraison de la 1.5 « La preuve filmée » (D-101)
      resume: "La preuve filmée, troisième livraison : les caméras intérieures — le hall d'un immeuble, un parking souterrain, un bus.",
      notes: [
        "Le hall d'immeuble : la caméra s'éveille au mouvement. Quelqu'un entre, monte, et ressort vingt minutes plus tard un sac à la main : cambriolage, faux policier ou faux plombier, vol au préjudice d'une personne âgée.",
        "Le parking souterrain : la dispute près de la voiture, le bras saisi, la poussée (violences conjugales).",
        "Le bus : des coups dans l'allée ; une personne qui s'assoit contre une autre alors que des places sont libres (harcèlement, outrage sexiste). Les passagers assis font face à la caméra.",
        "Une faille nouvelle : l'horloge de l'enregistreur avance ou retarde de quelques minutes sur l'heure légale. Toute comparaison d'horaires (un appel, un témoignage, un alibi) doit en tenir compte.",
        "Les images d'un hall, d'un parking ou d'un bus sont écrasées au bout d'un mois : une réquisition tardive ne trouve plus rien.",
        "Le recel découvert lors d'un contrôle de police est filmé par la caméra-piéton.",
        "Les affaires tirées avant cette version gardent leurs vidéos et leurs pièces.",
      ],
    },
    {
      version: "1.5.1", nom: "", date: "17 novembre 2026", type: "correctif", // livraison de la 1.5 « La preuve filmée » (D-101) : un nom seulement pour la x.y.0
      resume: "La preuve filmée, deuxième livraison : les témoins et les victimes filment au téléphone : dans la rue, et chez soi, où aucune caméra ne voyait rien.",
      notes: [
        "La vidéo d'un témoin qui filme une bagarre, souvent une fois qu'elle a commencé : le premier coup manque, et avec lui la réponse à « qui a commencé ? ».",
        "La victime filme chez elle : la dispute, les menaces, les insultes ; parfois un geste, et le téléphone part vers le sol. Violences conjugales, harcèlement et menaces dans le couple, ordonnance de protection non respectée.",
        "La victime filme dans la rue le voisin ou l'inconnu qui la menace.",
        "Le « happy slapping » retrouvé sur un réseau social, filmé par celui qui accompagne l'auteur.",
        "Vidéo verticale, tenue à la main, avec le son en sous-titres ; la personne qui filme n'est pas à l'image. La position dans le fichier remplace l'horodatage.",
        "Les failles : le début manque, l'enregistrement s'arrête pendant la scène, seule une copie a été exploitée (l'original et ses métadonnées ne sont pas vérifiés).",
        "Les affaires tirées avant cette version gardent leurs vidéos et leurs pièces.",
      ],
    },
    {
      version: "1.5.0", nom: "La preuve filmée", date: "17 novembre 2026", type: "contenu",
      resume: "Les affaires de rue et les contrôles de police ont leur vidéo : on la regarde, on l'arrête, on agrandit un visage, et on la confronte au procès-verbal.",
      notes: [
        "Vidéoprotection de la voie publique : une rue commerçante, la terrasse d'un bar, une place. Coups, dégradations, vol à la tire, échange de stupéfiants, menaces, et l'interpellation qui peut suivre.",
        "Caméra-piéton des policiers : contrôles routiers (alcool, stupéfiants, permis), contrôles et interpellations sur la voie publique, avec le son en sous-titres.",
        "Les personnes de l'affaire ont leur visage à l'image : celui de leur portrait au dossier.",
        "À l'arrêt sur image, « Agrandir » une personne : la caméra resserre sur elle, au grain réel du capteur. De près, le visage se lit ; de loin, il reste une tache.",
        "Images refaites : personnages en volume, éclairés comme le décor ; immeubles en pierre de taille, vitrines et enseignes, balcons, trottoirs, passages piétons, voitures, ombres au soleil ; image plus fine.",
        "Les failles sont dans les images : qui frappe le premier, une chute, des enregistrements effacés faute de réquisition dans le mois, une caméra-piéton déclenchée trop tard ou sans information de la personne, une ressemblance qui n'est pas une identification.",
        "Les anciennes affaires gardent leurs pièces ; leurs vidéos profitent des nouvelles images.",
      ],
    },
    {
      version: "1.4.0", nom: "Le premier appel", date: "17 novembre 2026", type: "contenu",
      resume: "La première semaine est conduite : le téléphone sonne dès la première nuit, et plus aucun client n'attend sans que vous le sachiez.",
      notes: [
        "Le service des permanences inscrit d'office le nouvel avocat à la garde à vue de la première nuit : le téléphone sonne, comme l'écran titre le promet.",
        "Le courrier de l'Ordre porte un bouton « S'inscrire aux permanences ».",
        "Au troisième jour, si vous n'avez pris aucune permanence, Me Varenne vous appelle.",
        "Au bureau, un bandeau dit qui attend votre réponse et jusqu'à quand, et combien de messages vocaux restent à écouter.",
        "« Avancer » s'arrête sur tout client qui attend d'être rappelé, et dit pourquoi il s'arrête.",
        "La veille du jour où il prendra un autre avocat, le client laisse un message : une ligne au journal ne suffisait pas.",
        "« Assisté » est coché par défaut à la première carrière, « Libre » ensuite.",
        "Au premier jour, deux courriers seulement : l'Ordre et Me Varenne. La banque écrit la veille des premières charges, la note sur le cabinet arrive avec le premier dossier.",
      ],
    },
    {
      version: "1.3.0", nom: "Les visages et les noms", date: "17 novembre 2026", type: "contenu",
      resume: "Votre avocat se compose pièce par pièce, et les gens que vous croisez ont des visages et des noms qu'on distingue.",
      notes: [
        "L'atelier du visage, à la création de la carrière : peau, forme du visage, carrure, coupe et couleur des cheveux, sourcils, yeux, nez, bouche, barbe, lunettes, boucles d'oreilles, collier, couvre-chef, traits, tenue de ville.",
        "Rien n'y est réservé à un sexe ni à une origine. « Au hasard » pour un menu, ou pour tout.",
        "L'atelier se rouvre depuis le menu de la partie (« Votre apparence ») : changer de coupe, mettre des lunettes, vieillir, sans toucher à la partie.",
        "La robe à l'audience ; votre tenue de ville au cabinet et en garde à vue. Vu de dos, votre avocat a sa coupe, sa couleur, ses lunettes et sa barbe.",
        "Une banque de pièces deux fois plus grande dans chaque menu (47 coupes, 20 couleurs de cheveux, 17 montures, 40 traits), la même pour tous les personnages du jeu : cinq fois plus de visages distincts.",
        "Des noms pour tout le monde : 785 noms de famille et 710 prénoms, à l'image de l'Île-de-France d'aujourd'hui, avec leur fréquence.",
        "Les prénoms suivent l'âge : Josiane et Gérard ont soixante-dix ans, Léa et Rayan en ont vingt. Le prénom et le nom vont ensemble, avec environ un assemblage mixte sur six, comme dans la vie.",
        "Les familles portent le même nom ; une épouse peut porter le nom de son mari, et son nom de naissance reste le sien. Jamais deux personnes du même nom dans une affaire, jamais votre nom à un inconnu.",
        "Les carrières en cours gardent votre visage, et tous les visages et les noms déjà rencontrés. Les nouveautés viennent avec les nouvelles affaires.",
        "Les codes d'affaire d'avant se rejouent à l'identique ; les nouveaux codes portent le n° 5 du générateur.",
      ],
    },
    {
      version: "1.2.0", nom: "Le carnet", date: "16 novembre 2026", type: "contenu",
      resume: "Le carnet refait : chaque phrase notée garde son contexte, et se retrouve vite.",
      notes: [
        "Chaque note dit qui parle, dans quelle situation, quel jour et à quelle heure.",
        "Une réponse notée garde la question qui l'a amenée, la vôtre ou celle de l'officier.",
        "Une note prise dans une pièce garde sa cote, son feuillet et le titre de la pièce.",
        "Le carnet se range par situation (entretien, audition, appel, audience), par personne ou par catégorie.",
        "Une recherche par mot : dans la phrase, la question, le nom de celui qui parle ou votre titre.",
        "Vous pouvez donner votre propre titre à une note : ce que vous en retenez, en quelques mots.",
        "À l'audience, chaque note de votre main dit d'où elle vient et porte votre titre.",
        "Le carnet ne choisit rien à votre place : toutes les notes reçoivent le même contexte, utiles ou non.",
        "Les notes des parties déjà commencées restent lisibles ; elles n'ont que leur source.",
      ],
    },
    {
      version: "1.1.0", nom: "L'accueil", date: "16 novembre 2026", type: "contenu",
      resume: "Le menu principal retravaillé : une vraie nuit de permanence à la fenêtre du cabinet.",
      notes: [
        "Le décor du cabinet ne suit plus la souris. Les objets réagissent toujours quand on les survole ou qu'on les clique.",
        "Une nouvelle vue par la fenêtre : la nuit de pluie sur le 17e, l'immeuble d'en face et ses lucarnes allumées, le tribunal des Batignolles, le Sacré-Cœur et la tour Eiffel au loin.",
        "C'est toujours la nuit de permanence : dans la journée, la fenêtre montre le crépuscule ; à partir de 21 heures, la nuit pleine.",
        "La pièce est plus sombre : la lampe du bureau est la seule lumière chaude, le téléphone attend dessous, le dossier est ouvert.",
        "La fenêtre a deux grands vantaux au lieu de six carreaux.",
        "Les jeux cachés dans le décor ne sont plus signalés par des flèches : un éclat discret, et leur nom au survol.",
        "Le titre tient en entier à toutes les tailles d'écran.",
        "« Reprendre » ou « Nouvelle partie » domine le menu ; les autres entrées se rangent en dessous.",
        "L'écran de création tient dans l'écran : le titre reste visible, les deux carrières sont côte à côte.",
        "Sur un écran étroit, le décor n'est plus étiré.",
      ],
    },
    {
      version: "1.0.1", nom: "", date: "16 novembre 2026", type: "correctif",
      resume: "Relecture des textes : les incohérences les plus fréquentes sont corrigées.",
      notes: [
        "Au dépôt, le lendemain de la garde à vue, le client dit « hier matin » et non plus « ce matin ».",
        "Les heures se disent comme on les dit : « quatre heures moins le quart de l'après-midi ».",
        "En garde à vue, le client ne revient plus sur des aveux qu'il n'a pas encore faits.",
        "L'avocat n'interroge sur un contrôle d'identité que s'il y en a eu un, et donne à l'officier son vrai grade.",
        "Un client retenu ne parle plus de son téléphone qui sonne ; au téléphone, plus de gestes qu'on ne peut pas voir.",
        "Témoins : plus d'audition sans déclaration. Accords corrigés dans les certificats et les procès-verbaux.",
        "L'âge annoncé s'accorde à la date de naissance ; un indépendant ne « perd » plus « sa place ».",
        "Ordonnance pénale : la question sur les craintes du client n'est plus posée deux fois.",
        "Le courrier de l'Ordre dit où s'inscrire aux permanences : sur la carte, à la Maison du barreau.",
        "Le bandeau « Mini-jeux » quitte l'écran titre ; les jeux restent cachés dans le décor du cabinet.",
        "Un seul jeu : plus de canal d'essai. Chaque mise à jour publiée se télécharge toute seule au lancement, sans réglage.",
      ],
    },
    {
      version: "1.0.0", nom: "Le serment", date: "16 novembre 2026", type: "contenu",
      resume: "La sortie officielle : la carrière complète, de la première permanence au jugement et à ses suites.",
      notes: [
        "La Permanence sort de la bêta : toutes les affaires viennent du générateur, de la garde à vue au jugement, à l'appel et à l'application des peines.",
        "Consultation au cabinet, parole du client, audition intégrale, plaidoirie, délibéré : les mises à jour « La parole » et « La consultation » sont comprises.",
        "Sauvegardes fiables à tout instant, fichiers abîmés refusés proprement, carrières de cinq ans vérifiées.",
        "Essai d'endurance : des milliers de clics au hasard dans un vrai navigateur, audiences comprises, sans une erreur.",
        "Mises à jour par deux canaux : le canal stable pour jouer, le canal d'essai pour les versions en préparation.",
      ],
    },
    {
      version: "0.10.0", nom: "La consultation", date: "16 novembre 2026", type: "contenu",
      resume: "Au cabinet, on pose une question écrite en entier, et le client répond à cette question.",
      notes: [
        "Rendez-vous au cabinet, appels, dépôt, parloir : un moteur de consultation remplace la composition sujet, angle, forme, réservée à la garde à vue.",
        "On choisit un thème (la procédure, les faits, l'enquête, les antécédents, la situation…), puis une question rédigée : on sait ce qu'on demande.",
        "Chaque question a sa réponse et ne se pose qu'une fois : le client ne dit plus « je vous l'ai déjà dit ».",
        "Une réponse ouvre des questions de suite : l'heure, le lieu, le déroulé, les raisons, les témoins, les justificatifs.",
        "Les réactions de caractère ne tombent plus au hasard : le client ne demande « pourquoi vous me demandez ça ? » que sur une question qui s'y prête, et vous pouvez lui répondre.",
        "Une question ne se propose que si la discussion l'a ouverte : la garde à vue quand le client en a parlé, les preuves et les précisions après son récit ; un thème qui s'ouvre est signalé « nouveau ».",
        "On ne demande plus « pourquoi avez-vous fait ça ? » à celui qui vient de nier ; celui qui cache son casier le cache à la question sur ses antécédents.",
        "Le client prévient à voix haute avant de perdre patience ; le débrief cite la question qu'il fallait poser.",
      ],
    },
    {
      version: "0.9.0", nom: "La parole", date: "15 novembre 2026", type: "contenu",
      resume: "Le client parle comme une vraie personne : il raconte, se tait, ment, et l'audition se joue en entier.",
      notes: [
        "Entretien de garde à vue libre : la question se compose (un sujet, un angle, une forme) ; l'oral s'efface, ce qui n'est pas noté est perdu.",
        "Le client raconte les faits : le moment, le lieu, ce qu'il faisait, le geste, ce qu'on a saisi, la suite, ses raisons, qui était là.",
        "Quand le moteur simule l'affaire, le récit suit la simulation : fuite, tenue, objet retrouvé, délai de l'interpellation, perquisition, venue au domicile ou convocation.",
        "Le client ment, minimise ou revient sur ses aveux après la garde à vue ; la confrontation aux pièces le fait céder ou maintenir.",
        "Conseil donné sujet par sujet pendant les trente minutes ; audition intégrale, de vingt questions environ ; procès-verbal relu.",
        "Numérotation des versions et notes de mise à jour dans le jeu.",
      ],
    },
    {
      version: "0.8.1", nom: "", date: "15 novembre 2026", type: "correctif",
      resume: "Fiabilité avant la sortie 1.0.",
      notes: [
        "Sauvegardes fiables : une scène interrompue se rejoue depuis son début, aucune audience « tenue » sans jugement.",
        "Garde-fou d'erreur, fichiers de sauvegarde corrompus refusés proprement, carrières de cinq ans vérifiées.",
        "Distribution macOS : icône, mises à jour signées.",
        "Le dossier de travail ne tombe plus sur un passage sans texte ; la saisie d'un article ne plante plus.",
      ],
    },
    {
      version: "0.8.0", nom: "Le palais", date: "14 novembre 2026", type: "contenu",
      resume: "Après le jugement, les codes en entier et des décisions écrites comme les vraies.",
      notes: [
        "Application des peines, recouvrement de la victime, indemnisation, exclusion de la mention au bulletin n° 2.",
        "Texte intégral des quatre codes dans la bibliothèque.",
        "Arrêts, ordonnances et jugements au format réel ; irresponsabilité pénale devant la chambre de l'instruction et les assises.",
        "Audience : personnalité débattue sur pièces, réquisitions motivées, incidents soulevés par un geste.",
        "Vidéosurveillance du magasin jouée par le moteur.",
        "Les affaires écrites et le tutoriel sont retirés : toutes les affaires sont générées.",
      ],
    },
    {
      version: "0.7.0", nom: "Le dossier de travail", date: "12 novembre 2026", type: "contenu",
      resume: "Les outils d'un cabinet à la place du surlignage.",
      notes: [
        "Annotation au mot près, en couleur (à charge, à décharge, procédure, à vérifier), notes en marge, onglets.",
        "Liens entre passages, chronologie placée par le joueur avec les écarts, tableau des versions.",
        "Plan de défense en trois colonnes ; irrégularité relevée en quatre éléments : passage, texte violé, régime, grief.",
      ],
    },
    {
      version: "0.6.0", nom: "Le dossier réel", date: "12 novembre 2026", type: "contenu",
      resume: "Chaque affaire est simulée avant d'être écrite ; les pièces ont la forme et la longueur des vraies.",
      notes: [
        "Procès-verbaux, avis, certificats et réquisitions dans leurs trames réelles, paginés, papier ou procédure pénale numérique.",
        "Vidéosurveillance jouée par le moteur ; lecteur du dossier en feuillets ; schéma corporel des lésions.",
        "Flagrance, enquête préliminaire, convocations, ordonnance pénale et partie civile.",
      ],
    },
    {
      version: "0.5.0", nom: "Le cabinet", date: "11 novembre 2026", type: "contenu",
      resume: "La version de référence : carrière, permanence, affaires générées, audiences.",
      notes: ["Carrière d'avocat pénaliste, permanences, affaires générées sans répétition, audiences, cabinet et équipe, plans plein écran."],
    },
  ];

  const parametres = (() => { try { return new URLSearchParams(window.location.search); } catch (e) { return new URLSearchParams(""); } })();
  const build = Number(parametres.get("build")) || null;
  const canal = "stable"; // un seul jeu : plus de canal d'essai ni de libellé « bêta »
  const h0 = HISTORIQUE[0];
  CR.JEU = {
    version: h0.version, nom: h0.nom || (HISTORIQUE.find((h) => h.nom) || {}).nom || "", date: h0.date,
    // l'état « bêta » reste tant que le jeu n'est pas sorti (MAJEUR = 0) ou que l'app vient du canal d'essai
    etat: "",
    build, canal, historique: HISTORIQUE,
  };
  CR.JEU.libelle = CR.JEU.version + (CR.JEU.etat ? " " + CR.JEU.etat : "");
  CR.JEU.complet = CR.JEU.version + (build ? "." + build : "");
  // « 0.9.0 bêta « La parole » · build 167 »
  CR.JEU.titre = `${CR.JEU.libelle}${CR.JEU.nom ? " « " + CR.JEU.nom + " »" : ""}${build ? " · build " + build : ""}`;

  // notes de mise à jour à montrer une fois après une mise à jour (par appareil)
  const VU = "la-permanence-version-vue";
  CR.JEU.nouveautes = () => { try { const v = window.localStorage.getItem(VU); return v && v !== CR.JEU.version ? HISTORIQUE.filter((h) => cmp(h.version, v) > 0) : []; } catch (e) { return []; } };
  CR.JEU.marquerVu = () => { try { window.localStorage.setItem(VU, CR.JEU.version); } catch (e) { /* stockage refusé */ } };
  CR.JEU.premiereFois = () => { try { return !window.localStorage.getItem(VU); } catch (e) { return false; } };
  const cmp = (a, b) => { const x = String(a).split(".").map(Number), y = String(b).split(".").map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };
  CR.JEU.comparer = cmp;
})();
