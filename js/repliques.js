/* La Permanence — chantier anti-répétition, lot 2 : des affaires qui ne se lisent plus deux fois pareil.
   Appliqué aux affaires générées, après leur construction (GEN2.def), sans toucher au tirage (les codes se rejouent) :
   1. Le phrasier : les phrases qui revenaient dans toutes les affaires (permanence, garde à vue, dépôt, pièces, audience) ont
      plusieurs versions ; la version est choisie par la signature de l'affaire (une affaire se relit à l'identique), et selon
      le profil du président, du parquet ou de l'officier quand c'est eux qui parlent.
   2. Le tempérament du client (mutique, bavard, agressif, angoissé, posé) colore ses réponses aux entretiens et coûte des
      minutes : un client mutique ou bavard fait perdre du temps sur les trente minutes de la garde à vue.
   3. Les audiences à rebondissements : un incident tiré au sort (pièce versée à la barre, client qui s'emporte, témoin dans
      la salle, audience tardive, interprète en retard…) avec un choix pour l'avocat ; les règles en jeu sont au débrief.
   Les segments qui portent une anomalie (flag, paire) ne sont jamais réécrits : ils restent à relever tels quels.
   Droit : chaque règle citée est à revérifier sur Légifrance. */
(function () {
  const CR = window.CR;
  const GEN2 = CR.GEN2;
  const PH = (CR.PHRASIER = {});
  const h = (k) => CR.hash(String(k));

  // =================================================================== 1. Le phrasier
  // V(id, motif, versions, profils) : la première version est le texte d'origine ; « $1 » reprend un groupe du motif.
  // profils : { qui: "pres" | "parquet" | "opj", par: { profil: [versions] } } — remplace les versions pour ce profil.
  const E = [];
  const V = (id, re, vs, pr) => E.push({ id, re: new RegExp(re, "gu"), vs, pr });
  const N = "([\\p{Lu}][\\p{L}'’ -]*?)"; // un nom propre (prénom et nom)
  const HR = "(\\d{1,2} h \\d{2})";
  // --- la permanence pénale de l'Ordre (appel)
  V("perm_ici", "Maître, ici la permanence pénale de l'Ordre\\.", ["Maître, ici la permanence pénale de l'Ordre.", "Bonjour maître, la permanence pénale du barreau.", "Maître ? La permanence de l'Ordre, pour une garde à vue.", "Permanence pénale, bonjour maître."]);
  V("perm_vous", "Vous y allez \\?", ["Vous y allez ?", "Je peux vous l'attribuer ?", "Vous la prenez ?", "Je vous inscris dessus ?"]);
  V("perm_bonne", "Bonne garde à vue, maître\\.", ["Bonne garde à vue, maître.", "Bon courage, maître.", "Merci maître, bonne permanence.", "Je préviens l'officier. Bon courage."]);
  V("perm_refus", "Je ne peux pas prendre ce dossier\\.", ["Je ne peux pas prendre ce dossier.", "Je dois refuser ce dossier.", "Ce dossier, je ne peux pas le prendre.", "Je ne pourrai pas assurer cette garde à vue."]);
  V("perm_retenu", "Je suis déjà retenu : une audience, ou une autre garde à vue en cours\\.", ["Je suis déjà retenu : une audience, ou une autre garde à vue en cours.", "Je suis déjà pris : une autre garde à vue, ou une audience qui tire en longueur.", "Impossible, je suis retenu ailleurs, en audience ou au commissariat.", "J'ai déjà un dossier en cours, je ne peux pas me dédoubler."]);
  V("perm_conflit", "Conflit d'intérêts : je connais une autre personne mise en cause dans cette affaire\\.", ["Conflit d'intérêts : je connais une autre personne mise en cause dans cette affaire.", "Je ne peux pas : je défends déjà quelqu'un d'autre dans ce dossier.", "Il y a un conflit d'intérêts, un autre mis en cause est mon client."]);
  V("perm_souffrant", "Je suis souffrant ; je ne suis pas en état d'y aller\\.", ["Je suis souffrant ; je ne suis pas en état d'y aller.", "Je suis malade, je ne tiendrai pas une garde à vue.", "Je ne suis pas en état : j'ai de la fièvre depuis ce matin."]);
  V("perm_trop", "J'ai trop de dossiers, et celui-là ne m'intéresse pas\\.", ["J'ai trop de dossiers, et celui-là ne m'intéresse pas.", "Trop de travail, et franchement ce dossier ne me dit rien.", "Je suis débordé, et ce n'est pas mon genre d'affaire."]);
  V("perm_note_conflit", "Je note le conflit et j'attribue le dossier à un confrère\\.", ["Je note le conflit et j'attribue le dossier à un confrère.", "Entendu, je le donne à un confrère.", "Bien noté. Un confrère prendra le dossier."]);
  V("perm_suivant", "Je préviens le confrère suivant\\.", ["Je préviens le confrère suivant.", "Je passe au confrère suivant sur la liste.", "J'appelle quelqu'un d'autre."]);
  V("perm_suivant2", "J'appelle le confrère suivant\\.", ["J'appelle le confrère suivant.", "Je vais voir avec le suivant sur la liste.", "Je trouve quelqu'un d'autre."]);
  V("perm_motif", "Pour quel motif, maître \\?", ["Pour quel motif, maître ?", "Qu'est-ce qui vous en empêche ?", "Vous avez un empêchement ?"]);
  V("perm_empeche", "Quel est votre empêchement \\?", ["Quel est votre empêchement ?", "Qu'est-ce qui vous retient ?", "Pourquoi, maître ?"]);
  V("perm_pasmotif", "Ce n'est pas un motif, maître\\.", ["Ce n'est pas un motif, maître.", "Maître, ce n'est pas une excuse recevable.", "Ça, ce n'est pas un empêchement."]);
  V("perm_batonnier", "Je dois le signaler au bâtonnier\\.", ["Je dois le signaler au bâtonnier.", "Je dois en faire part au bâtonnier.", "Le bâtonnier en sera informé."]);
  V("perm_ordre", "Je suis obligé d'en référer à l'Ordre\\.", ["Je suis obligé d'en référer à l'Ordre.", "L'Ordre devra en être informé.", "Je fais remonter à l'Ordre, vous le savez."]);
  V("perm_inscrit", "Vous êtes inscrit à la permanence : je dois le noter\\.", ["Vous êtes inscrit à la permanence : je dois le noter.", "Vous êtes de permanence, je dois le consigner.", "Vous vous êtes inscrit, je dois l'indiquer."]);
  V("perm_inscrit2", "Vous vous êtes inscrit\\.", ["Vous vous êtes inscrit.", "Vous êtes sur la liste.", "C'est votre tour de garde."]);
  V("perm_depermanence", "Maître, vous êtes de permanence\\.", ["Maître, vous êtes de permanence.", "Maître, c'est votre jour de permanence.", "Maître, vous êtes de garde aujourd'hui."]);
  V("perm_empechement", "Entendu, c'est un empêchement\\.", ["Entendu, c'est un empêchement.", "D'accord, c'est un motif légitime.", "Bien, je comprends."]);
  V("perm_commissariat", "Je préviens le commissariat\\.", ["Je préviens le commissariat.", "J'avertis l'officier.", "Je le dis au commissariat."]);
  V("perm_quart", "Très bien, j'appelle l'officier de quart pour lui dire que vous arrivez\\.", ["Très bien, j'appelle l'officier de quart pour lui dire que vous arrivez.", "Parfait, je préviens le commissariat de votre arrivée.", "Je dis à l'officier que vous êtes en route."]);
  V("perm_note", "D'accord, je le note\\.", ["D'accord, je le note.", "C'est noté.", "Entendu, je l'inscris."]);
  V("perm_passe", "Je passe au suivant\\.", ["Je passe au suivant.", "Je vois avec un autre confrère.", "Je continue la liste."]);
  V("perm_attribue", "Je vous l'attribue \\?", ["Je vous l'attribue ?", "Je vous inscris ?", "C'est pour vous ?"]);
  V("perm_tout", "C'est tout ce que j'ai, maître\\.", ["C'est tout ce que j'ai, maître.", "Je n'en sais pas plus, maître.", "L'officier ne m'a rien dit d'autre."]);
  V("perm_avocat", "(Il|Elle) a demandé un avocat commis d'office\\.", ["$1 a demandé un avocat commis d'office.", "$1 a demandé un avocat de permanence.", "$1 veut un avocat, commis d'office."]);
  V("perm_avocat2", "(Il|Elle) demande un avocat\\.", ["$1 demande un avocat.", "$1 a demandé à être assisté.", "$1 veut un avocat."]);
  // --- au commissariat
  V("gav_tend", "L'officier vous tend la procédure : « Trente minutes, maître\\.", ["L'officier vous tend la procédure : « Trente minutes, maître.", "L'officier pose le dossier devant vous : « Vous avez trente minutes, maître.", "On vous ouvre le bureau d'entretien. L'officier : « Trente minutes, pas une de plus."], { qui: "opj", par: { opj_formaliste: ["L'officier vous tend la procédure, montre en main : « Trente minutes, maître, l'article 63-4 est clair."], opj_bavard: ["L'officier vous tend la procédure avec un sourire : « Trente minutes, maître. Vous allez voir, il est sympa, votre client."], opj_pressant: ["L'officier vous tend la procédure sans vous regarder : « Trente minutes, maître. On a d'autres choses à faire."] } });
  V("gav_comm", "Commissariat central du (\\d+e) arrondissement, " + HR + "\\.", ["Commissariat central du $1 arrondissement, $2.", "$2. Commissariat central du $1, le hall des gardes à vue sent le café froid.", "Commissariat du $1, $2. Un planton vous fait signer le registre des avocats.", "$2, commissariat central du $1 arrondissement. Des voix montent du fond du couloir."]);
  V("gav_silence", "Je ne souhaite pas répondre\\.", ["Je ne souhaite pas répondre.", "Je garde le silence.", "Je n'ai rien à déclarer sur ce point.", "Sur les conseils de mon avocat, je ne réponds pas."]);
  V("gav_ajouter", "Avez-vous quelque chose à ajouter \\?", ["Avez-vous quelque chose à ajouter ?", "Autre chose à déclarer ?", "Vous voulez ajouter quelque chose ?", "C'est tout ce que vous avez à dire ?"]);
  V("gav_adresse", "Avez-vous vérifié son adresse \\?", ["Avez-vous vérifié son adresse ?", "Son adresse a-t-elle été vérifiée ?", "L'hébergement a-t-il été confirmé ?"]);
  V("gav_adresse_r", "Oui, sa famille a confirmé par téléphone\\.", ["Oui, sa famille a confirmé par téléphone.", "Oui, on a eu un proche au téléphone, c'est confirmé.", "C'est vérifié, la famille l'héberge bien."]);
  V("gav_notif_q", "À quelle heure les droits de mon client lui ont-ils été notifiés \\?", ["À quelle heure les droits de mon client lui ont-ils été notifiés ?", "Quand mon client a-t-il reçu notification de ses droits ?", "À quelle heure exactement avez-vous notifié ses droits ?"]);
  V("gav_notif_r", "Dès le placement, maître, c'est au procès-verbal\\.", ["Dès le placement, maître, c'est au procès-verbal.", "Tout de suite, maître. Lisez le procès-verbal.", "Immédiatement. C'est écrit, maître."], { qui: "opj", par: { opj_formaliste: ["Dès le placement, maître, comme l'exige l'article 63-1. C'est au procès-verbal."] } });
  V("gav_aupv", "C'est au procès-verbal, maître\\.", ["C'est au procès-verbal, maître.", "Tout est dans la procédure, maître.", "Lisez le procès-verbal, maître."]);
  V("gav_peuxpas", "Je ne peux pas vous répondre, maître\\.", ["Je ne peux pas vous répondre, maître.", "Ça, maître, je ne vous le dirai pas.", "Vous le verrez à l'audience, maître."], { qui: "opj", par: { opj_bavard: ["Officiellement, je ne peux pas vous répondre, maître… Mais regardez bien les heures."] } });
  V("gav_controle", "Pourquoi mon client a-t-il été contrôlé \\?", ["Pourquoi mon client a-t-il été contrôlé ?", "Sur quel fondement le contrôle d'identité a-t-il eu lieu ?", "Qu'est-ce qui a motivé le contrôle ?"]);
  V("gav_plainte", "Une plainte a-t-elle été déposée \\?", ["Une plainte a-t-elle été déposée ?", "Y a-t-il une plainte ?", "La victime a-t-elle porté plainte ?"]);
  // --- au dépôt, avant la comparution immédiate
  V("dep_condamne", "Avez-vous déjà été (condamnée?) \\?", ["Avez-vous déjà été $1 ?", "Vous avez déjà eu affaire à la justice ?", "Il y a quelque chose sur votre casier ?"]);
  V("dep_explique", "Je vous explique : vous pouvez être (jugée?) aujourd'hui, ou demander un délai\\.", ["Je vous explique : vous pouvez être $1 aujourd'hui, ou demander un délai.", "Deux possibilités : être $1 aujourd'hui, ou demander du temps pour préparer votre défense.", "Vous pouvez accepter d'être $1 tout de suite, ou demander un délai."]);
  V("dep_notif", "À quelle heure vous a-t-on notifié vos droits \\?", ["À quelle heure vous a-t-on notifié vos droits ?", "Quand vous a-t-on lu vos droits, au commissariat ?", "Vos droits, on vous les a lus à quel moment ?"]);
  V("dep_lus", "Quand est-ce qu'on vous a lu vos droits \\?", ["Quand est-ce qu'on vous a lu vos droits ?", "On vous a lu vos droits quand ?", "Vos droits, c'était à quel moment ?"]);
  V("dep_raconte", "Racontez-moi ce qui s'est passé\\.", ["Racontez-moi ce qui s'est passé.", "Dites-moi tout, depuis le début.", "Qu'est-ce qui s'est passé, avec vos mots ?"]);
  V("dep_habite", "Vous habitez où \\?", ["Vous habitez où ?", "Quelle est votre adresse ?", "Vous vivez où, en ce moment ?"]);
  V("dep_ou", "Et pendant ce temps-là, je suis où, moi \\?", ["Et pendant ce temps-là, je suis où, moi ?", "Et moi, je reste où en attendant ?", "Je dors où, si on attend ?"]);
  V("dep_lieu", "Le dépôt du tribunal, sous la salle d'audience\\.", ["Le dépôt du tribunal, sous la salle d'audience.", "Le dépôt, au sous-sol du tribunal.", "Une cellule du dépôt, sous les salles d'audience."]);
  V("dep_lieu2", "Le dépôt, sous la 23e chambre\\.", ["Le dépôt, sous la 23e chambre.", "Le dépôt, juste sous la salle de la 23e.", "Les cellules du dépôt, sous la 23e chambre."]);
  V("dep_quoi", "Il va se passer quoi \\?", ["Il va se passer quoi ?", "Et maintenant ?", "Ça va se passer comment ?", "On fait quoi, là ?"]);
  V("dep_pensez", "On fait ce que vous pensez\\.", ["On fait ce que vous pensez.", "Je vous fais confiance.", "C'est vous qui savez."]);
  V("dep_serez", "Vous serez là, hein \\?", ["Vous serez là, hein ?", "Vous ne me lâchez pas, d'accord ?", "Vous restez avec moi ?"]);
  V("dep_atout", "À tout à l'heure, maître\\.", ["À tout à l'heure, maître.", "À tout de suite, alors.", "Merci, maître. À tout à l'heure."]);
  V("dep_quand", "On passe quand \\?", ["On passe quand ?", "C'est à quelle heure ?", "On attend encore longtemps ?"]);
  V("dep_savez", "Vous savez mieux que moi\\.", ["Vous savez mieux que moi.", "C'est vous l'avocat.", "Je ne sais pas, moi."]);
  V("dep_prison", "Si je demande un délai, je reste en prison \\?", ["Si je demande un délai, je reste en prison ?", "Un délai, ça veut dire que je dors en prison ?", "Et si on attend, je reste en cellule ?"]);
  V("dep_heure", "Vous avez une idée de l'heure \\?", ["Vous avez une idée de l'heure ?", "Vous vous rappelez l'heure ?", "C'était vers quelle heure ?"]);
  V("dep_confirmer", "On peut le confirmer\\.", ["On peut le confirmer.", "Ça se vérifie.", "Ma famille peut le dire."]);
  V("dep_patron", "Mon patron peut faire une attestation\\.", ["Mon patron peut faire une attestation.", "Mon employeur peut l'écrire.", "Au travail, ils peuvent faire un papier."]);
  V("dep_papier", "Ils m'ont lu un papier et j'ai signé\\.", ["Ils m'ont lu un papier et j'ai signé.", "On m'a fait signer une feuille.", "Ils ont lu un truc, j'ai signé sans comprendre."]);
  V("dep_quoi2", "Qu'est-ce qui s'est passé \\?", ["Qu'est-ce qui s'est passé ?", "Que s'est-il passé ?", "Racontez-moi."]);
  V("dep_debut", "Tout de suite, au début\\.", ["Tout de suite, au début.", "Au début, dès l'arrivée.", "Dès qu'on est arrivés."]);
  V("dep_papier2", "Un papier à signer\\.", ["Un papier à signer.", "Une feuille, je l'ai signée.", "Des papiers, j'ai signé."]);
  V("dep_nuit", N + " a passé la nuit en garde à vue\\.", ["$1 a passé la nuit en garde à vue.", "$1 sort d'une nuit de garde à vue.", "$1 n'a presque pas dormi : une nuit en cellule."]);
  V("dep_yeux", N + " a les yeux rouges de fatigue\\.", ["$1 a les yeux rouges de fatigue.", "$1 se frotte les yeux : la nuit a été longue.", "$1 a le teint gris d'une nuit sans sommeil."]);
  // --- les pièces (les formules changent avec l'officier et le service, pas le droit)
  V("pv_avisproc", "Avis au procureur de la République à " + HR + "\\.", ["Avis au procureur de la République à $1.", "Avisons le procureur de la République à $1.", "À $1, avis donné au procureur de la République (permanence du parquet).", "Le procureur de la République est avisé à $1."]);
  V("pv_interprete", "Interprète : sans objet, la personne déclarant comprendre le français\\.", ["Interprète : sans objet, la personne déclarant comprendre le français.", "La personne déclare parler et comprendre le français ; pas d'interprète.", "Interprète : non requis, la personne s'exprimant en français."]);
  V("pv_document", "Lui remettons le document énonçant ses droits", ["Lui remettons le document énonçant ses droits", "Lui remettons, contre émargement, le document écrit énonçant ses droits", "Lui est remis le formulaire énonçant ses droits"]);
  V("pv_commis", "La personne demande l'assistance d'un avocat commis d'office\\.", ["La personne demande l'assistance d'un avocat commis d'office.", "La personne gardée à vue sollicite un avocat commis d'office.", "Demande l'assistance d'un avocat désigné par le bâtonnier."]);
  V("pv_avisavocat", "Avis à la permanence des avocats à " + HR + "\\.", ["Avis à la permanence des avocats à $1.", "Avisons la permanence du barreau à $1.", "À $1, la permanence de l'Ordre des avocats est avisée."]);
  V("pv_dont", "Dont procès-verbal, que la personne signe avec nous après lecture\\.", ["Dont procès-verbal, que la personne signe avec nous après lecture.", "Dont acte, signé par la personne avec nous après lecture.", "Lecture faite, la personne signe avec nous le présent."]);
  V("pv_persiste", "Lecture faite, persiste et signe\\.", ["Lecture faite, persiste et signe.", "Après lecture, persiste et signe avec nous.", "Lecture faite par lui-même, persiste et signe."]);
  V("pv_interp", "Interpellation à " + HR + "\\.", ["Interpellation à $1.", "Interpellation effectuée à $1.", "À $1, interpellation."]);
  V("pv_conduite", "Conduite au commissariat central du (\\d+e) ; présentation à l'officier de police judiciaire à " + HR + "\\.", ["Conduite au commissariat central du $1 ; présentation à l'officier de police judiciaire à $2.", "Transport au commissariat du $1, présentation à l'OPJ de permanence à $2."]);
  V("pv_camera", "Aucune caméra n'est relevée à proximité\\.", ["Aucune caméra n'est relevée à proximité.", "Pas de dispositif de vidéoprotection dans le secteur.", "Aucune caméra exploitable aux abords."]);
  V("pv_palpation", "Palpation de sécurité : rien à signaler\\.", ["Palpation de sécurité : rien à signaler.", "Palpation de sécurité négative.", "Palpation : aucun objet dangereux."]);
  V("pv_releve", "Relevé délivré à l'autorité judiciaire\\.", ["Relevé délivré à l'autorité judiciaire.", "Bulletin délivré à la demande du parquet.", "Relevé établi pour l'autorité judiciaire."]);
  V("esr_ant", "Antécédents déclarés, conformes au casier\\.", ["Antécédents déclarés, conformes au casier.", "Les antécédents déclarés correspondent au casier.", "Déclarations sur les antécédents conformes au bulletin n° 1."]);
  V("esr_enfant", "Sans enfant à charge\\.", ["Sans enfant à charge.", "Aucun enfant à charge.", "Pas d'enfant."]);
  V("esr_avis", "Avis : pas d'objection à une mesure alternative à la détention si l'hébergement est confirmé par écrit\\.", ["Avis : pas d'objection à une mesure alternative à la détention si l'hébergement est confirmé par écrit.", "Avis favorable à une alternative à la détention, sous réserve d'une attestation d'hébergement.", "Une mesure alternative paraît possible si l'hébergement est attesté par écrit."]);
  V("esr_entretien", "Entretien avec " + N + " au dépôt du tribunal\\.", ["Entretien avec $1 au dépôt du tribunal.", "Entretien au dépôt du tribunal avec $1.", "Rencontre avec $1 au dépôt, avant l'audience."]);
  // --- l'audience (selon le président et le parquet)
  V("aud_leve", "\\(Tout le monde se lève\\. Les juges prennent place ; la greffière ouvre le rôle\\.\\)", ["(Tout le monde se lève. Les juges prennent place ; la greffière ouvre le rôle.)", "(La salle se lève. Le tribunal s'installe ; la greffière cherche la cote.)", "(On se lève. Les magistrats s'assoient, un dossier sous le bras.)"], { qui: "pres", par: { presse: ["(Le tribunal entre à grands pas. Le président s'assoit avant tout le monde.)"], severe: ["(Le silence tombe d'un coup. Le président attend que la salle soit parfaitement debout.)"], curieux: ["(Le tribunal entre. La présidente feuillette déjà le dossier en s'asseyant.)"] } });
  V("aud_droit", "Vous avez le droit, au cours des débats, de faire des déclarations, de répondre aux questions qui vous sont posées ou de vous taire\\.", ["Vous avez le droit, au cours des débats, de faire des déclarations, de répondre aux questions qui vous sont posées ou de vous taire.", "Je vous informe que vous pouvez, pendant les débats, faire des déclarations, répondre aux questions ou garder le silence.", "Vous pouvez parler, répondre aux questions ou vous taire : c'est votre droit pendant toute l'audience."], { qui: "pres", par: { presse: ["Vous pouvez vous taire, répondre ou faire des déclarations. Allons-y."], formaliste: ["En application de l'article 406, je vous informe de votre droit, au cours des débats, de faire des déclarations, de répondre aux questions ou de vous taire."] } });
  V("aud_pasca", "C'est pas comme ils disent\\.", ["C'est pas comme ils disent.", "Ça s'est pas passé comme ça.", "C'est pas vrai, tout ça.", "Ils racontent n'importe quoi."]);
  V("aud_garanties", "Maître, des garanties de représentation \\?", ["Maître, des garanties de représentation ?", "Maître, qu'avez-vous sur sa situation ?", "Des justificatifs, maître ?"], { qui: "pres", par: { presse: ["Des garanties, maître ? Vite."], severe: ["Maître, avez-vous des pièces, ou seulement des promesses ?"] } });
  V("aud_verse", "Je les verse au dossier\\.", ["Je les verse au dossier.", "Le tribunal en prend connaissance.", "Merci, maître. C'est au dossier."]);
  V("aud_pdef", "La parole est à la défense\\.", ["La parole est à la défense.", "Maître, vous avez la parole.", "Nous vous écoutons, maître."], { qui: "pres", par: { presse: ["Maître, la parole est à vous. Soyez bref."], curieux: ["Maître, je vous écoute. Qu'avez-vous à nous dire sur ce dossier ?"], severe: ["La parole est à la défense."] } });
  V("aud_ppc", "La parole est à la partie civile\\.", ["La parole est à la partie civile.", "Maître, pour la partie civile.", "Nous entendons la partie civile."]);
  V("aud_regrets", "Je regrette\\. Je ne recommencerai pas\\.", ["Je regrette. Je ne recommencerai pas.", "Je regrette ce qui s'est passé. Ça ne se reproduira pas.", "Je regrette sincèrement. J'ai compris."]);
  V("aud_rien", "Je n'ai rien à ajouter\\.", ["Je n'ai rien à ajouter.", "Rien de plus.", "J'ai tout dit."]);
  V("aud_detention", "Le tribunal entend le parquet sur la détention\\.", ["Le tribunal entend le parquet sur la détention.", "Monsieur le procureur, sur la détention ?", "Le parquet, sur la situation du prévenu jusqu'à l'audience ?"]);
  V("aud_cj", "Je requiers un contrôle judiciaire\\.", ["Je requiers un contrôle judiciaire.", "Un contrôle judiciaire strict suffira.", "Je demande un contrôle judiciaire, avec interdiction de contact."], { qui: "parquet", par: { severe_pq: ["Je requiers un contrôle judiciaire strict, avec pointage deux fois par semaine."] } });
  V("aud_garjld", "(Il|Elle) a une adresse et une famille ; un contrôle judiciaire suffit\\.", ["$1 a une adresse et une famille ; un contrôle judiciaire suffit.", "Une adresse, une famille : le contrôle judiciaire répond à tous les risques.", "$1 sera là à l'audience : son domicile et les siens en répondent."]);
  V("aud_empjld", "(Il|Elle) travaille ; la détention le lui ferait perdre\\.", ["$1 travaille ; la détention le lui ferait perdre.", "La détention, c'est la perte de son emploi avant tout jugement.", "$1 a un travail : quelques semaines de détention suffiraient à le perdre."]);
  V("aud_conf", "Je demande la confirmation\\.", ["Je demande la confirmation.", "Je demande à la cour de confirmer.", "Confirmation du jugement, je vous prie."]);
  V("aud_rapporte", "Je m'en rapporte\\.", ["Je m'en rapporte.", "Je m'en rapporte à la sagesse de la cour.", "Le parquet s'en rapporte."]);
  V("aud_coursetire", "La cour se retire pour délibérer\\.", ["La cour se retire pour délibérer.", "La cour va délibérer.", "Suspension : la cour délibère."]);
  V("aud_reconnait", "(Madame|Monsieur) ([\\p{Lu}][\\p{L}'’ -]*?), vous reconnaissez les faits \\?", ["$1 $2, vous reconnaissez les faits ?", "Reconnaissez-vous les faits, $1 $2 ?", "$1 $2, que dites-vous de ces faits ?", "$1 $2, ces faits, vous les reconnaissez ?"], { qui: "pres", par: { presse: ["$1 $2, oui ou non, vous reconnaissez ?"], curieux: ["$1 $2, racontez-nous : que s'est-il passé, selon vous ?"] } });
  V("aud_barre", "(Madame|Monsieur) ([\\p{Lu}][\\p{L}'’ -]*?), avancez à la barre\\.", ["$1 $2, avancez à la barre.", "$1 $2, approchez, s'il vous plaît.", "$1 $2, venez à la barre.", "$1 $2 ? Levez-vous et avancez."]);
  V("aud_delai", "Vous pouvez être (jugée?) aujourd'hui, ou demander un délai pour préparer votre défense", ["Vous pouvez être $1 aujourd'hui, ou demander un délai pour préparer votre défense", "Vous avez le choix : être $1 aujourd'hui, ou obtenir un délai pour préparer votre défense", "Le tribunal peut vous juger aujourd'hui si vous l'acceptez ; vous pouvez aussi demander un délai pour préparer votre défense"]);
  V("aud_accepte", "(Mon client|Ma cliente) accepte d'être (jugée?) aujourd'hui\\.", ["$1 accepte d'être $2 aujourd'hui.", "$1 souhaite être $2 aujourd'hui.", "$1 préfère être $2 aujourd'hui, sans attendre."]);
  V("aud_retenons", "Nous la retenons au fond\\.", ["Nous la retenons au fond.", "Le tribunal retient l'affaire.", "L'affaire est retenue."]);
  V("aud_casier", "Votre casier est vierge\\.", ["Votre casier est vierge.", "Aucune mention à votre casier.", "Le bulletin n° 1 ne porte aucune condamnation."]);
  V("aud_relaxe", "La relaxe ne résiste pas à la lecture du dossier\\.", ["La relaxe ne résiste pas à la lecture du dossier.", "Le dossier contredit la relaxe, pièce par pièce.", "Il suffit de relire la procédure pour écarter la relaxe."], { qui: "parquet", par: { severe_pq: ["Cette relaxe est une erreur, et le dossier le montre à chaque page."] } });
  V("aud_cpsemble", "Je vous demande d'ordonner la confusion des peines\\.", ["Je vous demande d'ordonner la confusion des peines.", "La confusion des peines s'impose ; je vous la demande.", "Ordonnez la confusion : ces peines sanctionnent des faits en concours."]);
  // --- appel, CRPC, renvoi (audiences moins fréquentes, mêmes formules d'une affaire à l'autre)
  V("app_renvoi", "L'affaire a été renvoyée à la demande du prévenu\\.", ["L'affaire a été renvoyée à la demande du prévenu.", "Le prévenu avait demandé un délai : l'affaire revient aujourd'hui.", "Renvoyée à la demande de la défense, l'affaire est appelée ce jour."]);
  V("app_relaxe", "Le tribunal a relaxé le prévenu\\.", ["Le tribunal a relaxé le prévenu.", "En première instance, le prévenu a été relaxé.", "Le jugement frappé d'appel a prononcé la relaxe."]);
  V("app_infirmer", "Je demande à la cour d'infirmer et d'entrer en voie de condamnation\\.", ["Je demande à la cour d'infirmer et d'entrer en voie de condamnation.", "La cour infirmera et déclarera le prévenu coupable.", "Je requiers l'infirmation du jugement et la condamnation."]);
  V("app_rien", "Rien n'a changé, sinon que la peine est en cours d'exécution\\.", ["Rien n'a changé, sinon que la peine est en cours d'exécution.", "Depuis le jugement, rien de nouveau, sinon que la peine s'exécute.", "La situation est la même ; la peine est simplement en cours d'exécution."]);
  V("app_aggraver", "La cour pourrait aggraver ; je lui demande de ne pas le faire sans raison nouvelle : le parquet n'en apporte aucune\\.", ["La cour pourrait aggraver ; je lui demande de ne pas le faire sans raison nouvelle : le parquet n'en apporte aucune.", "L'appel du parquet permet d'aggraver, mais encore faut-il une raison : il n'en donne aucune.", "Rien dans ce dossier ne justifie une peine plus lourde qu'en première instance."]);
  V("app_statue", "Le tribunal a statué en connaissance de cause : il a vu le prévenu, sa situation, ses garanties\\.", ["Le tribunal a statué en connaissance de cause : il a vu le prévenu, sa situation, ses garanties.", "Les premiers juges ont tout pesé : la personne, sa situation, ses garanties.", "Le jugement est mesuré : il tient compte de la personne et de ses garanties."]);
  V("app_affaire", "Affaire " + N + ", sur l'appel du ministère public\\.", ["Affaire $1, sur l'appel du ministère public.", "Nous appelons l'affaire $1 : appel du parquet.", "Dossier $1, appel du ministère public."]);
  V("crpc_assiste", "Votre avocat vous a assisté\\.", ["Votre avocat vous a assisté.", "Vous avez été conseillé par votre avocat.", "Votre avocat était présent à vos côtés."]);
  V("crpc_homologue", "La reconnaissance est sincère, la peine justifiée au regard des circonstances : j'homologue la proposition", ["La reconnaissance est sincère, la peine justifiée au regard des circonstances : j'homologue la proposition", "Les faits sont reconnus sans réserve et la peine est adaptée : j'homologue la proposition", "Je constate une reconnaissance libre et une peine justifiée : la proposition est homologuée"]);
  V("crpc_accepte", "vous reconnaissez les faits et vous acceptez la peine proposée par le procureur", ["vous reconnaissez les faits et vous acceptez la peine proposée par le procureur", "vous confirmez reconnaître les faits et accepter la peine que propose le procureur", "les faits, vous les reconnaissez, et la peine proposée par le procureur, vous l'acceptez"]);
  V("aud_delai_cl", "(Mon client|Ma cliente) demande un délai pour préparer sa défense", ["$1 demande un délai pour préparer sa défense", "$1 sollicite un délai pour préparer sa défense", "$1 a besoin de temps : nous demandons un délai pour préparer sa défense"]);
  V("gav_rienaj", "Je n'ai rien à ajouter\\.", ["Je n'ai rien à ajouter.", "Non, rien.", "C'est tout."]);
  // --- lot 4 : plus de versions pour les répliques du chemin le plus fréquent (6 à 8 chacune)
  V("arg_amen", "Une peine aménageable \\(art\\.", ["Une peine aménageable (art.", "L'aménagement de la peine (art.", "Une peine exécutée hors les murs (art.", "Pas de prison sans aménagement (art."]);
  const PLUS = {
    perm_ici: ["Allô, maître ? Permanence pénale.", "Maître, c'est la permanence de l'Ordre, j'ai une garde à vue pour vous.", "Ici la permanence du barreau, maître. Vous êtes disponible ?"],
    perm_vous: ["Vous pouvez y aller ?", "Je compte sur vous ?", "Vous êtes partant ?"],
    perm_bonne: ["Je vous envoie l'adresse par message. Bon courage.", "Merci, maître. L'officier vous attend.", "Parfait. Bonne chance, maître."],
    gav_comm: ["$2. Le commissariat central du $1 ; on vous fait patienter sur un banc en plastique.", "Commissariat central du $1 arrondissement. Il est $2, la salle d'attente est pleine.", "$2. Au guichet du commissariat du $1, on vous demande votre carte professionnelle."],
    gav_silence: ["Je n'ai rien à dire.", "Pas de commentaire.", "Je préfère ne pas répondre à ça."],
    gav_ajouter: ["Un dernier mot pour la procédure ?", "Vous souhaitez préciser quelque chose ?", "Rien d'autre ?"],
    aud_leve: ["(L'huissier ouvre la porte du délibéré ; la salle se lève dans un bruit de chaises.)", "(Les juges entrent. Une avocate range précipitamment ses notes au premier rang.)", "(La salle se met debout. Le tribunal prend place sous l'horloge.)"],
    aud_droit: ["Avant tout : vous pouvez faire des déclarations, répondre aux questions, ou garder le silence.", "Je dois vous le rappeler : pendant ces débats, vous pouvez parler, répondre ou vous taire.", "Vous êtes libre de répondre, de faire une déclaration ou de vous taire, à tout moment des débats."],
    aud_pdef: ["Maître, c'est à vous.", "La défense a la parole.", "Maître, nous vous écoutons."],
    aud_verse: ["Le tribunal les examinera.", "Très bien, c'est versé.", "Bien. Nous en tiendrons compte."],
    aud_garanties: ["Maître, que pouvez-vous nous dire de sa situation ?", "Des pièces sur la personnalité, maître ?", "Maître, son domicile, son travail ?"],
    aud_reconnait: ["$1 $2, vous contestez ou vous reconnaissez ?", "$1 $2, quelle est votre position sur ces faits ?", "$1 $2, vous avez entendu les faits : qu'en dites-vous ?"],
    aud_barre: ["$1 $2, à la barre, je vous prie.", "$1 $2 ? Approchez.", "$1 $2, avancez jusqu'au micro."],
    aud_rien: ["Non, c'est tout.", "Je n'ai plus rien à dire.", "Je m'arrête là."],
    aud_regrets: ["Je regrette. Je ferai autrement.", "Je regrette, vraiment. J'ai compris la leçon."],
    aud_pasca: ["Ils mentent.", "C'est pas ce qui s'est passé.", "Tout ça, c'est faux."],
    aud_cj: ["Un contrôle judiciaire, avec obligation de pointer.", "Je requiers un contrôle judiciaire et une interdiction de paraître sur les lieux.", "Le contrôle judiciaire me paraît suffisant."],
    aud_delai: ["Vous pouvez demander un délai pour préparer votre défense, ou être $1 aujourd'hui", "La loi vous laisse le choix : être $1 aujourd'hui, ou demander un délai pour préparer votre défense", "Deux options : être $1 aujourd'hui, ou demander un délai pour préparer votre défense"],
    pv_avisproc: ["Procureur de la République avisé à $1.", "Avis téléphonique au parquet à $1.", "Informons le magistrat de permanence du parquet à $1."],
    pv_document: ["Lui remettons en mains propres le document énonçant ses droits", "Remise lui est faite du document énonçant ses droits"],
    pv_dont: ["Lecture faite, signe avec nous.", "Dont procès-verbal, signé après lecture par la personne et par nous.", "Clos le présent, que la personne signe avec nous après lecture."],
    pv_persiste: ["Lecture faite, persiste et signe avec nous.", "Après relecture, persiste et signe.", "Lu, persiste et signe."],
    dep_quoi: ["Qu'est-ce qui va m'arriver ?", "Ça se passe comment, maintenant ?", "Je vais passer devant un juge, c'est ça ?"],
    dep_explique: ["Vous avez le choix : être $1 aujourd'hui, ou demander un délai.", "Soit vous êtes $1 aujourd'hui, soit on demande un délai.", "On peut accepter d'être $1 maintenant, ou demander du temps."],
    dep_raconte: ["Reprenez depuis le début.", "Racontez-moi votre version.", "Que s'est-il passé, exactement ?"],
    esr_avis: ["Avis : une mesure alternative à la détention est envisageable, sous réserve d'un justificatif d'hébergement.", "Rien ne s'oppose à une alternative à la détention, si l'hébergement est confirmé par écrit."],
  };
  for (const [id, plus] of Object.entries(PLUS)) { const e = E.find((x) => x.id === id); if (e) e.vs = e.vs.concat(plus); }
  // Composition (lot 4) : pour les répliques qu'on lit à chaque affaire, des fragments combinés donnent des dizaines de versions,
  // assez pour qu'une carrière ne relise pas deux fois la même avant longtemps (la mémoire s.phVus choisit les inédites)
  const X = (...parts) => parts.reduce((acc, p) => acc.flatMap((a) => p.map((b) => (a + " " + b).trim())), [""]);
  const COMPOSE = {
    aud_leve: X(["(Le tribunal entre.", "(Les juges entrent par la petite porte.", "(L'huissier annonce le tribunal.", "(Trois magistrats s'installent."], ["La salle se lève, puis se rassoit.", "Quelques chaises raclent le sol.", "Un prévenu en survêtement se lève le dernier.", "Au fond, quelqu'un éteint son téléphone."], ["La greffière ouvre le rôle.)", "Le président chausse ses lunettes.)", "Une pile de dossiers attend sur le bureau.)"]),
    gav_comm: X(["$2.", "Il est $2."], ["Commissariat central du $1 arrondissement.", "Commissariat du $1.", "Hall du commissariat central du $1."], ["On vous fait patienter sur un banc.", "Un planton vous fait signer le registre des avocats.", "Une odeur de café froid flotte dans le couloir.", "Un téléphone sonne sans que personne ne décroche.", "Quelqu'un crie dans les cellules du fond."]),
    perm_ici: X(["Maître,", "Bonjour maître,", "Allô, maître ?"], ["ici la permanence pénale de l'Ordre.", "la permanence pénale du barreau.", "c'est la permanence de l'Ordre des avocats."], ["", "Une garde à vue pour vous.", "J'ai un dossier pour vous."]),
    aud_pdef: X(["Maître,", "La défense,", "Bien. Maître,"], ["vous avez la parole.", "nous vous écoutons.", "c'est à vous."], ["", "Le tribunal vous écoute.", "Allez-y."]),
    gav_tend: X(["L'officier vous tend la procédure :", "L'officier pose le dossier devant vous :", "On vous ouvre le bureau d'entretien. L'officier :"], ["« Trente minutes, maître.", "« Vous avez trente minutes, maître.", "« Trente minutes, pas une de plus, maître."]),
    aud_verse: X(["Je les verse au dossier.", "C'est noté.", "Le tribunal en prend connaissance."], ["", "Merci, maître.", "Poursuivons."]),
    pv_avisproc: X(["Avis au procureur de la République", "Avisons le procureur de la République", "Le magistrat de permanence du parquet est avisé"], ["à $1.", "à $1, par téléphone.", "à $1, par courriel."]),
    pv_avisavocat: X(["Avis à la permanence des avocats", "Avisons la permanence de l'Ordre des avocats", "La permanence du barreau est avisée"], ["à $1.", "à $1, par téléphone.", "à $1, par la plateforme du barreau."]),
  };
  for (const [id, vs] of Object.entries(COMPOSE)) { const e = E.find((x) => x.id === id); if (e) e.vs = [e.vs[0]].concat(vs.filter((v) => v !== e.vs[0])); }
  PH.ENTREES = E;

  // Profils : président, parquet, officier de l'affaire
  const profilDe = (id) => { const a = id && CR.acteur ? CR.acteur(id) : null; return a ? a.profil : null; };
  PH.ctx = function (def, p) {
    const t = p.t || {};
    const A = def.actors || {};
    return { key: t.sig || p.seed || p.id, pres: profilDe(A.president || t.pres), parquet: profilDe(A.parquet || t.parquet), opj: profilDe(A.opj || t.opj) };
  };
  const sub = (x, m) => x.replace(/\$(\d)/g, (_, i) => (m[+i] != null ? m[+i] : ""));
  PH.dire = function (str, C) {
    if (typeof str !== "string" || str.length < 8) return str;
    let out = str;
    for (const e of E) {
      e.re.lastIndex = 0;
      if (!e.re.test(out)) continue;
      e.re.lastIndex = 0;
      out = out.replace(e.re, (...m) => {
        let vs = e.vs;
        const prof = e.pr && C[e.pr.qui];
        if (prof && e.pr.par[prof]) vs = e.pr.par[prof].concat(vs.slice(1));
        return sub(vs[PH.indice(C, e.id, vs.length)], m);
      });
    }
    return out;
  };
  // Lot 4 : la version dépend de la seule affaire (signature), jamais de ce que le joueur a déjà lu : un code d'affaire et une
  // sauvegarde doivent se relire mot pour mot. Une mémoire des versions lues a été essayée : gain mesuré faible (déjà-vu sur
  // cinq affaires de 30 % à 26 %), au prix de cette garantie ; les compositions (COMPOSE) donnent la variété à la place.
  PH.indice = (C, id, n) => h(C.key + ":" + id) % n;
  const NE_PAS_ENVELOPPER = ["do", "if", "pertinent", "run", "quand", "limite", "need", "when", "mixte"];
  // Parcourt une structure (étapes d'audience, appels, pièces) et réécrit ses textes ; les fonctions restent intactes
  PH.walk = function (o, C, d = 0) {
    if (d > 16 || o == null) return o;
    if (typeof o === "string") return PH.dire(o, C);
    if (Array.isArray(o)) return o.map((x) => PH.walk(x, C, d + 1));
    if (typeof o !== "object" || (Object.getPrototypeOf(o) !== Object.prototype && Object.getPrototypeOf(o) !== null)) return o;
    if (o.flag || o.paire) return o; // un passage qui porte une anomalie reste tel quel
    if (o.plaidoirie && C.plaid && CR.PLAID && CR.PLAID.varier && ["defense", "pc"].includes(o.plaidoirie.role)) o = Object.assign({}, o, { plaidoirie: CR.PLAID.varier(C.plaid, o.plaidoirie) });
    const r = {};
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "function") r[k] = NE_PAS_ENVELOPPER.includes(k) ? v : function (...x) { return PH.walk(v.apply(this, x), C); };
      else if (["cards", "accept", "need", "fx", "play", "f", "id", "key", "doc", "who", "kind", "flag", "paire", "textes"].includes(k)) r[k] = v;
      else r[k] = PH.walk(v, C, d + 1);
    }
    // garder les propriétés non énumérables (rare) : rien à faire, elles ne sont pas des textes
    return r;
  };
  const enveloppe = (fn, C, apres) => function (...a) { let r = fn.apply(this, a); r = PH.walk(r, C); return apres ? apres(r, a) : r; };

  // =================================================================== 2. Le tempérament du client
  PH.TEMPERAMENTS = {
    mutique: { label: "mutique", cout: 1, tics: ["(Un long silence.)", "(Un haussement d'épaules.)", "(Il faut attendre la réponse.)", "(Les yeux baissés.)", "(Un temps.)"], ou: "avant" },
    bavard: { label: "bavard", cout: 1, tics: ["Pardon, je parle trop.", "Je vous raconte tout, comme ça vous savez.", "Enfin, bref. Je m'égare.", "Attendez, je reprends depuis le début.", "Je ne sais pas si c'est important, mais je vous le dis quand même."], ou: "apres" },
    agressif: { label: "sur la défensive", cout: 0, tics: ["Vous êtes avec moi ou avec eux ?", "Pourquoi vous me demandez ça ?", "Je l'ai déjà dit cent fois.", "Ça sert à quoi, tout ça ?", "Vous me croyez, au moins ?"], ou: "apres" },
    angoisse: { label: "angoissé", cout: 0, tics: ["Pardon, je… je n'arrive pas à réfléchir.", "Je vais aller en prison ?", "Excusez-moi, j'ai les mains qui tremblent.", "Je ne dors plus depuis.", "Dites-moi que ça va s'arranger."], ou: "apres" },
    pose: { label: "posé", cout: 0, tics: [], ou: "apres" },
  };
  PH.temperament = (C) => ["mutique", "bavard", "agressif", "angoisse", "pose", "pose"][h(C.key + ":temperament") % 6];
  const CLIENT_CALLS = ["intake", "depot", "parloir", "rdv", "prep", "entretien"];
  PH.colorer = function (call, C, key, def) {
    const T = PH.TEMPERAMENTS[C.temp];
    if (!call || !call.topics || !T || !T.tics.length) return call;
    if (/Permanence/.test(call.label || "") || (key === "intake" && def.famille && call.who)) return call;
    const topics = call.topics.map((tp, i) => {
      if (!tp || !Array.isArray(tp.a) || !tp.a.length || h(C.key + key + ":" + (tp.id || i)) % 5 > 1) return tp;
      const tic = T.tics[h(C.key + key + "tic" + (tp.id || i)) % T.tics.length];
      const a = T.ou === "avant" ? [tic].concat(tp.a) : tp.a.concat([tic]);
      return Object.assign({}, tp, { a, cost: (tp.cost || 0) + T.cout });
    });
    return Object.assign({}, call, { topics });
  };

  // =================================================================== 3. Les audiences à rebondissements
  // Chaque incident : quand (t, def) ; des étapes, dont un choix pour l'avocat ; la règle en jeu va au débrief.
  const nom = (P) => (P ? `${P.g === "f" ? "Madame" : "Monsieur"} ${P.nom}` : "");
  PH.INCIDENTS = [
    { id: "piece_barre", when: () => true, regle: "Toute pièce doit être soumise au débat contradictoire : le juge ne peut fonder sa décision que sur des preuves discutées devant lui (art. 427 CPP). Une pièce versée à la barre justifie de demander à en prendre connaissance, voire un renvoi.",
      steps: () => [
        { who: "parquet", t: "Avant mes réquisitions, je verse aux débats un rapport complémentaire, arrivé ce matin au parquet." },
        { choose: [
          { t: "« Je n'ai pas eu cette pièce. Je demande une suspension pour en prendre connaissance. »", reply: "Dix minutes, maître. L'audience est suspendue.", signal: "bon", fx: { cred: 1, flags: { incidentBon: true } } },
          { t: "(Ne rien dire et poursuivre.)", reply: "Le tribunal joint la pièce au dossier.", signal: "mauvais", fx: { cred: -1, flags: { incidentRate: true } } },
        ] },
      ] },
    { id: "client_emporte", when: () => true, regle: "Le prévenu a la parole en dernier (art. 460 CPP) ; avant, ses interruptions coûtent à la défense. Le président a la police de l'audience (art. 401 CPP).",
      steps: (t) => [
        { who: "client", t: t.V && !t.V.agent ? `C'est faux ! Tout ce qu'${t.V.g === "f" ? "elle" : "il"} dit est faux !` : "C'est faux ! Ils mentent, tous !" },
        { who: "president", t: `${t.A && t.A.g === "f" ? "Madame" : "Monsieur"}, vous aurez la parole en dernier. Maître, je vous en prie.` },
        { choose: [
          { t: "(Poser la main sur le bras de votre client et lui parler à voix basse.)", reply: "Bien. Poursuivons.", signal: "bon", fx: { cred: 1, flags: { incidentBon: true } } },
          { t: "« Mon client est à bout, monsieur le président : il dit ce qu'il a sur le cœur. »", reply: "La parole lui sera donnée en dernier, maître. Pas maintenant.", signal: "mauvais", fx: { cred: -2, flags: { incidentRate: true } } },
        ] },
      ] },
    { id: "temoin_salle", when: (t) => !!t.T, regle: "Devant le tribunal correctionnel, une personne présente à l'ouverture des débats sans avoir été citée peut témoigner avec l'autorisation du tribunal, si une partie le propose (art. 444 du code de procédure pénale) : la demander est la seule façon de faire entrer ce témoignage dans les débats. Aux assises, le président use de son pouvoir discrétionnaire (art. 310).",
      steps: (t) => [
        { who: "sys", t: `(Au fond de la salle, ${nom(t.T)} se lève : « J'étais là ce jour-là ! »)` },
        { who: "president", t: "Asseyez-vous, s'il vous plaît. On ne parle pas depuis le public." },
        { choose: [
          { t: "« Je demande que ce témoin soit entendu. »", reply: "Le tribunal l'autorise. Approchez à la barre, nous vous entendrons brièvement.", signal: "bon", fx: { cred: 1, flags: { incidentBon: true } } },
          { t: "(Laisser passer.)", reply: "Poursuivons.", fx: { flags: { incidentRate: true } } },
        ] },
      ] },
    { id: "tardive", when: () => true, regle: "Une audience qui s'étire tard n'est pas irrégulière, mais la défense peut demander un renvoi si elle ne peut plus s'exercer sereinement ; un tribunal fatigué abrège. Le plus souvent, mieux vaut un argument fort, dit vite.",
      steps: () => [
        { who: "sys", t: "(Il est tard. La greffière bâille ; le président regarde l'horloge.)" },
        { who: "president", t: "Maître, nous avons encore six dossiers. Je compte sur votre concision." },
        { choose: [
          { t: "« Je serai bref, monsieur le président. »", reply: "Merci, maître.", signal: "bon", fx: { cred: 1, flags: { incidentBon: true } } },
          { t: "« La défense a besoin du temps qu'il faut. »", reply: "Nous verrons, maître.", signal: "mauvais", fx: { cred: -1, flags: { incidentRate: true } } },
        ] },
      ] },
    { id: "interprete", when: (t) => !!(t.A && t.A.etranger), regle: "La personne qui ne comprend pas le français a droit à un interprète à l'audience (art. 407 CPP) ; juger sans lui est une cause de nullité.",
      steps: () => [
        { who: "greffier", t: "Monsieur le président, l'interprète n'est pas encore arrivé." },
        { choose: [
          { t: "« Mon client a droit à son interprète : je demande d'attendre son arrivée. »", reply: "Le tribunal suspend jusqu'à son arrivée.", signal: "bon", fx: { cred: 1, flags: { incidentBon: true } } },
          { t: "« Nous pouvons commencer, je traduirai l'essentiel. »", reply: "Non, maître : la loi impose un interprète.", signal: "mauvais", fx: { cred: -2, flags: { incidentRate: true } } },
        ] },
      ] },
    { id: "victime_pleure", when: (t) => !!(t.V && !t.V.agent && !t.V.morale), regle: "La partie civile peut être présente sans parler ; son émotion pèse sur la salle, pas sur la qualification. Y répondre sur le terrain du droit, sans attaquer la victime, préserve la crédibilité.",
      steps: (t) => [
        { who: "sys", t: `(${nom(t.V)} éclate en sanglots au premier rang. La salle se tait.)` },
        { choose: [
          { t: "(Attendre en silence, puis reprendre calmement.)", reply: "Prenez votre temps. Nous reprenons.", signal: "bon", fx: { cred: 1, flags: { incidentBon: true } } },
          { t: "« Je rappelle au tribunal que l'émotion n'est pas une preuve. »", reply: "Le tribunal le sait, maître.", signal: "mauvais", fx: { cred: -1, flags: { incidentRate: true } } },
        ] },
      ] },
  ];
  PH.incidentDe = function (C, t, cle) {
    if (h(C.key + ":incident:" + cle) % 10 < 4) return null; // six audiences sur dix
    const pool = PH.INCIDENTS.filter((i) => { try { return i.when(t); } catch (e) { return false; } });
    return pool.length ? pool[h(C.key + ":incidentChoix:" + cle) % pool.length] : null;
  };
  // Insère l'incident juste avant les réquisitions (première occurrence dans l'arbre des étapes)
  // Lot 4 : l'incident ne tombe plus toujours au même moment
  PH.MOMENTS = ["requisitions", "requisitions", "limine", "plaidoirie", "dernierMot"];
  // Les rituels d'ouverture déjà vus trois fois se résument en une ligne (le droit de se taire reste rappelé)
  PH.RITUEL_SEUIL = 3;
  PH.abreger = function (steps, api, cle) {
    const s = api && api.s, cs = api && api.cs;
    if (!s || s.mode !== "carriere" || !cs || (s.settings && s.settings.rituels === "complets")) return steps;
    s.rituVus = s.rituVus || [];
    const id = cs.id + ":" + cle;
    // Le rang de l'audience est fixé la première fois qu'elle est construite : une audience relue (sauvegarde rechargée,
    // dossier rouvert) garde le rituel qu'elle avait, quoi qu'on ait vu depuis. s.rituBase compte les rangs oubliés.
    let rang = s.rituVus.indexOf(id);
    if (rang < 0) { s.rituVus.push(id); rang = s.rituVus.length - 1; }
    const deja = (s.rituBase || 0) + rang;
    if (s.rituVus.length > 60) { const trop = s.rituVus.length - 60; s.rituVus.splice(0, trop); s.rituBase = (s.rituBase || 0) + trop; }
    if (deja < PH.RITUEL_SEUIL) return steps;
    let fait = false;
    const rituel = (st) => st && typeof st === "object" && typeof st.t === "string" && ((st.who === "huissier" && /^Le tribunal !$/.test(st.t)) || (st.who === "sys" && /^\(Tout le monde se lève/.test(st.t)));
    const silence = (st) => st && typeof st === "object" && st.who === "president" && typeof st.t === "string" && /^Vous avez le droit, au cours des débats/.test(st.t);
    const rec = (arr, d) => {
      if (!Array.isArray(arr) || d > 8) return arr;
      const out = [];
      for (const st of arr) {
        if (rituel(st)) { if (!fait) { out.push({ who: "sys", t: ["(Le tribunal entre ; l'affaire est appelée.)", "(La salle se lève, le tribunal s'assoit, l'affaire est appelée.)", "(Rituel habituel : entrée du tribunal, appel de l'affaire.)", "(L'audience reprend ; votre affaire est appelée.)"][h(id + ":ritu") % 4] }); fait = true; } continue; }
        if (silence(st)) { out.push({ who: "sys", t: ["(Le président notifie le droit de se taire, de répondre ou de faire des déclarations.)", "(Le droit de se taire est rappelé, comme toujours.)", "(Notification du droit de se taire.)"][h(id + ":silence") % 3] }); continue; }
        if (st && typeof st === "object" && !Array.isArray(st)) {
          const c = Object.assign({}, st);
          for (const k of ["then", "else"]) if (Array.isArray(c[k])) c[k] = rec(c[k], d + 1);
          if (Array.isArray(c.choose)) c.choose = c.choose.map((o) => (o && Array.isArray(o.then) ? Object.assign({}, o, { then: rec(o.then, d + 1) }) : o));
          out.push(c);
        } else out.push(st);
      }
      return out;
    };
    return rec(steps, 0);
  };
  PH.inserer = function (steps, inc, t, cle, moment) {
    if (moment && moment !== "requisitions") { const r0 = PH.insererA(steps, inc, t, moment); if (r0 !== steps) return r0; }
    return PH.insererA(steps, inc, t, "requisitions");
  };
  PH.insererA = function (steps, inc, t, ancre) {
    let fait = false;
    const marque = { do: (api) => { api.cs.vars.incidents = Array.from(new Set((api.cs.vars.incidents || []).concat([inc.id]))); } };
    const rec = (arr, d) => {
      if (!Array.isArray(arr) || d > 8) return arr;
      const out = [];
      for (const st of arr) {
        if (!fait && st && typeof st === "object" && st[ancre] != null) { out.push(marque, ...inc.steps(t)); fait = true; }
        if (st && typeof st === "object" && !Array.isArray(st)) {
          const c = Object.assign({}, st);
          for (const k of ["then", "else"]) if (Array.isArray(c[k])) c[k] = rec(c[k], d + 1);
          if (Array.isArray(c.choose)) c.choose = c.choose.map((o) => (o && Array.isArray(o.then) ? Object.assign({}, o, { then: rec(o.then, d + 1) }) : o));
          out.push(c);
        } else out.push(st);
      }
      return out;
    };
    const r = rec(steps, 0);
    return fait ? r : steps;
  };

  // =================================================================== Installation
  PH.habiller = function (def, p) {
    if (!def || !def.generated || !p || !p.t) return def;
    const C = PH.ctx(def, p);
    const t = p.t;
    C.temp = t.genre === "info" ? null : PH.temperament(C);
    def.temperament = C.temp;
    if (CR.PLAID && CR.PLAID.ctxDe && t.genre !== "info") C.plaid = CR.PLAID.ctxDe(t, C.key);
    if (def.calls) {
      const calls = {};
      for (const [k, v] of Object.entries(def.calls)) {
        const col = (x) => (CLIENT_CALLS.includes(k) && C.temp ? PH.colorer(x, C, k, def) : x);
        calls[k] = typeof v === "function" ? enveloppe(v, C, (r) => col(r)) : col(PH.walk(v, C));
      }
      def.calls = calls;
    }
    if (typeof def.gav === "function") def.gav = enveloppe(def.gav, C, (g) => (g && g.entretien && C.temp ? Object.assign({}, g, { entretien: PH.colorer(g.entretien, C, "entretien", def) }) : g));
    if (def.docs) for (const [k, v] of Object.entries(def.docs)) def.docs[k] = typeof v === "function" ? enveloppe(v, C) : PH.walk(v, C);
    if (def.audiences) for (const [k, v] of Object.entries(def.audiences)) {
      if (typeof v !== "function") continue;
      def.audiences[k] = function (...a) {
        let r = v.apply(this, a);
        if (r && Array.isArray(r.steps)) r = Object.assign({}, r, { steps: PH.abreger(r.steps, a[0], k) });
        r = PH.walk(r, C);
        if (!r || !Array.isArray(r.steps) || t.genre === "info") return r;
        const inc = PH.incidentDe(C, t, k);
        return inc ? Object.assign({}, r, { steps: PH.inserer(r.steps, inc, t, k, PH.MOMENTS[h(C.key + ":moment:" + k) % PH.MOMENTS.length]) }) : r;
      };
    }
    return def;
  };
  PH.debrief = function (s, cs) {
    const ids = (cs.vars && cs.vars.incidents) || [];
    return ids.map((id) => PH.INCIDENTS.find((i) => i.id === id)).filter(Boolean).map((i) => ({ kind: "rule", text: `Incident d'audience : ${i.regle}` }));
  };
  const def0 = GEN2.def;
  GEN2.def = function (p) { return PH.habiller(def0.call(this, p), p); };
})();
