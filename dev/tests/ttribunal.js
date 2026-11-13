// Refonte du gameplay, lot 4a : le tribunal qui raisonne. Délibéré élément par élément (acte, imputation, intention,
// légitime défense), preuves annulées écartées, moyens soutenus ou non, motifs écrits, jugement complet notifié par le
// greffe ; puis une comparution immédiate jouée de bout en bout.  node tests/tribunal.js [graines]   « échecs: 0 » attendu.
const { boot, sleep, texts } = require("./harness");
const P = require("./play"); const U = require("./util"); const { runAudience } = require("./court");
(async () => {
  let echecs = 0; const vus = {};
  const ko = (k, d) => { echecs++; if (!vus[k]) { vus[k] = 0; console.log("  ✗ " + k + (d ? " — " + String(d).slice(0, 300) : "")); } vus[k]++; };
  const ok = (c, k, d) => { if (!c) ko(k, d); };
  {
    const { CR, errors } = boot();
    const G2 = CR.GEN2, T = CR.TRIB, B = G2.B;
    const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere" });
    const N = +(process.argv[2] || 700);
    let n = 0; const st = { relaxes: 0, manque: {}, ld: 0, annule: 0 };
    for (let i = 0; i < N; i++) for (const genre of ["gav", "ci", "copj"]) {
      const t = G2.tirer("ttrib:" + i, genre, {}); if (!t || t.genre === "info") continue;
      const id = "g_tt" + i + genre; s.generated = [{ id, t }];
      let x; try { x = B.ctx({ gen: 2, id, kind: genre, seed: "ttrib:" + i, day: 0, t }); } catch (e) { continue; }
      const spec = B.spec(x); n++;
      const cs = { id, proc: { annules: [] }, vars: {}, notes: [], flags: {}, actors: {}, docs: [] };
      const api = { s, cs };
      ok(T.actif(s, cs, spec), "le tribunal ne raisonne pas sur un délit généré");
      const needs = Object.values(spec.pieces).filter((pc) => pc.sens === "decharge").flatMap((pc) => [].concat(pc.need || []));
      for (const [scen, played, ann] of [["rien", [], []], ["doutes", needs, []], ["nullite", [], [...new Set(t.irr.flatMap((ir) => (G2.IRR[ir] && G2.IRR[ir].annule) || []))]]]) {
        cs.proc.annules = ann;
        const ctx = { played, juge: { severite: 0.5 } };
        const d = T.raisonner(api, spec, ctx), d2 = T.raisonner(api, spec, ctx);
        ok(JSON.stringify(d) === JSON.stringify(d2), "délibéré non déterministe");
        const R = d.raisonnement;
        ok(R.elements.length === 3, "trois éléments examinés");
        ok(d.coupable === (R.elements.every((e) => e.etabli) && R.ld !== "admise"), "verdict incohérent avec les éléments");
        if (!d.coupable) { st.relaxes++; if (R.manque) st.manque[R.manque] = (st.manque[R.manque] || 0) + 1; if (R.ld === "admise") st.ld++; }
        // une preuve annulée n'est jamais retenue
        for (const e of R.elements) for (const k of e.preuves) ok(!ann.includes(k), "une preuve annulée fonde un élément", k);
        if (ann.length && R.elements.some((e) => e.ecartees.length)) st.annule++;
        // un moyen non plaidé n'attaque rien
        if (scen === "rien") ok(R.elements.every((e) => e.moyens.every((m) => !m.soutenu)), "un moyen non plaidé compte comme soutenu");
        // les motifs : un paragraphe par élément examiné, en français de jugement, et la relaxe dit l'élément qui manque
        const M = T.motifs(s, cs, R, "M. Dupont");
        ok(M.length >= 1 && M.every((m) => m.titre && m.t && !/undefined|\$\{|\bnull\b|NaN|\[object/.test(m.t)), "motifs mal formés", JSON.stringify(M));
        if (!d.coupable && R.manque) ok(M.some((m) => !m.etabli && /doute/.test(m.t)), "la relaxe ne dit pas pourquoi", JSON.stringify(M));
        if (d.coupable) ok(M.every((m) => m.etabli), "condamnation avec un élément non établi");
        if (scen === "doutes" && needs.length && d.coupable) ok(M.some((m) => /La défense soutient/.test(m.t)), "les moyens soutenus ne sont pas discutés");
        if (ann.length && R.elements.some((e) => e.ecartees.length)) ok(M.some((m) => /annulés/.test(m.t)), "les actes annulés ne sont pas écartés dans les motifs");
      }
    }
    ok(n > 1500, "trop peu d'affaires", n);
    ok(Object.keys(st.manque).length >= 2, "les relaxes viennent toutes du même élément", JSON.stringify(st.manque));
    ok(st.annule > 50, "les nullités n'écartent jamais rien", st.annule);
    console.log(`moteur — ${n} affaires × 3 scénarios · relaxes : ${st.relaxes} (élément manquant : ${JSON.stringify(st.manque)}, légitime défense admise : ${st.ld}) · nullités qui écartent une preuve : ${st.annule}`);
    if (errors.length) ko("erreurs au chargement", errors[0]);
  }
  // ---------------------------------------------------------------- une comparution immédiate jouée, jugement écrit compris
  {
    const env = await U.career("none", +(process.argv[3] || 7));
    const { w, doc, CR, s, errors } = env;
    s.pending = s.pending.filter((e) => e.type !== "lead");
    let d = s.day + 1; while (!CR.isBusinessDay(d)) d++;
    CR.signDuty(s, d, "ci"); while (s.day < d) CR.endDay(s);
    while (!s.ring && s.min < 16 * 60) CR.spend(s, 10, "admin");
    CR.store.bump(); await sleep(40);
    const { findBtn, click } = require("./harness");
    await click(w, findBtn(doc, "Répondre")); await P.waitFor(() => doc.querySelector(".call-scene"));
    for (const re of [/Que savez-vous/, /J'y vais|Je prends le dossier/]) { await sleep(80); const sk = [...doc.querySelectorAll("button.link")].find((b) => texts(b).includes("Afficher toute")); if (sk) await click(w, sk); const b = [...doc.querySelectorAll(".q-btn")].find((x) => re.test(texts(x))); if (b) await click(w, b); }
    await P.waitFor(() => findBtn(doc, /^Terminer$/, doc.querySelector(".closing"))); await click(w, findBtn(doc, /^Terminer$/, doc.querySelector(".closing"))); await sleep(60);
    const cs = s.cases[s.order.find((id) => id.startsWith("g_"))];
    ok(!!cs, "pas d'affaire de comparution immédiate");
    if (cs) {
      const T = CR.client(cs).nom;
      for (const re of [/Lire le dossier/, /au dépôt/, /proche/, /employeur/]) { await P.openCase(w, doc, T); if (!P.taskBtn(doc, re)) continue; await P.runTask(w, doc, re); if (/dépôt/.test(re.source)) await P.runCall(w, doc, CR, {}); }
      U.noteDocs(CR, s, cs);
      CR.pinTexts(s, cs, ["CP_132-19", "CP_132-25"]);
      const h = cs.hearings.find((x) => !x.attended);
      while (s.day < h.day) CR.endDay(s);
      CR.store.bump(); await sleep(30);
      await U.goCourt(env);
      await runAudience(w, doc, CR, { prefer: [/jugé aujourd'hui/], limine: [/./], angle: /peine/i, args: [/hébergement/, /emploi/, /aménageable/], card: /Attestation|Domicile/ });
      const R = cs.vars.raisonnement;
      ok(!!R, "le jugement n'a pas été raisonné");
      ok(!!cs.vars.jugementEcrit, "pas de décision à écrire");
      ok(!CR.hasDoc(cs, "_jugement"), "la décision écrite arrive le jour même");
      const J = cs.vars.jugementEcrit;
      for (let k = 0; k < 10 && !CR.hasDoc(cs, "_jugement"); k++) CR.endDay(s);
      ok(CR.hasDoc(cs, "_jugement"), "la décision écrite n'arrive jamais");
      ok(s.inbox.some((m) => /Copie du jugement/.test(m.subject)), "le greffe n'envoie pas la copie");
      const dj = cs.docs.find((x) => x.key === "_jugement");
      const txt = dj ? CR.renderDoc(s, cs, dj).paras.map((p) => p.join(" ")).join("\n") : "";
      for (const re of [/À l'audience publique/, /ENTRE/, /DÉBATS/, /MOTIFS/, /Sur la matérialité des faits/, /PAR CES MOTIFS/, /Voies de recours/, /signé par le président et le greffier/]) ok(re.test(txt), "trame du jugement : " + re.source, txt.slice(0, 200));
      ok(!/undefined|\$\{|\bnull\b|NaN|\[object/.test(txt), "jugement écrit : texte technique");
      ok(J && J.notifie > J.day, "date de notification");
      console.log(`interface — ${CR.caseTitle(s, cs)} · ${R && R.coupable ? "condamnation" : "relaxe"} · jugement écrit de ${txt.split(/\s+/).length} mots, notifié ${J ? J.notifie - J.day : "?"} jours après`);
    }
    if (errors.length) ko("erreurs de l'interface", errors.slice(0, 2).join(" | "));
  }
  for (const [k, v] of Object.entries(vus)) console.log(`  ${k} : ${v}`);
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
