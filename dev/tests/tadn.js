// Refonte, lot 1 ter, pièces techniques : le rapport ADN composé par le moteur. node tests/tadn.js   « échecs: 0 » attendu.
// Profil complet, partiel ou mélange dit et noté ensemble ; marqueur G_adn toujours porté ; mise en garde sur la date du
// dépôt toujours écrite ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const rend = (PZ, k, t) => PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} });
  const txt = (r) => [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" | ");
  let n = 0, part = 0, mel = 0;
  for (let i = 0; i < 30000 && n < 25; i++) {
    const genre = ["ci", "gav", "copj", "op", "pc"][i % 5];
    const inf = ["cambriolage", "violences", "vol", undefined][i % 4];
    let t; try { t = G.tirer("tad" + i, genre, { day: 12 + (i % 9), inf }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t)) continue;
    const tCopie = JSON.stringify(t);
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    if (!PZ.docs.rapport_adn) continue;
    const r = rend(PZ, "rapport_adn", t), A = txt(r);
    if (!/marqueurs|Mélange/.test(A)) continue;
    n++;
    const tag = `${genre} ${t.inf} ${t.sig.slice(0, 30)}`;
    ok(!/undefined|NaN|\$\{/.test(A), `${tag} : texte incomplet`);
    ok(JSON.stringify(r.paras).includes('"f":"G_adn"'), `${tag} : marqueur G_adn perdu`);
    ok(/ne renseigne pas, à elle seule, sur la date/.test(A), `${tag} : mise en garde absente`);
    const p = /profil partiel/i.test(A), m = /Mélange d'au moins deux ADN/.test(A); if (p) part++; if (m) mel++;
    ok(p === !!PZ.facts.G_adn_partiel && m === !!PZ.facts.G_adn_melange, `${tag} : qualité du profil dite et notée différemment`);
    ok(txt(rend(((t2) => G.pieces(t2, G.recit(t2)))(JSON.parse(tCopie)), "rapport_adn", t)) === A, `${tag} : pièce non déterministe`);
  }
  ok(n >= 10, "trop peu de rapports ADN composés par le moteur", n);
  console.log(`rapports ADN : ${n} · partiels ${part} · mélanges ${mel}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
