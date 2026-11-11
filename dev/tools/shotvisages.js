// Planche des visages : node tools/shotvisages.js [échelle] → tools/out/visages-recurrents.png, visages-expressions.png, visages-100.png
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const SP = __dirname;
(async () => {
  const sc = +(process.argv[2] || 2);
  fs.mkdirSync(path.join(SP, "out"), { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", args: ["--allow-file-access-from-files", "--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1480, height: 900 }, deviceScaleFactor: 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto("file://" + path.join(SP, "preview/index.html"));
  await page.waitForTimeout(700);
  const planche = async (nom, mode) => {
    await page.evaluate(([sc, mode]) => {
      const CR = window.CR, PX = CR.px, N = 64;
      document.body.innerHTML = ""; document.body.style.cssText = "background:#0d1017;margin:0;padding:10px;font:11px monospace;color:#aab";
      const r = document.createElement("div"); r.style.cssText = "display:flex;flex-wrap:wrap;gap:6px"; document.body.append(r);
      const put = (lab, look, ex) => { const d = document.createElement("div"); d.style.cssText = "width:" + N * sc + "px;overflow:hidden;white-space:nowrap"; const c = document.createElement("canvas"); c.width = c.height = N * sc; const x = c.getContext("2d"); x.imageSmoothingEnabled = false; x.drawImage(PX.portrait(look, ex || "neutral"), 0, 0, N * sc, N * sc); d.append(c, lab); r.append(d); };
      if (mode === "rec") { for (const a of CR.ACTEURS.filter((a) => PX.HAND[a.id])) put(a.nom.replace(/^(Mme|M\.|Me|Capitaine|Lieutenant|Brigadier-chef|Adjudant) /, ""), PX.acteurLook(a)); put("Varenne (mentore)", Object.assign({}, PX.lookFrom("mentor", CR.MENTOR.look), CR.MENTOR.look)); }
      else if (mode === "expr") { const ex = ["neutral", "talk", "talk2", "smile", "worried", "angry", "cry", "soulage", "defi", "honte"]; for (const L of [PX.lookFrom("client-a", { g: "m", age: 24, skin: 4, hair: "afro", outfit: "hoodie", shirt: "#2f6b6b" }), PX.lookFrom("client-b", { g: "f", age: 37, skin: 1, hair: "long", hc: "auburn" }), PX.lookFrom("c3", { g: "m", age: 58, skin: 0, hair: "receding", hc: "gray", beard: 2, glasses: 1 })]) for (const e of ex) put(e, L, e); }
      else { for (let i = 0; i < 100; i++) put("", PX.lookFrom("visage" + i, { age: 18 + (i * 7) % 60 })); }
    }, [sc, mode]);
    await page.screenshot({ path: path.join(SP, "out", nom + ".png"), fullPage: true });
  };
  await planche("visages-recurrents", "rec"); await planche("visages-expressions", "expr"); await planche("visages-100", "cent");
  console.log("errors:", errs.join(" | ") || "none");
  await browser.close();
})();
