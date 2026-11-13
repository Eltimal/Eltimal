// Refonte, lot 1 ter, pièces techniques : l'exploitation des images composée par le moteur. node tests/timages.js   « échecs: 0 » attendu.
// Dérive de l'horloge écrite, notée comme fait à partir de trois minutes ; heure de l'image = heure des faits + dérive ;
// doute sur l'identification gardé ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" "); };
  let n = 0, derives = 0, doutes = 0;
  for (let i = 0; i < 12000 && n < 40; i++) {
    const genre = ["ci", "gav", "copj", "op", "pc"][i % 5];
    let t; try { t = G.tirer("tim" + i, genre, { day: 12 + (i % 9) }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t) || !(t.preuves || []).length && false) continue;
    const tCopie = JSON.stringify(t);
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    if (!PZ.docs.pv_video) continue;
    const V = txt(PZ, "pv_video", t);
    if (!/horloge de l'enregistreur/.test(V)) continue; // arrachage ou pilote : autre moteur
    n++;
    const tag = `${genre} ${t.inf} ${t.sig.slice(0, 30)}`;
    ok(!/undefined|NaN|\$\{/.test(V), `${tag} : texte incomplet`);
    const d = /(avance|retarde) de (\d+) minute/.exec(V), dv = d ? (d[1] === "avance" ? 1 : -1) * +d[2] : 0;
    if (dv) derives++;
    ok((Math.abs(dv) >= 3) === !!PZ.facts.G_horodatage, `${tag} : dérive écrite et notée différemment`, dv);
    if (/ne permet pas de distinguer les traits/.test(V)) { doutes++; ok(PZ.facts.G_doute_ident, `${tag} : doute sur l'identification non noté`); }
    ok(txt(((t2) => G.pieces(t2, G.recit(t2)))(JSON.parse(tCopie)), "pv_video", t) === V, `${tag} : pièce non déterministe`);
  }
  ok(n >= 20, "trop peu d'exploitations d'images composées par le moteur", n);
  ok(derives > 0 && derives < n, "dérive de l'horloge : jamais, ou toujours", `${derives}/${n}`);
  console.log(`exploitations d'images : ${n} · horloges qui dérivent ${derives} · doutes sur l'identification ${doutes}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
