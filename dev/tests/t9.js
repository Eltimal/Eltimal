const { sleep, texts, findBtn, click } = require("./harness");
const P = require("./play"); const U = require("./util"); const { runAudience } = require("./court");
(async () => {
  const mode = process.argv[2] || "immediat";
  const env = await U.career("a07_perquisition", +(process.argv[3] || 7));
  const { w, doc, CR, s, errors } = env;
  await U.untilRing(env, 60);
  console.log("sonnerie", CR.fmtDate(s.day, "dow"), CR.fmtTime(s.min));
  await click(w, findBtn(doc, "Répondre"));
  await P.runCall(w, doc, CR, { avoid: [/transmette/], advice: [/attestation/, /promesse d'embauche/, /secret|répéter/] });
  const cs = s.cases.a07_perquisition;
  await U.engageFee(env, cs, "Kaddour");
  console.log("outcome", JSON.stringify(cs.outcome), JSON.stringify(cs.neg), JSON.stringify(cs.timeline.slice(-5)));
  console.log("statut", cs.status, "audiences", JSON.stringify(cs.hearings.map((h) => [h.title, CR.fmtDate(h.day), CR.fmtTime(h.min)])), "heure", CR.fmtTime(s.min));
  await P.openCase(w, doc, "Kaddour");
  console.log("tâches:", [...doc.querySelectorAll(".task strong")].map((x) => texts(x)).join(" | "));
  await P.runTask(w, doc, /Consulter le dossier/);
  U.noteDocs(CR, s, cs);
  CR.addIssue(s, cs, { text: "Perquisition commencée à 5 h 30, sans ordonnance autorisant une perquisition de nuit.", flag: "perq_nuit" });
  if (mode === "immediat") {
    await P.openCase(w, doc, "Kaddour");
    if (P.taskBtn(doc, /attestation/)) await P.runTask(w, doc, /attestation/);
    if (P.taskBtn(doc, /promesse/)) await P.runTask(w, doc, /promesse/);
  }
  console.log("avant IPC", CR.fmtTime(s.min), "faits", ["K7_attest", "K7_promesse_ecrite", "K7_pv_heure", "K7_aucune_vente"].map((f) => f + ":" + CR.hasFact(cs, f)).join(" "));
  CR.store.bump(); await sleep(30);
  console.log("goCourt", await U.goCourt(env), "scene?", !!doc.querySelector(".court-scene"), errors.slice(0,3).join("\n"));
  let log = await runAudience(w, doc, CR, { prefer: mode === "differe" ? [/délai pour préparer/, /se tait/, /5 h 30/] : [/se tait/, /témoin assisté/, /tout de suite/], args: [/hébergement/, /promesse/, /144/] });
  console.log(log.join("\n"));
  await sleep(60);
  console.log("après IPC: mex", CR.fmtDate(cs.proc.mex), "détention", JSON.stringify(cs.proc.detention), "jld", cs.vars.jldDecision);
  if (mode === "differe") {
    await P.openCase(w, doc, "Kaddour");
    while (s.min > 17 * 60 || !CR.isBusinessDay(s.day)) CR.endDay(s);
    CR.store.bump(); await sleep(30);
    await P.openCase(w, doc, "Kaddour");
    if (P.taskBtn(doc, /attestation/)) await P.runTask(w, doc, /attestation/);
    if (P.taskBtn(doc, /promesse/)) await P.runTask(w, doc, /promesse/);
    const h = cs.hearings.find((x) => /différé/.test(x.title));
    while (s.day < h.day) CR.endDay(s);
    CR.store.bump(); await sleep(30);
    await U.goCourt(env);
    log = await runAudience(w, doc, CR, { args: [/hébergement/, /promesse/, /144/] });
    console.log(log.join("\n"));
    console.log("après JLD: détention", JSON.stringify(cs.proc.detention), "jld", cs.vars.jldDecision);
  }
  if (mode === "appeldp" && cs.proc.detention.statut === "dp") {
    CR.endDay(s); while (!CR.isBusinessDay(s.day)) CR.endDay(s); CR.store.bump(); await sleep(30);
    await P.openCase(w, doc, "Kaddour");
    for (const re of [/attestation/, /promesse/]) if (P.taskBtn(doc, re)) await P.runTask(w, doc, re);
    await P.openCase(w, doc, "Kaddour");
    await P.runTask(w, doc, /appel de l'ordonnance/);
    await P.fillDraft(w, doc, CR, cs, { key: "appel_dp", check: [/Attestation/, /Promesse/, /casier/] });
    await P.openCase(w, doc, "Kaddour"); await P.runTask(w, doc, /Déposer/);
    const h = cs.hearings.find((x) => /appel de l'ordonnance/.test(x.title));
    console.log("appel dp", JSON.stringify(cs.vars.appelDp), h && CR.fmtDate(h.day));
    while (s.day < h.day) CR.endDay(s);
    CR.store.bump(); await sleep(30);
    await U.goCourt(env);
    log = await runAudience(w, doc, CR, { args: [/hébergement/, /promesse/, /144/] });
    console.log(log.join("\n"), "chambre:", cs.vars.chambreDp, JSON.stringify(cs.proc.detention));
  }
  const fresh = async () => { if (s.min > 15 * 60 || !CR.isBusinessDay(s.day)) { CR.endDay(s); while (!CR.isBusinessDay(s.day)) CR.endDay(s); } CR.store.bump(); await sleep(30); };
  await fresh(); await P.openCase(w, doc, "Kaddour");
  console.log("tâches:", [...doc.querySelectorAll(".task strong")].map((x) => texts(x)).join(" | "));
  if (mode !== "tard" && mode !== "sans") await P.runTask(w, doc, /copie du dossier/);
  for (let i = 0; i < 20 && cs.proc.copieDelivree == null && mode !== "tard" && mode !== "sans"; i++) CR.endDay(s);
  console.log("copie demandée", CR.fmtDate(cs.proc.copieDemandee), "délivrée", CR.fmtDate(cs.proc.copieDelivree), "délai 173-1", CR.fmtDate(CR.PROC.delai1731(cs)));
  if (mode === "tard") { const due = CR.PROC.delai1731(cs); while (s.day <= due) CR.endDay(s); }
  if (cs.proc.stade === "jugement" || mode === "sans") console.log("pas de requête");
  else {
    CR.pinTexts(s, cs, ["CPP_59", "CPP_706-91", "CPP_171", "CPP_802", "CPP_174"]);
    await fresh(); await P.openCase(w, doc, "Kaddour");
    await P.runTask(w, doc, /requête en nullité/);
    await P.fillDraft(w, doc, CR, cs, { key: "requete_nullite", check: [/5 h 30/, /support nécessaire/] });
    await fresh(); await P.openCase(w, doc, "Kaddour"); await P.runTask(w, doc, /Déposer/);
    console.log("moyens", JSON.stringify(cs.proc.moyens.map((m) => [m.flag, m.recevable, m.motif])), "audiences", JSON.stringify(cs.hearings.map((h) => [h.title, CR.fmtDate(h.day)])));
    const h = cs.hearings.find((x) => /Chambre/.test(x.title));
    while (s.day < h.day) CR.endDay(s);
    CR.store.bump(); await sleep(30);
    await U.goCourt(env);
    log = await runAudience(w, doc, CR, { args: [/5 h 30/, /ordonnance/, /grief/, /174/] });
    console.log(log.join("\n"));
    console.log("arrêt", JSON.stringify(cs.vars.arretTexte), "annules", JSON.stringify(cs.proc.annules));
  }
  for (let i = 0; i < 200 && cs.status !== "closed" && !cs.proc.audience; i++) CR.endDay(s);
  if (cs.status !== "closed" && cs.proc.audience) {
    U.readAll(CR, s);
    CR.pinTexts(s, cs, ["CP_132-19", "CP_132-25"]);
    await fresh(); await P.openCase(w, doc, "Kaddour"); if (P.taskBtn(doc, /Préparer le client/)) await P.runTask(w, doc, /Préparer le client/);
    while (s.day < cs.proc.audience.day) CR.endDay(s);
    CR.store.bump(); await sleep(30);
    await U.goCourt(env);
    log = await runAudience(w, doc, CR, { angle: /peine/, args: [/vente/, /hébergement/, /aménageable/, /antécédent/] });
    console.log(log.join("\n"));
  }
  await sleep(60);
  console.log("statut", cs.status, JSON.stringify(cs.outcome), "jour", CR.fmtDate(s.day));
  console.log("débrief", JSON.stringify(cs.debrief && cs.debrief.items.map((i) => i.text.slice(0, 70))));
  console.log("erreurs dossier", JSON.stringify(cs.erreurs.map((e) => e.id)));
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
