// Codes reliés (bibliothèque en livres) : composition des volumes, pagination stable, sommaire, index, Bulletin,
// interface (étagère, aller à l'article, tourner les pages, lire, annoter, mode liste, changement de volume).
// `échecs: 0` attendu. La hauteur réelle des pages se mesure à part : node tools/livremesure.js (Chromium).
const { boot, sleep, texts, findBtn, click } = require("./harness");
(async () => {
  const { w, CR, doc, errors } = boot();
  const fails = [];
  const ok = (c, m) => { if (!c) fails.push(m); };
  await sleep(200);
  const UI = CR.UI;

  // 1. Composition
  const vols = CR.volumes();
  ok(vols.map((v) => v.id).join(",") === "CP,CPP,CR,CJPM,ANNEXES,BULL", "volumes : " + vols.map((v) => v.id).join(","));
  const vus = {};
  for (const v of vols) {
    const L = CR.composerVolume(v.id);
    L.pages.forEach((p, i) => ok(p.n === i + 1, `${v.id} : page ${i + 1} mal numérotée`));
    ok(L.pages[0].kind === "titre" && L.pages[1].kind === "avert", v.id + " : page de titre et avertissement");
    ok(L.pages[L.pages.length - 1].kind === "index", v.id + " : index ou table en fin de volume");
    for (const [id, n] of Object.entries(L.artPage)) {
      vus[id] = (vus[id] || 0) + 1;
      ok(L.pages[n - 1].blocks.some((b) => b.t === "art" && b.id === id), `${v.id} : ${id} absent de sa page ${n}`);
    }
    for (const [k, n] of Object.entries(L.notePage)) { const [a, jp] = k.split("|"); ok(L.pages[n - 1].blocks.some((b) => b.t === "notes" && b.art === a && b.items.some((r) => r.jp === jp)), `${v.id} : note ${jp} sous ${a} absente de la page ${n}`); }
    for (const p of L.pages) for (const b of p.blocks) {
      if (b.t === "som" && b.e.page) ok(L.pages[b.e.page - 1].blocks.some((x) => (x.t === "h" && x.node === b.e.key) || (x.t === "partie")), `${v.id} : sommaire « ${b.e.label} » → p. ${b.e.page} sans l'intitulé`);
      if (b.t === "idx") for (const r of b.x.refs) ok(L.artPage[r.art], `${v.id} : index vers ${r.art} hors du volume`);
    }
    if (!v.bulletin) ok(L.pages.filter((p) => p.kind === "som").length >= 1, v.id + " : sommaire");
  }
  const arts = CR.LIB.filter((e) => !CR.estJP(e.id));
  for (const e of arts) ok(vus[e.id] === 1, `${e.id} imprimé ${vus[e.id] || 0} fois`);
  const B = CR.composerVolume("BULL");
  for (const id of Object.keys(CR.JP)) if (CR.lib(id)) ok(B.jpPage[id], "arrêt absent du Bulletin : " + id);
  const dates = B.pages.flatMap((p) => p.blocks.filter((b) => b.t === "arret").map((b) => CR.JP[b.jp].date));
  ok(dates.every((d, i) => !i || d >= dates[i - 1]), "Bulletin pas dans l'ordre des dates");
  // pagination stable
  const p63 = CR.composerVolume("CPP").artPage["CPP_63"];
  CR.viderLivres();
  ok(CR.composerVolume("CPP").artPage["CPP_63"] === p63, "pagination instable");
  console.log(`volumes : ${vols.map((v) => v.id + " " + CR.composerVolume(v.id).pages.length + " p.").join(", ")} ; art. 63 CPP p. ${p63}`);
  // une note n'est jamais seule sur sa page sans l'article ou le plan qui la précède dans le volume
  const C = CR.composerVolume("CPP");
  for (const p of C.pages) { const i = p.blocks.findIndex((b) => b.t === "notes"); if (i === 0) ok(p.blocks[0].suite || C.pages[p.n - 2].blocks.some((b) => b.t === "notes" || b.t === "plan" || b.t === "art"), "notes orphelines p. " + p.n); }

  // 2. Rendu d'une page avec un dossier : marque-pages, texte flou puis lu
  const s0 = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 2 });
  const fake = { id: "x", cards: ["CPP_63", "JP_CRIM_2024_03_06"] };
  const host = doc.createElement("div"); doc.body.appendChild(host);
  const pg = C.pages[C.artPage["CPP_63"] - 1];
  w.ReactDOM.render(UI.html`<${UI.LivrePage} p=${pg} side="droite" ctx=${{ s: s0, vol: C.vol, here: fake, read() {}, goPage() {}, goArt() {}, annoter() {}, hl: null, livre: C }} />`, host);
  await sleep(20);
  ok(host.querySelectorAll(".lv-ruban").length >= 1, "marque-page sur la tranche");
  ok(host.querySelector(".lv-art .lv-flou"), "article non lu imprimé flou");
  ok(/Art\. 63/.test(texts(host.querySelector(".lv-head"))), "titre courant avec l'article");
  w.ReactDOM.unmountComponentAtNode(host);

  // 3. Interface
  await click(w, findBtn(doc, "Nouvelle partie"));
  await click(w, findBtn(doc, /^Carrière — à votre compte/));
  await sleep(150);
  const s = CR.store.s;
  await click(w, [...doc.querySelectorAll(".rail-btn")].find((x) => texts(x).startsWith("Bibliothèque")));
  await sleep(60);
  ok(doc.querySelectorAll(".lv-volume").length === 6, "étagère : six volumes");
  await click(w, doc.querySelector('[aria-label="Ouvrir Code de procédure pénale"]'));
  await sleep(40);
  ok(doc.querySelector(".lv-livre") && doc.querySelector('.lv-page[data-page="1"]'), "volume ouvert à la page de titre");
  const aller = async (t) => { const el = doc.querySelector(".lv-aller input"); Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, "value").set.call(el, t); el.dispatchEvent(new w.Event("input", { bubbles: true })); await sleep(20); el.form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await sleep(700); };
  await aller("63");
  ok(doc.querySelector(`.lv-page[data-page="${p63}"]`), "aller à l'art. 63 : page " + p63);
  ok(doc.getElementById("lv-CPP_63"), "art. 63 affiché");
  const shown = () => [...doc.querySelectorAll(".lv-zoom > .lv-spread > .lv-page")].map((x) => +x.dataset.page).filter(Boolean);
  const avant = shown();
  await click(w, doc.querySelector(".lv-coin-d"));
  await sleep(700);
  const apres = shown();
  ok(apres[0] === avant[avant.length - 1] + 1, `tourner la page : ${avant} → ${apres}`);
  w.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
  await sleep(700);
  ok(shown()[0] === avant[0], "page précédente au clavier : " + shown());
  // lire une note : le temps passe, l'arrêt est lu
  const min0 = s.min;
  const lire = doc.querySelector(".lv-note .lv-lire");
  ok(lire, "note à lire");
  if (lire) { await click(w, lire); ok(s.min > min0 && s.researched.some((id) => CR.estJP(id)), "lire une note prend du temps"); }
  // annoter
  await click(w, doc.querySelector("#lv-CPP_63 .lv-crayon"));
  const inp = doc.querySelector(".lv-annot input");
  ok(inp, "champ d'annotation");
  if (inp) {
    Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, "value").set.call(inp, "à soulever in limine");
    inp.dispatchEvent(new w.Event("input", { bubbles: true })); await sleep(20);
    await click(w, findBtn(doc, "Écrire"));
    ok(s.annots && s.annots.CPP_63 && s.annots.CPP_63.length === 1 && doc.querySelector(".lv-postit"), "annotation au crayon");
  }
  // chercher dans le volume
  const q = doc.querySelector(".lv-cherche");
  Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, "value").set.call(q, "perquisition"); q.dispatchEvent(new w.Event("input", { bubbles: true })); await sleep(30);
  ok(doc.querySelectorAll(".lv-res").length >= 1, "recherche dans le volume");
  Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, "value").set.call(q, ""); q.dispatchEvent(new w.Event("input", { bubbles: true })); await sleep(20);
  // un article d'un autre code : on change de volume
  await aller("311-1");
  ok(/Code pénal/.test(texts(doc.querySelector(".lv-barre-t"))) && doc.getElementById("lv-CP_311-1"), "changement de volume vers le code pénal");
  // onglets de la tranche
  await click(w, [...doc.querySelectorAll(".lv-onglet")].find((b) => texts(b) === "Index"));
  await sleep(700);
  ok(doc.querySelector(".lv-idx"), "onglet Index");
  // mode liste et retour
  await click(w, [...doc.querySelectorAll(".lv-barre .link")].find((b) => texts(b) === "Mode liste"));
  ok(doc.querySelector(".library .tabs") && s.settings.bibliMode === "liste", "mode liste");
  await click(w, [...doc.querySelectorAll(".lv-mode .link")][0]);
  ok(doc.querySelector(".lv-etagere"), "retour aux codes reliés");
  // Bulletin
  await click(w, doc.querySelector('[aria-label="Ouvrir Bulletin des arrêts"]'));
  await click(w, [...doc.querySelectorAll(".lv-onglet")].find((b) => texts(b) === "Table"));
  await sleep(700);
  ok(doc.querySelectorAll(".lv-k-index .lv-som").length >= 19, "table des arrêts");
  await click(w, doc.querySelector(".lv-k-index .lv-som-l"));
  await sleep(700);
  ok(doc.querySelector(".lv-arret"), "la table renvoie à l'arrêt");
  // ouverture ciblée depuis un dossier (grande division)
  const host2 = doc.createElement("div"); doc.body.appendChild(host2);
  const focus = CR.planFocus({ issues: [{ text: "placé en garde à vue" }] });
  w.ReactDOM.render(UI.html`<${UI.LibraryPanel} s=${s} go=${{}} focus=${focus} />`, host2);
  await sleep(40);
  ok(host2.querySelector(`.lv-page[data-page="${CR.composerVolume("CPP").nodePage[focus]}"]`), "ouverture au titre des enquêtes");
  w.ReactDOM.unmountComponentAtNode(host2);

  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  console.log("échecs:", fails.length);
  for (const x of fails.slice(0, 40)) console.log(" -", x);
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
