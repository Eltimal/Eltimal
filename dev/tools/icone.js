// Fabrique l'icône de l'app (build/icon.png, 1024 px) à partir de la balance en pixels du jeu. node dev/tools/icone.js (Playwright)
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  await p.goto("file://" + require("path").resolve(__dirname, "..", "..", "index.html")); await p.waitForSelector(".ts-title");
  await p.evaluate(() => {
    const CR = window.CR, UI = CR.UI;
    document.body.innerHTML = '<div id="ic" style="position:fixed;inset:0;display:grid;place-items:center;background:transparent"><div id="carre" style="width:824px;height:824px;border-radius:184px;background:radial-gradient(circle at 50% 38%, #24386a 0%, #14244a 55%, #0b1226 100%);box-shadow:inset 0 0 0 14px #c9a54e, inset 0 0 0 26px #0b1226;display:grid;place-items:center"><div id="bal"></div></div></div>';
    document.documentElement.style.background = "transparent"; document.body.style.background = "transparent";
    ReactDOM.createRoot(document.getElementById("bal")).render(UI.html`<${UI.PixelBalance} size=${26} />`);
  });
  await p.waitForTimeout(600);
  const dim = await p.evaluate(() => { const e = document.querySelector("#bal > *"); const r = e ? e.getBoundingClientRect() : null; return r ? { w: r.width, h: r.height, tag: e.tagName } : null; });
  console.log(JSON.stringify(dim));
  await p.screenshot({ path: require("path").resolve(__dirname, "..", "..", "build", "icon.png"), omitBackground: true });
  await b.close();
})();
