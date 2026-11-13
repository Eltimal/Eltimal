// Refonte, lot 1 ter, pièces techniques : les relevés bancaires composés par le moteur. node tests/treleve.js   « échecs: 0 » attendu.
// La somme des mouvements fait le total annoncé ; mouvements datés dans l'ordre, avant les faits ; prêt d'un proche dit et
// noté ensemble ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" | "); };
  const eur = (x) => +x.replace(/[\s  .]/g, "").replace(",", ".");
  let n = 0, prets = 0;
  for (let i = 0; i < 20000 && n < 30; i++) {
    const genre = ["ci", "gav", "copj", "op", "pc"][i % 5];
    let t; try { t = G.tirer("trv" + i, genre, { day: 12 + (i % 9) }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t)) continue;
    const tCopie = JSON.stringify(t);
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    if (!PZ.docs.releve) continue;
    const R = txt(PZ, "releve", t);
    if (!/Compte courant n°/.test(R)) continue;
    n++;
    const tag = `${genre} ${t.inf} ${t.sig.slice(0, 30)}`;
    ok(!/undefined|NaN|\$\{/.test(R), `${tag} : texte incomplet`);
    const lignes = [...R.matchAll(/: \+ ([\d\s  .,]+) ?€/g)].map((m) => eur(m[1]));
    const tot = eur((/au total sur la période/.test(R) && /Mouvements sans rapport avec les revenus déclarés : ([\d\s  .,]+) ?€/.exec(R) || [])[1] || "NaN");
    ok(lignes.length >= 4 && Math.abs(lignes.reduce((a, x) => a + x, 0) - tot) < 1, `${tag} : la somme des mouvements ne fait pas le total`, `${lignes} = ${tot}`);
    const p = /libellé « prêt », émis par un proche/.test(R); if (p) prets++;
    ok(p === !!PZ.facts.G_pret, `${tag} : prêt dit et noté différemment`);
    ok(txt(((t2) => G.pieces(t2, G.recit(t2)))(JSON.parse(tCopie)), "releve", t) === R, `${tag} : pièce non déterministe`);
  }
  ok(n >= 12, "trop peu de relevés composés par le moteur", n);
  ok(prets > 0 && prets < n, "prêt d'un proche : jamais, ou toujours", `${prets}/${n}`);
  console.log(`relevés : ${n} · prêts d'un proche ${prets}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
