const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell", args: ["--allow-file-access-from-files"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("file://" + path.join(__dirname, "preview/index.html"));
  await page.waitForTimeout(600);
  const r = await page.evaluate(async () => {
    const CR = window.CR;
    CR.store.s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s.settings.coach = false; CR.store.bump();
    await new Promise((r) => setTimeout(r, 200));
    const t0 = performance.now();
    [...document.querySelectorAll(".rail-btn")].find((x) => /Carte/.test(x.textContent)).click();
    await new Promise((r) => requestAnimationFrame(() => r()));
    const t1 = performance.now();
    // durée moyenne d'une image
    let n = 0; const s0 = performance.now();
    await new Promise((res) => { const f = () => { n++; if (performance.now() - s0 < 2000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
    return { open: Math.round(t1 - t0), fps: Math.round(n / 2) };
  });
  console.log(r);
  await browser.close();
})();
