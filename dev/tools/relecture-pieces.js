// Relecture : affiche le texte des pièces d'affaires générées. node tools/relecture-pieces.js <genre> [n] [graine] [max par pièce]
const { boot, sleep } = require("../tests/harness");
(async () => {
  const { CR } = boot(); await sleep(150);
  const genre = process.argv[2] || "gav", n = +(process.argv[3] || 2), seed = +(process.argv[4] || 31), MAX = +(process.argv[5] || 1600);
  const s = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed }));
  const flat = (x, out, d = 0) => { if (d > 8 || x == null) return out; if (typeof x === "string") { if (x.trim()) out.push(x.trim()); } else if (Array.isArray(x)) x.forEach((y) => flat(y, out, d + 1)); else if (typeof x === "object") for (const k of Object.keys(x)) { if (/^(id|key|cls|kind|type|tone|f|flag|ref|art|cote|w|h)$/.test(k)) continue; flat(x[k], out, d + 1); } return out; };
  for (let i = 0; i < n; i++) {
    s.day = 20 + i * 3; s.min = 600;
    const cs = CR.GEN.open(s, genre, { min: s.min, night: false });
    const def = CR.caseDef(cs), p = s.generated.find((x) => x.id === cs.id), t = p.t, api = CR.api(s, cs), v = CR.caseVars(s, cs);
    const W = (x) => x ? `${x.prenom || ""} ${x.nom || ""} (${x.sexe || x.g || "?"}, ${x.age || "?"} ans, ${x.metier || x.job || "?"})` : "-";
    console.log(`\n\n################ ${cs.id} · ${genre} · ${t.inf} · ${t.f.sc || t.f.ctx || ""} · ${def.title} · voie ${t.voie} · attitude ${t.stance}\n   auteur ${W(t.A)} | victime ${W(t.V)} | faits jour ${t.f.day != null ? CR.fmtDate(t.f.day, "long") : "?"} | aujourd'hui ${CR.fmtDate(s.day, "long")}`);
    for (const [k, d0] of Object.entries(def.docs || {})) {
      let d = d0; try { if (typeof d === "function") d = d(api); } catch (e) { console.log("  [" + k + "] ERREUR " + e.message); continue; }
      const txt = flat(d, []).map((x) => CR.fmt(x, v)).join(" ¶ ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").replace(/( ¶ (p|ligne|titre|mention|q|r|decl|pv|forme|signé))+(?= ¶|$)/g, "").replace(/^.*?rapportons les opérations suivantes : ¶ /, "").replace(/PRÉFECTURE DE POLICE[^¶]*¶ /g, "");
      if (/^(declaration_droits|avis_famille|avis_avocat)$/.test(k)) continue;
      console.log(`\n--- [${k}] ${(def.docTitles || {})[k] || ""} (${txt.length} car.)\n${txt.slice(0, MAX)}${txt.length > MAX ? " […]" : ""}`);
    }
  }
  process.exit(0);
})();
