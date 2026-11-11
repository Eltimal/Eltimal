const { boot, sleep, texts, findBtn, click } = require("./harness");
const P = require("./play");
const { runAudience } = require("./court");
(async () => {
  const { w, CR, doc, errors } = boot();
  await sleep(200);
  await click(w, findBtn(doc, "Nouvelle partie"));
  await click(w, findBtn(doc, /^Tutoriel/));
  const s = CR.store.s;
  s.settings.textSpeed = 60;
  s.settings.coach = false; s.settings.saisie = "liste";
  await click(w, findBtn(doc, /Paperasse/));
  console.log("ring:", s.ring && s.ring.from, CR.fmtTime(s.min));
  await click(w, findBtn(doc, "Répondre"));
  await P.runCall(w, doc, CR, { avoid: [/condamner lourdement/], advice: [/justificatifs/, /médico-judiciaire/, /Ne contactez pas/] });
  const cs = s.cases.tuto_lucas;
  console.log("statut", cs.status, "notes", cs.notes.length, cs.notes.filter(n=>n.fact).map(n=>n.fact).join(","), "advice", cs.advice.join(","));
  await P.openCase(w, doc, "Bernier");
  await P.runTask(w, doc, /conflits/);
  await click(w, findBtn(doc, "Terminé"));
  console.log("conflit:", JSON.stringify(cs.conflictResult));
  await P.runTask(w, doc, /aide juridictionnelle/);
  console.log("statut", cs.status, "aj", cs.aj);
  await P.runTask(w, doc, /Rédiger la plainte/);
  await P.fillDraft(w, doc, CR, cs, { key: "plainte_simple", check: [/Certificat/, /caméra/, /témoin/] });
  console.log("plainte:", JSON.stringify(CR.drafted(cs, "plainte_simple").defects), "pending", s.pending.filter(e=>e.caseId===cs.id).map(e=>e.key+"@"+e.day).join(","));
  // avancer jusqu'à l'avis à victime
  for (let i = 0; i < 30 && !(cs.proc.audience); i++) { CR.endDay(s); }
  CR.store.bump(); await sleep(50);
  console.log("jour", s.day, CR.fmtDate(s.day), "audience", cs.proc.audience && CR.fmtDate(cs.proc.audience.day, "dow"), "stade", cs.proc.stade);
  // lire tous les mails non lus et noter les phrases à fait des pièces
  for (const m of s.inbox.filter((x) => !x.read)) CR.readMail(s, m.id);
  for (const d of cs.docs) { const r = CR.renderDoc(s, cs, d); for (const p of r.paras || []) for (const seg of p) if (typeof seg === "object" && seg.f) CR.addNote(s, cs, { text: seg.t, fact: seg.f, src: "doc" }); }
  console.log("cartes", cs.cards.join(","));
  await P.openCase(w, doc, "Bernier");
  console.log("tâches:", [...doc.querySelectorAll(".task strong")].map((x) => texts(x)).join(" | "));
  if (P.taskBtn(doc, /attestation de revenus/)) await P.runTask(w, doc, /attestation de revenus/);
  await P.runTask(w, doc, /factures/);
  await P.runTask(w, doc, /copie de la procédure/);
  console.log("lieu", s.at, CR.fmtTime(s.min));
  await P.runTask(w, doc, /constitution de partie civile/);
  await P.fillDraft(w, doc, CR, cs, { key: "constitution_pc", choose: { envoi: "Par lettre recommandée" }, check: [/Déficit/, /Souffrances/, /Perte de gains/, /Frais divers/, /475-1/] });
  console.log("constituée", cs.proc.pcConstituee, "chiffrage", JSON.stringify(cs.vars.chiffrage));
  await P.openCase(w, doc, "Bernier");
  await P.runTask(w, doc, /Préparer Lucas/);
  // aller jusqu'au jour d'audience
  while (s.day < cs.proc.audience.day) CR.endDay(s);
  for (const m of s.inbox.filter((x) => !x.read)) CR.readMail(s, m.id);
  for (const d of cs.docs) { const r = CR.renderDoc(s, cs, d); for (const p of r.paras || []) for (const seg of p) if (typeof seg === "object" && seg.f) CR.addNote(s, cs, { text: seg.t, fact: seg.f, src: "doc" }); }
  CR.pinTexts(s, cs, ["CPP_475-1", "CP_222-11"]);
  CR.store.bump(); await sleep(50);
  await click(w, P.rail(doc, "Bureau"));
  const y = findBtn(doc, "Y aller");
  console.log("audience aujourd'hui ?", !!y, CR.fmtDate(s.day, "dow"));
  await click(w, y);
  const tr = [...doc.querySelectorAll(".modal .decide-opt")][0]; if (tr) await click(w, tr);
  await sleep(100);
  const log = await runAudience(w, doc, CR, { interject: true, questions: [/recule/, /indemniser/], args: [/dix jours/, /recule, puis/, /poste par poste/, /475-1/], card: /plateforme/ });
  console.log(log.join("\n"));
  await sleep(200);
  console.log("statut", cs.status, JSON.stringify(cs.outcome));
  const deb = doc.querySelector(".modal .debrief");
  console.log("débrief:", deb ? texts(deb).slice(0, 1500) : "aucun");
  console.log("thomas programmé:", s.pending.filter((e) => e.key === "tuto_thomas").map((e) => e.day));
  console.log("errors:", errors.length ? errors.slice(0, 6).join("\n---\n") : "none");
  require("fs").writeFileSync(__dirname + "/save_ch1.json", CR.serialize(s));
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
