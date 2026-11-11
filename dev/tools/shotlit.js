// Capture du jeu sur un lieu : node tools/shotlit.js <lieu> <minute> [largeur×hauteur] [script]
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const SP = __dirname;
(async () => {
  const lieu = process.argv[2] || "commissariat", min = +(process.argv[3] || 1380), [vw, vh] = (process.argv[4] || "1440x900").split("x").map(Number), script = process.argv[5] || "";
  fs.mkdirSync(path.join(SP, "out"), { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", args: ["--allow-file-access-from-files", "--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  if (process.env.HEURE) await page.clock.setFixedTime(new Date(process.env.HEURE));
  await page.goto("file://" + path.join(SP, "preview/index.html"));
  await page.waitForTimeout(700);
  await page.evaluate(async ([lieu, min, script]) => {
    const CR = window.CR;
    if (lieu !== "titre") { CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 7 }); const s = CR.store.s; s.settings.coach = false; s.at = lieu; s.min = min; CR.store.bump(); }
    await new Promise((r) => setTimeout(r, 300));
    if (script) await (new Function("CR", "return (async()=>{" + script + "})()"))(CR);
  }, [lieu, min, script]);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(SP, "out", `jeu_${lieu}_${min}${process.env.NOM ? "_" + process.env.NOM : ""}.png`) });
  console.log("errors:", errs.slice(0, 4).join(" | ") || "none");
  await browser.close();
})();
