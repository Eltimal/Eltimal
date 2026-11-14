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
- **D-37. Le jeune avocat vit juste.** Charges et prélèvement personnel (estimations) exigent onze gardes à vue par mois, ou leur équivalent en honoraires ; le vivier propose environ cinq dossiers par mois. Le dilemme entre dossiers payés et dossiers d'aide juridictionnelle est voulu. Les cotisations sont fixes : c'est le régime provisionnel forfaitaire des débuts d'activité.
- **D-38. Le débrief motive la peine comme le jugement.** Il reprend les motifs (art. 132-1, nature, aménagement) et dit, en corrigé, ce que la défense n'a pas produit : garanties d'insertion, reconnaissance quand les faits étaient établis sans doute. Pas de chiffre de sévérité : des raisons.
- **D-39. Une compétence se gagne par des affaires réussies sans aide.** Réussir, c'est avoir travaillé la compétence sans erreur qui la concerne. Le mode assisté ne fait pas monter ; un échec au niveau examen fait redescendre. Écarté : l'expérience au temps de jeu, ou des points par bonne action (une jauge déguisée).

## Lot 1 ter (13 novembre 2026)

- **D-40. Le vol en magasin se joue sur le témoin qui a tout vu.** L'agent de sécurité est le seul témoin direct : ce qu'il a vu (aux écrans ou en salle), le nombre d'articles qu'il croit avoir vus, le moment où il retient l'auteur. Une fois sur cinq environ, s'il y a plusieurs articles, il en compte un de trop, de bonne foi : l'état du magasin le contredit, et c'est à l'avocat de confronter les deux pièces. La marchandise remise en vente prive la partie civile de préjudice matériel. Écarté : faire mentir l'agent (rien ne l'y pousse dans la réalité).
- **D-41. Le vol dans le métro se joue sur ce que le policier a pu voir.** La victime n'a rien senti : tout repose sur l'observation des policiers en civil, dans une rame plus ou moins bondée, à un ou trois mètres. La poche visée est dite par le policier et par la victime ; elles diffèrent parfois, de bonne foi. Le test a relevé une erreur du catalogue (La Chapelle, station de la ligne 2, donnée sur la ligne 4) : corrigée.
- **D-42. Le vol à la tire se joue sur la possession.** Personne n'a vu la main : l'imputation tient à l'objet et au groupe. Trois fois sur dix, l'objet est retrouvé au sol, près de l'auteur, et non sur lui ; c'est alors la possession elle-même que la défense discute. Toutes les pièces le disent de la même façon.
- **D-43. Le vol de deux-roues se joue sur la présence.** L'appel n'identifie personne (le riverain ne voit pas le visage, le traceur ne voit rien) ; l'intéressé est seulement là à l'arrivée de la patrouille. L'outil dans sa main ou au sol, l'engin déplacé ou resté à sa place sont les deux faits qui font l'affaire ; un engin resté en place pose la question de la tentative (art. 311-13, mêmes peines), que le jeu laisse à l'avocat de soulever.
- **D-44. Le point de deal se joue sur l'observation et la détention.** Les policiers voient des remises de loin, parfois gênés ; ils les datent. La drogue est sur l'intéressé, ou dans une cache d'où ils l'ont vu la sortir : la détention se discute (une cache sur la voie publique sert à plusieurs). Le guetteur n'a rien sur lui : ses cris et sa place le désignent, et il faut établir le trafic pour le lui imputer.
- **D-45. La détention se joue sur l'imputation.** Un colocataire et une cuisine commune, une voiture prêtée, des passagers : autant de personnes qui avaient accès au produit. Ces circonstances sont écrites une fois, dans la constatation, et notées au dossier ; à l'avocat d'en tirer le moyen.
- **D-46. L'outrage se joue sur les mots et leur destinataire.** Deux policiers ont entendu ; le second ne rapporte pas toujours les mêmes mots. Les propos sont parfois lancés vers la rue : l'article 433-5 vise des paroles « adressées » (texte du jeu). Pour la route (alcool), le délai avant la mesure et la mesure retenue ne sont pas codés : règles non lues sur source.
- **D-47. La rébellion se joue sur la nature de la résistance.** Les constatations disent « se débat » ; le second policier décrit parfois un poids mort, ou une clé de bras qui a précédé le refus. Résistance passive et ordre des gestes sont les deux moyens que le dossier peut ouvrir.
- **D-48. Les images ont l'heure de l'enregistreur.** Près d'une fois sur deux, l'horloge de l'enregistreur avance ou retarde de quelques minutes ; l'officier le constate et l'écrit. À partir de trois minutes, c'est un fait du dossier : la chronologie se reconstruit pièce contre pièce, comme en vrai.
- **D-49. La téléphonie dit une zone, pas une adresse.** Un relais dessert de quelques centaines de mètres à plus d'un kilomètre : c'est écrit dans la pièce. Une ligne sur cinq environ est une carte prépayée au nom d'un tiers : la réquisition ne dit pas qui s'en servait.
- **D-50. Une capture d'écran ne dit pas qui écrivait.** Une fois sur quatre, l'expéditeur est un numéro que l'intéressé n'a pas déclaré ; près d'une fois sur trois, la victime a supprimé ses propres réponses. Ce sont les deux questions que la défense pose à des messages, et le jeu les rend possibles.
- **D-51. Une concordance génétique a des degrés.** Sept fois sur dix, le profil est complet ; sinon partiel (compatible, sans plus) ou mélange (« ne peut être exclu »). Le marqueur de preuve reste le même pour le tribunal ; c'est à l'avocat de lire le degré et de le plaider. La mise en garde sur la date du dépôt est toujours écrite.
- **D-52. Les chiffres d'une expertise se recalculent.** La vitesse de l'accidentologie découle des traces de freinage et de l'adhérence écrites dans la même pièce (physique élémentaire, v = √(2·μ·g·d)) : un joueur qui refait le calcul trouve la même fourchette. L'alcoolémie attend la lecture de ses règles (second contrôle, délai) sur source.

## e-Barreau sur l'ordinateur (13 novembre 2026, à la demande de Kevin)

- **D-53. e-Barreau se pratique comme en vrai.** L'ordinateur du cabinet ouvre un poste e-Barreau calqué sur les écrans de démonstration (tableau de bord, boîtes, nouveau message pénal en deux temps, annuaire CEP par type de juridiction, juridiction et structure, avis de réception à ajouter au dossier). Le visuel reste celui du jeu, sans les marques du CNB. Rien n'indique quelle structure reçoit quel acte. Choix du jeu, faute de règle lue : un message à la mauvaise juridiction, à la mauvaise structure, avec un numéro de procédure inconnu ou sans l'acte joint n'est pas enregistré, et le service le dit le lendemain dans e-Barreau ; l'acte peut être renvoyé si le délai court encore. Un tribunal est parfois indisponible pour la journée (« météo des services ») : le message reste en brouillon.
- **D-54. La copie du dossier se demande et se télécharge.** En mode libre, la tâche « Demander la copie du dossier » ouvre e-Barreau : la demande va au cabinet du juge d'instruction de la juridiction, avec le bon numéro (D. 591). La copie arrive par e-Partage, avec un lien valable de 5 à 15 jours (le guide du barreau dit 1 à 30 jours) ; non téléchargée à temps, elle est perdue et se redemande. La date de mise à disposition reste celle qui compte pour les délais (art. 173-1).
- **D-55. Une option fausse se lit comme une vraie.** Les options fausses des gabarits communs (convention, lettre de refus, plainte, plainte avec constitution de partie civile, demande d'actes) sont réécrites en formules complètes et professionnelles, de même longueur que la bonne, et fausses pour la raison juridique d'avant (même défaut évalué). « Rien ne presse. » devient une phrase qui se trompe sur le point de départ des délais. La mesure ne compte plus les blancs à plusieurs bonnes réponses.
- **D-56. Les violences conjugales se jouent sans toujours la parole de la victime.** Une fois sur quatre environ, la victime raconte mais ne veut pas déposer plainte : le parquet peut poursuivre, et la preuve repose sur les constatations, le certificat et les témoins. La main courante dont elle se souvient n'est pas toujours au fichier. Le jeu ne fait jamais mentir la victime : il montre ce que chaque pièce établit.
- **D-57. L'aide reste un choix du joueur ; le niveau mesure ce qu'il maîtrise.** Régler l'aide d'une scène sur le niveau de sa compétence enfermerait le débutant : au niveau « assisté », il recevrait l'aide, et une réussite aidée ne fait pas monter. Le joueur choisit donc le mode (libre ou assisté) ; la grille dit, compétence par compétence, ce qu'il a réussi sans aide. C3 est clos sur ce principe.
- **D-58. Le refus d'obtempérer se joue sur l'identification et les insignes.** Six fois sur dix, les policiers n'ont pas vu le conducteur : la plaque désigne le titulaire, pas celui qui conduisait. Une poursuite en véhicule banalisé, en civil, sans brassard mentionné, ouvre la question des insignes apparents qu'exige la sommation.

## Lot 7 (13 novembre 2026)

- **D-59. La cour raisonne comme le tribunal, et un moyen fort compte.** Les affaires criminelles passent au délibéré élément par élément. Chaque moyen d'acquittement du catalogue attaque son élément (identification → imputation ; consentement, ignorance du chargement → élément moral ; geste médical → acte ; légitime défense, contrainte, force légitime → cause d'irresponsabilité). Un dossier criminel empile six à neuf preuves : retrancher la force d'un moyen n'y changeait rien, et un moyen fort n'acquittait pas plus qu'un faible. Désormais, un moyen fort et soutenu fait douter de moitié des preuves qu'il discute (témoins, victime, images, constatations, déclarations), jamais des preuves matérielles (ADN, aveux, téléphonie, saisie). Mesure : sans plaidoirie 99 % de condamnations, comme avant ; tous les moyens plaidés 69 % (84 % avant).
- **D-60. La peine criminelle se choisit comme la peine délictuelle.** Facteurs nommés (gravité, mort de la victime, circonstances, antécédents, récidive, discernement altéré, personnalité produite, reconnaissance, magistrat), puis la nature : perpétuité pour les faits d'une gravité exceptionnelle, réclusion à temps (dix ans au moins, art. 131-1), ou emprisonnement. Étalon : la répartition 2022 des condamnations pour crime. Prudence : sans relecture de l'article 132-18 ni des règles du sursis criminel, le sursis reste exclu et l'emprisonnement ne descend pas sous deux ans.
- **D-61. Le mémoire plaide pour l'avocat absent.** Devant la chambre de l'instruction, un mémoire déposé à temps (en détention, jusqu'au jour de l'audience ; sinon trois jours avant : art. 198, table vérifiée) porte ses moyens même si l'avocat ne vient pas. S'il ne récapitule pas les moyens de la déclaration d'appel, ceux-ci sont réputés abandonnés. Il se transmet au greffe, par télécopie, recommandé ou e-Barreau (structure CHINS de la cour d'appel).
- **D-62. Le dossier criminel grandit par pièces cohérentes, pas par remplissage.** Chaque pièce ajoutée porte une information que les autres recoupent : les scellés du transport sont ceux de l'inventaire ; la fourchette de l'autopsie contient l'heure des faits ; les voisins situent les faits à des heures qui peuvent s'écarter (fait du dossier au-delà de vingt-cinq minutes). Pour une victime mineure, ni voisinage ni description : le registre est procédural.
- **D-63. Une pièce nouvelle doit pouvoir servir.** Les faits que portent les pièces ajoutées au dossier criminel (témoin hésitant, nuit sans éclairage, heure corrigée, heures divergentes des voisins, aucune trace papillaire) appuient le moyen d'identification : produits à l'audience, ils le soutiennent comme la note prévue par le catalogue.

## Audit de l'entretien (13 novembre 2026, à la demande de Kevin)

Constat de l'audit, captures à l'appui. On ne distinguait pas sa question de la réponse :
- même alignement, même taille, couleurs voisines, seule une étiquette de 11 px les séparait ;
- l'italique servait à la question, au récit et à l'aperçu de la question en préparation ;
- la question s'effaçait environ cinq secondes après avoir été dite, avant que la réponse ne soit comprise ;
- une question posée pendant que le client parlait était ignorée sans un mot ;
- les sujets changeaient de place après chaque choix.

- **D-64. L'oral est un dialogue, et le dernier échange reste.**
  - Vos questions s'affichent à droite, en bulle bleue ; l'interlocuteur à gauche, en bulle neutre, son nom en or ; le récit au centre, en italique, qui lui est réservé.
  - L'échange en cours (votre question et la réponse) ne s'efface pas. Le précédent part quand la question suivante est dite. L'exigence de prise de notes demeure : on ne remonte pas l'entretien.
  - L'audition, sans question de l'avocat, garde l'effacement au fil de l'eau.
- **D-65. Le compositeur ne trompe pas.**
  - L'aperçu est un brouillon encadré en pointillé, titré « Votre question ».
  - Le bouton dit qui parle (« Bilal parle… ») au lieu d'être grisé sans explication.
  - Les sujets restent dans un ordre fixe ; une pastille marque ceux déjà abordés.
  - L'indication tient compte de ce qui est choisi (« Vos droits : choisissez un angle »).
  - Les questions générées perdent le préfixe « Sujet : » (« Et votre famille, qui pourrait le confirmer ? »), avec l'élision « des », « du », « d' ».
- **D-66. Le fil de l'entretien suit le niveau.**
  - Au niveau « assisté » de la compétence Entretien (ou en mode assisté), l'onglet des notes garde le fil des questions et des réponses.
  - Au niveau « libre » et au-delà, il disparaît : on retient le dernier échange, et on note le reste.

## Lot 7 : la confrontation jouée (13 novembre 2026)

- **D-67. À la confrontation, l'avocat interroge le témoin au compositeur, et le témoin est de bonne foi.**
  - Après les questions du juge, la défense pose au plus quatre questions (art. 120 : le juge dirige et met un terme quand il s'estime suffisamment informé). Une question répétée est refusée, avec mention au procès-verbal.
  - Le témoin répond d'après ses auditions : l'heure (la même que dans la seconde audition, corrigée ou non), l'éclairage, la distance, la reconnaissance (franche, hésitante ou à la silhouette). Un seul tirage (`CR.CRIMD.temoin`) sert aux pièces et à la scène.
  - Il ne concède que ce qui est fragile, et seulement si on le lui demande bien : une question ouverte de récit ne suffit jamais. Il faut une question fermée, une relance, le pourquoi d'une heure corrigée, ou lui opposer le passage annoté de sa seconde audition.
  - Leçon du métier : demander « Vous êtes certain ? » à un témoin sûr de lui raffermit l'accusation (charge supplémentaire au délibéré).
  - Ce qu'il concède entre dans les notes et au procès-verbal de confrontation, versé au dossier et tiré des questions jouées. Ces concessions appuient le moyen d'identification ; à partir de deux, le moyen est renforcé, comme par un acte d'enquête obtenu.
  - Hors mode libre, ou sans témoin principal (victime mineure, témoin de moins de seize ans), la confrontation reste la scène d'avant.
- **D-68. Un enjeu n'est fort que si le dossier le soutient (correction).**
  - Dans `gen-instruction.js`, le booléen `fort` d'un enjeu était écrasé par la phrase « fort » du catalogue (`CAT.ENJEUX`) : tout enjeu passait pour fort.
  - Conséquences du défaut : force maximale au délibéré, requalification à 82 %, actes d'enquête presque toujours fructueux, débrief qui disait toujours « le dossier le soutenait ».
  - Désormais, `fort` suit le tirage (`t.f.forts`) et la phrase de la pièce va dans `txtFort` / `faible`.
  - Nouvelle mesure (`tcrimes`) : moyens d'acquittement forts plaidés, 77 % de condamnations ; faibles plaidés, 100 % ; rien plaidé, 99 %. La mesure de D-59 (69 % pour « tous les moyens ») mélangeait les deux à cause du défaut.
- **D-69. À l'interrogatoire au fond, l'avocat fait s'expliquer son client, et ne doit pas l'exposer.**
  - Les questions de l'avocat à son client se composent (art. 120), au plus quatre.
  - Chaque enjeu du catalogue a sa version du client (`CR.CONF.ENJ`, vingt enjeux). Posée en question ouverte, à l'angle qui le fait s'expliquer, elle devient une explication consignée qui appuie le moyen, si le dossier la confirme. Si le dossier la contredit, le juge le relève et cela pèse contre le client (charge de ses déclarations devant le juge, +0,05 par contradiction, au plus +0,12).
  - Leçon inverse de la confrontation : à son propre client, la question fermée n'apporte rien ; il faut le laisser s'expliquer, sur un point que l'on sait solide.
  - Qui nie n'explique pas un geste. Un client que l'avocat n'a pas préparé cherche ses mots : il faut le relancer (une question de plus). Le jour 0 compte comme un jour de préparation (le drapeau valait 0, lu comme faux).
  - Le procès-verbal d'interrogatoire reprend les questions jouées, les réponses et les observations du juge.
- **D-70. Les scènes jouées gardent leur modèle vivant.** La retouche typographique des étapes de scène (`PH.walk`) recopiait tout objet d'étape, y compris le modèle de la confrontation : les réponses s'enregistraient dans une copie. L'étape `parole` passe désormais telle quelle.

## Règles relues sur source (13 novembre 2026, codes.droit.org de nouveau joignable)

- **D-71. La peine criminelle suit les articles 131-1, 132-18, 132-23, 132-30, 132-31 et 132-41 du code pénal** (version du 26 août 2026).
  - Emprisonnement prononcé pour crime : deux ans au moins si la perpétuité est encourue, un an si c'est la réclusion à temps.
  - De cinq ans au plus, il peut être assorti du sursis, en tout ou en partie (« en raison d'un crime ou d'un délit »). La cour qui choisit un sursis partiel s'en tient à cinq ans.
  - Le sursis simple suppose l'absence de condamnation à l'emprisonnement ou à la réclusion dans les cinq ans précédant les faits. Le jeu ne datant pas le casier, un casier non vide donne le sursis probatoire.
  - Correction : la période de sûreté de plein droit ne vaut que pour les infractions que la loi désigne (65 articles relevés) ; ni le meurtre simple ni le viol n'en sont. Le jeu l'appliquait à toute réclusion.
  - Correction : le déroulé criminel effaçait tout sursis (ancienne règle) ; il ne le fait plus pour la peine choisie.
  - Mesure (`tpeinescrime`) : réclusion 61 % (60 en 2022), emprisonnement entièrement assorti du sursis 16 % (17,5), emprisonnement ferme 23 % (22,5), réclusion moyenne 15,5 ans.
- **D-72. La vérification de l'alcoolémie suit les articles L. 234-5 et R. 234-4 du code de la route.**
  - Le résultat est notifié immédiatement, avec l'avis qu'un second contrôle peut être demandé. Demandé (un cas sur trois environ), il est fait aussitôt, après vérification du bon fonctionnement de l'appareil. La seconde mesure ne fait pas passer sous le seuil du délit une mesure qui l'atteignait.
  - Le délai entre dépistage positif et vérification doit être « le plus court possible » : au-delà de 75 minutes, c'est un fait du dossier à discuter. Aucune nullité n'est codée, car son régime n'a pas été relu. Les chronologies actuelles ne dépassent jamais ce délai : la règle est en place, sans cas pour l'instant.
- **D-73. Le dossier d'information a ses sous-dossiers : fond (D), personnalité (B), détention (C).**
  - Source : pratique des greffes décrite par les inventaires d'archives des dossiers d'assises (FranceArchives, Archives des Hauts-de-Seine, lu par la recherche). B : interrogatoire de curriculum vitae, expertises psychiatrique et psychologique, enquête de personnalité. C : ordonnances de détention, mandats, demandes de mise en liberté. D : pièces de fond, réquisitoire compris.
  - La cote A existe aussi, mais son contenu n'a pas pu être lu (francearchives.gouv.fr est hors du réseau de l'environnement) : elle n'est pas utilisée.
  - Chaque pièce garde sa place dans l'ordre du dossier, numérotée dans son sous-dossier ; le bordereau annonce chaque sous-dossier ; le bureau trie fond, personnalité, détention.
  - Nouvelle pièce : l'interrogatoire de curriculum vitae (art. 81, al. 6, CPP), mené par le juge 12 à 45 jours après la mise en examen et tiré de la fiche de la personne (enfance, scolarité, travail, logement, santé, antécédents, projets).
  - Correction : la copie du dossier contenait des pièces pas encore faites (retour de commission rogatoire, et désormais curriculum vitae). Une pièce datée n'est copiée qu'une fois faite ; le greffe la transmet le jour venu, avec un message « Pièce nouvelle au dossier ».
- **D-74. Les secours datent les faits.** Quand il y a une victime (et jamais pour une victime mineure), le dossier criminel contient le journal de la plateforme des appels d'urgence (réquisition et réponse) et l'audition de la personne qui a appelé, voisin ou passant arrivé après les faits.
  - L'appel suit les faits de 3 à 14 minutes. La personne entendue l'est après son appel. Elle n'identifie personne : elle a vu la victime seule, deux silhouettes, ou un homme de dos.
  - Si le témoin principal a corrigé l'heure en seconde audition, le journal des appels dément la correction : c'est un fait qui appuie le moyen d'identification, comme « un homme de dos ».
- **D-75. L'autopsie de la victime d'un homicide routier se compose sur la chronologie.**
  - Décès constaté cinquante minutes après les faits (comme le dit le procès-verbal de constatations). Autopsie le lendemain ou le surlendemain matin ; lésions accordées au scénario (piéton : jambes à hauteur du pare-chocs ; cycliste : bassin ; deux-roues : thorax).
  - Toxicologie de la victime, positive dans un cas sur six environ : fait à discuter avec la causalité, sans effet automatique.
  - En comparution immédiate, si la garde à vue se clôt avant l'autopsie, le dossier ne contient que les premières indications du légiste, recueillies par téléphone (procès-verbal de renseignement).
  - Pièces anciennes restantes : 1 % des affaires (`tcatalogue`).
- **D-76. Le certificat des urgences se compose sur la chronologie.**
  - Dans les affaires du moteur générique où l'incapacité est discutée, la victime passe aux urgences entre les faits et sa plainte. L'urgentiste constate les mêmes lésions que l'unité médico-judiciaire et prescrit un arrêt de travail. La leçon du litige est conservée : un arrêt de travail n'est pas l'incapacité au sens pénal.
  - Le pilote des violences garde son propre certificat.
- **D-77. Une affaire générée deux fois donne le même dossier (correction).**
  - `SIM.caler` recale l'heure des faits sur la garde à vue, et la chronologie d'une convocation en flagrance part de cette heure. Chaque génération décalait donc les heures : environ 4 % des affaires changeaient de dossier, par exemple à la relecture d'une sauvegarde.
  - La génération repart désormais de l'heure tirée, conservée dans `t.d.h0`.
  - Garde-fou `tidempotence` : 160 affaires de tous types générées deux fois.
- **D-78. Une pièce se relit à l'identique d'un affichage à l'autre (correction).**
  - Le garde-fou `tidempotence` rend maintenant chaque pièce deux fois dans une même génération, sur 400 affaires de tous types.
  - Il a trouvé des tirages faits pendant le rendu, que chaque affichage faisait changer :
    - la seconde audition du témoin (30 dossiers criminels sur 160) ;
    - l'audition du proche de la victime ;
    - le numéro de compte du relevé bancaire ;
    - l'audition de la victime et le relevé du dossier criminel ;
    - le procès-verbal d'assemblée générale de l'abus de biens sociaux.
  - Tous sont tirés hors du rendu, ou par un tirage dédié, sans décaler les autres tirages de l'affaire.
  - Le procès-verbal d'assemblée générale ne mentionne plus la découverte des faits, postérieure à l'assemblée. Ces dates passent dans une mention de l'enquêteur qui reçoit la pièce.

## Lot 8 : après le jugement (13 novembre 2026)

- **D-79. Règles relues avant d'écrire** (code de procédure pénale et code pénal sur codes.droit.org, version du 26 août 2026).
  - **Convocation (art. 474 CPP).** Le condamné libre à un an ou moins d'emprisonnement ferme, sans mandat de dépôt (à effet différé compris), reçoit à l'audience un avis de convocation devant le juge de l'application des peines, dans les vingt jours, et devant le SPIP, dans les trente jours. S'il ne se présente pas sans excuse légitime, la peine est mise à exécution en détention.
  - **Aménagement (art. 723-15 CPP).** Il se fait « dans la mesure du possible et si leur personnalité et leur situation le permettent ». Les mesures possibles :
    - semi-liberté, placement à l'extérieur, détention à domicile sous surveillance électronique ;
    - fractionnement ou suspension ;
    - libération conditionnelle ;
    - conversion (art. 747-1).
  - **Six mois ou moins.** La peine doit être aménagée (DDSE, semi-liberté ou placement extérieur), sauf impossibilité tenant à la personnalité ou à la situation du condamné.
  - **Décision (art. 723-15-1 et 712-6).** Avec l'accord de l'intéressé, le juge ordonne la mesure après un débat contradictoire : avis de l'administration pénitentiaire, réquisitions du parquet, observations du condamné et de son avocat. Faute d'éléments suffisants, il saisit le SPIP, qui rend un rapport motivé sous deux mois.
  - **Refus (art. 723-15-2).** Sinon, ou si le condamné refuse, le juge peut fixer la date d'incarcération. En cas de non-présentation, le parquet ramène la peine à exécution.
  - **Conversion (art. 747-1).** Pour un délit, une peine ferme de six mois ou moins peut être convertie : DDSE, travail d'intérêt général, jours-amende, sursis probatoire avec TIG ou sursis probatoire renforcé.
  - **Contenu des mesures (art. 131-4-1, 132-26 CP).** DDSE : demeurer au domicile, avec sorties pour le travail, la formation, les soins, la recherche d'emploi ou la vie de famille. Semi-liberté : rejoindre l'établissement hors du temps de l'activité.
  - **Bulletin n° 2 (art. 775-1 CPP).** La juridiction peut exclure la condamnation du bulletin n° 2, dans le jugement ou plus tard sur requête. Jamais pour les infractions de l'article 706-47.
  - **CIVI (art. 706-3 et 706-5 CPP).** Pour les atteintes graves (mort, incapacité permanente, incapacité de travail d'un mois ou plus, infractions sexuelles et autres infractions listées), la demande se fait dans les trois ans des faits ; si des poursuites ont eu lieu, jusqu'à un an après la décision définitive.
  - **SARVI (art. 706-15-1 et 706-15-2 CPP).** La partie civile non indemnisable par la CIVI, à qui une décision définitive accorde des dommages et intérêts, peut demander l'aide au recouvrement si le condamné n'a pas payé dans les deux mois. Elle le fait dans l'année qui suit la décision définitive.
- **D-80. L'exécution de la peine se plaide devant le juge de l'application des peines.**
  - Une condamnation à un an ou moins de prison ferme, client libre, sans mandat de dépôt ni aménagement prononcé à l'audience, ne clôt plus le dossier. Elle ouvre la convocation devant le JAP, dans les vingt jours (art. 474).
  - L'avocat réunit les justificatifs, tirés de la fiche du client : travail, domicile, hébergement d'un proche, soins, formation.
  - Au débat contradictoire (art. 712-6), il plaide une mesure : surveillance électronique, semi-liberté, placement à l'extérieur, conversion (747-1, qui suppose le texte enregistré dans le dossier).
  - Le juge accorde la mesure plaidée si les pièces la justifient. À six mois ou moins, il ordonne toute mesure que les pièces permettent, même non plaidée : la loi l'impose sauf impossibilité.
  - Faute d'éléments, il charge le SPIP d'un rapport et fixe un second débat (723-15-1). Après ce rapport, sans mesure possible, il fixe la date d'incarcération (723-15-2).
  - Antécédents lourds, au-delà de six mois : il faut des garanties doublées (domicile et activité).
  - Un appel interrompt la procédure (art. 474), et le dossier se clôt comme avant.
  - L'absence de l'avocat est une erreur datée. Compétence « Application des peines » : travaillée par ce débat, manquée si une mesure était possible sans que les justificatifs soient réunis.
  - Le dossier se clôt avec l'issue du jugement, complétée de l'exécution. Écran : scène commune (`CR.AUDIENCES`), panneau « Observations sur l'exécution de la peine ».
- **D-81. La victime indemnisée par le jugement n'est pas encore payée.**
  - Une condamnation à des dommages et intérêts ouvre le recouvrement. Le greffe informe la partie civile de ses recours (art. 706-15). La décision devient définitive au terme du délai d'appel du procureur général, vingt jours (art. 505).
  - **Atteinte grave** (mort, incapacité de travail d'un mois ou plus, infractions sexuelles, violences sur mineur ou par le conjoint) : la CIVI se saisit par requête.
    - Le fonds de garantie offre sous deux mois (706-5-1), entre 82 % et 100 % du préjudice fixé par le tribunal (estimation).
    - Acceptée, l'offre est homologuée et payée. Refusée, la commission instruit plusieurs mois et alloue le préjudice fixé par le tribunal.
  - **Sinon** : le condamné paie, selon ses ressources simulées, ou ne paie pas dans les deux mois. Dans ce cas, l'aide au recouvrement du SARVI se demande dans l'année (706-15-2). Le fonds verse une avance, sans montant inventé.
  - **Rien fait dans l'année de la décision définitive** : forclusion, erreur datée avec son remède (relevé de forclusion pour motif légitime).
  - Chaque geste de l'avocat tient le client informé. Un client laissé sans nouvelles finit par se plaindre (règle existante).
  - Le cas des préjudices moindres sous condition de ressources (706-14) n'est pas codé : son plafond suit l'aide juridictionnelle partielle, non relue.
- **D-82. L'exclusion du bulletin n° 2 se plaide au jugement (art. 775-1 CPP).**
  - Argument de toute défense, proposé quand l'emploi du client est au dossier, avec une entrée au catalogue (« L'exclusion de la mention au bulletin n° 2 du casier »).
  - Le tribunal répond toujours, motifs à l'appui. Il refuse :
    - pour les infractions de l'article 706-47 ;
    - quand rien au dossier ne montre ce que la mention compromettrait ;
    - plus souvent avec des antécédents (estimation : 75 % d'exclusions pour un premier passage, 45 % avec une condamnation, 15 % au-delà).
  - Accordée, l'exclusion est inscrite au dispositif.
  - Reste à faire : la requête après jugement.

## Lot 9 : la bibliothèque (13 novembre 2026, à la demande de Kevin)

- **D-83. Les codes du jeu sont annotés comme les codes des éditions privées : la jurisprudence sous l'article.**
  - **Sous chaque article**, son texte intégral (codes.droit.org, version consolidée), puis les notes :
    - numérotées ;
    - rangées sous des rubriques thématiques (« I. Conditions », « II. Effets », puis A, B, 1°…), avec un plan des notes en tête quand elles sont nombreuses ;
    - chronologiques dans chaque rubrique ;
    - avec des renvois vers les articles voisins.
  - **Chaque note** : la solution en une ou deux phrases, puis la référence complète (formation, date, numéro de pourvoi, mention de publication).
  - **Seulement des décisions réelles et relues.**
    - Source : les données ouvertes de la Cour de cassation publiées par la DILA (base CASS, Licence Ouverte), dont les titrages et sommaires officiels sont réutilisables.
    - Les annotations des éditeurs privés sont protégées : rien n'en est repris. Le plan des notes et la rédaction des solutions sont ceux du jeu, à partir des sommaires officiels.
    - Une décision qui n'a pu être relue n'entre pas.
  - **Les 19 arrêts déjà au jeu** (`code-annote.js`) sont relus sur la même source : 2 seulement l'ont été en texte intégral, 12 ne le sont que par commentaire, 5 restent à vérifier.
  - **Ordre de travail.** D'abord les articles que le jeu cite (garde à vue, nullités, détention, peines, comparution immédiate, recours), puis le reste des codes du jeu : code pénal, code de procédure pénale, code de la route, CJPM.
  - **Usage en jeu.** La note citée à l'audience ou dans un acte reste la carte « jurisprudence » actuelle, avec le même contrôle de la référence.
  - **Blocage externe.** La lecture des données ouvertes (echanges.dila.gouv.fr) a été refusée par le contrôle de sécurité de la session, bien que l'hôte ait été ajouté au réseau de l'environnement. Il faut l'accord de Kevin pour la lecture automatique de ces données, ou des sources fournies.

## Lot 10 abandonné (14 novembre 2026, à la demande de Kevin)

- **D-84. Les affaires écrites et le tutoriel sont retirés du jeu.**
  - **Supprimés.**
    - Le code : les douze affaires et le tutoriel (`js/cases/`), leurs pièces (`js/pieces.js`) et le vivier qui les tirait au sort dans une carrière (`systems.js`).
    - L'écran : le bouton du tutoriel, sa fenêtre de fin, la mention « tutoriel » des sauvegardes, les conditions propres au tutoriel (mémoire des magistrats, carrière).
    - Les tests : ceux des affaires écrites (`t2` à `t14`), `tvivier` et l'outil `dbg.js`.
  - **Toutes les affaires viennent du générateur.** Une petite affaire (convocation, ordonnance pénale ou audition libre) ouvre la carrière dans les premiers jours ouvrables. Elle reprend le rôle de l'ancienne affaire d'ouverture : premier contact entre le 1er et le 3e jour, sur huit parties mesurées.
  - **Sauvegardes.** Une partie tutoriel, ou qui contient une affaire écrite, est refusée avec un message clair (« Commencez une nouvelle partie »). Les autres se lisent comme avant, et leur chevauchement d'audiences est repris (`s.chevauchement`).
  - **Gardé.** Le mécanisme générique de l'enquête de la défense (`dossier.js`, onglet Enquête) reste, sans contenu : seules les affaires écrites en fournissaient.
  - **Tests portés sur des affaires générées** : facturation (`tbill`), citations (`tcite`, avec une affaire d'essai qui reprend la plainte de l'ancienne affaire n° 11), dossier à fouiller (`tdossier`), bibliothèque, mémoire, vidéo, clauses (`tclauses`, `tplcheck`), cas pratiques, cassation, plaidoirie, captures.
  - **Trois défauts trouvés et corrigés en chemin.**
    - Au premier acte ouvert en mode libre, le calcul du fonds commun des clauses remplaçait la partie du joueur par une partie de travail (`CR.newGame` la plaçait dans `CR.store.s`). Il en écrasait aussi les affaires générées de même numéro.
    - Un passage noté, surligné ou relevé n'était pas marqué dans les pièces composées par le moteur : leurs heures portent des espaces insécables, et la comparaison des textes échouait.
    - Le fonds commun des clauses ne voyait que les modèles des affaires écrites : il est désormais nourri d'affaires générées de chaque genre (bonne option la plus longue : 18 % des blancs).

## Lot 8 : fin (14 novembre 2026)

- **D-85. L'action civile renvoyée se plaide à son audience (art. 464 CPP, relu).**
  - Quand le tribunal renvoie l'action civile (faute de demande chiffrée), le dossier ne se clôt plus. Une audience est fixée, de cinq à onze semaines plus tard, où le président siège seul, sans le ministère public : banc à un juge, siège du parquet vide.
  - L'avocat réunit auprès de la victime les justificatifs des postes de préjudice (elle en retrouve la plupart), puis plaide chaque poste qu'il demande.
  - Un poste sans pièce se présente quand même, et le tribunal le réduit (calcul existant, `CR.PROC.calculerCivil`). Les frais d'avocat (art. 475-1) supposent le texte enregistré dans le dossier.
  - La décision chiffrée ouvre le recouvrement (D-81). Sans demande, la partie civile est déboutée. L'absence de l'avocat est une erreur datée, rattachée à la compétence « Victimes », comme la forclusion devant la CIVI ou le SARVI.
- **D-86. La requête en exclusion du bulletin n° 2 après jugement attend une vérification.**
  - L'article 775-1 renvoie aux règles des articles 702-1 et 703 (relus) : requête au procureur, qui saisit la juridiction ; décision en chambre du conseil.
  - L'article 702-1 impose un délai de six mois pour le relèvement des interdictions. Qu'il s'applique ou non à l'exclusion du bulletin n° 2 demande une jurisprudence que la session ne peut pas lire. La requête n'est pas codée.
