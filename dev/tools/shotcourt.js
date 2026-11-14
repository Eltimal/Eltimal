// (JURES=9 : neuf jurés aux assises)
// Capture d'une audience dans l'interface : node tools/shotcourt.js <LxH> <genre> <décor> <minute> <attente ms> [délibéré 0|1]
// <genre> : genre de l'affaire générée (ci, copj, op, pc…) ; ex. node tools/shotcourt.js 1440x900 ci salle 1290 4000   (prérequis : node tools/shot.js pour régénérer preview/)
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const SP = __dirname;
(async () => {
  const [w, h] = (process.argv[2] || "1440x900").split("x").map(Number);
  const caseId = process.argv[3] || "ci", scene = process.argv[4] || "salle", minute = +(process.argv[5] || 1290), wait = +(process.argv[6] || 4000), del = process.argv[7] === "1";
  const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ["--allow-file-access-from-files", "--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: process.env.DPR ? +process.env.DPR : 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e))); page.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL/.test(m.text())) errs.push(m.text()); });
  await page.goto("file://" + path.join(SP, "preview/index.html"));
  await page.waitForTimeout(600);
  await page.evaluate(([caseId, scene, minute, del, NJ]) => {
    const CR = window.CR, UI = CR.UI, html = UI.html;
    const s = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 7 }));
    s.settings.coach = false; s.min = minute;
    const cs = CR.GEN.open(s, caseId, {}); // une affaire générée du genre demandé
    const steps = [
      { who: "huissier", t: "Affaire suivante, numéro douze du rôle." },
      { who: "president", t: "Monsieur, levez-vous. Vous êtes poursuivi pour vol à l'arraché, rue de la Chapelle, le 3 au soir. Reconnaissez-vous les faits ?" },
      { who: "client", t: "Non, madame la présidente. Je passais par là." },
      { who: "parquet", t: "Le ministère public requiert huit mois d'emprisonnement et le maintien en détention." },
    ].concat(del ? [{ delibere: { hook: () => ({ titre: "Jugement", dispositif: "Le tribunal relaxe le prévenu des fins de la poursuite." }) } }] : [{ choose: [{ t: "Plaider la relaxe" }, { t: "Plaider une peine aménageable" }], prompt: "À vous, maître." }]);
    document.getElementById("app").style.display = "none";
    const root = document.createElement("div"); root.className = "game"; root.style.padding = "12px"; document.body.append(root);
    ReactDOM.render(html`<${UI.AudienceScene} s=${s} cs=${cs} steps=${steps} title="23e chambre correctionnelle" sub="Comparutions immédiates" decor=${{ scene, box: scene === "salle", jures: scene === "assises" ? NJ : 0, jureLooks: scene === "assises" ? Array.from({ length: NJ }, (_, i) => CR.px.lookFrom("jj" + i)) : null }} onEnd=${() => {}} />`, root);
  }, [caseId, scene, minute, del, +(process.env.JURES || 6)]);
  await page.waitForTimeout(wait);
  await page.screenshot({ path: path.join(SP, "out", `court_${scene}_${w}x${h}${del ? "_del" : ""}.png`) });
  console.log("errors:", errs.join(" | ") || "none");
  await browser.close();
})();
