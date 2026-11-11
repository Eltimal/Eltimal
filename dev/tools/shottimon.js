// Planche de Timon : node tools/shottimon.js [échelle] → tools/out/timon.png
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
(async () => {
  const sc = +(process.argv[2] || 6);
  const browser = await chromium.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", args: ["--allow-file-access-from-files", "--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
  await page.setContent("<body style='margin:0;background:#161b26'></body>");
  for (const f of ["lumiere.js", "timon.js"]) await page.addScriptTag({ content: "window.CR=window.CR||{};" + fs.readFileSync(path.join(__dirname, "../../js", f), "utf8") });
  await page.evaluate((sc) => {
    const CR = window.CR, T = CR.timon, W = 62, H = 50;
    const list = [["walk", { phase: 0.05 }], ["walk", { phase: 0.3 }], ["walk", { phase: 0.55 }], ["walk", { phase: 0.8 }], ["walk", { phase: 0.2, run: 1, head: { eyes: "wide" } }], ["stand", { head: { look: 1 } }], ["sit", {}], ["sit", { paw: 2, headDown: 3, headX: 1, head: { eyes: "closed", tongue: 1 } }], ["loaf", { head: { eyes: "half" } }], ["loaf", { hang: 1, asleep: 1, head: { eyes: "closed" } }], ["back", {}], ["rear", {}], ["crouch", { wiggle: 1 }], ["leap", { pitch: 0.6, head: { eyes: "wide", ears: "back" } }], ["stretch", { k: 1 }], ["sit", { head: { eyes: "happy" } }], ["stand", { head: { mouth: "open" } }], ["sit", { tailTwitch: 1, head: { mouth: "chatter" } }]];
    const cv = document.createElement("canvas"); cv.width = 6 * W * sc; cv.height = 3 * H * sc; document.body.append(cv); const ctx = cv.getContext("2d");
    list.forEach(([pose, p], i) => {
      const B = new CR.lum.Buf(W, H); for (let k = 0; k < W * H; k++) { const y = (k / W) | 0; B.c[k * 3] = y > 40 ? 92 : 38; B.c[k * 3 + 1] = y > 40 ? 62 : 48; B.c[k * 3 + 2] = y > 40 ? 40 : 66; }
      T.render(B, 30, 41, i % 7 === 5 ? -1 : 1, pose, p, 1.3 + i);
      const im = ctx.createImageData(W, H); for (let k = 0; k < W * H; k++) { im.data[k * 4] = B.c[k * 3]; im.data[k * 4 + 1] = B.c[k * 3 + 1]; im.data[k * 4 + 2] = B.c[k * 3 + 2]; im.data[k * 4 + 3] = 255; }
      const t = document.createElement("canvas"); t.width = W; t.height = H; t.getContext("2d").putImageData(im, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(t, (i % 6) * W * sc, ((i / 6) | 0) * H * sc, W * sc, H * sc);
    });
  }, sc);
  await page.locator("canvas").screenshot({ path: path.join(__dirname, "out", "timon.png") });
  console.log("errors:", errs.join(" | ") || "none");
  await browser.close();
})();
