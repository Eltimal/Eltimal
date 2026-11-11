// Planche des portraits : node tools/shotportraits.js [échelle]  → tools/out/portraits.png
// Personnages récurrents (fiches dessinées à la main), puis visages tirés au hasard dans les neuf expressions.
const path = require("path");
const { chromium } = require("playwright");
const SP = __dirname;
(async () => {
  const sc = +(process.argv[2] || 3);
  const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ["--allow-file-access-from-files"] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto("file://" + path.join(SP, "preview/index.html"));
  await page.waitForTimeout(600);
  await page.evaluate((sc) => {
    const CR = window.CR, PX = CR.px;
    document.body.innerHTML = ""; document.body.style.cssText = "background:#111;margin:0;padding:8px;font:10px monospace;color:#bbb";
    const row = (title, items) => { const h = document.createElement("div"); h.textContent = title; h.style.margin = "6px 0 2px"; document.body.append(h); const r = document.createElement("div"); r.style.cssText = "display:flex;flex-wrap:wrap;gap:4px"; for (const [lab, look, ex] of items) { const d = document.createElement("div"); d.style.cssText = "display:flex;flex-direction:column;align-items:center;width:" + (48 * sc) + "px"; const c = document.createElement("canvas"); c.width = 48 * sc; c.height = 48 * sc; const ctx = c.getContext("2d"); ctx.imageSmoothingEnabled = false; ctx.drawImage(PX.portrait(look, ex || "neutral"), 0, 0, 48, 48, 0, 0, 48 * sc, 48 * sc); d.append(c, lab.slice(0, 18)); r.append(d); } document.body.append(r); };
    const acteurs = (CR.ACTEURS || []).filter((a) => PX.HAND[a.id]).map((a) => [a.id, PX.acteurLook(a)]);
    acteurs.push(["mentor", Object.assign({}, PX.lookFrom("mentor", CR.MENTOR.look), CR.MENTOR.look)]);
    row("Personnages récurrents", acteurs);
    const ex = ["neutral", "talk", "smile", "worried", "angry", "cry", "soulage", "defi", "honte"];
    const L1 = PX.lookFrom("client-a", { g: "m", age: 24, skin: 4, hair: "afro", outfit: "hoodie", shirt: "#2f6b6b" });
    const L2 = PX.lookFrom("client-b", { g: "f", age: 37, skin: 1, hair: "long", hc: "auburn" });
    row("Expressions", ex.map((e) => [e, L1, e]).concat(ex.map((e) => [e, L2, e])));
    const rnd = []; for (let i = 0; i < 24; i++) rnd.push(["graine " + i, PX.lookFrom("hasard" + i, { age: 20 + (i * 7) % 55 })]);
    rnd.push(["hijab", PX.lookFrom("h", { g: "f", hair: "hijab", skin: 3 })], ["robe", PX.lookFrom("r", { outfit: "robe", age: 30 })], ["uniforme", PX.lookFrom("u", { outfit: "uniform" })], ["costume", PX.lookFrom("s", { outfit: "suit" })]);
    row("Visages tirés au hasard", rnd);
  }, sc);
  await page.screenshot({ path: path.join(SP, "out", "portraits.png"), fullPage: true });
  console.log("errors:", errs.join(" | ") || "none");
  await browser.close();
})();
