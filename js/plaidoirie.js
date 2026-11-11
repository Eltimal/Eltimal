/* La Permanence — chantier anti-répétition, lot 1, n° 1 : la plaidoirie construite à partir du dossier.
   Pour les affaires générées (défense et partie civile, sur le fond) :
   - un argument n'apparaît que si le joueur tient en main ce qui l'appuie (fait relevé, pièce notée, texte lu) ; il n'est plus
     affiché grisé, ce qui trahissait les doutes du dossier ;
   - les arguments de personnalité et de doute parlent du client (métier, adresse, âge, témoin) et changent de forme d'une affaire
     à l'autre (variantes choisies par la signature de l'affaire : la même affaire se relit à l'identique) ;
   - deux arguments piégés, tirés d'un catalogue d'erreurs de droit tentantes, se glissent dans la liste ; les plaider coûte en
     crédibilité, le président ou le parquet répond par la règle, et le débrief l'explique (ou félicite de les avoir évités).
   Le tirage de l'affaire (p.t) n'est pas touché : les codes d'affaire se rejouent à l'identique.
   Droit : chaque règle citée est à revérifier sur Légifrance. */
(function () {
  const CR = window.CR;
  const PL = (CR.PLAID = {});
  const h = (k) => CR.hash(String(k));
  const pick = (arr, key) => (arr && arr.length ? arr[h(key) % arr.length] : "");
  const cap = (x) => (x ? x[0].toUpperCase() + x.slice(1) : x);
  const ANCIENS_PIEGES = ["attenuantes", "prison"];
  const melange = (arr, key) => arr.map((a, i) => ({ a, k: h(key + ":" + (a.id || i)) })).sort((x, y) => x.k - y.k).map((x) => x.a);

  // ------------------------------------------------------------------ Contexte : l'affaire générée et ses personnes
  PL.ctx = function (s, cs) {
    const def = CR.caseDef(cs);
    if (!def || !def.generated || !CR.GEN || !CR.GEN.paramsOf) return null;
    const p = CR.GEN.paramsOf(s, cs.id);
    const t = p && p.t;
    if (!t || !t.A || t.genre === "info") return null;
    const PR = CR.GEN2.PR;
    const A = t.A;
    return { s, cs, def, t, A, V: t.V, T: t.T, I: CR.CAT.INF[t.inf] || {}, G: PR.gram(A), GV: PR.gram(t.V), PR, M: CR.MONDE, key: t.sig || p.seed || cs.id };
  };
  const met = (C) => C.PR.metier(C.A) || "";
  const adresse = (C) => (C.A.adresse ? `au ${C.A.adresse}` : "à Paris");
  const enfants = (C) => (C.A.enfants > 1 ? `, avec ses ${C.A.enfants} enfants` : C.A.enfants === 1 ? ", avec son enfant" : "");
  const prenom = (C) => C.A.prenom || C.G.nom;
  const civT = (C) => (C.T ? `${C.PR.civ(C.T)} ${C.T.nom}` : "le témoin");

  // ------------------------------------------------------------------ Variantes des arguments vrais (défense)
  // Chaque entrée rend { label?, say? } : ce qui manque garde le texte d'origine. Les textes restent fidèles à la fiche du client.
  const VAR = {
    emploi(C) {
      if (!C.M.travaille(C.A)) return {};
      const m = met(C), G = C.G, indep = C.M.situ(C.A) === "independant";
      const quoi = indep ? "son activité" : "son emploi";
      return {
        label: pick([`Son emploi de ${m}`, `${G.Il} travaille : ${m}`, indep ? "Son activité, sa clientèle" : "L'attestation de l'employeur"], C.key + "emploi:l"),
        say: pick([
          `${G.Il} est ${m}. Une peine ferme, c'est ${G.le} priver de ${quoi}${C.A.enfants ? ", et ses enfants de leurs ressources" : ""}.`,
          `${cap(m)}, ${G.il} se lève chaque matin pour travailler. La prison ferme lui ferait perdre ${quoi} : c'est tout ce qui ${G.le} tient.`,
          indep ? `${G.Il} est ${m}, à son compte : sans ${G.soi}, l'activité s'arrête. Une peine ferme la condamnerait.` : `L'attestation est au dossier : ${G.il} est ${m}, et son employeur compte sur ${G.soi}. Une peine ferme lui ferait perdre ce poste.`,
          `On vous parle d'un dossier ; je vous parle d'${G.f ? "une" : "un"} ${m} qui travaille. Ne lui retirez pas ${quoi}.`,
        ], C.key + "emploi:s"),
      };
    },
    garanties(C) {
      const G = C.G;
      if (!C.A.heberg) return { say: `${G.Il} n'a pas d'adresse stable aujourd'hui ; ${C.A.proche || "un proche"} pourrait l'accueillir.` };
      return {
        label: pick(["Un hébergement et des attaches", "Une adresse, des proches", `Son domicile, ${C.A.sect && /^p\d/.test(C.A.sect) ? "à Paris" : "en petite couronne"}`], C.key + "gar:l"),
        say: pick([
          `${G.Il} vit ${adresse(C)}${enfants(C)}. Une adresse, des proches : ${G.il} se présentera à chaque convocation.`,
          `Le justificatif de domicile est au dossier : ${adresse(C)}. ${G.Il} n'a aucune raison de fuir, et toutes les raisons de rester.`,
          `${G.Il} a une adresse, ${adresse(C)}, une famille qui l'attend${C.A.enfants ? ", des enfants à élever" : ""}. Ce sont des garanties écrites, pas des promesses.`,
        ], C.key + "gar:s"),
      };
    },
    amenagement(C) {
      return { say: pick([
        "Jusqu'à un an, la peine ferme doit être aménagée si la personnalité le permet.",
        "L'article 132-19 du code pénal fait de l'emprisonnement ferme le dernier recours ; et jusqu'à un an, cette peine s'aménage.",
        `Si vous prononcez du ferme, qu'il soit aménagé : détention à domicile, semi-liberté. ${C.G.Il} a tout ce qu'il faut pour cela.`,
        "Une courte peine ferme exécutée en détention désocialise sans protéger personne : la loi veut qu'elle soit aménagée.",
      ], C.key + "amen:s") };
    },
    casier(C) {
      const G = C.G;
      return {
        label: pick(["Un casier vierge", "Jamais condamné" + G.e, "Une première fois devant le tribunal"], C.key + "cas:l"),
        say: pick([
          "C'est sa première fois devant un tribunal.",
          `${C.A.age} ans, et pas une seule mention au casier.`,
          `Le bulletin n° 1 est vierge : ${G.il} n'avait jamais eu affaire à la justice.`,
          `${cap(prenom(C))} découvre aujourd'hui ce qu'est un tribunal. Ce passage suffira.`,
        ], C.key + "cas:s"),
      };
    },
    doute(C) {
      const G = C.G;
      return { say: pick([
        `La victime ne sait pas ${G.le} reconnaître, l'image ne montre pas son visage : le doute doit lui profiter.`,
        "Personne ne voit son visage : ni la victime, ni la caméra. Une silhouette et une veste sombre ne font pas un coupable.",
        `On vous demande de condamner sur une identification que la victime elle-même n'assure pas. Le doute doit profiter à ${prenom(C)}.`,
      ], C.key + "dou:s") };
    },
    temoin(C) {
      const GT = C.PR.gram(C.T);
      return { say: pick([
        "Le seul témoin neutre ne dit pas ce que dit l'accusation.",
        `${civT(C)}, le seul témoin sans intérêt dans cette affaire, ne confirme pas la version de l'accusation.`,
        `Relisez la déposition de ${civT(C)} : ${GT.il} était là, et ${GT.il} ne décrit pas ce qu'on reproche à ${prenom(C)}.`,
      ], C.key + "tem:s") };
    },
    ld(C) {
      const G = C.G;
      return { say: pick([
        `${G.Il} a été attaqué${G.e} le premier, une bouteille à la main ; ${G.il} a riposté une fois, dans le même temps : c'est la légitime défense de l'article 122-5 du code pénal.`,
        `Une attaque, une riposte, immédiate et unique : l'article 122-5 du code pénal ne punit pas celui qui se défend.`,
        `Qu'auriez-vous fait ? ${G.Il} a été agressé${G.e}, ${G.il} a répondu d'un seul geste, sur le moment : légitime défense, article 122-5 du code pénal.`,
      ], C.key + "ld:s") };
    },
    alibi(C) {
      return { say: pick([
        "La téléphonie le place ailleurs au moment des faits.",
        `Le bornage est formel : à l'heure des faits, le téléphone de ${prenom(C)} déclenchait une antenne à l'autre bout de la ville.`,
        "Les relevés téléphoniques le situent ailleurs. L'accusation ne l'explique pas.",
      ], C.key + "ali:s") };
    },
    notif(C) {
      const G = C.G;
      return { say: pick([
        `La lettre n'a jamais été retirée : ${G.il} ne savait pas que son permis était suspendu.`,
        `Aucune notification régulière au dossier : on ne peut reprocher à ${prenom(C)} d'avoir ignoré une décision qu'on ne lui a jamais remise.`,
        `L'avis de suspension est revenu « pli non réclamé ». ${G.Il} conduisait sans savoir : l'élément moral manque.`,
      ], C.key + "not:s") };
    },
    video(C) {
      return { say: pick([
        "Le constat des images le montre : rien de ce qu'on lui reproche n'est visible.",
        "Les images existent, et elles ne montrent pas le geste. L'accusation voudrait que vous les oubliiez.",
        `Regardez la vidéo : on y voit ${prenom(C)}, oui, mais jamais le geste qu'on lui reproche.`,
      ], C.key + "vid:s") };
    },
  };

  // Construction de l'affaire (lot 2) : les variantes s'appliquent dès la définition ; les anciens pièges fixes en sortent
  PL.ctxDe = function (t, key) {
    if (!t || !t.A) return null;
    const PR = CR.GEN2.PR;
    return { t, A: t.A, V: t.V, T: t.T, I: CR.CAT.INF[t.inf] || {}, G: PR.gram(t.A), GV: PR.gram(t.V), PR, M: CR.MONDE, key: key || t.sig, cs: { proc: {} } };
  };
  PL.varier = function (C, P) {
    if (!C || !P || !Array.isArray(P.args)) return P;
    const args = P.args.filter((a) => a && !ANCIENS_PIEGES.includes(a.id)).map((a) => { if (P.role !== "defense" || !VAR[a.id]) return a; try { return Object.assign({}, a, VAR[a.id](C)); } catch (e) { return a; } });
    return Object.assign({}, P, { args });
  };
  // ------------------------------------------------------------------ Arguments piégés : des erreurs de droit tentantes
  // when(C) : l'argument a l'air plaidable ici ; qui : celui qui répond ; regle : ce que dit le débrief (à revérifier sur Légifrance)
  const inf = (C, l) => l.includes(C.t.inf);
  const fam = (C, l) => l.includes(C.I.fam);
  const doute = (C, d) => (C.t.doutes || []).includes(d);
  const victimePersonne = (C) => !!C.V && !C.V.agent && !C.V.morale;
  PL.PIEGES_DEF = [
    { id: "attenuantes", poids: 0.7, when: () => true,
      labels: ["Les circonstances atténuantes", "Lui accorder les circonstances atténuantes"],
      says: (C) => ["Je vous demande de lui accorder les circonstances atténuantes.", `Accordez à ${prenom(C)} le bénéfice des circonstances atténuantes.`],
      rebut: "Maître, les circonstances atténuantes ont disparu avec le code pénal de 1994. Parlez-moi plutôt de sa personnalité.",
      regle: "Les circonstances atténuantes n'existent plus depuis le nouveau code pénal (1994) : le juge individualise la peine d'après les circonstances et la personnalité (art. 132-1 CP)." },
    { id: "ivresse", when: (C) => fam(C, ["personnes", "autorite"]) || inf(C, ["degradations"]),
      labels: ["L'alcool lui a fait perdre le contrôle", "Un moment d'ivresse"],
      says: (C) => [`Ce soir-là, ${C.G.il} avait bu ; ce n'était pas ${C.G.soi}. L'alcool atténue sa responsabilité.`, `${C.G.Il} était ivre : ${C.G.il} ne savait plus ce qu'${C.G.il} faisait.`],
      rebut: "L'ivresse volontaire n'excuse rien, maître. Pour certaines violences, elle aggrave même.",
      regle: "L'ivresse volontaire n'est pas une cause d'irresponsabilité : l'art. 122-1 CP vise un trouble psychique ou neuropsychique ; l'ivresse manifeste est même une circonstance aggravante de certaines violences (art. 222-12 et 222-13 CP)." },
    { id: "sensation", when: (C) => inf(C, ["alcool", "stups_volant"]) && !(C.t.f && C.t.f.refus),
      labels: (C) => [`${C.G.Il} se sentait en état de conduire`, "Une conduite parfaitement maîtrisée"],
      says: (C) => [`${C.G.Il} se sentait parfaitement en état de conduire, et ${C.G.il} conduisait prudemment.`, "Aucun écart de conduite, aucune hésitation : sa conduite était maîtrisée."],
      rebut: "Le délit tient au taux ou à la présence du produit, maître, pas à la manière de conduire.",
      regle: "La conduite sous l'empire d'un état alcoolique (art. L. 234-1 C. route) ou après usage de stupéfiants (art. L. 235-1) est constituée par le taux ou l'analyse, quelle que soit la qualité de la conduite." },
    { id: "refus", when: (C) => inf(C, ["alcool"]) && C.t.f && C.t.f.refus,
      labels: ["Sans mesure, rien n'est prouvé", "Aucun taux au dossier"],
      says: () => ["Aucun éthylomètre, aucune prise de sang : on ne peut rien prouver.", "Le dossier ne contient aucun taux : l'infraction n'est pas établie."],
      rebut: "Votre client a refusé les vérifications, maître : c'est un délit en soi.",
      regle: "Refuser les vérifications de l'état alcoolique est un délit, puni des mêmes peines que la conduite sous l'empire d'un état alcoolique (art. L. 234-8 C. route)." },
    { id: "sans_danger", when: (C) => inf(C, ["alcool", "stups_volant", "defaut_permis"]),
      labels: ["Aucun accident, aucun danger", "Personne n'a été mis en danger"],
      says: () => ["Il n'y a eu ni accident, ni victime, ni même un écart : où est le danger ?", "Personne n'a été mis en danger. Le tribunal jugera un risque qui ne s'est pas réalisé."],
      rebut: "Le délit n'exige aucun accident, maître.",
      regle: "Ces délits sont constitués par la seule conduite dans l'état ou la situation interdits ; l'absence d'accident ou de danger concret ne les fait pas disparaître, elle compte seulement pour la peine." },
    { id: "retrait", when: (C) => victimePersonne(C) && fam(C, ["personnes", "biens"]),
      labels: ["La victime ne veut plus de poursuites", "La plainte a été retirée"],
      says: (C) => [`${cap(C.PR.civ(C.V))} ${C.V.nom} ne souhaite plus poursuivre : il n'y a plus lieu de juger.`, "La victime a retiré sa plainte. Le procès n'a plus d'objet."],
      rebut: "Le retrait de la plainte n'arrête pas l'action publique, maître. Le parquet poursuit au nom de la société.",
      regle: "Sauf quand la loi fait de la plainte une condition des poursuites, son retrait n'éteint pas l'action publique (art. 6 CPP) : il peut seulement peser sur la peine et sur l'action civile." },
    { id: "restitution", when: (C) => inf(C, ["vol", "escroquerie", "abus_confiance", "recel", "extorsion", "cambriolage"]),
      labels: ["Tout a été rendu : plus d'infraction", "Le préjudice est réparé, l'infraction aussi"],
      says: (C) => [`${C.G.Il} a tout rendu. Il n'y a plus de préjudice, donc plus d'infraction.`, "Le remboursement est intégral : la poursuite n'a plus de raison d'être."],
      rebut: "La restitution compte pour la peine, maître, pas pour la culpabilité.",
      regle: "L'infraction est consommée au moment des faits ; restituer ou rembourser ensuite ne l'efface pas : cela joue sur la peine et sur les dommages-intérêts." },
    { id: "tentative", when: (C) => inf(C, ["vol"]),
      labels: ["Une simple tentative", "L'objet n'a jamais quitté les lieux"],
      says: (C) => [`${C.G.Il} n'est pas allé${C.G.e} bien loin, l'objet a été récupéré : au pire, une tentative.`, "L'objet a été repris aussitôt : le vol n'a jamais été consommé."],
      rebut: "La soustraction est consommée dès l'appréhension, maître, même brève.",
      regle: "Le vol est consommé dès que la chose est appréhendée contre la volonté de son propriétaire, même un instant (art. 311-1 CP) ; la restituer ensuite n'est pas un désistement volontaire (art. 121-5)." },
    { id: "consentement", when: (C) => inf(C, ["violences"]),
      labels: ["La victime avait accepté la bagarre", "Une bagarre consentie"],
      says: () => ["Ils étaient deux à vouloir en découdre. La victime a accepté le combat : elle ne peut pas s'en plaindre.", "C'était une bagarre voulue des deux côtés ; le consentement de la victime change tout."],
      rebut: "Le consentement de la victime ne justifie pas des violences, maître.",
      regle: "Le consentement de la victime n'est pas un fait justificatif des violences : seuls l'autorisation de la loi, le commandement de l'autorité légitime, la légitime défense et l'état de nécessité justifient (art. 122-4 à 122-7 CP)." },
    { id: "provocation", when: (C) => inf(C, ["outrage", "rebellion", "violences_pdap", "violences", "menaces"]) && !doute(C, "legitime_defense"),
      labels: (C) => [`${C.G.Il} a été provoqué${C.G.e}`, "La provocation"],
      says: (C) => [`${C.G.Il} a été provoqué${C.G.e}, humilié${C.G.e} devant tout le monde. La provocation excuse sa réaction.`, `On l'a poussé${C.G.e} à bout : c'est la provocation qui explique tout, et qui l'excuse.`],
      rebut: "La provocation n'est plus une excuse légale, maître. Au mieux, elle compte pour la peine.",
      regle: "L'excuse de provocation a disparu avec le code pénal de 1994 : la provocation ne peut jouer que sur la peine ; seule la légitime défense, si ses conditions sont réunies, fait disparaître l'infraction (art. 122-5 CP)." },
    { id: "ignorance", when: (C) => inf(C, ["stups_usage", "stups_detention", "fraude_fiscale", "abs", "acces_frauduleux", "harcelement_moral", "cyberharcelement", "violation_domicile", "usurpation_identite"]) || (inf(C, ["defaut_permis"]) && !doute(C, "notif_permis")),
      labels: (C) => [`${C.G.Il} ne savait pas que c'était interdit`, "La bonne foi"],
      says: (C) => [`${C.G.Il} ignorait que c'était interdit. On ne punit pas celui qui ne sait pas.`, `${C.G.Il} était de bonne foi : personne ne lui avait jamais dit que c'était illégal.`],
      rebut: "Nul n'est censé ignorer la loi, maître : l'erreur de droit doit être invincible.",
      regle: "L'erreur sur le droit n'exonère que si elle était invincible, par exemple sur la foi d'une information erronée de l'autorité (art. 122-3 CP) ; l'ignorance ordinaire de la loi ne suffit pas." },
    { id: "usage", when: (C) => inf(C, ["stups_trafic", "stups_detention"]) && C.t.quoi !== "usage",
      labels: (C) => [`Simple usage : ${C.G.il} consommait ${C.G.soi}-même`, "Une consommation personnelle"],
      says: (C) => [`${C.G.Il} consomme depuis des années : tout cela était pour son usage personnel.`, C.G.f ? "Ce n'est pas une trafiquante, c'est une consommatrice. Requalifiez en usage." : "Ce n'est pas un trafiquant, c'est un consommateur. Requalifiez en usage."],
      rebut: "La quantité et le conditionnement disent autre chose, maître. Rien au dossier n'appuie l'usage.",
      regle: "Consommer soi-même n'efface pas la détention ou la cession, délits distincts et plus graves que l'usage (art. 222-37 et 222-39 CP ; art. L. 3421-1 CSP pour l'usage). La requalification suppose des éléments au dossier : quantité, absence de matériel de revente." },
    { id: "nullite_fond", when: (C) => C.t.mesure === "gav" && !(C.cs.proc && C.cs.proc.moyens && C.cs.proc.moyens.length),
      labels: ["La nullité de la garde à vue", "Une procédure irrégulière"],
      says: () => ["La garde à vue est irrégulière : tout ce qui en découle doit tomber.", "Cette procédure est nulle, et je vous demande d'en tirer les conséquences."],
      rebut: "Les exceptions de nullité se soulèvent avant toute défense au fond, maître. C'est trop tard.",
      regle: "Les exceptions de nullité doivent être présentées avant toute défense au fond (art. 385 CPP) : plaider une nullité au fond, sans l'avoir soulevée in limine litis, est irrecevable." },
    { id: "casier_relaxe", when: (C) => C.A.casier === 0,
      labels: ["Un casier vierge : la relaxe s'impose", "Son passé plaide pour son innocence"],
      says: (C) => [`${C.G.Il} n'a jamais été condamné${C.G.e} : ${C.G.il} n'a pas pu faire cela. Relaxez-${C.G.le}.`, `Un casier vierge à son âge : comment imaginer qu'${C.G.il} ait commis ces faits ?`],
      rebut: "Le casier dit qui il est, maître, pas ce qu'il a fait.",
      regle: "Le casier judiciaire éclaire la peine, jamais la culpabilité : une première comparution ne prouve pas l'innocence (art. 132-1 CP pour l'individualisation)." },
    { id: "reconciliation", when: (C) => inf(C, ["violences_conj"]),
      labels: ["Le couple s'est réconcilié", "Ils vivent de nouveau ensemble"],
      says: () => ["Ils se sont réconciliés, ils vivent de nouveau ensemble : la justice n'a plus à s'en mêler.", "Le couple a repris la vie commune. Ce procès rouvre une plaie refermée."],
      rebut: "La réconciliation ne fait pas disparaître les violences, maître.",
      regle: "Les violences conjugales sont poursuivies d'office ; la reprise de la vie commune n'éteint pas l'action publique (art. 6 CPP) et ne justifie rien. Le juge peut seulement en tenir compte pour la peine." },
  ];
  PL.PIEGES_PC = [
    { id: "prison", qui: "president", when: () => true,
      labels: ["Demander une peine exemplaire", "Demander de la prison ferme"],
      says: (C) => ["Je demande une peine exemplaire.", `${C.GV.f ? "Ma cliente" : "Mon client"} attend une peine de prison ferme.`],
      rebut: "Maître, la partie civile ne requiert pas : c'est le rôle du parquet.",
      regle: "La partie civile demande réparation de son préjudice ; elle ne requiert pas de peine, ce rôle appartient au ministère public (art. 2 CPP)." },
    { id: "punitifs", qui: "president", when: () => true,
      labels: ["Des dommages-intérêts punitifs", "Une somme qui serve de leçon"],
      says: () => ["Je demande une somme qui serve de leçon : des dommages-intérêts punitifs.", "Que la condamnation civile soit dissuasive : doublez le préjudice."],
      rebut: "Le droit français ne connaît pas les dommages-intérêts punitifs, maître : la réparation, rien que la réparation.",
      regle: "La réparation est intégrale mais limitée au préjudice, sans perte ni profit pour la victime : les dommages-intérêts punitifs n'existent pas en droit français." },
    { id: "sans_pieces", qui: "president", when: () => true,
      labels: ["Le préjudice est évident", "Pas besoin de justificatifs"],
      says: (C) => ["Le préjudice est évident : je n'ai pas à le justifier.", `Chacun voit ce qu'${C.GV.il} a subi ; les pièces n'ajouteraient rien.`],
      rebut: "Ce qui n'est pas justifié ne sera pas alloué, maître.",
      regle: "Le préjudice se prouve : certificats, factures, attestations ; une demande non justifiée est réduite, rejetée, ou renvoyée sur les intérêts civils (art. 464 CPP)." },
    { id: "relaxe_indemn", qui: "president", when: (C) => !inf(C, ["blessures_routieres", "homicide_routier", "accident_travail"]),
      labels: ["Même en cas de relaxe, indemniser", "Une réparation quoi qu'il arrive"],
      says: () => ["Quelle que soit votre décision sur la culpabilité, la victime doit être indemnisée.", "Même si vous relaxez, allouez-lui réparation : elle a souffert."],
      rebut: "Après une relaxe pour une infraction intentionnelle, le tribunal ne peut rien vous allouer, maître.",
      regle: "La relaxe prive en principe la partie civile du juge pénal ; l'exception (art. 470-1 CPP) ne vaut que pour les infractions non intentionnelles, jugées selon les règles du droit civil." },
  ];

  PL.N_PIEGES = 2;
  PL.piegesDe = function (C, role) {
    const pool = (role === "pc" ? PL.PIEGES_PC : PL.PIEGES_DEF).filter((p) => { try { return p.when(C); } catch (e) { return false; } });
    const ord = pool.map((p) => ({ p, k: (h(C.key + ":piege:" + role + ":" + p.id) % 1000) / 1000 / (p.poids || 1) })).sort((a, b) => a.k - b.k);
    return ord.slice(0, PL.N_PIEGES).map(({ p }) => {
      const L = typeof p.labels === "function" ? p.labels(C) : p.labels, S = p.says(C), i = h(C.key + p.id + ":v");
      return {
      id: "piege_" + p.id, piege: p.id, label: L[i % L.length], say: S[i % S.length],
      rebut: p.rebut, qui: p.qui || "president", regle: p.regle, pertinent: () => false,
      };
    });
  };
  PL.piegeDef = (id) => PL.PIEGES_DEF.concat(PL.PIEGES_PC).find((p) => p.id === id) || null;

  // ------------------------------------------------------------------ Liste des arguments présentée au joueur
  // o.toutVoir : comme si tout était en main (tests) ; les arguments écrits pour les affaires écrites ne passent jamais ici
  PL.preparer = function (s, cs, P, o = {}) {
    if (!P || !["defense", "pc"].includes(P.role)) return P;
    const C = PL.ctx(s, cs);
    if (!C) return P;
    const enMain = (c) => o.toutVoir || CR.inHand(s, cs, c);
    const args = [];
    const extra = CR.RETOURNEMENT ? CR.RETOURNEMENT.argsPour(s, cs, P.role).filter((x) => !(P.args || []).some((a) => a.id === x.id)) : [];
    for (const a0 of (P.args || []).concat(extra)) {
      if (ANCIENS_PIEGES.includes(a0.id)) continue;
      let a = a0;
      if (P.role === "defense" && VAR[a0.id]) { try { a = Object.assign({}, a0, VAR[a0.id](C)); } catch (e) { a = a0; } }
      if (a0.id === "garanties" && !C.A.heberg) a = Object.assign({}, a, { pertinent: () => false });
      const cards = a.cards || [];
      if (cards.length && !cards.some(enMain)) continue;
      args.push(a);
    }
    // les arguments piégés se mêlent à ce que le joueur a trouvé : sans rien en main, ils ne se distingueraient que trop bien
    const trouves = args.filter((a) => (a.cards || []).length).length;
    const pieges = o.toutVoir || trouves > 0 ? PL.piegesDe(C, P.role) : [];
    return Object.assign({}, P, { args: melange(args.concat(pieges), C.key + ":ordre:" + P.role), pieges: pieges.map((x) => x.piege) });
  };

  // ------------------------------------------------------------------ Ce qui s'est passé à l'audience
  PL.vus = function (cs, P) {
    if (!P || !P.pieges) return;
    cs.vars.piegesVus = Array.from(new Set((cs.vars.piegesVus || []).concat(P.pieges)));
    cs.vars.piegesLabels = Object.assign({}, cs.vars.piegesLabels || {});
    for (const a of P.args || []) if (a.piege) cs.vars.piegesLabels[a.piege] = a.label;
  };
  PL.joue = function (cs, a) { if (!a || !a.piege) return; cs.vars.piegesJoues = Array.from(new Set((cs.vars.piegesJoues || []).concat([a.piege]))); };
  PL.debrief = function (s, cs) {
    const vus = (cs.vars && cs.vars.piegesVus) || [];
    const joues = (cs.vars && cs.vars.piegesJoues) || [];
    const out = [];
    for (const id of vus) {
      const p = PL.piegeDef(id);
      if (!p) continue;
      const lab = ((cs.vars && cs.vars.piegesLabels) || {})[id] || (Array.isArray(p.labels) ? p.labels[0] : id);
      if (joues.includes(id)) out.push({ kind: "bad", text: `Argument piégé plaidé : « ${lab} ». ${p.regle}` });
      else out.push({ kind: "good", text: `Vous n'avez pas plaidé « ${lab} », et c'était juste. ${p.regle}` });
    }
    return out;
  };
})();

/* Version 1.0 — construire sa plaidoirie : l'ordre des arguments, le ton, la réplique du ministère public.
   PL.genre(a, role) : procédure, fond, peine ou préjudice (champ `genre` de l'argument, sinon d'après son libellé).
   PL.plan(args, role) : l'ordre est-il logique (principal avant subsidiaire) ? PL.evaluer(o) : effet de l'ordre et du ton
   selon le profil du président (CR.PROFILS : pref droit, bref, faits, personnalite) et la présence de jurés.
   PL.replique(o) : le ministère public réplique sur l'argument faible (art. 460 CPP) ; la défense a la parole en dernier. */
(function () {
  const CR = window.CR, PL = CR.PLAID;
  if (!PL) return;
  PL.TONS = [
    { id: "sobre", t: "Sobre", sub: "Le droit et les pièces, sans effets de manche." },
    { id: "offensif", t: "Offensif", sub: "Vous attaquez de front l'enquête et l'accusation. Il faut de quoi tenir." },
    { id: "humain", t: "Humain", sub: "Vous parlez de la personne avant de parler du dossier." },
  ];
  const RX = {
    procedure: /nullit|irr[ée]gul|exception|prescri|incomp[ée]ten/i,
    prejudice: /pr[ée]judice|chiffr|dintilhac|souffrance|d[ée]ficit|475-1|obs[èe]ques|affection|indemni|dommages|provision/i,
    peine: /personnalit|emploi|travail|famill|enfant|logement|h[ée]berg|insertion|soins|casier|sursis|am[ée]nag|\bpeine|bracelet|int[ée]r[êe]t g[ée]n[ée]ral|regret|excuse|rembours|bulletin|garanti|promesse|domicile|cl[ée]mence|proportionn|enjeu|attenu|att[ée]nu/i,
  };
  PL.genre = function (a, role) {
    if (!a) return "fond";
    if (a.genre) return a.genre;
    const x = (a.id || "") + " " + (a.label || "");
    if (RX.procedure.test(x)) return "procedure";
    if (role === "pc" && RX.prejudice.test(x)) return "prejudice";
    if (RX.peine.test(x)) return "peine";
    return "fond";
  };
  PL.plan = function (args, role) {
    const rang = { procedure: 0, fond: 1, prejudice: 2, peine: role === "pc" ? 3 : 2 };
    const g = args.map((a) => PL.genre(a, role));
    let inversion = null;
    for (let i = 0; i < g.length && !inversion; i++) for (let j = i + 1; j < g.length; j++) if (rang[g[i]] > rang[g[j]]) { inversion = [g[i], g[j]]; break; }
    const iFond = Math.max(g.indexOf("fond"), g.indexOf("procedure")), iSub = g.indexOf(role === "pc" ? "prejudice" : "peine");
    return { genres: g, inversion, subsidiaire: !inversion && iFond >= 0 && iSub > iFond ? iSub : -1 };
  };
  PL.evaluer = function (o) {
    const { api, role, ton, res, plan } = o, cs = api.cs;
    const prof = (CR.ACT && CR.ACT.profil(api, "president")) || null;
    const pref = (prof && prof.pref) || "droit";
    const jury = !!(cs.vars && cs.vars.jures && cs.vars.jures.length);
    const lines = [], notes = [];
    let delta = 0;
    // --- l'ordre
    if (plan.inversion) {
      delta -= 1;
      lines.push({ who: "president", t: role === "pc" ? "Maître, vous chiffrez avant d'avoir établi la faute. Reprenez dans l'ordre." : "Maître, vous plaidez la peine, puis vous revenez à la culpabilité. Que demandez-vous au tribunal ?" });
      notes.push({ kind: "bad", text: role === "pc" ? "Plaidoirie dans le désordre : la partie civile établit d'abord l'infraction et son lien avec le dommage, puis elle chiffre." : "Plaidoirie dans le désordre : on plaide à titre principal (la procédure, puis la relaxe), à titre subsidiaire seulement la peine. Parler de la peine d'abord, c'est dire qu'on ne croit pas à sa relaxe." });
    } else if (plan.subsidiaire >= 0) { delta += 0.5; notes.push({ kind: "good", text: "Plaidoirie construite : le principal d'abord, le subsidiaire ensuite." }); }
    const first = res[0], last = res[res.length - 1];
    if (first && first.pert) delta += pref === "bref" ? 1 : 0.5;
    else if (first && pref === "bref") { delta -= 1; lines.push({ who: "president", t: "À l'essentiel, maître." }); notes.push({ kind: "bad", text: "Devant un président pressé, le meilleur argument se plaide en premier : vous avez ouvert sur un argument qui ne portait pas." }); }
    if (res.length > 1 && last && last.pert) delta += 0.25;
    if (pref === "bref" && res.length >= 4) { delta -= 0.5; lines.push({ who: "sys", t: "(Le président regarde l'horloge : quatre arguments, c'est un de trop pour lui.)" }); }
    // --- le ton
    const g = (r) => PL.genre(r.a, role);
    const bonsFond = res.filter((r) => r.pert && (g(r) === "fond" || g(r) === "procedure")).length;
    const appuyes = res.filter((r) => r.pert && g(r) === "peine" && (r.a.cards || []).length > 0).length;
    let d = 0;
    if (ton === "sobre") {
      d = pref === "droit" ? 1.5 : pref === "bref" ? 1 : pref === "faits" ? 0.5 : 0;
      if (jury) { d -= 1; lines.push({ who: "sys", t: "(Deux jurés décrochent : trop de numéros d'articles, pas assez de la personne qu'ils jugent.)" }); notes.push({ kind: "info", text: "Devant des jurés, une plaidoirie purement technique porte moins : ils jugent une personne, selon leur intime conviction (art. 353 CPP)." }); }
      else if (d >= 1) lines.push({ who: "sys", t: "(Le tribunal suit vos références, stylo en main.)" });
    } else if (ton === "offensif") {
      if (role === "pc") { d = -1; lines.push({ who: "president", t: "Maître, la partie civile ne requiert pas : laissez la peine au ministère public." }); notes.push({ kind: "bad", text: "Ton offensif pour la partie civile : elle demande réparation, elle ne réclame pas de peine. Le ton d'un réquisitoire dessert la victime." }); }
      else if (bonsFond >= 2) { d = pref === "personnalite" ? 0 : 1; lines.push({ who: "sys", t: "(Le procureur se redresse. Le tribunal relit la pièce que vous attaquez.)" }); if (d > 0) notes.push({ kind: "good", text: "Ton offensif tenu par le dossier : deux arguments de fond solides, l'attaque de l'enquête a porté." }); }
      else { d = pref === "faits" || pref === "droit" ? -1.5 : -1; lines.push({ who: "president", t: "Maître, le tribunal a lu le dossier. Des faits, s'il vous plaît, pas des adjectifs." }); notes.push({ kind: "bad", text: "Ton offensif sans matière : on n'attaque l'enquête de front que si le dossier le permet (au moins deux arguments de fond qui tiennent). Sinon l'agressivité se retourne contre le client." }); }
    } else if (ton === "humain") {
      d = pref === "personnalite" ? 1.5 : pref === "droit" ? -0.5 : pref === "bref" ? -1 : 0;
      if (prof && prof.severite > 0.7) d = appuyes > 0 ? 0.5 : -1;
      if (jury) d += 1;
      if (role === "pc") d = Math.max(d, 0.5);
      if (d >= 1) { lines.push({ who: "sys", t: jury ? "(Les jurés ne quittent plus votre client des yeux.)" : "(Le tribunal pose son stylo et écoute.)" }); notes.push({ kind: "good", text: jury ? "Ton humain devant des jurés : ils jugent une personne, et vous la leur avez montrée." : "Ton humain devant un magistrat sensible à la personnalité : il a écouté." }); }
      else if (d <= -1) { lines.push(prof && prof.severite > 0.7 ? { who: "president", t: "Le tribunal entend, maître. Avez-vous une pièce pour l'établir ?" } : { who: "sys", t: "(Le président regarde l'horloge.)" }); notes.push({ kind: "bad", text: prof && prof.severite > 0.7 ? "Ton humain sans pièce : devant un magistrat sévère, la personnalité se prouve (contrat, attestation, justificatifs), elle ne s'affirme pas." : "Ton humain devant un magistrat pressé : il attendait l'argument, pas le portrait." }); }
    }
    return { delta: delta + d, lines, notes };
  };
  PL.replique = function (o) {
    const { role, res } = o;
    if (role && role !== "defense") return null;
    const faible = res.find((r) => !r.pert);
    if (!faible) return null;
    let lab = String(faible.a.label || "").replace(/\s*\((?:art\.|article)[^)]*\)/g, "").replace(/[.…\s]+$/, "");
    if (lab.length > 150) lab = lab.slice(0, 147).replace(/\s+\S*$/, "") + "…";
    const fort = res.find((r) => r.pert);
    return {
      faible: faible.a.id, fort: fort ? fort.a : null,
      line: { who: "parquet", t: `Un mot en réplique, puisque la loi me le permet. La défense soutient ceci : « ${lab} ». Le dossier dit autre chose, et le tribunal le sait.` },
      options: [
        { id: "abandon", t: fort ? "Laisser ce point et refermer sur votre meilleur argument" : "Laisser ce point au tribunal", sub: "Vous avez la parole en dernier : c'est ce que le tribunal gardera en tête." },
        { id: "maintien", t: "Maintenir l'argument, mot pour mot", sub: "Tenir tête au parquet. Encore faut-il que l'argument tienne." },
        { id: "rien", t: "Ne rien ajouter", sub: "Ne pas reprendre la parole." },
      ],
    };
  };
  PL.repliqueFin = function (cs, R, id) {
    const lines = [], notes = [];
    let delta = 0;
    if (id === "abandon") {
      lines.push({ who: "you", t: R.fort ? "Je laisse ce point à l'appréciation du tribunal. L'essentiel est ailleurs, et je le redis une dernière fois : " + String(R.fort.say || R.fort.label || "").replace(/^\s*/, "").replace(/^([A-ZÀ-Ý])/, (m) => m.toLowerCase()) : "Je laisse ce point à l'appréciation du tribunal et je m'en rapporte pour le surplus." });
      delta = R.fort ? 1 : 0.25;
      notes.push({ kind: "good", text: "Après la réplique du parquet, vous avez lâché l'argument faible et refermé sur le fort : la défense a toujours la parole en dernier (art. 460 CPP), autant la prendre pour ce qui tient." });
    } else if (id === "maintien") {
      lines.push({ who: "you", t: "Je maintiens ce que j'ai dit, mot pour mot." }, { who: "president", t: "Le tribunal appréciera, maître." });
      delta = -1;
      notes.push({ kind: "bad", text: "Vous avez maintenu, après la réplique du parquet, un argument que le dossier contredisait : il a pesé deux fois contre votre client." });
    } else {
      lines.push({ who: "sys", t: "(Vous ne reprenez pas la parole. Le dernier mot entendu sur ce point est celui du parquet.)" });
      notes.push({ kind: "info", text: "Le parquet a répliqué (art. 460 CPP). Vous aviez la parole en dernier et vous ne l'avez pas reprise." });
    }
    return { delta, lines, notes };
  };
  const deb0 = PL.debrief;
  PL.debrief = function (s, cs) {
    const out = deb0 ? deb0(s, cs) : [];
    return out.concat((cs.vars && cs.vars.plaidNotes) || []);
  };
})();
