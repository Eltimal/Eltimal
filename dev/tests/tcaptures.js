// Refonte, lot 1 ter, pièces techniques : les captures de messages composées par le moteur. node tests/tcaptures.js   « échecs: 0 » attendu.
// Messages datés dans l'ordre, au plus tard le jour des faits ; numéro inconnu et conversation partielle dits et notés
// ensemble ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" | "); };
  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  let n = 0, autres = 0, partielles = 0;
  for (let i = 0; i < 20000 && n < 30; i++) {
    const genre = ["ci", "gav", "copj", "op", "pc"][i % 5];
    let t; try { t = G.tirer("tcp" + i, genre, { day: 12 + (i % 9) }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t)) continue;
    const tCopie = JSON.stringify(t);
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    if (!PZ.docs.captures) continue;
    const C = txt(PZ, "captures", t);
    if (!/Expéditeur : le numéro/.test(C)) continue;
    n++;
    const tag = `${genre} ${t.inf} ${t.sig.slice(0, 30)}`;
    ok(!/undefined|NaN|\$\{/.test(C), `${tag} : texte incomplet`);
    const a = /n'est pas celui que/.test(C), p = /supprimé ses propres réponses/.test(C); if (a) autres++; if (p) partielles++;
    ok(a === !!PZ.facts.G_numero_autre && p === !!PZ.facts.G_captures_partielles, `${tag} : numéro ou conversation dits et notés différemment`);
    const dates = [...C.matchAll(/(\d{1,2})(?:er)? (janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre) (\d{4}), (\d+)[\s  ]h[\s  ](\d+) — /g)].map((m) => new Date(+m[3], MOIS.indexOf(m[2]), +m[1]).getTime() / 864e5 * 1440 + +m[4] * 60 + +m[5]);
    ok(dates.every((d, k) => k === 0 || d >= dates[k - 1] || Math.floor(d / 1440) > Math.floor(dates[k - 1] / 1440)) && dates.every((d, k) => k === 0 || Math.floor(d / 1440) >= Math.floor(dates[k - 1] / 1440)), `${tag} : messages dans le désordre`, JSON.stringify(dates));
    ok(txt(((t2) => G.pieces(t2, G.recit(t2)))(JSON.parse(tCopie)), "captures", t) === C, `${tag} : pièce non déterministe`);
  }
  ok(n >= 15, "trop peu de captures composées par le moteur", n);
  ok(autres > 0 && partielles > 0, "numéro inconnu ou conversation partielle jamais tirés", `${autres}/${partielles}/${n}`);
  console.log(`captures : ${n} · numéros inconnus ${autres} · conversations partielles ${partielles}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
