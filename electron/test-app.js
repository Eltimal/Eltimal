// Vérifie l'app Electron : chargement local, polices, aucune requête réseau, son qui démarre seul,
// sauvegarde gardée entre deux lancements. Lancer : npm run test:app (sous Linux sans écran : xvfb-run -a npm run test:app).
// SRC=<dossier ou app.asar> teste un paquet avec l'Electron du dossier. APP=<chemin de l'exécutable> teste une app construite au lieu du dossier source. SHOT=<fichier.png> garde une capture.
const { _electron: electron } = require("playwright");
const fs = require("fs"), os = require("os"), path = require("path");
const racine = path.join(__dirname, "..");
const donnees = fs.mkdtempSync(path.join(os.tmpdir(), "lp-test-"));
const POLICES = ["Source Sans 3", "Spectral", "Courier Prime", "Silkscreen", "Caveat", "Bodoni Moda"];
const res = []; const note = (nom, ok, detail) => { res.push(ok); console.log((ok ? "ok    " : "ÉCHEC ") + nom + (detail ? " — " + detail : "")); };

async function lancer() {
  const opts = { env: Object.assign({}, process.env, { LP_USER_DATA: donnees, LP_MAJ_OFF: "1" }) };
  if (process.env.APP) { opts.executablePath = process.env.APP; opts.args = []; } else { opts.executablePath = require("electron"); opts.args = [process.env.SRC || racine]; }
  if (process.platform === "linux") opts.args.push("--no-sandbox");
  const app = await electron.launch(opts);
  const page = await app.firstWindow(); const errs = [];
  page.on("pageerror", (e) => errs.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.waitForFunction(() => window.CR && window.CR.Saves && document.querySelector("#app") && document.querySelector("#app").children.length > 0, null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  return { app, page, errs };
}

(async () => {
  // ---------- premier lancement
  let { app, page, errs } = await lancer();
  const info = await page.evaluate(async (POLICES) => {
    const CR = window.CR, out = {};
    out.url = location.protocol; out.version = CR.JEU && CR.JEU.version; out.backend = CR.Saves.backend;
    out.polices = {};
    for (const f of POLICES) { try { const l = await document.fonts.load('16px "' + f + '"'); out.polices[f] = l.length > 0 && l.every((x) => x.status === "loaded"); } catch (e) { out.polices[f] = false; } }
    out.ressources = [...document.querySelectorAll("script[src]")].map((r) => r.src);
    out.scriptsPrevus = document.querySelectorAll("script[src]").length;
    out.canvas = !!document.querySelector("canvas");
    // son : aucun clic n'a eu lieu depuis le lancement
    const S = CR.SON; out.son = { ok: !!(S && S.ok !== false), etat: S && S.ctx && S.ctx.state };
    if (S && S.ctx) {
      const an = S.ctx.createAnalyser(); an.fftSize = 2048; S.master.connect(an); const buf = new Float32Array(an.fftSize);
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const niveau = async (ms) => { let mx = 0; const t0 = performance.now(); while (performance.now() - t0 < ms) { an.getFloatTimeDomainData(buf); for (const v of buf) mx = Math.max(mx, Math.abs(v)); await sleep(15); } return +mx.toFixed(4); };
      out.son.ambiance = await niveau(1200);
      S.jouer("dring"); out.son.bruit = await niveau(500);
    }
    // sauvegarde : une vraie écriture par le jeu, plus un réglage
    localStorage.setItem("lp-test-marque", "42");
    CR.prefsSet("volume", 0.37);
    return out;
  }, POLICES);
  note("page chargée depuis le disque", info.url === "file:", info.url + " version " + info.version);
  note("scripts et scène", info.canvas && info.scriptsPrevus > 50 && info.ressources.every((u) => u.startsWith("file:")), info.scriptsPrevus + " scripts, tous locaux");
  const pol = Object.entries(info.polices).filter(([, v]) => !v).map(([k]) => k);
  note("polices locales", pol.length === 0, pol.length ? "manquent : " + pol.join(", ") : POLICES.length + " familles chargées");
  note("sauvegardes sur l'appareil", info.backend === "local", "mode " + info.backend);
  note("son démarré sans clic", info.son.etat === "running", "contexte " + info.son.etat);
  note("le son produit du signal", info.son.ambiance > 0.002 || info.son.bruit > 0.002, "ambiance " + info.son.ambiance + ", sonnerie " + info.son.bruit);
  // Une vraie partie : créée par le jeu, sauvegardée dans l'emplacement « essai »
  const sauvee = await page.evaluate(async () => {
    const CR = window.CR; const s = CR.newGame ? CR.newGame({ prenom: "Camille", nom: "Essai", cabinet: "Cabinet Essai", mode: "carriere" }) : null; if (!s) return "pas de CR.newGame";
    try { const r = await CR.Saves.save("essai", s); return "ok:" + r; } catch (e) { return "erreur " + e; }
  });
  note("partie enregistrée", /^ok/.test(sauvee), sauvee);
  if (process.env.SHOT) { await page.screenshot({ path: process.env.SHOT }); }
  const bloq1 = await app.evaluate(() => global.lpBloquees.slice());
  note("aucune requête réseau", bloq1.length === 0, bloq1.length ? bloq1.join(", ") : "0 tentative");
  note("aucune erreur dans la page", errs.length === 0, errs.slice(0, 3).join(" | "));
  // plein écran
  const fs1 = await app.evaluate(async ({ BrowserWindow }) => { const w = BrowserWindow.getAllWindows()[0]; const ok = w.isFullScreenable(); w.setFullScreen(true); await new Promise((r) => setTimeout(r, 1500)); const on = w.isFullScreen(); w.setFullScreen(false); return { ok, on }; });
  note("plein écran", fs1.ok && (fs1.on || process.platform === "linux"), "possible " + fs1.ok + ", obtenu " + fs1.on);
  await page.waitForTimeout(800);
  await app.close();

  // ---------- second lancement : tout doit être encore là
  ({ app, page, errs } = await lancer());
  const apres = await page.evaluate(async () => {
    const CR = window.CR; const l = await CR.Saves.list();
    return { marque: localStorage.getItem("lp-test-marque"), volume: CR.prefs.volume, parties: l.map((x) => x.slot + "@" + x.where) };
  });
  note("réglages gardés après relance", apres.marque === "42" && apres.volume === 0.37, "volume " + apres.volume);
  note("partie retrouvée après relance", apres.parties.includes("essai@local"), apres.parties.join(", ") || "aucune");
  await app.close();
  fs.rmSync(donnees, { recursive: true, force: true });
  const ko = res.filter((x) => !x).length;
  console.log("échecs: " + ko);
  process.exit(ko ? 1 : 0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
