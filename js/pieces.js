/* La Permanence — les pièces des affaires, lisibles en entier (feuille de route, n° 2).
   Chargé après les affaires : remplace leurs pièces courtes par des procès-verbaux complets (horaires, mentions,
   signatures), des certificats, des relevés et des descriptions de vidéos, et ajoute l'enquête de la défense.
   Les irrégularités ne sont jamais signalées : un passage porte en secret le drapeau de l'anomalie (flag),
   les faits gardent leurs identifiants (f). Le droit des affaires ne change pas.
   Signatures : sigs = [{ qui, t }] ; t = "signé", "" (absente) ou une mention (« refuse de signer »). */
(function () {
  const CR = window.CR;
  const D = (d) => CR.fmtDate(d, "long");
  const DW = (d) => CR.fmtDate(d, "dow");
  const N = (d) => CR.fmtDate(d, "num");
  const dm = (d) => CR.fmtDate(d, "num").slice(0, 5);
  const S = "signé";
  const me = (x) => `Me ${x.s.player.prenom} ${x.s.player.nom}`;
  const put = (id, docs, extra) => { const def = CR.CASES[id]; if (!def) return; def.docs = Object.assign(def.docs || {}, docs); if (extra) Object.assign(def, extra); };
  const ATTEST = "Je sais que la présente attestation est établie en vue de sa production en justice et qu'une fausse attestation m'expose à des sanctions pénales (art. 441-7 du code pénal). Copie de ma pièce d'identité jointe.";
  const CJ = "Me Laure Dumas, commissaire de justice";
  const ENQ = "Bertrand Ollier, enquêteur de droit privé";
  // Une démarche « vidéo » : délai d'effacement, deux voies (lettre ou constat)
  const lettreVideo = (o) => ({ id: "lettre", label: o.lettre || "Écrire au responsable des images et au parquet", sub: "Demande de conservation, copie au magistrat pour qu'il les fasse saisir. Gratuit, mais il faut le temps que la demande arrive.", temps: 25, delai: o.delaiLettre || 9, saisie: o.saisieLettre || 3 });
  const constatVideo = (o) => ({ id: "constat", label: "Mandater un commissaire de justice pour un constat", sub: "Il visionne les images sur place dès le lendemain et les décrit dans un procès-verbal.", argent: o.prix || 380, frais: "Constat de commissaire de justice", delai: 3, saisie: 1 });

  // =================================================================== TUTORIEL (deux chapitres, mêmes pièces)
  const T = {
    certUrgences: (f) => (x) => ({
      title: "Certificat médical initial", kind: "courrier",
      entete: ["Assistance publique – Hôpitaux de Paris", "Hôpital Bichat–Claude-Bernard · Service des urgences", "46, rue Henri-Huchard, 75018 Paris"],
      paras: [
        [`Je soussignée, Dr Agnès Lemaire, certifie avoir examiné ce jour, ${D(x.cs.proc.faitsDay)} à 23 h 50, M. Lucas Bernier, né le 14 mars 2000, arrivé aux urgences à 23 h 20 par les sapeurs-pompiers.`],
        ["Il déclare avoir reçu un coup de poing au visage et être tombé en arrière sur la main droite, vers 22 h 40, rue Damrémont."],
        ["Examen : patient conscient, orienté. Haleine alcoolisée. Douleur et déformation du poignet droit ; ecchymose de la pommette gauche de 3 cm ; pas de plaie."],
        [{ t: "Constatations : fracture non déplacée de l'extrémité distale du radius droit, confirmée à la radiographie ; ecchymose de la pommette gauche.", f: f.fracture }],
        ["Immobilisation par attelle ; avis orthopédique à prévoir ; antalgiques."],
        [{ t: "Incapacité totale de travail personnel : 6 (six) jours, sous réserve de complications.", f: f.itt }],
        ["Certificat remis en main propre à l'intéressé pour faire valoir ce que de droit."],
      ],
      sigs: [{ qui: "Dr A. Lemaire, médecin urgentiste", t: S }],
    }),
    certUMJ: (f) => (x) => {
      const cs = x.cs, u = cs.vars.umjDay, fd = cs.proc.faitsDay;
      return {
        title: "Certificat médico-légal", kind: "pv",
        entete: ["Unité médico-judiciaire de l'Hôtel-Dieu", "1, parvis Notre-Dame – place Jean-Paul-II, 75004 Paris", "Sur réquisition judiciaire (art. 60 et 77-1 du code de procédure pénale)"],
        paras: [
          ["Réquisition du lieutenant Damien Rocher, officier de police judiciaire, commissariat central du 18e arrondissement, aux fins d'examen et de fixation de la durée de l'incapacité totale de travail."],
          [{ t: `Examen réalisé le ${u != null ? D(u) : "…"}, à 14 h 10, soit ${u != null ? u - fd : "…"} jours après les faits.`, f: f.date }],
          [`Commémoratifs : M. Lucas Bernier, né le 14 mars 2000, livreur à vélo, déclare avoir reçu un coup de poing au visage le ${D(fd)} vers 22 h 40 et être tombé en arrière sur la main droite.`],
          [`Examen : plâtre antébrachio-palmaire droit posé le ${D(CR.rollForward(fd + 3))}. Pommette gauche sans lésion visible ce jour. Pas d'autre lésion.`],
          ["Le dossier des urgences de l'hôpital Bichat, présenté par l'intéressé, fait état d'une fracture non déplacée de l'extrémité distale du radius droit."],
          [{ t: "La durée de l'incapacité totale de travail personnel est fixée à 10 (dix) jours à compter des faits.", f: f.itt }],
          ["L'incapacité totale de travail s'entend de la gêne réelle et globale dans les actes de la vie courante ; elle ne se confond pas avec un arrêt de travail."],
          ["Certificat remis à la seule autorité requérante."],
        ],
        sigs: [{ qui: "Dr Julien Vasseur, médecin légiste", t: S }],
      };
    },
    pvVideo: (f) => (x) => ({
      title: "Procès-verbal d'exploitation de vidéoprotection", kind: "video",
      entete: ["Police nationale · Préfecture de police", "Commissariat central du 18e arrondissement", "Procédure n° 2026/18/04417 — cote D9"],
      paras: [
        [`Le ${D(x.cs.proc.faitsDay + 7)}, à 15 h 00, nous, lieutenant Damien Rocher, officier de police judiciaire, procédons à l'exploitation de l'enregistrement remis par M. Karim Haddad, gérant du bar Le Damrémont, sur une clé USB placée sous scellé n° 1.`],
        ["La caméra, fixée au-dessus de la porte du bar, filme le trottoir sans le son. L'horloge de l'enregistreur est à l'heure légale (contrôle fait ce jour)."],
        ["22 h 41 min 02 s : deux hommes se font face sur le trottoir et échangent des propos."],
        [{ t: "22 h 41 min 08 s : l'homme en veste claire, identifié comme Lucas Bernier, pousse des deux mains l'homme en tablier, identifié comme Thomas Moreau.", f: f.pousse }],
        [{ t: "22 h 41 min 10 s : Lucas Bernier recule d'un pas, les bras le long du corps.", f: f.recul }],
        [{ t: "22 h 41 min 12 s : Thomas Moreau s'avance et porte un coup de poing au visage de Lucas Bernier.", f: f.coup }],
        [{ t: "22 h 41 min 13 s : Lucas Bernier chute en arrière et se réceptionne sur la main droite.", f: f.chute }],
        [{ t: "22 h 41 min 20 s : Thomas Moreau reste sur place, s'accroupit près de lui et téléphone.", f: f.secours }],
        ["22 h 49 min 40 s : arrivée des sapeurs-pompiers. Fin de l'extrait utile à 22 h 58."],
        ["Un seul coup est porté. Aucun autre geste violent n'apparaît sur l'enregistrement."],
        ["Clos à 15 h 40. Les images utiles sont gravées sur un disque joint à la procédure."],
      ],
      sigs: [{ qui: "Lt D. Rocher, officier de police judiciaire", t: S }],
    }),
    pvTemoin: (f) => (x) => ({
      title: "Procès-verbal d'audition de témoin", kind: "pv",
      entete: ["Commissariat central du 18e arrondissement", "Procédure n° 2026/18/04417 — cote D7"],
      paras: [
        [`Le ${D(x.cs.proc.faitsDay + 5)}, à 11 h 00, nous, lieutenant Damien Rocher, officier de police judiciaire, entendons M. Romain Esteve, né le 8 juillet 1998 à Montreuil, serveur, demeurant rue Lepic, Paris 18e, sans lien avec les parties, qui déclare :`],
        ["Je travaille au Damrémont depuis deux ans. Ce soir-là, le client à la veste claire parlait fort depuis une heure avec ses amis, à la table près de la porte."],
        [{ t: "Il avait bu, il était énervé depuis le début de la soirée.", f: f.alcool }],
        ["Il a renversé un verre sur une cliente et il l'a insultée. Thomas, le cuisinier, est venu lui demander de sortir."],
        ["Dehors, le client l'a poussé. Thomas lui a mis un coup de poing. Le client est tombé. Je l'ai vu par la vitre."],
        ["Thomas a tout de suite appelé les pompiers. Ce n'est pas quelqu'un de violent."],
        ["Lecture faite par lui-même, le témoin persiste et signe avec nous."],
      ],
      sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "Le témoin", t: S }],
    }),
    casier: (f) => () => ({
      title: "Bulletin n° 1 du casier judiciaire", kind: "greffe",
      entete: ["Ministère de la Justice · Casier judiciaire national", "107, rue du Landreau, 44317 Nantes"],
      paras: [["Relevé délivré à l'autorité judiciaire."], ["Identité : Moreau Thomas, né le 2 juin 1995 à Saint-Denis (93), de nationalité française."], [{ t: "Néant.", f }], ["Le présent bulletin ne peut être communiqué qu'aux autorités judiciaires."]],
    }),
    // Audition libre de Thomas Moreau : la liste des droits omet le droit de quitter les locaux (art. 61-1, 2°)
    auditionThomas: (fa) => (x) => {
      const cs = x.cs;
      const c = cs.vars.conseilGav || "expliquer";
      const rect = cs.flags.pvRectifie;
      const jour = cs.vars.auditionDay != null ? cs.vars.auditionDay : cs.proc.faitsDay + 13;
      const decl = fa ? [["Il me parlait mal, il gênait les clients, je lui ai demandé de sortir."], [{ t: "Dehors, il m'a poussé. Je lui ai mis un coup de poing, je n'ai pas réfléchi.", f: fa }], ["Je regrette. Je ne voulais pas qu'il se casse le poignet. J'ai appelé les pompiers."]] : {
        silence: [["Je ne souhaite pas répondre aux questions."], ["Sur mes antécédents : je n'ai jamais été condamné."]],
        partiel: [[{ t: "Je reconnais avoir donné un coup de poing à ce client. Je ne répondrai pas sur le reste.", f: "F2_pv_aveu" }], ["Je n'ai jamais été condamné."]],
        expliquer: [["Un client gênait, je l'ai fait sortir. Dehors, il m'a poussé des deux mains."], [{ t: rect ? "J'ai voulu qu'il arrête." : "J'ai voulu le frapper.", f: rect ? "F2_pv_arret" : "F2_pv_frapper" }], [{ t: "Je lui ai donné un coup de poing. Il est tombé.", f: "F2_pv_aveu" }], ["Je regrette. J'ai appelé les pompiers."]],
      }[c];
      const notif = `Avons notifié à la personne entendue, avant son audition, qu'elle est soupçonnée de violences volontaires commises le ${D(cs.proc.faitsDay)}, ainsi que son droit de se taire, son droit à un interprète et son droit à l'assistance d'un avocat, qu'elle exerce : ${fa ? "son avocat est présent" : `Me ${x.s.player.nom} est présent`}.`;
      return {
        title: "Procès-verbal d'audition libre", kind: "pv",
        entete: ["Commissariat central du 18e arrondissement", "Procédure n° 2026/18/04417 · Audition libre de M. Thomas Moreau — cote D11"],
        paras: [
          [`Le ${D(jour)}, à 10 h 20, nous, lieutenant Damien Rocher, officier de police judiciaire, entendons M. Thomas Moreau, né le 2 juin 1995 à Saint-Denis, cuisinier, demeurant rue Marx-Dormoy, Paris 18e, convoqué par nos soins.`],
          ["Vu l'article 61-1 du code de procédure pénale."],
          [fa ? notif : { t: notif, flag: "al_quitter" }],
          ["Début de l'audition à 10 h 30. La personne déclare :"],
        ].concat(decl).concat([["Fin de l'audition à 11 h 05."], ["Lecture faite par elle-même, la personne persiste et signe avec nous et son avocat."]]),
        sigs: [{ qui: "Lt D. Rocher, officier de police judiciaire", t: S }, { qui: "La personne entendue", t: S }, { qui: "L'avocat", t: S }],
      };
    },
  };
  put("tuto_lucas", {
    cert_urgences: T.certUrgences({ fracture: "F1_fracture_doc", itt: "F1_urg6" }),
    cert_umj: T.certUMJ({ date: "F1_umj_date", itt: "F1_umj10" }),
    pv_video: T.pvVideo({ pousse: "F1_v_pousse", recul: "F1_v_recul", coup: "F1_v_coup", chute: "F1_v_chute", secours: "F1_v_secours" }),
    pv_temoin: T.pvTemoin({ alcool: "F1_t_alcool" }),
    pv_audition: T.auditionThomas("F1_aveu"),
  });
  put("tuto_thomas", {
    cert_urgences: T.certUrgences({ fracture: "F2_fracture_doc", itt: "F2_urg6" }),
    cert_umj: T.certUMJ({ date: "F2_umj_date", itt: "F2_umj10" }),
    pv_video: T.pvVideo({ pousse: "F2_v_pousse", recul: "F2_v_recul", coup: "F2_v_coup", chute: "F2_v_chute", secours: "F2_v_secours" }),
    pv_temoin: T.pvTemoin({ alcool: "F2_t_alcool" }),
    pv_audition: T.auditionThomas(null),
    casier: T.casier("F2_casier_b1"),
    pv_plainte: (x) => ({
      title: "Procès-verbal de plainte", kind: "pv",
      entete: ["Commissariat central du 18e arrondissement", "Procédure n° 2026/18/04417 · Plainte de M. Lucas Bernier — cote D2"],
      paras: [
        [`Le ${D(x.cs.proc.faitsDay + 1)}, à 10 h 30, nous, Nathalie Faure, brigadier de police, agent de police judiciaire, recevons la plainte de M. Lucas Bernier, né le 14 mars 2000 à Paris 19e, livreur à vélo, demeurant rue Championnet, Paris 18e, qui déclare :`],
        ["Je dépose plainte contre Thomas Moreau, cuisinier du bar Le Damrémont, rue Damrémont."],
        ["Hier soir, vers 22 h 40, j'étais au bar avec des amis. Il est venu me dire de sortir."],
        [{ t: "Il m'a frappé comme ça, sans raison, alors que je n'avais rien fait.", f: "F2_lucas_nie" }],
        ["Je suis tombé et je me suis cassé le poignet. Je suis livreur et je ne peux plus travailler."],
        ["Il y a une caméra au-dessus de la porte du bar. Le serveur a tout vu."],
        ["Lecture faite par lui-même, le plaignant persiste et signe avec nous."],
      ],
      sigs: [{ qui: "L'agent de police judiciaire", t: S }, { qui: "Le plaignant", t: S }],
    }),
    // Avis d'un médecin conseil sur pièces, commandé par la défense
    enq_avis: (x) => ({
      title: "Avis médical sur pièces", kind: "courrier",
      entete: ["Dr Hélène Marchetti, médecin conseil, diplômée en réparation juridique du dommage corporel", "Boulevard Malesherbes, 75017 Paris"],
      paras: [
        [`À la demande de Me ${x.s.player.nom}, avocat de M. Thomas Moreau, j'ai examiné les pièces médicales suivantes : certificat des urgences de l'hôpital Bichat du ${D(x.cs.proc.faitsDay)} ; certificat médico-légal de l'unité médico-judiciaire de l'Hôtel-Dieu.`],
        [{ t: "Le certificat des urgences, établi le soir des faits, constate la fracture et fixe l'incapacité totale de travail à six jours.", f: "F2_urg6" }],
        [{ t: `L'examen médico-légal a eu lieu le ${x.cs.vars.umjDay != null ? D(x.cs.vars.umjDay) : "…"}, soit ${x.cs.vars.umjDay != null ? x.cs.vars.umjDay - x.cs.proc.faitsDay : "…"} jours après les faits, sur un patient déjà plâtré : la pommette n'est plus examinée, la fracture n'est pas revue.`, f: "F2_umj_date" }],
        ["La durée de dix jours est fixée « à compter des faits » sans constatation contemporaine ; elle se fonde sur le dossier des urgences, qui retenait six jours."],
        ["Je n'ai pas examiné M. Bernier. Le présent avis, établi sur pièces et à la demande d'une partie, n'a pas la valeur d'une expertise judiciaire."],
      ],
      sigs: [{ qui: "Dr H. Marchetti", t: S }],
    }),
  }, {
    enquete: [
      { id: "avis_itt", type: "expertise", camp: "defense", titre: "Faire relire les certificats par un médecin conseil", desc: "Deux certificats, deux durées d'incapacité : six jours aux urgences, dix à l'unité médico-judiciaire. Un médecin conseil peut lire les deux et dire sur quoi repose chacun.", piste: ["cert_umj"],
        modes: [{ id: "medecin", label: "Commander un avis médical sur pièces", sub: "Honoraires du médecin conseil, avancés par le cabinet.", argent: 450, frais: "Avis médical sur pièces", delai: 6 }],
        doc: "enq_avis", titrePiece: "Avis du médecin conseil sur les certificats",
        envoi: () => ({ from: "Dr Hélène Marchetti", subject: "Votre demande d'avis sur pièces — M. Moreau", body: [["Maître, vous trouverez ci-joint mon avis sur les deux certificats. Bien confraternellement."]] }) },
    ],
  });

  // =================================================================== AFFAIRE 2 — le sac arraché (comparution immédiate)
  put("a02_sac", {
    pv_notification: (x) => {
      const f = x.cs.proc.faitsDay;
      return {
        title: "Procès-verbal de placement en garde à vue et de notification des droits", kind: "pv",
        entete: ["Préfecture de police · Direction de la sécurité de proximité", "Commissariat central du 18e arrondissement", "Procédure n° 2026/18/05112 — cote D3"],
        paras: [
          [`Le ${D(f)}, à 13 h 10, nous, Mourad Benali, brigadier-chef de police, officier de police judiciaire en fonction au commissariat central du 18e arrondissement,`],
          ["Vu les articles 62-2, 63 et 63-1 à 63-4-3 du code de procédure pénale ; vu le procès-verbal d'interpellation (cote D1) ;"],
          [{ t: "Plaçons en garde à vue M. Yanis Mebarki, né le 9 février 2002 à Paris 18e, cariste intérimaire, demeurant rue Marcadet, Paris 18e, la mesure prenant effet à 12 h 55, heure de son interpellation.", f: "A2_debut" }],
          ["Motifs : il existe des raisons plausibles de soupçonner qu'il a commis un vol avec violences, ce jour, rue Ordener ; la mesure est l'unique moyen d'empêcher une concertation avec d'éventuels complices et de garantir sa présentation devant le procureur de la République (art. 62-2, 4° et 2°)."],
          ["Avis du placement donné au procureur de la République de permanence, par courriel, à 13 h 20."],
          ["Mesures de sécurité : palpation, retrait des lacets et de la ceinture ; argent et téléphone déposés à la fouille."],
          [{ t: "À 15 h 15, notifions à M. Yanis Mebarki, dans une langue qu'il comprend, la nature et la date présumée de l'infraction, la durée de la mesure et ses droits : faire prévenir un proche et son employeur, être examiné par un médecin, être assisté par un avocat et par un interprète, consulter les pièces de l'article 63-4-1, présenter des observations au magistrat qui se prononcera sur une prolongation, faire des déclarations, répondre aux questions ou se taire.", f: "A2_notif_1515", flag: "gav_notif" }],
          ["Lui remettons le document énonçant ses droits (art. 803-6)."],
          ["La personne demande l'assistance d'un avocat commis d'office et que sa mère, Mme Nadia Mebarki, soit avisée. Elle ne demande pas d'examen médical."],
          ["Avis à la permanence des avocats du barreau de Paris à 15 h 20. Avis téléphonique à Mme Nadia Mebarki à 15 h 25."],
          ["Le procureur de la République prescrit un examen médical : réquisition adressée à l'unité médico-judiciaire à 15 h 30."],
          ["Dont procès-verbal, que la personne signe avec nous après lecture."],
        ],
        sigs: [{ qui: "Brigadier-chef M. Benali, officier de police judiciaire", t: S }, { qui: "La personne gardée à vue", t: S }],
      };
    },
    pv_interpellation: (x) => ({
      title: "Procès-verbal d'interpellation", kind: "pv",
      entete: ["Commissariat central du 18e arrondissement · Brigade anticriminalité", "Procédure n° 2026/18/05112 — cote D1"],
      paras: [
        [`Le ${D(x.cs.proc.faitsDay)}, à 12 h 52, nous, Pierre Lebrun et Sandra Ortiz, gardiens de la paix, agents de police judiciaire de la brigade anticriminalité du 18e arrondissement, en patrouille rue Ordener,`],
        ["Sommes hélés par une passante qui nous désigne un jeune homme courant vers la rue Championnet, en criant : « Il a pris le sac de la dame ! » La passante quitte les lieux sans laisser ses coordonnées."],
        [{ t: "L'individu tient à la main un sac de couleur rouge. Le rattrapons à pied et l'interpellons à 12 h 55, à l'angle des rues Championnet et des Poissonniers.", f: "A2_sac_main" }],
        ["Il ne résiste pas. Palpation de sécurité : un téléphone portable et un portefeuille à son nom. Il déclare se nommer Yanis Mebarki."],
        ["Revenus rue Ordener à 13 h 02, constatons qu'une femme âgée est assise sur le trottoir, la main droite en sang ; elle déclare se nommer Odile Lefort et reconnaît son sac. Les sapeurs-pompiers, appelés par un commerçant, la prennent en charge."],
        [{ t: "Les faits se sont déroulés à quelques mètres de la sortie de la station de métro Marcadet–Poissonniers, dont l'accès est surveillé par une caméra.", f: "A2_camera" }],
        ["Présentons M. Mebarki à l'officier de police judiciaire du commissariat central du 18e à 13 h 08."],
        ["Dont procès-verbal."],
      ],
      sigs: [{ qui: "Gardien de la paix P. Lebrun", t: S }, { qui: "Gardienne de la paix S. Ortiz", t: S }],
    }),
    certif_gav: (x) => ({
      title: "Certificat médical de garde à vue", kind: "courrier",
      entete: ["Hôtel-Dieu · Unité médico-judiciaire", "Médecin requis (art. 63-3 du code de procédure pénale)"],
      paras: [
        [`Je soussignée, Dr Claire Royer, médecin requis, certifie avoir examiné le ${D(x.cs.proc.faitsDay)} à 16 h 40, au commissariat central du 18e arrondissement, M. Yanis Mebarki, né le 9 février 2002.`],
        ["Antécédents : néant. Traitement : aucun. Pas de plainte somatique."],
        ["Examen : pas de lésion traumatique récente. Pas de signe d'intoxication."],
        ["Conclusion : état de santé compatible avec la garde à vue et avec une audition dans les locaux de police."],
      ],
      sigs: [{ qui: "Dr C. Royer", t: S }],
    }),
    pv_victime: (x) => ({
      title: "Procès-verbal d'audition de la victime", kind: "pv",
      entete: ["Commissariat central du 18e arrondissement", "Procédure n° 2026/18/05112 · Audition de Mme Odile Lefort, 67 ans — cote D5"],
      paras: [
        [`Le ${D(x.cs.proc.faitsDay)}, à 14 h 05, nous, Julie Marchal, gardienne de la paix, agent de police judiciaire, entendons au service des urgences de l'hôpital Bichat Mme Odile Lefort, née le 2 mai 1959, retraitée, demeurant rue Ordener, Paris 18e, qui déclare :`],
        ["Je marchais rue Ordener, vers le métro. J'avais mon sac à l'épaule droite."],
        ["Quelqu'un a tiré mon sac par derrière. J'ai tenu l'anse, j'ai été tirée en avant et je suis tombée sur les mains."],
        [{ t: "Je ne peux pas dire s'il m'a poussée. J'ai senti la secousse et je suis tombée.", f: "A2_victime_doute" }],
        ["Je n'ai pas vu son visage. Les policiers m'ont rapporté mon sac ; il ne manque rien."],
        ["Mes lunettes sont cassées et j'ai mal au poignet. Les urgences m'ont donné trois jours d'ITT."],
        ["Je dépose plainte. Je demande le remboursement de mes lunettes."],
        ["Lecture faite par elle-même, Mme Lefort persiste et signe avec nous."],
      ],
      sigs: [{ qui: "Gardienne de la paix J. Marchal", t: S }, { qui: "La personne entendue", t: S }],
    }),
    casier: () => ({
      title: "Bulletin n° 1 du casier judiciaire", kind: "greffe",
      entete: ["Ministère de la Justice · Casier judiciaire national", "107, rue du Landreau, 44317 Nantes"],
      paras: [["Relevé délivré à l'autorité judiciaire."], ["Identité : Mebarki Yanis, né le 9 février 2002 à Paris 18e, de nationalité française."], [{ t: "Tribunal correctionnel de Paris, 14 mars 2023 : vol, quatre mois d'emprisonnement avec sursis.", f: "A2_casier_b1" }], ["Décision contradictoire, définitive. Fin du relevé : une condamnation."]],
    }),
    esr: (x) => ({
      title: "Enquête sociale rapide", kind: "courrier",
      entete: ["Association de contrôle judiciaire — permanence du dépôt", "Article 41, alinéa 7, du code de procédure pénale"],
      paras: [
        [`Entretien avec M. Yanis Mebarki au dépôt du tribunal, le ${D(x.cs.proc.faitsDay + 1)} à 9 h 40.`],
        [{ t: "Domicile : chez sa mère, Mme Nadia Mebarki, rue Marcadet, depuis toujours. Hébergement vérifié par téléphone.", f: "A2_esr" }],
        ["Famille : célibataire, sans enfant. Un frère cadet, lycéen."],
        ["Situation : intérimaire, cariste, missions irrégulières depuis un an. Dette déclarée d'environ 300 euros auprès d'un ami."],
        ["Santé : rien de signalé. Consommation de cannabis occasionnelle, déclarée."],
        ["Avis : pas d'objection à une mesure alternative à la détention si l'hébergement est confirmé par écrit."],
      ],
      sigs: [{ qui: "L'enquêtrice sociale", t: S }],
    }),
    enq_metro: (x) => ({
      title: "Procès-verbal de constat — images de vidéosurveillance", kind: "video",
      entete: [CJ, "Rue de Clignancourt, 75018 Paris"],
      paras: [
        [`À la requête de M. Yanis Mebarki, représenté par ${me(x)}, exerçant son droit d'accès aux images le concernant, je me suis rendue le ${D(x.cs.enq && x.cs.enq.video_metro ? x.cs.enq.video_metro.day + 1 : x.cs.proc.faitsDay + 1)} au poste de sûreté de la station Marcadet–Poissonniers, où l'agent de permanence m'a présenté les images de la caméra de la sortie rue Ordener.`],
        [`Horodatage de l'enregistreur : ${N(x.cs.proc.faitsDay)}.`],
        ["12:50:31 — Une femme âgée, manteau beige, marche sur le trottoir, sac rouge à l'épaule droite."],
        ["12:50:34 — Un jeune homme en sweat gris arrive par derrière et saisit l'anse du sac."],
        [{ t: "12:50:35 — La femme retient l'anse ; elle est entraînée sur deux pas puis tombe en avant sur les mains. Aucun geste de poussée n'est visible : l'homme tire le sac, il ne touche pas la femme.", f: "A2_pas_pousse" }],
        ["12:50:37 — L'homme part en courant vers la rue Championnet, le sac à la main."],
        [{ t: "12:50:52 — La femme est relevée par un passant. Elle ne regarde pas dans la direction de l'homme : elle ne l'a pas vu.", f: "A2_victime_doute" }],
        ["Une copie des images a été remise à l'agent de sûreté, à la disposition de l'autorité judiciaire."],
      ],
      sigs: [{ qui: "Me L. Dumas, commissaire de justice", t: S }],
    }),
  }, {
    enquete: [
      { id: "video_metro", type: "video", camp: "defense", titre: "La caméra de la sortie du métro", desc: "La caméra qui surveille la sortie de la station Marcadet–Poissonniers, à quelques mètres de l'arrachage. D'après l'agent de station, ses images sont écrasées au bout de trois jours.", piste: ["A2_camera", "A2_q_camera"],
        limite: (api) => api.cs.proc.faitsDay + 3,
        modes: [lettreVideo({ lettre: "Écrire au service de sûreté de la station et au parquet", delaiLettre: 8, saisieLettre: 3 }), constatVideo({ prix: 380 })],
        doc: "enq_metro", titrePiece: "Constat : les images de la sortie du métro",
        envoi: (api, st) => ({ from: st.mode === "constat" ? "Me Laure Dumas, commissaire de justice" : "Parquet de Paris", subject: "Images de la station Marcadet–Poissonniers", body: [[st.mode === "constat" ? "Maître, vous trouverez ci-joint mon procès-verbal de constat." : "Maître, les images ont été conservées ; un constat de leur contenu a été versé à la procédure. Copie ci-jointe."]] }),
        perdu: (api, st, lim) => ({ from: "Service de sûreté — station Marcadet–Poissonniers", subject: "Votre demande d'images", body: [[`Maître, votre demande nous est parvenue trop tard : les enregistrements du ${D(api.cs.proc.faitsDay)} ont été écrasés automatiquement le ${D(lim + 1)}. Nous ne pouvons y donner suite.`]] }) },
    ],
  });

  // =================================================================== AFFAIRE 3 — le contrôle de 2 h du matin
  put("a03_crpc", {
    pv_controle: (x) => ({
      title: "Procès-verbal de dépistage", kind: "pv",
      entete: ["Commissariat central du 18e · Unité de voie publique", "Procédure n° 2026/18/05301 — cote D1"],
      paras: [
        [`Le ${D(x.cs.proc.faitsDay)}, à 2 h 10, nous, Thomas Morel et Aïssata Fofana, gardiens de la paix, agents de police judiciaire, procédons boulevard de la Chapelle, à hauteur du n° 12, à des contrôles d'alcoolémie sur réquisitions écrites du procureur de la République (art. L. 234-9 du code de la route).`],
        ["Contrôlons le véhicule Renault Clio immatriculé GH-418-TZ, conduit par Mme Claire Morin, née le 17 mai 1981 à Lille, infirmière, demeurant à Pantin."],
        ["Dépistage de l'imprégnation alcoolique par éthylotest électronique à 2 h 12 : positif."],
        [{ t: "La conductrice a l'haleine sentant l'alcool ; propos cohérents, démarche assurée, pas de signe d'ivresse manifeste.", f: "A3_pas_ivresse" }],
        ["Conduite au commissariat central du 18e pour vérification par éthylomètre ; arrivée à 2 h 20. Le véhicule reste régulièrement stationné sur place, les clés sont remises à la conductrice."],
        ["Dont procès-verbal."],
      ],
      sigs: [{ qui: "Gardien de la paix T. Morel", t: S }, { qui: "Gardienne de la paix A. Fofana", t: S }],
    }),
    pv_mesure: (x) => ({
      title: "Procès-verbal de vérification de l'état alcoolique", kind: "pv",
      entete: ["Commissariat central du 18e", "Procédure n° 2026/18/05301 — cote D2"],
      paras: [
        [`Le ${D(x.cs.proc.faitsDay)}, à 2 h 22, nous, Gaëlle Perrin, lieutenant de police, officier de police judiciaire en fonction au commissariat central du 18e arrondissement, procédons à la vérification de l'état alcoolique de Mme Claire Morin (art. L. 234-4 du code de la route).`],
        ["Vérification par éthylomètre de marque Dräger, modèle 7110 FP."],
        [{ t: "Appareil homologué, numéro de série ARCA-0157.", f: "A3_ethylo_pv", flag: "ethylo" }],
        ["La personne déclare n'avoir ni bu ni fumé depuis plus de trente minutes."],
        [{ t: "Première mesure à 2 h 25 : 0,54 mg/l d'air expiré. Seconde mesure à 2 h 32 : 0,52 mg/l. Retenons la mesure la plus favorable : 0,52 mg/l.", f: "A3_mesures" }],
        ["Notifions à l'intéressée le résultat et son droit à une seconde vérification, qu'elle a exercé."],
        ["Rétention de son permis de conduire à titre conservatoire (art. L. 224-1 du code de la route) ; avis de rétention remis à 2 h 40."],
        ["Dont procès-verbal, clos à 2 h 45, que Mme Morin signe avec nous après lecture."],
      ],
      sigs: [{ qui: "Lt G. Perrin, officier de police judiciaire", t: S }, { qui: "La personne contrôlée", t: S }],
    }),
    pv_audition: (x) => ({
      title: "Procès-verbal d'audition libre", kind: "pv",
      entete: ["Commissariat central du 18e", "Procédure n° 2026/18/05301 — cote D4"],
      paras: [
        [`Le ${D(x.cs.proc.faitsDay)}, à 3 h 00, nous, Gaëlle Perrin, lieutenant de police, officier de police judiciaire, entendons Mme Claire Morin, née le 17 mai 1981 à Lille, infirmière de nuit à l'hôpital Lariboisière.`],
        [`Avant l'audition, lui notifions qu'elle est soupçonnée d'avoir, le ${D(x.cs.proc.faitsDay)}, conduit un véhicule sous l'empire d'un état alcoolique ; son droit de quitter à tout moment les locaux où elle est entendue ; son droit à un interprète ; son droit de faire des déclarations, de répondre aux questions ou de se taire ; son droit d'être assistée par un avocat ; la possibilité de bénéficier de conseils juridiques gratuits. Elle renonce à l'assistance d'un avocat.`],
        ["Elle déclare :"],
        ["J'ai bu deux verres de vin au pot de départ d'une collègue, entre minuit et une heure. Je me sentais capable de conduire."],
        ["Je travaille de nuit, je n'ai pas d'autre moyen de rentrer à Pantin. Je regrette."],
        ["Fin de l'audition à 3 h 15. Lecture faite, persiste et signe."],
      ],
      sigs: [{ qui: "Lt G. Perrin, officier de police judiciaire", t: S }, { qui: "La personne entendue", t: S }],
    }),
    casier: () => ({
      title: "Bulletin n° 1 du casier judiciaire", kind: "greffe",
      entete: ["Ministère de la Justice · Casier judiciaire national", "107, rue du Landreau, 44317 Nantes"],
      paras: [["Relevé délivré à l'autorité judiciaire."], ["Identité : Morin Claire, née le 17 mai 1981 à Lille, de nationalité française."], [{ t: "Néant.", f: "A3_casier_b1" }]],
    }),
  });

  // =================================================================== AFFAIRE 4 — le voisin du dessus (partie civile)
  put("a04_voisin", {
    certificat: (x) => ({
      title: "Certificat médical", kind: "courrier",
      entete: ["Dr Hélène Barbier, médecin généraliste", "Rue Ordener, 75018 Paris"],
      paras: [
        [`Je soussignée, Dr Hélène Barbier, certifie avoir examiné le ${D(x.cs.proc.faitsDay)} à 21 h, à mon cabinet, M. Mamadou Diallo, né le 6 juin 1958, qui déclare avoir été bousculé dans l'escalier de son immeuble vers 19 h 30 et être tombé sur plusieurs marches.`],
        ["Constatations : entorse du poignet gauche, contusion de la hanche. Poignet gauche douloureux et œdématié, mobilité limitée ; hématome de 6 cm à la hanche gauche. Radiographie du poignet prescrite."],
        [{ t: "Incapacité totale de travail : 2 (deux) jours.", f: "A4_itt2_doc" }],
        ["Certificat établi à la demande de l'intéressé et remis en main propre."],
      ],
      sigs: [{ qui: "Dr H. Barbier", t: S }],
    }),
    facture: (x) => ({
      title: "Facture de l'opticien", kind: "releve",
      entete: ["Optique Clignancourt · rue de Clignancourt, 75018 Paris", `Facture n° 2025-1187 du ${N(x.cs.proc.faitsDay + 4)}`],
      paras: [
        ["Client : M. Mamadou Diallo."],
        ["Monture métal, référence MX 52-18 ........ 120,00 €"],
        ["Verres progressifs (deux) ................ 260,00 €"],
        [{ t: "Remplacement de monture et de verres progressifs : 380 € TTC.", f: "A4_lunettes_facture" }],
        ["Acquittée le jour même, par carte bancaire. Motif indiqué par le client : lunettes brisées lors d'une chute."],
      ],
    }),
    pv_audition_pichon: (x) => ({
      title: "Procès-verbal d'audition de M. Pichon", kind: "pv",
      entete: ["Commissariat central du 18e", "Procédure n° 2025/18/09934 — cote D4"],
      paras: [
        [{ t: `Le ${D(x.cs.vars.auditionPichon)}, à 9 h 30, entendons M. Gérard Pichon, chauffeur de taxi, né le 3 avril 1961 à Rouen, demeurant rue de Clignancourt, Paris 18e.`, f: "A4_audition_date" }],
        ["Avant l'audition, lui notifions qu'il est soupçonné de violences volontaires commises le " + D(x.cs.proc.faitsDay) + " sur M. Mamadou Diallo, et ses droits : quitter à tout moment les locaux, interprète, se taire, avocat, conseils juridiques gratuits. Il renonce à l'avocat."],
        ["Il déclare : M. Diallo habite en dessous. Depuis des mois, il frappe au plafond dès que je marche."],
        ["Ce soir-là, il m'attendait dans l'escalier pour se plaindre du bruit."],
        [{ t: "Je l'ai écarté de la main, il était sur mon chemin. Il est tombé tout seul.", f: "A4_pichon_ecarte" }],
        ["Je ne l'ai pas poussé. Mme Roux n'était pas là, elle raconte n'importe quoi."],
        ["Fin de l'audition à 10 h 05. Lecture faite, persiste et signe."],
      ],
      sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "La personne entendue", t: S }],
    }),
    pv_temoin_roux: (x) => ({
      title: "Procès-verbal d'audition de Mme Roux", kind: "pv",
      entete: ["Commissariat central du 18e", "Procédure n° 2025/18/09934 — cote D5"],
      paras: [
        [`Le ${D(x.cs.proc.faitsDay + 12)}, à 15 h 00, entendons Mme Évelyne Roux, née le 11 janvier 1950, retraitée, demeurant au deuxième étage du même immeuble, qui déclare :`],
        ["J'ai entendu crier dans l'escalier. J'ai ouvert ma porte."],
        [{ t: "J'ai vu M. Pichon pousser M. Diallo des deux mains dans l'escalier. M. Diallo est tombé sur trois ou quatre marches.", f: "A4_temoin_pv" }],
        ["M. Pichon criait depuis le palier."],
        ["Je n'ai pas de dispute avec l'un ou l'autre. M. Diallo est un voisin poli."],
        ["Lecture faite, persiste et signe."],
      ],
      sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "Le témoin", t: S }],
    }),
    enq_roux: (x) => ({
      title: "Attestation de témoin", kind: "courrier",
      entete: ["Attestation établie selon les formes de l'article 202 du code de procédure civile"],
      paras: [
        ["Je soussignée Évelyne Roux, née le 11 janvier 1950 à Paris, retraitée, demeurant au deuxième étage de l'immeuble de M. Diallo, sans lien de parenté ni de subordination avec les parties,"],
        [`atteste que le ${D(x.cs.proc.faitsDay)}, vers 19 h 30, ayant entendu crier, j'ai ouvert ma porte sur le palier.`],
        [{ t: "J'ai vu M. Pichon pousser M. Diallo des deux mains dans l'escalier. M. Diallo est tombé sur trois ou quatre marches.", f: "A4_temoin_pv" }],
        ["M. Pichon criait depuis le palier. J'ai aidé M. Diallo à se relever ; ses lunettes étaient cassées."],
        [x.mode === "enqueteur" ? `Attestation recueillie par ${ENQ}.` : "Attestation remise à l'avocat de M. Diallo."],
        [ATTEST],
      ],
      sigs: [{ qui: "Évelyne Roux", t: S }],
    }),
  }, {
    enquete: [
      { id: "temoin_roux", type: "temoin", titre: "Mme Roux, la voisine du deuxième", desc: "Elle a vu la scène. En citation directe, c'est à la partie civile d'apporter la preuve : une attestation, et sa présence à l'audience.", piste: ["A4_temoin"],
        modes: [{ id: "vous", label: "Aller la voir vous-même", sub: "Une heure et demie, trajet compris, pour l'écouter et lui expliquer l'attestation.", temps: 90, kind: "meet", delai: 2 }, { id: "enqueteur", label: "Mandater un enquêteur de droit privé", sub: "Il la rencontre et recueille l'attestation.", argent: 350, frais: "Enquêteur de droit privé", delai: 6 }],
        doc: "enq_roux", titrePiece: "Attestation de Mme Roux",
        envoi: (api, st) => ({ from: st.mode === "enqueteur" ? "Bertrand Ollier, enquêteur" : "Évelyne Roux", subject: "L'attestation de Mme Roux", body: [[st.mode === "enqueteur" ? "Maître, Mme Roux a accepté d'attester ; elle est disposée à venir à l'audience." : "Maître, voici mon attestation, comme convenu. Je viendrai au tribunal si vous me le demandez."]] }) },
    ],
  });

  // =================================================================== AFFAIRE 5 — le faux conseiller en placement (partie civile)
  put("a05_placement", {
    recepisse: (x) => ({
      title: "Récépissé de dépôt de plainte", kind: "pv",
      entete: ["Commissariat central du 18e", "Article 15-3 du code de procédure pénale · Procédure n° 2026/18/03921"],
      paras: [
        [{ t: `Plainte déposée le ${D(x.cs.vars.plainteSimpleDay)} par Mme Jacqueline Bernard pour escroquerie.`, f: "A5_recepisse" }],
        ["Heure du dépôt : 10 h 40. Personne mise en cause : M. Sébastien Rolland, se disant conseiller en patrimoine, et la société Rolland Patrimoine Conseil."],
        ["Préjudice déclaré : 18 000 euros."],
        ["Le présent récépissé vaut preuve du dépôt (art. 15-3 CPP). La copie du procès-verbal de plainte peut être délivrée sur demande. Vous serez avisée de la suite donnée à votre plainte."],
      ],
      sigs: [{ qui: "L'agent de police judiciaire", t: S }],
    }),
    releve: (x) => {
      const f = x.cs.proc.faitsDay;
      const v = (d) => ({ t: `${dm(d)} · VIR SEPA émis · ROLLAND PATRIMOINE CONSEIL · FR76 3047 8000 1234 5678 9012 345 · − 6 000,00 €`, f: "A5_virements_doc" });
      return {
        title: "Relevés bancaires (extraits)", kind: "releve",
        entete: ["Banque Postale · Compte courant de Mme Jacqueline Bernard", `Période du ${N(f - 50)} au ${N(f + 5)}`],
        paras: [
          [`${dm(f - 48)} · Pension de retraite · + 1 640,00 €`],
          [`${dm(f - 45)} · Prélèvement EDF · − 74,20 €`],
          [v(f - 41)],
          [`${dm(f - 30)} · Virement interne depuis livret A · + 6 000,00 €`],
          [v(f - 22)],
          [`${dm(f - 18)} · Pension de retraite · + 1 640,00 €`],
          [`${dm(f - 3)} · Rachat partiel assurance-vie · + 6 000,00 €`],
          [v(f)],
          [{ t: "Sur la période : trois virements de 6 000 € chacun vers « Rolland Patrimoine Conseil », IBAN FR76 3047 8000 1234 5678 9012 345.", f: "A5_virements_doc" }],
        ],
      };
    },
    messages: (x) => {
      const f = x.cs.proc.faitsDay;
      return {
        title: "Captures des messages WhatsApp", kind: "sms",
        entete: ["Téléphone de Mme Bernard · conversation avec « Sébastien R. — Patrimoine »"],
        paras: [
          [`${N(f - 47)} 10:14 — Sébastien R. : Bonjour madame Bernard, suite à notre échange téléphonique, je vous envoie la plaquette de notre fonds Sérénité.`],
          [{ t: "« À votre âge, il faut sécuriser votre épargne, madame Bernard. »", f: "A5_age" }],
          [{ t: "« Rendement garanti de 8 %, sans aucun risque, adossé à une grande banque. »", f: "A5_garanti" }],
          [`${N(f - 42)} 18:02 — Jacqueline : Mon fils me dit de me méfier.`],
          [{ t: "« Ne dites rien à vos enfants, ils ne comprendraient pas. »", f: "A5_isoler" }],
          [`${N(f - 23)} 09:30 — Sébastien R. : Votre deuxième versement est bien arrivé. Vos intérêts du trimestre : 360 €, versés à l'échéance.`],
          [`${N(f - 2)} 11:47 — Sébastien R. : Petite formalité de la banque dépositaire : un dernier versement de 6 000 € pour libérer les intérêts.`],
          ["« Le dernier virement débloque vos intérêts. »"],
          [`${N(f + 9)} 14:20 — Jacqueline : Je n'ai rien reçu. Répondez-moi s'il vous plaît.`],
          [`${N(f + 16)} 08:55 — Jacqueline : Monsieur Rolland ? (message non distribué)`],
        ],
      };
    },
    amf: () => ({
      title: "Liste noire de l'AMF (extrait)", kind: "courrier",
      entete: ["Autorité des marchés financiers", "Liste des sites internet et entités non autorisés à proposer des placements"],
      paras: [
        [{ t: "Site rolland-patrimoine.fr : proposition de placements sans autorisation. Inscription sur la liste des sites non autorisés.", f: "A5_amf_doc" }],
        ["Catégorie : placements atypiques et produits d'épargne promettant un rendement élevé et garanti."],
        ["L'AMF rappelle qu'aucun placement ne peut promettre à la fois un rendement élevé et l'absence de risque."],
      ],
    }),
    reqbank: () => ({
      title: "Réponse aux réquisitions bancaires", kind: "releve",
      entete: ["Cabinet de Mme Ferraud, juge d'instruction · Commission rogatoire", "Compte de la société Rolland Patrimoine Conseil — cote D45"],
      paras: [
        ["Titulaire : SAS Rolland Patrimoine Conseil, représentée par M. Sébastien Rolland. Ouverture du compte : quatorze mois avant les faits."],
        [{ t: "Les fonds reçus sur le compte de Rolland Patrimoine Conseil ont été virés, sous quarante-huit heures, vers les comptes personnels de M. Rolland et retirés en espèces.", f: "A5_flux" }],
        ["Crédits sur la période : 412 500 €, provenant de douze donneurs d'ordre. Débits : virements vers deux comptes personnels de M. Rolland (389 000 €), retraits en espèces (21 300 €)."],
        ["Onze autres personnes, toutes âgées de plus de soixante-dix ans, ont versé des fonds sur ce compte."],
        ["Solde au jour de la réquisition : 2 210 €."],
      ],
    }),
  });

  // =================================================================== AFFAIRE 6 — les messages
  put("a06_messages", {
    plainte: (x) => ({
      title: "Procès-verbal de plainte de M. Julien Mercier", kind: "pv",
      entete: ["Commissariat central du 18e", "Procédure n° 2026/18/06620 — cote D1"],
      paras: [
        [`Le ${D(x.cs.proc.faitsDay + 3)}, à 17 h 20, nous, brigadier Paul Garnier, agent de police judiciaire, recevons la plainte de M. Julien Mercier, né le 30 avril 1987, gérant de société, demeurant à Paris 17e, qui déclare :`],
        ["J'étais associé de M. Karim Benhamou dans un restaurant, rue Ordener. Nous avons fermé en juin."],
        ["Depuis la fermeture de notre restaurant, M. Benhamou m'envoie des messages tous les jours, la nuit aussi."],
        [{ t: "Il m'a écrit : « Tu vas le regretter. » J'ai peur pour moi et pour ma famille.", f: "K_plainte_peur" }],
        ["Il parle d'argent que je lui devrais. Je conteste lui devoir quoi que ce soit."],
        ["J'ai changé de numéro. Je dors mal. Je vous remets les captures d'écran."],
        ["Lecture faite, persiste et signe."],
      ],
      sigs: [{ qui: "L'agent de police judiciaire", t: S }, { qui: "Le plaignant", t: S }],
    }),
    captures: (x) => {
      const f = x.cs.proc.faitsDay;
      return {
        title: "Captures d'écran des messages", kind: "sms",
        entete: ["Annexe au procès-verbal de plainte (cote D1-2)", "Expéditeur : « Karim B. » — destinataire : M. Julien Mercier"],
        paras: [
          [`${N(f - 13)} 23:41 — « Réponds. »`],
          [`${N(f - 13)} 23:58 — « Réponds. »`],
          [`${N(f - 12)} 00:31 — `, { t: "« Réponds. » (trente et une fois en deux semaines)", f: "K_nombre" }],
          [`${N(f - 9)} 02:14 — « Tu me dois 12 000 euros, tu le sais. »`],
          [`${N(f - 6)} 01:30 — « Tu crois que tu vas t'en tirer comme ça ? »`],
          [`${N(f - 6)} 01:32 — `, { t: "« Tu vas le regretter. »", f: "K_regretter" }],
          [`${N(f - 2)} 22:05 — `, { t: "« Je vais tout raconter à ta femme. »", f: "K_femme" }],
          [`Dernier message reçu le ${N(f)} à 23:12. Aucun message après cette date. Total : quarante-deux messages, dont trente et un « Réponds. »`],
        ],
      };
    },
    certificat: (x) => ({
      title: "Certificat médical de M. Mercier", kind: "courrier",
      entete: ["Dr Paul Lemoine, médecin généraliste", "Avenue de Clichy, 75017 Paris"],
      paras: [
        [`Je soussigné, Dr Paul Lemoine, certifie avoir examiné le ${D(x.cs.proc.faitsDay + 2)} M. Julien Mercier, qui déclare recevoir depuis deux semaines de nombreux messages d'un ancien associé, de jour comme de nuit.`],
        [{ t: "État anxieux réactionnel ; troubles du sommeil. Pas d'incapacité totale de travail.", f: "K_certif" }],
        ["Prescription : un traitement léger pour le sommeil, quinze jours."],
        ["Certificat remis en main propre à l'intéressé."],
      ],
      sigs: [{ qui: "Dr P. Lemoine", t: S }],
    }),
    enq_compta: () => ({
      title: "Attestation de l'expert-comptable", kind: "courrier",
      entete: ["Cabinet Delorme & associés · Expertise comptable", "Boulevard Ornano, 75018 Paris"],
      paras: [
        ["Je soussigné Hervé Delorme, expert-comptable inscrit au tableau de l'Ordre, en charge des comptes de la SARL Le Comptoir d'Ordener jusqu'à sa liquidation amiable,"],
        ["atteste qu'aux termes du bilan de liquidation, M. Karim Benhamou détenait un compte courant d'associé créditeur dont le remboursement incombait à M. Julien Mercier, qui avait repris le fonds."],
        [{ t: "Le solde dû à M. Benhamou s'élève à 12 000 euros. Il n'a pas été réglé à ce jour.", f: "K_dette" }],
        ["Extrait du bilan de liquidation joint."],
        [ATTEST],
      ],
      sigs: [{ qui: "H. Delorme, expert-comptable", t: S }],
    }),
  }, {
    enquete: [
      { id: "compta", type: "temoin", camp: "defense", titre: "L'expert-comptable de l'ancienne société", desc: "Il a établi les comptes de la liquidation. Ce n'est pas une excuse aux messages ; c'est le contexte, qui pèse sur l'orientation de la procédure.", piste: ["K_dette"],
        modes: [{ id: "vous", label: "Le joindre et lui demander une attestation", sub: "Trois quarts d'heure d'appels et de courriels.", temps: 45, kind: "call", delai: 3 }, { id: "payant", label: "Lui commander une attestation avec l'extrait du bilan", sub: "Honoraires de l'expert-comptable.", argent: 180, frais: "Honoraires d'expert-comptable", delai: 2 }],
        doc: "enq_compta", titrePiece: "Attestation de l'expert-comptable",
        envoi: () => ({ from: "Hervé Delorme, expert-comptable", subject: "Attestation — SARL Le Comptoir d'Ordener", body: [["Maître, comme convenu, mon attestation et l'extrait du bilan de liquidation."]] }) },
    ],
  });

  // =================================================================== AFFAIRE 7 — la perquisition de 5 h 30
  put("a07_perquisition", {
    pv_perquisition: (x) => {
      const p = x.cs.vars.perqDay;
      return {
        title: "Procès-verbal de perquisition", kind: "pv",
        entete: ["Préfecture de police · Brigade des stupéfiants", "Commission rogatoire de M. Vauclair, juge d'instruction — cote D21"],
        paras: [
          [{ t: `Le ${D(p)} à 5 h 30, agissant en exécution de la commission rogatoire de M. Vauclair, juge d'instruction, nous présentons au domicile de M. Ilyes Kaddour, rue Belliard, Paris 18e.`, f: "K7_pv_heure", flag: "perq_nuit" }],
          ["Nous, Laurent Arnoux, capitaine de police, officier de police judiciaire, assisté du brigadier-chef Serge Lagarde et des gardiens de la paix Marc Vidal et Inès Haddad, au 41 de la rue Belliard, troisième étage, porte gauche."],
          ["Frappons et nous annonçons : « Police ! » En l'absence de réponse, procédons à l'ouverture forcée de la porte au moyen d'un bélier."],
          ["M. Ilyes Kaddour, né le 14 mai 1999 à Paris 18e, est présent, ainsi que sa sœur, Mme Sabrina Kaddour. Les opérations se déroulent en présence constante de M. Kaddour (art. 57 et 95 du code de procédure pénale)."],
          [{ t: "Dans la chambre, découvrons sous le lit une boîte contenant trois plaquettes de résine de cannabis, une balance électronique et 1 200 euros en espèces.", f: "K7_decouverte" }],
          ["Fouille du reste de l'appartement : rien d'autre. Saisie du téléphone portable de M. Kaddour."],
          ["Opérations terminées à 6 h 40, en présence de la personne. Conduisons M. Kaddour dans nos locaux."],
          ["Dont procès-verbal, que M. Kaddour signe avec nous après lecture."],
        ],
        sigs: [{ qui: "Capitaine L. Arnoux, officier de police judiciaire", t: S }, { qui: "La personne présente aux opérations", t: S }],
      };
    },
    pv_saisie: (x) => ({
      title: "Procès-verbal de saisie et de pesée", kind: "pv",
      entete: ["Préfecture de police · Brigade des stupéfiants", "Commission rogatoire de M. Vauclair — cote D22"],
      paras: [
        [`Le ${D(x.cs.vars.perqDay)}, à 8 h 15, au service, nous, capitaine Laurent Arnoux, officier de police judiciaire, procédons à la pesée des objets découverts lors de la perquisition (cote D21), en présence de M. Ilyes Kaddour.`],
        ["Balance du service, étalonnée, numéro d'inventaire BS-0412."],
        [{ t: "Pesée : 302 grammes de résine de cannabis. Placés sous scellés n° 1 à 3, avec la balance (scellé 4) et les espèces (scellé 5).", f: "K7_pesee" }],
        ["Détail : plaquette 1 : 101 g ; plaquette 2 : 100 g ; plaquette 3 : 101 g. Espèces : 1 200 euros, en vingt billets de 50 euros et dix billets de 20 euros."],
        ["Test de détection rapide : positif au cannabis."],
        ["Dont procès-verbal, que M. Kaddour signe avec nous."],
      ],
      sigs: [{ qui: "Capitaine L. Arnoux, officier de police judiciaire", t: S }, { qui: "M. Ilyes Kaddour", t: S }],
    }),
    rapport_surv: (x) => ({
      title: "Rapport de surveillance", kind: "pv",
      entete: ["Préfecture de police · Brigade des stupéfiants", "Commission rogatoire de M. Vauclair — cote D14"],
      paras: [
        [`Du ${D(x.cs.vars.perqDay - 29)} au ${D(x.cs.vars.perqDay - 15)}, surveillance de l'immeuble de la rue Belliard.`],
        ["Dispositif : véhicule banalisé stationné face au 41, de 18 heures à 23 heures, onze soirées."],
        [{ t: "Constatons des allées et venues fréquentes au domicile de M. Kaddour, en soirée. Aucune remise de produit n'est observée.", f: "K7_aucune_vente" }],
        ["Les visiteurs restent entre dix minutes et une heure. Aucun n'est contrôlé, pour ne pas compromettre l'enquête."],
        [{ t: "L'entrée de l'immeuble, au 41, est équipée d'une caméra du syndic orientée vers le hall.", f: "K7_camera" }],
      ],
      sigs: [{ qui: "Brigadier-chef S. Lagarde", t: S }],
    }),
    pv_gav: (x) => ({
      title: "Procès-verbal d'audition en garde à vue", kind: "pv",
      entete: ["Préfecture de police · Brigade des stupéfiants", "Commission rogatoire de M. Vauclair — cote D30"],
      paras: [
        [`Le ${D(x.cs.vars.perqDay)}, à 11 h 00, nous, capitaine Laurent Arnoux, officier de police judiciaire, entendons M. Ilyes Kaddour, placé en garde à vue, assisté de l'avocat de permanence.`],
        ["Sur la résine découverte sous son lit, il déclare :"],
        [{ t: "« La résine, c'est pour moi. Je fume depuis longtemps. Les espèces, c'est l'argent de ma mère pour le loyer. »", f: "K7_version" }],
        ["Sur les visites du soir : « Ce sont des copains. On joue à la console. »"],
        ["Sur la balance : « Pour ne pas me faire avoir quand j'achète. »"],
        ["Fin de l'audition à 11 h 50. Lecture faite, persiste et signe avec nous et son avocat."],
      ],
      sigs: [{ qui: "Capitaine L. Arnoux, officier de police judiciaire", t: S }, { qui: "La personne gardée à vue", t: S }, { qui: "L'avocat", t: S }],
    }),
    cr_ji: (x) => ({
      title: "Commission rogatoire", kind: "greffe",
      entete: ["Tribunal judiciaire de Paris · Cabinet de M. Henri Vauclair, juge d'instruction", "Information n° 2026/JI-5/118 — cote D10"],
      paras: [
        ["Nous, Henri Vauclair, juge d'instruction au tribunal judiciaire de Paris,"],
        ["Vu l'information suivie contre X du chef d'acquisition, détention, offre ou cession de stupéfiants ; vu les articles 81 et 151 à 155 du code de procédure pénale ;"],
        ["Donnons commission rogatoire au chef de la brigade des stupéfiants de la préfecture de police de procéder à toutes auditions, perquisitions, saisies, réquisitions et surveillances utiles à la manifestation de la vérité."],
        [{ t: "La présente commission rogatoire est exécutée dans les formes prévues par le code de procédure pénale.", f: "K7_pas_ordonnance" }],
        [`Fixons au ${D(x.cs.vars.perqDay + 60)} la date de retour des pièces d'exécution.`],
        [`Fait en notre cabinet, le ${D(x.cs.vars.perqDay - 30)}.`],
      ],
      sigs: [{ qui: "Le juge d'instruction", t: S }],
    }),
    enq_soeur: (x) => ({
      title: "Attestation de Mme Sabrina Kaddour", kind: "courrier",
      entete: ["Attestation établie selon les formes de l'article 202 du code de procédure civile"],
      paras: [
        ["Je soussignée Sabrina Kaddour, née le 3 décembre 2001 à Paris 18e, étudiante, sœur de M. Ilyes Kaddour, demeurant avec lui rue Belliard,"],
        [`atteste que le ${D(x.cs.vars.perqDay)}, j'ai été réveillée par des coups contre la porte. J'ai pris mon téléphone sur la table de nuit : il était 5 h 28.`],
        [{ t: "La porte a cédé presque aussitôt ; les policiers sont entrés avant 5 h 30. Mon réveil, réglé sur 6 h 15, n'avait pas encore sonné.", f: "K7_heure" }],
        ["Ils sont restés jusqu'à un peu plus de 6 h 30 et sont partis avec mon frère."],
        [ATTEST],
      ],
      sigs: [{ qui: "Sabrina Kaddour", t: S }],
    }),
    enq_hall: (x) => ({
      title: "Procès-verbal de constat — caméra du hall", kind: "video",
      entete: [CJ, "Rue de Clignancourt, 75018 Paris"],
      paras: [
        [`À la requête de M. Ilyes Kaddour, représenté par ${me(x)}, je me suis rendue dans les locaux du syndic de l'immeuble du 41, rue Belliard, qui m'a présenté les enregistrements de la caméra du hall, conservés à la suite de la demande de l'avocat.`],
        [`Horodatage de l'enregistreur : ${N(x.cs.vars.perqDay)} ; écart avec l'heure légale vérifié ce jour : moins d'une minute.`],
        [{ t: "05:29:48 — Quatre hommes porteurs de brassards « Police », dont l'un tient un bélier, entrent dans le hall et prennent l'escalier.", f: "K7_heure" }],
        ["05:30:05 — Coups sourds audibles dans la cage d'escalier (la caméra enregistre le son)."],
        ["06:44:10 — Les mêmes hommes ressortent, accompagnés d'un jeune homme menotté."],
        ["Les images sont remises sur clé USB à l'avocat requérant ; le syndic les conserve à la disposition de l'autorité judiciaire."],
      ],
      sigs: [{ qui: "Me L. Dumas, commissaire de justice", t: S }],
    }),
  }, {
    enquete: [
      { id: "soeur", type: "temoin", titre: "Sabrina, la sœur, présente à l'aube", desc: "Elle était dans l'appartement quand les policiers sont entrés. Son attestation dit ce qu'elle a vu et entendu, et à quelle heure.", piste: ["pv_perquisition"],
        modes: [{ id: "vous", label: "Recueillir son attestation", sub: "Une demi-heure au téléphone, puis elle l'écrit et l'envoie.", temps: 30, kind: "call", delai: 1 }],
        doc: "enq_soeur", titrePiece: "Attestation de Sabrina Kaddour",
        envoi: () => ({ from: "Sabrina Kaddour", subject: "Mon attestation", body: [["Maître, voici l'attestation, signée, avec ma carte d'identité."]] }) },
      { id: "hall", type: "video", titre: "La caméra du hall de l'immeuble", desc: "Le syndic a une caméra dans le hall. Affichette à l'entrée : « Images conservées trente jours. »", piste: ["K7_camera"],
        limite: (api) => api.cs.vars.perqDay + 30,
        modes: [lettreVideo({ lettre: "Écrire au syndic et au juge d'instruction", delaiLettre: 10, saisieLettre: 4 }), constatVideo({ prix: 420 })],
        doc: "enq_hall", titrePiece: "Constat : la caméra du hall",
        envoi: (api, st) => ({ from: st.mode === "constat" ? "Me Laure Dumas, commissaire de justice" : "Cabinet de M. Vauclair, juge d'instruction", subject: "Images de la caméra du hall — rue Belliard", body: [[st.mode === "constat" ? "Maître, vous trouverez ci-joint mon procès-verbal de constat." : "Maître, le syndic a conservé les images ; le constat de leur contenu est joint au dossier."]] }),
        perdu: (api, st, lim) => ({ from: "Cabinet Foncia Belliard, syndic", subject: "Images de la caméra du hall", body: [[`Maître, les enregistrements sont écrasés après trente jours. Ceux du ${D(api.cs.vars.perqDay)} n'existent plus depuis le ${D(lim + 1)}.`]] }) },
    ],
  });

  // =================================================================== AFFAIRE 8 — le cycliste (partie civile)
  put("a08_cycliste", {
    pv_constat: (x) => ({
      title: "Procès-verbal de constatations", kind: "pv",
      entete: ["Préfecture de police · Service de traitement judiciaire des accidents", "Procédure n° 2026/STJA/2214 — cote D3"],
      paras: [
        [{ t: `Le ${D(x.cs.proc.faitsDay)} à 23 h 10, au carrefour du boulevard de Magenta et de la rue La Fayette (10e), collision entre un véhicule Peugeot 5008 et un cycliste.`, f: "F8_faits_pv" }],
        ["Requis par le centre d'information et de commandement à 23 h 12, nous, brigadier-chef Yann Hamon, officier de police judiciaire, arrivons sur les lieux à 23 h 21."],
        ["Vitesse limitée à 30 km/h. Chaussée sèche. Éclairage public en fonctionnement. Carrefour équipé de feux tricolores, en fonctionnement normal à notre arrivée."],
        ["Le véhicule, immatriculé FT-902-LK, conduit par M. Grégory Vasseur, est arrêté à 11 mètres au-delà du passage piéton. Pas de trace de freinage visible avant le point de choc."],
        [{ t: "Le cycliste, Bastien Fournier, 19 ans, ne porte pas de casque. Il décède à l'hôpital Lariboisière à 1 h 40.", f: "F8_casque" }],
        [{ t: "Le carrefour est couvert par une caméra de vidéoprotection de la préfecture de police (mât n° 10-214).", f: "F8_camera" }],
        ["Un témoin, livreur à scooter, laisse son numéro de téléphone à l'équipage avant de repartir."],
        ["Dont procès-verbal."],
      ],
      sigs: [{ qui: "Brigadier-chef Y. Hamon, officier de police judiciaire", t: S }],
    }),
    pv_depistage: (x) => ({
      title: "Procès-verbal de dépistage et de prélèvement", kind: "pv",
      entete: ["Service de traitement judiciaire des accidents", "Procédure n° 2026/STJA/2214 — cote D5"],
      paras: [
        ["Sur les lieux, nous, brigadier-chef Yann Hamon, officier de police judiciaire, procédons aux dépistages prévus par les articles L. 234-3 et L. 235-2 du code de la route sur le conducteur, M. Grégory Vasseur."],
        ["Dépistage de l'imprégnation alcoolique à 23 h 35 : négatif."],
        [{ t: "À 23 h 40, dépistage salivaire de M. Grégory Vasseur : positif au tétrahydrocannabinol (THC).", f: "F8_thc" }],
        [{ t: "À 0 h 55, prélèvement sanguin à l'hôpital Lariboisière, placé sous scellé et adressé au laboratoire pour analyse. Résultat non joint à la procédure.", f: "F8_prelevement" }],
        ["Rétention du permis de conduire de M. Vasseur à 1 h 10 (art. L. 224-1)."],
      ],
      sigs: [{ qui: "Brigadier-chef Y. Hamon", t: S }, { qui: "M. Grégory Vasseur", t: S }],
    }),
    pv_vasseur: (x) => ({
      title: "Procès-verbal d'audition de M. Vasseur", kind: "pv",
      entete: ["Service de traitement judiciaire des accidents", "Procédure n° 2026/STJA/2214 — cote D9"],
      paras: [
        [`Le ${D(x.cs.proc.faitsDay + 1)}, à 10 h 00, nous, brigadier-chef Yann Hamon, entendons en audition libre M. Grégory Vasseur, né le 3 mars 1992 à Creil, commercial, demeurant à Saint-Denis, après lui avoir notifié ses droits (art. 61-1). Il renonce à l'avocat.`],
        [{ t: "« Le feu était vert pour moi. Le vélo a grillé le rouge, il est sorti de nulle part. »", f: "F8_version" }],
        [{ t: "« Je roulais à trente, quarante maximum. »", f: "F8_vitesse_dite" }],
        ["« Le joint, c'était la veille au soir. Je n'étais pas défoncé. »"],
        ["« Je rentrais d'un rendez-vous client. Je connais bien ce carrefour. »"],
        ["Fin de l'audition à 10 h 40. Lecture faite, persiste et signe."],
      ],
      sigs: [{ qui: "Brigadier-chef Y. Hamon", t: S }, { qui: "La personne entendue", t: S }],
    }),
    facture: (x) => ({
      title: "Facture des pompes funèbres", kind: "releve",
      entete: ["Pompes funèbres du Faubourg · rue du Faubourg-Saint-Denis, 75010 Paris", `Facture n° PF-2026-0743 du ${N(x.cs.proc.faitsDay + 6)}`],
      paras: [
        ["Obsèques de M. Bastien Fournier — famille Fournier."],
        ["Cercueil chêne, capiton, plaque ........ 1 890,00 €"],
        ["Soins de conservation, mise en bière ........ 620,00 €"],
        ["Cérémonie, corbillard, porteurs ........ 1 140,00 €"],
        ["Concession et inhumation, cimetière parisien de Pantin ........ 1 150,00 €"],
        [{ t: "Obsèques de M. Bastien Fournier : cercueil, cérémonie, inhumation au cimetière parisien de Pantin. Total TTC : 4 800,00 €.", f: "F8_facture" }],
        ["Acquittée par M. et Mme Fournier."],
      ],
    }),
    video: (x) => ({
      title: "Exploitation des images de vidéoprotection", kind: "video",
      entete: ["Cabinet de Mme Ferraud, juge d'instruction · Commission rogatoire", "Mât n° 10-214, carrefour Magenta – La Fayette — cote D31"],
      paras: [
        [`Images du ${D(x.cs.proc.faitsDay)}, requises auprès de la préfecture de police avant leur effacement. Caméra fixe orientée vers le carrefour, sans le son.`],
        ["23:09:51 — Le cycliste descend le boulevard de Magenta, à vitesse régulière, sans casque."],
        [{ t: "Le feu du cycliste passe au rouge une seconde avant que la roue avant franchisse la ligne d'arrêt.", f: "F8_video_feu" }],
        [{ t: "Le véhicule Peugeot 5008 aborde le carrefour à une vitesse estimée à 62 km/h, pour une vitesse limitée à 30 km/h.", f: "F8_vitesse" }],
        ["23:09:55 — Le conducteur ne freine qu'au moment du choc. Le cycliste est projeté à environ huit mètres."],
        ["Estimation de la vitesse : distance entre deux repères au sol (18 m) parcourue en 1,04 seconde."],
      ],
      sigs: [{ qui: "L'officier de police judiciaire", t: S }],
    }),
    temoin: (x) => ({
      title: "Procès-verbal d'audition de M. Diakité, témoin", kind: "pv",
      entete: ["Cabinet de Mme Ferraud, juge d'instruction · Commission rogatoire", "Cote D33"],
      paras: [
        ["Nous entendons M. Seydou Diakité, né le 12 août 1997, livreur, qui déclare :"],
        ["J'étais arrêté au feu, rue La Fayette, sur mon scooter."],
        [{ t: "« Le vélo est passé à l'orange, peut-être au tout début du rouge. La voiture arrivait très vite, elle n'a pas ralenti. »", f: "F8_temoin_pv" }],
        ["J'ai appelé les secours. J'ai laissé mon numéro aux policiers."],
        ["Lecture faite, persiste et signe."],
      ],
      sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "Le témoin", t: S }],
    }),
    tox: () => ({
      title: "Rapport d'analyse toxicologique", kind: "pv",
      entete: ["Laboratoire de toxicologie · expert inscrit", "Cote D35"],
      paras: [
        ["Scellé : prélèvement sanguin de M. Grégory Vasseur, effectué à 0 h 55, reçu intact."],
        ["Méthode : chromatographie en phase gazeuse couplée à la spectrométrie de masse."],
        [{ t: "Prélèvement sanguin de M. Grégory Vasseur : présence de THC à 3,1 ng/ml, compatible avec un usage récent.", f: "F8_tox" }],
        ["THC-COOH : 28 ng/ml. Alcool : négatif."],
      ],
      sigs: [{ qui: "L'expert toxicologue", t: S }],
    }),
    enq_pharma: (x) => ({
      title: "Procès-verbal de constat — caméra de la pharmacie", kind: "video",
      entete: [CJ, "Rue de Clignancourt, 75018 Paris"],
      paras: [
        [`À la requête de M. et Mme Fournier, représentés par ${me(x)}, je me suis rendue à la pharmacie de l'angle du boulevard de Magenta et de la rue La Fayette, dont le titulaire a conservé à la demande de l'avocat les images de sa caméra de vitrine.`],
        [`Horodatage : ${N(x.cs.proc.faitsDay)} ; l'enregistreur avance de 40 secondes sur l'heure légale, heures corrigées ci-dessous.`],
        ["23:09:52 — Un cycliste traverse le champ de la caméra, de gauche à droite."],
        [{ t: "23:09:54 — Un SUV de couleur sombre traverse le passage piéton du boulevard, long de quatorze mètres, en moins d'une seconde ; ses feux stop ne s'allument qu'au point de choc.", f: "F8_vitesse" }],
        ["La caméra ne voit pas les feux tricolores."],
        ["Copie des images remise à l'avocat requérant, sur clé USB."],
      ],
      sigs: [{ qui: "Me L. Dumas, commissaire de justice", t: S }],
    }),
    enq_livreur: () => ({
      title: "Attestation de M. Seydou Diakité", kind: "courrier",
      entete: ["Attestation établie selon les formes de l'article 202 du code de procédure civile", `Recueillie par ${ENQ}`],
      paras: [
        ["Je soussigné Seydou Diakité, né le 12 août 1997, livreur, sans lien avec les parties,"],
        ["atteste que j'étais arrêté au feu, rue La Fayette, sur mon scooter, au moment de l'accident."],
        [{ t: "« Le vélo est passé à l'orange, peut-être au tout début du rouge. La voiture arrivait très vite, elle n'a pas ralenti. »", f: "F8_temoin_pv" }],
        ["J'ai dit au père du jeune homme ce que j'avais vu. Je suis prêt à le redire devant le juge."],
        [ATTEST],
      ],
      sigs: [{ qui: "Seydou Diakité", t: S }],
    }),
  }, {
    enquete: [
      { id: "pharma", type: "video", titre: "La caméra de la pharmacie, à l'angle", desc: "Une caméra privée, sur la vitrine. Elle n'est pas dans la procédure. Comme toute caméra, ses images ne sont pas conservées au-delà d'un mois.", piste: ["F8_camera"],
        limite: (api) => api.cs.vars.videoLimite,
        modes: [lettreVideo({ lettre: "Écrire au pharmacien et au juge d'instruction", delaiLettre: 9, saisieLettre: 3 }), constatVideo({ prix: 390 })],
        doc: "enq_pharma", titrePiece: "Constat : la caméra de la pharmacie",
        envoi: (api, st) => ({ from: st.mode === "constat" ? "Me Laure Dumas, commissaire de justice" : "Pharmacie Magenta – La Fayette", subject: "Images de la caméra de la pharmacie", body: [[st.mode === "constat" ? "Maître, vous trouverez ci-joint mon procès-verbal de constat." : "Maître, nous avons conservé les images ; un commissaire de justice les a décrites à la demande du juge. Copie jointe."]] }),
        perdu: (api, st, lim) => ({ from: "Pharmacie Magenta – La Fayette", subject: "Votre demande d'images", body: [[`Maître, notre système écrase les images au bout d'un mois. Celles du ${D(api.cs.proc.faitsDay)} n'existent plus depuis le ${D(lim + 1)}. Je suis désolé.`]] }) },
      { id: "livreur", type: "temoin", titre: "Le livreur à scooter", desc: "Il s'est arrêté, a laissé son numéro aux policiers et parlé au père. Un enquêteur peut le retrouver par sa plateforme de livraison.", piste: ["F8_temoin"],
        modes: [{ id: "enqueteur", label: "Mandater un enquêteur de droit privé", sub: "Retrouver le témoin et recueillir son attestation.", argent: 450, frais: "Enquêteur de droit privé", delai: 8 }],
        doc: "enq_livreur", titrePiece: "Attestation du livreur",
        envoi: () => ({ from: "Bertrand Ollier, enquêteur", subject: "Le témoin de l'accident — M. Diakité", body: [["Maître, j'ai retrouvé le livreur par sa plateforme. Son attestation est jointe ; il accepte d'être entendu."]] }) },
    ],
  });

  // =================================================================== AFFAIRE 9 — les coups de couteau (défense ou partie civile)
  const A9 = {
    pv_constat: (x) => ({
      title: "Procès-verbal de constatations", kind: "pv",
      entete: ["Commissariat central du 11e", "Procédure n° 2026/11/07780 — cote D2"],
      paras: [
        [{ t: `Le ${D(x.cs.proc.faitsDay)} à 1 h 50, rue Oberkampf, devant le bar « Le Zinc », un homme est allongé sur le trottoir, blessé au thorax.`, f: "K9_faits" }],
        ["Requis à 1 h 47 par le portier du bar, l'équipage arrive à 1 h 50 ; les sapeurs-pompiers sont sur place."],
        ["La victime, Hugo Lemaire, est transportée à l'hôpital Saint-Antoine. L'auteur a pris la fuite à pied vers la rue Saint-Maur."],
        ["Sur le trottoir : traces de sang, un téléphone et une casquette. Aucune arme n'est retrouvée."],
        ["Deux amis de la victime, présents, refusent de décliner leur identité et quittent les lieux."],
        ["Le bar est équipé d'une caméra filmant l'entrée et le trottoir."],
      ],
      sigs: [{ qui: "L'officier de police judiciaire", t: S }],
    }),
    certif: () => ({
      title: "Certificat médical et compte rendu opératoire", kind: "pv",
      entete: ["Hôpital Saint-Antoine · Service de chirurgie thoracique", "Cote D8"],
      paras: [
        ["Admission à 2 h 08 de M. Hugo Lemaire, 25 ans, pour deux plaies thoraciques par arme blanche. Conscient, état hémodynamique instable."],
        [{ t: "Deux plaies thoraciques gauches. L'une, de 6 cm de profondeur, s'arrête à 2 cm du péricarde ; l'autre, superficielle, sur le flanc.", f: "K9_plaies" }],
        ["Thoracotomie en urgence à 2 h 40 : hémostase, drainage. Suites simples. Sortie au huitième jour."],
        [{ t: "Incapacité totale de travail : 30 jours, sous réserve de complications.", f: "K9_itt" }],
        ["Alcoolémie à l'admission : 1,4 g/l."],
      ],
      sigs: [{ qui: "Dr C. Aubert, chirurgien", t: S }],
    }),
    pv_gav_malik: (x) => ({
      title: "Procès-verbal d'audition de M. Ferhat en garde à vue", kind: "pv",
      entete: ["Commissariat central du 11e", "Procédure n° 2026/11/07780 — cote D14"],
      paras: [
        [{ t: "M. Ferhat s'est présenté spontanément au commissariat le lendemain à 10 heures, avec le couteau.", f: "K9_rendu" }],
        [`Le ${D(x.cs.proc.faitsDay + 1)}, à 14 h 30, nous entendons M. Malik Ferhat, né le 7 février 2003, apprenti boulanger, placé en garde à vue à 10 h 05, droits notifiés à 10 h 10, assisté de son avocat.`],
        ["Il déclare :"],
        [{ t: "« Ils étaient trois sur moi. J'étais par terre, ils me donnaient des coups de pied. »", f: "K9_trois" }],
        [{ t: "« J'ai sorti le couteau pour leur faire peur. Je ne voulais pas le tuer. »", f: "K9_peur" }],
        ["« Je porte ce couteau depuis qu'on m'a agressé, il y a cinq ans. Je regrette. Je suis venu de moi-même. »"],
        ["Fin de l'audition à 15 h 20. Lecture faite, persiste et signe avec nous et son avocat."],
      ],
      sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "La personne gardée à vue", t: S }, { qui: "L'avocat", t: S }],
    }),
    pv_videur: (x) => ({
      title: "Procès-verbal d'audition de M. Soumaré, agent de sécurité du bar", kind: "pv",
      entete: ["Commissariat central du 11e", "Procédure n° 2026/11/07780 — cote D11"],
      paras: [
        [`Le ${D(x.cs.proc.faitsDay)}, à 4 h 15, nous entendons M. Ibrahima Soumaré, né le 19 octobre 1984, agent de sécurité du bar « Le Zinc », qui déclare :`],
        ["J'ai fait sortir un groupe vers 1 h 40 : trois garçons qui se disputaient avec un autre, à propos d'une fille."],
        [{ t: "« Trois garçons tapaient le petit. Il est tombé. Quand il s'est relevé, il a frappé deux fois, très vite, au torse du grand blond. »", f: "K9_deux_coups" }],
        ["Je n'ai pas vu le couteau avant les coups. Le petit est parti en courant."],
        ["Lecture faite, persiste et signe."],
      ],
      sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "Le témoin", t: S }],
    }),
    scelle: (x) => ({
      title: "Procès-verbal de placement sous scellé", kind: "pv",
      entete: ["Commissariat central du 11e", "Procédure n° 2026/11/07780 — cote D15"],
      paras: [
        [`Le ${D(x.cs.proc.faitsDay + 1)}, à 10 h 20, plaçons sous scellé n° 1 l'objet remis par M. Ferhat à son arrivée au commissariat.`],
        [{ t: "Couteau pliant à cran d'arrêt, lame de 9 cm, remis par M. Ferhat.", f: "K9_lame" }],
        ["Manche en bois, longueur ouvert : 21 cm. Traces brunâtres sur la lame. Envoi au laboratoire pour recherche d'ADN."],
      ],
      sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "M. Malik Ferhat", t: S }],
    }),
    pv_hugo: (x) => ({
      title: "Procès-verbal d'audition de M. Lemaire", kind: "pv",
      entete: ["Commissariat central du 11e", "Procédure n° 2026/11/07780 — cote D20"],
      paras: [
        [`Le ${D(x.cs.proc.faitsDay + 9)}, à 15 h 00, à son domicile, nous entendons M. Hugo Lemaire, né le 22 juin 2001, serveur, qui déclare :`],
        [{ t: "« On se disputait avec son copain, à propos d'une fille. Lui, il s'est mêlé. Il m'a regardé et il a frappé. »", f: "K9_hugo_version" }],
        ["« Je ne l'ai pas frappé, moi. Peut-être mes amis, je ne sais pas. »"],
        ["« Je ne donnerai pas les noms de mes amis. »"],
        ["« Je dépose plainte et je me constitue partie civile. »"],
        ["Lecture faite, persiste et signe."],
      ],
      sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "La personne entendue", t: S }],
    }),
    video: (x) => ({
      title: "Exploitation de la vidéo du bar", kind: "video",
      entete: ["Cabinet de M. Vauclair, juge d'instruction · Commission rogatoire", "Cote D41"],
      paras: [
        [`Images de la caméra du bar « Le Zinc », nuit du ${D(x.cs.proc.faitsDay - 1)} au ${D(x.cs.proc.faitsDay)}, filmant l'entrée et le trottoir, sans le son.`],
        ["1 h 47 min 52 s : un groupe de quatre hommes sort ; échanges vifs."],
        [{ t: "1 h 48 min 10 s : M. Ferhat est au sol ; trois hommes, dont M. Lemaire, lui portent des coups de pied.", f: "K9_video_sol" }],
        [{ t: "1 h 48 min 31 s : M. Ferhat se relève, la lame déjà ouverte, et porte deux coups au thorax de M. Lemaire en moins de deux secondes. Il s'enfuit aussitôt.", f: "K9_video_coups" }],
        ["1 h 48 min 40 s : les deux autres hommes s'éloignent ; M. Lemaire s'assoit sur le trottoir."],
      ],
      sigs: [{ qui: "L'officier de police judiciaire", t: S }],
    }),
    expertise: () => ({
      title: "Rapport d'expertise médico-légale (conclusions)", kind: "pv",
      entete: ["Expert près la cour d'appel de Paris", "Cote D44"],
      paras: [
        ["Mission : décrire les plaies, leur trajectoire et la dynamique des coups ; dire si le pronostic vital était engagé."],
        [{ t: "Coups portés de face, de bas en haut, à courte distance, compatibles avec des gestes rapides au cours d'une mêlée.", f: "K9_melee" }],
        [{ t: "Sans intervention chirurgicale dans l'heure, la plaie profonde engageait le pronostic vital.", f: "K9_vital" }],
        ["La force employée ne peut être déterminée avec précision."],
      ],
      sigs: [{ qui: "L'expert", t: S }],
    }),
    personnalite: () => ({
      title: "Enquête de personnalité (extrait)", kind: "pv",
      entete: ["Association de contrôle judiciaire", "Cote B3"],
      paras: [
        [{ t: "Apprenti boulanger depuis dix-huit mois, très bien noté par son maître d'apprentissage. Aucun antécédent. Porte un couteau depuis une agression subie à 17 ans.", f: "K9_perso" }],
        ["Vit chez sa mère, avec deux sœurs. Le contrôle judiciaire est respecté."],
      ],
      sigs: [{ qui: "L'enquêtrice", t: S }],
    }),
    enq_ami: (x) => ({
      title: "Attestation de M. Sofiane Belkadi", kind: "courrier",
      entete: ["Attestation établie selon les formes de l'article 202 du code de procédure civile"],
      paras: [
        ["Je soussigné Sofiane Belkadi, né le 2 mars 2003, ami de M. Malik Ferhat depuis le collège,"],
        [`atteste que dans la nuit du ${D(x.cs.proc.faitsDay - 1)} au ${D(x.cs.proc.faitsDay)}, devant le bar « Le Zinc », je me suis disputé avec un garçon blond à propos d'une fille. Malik s'est interposé.`],
        [{ t: "Ils étaient trois sur Malik. Il est tombé, ils lui donnaient des coups de pied dans les côtes et dans la tête.", f: "K9_trois" }],
        ["J'ai essayé de les tirer en arrière. Ensuite Malik s'est relevé ; je n'ai pas vu les coups, j'étais derrière."],
        [ATTEST],
      ],
      sigs: [{ qui: "Sofiane Belkadi", t: S }],
    }),
    enq_contre: (x) => ({
      title: x.mode === "juge" ? "Rapport de contre-expertise médico-légale" : "Avis technique d'un médecin légiste", kind: "pv",
      entete: x.mode === "juge" ? ["Cabinet de M. Vauclair, juge d'instruction · Contre-expertise (art. 167)", "Cote D52"] : ["Dr Pierre Laville, médecin légiste, ancien expert près la cour d'appel", "Avis établi à la demande de la défense"],
      paras: [
        ["Pièces examinées : certificat et compte rendu opératoire de l'hôpital Saint-Antoine, photographies des plaies, rapport d'expertise (cote D44)."],
        [{ t: "Coups portés de face, de bas en haut, à courte distance, compatibles avec des gestes rapides au cours d'une mêlée.", f: "K9_melee" }],
        ["L'orientation ascendante des deux plaies correspond à des coups portés par une personne qui se relève ou qui est plus basse que la victime ; elle n'indique pas un geste ajusté."],
        ["Je confirme que la plaie profonde engageait le pronostic vital sans chirurgie rapide."],
        [x.mode === "juge" ? "Conclusions déposées au cabinet du juge d'instruction." : "Le présent avis, établi à la demande d'une partie, n'a pas la valeur d'une expertise judiciaire."],
      ],
      sigs: [{ qui: x.mode === "juge" ? "L'expert désigné" : "Dr P. Laville", t: S }],
    }),
  };
  const enq9 = [
    { id: "ami", type: "temoin", camp: "defense", titre: "Le copain de Malik, au cœur de la dispute", desc: "C'est pour lui que Malik s'est interposé. Il a vu le début de la bagarre.", piste: ["K9_trois"],
      modes: [{ id: "vous", label: "Le recevoir au cabinet", sub: "Une heure : l'écouter, vérifier ce qu'il a vraiment vu, lui expliquer l'attestation.", temps: 60, kind: "meet", delai: 2 }],
      doc: "enq_ami", titrePiece: "Attestation de Sofiane Belkadi",
      envoi: () => ({ from: "Sofiane Belkadi", subject: "Mon attestation pour Malik", body: [["Maître, voici l'attestation. Je suis prêt à venir devant le juge."]] }) },
    { id: "contre", type: "expertise", camp: "defense", titre: "Contre-expertise médico-légale", desc: "L'expertise décrit des coups rapides dans une mêlée ; la qualification de tentative de meurtre se discutera sur la dynamique des coups. Une contre-expertise peut la préciser.", piste: ["expertise"],
      modes: [{ id: "juge", label: "Demander une contre-expertise au juge (art. 167)", sub: "Requête motivée, une heure de rédaction ; le juge désigne un autre expert.", temps: 60, delai: 35, quand: (api) => !api.cs.vars.finInfo, pourquoi: "L'information est terminée : la demande n'est plus possible." },
        { id: "prive", label: "Consulter un médecin légiste à titre privé", sub: "Avis sur pièces, sans la valeur d'une expertise judiciaire.", argent: 1200, frais: "Avis médico-légal privé", delai: 15 }],
      doc: "enq_contre", titrePiece: "Contre-expertise médico-légale",
      envoi: (api, st) => ({ from: st.mode === "juge" ? "Cabinet de M. Vauclair, juge d'instruction" : "Dr Pierre Laville", subject: "Contre-expertise — Ferhat", body: [[st.mode === "juge" ? "Maître, le rapport de contre-expertise est versé au dossier. Copie ci-jointe." : "Maître, voici mon avis sur pièces."]] }) },
  ];
  put("a09_malik", A9, { enquete: enq9 });
  put("a09_hugo", A9, { enquete: enq9 });

  // =================================================================== AFFAIRE 10 — le vendredi (appel)
  put("a10_vendredi", {
    mails: (x) => {
      const j = x.cs.vars.jugementDay;
      return {
        title: "Courriels de M. Verneuil", kind: "sms",
        entete: ["Boîte personnelle de Mme Saïdi · courriels transférés depuis sa messagerie professionnelle", "De : jm.verneuil@atelier-verneuil.fr — À : comptabilite@atelier-verneuil.fr"],
        paras: [
          [`${N(j - 330)} 08:12 — Objet : Socodis`],
          [{ t: "« Nadia, fais le virement Socodis de 9 000 comme d'habitude, je régulariserai les factures. — J.-M. Verneuil »", f: "N_ordres" }],
          [`${N(j - 290)} 18:47 — Objet : (sans objet)`],
          [{ t: "« Socodis : 8 500 aujourd'hui. Ne passe pas par le compte fournisseurs. — JMV »", f: "N_ordres" }],
          [`${N(j - 250)} 07:55 — Objet : RE: Socodis`],
          ["« Encore 8 500 pour Socodis. Merci. »"],
          [`${N(j - 249)} 17:30 — Nadia Saïdi : Monsieur Verneuil, je n'ai pas de facture Socodis pour les deux derniers virements. Pouvez-vous me les transmettre ?`],
          ["Aucune réponse de M. Verneuil à ce message."],
        ],
      };
    },
    avances: (x) => ({
      title: "Relevé des avances sur salaire", kind: "releve",
      entete: ["Atelier Verneuil · grand livre, compte 425 « Personnel — avances »", "Extrait produit par la partie civile"],
      paras: [
        [`${N(x.cs.vars.jugementDay - 520)} · Avance N. Saïdi · 3 000,00 €`],
        [`${N(x.cs.vars.jugementDay - 470)} · Avance N. Saïdi · 2 500,00 €`],
        [`${N(x.cs.vars.jugementDay - 410)} · Avance N. Saïdi · 3 500,00 €`],
        [`${N(x.cs.vars.jugementDay - 360)} · Avance N. Saïdi · 3 000,00 €`],
        [{ t: "Avances sur salaire versées à Mme Saïdi, non régularisées : 12 000 euros.", f: "N_12000_doc" }],
        ["Aucune retenue sur salaire n'a été opérée."],
      ],
    }),
    enq_assistante: (x) => ({
      title: "Attestation de Mme Coralie Brun", kind: "courrier",
      entete: ["Attestation établie selon les formes de l'article 202 du code de procédure civile"],
      paras: [
        ["Je soussignée Coralie Brun, née le 9 avril 1994, ancienne assistante administrative de l'Atelier Verneuil, partie de l'entreprise il y a huit mois, sans lien avec les parties,"],
        ["atteste avoir partagé le bureau de Mme Saïdi pendant deux ans."],
        [{ t: "J'ai entendu à plusieurs reprises M. Verneuil demander à Mme Saïdi de faire les virements à la société Socodis « comme d'habitude », en lui disant qu'il régulariserait les factures plus tard.", f: "N_ordres" }],
        ["Mme Saïdi lui réclamait les factures ; il ne les donnait pas."],
        [x.mode === "enqueteur" ? `Attestation recueillie par ${ENQ}.` : "Attestation remise à l'avocat de Mme Saïdi."],
        [ATTEST],
      ],
      sigs: [{ qui: "Coralie Brun", t: S }],
    }),
  }, {
    enquete: [
      { id: "assistante", type: "temoin", titre: "L'ancienne assistante de l'atelier", desc: "Nadia partageait son bureau avec une assistante, partie depuis. Elle a pu entendre qui ordonnait les virements Socodis.", piste: ["N_ordres_dits"],
        modes: [{ id: "vous", label: "La retrouver et la rencontrer", sub: "Une heure, entre les appels et le rendez-vous.", temps: 60, kind: "meet", delai: 3 }, { id: "enqueteur", label: "Mandater un enquêteur de droit privé", sub: "Il la retrouve et recueille son attestation.", argent: 380, frais: "Enquêteur de droit privé", delai: 7 }],
        doc: "enq_assistante", titrePiece: "Attestation de l'ancienne assistante",
        envoi: (api, st) => ({ from: st.mode === "enqueteur" ? "Bertrand Ollier, enquêteur" : "Coralie Brun", subject: "Attestation — Atelier Verneuil", body: [["Maître, voici l'attestation, signée. Mme Brun accepte de venir témoigner."]] }) },
    ],
  });

  // =================================================================== AFFAIRE 11 — la fraude au président
  put("a11_president", {
    courriel: (x) => ({
      title: "Le courriel et ses en-têtes", kind: "sms",
      entete: ["De : Philippe Morand <p.morand@rhone-usinage.co>", "À : Olivier Garnier <o.garnier@rhone-usinage.fr>", `Date : ${N(x.cs.vars.virementDay)} 11:52`],
      paras: [
        ["Objet : Confidentiel — opération Delta"],
        ["« Olivier, je suis à Shanghai. Opération d'acquisition strictement confidentielle : virement de 140 000 € aujourd'hui avant 17 h, IBAN ci-dessous. Maître Lefèvre vous appellera. N'en parlez à personne. Philippe »"],
        ["IBAN : LT32 7300 0101 9876 5432 — bénéficiaire : MRD Holding UAB."],
        ["En-têtes complets (extraits) :"],
        ["Return-Path: <p.morand@rhone-usinage.co> · Received: from mail.fastmx-relay.net (185.212.xx.xx) · Reply-To: <direction.morand@protonmail.com>"],
        [{ t: "En-têtes : domaine rhone-usinage.co enregistré trois jours plus tôt ; envoi depuis un serveur situé hors de l'Union européenne.", f: "K11_domaine" }],
        ["Le domaine habituel de la société est rhone-usinage.fr."],
      ],
    }),
    ordre: (x) => ({
      title: "Ordre de virement et relevé", kind: "releve",
      entete: ["Banque Rhodanienne · agence de Villeurbanne", "Compte courant de Rhône Usinage SAS"],
      paras: [
        [{ t: `Ordre de virement SEPA du ${D(x.cs.vars.virementDay)}, 16 h 02 : 140 000,00 € au profit de « MRD Holding UAB », IBAN LT32 7300 0101 9876 5432.`, f: "K11_ordre_doc" }],
        ["Validation : signature électronique de M. Olivier Garnier, directeur financier, à 16 h 02 ; pas de double validation."],
        [`${dm(x.cs.vars.virementDay)} · VIR SEPA émis · MRD HOLDING UAB · − 140 000,00 €`],
        [`${dm(x.cs.vars.virementDay + 1)} · Rejet : néant — virement exécuté, fonds crédités sur le compte du bénéficiaire.`],
      ],
    }),
    kbis: () => ({
      title: "Extrait Kbis", kind: "courrier",
      entete: ["Greffe du tribunal de commerce de Lyon", "Extrait d'immatriculation principale au registre du commerce et des sociétés"],
      paras: [
        [{ t: "Rhône Usinage SAS, siège social : rue Léon-Blum, 69100 Villeurbanne. Président : M. Philippe Morand.", f: "K11_kbis" }],
        ["Activité : usinage de précision, mécanique industrielle. Capital : 400 000 euros."],
        ["Immatriculée au registre du commerce et des sociétés de Lyon."],
      ],
    }),
    main_courante: (x) => ({
      title: "Récépissé de main courante", kind: "pv",
      entete: ["Commissariat de Villeurbanne", "Registre des mains courantes"],
      paras: [
        [`Le ${D(x.cs.vars.virementDay + 1)}, à 18 h 40, M. Olivier Garnier, directeur financier de Rhône Usinage SAS, déclare avoir effectué la veille un virement de 140 000 euros sur instruction d'un courriel qu'il pense frauduleux.`],
        [{ t: "Déclaration de M. Olivier Garnier enregistrée en main courante. La présente déclaration ne constitue pas une plainte.", f: "K11_main_courante" }],
        ["Aucune suite n'est donnée par le service à une main courante."],
      ],
      sigs: [{ qui: "L'agent d'accueil", t: S }],
    }),
  });

  // =================================================================== AFFAIRE 12 — la bijouterie
  put("a12_bijouterie", {
    pv_vol: (x) => ({
      title: "Procès-verbal de plainte et de constatations", kind: "pv",
      entete: ["Brigade de répression du banditisme", "Procédure n° 2025/BRB/0412 — cote D1"],
      paras: [
        [{ t: `Le ${D(x.cs.proc.faitsDay)} à 10 h 40, bijouterie Maison Roussel, rue de Rivoli (4e) : un homme casqué menace la gérante avec un pistolet et emporte des bagues pour 48 000 euros.`, f: "J_faits" }],
        ["Arrivés à 10 h 52, nous recevons la plainte de Mme Martine Roussel, gérante, qui déclare : un homme est entré à 10 h 38, casque intégral noir, visière fumée, gants. Il a sorti un pistolet noir et m'a dit : « Les bagues, vite. »"],
        ["Il a pris le présentoir de la vitrine 2 et il est parti à pied vers la rue du Renard. Il n'a jamais relevé sa visière."],
        ["Aucun coup, aucun blessé. L'homme s'enfuit à pied vers la rue du Renard."],
        ["La caméra intérieure de la bijouterie est hors service depuis deux semaines (attestation du gérant de la société de maintenance jointe)."],
        ["Lecture faite, la plaignante persiste et signe."],
      ],
      sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "La plaignante", t: S }],
    }),
    reco: (x) => ({
      title: "Procès-verbal de présentation sur planche photographique", kind: "pv",
      entete: ["Brigade de répression du banditisme", "Procédure n° 2025/BRB/0412 — cote D17"],
      paras: [
        [`Le ${D(x.cs.proc.faitsDay + 40)}, à 15 h 00, présentons à Mme Martine Roussel une planche de six photographies d'hommes de type européen, âgés de 25 à 35 ans, dont celle de M. Jordan Leroy (n° 4).`],
        ["Lui rappelons que l'auteur peut ne pas figurer sur la planche."],
        [{ t: "Sur une planche de six photographies, Mme Roussel désigne le n° 4, M. Jordan Leroy : « Je dirais lui, à soixante-dix pour cent. Il avait un casque. »", f: "J_reco" }],
        ["Interrogée sur ce qui lui permet de le désigner : « Les yeux, je crois. Et la carrure. »"],
        ["Lecture faite, persiste et signe."],
      ],
      sigs: [{ qui: "L'officier de police judiciaire", t: S }, { qui: "Le témoin", t: S }],
    }),
    adn: () => ({
      title: "Rapport d'expertise génétique", kind: "pv",
      entete: ["Laboratoire de police scientifique", "Cote D24"],
      paras: [
        ["Scellé n° 3 : réplique d'arme de poing découverte dans une poubelle de la rue du Renard, à 300 mètres de la bijouterie, le jour des faits à 13 h 15."],
        ["Prélèvements par écouvillonnage : crosse, détente, canon."],
        [{ t: "Profil génétique de M. Jordan Leroy isolé sur la crosse du pistolet retrouvé dans une poubelle de la rue du Renard, à 300 mètres. Profil unique, en quantité importante.", f: "J_adn" }],
        ["Détente et canon : profils partiels inexploitables."],
        ["L'analyse ne permet pas de dater le dépôt de l'ADN."],
      ],
      sigs: [{ qui: "L'expert en génétique", t: S }],
    }),
    arme: () => ({
      title: "Examen de l'objet saisi", kind: "pv",
      entete: ["Brigade de répression du banditisme", "Cote D25"],
      paras: [
        [{ t: "Réplique d'arme de poing, type airsoft, de couleur noire, sans bouchon orange : indiscernable d'une arme réelle à quelques mètres.", f: "J_replique" }],
        ["Projectiles : billes de 6 mm ; chargeur vide. Poids : 620 grammes."],
      ],
      sigs: [{ qui: "L'officier de police judiciaire", t: S }],
    }),
    tel: (x) => ({
      title: "Rapport de téléphonie", kind: "releve",
      entete: ["Brigade de répression du banditisme · réquisitions à opérateur", `Ligne de M. Jordan Leroy · ${N(x.cs.proc.faitsDay)} — cote D31`],
      paras: [
        ["09:58 · données · borne Ivry-sur-Seine Centre"],
        ["10:21 · SMS sortant · borne Paris 13 Bibliothèque"],
        [{ t: "Le téléphone de M. Leroy déclenche à 10 h 32 la borne de Châtelet-Les Halles, qui couvre la rue de Rivoli. Il est éteint de 10 h 35 à 11 h 20.", f: "J_borne" }],
        ["11:20 · rallumage · borne Paris 11 Bastille"],
        ["11:46 · appel sortant (1 min 12 s) · borne Ivry-sur-Seine Centre"],
        ["La borne de Châtelet-Les Halles couvre aussi le centre commercial et la gare RER."],
      ],
      sigs: [{ qui: "L'officier de police judiciaire", t: S }],
    }),
    pv_jordan: (x) => ({
      title: "Interrogatoire de première comparution", kind: "pv",
      entete: ["Cabinet de Mme Ferraud, juge d'instruction", "Cote D40"],
      paras: [
        [`Le ${D(x.cs.proc.faitsDay + 52)}, comparaît M. Jordan Leroy, né le 30 mai 1997, livreur, assisté de son avocat.`],
        ["Après l'avoir informé de son droit de faire des déclarations, de répondre aux questions ou de se taire, il déclare :"],
        [{ t: "« Je n'y étais pas. Le pistolet, je l'ai tenu chez un ami. »", f: "J_version" }],
        ["« À 10 h 30, j'étais aux Halles, pour un achat. J'ai éteint mon téléphone, il n'avait plus de batterie. »"],
        ["Mise en examen du chef de vol avec arme. Lecture faite, persiste et signe."],
      ],
      sigs: [{ qui: "Le juge d'instruction", t: S }, { qui: "La personne mise en examen", t: S }, { qui: "L'avocat", t: S }, { qui: "Le greffier", t: S }],
    }),
    enq_adn: (x) => ({
      title: x.mode === "juge" ? "Rapport de contre-expertise génétique" : "Avis d'un généticien", kind: "pv",
      entete: x.mode === "juge" ? ["Cabinet de Mme Ferraud, juge d'instruction · Contre-expertise (art. 167)", "Cote D58"] : ["Dr Anne Keller, docteur en génétique, ancienne experte près la cour d'appel", "Avis établi à la demande de la défense"],
      paras: [
        ["Pièce examinée : rapport d'expertise génétique (cote D24) et données brutes d'analyse."],
        [{ t: "Le profil isolé sur la crosse est bien celui de M. Jordan Leroy, profil unique, en quantité importante.", f: "J_adn" }],
        ["L'analyse établit un contact avec l'objet ; elle ne dit ni quand ni dans quelles circonstances l'ADN a été déposé."],
        ["Un transfert secondaire n'est pas exclu, mais il est peu probable pour une telle quantité ; un contact direct, à une date indéterminée, est l'explication la plus simple."],
        ["Le témoignage de l'expert à l'audience permettrait de discuter ce point."],
      ],
      sigs: [{ qui: x.mode === "juge" ? "L'expert désigné" : "Dr A. Keller", t: S }],
    }),
  }, {
    enquete: [
      { id: "contre_adn", type: "expertise", camp: "defense", titre: "Contre-expertise génétique", desc: "L'ADN de Jordan est sur la crosse. Il dit avoir tenu ce pistolet chez un ami. Que dit vraiment l'analyse, et que ne dit-elle pas ?", piste: ["adn"],
        modes: [{ id: "juge", label: "Demander une contre-expertise au juge (art. 167)", sub: "Requête motivée, une heure de rédaction.", temps: 60, delai: 40, quand: (api) => !CR.hasDoc(api.cs, "oma"), pourquoi: "L'instruction est close." },
          { id: "prive", label: "Consulter un généticien à titre privé", sub: "Avis sur le rapport et les données brutes.", argent: 1500, frais: "Avis de généticien", delai: 14 }],
        doc: "enq_adn", titrePiece: "Contre-expertise génétique",
        envoi: (api, st) => ({ from: st.mode === "juge" ? "Cabinet de Mme Ferraud, juge d'instruction" : "Dr Anne Keller", subject: "ADN — Leroy", body: [[st.mode === "juge" ? "Maître, le rapport de contre-expertise est versé au dossier. Copie ci-jointe." : "Maître, voici mon avis. L'expert pourra être entendu à l'audience sur ce point."]] }) },
    ],
  });
})();
