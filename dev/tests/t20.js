// Interface en pixel : icônes 8 × 8, bureau cliquable (téléphone, dossiers, courrier…)
const { boot, sleep, texts, findBtn, click } = require("./harness");
(async () => {
  const { w, CR, doc, errors } = boot();
  await sleep(200);
  const art = CR.UI.ICON_ART, bad = Object.entries(art).filter(([, r]) => r.length !== 8 || r.some((l) => l.length !== 8)).map(([k]) => k);
  console.log("icônes:", Object.keys(art).length, "mal formées:", bad.length ? bad.join(" ") : "aucune");
  await click(w, findBtn(doc, "Nouvelle partie"));
  await click(w, findBtn(doc, /^Carrière/) || findBtn(doc, /^Tutoriel/));
  await sleep(250);
  const s = CR.store.s; s.settings.coach = false; CR.store.bump(); await sleep(60);
  const hots = [...doc.querySelectorAll(".pano-hot")].map((b) => b.getAttribute("aria-label"));
  console.log("objets cliquables:", hots.join(" | "));
  const on = () => texts(doc.querySelector(".rail-btn.on") || doc.body).slice(0, 20);
  for (const [lab, want] of [["Dossiers", /^Dossiers/], ["Messagerie", /^Messagerie/], ["Téléphone", /^Téléphone/], ["Bibliothèque", /^Bibliothèque/], ["Agenda", /^Agenda/], ["Carte de Paris", /^Carte/]]) {
    const b = [...doc.querySelectorAll(".pano-hot")].find((x) => x.getAttribute("aria-label") === lab);
    if (!b) { console.log("ABSENT", lab); continue; }
    await click(w, b); await sleep(40);
    console.log(lab, "→", want.test(on()) ? "ok" : "ÉCHEC (" + on() + ")");
    await click(w, [...doc.querySelectorAll(".rail-btn")].find((x) => texts(x).startsWith("Bureau"))); await sleep(40);
  }
  // le téléphone qui sonne : cliquer dessus décroche
  for (let d = 0; d < 30 && !s.ring; d++) { while (!s.ring && s.min < 19 * 60) CR.spend(s, 10, "admin"); if (!s.ring) CR.endDay(s); }
  CR.store.bump(); await sleep(60);
  s.at = "cabinet"; CR.store.bump(); await sleep(40);
  const tel = [...doc.querySelectorAll(".pano-hot")].find((x) => x.getAttribute("aria-label") === "Téléphone");
  if (tel && s.ring) { await click(w, tel); await sleep(80); console.log("décroché:", !s.ring, "scène:", !!doc.querySelector(".call-scene")); } else console.log("pas de sonnerie", !!tel, !!s.ring);
  // moments forts : trajet animé, vignette de verdict, papier à en-tête ; puis tout en « animations réduites »
  const html = CR.UI.html, host = doc.createElement("div"); doc.body.appendChild(host);
  CR.travel(s, s.at === "cite" ? "palais" : "cite", "metro"); CR.store.bump(); await sleep(60);
  console.log("trajet animé:", !!doc.querySelector(".travel-fx"));
  const tfx = doc.querySelector(".travel-fx"); if (tfx) { await click(w, tfx); await sleep(40); }
  console.log("trajet passé d'un clic:", !doc.querySelector(".travel-fx"));
  const cs0 = s.cases[s.order[0]];
  const dec = { titre: "Jugement", entete: "Cour d'assises de Paris — audience", coupable: true, peine: { texte: "Huit ans de réclusion criminelle" }, dispositif: "Déclare l'accusé coupable." };
  w.ReactDOM.createRoot(host).render(html`<div><${CR.UI.VerdictCard} s=${s} cs=${cs0} dec=${dec} /><${CR.UI.DecisionPaper} s=${s} cs=${cs0} dec=${dec} /><${CR.UI.Paper} doc=${{ title: "Ordonnance de placement en détention provisoire", kind: "greffe", paras: [["Ordonnons."]] }} /></div>`);
  await sleep(80);
  console.log("verdict:", texts(host.querySelector(".verdict-mot") || host), "| sceau:", !!host.querySelector(".sceau"), "| en-tête:", /peuple français/i.test(texts(host)), "| ordonnance tamponnée:", !!host.querySelector(".has-rf .tampon"));
  w.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {} });
  CR.travel(s, "palais", "taxi"); CR.store.bump(); await sleep(60);
  console.log("animations réduites, pas de trajet animé:", !doc.querySelector(".travel-fx"));
  s.at = "cabinet"; CR.store.bump(); await sleep(60);
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})();
