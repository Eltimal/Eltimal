/* La Permanence — catalogue des infractions, phase 2 : le socle des crimes.
   Les fiches des crimes (cat-crimes-personnes.js, cat-crimes-sexuels.js, cat-crimes-biens.js) s'inscrivent dans le même
   catalogue que les délits (CR.CAT) : même CAT.def, même qualification (CAT.qualifier), même tirage (GEN2.tirer, genre « info »).
   Ce fichier ajoute : les textes des crimes, de l'information judiciaire et de la justice pénale des mineurs ; les enjeux de
   défense (CAT.ENJEUX) que chaque contexte peut porter ; la juridiction de jugement (CAT.juridictionCrime) ; les plafonds de la
   détention provisoire (CAT.dpMax) ; les outils communs aux récits criminels (lésions, autopsie, armes).
   Tout est rédigé hors ligne : chaque texte et chaque numéro d'article sont à revérifier sur Légifrance. */
(function () {
  const CR = window.CR;
  const CAT = CR.CAT;
  const { pk, int, ch } = CAT;
  const VERIF = CAT.VERIF;
  const S = (cite, texte) => ({ cite, texte, etat: "resume", extrait: false, source: VERIF });

  // ------------------------------------------------------------------ Réglages de droit qu'on peut revoir d'un seul geste
  // Cour criminelle départementale et récidive : le réglage unique est CR.CCD_RECIDIVE (law-fr.js) ; récidive comprise depuis la loi du 23 juillet 2026.
  // CAT.CCD_HORS_RECIDIVE en est le reflet, lu par le moteur (juridiction, contrôle des tirages).
  Object.defineProperty(CAT, "CCD_HORS_RECIDIVE", { configurable: true, enumerable: true, get: () => !CR.CCD_RECIDIVE });

  // ------------------------------------------------------------------ Textes (règle résumée ; points sensibles vérifiés en novembre 2026)
  Object.assign(CAT.TEXTES, {
    // atteintes à la vie
    "CP_221-2": [S("Art. 221-2 du code pénal", "Le meurtre qui précède, accompagne ou suit un autre crime est puni de la réclusion criminelle à perpétuité. Le meurtre qui a pour objet soit de préparer ou de faciliter un délit, soit de favoriser la fuite ou d'assurer l'impunité de l'auteur ou du complice d'un délit est puni de la réclusion criminelle à perpétuité."), "Le meurtre lié à un autre crime ou à un délit"],
    "CP_221-3": [S("Art. 221-3 du code pénal", "Le meurtre commis avec préméditation ou guet-apens constitue un assassinat. Il est puni de la réclusion criminelle à perpétuité. Une période de sûreté s'applique dans les conditions de l'article 132-23."), "L'assassinat"],
    "CP_221-4": [S("Art. 221-4 du code pénal", "Le meurtre est puni de la réclusion criminelle à perpétuité lorsqu'il est commis notamment : sur un mineur de quinze ans ; sur un ascendant ; sur une personne dont la particulière vulnérabilité est apparente ou connue de l'auteur ; sur une personne dépositaire de l'autorité publique ; sur un témoin ; à raison de l'appartenance de la victime à une ethnie ou une religion ; par plusieurs personnes agissant en bande organisée ; par le conjoint, le concubin ou le partenaire lié par un pacte civil de solidarité, y compris ancien."), "Le meurtre aggravé"],
    "CP_132-72": [S("Art. 132-72 du code pénal", "La préméditation est le dessein formé avant l'action de commettre un crime ou un délit déterminé."), "La préméditation"],
    "CP_132-71-1": [S("Art. 132-71-1 du code pénal", "Le guet-apens consiste dans le fait d'attendre un certain temps une ou plusieurs personnes dans un lieu déterminé pour commettre à leur encontre une ou plusieurs infractions."), "Le guet-apens"],
    "CP_132-71": [S("Art. 132-71 du code pénal", "Constitue une bande organisée au sens de la loi tout groupement formé ou toute entente établie en vue de la préparation, caractérisée par un ou plusieurs faits matériels, d'une ou de plusieurs infractions."), "La bande organisée"],
    "CP_121-4": [S("Art. 121-4 du code pénal", "Est auteur de l'infraction la personne qui commet les faits incriminés, ou qui tente de commettre un crime ou, dans les cas prévus par la loi, un délit."), "L'auteur et la tentative"],
    "CP_121-7": [S("Art. 121-7 du code pénal", "Est complice d'un crime ou d'un délit la personne qui sciemment, par aide ou assistance, en a facilité la préparation ou la consommation ; est également complice la personne qui, par don, promesse, menace, ordre, abus d'autorité ou de pouvoir, aura provoqué à une infraction ou donné des instructions pour la commettre. Le complice est puni comme auteur (art. 121-6)."), "La complicité"],
    "CP_122-1": [S("Art. 122-1 du code pénal", "N'est pas pénalement responsable la personne qui était atteinte, au moment des faits, d'un trouble psychique ou neuropsychique ayant aboli son discernement ou le contrôle de ses actes. La personne atteinte d'un trouble ayant seulement altéré son discernement demeure punissable ; la juridiction en tient compte : la peine privative de liberté encourue est réduite du tiers, la perpétuité étant ramenée à trente ans, sauf décision spécialement motivée."), "Le trouble mental : abolition ou altération du discernement"],
    "CP_122-2": [S("Art. 122-2 du code pénal", "N'est pas pénalement responsable la personne qui a agi sous l'empire d'une force ou d'une contrainte à laquelle elle n'a pu résister."), "La contrainte"],
    "CP_122-4": [S("Art. 122-4 du code pénal", "N'est pas pénalement responsable la personne qui accomplit un acte prescrit ou autorisé par des dispositions législatives ou réglementaires, ni celle qui accomplit un acte commandé par l'autorité légitime, sauf si cet acte est manifestement illégal. L'usage de la force par les forces de l'ordre doit rester absolument nécessaire et strictement proportionné."), "Le commandement de la loi et l'usage de la force"],
    "CP_222-7": [S("Art. 222-7 du code pénal", "Les violences ayant entraîné la mort sans intention de la donner sont punies de quinze ans de réclusion criminelle."), "Violences mortelles sans intention de tuer"],
    "CP_222-8": [S("Art. 222-8 du code pénal", "L'infraction définie à l'article 222-7 est punie de vingt ans de réclusion criminelle lorsqu'elle est commise notamment sur un mineur de quinze ans, sur une personne vulnérable, sur un ascendant, sur une personne dépositaire de l'autorité publique, par le conjoint ou le concubin, par une personne dépositaire de l'autorité publique dans l'exercice de ses fonctions, par plusieurs personnes agissant en qualité d'auteur ou de complice, avec préméditation ou guet-apens, avec usage ou menace d'une arme, par une personne agissant en état d'ivresse manifeste ou sous l'emprise de stupéfiants. Trente ans lorsqu'elle est commise sur un mineur de quinze ans par un ascendant ou par toute personne ayant autorité sur lui."), "Violences mortelles aggravées"],
    // violences sexuelles
    "CP_222-22": [S("Art. 222-22 du code pénal", "Constitue une agression sexuelle toute atteinte sexuelle commise avec violence, contrainte, menace ou surprise. Le viol et les autres agressions sexuelles sont constitués lorsqu'ils ont été imposés à la victime, quelle que soit la nature des relations existant entre l'agresseur et sa victime, y compris s'ils sont unis par les liens du mariage."), "Les agressions sexuelles : définition"],
    "CP_222-23": [S("Art. 222-23 du code pénal", "Tout acte de pénétration sexuelle, de quelque nature qu'il soit, ou tout acte bucco-génital commis sur la personne d'autrui ou sur la personne de l'auteur par violence, contrainte, menace ou surprise est un viol. Le viol est puni de quinze ans de réclusion criminelle."), "Le viol"],
    "CP_222-23-1": [S("Art. 222-23-1 du code pénal", "Hors le cas prévu à l'article 222-23, constitue également un viol tout acte de pénétration sexuelle ou tout acte bucco-génital commis par un majeur sur la personne d'un mineur de quinze ans, lorsque la différence d'âge entre eux est d'au moins cinq ans. Vingt ans de réclusion criminelle."), "Le viol sur mineur de quinze ans"],
    "CP_222-24": [S("Art. 222-24 du code pénal", "Le viol est puni de vingt ans de réclusion criminelle notamment : lorsqu'il a entraîné une mutilation ou une infirmité permanente ; lorsqu'il est commis sur un mineur de quinze ans ; sur une personne vulnérable ; par un ascendant ou une personne ayant autorité ; par une personne qui abuse de l'autorité que lui confèrent ses fonctions ; par plusieurs personnes agissant en qualité d'auteur ou de complice ; avec usage ou menace d'une arme ; lorsque la victime a été mise en contact avec l'auteur grâce à un réseau de communication électronique ; par le conjoint ou le concubin ; par une personne en état d'ivresse manifeste ou sous l'emprise de stupéfiants ; lorsqu'une substance a été administrée à la victime à son insu."), "Le viol aggravé"],
    "CP_222-27": [S("Art. 222-27 du code pénal", "Les agressions sexuelles autres que le viol sont punies de cinq ans d'emprisonnement et de 75 000 euros d'amende."), "L'agression sexuelle"],
    "CP_222-28": [S("Art. 222-28 du code pénal", "L'infraction définie à l'article 222-27 est punie de sept ans d'emprisonnement et de 100 000 euros d'amende lorsqu'elle est commise dans l'une des circonstances que le texte énumère (blessure ou ITT de plus de huit jours, ascendant ou personne ayant autorité, abus d'autorité, plusieurs auteurs, arme, conjoint, ivresse ou stupéfiants, rencontre par un réseau électronique, substance administrée à l'insu de la victime…). Dix ans et 150 000 euros dans les cas de l'article 222-29-1."), "L'agression sexuelle aggravée"],
    "CP_222-29-1": [S("Art. 222-29-1 du code pénal", "Les agressions sexuelles autres que le viol sont punies de dix ans d'emprisonnement et de 150 000 euros d'amende lorsqu'elles sont imposées à un mineur de quinze ans par violence, contrainte, menace ou surprise ; constitue également une agression sexuelle l'atteinte sexuelle commise par un majeur sur un mineur de quinze ans lorsque la différence d'âge est d'au moins cinq ans (art. 222-29-2)."), "L'agression sexuelle sur mineur de quinze ans"],
    // biens, liberté, stupéfiants
    "CP_311-9": [S("Art. 311-9 du code pénal", "Le vol en bande organisée est puni de quinze ans de réclusion criminelle et de 150 000 euros d'amende ; de vingt ans lorsqu'il est précédé, accompagné ou suivi de violences ayant entraîné une ITT ; de trente ans de réclusion criminelle lorsqu'il est commis avec usage ou menace d'une arme, ou par une personne porteuse d'une arme."), "Le vol en bande organisée"],
    "CP_311-10": [S("Art. 311-10 du code pénal", "Le vol est puni de la réclusion criminelle à perpétuité lorsqu'il est précédé, accompagné ou suivi soit de violences ayant entraîné la mort, soit de tortures ou d'actes de barbarie."), "Le vol suivi de mort ou de tortures"],
    "CP_224-1": [S("Art. 224-1 du code pénal", "Le fait, sans ordre des autorités constituées et hors les cas prévus par la loi, d'arrêter, d'enlever, de détenir ou de séquestrer une personne est puni de vingt ans de réclusion criminelle. Toutefois, si la personne détenue ou séquestrée est libérée volontairement avant le septième jour accompli depuis celui de son appréhension, la peine est de cinq ans d'emprisonnement et de 75 000 euros d'amende, sauf dans les cas prévus par l'article 224-2."), "L'enlèvement et la séquestration"],
    "CP_224-2": [S("Art. 224-2 du code pénal", "L'infraction prévue à l'article 224-1 est punie de trente ans de réclusion criminelle lorsque la victime a subi une mutilation ou une infirmité permanente ; de la réclusion criminelle à perpétuité lorsqu'elle est précédée ou accompagnée de tortures ou d'actes de barbarie, ou suivie de la mort de la victime."), "La séquestration aggravée par ses suites"],
    "CP_224-3": [S("Art. 224-3 du code pénal", "L'infraction prévue à l'article 224-1 est punie de trente ans de réclusion criminelle lorsqu'elle est commise soit en bande organisée, soit à l'égard de plusieurs personnes. La libération volontaire avant le septième jour ramène la peine à dix ans d'emprisonnement."), "La séquestration en bande organisée ou de plusieurs personnes"],
    "CP_224-4": [S("Art. 224-4 du code pénal", "Si la personne arrêtée, enlevée, détenue ou séquestrée l'a été comme otage soit pour préparer ou faciliter la commission d'un crime ou d'un délit, soit pour favoriser la fuite ou assurer l'impunité, soit pour obtenir l'exécution d'un ordre ou d'une condition, notamment le versement d'une rançon, l'infraction est punie de trente ans de réclusion criminelle. La libération volontaire avant le septième jour ramène la peine à dix ans."), "La prise d'otage"],
    "CP_224-5": [S("Art. 224-5 du code pénal", "Lorsque la victime de l'un des crimes prévus aux articles 224-1 à 224-4 est un mineur de quinze ans, la peine est portée à la réclusion criminelle à perpétuité si l'infraction est punie de trente ans, et à trente ans si elle est punie de vingt ans."), "La séquestration d'un mineur de quinze ans"],
    "CP_222-34": [S("Art. 222-34 du code pénal", "Le fait de diriger ou d'organiser un groupement ayant pour objet la production, la fabrication, l'importation, l'exportation, le transport, la détention, l'offre, la cession, l'acquisition ou l'emploi illicites de stupéfiants est puni de la réclusion criminelle à perpétuité et de 7 500 000 euros d'amende."), "La direction d'un réseau de trafic"],
    "CP_222-35": [S("Art. 222-35 du code pénal", "La production ou la fabrication illicites de stupéfiants sont punies de vingt ans de réclusion criminelle et de 7 500 000 euros d'amende ; trente ans lorsque les faits sont commis en bande organisée."), "La production de stupéfiants"],
    "CP_222-36": [S("Art. 222-36 du code pénal", "L'importation ou l'exportation illicites de stupéfiants sont punies de dix ans d'emprisonnement et de 7 500 000 euros d'amende ; trente ans de réclusion criminelle lorsque les faits sont commis en bande organisée."), "L'importation de stupéfiants"],
    "CP_322-7": [S("Art. 322-7 du code pénal", "L'infraction définie à l'article 322-6 est punie de quinze ans de réclusion criminelle et de 150 000 euros d'amende lorsqu'elle a entraîné pour autrui une incapacité totale de travail pendant huit jours au plus."), "Incendie volontaire : ITT de huit jours au plus"],
    "CP_322-8": [S("Art. 322-8 du code pénal", "L'infraction définie à l'article 322-6 est punie de vingt ans de réclusion criminelle et de 150 000 euros d'amende : lorsqu'elle est commise en bande organisée ; lorsqu'elle a entraîné pour autrui une incapacité totale de travail pendant plus de huit jours ; lorsqu'elle est commise à raison de l'appartenance ou de la non-appartenance, vraie ou supposée, de la victime à une ethnie, une nation, une prétendue race ou une religion déterminée. La mutilation ou l'infirmité permanente porte la peine à trente ans (art. 322-9)."), "Incendie volontaire : bande organisée, ITT de plus de huit jours"],
    "CP_322-10": [S("Art. 322-10 du code pénal", "L'infraction définie à l'article 322-6 est punie de la réclusion criminelle à perpétuité et de 150 000 euros d'amende lorsqu'elle a entraîné la mort d'autrui."), "Incendie volontaire suivi de mort"],
    "CP_132-76": [S("Art. 132-76 du code pénal", "Lorsqu'un crime ou un délit est précédé, accompagné ou suivi de propos, écrits, images, objets ou actes de toute nature qui portent atteinte à l'honneur ou à la considération de la victime à raison de son appartenance, vraie ou supposée, à une prétendue race, une ethnie, une nation ou une religion déterminée, le maximum de la peine est relevé (la réclusion de vingt ans passe à trente ans, celle de quinze ans à vingt ans…)."), "Le mobile raciste ou religieux"],
    // peines
    "CP_131-1": [S("Art. 131-1 du code pénal", "Les peines criminelles encourues par les personnes physiques sont la réclusion criminelle à perpétuité, la réclusion de trente ans au plus, de vingt ans au plus, de quinze ans au plus. La durée de la réclusion criminelle à temps est de dix ans au moins ; la cour peut prononcer une peine d'emprisonnement plus courte."), "Les peines criminelles"],
    "CP_132-8": [S("Art. 132-8 du code pénal", "Lorsqu'une personne déjà condamnée définitivement pour un crime ou pour un délit puni de dix ans d'emprisonnement commet un crime, le maximum de la réclusion criminelle est la perpétuité si le crime est puni de vingt ou trente ans ; il est porté à trente ans si le crime est puni de quinze ans."), "La récidive criminelle"],
    "CP_132-23": [S("Art. 132-23 du code pénal", "En cas de condamnation à une peine privative de liberté, non assortie du sursis, dont la durée est égale ou supérieure à dix ans, prononcée pour les infractions spécialement prévues par la loi, le condamné ne peut bénéficier d'aucun aménagement pendant une période de sûreté égale à la moitié de la peine, ou à dix-huit ans pour la perpétuité. La cour peut la porter aux deux tiers, ou à vingt-deux ans, ou la réduire."), "La période de sûreté"],
    // procédure : l'information
    "CPP_64-1": [S("Art. 64-1 du code de procédure pénale", "Les auditions des personnes placées en garde à vue pour crime, réalisées dans les locaux d'un service ou d'une unité de police ou de gendarmerie, font l'objet d'un enregistrement audiovisuel. L'enregistrement ne peut être consulté qu'en cas de contestation du contenu du procès-verbal, sur décision du juge d'instruction ou de la juridiction de jugement. Lorsque le nombre de personnes à entendre en même temps empêche de tout enregistrer, le procureur de la République désigne celles dont l'audition ne le sera pas ; l'impossibilité technique est mentionnée au procès-verbal et le procureur en est avisé."), "L'enregistrement des auditions en matière criminelle"],
    "CPP_79": [S("Art. 79 du code de procédure pénale", "L'instruction préparatoire est obligatoire en matière de crime ; sauf dispositions spéciales, elle est facultative en matière de délit."), "L'instruction obligatoire pour les crimes"],
    "CPP_80": [S("Art. 80 du code de procédure pénale", "Le juge d'instruction ne peut informer qu'en vertu d'un réquisitoire du procureur de la République, contre personne dénommée ou non dénommée ; il est saisi des faits visés au réquisitoire et ne peut, sans réquisitoire supplétif, informer sur des faits nouveaux."), "Le réquisitoire introductif"],
    "CPP_80-1": [S("Art. 80-1 du code de procédure pénale", "À peine de nullité, le juge d'instruction ne peut mettre en examen que les personnes à l'encontre desquelles il existe des indices graves ou concordants rendant vraisemblable qu'elles aient pu participer, comme auteur ou complice, à la commission des infractions dont il est saisi. Il ne peut procéder à cette mise en examen que s'il estime ne pas pouvoir recourir à la procédure de témoin assisté."), "La mise en examen : indices graves ou concordants"],
    "CPP_80-2": [S("Art. 80-2 du code de procédure pénale", "Le juge d'instruction peut informer une personne, par lettre recommandée, qu'elle est convoquée, dans un délai qui ne peut être inférieur à dix jours ni supérieur à deux mois, pour qu'il soit procédé à sa première comparution ; la lettre l'informe de son droit de choisir un avocat."), "La convocation en vue d'une mise en examen"],
    "CPP_81": [S("Art. 81 du code de procédure pénale", "Le juge d'instruction procède, conformément à la loi, à tous les actes d'information qu'il juge utiles à la manifestation de la vérité. Il instruit à charge et à décharge. Il fait procéder à une enquête sur la personnalité des personnes mises en examen."), "Les pouvoirs du juge d'instruction"],
    "CPP_87": [S("Art. 87 du code de procédure pénale", "La constitution de partie civile peut avoir lieu à tout moment au cours de l'instruction ; elle peut être contestée par le procureur ou une autre partie, le juge statuant par ordonnance."), "La constitution de partie civile au cours de l'information"],
    "CPP_113-1": [S("Art. 113-1 du code de procédure pénale", "Toute personne nommément visée par un réquisitoire et qui n'est pas mise en examen ne peut être entendue que comme témoin assisté ; peut aussi l'être la personne mise en cause par la victime ou contre laquelle il existe des indices rendant vraisemblable sa participation. Le témoin assisté bénéficie de l'assistance d'un avocat et de l'accès au dossier ; il ne peut faire l'objet ni d'un contrôle judiciaire ni d'une détention provisoire, ni être renvoyé devant une juridiction de jugement."), "Le témoin assisté"],
    "CPP_116": [S("Art. 116 du code de procédure pénale", "Lors de l'interrogatoire de première comparution, le juge d'instruction constate l'identité de la personne, lui fait connaître chacun des faits dont il est saisi et leur qualification juridique ; après l'avoir avisée de son droit de se taire, de faire des déclarations ou d'être interrogée, il entend, s'il y a lieu, les observations de l'avocat sur l'éventuelle mise en examen, puis l'informe de sa décision."), "L'interrogatoire de première comparution"],
    "CPP_137": [S("Art. 137 du code de procédure pénale", "Toute personne mise en examen, présumée innocente, demeure libre. En raison des nécessités de l'instruction ou à titre de mesure de sûreté, elle peut être astreinte à un contrôle judiciaire ou à une assignation à résidence avec surveillance électronique ; à titre exceptionnel, placée en détention provisoire."), "La liberté est le principe"],
    "CPP_137-1": [S("Art. 137-1 du code de procédure pénale", "La détention provisoire est ordonnée ou prolongée par le juge des libertés et de la détention, saisi par une ordonnance motivée du juge d'instruction ; il statue après un débat contradictoire où l'avocat est entendu."), "Le juge des libertés et de la détention"],
    "CPP_145-1": [S("Art. 145-1 du code de procédure pénale", "En matière correctionnelle, la détention provisoire ne peut excéder quatre mois ; elle peut être prolongée jusqu'à un an, ou deux ans dans certains cas (faits commis hors du territoire national, bande organisée, infractions punies de dix ans)."), "Les délais de la détention provisoire correctionnelle"],
    "CPP_156": [S("Art. 156 du code de procédure pénale", "Toute juridiction d'instruction ou de jugement, dans le cas où se pose une question d'ordre technique, peut ordonner une expertise, d'office ou à la demande des parties ; le refus d'une demande d'expertise est motivé et susceptible d'appel."), "L'expertise"],
    "CPP_167": [S("Art. 167 du code de procédure pénale", "Le juge d'instruction notifie les conclusions des experts aux parties et à leurs avocats et leur fixe un délai pour présenter des observations ou formuler une demande de complément d'expertise ou de contre-expertise ; le refus est motivé."), "Les conclusions de l'expertise et la contre-expertise"],
    "CPP_176": [S("Art. 176 du code de procédure pénale", "Le juge d'instruction examine s'il existe contre la personne mise en examen des charges constitutives d'infraction, dont il détermine la qualification juridique."), "Le règlement de l'information"],
    "CPP_177": [S("Art. 177 du code de procédure pénale", "Si le juge d'instruction estime que les faits ne constituent ni crime, ni délit, ni contravention, ou si l'auteur est resté inconnu, ou s'il n'existe pas de charges suffisantes, il déclare qu'il n'y a lieu à suivre (non-lieu)."), "Le non-lieu"],
    "CPP_179": [S("Art. 179 du code de procédure pénale", "Si le juge estime que les faits constituent un délit, il prononce le renvoi de l'affaire devant le tribunal correctionnel ; l'ordonnance couvre, s'il en existe, les vices de la procédure."), "L'ordonnance de renvoi devant le tribunal correctionnel"],
    "CPP_181": [S("Art. 181 du code de procédure pénale", "Si le juge d'instruction estime que les faits constituent une infraction qualifiée crime, il ordonne la mise en accusation de la personne devant la cour d'assises ou la cour criminelle départementale ; l'ordonnance purge les nullités. L'accusé détenu doit comparaître dans le délai d'un an à compter de la date à laquelle la décision de mise en accusation est devenue définitive ; à défaut, il est remis en liberté, sauf prolongation exceptionnelle de six mois, renouvelable une fois."), "L'ordonnance de mise en accusation"],
    "CPP_186": [S("Art. 186 du code de procédure pénale", "Le droit d'appel appartient à la personne mise en examen contre les ordonnances de détention et de contrôle judiciaire, et contre l'ordonnance de mise en accusation ; la partie civile peut interjeter appel des ordonnances de non-informer, de non-lieu et faisant grief à ses intérêts civils. L'appel est formé dans les dix jours de la notification."), "L'appel des ordonnances du juge d'instruction"],
    "CPP_194": [S("Art. 194 du code de procédure pénale", "En matière de détention provisoire, la chambre de l'instruction doit se prononcer dans les plus brefs délais et au plus tard dans les dix jours de l'appel lorsqu'il s'agit d'une ordonnance de placement, et dans les quinze jours dans les autres cas, faute de quoi la personne est mise d'office en liberté."), "L'appel en matière de détention : les délais de la chambre"],
    "CPP_199": [S("Art. 199 du code de procédure pénale", "Devant la chambre de l'instruction, les débats se déroulent et l'arrêt est rendu en chambre du conseil ; en matière de détention provisoire, la comparution personnelle de la personne concernée est de droit si elle le demande."), "Les débats devant la chambre de l'instruction"],
    "CPP_276-1": [S("Art. 276-1 du code de procédure pénale", "Après l'interrogatoire de l'accusé, le président de la cour d'assises ou de la cour criminelle départementale organise en chambre du conseil une réunion préparatoire criminelle avec le ministère public et les avocats de toutes les parties : liste des témoins et experts, ordre de leur déposition, durée de l'audience. Depuis la loi du 23 juillet 2026, l'audience ne peut se tenir sans cette réunion, et la liste arrêtée d'un commun accord ne peut plus être modifiée, sauf circonstances particulières appréciées par le président ou remplacement de l'avocat. L'accord suppose le consentement de tous les avocats présents et n'est opposable qu'aux parties dont l'avocat était présent (Cons. const., 23 juillet 2026, n° 2026-909 DC)."), "La réunion préparatoire criminelle"],
    "CPP_306": [S("Art. 306 du code de procédure pénale", "Les débats sont publics, à moins que la publicité ne soit dangereuse pour l'ordre ou les mœurs. Lorsque les poursuites sont exercées du chef de viol, de tortures et actes de barbarie accompagnés d'agressions sexuelles, ou de traite, le huis clos est de droit si la victime partie civile, ou l'une des victimes, le demande ; dans les autres cas, il ne peut être ordonné que si la victime partie civile ne s'y oppose pas."), "La publicité des débats et le huis clos"],
    "CPP_380-1": [S("Art. 380-1 du code de procédure pénale", "Les arrêts de condamnation rendus par la cour d'assises en premier ressort peuvent faire l'objet d'un appel ; l'accusé, le ministère public et, quant à ses intérêts civils, la partie civile peuvent faire appel. Le procureur général peut faire appel des arrêts d'acquittement. L'appel est porté devant une autre cour d'assises, ou devant la même autrement composée (loi du 23 juillet 2026), qui siège avec neuf jurés. L'appel d'un arrêt de la cour criminelle départementale est lui aussi jugé par une cour d'assises, avec ses jurés (art. 380-21). L'appel limité aux seules peines complémentaires est jugé sans jury, par un président et deux assesseurs (art. 380-2-1 B)."), "L'appel des arrêts criminels"],
    "CPP_380-9": [S("Art. 380-9 du code de procédure pénale", "L'appel est interjeté dans le délai de dix jours à compter du prononcé de l'arrêt. En cas d'appel d'une partie, les autres parties disposent d'un délai supplémentaire de cinq jours pour interjeter appel incident."), "Le délai d'appel des arrêts criminels"],
    "CPP_698-6": [S("Art. 698-6 du code de procédure pénale", "La cour d'assises spécialement composée comprend un président et, lorsqu'elle statue en premier ressort, quatre assesseurs, ou six lorsqu'elle statue en appel : des magistrats professionnels, sans jurés. Elle juge notamment les crimes de trafic de stupéfiants (art. 706-27) ; ses décisions sont prises à la majorité."), "La cour d'assises spécialement composée"],
    "CPP_706-31": [S("Art. 706-31 du code de procédure pénale", "L'action publique relative aux crimes de trafic de stupéfiants se prescrit par trente ans ; celle des délits de trafic, par vingt ans."), "La prescription du trafic de stupéfiants"],
    "CPP_706-88": [S("Art. 706-88 du code de procédure pénale", "Pour les infractions de criminalité organisée, la garde à vue peut, à titre exceptionnel, faire l'objet de deux prolongations supplémentaires de vingt-quatre heures, décidées par le juge des libertés et de la détention ou le juge d'instruction, par décision écrite et motivée ; l'intervention de l'avocat peut être différée, par décision écrite et motivée, pendant quarante-huit heures, ou soixante-douze heures en matière de trafic de stupéfiants."), "La garde à vue de criminalité organisée"],
    "CPP_706-50": [S("Art. 706-50 du code de procédure pénale", "Le procureur de la République ou le juge d'instruction, saisi de faits commis volontairement à l'encontre d'un mineur, désigne un administrateur ad hoc lorsque la protection des intérêts de celui-ci n'est pas complètement assurée par ses représentants légaux ; l'administrateur exerce, s'il y a lieu, au nom du mineur, les droits reconnus à la partie civile."), "L'administrateur ad hoc du mineur victime"],
    "CPP_706-52": [S("Art. 706-52 du code de procédure pénale", "Au cours de l'enquête et de l'information, l'audition d'un mineur victime d'infractions sexuelles fait l'objet d'un enregistrement audiovisuel ; l'enregistrement peut être visionné au cours de la procédure."), "L'audition filmée du mineur victime"],
    "CPP_706-120": [S("Art. 706-120 du code de procédure pénale", "Lorsqu'au moment du règlement de l'information le juge d'instruction estime, après expertise, que l'abolition du discernement de la personne mise en examen peut être retenue (art. 122-1), il rend une ordonnance d'irresponsabilité pénale pour cause de trouble mental ; il peut, si une partie le demande, transmettre le dossier à la chambre de l'instruction, qui statue en audience publique."), "L'irresponsabilité pénale pour cause de trouble mental"],
    // mineurs (numérotation du CJPM vérifiée sur les fiches du ministère de la justice, novembre 2026)
    "CJPM_L11-1": [S("Art. L. 11-1 du code de la justice pénale des mineurs", "Lorsqu'ils sont capables de discernement, les mineurs sont pénalement responsables des crimes, délits ou contraventions dont ils sont reconnus coupables. Les mineurs de moins de treize ans sont présumés ne pas être capables de discernement ; ceux d'au moins treize ans sont présumés en être capables."), "Le discernement du mineur"],
    "CJPM_L121-5": [S("Art. L. 121-5 du code de la justice pénale des mineurs", "Les mineurs d'au moins treize ans ne peuvent être condamnés à une peine privative de liberté supérieure à la moitié de la peine encourue ; s'il s'agit de la réclusion criminelle à perpétuité, ils ne peuvent être condamnés à plus de vingt ans. La période de sûreté ne leur est pas applicable. Pour les mineurs de plus de seize ans, la juridiction peut, à titre exceptionnel et par décision spécialement motivée, écarter cette atténuation ; la perpétuité encourue est alors ramenée à trente ans (art. L. 121-7)."), "L'atténuation de la peine des mineurs"],
    "CJPM_L231-9": [S("Art. L. 231-9 du code de la justice pénale des mineurs", "La cour d'assises des mineurs connaît des crimes commis par les mineurs âgés d'au moins seize ans ; elle est composée d'un président, de deux assesseurs pris, sauf impossibilité, parmi les juges des enfants du ressort, et du jury (art. L. 231-10). Les crimes commis par les mineurs de moins de seize ans relèvent du tribunal pour enfants (art. L. 231-3)."), "Le juge des crimes des mineurs"],
    "CJPM_L433-4": [S("Art. L. 433-4 du code de la justice pénale des mineurs", "En matière criminelle, la détention provisoire d'un mineur de moins de seize ans ne peut excéder six mois, prolongeable une fois pour six mois (art. L. 433-4). Celle d'un mineur d'au moins seize ans suit les règles des majeurs, un an puis des prolongations de six mois, sans que la durée totale excède deux ans (art. L. 433-5). Dans tous les cas, la détention doit être indispensable, et aucun contrôle judiciaire ni aucune assignation à résidence ne doit suffire (art. L. 334-2)."), "La détention provisoire des mineurs"],
    "CJPM_L513-2": [S("Art. L. 513-2 du code de la justice pénale des mineurs", "Les débats devant le tribunal pour enfants et la cour d'assises des mineurs se tiennent en publicité restreinte : seuls y assistent la victime, qu'elle soit ou non constituée partie civile, les témoins, les proches parents, les représentants légaux, la personne ou le service à qui le mineur est confié, les membres du barreau et les personnels des services chargés de son suivi. La décision est rendue en audience publique, en présence du mineur."), "La publicité restreinte devant les juridictions des mineurs"],
  });
  CAT.installTextes();
  // Les textes de procédure dans la bibliothèque : rangés en procédure de l'instruction
  for (const x of CR.LIB || []) if (x.gen && /^(CPP_|CJPM_)/.test(x.id) && CAT.TEXTES[x.id]) x.domaine = "pp_instruction";

  // ------------------------------------------------------------------ Enjeux de défense
  // Chaque contexte d'un crime en propose plusieurs. Un enjeu est porté par une pièce (fait « E_<id> ») ; s'il est « fort », la
  // pièce le soutient vraiment. effet : acquit (acquittement ou non-lieu), requalif (qualification moins grave), irresp (non-lieu
  // pour trouble mental), peine (atténuation). textes : ce qu'on cite ; arg : ce qu'on plaide ; q : la question qu'on pose.
  CAT.ENJEUX = {
    intention: { label: "L'intention de tuer n'est pas établie", effet: "requalif", textes: ["CP_221-1", "CP_222-7"], arg: "Un geste, pas une volonté de tuer : l'intention homicide ne se présume pas, elle se prouve.", q: "Combien de coups, où, et en combien de temps ?" },
    premeditation: { label: "La préméditation n'est pas établie", effet: "requalif", textes: ["CP_132-72", "CP_221-3"], arg: "Rien ne montre un dessein formé avant l'action : c'est un meurtre, pas un assassinat.", q: "Depuis quand avait-{il} cette arme sur {lui} ?" },
    ld: { label: "La légitime défense", effet: "acquit", textes: ["CP_122-5"], arg: "Une attaque injuste, une riposte immédiate, nécessaire et proportionnée : l'article 122-5 s'applique.", q: "Qui a frappé le premier, et avec quoi ?" },
    aboli: { label: "Le discernement aboli au moment des faits", effet: "irresp", textes: ["CP_122-1", "CPP_706-120"], arg: "Les experts concluent à l'abolition du discernement : {il} n'est pas pénalement responsable.", q: "Que disent les experts de son état au moment des faits ?" },
    altere: { label: "Le discernement altéré", effet: "peine", textes: ["CP_122-1"], arg: "Le discernement était altéré : la loi impose d'en tenir compte, la peine encourue est réduite du tiers.", q: "Les experts parlent-ils d'une altération ?" },
    identification: { label: "L'identification de l'auteur est incertaine", effet: "acquit", textes: ["CPP_427"], arg: "Rien ne {le} place avec certitude sur les lieux : le doute doit lui profiter.", q: "Qu'est-ce qui, dans le dossier, {le} désigne personnellement ?" },
    consentement: { label: "L'absence de consentement n'est pas établie à son égard", effet: "acquit", textes: ["CP_222-22", "CP_222-23"], arg: "Le dossier ne montre ni violence, ni contrainte, ni menace, ni surprise dont {il} ait eu conscience : l'élément moral manque.", q: "Qu'a-t-{Vil} dit ou fait, à quel moment ?" },
    penetration: { label: "La pénétration n'est pas établie", effet: "requalif", textes: ["CP_222-23", "CP_222-27"], arg: "Ni l'examen médical ni les déclarations n'établissent de pénétration : la qualification de viol ne tient pas.", q: "Que dit précisément l'examen médico-légal ?" },
    desistement: { label: "Le désistement volontaire", effet: "requalif", textes: ["CP_121-5"], arg: "{Il} s'est arrêté{e} de {lui}-même, personne ne l'en a empêché{e} : la tentative suppose l'absence de désistement volontaire.", q: "Qui l'a arrêté{e}, ou s'est-{il} arrêté{e} {seul} ?" },
    causalite: { label: "Le lien entre les coups et la mort est discuté", effet: "requalif", textes: ["CP_222-7"], arg: "Les experts ne disent pas que ces coups ont causé la mort : un état antérieur, une autre cause l'expliquent.", q: "Les experts excluent-ils une autre cause de la mort ?" },
    arme: { label: "L'arme n'est pas établie", effet: "requalif", textes: ["CP_132-75", "CP_311-8"], arg: "Aucune arme n'a été vue ni retrouvée : le vol avec arme n'est pas établi.", q: "Quelqu'un a-t-il vu l'arme, de ses yeux ?" },
    bo: { label: "La bande organisée n'est pas caractérisée", effet: "requalif", textes: ["CP_132-71"], arg: "Une rencontre de circonstance n'est pas une bande organisée : il faut une préparation, une structure, une répartition des rôles.", q: "Qu'est-ce qui prouve une organisation préparée ?" },
    liberation: { label: "La libération volontaire avant le septième jour", effet: "requalif", textes: ["CP_224-1"], arg: "La personne a été relâchée volontairement, avant le septième jour : la loi en fait un délit puni de cinq ans.", q: "Qui a ouvert la porte, et quand ?" },
    role: { label: "Un rôle secondaire", effet: "peine", textes: ["CP_121-7"], arg: "{Il} n'a ni conçu, ni dirigé, ni frappé : son rôle est secondaire, la peine doit le dire.", q: "Qui donnait les ordres ?" },
    contrainte: { label: "La contrainte, les menaces subies", effet: "acquit", textes: ["CP_122-2"], arg: "Sa famille était menacée de mort : {il} a agi sous une contrainte à laquelle {il} ne pouvait résister.", q: "Qui l'a menacé{e}, et de quoi ?" },
    danger: { label: "Le danger pour les personnes n'est pas établi", effet: "requalif", textes: ["CP_322-6", "CP_322-1"], arg: "Le feu a été mis là où personne ne pouvait être atteint : la circonstance qui fait le crime manque.", q: "Où se trouvaient les occupants quand le feu a pris ?" },
    provocation: { label: "Le contexte : des années de violences subies", effet: "peine", textes: [], arg: "Ce geste vient après des années de coups : la peine doit tenir compte de ce qu'{il} a vécu.", q: "Depuis combien de temps était-{il} frappé{e} ?" },
    force_legitime: { label: "L'usage de la force était nécessaire et proportionné", effet: "acquit", textes: ["CP_122-4"], arg: "Le geste était celui qu'enseigne la formation, face à une résistance réelle : il était nécessaire et proportionné.", q: "Résistait-{Vil} au moment du geste ?" },
    connaissance: { label: "{Il} ignorait le chargement", effet: "acquit", textes: ["CP_222-36"], arg: "Rien ne prouve qu'{il} savait ce que contenait le véhicule : l'élément intentionnel manque.", q: "Qui a chargé le véhicule, et devant qui ?" },
    geste_medical: { label: "Un geste médical, pas un geste sexuel", effet: "acquit", textes: ["CP_222-22"], arg: "L'acte reproché correspond à un examen recommandé : l'expert le confirme, l'élément moral manque.", q: "Que dit l'expert de ce geste ?" },
  };
  // Le mobile retenu par l'enquête ne contredit pas les fiches : pas d'enfants pour qui n'en a pas, pas de travail pour qui
  // n'en a pas ; sinon, le mobile suivant de la liste qui convient (le tirage, lui, ne change pas)
  CAT.mobileFiche = (liste, i, X) => {
    const M = CR.MONDE;
    const ok = (m) => !(/\b(fils|enfants?)\b/.test(m) && !((X.A && X.A.enfants) || (X.V && X.V.enfants)))
      && !(/\{VIl\}[^.]*du travail/.test(m) && X.V && !M.travaille(X.V)) && !(/^\{Il\}[^.]*du travail/.test(m) && !M.travaille(X.A));
    for (let k = 0; k < liste.length; k++) { const m = liste[(i + k) % liste.length]; if (ok(m)) return m; }
    return liste[i];
  };
  // Les textes des enjeux suivent le genre de la personne mise en examen ({il}, {e}, {mex}…) et de la victime ({Vil}, {Ve})
  CAT.enjeuTexte = (s, A, V) => {
    if (typeof s !== "string" || s.indexOf("{") < 0) return s;
    const PR = CR.GEN2 && CR.GEN2.PR;
    const G = PR ? PR.gram(A || { g: "m" }) : null;
    const H = PR ? PR.gram(V || { g: "m" }) : null;
    if (!G) return s;
    const T = { il: G.il, Il: G.Il, e: G.e, le: G.le, lui: G.soi, Soi: G.Soi, seul: G.w("seul", "seule"), Seul: G.w("Seul", "Seule"), Vla: H.le, Vlui: H.soi, mex: G.w("le mis en examen", "la mise en examen"), Mex: G.w("Le mis en examen", "La mise en examen"), dumex: G.w("du mis en examen", "de la mise en examen"), dumec: G.w("du mis en cause", "de la mise en cause"), sil: G.f ? "si elle" : "s'il", Vil: H.il, VIl: H.Il, Ve: H.e };
    return s.replace(/\{(\w+)\}/g, (m, k) => (T[k] != null ? T[k] : m));
  };
  CAT.enjeu = (id, A, V) => { const E = CAT.ENJEUX[id]; if (!E) return null; const o = {}; for (const [k, v] of Object.entries(E)) o[k] = CAT.enjeuTexte(v, A, V); return o; };
  CAT.enjeuLabel = (id, A, V) => (CAT.ENJEUX[id] ? CAT.enjeuTexte(CAT.ENJEUX[id].label, A, V) : id);

  // ------------------------------------------------------------------ Juridiction de jugement d'un crime
  // ccd : crime puni de 15 ou 20 ans, majeur, hors récidive (selon CAT.CCD_HORS_RECIDIVE) ; assises sinon ;
  // assises_spe : crimes de trafic de stupéfiants (magistrats seuls) ; mineurs : tribunal pour enfants (moins de 16 ans au moment
  // des faits) ou cour d'assises des mineurs (16 ou 17 ans) ; un délit instruit va devant le tribunal correctionnel (ou le TPE).
  CAT.juridictionCrime = function (q, ageFaits, opts = {}) {
    if (!q) return null;
    const mineur = ageFaits != null && ageFaits < 18;
    if (q.nature !== "crime") return mineur ? "tpe" : "tc";
    if (mineur) return ageFaits < 16 ? "tpe" : "assises_mineurs";
    if (q.fam === "crim_stups" || opts.stups) return "assises_spe";
    const ccd = !q.perpetuite && (q.prison === 180 || q.prison === 240) && !(CAT.CCD_HORS_RECIDIVE && q.recidive);
    return ccd ? "ccd" : "assises";
  };
  CAT.JUR_LABEL = { ccd: "la cour criminelle départementale", assises: "la cour d'assises", assises_spe: "la cour d'assises spécialement composée", assises_mineurs: "la cour d'assises des mineurs", tpe: "le tribunal pour enfants", tc: "le tribunal correctionnel" };
  // Peine encourue par un mineur (atténuation de l'art. L. 121-5 CJPM) : la moitié, la perpétuité ramenée à vingt ans
  CAT.encourueMineur = (q) => (q.perpetuite ? 240 : Math.floor(q.prison / 2));

  // ------------------------------------------------------------------ Détention provisoire : plafonds (en jours, approchés)
  // Majeur, crime : 1 an, prolongations de 6 mois, 2 ans si la peine encourue est inférieure à 20 ans, 3 ans au-delà,
  // 4 ans pour la criminalité organisée et le trafic (art. 145-2). Délit instruit : 4 mois, jusqu'à 1 an ou 2 ans (art. 145-1).
  // Mineur (CJPM) : moins de 16 ans, 6 mois prolongeables une fois (art. L. 433-4) ; 16 ans et plus, 1 an puis 6 mois, 2 ans au plus (art. L. 433-5).
  CAT.dpMax = function (q, ageFaits, bo) {
    const mineur = ageFaits != null && ageFaits < 18;
    if (q.nature !== "crime") return { initial: 120, pas: 120, max: mineur ? 60 : q.prison >= 120 || bo ? 730 : 365, mineur };
    if (mineur) return ageFaits < 16 ? { initial: 182, pas: 182, max: 365, mineur } : { initial: 365, pas: 182, max: 730, mineur };
    return { initial: 365, pas: 182, max: bo ? 1460 : q.perpetuite || q.prison >= 240 ? 1095 : 730, mineur };
  };

  // ------------------------------------------------------------------ Outils des récits criminels
  CAT.CRIM = {};
  const C = CAT.CRIM;
  C.ARMES_BLANCHES = ["un couteau de cuisine à lame de vingt centimètres", "un couteau à cran d'arrêt", "un couteau de boucher", "un cutter", "un tournevis", "un couteau pliant de type Opinel"];
  C.ARMES_FEU = ["un pistolet automatique de calibre 9 mm", "un revolver de calibre .38", "un fusil de chasse à canon scié", "un fusil d'assaut de type kalachnikov", "un pistolet de calibre 7,65 mm"];
  C.CONTONDANTS = ["une batte de baseball", "une barre de fer", "une bouteille de verre", "un marteau", "un pied de chaise", "une clé à molette"];
  // Les lésions vues à l'autopsie ou à l'examen, selon le mécanisme ; vivant : la victime a survécu (tentative, violences)
  C.lesions = function (r, mech, vivant) {
    const L = {
      couteau: vivant
        ? [`une plaie thoracique gauche de ${int(r, 3, 6)} centimètres, pénétrante, avec hémopneumothorax drainé`, `une plaie abdominale de ${int(r, 2, 5)} centimètres, avec lésion du foie, opérée en urgence`, "une plaie de la face antérieure de l'avant-bras gauche, dite « de défense »", `une plaie du flanc droit de ${int(r, 2, 4)} centimètres, superficielle`]
        : [`${int(r, 2, 9)} plaies par instrument piquant et tranchant, dont une thoracique gauche de ${int(r, 2, 5)} centimètres, ayant traversé le ventricule droit`, "une plaie cervicale latérale gauche ayant sectionné la veine jugulaire interne", `des plaies de défense à la face palmaire des deux mains`, "un hémothorax gauche de 1,8 litre"],
      arme_feu: vivant
        ? ["un orifice d'entrée à la face postérieure de la cuisse droite, sans orifice de sortie, fracture du fémur", "une plaie transfixiante du bras gauche", "un orifice d'entrée au flanc gauche, projectile extrait au bloc opératoire"]
        : [`${int(r, 2, 6)} orifices d'entrée, dont un à la région temporale droite, avec collerette érosive et tatouage indiquant un tir à courte distance`, "un orifice d'entrée thoracique, trajet de haut en bas et d'avant en arrière, lésant l'aorte", "un projectile déformé extrait du rachis dorsal"],
      coups: vivant
        ? ["un hématome sous-dural opéré en urgence", "une fracture des os propres du nez et du plancher de l'orbite droite", "des fractures de trois côtes, avec contusion pulmonaire"]
        : ["une fracture du crâne pariéto-occipitale avec hématome sous-dural aigu", "des ecchymoses multiples de la face et du cuir chevelu", "un œdème cérébral majeur", "des fractures costales bilatérales"],
      contondant: vivant
        ? ["une plaie du cuir chevelu de huit centimètres, avec fracture embarrure pariétale", "une fracture de l'avant-bras droit, dite « de parade »"]
        : ["une fracture embarrure du crâne, de forme linéaire, compatible avec un objet allongé", "une contusion cérébrale hémorragique", "une fracture de l'avant-bras droit, dite « de parade »"],
      strangulation: vivant
        ? ["des ecchymoses digitées de part et d'autre du cou", "des pétéchies conjonctivales bilatérales", "une dysphonie persistante"]
        : ["des ecchymoses digitées cervicales et des stigmates unguéaux", "une fracture de la grande corne gauche de l'os hyoïde", "des pétéchies conjonctivales et faciales", "une infiltration hémorragique des muscles du cou"],
      chute: vivant
        ? ["une fracture du bassin et des deux calcanéums", "un traumatisme crânien avec perte de connaissance initiale"]
        : ["une fracture du crâne et un hématome extradural", "des lésions de décélération : rupture de l'isthme aortique", "des fractures multiples des membres inférieurs"],
      vehicule: vivant
        ? ["une fracture ouverte du tibia et du péroné droits", "un traumatisme crânien avec perte de connaissance"]
        : ["un polytraumatisme : fractures du bassin, rupture splénique, hématome sous-dural", "des lésions de pare-chocs aux deux jambes, à cinquante centimètres du sol"],
      secouement: ["un hématome sous-dural bilatéral, d'âges différents", "des hémorragies rétiniennes bilatérales, étendues jusqu'en périphérie", "un œdème cérébral diffus", "aucune lésion du cuir chevelu ni fracture du crâne"],
      feu: vivant
        ? ["des brûlures du deuxième degré profond sur 18 % de la surface corporelle", "une intoxication aux fumées, carboxyhémoglobine à 22 %"]
        : ["des suies dans la trachée et les bronches, témoins d'une inhalation de fumées alors que la victime vivait", "une carboxyhémoglobine à 64 %", "des brûlures post mortem étendues"],
      appui: vivant ? ["des dermabrasions du visage et des épaules", "une fracture de côte"] : ["des pétéchies sous-pleurales et un œdème pulmonaire", "des ecchymoses dorsales en regard de l'appui", "une hypertrophie cardiaque préexistante"],
    }[mech] || ["des lésions traumatiques multiples"];
    const a = pk(r, L);
    const b = pk(r, L);
    return a === b ? [a] : [a, b];
  };
  // La cause de la mort, en une phrase de rapport
  C.cause = (mech) => ({
    couteau: "Le décès est consécutif à un choc hémorragique par plaies par arme blanche.",
    arme_feu: "Le décès est consécutif aux lésions par projectiles d'arme à feu.",
    coups: "Le décès est consécutif à un traumatisme crânio-encéphalique par coups portés.",
    contondant: "Le décès est consécutif à un traumatisme crânien par un objet contondant.",
    strangulation: "Le décès est consécutif à une asphyxie mécanique par compression cervicale.",
    chute: "Le décès est consécutif aux lésions d'une chute d'une grande hauteur.",
    vehicule: "Le décès est consécutif à un polytraumatisme par heurt de véhicule.",
    secouement: "Le décès est consécutif à un traumatisme crânien non accidentel par secouement.",
    feu: "Le décès est consécutif à une intoxication aux fumées d'incendie.",
    appui: "Le décès est consécutif à une asphyxie positionnelle, dans un contexte de compression thoracique prolongée et de cardiopathie préexistante.",
  })[mech] || "Le décès est d'origine traumatique.";
  // Les photographies décrites de la planche jointe aux constatations
  C.photos = (r, mech, lieu) => [
    `Photo n° 1 : vue générale ${lieu}, prise depuis l'entrée.`,
    { couteau: "Photo n° 4 : traînées de sang sur le sol, sur environ deux mètres, et empreintes de semelles partielles.", arme_feu: "Photo n° 4 : étuis percutés au sol, matérialisés par des cavaliers numérotés.", coups: "Photo n° 4 : projections de sang à hauteur basse sur le mur, de moins d'un mètre.", contondant: "Photo n° 4 : l'objet, posé contre la plinthe, cheveux et sang sur une extrémité.", strangulation: "Photo n° 4 : le lit défait, une lampe de chevet renversée.", chute: "Photo n° 4 : la fenêtre ouverte, le garde-corps intact, une chaise sous l'appui.", vehicule: "Photo n° 4 : traces de freinage absentes, débris de phare sur la chaussée.", feu: "Photo n° 4 : zone de départ du feu, carbonisation en V sur le mur.", secouement: "Photo n° 4 : le lit à barreaux, la literie en ordre.", appui: "Photo n° 4 : le sol du hall, une chaussure isolée." }[mech] || "Photo n° 4 : vue rapprochée de la zone des faits.",
    pk(r, ["Photo n° 7 : un téléphone portable écran brisé.", "Photo n° 7 : un verre renversé et une bouteille entamée.", "Photo n° 7 : une trace de main ensanglantée sur l'interrupteur.", "Photo n° 7 : un trousseau de clés au sol, près de la porte."]),
  ];
  // Un âge de mineur (au moment des faits) et ses mots
  C.ageMineur = (r, min) => int(r, min || 13, 17);
  C.metierMineur = (r, age) => (age < 16 ? pk(r, ["collégien", "collégien", "déscolarisé"]) : pk(r, ["lycéen", "lycéen en CAP", "apprenti", "déscolarisé"]));

  // ------------------------------------------------------------------ Ce que portent les pièces pour chaque enjeu (par défaut)
  // piece : la pièce qui porte la phrase ; fort : la pièce soutient vraiment l'enjeu ; faible : elle le dément ou le laisse en suspens.
  // Les contextes d'un crime peuvent remplacer ces phrases (cx.et).
  const DEF_ET = {
    intention: { piece: "medical", fort: "Un seul coup a été porté, de face, d'un geste rapide ; aucune autre lésion ne témoigne d'un acharnement.", faible: "Les coups sont multiples et visent tous des zones vitales." },
    premeditation: { piece: "telephonie", fort: "Aucun achat, aucune recherche ni aucun repérage n'apparaît dans les jours qui précèdent ; l'arme se trouvait sur place.", faible: "La veille, le téléphone {dumec} borne à proximité du domicile de la victime à trois reprises." },
    ld: { piece: "temoin", fort: "« C'est l'autre qui s'est avancé le premier, {Vil} avait quelque chose à la main. {Soi} a reculé, et puis {il} a frappé. »", faible: "« L'autre reculait, les mains en l'air, quand le coup est parti. »" },
    aboli: { piece: "psy", fort: "Les experts concluent que {mex} présentait, au moment des faits, un trouble psychotique aigu ayant aboli son discernement et le contrôle de ses actes (art. 122-1, alinéa 1).", faible: "Les experts ne retiennent aucune abolition du discernement." },
    altere: { piece: "psy", fort: "Les experts concluent à une altération du discernement au moment des faits (art. 122-1, alinéa 2), sans abolition.", faible: "Les experts ne retiennent ni abolition ni altération du discernement." },
    identification: { piece: "adn", fort: "Le prélèvement révèle un mélange de profils ; celui {dumex} ne peut être ni exclu ni confirmé, la quantité d'ADN étant insuffisante.", faible: "Le profil génétique isolé correspond à celui {dumex} ; la probabilité d'une coïncidence est inférieure à un sur un milliard." },
    consentement: { piece: "temoin", fort: "« Je les ai vus partir ensemble, {Vil} riait. Je n'ai entendu aucun cri. »", faible: "« À 2 h 14, {Vil} m'a envoyé un message : “aide moi {il} me laisse pas partir”. »" },
    penetration: { piece: "medical", fort: "L'examen ne relève aucune lésion ; la victime décrit des gestes dont elle ne peut dire s'ils ont comporté une pénétration.", faible: "L'examen relève des lésions récentes compatibles avec une pénétration non consentie." },
    desistement: { piece: "temoin", fort: "« {Il} s'est arrêté{e} d'un coup. {Il} a lâché le couteau, {il} s'est assis{e} par terre et {il} a appelé les secours {lui}-même. »", faible: "« {Il} ne s'est arrêté{e} que parce que deux hommes l'ont plaqué{e} au sol. »" },
    causalite: { piece: "medical", fort: "L'expert relève un état antérieur (cardiopathie sévère, malformation vasculaire) susceptible d'avoir provoqué le décès indépendamment des coups.", faible: "L'expert conclut que les lésions traumatiques sont la cause directe et certaine du décès." },
    arme: { piece: "temoin", fort: "« {Il} avait la main dans la poche, comme {sil} tenait quelque chose. Je n'ai jamais vu d'arme. »", faible: "« J'ai vu le canon. Noir. {Il} me le pointait sur le ventre. »" },
    bo: { piece: "telephonie", fort: "Les échanges montrent des contacts ponctuels, sans répartition durable des rôles ni structure apparente.", faible: "Les interceptions révèlent une organisation hiérarchisée : guetteurs, vendeurs, nourrice, gérant, horaires fixes et paie à la semaine." },
    liberation: { piece: "victime", fort: "« Le troisième jour, {il} a ouvert la porte et {il} m'a dit de partir. Personne ne m'a retenu{Ve}. »", faible: "« Je me suis enfui{Ve} par la fenêtre pendant qu'ils dormaient. Sinon je serais encore là-bas. »" },
    role: { piece: "telephonie", fort: "{Mex} n'apparaît dans aucun échange avec les organisateurs ; {il} était payé{e} à la journée, comme d'autres.", faible: "{Mex} donne des consignes aux autres dans plusieurs messages." },
    contrainte: { piece: "telephonie", fort: "Des messages vocaux reçus par {mex} menacent de mort sa mère et ses sœurs {sil} refuse.", faible: "Aucun message de menace n'est retrouvé ; {mex} évoque une « opportunité » à un ami." },
    danger: { piece: "expertise", fort: "Le feu a été mis dans un local fermé, sans communication avec les parties habitées ; aucune personne ne pouvait être atteinte.", faible: "Le feu a pris au pied de l'escalier, seule issue de l'immeuble, à une heure où les occupants dormaient." },
    provocation: { piece: "victime", fort: "Le fichier fait apparaître trois mains courantes et deux plaintes {dumex} contre la victime pour des violences, toutes classées.", faible: "Aucune trace de violences antérieures n'apparaît dans les fichiers." },
    force_legitime: { piece: "video", fort: "Les images montrent l'homme se débattre violemment et porter des coups au moment où la clé est pratiquée.", faible: "Les images montrent l'homme immobile, au sol, pendant toute la durée de la compression." },
    connaissance: { piece: "telephonie", fort: "{Mex} n'a reçu le véhicule que sur l'aire de repos, des mains d'un inconnu ; aucun échange préalable avec les commanditaires.", faible: "Le mis en examen échange depuis un mois avec les commanditaires sur le « poids » et le « prix du trajet »." },
    geste_medical: { piece: "expertise", fort: "L'expert désigné indique que l'examen pratiqué figure dans les recommandations professionnelles pour ce motif de consultation.", faible: "L'expert désigné indique qu'aucune indication médicale ne justifiait l'examen pratiqué." },
  };
  for (const [k, v] of Object.entries(DEF_ET)) Object.assign(CAT.ENJEUX[k], v);

  // ------------------------------------------------------------------ Les fiches de crimes : tirage et récit communs
  const L = (x, X, f) => (typeof x === "function" ? x(X, f) : x);
  C.L = L;
  // Une fiche de crime : ses contextes (cx), chacun avec ses personnages, ses preuves et ses enjeux ; la qualification reste la fiche
  C.fiche = function (id, o) {
    const ctxs = o.ctxs;
    const I = CAT.def(id, Object.assign({
      crime: true, info: true, victime: "personne", recidive: true,
      // champs lus par le code des délits : une fiche de crime n'y est jamais tirée (familles hors des genres de la phase 1)
      mesures: { gav: 1 }, flagrance: 0.5, voies: {}, preuves: {}, irr: [],
      tirer(r) { return C.tirerCtx(r, this, ctxs); },
      recit(X, f) { return C.recit(this, ctxs[f.ctx], X, f); },
    }, o));
    I.CTX = Object.keys(ctxs);
    return I;
  };
  C.tirerCtx = function (r, I, ctxs) {
    const w = {};
    for (const [k, c] of Object.entries(ctxs)) w[k] = c.w || 1;
    const k = CAT.poids(r, w);
    const cx = ctxs[k];
    const f = { ctx: k };
    if (cx.mech) f.mech = pk(r, cx.mech);
    f.mobile = cx.mobiles ? int(r, 0, cx.mobiles.length - 1) : 0;
    if (cx.mineurA && ch(r, cx.mineurA)) f.ageA = int(r, cx.ageMinA || 13, 17);
    if (cx.ageV) f.ageV = int(r, cx.ageV[0], cx.ageV[1]);
    f.agg = CAT.tirerAgg(r, cx.agg || {}, cx.maxAgg || 3, L(cx.imposees, r, f) || []);
    if (cx.tirer) Object.assign(f, cx.tirer(r, f));
    if (f.ageV != null && f.ageV < 15 && cx.mineur15 !== false && !f.agg.includes("mineur15")) f.agg.push("mineur15");
    if (f.ageA != null && f.agg.includes("autorite") && f.ageA < 18) f.agg = f.agg.filter((a) => a !== "autorite");
    f.agg = f.agg.filter((a, i, a2) => CAT.AGG[a] && a2.indexOf(a) === i);
    f.enjeux = Object.entries(cx.enjeux || {}).filter(([, p]) => ch(r, p)).map(([e]) => e);
    if (!f.enjeux.length && cx.enjeux) f.enjeux.push(Object.keys(cx.enjeux)[0]);
    f.psy = CAT.poids(r, cx.psy || { intact: 0.8, altere: 0.16, aboli: 0.04 });
    if (f.psy === "aboli" && !f.enjeux.includes("aboli")) f.enjeux.push("aboli");
    if (f.psy === "altere" && !f.enjeux.includes("altere")) f.enjeux.push("altere");
    f.enjeux = f.enjeux.filter((e) => CAT.ENJEUX[e]);
    f.forts = f.enjeux.filter((e) => e === "aboli" || e === "altere" || ch(r, cx.fort != null ? cx.fort : 0.5));
    return f;
  };
  // Prévention : la phrase de base de la fiche (ou du contexte), les circonstances s'ajoutent ailleurs
  C.recit = function (I, cx, X, f) {
    const lieu = L(cx.lieu, X, f);
    const procedural = !!L(cx.procedural, X, f);
    const deces = cx.deces != null ? !!L(cx.deces, X, f) : !!I.deces;
    const mech = f.mech || null;
    const medical = cx.medical ? L(cx.medical, X, f)
      : mech ? { kind: deces ? "autopsie" : "umj", lesions: C.lesions(X.r, mech, !deces), cause: deces ? C.cause(mech) : null, itt: deces ? null : f.itt || X.int(15, 90) }
        : { kind: "aucun" };
    const en = {};
    for (const e of f.enjeux) {
      const E = CAT.enjeu(e, X.A, X.V);
      const o = (cx.et && cx.et[e] && cx.et[e](X, f)) || {};
      const fort = f.forts.includes(e);
      en[e] = { piece: o.piece || E.piece, t: fort ? o.fort || E.fort : o.faible || E.faible, fort, f: "E_" + e };
    }
    const vict = L(cx.victime, X, f) || null;
    const proche = L(cx.proche, X, f) || null;
    const N = {
      titre: L(cx.titre, X, f), lieu, mobile: cx.mobiles ? CAT.enjeuTexte(CAT.mobileFiche(cx.mobiles, f.mobile, X), X.A, X.V) : "", procedural, deces, mech,
      resume: L(cx.resume, X, f), prevention: L(cx.prevention || I.prevention, X, f),
      constat: L(cx.scene, X, f) || [], photos: procedural || cx.photos === false ? [] : C.photos(X.r, mech || cx.photoMech || "coups", lieu).concat(L(cx.photos, X, f) || []),
      medical, victime: vict, proche,
      temoins: [L(cx.temoin, X, f), L(cx.temoin2, X, f)].filter((x) => x && x.length).map((lines, i) => ({ qui: i ? "T2" : "T", lines })),
      version: L(cx.version, X, f), audition: L(cx.audition, X, f) || C.auditionDefaut(X, f),
      enjeux: en, psy: C.psyTexte(X, f), saisie: L(cx.saisie, X, f) || null, telephonie: L(cx.telephonie, X, f) || null, adn: L(cx.adn, X, f) || null,
      expertise: L(cx.expertise, X, f) || null, video: L(cx.video, X, f) || null, toxico: L(cx.toxico, X, f) || null,
      ecrits: L(cx.ecrits, X, f) || null,
      prejudice: L(cx.prejudice, X, f) || C.prejudiceDefaut(X, f, deces, procedural),
      qA: L(cx.qA, X, f) || [], qV: L(cx.qV, X, f) || [],
      interro: L(cx.interro, X, f) || [], personnalite: C.personnalite(X, f),
      actes: L(cx.actes, X, f) || [],
    };
    N.plainte = vict || proche || [N.resume];
    return N;
  };
  // Audition en garde à vue par défaut
  C.auditionDefaut = (X, f) => [
    { q: "Reconnaissez-vous les faits qui vous sont reprochés ?", a: { silence: "Je ne souhaite pas répondre.", partiel: "Je reconnais avoir été présent. Pas le reste.", expliquer: null } },
    { q: "Comment expliquez-vous les constatations des enquêteurs ?", a: { silence: "…", partiel: "Je n'ai rien à ajouter.", expliquer: null } },
    { q: "Avez-vous quelque chose à dire à la famille de la victime ?", a: { silence: "Non.", partiel: "Non.", expliquer: "Je ne sais pas quoi dire." } },
  ];
  // L'expertise psychiatrique (art. 156) : les conclusions selon le tirage
  C.psyTexte = (X, f) => {
    const A = X.A;
    const base = [`Examen de ${X.nf(A)} au ${A.detenu ? "centre pénitentiaire" : "cabinet de l'expert"}, en deux entretiens d'une heure trente.`];
    const anam = X.pk([`Enfance marquée par ${X.pk(["le départ du père", "des placements en foyer", "la violence du père", "la maladie de la mère"])} ; scolarité ${X.pk(["interrompue en troisième", "jusqu'au baccalauréat", "en lycée professionnel"])}.`, `Consommation ${X.pk(["quotidienne de cannabis depuis l'adolescence", "d'alcool massive les fins de semaine", "occasionnelle de cocaïne"])}.`, "Aucun antécédent psychiatrique connu, aucune hospitalisation."]);
    const concl = {
      intact: "Conclusions : pas de pathologie psychiatrique au sens de l'article 122-1 ; personnalité marquée par l'impulsivité et une faible tolérance à la frustration ; discernement ni aboli ni altéré au moment des faits ; accessible à une sanction pénale ; un suivi est recommandé.",
      altere: "Conclusions : trouble de la personnalité de type état-limite, décompensé dans un contexte de consommation de toxiques ; discernement altéré au moment des faits (art. 122-1, al. 2), sans abolition ; dangerosité psychiatrique modérée ; une injonction de soins est recommandée.",
      aboli: "Conclusions : schizophrénie paranoïde, en phase de décompensation délirante au moment des faits, avec un délire de persécution centré sur la victime ; discernement aboli (art. 122-1, al. 1) ; dangerosité psychiatrique élevée ; une hospitalisation sous contrainte est nécessaire.",
    }[f.psy];
    return base.concat([anam, concl]);
  };
  C.personnalite = (X, f) => {
    const A = X.A;
    return [`${X.nf(A)}, ${A.age} ans, ${A.metier}. ${A.heberg ? `Domicilié ${A.adresse}.` : "Sans domicile stable au moment des faits."}`, A.enfants ? `${A.g === "f" ? "Mère" : "Père"} de ${A.enfants} enfant${A.enfants > 1 ? "s" : ""}.` : "Sans enfant.", A.casier ? (A.casier === 2 ? "Plusieurs condamnations au casier, dont une récente." : "Une ancienne condamnation au casier.") : "Casier judiciaire vierge.", `Entourage : ${A.proche}, qui le décrit comme ${X.pk(["« quelqu'un de gentil, qui part au quart de tour »", "« discret, renfermé depuis quelques mois »", "« travailleur, mais qui buvait trop »", "« un garçon perdu, mal entouré »"])}.`];
  };
  C.prejudiceDefaut = (X, f, deces, procedural) => {
    if (deces) return [{ id: "affection", label: "Préjudice d'affection", demande: 30000, base: 25000 }, { id: "obseques", label: "Frais d'obsèques", demande: 5400, base: 5400, piece: "facture" }, { id: "economique", label: "Préjudice économique des proches", demande: 60000, base: 40000 }];
    return [{ id: "dft", label: "Déficit fonctionnel et souffrances endurées", demande: procedural ? 25000 : 18000, base: procedural ? 20000 : 14000 }, { id: "moral", label: "Préjudice moral", demande: 8000, base: 6000 }, { id: "soins", label: "Frais de suivi psychologique", demande: 2400, base: 2400, piece: "facture_soins" }];
  };
})();
