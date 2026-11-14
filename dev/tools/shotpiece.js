// Capture d'une pièce d'un vol par arrachage généré (refonte, lot 1), ouverte dans le dossier comme en jeu.
// node tools/shotpiece.js [texte du titre de la pièce] [graine] [LxH]   (après node tools/shot.js ; CHROME=… si besoin ;
// SCENE=magasin (avec PREUVE=video) : une scène du vol ; JOUR=30 : jour de partie des faits, 30 = 1er décembre 2026, procédure pénale numérique à Paris)
// ex. node tools/shotpiece.js "Notification" dmp 1440x1300 ; titre LECTEUR : le dossier en feuillets (PIECE=n : n-ième pièce)
// ex. node tools/shotpiece.js "Notification" dmp 1440x1300 → tools/out/ui_piece_<graine>_<LxH>.png
const { execFileSync } = require("child_process");
const path = require("path");
const titre = process.argv[2] || "Interpellation", graine = process.argv[3] || "dmp", taille = process.argv[4] || "1440x1300";
const script = `window.GRAINE = ${JSON.stringify(graine)}; window.FAMILLE = ${JSON.stringify(process.env.FAMILLE || "")}; window.PREUVE = ${JSON.stringify(process.env.PREUVE || "")}; window.SCENE = ${JSON.stringify(process.env.SCENE || "")}; ${process.env.JOUR ? `s.day = ${+process.env.JOUR};` : ""}
const G = CR.GEN2; let t = null; for (let i = 0; i < 4000 && !t; i++) { const x = G.tirer(window.GRAINE + i, "ci", { day: s.day, inf: window.FAMILLE || "vol" }); if (x && CR.SIM.supporte(x) && (!window.SCENE || (x.f && x.f.sc === window.SCENE && x.flagrance && (!window.PREUVE || x.preuves.includes(window.PREUVE)))) && (!window.FAMILLE || x.inf === window.FAMILLE) && (!window.FAMILLE || x.preuves.includes(window.PREUVE || "certificat")) && (!window.FAMILLE || x.inf !== "violences" || CR.SIM.violencesOK(x))) t = x; }
const p = { gen: 2, id: "g_ci_99", kind: "ci", day: s.day, niveau: CR.contenu(s), t, inf: t.inf }; G.prepare(p); s.generated = s.generated || []; s.generated.push(p);
const def = G.def(p); def.id = p.id; CR.CASES[p.id] = def; const cs = CR.openCase(s, p.id); cs.status = "active";
for (const k of Object.keys(def.docs)) CR.fileDoc(s, cs, { key: k, title: (def.docTitles || {})[k] || k });
CR.store.bump(); await sleep(200); await rail("Dossiers"); await sleep(200); document.querySelector(".case-card").click(); await sleep(400); await click(/^Pièces/); await sleep(300);
${titre === "LECTEUR" ? `await click(/Lire en feuillets/); await sleep(800); for (let k = 0; k < ${+process.env.PIECE || 0}; k++) { window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" })); await sleep(120); }` : `await click(${JSON.stringify(titre)}); await sleep(600);`}`;
execFileSync("node", [path.join(__dirname, "shotui.js"), taille, "piece_" + graine, script, "1500"], { stdio: "inherit" });
