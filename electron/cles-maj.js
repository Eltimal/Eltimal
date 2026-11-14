// La Permanence — fabrique la paire de clés qui signe les mises à jour du jeu (Ed25519). À lancer UNE fois, hors du dépôt
// de préférence :  node electron/cles-maj.js
//  - la clé publique est écrite dans electron/maj-cle-publique.pem : à commiter (elle est livrée dans l'app) ;
//  - la clé privée est affichée une seule fois : à coller dans le secret du dépôt « MAJ_SIGNATURE » (Settings → Secrets and
//    variables → Actions), puis à ne garder nulle part ailleurs que dans un coffre. Elle n'est jamais écrite sur le disque.
// Tant que la clé publique n'est pas dans l'app, les mises à jour ne sont pas vérifiées par signature (seulement par empreinte).
const crypto = require("crypto"), fs = require("fs"), path = require("path");
const cible = path.join(__dirname, "maj-cle-publique.pem");
if (fs.existsSync(cible) && !process.argv.includes("--remplacer")) { console.error("Une clé publique existe déjà (" + cible + "). Ajoutez --remplacer pour en changer : les apps déjà installées refuseront alors les nouvelles publications."); process.exit(1); }
const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
fs.writeFileSync(cible, publicKey.export({ type: "spki", format: "pem" }));
console.log("Clé publique écrite : " + cible + " (à commiter).\n\nClé privée — à coller dans le secret MAJ_SIGNATURE, puis à effacer de l'écran :\n");
console.log(privateKey.export({ type: "pkcs8", format: "pem" }));
