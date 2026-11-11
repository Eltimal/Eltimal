// Planche de contrôle des pièces (audience, garde à vue, parloir, cabinet) : node tools/shotsalles.js <minute> [échelle]
// Prérequis : node tools/shot.js (régénère tools/preview/index.html). Image : tools/out/salles_<minute>.png
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const SP = __dirname;
(async () => {
  fs.mkdirSync(path.join(SP, "out"), { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ["--allow-file-access-from-files"] });
  const minute = +(process.argv[2] || 600), sc = +(process.argv[3] || 2);
  const page = await browser.newPage({ viewport: { width: 1700, height: 1000 }, deviceScaleFactor: 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto("file://" + path.join(SP, "preview/index.html"));
  await page.waitForTimeout(800);
  await page.evaluate(([min, sc]) => {
    const CR = window.CR, D = CR.dec, L = (s, o) => CR.px.lookFrom(s, o);
    document.body.innerHTML = ""; document.body.style.cssText = "background:#111;margin:0;display:flex;flex-wrap:wrap;gap:6px;padding:6px;font:11px monospace;color:#ccc";
    const looks = { president: L("pr", { g: "f", skin: 0, hair: "bun", hc: "gray", glasses: 1, age: 58 }), parquet: L("pq", { g: "m", skin: 1, hair: "side", hc: "dkbrown", glasses: 1 }), client: L("cl", { g: "m", age: 24, skin: 4, hair: "afro", outfit: "hoodie", shirt: "#2f6b6b" }), you: Object.assign(L("vous", { g: "f", skin: 2, hair: "long", hc: "black", age: 29 }), { outfit: "robe" }), adverse: L("adv", { outfit: "robe", age: 52 }), opj: L("opj", { g: "m", skin: 3, hair: "buzz", outfit: "uniform", beard: 1 }), jures: [0, 1, 2, 3, 4, 5].map((i) => L("j" + i, { age: 25 + i * 8 })) };
    const cfg = [
      ["salle", 420, { camp: "defense", box: false }, "president", "", 3.2],
      ["salle", 420, { camp: "defense", box: true, adverse: true }, "you", "", 5.1],
      ["salle", 420, { camp: "pc", box: false, adverse: true }, "parquet", "", 2.2],
      ["salle", 420, { camp: "defense" }, null, "retire", 1.6],
      ["salle", 420, { camp: "defense" }, null, "attente", 1.0],
      ["salle", 420, { camp: "defense", box: true }, null, "retour", 1.5],
      ["assises", 440, { camp: "defense", box: true, jures: 6, rouge: true }, "president", "", 4.4],
      ["assises", 440, { camp: "pc", box: true, juges: 5, adverse: true }, "temoin", "", 3.3],
      ["salle", 200, { camp: "defense" }, "parquet", "", 2.0],
      ["cabinet_ji", 260, { camp: "defense", box: true }, "ji", "", 2.5],
      ["cabinet_ji", 260, { camp: "defense", adverse: true }, "client", "", 2.5],
      ["gav", 230, { gav: "geole" }, null, "", 2],
      ["gav", 230, { gav: "bureau" }, "opj", "", 2],
      ["gav", 230, { gav: "entretien" }, "client", "", 2],
      ["gav", 230, { gav: "pieces", print: true }, null, "", 2],
      ["gav", 230, { gav: "issue" }, "client", "", 2],
      ["parloir", 210, {}, "client", "", 2],
      ["rdv", 260, { unread: 2, files: 3 }, "client", "", 2],
    ];
    for (const [name, W, extra, speaker, court, t] of cfg) {
      const o = Object.assign({ min, rain: false, season: "automne", looks }, extra, { speaker, court });
      const S = D.layout(name, W, o), c = document.createElement("canvas"); c.width = W; c.height = D.H;
      c.style.cssText = `width:${W * sc}px;height:${D.H * sc}px;image-rendering:pixelated;display:block`;
      D.frame(S, c.getContext("2d"), 0, o); D.frame(S, c.getContext("2d"), t, o);
      const d = document.createElement("div"); d.append(`${name} ${extra.gav || ""} ${speaker || ""} ${court}`, c); document.body.append(d);
    }
  }, [minute, sc]);
  await page.screenshot({ path: path.join(SP, "out", `salles_${minute}.png`), fullPage: true });
  console.log("errors:", errs.join(" | ") || "none");
  await browser.close();
})();
