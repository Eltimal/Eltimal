// Vérifie la mise à jour automatique du jeu, sans réseau : un faux GitHub tourne en local.
// 1. Le module seul : installation, empreinte, chemins refusés, enveloppe trop ancienne, clé refusée, nettoyage,
//    clé jamais transmise à un autre hôte lors d'une redirection.
// 2. L'app Electron : premier lancement sur la version livrée, mise à jour téléchargée en arrière-plan,
//    second lancement sur la version téléchargée, sauvegardes et réglages retrouvés.
// Lancer : npm run test:maj (sous Linux sans écran : xvfb-run -a npm run test:maj)
const fs = require("fs"), os = require("os"), path = require("path"), http = require("http"), zlib = require("zlib"), crypto = require("crypto");
const MAJ = require("./maj");
const racine = path.join(__dirname, "..");
const res = []; const note = (nom, ok, detail) => { res.push(ok); console.log((ok ? "ok    " : "ÉCHEC ") + nom + (detail ? " — " + detail : "")); };

// Un paquet du jeu actuel, sous un numéro donné ; marque = texte ajouté dans index.html pour reconnaître la version chargée
function fabriquer(numero, o) {
  o = o || {};
  const fichiers = {};
  const lister = (rel) => { const a = path.join(racine, rel); return fs.statSync(a).isFile() ? [rel] : fs.readdirSync(a).flatMap((n) => lister(path.posix.join(rel, n))); };
  for (const c of ["index.html", "js", "lib", "fonts"].flatMap(lister)) fichiers[c] = fs.readFileSync(path.join(racine, c)).toString("base64");
  if (o.marque) fichiers["index.html"] = Buffer.from(Buffer.from(fichiers["index.html"], "base64").toString("utf8").replace("</body>", `<meta name="lp-marque" content="${o.marque}"></body>`)).toString("base64");
  if (o.intrus) fichiers[o.intrus] = Buffer.from("x").toString("base64");
  const paquet = zlib.gzipSync(Buffer.from(JSON.stringify({ numero, commit: "abc", fichiers })));
  const manifest = { numero, commit: "abc", date: "2026-11-12", enveloppeMin: o.enveloppeMin || 1, sha256: o.sha || crypto.createHash("sha256").update(paquet).digest("hex") };
  return { paquet, manifest };
}

// Faux GitHub : /repos/<depot>/releases, pièces servies par redirection vers un autre hôte (localhost ↔ 127.0.0.1)
function fauxGithub() {
  const etat = { publications: [], vus: [], cle: "cle-test", public: false };
  const srv = http.createServer((req, rep) => {
    const u = new URL(req.url, "http://x");
    etat.vus.push({ hote: req.headers.host, chemin: u.pathname, auth: req.headers.authorization || null });
    if (u.pathname.startsWith("/repos/")) {
      if (!req.headers.authorization && !etat.public) { rep.writeHead(404); return rep.end("{}"); }
      if (req.headers.authorization && req.headers.authorization !== "Bearer " + etat.cle) { rep.writeHead(401); return rep.end("{}"); }
      const port = srv.address().port;
      const liste = etat.publications.map((p, i) => ({ tag_name: p.tag, draft: false, assets: [
        { name: "manifest.json", url: `http://localhost:${port}/piece/${i}/manifest` },
        { name: "jeu.json.gz", url: `http://localhost:${port}/piece/${i}/paquet` } ] }));
      rep.writeHead(200, { "Content-Type": "application/json" }); return rep.end(JSON.stringify(liste));
    }
    if (u.pathname.startsWith("/piece/")) {
      rep.writeHead(302, { Location: `http://127.0.0.1:${srv.address().port}/stock${u.pathname.slice(6)}` }); return rep.end();
    }
    if (u.pathname.startsWith("/stock/")) {
      const [, , i, quoi] = u.pathname.split("/"); const p = etat.publications[Number(i)];
      rep.writeHead(200); return rep.end(quoi === "manifest" ? JSON.stringify(p.manifest) : p.paquet);
    }
    rep.writeHead(404); rep.end();
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok({ srv, etat, api: `http://localhost:${srv.address().port}` })));
}

(async () => {
  const { srv, etat, api } = await fauxGithub();
  const pub = (numero, o) => { const f = fabriquer(numero, o); etat.publications.unshift({ tag: "jeu-" + numero, manifest: f.manifest, paquet: f.paquet }); };

  // ---------- 1. le module seul
  const ud = fs.mkdtempSync(path.join(os.tmpdir(), "lp-maj-"));
  const appDir = fs.mkdtempSync(path.join(os.tmpdir(), "lp-app-"));
  fs.mkdirSync(path.join(appDir, "electron")); fs.writeFileSync(path.join(appDir, "electron", "jeu-version.json"), JSON.stringify({ numero: 10 }));
  const v = (o) => MAJ.verifier(Object.assign({ cle: etat.cle, userData: ud, numeroActuel: 10, api, depot: "a/b" }, o));
  note("sans clé, dépôt privé : signalé, rien d'installé", (await v({ cle: "" })).etat === "prive" && !MAJ.versionTelechargee(ud));
  note("aucune publication", (await v()).etat === "a-jour");
  pub(9); note("publication plus ancienne ignorée", (await v()).etat === "a-jour");
  pub(11, { sha: "0".repeat(64) }); let r = await v();
  note("empreinte fausse refusée", r.etat === "erreur" && /empreinte/.test(r.detail) && !MAJ.versionTelechargee(ud), r.detail);
  pub(12, { intrus: "../evasion.js" }); r = await v();
  note("chemin hors du jeu refusé", r.etat === "erreur" && /chemin refusé/.test(r.detail) && !fs.existsSync(path.join(ud, "evasion.js")), r.detail);
  pub(13, { enveloppeMin: MAJ.ENVELOPPE + 1 }); r = await v();
  note("enveloppe trop ancienne : rien d'installé", r.etat === "enveloppe" && !MAJ.versionTelechargee(ud));
  r = await v({ cle: "mauvaise" }); note("clé refusée signalée", r.etat === "erreur" && /clé refusée/.test(r.detail), r.detail);
  pub(14, { marque: "n14" }); etat.vus = []; r = await v();
  const t = MAJ.versionTelechargee(ud);
  note("nouvelle version installée", r.etat === "pret" && r.numero === 14 && t && t.numero === 14 && fs.existsSync(path.join(t.dossier, "js", "main.js")), JSON.stringify(r));
  const redir = etat.vus.filter((x) => x.chemin.startsWith("/stock/"));
  note("la clé ne suit pas la redirection vers un autre hôte", redir.length === 2 && redir.every((x) => x.auth === null) && etat.vus.filter((x) => x.chemin.startsWith("/piece/")).every((x) => x.auth), redir.length + " téléchargements");
  note("la plus récente est choisie", MAJ.jeuACharger(appDir, ud).numero === 14 && MAJ.jeuACharger(appDir, ud).source === "telechargee");
  fs.writeFileSync(path.join(appDir, "electron", "jeu-version.json"), JSON.stringify({ numero: 20 }));
  note("une app réinstallée plus récente l'emporte", MAJ.jeuACharger(appDir, ud).source === "livree");
  etat.public = true; pub(145); etat.vus = []; r = await v({ cle: "", numeroActuel: 14 });
  note("sans clé, dépôt public : installée", r.etat === "pret" && r.numero === 145 && etat.vus.every((x) => !x.auth), JSON.stringify(r));
  etat.public = false; etat.publications.shift();
  pub(15); await v({ numeroActuel: 14 }); pub(16); await v({ numeroActuel: 15 });
  const restants = fs.readdirSync(path.join(ud, "jeu")).filter((n) => /^\d+$/.test(n)).sort();
  note("seules la version actuelle et la précédente restent", restants.join(",") === "15,16", restants.join(","));
  fs.writeFileSync(path.join(ud, "jeu", "actuel.json"), "{abîmé");
  note("pointeur abîmé : retour à la version livrée", MAJ.jeuACharger(appDir, ud).source === "livree");

  // ---------- 2. l'app Electron
  let electron = null; try { electron = require("playwright")._electron; } catch (e) {}
  if (!electron) { note("app Electron", false, "playwright absent"); }
  else {
    const donnees = fs.mkdtempSync(path.join(os.tmpdir(), "lp-maj-app-"));
    const lancer = async () => {
      const opts = { executablePath: require("electron"), args: [racine], env: Object.assign({}, process.env, { LP_USER_DATA: donnees, LP_MAJ_API: api, LP_MAJ_DEPOT: "a/b" }) };
      if (process.platform === "linux") opts.args.push("--no-sandbox");
      const app = await electron.launch(opts); const page = await app.firstWindow();
      await page.waitForFunction(() => window.CR && window.CR.Saves && document.querySelector("#app") && document.querySelector("#app").children.length > 0, null, { timeout: 30000 });
      return { app, page };
    };
    etat.publications = []; etat.public = true; pub(900000, { marque: "n900000" });
    let { app, page } = await lancer();
    const avant = await page.evaluate(() => ({ marque: !!document.querySelector('meta[name="lp-marque"]'), url: location.href }));
    note("premier lancement sur la version livrée", !avant.marque, avant.url.replace(/.*\/(?=[^/]+\/index)/, "…/"));
    await page.evaluate(() => { localStorage.setItem("lp-test-marque", "42"); window.CR.prefsSet("volume", 0.41); });
    let maj = null; for (let i = 0; i < 40 && !(maj && maj.etat); i++) { await page.waitForTimeout(500); maj = await app.evaluate(() => global.lpMaj || null); }
    note("mise à jour téléchargée en arrière-plan", maj && maj.etat === "pret" && maj.numero === 900000, JSON.stringify(maj));
    await app.close();
    ({ app, page } = await lancer());
    const apres = await page.evaluate(() => ({ marque: (document.querySelector('meta[name="lp-marque"]') || {}).content, url: location.href, garde: localStorage.getItem("lp-test-marque"), volume: window.CR.prefs && window.CR.prefs.volume }));
    const jeu = await app.evaluate(() => global.lpJeu);
    note("second lancement sur la version téléchargée", apres.marque === "n900000" && jeu.source === "telechargee", "n° " + jeu.numero);
    note("sauvegardes et réglages retrouvés", apres.garde === "42" && Math.abs((apres.volume || 0) - 0.41) < 1e-9, "marque " + apres.garde + ", volume " + apres.volume);
    const bloquees = await app.evaluate(() => global.lpBloquees.length);
    note("le jeu reste sans réseau", bloquees === 0, bloquees + " requête(s) du jeu");
    await app.close();
  }
  srv.close();
  console.log("échecs: " + res.filter((x) => !x).length);
  process.exit(res.every(Boolean) ? 0 : 1);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
