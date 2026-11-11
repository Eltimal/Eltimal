// Capture d'une pièce dans son encart, avec la caméra : node tools/shotroom.js <nom> <largeur css> '<options JSON>' [mini 0|1] [attente ms]
// ex. node tools/shotroom.js rdv 300 '{"speaker":"client","min":1100}' 1
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const SP = __dirname;
(async () => {
  const name = process.argv[2] || "rdv", cw = +(process.argv[3] || 300), opts = JSON.parse(process.argv[4] || "{}"), mini = process.argv[5] !== "0", wait = +(process.argv[6] || 1500);
  const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ["--allow-file-access-from-files"] });
  const page = await browser.newPage({ viewport: { width: Math.max(cw + 40, 400), height: 400 }, deviceScaleFactor: process.env.DPR ? +process.env.DPR : 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto("file://" + path.join(SP, "preview/index.html"));
  await page.waitForTimeout(500);
  await page.evaluate(([name, cw, opts, mini]) => {
    const CR = window.CR, UI = CR.UI, html = UI.html, L = (s, o) => CR.px.lookFrom(s, o);
    document.getElementById("app").style.display = "none";
    const root = document.createElement("div"); root.style.cssText = `width:${cw}px;margin:12px`; document.body.append(root);
    const o = Object.assign({ min: 600, looks: { client: L("cl", { age: 30 }), you: Object.assign(L("vous", { g: "f" }), { outfit: "robe" }), opj: L("opj", { outfit: "uniform" }) } }, opts);
    o.sig = CR.dec.sigOf(o);
    ReactDOM.render(html`<div className="mini-stage"><${UI.Room} name=${name} mini=${mini} opts=${o} /></div>`, root);
  }, [name, cw, opts, mini]);
  await page.waitForTimeout(wait);
  await page.screenshot({ path: path.join(SP, "out", `room_${name}_${cw}.png`) });
  console.log("errors:", errs.join(" | ") || "none");
  await browser.close();
})();
