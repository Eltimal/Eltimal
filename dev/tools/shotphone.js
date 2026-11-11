// Version téléphone : trois écrans d'iPhone en vertical (390 × 844, densité 2) — bureau, entretien avec le carnet
// ouvert, audience — et une planche qui les met côte à côte. node tools/shotphone.js [nom]
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const SP = __dirname;
(async () => {
  const name = process.argv[2] || "telephone";
  fs.mkdirSync(path.join(SP, "out"), { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ["--allow-file-access-from-files"] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(String(e))); page.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL/.test(m.text())) errs.push(m.text()); });
  await page.goto("file://" + path.join(SP, "preview/index.html"));
  await page.waitForTimeout(500);
  const run = (script) => page.evaluate(async (script) => {
    const CR = window.CR, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const txt = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();
    const click = async (re) => { const b = [...document.querySelectorAll("button")].find((x) => (re instanceof RegExp ? re.test(txt(x)) : txt(x).includes(re)) && !x.disabled); if (b) b.click(); await sleep(150); return !!b; };
    const rail = async (n) => { const b = [...document.querySelectorAll(".rail-btn")].find((x) => txt(x).startsWith(n)); if (b) b.click(); await sleep(150); };
    await eval("(async () => {" + script + "})()");
  }, script);
  const shots = [];
  const shot = async (k) => { await page.waitForTimeout(900); const f = path.join(SP, "out", `phone_${k}.png`); await page.screenshot({ path: f }); shots.push(f); };
  // 1. le bureau
  await run(`await click("Nouvelle partie"); await click(/^Carrière/); await sleep(300); const s = CR.store.s; s.settings.coach = false; s.cash = 20000; s.min = 19 * 60 + 40; CR.store.bump(); await sleep(150); for (let i = 0; i < 4; i++) { if (!(await click("Ranger la fiche au classeur"))) break; }`);
  await shot("bureau");
  // 2. un entretien : trois questions posées, le carnet ouvert en panneau
  await run(`const s = CR.store.s; s.pending = s.pending.filter((e) => e.type !== "lead"); CR.GEN.lead(s, s.day, "copj"); const cs = s.cases[s.order[0]]; window.__cs = cs.id; CR.UI._setScene({ type: "call", caseId: cs.id, call: "intake" }); CR.store.bump(); await sleep(300);
    for (let i = 0; i < 3; i++) { const q = document.querySelector(".q-btn"); if (q) { q.click(); await sleep(250); } const sk = [...document.querySelectorAll("button.link")].find((b) => /toute la réponse/.test(txt(b))); if (sk) { sk.click(); await sleep(120); } }
    for (const seg of [...document.querySelectorAll(".call-scene .noteable")].slice(0, 3)) { seg.click(); await sleep(60); }
    const fab = document.querySelector(".dside-fab"); if (fab) fab.click(); await sleep(200);`);
  await shot("entretien");
  // 3. l'audience : la salle, la transcription, les choix
  await run(`const s = CR.store.s, cs = s.cases[window.__cs]; const fab = document.querySelector(".dside-close"); if (fab) fab.click(); CR.UI._setScene(null); await sleep(150);
    const def = CR.caseDef(cs), key = Object.keys(def.audiences || {})[0]; cs.hearings.push({ id: "hx", day: s.day, min: s.min, title: "Tribunal correctionnel de Paris", lieu: "palais", script: key, duree: 60 }); s.at = "palais";
    CR.UI._setScene({ type: "court", caseId: cs.id, hid: "hx" }); CR.store.bump(); await sleep(400);
    for (let i = 0; i < 6; i++) { const b = [...document.querySelectorAll(".court-scene button")].find((x) => /Continuer|Suivant|→/.test(txt(x)) && !x.disabled); if (!b) break; b.click(); await sleep(300); }
    window.scrollTo(0, 0);`);
  await shot("audience");
  // planche
  const html = `<body style="margin:0;background:#111;display:flex;gap:16px;padding:16px">${shots.map((f) => `<img src="data:image/png;base64,${fs.readFileSync(f).toString("base64")}" style="width:390px;height:844px;border-radius:18px;box-shadow:0 0 0 2px #333">`).join("")}</body>`;
  const sheet = await browser.newPage({ viewport: { width: 16 + shots.length * 406, height: 876 }, deviceScaleFactor: 2 });
  await sheet.setContent(html); await sheet.waitForTimeout(400);
  await sheet.screenshot({ path: path.join(SP, "out", `${name}.png`) });
  console.log("errors:", errs.join(" | ") || "none");
  await browser.close();
})();
