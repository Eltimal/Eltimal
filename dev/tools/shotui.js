// (RM=1 : animations réduites)
// Capture de l'interface en cours de partie : node tools/shotui.js <LxH> <nom> '<script>' [attente ms]
// Le script s'exécute dans la page après création d'une partie (variables : CR, s, click(texte), rail(nom)).
// ex. node tools/shotui.js 1440x900 dossiers 'rail("Dossiers")'
const path = require("path");
const { chromium } = require("playwright");
const SP = __dirname;
(async () => {
  const [w, h] = (process.argv[2] || "1440x900").split("x").map(Number);
  const name = process.argv[3] || "ui", script = process.argv[4] || "", wait = +(process.argv[5] || 1500);
  const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ["--allow-file-access-from-files", "--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: process.env.DPR ? +process.env.DPR : 1, reducedMotion: process.env.RM ? "reduce" : "no-preference" });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e))); page.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL/.test(m.text())) errs.push(m.text()); });
  await page.goto("file://" + path.join(SP, "preview/index.html"));
  await page.waitForTimeout(500);
  await page.evaluate(async (script) => {
    const CR = window.CR, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const txt = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();
    const click = async (re) => { const b = [...document.querySelectorAll("button")].find((x) => (re instanceof RegExp ? re.test(txt(x)) : txt(x).includes(re)) && !x.disabled); if (b) b.click(); await sleep(120); return !!b; };
    await click("Nouvelle partie"); await click(/^Carrière/);
    await sleep(300);
    const s = CR.store.s; s.settings.coach = false; s.cash = 20000; CR.store.bump(); await sleep(100);
    const rail = async (n) => { const b = [...document.querySelectorAll(".rail-btn")].find((x) => txt(x).startsWith(n)); if (b) b.click(); await sleep(150); };
    await eval("(async () => {" + script + "})()");
  }, script);
  if (process.env.HOVER) { try { await page.hover(process.env.HOVER, { timeout: 3000 }); } catch (e) { errs.push("survol : " + e.message.split("\n")[0]); } }
  await page.waitForTimeout(wait);
  await page.screenshot({ path: path.join(SP, "out", `ui_${name}_${w}x${h}.png`) });
  console.log("errors:", errs.join(" | ") || "none");
  await browser.close();
})();
