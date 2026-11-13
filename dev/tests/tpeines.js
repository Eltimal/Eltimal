// Refonte, lot 4 : la peine choisie et motivée, calée sur « Les condamnations en 2022 » (ministère de la Justice).
// node tests/tpeines.js   « échecs: 0 » attendu.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; console.log("  ✗ " + k + (d ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G2 = CR.GEN2, B = G2.B, P = CR.PROC;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere" });
  const nat = {}; let n = 0, fermeTot = 0, fermeN = 0, le6 = 0;
  const classe = (pn) => pn.tig ? "substitution" : pn.joursAmende ? "substitution" : pn.ferme > 0 && pn.sursis > 0 ? "partiel" : pn.ferme > 0 ? "ferme" : pn.sursis > 0 ? (pn.sursisType === "probatoire" ? "probatoire" : "simple") : pn.amende ? "amende" : "autre";
  for (let i = 0; i < 1200; i++) for (const genre of ["ci", "copj", "gav", "op"]) {
    const t = G2.tirer("tpe:" + i, genre, {}); if (!t || t.genre === "info") continue;
    const id = "g_tpe" + i + genre; s.generated = [{ id, t }];
    let x; try { x = B.ctx({ gen: 2, id, kind: genre, seed: "tpe:" + i, day: 0, t }); } catch (e) { continue; }
    const q = x.q, cs = { id, proc: { annules: [] }, vars: {}, notes: [], flags: {}, actors: {} };
    const r = { encourue: { prison: q.prison, amende: q.amende }, requis: B.requis(x) };
    const ctx = { juge: { severite: 0.3 + (i % 5) * 0.1 }, personnalite: i % 4, detenu: genre === "ci", sansDomicile: !t.A.heberg };
    const pn = P.calculerPeine({ s, cs }, r, ctx), pn2 = P.calculerPeine({ s, cs }, r, ctx);
    ok(JSON.stringify(pn) === JSON.stringify(pn2), "peine non déterministe");
    ok(pn.choisie, "la peine n'est pas choisie par le nouveau calcul");
    ok(pn.ferme + pn.sursis <= q.prison || !q.prison, "peine au-dessus du maximum encouru", `${pn.ferme}+${pn.sursis} > ${q.prison}`);
    ok(!(pn.ferme > 0 && pn.ferme <= 1), "ferme d'un mois ou moins");
    ok(!pn.amende || pn.amende <= q.amende, "amende au-dessus du maximum");
    ok(!pn.joursAmende || (pn.joursAmende.n <= 360 && pn.joursAmende.taux <= 1000), "jours-amende hors des bornes de l'article 131-5");
    ok(!pn.tig || (pn.tig >= 20 && pn.tig <= 400), "TIG hors des bornes de l'article 131-8");
    ok(/art\. 132-1/.test(pn.regles[0]), "pas de motivation de la peine (art. 132-1)");
    if (pn.ferme > 0) ok(pn.regles.some((x) => /132-19/.test(x)), "emprisonnement ferme non motivé (art. 132-19)");
    ok(pn.texte && !/undefined|NaN|Dispense de peine/.test(pn.texte), "texte de la peine", pn.texte);
    const c = classe(pn); nat[c] = (nat[c] || 0) + 1; n++;
    if (pn.ferme > 0) { fermeTot += pn.ferme; fermeN++; if (pn.ferme <= 6) le6++; }
  }
  const part = (k) => (nat[k] || 0) / n;
  // l'étalon national (délits, 2022) et la tolérance : la répartition, pas l'affaire
  const ETALON = { amende: 0.32, simple: 0.16, probatoire: 0.11, ferme: 0.16, partiel: 0.07, substitution: 0.15 };
  for (const [k, v] of Object.entries(ETALON)) ok(Math.abs(part(k) - v) <= 0.06, `répartition : ${k} ${Math.round(part(k) * 100)} % contre ${Math.round(v * 100)} % publiés`);
  const moy = fermeTot / fermeN;
  ok(moy >= 6.5 && moy <= 11, "partie ferme moyenne hors de l'étalon (9,6 mois)", moy.toFixed(1));
  ok(le6 / fermeN >= 0.4 && le6 / fermeN <= 0.62, "part des fermes de six mois ou moins hors de l'étalon (52 %)", Math.round(le6 / fermeN * 100));
  console.log(`peines — ${n} condamnations · ${Object.entries(nat).map(([k, v]) => k + " " + Math.round(v / n * 100) + " %").join(", ")} · ferme moyen ${moy.toFixed(1)} mois · ≤ 6 mois ${Math.round(le6 / fermeN * 100)} %`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
