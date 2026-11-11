const { boot, sleep, texts, findBtn, click } = require("./harness");
const P = require("./play"); const U = require("./util"); const { runAudience } = require("./court");
(async () => {
  const mode = process.argv[2] || "gav";
  const seed = +(process.argv[3] || 7);
  const env = await U.career("none", seed);
  const { w, doc, CR, s, errors } = env;
  s.pending = s.pending.filter((e) => e.type !== "lead");
  const dayOf = () => { let d = s.day + 1; while (!CR.isBusinessDay(d)) d++; return d; };
  const answerPermanence = async () => {
    await click(w, findBtn(doc, "Répondre"));
    await P.waitFor(() => doc.querySelector(".call-scene"));
    for (const re of [/Que savez-vous/, /J'y vais|Je prends le dossier/]) { await sleep(80); const sk = [...doc.querySelectorAll("button.link")].find((b) => texts(b).includes("Afficher toute")); if (sk) await click(w, sk); const b = [...doc.querySelectorAll(".q-btn")].find((x) => re.test(texts(x))); if (b) await click(w, b); }
    await P.waitFor(() => findBtn(doc, /^Terminer$/, doc.querySelector(".closing")));
    await click(w, findBtn(doc, /^Terminer$/, doc.querySelector(".closing")));
    await sleep(60);
  };
  const genCase = () => s.cases[s.order.find((id) => id.startsWith("g_"))];
  const runGav = async (cs) => {
    const T = CR.client(cs).nom;
    await P.openCase(w, doc, T);
    await P.runTask(w, doc, /garde à vue/, "taxi");
    await P.waitFor(() => doc.querySelector(".gav-scene"));
    const step = async (re) => { const b = findBtn(doc, re); if (!b) throw new Error("GAV: " + re + " | " + texts(doc.querySelector(".gav-card")).slice(0, 300)); await click(w, b); await sleep(60); };
    await step(/consulter les pièces/);
    const p = s.generated.find((x) => x.id === cs.id);
    if (p.anomaly) { const seg = [...doc.querySelectorAll(".gav-card .seg")].find((x) => /notifions/.test(texts(x))); if (seg) await P.releve(w, doc, seg, "Heure"); }
    await step(/Rendre les pièces/);
    for (let i = 0; i < 8; i++) { const q = doc.querySelector(".gav-card .q-btn"); if (!q) break; await click(w, q); for (const sg of [...doc.querySelectorAll(".gav-card .noteable")]) if (!sg.classList.contains("seg-noted")) await click(w, sg); }
    await step(/l'entretien/);
    await step(/Répondre en partie/);
    for (let i = 0; i < 6; i++) { const b = findBtn(doc, "Question suivante"); if (!b) break; await click(w, b); }
    await step(/Fin de l'audition/);
    for (let i = 0; i < 3; i++) { const q = doc.querySelector(".gav-card .q-btn"); if (q) await click(w, q); }
    await step(/Continuer|Ne plus poser/);
    for (const l of [...doc.querySelectorAll(".gav-card label")]) await click(w, l.querySelector("input"));
    await step(/Rédiger et joindre|Pas d'observations/);
    const bad = [...doc.querySelectorAll(".paper-pv .seg")].find((x) => /exprès/.test(texts(x))); if (bad) await click(w, bad);
    await step(/Signer et continuer|fidèle/);
    console.log("issue:", texts(doc.querySelector(".gav-card")).slice(0, 220));
    await step(/Quitter/);
    console.log("anomalie", p.anomaly, "inf", p.inf, "casier", p.client.casier, "voie", cs.vars.voie, "aj", s.ajDue.length);
  };
  const runCI = async (cs) => {
    const T = CR.client(cs).nom;
    const h0 = cs.hearings.find((x) => !x.attended);
    while (s.day < h0.day) CR.endDay(s);
    CR.store.bump(); await sleep(30);
    for (const re of [/Lire le dossier/, /au dépôt/, /proche/, /employeur/, /employeur/]) {
      await P.openCase(w, doc, T);
      if (!P.taskBtn(doc, re)) continue;
      await P.runTask(w, doc, re);
      if (/dépôt/.test(re.source)) await P.runCall(w, doc, CR, {});
    }
    U.noteDocs(CR, s, cs);
    const p = s.generated.find((x) => x.id === cs.id);
    if (p.anomaly) CR.addIssue(s, cs, { text: "Notification irrégulière des droits.", flag: p.anomaly });
    CR.pinTexts(s, cs, ["CP_132-19", "CP_132-25"]);
    const h = cs.hearings.find((x) => !x.attended);
    console.log("audience CI", CR.fmtDate(h.day, "dow"), CR.fmtTime(h.min), "il est", CR.fmtTime(s.min));
    while (s.day < h.day) CR.endDay(s);
    CR.store.bump(); await sleep(30);
    await U.goCourt(env);
    const log = await runAudience(w, doc, CR, { prefer: [/jugé aujourd'hui/], limine: [/./], angle: /peine/i, args: [/hébergement/, /emploi/, /aménageable/], card: /Attestation|Domicile/ });
    console.log(log.join("\n").slice(0, 900));
  };
  if (mode === "gav" || mode === "nuit") {
    const d = dayOf();
    CR.signDuty(s, d, mode === "nuit" ? "gav_nuit" : "gav_jour");
    console.log("pending duty", JSON.stringify(s.pending.filter((e) => e.key === "dutyCall").map((e) => [CR.fmtDate(e.day), CR.fmtTime(e.min)])));
    while (s.day < d) CR.endDay(s);
    if (mode === "nuit") CR.endDay(s);
    else while (!s.ring && s.min < 19 * 60) CR.spend(s, 10, "admin");
    CR.store.bump(); await sleep(40);
    console.log("ring", s.ring && s.ring.from, CR.fmtTime(s.min), "nuit", s.night);
    await answerPermanence();
    const cs = genCase();
    console.log("cas", cs.id, cs.status, CR.caseTitle(s, cs));
    await runGav(cs);
    if (mode === "nuit") { CR.backToBed(s); CR.store.bump(); await sleep(30); }
    if (cs.vars.voie === "ci") await runCI(cs);
    for (let i = 0; i < 2 && cs.status !== "closed"; i++) CR.endDay(s);
    console.log("statut", cs.status, JSON.stringify(cs.outcome));
  }
  if (mode === "ci") {
    const d = dayOf();
    CR.signDuty(s, d, "ci");
    while (s.day < d) CR.endDay(s);
    while (!s.ring && s.min < 16 * 60) CR.spend(s, 10, "admin");
    CR.store.bump(); await sleep(40);
    console.log("ring", s.ring && s.ring.from, CR.fmtTime(s.min));
    await answerPermanence();
    const cs = genCase();
    console.log("cas", cs.id, cs.status, CR.caseTitle(s, cs));
    await runCI(cs);
    console.log("statut", cs.status, JSON.stringify(cs.outcome));
  }
  if (mode === "op") {
    CR.GEN.lead(s, s.day, "op");
    const cs = genCase();
    const p = s.generated.find((x) => x.id === cs.id);
    console.log("cas", cs.id, cs.status, CR.caseTitle(s, cs), "notif", CR.fmtDate(p.notif), "ethylo", p.ethylo, "inf", p.inf);
    CR.store.bump(); await sleep(30);
    const T = CR.client(cs).nom;
    await P.openCase(w, doc, T); await P.runTask(w, doc, /Recevoir/);
    await P.runCall(w, doc, CR, { advice: [/quarante-cinq/, /plus lourde/] });
    await U.engageFee(env, cs, T);
    await P.openCase(w, doc, T); await P.runTask(w, doc, /Consulter la procédure/);
    U.noteDocs(CR, s, cs);
    if (p.ethylo) CR.addIssue(s, cs, { text: "Pas de vérification de l'éthylomètre.", flag: "ethylo" });
    await P.openCase(w, doc, T);
    if (process.argv[4] === "accepter") { await P.runTask(w, doc, /Conseiller de ne pas/); }
    else {
      await P.runTask(w, doc, /Former opposition/); await P.fillDraft(w, doc, CR, cs, { key: "opposition" });
      await P.openCase(w, doc, T); await P.runTask(w, doc, /Déposer/);
      console.log("audience", cs.proc.audience && CR.fmtDate(cs.proc.audience.day, "dow"));
      if (p.ethylo) { await P.openCase(w, doc, T); if (P.taskBtn(doc, /conclusions de nullité/)) { await P.runTask(w, doc, /conclusions de nullité/); await P.fillDraft(w, doc, CR, cs, { key: "conclusions_nullite", check: [/./] }); await P.openCase(w, doc, T); await P.runTask(w, doc, /Déposer/); } }
      if (cs.proc.audience) { while (s.day < cs.proc.audience.day) CR.endDay(s); CR.store.bump(); await sleep(30); await U.goCourt(env); const log = await runAudience(w, doc, CR, { limine: [/./], args: [/emploi|première/, /proportionnée/] }); console.log(log.join("\n").slice(0, 700)); }
    }
    for (let i = 0; i < 40 && cs.status !== "closed"; i++) CR.endDay(s);
    console.log("statut", cs.status, JSON.stringify(cs.outcome), "moyens", JSON.stringify(cs.proc.moyens.map((m) => [m.flag, m.recevable, m.decision])));
  }
  // sauvegarde et rechargement
  const json = CR.serialize(s);
  const ids = s.generated.map((g) => g.id);
  for (const id of ids) delete CR.CASES[id];
  const s2 = CR.deserialize(json);
  console.log("restauration", ids.map((id) => id + ":" + !!CR.CASES[id]).join(" "), "titres", ids.map((id) => s2.cases[id] && CR.caseTitle(s2, s2.cases[id])).join(" | "));
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
