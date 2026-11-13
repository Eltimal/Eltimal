// Refonte, lot 6 : le jeu sans jauge en mode libre (énergie, réputations, confiance), les jauges en mode assisté.
const { boot, sleep, findBtn, click, texts } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d ? " — " + String(d).slice(0, 200) : "")); } };
  const { w, doc, CR, errors } = boot();
  await sleep(100);
  await click(w, findBtn(doc, "Nouvelle partie")); await sleep(80); await click(w, findBtn(doc, /^Carrière/)); await sleep(200);
  const s = CR.store.s; s.settings.coach = false;
  const jauges = () => [...doc.querySelectorAll(".hud .meter, .hud [role=meter], .hud progress")].filter((m) => !m.closest("[hidden]")).length;
  for (const [mode, libre] of [["assiste", true], ["liste", false]]) {
    s.settings.saisie = mode; CR.store.bump(); await sleep(80);
    ok(CR.libre(s) === libre, "mode " + mode);
    const hud = doc.querySelector(".hud");
    ok(!!hud, "pas d'en-tête");
    const reps = doc.querySelector(".hud-reps");
    ok(libre ? !reps || reps.hidden : reps && !reps.hidden, `${mode} : réputations de l'en-tête`);
    ok(libre ? jauges() === 0 : jauges() > 0, `${mode} : jauges de l'en-tête`, jauges());
    ok(/Vous êtes|Énergie/.test(texts(hud)), `${mode} : l'état du joueur ne se lit plus`);
  }
  s.settings.saisie = "assiste"; CR.store.bump(); await sleep(60);
  const dits = ["clients", "confreres", "siege", "parquet"].map((k) => CR.repDit(k, s.reps[k]));
  ok(dits.every((x) => x && !/\d/.test(x)), "la réputation se dit sans chiffre", JSON.stringify(dits));
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
