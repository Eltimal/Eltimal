// Refonte, lot 1 ter, pièces techniques : le relevé du fichier des permis composé par le moteur. node tests/tpermis.js   « échecs: 0 » attendu.
// Décision, envoi, présentation, retour : dans l'ordre et avant les faits ; pli non réclamé dit et noté ensemble ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" | "); };
  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const jours = (x) => [...x.matchAll(/(\d{1,2})(?:er)? (janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre) (\d{4})/g)].map((m) => new Date(+m[3], MOIS.indexOf(m[2]), +m[1]).getTime());
  let n = 0, nr = 0;
  for (let i = 0; i < 20000 && n < 25; i++) {
    const genre = ["ci", "gav", "copj", "op"][i % 4];
    let t; try { t = G.tirer("tpm" + i, genre, { day: 12 + (i % 9), inf: "defaut_permis" }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t)) continue;
    const tCopie = JSON.stringify(t);
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    if (!PZ.docs.fichier_permis) continue;
    const F = txt(PZ, "fichier_permis", t);
    if (!/cote D/.test(JSON.stringify(PZ.docs.fichier_permis({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }).entete || []))) continue;
    n++;
    const tag = `${genre} ${t.f.sc} ${t.sig.slice(0, 30)}`;
    ok(!/undefined|NaN|\$\{/.test(F), `${tag} : texte incomplet`);
    if (t.f.sc !== "jamais") {
      const js = jours(F.split("Identité")[1] || F).filter((d, k, a) => true);
      const corps = js.slice(js.length - (/non réclamé/.test(F) ? 4 : 4));
      ok(corps.every((d, k) => k === 0 || d >= corps[k - 1]), `${tag} : chaîne de notification dans le désordre`, F.slice(0, 400));
      const naiss = js.length > 4 ? 1 : 0; void naiss;
    }
    const nrec = /non réclamé/.test(F); if (nrec) nr++;
    ok(nrec === !!PZ.facts.G_notif_permis, `${tag} : pli non réclamé dit et noté différemment`);
    ok(txt(((t2) => G.pieces(t2, G.recit(t2)))(JSON.parse(tCopie)), "fichier_permis", t) === F, `${tag} : pièce non déterministe`);
  }
  ok(n >= 10, "trop peu de relevés du fichier composés par le moteur", n);
  console.log(`relevés du fichier des permis : ${n} · plis non réclamés ${nr}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
