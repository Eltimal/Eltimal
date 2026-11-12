// Refonte du gameplay, lot 1 : capture du dossier du pilote et mesure des feuillets.
// node tools/shotdossier.js [LxH] [pièce] [feuillet] [n° d'affaire]   → tools/out/dossier_<pièce>_<LxH>.png
// MESURE=<nombre d'affaires> : parcourt tous les feuillets de ces affaires et signale ceux dont le texte dépasse.
const path = require("path");
const { chromium } = require("playwright");
(async () => {
  const [w, h] = (process.argv[2] || "1440x900").split("x").map(Number);
  const piece = process.argv[3] || "", feuillet = +(process.argv[4] || 0), n = +(process.argv[5] || 0);
  const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ["--allow-file-access-from-files", "--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: process.env.DPR ? +process.env.DPR : 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e))); page.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL|ERR_FILE_NOT_FOUND/.test(m.text())) errs.push(m.text()); });
  await page.goto("file://" + path.resolve(__dirname, "..", "..", "index.html"));
  await page.waitForTimeout(900);
  const clic = async (re) => page.evaluate((src) => { const r = new RegExp(src); const b = [...document.querySelectorAll("button")].find((x) => r.test(x.textContent)); if (b) b.click(); return !!b; }, re);
  if (!(await clic("^Pilote : le dossier"))) errs.push("bouton du pilote introuvable");
  await page.waitForTimeout(400);
  const mesure = +(process.env.MESURE || 0);
  if (mesure) {
    let total = 0; const pb = [];
    for (let k = 0; k < mesure; k++) {
      if (k) { await clic("^Une autre affaire"); await page.waitForTimeout(150); }
      const res = await page.evaluate(async () => {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms)), out = [];
        let vus = 0;
        for (const b of [...document.querySelectorAll(".dr-piece")]) {
          b.click(); await sleep(25);
          for (let g = 0; g < 12; g++) {
            for (const p of document.querySelectorAll(".dr-page:not(.dr-blanche)")) { vus++; const c = p.querySelector(".dr-corps"), ps = p.querySelector(".dr-pied-sig"); const bas = ps ? ps.getBoundingClientRect().top : c.getBoundingClientRect().bottom; const last = c.lastElementChild; const d = Math.max(c.scrollHeight - c.clientHeight, last ? last.getBoundingClientRect().bottom - bas : 0); if (d > 1.5) out.push(p.getAttribute("aria-label") + " : dépasse de " + Math.round(d) + " px sur " + Math.round(c.clientHeight)); }
            const nx = document.querySelector(".dr-fleche[aria-label='Feuillet suivant']");
            const avant = document.querySelector(".dr-ou").textContent + document.querySelector(".dr-page").getAttribute("aria-label");
            const N = +document.querySelector(".dr-page").getAttribute("aria-label").split(" sur ")[1], cur = +/feuillet (\d+)/.exec(avant)[1];
            if (cur + document.querySelectorAll(".dr-page:not(.dr-blanche)").length > N) break;
            nx.click(); await sleep(25);
          }
        }
        return { out, vus };
      });
      total += res.vus; res.out.forEach((x) => pb.push("affaire " + k + " — " + x));
    }
    console.log("feuillets mesurés :", total, "· débordent :", pb.length); pb.slice(0, 30).forEach((x) => console.log("  " + x));
  } else {
    for (let k = 0; k < n; k++) { await clic("^Une autre affaire"); await page.waitForTimeout(150); }
    if (process.env.STADE === "gav") await clic("^En garde à vue");
    if (piece) await page.evaluate((t) => { const b = [...document.querySelectorAll(".dr-piece")].find((x) => x.textContent.includes(t)); if (b) b.click(); }, piece);
    for (let k = 0; k < feuillet; k++) { await page.keyboard.press("ArrowRight"); await page.waitForTimeout(60); }
    await page.waitForTimeout(500);
    const f = path.join(__dirname, "out", `dossier_${(piece || "bordereau").replace(/\W+/g, "_")}_${w}x${h}.png`);
    await page.screenshot({ path: f }); console.log(f);
  }
  console.log("errors:", errs.join(" | ") || "none");
  await browser.close();
})();
