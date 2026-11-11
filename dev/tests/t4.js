const { boot, sleep, texts, findBtn, click } = require("./harness");
const P = require("./play");
const { runAudience } = require("./court");
(async () => {
  const renvoi = process.argv[2] === "renvoi";
  const { w, CR, doc, errors } = boot();
  await sleep(200);
  CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 42 });
  const s = CR.store.s; s.settings.textSpeed = 60; s.settings.coach = false; s.settings.saisie = "liste";
  // Vivier : seule l'affaire de permanence (a02), à la date tirée pour cette graine
  s.pending = s.pending.filter((e) => e.type !== "lead");
  const lead = CR.vivierForce(s, "a02_sac");
  CR.store.bump(); await sleep(80);
  while (s.day < lead.day) CR.endDay(s);
  for (const m of s.inbox.filter((x) => !x.read)) CR.readMail(s, m.id);
  while (!s.ring && s.min < 19 * 60) CR.spend(s, 10, "admin");
  CR.store.bump(); await sleep(50);
  console.log("jour", s.day, CR.fmtTime(s.min), "ring", s.ring && s.ring.from, s.ring && s.ring.kind);
  await click(w, findBtn(doc, "Répondre"));
  await P.waitFor(() => doc.querySelector(".call-scene"));
  // demander les infos puis accepter
  for (const re of [/Que savez-vous/, /Depuis quand/, /J'y vais/]) { await sleep(100); const sk = [...doc.querySelectorAll("button.link")].find((b) => texts(b).includes("Afficher toute")); if (sk) await click(w, sk); const b = [...doc.querySelectorAll(".q-btn")].find((x) => re.test(texts(x))); await click(w, b); }
  await P.waitFor(() => findBtn(doc, /^Terminer$/, doc.querySelector(".closing")));
  await click(w, findBtn(doc, /^Terminer$/, doc.querySelector(".closing")));
  const cs = s.cases.a02_sac;
  console.log("statut", cs.status, cs.aj);
  await P.openCase(w, doc, "Mebarki");
  await P.runTask(w, doc, /garde à vue/, "taxi");
  await P.waitFor(() => doc.querySelector(".gav-scene"));
  const step = async (re) => { const b = findBtn(doc, re); if (!b) throw new Error("GAV: " + re + " | " + texts(doc.querySelector(".gav-card")).slice(0, 300)); await click(w, b); await sleep(60); };
  await step(/consulter les pièces/);
  // relever la notification tardive
  const seg = [...doc.querySelectorAll(".gav-card .seg")].find((x) => /15 h 15/.test(texts(x)));
  await P.releve(w, doc, seg, "Heure");
  await step(/Rendre les pièces/);
  for (let i = 0; i < 8; i++) { const q = doc.querySelector(".gav-card .q-btn"); if (!q) break; await click(w, q); for (const sg of [...doc.querySelectorAll(".gav-card .noteable")]) if (!sg.classList.contains("seg-noted")) await click(w, sg); }
  await step(/l'entretien/);
  await step(/Reconnaître le coup|Répondre en partie/);
  for (let i = 0; i < 6; i++) { const b = findBtn(doc, "Question suivante"); if (!b) break; await click(w, b); }
  await step(/Fin de l'audition/);
  for (let i = 0; i < 3; i++) { const q = doc.querySelector(".gav-card .q-btn"); if (q) await click(w, q); }
  for (const sg of [...doc.querySelectorAll(".gav-card .noteable")]) await click(w, sg);
  await step(/Continuer|Ne plus poser/);
  for (const l of [...doc.querySelectorAll(".gav-card label")]) await click(w, l.querySelector("input"));
  await step(/Rédiger et joindre/);
  const bad = [...doc.querySelectorAll(".paper-pv .seg")].find((x) => /poussée pour/.test(texts(x))); if (bad) await click(w, bad);
  await step(/Signer et continuer|fidèle/);
  console.log("issue:", texts(doc.querySelector(".gav-card")).slice(0, 200));
  await step(/Quitter/);
  console.log("audience", cs.proc.audience && CR.fmtDate(cs.proc.audience.day, "dow"), cs.proc.audience && cs.proc.audience.mode, "issues", JSON.stringify(cs.issues.map(i=>i.flag)), "aj", s.ajDue.length, CR.fmtTime(s.min));
  CR.endDay(s); CR.store.bump(); await sleep(50);
  await P.openCase(w, doc, "Mebarki");
  console.log("tâches CI:", [...doc.querySelectorAll(".task strong")].map((x) => texts(x)).join(" | "));
  await P.runTask(w, doc, /dépôt/);
  await P.openCase(w, doc, "Mebarki");
  await P.runTask(w, doc, /mère de Yanis/);
  await P.openCase(w, doc, "Mebarki");
  for (let i = 0; i < 2; i++) { if (P.taskBtn(doc, /agence/)) { await P.runTask(w, doc, /agence/); await P.openCase(w, doc, "Mebarki"); } }
  console.log("notes perso", ["A2_heberg","A2_mere_presente","A2_promesse","A2_esr"].map(f=>f+":"+CR.hasFact(cs,f)).join(" "), "docs", cs.docs.map(d=>d.key).join(","));
  for (const d of cs.docs) { const r = CR.renderDoc(s, cs, d); for (const p of r.paras || []) for (const sg of p) if (typeof sg === "object" && sg.f) CR.addNote(s, cs, { text: sg.t, fact: sg.f, src: "doc" }); }
  CR.pinTexts(s, cs, ["CP_132-19", "CP_132-25", "CPP_144"]);
  await click(w, P.rail(doc, "Bureau"));
  await click(w, findBtn(doc, "Y aller"));
  const tr = [...doc.querySelectorAll(".modal .decide-opt")][0]; if (tr) await click(w, tr);
  // choix du renvoi ou non
  const log = [];
  for (let i = 0; i < 300; i++) { await sleep(25); const ch = doc.querySelector(".court-choices"); if (ch && /jugé aujourd'hui|délai pour préparer/.test(texts(ch))) { const b = [...ch.querySelectorAll("button.choice")][renvoi ? 1 : 0]; await click(w, b); log.push("CHOIX " + texts(b)); break; } }
  log.push(...await runAudience(w, doc, CR, { interject: true, limine: [/15 h 15/], angle: /aménagement/, args: [/hébergement/, /tenu le sac/, /aménageable/, /regrets/], card: /attestation|Interim|Domicile/, dernier: /tournés vers/ }));
  console.log(log.join("\n"));
  await sleep(150);
  console.log("statut", cs.status, JSON.stringify(cs.outcome), "détention", JSON.stringify(cs.proc.detention), "détenus", JSON.stringify(s.detenus));
  if (renvoi && cs.status !== "closed") {
    console.log("renvoi au", CR.fmtDate(cs.proc.audience.day, "dow"));
    while (s.day < cs.proc.audience.day) CR.endDay(s);
    CR.store.bump(); await sleep(50);
    await click(w, P.rail(doc, "Bureau"));
    await click(w, findBtn(doc, "Y aller"));
    const tr2 = [...doc.querySelectorAll(".modal .decide-opt")][0]; if (tr2) await click(w, tr2);
    const l2 = await runAudience(w, doc, CR, { interject: true, limine: [/15 h 15/], angle: /aménagement/, args: [/hébergement/, /tenu le sac/, /aménageable/, /regrets/], card: /attestation|Interim|Domicile/, dernier: /tournés vers/ });
    console.log(l2.join("\n"));
    console.log("statut", cs.status, JSON.stringify(cs.outcome), "détenus", JSON.stringify(s.detenus));
  }
  console.log("errors:", errors.length ? errors.slice(0, 6).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
