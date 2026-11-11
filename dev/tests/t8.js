const { sleep, texts, findBtn, click } = require("./harness");
const P = require("./play"); const U = require("./util"); const { runAudience } = require("./court");
(async () => {
  const mode = process.argv[2] || "attendre";
  const env = await U.career("a05_placement");
  const { w, doc, CR, s, errors } = env;
  await U.untilLead(env, "a05_placement");
  const cs = s.cases.a05_placement;
  await P.openCase(w, doc, "Bernard");
  await P.runTask(w, doc, /Recevoir Mme Bernard/);
  await P.runCall(w, doc, CR, { avoid: [/tout de suite/], advice: [/Gardez/, /raccrochez/] });
  await U.engageFee(env, cs, "Bernard");
  console.log("statut", cs.status, "plainte simple", CR.fmtDate(cs.vars.plainteSimpleDay), "3 mois", CR.fmtDate(CR.addMonths(cs.vars.plainteSimpleDay, 3)));
  await P.openCase(w, doc, "Bernard");
  await P.runTask(w, doc, /Rassembler les pièces/);
  U.noteDocs(CR, s, cs);
  const fresh = async () => { if (s.min > 15 * 60 || !CR.isBusinessDay(s.day)) { CR.endDay(s); while (!CR.isBusinessDay(s.day)) CR.endDay(s); } CR.store.bump(); await sleep(30); };
  if (mode === "attendre") { while (s.day < CR.addMonths(cs.vars.plainteSimpleDay, 3) + 1) CR.endDay(s); }
  if (mode === "citation") {
    await fresh(); await P.openCase(w, doc, "Bernard"); await P.runTask(w, doc, /date pour une citation/);
    await fresh(); await P.openCase(w, doc, "Bernard"); await P.runTask(w, doc, /Rédiger la citation/); await P.fillDraft(w, doc, CR, cs, { key: "citation" });
    await fresh(); await P.openCase(w, doc, "Bernard"); await P.runTask(w, doc, /Déposer/);
    for (let i = 0; i < 6 && !cs.proc.audience; i++) CR.endDay(s);
    await fresh(); await P.openCase(w, doc, "Bernard"); if (P.taskBtn(doc, /consignation/)) await P.runTask(w, doc, /consignation/);
  } else {
    await fresh(); await P.openCase(w, doc, "Bernard");
    await P.runTask(w, doc, /plainte avec constitution/);
    await P.fillDraft(w, doc, CR, cs, { key: "pcpc" });
    await fresh(); await P.openCase(w, doc, "Bernard"); await P.runTask(w, doc, /Déposer/);
    console.log("pcpc déposée", CR.fmtDate(cs.vars.pcpcDay), "ok", cs.vars.pcpcOk, JSON.stringify(CR.drafted(cs, "pcpc") && CR.drafted(cs, "pcpc").defects), JSON.stringify(CR.drafted(cs, "pcpc") && CR.drafted(cs, "pcpc").filled));
    for (let i = 0; i < 45 && !cs.vars.consignation && !cs.erreurs.length; i++) CR.endDay(s);
    console.log("consignation", JSON.stringify(cs.vars.consignation), "erreurs", JSON.stringify(cs.erreurs.map(e => e.id)));
    if (!cs.vars.consignation) { console.log("irrecevable → on attend et on redépose"); while (s.day < CR.addMonths(cs.vars.plainteSimpleDay, 3) + 1) CR.endDay(s); await fresh(); await P.openCase(w, doc, "Bernard"); await P.runTask(w, doc, /plainte avec constitution/); await P.fillDraft(w, doc, CR, cs, { key: "pcpc" }); await fresh(); await P.openCase(w, doc, "Bernard"); await P.runTask(w, doc, /Déposer/); for (let i = 0; i < 45 && !cs.vars.consignation; i++) CR.endDay(s); }
    await fresh(); await P.openCase(w, doc, "Bernard"); await P.runTask(w, doc, /consignation/);
    for (let i = 0; i < 25 && cs.proc.stade !== "information"; i++) CR.endDay(s);
    console.log("stade", cs.proc.stade, CR.fmtDate(s.day));
    await fresh(); await P.openCase(w, doc, "Bernard");
    console.log("tâches:", [...doc.querySelectorAll(".task strong")].map((x) => texts(x)).join(" | "));
    await P.runTask(w, doc, /demande d'actes/);
    await P.fillDraft(w, doc, CR, cs, { key: "demande_actes", check: [/bancaires/, /audition/, /WhatsApp/] });
    await P.openCase(w, doc, "Bernard"); await P.runTask(w, doc, /copie du dossier/);
    for (let i = 0; i < 160 && !cs.proc.audience; i++) CR.endDay(s);
    console.log("audience", cs.proc.audience && CR.fmtDate(cs.proc.audience.day, "dow"), "banque", cs.vars.banque, "mex", cs.vars.mexFaite, cs.status, JSON.stringify(cs.outcome), JSON.stringify(cs.timeline.slice(-6)), "gameOver", JSON.stringify(s.gameOver));
  }
  U.readAll(CR, s); U.noteDocs(CR, s, cs);
  CR.pinTexts(s, cs, ["CP_313-2", "CPP_475-1"]);
  await fresh(); await P.openCase(w, doc, "Bernard");
  await P.runTask(w, doc, /constitution de partie civile/);
  await P.fillDraft(w, doc, CR, cs, { key: "constitution_pc", check: [/matériel/, /moral/, /Frais bancaires/, /475-1/] });
  await P.openCase(w, doc, "Bernard"); if (P.taskBtn(doc, /Préparer Mme/)) await P.runTask(w, doc, /Préparer Mme/);
  while (s.day < cs.proc.audience.day) CR.endDay(s);
  CR.store.bump(); await sleep(30);
  await U.goCourt(env);
  const log = await runAudience(w, doc, CR, { interject: true, questions: [/garanti/, /enfants/], args: [/manœuvres/, /vulnérabilité/, /quarante-huit/, /18 000/] });
  console.log(log.join("\n"));
  await sleep(80);
  console.log("statut", cs.status, JSON.stringify(cs.outcome));
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
