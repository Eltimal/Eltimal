// Parcours de la tranche pilote depuis l'écran titre : node tools/shotpilote.js [LxH] [questions posées]
// (prérequis : node tools/shot.js ; DPR=2 pour un écran Retina). Écrit out/pilote_1.png (entretien) et out/pilote_2.png (conseil).
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const SP = __dirname;
(async () => {
  const [w, h] = (process.argv[2] || "1440x900").split("x").map(Number), nq = +(process.argv[3] || 3);
  const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ["--allow-file-access-from-files", "--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: process.env.DPR ? +process.env.DPR : 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e))); page.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL/.test(m.text())) errs.push(m.text()); });
  await page.goto("file://" + path.join(SP, "preview/index.html"));
  await page.waitForTimeout(900);
  const click = async (re) => { const b = page.locator("button", { hasText: re }).first(); if (await b.count()) { await b.click(); await page.waitForTimeout(250); return true; } return false; };
  const steps = [];
  steps.push(await click(/Tranche pilote/)); await page.waitForTimeout(400);
  steps.push(await click(/consulter les pièces/)); steps.push(await click(/Rendre les pièces/));
  for (let i = 0; i < nq; i++) { const q = page.locator(".q-btn").first(); if (await q.count()) { await q.click(); await page.waitForTimeout(300); } }
  await page.waitForTimeout(1500);
  const saved = await page.evaluate(() => Object.keys(localStorage).filter((k) => /saves/.test(k)).map((k) => k + ":" + localStorage.getItem(k).length));
  await page.screenshot({ path: path.join(SP, "out", "pilote_1.png") });
  steps.push(await click(/l'entretien/)); await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(SP, "out", "pilote_2.png") });
  const fps = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 > 2000) res(Math.round(n / 2)); else requestAnimationFrame(f); }; requestAnimationFrame(f); }));
  steps.push(await click(/Garder le silence/)); await page.waitForTimeout(500);
  const after = await page.evaluate(() => ({ staged: !!document.querySelector(".staged"), canvas: !!document.querySelector(".plan-canvas") }));
  console.log("étapes:", steps.join(","), "| sauvegardes:", JSON.stringify(saved), "| images/s (rendu logiciel):", fps, "| après le conseil:", JSON.stringify(after), "| errors:", errs.slice(0, 4).join(" | ") || "none");
  await browser.close();
})();
