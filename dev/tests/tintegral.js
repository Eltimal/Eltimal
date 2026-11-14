// Refonte, lot 9 : le texte intégral des codes dans la bibliothèque. node tests/tintegral.js   « échecs: 0 » attendu.
// Les quatre codes du jeu (pénal, procédure pénale, route, mineurs) sont reliés en entier : tous les articles en vigueur,
// sous le plan officiel, chacun à sa division ; les fiches du jeu gardent leur rubrique, leur lecture payante et leur
// enregistrement au dossier ; les autres articles se lisent librement et ne deviennent pas des cartes.
const { boot, sleep, texts } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { w, doc, CR, errors } = boot(); await sleep(50);
  const MIN = { CP: 1200, CPP: 4500, CR: 1100, CJPM: 500 };
  for (const [id, n] of Object.entries(MIN)) {
    const I = CR.integralDe(id);
    ok(I && Object.keys(I.arts).length >= n && /^\d{4}-\d{2}-\d{2}$/.test(I.maj) && /Licence Ouverte/.test(I.source), `${id} : texte intégral absent ou incomplet`, I && Object.keys(I.arts).length);
    if (!I) continue;
    // texte propre : ni balise ni entité
    const sale = Object.entries(I.arts).find(([, al]) => al.some((x) => /<[a-z/]|&[a-z]+;|&#\d+;/i.test(x)));
    ok(!sale, `${id} : balise ou entité dans le texte`, sale && sale[0] + " " + sale[1].join(" ").slice(0, 120));
    // chaque article est rangé, une seule fois, dans le plan officiel
    const code = CR.CODES_PLAN.find((c) => c.id === id);
    ok(code.integral, `${id} : plan officiel non utilisé`);
    const vus = new Set();
    for (const p of code.parties) { p.tous.forEach((x) => vus.add(x)); const wk = (arr) => arr.forEach((nd) => { nd.tous.forEach((x) => { ok(!vus.has(x), `${x} rangé deux fois`); vus.add(x); }); wk(nd.c); }); wk(p.noeuds); }
    ok(Object.keys(I.arts).every((a) => vus.has(id + "_" + a)), `${id} : article non rangé`);
    // les fiches du jeu ont toutes leur texte officiel
    const fiches = CR.LIB.filter((e) => !CR.estJP(e.id) && e.id.startsWith(id + "_"));
    const sans = fiches.filter((e) => !CR.article(e.id).officiel);
    ok(!sans.length, `${id} : fiches sans texte officiel`, sans.map((e) => e.id).join(","));
  }
  // un article hors fiches : lisible, jamais une carte
  const a = CR.article("CPP_706-73");
  ok(a && a.officiel && !a.lib && /crimes et des délits suivants/.test(a.alineas.join(" ")) && /code de procédure pénale/.test(a.cite), "CPP 706-73 hors fiches mal lu", JSON.stringify(a).slice(0, 200));
  ok(!CR.lib("CPP_706-73") && !CR.isLibId("CPP_706-73"), "un article hors fiches devient une carte");
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 4 }); CR.store.s = s;
  ok(CR.pinText(s, { id: "x", cards: [] }, "CPP_706-73") === false, "un article hors fiches s'enregistre au dossier");
  // le plan officiel : rangements exacts
  ok(/Livre IV › Titre XXV$/.test(CR.planChemin("CPP_706-73", true)), "chemin de CPP 706-73", CR.planChemin("CPP_706-73", true));
  ok(/Section 1 › Sous-section 1$/.test(CR.planChemin("CP_131-1", true)), "chemin de CP 131-1", CR.planChemin("CP_131-1", true));
  ok(CR.planOf("CPP_préliminaire") && !CR.planOf("CPP_préliminaire").node, "l'article préliminaire n'est pas en tête de la partie législative");
  ok(CR.planOf("CPP_16-1 A") && CR.planOf("CPP_16-1 A").node === CR.planOf("CPP_16-1").node, "un numéro à lettre (16-1 A) hors de sa section");
  // volumes : tous les articles, dans l'ordre du code, numéros de page croissants
  for (const id of Object.keys(MIN)) {
    const V = CR.composerVolume(id);
    const ordre = CR.CODES_PLAN.find((c) => c.id === id).parties.flatMap((p) => { const l = p.tous.slice(); const wk = (arr) => arr.forEach((nd) => { l.push(...nd.tous); wk(nd.c); }); wk(p.noeuds); return l; });
    ok(ordre.every((x) => V.artPage[x]), `${id} : article absent du volume`);
    ok(ordre.every((x, i) => !i || V.artPage[x] >= V.artPage[ordre[i - 1]]), `${id} : pages dans le désordre`);
    ok(V.pages.length > 100, `${id} : volume trop mince`, V.pages.length);
  }
  // un article long coule sur plusieurs pages, sans perdre un mot
  const C = CR.composerVolume("CPP");
  const morceaux = C.pages.flatMap((p) => p.blocks.filter((b) => b.t === "art" && b.id === "CPP_706-73"));
  ok(morceaux.length >= 1 && morceaux.every((b, i) => b.de === (i ? morceaux[i - 1].a : 0)), "article long mal découpé", JSON.stringify(morceaux));
  const longs = C.pages.filter((p) => p.blocks.some((b) => b.t === "art" && b.suite)).length;
  ok(longs > 10, "aucun article ne coule sur la page suivante", longs);
  // rendu : la fiche non lue est floue, l'article hors fiches se lit
  const pg = C.pages[C.artPage["CPP_63-1"] - 1];
  const host = doc.createElement("div"); doc.body.appendChild(host);
  w.ReactDOM.render(CR.UI.html`<${CR.UI.LivrePage} p=${pg} side="droite" ctx=${{ s, vol: C.vol, here: null, read() {}, goPage() {}, goArt() {}, annoter() {}, hl: null, livre: C }} />`, host);
  await sleep(20);
  ok(host.querySelector("#lv-CPP_63-1 .lv-flou") && host.querySelector("#lv-CPP_63-1 .lv-rub"), "fiche non lue sans flou ou sans rubrique");
  w.ReactDOM.unmountComponentAtNode(host);
  w.ReactDOM.render(CR.UI.html`<${CR.UI.LivrePage} p=${C.pages[C.artPage["CPP_706-73"] - 1]} side="droite" ctx=${{ s, vol: C.vol, here: null, read() {}, goPage() {}, goArt() {}, annoter() {}, hl: null, livre: C }} />`, host);
  await sleep(20);
  const integ = host.querySelector(".lv-integ");
  ok(integ && !integ.querySelector(".lv-flou") && !integ.querySelector(".lv-rub") && texts(integ).length > 40, "article hors fiches illisible sur la page", integ && texts(integ).slice(0, 100));
  ok(host.querySelectorAll(".lv-al").length >= 1, "alinéas non séparés");
  w.ReactDOM.unmountComponentAtNode(host);
  // page de titre datée de la version du texte
  const t = doc.createElement("div"); doc.body.appendChild(t);
  w.ReactDOM.render(CR.UI.html`<${CR.UI.LivrePage} p=${C.pages[0]} side="droite" ctx=${{ s, vol: C.vol, here: null, read() {}, goPage() {}, goArt() {}, annoter() {}, hl: null, livre: C }} />`, t);
  await sleep(20);
  ok(new RegExp("en vigueur au " + CR.dateCode(CR.integralDe("CPP").maj)).test(texts(t)), "page de titre sans la date du texte", texts(t));
  w.ReactDOM.unmountComponentAtNode(t);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log(`texte intégral : ${Object.keys(MIN).map((id) => `${id} ${Object.keys(CR.integralDe(id).arts).length} art., ${CR.composerVolume(id).pages.length} p.`).join(" · ")} ; ${longs} pages de suite d'article (CPP)`);
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
