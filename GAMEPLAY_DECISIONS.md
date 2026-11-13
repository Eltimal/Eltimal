# La Permanence — décisions de game design

Chaque décision : ce qui est tranché, pourquoi, ce qui a été écarté. Les décisions de Kevin (onglet « Refonte du gameplay ») priment ; celles-ci les mettent en œuvre.

## Lot 3 — la parole (13 novembre 2026)

- **D-01. La question composée en trois gestes (sujet, angle, forme).** Une liste de questions tend la réponse ; un texte libre ne s'interprète pas hors ligne. Trois gestes donnent des centaines de combinaisons dont peu sont utiles : c'est le joueur qui sait quoi demander. Écarté : un arbre de dialogue (trop guidé), une recherche par mots-clés (texte libre déguisé).
- **D-02. Seules les combinaisons « clés » d'un sujet livrent les faits.** La pédagogie le veut : demander « quand » sur la notification des droits est le réflexe qui trouve la nullité. Une question fermée n'obtient que le début d'une réponse : apprendre à ouvrir ses questions.
- **D-03. L'oral s'efface ; noter est un geste.** C'est la décision de Kevin. La transcription n'existe qu'en mode assisté (mode liste des tests).
- **D-04. Le conseil se donne dans les trente minutes.** Conseiller coûte du temps qu'on ne passe pas à questionner : le dilemme réel de la permanence. Écarté : l'étape séparée à trois boutons.
- **D-05. Le client ne suit pas toujours le conseil.** De 42 % (bavard) à 77 % (méfiant) de silences tenus, selon l'humeur, la confiance gagnée pendant l'entretien et la pression de l'officier. Sans cette marge, le conseil serait un interrupteur.
- **D-06. Le procès-verbal relu est tiré de ce qui a été dit.** La relecture devient un vrai geste : la phrase mal retranscrite est une réponse que le joueur a entendue.

## Lot 4a — le tribunal qui raisonne (13 novembre 2026)

- **D-07. Le délibéré raisonne élément par élément.** L'addition de poids ne s'explique pas. Le tribunal examine l'acte matériel, l'imputation au prévenu, l'élément moral, puis les causes d'irresponsabilité ; pour chacun, il cherche la preuve qui le porte parmi les pièces restantes (une pièce annulée sort), et la confronte aux moyens de la défense effectivement soutenus. Le jugement écrit en est la trace.
- **D-08. Une preuve n'a de force que sur ce qu'elle prouve.** Un certificat médical prouve la blessure, pas l'auteur ; une image sans visage prouve le geste, pas l'identité ; une saisie sur la personne prouve la détention. C'est ce qui rend le doute sur l'identification plaidable : la défense attaque l'élément le plus faible.
- **D-09. Le doute ne joue que s'il est soutenu.** Un élément à décharge présent dans le dossier mais jamais plaidé ne pèse pas (comme avant) : le tribunal ne plaide pas pour la défense. Mais il le mentionne au débrief.
- **D-10. Calibrage contre l'ancien calcul.** Les forces sont reprises de `B.FORCE` et réparties sur les éléments ; on vérifie sur 1 000 affaires que les taux de relaxe ne dérivent pas, avant de laisser le nouveau calcul décider.
- **D-11. Le jugement s'entend d'abord, s'écrit ensuite.** À l'audience, le dispositif ; la décision écrite complète arrive par le greffe un à trois jours ouvrés plus tard. Le délai d'appel (dix jours) court du prononcé pour une décision contradictoire : le joueur ne peut pas attendre la copie pour décider.

## Lot 4b et entretiens libres (13 novembre 2026)

- **D-12. Un catalogue universel des moyens, le même dans toutes les affaires.** Rangé comme un index (procédure, fond, peine, intérêts civils). Un moyen renvoie en coulisse à l'argument réel que le dossier permet ; s'il n'y en a pas, ou si aucune pièce en main ne l'appuie, le président recadre (« Qu'est-ce qui, dans le dossier, l'établit, maître ? ») et le moyen compte contre la défense. Écarté : masquer les moyens non appuyés (c'était dire lesquels l'étaient).
- **D-13. Le plan de défense est à la barre, en lecture.** Les annotations qui l'appuient mettent déjà leurs faits en main : préparer le dossier de travail est ce qui rend un moyen soutenable. On ne recopie rien à l'audience.
- **D-14. Les signaux disparaissent, le président parle.** Plus de « (Le président prend des notes) » après chaque choix. Restent les répliques du président, qui coupe et recadre : ce sont des réactions de la scène, pas une jauge.
- **D-15. Hors garde à vue, les questions deviennent des sujets, les décisions restent des gestes.** Prendre ou refuser une permanence, promettre, rassurer, opposer le secret à la famille : ce sont des choix d'avocat, explicites, que le compositeur ne doit pas cacher. La patience du client joue toujours, mais ne s'affiche plus : elle se lit dans ses réponses (« ça va être encore long ? ») et son visage.
- **D-16. Le jugement écrit suit la décision complète.** Il est rendu à partir de la décision elle-même, pour reprendre ce que la suite du jugement y ajoute (récidive, cumul, révocation du sursis).
- **D-17. Le réquisitoire raisonne comme le tribunal, du côté de l'accusation.** Il expose les faits, cote les pièces qui portent chaque élément (le même calcul que le délibéré, sans les moyens de la défense), répond aux exceptions, traite la personnalité. Le joueur entend avant de plaider ce sur quoi l'accusation s'appuie : c'est là qu'il voit l'élément le plus faible.
- **D-18. Le président interroge avec les questions de l'enquête.** Un client vu au dépôt est cohérent ; un client qu'on n'a pas préparé se contredit une fois, et le président le relève. Un client qui a menti maintient son mensonge face à la pièce cotée qui le contredit. Ce que l'avocat a fait avant l'audience s'entend à l'audience.
- **D-19. La plaidoirie voit tous les arguments que l'affaire permet.** Un moyen permis mais sans pièce en main reçoit « qu'est-ce qui l'établit ? » ; un moyen que le dossier ne permet pas, « je ne vois pas ce qui permet de soutenir cela ». Les deux comptent contre la défense, différemment expliqués.

## Lot 5, premier jet — les canaux (13 novembre 2026)

- **D-20. Tous les canaux pour tout acte ; la loi juge.** Le choix offert est le même partout (greffe, e-Barreau, recommandé, télécopie, chef d'établissement, commissaire de justice) : rien ne dit lequel est admis. La table vient de l'étalon vérifié (`dev/ref/actes-canaux.md`) ; une ligne « à vérifier » n'y entre pas.
- **D-21. L'irrecevabilité arrive comme en vrai : plus tard, par le greffe, avec son motif.** Pas de refus à l'écran au moment de l'envoi. Le joueur peut refaire l'acte si le délai court encore ; sinon, la forclusion produit ses effets ordinaires.
- **D-22. Le temps du canal compte.** e-Barreau prend date à l'accusé de réception, au premier jour ouvrable suivant après 17 heures (D. 591) ; le recommandé à son arrivée ; le greffe et l'étude quand on s'y présente. C'est ce qui rend un envoi de dernière minute risqué.

## Lot 6, premiers gestes — sans guidage (13 novembre 2026)

- **D-23. Plus de jauges en mode libre.** L'énergie se dit en mots (« Vous êtes : fatigué »), sans barre ; les réputations disparaissent de l'en-tête et se lisent au cabinet comme ce qu'on dit de vous au palais ; la confiance du client et sa patience ne s'affichent plus, elles se lisent dans ses réponses. Les chiffres restent en mode assisté.
- **D-24. Les choix fermés qui restent sont mélangés.** À l'audience comme dans la rédaction, l'ordre des options est tiré une fois pour toutes par dossier : la position ne dit plus rien. Une option d'audience que rien n'appuie dans le dossier s'affiche quand même et reçoit une question du président. Limite connue : la longueur des options d'acte trahit encore souvent la bonne (85 % dans l'audit) ; il faut les réécrire par clauses (B2).
- **D-25. Un choix d'audience que rien n'appuie fait passer le moment.** Le président demande sur quoi l'avocat se fonde, l'argument tombe, l'audience continue comme si rien n'avait été soutenu (option neutre). Écarté : rester sur place jusqu'à ce que le joueur trouve la bonne option, ce qui revenait à la lui désigner par élimination.
- **D-26. Les numéros d'article ne s'affichent pas dans le catalogue des moyens.** « (art. …) » : le joueur tape l'article qui fonde son moyen, comme partout ailleurs dans le jeu.
- **D-27. Les formules fixes de l'audience ont des variantes tirées par affaire.** Une audience réelle est formulaire ; le jeu choisit de ne pas lasser sur cent affaires.
- **D-28. Le fonds commun des clauses vient des actes du jeu eux-mêmes.** Un blanc reçoit des formules de même intitulé, justes dans un autre dossier : ce sont de vraies règles voisines, pas des leurres inventés. Les blancs dont la valeur commande une suite (étendue de l'appel, voie) n'en reçoivent pas : une clause « fausse » n'y aurait pas de sens procédural défini.

## Lot 4 — la peine choisie (13 novembre 2026)

- **D-29. La peine se choisit, elle ne se multiplie plus.** L'ancien calcul (réquisitions × sévérité, ±6 % de hasard, +5 % le soir) donnait 80 % de sursis simples et ni amende ni ferme : toutes les condamnations se ressemblaient. Le tribunal place maintenant l'affaire sur une échelle de sévérité faite de facteurs nommés (gravité encourue, circonstances, ITT, casier, récidive, comparution immédiate, réquisitions, magistrat ; à l'inverse, garanties produites et faits reconnus), choisit la nature, puis le quantum, et dit pourquoi. Les facteurs qui jouent sont écrits dans les motifs : le joueur sait ce que la préparation du dossier de personnalité a changé.
- **D-30. L'étalon est la répartition nationale, pas l'affaire.** Les seuils sont calés pour retrouver, sur le mélange d'affaires du jeu, la répartition publiée des peines délictuelles (2022) ; une affaire donnée n'a pas de « bonne » peine. Les poids des facteurs et l'effet propre de la voie de poursuite ne sont pas publiés : ce sont des estimations, marquées comme telles dans le code.
- **D-31. Les règles légales d'aménagement sont reprises telles quelles** (pas de ferme d'un mois ou moins ; aménagement des peines de six mois au plus sauf impossibilité ; au-delà d'un an, pas d'aménagement ab initio).

## C1 et B2 suite (13 novembre 2026)

- **D-32. L'aide juridictionnelle se paie en unités de valeur.** UV à 36 € (2025) ; garde à vue 359 € et audition libre 175 € sont les dépenses moyennes publiées par mission (RSJ 2026, fiche 2.3, données Unca), vérifiées. Les autres missions sont exprimées en UV et marquées « estimation », calées sur la moyenne pénale publiée (474 €) : le barème du décret 2020-1717 n'a pas pu être lu. Les charges fixes du cabinet restent des estimations déclarées comme telles ; les honoraires sont libres (art. 10 de la loi de 1971), il n'y a pas d'étalon à suivre.
- **D-33. La clause voisine.** Dans un blanc à formules libres, une option fausse est la bonne formule faussée sur ce qui la rend juste : un numéro d'article, un délai, une juridiction. Même longueur, même ton : seule la règle la distingue. Écarté : rallonger les leurres à la main (indice inversé), ou les réécrire un à un (291 blancs, sans garantie d'égalité).
- **D-34. Sans prison encourue, pas de prison.** Contraventions et personnes morales : le tribunal choisit l'amende (jamais de jours-amende, réservés aux délits punis d'emprisonnement, art. 131-5).

## A4 ter et B1 bis (13 novembre 2026)

- **D-35. À l'audience, rien n'annonce plus le moment.** En mode libre, la barre de fenêtre d'intervention, l'invite « Produire une pièce ou citer un texte » et sa barre d'urgence disparaissent. Deux gestes restent toujours à portée : demander la parole, produire ou citer. Au bon moment, ils produisent leur effet ; hors de propos, le président arrête l'avocat (« ce n'est pas le moment »), ce qui coûte un peu de crédit et ne change pas le cours de l'audience. Les boîtes de choix restent là où quelqu'un s'adresse à l'avocat (question du président, dernier mot) : c'est la scène qui demande.
- **D-36. e-Barreau est un écran d'envoi, pas un bouton.** Destinataire choisi dans un annuaire de structures, sans indication de compétence ; acte à joindre ; accusé de réception daté à la minute. Adresse hors liste : irrecevable (D. 591, vérifié). Mauvaise structure de la liste ou message sans pièce jointe : le service répond le lendemain que rien n'a été enregistré, l'acte ne prend pas date et peut être renvoyé (traitement choisi par le jeu, faute de règle lue). Reste à faire : la réception par PLEX.
