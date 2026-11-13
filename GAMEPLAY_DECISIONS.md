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
