# La Permanence — procédure de publication

## Deux canaux

| Canal | Branche | Publication | Qui la reçoit |
|---|---|---|---|
| stable | `main` | `jeu-<numéro>` | toutes les apps installées |
| essai | `claude/**` | `essai-<numéro>` (préversion) | les apps construites depuis une branche de travail, et celles où le joueur a coché « Mise à jour → Recevoir aussi les versions d'essai » |

Le numéro est le nombre de commits de la branche. Rien n'est publié si un test échoue : le workflow « Publier le jeu »
lance d'abord la batterie complète, le test navigateur et le test du module de mise à jour.

## Numérotation des versions

Comme dans les grands jeux : **MAJEUR.MINEUR.CORRECTIF**, un nom par mise à jour de contenu, un numéro de build, un canal.
Tout est dans `js/version.js` (`CR.JEU`), avec les notes de mise à jour affichées dans le jeu (écran titre, « Notes de
mise à jour », ouvertes d'elles-mêmes une fois après chaque mise à jour).

| Élément | Règle | Exemple |
|---|---|---|
| MAJEUR | 0 avant la sortie officielle ; 1 à la sortie 1.0 (checklist de `SORTIE_1.0.md` cochée, refonte du gameplay menée jusqu'au pilote jugé) ; 2 pour une refonte d'ampleur après la sortie | 0 |
| MINEUR | une mise à jour de contenu (un lot de la refonte, un pan du jeu) ; elle porte un nom ; le correctif revient à 0 | 9 « La parole » |
| CORRECTIF | corrections et réglages, sans contenu nouveau, sans nom | 0.8.1 |
| Build | numéro de publication, nombre de commits de la branche ; c'est lui que l'app compare pour se mettre à jour | 167 |
| Canal | bêta (branches `claude/**`, publications `essai-N`) ou stable (`main`, `jeu-N`) | bêta |

Référence complète : « 0.9.0.167 » ; à l'écran : « Version 0.9.0 bêta « La parole » · build 167 ». Le menu Mise à jour
de l'app Mac affiche la version et le build ; le message de mise à jour nomme la version (« La mise à jour 0.9.0 « La
parole » est prête »). Les publications GitHub gardent l'étiquette `jeu-N` / `essai-N` (lue par les apps installées) et
prennent pour titre la version.

**À chaque publication qui change quelque chose pour le joueur** : ajouter l'entrée en tête de `HISTORIQUE` dans
`js/version.js` (version, nom si contenu, date, type, résumé, notes), et mettre `package.json` à la même version.
`dev/tests/tson.js` vérifie la cohérence (version affichée = première entrée, versions croissantes, contenu nommé).

Historique reconstitué le 15 novembre 2026 : 0.5.0 « Le cabinet » (version de référence, 11 novembre), 0.6.0 « Le
dossier réel » (lot 1), 0.7.0 « Le dossier de travail » (lot 2), 0.8.0 « Le palais » (après jugement, codes, décisions
au format réel), 0.8.1 (fiabilité de la sortie 1.0), 0.10.0 « La consultation » (moteur de consultation au cabinet), 0.9.0 « La parole » (lot 3 : entretien, audition, récit du
client). Le libellé « 1.0 bêta » affiché jusque-là était prématuré : la 1.0 sera la sortie officielle.

## Mise en place, une seule fois (propriétaire du dépôt)

1. **Signature des mises à jour** : `node electron/cles-maj.js`. Commiter `electron/maj-cle-publique.pem` ; coller la clé
   privée affichée dans le secret `MAJ_SIGNATURE` du dépôt ; ne la garder nulle part ailleurs que dans un coffre. Dès lors,
   une app construite refuse toute publication dont le manifeste n'est pas signé.
2. **Signature et notarisation Apple** (compte Apple Developer) : secrets `MAC_CERT_P12` (certificat « Developer ID
   Application » exporté en .p12, encodé en base64), `MAC_CERT_PASSWORD`, `APPLE_API_KEY_P8` (contenu de la clé App Store
   Connect), `APPLE_API_KEY_ID`, `APPLE_API_ISSUER`.
3. **Branche `main`** : la créer depuis la branche de travail validée ; la protéger (fusion par demande de fusion, tests
   obligatoires).

## Publier une version stable

1. Sur la branche de travail : batterie verte (`node dev/tools/batterie.js complete`), test navigateur, publication
   d'essai jouée sur un Mac.
2. Vérifier la checklist de `SORTIE_1.0.md` ; pour la sortie officielle, ajouter l'entrée 1.0.0 en tête de l'historique
   de `js/version.js` (l'état « bêta » disparaît de lui-même hors du canal d'essai) et passer `package.json` à `1.0.0`.
3. Fusionner dans `main` : le workflow teste puis publie `jeu-<numéro>`.
4. Si l'enveloppe a changé (`electron/**`, `package.json`) : Actions → « Construire l'app » sur `main`. Le workflow refuse
   de construire une app stable non signée ; il vérifie la signature (`codesign`), l'avis de Gatekeeper (`spctl`), le
   ticket de notarisation (`stapler`), puis lance l'app construite (`npm run test:app`).
5. Télécharger l'app publiée sur un Mac qui ne l'a jamais vue : elle doit s'ouvrir par un double-clic, sans avertissement.

## Revenir en arrière

Une publication défectueuse se retire en supprimant sa publication GitHub (`jeu-<numéro>`) : les apps qui ne l'ont pas
encore téléchargée restent sur la précédente. Celles qui l'ont déjà gardent aussi la version d'avant sur le disque, mais
ne la rechargent pas d'elles-mêmes : publier un correctif sous un numéro supérieur est la seule vraie correction.

## Ce qui reste manuel

- La vérification sur matériel réel (fluidité au bureau et en audience sur le Mac cible le plus modeste).
- La relecture juridique datée.
- Le choix d'une licence pour le code du jeu (`LICENCES.md`).
