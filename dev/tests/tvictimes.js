// Refonte, lot 8 : le recouvrement des dommages et intérêts de la victime (CIVI, SARVI). node tests/tvictimes.js
// « échecs: 0 » attendu. Atteinte grave : CIVI, offre du fonds sous deux mois, acceptée (homologation) ou refusée (la
// commission alloue le préjudice fixé) ; sinon : paiement du condamné ou, à défaut dans les deux mois de la décision
// définitive, aide au recouvrement ; rien fait dans l'année : forclusion ; information de la partie civile (art. 706-15) ;
// article 706-14 : indemnité plafonnée, SARVI fermé à la victime indemnisable, rejet motivé et délai du SARVI repoussé.
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
  // (une victime hors de l'article 706-14 : sinon le SARVI lui est fermé, art. 706-15-1)
  let c = null; for (let k = 0; k < 12 && !c; k++) { const x = ouvrir((t, cs) => !AP.civiEligible(s, cs) && !AP.art14(s, cs, 1200).ok); if (!x) break; juger(x, 1200); jours(85); if (x.cs.status !== "closed" && x.cs.vars.recouv.impaye != null) c = x; }
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
  // 6. article 706-14 : atteinte aux biens, ressources modestes, impayé : la commission, indemnité plafonnée
  ok(AP.plafond14(1).indemnite === 4857 && AP.plafond14(1).ressources === 19433 && AP.plafond14(3).ressources === 24097, "plafonds de l'article 706-14 (circulaire 2026)", JSON.stringify(AP.plafond14(1)));
  let f = null; for (let k = 0; k < 12 && !f; k++) { const x = ouvrir((t, cs) => AP.art14(s, cs, 9000).ok && !AP.art14(s, cs, 9000).personne); if (!x) break; juger(x, 9000); jours(85); if (x.cs.status !== "closed" && x.cs.vars.recouv.impaye != null) f = x; }
  if (f) {
    vus.push("f");
    ok(!tache(f.cs, "sarvi") || tache(f.cs, "civi14"), "pas de tâche pour la commission (article 706-14)");
    const T = tache(f.cs, "civi14"); ok(T, "pas de tâche civi14", CR.caseTasks(s, f.cs).map((x) => x.id).join(","));
    if (T) { T.run(); jours(62); }
    const R0 = f.cs.vars.recouv;
    ok(R0.etat === "offre" && R0.offre > 0 && R0.offre <= AP.plafond14(R0.art14.foyer).indemnite, "offre du fonds au-delà du plafond de l'article 706-14", JSON.stringify(R0));
    const ref = tache(f.cs, "civi_refuser"); if (ref) { ref.run(); jours(160); }
    ok(f.cs.status === "closed" && R0.verse === Math.min(9000, AP.plafond14(R0.art14.foyer).indemnite), "la commission n'alloue pas l'indemnité plafonnée", JSON.stringify(R0));
  }
  // 7. la même victime demande le SARVI : irrecevable (art. 706-15-1), erreur, la commission reste ouverte
  let g = null; for (let k = 0; k < 12 && !g; k++) { const x = ouvrir((t, cs) => AP.art14(s, cs, 2500).ok); if (!x) break; juger(x, 2500); jours(85); if (x.cs.status !== "closed" && x.cs.vars.recouv.impaye != null) g = x; }
  if (g) {
    vus.push("g");
    const T = tache(g.cs, "sarvi"); ok(T, "la demande de SARVI n'est pas proposée (elle doit pouvoir être faite à tort)");
    if (T) { T.run(); jours(40); }
    ok(g.cs.status !== "closed" && (g.cs.erreurs || []).some((x) => x.id === "sarvi_706_14") && tache(g.cs, "civi14") && !tache(g.cs, "sarvi"), "le SARVI demandé à tort n'est pas refusé, ou la commission n'est plus ouverte", JSON.stringify(g.cs.vars.recouv));
  }
  // 8. ressources au-dessus du plafond : la commission rejette, motifs à l'appui ; le SARVI reste ouvert, délai repoussé
  let h = null; for (let k = 0; k < 20 && !h; k++) { const x = ouvrir((t, cs) => { const a = AP.art14(s, cs, 2500); return a.champ && !a.sous; }); if (!x) break; juger(x, 2500); jours(85); if (x.cs.status !== "closed" && x.cs.vars.recouv.impaye != null) h = x; }
  if (h) {
    vus.push("h");
    const T = tache(h.cs, "civi14"); if (T) { T.run(); jours(62); }
    ok(h.cs.vars.recouv.rejet14 != null && h.cs.status !== "closed" && tache(h.cs, "sarvi") && !tache(h.cs, "civi14"), "rejet de la commission mal suivi", JSON.stringify(h.cs.vars.recouv));
    jours(300);
    ok(h.cs.status !== "closed" && tache(h.cs, "sarvi"), "le délai du SARVI ne court pas de la décision de la commission (art. 706-5)", JSON.stringify(h.cs.vars.recouv));
    const S = tache(h.cs, "sarvi"); if (S) { S.run(); jours(62); }
    ok(h.cs.status === "closed" && /SARVI/.test(h.cs.outcome.detail), "SARVI après rejet de la commission", JSON.stringify(h.cs.outcome));
  }
  ok(vus.length === 8, "une section du test n'a pas trouvé d'affaire", vus.join(","));
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
