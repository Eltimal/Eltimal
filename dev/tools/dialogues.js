// Affiche les dialogues d'affaires générées : entretiens, appels, parloir, garde à vue, répliques d'audience.
// Usage : node tools/dialogues.js <genre|all> [nombre] [graine] [filtre infraction]
const { boot, sleep } = require("../tests/harness");
const D = require("../tests/dial");
(async () => {
  const env = boot();
  const { CR } = env;
  await sleep(150);
  const genre = process.argv[2] || "pc";
  const n = +(process.argv[3] || 2);
  const seed = +(process.argv[4] || 7);
  const filtre = process.argv[5] || null;
  const s = (CR.store.s = CR.newGame({ prenom: "Camille", nom: "Durand", mode: "carriere", seed }));
  const genres = genre === "all" ? ["gav", "ci", "al", "op", "copj", "pc", "info"] : [genre];
  for (const g of genres) {
    let shown = 0;
    for (let i = 0; i < 400 && shown < n; i++) {
      s.day = 20 + i; s.min = 10 * 60;
      const cs = CR.GEN.open(s, g, { min: s.min, night: false });
      const p = s.generated.find((x) => x.id === cs.id);
      if (filtre && !new RegExp(filtre).test(p.t.inf + " " + (p.t.f.ctx || "") + " " + (p.t.camp || ""))) continue;
      shown++;
      const d = D.collect(CR, s, cs, p);
      console.log("\n==========", cs.id, g, p.t.inf, p.t.f.sc || p.t.f.ctx || "", "| client", D.who(p.t[p.t.client] || p.t.A), "| auteur", D.who(p.t.A), "| victime", D.who(p.t.V), p.t.co ? "| coauteurs" : "");
      for (const c of d.calls) {
        console.log(`\n--- ${c.key} (${c.label || ""})`);
        for (const l of c.lines) console.log(l);
      }
      if (process.env.AUD) for (const l of d.audience) console.log("AUD", l.who || "-", ":", l.t);
    }
  }
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
