// Sortie 1.0 — sauvegardes et intégrité (sans navigateur : repli sur localStorage ; IndexedDB est couvert par tnavigateur).
// B3 : un fichier qui n'est pas une partie est refusé avec un message, jamais chargé à moitié ; version plus récente refusée ;
// champs secondaires absents remis à neuf. Définitions d'affaires toujours reconstruites au chargement (les identifiants
// se répètent d'une partie à l'autre). B2 : un échec d'écriture est signalé. M3 : la fin de carrière s'enregistre.
const { boot, sleep, texts } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d !== undefined ? " — " + String(typeof d === "string" ? d : JSON.stringify(d)).slice(0, 300) : "")); } };
  const { w, CR, doc, errors } = boot(); await sleep(200);
  const app = () => doc.getElementById("app");
  const neuve = (seed) => { const s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed }); s.pending = s.pending.filter((e) => e.type !== "lead"); return s; };
  const base = () => JSON.parse(CR.serialize(neuve(1)));
  const refuse = (json) => { try { CR.deserialize(json); return null; } catch (e) { return e; } };

  // ---------- fichiers refusés
  const mauvais = {
    "minimal": '{"player":{"prenom":"x"}}', "vide": "{}", "tableau": "[]", "nul": "null", "texte": "bonjour", "nombre": "42", "tronqué": CR.serialize(neuve(1)).slice(0, 500),
    "argent en texte": JSON.stringify(Object.assign(base(), { cash: "beaucoup" })), "jour nul": JSON.stringify(Object.assign(base(), { day: null })), "jour négatif": JSON.stringify(Object.assign(base(), { day: -3 })),
    "heure folle": JSON.stringify(Object.assign(base(), { min: 99999 })), "sans dossiers": JSON.stringify(Object.assign(base(), { cases: null })), "ordre en texte": JSON.stringify(Object.assign(base(), { order: "abc" })),
    "réputations absentes": (() => { const j = base(); delete j.reps; return JSON.stringify(j); })(), "réputation NaN": JSON.stringify(Object.assign(base(), { reps: { clients: null, confreres: 1, siege: 1, parquet: 1 } })),
    "version future": JSON.stringify(Object.assign(base(), { v: 99 })), "dossier sans définition": JSON.stringify(Object.assign(base(), { cases: { x: { status: "active" } }, order: ["x"] })),
    "dossier fantôme dans l'ordre": JSON.stringify(Object.assign(base(), { order: ["inconnu"] })), "comptes absents": (() => { const j = base(); delete j.decouvert; return JSON.stringify(j); })(),
  };
  for (const [k, json] of Object.entries(mauvais)) { const e = refuse(json); ok(e && (e.refus || e.perime) && e.message.length > 20, "fichier « " + k + " » accepté ou refusé sans message", e ? e.message : "accepté"); }
  ok(/plus récente/.test((refuse(mauvais["version future"]) || {}).message || ""), "la version plus récente n'est pas nommée");
  // ---------- champs secondaires absents : la partie se charge, s'affiche et avance
  { const j = base(); for (const k of ["inbox", "voicemails", "agenda", "settings", "flags", "seen", "duty", "detenus", "classeur", "ledger", "log", "carpaBy", "earnedBy", "world", "cohort", "staff", "applicants", "revision", "researched", "toasts", "ring", "carpa"]) delete j[k];
    let st = null; try { st = CR.deserialize(JSON.stringify(j)); } catch (e) { ok(false, "partie aux champs secondaires absents refusée", e.message); }
    if (st) { CR.store.s = st; CR.store.bump(); await sleep(120); ok(app().firstChild && doc.querySelector(".hud"), "partie réparée : rien ne s'affiche"); for (let i = 0; i < 40; i++) CR.endDay(st); CR.store.bump(); await sleep(80); ok(app().firstChild && st.day === 40, "partie réparée : la partie n'avance pas"); } }
  // ---------- une partie saine fait l'aller-retour à l'identique
  { const s = neuve(5); CR.GEN.open(s, "copj", {}); CR.GEN.open(s, "gav", {}); for (let i = 0; i < 30; i++) CR.endDay(s); s.workCase = null; const a = CR.serialize(s); const b = CR.serialize(CR.deserialize(a)); ok(a === b, "l'aller-retour modifie la partie"); ok(CR.serialize(CR.deserialize(b)) === a, "un second chargement modifie la partie"); }
  // ---------- les définitions suivent la partie chargée, pas celle qui était en mémoire
  { const A = neuve(11); const ca = CR.GEN.open(A, "copj", {}); const ta = CR.caseTitle(A, ca), ja = CR.serialize(A);
    const B = neuve(29); const cb = CR.GEN.open(B, "copj", {}); const tb = CR.caseTitle(B, cb);
    ok(ca.id === cb.id, "le test suppose des identifiants identiques d'une partie à l'autre", [ca.id, cb.id]);
    ok(ta !== tb, "le test suppose deux affaires différentes", [ta, tb]);
    const A2 = CR.deserialize(ja); ok(CR.caseTitle(A2, A2.cases[ca.id]) === ta, "le dossier rechargé a pris les faits d'une autre partie", [CR.caseTitle(A2, A2.cases[ca.id]), ta]); }
  // ---------- rangement de repli : enregistrer, lister, recopier, relire, effacer
  { const S = CR.Saves; await S.init(); ok(S.backend === "local", "sans IndexedDB, le repli n'est pas le rangement du navigateur", S.backend);
    const s = neuve(3); CR.store.s = s; ok(await S.save("1", s), "l'emplacement 1 ne s'enregistre pas"); ok(await S.copier("1", "precedente"), "la copie d'emplacement échoue");
    const l = await S.list(); ok(l.some((x) => x.slot === "1") && l.some((x) => x.slot === "precedente"), "les emplacements ne sont pas listés", l.map((x) => x.slot));
    const r = await S.load("precedente"); ok(r && r.seed === s.seed, "la copie ne se relit pas"); await S.remove("1"); ok(!(await S.list()).some((x) => x.slot === "1"), "l'emplacement effacé est encore listé");
    // M3 : la fin de carrière s'enregistre
    CR.endGame(s, "radie", "test"); ok(await CR.autosave(), "la fin de carrière ne s'enregistre pas"); const f = await S.load("auto"); ok(f && f.gameOver && f.gameOver.reason === "radie", "la sauvegarde automatique ne contient pas la fin de carrière"); ok((await S.list()).find((x) => x.slot === "auto").meta.over === true, "la fiche de la sauvegarde ne dit pas que la carrière est finie");
    // B2 : rangement plein → échec signalé au joueur
    const s2 = neuve(4); CR.poserPartie(s2); await sleep(60); const vrai = w.Storage.prototype.setItem; w.Storage.prototype.setItem = function () { throw new Error("QuotaExceededError"); };
    s2.cash += 1; const r2 = await CR.autosave(); w.Storage.prototype.setItem = vrai; await sleep(150);
    ok(r2 === false, "l'écriture impossible est annoncée comme réussie"); ok(/n'a pas pu être enregistrée/.test(texts(doc.querySelector(".toasts") || doc.body)), "l'échec d'enregistrement n'est pas dit au joueur");
    // un rangement abîmé ne casse ni la liste ni le titre
    w.localStorage.setItem(CR.SAVE_KEY, "{{{"); ok((await S.list()).length === 0, "rangement abîmé : la liste échoue"); w.localStorage.setItem(CR.SAVE_KEY, JSON.stringify({ a: null, b: { meta: null }, c: 3 })); ok((await S.list()).length === 0, "fiches abîmées listées");
    w.localStorage.removeItem(CR.SAVE_KEY); }
  // ---------- instantané de scène (B1) : pendant une scène plein écran, on écrit l'état d'avant
  { const s = neuve(6); CR.poserPartie(s); await sleep(80); const avant = CR.serialize(s);
    CR.UI._setScene({ type: "gav", caseId: "absent" }); s.cash = 1; s.day = 77;
    { const j = JSON.parse(CR.Saves.contenu(s).json), a0 = JSON.parse(avant); ok(j.day === a0.day && j.cash === a0.cash, "pendant une scène, l'état en cours de scène serait enregistré", [j.day, j.cash]); }
    CR.UI._setScene(null); await sleep(60); ok(JSON.parse(CR.Saves.contenu(s).json).day === 77, "après la scène, l'état courant n'est pas celui qui s'enregistre");
    CR.UI._setScene({ type: "decide", caseId: "absent" }); ok(!CR.instantane, "une fenêtre de décision prend un instantané"); CR.UI._setScene(null); }
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ").slice(0, 600)); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
