// Carte : balises, sélection, trajet, lieux hors champ, détenus, ambiances
const { boot, sleep, texts, findBtn, click } = require("./harness");
(async () => {
  const { w, CR, doc, errors } = boot();
  await sleep(200);
  await click(w, findBtn(doc, "Nouvelle partie"));
  await click(w, findBtn(doc, /^Carrière/));
  await sleep(200);
  const s = CR.store.s;
  s.settings.coach = false; s.settings.saisie = "liste";
  s.detenus.push({ caseId: "x", nom: "Test Détenu", etab: "fresnes", statut: "prevenu", since: 0, humeur: 50 });
  CR.addTempPlace(s, "bar", { nom: "Le Comptoir", sous: "18e", x: 0.47, y: 0.2 });
  CR.store.bump();
  await click(w, [...doc.querySelectorAll(".rail-btn")].find((x) => texts(x).startsWith("Carte")));
  await sleep(100);
  const hits = [...doc.querySelectorAll(".mp-hit")];
  console.log("pins:", hits.length, hits.map((h) => h.getAttribute("aria-label").split(" ·")[0].slice(0, 22)).join(" | "));
  const model = CR.mapModel(s, "cite", new Set(["palais"]));
  const off = model.pins.filter((p) => p.dx || p.dy).map((p) => p.id + "(" + p.dx + "," + p.dy + ")");
  console.log("offsets:", off.join(" "), "here", JSON.stringify(model.here), "route", !!model.route);
  for (const p of model.pins) if (p.x + p.dx < 0 || p.x + p.dx > CR.MAP_W || p.y + p.dy < 14 || p.y + p.dy > CR.MAP_H) console.log("HORS CADRE", p.id, p.x + p.dx, p.y + p.dy);
  // choisir chaque lieu : le détail s'affiche
  for (const h of [...doc.querySelectorAll(".mp-hit")]) {
    await click(w, h);
    const t = texts(doc.querySelector(".carte-side"));
    if (!t) console.log("pas de détail pour", h.getAttribute("aria-label"));
  }
  // Fresnes : le détenu apparaît
  await click(w, [...doc.querySelectorAll(".mp-hit")].find((h) => /Fresnes/.test(h.getAttribute("aria-label"))));
  console.log("fresnes:", /Test Détenu/.test(texts(doc.querySelector(".carte-side"))), texts(doc.querySelector(".carte-side")).slice(0, 80));
  // aller à la Cité en métro
  await click(w, [...doc.querySelectorAll(".mp-hit")].find((h) => /Île de la Cité/.test(h.getAttribute("aria-label"))));
  const before = s.min;
  await click(w, findBtn(doc, /Y aller en métro/));
  await sleep(100);
  console.log("at:", s.at, "min", CR.fmtTime(before), "->", CR.fmtTime(s.min));
  const panel = doc.querySelector(".carte-side");
  console.log("still carte:", !!doc.querySelector(".map-canvas"), panel ? /Vous êtes ici/.test(texts(panel)) : "no panel");
  for (const m of [300, 600, 1100, 1300]) { s.min = m; console.log(m, CR.mapPhase(m), CR.mapModel(s, "palais").sparkle); }
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})();
