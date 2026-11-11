// Réseau réel : itinéraires entre les lieux du jeu, cohérence du graphe
const { boot, sleep } = require("./harness");
(async () => {
  const { CR, errors } = boot();
  await sleep(100);
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }), M = CR.METRO;
  const sans = Object.values(M.ST).filter((x) => x.lon == null).map((x) => x.name);
  console.log("lignes:", M.LINES.length, "stations:", Object.keys(M.ST).length, "sans position:", sans.length ? sans.join(", ") : "aucune");
  for (const [a, b] of [["cabinet", "palais"], ["cabinet", "cite"], ["cabinet", "commissariat"], ["cite", "sante"], ["cabinet", "spip"], ["cabinet", "tj_bobigny"], ["cabinet", "tj_creteil"], ["cabinet", "tj_nanterre"], ["cabinet", "fresnes"], ["cabinet", "fleury"], ["cabinet", "melun"], ["cabinet", "poissy"], ["cabinet", "gendarmerie"], ["cabinet", "ca_versailles"], ["cabinet", "villepinte"], ["cite", "ordre"], ["cabinet", "domicile"]]) {
    const it = M.itin(s, a, b); console.log(`${a} → ${b} : ${CR.travelTime(s, a, b, "metro")} min (taxi ${CR.travelTime(s, a, b, "taxi")}) | ` + M.etapes(it).map((e) => e.t + (e.d ? " [" + e.d + "]" : "") + " " + e.min).join(" ; "));
  }
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})();
