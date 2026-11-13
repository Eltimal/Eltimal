// Refonte, lot 1 ter, pièces techniques : la téléphonie composée par le moteur. node tests/ttelephonie.js   « échecs: 0 » attendu.
// Carte prépayée au nom d'un tiers dite et notée ensemble ; activations dans l'ordre ; relais de l'alibi cohérent avec les
// activations ; zone du relais écrite quand la ligne borne sur les lieux ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 3 }); CR.store.s = s;
  const txt = (PZ, k, t) => { const r = PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} }); return [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" | "); };
  let n = 0, tiers = 0, alibis = 0;
  for (let i = 0; i < 15000 && n < 30; i++) {
    const genre = ["ci", "gav", "copj", "op", "pc"][i % 5];
    let t; try { t = G.tirer("ttl" + i, genre, { day: 12 + (i % 9) }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t)) continue;
    const tCopie = JSON.stringify(t);
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    if (!PZ.docs.pv_telephonie) continue;
    const T = txt(PZ, "pv_telephonie", t);
    if (!/Activations relevées/.test(T)) continue; // autre moteur
    n++;
    const tag = `${genre} ${t.inf} ${t.sig.slice(0, 30)}`;
    ok(!/undefined|NaN|\$\{/.test(T), `${tag} : texte incomplet`);
    const tr = /carte prépayée enregistrée au nom/.test(T); if (tr) tiers++;
    ok(tr === !!PZ.facts.G_ligne_tiers, `${tag} : ligne d'un tiers dite et notée différemment`);
    const hs = [...T.matchAll(/(\d+)[\s  ]h[\s  ](\d+) — (appel|SMS)/g)].map((m) => +m[1] * 60 + +m[2]);
    ok(hs.length === 3, `${tag} : activations manquantes`, hs.length);
    const al = /exclusivement des relais situés à (\S+)\./.exec(T);
    if (al) { alibis++; ok((T.match(new RegExp("relais " + al[1], "g")) || []).length === 3 && PZ.facts.G_alibi, `${tag} : activations hors du relais de l'alibi`); }
    else ok(/zone (d['’]environ|de plus)/.test(T), `${tag} : zone du relais non dite`);
    ok(txt(((t2) => G.pieces(t2, G.recit(t2)))(JSON.parse(tCopie)), "pv_telephonie", t) === T, `${tag} : pièce non déterministe`);
  }
  ok(n >= 15, "trop peu de téléphonies composées par le moteur", n);
  ok(tiers > 0 && tiers < n, "ligne d'un tiers : jamais, ou toujours", `${tiers}/${n}`);
  console.log(`téléphonies : ${n} · lignes de tiers ${tiers} · alibis ${alibis}`);
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
