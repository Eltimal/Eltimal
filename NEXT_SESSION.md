# Reprise de la refonte du gameplay

À lire en premier, avec `GAMEPLAY_STATE.md`, `GAMEPLAY_ROADMAP.md` et `GAMEPLAY_DECISIONS.md`. Mandat : direction autonome du chantier jusqu'à la livraison finale ; ne demander aucune validation à Kevin ; seule la livraison finale fait l'objet d'un rapport.

## Avant toute chose

1. `git fetch --all` ; partir de la branche la plus avancée entre `claude/keen-heisenberg-nk0cv3` et `claude/permanence-mac-app-graphics-wege0b` (fusionner l'autre dedans s'il le faut ; les deux publient le jeu sur le Mac, numéro = nombre de commits).
2. `cd dev && npm install` si `node_modules` manque. Navigateur : `CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (vérifier `ls /opt/pw-browsers`). Après une modification de `index.html`, `node tools/shot.js` régénère `tools/preview` avant toute capture par `tools/shotui.js`.
3. Batterie : `cd dev && node tools/batterie.js` (rapide, en parallèle : environ 70 s) après chaque changement ; `node tools/batterie.js complete` (environ 3 min, avec `tgen`, `tsim`, `trepetition` et les boucles) avant chaque commit qui touche la génération des affaires ou l'audience ; `node tools/batterie.js t1 tsim tboucle:9` pour des tests choisis. Ne pas relancer la batterie entière pour une retouche de texte : le test du lot suffit.

## Où on en est

Phase A : A1 à A4 faits (parole en garde à vue, tribunal qui raisonne, procès-verbal tiré de l'audition, entretiens libres, plaidoirie par catalogue). A4 bis (débats intégraux), A5 (débrief « ce qu'il fallait demander »), B1 (canaux) faits. B2 avancé (ordre mélangé, fonds commun, clauses voisines : 51 %). Lot 4 (peine choisie, `peines.js`) et C1 en partie (aide juridictionnelle) faits. A4 ter (gestes d'audience) et B1 bis (écran e-Barreau, sans PLEX) faits. C2 mesuré (`tecono`). A5 fait (peine motivée au débrief). Phase A terminée. Lot 7 commencé : délibéré criminel (`tcrimes`) ; peine criminelle faite (`tpeinescrime`), mémoire devant la chambre de l'instruction fait (`tmemoirechins`) ; suivent le dossier criminel au volume réel. C3 fait (grille de compétences). Prochain : phase D, lot 1 ter (familles d'infractions au niveau de l'arrachage) ; restes : B2 (blancs à valeur propre), PLEX, aide réglée par compétence.

## Lot 1 ter — plan de départ

Première famille, **faite le 13 novembre** (`tmagasin`) : le vol en magasin (`cat-biens.js`, scène `magasin`). Restent pour elle : un décor de magasin dans `video.js` (l'extrait est dit remis, pas encore joué) et la plainte du représentant de la société. Plan suivi : Modèle : l'arrachage dans `sim.js` (`SIM.arrachage`, `SIM.simuler` : vérité simulée, savoirs de chacun, enquête minute par minute) et ses trames (`trames-flagrance.js`). À simuler : l'agent de sécurité (ce qu'il voit en salle et sur les écrans, l'interpellation au portique, la rétention jusqu'à l'arrivée de la police), la marchandise (articles, prix étiquetés, restitution en état de vente ou non), la caméra du magasin (`video.js` : un décor de magasin à créer), la plainte du représentant de la société (personne morale victime), le casier. Pièces : procès-verbal de l'agent, plainte, facture ou état des prix, procès-verbal de restitution, extrait vidéo. Test : `tsim` étendu à la scène, cohérence d'une pièce à l'autre. Vol dans le métro fait aussi (`ttransport`). Vol à la tire fait (`ttire`). Vol de deux-roues fait (`t2roues`), point de deal et guetteur faits (`tdeal`), détention en flagrance faite (`tdetention`), outrage et rébellion faits (`toutrage`, `trebellion`). Pièces techniques : rapport du laboratoire fait (`tlabo`), images faites (`timages`), téléphonie faite (`ttelephonie`), captures faites (`tcaptures`), relevés faits (`treleve`), ADN fait (`tadn`), fichier des permis fait (`tpermis`), expertises faites (`texpertise`) ; il reste 1 % d'affaires avec une pièce ancienne (`tcatalogue`, quatre pièces isolées) ; certificat des urgences fait (D-76, `turgences`) ; autopsie des homicides routiers faite (D-75, `tautopsie`). Alcoolémie et toxicologie routière sont composées par le moteur avec le contenu d'avant ; les règles du second contrôle et du délai sont codées (D-72, `tethylo`) (perquisitions de l'enquête préliminaire faites : toute saisie y passe par la trame de perquisition) ; mesure des pièces anciennes restantes par un script (gabarit : envelopper `SIM.pieces` et compter `k.reste` non remplacées). Puis : alcoolémie (96, règles techniques à lire d'abord), expertises (92) fichier des permis (37), ADN (29) ; captures, alcoolémie ; livraison de stupéfiants (scène `livraison`), usage, puis vol chez l'employeur (`vestiaire`), vol au préjudice d'une personne vulnérable, puis stupéfiants.

## Lot 7 — dossier criminel au volume réel (plan)

Mesure du 13 novembre : un dossier criminel généré comptait 14 pièces et environ 1 000 mots ; `crim-dossier.js` en ajoute six et enrichit les expertises et les auditions (20 pièces, 2 000 mots, `tcrimdossier`). Confrontation jouée faite (`confrontation.js`, `tconfront`, D-67). Interrogatoire au fond joué fait (`tinterro`, D-69). Sous-dossiers fond, personnalité, détention et interrogatoire de curriculum vitae faits (D-73, `tcrimdossier`). Journal des appels d'urgence et audition de l'appelant faits (D-74). Lot 7 à compléter au besoin : volume des auditions (plus longues), expertises détaillées. Plan d'origine : une simulation de l'affaire criminelle sur le modèle de `sim.js` (chronologie de l'enquête de flagrance criminelle ou préliminaire, transport sur les lieux, constatations de l'identité judiciaire, auditions de plusieurs témoins, voisinage, autopsie, expertises balistique, génétique, toxicologique et psychiatrique, interrogatoires de première comparution et au fond, confrontations, commission rogatoire), les pièces composées par le moteur (`DOCS.pv`, `DOCS.forme`), cotées par sous-dossiers (fond, personnalité, détention), avec les règles de contenu de `dev/ref/refonte-gameplay.md` (« Ce qui ne change pas » : mineurs). Test : volume, cohérence d'une pièce à l'autre, `tcatalogue` étendu aux affaires criminelles.

## Lot 8 — après le jugement

Fait : l'aménagement de la peine devant le juge de l'application des peines (`apres.js`, `tjap`, D-79, D-80). Règles relues pour la suite (D-79) : exclusion du bulletin n° 2 (art. 775-1 CPP, à plaider au jugement ou sur requête), CIVI (706-3, 706-5) et SARVI (706-15-1, 706-15-2) pour les dossiers de victimes. Reste : ces trois gestes, le volet civil (renvoi sur les intérêts civils, assignation).

## Contrôle d'ensemble

Compris dans `node tools/batterie.js complete` (boucles 7, 9, 5 : la boucle principale en mode libre, de bout en bout).

## Prochaine action

Voir la colonne « État » de `GAMEPLAY_ROADMAP.md` : le premier livrable qui n'est pas « Fait ».

## Réseau

Cette session utilise l'environnement « eltimal — sources juridiques » (créé le 13 novembre 2026 : www.justice.gouv.fr et codes.droit.org ouverts). Sur l'environnement par défaut, ces sites sont refusés (403) : passer sur celui-ci avant toute recherche de sources.

## Reprise automatique

Une tâche planifiée ponctuelle (« Refonte du gameplay de La Permanence — reprise », 13 novembre 2026 à 3 h 38 UTC, échouée faute de crédits ; remplacée par « reprise 2 », 14 h 17 UTC) lance une session neuve avec la consigne du mandat. Elle n'a pas de connecteur GitHub : elle attache le dépôt par add_repo si besoin et pousse par git. Chaque session programme la suivante tant que la refonte n'est pas achevée.
