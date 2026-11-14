// Facturation à la clôture : forfait, temps passé, provision, honoraire de résultat — sur des affaires générées (les clauses de
// résultat sont celles qu'avaient les anciennes affaires écrites, retirées du jeu).
const { boot, sleep, texts, findBtn, click } = require("./harness");
const P = require("./play"); const U = require("./util");
let fails = 0;
const check = (label, ok, info) => { if (!ok) fails++; console.log((ok ? "ok   " : "FAIL ") + label + (info != null ? " — " + info : "")); };

(async () => {
  const { CR, errors } = boot();
  await sleep(100);
  if (CR.AP) CR.AP.off = true; // la facturation seule : pas de phase d'exécution ni de recouvrement après le jugement
  const fresh = () => { CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed: 11 }); CR.store.s.cash = 100000; return CR.store.s; };
  // une affaire générée du camp voulu
  const gen = (s, camp, K = CR) => { for (let i = 0; i < 200; i++) { let c; try { c = K.GEN.open(s, camp === "pc" ? "pc" : ["copj", "ci", "op"][i % 3], {}); } catch (e) { continue; } if (c && (c.camp === "pc") === (camp === "pc")) return c; } throw new Error("aucune affaire générée " + camp); };
  const engage = (s, camp, fee) => {
    const cs = gen(s, camp);
    cs.status = "prospect";
    cs.fee = Object.assign({ agreed: s.day, fairRatio: 1, rounds: 1 }, fee);
    CR.FLOW_HOOKS.filed_convention(CR.api(s, cs), { res: { defects: [] } });
    return cs;
  };
  const payDays = (s, cs) => { for (let i = 0; i < 70 && s.pending.some((e) => e.key === "solde" && e.data.caseId === cs.id); i++) CR.endDay(s); };

  // A. Forfait + honoraire de résultat atteint (relaxe remplit « classement ou alternative »)
  let s = fresh();
  let cs = engage(s, "defense", { type: "forfait", amount: 1300, complement: 500, resultat: "classement ou alternative aux poursuites" });
  check("A provision à la signature", cs.collected === 650, cs.collected);
  CR.closeCase(s, cs, { type: "relaxe" });
  check("A résultat atteint", cs.facture && cs.facture.resultat === true);
  check("A total forfait + résultat", cs.facture.total === 1800 && cs.billed === 1800, cs.facture.total);
  const ev = s.pending.find((e) => e.key === "solde" && e.data.caseId === cs.id);
  check("A solde programmé", ev && ev.data.amount === 1150, ev && ev.data.amount);
  payDays(s, cs);
  check("A solde encaissé (ou impayé signalé)", cs.collected === 1800 || cs.flags.impaye, cs.collected);

  // B. Forfait + résultat non atteint : CRPC avec suspension du permis
  s = fresh();
  cs = engage(s, "defense", { type: "forfait", amount: 1100, complement: 400, resultat: "maintien du permis de conduire" });
  CR.closeCase(s, cs, { type: "crpc", detail: "4 mois d'emprisonnement avec sursis, quatre mois de suspension du permis de conduire" });
  check("B résultat non atteint", cs.facture.resultat === false);
  check("B total = forfait seul", cs.facture.total === 1100, cs.facture.total);
  const note = s.inbox.find((m) => /Facture de clôture/.test(m.subject));
  check("B note de facture explique l'absence de résultat", note && JSON.stringify(note.body).includes("n'est pas dû"));

  // C. Temps passé : seul le travail sur le dossier compte ; provision supérieure → restitution
  s = fresh();
  cs = engage(s, "pc", { type: "temps", rate: 200, provision: 1000 });
  const cash0 = s.cash;
  s.workCase = cs.id; CR.spend(s, 90, "desk"); CR.spend(s, 30, "idle"); s.workCase = null;
  CR.spend(s, 30, "admin");
  CR.spend(s, 20, "call", { caseId: cs.id });
  check("C temps imputé (90 + 20 min)", cs.worked === 110, cs.worked);
  CR.closeCase(s, cs, { type: "indemnise", detail: "3 000 €", indemnisation: 3000 });
  check("C dû = 110 min × 200 €", cs.facture.total === 367, cs.facture.total);
  check("C trop-perçu restitué", cs.collected === 367 && s.cash === cash0 - 633, `encaissé ${cs.collected}, caisse ${s.cash - cash0}`);

  // D. Temps passé supérieur à la provision → solde facturé
  s = fresh();
  cs = engage(s, "pc", { type: "temps", rate: 250, provision: 500 });
  s.workCase = cs.id; CR.spend(s, 300, "research", { fixed: true }); s.workCase = null;
  CR.closeCase(s, cs, { type: "done", detail: "fonds non récupérés" });
  check("D dû = 5 h × 250 €", cs.facture.total === 1250, cs.facture.total);
  const evD = s.pending.find((e) => e.key === "solde" && e.data.caseId === cs.id);
  check("D solde = dû − provision", evD && evD.data.amount === 750, evD && evD.data.amount);
  payDays(s, cs);
  check("D solde encaissé (ou impayé signalé)", cs.collected === 1250 || cs.flags.impaye, cs.collected);

  // E. Lecture des clauses de résultat
  s = fresh();
  const R = (camp, clause, o, prep) => { const c = gen(s, camp); c.status = "active"; c.fee = Object.assign({}, c.fee || {}, { resultat: clause }); if (prep) prep(c); return CR.resultatAtteint(s, c, o); };
  check("E peine réduite", R("defense", "mise en liberté ou peine réduite", { type: "condamnation", detail: "x" }, (c) => { c.vars.peine = { ferme: 60, sursis: 0 }; c.vars.requisJuge = { ferme: 96, sursis: 0 }; }) === true);
  s = fresh();
  check("E peine égale aux réquisitions", R("defense", "mise en liberté ou peine réduite", { type: "condamnation", detail: "x" }, (c) => { c.vars.peine = { ferme: 96, sursis: 0 }; c.vars.requisJuge = { ferme: 96, sursis: 0 }; }) === false);
  s = fresh();
  check("E mise en liberté", R("defense", "non-lieu ou mise en liberté", { type: "condamnation", detail: "x" }, (c) => { c.proc.detention.statut = "dp"; CR.PROC.detention(CR.api(s, c), "cj", {}); }) === true);
  s = fresh();
  check("E infirmation", R("defense", "infirmation", { type: "reformation", detail: "x" }) === true);
  check("E condamnation (partie civile)", R("pc", "condamnation", { type: "done", detail: "renvoi sur les intérêts civils" }, (c) => { c.vars.decision = { coupable: true }; }) === true);
  check("E indemnisation intégrale refusée si un poste est réduit", R("pc", "indemnisation intégrale", { type: "indemnise", detail: "x" }, (c) => { c.vars.civil = { lignes: [{ justifie: true, alloue: 900 }, { justifie: false, alloue: 300 }] }; }) === false);
  check("E jugé sans l'avocat : jamais de résultat", R("defense", "maintien du permis de conduire", { type: "relaxe", detail: "jugée sans avocat" }) === false);

  // F. En partie réelle : le temps des tâches et des scènes s'impute au dossier
  const env = await U.career(null);
  const { w, doc } = env; const s2 = env.s; const C2 = env.CR;
  if (C2.AP) C2.AP.off = true;
  const c2 = gen(s2, "defense", C2); c2.status = "prospect";
  c2.fee = { agreed: s2.day, fairRatio: 1, rounds: 1, type: "temps", rate: 200, provision: 0 };
  C2.FLOW_HOOKS.filed_convention(C2.api(s2, c2), { res: { defects: [] } });
  c2.status = "active"; C2.store.bump(); await sleep(60);
  const w0 = c2.worked || 0;
  await P.openCase(w, doc, C2.client(c2).nom);
  const tache = P.taskBtn(doc, /copie|Préparer|Lire|Recevoir|Appeler/);
  check("F une tâche du dossier est proposée", !!tache);
  if (tache) await P.runTask(w, doc, /copie|Préparer|Lire|Recevoir|Appeler/);
  check("F tâche imputée au dossier", (c2.worked || 0) > w0, `${w0} → ${c2.worked} min`);
  C2.spend(s2, 30, "admin");
  check("F paperasse hors dossier non imputée", s2.workCase == null, s2.workCase);

  console.log("échecs:", fails);
  const errs = errors.concat(env.errors);
  console.log("errors:", errs.length ? errs.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
