// Refonte, C2 : l'économie du cabinet sur un an. node tests/tecono.js   « échecs: 0 » attendu.
// Sans activité, le cabinet fait faillite en quelques mois ; avec onze missions de garde à vue par mois (le point mort du
// jeu, charges et prélèvement personnel compris), il tient l'année ; le vivier propose assez de dossiers pour l'atteindre.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const annee = (n, seed) => {
    const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed }); s.settings.saisie = "liste"; s.settings.coach = false;
    let m0 = null, mois = 0;
    for (let i = 0; i < 365 && !s.gameOver; i++) {
      if (s.night) CR.backToBed(s);
      const m = CR.fmtDate(s.day, "long").split(" ").slice(-2).join(" ");
      if (m !== m0) { m0 = m; mois++; for (let k = 0; k < n; k++) CR.ajMission(s, null, "gav", "simulée"); }
      while (s.min < 18 * 60) CR.spend(s, 30, "admin");
      CR.endDay(s);
    }
    return { s, mois };
  };
  const a = annee(0, 5);
  ok(a.s.gameOver && a.s.gameOver.reason === "faillite" && a.s.gameOver.day < 160, "un cabinet sans activité ne fait pas faillite", JSON.stringify(a.s.gameOver));
  const b = annee(11, 5);
  ok(!b.s.gameOver && b.s.cash >= 0, "onze gardes à vue par mois ne suffisent pas à tenir l'année", Math.round(b.s.cash));
  ok(Math.abs(b.s.stats.aj - 11 * 359 * (b.mois - 1)) < 11 * 359 * 2, "les missions payées par la CARPA ne correspondent pas aux attestations", b.s.stats.aj);
  const offerts = Object.keys(b.s.cases).length / 12;
  ok(offerts >= 3, "le vivier propose trop peu de dossiers pour vivre", offerts.toFixed(1));
  console.log(`économie — sans activité : faillite au jour ${a.s.gameOver && a.s.gameOver.day} · 11 GAV/mois : ${Math.round(b.s.cash)} € en fin d'année, AJ ${b.s.stats.aj} € · dossiers proposés : ${offerts.toFixed(1)} par mois`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
