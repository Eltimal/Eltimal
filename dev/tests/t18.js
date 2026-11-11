// Décors des lieux : chaque lieu a son décor, toutes les ambiances, pluie, saisons, largeurs ; le bandeau suit le lieu
const { boot, sleep, texts, findBtn, click } = require("./harness");
(async () => {
  const { w, CR, doc, errors } = boot();
  await sleep(200);
  const D = CR.dec;
  const names = Object.keys(D.SC);
  let ok = 0; const bad = [];
  for (const name of names) for (const min of [420, 600, 1110, 1380]) for (const rain of [false, true]) for (const W of [195, 480, 700]) {
    try {
      const o = { min, rain, season: ["automne", "hiver", "ete"][ok % 3], nom: ["Le Comptoir des Abbesses", "Carrefour de la Chapelle", "Bijouterie Lemoine"][ok % 3], unread: 3, files: 5, ringing: ok % 2 === 0, voicemail: true };
      const S = D.layout(name, W, o);
      const c = doc.createElement("canvas"); c.width = W; c.height = 80;
      for (const t of [0, 1.3, 40]) D.frame(S, c.getContext("2d"), t, o);
      ok++;
    } catch (e) { bad.push(`${name} ${min} pluie=${rain} L=${W} : ${String(e.stack || e).split("\n").slice(0, 3).join(" | ")}`); }
  }
  console.log("décors:", names.length, "rendus corrects:", ok, "échecs:", bad.length);
  bad.slice(0, 5).forEach((b) => console.log("  ", b));
  // un décor propre à chaque lieu de la carte
  const places = Object.keys(CR.PLACES).filter((id) => id !== "domicile" || true);
  const used = {};
  for (const id of places) { const sc = D.sceneFor({ at: id }); (used[sc] = used[sc] || []).push(id); if (!D.SC[sc]) console.log("décor manquant pour", id, sc); }
  const shared = Object.entries(used).filter(([, v]) => v.length > 1);
  console.log("lieux:", places.length, "décors distincts:", Object.keys(used).length, "partagés:", shared.length ? JSON.stringify(shared) : "aucun");
  // le bandeau suit le lieu dans l'interface
  await click(w, findBtn(doc, "Nouvelle partie"));
  await click(w, findBtn(doc, /^Carrière/) || findBtn(doc, /^Tutoriel/));
  await sleep(200);
  const s = CR.store.s;
  const seen = [];
  for (const id of places) { s.at = id; CR.store.bump(); await sleep(30); const cv = doc.querySelector(".stage canvas.pano"); seen.push(cv ? cv.getAttribute("aria-label").slice(0, 28) : "AUCUN"); }
  console.log("bandeau par lieu:", new Set(seen).size, "libellés distincts sur", places.length, seen.includes("AUCUN") ? "(canvas manquant)" : "");
  CR.addTempPlace(s, "bar", { nom: "Le Comptoir des Abbesses", sous: "18e", x: 0.47, y: 0.2 });
  s.at = "bar"; CR.store.bump(); await sleep(30);
  console.log("lieu des faits:", D.sceneFor(s), "pluie sur 60 jours:", Array.from({ length: 60 }, (_, d) => D.rainy({ seed: s.seed, day: d })).filter(Boolean).length);
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})();
