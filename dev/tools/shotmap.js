const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const SP = __dirname;
(async () => {
  fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROME || "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell", args: ["--allow-file-access-from-files"] });
  const sizes = (process.argv[2] || "1440x900").split(",");
  const minute = +(process.argv[3] || 600); const AT = process.argv[5] || "palais";
  for (const sz of sizes) {
    const [w, h] = sz.split("x").map(Number);
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const errs = []; if (process.env.RM) await page.emulateMedia({ reducedMotion: "reduce" });
    page.on("pageerror", (e) => errs.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL/.test(m.text())) errs.push(m.text()); });
    await page.goto("file://" + path.join(SP, "preview/index.html"));
    await page.waitForTimeout(800);
    await page.evaluate(([minute, process_at]) => {
      const CR = window.CR;
      CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 3 });
      const s = CR.store.s; s.settings.coach = false; s.min = minute; s.at = process_at;
      CR.addTempPlace(s, "bar", { nom: "Le Comptoir des Abbesses", sous: "rue des Abbesses (18e)", x: 0.47, y: 0.2 });
      s.detenus.push({ caseId: "x", nom: "Yanis Mebarki", etab: "sante", statut: "prevenu", since: 0, humeur: 50 });
      CR.store.bump();
    }, [minute, AT]);
    await page.waitForTimeout(400);
    await page.evaluate(() => { const b = [...document.querySelectorAll(".rail-btn")].find((x) => /Carte/.test(x.textContent)); b && b.click(); });
    await page.waitForTimeout(+(process.argv[4] || 2500));
    await page.screenshot({ path: path.join(SP, "out", `map_${w}x${h}_${minute}.png`), fullPage: false });
    console.log(sz, "errors:", errs.slice(0, 5).join(" | ") || "none");
    await page.close();
  }
  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
