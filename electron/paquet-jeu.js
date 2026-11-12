// La Permanence — fabrique le paquet du jeu publié pour la mise à jour automatique.
// Sortie : dist-jeu/jeu.json.gz (index.html, js, lib, fonts encodés dans un JSON compressé) et dist-jeu/manifest.json.
// Le numéro de version est le nombre de commits de la branche (git rev-list --count HEAD) : il ne fait que croître.
// Option --version-livree : écrit aussi electron/jeu-version.json, lu par l'app construite (version livrée).
// Lancer depuis la racine : node electron/paquet-jeu.js [--version-livree]
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
const { execSync } = require("child_process");
const { ENVELOPPE } = require("./maj");

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

const chemins = ["index.html", "js", "lib", "fonts"].flatMap(lister).sort();
const fichiers = {};
for (const c of chemins) fichiers[c] = fs.readFileSync(path.join(racine, c)).toString("base64");
const paquet = zlib.gzipSync(Buffer.from(JSON.stringify({ numero, commit, date, fichiers })), { level: 9 });
const manifest = { numero, commit, date, enveloppeMin: ENVELOPPE, sha256: crypto.createHash("sha256").update(paquet).digest("hex"), taille: paquet.length, fichiers: chemins.length };

const sortie = path.join(racine, "dist-jeu");
fs.mkdirSync(sortie, { recursive: true });
fs.writeFileSync(path.join(sortie, "jeu.json.gz"), paquet);
fs.writeFileSync(path.join(sortie, "manifest.json"), JSON.stringify(manifest, null, 2));
if (process.argv.includes("--version-livree")) fs.writeFileSync(path.join(__dirname, "jeu-version.json"), JSON.stringify({ numero, commit, date }));
console.log(`jeu n° ${numero} (${commit.slice(0, 7)}) : ${chemins.length} fichiers, ${(paquet.length / 1048576).toFixed(1)} Mo`);
