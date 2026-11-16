/* La Permanence — numérotation des versions et notes de mise à jour.
   Comme dans les grands jeux : MAJEUR.MINEUR.CORRECTIF, un nom par mise à jour de contenu, un numéro de build, un canal.
   - MAJEUR : 0 tant que le jeu n'est pas sorti officiellement ; 1 à la sortie 1.0 (checklist de SORTIE_1.0.md cochée et
     refonte du gameplay menée jusqu'au pilote jugé par Kevin) ; 2 pour une refonte d'ampleur après la sortie.
   - MINEUR : une mise à jour de contenu, qui change la façon de jouer ou ajoute un pan du jeu (un lot de la refonte, par
     exemple) ; elle porte un nom (« La parole »).
   - CORRECTIF : corrections et réglages sans contenu nouveau.
   - Build : le numéro de publication (nombre de commits de la branche) ; c'est lui que l'app compare pour se mettre à jour.
     L'app Mac le transmet à la page (?build=…&canal=…) ; dans le navigateur de développement, il n'est pas connu.
   - Canal : « bêta » (publications d'essai, branches claude/**) ou stable (branche main).
   Référence complète affichée : « 0.9.0.167 » (version et build), comme les numéros de build des consoles.
   À chaque publication : le correctif monte pour des corrections ; le mineur monte (correctif à 0) pour du contenu, avec un
   nom et ses notes en tête de HISTORIQUE ; tests/tson.js vérifie la cohérence (version = première entrée, ordre). */
(function () {
  const CR = (window.CR = window.CR || {});

  // les mises à jour, la plus récente d'abord
  const HISTORIQUE = [
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
        "Distribution macOS : icône, canaux de mise à jour stable et d'essai, mises à jour signées.",
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
  const canal = parametres.get("canal") === "stable" ? "stable" : "beta";
  const h0 = HISTORIQUE[0];
  CR.JEU = {
    version: h0.version, nom: h0.nom || (HISTORIQUE.find((h) => h.nom) || {}).nom || "", date: h0.date,
    // l'état « bêta » reste tant que le jeu n'est pas sorti (MAJEUR = 0) ou que l'app vient du canal d'essai
    etat: h0.version.startsWith("0.") || canal === "beta" ? "bêta" : "",
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
