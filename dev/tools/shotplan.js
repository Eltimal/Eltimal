// Capture d'un plan plein cadre : node tools/shotplan.js <plan> [LxH] [instant en ms] [options JSON]
// (prérequis : node tools/shot.js pour régénérer preview/ ; DPR=2 pour la définition d'un écran Retina)
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const SP = __dirname;
(async () => {
  const name = process.argv[2] || "entretien", [w, h] = (process.argv[3] || "1440x900").split("x").map(Number), at = +(process.argv[4] || 3000), extra = JSON.parse(process.argv[5] || "{}");
  fs.mkdirSync(path.join(SP, "out"), { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ["--allow-file-access-from-files", "--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: process.env.DPR ? +process.env.DPR : 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e))); page.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL/.test(m.text())) errs.push(m.text()); });
  await page.goto("file://" + path.join(SP, "preview/index.html"));
  await page.waitForTimeout(500);
  const ok = await page.evaluate(([name, extra]) => {
    const CR = window.CR, UI = CR.UI, html = UI.html;
    const s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 7 });
    document.getElementById("app").style.display = "none";
    const root = document.createElement("div"); root.style.cssText = "position:fixed;inset:0;background:#000"; document.body.append(root);
    const opts = Object.assign({ min: 135, rain: true, look: CR.px.lookFrom("garde7", { g: "m", age: 24 }), expr: "worried", you: CR.youLook(s) }, extra);
    ReactDOM.render(html`<${UI.Plan} name=${name} opts=${opts} />`, root);
    root.firstChild.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
    return UI.planOk(name);
  }, [name, extra]);
  await page.waitForTimeout(900);
  await page.evaluate((at) => { if (CR.UI._planPaint) { CR.UI._planPaint(at - 1000); CR.UI._planPaint(at); } }, at);
  await page.screenshot({ path: path.join(SP, "out", `plan_${name}_${w}x${h}${process.env.NOM ? "_" + process.env.NOM : ""}.png`) });
  console.log("webgl2:", ok, "errors:", errs.slice(0, 4).join(" | ") || "none");
  await browser.close();
})();
