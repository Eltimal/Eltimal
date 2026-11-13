// Refonte, lot 1 ter : le délit de fuite — plaque complète ou partielle. node tests/tfuite.js   « échecs: 0 » attendu.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const tout = (PZ, t) => Object.keys(PZ.docs).map((k) => { try { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" "); } catch (e) { return ""; } }).join("\n");
  let n = 0, part = 0;
  for (let i = 0; i < 20000 && n < 30; i++) {
    const genre = ["ci", "gav", "copj", "op", "pc"][i % 5];
    let t; try { t = G.tirer("tfu" + i, genre, { day: 12 + (i % 9), inf: "delit_fuite" }); } catch (e) { continue; }
    if (!t || t.inf !== "delit_fuite" || !SIM.supporte(t)) continue;
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    n++;
    const T = tout(PZ, t), tag = `${genre} ${t.sig.slice(0, 40)}`;
    const p = !!PZ.facts.G_plaque_partielle; if (p) part++;
    // une fois le véhicule identifié, la convocation et la prévention le désignent par sa plaque : c'est normal
    if (p) ok(!T.split("\n").filter((x) => !/Pour avoir|convocation|Convocation/.test(x)).some((x) => x.includes(t.f.plaque)), `${tag} : la plaque complète apparaît dans l'enquête alors que le témoin n'en a qu'une partie`);
    if (p) ok(/immatriculation partielle|une partie de la plaque/.test(T), `${tag} : la plaque partielle n'est dite nulle part`);
  }
  ok(n >= 15, "trop peu de délits de fuite tirés", n);
  ok(part > 0 && part < n, "plaque partielle : jamais, ou toujours", `${part}/${n}`);
  console.log(`délits de fuite : ${n} · plaques partielles ${part}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
