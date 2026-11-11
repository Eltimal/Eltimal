// Mesure de la mise en pages des codes reliés : rend chaque page de chaque volume dans Chromium et compare la hauteur
// réelle du contenu à la page logique (720 px). node tools/livremesure.js [lu|flou] ; la sortie liste les pages qui débordent.
const path = require("path");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ["--allow-file-access-from-files"] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto("file://" + path.join(__dirname, "preview/index.html"));
  // Polices du jeu (Spectral) servies localement par @fontsource, si installé (npm i --no-save @fontsource/spectral)
  const FS = path.join(__dirname, "..", "node_modules", "@fontsource", "spectral");
  const fs = require("fs");
  for (const f of ["400.css", "400-italic.css", "600.css", "700.css", "700-italic.css"]) { try { await page.addStyleTag({ content: fs.readFileSync(path.join(FS, f), "utf8").replace(/url\(\.\/files\//g, `url(file://${FS}/files/`) }); } catch (e) {} }
  await page.waitForTimeout(1200);
  const res = await page.evaluate(async (lu) => {
    const CR = window.CR, UI = CR.UI;
    const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 });
    if (lu) s.researched = CR.LIB.map((e) => e.id);
    await document.fonts.load("13px Spectral"); await document.fonts.load("italic 13px Spectral"); await document.fonts.load("700 13px Spectral"); await document.fonts.ready;
    { const c = document.createElement("canvas").getContext("2d"); c.font = "13px Spectral, monospace"; const a = c.measureText("Seul un officier de police judiciaire peut placer").width; c.font = "13px monospace"; window.__spectral = Math.round(a) + " px contre " + Math.round(c.measureText("Seul un officier de police judiciaire peut placer").width) + " en monospace"; }
    const host = document.createElement("div"); host.style.cssText = "position:absolute;left:0;top:0;"; document.body.appendChild(host);
    const out = [];
    for (const v of CR.volumes()) {
      const L = CR.composerVolume(v.id);
      const ctx = { s, vol: L.vol, here: null, read() {}, goPage() {}, goArt() {}, annoter() {}, hl: null, livre: L };
      for (const p of L.pages) {
        ReactDOM.render(UI.html`<${UI.LivrePage} p=${p} side=${p.n % 2 ? "droite" : "gauche"} ctx=${ctx} />`, host);
        const el = host.firstChild, body = el.querySelector(".lv-body");
        const h = el.getBoundingClientRect().height, bh = body ? [...body.children].reduce((a, c) => Math.max(a, c.getBoundingClientRect().bottom), 0) - body.getBoundingClientRect().top : 0;
        out.push({ v: v.id, n: p.n, kind: p.kind, h: Math.round(h), body: Math.round(bh) });
      }
    }
    ReactDOM.unmountComponentAtNode(host);
    return out;
  }, process.argv[2] !== "flou");
  console.log("Spectral chargée :", await page.evaluate(() => window.__spectral));
  const corps = res.filter((r) => r.kind !== "titre");
  const trop = res.filter((r) => r.h > 721);
  console.log("pages", res.length, "débordent", trop.length, "max", Math.max(...res.map((r) => r.h)));
  for (const r of trop.slice(0, 30)) console.log(" ", r.v, "p.", r.n, r.kind, r.h);
  const fill = corps.filter((r) => r.kind === "corps").map((r) => r.body / 636);
  fill.sort((a, b) => a - b);
  console.log("remplissage corps : médiane", fill[Math.floor(fill.length / 2)].toFixed(2), "p10", fill[Math.floor(fill.length * 0.1)].toFixed(2), "p90", fill[Math.floor(fill.length * 0.9)].toFixed(2));
  console.log("errors:", errs.join(" | ") || "none");
  await browser.close();
})();
