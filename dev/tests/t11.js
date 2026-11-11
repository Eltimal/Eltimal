const { sleep, texts, findBtn, click } = require("./harness");
const P = require("./play"); const U = require("./util"); const { runAudience } = require("./court");
(async () => {
  const camp = process.argv[2] || "defense";
  const choix = process.argv[4] || "accepter";
  const id = camp === "defense" ? "a09_malik" : "a09_hugo";
  const T = camp === "defense" ? "Ferhat" : "Lemaire";
  const env = await U.career(id, +(process.argv[3] || 7));
  const { w, doc, CR, s, errors } = env;
  const cs0 = () => s.cases[id];
  if (camp === "defense") { await U.untilRing(env, 80); await click(w, findBtn(doc, "Répondre")); await P.runCall(w, doc, CR, { advice: [/Ne parlez/, /contrôle judiciaire/] }); await U.engageFee(env, cs0(), T); }
  else { await U.untilLead(env, id, 80); await P.openCase(w, doc, T); await P.runTask(w, doc, /Recevoir M. Lemaire/); await P.runCall(w, doc, CR, { avoid: [/attendez-vous/], advice: [/bulletins/, /certificat/, /Ne publiez/] }); await P.openCase(w, doc, T); await P.runTask(w, doc, /conflits/); await click(w, findBtn(doc, "Terminé")); await P.runTask(w, doc, /aide juridictionnelle/); }
  const cs = cs0();
  console.log("statut", cs.status, CR.fmtDate(s.day, "dow"));
  const fresh = async () => { if (s.min > 15 * 60 || !CR.isBusinessDay(s.day)) { CR.endDay(s); while (!CR.isBusinessDay(s.day)) CR.endDay(s); } CR.store.bump(); await sleep(30); };
  const tasks = () => [...doc.querySelectorAll(".task strong")].map((x) => texts(x)).join(" | ");
  await fresh(); await P.openCase(w, doc, T);
  if (camp === "pc") { await P.runTask(w, doc, /Constituer M. Lemaire/); await P.fillDraft(w, doc, CR, cs, { key: "constitution_ji" }); await P.openCase(w, doc, T); }
  console.log("tâches:", tasks());
  await P.runTask(w, doc, /copie du dossier/);
  await P.openCase(w, doc, T); await P.runTask(w, doc, /demande d'actes/);
  await P.fillDraft(w, doc, CR, cs, { key: "demande_actes", check: [/vidéo/, /médico-légale/, /personnalité/, /séquelles/] });
  await P.openCase(w, doc, T);
  for (const re of [/Préparer Malik à son interrogatoire/, /attestation du maître/, /bulletins/]) if (P.taskBtn(doc, re)) { await P.runTask(w, doc, re); await P.openCase(w, doc, T); }
  const goH = async (re, o) => { const h = cs.hearings.find((x) => re.test(x.title) && !x.attended); if (!h) { console.log("pas d'audience", re); return; } while (s.day < h.day) CR.endDay(s); CR.store.bump(); await sleep(30); await U.goCourt(env); const log = await runAudience(w, doc, CR, o); console.log(h.title, "→", log.join(" / ").slice(0, 300)); };
  await goH(/Interrogatoire|Audition/, { prefer: [/laissez/], questions: [/Où étiez/, /lendemain/, /lame/, /physiquement/] });
  for (let i = 0; i < 40 && !cs.hearings.some((h) => /Confrontation/.test(h.title)); i++) CR.endDay(s);
  await goH(/Confrontation/, { questions: [/au sol/, /ouverte avant/] });
  for (let i = 0; i < 90 && !cs.vars.finInfo; i++) CR.endDay(s);
  U.readAll(CR, s); U.noteDocs(CR, s, cs);
  CR.pinTexts(s, cs, ["CP_121-5", "CP_221-1", "CPP_475-1"]);
  await fresh(); await P.openCase(w, doc, T);
  console.log("finInfo", CR.fmtDate(cs.vars.finInfo), "tâches:", tasks());
  await P.runTask(w, doc, /observations de l'article 175/);
  await P.fillDraft(w, doc, CR, cs, { key: "observations_175", check: [/./] });
  for (let i = 0; i < 40 && !cs.vars.reglement; i++) CR.endDay(s);
  console.log("règlement", cs.vars.reglement);
  if (cs.vars.reglement === "ortc") {
    await fresh(); await P.openCase(w, doc, T);
    if (choix === "appel") { await P.runTask(w, doc, /Faire appel de l'ordonnance/); await P.fillDraft(w, doc, CR, cs, { key: "appel_ortc" }); await fresh(); await P.openCase(w, doc, T); await P.runTask(w, doc, /Déposer/); }
    else await P.runTask(w, doc, /Accepter la correctionnalisation/);
  }
  for (let i = 0; i < 90 && !cs.proc.audience; i++) CR.endDay(s);
  console.log("fond", cs.vars.fond, cs.proc.audience && CR.fmtDate(cs.proc.audience.day, "dow"));
  U.readAll(CR, s); U.noteDocs(CR, s, cs);
  await fresh(); await P.openCase(w, doc, T);
  if (P.taskBtn(doc, /constitution de partie civile et le chiffrage/)) { await P.runTask(w, doc, /constitution de partie civile et le chiffrage/); await P.fillDraft(w, doc, CR, cs, { key: "constitution_pc", check: [/Déficit/, /Souffrances/, /esthétique/, /gains/, /475-1/] }); await P.openCase(w, doc, T); }
  if (P.taskBtn(doc, /Préparer (Malik|Hugo) à l'audience/)) await P.runTask(w, doc, /Préparer (Malik|Hugo) à l'audience/);
  while (s.day < cs.proc.audience.day) CR.endDay(s);
  CR.store.bump(); await sleep(30);
  await U.goCourt(env);
  const log = await runAudience(w, doc, CR, { questions: [/Combien de temps/, /coups de pied/, /lame avant/, /Où a-t-il/], args: camp === "defense" ? [/deux secondes/, /faire peur/, /rendu/, /apprenti/] : [/lame ouverte/, /deux centimètres/, /intention/, /préjudices/], dernier: /pardon/ });
  console.log(log.join("\n").slice(0, 1500));
  await sleep(60);
  console.log("statut", cs.status, JSON.stringify(cs.outcome), "intention", cs.vars.intention, "jurés", (cs.vars.jures || []).length);
  console.log("erreurs dossier", JSON.stringify(cs.erreurs.map((e) => e.id)));
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
