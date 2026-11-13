// Refonte : la boucle principale jouée de bout en bout en mode libre (sans aucune aide) — appel de permanence, garde à
// vue, orientation, comparution immédiate, jugement raisonné, décision écrite, débrief. node tests/tboucle.js [graine]
const { sleep, texts, findBtn, click } = require("./harness");
const P = require("./play"); const U = require("./util"); const { runAudience } = require("./court");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d ? " — " + String(d).slice(0, 300) : "")); } };
  const env = await U.career("none", +(process.argv[2] || 7));
  const { w, doc, CR, s, errors } = env;
  s.settings.saisie = "assiste"; CR.PAROLE.ACCEL = 60;
  s.pending = s.pending.filter((e) => e.type !== "lead");
  const attendre = async () => { for (let k = 0; k < 400 && doc.querySelector(".oral .oral-caret"); k++) await sleep(20); await sleep(40); };
  const composer = async (sujet, angle) => {
    const b = (re) => [...doc.querySelectorAll(".compo .compo-b")].find((x) => re.test(texts(x)) && !x.disabled);
    const bs = b(sujet); if (!bs) return false; await click(w, bs); const ba = b(angle); if (ba) await click(w, ba);
    let go = null; for (let k = 0; k < 150 && !(go = findBtn(doc, /^Poser la question/)); k++) await sleep(20);
    if (!go) return false; await click(w, go); await attendre(); return true;
  };
  const noterTout = async () => { for (const x of [...doc.querySelectorAll(".oral .who-client .oral-t")].filter((x) => !x.disabled)) await click(w, x); };
  let cs = null, d = s.day + 1;
  for (let essai = 0; essai < 12 && !cs; essai++) {
    while (!CR.isBusinessDay(d)) d++;
    CR.signDuty(s, d, "gav_jour"); while (s.day < d) CR.endDay(s);
    while (!s.ring && s.min < 19 * 60) CR.spend(s, 10, "admin");
    CR.store.bump(); await sleep(40);
    if (!s.ring) { d = s.day + 1; continue; }
    await click(w, findBtn(doc, "Répondre")); await P.waitFor(() => doc.querySelector(".call-scene"));
    // la permanence : on s'informe au compositeur, puis le geste de prendre le dossier
    if (doc.querySelector(".call-libre")) {
      await attendre();
      await composer(/^Les faits|^Le contexte|^Un autre point/, /Ce qui s'est passé/);
      let prendre = null;
      for (let k = 0; k < 200 && !(prendre = [...doc.querySelectorAll(".gestes .geste")].find((x) => /prends le dossier|J'y vais/.test(texts(x)) && !x.disabled)); k++) await sleep(20);
      ok(!!prendre, "l'appel de permanence n'offre pas le geste de prendre le dossier", texts(doc.querySelector(".call-libre")).slice(0, 300));
      if (prendre) await click(w, prendre);
      await sleep(1700);
      if (process.env.DBG) console.log("APRÈS GESTE :", texts(doc.querySelector(".call-scene")).slice(0, 600), "| closing:", !!doc.querySelector(".closing"));
    } else ok(false, "l'appel de permanence n'est pas libre");
    await P.waitFor(() => findBtn(doc, /^Terminer$/, doc.querySelector(".closing"))); await click(w, findBtn(doc, /^Terminer$/, doc.querySelector(".closing"))); await sleep(60);
    const c = s.order.map((id) => s.cases[id]).filter((x) => x.id.startsWith("g_") && x.status !== "closed").pop();
    const p = c && s.generated.find((x) => x.id === c.id);
    if (p && p.t && CR.SIM.supporte(p.t) && p.t.genre === "gav") cs = c; else d = s.day + 1;
  }
  ok(!!cs, "aucune garde à vue jouable");
  if (cs) {
    await P.openCase(w, doc, CR.client(cs).nom); await P.runTask(w, doc, /garde à vue/, "taxi");
    await P.waitFor(() => doc.querySelector(".gav-scene"));
    const step = async (re) => { const b = findBtn(doc, re); if (!b) throw new Error("GAV : " + re + " | " + texts(doc.querySelector(".gav-card")).slice(0, 300)); await click(w, b); await sleep(60); };
    await step(/consulter les pièces/); await step(/Rendre les pièces/);
    await attendre();
    for (const [su, an] of [[/^Les faits/, /Ce qui s'est passé/], [/^Vos droits/, /Quand/], [/^Le logement/, /Où/], [/^Le travail/, /Ce qui s'est passé/], [/^Le casier/, /Ce qui s'est passé/]]) { await composer(su, an); await noterTout(); }
    await click(w, [...doc.querySelectorAll(".ent-onglet")].find((x) => /Conseil/.test(texts(x))));
    for (const l of [...doc.querySelectorAll(".cons-l")]) { const b = [...l.querySelectorAll(".compo-b")].find((x) => /Répondre/.test(texts(x))); if (b) await click(w, b); }
    await step(/Terminer l'entretien|Sortir de l'entretien/);
    for (let k = 0; k < 600 && !findBtn(doc, /^Fin de l'audition/); k++) await sleep(25);
    await step(/^Fin de l'audition/); await step(/Ne plus poser de questions/);
    for (const l of [...doc.querySelectorAll(".gav-card label")]) await click(w, l.querySelector("input"));
    await step(/Rédiger et joindre|Pas d'observations/);
    const bad = [...doc.querySelectorAll(".paper-pv .seg")].find((x) => /je savais ce que je faisais/.test(texts(x))); if (bad) await click(w, bad);
    await step(/Signer et continuer|fidèle/);
    await step(/^Quitter/);
    ok(!!cs.vars.voie, "pas d'orientation du parquet");
    console.log(`garde à vue — ${CR.caseTitle(s, cs)} · résumé ${cs.vars.conseilGav} · voie ${cs.vars.voie} · notes ${cs.notes.length}`);
    if (cs.vars.voie === "ci") {
      const h0 = cs.hearings.find((x) => !x.attended);
      while (s.day < h0.day) CR.endDay(s);
      CR.store.bump(); await sleep(30);
      for (const re of [/Lire le dossier/, /proche/, /employeur/]) { await P.openCase(w, doc, CR.client(cs).nom); if (!P.taskBtn(doc, re)) continue; await P.runTask(w, doc, re); }
      // le dépôt : un entretien libre
      await P.openCase(w, doc, CR.client(cs).nom);
      if (P.taskBtn(doc, /au dépôt/)) {
        await P.runTask(w, doc, /au dépôt/); await P.waitFor(() => doc.querySelector(".call-scene"));
        if (doc.querySelector(".call-libre")) { await attendre(); await composer(/^Les faits/, /Ce qui s'est passé/); await noterTout(); const r = [...doc.querySelectorAll(".gestes .geste")].find((x) => /jugé|délai|choix/i.test(texts(x))); if (r) { for (let k = 0; k < 200 && r.disabled; k++) await sleep(20); await click(w, r); await sleep(1700); } const fin = findBtn(doc, /^Terminer l'entretien/); if (fin) await click(w, fin); }
        await P.waitFor(() => findBtn(doc, /^Terminer$/, doc.querySelector(".closing"))); await click(w, findBtn(doc, /^Terminer$/, doc.querySelector(".closing"))); await sleep(60);
      }
      const h = cs.hearings.find((x) => !x.attended);
      while (s.day < h.day) CR.endDay(s);
      CR.store.bump(); await sleep(30);
      await U.goCourt(env);
      const logA = await runAudience(w, doc, CR, { prefer: [/jugé aujourd'hui/], limine: [/./], angle: /peine/i, args: [/garanties/, /insertion professionnelle/, /aménagement/], card: /Attestation|Domicile|Logement|travail/i });
      if (!cs.vars.raisonnement) console.log("AUDIENCE :", logA.slice(-12).join(" / "), "| écran :", texts(doc.querySelector(".court-scene, .scene") || doc.body).slice(-500));
      ok(!!cs.vars.raisonnement, "pas de jugement raisonné");
      for (let k = 0; k < 6 && !CR.hasDoc(cs, "_jugement"); k++) CR.endDay(s);
      ok(CR.hasDoc(cs, "_jugement"), "la décision écrite n'arrive pas");
      console.log(`audience — ${cs.vars.raisonnement && cs.vars.raisonnement.coupable ? "condamnation" : "relaxe"} · ${cs.vars.decision && cs.vars.decision.peine}`);
    }
    for (let k = 0; k < 4 && cs.status !== "closed"; k++) CR.endDay(s);
    ok(cs.status === "closed", "l'affaire ne se clôt pas", cs.status);
    ok(cs.debrief && cs.debrief.items.length > 0, "pas de débrief");
    ok(cs.vars.corrige && cs.vars.corrige["Garde à vue"], "pas de corrigé de l'entretien");
    console.log(`clôture — ${CR.outcomeLabel ? CR.outcomeLabel(cs.outcome) : cs.outcome && cs.outcome.type} · débrief ${cs.debrief ? cs.debrief.items.length : 0} éléments`);
  }
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
