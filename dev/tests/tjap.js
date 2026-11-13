// Refonte, lot 8 : l'aménagement de la peine devant le juge de l'application des peines. node tests/tjap.js
// « échecs: 0 » attendu. Convocation dans les vingt jours pour un an ou moins de prison ferme, sans mandat de dépôt (art. 474) ;
// pas de convocation au-delà d'un an, ni avec mandat de dépôt ; justificatifs tirés de la fiche ; mesure plaidée accordée si
// elle est justifiée ; à six mois ou moins, aménagement dès qu'une mesure est possible (art. 723-15) ; sinon rapport du SPIP
// (723-15-1), puis date d'incarcération (723-15-2) ; l'appel interrompt ; l'avocat absent : erreur datée ; scène rendue.
const { boot, sleep, texts } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { w, doc, CR, errors } = boot(); await sleep(50);
  const AP = CR.AP, H = CR.FLOW_HOOKS;
  ok(AP && CR.AUDIENCES && CR.AUDIENCES.jap, "module d'application des peines absent");
  const s = CR.newGame({ prenom: "A", nom: "Bernard", mode: "carriere", seed: 12 }); s.settings.saisie = "liste"; CR.store.s = s;
  const ouvrir = (pred) => {
    for (let i = 0; i < 400; i++) {
      let cs; try { cs = CR.GEN.open(s, ["ci", "copj", "op"][i % 3], {}); } catch (e) { continue; }
      const p = CR.GEN.paramsOf(s, cs.id); if (!p || !p.t || !p.t.A || cs.camp === "pc") continue;
      if (pred && !pred(p.t.A, p.t)) continue;
      cs.status = "active"; return { cs, t: p.t };
    }
    return null;
  };
  const vus = [];
  const condamner = (x, ferme, o = {}) => { x.cs.vars.jugementDay = s.day; x.cs.vars.peineDetail = Object.assign({ ferme, sursis: 0, mandatDepot: false, amenagement: null, crime: false }, o); CR.closeCase(s, x.cs, { type: "condamnation", detail: `${ferme} mois` }); };
  // 1. éligible : convocation dans les vingt jours, dossier ouvert
  const a = ouvrir((A) => A.emploi && A.heberg);
  ok(a, "pas d'affaire avec un client qui travaille et a un logement");
  if (a) {
    vus.push("a");
    condamner(a, 4);
    const h = a.cs.hearings.find((x) => x.script === "jap");
    ok(a.cs.status !== "closed" && h && h.day - s.day <= 20 && h.day > s.day, "pas de convocation dans les vingt jours (art. 474)", JSON.stringify(h && { d: h.day - s.day }));
    const T = CR.caseTasks(s, a.cs);
    const tache = T.find((x) => x.id === "ap_justifs");
    ok(tache, "pas de tâche pour réunir les justificatifs", T.map((x) => x.id).join(","));
    if (tache) { tache.run(); for (let k = 0; k < 4; k++) CR.endDay(s); }
    ok(CR.hasFact(a.cs, "AP_travail") && CR.hasFact(a.cs, "AP_domicile"), "les justificatifs du client ne sont pas reçus", JSON.stringify(a.cs.vars.ap));
    const lignes = H.japDecider(CR.api(s, a.cs), { played: new Set(["arg:ddse"]) });
    ok(a.cs.status === "closed" && a.cs.vars.ap.mesure === "ddse" && /surveillance électronique/.test(JSON.stringify(lignes)), "la mesure plaidée et justifiée n'est pas accordée", JSON.stringify(a.cs.vars.ap));
    ok(/aménagée/.test((a.cs.outcome && a.cs.outcome.detail) || ""), "l'issue ne dit pas l'aménagement", JSON.stringify(a.cs.outcome));
  }
  // 2. six mois ou moins : la loi impose l'aménagement dès qu'une mesure est possible, même non plaidée
  const b = ouvrir((A) => A.emploi);
  if (b) {
    vus.push("b");
    condamner(b, 5);
    for (const f of ["AP_travail"]) CR.addNote(s, b.cs, { text: "Attestation de l'employeur.", fact: f, src: "client" });
    H.japDecider(CR.api(s, b.cs), { played: new Set() });
    ok(b.cs.vars.ap.mesure === "semi", "à six mois ou moins, une mesure possible n'est pas ordonnée (art. 723-15)", JSON.stringify(b.cs.vars.ap));
  }
  // 3. rien au dossier : rapport du SPIP, puis date d'incarcération
  const c = ouvrir((A) => !A.emploi && !A.heberg);
  if (c) {
    vus.push("c");
    condamner(c, 9);
    H.japDecider(CR.api(s, c.cs), { played: new Set(["arg:ddse"]) });
    ok(c.cs.status !== "closed" && c.cs.vars.ap.renvois === 1 && c.cs.hearings.filter((x) => x.script === "jap").length === 2, "sans éléments, pas de rapport du SPIP (art. 723-15-1)", JSON.stringify(c.cs.vars.ap));
    H.japDecider(CR.api(s, c.cs), { played: new Set(["arg:ddse"]) });
    ok(c.cs.status === "closed" && c.cs.vars.ap.incarceration > s.day && /incarcération/.test(c.cs.outcome.detail), "pas de date d'incarcération après le rapport (art. 723-15-2)", JSON.stringify(c.cs.vars.ap));
  }
  // 4. hors champ : plus d'un an, mandat de dépôt, peine déjà aménagée par le tribunal : clôture immédiate
  for (const [ferme, o, nom] of [[18, {}, "plus d'un an"], [6, { mandatDepot: true }, "mandat de dépôt"], [6, { amenagement: "ddse" }, "aménagée à l'audience"]]) {
    const x = ouvrir(); if (!x) continue;
    condamner(x, ferme, o);
    ok(x.cs.status === "closed" && !x.cs.vars.ap, `convocation à tort (${nom})`);
  }
  // 5. l'appel interrompt la procédure ; l'avocat absent : erreur, et décision sur les seules pièces
  const d = ouvrir();
  if (d) {
    vus.push("d");
    condamner(d, 3);
    d.cs.proc.appel = { day: s.day, etendue: "total", recevable: true };
    H.filed_appel(CR.api(s, d.cs), { res: {}, depot: false });
    ok(d.cs.status === "closed" && d.cs.hearings.every((x) => x.script !== "jap" || x.canceled), "l'appel n'interrompt pas la procédure d'exécution", JSON.stringify(d.cs.vars.ap));
  }
  const e = ouvrir((A) => !A.emploi && !A.heberg);
  if (e) {
    vus.push("e");
    condamner(e, 3);
    H._japSansVous(CR.api(s, e.cs), {});
    ok((e.cs.erreurs || []).some((x) => x.id === "jap_absent"), "l'absence de l'avocat n'est pas relevée");
  }
  // 6. la scène se rend
  const f = ouvrir((A) => A.heberg);
  if (f) {
    vus.push("f");
    condamner(f, 4);
    const h = f.cs.hearings.find((x) => x.script === "jap");
    s.day = h.day; s.min = h.min;
    const host = doc.createElement("div"); doc.body.appendChild(host);
    const root = w.ReactDOM.createRoot(host); root.render(w.React.createElement(CR.UI.HearingScene, { s, cs: f.cs, hid: h.id, onDone: () => {}, setScene: () => {} }));
    let ok6 = false; for (let k = 0; k < 300 && !ok6; k++) { await sleep(40); ok6 = /application des peines/i.test(texts(host)) && /condamné/.test(texts(host)); }
    ok(ok6, "la scène du juge de l'application des peines ne se rend pas", texts(host).slice(0, 300));
    root.unmount();
  }
  ok(vus.length === 6, "une section du test n'a pas trouvé d'affaire", vus.join(","));
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
