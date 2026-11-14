// Refonte, lot 8 : l'action civile renvoyée (art. 464 CPP). node tests/tic.js   « échecs: 0 » attendu.
// Le renvoi sur les intérêts civils ne clôt plus le dossier : audience à juge unique fixée, justificatifs réunis auprès de la
// victime, postes plaidés ; le tribunal alloue selon les pièces (réduit ce qui n'est pas justifié) ; la décision chiffrée
// ouvre le recouvrement ; sans demande, débouté ; l'avocat absent : erreur ; la scène se rend.
const { boot, sleep, texts } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { w, doc, CR, errors } = boot(); await sleep(50);
  const AP = CR.AP, H = CR.FLOW_HOOKS;
  const s = CR.newGame({ prenom: "A", nom: "Bernard", mode: "carriere", seed: 21 }); s.settings.saisie = "liste"; CR.store.s = s;
  CR.endGame = () => {}; CR.plainteBatonnier = () => {};
  const vus = [];
  const ouvrir = () => {
    for (let i = 0; i < 300; i++) {
      let cs; try { cs = CR.GEN.open(s, "pc", {}); } catch (e) { continue; }
      const def = CR.caseDef(cs); const postes = ((def.penal && def.penal.chiffrage && def.penal.chiffrage.postes) || []).filter((po) => po.demande);
      if (cs.camp !== "pc" || !postes.length || !postes.some((po) => po.justif) || !postes.some((po) => !po.justif)) { delete s.cases[cs.id]; s.order = s.order.filter((x) => x !== cs.id); continue; }
      cs.status = "active"; return { cs, postes };
    }
    return null;
  };
  const renvoyer = (x) => { x.cs.vars.jugementDay = s.day; x.cs.vars.civil = { lignes: [], total: 0, art475: 0, renvoi: true }; CR.closeCase(s, x.cs, { type: "done", detail: "renvoi sur les intérêts civils" }); };
  // 1. le renvoi : audience fixée, dossier ouvert, justificatifs, décision selon les pièces, puis recouvrement
  const a = ouvrir();
  if (a) {
    vus.push("a");
    renvoyer(a);
    const h = a.cs.hearings.find((x) => x.script === "ic");
    ok(a.cs.status !== "closed" && a.cs.vars.ic && h && h.day > s.day, "le renvoi sur intérêts civils ne fixe pas d'audience (art. 464)", JSON.stringify(a.cs.vars.ic));
    const T = CR.caseTasks(s, a.cs).find((x) => x.id === "ic_justifs");
    ok(T, "pas de tâche pour réunir les justificatifs");
    if (T) T.run();
    const played = new Set(a.postes.map((po) => "arg:ic_" + po.id).concat(["arg:ic_475"]));
    H.icDecider(CR.api(s, a.cs), { played });
    const L = a.cs.vars.civil.lignes;
    ok(L.length === a.postes.length && a.cs.vars.civil.total > 0, "le tribunal n'alloue pas les postes plaidés", JSON.stringify(a.cs.vars.civil));
    for (const l of L) { const po = a.postes.find((x) => x.label === l.label); if (po && !l.justifie) ok(l.alloue < Math.min(po.demande, po.base), `poste non justifié non réduit : ${l.label}`, JSON.stringify(l)); }
    ok(a.cs.vars.recouv && a.cs.vars.recouv.montant === a.cs.vars.civil.total && a.cs.status !== "closed", "la décision chiffrée n'ouvre pas le recouvrement", JSON.stringify(a.cs.vars.recouv));
  }
  // 2. rien plaidé : débouté, dossier clos
  const b = ouvrir();
  if (b) { vus.push("b"); renvoyer(b); H.icDecider(CR.api(s, b.cs), { played: new Set() }); ok(b.cs.status === "closed" && b.cs.outcome.type === "deboute", "sans demande, pas de débouté", JSON.stringify(b.cs.outcome)); }
  // 3. l'avocat absent
  const c = ouvrir();
  if (c) { vus.push("c"); renvoyer(c); H._icSansVous(CR.api(s, c.cs), {}); ok((c.cs.erreurs || []).some((x) => x.id === "ic_absent") && c.cs.status === "closed", "l'absence à l'audience sur intérêts civils n'est pas relevée"); }
  // 4. hors champ : une relaxe (débouté) ne fixe rien
  const d = ouvrir();
  if (d) { vus.push("d"); CR.closeCase(s, d.cs, { type: "deboute", detail: "relaxe" }); ok(d.cs.status === "closed" && !d.cs.vars.ic, "une relaxe ouvre l'audience sur intérêts civils"); }
  // 5. la scène se rend
  const e = ouvrir();
  if (e) {
    vus.push("e"); renvoyer(e);
    const h = e.cs.hearings.find((x) => x.script === "ic"); s.day = h.day; s.min = h.min;
    const host = doc.createElement("div"); doc.body.appendChild(host);
    const root = w.ReactDOM.createRoot(host); root.render(w.React.createElement(CR.UI.HearingScene, { s, cs: e.cs, hid: h.id, onDone: () => {}, setScene: () => {} }));
    let vu = false; for (let k = 0; k < 300 && !vu; k++) { await sleep(40); vu = /juge unique/.test(texts(host)); }
    ok(vu, "la scène de l'audience sur intérêts civils ne se rend pas", texts(host).slice(0, 300));
    root.unmount();
  }
  ok(vus.length === 5, "une section du test n'a pas trouvé d'affaire", vus.join(","));
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
