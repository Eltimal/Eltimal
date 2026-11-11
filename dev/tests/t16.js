const { boot, sleep } = require("./harness");
(async () => {
  const env = boot();
  const { CR, errors, w } = env;
  await sleep(100);
  const s = CR.store.s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: +(process.argv[2] || 3) });
  s.cash = 900000;
  for (let d = 1; d < 120; d += 3) { CR.signDuty(s, d, d % 2 ? "gav_jour" : "gav_nuit"); if (CR.isBusinessDay(d)) CR.signDuty(s, d, "ci"); }
  const warn = [];
  w.console.warn = (...a) => warn.push(a.join(" "));
  for (let i = 0; i < 330 && !s.gameOver; i++) { if (s.night) CR.backToBed(s); while (s.min < 18 * 60) CR.spend(s, 30, "admin"); CR.endDay(s); }
  const closed = s.order.map((id) => s.cases[id]).filter((c) => c.status === "closed");
  console.log("jour", s.day, CR.fmtDate(s.day), "cas", s.order.length, "clos", closed.length, "générés", (s.generated || []).length, "gameOver", JSON.stringify(s.gameOver));
  console.log("issues", JSON.stringify(closed.reduce((a, c) => { a[c.outcome.type] = (a[c.outcome.type] || 0) + 1; return a; }, {})));
  console.log("warn", warn.length, warn.slice(0, 5).join("\n"));
  const json = CR.serialize(s); console.log("taille sauvegarde", Math.round(json.length / 1024), "Ko");
  console.log("errors:", errors.length ? errors.slice(0, 5).join("\n---\n") : "none");
  process.exit(0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
