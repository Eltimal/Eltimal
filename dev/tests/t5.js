const { sleep, texts, findBtn, click } = require("./harness");
const P = require("./play"); const U = require("./util"); const { runAudience } = require("./court");
(async () => {
  const path = process.argv[2] || "accept";
  const env = await U.career("a03_crpc");
  const { w, doc, CR, s, errors } = env;
  await U.untilRing(env);
  console.log("ring", s.ring && s.ring.from, CR.fmtDate(s.day), CR.fmtTime(s.min));
  await click(w, findBtn(doc, "Répondre"));
  await P.runCall(w, doc, CR, { avoid: [/garde toujours/], advice: [/reprenez pas/, /attestation/, /signez rien/] });
  const cs = s.cases.a03_crpc;
  await U.engageFee(env, cs, "Morin");
  console.log("statut", cs.status, "crpc", CR.fmtDate(cs.vars.crpcDay, "dow"), "hearings", cs.hearings.length);
  U.readAll(CR, s);
  await P.openCase(w, doc, "Morin");
  await P.runTask(w, doc, /Consulter le dossier/);
  U.noteDocs(CR, s, cs);
  const seg = cs.docs.find(d => d.key === "pv_mesure");
  CR.addIssue(s, cs, { text: "Appareil homologué, numéro de série ARCA-0157.", flag: "ethylo" });
  CR.pinTexts(s, cs, ["CR_L234-2"]);
  await P.openCase(w, doc, "Morin");
  for (const re of [/attestation de l'employeur/, /addictologie/, /Préparer Claire/]) { if (P.taskBtn(doc, re)) await P.runTask(w, doc, re); await P.openCase(w, doc, "Morin"); }
  while (s.day < cs.vars.crpcDay) CR.endDay(s);
  CR.store.bump(); await sleep(40);
  console.log("au jour", CR.fmtDate(s.day, "dow"), await U.goCourt(env));
  const log = [];
  for (let i = 0; i < 400; i++) {
    await sleep(25);
    const sc = doc.querySelector(".court-scene"); if (!sc) break;
    const ch = sc.querySelector(".court-choices");
    if (ch) { const btns = [...ch.querySelectorAll("button.choice")]; const t = texts(ch);
      if (/Négocier/.test(t)) { const b = btns.find(x => path === "refuse" ? /refuse/.test(texts(x)) : path === "reflexion" ? /réflexion/.test(texts(x)) : /Négocier/.test(texts(x))); await click(w, b); log.push("CHOIX " + texts(b)); continue; }
      if (/accepte/.test(t)) { const b = btns.find(x => path === "refuse2" ? /refuse/.test(texts(x)) : /accepte/.test(texts(x))); await click(w, b); log.push("CHOIX2 " + texts(b)); continue; }
      if (btns.length) { await click(w, btns[btns.length - 1]); log.push("OBS " + texts(btns[btns.length-1]).slice(0,40)); continue; }
    }
    const pl = sc.querySelector(".plaidoirie"); if (pl) { for (const re of [/Infirmière/, /antidémarrage/, /antécédent/]) { const b = [...pl.querySelectorAll(".arg")].find(x => re.test(texts(x)) && !x.disabled); if (b) await click(w, b); } await click(w, findBtn(doc, "Plaider")); log.push("NÉGO"); continue; }
    const done = sc.querySelector(".court-done"); if (done) { log.push(texts(sc.querySelector(".court-log")).slice(-500)); await click(w, findBtn(doc, "Sortir de la salle")); break; }
  }
  console.log(log.join("\n"));
  await sleep(100);
  console.log("statut", cs.status, JSON.stringify(cs.outcome), "flags", JSON.stringify(cs.flags));
  if (cs.status !== "closed") {
    for (let i = 0; i < 25 && !cs.proc.audience || (cs.proc.audience && cs.proc.audience.juridiction !== "tc" && i < 25); i++) CR.endDay(s);
    console.log("TC", cs.proc.audience && CR.fmtDate(cs.proc.audience.day, "dow"), JSON.stringify(cs.obligs));
    U.readAll(CR, s); U.noteDocs(CR, s, cs);
    while (!CR.isBusinessDay(s.day)) CR.endDay(s);
    CR.store.bump(); await sleep(30);
    await P.openCase(w, doc, "Morin");
    await P.runTask(w, doc, /conclusions de nullité/);
    await P.fillDraft(w, doc, CR, cs, { key: "conclusions_nullite", check: [/ARCA/, /porté atteinte/] });
    await P.openCase(w, doc, "Morin");
    await P.runTask(w, doc, /Déposer/);
    console.log("moyens", JSON.stringify(cs.proc.moyens.map(m => [m.flag, m.recevable])));
    while (s.day < cs.proc.audience.day) CR.endDay(s);
    CR.store.bump(); await sleep(30);
    await U.goCourt(env);
    const l2 = await runAudience(w, doc, CR, { interject: true, angle: /relaxe/, args: [/vérification périodique/, /ivresse/, /Infirmière/], card: /Attestation/, dernier: /regrets|Des regrets/ });
    console.log(l2.join("\n"));
    await sleep(100);
    console.log("statut", cs.status, JSON.stringify(cs.outcome));
  }
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
