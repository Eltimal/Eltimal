// La Permanence — mise à jour du jeu par l'enveloppe.
// L'app livre une version du jeu (index.html, js, lib, fonts). Au lancement, l'enveloppe interroge une seule adresse :
// la liste des publications du dépôt GitHub. Si une version plus récente du jeu y est publiée, elle la télécharge,
// vérifie son empreinte, la range dans le dossier de données (à côté des sauvegardes) et la charge au lancement suivant.
// Sans réseau, sans clé ou en cas d'erreur, la dernière version qui fonctionne est gardée.
// Ce module n'utilise que Node : il se teste hors d'Electron (dev/tests/tmaj.js).
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
const http = require("http");
const https = require("https");

// Version de l'enveloppe. Une publication qui exige une enveloppe plus récente (manifest.enveloppeMin) n'est pas installée.
const ENVELOPPE = 1;
const DEPOT = "eltimal/eltimal";
const API = "https://api.github.com";
const PREFIXES = ["index.html", "js/", "lib/", "fonts/"];

const lireJson = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return null; } };

// Version livrée dans l'app (écrite au moment du build par electron/paquet-jeu.js --version-livree)
function versionLivree(appDir) {
  const v = lireJson(path.join(appDir, "electron", "jeu-version.json"));
  return { numero: v && Number.isInteger(v.numero) ? v.numero : 0, commit: v && v.commit, dossier: appDir, source: "livree" };
}

// Version téléchargée en dernier, si elle est complète
function versionTelechargee(userData) {
  const base = path.join(userData, "jeu");
  const a = lireJson(path.join(base, "actuel.json"));
  if (!a || !Number.isInteger(a.numero)) return null;
  const dossier = path.join(base, String(a.numero));
  if (!fs.existsSync(path.join(dossier, "index.html"))) return null;
  return { numero: a.numero, commit: a.commit, dossier, source: "telechargee" };
}

// Le jeu à charger : la plus récente des deux
function jeuACharger(appDir, userData) {
  const l = versionLivree(appDir), t = versionTelechargee(userData);
  return t && t.numero > l.numero ? t : l;
}

// Requête HTTP(S) simple ; suit les redirections à la main et ne transmet jamais la clé à un autre hôte
function obtenir(url, entetes, delai, sauts) {
  sauts = sauts == null ? 5 : sauts;
  return new Promise((ok, ko) => {
    const u = new URL(url);
    const mod = u.protocol === "http:" ? http : https;
    const req = mod.request(u, { method: "GET", headers: Object.assign({ "User-Agent": "La-Permanence-maj" }, entetes) }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && sauts > 0) {
        res.resume();
        const suite = new URL(res.headers.location, u);
        const h = Object.assign({}, entetes);
        if (suite.host !== u.host) delete h.Authorization;
        obtenir(suite.href, h, delai, sauts - 1).then(ok, ko);
        return;
      }
      const morceaux = [];
      res.on("data", (c) => morceaux.push(c));
      res.on("end", () => ok({ status: res.statusCode, corps: Buffer.concat(morceaux) }));
      res.on("error", ko);
    });
    req.setTimeout(delai || 20000, () => req.destroy(new Error("délai dépassé")));
    req.on("error", ko);
    req.end();
  });
}

// Extrait un paquet (JSON compressé : { numero, commit, fichiers: { chemin: base64 } }) dans un dossier neuf
function installer(paquet, manifest, userData) {
  const empreinte = crypto.createHash("sha256").update(paquet).digest("hex");
  if (empreinte !== manifest.sha256) throw new Error("empreinte différente : paquet abîmé");
  const contenu = JSON.parse(zlib.gunzipSync(paquet).toString("utf8"));
  if (contenu.numero !== manifest.numero) throw new Error("numéro du paquet différent du manifeste");
  const chemins = Object.keys(contenu.fichiers || {});
  if (!chemins.includes("index.html")) throw new Error("paquet sans index.html");
  for (const c of chemins) {
    if (c.includes("..") || path.isAbsolute(c) || !PREFIXES.some((p) => c === p || c.startsWith(p))) throw new Error("chemin refusé : " + c);
  }
  const base = path.join(userData, "jeu");
  const final = path.join(base, String(manifest.numero));
  const tmp = final + ".partiel";
  fs.rmSync(tmp, { recursive: true, force: true });
  for (const c of chemins) {
    const f = path.join(tmp, c);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, Buffer.from(contenu.fichiers[c], "base64"));
  }
  fs.mkdirSync(path.join(tmp, "electron"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "electron", "jeu-version.json"), JSON.stringify({ numero: manifest.numero, commit: manifest.commit, date: manifest.date }));
  fs.rmSync(final, { recursive: true, force: true });
  fs.renameSync(tmp, final);
  const ptr = path.join(base, "actuel.json");
  fs.writeFileSync(ptr + ".tmp", JSON.stringify({ numero: manifest.numero, commit: manifest.commit, date: manifest.date }));
  fs.renameSync(ptr + ".tmp", ptr);
  return final;
}

// Garde la version actuelle et la précédente, efface les autres
function nettoyer(userData, garder) {
  const base = path.join(userData, "jeu");
  let noms = [];
  try { noms = fs.readdirSync(base); } catch (e) { return; }
  const nums = noms.filter((n) => /^\d+$/.test(n)).map(Number).sort((a, b) => b - a);
  const aGarder = new Set([garder, ...nums.filter((n) => n < garder).slice(0, 1)]);
  for (const n of nums) if (!aGarder.has(n)) fs.rmSync(path.join(base, String(n)), { recursive: true, force: true });
  for (const n of noms) if (n.endsWith(".partiel")) fs.rmSync(path.join(base, n), { recursive: true, force: true });
}

// Cherche une publication plus récente et l'installe. Renvoie { etat, numero?, detail? } ; ne lève jamais.
// etat : sans-cle, a-jour, enveloppe (il faut réinstaller l'app), pret (installée, chargée au prochain lancement), erreur
async function verifier(o) {
  const cle = o.cle && String(o.cle).trim();
  if (!cle) return { etat: "sans-cle" };
  const api = o.api || API, depot = o.depot || DEPOT;
  const auth = { Authorization: "Bearer " + cle, "X-GitHub-Api-Version": "2022-11-28" };
  try {
    const r = await obtenir(`${api}/repos/${depot}/releases?per_page=20`, Object.assign({ Accept: "application/vnd.github+json" }, auth), 15000);
    if (r.status === 401 || r.status === 403 || r.status === 404) return { etat: "erreur", detail: "clé refusée ou expirée (" + r.status + ")" };
    if (r.status !== 200) return { etat: "erreur", detail: "réponse " + r.status };
    const pubs = JSON.parse(r.corps.toString("utf8"))
      .filter((p) => !p.draft && /^jeu-\d+$/.test(p.tag_name))
      .sort((a, b) => Number(b.tag_name.slice(4)) - Number(a.tag_name.slice(4)));
    const pub = pubs[0];
    if (!pub) return { etat: "a-jour", detail: "aucune publication" };
    const numero = Number(pub.tag_name.slice(4));
    if (numero <= o.numeroActuel) return { etat: "a-jour", numero };
    const piece = (nom) => (pub.assets || []).find((a) => a.name === nom);
    const charger = async (nom, delai) => {
      const a = piece(nom);
      if (!a) throw new Error("pièce absente : " + nom);
      const d = await obtenir(a.url, Object.assign({ Accept: "application/octet-stream" }, auth), delai);
      if (d.status !== 200) throw new Error(nom + " : réponse " + d.status);
      return d.corps;
    };
    const manifest = JSON.parse((await charger("manifest.json", 15000)).toString("utf8"));
    if (manifest.numero !== numero) return { etat: "erreur", detail: "manifeste incohérent" };
    if ((manifest.enveloppeMin || 1) > ENVELOPPE) return { etat: "enveloppe", numero };
    const paquet = await charger("jeu.json.gz", 180000);
    installer(paquet, manifest, o.userData);
    nettoyer(o.userData, numero);
    return { etat: "pret", numero };
  } catch (e) {
    return { etat: "erreur", detail: String(e && e.message || e) };
  }
}

// Clé d'accès : fichier posé au moment du build (jamais commité), sinon variable d'environnement
function lireCle(dir) {
  try { return fs.readFileSync(path.join(dir, "maj-cle.txt"), "utf8").trim(); } catch (e) { return process.env.LP_MAJ_CLE || ""; }
}

module.exports = { ENVELOPPE, DEPOT, jeuACharger, versionLivree, versionTelechargee, verifier, installer, nettoyer, lireCle, obtenir };
