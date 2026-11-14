# La Permanence — procédure de publication

## Deux canaux

| Canal | Branche | Publication | Qui la reçoit |
|---|---|---|---|
| stable | `main` | `jeu-<numéro>` | toutes les apps installées |
| essai | `claude/**` | `essai-<numéro>` (préversion) | les apps construites depuis une branche de travail, et celles où le joueur a coché « Mise à jour → Recevoir aussi les versions d'essai » |

Le numéro est le nombre de commits de la branche. Rien n'est publié si un test échoue : le workflow « Publier le jeu »
lance d'abord la batterie complète, le test navigateur et le test du module de mise à jour.

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
2. Vérifier la checklist de `SORTIE_1.0.md` ; pour la sortie officielle, vider `CR.JEU.etat` (`js/prefs.js`) et passer
   `package.json` à `1.0.0`.
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
