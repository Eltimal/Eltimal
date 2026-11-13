// Garde-fou : générer deux fois la même affaire (sans copie, comme à la relecture d'une sauvegarde) donne le même dossier,
// mot pour mot. node tests/tidempotence.js   « échecs: 0 » attendu.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 2 }); CR.store.s = s;
  const tout = (PZ, t) => Object.keys(PZ.docs).sort().map((k) => { let r; try { r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {}, docs: [] }, def: {}, c: t.A, api: {} }); } catch (e) { return k + ":ERR"; } return k + ":" + JSON.stringify(r && (r.paras || r)); }).join("\n");
  let n = 0;
  for (let i = 0; i < 4000 && n < 160; i++) {
    const genre = ["ci", "gav", "copj", "op", "info"][i % 5];
    let t; try { t = G.tirer("tid" + i, genre, { day: 12 + (i % 9) }); } catch (e) { continue; }
    if (!t) continue;
    let a, b;
    try { a = tout(genre === "info" ? G.piecesCrim(t, G.recit(t)) : G.pieces(t, G.recit(t)), t); b = tout(genre === "info" ? G.piecesCrim(t, G.recit(t)) : G.pieces(t, G.recit(t)), t); } catch (e) { continue; }
    n++;
    if (a !== b) { const la = a.split("\n"), lb = b.split("\n"); const k = la.findIndex((x, j) => x !== lb[j]); ok(false, `${genre} ${t.inf} ${t.sig.slice(0, 40)} : deux générations diffèrent (${(la[k] || "").split(":")[0]})`, (la[k] || "").slice(0, 160)); }
  }
  ok(n >= 120, "trop peu d'affaires", n);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log(`affaires générées deux fois : ${n}`);
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
