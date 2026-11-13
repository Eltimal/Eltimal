// Refonte, lot 1 ter : le vol chez l'employeur — le relevé des accès. node tests/tvestiaire.js   « échecs: 0 » attendu.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" | "); };
  let n = 0, autres = 0;
  for (let i = 0; i < 30000 && n < 20; i++) {
    const genre = ["copj", "op", "gav", "ci", "pc"][i % 5];
    let t; try { t = G.tirer("tvs" + i, genre, { day: 12 + (i % 9), inf: "vol" }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t) || !t.f || t.f.sc !== "vestiaire") continue;
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    const tag = `${genre} ${t.sig.slice(0, 30)}`;
    if (!PZ.docs.pv_badges) { ok(false, `${tag} : pas de relevé des accès`); continue; }
    n++;
    const B = txt(PZ, "pv_badges", t);
    ok(!/undefined|NaN|\$\{/.test(B), `${tag} : texte incomplet`);
    const nb = (B.match(/badge n°/g) || []).length;
    ok(nb >= 1 && (nb > 1) === !!PZ.facts.G_badges, `${tag} : présences dites et notées différemment`, nb);
    if (nb > 1) autres++;
  }
  ok(n >= 8 && autres > 0, "trop peu de vols chez l'employeur, ou jamais d'autres présents", `${n}/${autres}`);
  console.log(`vols chez l'employeur : ${n} · autres personnes présentes ${autres}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
