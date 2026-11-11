/* La Permanence — le code du jeu : fiches d'actes, régime des irrégularités, programme, lexique, acteurs fictifs.
   Le moteur de procédure (procedure.js) lit ces fiches ; les affaires n'écrivent jamais le droit elles-mêmes.
   Droit applicable : état au 23 octobre 2026. Chaque fiche porte sa source et l'état de sa vérification. */
(function () {
  const CR = (window.CR = window.CR || {});
  const VERIF = "Règle résumée pour le jeu (octobre 2026), points sensibles vérifiés en ligne le 10 novembre 2026 — à relire sur Légifrance avant tout usage réel";

  // =================================================================== PROGRAMME (CRFPA, épreuve de droit pénal / procédure pénale)
  CR.PROGRAMME = {
    dpg: "Droit pénal général",
    dps: "Droit pénal spécial",
    pp_enquete: "Procédure pénale — enquêtes et garde à vue",
    pp_action: "Procédure pénale — action publique et action civile",
    pp_instruction: "Procédure pénale — instruction et détention provisoire",
    pp_jugement: "Procédure pénale — jugement",
    pp_recours: "Procédure pénale — voies de recours",
    pp_peine: "Peines et exécution des peines",
    deonto: "Déontologie de l'avocat",
  };

  // =================================================================== FICHES D'ACTES
  // Chaque champ reprend la fiche type du document de conception.
  CR.ACTES = {
    plainte_simple: {
      acte: "Plainte simple", qui: "La victime, seule ou par son avocat", ou: "Commissariat, gendarmerie, ou procureur de la République par lettre recommandée",
      conditions: "Aucune", delai: "Avant la prescription de l'action publique (1 an, 6 ans ou 20 ans)",
      suite: "Le parquet décide seul : enquête, classement sans suite, alternative ou poursuites (art. 40-1)", sanction: "—", invoque: "—",
      regul: "—", art: "CPP, art. 15-3, 40, 40-1", art2029: "", prog: "pp_action",
    },
    pcpc: {
      acte: "Plainte avec constitution de partie civile", qui: "La victime d'un crime ou d'un délit, par son avocat", ou: "Doyen des juges d'instruction du tribunal compétent",
      conditions: "En matière délictuelle : plainte simple préalable au procureur (contre récépissé ou par LRAR), puis classement ou 3 mois sans réponse (art. 85). Pas de PCPC pour une contravention.",
      delai: "Avant la prescription de l'action publique", suite: "Consignation fixée par le juge, à verser dans le délai (art. 88) ; ouverture d'une information",
      sanction: "Irrecevabilité (plainte prématurée, consignation non versée)", invoque: "Le juge la relève d'office",
      regul: "Déposer la plainte simple et attendre 3 mois ; la prescription est suspendue au profit de la victime pendant ce temps (Crim. 23 juin 2026, n° 25-87.950)",
      art: "CPP, art. 85, 86, 88, 177-2", art2029: "", prog: "pp_action",
    },
    citation_directe: {
      acte: "Citation directe par la partie civile", qui: "La victime, par son avocat, par acte de commissaire de justice", ou: "Tribunal correctionnel (délit) ou tribunal de police (contravention)",
      conditions: "Prévenu identifié ; preuves déjà réunies ; date d'audience obtenue du greffe",
      delai: "Délivrance au moins 15 jours avant l'audience (art. 552) ; avant la prescription",
      suite: "Consignation fixée par le tribunal (art. 392-1) ; audience au fond", sanction: "Citation trop courte : renvoi ou nullité de la citation ; relaxe : dommages-intérêts possibles au profit du prévenu (art. 472)",
      invoque: "Le prévenu", regul: "Citer à nouveau, à bonne date, devant la bonne juridiction",
      art: "CPP, art. 388, 392-1, 472, 531, 552", art2029: "", prog: "pp_action",
    },
    constitution_pc: {
      acte: "Constitution de partie civile à l'audience", qui: "La victime, présente ou représentée", ou: "Tribunal saisi par le parquet ; ou par lettre recommandée parvenue 24 h avant l'audience",
      conditions: "Le parquet a déjà engagé les poursuites", delai: "Avant les réquisitions du ministère public sur le fond (art. 421)",
      suite: "Le tribunal statue sur les intérêts civils, au besoin après renvoi (art. 464)", sanction: "Irrecevabilité si tardive", invoque: "Le tribunal",
      regul: "Impossible à l'audience ; reste l'action devant le juge civil", art: "CPP, art. 418, 420-1, 421, 464", art2029: "", prog: "pp_action",
    },
    conclusions_nullite_tc: {
      acte: "Conclusions de nullité devant le tribunal correctionnel", qui: "Le prévenu, par son avocat", ou: "Greffe du tribunal correctionnel (dépôt horodaté)",
      conditions: "Avant toute défense au fond (in limine litis) ; grief quand il est exigé (art. 802)",
      delai: "Dépôt au greffe au plus tard 3 jours avant l'audience (art. 385, depuis le 23/10/2026), hors comparution immédiate ; dispense si citation ou convocation à moins de 20 jours, ou nullité impossible à connaître",
      suite: "Le tribunal statue, souvent en joignant l'incident au fond", sanction: "Irrecevabilité de l'exception", invoque: "Le tribunal",
      regul: "Aucune : le délai expiré ne se rattrape pas", art: "CPP, art. 385, 802", art2029: "", prog: "pp_jugement",
    },
    requete_nullite: {
      acte: "Requête en nullité pendant l'instruction", qui: "La personne mise en examen, la partie civile, le témoin assisté", ou: "Greffe de la chambre de l'instruction (déclaration constatée et datée par le greffier)",
      conditions: "Requête motivée, copie au juge d'instruction (art. 173)",
      delai: "4 mois à compter de la notification de la mise en examen ; à compter de la première copie du dossier si elle est demandée dans les 7 jours francs (art. 173-1, depuis le 23/10/2026)",
      suite: "La chambre de l'instruction annule l'acte et, le cas échéant, la procédure ultérieure (art. 174)", sanction: "Irrecevabilité (forclusion)", invoque: "La chambre de l'instruction",
      regul: "Seulement pour un moyen qu'on ne pouvait pas connaître", art: "CPP, art. 173, 173-1, 174", art2029: "", prog: "pp_instruction",
    },
    demande_actes: {
      acte: "Demande d'actes au juge d'instruction", qui: "Les parties, par leur avocat", ou: "Juge d'instruction (déclaration au greffier ou lettre recommandée)",
      conditions: "Demande écrite et motivée", delai: "Pendant l'information",
      suite: "Le juge répond par ordonnance motivée dans le mois ; à défaut, saisine directe du président de la chambre de l'instruction (art. 81 et 82-1)",
      sanction: "—", invoque: "—", regul: "—", art: "CPP, art. 82-1", art2029: "", prog: "pp_instruction",
    },
    dml: {
      acte: "Demande de mise en liberté", qui: "La personne détenue, par son avocat", ou: "Greffe du juge d'instruction",
      conditions: "Depuis la loi du 23 juillet 2026, irrecevable tant qu'il n'a pas été statué définitivement sur la précédente",
      delai: "À tout moment", suite: "Le juge d'instruction transmet au procureur ; s'il ne fait pas droit à la demande, le JLD statue dans les 3 jours ouvrables (art. 148)",
      sanction: "Irrecevabilité ; à défaut de décision dans les délais, saisine directe de la chambre de l'instruction", invoque: "Le juge", regul: "Attendre la décision définitive sur la demande précédente",
      art: "CPP, art. 148", art2029: "", prog: "pp_instruction",
    },
    appel_dp: {
      acte: "Appel d'une ordonnance de placement en détention", qui: "La personne mise en examen, par son avocat", ou: "Greffe du juge (déclaration d'appel)",
      conditions: "—", delai: "10 jours à compter de la notification (art. 186)",
      suite: "La chambre de l'instruction statue dans les délais légaux, faute de quoi la personne est mise en liberté d'office (art. 194)", sanction: "Irrecevabilité si tardif", invoque: "La chambre",
      regul: "—", art: "CPP, art. 186, 194", art2029: "", prog: "pp_instruction",
    },
    appel_corr: {
      acte: "Déclaration d'appel d'un jugement correctionnel", qui: "Le prévenu, la partie civile (intérêts civils), le ministère public", ou: "Greffe de la juridiction qui a rendu la décision (art. 502)",
      conditions: "Préciser l'étendue de l'appel : total, ou limité aux dispositions pénales ou civiles (art. 509)",
      delai: "10 jours à compter du prononcé du jugement contradictoire (art. 498) ; appel incident des autres parties dans les 5 jours suivants (art. 500)",
      suite: "La chambre des appels correctionnels rejuge dans la limite de l'acte d'appel ; sur le seul appel du prévenu, elle ne peut aggraver son sort (art. 515)",
      sanction: "Irrecevabilité si tardif", invoque: "La cour d'office", regul: "Jamais pour un délai expiré, sauf force majeure", art: "CPP, art. 498, 500, 502, 509, 515", art2029: "", prog: "pp_recours",
    },
    opposition_op: {
      acte: "Opposition à une ordonnance pénale délictuelle", qui: "Le prévenu", ou: "Greffe du tribunal correctionnel",
      conditions: "—", delai: "45 jours à compter de la notification (art. 495-3)",
      suite: "L'affaire est portée à l'audience du tribunal correctionnel, qui peut prononcer une peine plus lourde", sanction: "Irrecevabilité si tardive ; l'ordonnance devient exécutoire", invoque: "Le tribunal",
      regul: "—", art: "CPP, art. 495-3", art2029: "", prog: "pp_jugement",
    },
    crpc: {
      acte: "Comparution sur reconnaissance préalable de culpabilité", qui: "Le prévenu qui reconnaît les faits, obligatoirement assisté d'un avocat", ou: "Bureau du procureur, puis audience d'homologation",
      conditions: "Délit ; proposition plafonnée à 3 ans d'emprisonnement et à la moitié de la peine encourue (art. 495-8)",
      delai: "Le prévenu peut demander 10 jours de réflexion", suite: "Homologation par un juge du siège ; en cas de refus ou de non-homologation, retour au parquet, et les déclarations ne peuvent pas être utilisées (art. 495-14)",
      sanction: "—", invoque: "—", regul: "—", art: "CPP, art. 495-7 à 495-16", art2029: "", prog: "pp_jugement",
    },
    observations_gav: {
      acte: "Observations écrites de l'avocat en garde à vue", qui: "L'avocat du gardé à vue", ou: "Commissariat ; jointes à la procédure",
      conditions: "À l'issue d'un entretien, d'une audition ou d'une confrontation", delai: "Pendant la garde à vue",
      suite: "Elles figent au dossier les irrégularités constatées et les questions refusées", sanction: "—", invoque: "—", regul: "—", art: "CPP, art. 63-4-3", art2029: "", prog: "pp_enquete",
    },
    renvoi_ci: {
      acte: "Refus d'être jugé séance tenante en comparution immédiate", qui: "Le prévenu, informé par le président", ou: "Audience de comparution immédiate",
      conditions: "—", delai: "À l'ouverture de l'audience",
      suite: "Renvoi dans 2 à 6 semaines ; 2 à 4 mois si la peine encourue dépasse 7 ans ; le tribunal statue sur la détention en attendant (art. 397-1, 397-3)",
      sanction: "—", invoque: "—", regul: "—", art: "CPP, art. 397-1, 397-3", art2029: "", prog: "pp_jugement",
    },
    appel_renvoi_crime: {
      acte: "Appel d'une ordonnance de renvoi qui correctionnalise un crime", qui: "La personne mise en examen, la partie civile", ou: "Greffe du juge d'instruction",
      conditions: "Les faits renvoyés devant le tribunal correctionnel constituent un crime", delai: "10 jours à compter de la notification",
      suite: "La chambre de l'instruction tranche la qualification ; à défaut d'appel, le tribunal ne peut plus se déclarer incompétent (art. 469)",
      sanction: "—", invoque: "—", regul: "—", art: "CPP, art. 186-3, 469", art2029: "", prog: "pp_instruction",
    },
    convention_honoraires: {
      acte: "Convention d'honoraires", qui: "L'avocat et son client", ou: "Au cabinet, par écrit",
      conditions: "Obligatoire, sauf urgence, force majeure ou aide juridictionnelle totale. Forfait ou temps passé ; honoraire de résultat seulement en complément",
      delai: "Dès l'acceptation du dossier", suite: "Fonde la facturation", sanction: "Honoraires fixés par le bâtonnier en cas de contestation ; pacte de quota litis interdit",
      invoque: "Le client, devant le bâtonnier", regul: "Signer la convention", art: "Loi n° 71-1130 du 31 déc. 1971, art. 10", art2029: "", prog: "deonto",
    },
  };
  for (const [k, v] of Object.entries(CR.ACTES)) { v.id = k; v.source = VERIF; }

  // =================================================================== RÉGIME DES IRRÉGULARITÉS
  // grief : "presume" (fait nécessairement grief), "prouver" (art. 802), "ordre_public"
  CR.IRREG = {
    gav_notif_tardive: {
      label: "Droits notifiés tardivement en garde à vue",
      regle: "Les droits sont notifiés immédiatement au placement en garde à vue (art. 63-1). Un retard que ne justifie aucune circonstance insurmontable porte nécessairement atteinte aux intérêts de la personne.",
      textes: ["CPP_63-1", "CPP_802"], sanction: "nullite", grief: "presume",
      effet: "Annulation de la garde à vue depuis le placement, des auditions et des actes dont elles sont le support nécessaire",
      regul: false, prog: "pp_enquete",
    },
    al_droit_quitter: {
      label: "Audition libre : droit de quitter les locaux non notifié",
      regle: "Avant d'être entendue librement, la personne est informée notamment du droit de quitter à tout moment les locaux (art. 61-1, 2°).",
      textes: ["CPP_61-1", "CPP_802"], sanction: "nullite", grief: "presume",
      effet: "Annulation du procès-verbal d'audition libre ; les autres preuves restent",
      regul: false, prog: "pp_enquete",
    },
    gav_audition_sans_avocat: {
      label: "Audition en garde à vue sans l'avocat demandé",
      regle: "Depuis la loi du 22 avril 2024 (en vigueur le 1er juillet 2024), la personne qui a demandé un avocat n'est pas entendue hors sa présence, sauf dérogation du procureur.",
      textes: ["CPP_63-4-2"], sanction: "nullite", grief: "presume",
      effet: "Annulation de l'audition irrégulière et des actes qui en découlent",
      regul: false, prog: "pp_enquete",
    },
    perquisition_nuit: {
      label: "Perquisition de nuit sans autorisation",
      regle: "Les perquisitions ne peuvent commencer avant 6 heures ni après 21 heures (art. 59). En criminalité organisée, une perquisition de nuit exige une autorisation motivée du juge ; dans un domicile, les conditions sont renforcées (art. 706-91).",
      textes: ["CPP_59", "CPP_706-91"], sanction: "nullite", grief: "presume",
      effet: "Annulation de la perquisition, de la saisie et des actes dont elles sont le support nécessaire (art. 174)",
      regul: false, prog: "pp_instruction",
    },
    ethylometre_verif: {
      label: "Éthylomètre : vérification périodique non établie",
      regle: "La mesure n'a de valeur que si l'appareil est homologué et a subi ses vérifications périodiques. Effet exact du défaut de mention au procès-verbal : jurisprudence à vérifier avant saisie.",
      textes: ["CR_L234-1"], sanction: "nullite", grief: "prouver", aVerifier: true,
      effet: "Le résultat de la mesure est écarté ; restent les constatations des agents",
      regul: false, prog: "dps",
    },
    interprete_absent: {
      label: "Absence d'interprète",
      regle: "La personne qui ne comprend pas le français a droit à un interprète à chaque étape, en garde à vue comme à l'audience.",
      textes: ["CPP_63-1"], sanction: "nullite", grief: "presume",
      effet: "Annulation des actes accomplis sans interprète ; à l'audience, renvoi",
      regul: false, prog: "pp_enquete",
    },
    pv_heure_incoherente: {
      label: "Heures incohérentes dans les procès-verbaux",
      regle: "Une incohérence d'horaires peut révéler une notification tardive, un dépassement de la durée de garde à vue ou une audition hors délai.",
      textes: ["CPP_63", "CPP_63-1"], sanction: "nullite", grief: "presume",
      effet: "Selon ce qu'elle révèle : nullité de la mesure ou des auditions",
      regul: false, prog: "pp_enquete",
    },
    citation_delai_court: {
      label: "Citation délivrée moins de 15 jours avant l'audience",
      regle: "Le délai entre la citation et la comparution est d'au moins 15 jours (art. 552, depuis le 23/10/2026).",
      textes: ["CPP_552"], sanction: "nullite", grief: "prouver",
      effet: "Si le prévenu ne comparaît pas, la citation est nulle ; s'il comparaît, il peut obtenir un renvoi",
      regul: true, prog: "pp_jugement",
    },
  };
  for (const [k, v] of Object.entries(CR.IRREG)) { v.id = k; v.source = VERIF; }

  // =================================================================== BIBLIOTHÈQUE (les textes sont dans texts.js)
  // temps : minutes de recherche pour lire et extraire un passage utilisable (il devient une carte)
  CR.LIB = [
    // ---- Droit pénal général
    { id: "CP_121-5", titre: "La tentative", domaine: "dpg", temps: 20 },
    { id: "CP_122-5", titre: "La légitime défense", domaine: "dpg", temps: 25 },
    { id: "CP_113-2-1", titre: "Infractions commises par un réseau de communication électronique", domaine: "dpg", temps: 25 },
    { id: "CP_132-10", titre: "La récidive légale en matière délictuelle", domaine: "dpg", temps: 20 },
    { id: "CP_132-16", titre: "Vol, escroquerie, abus de confiance : même infraction pour la récidive", domaine: "dpg", temps: 15 },
    { id: "CP_132-19", titre: "Emprisonnement ferme en dernier recours", domaine: "pp_peine", temps: 30 },
    { id: "CP_132-25", titre: "Aménagement des peines jusqu'à un an", domaine: "pp_peine", temps: 20 },
    { id: "CP_132-75", titre: "Ce qu'est une arme", domaine: "dpg", temps: 20 },
    { id: "CP_131-13", titre: "Le montant des amendes contraventionnelles", domaine: "dpg", temps: 10 },
    // ---- Droit pénal spécial
    { id: "CP_221-1", titre: "Le meurtre", domaine: "dps", temps: 10 },
    { id: "CP_221-6", titre: "L'homicide involontaire", domaine: "dps", temps: 15 },
    { id: "CP_221-18", titre: "L'homicide routier (loi du 9 juillet 2025)", domaine: "dps", temps: 25 },
    { id: "CP_222-11", titre: "Violences : ITT de plus de huit jours", domaine: "dps", temps: 15 },
    { id: "CP_222-12", titre: "Violences aggravées, dont l'usage d'une arme", domaine: "dps", temps: 20 },
    { id: "CP_R625-1", titre: "Violences : ITT de huit jours au plus", domaine: "dps", temps: 15 },
    { id: "CP_222-17", titre: "Les menaces", domaine: "dps", temps: 15 },
    { id: "CP_222-33-2-2", titre: "Le harcèlement moral", domaine: "dps", temps: 20 },
    { id: "CP_222-37", titre: "Trafic de stupéfiants", domaine: "dps", temps: 15 },
    { id: "CP_311-1", titre: "Le vol", domaine: "dps", temps: 10 },
    { id: "CP_311-5", titre: "Vol avec violences : ITT de huit jours au plus", domaine: "dps", temps: 15 },
    { id: "CP_311-8", titre: "Vol avec arme", domaine: "dps", temps: 15 },
    { id: "CP_313-1", titre: "L'escroquerie", domaine: "dps", temps: 15 },
    { id: "CP_313-2", titre: "Escroquerie aggravée", domaine: "dps", temps: 20 },
    { id: "CP_314-1", titre: "L'abus de confiance", domaine: "dps", temps: 15 },
    { id: "CP_434-15", titre: "La subornation de témoin", domaine: "dps", temps: 15 },
    { id: "CR_L234-1", titre: "Conduite sous l'empire d'un état alcoolique", domaine: "dps", temps: 15 },
    { id: "CR_L234-2", titre: "Peines complémentaires de l'alcool au volant", domaine: "dps", temps: 20 },
    { id: "L85_3", titre: "Loi de 1985 : la faute de la victime non conductrice", domaine: "dps", temps: 25 },
    // ---- Enquêtes et garde à vue
    { id: "CPP_59", titre: "Heures légales des perquisitions", domaine: "pp_enquete", temps: 15 },
    { id: "CPP_61-1", titre: "Les droits en audition libre", domaine: "pp_enquete", temps: 20 },
    { id: "CPP_63", titre: "Durée de la garde à vue", domaine: "pp_enquete", temps: 15 },
    { id: "CPP_63-1", titre: "Notification immédiate des droits en garde à vue", domaine: "pp_enquete", temps: 25 },
    { id: "CPP_63-4", titre: "Entretien de trente minutes avec l'avocat", domaine: "pp_enquete", temps: 10 },
    { id: "CPP_63-4-1", titre: "Les pièces que l'avocat peut consulter", domaine: "pp_enquete", temps: 15 },
    { id: "CPP_63-4-2", titre: "Pas d'audition sans l'avocat demandé (réforme de 2024)", domaine: "pp_enquete", temps: 20 },
    { id: "CPP_63-4-3", titre: "Questions et observations écrites de l'avocat", domaine: "pp_enquete", temps: 15 },
    { id: "CPP_63-4-4", titre: "Le secret de la garde à vue", domaine: "pp_enquete", temps: 10 },
    { id: "CPP_706-91", titre: "Perquisitions de nuit en criminalité organisée", domaine: "pp_enquete", temps: 25 },
    // ---- Action publique et action civile
    { id: "CPP_7", titre: "Prescription des crimes : 20 ans", domaine: "pp_action", temps: 10 },
    { id: "CPP_8", titre: "Prescription des délits : 6 ans", domaine: "pp_action", temps: 10 },
    { id: "CPP_9", titre: "Prescription des contraventions : 1 an", domaine: "pp_action", temps: 10 },
    { id: "CPP_9-2", titre: "Les actes qui interrompent la prescription", domaine: "pp_action", temps: 25 },
    { id: "CPP_41-1", titre: "Les alternatives aux poursuites", domaine: "pp_action", temps: 20 },
    { id: "CPP_85", titre: "Plainte avec constitution de partie civile : la condition des trois mois", domaine: "pp_action", temps: 25 },
    { id: "CPP_88", titre: "La consignation", domaine: "pp_action", temps: 15 },
    { id: "CPP_392-1", titre: "Consignation en citation directe", domaine: "pp_action", temps: 15 },
    { id: "CPP_472", titre: "Citation abusive : dommages-intérêts au prévenu relaxé", domaine: "pp_action", temps: 15 },
    { id: "CPP_420-1", titre: "Se constituer partie civile par lettre", domaine: "pp_action", temps: 15 },
    { id: "CPP_421", titre: "Se constituer avant les réquisitions", domaine: "pp_action", temps: 10 },
    { id: "CPP_475-1", titre: "Les frais d'avocat de la partie civile", domaine: "pp_action", temps: 10 },
    { id: "JP_CRIM_2026_06_23", titre: "Prescription suspendue au profit de la victime (Crim. 23 juin 2026)", domaine: "pp_action", temps: 30 },
    // ---- Instruction et détention
    { id: "CPP_82-1", titre: "Les demandes d'actes", domaine: "pp_instruction", temps: 15 },
    { id: "CPP_114", titre: "La copie du dossier", domaine: "pp_instruction", temps: 15 },
    { id: "CPP_143-1", titre: "Quand la détention provisoire est possible", domaine: "pp_instruction", temps: 15 },
    { id: "CPP_144", titre: "Les sept objectifs de la détention provisoire", domaine: "pp_instruction", temps: 25 },
    { id: "CPP_145", titre: "Le débat devant le JLD et le délai pour préparer sa défense", domaine: "pp_instruction", temps: 20 },
    { id: "CPP_145-2", titre: "Durée de la détention en matière criminelle", domaine: "pp_instruction", temps: 20 },
    { id: "CPP_148", titre: "La demande de mise en liberté", domaine: "pp_instruction", temps: 20 },
    { id: "CPP_171", titre: "Nullité et atteinte aux intérêts de la partie", domaine: "pp_instruction", temps: 10 },
    { id: "CPP_173", titre: "La requête en nullité", domaine: "pp_instruction", temps: 20 },
    { id: "CPP_173-1", titre: "Le délai de quatre mois (loi du 23 juillet 2026)", domaine: "pp_instruction", temps: 20 },
    { id: "CPP_174", titre: "L'étendue de l'annulation", domaine: "pp_instruction", temps: 15 },
    { id: "CPP_175", titre: "L'avis de fin d'information", domaine: "pp_instruction", temps: 20 },
    { id: "CPP_186-3", titre: "Appel d'un renvoi qui correctionnalise un crime", domaine: "pp_instruction", temps: 20 },
    { id: "CPP_198", titre: "Mémoires devant la chambre de l'instruction", domaine: "pp_instruction", temps: 15 },
    // ---- Jugement
    { id: "CPP_380-16", titre: "La cour criminelle départementale", domaine: "pp_jugement", temps: 20 },
    { id: "CPP_298", titre: "Les récusations de jurés", domaine: "pp_jugement", temps: 15 },
    { id: "CPP_382", titre: "Compétence territoriale du tribunal correctionnel", domaine: "pp_jugement", temps: 15 },
    { id: "CPP_385", titre: "Nullités : avant le fond et 3 jours avant l'audience", domaine: "pp_jugement", temps: 25 },
    { id: "CPP_397-1", titre: "Comparution immédiate : le renvoi", domaine: "pp_jugement", temps: 20 },
    { id: "CPP_427", titre: "Liberté de la preuve et intime conviction", domaine: "pp_jugement", temps: 10 },
    { id: "CPP_442-1", titre: "Poser des questions à l'audience", domaine: "pp_jugement", temps: 10 },
    { id: "CPP_460", titre: "L'ordre de parole", domaine: "pp_jugement", temps: 10 },
    { id: "CPP_466", titre: "Requalification d'un délit en contravention", domaine: "pp_jugement", temps: 15 },
    { id: "CPP_469", titre: "Le tribunal correctionnel saisi d'un crime", domaine: "pp_jugement", temps: 20 },
    { id: "CPP_495-3", titre: "Opposition à ordonnance pénale : 45 jours", domaine: "pp_jugement", temps: 15 },
    { id: "CPP_495-8", titre: "La proposition de CRPC", domaine: "pp_jugement", temps: 20 },
    { id: "CPP_495-14", titre: "CRPC refusée : les déclarations ne peuvent pas servir", domaine: "pp_jugement", temps: 10 },
    { id: "CPP_552", titre: "Le délai de citation : 15 jours (loi du 23 juillet 2026)", domaine: "pp_jugement", temps: 15 },
    { id: "CPP_801", titre: "Computation des délais", domaine: "pp_jugement", temps: 10 },
    { id: "CPP_802", titre: "Pas de nullité sans grief", domaine: "pp_jugement", temps: 15 },
    // ---- Voies de recours
    { id: "CPP_498", titre: "Appel : dix jours", domaine: "pp_recours", temps: 10 },
    { id: "CPP_500", titre: "L'appel incident : cinq jours de plus", domaine: "pp_recours", temps: 10 },
    { id: "CPP_509", titre: "L'effet dévolutif limité par l'acte d'appel", domaine: "pp_recours", temps: 15 },
    { id: "CPP_515", titre: "Pas d'aggravation sur le seul appel du prévenu", domaine: "pp_recours", temps: 15 },
    // ---- Peines
    { id: "CPP_716-4", titre: "La détention provisoire déduite de la peine", domaine: "pp_peine", temps: 10 },
    { id: "CPP_720", titre: "La libération sous contrainte", domaine: "pp_peine", temps: 15 },
    { id: "CPP_721", titre: "Les réductions de peine", domaine: "pp_peine", temps: 15 },
    // ---- Déontologie
    { id: "L71_10", titre: "La convention d'honoraires", domaine: "deonto", temps: 15 },
    { id: "RIN_2", titre: "Le secret professionnel", domaine: "deonto", temps: 15 },
    { id: "D91_184", titre: "Les peines disciplinaires", domaine: "deonto", temps: 10 },
    { id: "JP_AP_1995", titre: "La faute inexcusable (Ass. plén. 10 nov. 1995)", domaine: "dps", temps: 25 },
  ];
  CR.lib = (id) => {
    const e = CR.LIB.find((x) => x.id === id);
    if (!e) return null;
    const t = (CR.TEXTES || {})[id] || {};
    return Object.assign({ cite: t.cite || id, texte: t.texte || "", etat: t.etat || "texte", prog: e.domaine }, e);
  };

  // =================================================================== LEXIQUE
  CR.GLOSSAIRE = {
    "Aide juridictionnelle (AJ)": "Prise en charge par l'État des frais d'avocat d'une personne aux ressources modestes. L'avocat est rétribué au forfait, en unités de valeur.",
    "Commission d'office": "Désignation d'un avocat par le bâtonnier, notamment lors des permanences de garde à vue et de comparution immédiate.",
    "Garde à vue": "Mesure de contrainte décidée par un OPJ contre une personne soupçonnée d'un crime ou d'un délit puni d'emprisonnement. 24 heures, prolongeables une fois de 24 heures (art. 63).",
    "Audition libre": "Audition d'un suspect qui n'est pas retenu : il peut quitter les locaux à tout moment (art. 61-1).",
    "OPJ": "Officier de police judiciaire. Il décide la garde à vue, mène l'enquête sous la direction du procureur.",
    "Parquet": "Le ministère public : procureur de la République et ses substituts. Il décide des suites de l'enquête et requiert à l'audience.",
    "Classement sans suite": "Décision du parquet de ne pas poursuivre. Elle n'empêche pas la victime d'agir par citation directe ou par plainte avec constitution de partie civile.",
    "COPJ": "Convocation par officier de police judiciaire : remise en main propre, elle saisit le tribunal pour une date fixée.",
    "Comparution immédiate": "Jugement le jour même du déferrement, ou après un court renvoi, pour les délits flagrants ou suffisamment établis.",
    "Déferrement": "Présentation au magistrat à l'issue de la garde à vue. Le prévenu attend au dépôt du tribunal.",
    "CRPC": "Comparution sur reconnaissance préalable de culpabilité : le « plaider-coupable » délictuel.",
    "Ordonnance pénale": "Condamnation sans audience, sur dossier. Le prévenu peut faire opposition.",
    "Information judiciaire": "Enquête menée par un juge d'instruction, obligatoire en matière criminelle.",
    "Mise en examen": "Statut de la personne contre laquelle existent des indices graves ou concordants. Elle ouvre les droits de la défense devant le juge d'instruction.",
    "JLD": "Juge des libertés et de la détention : il décide du placement en détention provisoire et de ses prolongations.",
    "Contrôle judiciaire": "Mesure de liberté sous obligations (pointer, ne pas rencontrer la victime…), alternative à la détention.",
    "ARSE": "Assignation à résidence avec surveillance électronique.",
    "Permis de communiquer": "Autorisation délivrée par le magistrat chargé du dossier pour voir un client détenu au parloir.",
    "In limine litis": "Au seuil de l'instance : les exceptions de nullité se soulèvent avant toute défense au fond.",
    "Nullité": "Sanction d'un acte irrégulier : il est retiré du dossier, avec les actes dont il est le support nécessaire.",
    "Forclusion": "Perte du droit d'agir faute de l'avoir exercé dans le délai.",
    "Partie civile": "La victime qui demande réparation devant le juge pénal. Elle ne demande pas de peine.",
    "Consignation": "Somme versée par la partie civile qui met en mouvement l'action publique, garantie contre les plaintes abusives.",
    "ITT": "Incapacité totale de travail, au sens pénal : la durée pendant laquelle la victime ne peut accomplir les gestes de la vie courante. Seuil des 8 jours.",
    "UMJ": "Unité médico-judiciaire : le médecin légiste y examine les victimes sur réquisition et fixe l'ITT.",
    "Requalification": "Le tribunal change la qualification juridique des faits dont il est saisi, après débat contradictoire.",
    "Réquisitions": "Ce que demande le ministère public à l'audience : culpabilité, peine.",
    "Délibéré": "Le temps de la décision. Sur le siège : tout de suite ; à une date ultérieure : « mis en délibéré ».",
    "Sursis probatoire": "Sursis assorti d'obligations (soins, travail, indemniser la victime) contrôlées par le SPIP.",
    "DDSE": "Détention à domicile sous surveillance électronique (bracelet), peine autonome de 15 jours à 6 mois.",
    "SPIP": "Service pénitentiaire d'insertion et de probation.",
    "CARPA": "Caisse des règlements pécuniaires des avocats : tous les fonds des clients y transitent.",
    "Bâtonnier": "Chef élu de l'Ordre des avocats : commissions d'office, discipline, litiges d'honoraires.",
    "Convention d'honoraires": "Contrat écrit obligatoire entre l'avocat et son client (art. 10 de la loi de 1971).",
    "Nomenclature Dintilhac": "Liste de référence des postes de préjudice corporel : patrimoniaux et extrapatrimoniaux, temporaires et permanents.",
    "Correctionnalisation": "Poursuivre comme un délit des faits qui pourraient être qualifiés de crime, pour un jugement plus rapide.",
    "Cour criminelle départementale": "Cinq magistrats sans jury, pour les crimes punis de 15 ou 20 ans commis par un majeur, récidive comprise depuis la loi de 2026.",
    "Réunion préparatoire criminelle": "Réunion avant le procès criminel où la liste des témoins et experts est arrêtée avec l'accord des avocats.",
    "Récusation": "Aux assises, écarter un juré tiré au sort, sans avoir à motiver : 4 pour l'accusé, 3 pour le ministère public en premier ressort.",
  };

  // =================================================================== RÉGLAGE UNIQUE : COUR CRIMINELLE DÉPARTEMENTALE ET RÉCIDIVE
  // Vérifié le 10 novembre 2026 : la loi n° 2026-651 du 23 juillet 2026 (art. 3) a supprimé la condition « hors récidive » des
  // articles 181-1 et 380-16 du code de procédure pénale, en vigueur depuis le 25 juillet 2026 (Cons. const., déc. n° 2026-909 DC,
  // § 22 à 24 : conforme). La cour criminelle départementale juge donc les majeurs accusés d'un crime puni de quinze ou vingt ans,
  // récidive comprise. Ce seul réglage commande le moteur (CAT.CCD_HORS_RECIDIVE), le texte de l'art. 380-16, les fiches et corrigés.
  // La valeur false ne sert plus qu'à rejouer le droit antérieur dans les tests.
  CR.CCD_RECIDIVE = true;
  CR.ccdRegle = () => (CR.CCD_RECIDIVE ? "récidive comprise depuis la loi du 23 juillet 2026" : "hors récidive (droit antérieur à la loi du 23 juillet 2026)");

  // =================================================================== SOURCES (document de conception)
  CR.SOURCES = [
    { regle: "Loi n° 2026-651 du 23 juillet 2026 sur la justice criminelle et le respect des victimes (dite loi SURE)", usage: "Nullités 3 jours avant l'audience (art. 385), 4 mois en instruction (art. 173-1), citation à 15 jours (art. 552), mémoires (art. 198), demandes de mise en liberté" + (CR.CCD_RECIDIVE ? ", cour criminelle départementale compétente en récidive (art. 380-16), réunion préparatoire criminelle obligatoire (art. 276-1), appel limité aux peines complémentaires (art. 380-2-1 B)" : ""), src: "Légifrance (JORF du 24 juillet 2026) ; Cons. const., déc. n° 2026-909 DC ; ministère de la justice, tableau d'entrée en vigueur" },
    { regle: "Loi du 22 avril 2024 (garde à vue)", usage: "Pas d'audition sans avocat sauf dérogation ; bâtonnier saisi si l'avocat choisi ne vient pas en 2 heures", src: "CNB ; Cabinet ACI" },
    { regle: "Loi n° 2025-622 du 9 juillet 2025", usage: "Homicide routier (art. 221-18 CP), blessures routières (art. 221-19 et 221-20)", src: "Actu-Juridique ; Légifrance" },
    { regle: "Crim. 23 juin 2026, n° 25-87.950", usage: "Prescription suspendue entre la plainte simple et la réponse du parquet, 3 mois au plus", src: "21 avocats" },
    { regle: "Loi n° 2019-222 du 23 mars 2019", usage: "Échelle des peines : pas de ferme d'un mois ou moins, aménagement jusqu'à 6 mois, possible jusqu'à 1 an", src: "consultation.avocat.fr" },
    { regle: "Ordonnance n° 2025-1091", usage: "Nouveau code de procédure pénale au 1er janvier 2029, à droit constant", src: "Actu-Juridique" },
    { regle: "Art. 568 et 584 du code de procédure pénale", usage: "Pourvoi en cassation : dix jours francs depuis le 30 septembre 2024, mémoire personnel dans les dix jours de la déclaration", src: "Légifrance ; Cour de cassation" },
    { regle: "Art. 698-6 du code de procédure pénale", usage: "Cour d'assises spécialement composée : un président et quatre assesseurs, six en appel", src: "Légifrance" },
    { regle: "Art. 322-7 à 322-10 du code pénal", usage: "Incendie volontaire : quinze ans (ITT de huit jours au plus), vingt ans (bande organisée, ITT de plus de huit jours, mobile raciste), trente ans (mutilation), perpétuité (mort)", src: "Légifrance" },
    { regle: "Art. 222-52 du code pénal", usage: "Détention sans autorisation d'une arme de catégorie A ou B : cinq ans et 75 000 euros", src: "Légifrance" },
    { regle: "Art. 495-8 du code de procédure pénale", usage: "CRPC : trois ans d'emprisonnement au plus, sans dépasser la moitié de la peine encourue ; dix jours de réflexion", src: "Légifrance" },
    { regle: "Code de la justice pénale des mineurs", usage: "Atténuation (art. L. 121-5 et L. 121-7), cour d'assises des mineurs (art. L. 231-9), détention provisoire criminelle (art. L. 433-4 et L. 433-5), publicité restreinte (art. L. 513-2)", src: "Ministère de la justice, fiches techniques" },
    { regle: "Ordre des avocats de Paris, 2026", usage: "Rétrocession minimale du collaborateur libéral : 3 700 euros HT par mois la première année, 4 100 euros ensuite", src: "avocatparis.org" },
    { regle: "SMIC au 1er juin 2026 ; convention collective des cabinets d'avocats du 21 juin 2024 ; accord du 19 janvier 2007", usage: "Salaires minimaux de l'équipe, gratification des élèves avocats", src: "Legisocial ; CFTC ; Éditions Tissot" },
    { regle: "Base LEGI (DILA) ; Judilibre", usage: "Textes et arrêts embarqués, sous Licence Ouverte", src: "data.gouv.fr ; Cour de cassation" },
  ];

  // =================================================================== PROFILS DES ACTEURS
  // Siège : formaliste, pressé, curieux, conciliant, sévère. Les profils sont fictifs et ne visent aucun magistrat réel.
  CR.PROFILS = {
    formaliste: { label: "Le formaliste", tip: "Les nullités bien soulevées l'intéressent. Citez exactement, ne coupez jamais la parole.", nullites: 0.98, severite: 0.55, interrupt: 0.08, pref: "droit" },
    presse: { label: "Le pressé", tip: "Allez à l'essentiel. Votre meilleur argument d'abord.", nullites: 0.86, severite: 0.6, interrupt: 0.3, pref: "bref" },
    curieux: { label: "Le curieux", tip: "Il pose des questions. Répondez à la question, puis revenez à votre point.", nullites: 0.92, severite: 0.48, interrupt: 0.5, pref: "faits" },
    conciliant: { label: "Le conciliant", tip: "Sensible à la personnalité et aux efforts du prévenu.", nullites: 0.9, severite: 0.38, interrupt: 0.35, pref: "personnalite" },
    severe: { label: "Le sévère", tip: "Part d'une peine haute. La personnalité doit être documentée, pas affirmée.", nullites: 0.9, severite: 0.78, interrupt: 0.2, pref: "faits" },
    // parquet
    deborde: { label: "Le substitut débordé", tip: "Vingt dossiers par après-midi. Un dossier simple et une alternative bien présentée l'arrangent.", requis: 0.95, appel: 0.1, alternative: 0.45 },
    severe_pq: { label: "Le procureur sévère", tip: "Requiert haut et fait appel incident.", requis: 1.2, appel: 0.55, alternative: 0.15 },
    ouvert: { label: "Le magistrat ouvert", tip: "Écoute les garanties et les alternatives.", requis: 0.85, appel: 0.15, alternative: 0.6 },
    // OPJ
    opj_formaliste: { label: "L'OPJ formaliste", tip: "Refuse presque toutes les questions de l'avocat. Fait peu d'erreurs.", refuse: 0.65, filtre: 0.1, aveux: 0.2 },
    opj_bavard: { label: "L'OPJ bavard", tip: "Ses questions en disent long sur le dossier.", refuse: 0.15, filtre: 0.6, aveux: 0.3 },
    opj_pressant: { label: "L'OPJ qui pousse aux aveux", tip: "Insiste, reformule, promet. Préparez votre client.", refuse: 0.4, filtre: 0.3, aveux: 0.7 },
    // confrères adverses
    tenor: { label: "Le ténor", tip: "Redoutable à l'audience, conteste tout, soulève ses propres nullités.", force: 0.8, renvoi: 0.2 },
    debutant: { label: "Le jeune confrère", tip: "Bien intentionné, parfois dépassé.", force: 0.35, renvoi: 0.15 },
    renvois: { label: "Le spécialiste des renvois", tip: "Demande un renvoi dès qu'il le peut pour gagner du temps.", force: 0.55, renvoi: 0.7 },
  };

  // Personnages fictifs. Les chambres existent à Paris ; les magistrats non.
  CR.ACTEURS = [
    // siège
    { id: "pr_aubriot", nom: "Mme Clémence Aubriot", role: "president", profil: "formaliste", lieu: "10e chambre correctionnelle", look: { g: "f", skin: 0, hair: "bun", hc: "gray", glasses: 1, age: 58 }, blurb: "Ancienne juge d'instruction. Lit chaque procès-verbal, heure par heure." },
    { id: "pr_lacassagne", nom: "M. Hervé Lacassagne", role: "president", profil: "presse", lieu: "23e chambre (comparutions immédiates)", look: { g: "m", skin: 1, hair: "receding", hc: "gray", glasses: 0, age: 61 }, blurb: "Quarante dossiers par audience de comparution immédiate. Regarde souvent l'horloge." },
    { id: "pr_benkirane", nom: "Mme Inès Benkirane", role: "president", profil: "curieux", lieu: "24e chambre correctionnelle", look: { g: "f", skin: 3, hair: "long", hc: "black", glasses: 1, age: 46 }, blurb: "Pose la question que personne n'a préparée." },
    { id: "pr_dessaint", nom: "M. Paul-Henri Dessaint", role: "president", profil: "severe", lieu: "16e chambre correctionnelle", look: { g: "m", skin: 0, hair: "side", hc: "white", glasses: 1, age: 63 }, blurb: "Réputé sévère. Écoute pourtant les dossiers de personnalité bien documentés." },
    { id: "pr_roquebert", nom: "Mme Fanny Roquebert", role: "president", profil: "conciliant", lieu: "Tribunal de police", look: { g: "f", skin: 2, hair: "bob", hc: "brown", glasses: 0, age: 41 }, blurb: "Patiente avec les justiciables, exigeante avec les avocats." },
    { id: "pr_cour", nom: "M. Étienne Gallois", role: "president", profil: "formaliste", lieu: "Chambre des appels correctionnels", look: { g: "m", skin: 1, hair: "short", hc: "gray", glasses: 1, age: 60 }, blurb: "Président de chambre à la cour d'appel. L'acte d'appel délimite tout." },
    { id: "pr_assises", nom: "Mme Delphine Arnault-Royer", role: "president", profil: "curieux", lieu: "Cour d'assises de Paris", look: { g: "f", skin: 1, hair: "short", hc: "dkbrown", glasses: 0, age: 55 }, blurb: "Dirige les débats d'assises sans un mot de trop." },
    { id: "pr_ccd", nom: "M. Raphaël Ndiaye", role: "president", profil: "conciliant", lieu: "Cour criminelle départementale", look: { g: "m", skin: 5, hair: "buzz", hc: "black", glasses: 1, age: 52 }, blurb: "Préside la cour criminelle. Écoute la personnalité." },
    { id: "pr_chins", nom: "Mme Agathe Sorel", role: "president", profil: "formaliste", lieu: "Chambre de l'instruction", look: { g: "f", skin: 0, hair: "bob", hc: "gray", glasses: 1, age: 59 }, blurb: "Ses arrêts d'annulation sont rares et soigneusement motivés." },
    // instruction et détention
    { id: "ji_vauclair", nom: "M. Bastien Vauclair", role: "ji", profil: "formaliste", lieu: "Juge d'instruction", look: { g: "m", skin: 1, hair: "short", hc: "brown", glasses: 1, age: 38 }, blurb: "Jeune juge d'instruction, méticuleux, débordé." },
    { id: "ji_ferraud", nom: "Mme Ondine Ferraud", role: "ji", profil: "curieux", lieu: "Juge d'instruction", look: { g: "f", skin: 2, hair: "ponytail", hc: "dkbrown", glasses: 0, age: 44 }, blurb: "Accepte volontiers les demandes d'actes motivées." },
    { id: "jld_pimentel", nom: "M. Gérald Pimentel", role: "jld", profil: "severe", lieu: "Juge des libertés et de la détention", look: { g: "m", skin: 2, hair: "bald", hc: "gray", glasses: 0, age: 57 }, blurb: "La détention lui paraît souvent la solution simple." },
    { id: "jld_cherkaoui", nom: "Mme Nadia Cherkaoui", role: "jld", profil: "conciliant", lieu: "Juge des libertés et de la détention", look: { g: "f", skin: 3, hair: "long", hc: "black", glasses: 1, age: 48 }, blurb: "Lit les garanties de représentation pièce par pièce." },
    // parquet
    { id: "pq_delahaye", nom: "Mme Laure Delahaye", role: "parquet", profil: "deborde", lieu: "Substitut du procureur", look: { g: "f", skin: 0, hair: "long", hc: "blonde", glasses: 0, age: 35 }, blurb: "Permanence du parquet : le téléphone ne s'arrête jamais." },
    { id: "pq_riboulet", nom: "M. Antoine Riboulet", role: "parquet", profil: "severe_pq", lieu: "Substitut du procureur", look: { g: "m", skin: 1, hair: "side", hc: "dkbrown", glasses: 1, age: 43 }, blurb: "Requiert haut, fait appel incident par principe." },
    { id: "pq_haddou", nom: "Mme Yasmine Haddou", role: "parquet", profil: "ouvert", lieu: "Substitut du procureur", look: { g: "f", skin: 3, hair: "bun", hc: "black", glasses: 0, age: 39 }, blurb: "Ouverte aux alternatives quand le dossier les permet." },
    { id: "pq_ag", nom: "M. Jean-Baptiste Morvan", role: "parquet", profil: "severe_pq", lieu: "Avocat général", look: { g: "m", skin: 0, hair: "receding", hc: "white", glasses: 1, age: 62 }, blurb: "Avocat général à la cour d'appel." },
    // OPJ
    { id: "opj_marchetti", nom: "Capitaine Sophie Marchetti", role: "opj", profil: "opj_formaliste", lieu: "Commissariat central du 18e", look: { g: "f", skin: 1, hair: "ponytail", hc: "dkbrown", glasses: 0, age: 41, outfit: "shirt", shirt: "#33405a" }, blurb: "Procédurière, refuse presque toutes les questions." },
    { id: "opj_rocher", nom: "Lieutenant Damien Rocher", role: "opj", profil: "opj_bavard", lieu: "Commissariat central du 18e", look: { g: "m", skin: 0, hair: "short", hc: "brown", glasses: 0, age: 33, outfit: "shirt", shirt: "#3b4a3a" }, blurb: "Ses questions trahissent souvent ce que contient le dossier." },
    { id: "opj_benali", nom: "Brigadier-chef Mourad Benali", role: "opj", profil: "opj_pressant", lieu: "Commissariat central du 18e", look: { g: "m", skin: 3, hair: "buzz", hc: "black", glasses: 0, age: 45, beard: 1, outfit: "uniform" }, blurb: "Pousse aux aveux, surtout en fin de nuit." },
    { id: "opj_gaudin", nom: "Adjudant Fabrice Gaudin", role: "opj", profil: "opj_formaliste", lieu: "Brigade de gendarmerie de Montlhéry", look: { g: "m", skin: 1, hair: "buzz", hc: "gray", glasses: 0, age: 50, outfit: "uniform" }, blurb: "Gendarme expérimenté, procès-verbaux impeccables, ou presque." },
    // confrères
    { id: "av_villeneuve", nom: "Me Arnaud de Villeneuve", role: "confrere", profil: "tenor", lieu: "Avocat au barreau de Paris", look: { g: "m", skin: 0, hair: "side", hc: "gray", glasses: 0, age: 59, outfit: "robe" }, blurb: "Pénaliste reconnu. Ses plaidoiries font salle comble." },
    { id: "av_tessier", nom: "Me Chloé Tessier", role: "confrere", profil: "debutant", lieu: "Avocate au barreau de Paris", look: { g: "f", skin: 1, hair: "long", hc: "brown", glasses: 1, age: 27, outfit: "robe" }, blurb: "Prêtée serment l'an dernier." },
    { id: "av_pernot", nom: "Me Gilles Pernot", role: "confrere", profil: "renvois", lieu: "Avocat au barreau de Paris", look: { g: "m", skin: 1, hair: "receding", hc: "brown", glasses: 1, age: 52, outfit: "robe" }, blurb: "Un renvoi n'est jamais perdu pour tout le monde." },
  ];
  CR.acteur = (id) => CR.ACTEURS.find((a) => a.id === id) || null;
  CR.profil = (id) => { const a = CR.acteur(id); return a ? CR.PROFILS[a.profil] : null; };
  CR.ROLE_LABEL = { president: "Président", ji: "Juge d'instruction", jld: "JLD", parquet: "Parquet", opj: "OPJ", confrere: "Confrère" };

  // Le mentor
  CR.MENTOR = { nom: "Me Hélène Varenne", look: { g: "f", skin: 1, hair: "short", hc: "white", glasses: 1, age: 66, outfit: "robe" }, blurb: "Pénaliste depuis trente-huit ans, votre ancienne maîtresse de stage." };
})();
