// Capture de l'entretien de garde à vue dans le jeu : node tools/shotgav.js [LxH] [questions posées] [attente ms] [phase : entretien|conseil]
// (prérequis : node tools/shot.js ; DPR=2 pour un écran Retina)
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const SP = __dirname;
(async () => {
  const [w, h] = (process.argv[2] || "1440x900").split("x").map(Number), nq = +(process.argv[3] || 2), wait = +(process.argv[4] || 2500), until = process.argv[5] || "entretien";
  fs.mkdirSync(path.join(SP, "out"), { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ["--allow-file-access-from-files", "--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: process.env.DPR ? +process.env.DPR : 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e))); page.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL/.test(m.text())) errs.push(m.text()); });
  await page.goto("file://" + path.join(SP, "preview/index.html"));
  await page.waitForTimeout(500);
  const info = await page.evaluate(async ([nq, until]) => {
    const CR = window.CR, UI = CR.UI, html = UI.html, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const txt = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();
    const s = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 7 }));
    s.settings.coach = false; s.min = 135; s.at = "commissariat";
    // une garde à vue générée que la simulation sait jouer (il n'y a plus d'affaire écrite)
    let cs = null; for (let i = 0; i < 30 && !cs; i++) { try { const c = CR.GEN.open(s, "gav", {}); const p = CR.GEN.paramsOf(s, c.id); if (p && p.t && CR.SIM.supporte(p.t)) { c.status = "active"; cs = c; } } catch (e) { /* tirage suivant */ } }
    document.getElementById("app").style.display = "none";
    const root = document.createElement("div"); root.className = "game"; document.body.append(root);
    ReactDOM.render(html`<${UI.GavScene} s=${s} cs=${cs} onDone=${() => {}} />`, root);
    await sleep(200);
    const click = async (re) => { const b = [...root.querySelectorAll("button")].find((x) => re.test(txt(x)) && !x.disabled); if (b) b.click(); await sleep(150); return !!b; };
    await click(/consulter les pièces/); await click(/Rendre les pièces/);
    for (let i = 0; i < nq; i++) { const q = root.querySelector(".q-btn"); if (q) q.click(); await sleep(200); }
    if (until === "conseil") await click(/l'entretien/);
    return { staged: !!root.querySelector(".staged"), ok: UI.planOk("entretien") };
  }, [nq, until]);
  await page.waitForTimeout(wait);
  await page.screenshot({ path: path.join(SP, "out", `gav_${until}_${w}x${h}.png`) });
  console.log(JSON.stringify(info), "errors:", errs.slice(0, 4).join(" | ") || "none");
  await browser.close();
})();
