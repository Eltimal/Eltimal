// Refonte, lot 1 ter : les violences conjugales au niveau de l'arrachage. node tests/tconjugal.js   « échecs: 0 » attendu.
// Constatations et recherches au dossier ; main courante dite par la victime et absente du fichier = fait du dossier ;
// refus de plainte dit et noté ensemble ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" | "); };
  let n = 0, refus = 0, absentes = 0;
  for (let i = 0; i < 15000 && n < 30; i++) {
    const genre = ["ci", "gav", "copj"][i % 3];
    let t; try { t = G.tirer("tcj" + i, genre, { day: 12 + (i % 9), inf: "violences_conj" }); } catch (e) { continue; }
    if (!t || !/^violences_conj/.test(t.inf) || !SIM.supporte(t) || !t.flagrance || !t.f || ["voiture", "rue"].includes(t.f.sc)) continue;
    const tCopie = JSON.stringify(t);
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    const tag = `${genre} ${t.sig.slice(0, 40)}`;
    if (!PZ.docs.pv_recherches) { ok(false, `${tag} : pas de constatations et recherches`); continue; }
    n++;
    const R = txt(PZ, "pv_recherches", t), V = PZ.docs.pv_victime ? txt(PZ, "pv_victime", t) : "";
    ok(!/undefined|NaN|\$\{/.test(R), `${tag} : texte incomplet`);
    const abs = /aucune intervention ni main courante antérieure/.test(R); if (abs) absentes++;
    ok(abs === !!PZ.facts.G_mc_absente, `${tag} : main courante absente dite et notée différemment`);
    const rf = /Non\. Je ne veux pas qu'il ait des problèmes/.test(V); if (rf) refus++;
    ok(rf === !!PZ.facts.G_refus_plainte, `${tag} : refus de plainte dit et noté différemment`, V.slice(-200));
    ok(txt(((t2) => G.pieces(t2, G.recit(t2)))(JSON.parse(tCopie)), "pv_recherches", t) === R, `${tag} : pièce non déterministe`);
  }
  ok(n >= 15, "trop peu de violences conjugales tirées", n);
  ok(refus > 0 && absentes > 0, "refus de plainte ou main courante absente jamais tirés", `${refus}/${absentes}/${n}`);
  console.log(`violences conjugales : ${n} · refus de plainte ${refus} · mains courantes absentes du fichier ${absentes}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
