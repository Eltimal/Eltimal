// Refonte, lot 8 : le recouvrement des dommages et intérêts de la victime (CIVI, SARVI). node tests/tvictimes.js
// « échecs: 0 » attendu. Atteinte grave : CIVI, offre du fonds sous deux mois, acceptée (homologation) ou refusée (la
// commission alloue le préjudice fixé) ; sinon : paiement du condamné ou, à défaut dans les deux mois de la décision
// définitive, aide au recouvrement ; rien fait dans l'année : forclusion ; information de la partie civile (art. 706-15).
const { boot, sleep } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot(); await sleep(50);
  const AP = CR.AP, H = CR.FLOW_HOOKS;
  const s = CR.newGame({ prenom: "A", nom: "Bernard", mode: "carriere", seed: 14 }); s.settings.saisie = "liste"; CR.store.s = s;
  CR.endGame = () => {}; CR.plainteBatonnier = () => {}; // un an simulé sans autre activité : ni faillite ni plainte au bâtonnier
  const vus = [];
  const ouvrir = (pred) => {
    for (let i = 0; i < 600; i++) {
      let cs; try { cs = CR.GEN.open(s, ["pc", "ci", "copj", "op"][i % 4], {}); } catch (e) { continue; }
      const jeter = () => { delete s.cases[cs.id]; s.order = s.order.filter((x) => x !== cs.id); s.pending = s.pending.filter((e) => e.caseId !== cs.id); };
      const p = CR.GEN.paramsOf(s, cs.id); if (!p || !p.t || cs.camp !== "pc") { jeter(); continue; }
      if (pred && !pred(p.t, cs)) { jeter(); continue; }
      cs.status = "active"; return { cs, t: p.t };
    }
    return null;
  };
  const juger = (x, montant) => { x.cs.vars.jugementDay = s.day; CR.closeCase(s, x.cs, { type: "indemnise", detail: CR.money(montant), indemnisation: montant }); };
  const jours = (n) => { for (let k = 0; k < n; k++) CR.endDay(s); };
  const tache = (cs, id) => CR.caseTasks(s, cs).find((x) => x.id === id);
  // 1. atteinte grave : la CIVI, offre acceptée
  const a = ouvrir((t, cs) => AP.civiEligible(s, cs));
  if (a) {
    vus.push("a");
    juger(a, 6000);
    ok(a.cs.status !== "closed" && a.cs.vars.recouv && a.cs.vars.recouv.civi, "la CIVI n'est pas ouverte pour une atteinte grave", JSON.stringify(a.cs.vars.recouv));
    const T = tache(a.cs, "civi"); ok(T, "pas de tâche pour saisir la CIVI");
    if (T) { T.run(); jours(62); }
    ok(a.cs.vars.recouv.etat === "offre" && a.cs.vars.recouv.offre > 0 && a.cs.vars.recouv.offre <= 6000, "pas d'offre du fonds sous deux mois (art. 706-5-1)", JSON.stringify(a.cs.vars.recouv));
    const acc = tache(a.cs, "civi_accepter"); if (acc) { acc.run(); jours(40); }
    ok(a.cs.status === "closed" && /CIVI/.test(a.cs.outcome.detail), "l'offre acceptée n'est pas payée et le dossier pas clos", JSON.stringify(a.cs.outcome));
  }
  // 2. offre refusée : la commission alloue le préjudice fixé par le tribunal
  const b = ouvrir((t, cs) => AP.civiEligible(s, cs));
  if (b) {
    vus.push("b");
    juger(b, 9000);
    tache(b.cs, "civi").run(); jours(62);
    const ref = tache(b.cs, "civi_refuser"); if (ref) { ref.run(); if (process.env.DBG) console.log("DBG", s.day, JSON.stringify(s.pending.filter((e) => e.caseId === b.cs.id))); jours(160); if (process.env.DBG) console.log("DBG2", s.day, b.cs.status, JSON.stringify(b.cs.outcome), b.cs.closedDay); }
    ok(b.cs.status === "closed" && b.cs.vars.recouv.verse === 9000, "après refus, la commission n'alloue pas le préjudice fixé", JSON.stringify(b.cs.vars.recouv));
  }
  // 3. hors CIVI : impayé après deux mois, puis aide au recouvrement
  let c = null; for (let k = 0; k < 6 && !c; k++) { const x = ouvrir((t, cs) => !AP.civiEligible(s, cs)); if (!x) break; juger(x, 1200); jours(85); if (x.cs.status !== "closed" && x.cs.vars.recouv.impaye != null) c = x; }
  if (c) {
    vus.push("c");
    const T = tache(c.cs, "sarvi"); ok(T, "pas de tâche SARVI après deux mois d'impayé");
    if (T) { T.run(); jours(62); }
    ok(c.cs.status === "closed" && /SARVI/.test(c.cs.outcome.detail), "l'aide au recouvrement ne clôt pas le dossier", JSON.stringify(c.cs.outcome));
  }
  // 4. rien fait dans l'année : forclusion
  let d = null; for (let k = 0; k < 8 && !d; k++) { const x = ouvrir((t, cs) => AP.civiEligible(s, cs)); if (!x) break; juger(x, 3000); jours(85); if (x.cs.status !== "closed") d = x; }
  if (d) {
    vus.push("d");
    jours(320);
    ok(d.cs.status === "closed" && (d.cs.erreurs || []).some((x) => x.id === "civi_forclos"), "pas de forclusion après un an sans requête", JSON.stringify(d.cs.vars.recouv));
  }
  // 5. la défense et la relaxe ne l'ouvrent pas ; l'information de la partie civile (art. 706-15)
  const e = ouvrir();
  if (e) { vus.push("e"); CR.closeCase(s, e.cs, { type: "deboute", detail: "relaxe" }); ok(e.cs.status === "closed" && !e.cs.vars.recouv, "le recouvrement s'ouvre après une relaxe"); }
  ok(a && JSON.stringify(s.mails || s.inbox || "").includes("706-15") || (a && JSON.stringify(a.cs).includes("706-15")) || JSON.stringify(s).includes("706-15"), "la partie civile n'est pas informée de ses recours (art. 706-15)");
  ok(vus.length === 5, "une section du test n'a pas trouvé d'affaire", vus.join(","));
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
