// Refonte, lot 1 ter : la vérification de l'alcoolémie selon le code de la route (relu le 13 novembre 2026).
// node tests/tethylo.js   « échecs: 0 » attendu.
// Résultat notifié avec l'avis du droit au second contrôle (R. 234-4, 2°) ; second contrôle, quand il est demandé, fait
// aussitôt après vérification de l'appareil (L. 234-5), sans faire passer sous le seuil du délit une mesure qui l'atteignait ;
// un délai de plus de 75 minutes entre dépistage et vérification est noté comme un fait (R. 234-4, 1°) ; déterminisme.
const { boot } = require("./harness");
(async () => {
  let echecs = 0; const ok = (c, k, d) => { if (!c) { echecs++; if (echecs < 25) console.log("  ✗ " + k + (d != null ? " — " + String(d).slice(0, 300) : "")); } };
  const { CR, errors } = boot();
  const G = CR.GEN2, SIM = CR.SIM;
  const s = CR.newGame({ prenom: "A", nom: "B", mode: "carriere", seed: 5 }); CR.store.s = s;
  const rendu = (PZ, k, t) => PZ.docs[k]({ s, cs: { vars: {}, proc: { faitsDay: t.d.faits }, enq: {} }, def: {}, c: t.A, api: {} });
  const txt = (r) => [].concat(...(r.paras || [])).map((x) => (typeof x === "string" ? x : x && x.t)).join(" | ");
  const H = (x) => { const m = /(\d+)\s*h\s*(\d+)/.exec(x); return m ? +m[1] * 60 + +m[2] : null; };
  let n = 0, seconds = 0, delais = 0, refus = 0;
  for (let i = 0; i < 20000 && n < 60; i++) {
    const genre = ["ci", "gav", "copj", "op"][i % 4];
    let t; try { t = G.tirer("tet" + i, genre, { day: 12 + (i % 9), inf: "alcool" }); } catch (e) { continue; }
    if (!t || !SIM.supporte(t)) continue;
    let PZ; try { PZ = G.pieces(t, G.recit(t)); } catch (e) { continue; }
    if (!PZ.docs.pv_alcoolemie) continue;
    n++;
    const tag = `${genre} ${t.sig.slice(0, 30)}`;
    const r = rendu(PZ, "pv_alcoolemie", t), T = txt(r);
    ok(!/undefined|NaN|\$\{/.test(T), `${tag} : texte incomplet`, T.slice(0, 300));
    ok(T === txt(rendu(G.pieces(t, G.recit(t)), "pv_alcoolemie", t)), `${tag} : pièce non déterministe`);
    if (t.f.refus) { refus++; continue; }
    ok(/peut demander un second contrôle \(art\. R\. 234-4/.test(T), `${tag} : pas d'avis du droit au second contrôle`, T.slice(0, 400));
    const sec = /demande un second contrôle\./.test(T);
    ok(sec !== /ne pas demander de second contrôle/.test(T), `${tag} : second contrôle ni demandé ni refusé`);
    if (sec) {
      seconds++;
      ok(/vérification du bon fonctionnement de l'appareil/.test(T) && /L\. 234-5/.test(T), `${tag} : second contrôle sans vérification de l'appareil`, T.slice(-400));
      const m = /Seconde mesure : (\d+),(\d+)/.exec(T);
      const v2 = m ? +(m[1] + "." + m[2]) : null;
      ok(v2 != null && (t.f.taux < 0.4 || v2 >= 0.4), `${tag} : la seconde mesure fait passer sous le seuil du délit`, `${t.f.taux} → ${v2}`);
    }
    const dep = H((/À (\d+\s*h\s*\d+), sur les lieux, dépistage/.exec(T) || [])[1] || ""), mes = H((/À (\d+\s*h\s*\d+), au service/.exec(T) || [])[1] || "");
    if (dep != null && mes != null) {
      const d = ((mes - dep) % 1440 + 1440) % 1440;
      const marque = !!(PZ.faits || {}).G_delai_ethylo;
      ok(marque === d > 75, `${tag} : délai de ${d} min, fait ${marque ? "noté" : "absent"}`);
      if (marque) delais++;
    }
  }
  ok(n >= 40, "trop peu de vérifications d'alcoolémie", n);
  ok(seconds > 0, "aucun second contrôle demandé");
  if (errors.length) { echecs++; console.log("  ✗ erreurs : " + errors.slice(0, 2).join(" | ")); }
  console.log(`alcoolémies : ${n} · seconds contrôles ${seconds} · délais longs ${delais} · refus ${refus}`);
  console.log("échecs:", echecs);
  process.exit(echecs ? 1 : 0);
})();
