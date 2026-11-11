// Planche de contrôle des décors de lieux : node tools/shotlieux.js <minute> [pluie 0|1]
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const SP = __dirname;
(async () => {
  fs.mkdirSync(path.join(SP, "out"), { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ["--allow-file-access-from-files"] });
  const minute = +(process.argv[2] || 600), rain = process.argv[3] === "1";
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto("file://" + path.join(SP, "preview/index.html"));
  await page.waitForTimeout(800);
  await page.evaluate(([min, rain]) => {
    const D = window.CR.dec; document.body.innerHTML = ""; document.body.style.cssText = "background:#111;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:6px;font:11px monospace;color:#ccc";
    for (const name of Object.keys(D.SC)) {
      const W = 360, o = { min, rain, season: "automne", nom: "Le Comptoir des Abbesses", unread: 2, files: 4, ringing: name === "cabinet", voicemail: false };
      const S = D.layout(name, W, o), c = document.createElement("canvas"); c.width = W; c.height = D.H;
      c.style.cssText = "width:" + W * 2 + "px;height:" + D.H * 2 + "px;image-rendering:pixelated;display:block";
      D.frame(S, c.getContext("2d"), 3.2, o);
      const d = document.createElement("div"); d.append(name, c); document.body.append(d);
    }
  }, [minute, rain]);
  await page.screenshot({ path: path.join(SP, "out", `lieux_${minute}${rain ? "_pluie" : ""}.png`), fullPage: true });
  console.log("errors:", errs.join(" | ") || "none");
  await browser.close();
})();
