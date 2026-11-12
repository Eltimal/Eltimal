// La Permanence — fabrique le paquet du jeu publié pour la mise à jour automatique.
// Sortie (dist-jeu/) : jeu.json.gz (tout le jeu : index.html, js, lib, fonts, sons compris, pour les enveloppes d'avant
// le 12 novembre 2026), jeu-leger.json.gz (le jeu sans js/sons/) et sons.json.gz (js/sons/ seul : une enveloppe récente
// ne le retélécharge que si son empreinte change), manifest.json.
// Le numéro de version est le nombre de commits de la branche (git rev-list --count HEAD) : il ne fait que croître.
// Option --version-livree : écrit aussi electron/jeu-version.json, lu par l'app construite (version livrée).
// Lancer depuis la racine : node electron/paquet-jeu.js [--version-livree]
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
const { execSync } = require("child_process");

const racine = path.join(__dirname, "..");
const git = (c) => execSync("git " + c, { cwd: racine }).toString().trim();
const numero = Number(process.env.LP_NUMERO || git("rev-list --count HEAD"));
const commit = process.env.LP_COMMIT || git("rev-parse HEAD");
const date = new Date().toISOString();

function lister(rel) {
  const abs = path.join(racine, rel);
  if (fs.statSync(abs).isFile()) return [rel];
  return fs.readdirSync(abs).flatMap((n) => (n.startsWith(".") ? [] : lister(path.posix.join(rel, n))));
}

const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const chemins = ["index.html", "js", "lib", "fonts"].flatMap(lister).sort();
const fichiers = {};
for (const c of chemins) fichiers[c] = fs.readFileSync(path.join(racine, c)).toString("base64");
const SONS = "js/sons/";
const paquet = zlib.gzipSync(Buffer.from(JSON.stringify({ numero, commit, date, fichiers })), { level: 6 });
const leger = {}; for (const c of chemins) if (!c.startsWith(SONS)) leger[c] = fichiers[c];
const paquetLeger = zlib.gzipSync(Buffer.from(JSON.stringify({ numero, commit, date, fichiers: leger })), { level: 9 });
const manifest = { numero, commit, date, enveloppeMin: 1, sha256: sha(paquet), taille: paquet.length, fichiers: chemins.length, leger: { sha256: sha(paquetLeger), taille: paquetLeger.length } };
// les sons : empreinte du contenu (chemins et fichiers), indépendante du numéro de version
let sons = null, paquetSons = null;
if (fs.existsSync(path.join(racine, "js", "sons"))) {
  const cs = lister("js/sons").sort(), fs2 = {}, h = crypto.createHash("sha256");
  for (const c of cs) { const b = fs.readFileSync(path.join(racine, c)); fs2[c] = b.toString("base64"); h.update(c + "\0" + sha(b) + "\n"); }
  const empreinte = h.digest("hex");
  paquetSons = zlib.gzipSync(Buffer.from(JSON.stringify({ empreinte, fichiers: fs2 })), { level: 6 });
  sons = { empreinte, sha256: sha(paquetSons), taille: paquetSons.length, fichiers: cs.length };
  manifest.sons = sons;
}

const sortie = path.join(racine, "dist-jeu");
fs.mkdirSync(sortie, { recursive: true });
fs.writeFileSync(path.join(sortie, "jeu.json.gz"), paquet);
fs.writeFileSync(path.join(sortie, "jeu-leger.json.gz"), paquetLeger);
if (paquetSons) fs.writeFileSync(path.join(sortie, "sons.json.gz"), paquetSons);
fs.writeFileSync(path.join(sortie, "manifest.json"), JSON.stringify(manifest, null, 2));
if (process.argv.includes("--version-livree")) fs.writeFileSync(path.join(__dirname, "jeu-version.json"), JSON.stringify({ numero, commit, date, sons: sons && sons.empreinte }));
console.log(`jeu n° ${numero} (${commit.slice(0, 7)}) : ${chemins.length} fichiers, complet ${(paquet.length / 1048576).toFixed(1)} Mo, léger ${(paquetLeger.length / 1048576).toFixed(1)} Mo` + (sons ? ` ; sons : ${sons.fichiers} fichiers, ${(sons.taille / 1048576).toFixed(1)} Mo, empreinte ${sons.empreinte.slice(0, 8)}` : ""));
