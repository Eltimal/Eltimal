// Vérifie dans Chromium que chaque bruit et chaque ambiance se fabrique sans erreur et produit du signal.
// node tools/shot.js d'abord (régénère tools/preview), puis CHROME=… node tools/sontest.js
const path = require("path"); const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ["--allow-file-access-from-files", "--autoplay-policy=no-user-gesture-required"] });
  const page = await browser.newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto("file://" + path.join(__dirname, "preview/index.html")); await page.waitForTimeout(600);
  await page.mouse.click(5, 5); await page.waitForTimeout(300);
  const res = await page.evaluate(async () => {
    const S = window.CR.SON, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), out = { etat: S.ctx && S.ctx.state, fx: {}, amb: {} };
    const an = S.ctx.createAnalyser(); an.fftSize = 2048; S.master.connect(an); const buf = new Float32Array(an.fftSize);
    const niveau = async (ms) => { let mx = 0; const t0 = performance.now(); while (performance.now() - t0 < ms) { an.getFloatTimeDomainData(buf); for (const v of buf) mx = Math.max(mx, Math.abs(v)); await sleep(15); } return +mx.toFixed(3); };
    S.ambiance(null); await sleep(1200);
    const noms = ["clic","onglet","page","note","surligne","mail","alerte","erreur","bien","dring","decroche","raccroche","cloche","chaises","porte","cles","tampon","metro","taxi","verdict_bon","verdict_mauvais","verdict_neutre","jour","toux","pas","radio","clavier","voiture","sirene","horloge","papier","lointain"];
    for (const n of noms) { S.jouer(n); out.fx[n] = await niveau(260); await sleep(120); }
    await sleep(2500);
    for (const a of ["cabinet","domicile","rue","palais","salle","huis","commissariat","prison","titre"]) { S.ambiance(a, { pluie: a === "rue" }); await sleep(1500); out.amb[a] = await niveau(500); }
    return out;
  });
  const muets = Object.entries(res.fx).filter(([, v]) => v < 0.002).map(([k]) => k).concat(Object.entries(res.amb).filter(([, v]) => v < 0.002).map(([k]) => "amb:" + k));
  const forts = Object.entries(res.fx).filter(([, v]) => v > 0.6).map(([k, v]) => k + "=" + v);
  console.log("contexte", res.etat, "| bruits", JSON.stringify(res.fx)); console.log("ambiances", JSON.stringify(res.amb));
  console.log("muets:", muets.join(", ") || "aucun", "| trop forts:", forts.join(", ") || "aucun", "| erreurs:", errs.join(" | ") || "none");
  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
