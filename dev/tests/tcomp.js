// Refonte, C3 : la grille de compétences. node tests/tcomp.js   « échecs: 0 » attendu.
const { boot, sleep, texts } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { w, doc, CR, errors } = boot(); await sleep(100);
  const K = CR.COMP;
  ok(K && K.LISTE.length === 14, "la grille n'a pas quatorze compétences");
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 4 }); s.settings.coach = false;
  const affaire = (o = {}) => {
    const cs = CR.GEN.open(s, "ci", {}); cs.status = "active";
    cs.drafted.plainte_simple = [{ day: s.day, min: s.min, defects: [], filled: {}, picks: {}, depose: true }];
    cs.vars.auditionGav = { q: [] };
    if (o.erreur) CR.erreur(s, cs, { id: "canal_plainte_simple", texte: "Plainte transmise par télécopie.", sanction: "Irrecevable." });
    CR.closeCase(s, cs, { type: "relaxe" });
    return cs;
  };
  // en mode assisté, une réussite ne fait pas monter
  s.settings.saisie = "liste";
  const a = affaire();
  ok(a.compBilan && a.compBilan.some((b) => b.k === "ecrits" && b.ok && b.aide), "le bilan de l'affaire assistée manque", JSON.stringify(a.compBilan));
  ok(K.niveau(s, "ecrits") === 0, "une réussite assistée fait monter");
  // en mode libre : deux réussites → libre ; trois de plus → examen ; un échec en examen → libre
  s.settings.saisie = "assiste";
  affaire(); affaire();
  ok(K.niveau(s, "ecrits") === 1, "deux réussites sans aide ne font pas passer à libre", K.niveau(s, "ecrits"));
  affaire(); affaire(); affaire();
  ok(K.niveau(s, "ecrits") === 2, "trois réussites de plus ne font pas passer à examen", K.niveau(s, "ecrits"));
  const e = affaire({ erreur: true });
  ok(K.niveau(s, "ecrits") === 1 && e.compBilan.some((b) => b.k === "ecrits" && !b.ok && /télécopie/.test(b.why)), "un échec en examen ne fait pas redescendre", JSON.stringify(e.compBilan));
  ok(K.niveau(s, "gav") >= 1, "la garde à vue travaillée n'est pas comptée");
  ok(!K.travaillees(s, e).has("ap"), "une compétence non travaillée est comptée");
  // une affaire ne compte qu'une fois
  const n = s.comp.ecrits.affaires; K.clore(s, e); ok(s.comp.ecrits.affaires === n, "une affaire compte deux fois");
  // le classeur affiche la grille
  CR.store.s = s; CR.store.bump(); await sleep(40);
  const host = doc.createElement("div"); doc.body.appendChild(host);
  const root = w.ReactDOM.createRoot(host); root.render(w.React.createElement(CR.UI.ClasseurPanel, { s, go: () => {} })); await sleep(60);
  const tab = [...host.querySelectorAll(".tab")].find((x) => /Compétences/.test(texts(x)));
  ok(!!tab, "pas d'onglet Compétences au classeur");
  if (tab) { tab.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); await sleep(60); ok(/Écrits et transmission/.test(texts(host)) && /libre/.test(texts(host)), "la grille ne s'affiche pas", texts(host).slice(0, 300)); }
  root.unmount();
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
