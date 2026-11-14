const { boot, sleep } = require("./harness");
(async () => {
  const { CR, w } = boot();
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 1 });
  CR.store.s = s;
  let bad = 0;
  const ouverts = []; for (const g of ["gav", "ci", "copj", "op", "pc", "info", "al"]) for (let i = 0; i < 4; i++) { try { const c = CR.GEN.open(s, g, {}); if (c) ouverts.push(c); } catch (e) { /* genre indisponible */ } } // affaires générées de chaque genre (il n'y a plus d'affaire écrite)
  for (const cs of ouverts) {
    const id = cs.def;
    cs.proc.audience = cs.proc.audience || { day: s.day + 30, juridiction: "tc", convocDay: s.day };
    const keys = new Set([...Object.keys(CR.SHARED_TPL), ...Object.keys(CR.CASES[id].tpls || {})]);
    for (const k of keys) {
      let t; try { t = CR.getTpl(s, cs, k); } catch (e) { console.log("TPL ERR", id, k, e.message); bad++; continue; }
      const inBody = new Set((t.body || []).flat().filter((x) => x && typeof x === "object" && x.s).map((x) => x.s));
      for (const [sid, sl] of Object.entries(t.slots || {})) if (sl.type !== "auto" && !inBody.has(sid)) { console.log("SLOT ABSENT", id, k, sid); bad++; }
    }
  }
  console.log("bad", bad);
  process.exit(0);
})();
