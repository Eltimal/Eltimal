// Refonte, lot 1 ter : l'autopsie de la victime d'un homicide routier composée par le moteur. node tests/tautopsie.js
// « échecs: 0 » attendu. Datée après le décès (le lendemain ou le surlendemain) ; lésions accordées au scénario ;
// toxicologie de la victime notée comme fait quand elle est positive ; en comparution immédiate, si la garde à vue se clôt
// avant, seulement les premières indications du légiste ; textes complets ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 6 }); CR.store.s = s;
  const rendu = (PZ, k, t) => PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} });
  const txt = (r) => [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" | ");
  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const jour = (x) => { const m = /(\d{1,2})(?:er)? (janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre) (\d{4})/.exec(x); return m ? Date.UTC(+m[3], MOIS.indexOf(m[2]), +m[1]) / 864e5 : null; };
  let n = 0, rapports = 0, provisoires = 0, alc = 0;
  const LES = { pieton: /pare-chocs/, cycliste: /bassin/, scooter: /aorte|costales/ };
  for (let i = 0; i < 20000 && n < 40; i++) {
    const genre = ["ci", "gav", "copj", "op"][i % 4];
    let t; try { t = G.tirer("tau" + i, genre, { day: 12 + (i % 9), inf: "homicide_routier" }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t)) continue;
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    if (!PZ.docs.rapport_autopsie) continue;
    n++;
    const tag = `${genre} ${t.f.sc} ${t.sig.slice(0, 30)}`;
    const T = txt(rendu(PZ, "rapport_autopsie", t));
    ok(!/undefined|NaN|\$\{/.test(T), `${tag} : texte incomplet`, T.slice(0, 300));
    ok(T === txt(rendu(G.pieces(t, G.recit(t)), "rapport_autopsie", t)), `${tag} : pièce non déterministe`);
    if (/pratiquée le/.test(T)) {
      rapports++;
      const [jA, jD] = [jour((/pratiquée le ([^;]+)/.exec(T) || [])[1] || ""), jour((/décès constaté le ([^|]+)/.exec(T) || [])[1] || "")];
      ok(jA != null && jD != null && jA - jD >= 1 && jA - jD <= 3, `${tag} : autopsie mal datée`, `${jA} / ${jD}`);
      if (LES[t.f.sc]) ok(LES[t.f.sc].test(T), `${tag} : lésions sans rapport avec le scénario`, T.slice(0, 300));
      const pos = /alcoolémie de/.test(T);
      ok(pos === !!(PZ.facts || {}).G_victime_alcool, `${tag} : toxicologie de la victime et fait`);
      if (pos) alc++;
    } else { provisoires++; ok(["ci", "gav"].includes(genre) && /médecin légiste/.test(T), `${tag} : indications provisoires hors comparution immédiate`, T.slice(0, 200)); }
  }
  ok(n >= 30, "trop peu d'homicides routiers", n);
  ok(rapports > 0 && provisoires > 0, "un cas d'autopsie n'est jamais tiré", JSON.stringify({ rapports, provisoires }));
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log(`homicides routiers : ${n} · rapports ${rapports} (victime alcoolisée ${alc}) · premières indications ${provisoires}`);
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
