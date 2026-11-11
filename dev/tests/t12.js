const { sleep, texts, findBtn, click } = require("./harness");
const P = require("./play"); const U = require("./util"); const { runAudience } = require("./court");
(async () => {
  const mode = process.argv[2] || "vite";
  const env = await U.career("a10_vendredi", +(process.argv[3] || 7));
  const { w, doc, CR, s, errors } = env;
  await U.untilLead(env, "a10_vendredi", 90);
  const cs = s.cases.a10_vendredi;
  console.log("lead", CR.fmtDate(s.day, "dow"), CR.fmtTime(s.min), "jugement", CR.fmtDate(cs.vars.jugementDay, "dow"), "échéance", CR.fmtDate(CR.rollForward(cs.vars.jugementDay + 10), "dow"));
  await P.openCase(w, doc, "Saïdi"); await P.runTask(w, doc, /Recevoir Mme Saïdi/);
  await P.runCall(w, doc, CR, { advice: mode === "tard" ? [/un mois/] : [/dix jours/, /Ne recontactez/] });
  await U.engageFee(env, cs, "Saïdi");
  const tasks = () => [...doc.querySelectorAll(".task strong")].map((x) => texts(x)).join(" | ");
  const fresh = async () => { if (s.min > 15 * 60 || !CR.isBusinessDay(s.day)) { CR.endDay(s); while (!CR.isBusinessDay(s.day)) CR.endDay(s); } CR.store.bump(); await sleep(30); };
  await P.openCase(w, doc, "Saïdi"); console.log("statut", cs.status, "tâches:", tasks());
  if (P.taskBtn(doc, /Informer Me Pernot/)) await P.runTask(w, doc, /Informer Me Pernot/);
  await P.openCase(w, doc, "Saïdi"); if (P.taskBtn(doc, /courriels/)) await P.runTask(w, doc, /courriels/);
  await P.openCase(w, doc, "Saïdi"); await P.runTask(w, doc, /copie du jugement/);
  if (mode === "tard") { while (s.day <= CR.rollForward(cs.vars.jugementDay + 10)) CR.endDay(s); }
  await fresh(); await P.openCase(w, doc, "Saïdi");
  await P.runTask(w, doc, /Faire appel du jugement/);
  await P.fillDraft(w, doc, CR, cs, { key: "appel", choose: { etendue: mode === "civil" ? "Appel limité aux dispositions civiles." : "Appel portant sur l'ensemble des dispositions pénales et civiles." } });
  await P.openCase(w, doc, "Saïdi"); await P.runTask(w, doc, /Déposer/);
  console.log("appel", JSON.stringify(cs.proc.appel), "jour", CR.fmtDate(s.day, "dow"), CR.fmtTime(s.min));
  for (let i = 0; i < 8; i++) CR.endDay(s);
  console.log("incident", cs.vars.appelIncident, "statut", cs.status);
  U.readAll(CR, s); U.noteDocs(CR, s, cs);
  await fresh(); await P.openCase(w, doc, "Saïdi");
  if (cs.status !== "closed") {
    console.log("tâches:", tasks());
    if (mode === "desist" && P.taskBtn(doc, /désister/)) { await P.runTask(w, doc, /désister/); }
    else if (!cs.proc.audience) console.log("pas d'audience");
    else {
      if (P.taskBtn(doc, /plan de remboursement/)) { await P.runTask(w, doc, /plan de remboursement/); U.noteDocs(CR, s, cs); }
      CR.pinTexts(s, cs, ["CPP_515", "CP_314-1", "CP_132-25"]);
      await P.openCase(w, doc, "Saïdi"); if (P.taskBtn(doc, /Préparer Nadia/)) await P.runTask(w, doc, /Préparer Nadia/);
      while (s.day < cs.proc.audience.day) CR.endDay(s);
      CR.store.bump(); await sleep(30);
      await U.goCourt(env);
      const log = await runAudience(w, doc, CR, { args: [/ordre écrit|ordonnés/, /rembourser/, /515/, /aménageable/], dernier: /Reconnaître/ });
      console.log(log.join("\n").slice(0, 1200));
    }
  }
  for (let i = 0; i < 80 && cs.status !== "closed"; i++) CR.endDay(s);
  await sleep(60);
  console.log("statut", cs.status, JSON.stringify(cs.outcome));
  console.log("débrief", JSON.stringify(cs.debrief && cs.debrief.items.slice(0, 5).map((i) => i.text.slice(0, 90))));
  console.log("erreurs dossier", JSON.stringify(cs.erreurs.map((e) => e.id)), "bons", JSON.stringify(cs.bons.map((b) => b.id)));
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
