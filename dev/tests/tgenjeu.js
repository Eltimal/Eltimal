// Moteur génératif, phase 1 : les nouveaux genres d'affaires joués dans l'interface, du premier rendez-vous au jugement.
// copj (client convoqué devant le tribunal), al (audition libre puis décision du parquet), pc (victime : prévenu convoqué,
// ou plainte classée et citation directe), info (phase 2 : une affaire criminelle, de la convocation chez le juge d'instruction au procès).
// Usage : node tests/tgenjeu.js [genre] [graine]
const { sleep, texts, findBtn, click } = require("./harness");
const P = require("./play"); const U = require("./util"); const { runAudience } = require("./court");
(async () => {
  const only = process.argv[2] || "tous";
  const seed = +(process.argv[3] || 9);
  const env = await U.career("none", seed);
  const { w, doc, CR, s, errors } = env;
  // les scénarios de référence suivent le tirage d'avant le directeur de partie (mesuré à part : tests/trepetition.js)
  if (CR.GEN2.DIR) CR.GEN2.DIR.off = true;
  s.pending = s.pending.filter((e) => e.type !== "lead");
  const res = [];
  const fresh = async () => { if (s.min > 15 * 60 || !CR.isBusinessDay(s.day)) { CR.endDay(s); while (!CR.isBusinessDay(s.day)) CR.endDay(s); } CR.store.bump(); await sleep(30); };
  const ouvrir = async (kind, cond) => {
    for (let i = 0; i < 200; i++) {
      CR.GEN.lead(s, s.day, kind);
      const cs = s.cases[s.order[0]];
      const p = s.generated.find((x) => x.id === cs.id);
      if (!cond || cond(p.t)) return { cs, p };
      CR.closeCase(s, cs, { type: "lost-lead" });
    }
    throw new Error("aucune affaire " + kind);
  };
  const debut = async (cs) => {
    await fresh();
    for (let i = 0; i < 4; i++) { const b = findBtn(doc, "Ranger la fiche au classeur"); if (!b) break; await click(w, b); await sleep(40); }
    const T = CR.caseTitle(s, cs).split(" — ")[0];
    CR.store.bump(); await sleep(30);
    await P.openCase(w, doc, T);
    await P.runTask(w, doc, /Recevoir/);
    // phase 3 : un client peut manquer le premier rendez-vous ; il rappelle et vient le jour ouvré suivant
    for (let i = 0; i < 100 && cs.vars.vieRdvManque == null && !doc.querySelector(".call-scene"); i++) await sleep(40);
    if (cs.vars.vieRdvManque != null && !doc.querySelector(".call-scene")) { CR.endDay(s); await fresh(); await P.openCase(w, doc, T); await P.runTask(w, doc, /Recevoir/); }
    await P.runCall(w, doc, CR, { avoid: [/prison/], advice: [/Apportez|dossier|quitter|taire|fiches de paie|Ne prenez|Ne répondez/] });
    await U.engageFee(env, cs, T);
    U.readAll(CR, s); U.noteDocs(CR, s, cs);
    return T;
  };
  const copie = async (cs, T) => {
    await fresh();
    await P.openCase(w, doc, T);
    if (P.taskBtn(doc, /copie/)) await P.runTask(w, doc, /copie/);
    for (let i = 0; i < 8 && !cs.docs.some((d) => d.key === "casier" || d.key === "pv_victime" || d.key === "pv_auteur"); i++) CR.endDay(s);
    U.readAll(CR, s); U.noteDocs(CR, s, cs);
  };
  const audience = async (cs, T, o) => {
    while (cs.proc.audience && s.day < cs.proc.audience.day) CR.endDay(s);
    CR.store.bump(); await sleep(40);
    if (!(await U.goCourt(env))) return ["(pas d'audience à rejoindre)"];
    return runAudience(w, doc, CR, o);
  };

  // ---------------------------------------------------------------- 1. Client convoqué devant le tribunal
  if (only === "tous" || only === "copj") {
    const { cs, p } = await ouvrir("copj", (t) => t.q.nature === "delit");
    const T = await debut(cs);
    console.log("copj", cs.id, CR.caseTitle(s, cs), "|", p.t.q.label, "| audience", cs.proc.audience && CR.fmtDate(cs.proc.audience.day), "| irr", p.t.irr.join(","), "| requalif", p.t.q2 ? p.t.q2.label : "-");
    await copie(cs, T);
    for (const id of p.t.irr) CR.addIssue(s, cs, { text: "Irrégularité " + id, flag: id });
    await fresh();
    await P.openCase(w, doc, T);
    if (cs.issues.length && P.taskBtn(doc, /conclusions de nullité/)) { await P.runTask(w, doc, /conclusions de nullité/); await P.fillDraft(w, doc, CR, cs, { key: "conclusions_nullite", check: [/./] }); await P.openCase(w, doc, T); await P.runTask(w, doc, /Déposer/); }
    for (const re of [/attestation de l'employeur/, /attestation d'hébergement/]) { await P.openCase(w, doc, T); if (P.taskBtn(doc, re)) await P.runTask(w, doc, re); }
    await P.openCase(w, doc, T); if (P.taskBtn(doc, /Préparer le client/)) await P.runTask(w, doc, /Préparer le client/);
    CR.pinTexts(s, cs, ["CP_132-19", "CP_132-25", "CP_122-5"].concat(p.t.q2 ? p.t.q2.textes : []));
    const log = await audience(cs, T, { limine: [/./], angle: p.t.q2 ? /requalif/i : /peine/i, args: [/Requalifier/, /emploi/, /aménageable/, /identification|témoin|légitime|téléphone|suspension|images/], card: /Attestation|employeur/ });
    for (let i = 0; i < 3 && cs.status !== "closed"; i++) CR.endDay(s);
    console.log(log.filter((l) => /DÉCISION|LIMINE|PLAIDOIRIE/.test(l)).join("\n").slice(0, 700));
    // phase 3 : le parquet peut faire appel d'une décision trop douce ; le jugement rendu suffit à ce scénario
    if (cs.status !== "closed" && cs.vars.vieAppel != null && cs.proc.stade === "jugement") { res.push(["copj", "closed", "jugé, appel du parquet en attente"]); } else
    res.push(["copj", cs.status, JSON.stringify(cs.outcome)]);
  }

  // ---------------------------------------------------------------- 2. Audition libre, puis décision du parquet
  if (only === "tous" || only === "al") {
    const { cs, p } = await ouvrir("al");
    const T = await debut(cs);
    console.log("al", cs.id, CR.caseTitle(s, cs), "| audition", CR.fmtDate(cs.vars.auditionDay, "dow"), "| irr", p.t.irr.join(","));
    while (s.day < cs.vars.auditionDay) CR.endDay(s);
    CR.store.bump(); await sleep(40);
    await P.openCase(w, doc, T);
    await P.runTask(w, doc, /audition libre/);
    await P.waitFor(() => doc.querySelector(".gav-scene"));
    const step = async (re) => { const b = findBtn(doc, re); if (!b) throw new Error("AL: " + re + " | " + texts(doc.querySelector(".gav-card")).slice(0, 300)); await click(w, b); await sleep(60); };
    await step(/Entrer dans le bureau/);
    for (const sg of [...doc.querySelectorAll(".gav-card .noteable")]) await click(w, sg);
    await step(/^Continuer$/);
    await step(/Écouter d'abord/);
    for (let i = 0; i < 6; i++) { const b = findBtn(doc, "Question suivante"); if (!b) break; await click(w, b); }
    await step(/Fin de l'audition/);
    for (let i = 0; i < 3; i++) { const q = doc.querySelector(".gav-card .q-btn"); if (q) await click(w, q); }
    await step(/Continuer|Ne plus poser/);
    for (const l of [...doc.querySelectorAll(".gav-card label")]) await click(w, l.querySelector("input"));
    await step(/Rédiger et joindre|Pas d'observations/);
    const bad = [...doc.querySelectorAll(".paper-pv .seg")].find((x) => /très bien ce que je faisais/.test(texts(x))); if (bad) await click(w, bad);
    await step(/Signer et continuer|fidèle/);
    await step(/Quitter/);
    for (let i = 0; i < 35 && !cs.vars.decisionParquet; i++) CR.endDay(s);
    console.log("décision du parquet :", cs.vars.decisionParquet, "| statut", cs.status);
    if (cs.proc.audience && cs.status === "active") {
      await copie(cs, T);
      const log = await audience(cs, T, { limine: [/./], angle: /peine/i, args: [/emploi/, /aménageable/], card: /Attestation|employeur/ });
      for (let i = 0; i < 3 && cs.status !== "closed"; i++) CR.endDay(s);
      console.log(log.filter((l) => /DÉCISION/.test(l)).join("\n").slice(0, 500));
    }
    res.push(["al", cs.status, JSON.stringify(cs.outcome)]);
  }

  // ---------------------------------------------------------------- 3. Victime : le prévenu est convoqué, constitution de partie civile
  if (only === "tous" || only === "pc") {
    const { cs, p } = await ouvrir("pc", (t) => t.d.voiePc === "convoque");
    const T = await debut(cs);
    console.log("pc convoqué", cs.id, CR.caseTitle(s, cs), "|", p.t.q.label, "| audience", cs.proc.audience && CR.fmtDate(cs.proc.audience.day));
    await copie(cs, T);
    await fresh();
    await P.openCase(w, doc, T);
    if (P.taskBtn(doc, /constitution de partie civile/)) await P.runTask(w, doc, /constitution de partie civile/);
    await P.fillDraft(w, doc, CR, cs, { key: "constitution_pc", check: [/./] });
    await P.openCase(w, doc, T); if (P.taskBtn(doc, /Préparer/)) await P.runTask(w, doc, /Préparer/);
    CR.pinTexts(s, cs, ["CPP_475-1"].concat(p.t.q.textes.slice(0, 1)));
    const log = await audience(cs, T, { constitution: "yes", questions: [/témoin|reconnu/], args: [/témoignage|certificat|qualification|préjudice|475-1/] });
    for (let i = 0; i < 3 && cs.status !== "closed"; i++) CR.endDay(s);
    console.log(log.filter((l) => /DÉCISION/.test(l)).join("\n").slice(0, 600));
    res.push(["pc-convoque", cs.status, JSON.stringify(cs.outcome)]);
  }

  // ---------------------------------------------------------------- 4. Victime : plainte classée, citation directe
  if (only === "tous" || only === "citation") {
    // le client peut partir pendant la discussion des honoraires (négociation tirée) : on prend alors la victime suivante
    let cs, p, T;
    for (let k = 0; k < 4; k++) { ({ cs, p } = await ouvrir("pc", (t) => t.d.voiePc === "classe")); T = await debut(cs); if (cs.status !== "closed") break; }
    const pr = CR.PROC.prescription(cs);
    console.log("pc citation", cs.id, CR.caseTitle(s, cs), "|", p.t.q.label, p.t.q.jur, "| prescription", CR.fmtDate(pr.expire));
    await copie(cs, T);
    await fresh();
    await P.openCase(w, doc, T);
    await P.runTask(w, doc, /date d'audience/);
    await fresh();
    await P.openCase(w, doc, T);
    await P.runTask(w, doc, /Rédiger la citation/);
    await P.fillDraft(w, doc, CR, cs, { key: "citation" });
    await fresh();
    await P.openCase(w, doc, T);
    await P.runTask(w, doc, /Déposer/);
    for (let i = 0; i < 6 && !(cs.vars.citation && cs.vars.citation.ctrl); i++) CR.endDay(s);
    console.log("citation délivrée", JSON.stringify(cs.vars.citation && cs.vars.citation.ctrl), "audience", cs.proc.audience && cs.proc.audience.juridiction);
    U.readAll(CR, s);
    await fresh();
    await P.openCase(w, doc, T);
    if (P.taskBtn(doc, /consignation/)) await P.runTask(w, doc, /consignation/);
    await P.openCase(w, doc, T);
    if (P.taskBtn(doc, /constitution de partie civile/)) { await P.runTask(w, doc, /constitution de partie civile/); await P.fillDraft(w, doc, CR, cs, { key: "constitution_pc", check: [/./] }); }
    await P.openCase(w, doc, T); if (P.taskBtn(doc, /Préparer/)) await P.runTask(w, doc, /Préparer/);
    const log = await audience(cs, T, { questions: [/témoin|reconnu/], args: [/témoignage|certificat|qualification|préjudice|475-1/] });
    for (let i = 0; i < 3 && cs.status !== "closed"; i++) CR.endDay(s);
    console.log(log.filter((l) => /DÉCISION/.test(l)).join("\n").slice(0, 600));
    res.push(["pc-citation", cs.status, JSON.stringify(cs.outcome)]);
  }

  // ---------------------------------------------------------------- 5. Phase 2 : une affaire criminelle, de la convocation chez le juge d'instruction au procès
  if (only === "tous" || only === "info") {
    let cs, p, T;
    for (let essai = 0; essai < 15; essai++) { // un client peut partir pendant la discussion des honoraires (provision trop lourde)
      ({ cs, p } = await ouvrir("info", (t) => t.camp === "defense" && t.entree === "convoc" && t.q.nature === "crime" && t.d.ipc - s.day >= 12));
      T = await debut(cs);
      if (cs.status === "active") break;
    }
    const t = p.t;
    console.log("info", cs.id, CR.caseTitle(s, cs), "|", t.q.label, "|", t.jur, "| IPC", CR.fmtDate(t.d.ipc, "dow"), "| irr", t.irr.join(","), "| enjeux", t.enjeux.join(","));
    while (s.day < t.d.ipc) CR.endDay(s);
    CR.store.bump(); await sleep(40);
    if (!(await U.goCourt(env))) res.push(["info-ipc", "pas d'IPC"]);
    else {
      const log = await runAudience(w, doc, CR, { prefer: [/silence/], args: [/témoin assisté|garanties/] });
      console.log("IPC :", log.join(" | ").slice(0, 300), "| statut", cs.vars.statut);
    }
    // l'information, accélérée : le joueur assiste aux actes (crochets), dépose ses observations, puis plaide au procès dans l'interface
    const PL = new Set(["arg:garanties", "arg:144", "arg:duree"].concat(t.enjeux.map((e) => "arg:" + e)));
    let obs = false;
    for (let k = 0; k < 900 && cs.status !== "closed"; k++) {
      const h = cs.hearings.find((x) => x.day === s.day && !x.attended && !x.missed && !x.canceled);
      if (h && h.script === "proces") {
        CR.store.bump(); await sleep(40);
        await U.goCourt(env);
        const log = await runAudience(w, doc, CR, { angle: t.q2 ? /requalif/i : /acquittement|relaxe/i, args: t.enjeux.map((e) => new RegExp(CR.CAT.ENJEUX[e].label.slice(0, 12).replace(/[()]/g, "."))).concat([/personnalité/]), dernier: /regrets/i });
        console.log("procès :", log.filter((l) => /DÉCISION|PLAIDOIRIE|DERNIER/.test(l)).slice(0, 8).join("\n").slice(0, 900));
        if (log.filter((l) => l === "PLAIDOIRIE").length > 6) { const pl = doc.querySelector(".plaidoirie"); console.log("BLOQUÉ :", pl ? texts(pl).slice(0, 900) : texts(doc.querySelector(".court-scene") || doc.body).slice(0, 600)); break; }
        continue;
      }
      if (h) { h.attended = true; const dk = { jld: "jldDecider", prolong: "prolongDecider", chins: "chinsDecider" }[h.script]; if (dk) CR.runHook(s, cs, dk, { played: PL }); if (h.done) CR.runHook(s, cs, h.done, {}); continue; }
      if (cs.vars.avis175Day != null && !obs) { obs = true; CR.runHook(s, cs, "filed_observations_175", { res: { filled: { qualif: t.q2 ? "requalif" : "nonlieu" }, picks: { points: t.enjeux.slice() }, defects: [] } }); }
      CR.updatedClient(s, cs, 0.5);
      CR.endDay(s);
    }
    console.log("règlement", JSON.stringify(cs.vars.reglement), "| issue", JSON.stringify(cs.outcome), "|", Math.round((s.day - p.day) / 30), "mois");
    res.push(["info", cs.status, JSON.stringify(cs.outcome)]);
  }
  console.log("\nrésultats :", res.map((r) => r.join(" ")).join("\n           "));
  const fails = res.filter((r) => r[1] !== "closed").length;
  console.log("échecs:", fails);
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
