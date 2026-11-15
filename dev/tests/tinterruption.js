// Sortie 1.0 — une scène interrompue ne bloque jamais un dossier (risque relevé par l'audit pour la garde à vue, même
// schéma que l'audience : la progression d'une scène vit dans l'interface, pas dans la partie).
// On joue une vraie permanence jusqu'à l'entrée en garde à vue, on avance dans la scène, puis on « quitte » : ce qui
// s'enregistre est relu comme au lancement suivant. Le dossier doit être dans son état d'avant la scène, la garde à vue
// doit pouvoir être reprise, et, laissé à lui-même, le dossier doit se clore tout seul.
const { sleep, texts, findBtn, click } = require("./harness");
const P = require("./play"); const U = require("./util");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d !== undefined ? " — " + String(typeof d === "string" ? d : JSON.stringify(d)).slice(0, 300) : "")); } };
  const env = await U.career("none", +(process.argv[2] || 7));
  const { w, doc, CR, s, errors } = env;
  s.settings.saisie = "assiste"; CR.PAROLE.ACCEL = 60;
  const attendre = async () => { for (let k = 0; k < 400 && doc.querySelector(".oral .oral-caret"); k++) await sleep(20); await sleep(40); };
  let cs = null, d = s.day + 1;
  for (let essai = 0; essai < 12 && !cs; essai++) {
    while (!CR.isBusinessDay(d)) d++;
    CR.signDuty(s, d, "gav_jour"); while (s.day < d) CR.endDay(s);
    while (!s.ring && s.min < 19 * 60) CR.spend(s, 10, "admin");
    CR.store.bump(); await sleep(40);
    if (!s.ring) { d = s.day + 1; continue; }
    await click(w, findBtn(doc, "Répondre")); await P.waitFor(() => doc.querySelector(".call-scene"));
    if (doc.querySelector(".call-libre")) {
      await attendre();
      let prendre = null;
      for (let k = 0; k < 200 && !(prendre = [...doc.querySelectorAll(".gestes .geste")].find((x) => /prends le dossier|J'y vais/.test(texts(x)) && !x.disabled)); k++) await sleep(20);
      if (prendre) await click(w, prendre);
      await sleep(1700);
    }
    await P.waitFor(() => findBtn(doc, /^Terminer$/, doc.querySelector(".closing"))); await click(w, findBtn(doc, /^Terminer$/, doc.querySelector(".closing"))); await sleep(60);
    const c = s.order.map((id) => s.cases[id]).filter((x) => x.id.startsWith("g_") && x.status !== "closed").pop();
    const p = c && s.generated.find((x) => x.id === c.id);
    if (p && p.t && CR.SIM.supporte(p.t) && p.t.genre === "gav") cs = c; else d = s.day + 1;
  }
  ok(!!cs, "aucune garde à vue jouable");
  if (cs) {
    const avant = { statut: cs.status, stade: cs.proc && cs.proc.stade, notes: cs.notes.length, min: s.min, flags: JSON.stringify(cs.flags), vars: Object.keys(cs.vars).length };
    await P.openCase(w, doc, CR.client(cs).nom);
    ok(!!P.taskBtn(doc, /garde à vue/), "la tâche de garde à vue n'est pas offerte");
    await P.runTask(w, doc, /garde à vue/, "taxi");
    await P.waitFor(() => doc.querySelector(".gav-scene"));
    ok(!!CR.instantane, "aucun instantané pris à l'entrée en garde à vue");
    const step = async (re) => { const b = findBtn(doc, re); if (b) { await click(w, b); await sleep(60); } };
    await step(/consulter les pièces/); await step(/Rendre les pièces/); await attendre();
    // au milieu de la scène : ce que le jeu enregistrerait si l'on quittait maintenant (menu, fermeture de l'app)
    const json = CR.Saves.contenu(s).json;
    const r = CR.deserialize(json), rc = r.cases[cs.id];
    ok(!!rc && rc.status === avant.statut && rc.notes.length === avant.notes && Object.keys(rc.vars).length <= avant.vars + 1, "l'état enregistré en pleine garde à vue n'est pas celui d'avant la scène", { statut: rc && rc.status, notes: rc && rc.notes.length, avant });
    // reprise : la garde à vue se rejoue
    CR.poserPartie(r); await sleep(150);
    ok(!doc.querySelector(".gav-scene"), "la scène est restée ouverte après le rechargement");
    await P.openCase(w, doc, CR.client(rc).nom);
    ok(!!P.taskBtn(doc, /garde à vue/), "après reprise, la garde à vue ne peut plus être rejointe", [...doc.querySelectorAll(".task")].map((x) => texts(x).slice(0, 40)));
    // laissé à lui-même, le dossier se clôt (personne ne reste bloqué en garde à vue)
    for (let i = 0; i < 200 && rc.status !== "closed"; i++) { r.cash = 20000; CR.endDay(r); }
    ok(rc.status === "closed" && !!rc.outcome, "abandonné après l'interruption, le dossier ne se clôt jamais", { statut: rc.status, stade: rc.proc && rc.proc.stade });
  }
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ").slice(0, 600)); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
