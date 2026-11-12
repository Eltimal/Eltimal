// La musique produit-elle du signal dans chaque climat ? node tools/mustest.js (après node tools/shot.js)
const path = require("path");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ["--allow-file-access-from-files", "--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto("file://" + path.join(__dirname, "preview/index.html"));
  await page.waitForTimeout(600);
  await page.keyboard.press("Shift");
  await page.waitForTimeout(400);
  const res = await page.evaluate(async () => {
    const MUS = CR.MUS, c = CR.SON.ctx, out = {};
    if (!c) return { erreur: "pas de contexte audio" };
    for (const nom of Object.keys(MUS.CLIMATS)) {
      MUS.climat(nom);
      const an = c.createAnalyser(); an.fftSize = 2048; MUS.sortie().connect(an);
      let max = 0; const buf = new Float32Array(2048);
      for (let i = 0; i < 30; i++) { await new Promise((r) => setTimeout(r, 150)); an.getFloatTimeDomainData(buf); for (const v of buf) max = Math.max(max, Math.abs(v)); }
      MUS.sortie().disconnect(an);
      out[nom] = +max.toFixed(3);
    }
    MUS.climat(null);
    return { etat: c.state, titreAuto: MUS.log[0], niveaux: out };
  });
  const muets = res.niveaux ? Object.keys(res.niveaux).filter((k) => res.niveaux[k] < 0.004) : ["tous"];
  console.log(JSON.stringify(res), "| muets:", muets.join(", ") || "aucun", "| errors:", errs.join(" | ") || "none");
  await browser.close();
})();
