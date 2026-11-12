// Capture d'une pièce d'un vol par arrachage généré (refonte, lot 1), ouverte dans le dossier comme en jeu.
// node tools/shotpiece.js [texte du titre de la pièce] [graine] [LxH]   (après node tools/shot.js ; CHROME=… si besoin ;
// JOUR=30 : jour de partie des faits, 30 = 1er décembre 2026, procédure pénale numérique à Paris)
// ex. node tools/shotpiece.js "Notification" dmp 1440x1300 → tools/out/ui_piece_<graine>_<LxH>.png
const { execFileSync } = require("child_process");
const path = require("path");
const titre = process.argv[2] || "Interpellation", graine = process.argv[3] || "dmp", taille = process.argv[4] || "1440x1300";
const script = `window.GRAINE = ${JSON.stringify(graine)}; ${process.env.JOUR ? `s.day = ${+process.env.JOUR};` : ""}
const G = CR.GEN2; let t = null; for (let i = 0; i < 4000 && !t; i++) { const x = G.tirer(window.GRAINE + i, "ci", { day: s.day, inf: "vol" }); if (x && CR.SIM.supporte(x)) t = x; }
const p = { gen: 2, id: "g_ci_99", kind: "ci", day: s.day, niveau: CR.contenu(s), t, inf: t.inf }; G.prepare(p); s.generated = s.generated || []; s.generated.push(p);
const def = G.def(p); def.id = p.id; CR.CASES[p.id] = def; const cs = CR.openCase(s, p.id); cs.status = "active";
for (const k of Object.keys(def.docs)) CR.fileDoc(s, cs, { key: k, title: (def.docTitles || {})[k] || k });
CR.store.bump(); await sleep(200); await rail("Dossiers"); await sleep(200); document.querySelector(".case-card").click(); await sleep(400); await click(/^Pièces/); await sleep(300);
await click(${JSON.stringify(titre)}); await sleep(600);`;
execFileSync("node", [path.join(__dirname, "shotui.js"), taille, "piece_" + graine, script, "1500"], { stdio: "inherit" });
