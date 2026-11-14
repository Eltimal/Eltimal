// Sortie 1.0 — le jeu dans un vrai navigateur (Chromium) : sauvegardes IndexedDB, scènes atomiques, pause, garde-fou d'erreur.
// Reproduit les anomalies de l'audit du 14 novembre 2026 : B1 (audience quittée par le menu : dossier jamais jugé), B2
// (quota, échec muet, pas d'export), B3 (fichier abîmé : écran blanc), M1 (progression perdue à la fermeture), M2 (nouvelle
// partie qui écrase), M3 (fin de carrière annulable), M4 (scène fantôme après chargement), M5 (pas de pause en audience).
// Usage : CHROME=/chemin/vers/chrome node tests/tnavigateur.js   (sans CHROME : le Chromium de Playwright)
const path = require("path"), fs = require("fs"), os = require("os");
const { chromium } = require("playwright");
const URL_JEU = "file://" + path.resolve(__dirname, "..", "..", "index.html");
let echecs = 0;
const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d !== undefined ? " — " + JSON.stringify(d).slice(0, 400) : "")); } };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push("pageerror: " + e.message.slice(0, 300)));
  p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 300)); });
  const titre = async () => { await p.goto(URL_JEU); await p.waitForSelector(".ts-title"); await p.waitForFunction(() => window.CR.Saves.backend !== "none" && window.CR.Saves.pret); await p.evaluate(() => window.CR.Saves.pret); await p.waitForTimeout(250); };
  const menuTitre = () => p.evaluate(() => [...document.querySelectorAll(".ts-menu .ts-btn")].map((x) => x.textContent.trim()).join(" | "));
  const nouvelle = async (nom) => { await p.click("text=Nouvelle partie"); await p.fill("#nc-nom", nom); await p.click("text=Carrière — à votre compte"); await p.waitForSelector(".hud"); await p.evaluate(() => { window.CR.store.s.settings.coach = false; window.CR.store.bump(); }); await p.waitForTimeout(300); };
  const etat = () => p.evaluate(() => { const s = window.CR.store.s; return s ? { day: s.day, min: s.min, nom: s.player.nom, over: s.gameOver && s.gameOver.reason, duty: s.duty.length, unread: window.CR.unreadCount(s), agenda: s.agenda.length } : null; });
  const vivant = () => p.evaluate(() => !!(document.getElementById("app") && document.getElementById("app").firstChild));

  await titre();
  ok((await p.evaluate(() => window.CR.Saves.backend)) === "idb", "B2 : le rangement de l'appareil n'est pas IndexedDB");
  ok((await p.evaluate(() => document.documentElement.lang)) === "fr", "la page ne déclare pas sa langue");

  // ---------- M1 : actions au bureau, fermeture immédiate, reprise
  await nouvelle("Premier");
  await p.evaluate(() => { const CR = window.CR, s = CR.store.s; for (const m of s.inbox.slice()) CR.readMail(s, m.id); CR.signDuty(s, 3, "gav_jour"); CR.addAgenda(s, { day: 5, title: "test" }); CR.store.bump(); });
  await p.click("text=Paperasse"); await p.click("text=Paperasse");
  const avant = await etat();
  await titre(); // rechargement sans attendre : la fermeture ne doit rien perdre
  ok(/^Reprendre/.test(await menuTitre()), "M1 : pas de « Reprendre » après fermeture", await menuTitre());
  await p.click("text=Reprendre"); await p.waitForSelector(".hud");
  ok(JSON.stringify(await etat()) === JSON.stringify(avant), "M1 : progression perdue à la fermeture", { avant, apres: await etat() });

  // ---------- M2 : une nouvelle partie n'écrase pas la carrière en cours
  await p.evaluate(async () => { const CR = window.CR; CR.endDay(CR.store.s); CR.endDay(CR.store.s); await CR.autosave(); });
  await titre(); await nouvelle("Second"); await p.waitForTimeout(400);
  await titre();
  ok(/Charger une partie/.test(await menuTitre()), "M2 : la carrière précédente n'est pas gardée", await menuTitre());
  await p.click("text=Charger une partie");
  ok(await p.evaluate(() => [...document.querySelectorAll(".save-list li")].some((x) => /Partie précédente/.test(x.textContent) && /Premier/.test(x.textContent))), "M2 : « Partie précédente » ne contient pas la première carrière");
  await p.evaluate(() => [...document.querySelectorAll(".save-list li")].find((x) => /Partie précédente/.test(x.textContent)).querySelector("button").click());
  await p.waitForSelector(".hud");
  ok((await etat()).nom === "Premier" && (await etat()).day === 2, "M2 : la partie précédente ne se recharge pas", await etat());

  // ---------- M3 : la fin de carrière est enregistrée
  await p.evaluate(() => { const CR = window.CR; CR.endGame(CR.store.s, "radie", "test"); CR.store.bump(); });
  await p.waitForSelector(".career-end"); await p.waitForTimeout(1100);
  await p.click("text=Retour à l'écran titre"); await p.waitForSelector(".ts-title"); await p.waitForTimeout(300);
  ok(/Revoir la fin de carrière/.test(await menuTitre()) && !/^Reprendre/.test(await menuTitre()), "M3 : la fin de carrière n'est pas enregistrée", await menuTitre());
  await p.click("text=Revoir la fin de carrière"); await p.waitForSelector(".career-end");
  ok((await etat()).over === "radie", "M3 : « Reprendre » rend une partie d'avant la radiation", await etat());

  // ---------- B1, M4, M5 : une audience, le menu, quitter, reprendre
  await titre(); await nouvelle("Audience");
  await p.evaluate(() => {
    const CR = window.CR, s = CR.store.s; s.pending = s.pending.filter((e) => e.type !== "lead");
    const cs = CR.GEN.open(s, "copj", {}); cs.status = "active"; cs.engaged = s.day;
    const t = s.generated.find((x) => x.id === cs.id).t;
    CR.PROC.fixAudience(CR.api(s, cs), { day: s.day, min: s.min + 20, juridiction: "tc", mode: "convocation", convocDay: s.day, president: t.pres, script: "tc", done: "apresTC", onMiss: "_absent", title: "Audience — test", duree: 60 });
    s.at = "palais"; window.__cid = cs.id; CR.store.bump();
  });
  await p.evaluate(async () => { await window.CR.autosave(); });
  const aud = () => p.evaluate(() => { const CR = window.CR, s = CR.store.s, cs = s.cases[window.__cid], h = cs && cs.hearings[0]; return { min: s.min, statut: cs && cs.status, attended: h && h.attended, missed: h && h.missed, issue: cs && cs.outcome && cs.outcome.type, scene: !!document.querySelector(".scene-host"), menu: !!document.querySelector(".menu-grid") }; });
  const allerAudience = async () => { await p.evaluate(() => [...document.querySelectorAll(".rail-btn")].find((x) => /Bureau/.test(x.textContent)).click()); await p.click("text=Y aller"); await p.waitForTimeout(500); const tr = await p.$(".modal .decide-opt"); if (tr) await tr.click(); await p.waitForSelector(".court-scene, .aud-scene, .scene-host canvas", { timeout: 15000 }); await p.waitForTimeout(700); };
  await allerAudience();
  ok((await aud()).attended === true && (await aud()).scene, "l'audience n'a pas commencé", await aud());
  // M5 : le bouton de pause est atteignable à la souris (rien ne le recouvre), Échap ouvre le menu, l'audience se suspend
  const dessus = await p.evaluate(() => { const b = document.querySelector(".scene-pause"); if (!b) return "absent"; const r = b.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return e === b || b.contains(e) ? "ok" : (e && e.className) || "autre"; });
  ok(dessus === "ok", "M5 : le bouton de pause est recouvert ou absent", dessus);
  await p.mouse.click(1440 - 14 - 20, 30); await p.waitForTimeout(400);
  ok((await aud()).menu, "M5 : le clic sur le bouton de pause n'ouvre pas le menu");
  const lu = () => p.evaluate(() => (document.querySelector(".scene-host") || document.body).innerText.length);
  const l0 = await lu(); await p.waitForTimeout(2500); const l1 = await lu();
  ok(l1 === l0, "M5 : l'audience continue pendant la pause", { l0, l1 });
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  ok(!(await aud()).menu, "Échap ne referme pas le menu");
  await p.waitForTimeout(2500); const l2 = await lu();
  ok(l2 !== l1, "l'audience ne reprend pas après la pause", { l1, l2 });
  await p.keyboard.press("Escape"); await p.waitForTimeout(400);
  ok((await aud()).menu, "M5 : Échap n'ouvre pas le menu pendant l'audience");
  if (!(await aud()).menu) { await p.click(".scene-pause"); await p.waitForSelector(".menu-grid"); }
  // B1 : enregistrer dans un emplacement en pleine audience, puis quitter par le menu
  await p.click("text=Emplacement 2"); await p.waitForTimeout(500);
  await p.click("text=Retour à l'écran titre"); await p.click("text=Quitter (partie enregistrée)"); await p.waitForSelector(".ts-title");
  // M4 : même séance, « Reprendre » : pas de scène fantôme
  await p.click("text=Reprendre"); await p.waitForSelector(".hud"); await p.waitForTimeout(500);
  let a = await aud();
  ok(!a.scene, "M4 : la scène d'audience s'est rouverte seule après le retour au titre", a);
  ok(a.attended === false, "B1 : l'audience quittée est enregistrée comme tenue (sauvegarde automatique)", a);
  // relance de l'application
  await titre(); await p.click("text=Reprendre"); await p.waitForSelector(".hud"); await p.evaluate(() => { window.__cid = "g_copj_1"; });
  a = await aud();
  ok(a.attended === false && a.statut === "active", "B1 : après relance, l'audience est tenue sans jugement", a);
  // l'emplacement 2, écrit en pleine audience, contient l'état d'avant l'audience
  const e2 = await p.evaluate(async () => { const st = await window.CR.Saves.load("2"); const cs = st.cases["g_copj_1"]; return { attended: cs.hearings[0].attended, statut: cs.status }; });
  ok(e2.attended === false, "B1 : l'emplacement écrit en pleine audience contient une audience tenue sans jugement", e2);
  // le dossier est bien jugé : soit on y retourne, soit l'audience se tient sans l'avocat
  const fin = await p.evaluate(() => { const CR = window.CR, s = CR.store.s; for (let i = 0; i < 120; i++) { s.cash = 20000; CR.endDay(s); } const cs = s.cases["g_copj_1"]; return { statut: cs.status, issue: cs.outcome && cs.outcome.type }; });
  ok(fin.statut === "closed" && !!fin.issue, "B1 : le dossier n'est jamais jugé", fin);

  // ---------- M4 : charger un emplacement pendant une scène remet l'interface à zéro
  await titre(); await nouvelle("Fantome");
  await p.evaluate(async () => {
    const CR = window.CR, s = CR.store.s; s.pending = s.pending.filter((e) => e.type !== "lead");
    let d = 1; while (!CR.isBusinessDay(d)) d++; CR.signDuty(s, d, "gav_jour"); while (s.day < d) CR.endDay(s);
    await CR.Saves.save("1", s);
    let g = 0; while (!s.ring && g++ < 80 && s.min < 19 * 60) CR.spend(s, 10, "admin"); CR.store.bump();
  });
  await p.waitForTimeout(300);
  if (await p.$("text=Répondre")) {
    await p.click("text=Répondre"); await p.waitForSelector(".call-scene"); await p.waitForTimeout(500);
    await p.keyboard.press("Escape"); await p.waitForSelector(".menu-grid");
    await p.evaluate(() => [...document.querySelectorAll(".save-list li")].find((x) => /Emplacement 1/.test(x.textContent)).querySelector("button").click());
    await p.waitForTimeout(900);
    ok(!(await p.$(".scene-host")) && !(await p.$(".menu-grid")), "M4 : scène ou menu resté ouvert après le chargement");
    // la permanence rappelle : la scène ne doit pas s'ouvrir sans qu'on réponde
    await p.evaluate(() => { const CR = window.CR, s = CR.store.s; let g = 0; while (!s.ring && g++ < 80 && s.min < 19 * 60) CR.spend(s, 10, "admin"); CR.store.bump(); });
    await p.waitForTimeout(500);
    ok(!(await p.$(".scene-host")), "M4 : une scène fantôme s'ouvre seule après le chargement");
  } else ok(false, "M4 : la permanence n'a pas sonné (test à revoir)");

  // ---------- B2 : une très grosse partie s'enregistre ; un échec est dit ; l'export produit un fichier relisible
  const gros = await p.evaluate(async () => {
    const CR = window.CR, s = CR.store.s; s.log = []; s.world.lest = "x".repeat(9 * 1024 * 1024);
    const t0 = performance.now(); const okk = await CR.Saves.save("3", s); const ms = Math.round(performance.now() - t0);
    const relu = await CR.Saves.load("3"); const place = await CR.Saves.place();
    delete s.world.lest; return { okk, ms, relu: !!(relu && relu.world.lest && relu.world.lest.length === 9 * 1024 * 1024), place };
  });
  ok(gros.okk && gros.relu, "B2 : une partie de 9 Mo ne s'enregistre pas ou ne se relit pas", gros);
  ok(!gros.place || gros.place.pris < gros.place.quota * 0.5, "B2 : plus de la moitié de la place de l'appareil est prise", gros.place);
  await p.evaluate(async () => { await window.CR.Saves.remove("3"); });
  const echec = await p.evaluate(async () => {
    const CR = window.CR, S = CR.Saves, s = CR.store.s; const vrai = S._ecrire;
    S._ecrire = async function () { this.echec = { at: Date.now() }; return false; };
    s.cash += 1; const r = await CR.autosave(); S._ecrire = vrai; await new Promise((x) => setTimeout(x, 300));
    return { r, toast: [...document.querySelectorAll(".toast")].map((x) => x.textContent).join(" | ") };
  });
  ok(echec.r === false && /n'a pas pu être enregistrée/.test(echec.toast), "B2 : l'échec d'enregistrement n'est pas dit au joueur", echec);
  await p.keyboard.press("Escape"); await p.waitForSelector(".menu-grid");
  const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 15000 }).catch(() => null), p.click("text=Exporter un fichier de sauvegarde")]);
  ok(!!dl, "B2 : l'export ne produit aucun fichier");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lp-nav-"));
  let fichier = null;
  if (dl) { fichier = path.join(dir, dl.suggestedFilename()); await dl.saveAs(fichier); ok(/^la-permanence-.*\.json$/.test(dl.suggestedFilename()) && JSON.parse(fs.readFileSync(fichier, "utf8")).player.nom === "Fantome", "B2 : le fichier exporté n'est pas la partie"); }

  // ---------- B3 : fichiers abîmés importés depuis l'écran titre : un message, jamais d'écran blanc
  const hostiles = { "minimal.json": '{"player":{"prenom":"x"}}', "vide.json": "{}", "tableau.json": "[]", "nul.json": "null", "texte.json": "bonjour", "tronque.json": fichier ? fs.readFileSync(fichier, "utf8").slice(0, 2000) : "{", "binaire.json": "\u0000\u0001\u0002", "types.json": fichier ? JSON.stringify(Object.assign(JSON.parse(fs.readFileSync(fichier, "utf8")), { cash: "beaucoup" })) : "{}", "futur.json": fichier ? JSON.stringify(Object.assign(JSON.parse(fs.readFileSync(fichier, "utf8")), { v: 99 })) : "{}", "sansdossiers.json": fichier ? JSON.stringify(Object.assign(JSON.parse(fs.readFileSync(fichier, "utf8")), { cases: null })) : "{}" };
  await titre();
  for (const [nom, contenu] of Object.entries(hostiles)) {
    const f = path.join(dir, nom); fs.writeFileSync(f, contenu);
    await p.setInputFiles('input[type="file"]', f); await p.waitForTimeout(350);
    const r = await p.evaluate(() => ({ titre: !!document.querySelector(".ts-title"), msg: (document.querySelector(".ts-menu-wrap .warn-txt") || {}).textContent || "", partie: !!window.CR.store.s }));
    ok((await vivant()) && r.titre && !r.partie && r.msg.length > 10, "B3 : fichier « " + nom + " » mal refusé", r);
  }
  // le fichier exporté, lui, se réimporte
  if (fichier) { await p.setInputFiles('input[type="file"]', fichier); await p.waitForSelector(".hud", { timeout: 8000 }).catch(() => {}); ok((await etat()) && (await etat()).nom === "Fantome", "B3 : le fichier exporté ne se réimporte pas", await etat()); }
  // garde-fou : une erreur de rendu affiche l'écran d'erreur, n'écrase pas la sauvegarde, et l'on revient au titre
  errs.length = 0;
  await p.evaluate(async () => { const CR = window.CR; await CR.autosave(); CR.store.s.reps = null; CR.store.bump(); });
  await p.waitForSelector(".panne", { timeout: 5000 }).catch(() => {});
  ok(!!(await p.$(".panne")), "B3 : une erreur de rendu ne montre pas l'écran d'erreur");
  await p.waitForTimeout(1200);
  const intacte = await p.evaluate(async () => { try { const st = await window.CR.Saves.load("auto"); return !!(st && st.reps && st.player.nom === "Fantome"); } catch (e) { return false; } });
  ok(intacte, "B3 : la sauvegarde automatique a été écrasée par l'état en erreur");
  await p.click("text=Revenir à l'écran titre"); await p.waitForSelector(".ts-title");
  errs.length = 0; // les erreurs provoquées par le test du garde-fou ne comptent pas
  await p.click("text=Reprendre"); await p.waitForSelector(".hud");
  ok((await etat()).nom === "Fantome", "B3 : la partie ne se reprend pas après l'erreur");

  // ---------- migration : une partie de l'ancien rangement (localStorage) est reprise dans IndexedDB
  await p.evaluate(async () => { const CR = window.CR, s = CR.store.s; const j = CR.serialize(s); const m = CR.saveMeta(s); m.nom = "Ancienne Partie"; localStorage.setItem(CR.SAVE_KEY, JSON.stringify({ 7: { meta: m, json: j } })); });
  await titre();
  ok(await p.evaluate(async () => { const l = await window.CR.Saves.list(); return l.some((x) => x.slot === "7" && x.where === "idb") && !localStorage.getItem(window.CR.SAVE_KEY); }), "migration : l'ancienne partie n'est pas passée dans IndexedDB");

  if (errs.length) { echecs++; console.log("  ✗ erreurs : " + errs.slice(0, 4).join(" | ")); }
  await b.close();
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
