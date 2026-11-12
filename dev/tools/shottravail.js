// Capture du dossier de travail (refonte, lot 2) : une comparution immédiate générée, quelques passages annotés
// (couleurs, note en marge, irrégularité en quatre éléments, chronologie, versions), la pièce puis l'onglet de travail.
// node tools/shottravail.js [pieces|plan|chrono|versions|extraits] [LxH]   (après node tools/shot.js)
// SANSFENETRE=1 : la pièce sans la fenêtre d'annotation, centrée sur la note en marge
// → tools/out/ui_travail_<vue>_<LxH>.png
const { execFileSync } = require("child_process");
const path = require("path");
const vue = process.argv[2] || "pieces", taille = process.argv[3] || "1440x1100";
const script = `window.SANSFENETRE = ${process.env.SANSFENETRE ? "true" : "false"}; const G = CR.GEN2, T = CR.TRAV; let t = null;
for (let i = 0; i < 3000 && !t; i++) { let x; try { x = G.tirer("ttr" + i, "ci", { day: s.day, inf: "vol" }); } catch (e) { continue; } if (x && x.irr.includes("gav_notif") && x.V && CR.SIM.supporte(x) && !CR.SIM.arrachage(x)) t = x; }
const p = { gen: 2, id: "g_ci_99", kind: "ci", day: s.day, niveau: CR.contenu(s), t, inf: t.inf }; G.prepare(p); s.generated = s.generated || []; s.generated.push(p);
const def = G.def(p); def.id = p.id; CR.CASES[p.id] = def; const cs = CR.openCase(s, p.id); cs.status = "active";
for (const k of Object.keys(def.docs)) CR.fileDoc(s, cs, { key: k, title: (def.docTitles || {})[k] || k });
const lire = (d) => { const r = CR.renderDoc(s, cs, d); return Object.assign({}, r, { paras: CR.UI.segmentize(r.paras), ref: { doc: d.id, key: d.key, titre: d.title } }); };
const dN = cs.docs.find((d) => d.key === "pv_notification"), N = lire(dN), NA = CR.UI.docAnnot(N);
let fl = null; N.paras.forEach((par, pi) => par.forEach((g, si) => { if (!fl && g && g.flag === "gav_notif") fl = { pi, si, g }; }));
const a1 = T.annoter(s, cs, { doc: NA, ref: N.ref, debut: { p: fl.pi, s: fl.si, o: 0 }, fin: { p: fl.pi, s: fl.si, o: fl.g.t.indexOf(",") }, coul: "procedure", note: "Notifiés près de trois heures après le placement : art. 63-1, « immédiatement »." });
let deb = null; N.paras.forEach((par, pi) => par.forEach((g, si) => { if (!deb && g && g.f === "G_debut") deb = { pi, si, g }; }));
const a2 = T.annoter(s, cs, { doc: NA, ref: N.ref, debut: { p: deb.pi, s: deb.si, o: deb.g.t.indexOf("avec effet") }, fin: { p: deb.pi, s: deb.si, o: deb.g.t.length - 1 }, coul: "procedure" });
const mot = N.paras.findIndex((par) => par.some((g) => typeof g === "string" && /^Motifs/.test(g)));
if (mot >= 0) T.annoter(s, cs, { doc: NA, ref: N.ref, debut: { p: mot, s: 0, o: 0 }, fin: { p: mot, s: 0, o: 40 }, coul: "verifier" });
const dV = cs.docs.find((d) => d.key === "pv_victime"); let a3 = null;
if (dV) { const V = lire(dV), VA = CR.UI.docAnnot(V); const pi = V.paras.findIndex((par) => par.some((g) => (typeof g === "string" ? g : g.t || "").startsWith("«"))); if (pi >= 0) a3 = T.annoter(s, cs, { doc: VA, ref: V.ref, debut: { p: pi, s: 0, o: 0 }, fin: { p: pi, s: 0, o: 60 }, coul: "charge", note: "Ne dit pas avoir vu le geste." }); }
T.relever(s, cs, { annot: a1.id, avec: a2.id, article: "63-1", regime: "presume", grief: "aveux" });
T.placer(s, cs, { annot: a2.id, jour: s.day, heure: 9 * 60 + 5, libelle: "Placement en garde à vue" });
T.placer(s, cs, { annot: a1.id, jour: s.day, heure: 11 * 60 + 58, libelle: "Notification des droits" });
T.placer(s, cs, { jour: s.day, heure: 14 * 60 + 30, libelle: "Audition" });
T.moyen(s, cs, { col: "fond", titre: "Le vol n'est pas établi : personne n'a vu le geste", annots: a3 ? [a3.id] : [] });
T.moyen(s, cs, { col: "peine", titre: "Garanties de représentation : emploi, domicile", annots: [] });
const pt = T.point(cs, "Qui a vu le geste"); if (a3) T.version(cs, { point: pt.id, qui: "victime", annot: a3.id }); T.version(cs, { point: pt.id, qui: "policiers", annot: a2.id });
T.onglet(cs, dN.id);
CR.store.bump(); await sleep(200); await rail("Dossiers"); await sleep(200); document.querySelector(".case-card").click(); await sleep(400);
${vue === "pieces" ? `await click(/^Pièces/); await sleep(300); await click(dN.title); await sleep(500); if (!window.SANSFENETRE) { const sg = document.querySelector('.docview .seg[data-p="' + mot + '"]'); if (sg) sg.click(); await sleep(300); } const vu = document.querySelector(window.SANSFENETRE ? ".docview .an-marge" : ".pv-bandeau"); if (vu) vu.scrollIntoView({ block: "center" });`
  : `await click(/^Dossier de travail/); await sleep(300); await click(${JSON.stringify({ plan: "Plan de défense", chrono: "Chronologie", versions: "Versions", extraits: "Extraits" }[vue] || "Extraits")}); await sleep(300);`}`;
execFileSync("node", [path.join(__dirname, "shotui.js"), taille, "travail_" + vue, script, "1200"], { stdio: "inherit" });
