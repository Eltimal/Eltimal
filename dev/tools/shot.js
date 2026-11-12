const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const SP = __dirname, ROOT = path.resolve(__dirname, "..", ".."), NMD = path.join(__dirname, "..", "node_modules");
(async () => {
  fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
  let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  html = html.replace(/<script src="https:\/\/cdnjs[^"]+react\.production\.min\.js"><\/script>/, `<script src="file://${NMD}/react/umd/react.production.min.js"></script>`)
    .replace(/<script src="https:\/\/cdnjs[^"]+react-dom\.production\.min\.js"><\/script>/, `<script src="file://${NMD}/react-dom/umd/react-dom.production.min.js"></script>`)
    .replace(/<script src="https:\/\/cdn\.jsdelivr[^"]+htm\.umd\.js"><\/script>/, `<script src="file://${NMD}/htm/dist/htm.umd.js"></script>`)
    .replace(/"lib\/react\.production/, `"file://${NMD}/react/umd/react.production`).replace(/"lib\/react-dom\.production/, `"file://${NMD}/react-dom/umd/react-dom.production`).replace(/"lib\/htm\.umd/, `"file://${NMD}/htm/dist/htm.umd`)
    .replace(/url\(fonts\//g, `url(file://${ROOT}/fonts/`)
    .replace(/"js\//g, `"file://${ROOT}/js/`);
  html = "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head><body style='margin:0'>" + html + "</body></html>";
  fs.mkdirSync(path.join(SP, "preview"), { recursive: true }); fs.writeFileSync(path.join(SP, "preview/index.html"), html);
  const browser = await chromium.launch({ executablePath: process.env.CHROME || "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell", args: ["--allow-file-access-from-files", "--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const sizes = (process.argv[2] || "1440x900,390x844").split(",");
  for (const sz of sizes) {
    const [w, h] = sz.split("x").map(Number);
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const errs = [];
    page.on("pageerror", (e) => errs.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
    if (process.env.HEURE) await page.clock.install({ time: new Date(process.env.HEURE) });
    await page.goto("file://" + path.join(SP, "preview/index.html"));
    if (process.env.HEURE) await page.clock.runFor(+(process.argv[3] || 2500)); else await page.waitForTimeout(+(process.argv[3] || 2500));
    if (process.env.SCRIPT) { await page.evaluate(process.env.SCRIPT); if (process.env.HEURE) await page.clock.runFor(+(process.env.APRES || 1500)); else await page.waitForTimeout(+(process.env.APRES || 1500)); }
    await page.screenshot({ path: path.join(SP, "out", `title_${w}x${h}${process.env.NOM ? "_" + process.env.NOM : ""}.png`) });
    console.log(sz, "errors:", errs.slice(0, 5).join(" | ") || "none");
    await page.close();
  }
  await browser.close();
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
